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

    // Get blob store with timeout protection
    const storeName = "active-profiles";
    
    try {
      const store = getStore(storeName);

      // Retrieve profile data with timeout
      const profileKey = `user:${userId}:profile`;
      const profile = await Promise.race([
        store.get(profileKey, { type: "json" }),
        new Promise<null>((_, reject) =>
          setTimeout(() => reject(new Error("Blobs get timeout")), 5000),
        ),
      ]);

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
    } catch (blobError) {
      console.error("Blobs operation failed:", blobError);
      // Return not found instead of error - graceful degradation
      return new Response(
        JSON.stringify({
          success: false,
          error: "Profile temporarily unavailable",
          details:
            blobError instanceof Error ? blobError.message : "Storage unavailable",
        }),
        {
          status: 503,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
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
