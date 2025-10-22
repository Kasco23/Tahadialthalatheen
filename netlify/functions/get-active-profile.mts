import type { Context, Config } from "@netlify/functions";
import { getStore } from "@netlify/blobs";

/**
 * Netlify Serverless Function: Get Active Profile
 *
 * Retrieves the currently active user profile from Netlify Blobs.
 *
 * GET Query: ?userId=user-id
 */
export default async (req: Request, context: Context) => {
  if (req.method !== "GET") {
    return new Response(
      JSON.stringify({ success: false, error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");

    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing userId parameter" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Use global store with strong consistency
    const store = getStore({
      name: "active-profiles",
      consistency: "strong",
    });

    const profileData = await store.get(userId, { type: "json" });

    if (!profileData) {
      return new Response(
        JSON.stringify({ success: false, error: "Profile not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("Profile retrieved successfully for user:", userId);

    return new Response(
      JSON.stringify({ success: true, profileData }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error retrieving profile:", error);
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
  path: "/api/get-active-profile",
};
