/**
 * Utility functions for storing and retrieving active user profiles via Netlify Blobs
 */

import { Logger } from "./logger";
import type { Tables } from "./types/supabase";

type Profile = Tables<"Profiles">;

/**
 * Stores the active user profile in Netlify Blobs
 * @param userId - The user's authentication ID
 * @param profileData - The profile data to store
 * @returns Promise that resolves when storage is complete
 */
export async function storeActiveProfile(
  userId: string,
  profileData: Profile
): Promise<void> {
  try {
    const response = await fetch("/.netlify/functions/store-active-profile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
        profileData,
      }),
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || "Failed to store profile");
    }

    Logger.log("Active profile stored successfully:", { userId });
  } catch (error) {
    Logger.error("Error storing active profile:", error);
    throw error;
  }
}

/**
 * Retrieves the active user profile from Netlify Blobs
 * @param userId - The user's authentication ID
 * @returns Promise that resolves with the profile data or null if not found
 */
export async function getActiveProfile(
  userId: string
): Promise<Profile | null> {
  try {
    const response = await fetch(
      `/.netlify/functions/get-active-profile?userId=${encodeURIComponent(userId)}`
    );

    const result = await response.json();

    if (!result.success) {
      if (response.status === 404) {
        return null; // Profile not found is not an error
      }
      throw new Error(result.error || "Failed to retrieve profile");
    }

    Logger.log("Active profile retrieved successfully:", { userId });
    return result.profile;
  } catch (error) {
    Logger.error("Error retrieving active profile:", error);
    return null; // Return null on error to allow fallback to database
  }
}
