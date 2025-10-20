import type { Context } from "@netlify/functions";
import { getStore } from "@netlify/blobs";

/**
 * Netlify Function: Store Active Profile
 *
 * Stores the currently active user profile in Netlify Blobs
 * This allows persisting profile data for quick access
 *
 * POST Body:
 * - userId: The user's authentication ID
 * - profileData: The profile object to store (username, flag, team, avatar_url, etc.)
 *
 * Returns:
 * - 200: { success: true, message: "Profile stored successfully" }
 * - 400: { success: false, error: "Missing required parameters" }
 * - 500: { success: false, error: <error-message> }
 */

interface ProfileData {
  id: string;
  user_id: string;
  username: string | null;
  flag: string | null;
  team: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

interface RequestBody {
  userId: string;
  profileData: ProfileData;
}

export default async (req: Request, _context: Context) => {
  // Only allow POST requests
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ success: false, error: "Method not allowed" }),
      {
        status: 405,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  try {
    // Parse request body
    const body: RequestBody = await req.json();
    const { userId, profileData } = body;

    // Validate required parameters
    if (!userId || !profileData) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing userId or profileData",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Use global store for active profiles
    // This persists across all deploys and environments
    const storeName = "active-profiles";
    const store = getStore(storeName);

    // Store profile data with user ID as key
    const profileKey = `user:${userId}:profile`;
    await store.setJSON(profileKey, {
      ...profileData,
      lastUpdated: Date.now(),
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Profile stored successfully",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error storing active profile:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};
