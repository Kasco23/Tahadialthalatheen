/**
 * Notifications API client hooks and utilities
 * Handles in-app notifications for friend requests, matches, and other events
 */

import { supabase } from "./supabaseClient";
import type {
  Tables,
  Views,
  NotificationType,
  ParticipantRole,
} from "./types";
import { Logger } from "./logger";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

export type Notification = Tables<"Notifications">;
export type UserInboxItem = Views<"UserInbox">;

/**
 * Get all notifications for the current user
 * @param unreadOnly - If true, only return unread notifications
 * @returns List of notifications with sender information
 */
export async function getNotifications(
  unreadOnly: boolean = false,
): Promise<UserInboxItem[]> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    let query = supabase
      .from("UserInbox")
      .select("*")
      .eq("recipient_id", user.id);

    if (unreadOnly) {
      query = query.eq("is_read", false);
    }

    const { data, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) {
      Logger.error("Error fetching notifications:", error);
      throw new Error(`Failed to fetch notifications: ${error.message}`);
    }

    return data;
  } catch (error) {
    Logger.error("Error in getNotifications:", error);
    throw error;
  }
}

/**
 * Get count of unread notifications
 * @returns Number of unread notifications
 */
export async function getUnreadNotificationCount(): Promise<number> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return 0;
    }

    const { count, error } = await supabase
      .from("Notifications")
      .select("*", { count: "exact", head: true })
      .eq("recipient_id", user.id)
      .eq("is_read", false);

    if (error) {
      Logger.error("Error fetching unread count:", error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    Logger.error("Error in getUnreadNotificationCount:", error);
    return 0;
  }
}

/**
 * Mark a notification as read
 * @param notificationId - The ID of the notification to mark as read
 */
export async function markNotificationAsRead(
  notificationId: string,
): Promise<void> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    const { error } = await supabase
      .from("Notifications")
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq("id", notificationId)
      .eq("recipient_id", user.id);

    if (error) {
      Logger.error("Error marking notification as read:", error);
      throw new Error(`Failed to mark notification as read: ${error.message}`);
    }

    Logger.log("Notification marked as read:", notificationId);
  } catch (error) {
    Logger.error("Error in markNotificationAsRead:", error);
    throw error;
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead(): Promise<void> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    const { error } = await supabase
      .from("Notifications")
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq("recipient_id", user.id)
      .eq("is_read", false);

    if (error) {
      Logger.error("Error marking all notifications as read:", error);
      throw new Error(
        `Failed to mark all notifications as read: ${error.message}`,
      );
    }

    Logger.log("All notifications marked as read");
  } catch (error) {
    Logger.error("Error in markAllNotificationsAsRead:", error);
    throw error;
  }
}

/**
 * Delete a notification
 * @param notificationId - The ID of the notification to delete
 */
export async function deleteNotification(
  notificationId: string,
): Promise<void> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    const { error } = await supabase
      .from("Notifications")
      .delete()
      .eq("id", notificationId)
      .eq("recipient_id", user.id);

    if (error) {
      Logger.error("Error deleting notification:", error);
      throw new Error(`Failed to delete notification: ${error.message}`);
    }

    Logger.log("Notification deleted:", notificationId);
  } catch (error) {
    Logger.error("Error in deleteNotification:", error);
    throw error;
  }
}

/**
 * Delete all read notifications
 */
export async function deleteReadNotifications(): Promise<void> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    const { error } = await supabase
      .from("Notifications")
      .delete()
      .eq("recipient_id", user.id)
      .eq("is_read", true);

    if (error) {
      Logger.error("Error deleting read notifications:", error);
      throw new Error(`Failed to delete read notifications: ${error.message}`);
    }

    Logger.log("Read notifications deleted");
  } catch (error) {
    Logger.error("Error in deleteReadNotifications:", error);
    throw error;
  }
}

/**
 * Create a new notification via Netlify function
 * This bypasses RLS by using the service role on the server side
 * @param recipientId - The user ID who will receive the notification
 * @param senderId - The user ID who triggered the notification (optional)
 * @param type - The type of notification
 * @param title - Notification title
 * @param message - Notification message
 * @param link - Optional link to navigate to when notification is clicked
 * @param metadata - Optional additional data
 */
export async function createNotification(
  recipientId: string,
  senderId: string | null,
  type: NotificationType,
  title: string,
  message: string,
  link: string | null = null,
  metadata: Record<string, unknown> = {},
): Promise<Notification> {
  try {
    // Call the Netlify function to create notification with service role
    const response = await fetch("/api/send-notification", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        recipient_id: recipientId,
        sender_id: senderId,
        type,
        title,
        message,
        link,
        metadata,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || `HTTP error! status: ${response.status}`,
      );
    }

    const result = await response.json();
    Logger.log("Notification created via function:", result);
    return result.notification;
  } catch (error) {
    Logger.error("Error in createNotification:", error);
    throw error;
  }
}

/**
 * Subscribe to notifications updates for real-time changes
 * @param userId - The user ID to subscribe for
 * @param callback - Callback function to handle updates
 * @returns Unsubscribe function
 */
export function subscribeNotificationsUpdates(
  userId: string,
  callback: (payload: RealtimePostgresChangesPayload<Notification>) => void,
): () => void {
  const channel = supabase
    .channel(`notifications:${userId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "Notifications",
        filter: `recipient_id=eq.${userId}`,
      },
      callback,
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Create a session invite notification
 * @param recipientId - The user ID who will receive the invite
 * @param senderId - The user ID who sent the invite
 * @param senderName - The name of the sender
 * @param sessionCode - The session code to join
 * @param sessionId - The session ID
 * @returns The created notification
 */
export async function createSessionInvite(
  recipientId: string,
  senderId: string,
  senderName: string,
  sessionCode: string,
  sessionId: string,
  preferredRole?: ParticipantRole,
): Promise<Notification> {
  // Determine target role for the invite (prefers an open seat)
  let resolvedRole: ParticipantRole = preferredRole || "Home";
  if (!preferredRole) {
    const { data: seatRows, error: seatErr } = await supabase
      .from("Participants")
      .select("role")
      .eq("session_id", sessionId);

    if (!seatErr && seatRows) {
      const roles = seatRows.map((r) => r.role);
      if (!roles.includes("Home")) {
        resolvedRole = "Home";
      } else if (!roles.includes("Away")) {
        resolvedRole = "Away";
      } else {
        resolvedRole = "Guest";
      }
    }
  }

  return createNotification(
    recipientId,
    senderId,
    "match_invite",
    "Game Invite",
    `${senderName} invited you to join a game!`,
    `/join?code=${sessionCode}&seat=2`, // Default to Player1 seat
    {
      sessionCode,
      sessionId,
      inviteType: "session",
      role: resolvedRole,
    },
  );
}
