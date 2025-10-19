/**
 * Friends API client hooks and utilities
 * Handles friend requests, acceptances, and friend list management
 */

import { supabase } from "./supabaseClient";
import type { Tables } from "./types";
import { Logger } from "./logger";

export type Friend = Tables<"Friends">;
export type Profile = Tables<"Profiles">;

export interface FriendWithProfile extends Friend {
  requester?: Profile;
  addressee?: Profile;
}

/**
 * Send a friend request by username
 * @param username - The username of the user to send a friend request to
 * @returns The created friend request or throws an error
 */
export async function sendFriendRequest(username: string): Promise<Friend> {
  try {
    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    // Find the addressee by username
    const { data: addressee, error: searchError } = await supabase
      .from("Profiles")
      .select("id")
      .eq("username", username)
      .single();

    if (searchError || !addressee) {
      throw new Error(`User with username "${username}" not found`);
    }

    // Check if user is trying to send request to themselves
    if (addressee.id === user.id) {
      throw new Error("Cannot send friend request to yourself");
    }

    // Check if friendship already exists (in either direction)
    const { data: existingFriendship } = await supabase
      .from("Friends")
      .select("*")
      .or(
        `and(requester_id.eq.${user.id},addressee_id.eq.${addressee.id}),and(requester_id.eq.${addressee.id},addressee_id.eq.${user.id})`,
      )
      .maybeSingle();

    if (existingFriendship) {
      if (existingFriendship.status === "pending") {
        throw new Error("Friend request already pending");
      } else if (existingFriendship.status === "accepted") {
        throw new Error("Already friends with this user");
      } else if (existingFriendship.status === "blocked") {
        throw new Error("Cannot send friend request to this user");
      }
    }

    // Create the friend request
    const { data, error } = await supabase
      .from("Friends")
      .insert({
        requester_id: user.id,
        addressee_id: addressee.id,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      Logger.error("Error sending friend request:", error);
      throw new Error(`Failed to send friend request: ${error.message}`);
    }

    Logger.log("Friend request sent successfully:", data);
    return data;
  } catch (error) {
    Logger.error("Error in sendFriendRequest:", error);
    throw error;
  }
}

/**
 * Accept a friend request
 * @param friendshipId - The ID of the friend request to accept
 */
export async function acceptFriendRequest(
  friendshipId: string,
): Promise<Friend> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    // Update the friendship status to accepted
    const { data, error } = await supabase
      .from("Friends")
      .update({ status: "accepted" })
      .eq("id", friendshipId)
      .eq("addressee_id", user.id) // Only the addressee can accept
      .select()
      .single();

    if (error) {
      Logger.error("Error accepting friend request:", error);
      throw new Error(`Failed to accept friend request: ${error.message}`);
    }

    if (!data) {
      throw new Error("Friend request not found or you are not authorized");
    }

    Logger.log("Friend request accepted successfully:", data);
    return data;
  } catch (error) {
    Logger.error("Error in acceptFriendRequest:", error);
    throw error;
  }
}

/**
 * Decline a friend request
 * @param friendshipId - The ID of the friend request to decline
 */
export async function declineFriendRequest(
  friendshipId: string,
): Promise<void> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    // Update the friendship status to declined
    const { error } = await supabase
      .from("Friends")
      .update({ status: "declined" })
      .eq("id", friendshipId)
      .eq("addressee_id", user.id); // Only the addressee can decline

    if (error) {
      Logger.error("Error declining friend request:", error);
      throw new Error(`Failed to decline friend request: ${error.message}`);
    }

    Logger.log("Friend request declined successfully");
  } catch (error) {
    Logger.error("Error in declineFriendRequest:", error);
    throw error;
  }
}

/**
 * Remove a friend (or cancel a pending request)
 * @param friendshipId - The ID of the friendship to remove
 */
