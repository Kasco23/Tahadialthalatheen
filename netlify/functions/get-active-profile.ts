import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
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

export const handler: Handler = async (
  event: HandlerEvent,
  _context: HandlerContext
) => {
  // Only allow GET requests
  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      body: JSON.stringify({ success: false, error: "Method not allowed" }),
    };
  }

  try {
    // Parse query parameters
    const userId = event.queryStringParameters?.userId;

    // Validate required parameters
    if (!userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          error: "Missing userId parameter",
        }),
      };
    }

    // Get blob store
    const storeName = "active-profiles";
    const store = getStore(storeName);

    // Retrieve profile data
    const profileKey = `user:${userId}:profile`;
    const profile = await store.get(profileKey, { type: "json" });

    if (!profile) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          success: false,
          error: "Profile not found",
        }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        profile,
      }),
    };
  } catch (error) {
    console.error("Error retrieving active profile:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
    };
  }
};
