import type { Context } from "@netlify/functions";
import { getStore } from "@netlify/blobs";

/**
 * Netlify Function: Get Active Profile
 *
 * Retrieves the currently active user profile from Netlify Blobs
 *
 * Query Parameters:
 * - userId: The user's authentication ID
 *
 * Returns:
 * - 200: { success: true, profile: <profile-data> }
 * - 404: { success: false, error: "Profile not found" }
 * - 400: { success: false, error: "Missing userId parameter" }
 * - 500: { success: false, error: <error-message> }
 */

export default async (req: Request, _context: Context) => {
  // Only allow GET requests
  if (req.method !== "GET") {
    return new Response(
      JSON.stringify({ success: false, error: "Method not allowed" }),
      {
        status: 405,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  try {
    // Parse query parameters
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");

    // Validate required parameters
    if (!userId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing userId parameter",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Get blob store
    const storeName = "active-profiles";
    const store = getStore(storeName);

    // Retrieve profile data
    const profileKey = `user:${userId}:profile`;
    const profile = await store.get(profileKey, { type: "json" });

    if (!profile) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Profile not found",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        profile,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error retrieving active profile:", error);
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