export async function removeFriend(friendshipId: string): Promise<void> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    // Delete the friendship (works for both requester and addressee)
    const { error } = await supabase
      .from("Friends")
      .delete()
      .eq("id", friendshipId)
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

    if (error) {
      Logger.error("Error removing friend:", error);
      throw new Error(`Failed to remove friend: ${error.message}`);
    }

    Logger.log("Friend removed successfully");
  } catch (error) {
    Logger.error("Error in removeFriend:", error);
    throw error;
  }
}

/**
 * Get all friends (accepted friendships) for the current user
 * @returns List of friends with profile information
 */
export async function getFriends(): Promise<FriendWithProfile[]> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    // Get all accepted friendships where user is either requester or addressee
    const { data, error } = await supabase
      .from("Friends")
      .select(
        `
        *,
        requester:requester_id(id, username, name, avatar_url, flag),
        addressee:addressee_id(id, username, name, avatar_url, flag)
      `,
      )
      .eq("status", "accepted")
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
      .order("updated_at", { ascending: false });

    if (error) {
      Logger.error("Error fetching friends:", error);
      throw new Error(`Failed to fetch friends: ${error.message}`);
    }

    return data as FriendWithProfile[];
  } catch (error) {
    Logger.error("Error in getFriends:", error);
    throw error;
  }
}

/**
 * Get pending friend requests (received by current user)
 * @returns List of pending requests with requester profile information
 */
export async function getPendingRequests(): Promise<FriendWithProfile[]> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    // Get all pending requests where current user is the addressee
    const { data, error } = await supabase
      .from("Friends")
      .select(
        `
        *,
        requester:requester_id(id, username, name, avatar_url, flag)
      `,
      )
      .eq("status", "pending")
      .eq("addressee_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      Logger.error("Error fetching pending requests:", error);
      throw new Error(`Failed to fetch pending requests: ${error.message}`);
    }

    return data as FriendWithProfile[];
  } catch (error) {
    Logger.error("Error in getPendingRequests:", error);
    throw error;
  }
}

/**
 * Get sent friend requests (sent by current user)
 * @returns List of sent requests with addressee profile information
 */
export async function getSentRequests(): Promise<FriendWithProfile[]> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    // Get all pending requests where current user is the requester
    const { data, error } = await supabase
      .from("Friends")
      .select(
        `
        *,
        addressee:addressee_id(id, username, name, avatar_url, flag)
      `,
      )
      .eq("status", "pending")
      .eq("requester_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      Logger.error("Error fetching sent requests:", error);
      throw new Error(`Failed to fetch sent requests: ${error.message}`);
    }

    return data as FriendWithProfile[];
  } catch (error) {
    Logger.error("Error in getSentRequests:", error);
    throw error;
  }
}

/**
 * Search for users by username (for sending friend requests)
 * @param searchTerm - The username search term
 * @returns List of matching profiles
 */
export async function searchUsersByUsername(
  searchTerm: string,
): Promise<Profile[]> {
  try {
    if (!searchTerm || searchTerm.trim().length < 2) {
      return [];
    }

    const { data, error } = await supabase
      .from("Profiles")
      .select("id, username, name, avatar_url, flag")
      .ilike("username", `%${searchTerm}%`)
      .limit(10);

    if (error) {
      Logger.error("Error searching users:", error);
      throw new Error(`Failed to search users: ${error.message}`);
    }

    return data as Profile[];
  } catch (error) {
    Logger.error("Error in searchUsersByUsername:", error);
    throw error;
  }
}

/**
 * Subscribe to friends updates for real-time changes
 * @param userId - The user ID to subscribe for
 * @param callback - Callback function to handle updates
 * @returns Unsubscribe function
 */
export function subscribeFriendsUpdates(
  userId: string,
  callback: (payload: any) => void,
): () => void {
  const channel = supabase
    .channel(`friends:${userId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "Friends",
        filter: `requester_id=eq.${userId},addressee_id=eq.${userId}`,
      },
      callback,
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
