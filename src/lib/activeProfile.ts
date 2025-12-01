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
  profileData: Profile,
): Promise<void> {
  try {
    const response = await fetch("/api/store-active-profile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
        profileData,
      }),
    });

    // Check if response is JSON before parsing
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      // Check if it's a dev environment HTML page
      if (text.includes("<!doctype") || text.includes("<!DOCTYPE")) {
        // Silently skip in development - Netlify Functions not available
        Logger.debug(
          "Netlify Functions unavailable in local dev - skipping profile storage",
        );
        return;
      }
      throw new Error(`Non-JSON response from server: ${text.slice(0, 100)}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || "Failed to store profile");
    }

    Logger.log("Active profile stored successfully:", { userId });
  } catch (error) {
    // Don't throw in development - just log as debug
    if (error instanceof Error && error.message.includes("Non-JSON response")) {
      Logger.debug("Profile storage skipped (dev environment)");
      return;
    }
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
  userId: string,
): Promise<Profile | null> {
  try {
    const response = await fetch(
      `/api/get-active-profile?userId=${encodeURIComponent(userId)}`,
    );

    // Check if response is JSON before parsing
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      Logger.warn(
        "Non-JSON response from get-active-profile:",
        text.slice(0, 100),
      );
      return null;
    }

    const result = await response.json();
    const profile = (result.profile ??
      result.profileData ??
      result.data ??
      null) as Profile | null;

    if (!result.success) {
      if (response.status === 404) {
        return null; // Profile not found is not an error
      }
      throw new Error(result.error || "Failed to retrieve profile");
    }

    Logger.log("Active profile retrieved successfully:", { userId });
    return profile;
  } catch (error) {
    Logger.error("Error retrieving active profile:", error);
    return null; // Return null on error to allow fallback to database
  }
}
