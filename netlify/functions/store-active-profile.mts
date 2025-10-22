import type { Context, Config } from "@netlify/functions";
import { getStore } from "@netlify/blobs";

/**
 * Netlify Serverless Function: Store Active Profile
 *
 * Stores the currently active user profile in Netlify Blobs for quick access.
 *
 * POST Body:
 * {
 *   "userId": "user-id",
 *   "profileData": { ...profile object }
 * }
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

export default async (req: Request, context: Context) => {
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ success: false, error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const { userId, profileData } = await req.json() as {
      userId: string;
      profileData: ProfileData;
    };

    if (!userId || !profileData) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing userId or profileData" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Use consolidated "participants" store with strong consistency
    // Migrated from "active-profiles" in Phase 3.2
    const store = getStore({
      name: "participants",
      consistency: "strong",
    });

    await store.setJSON(userId, profileData, {
      metadata: {
        updated_at: new Date().toISOString(),
      },
    });

    console.log("Profile stored successfully for user:", userId);

    return new Response(
      JSON.stringify({ success: true, message: "Profile stored successfully" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error storing profile:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

export const config: Config = {
  path: "/api/store-active-profile",
};
