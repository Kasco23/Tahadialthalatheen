import type { Context, Config } from "@netlify/edge-functions";
import { getStore } from "@netlify/blobs";
import { resolveBlobStoreName } from "../blobs/storeName.ts";

/**
 * Edge Function: Get Session Data
 *
 * Retrieves session data from Netlify Blobs storage
 *
 * Query Parameters:
 * - key: The session key (format: "sessionId:participantId")
 *
 * Returns:
 * - 200: { success: true, data: <session-data> }
 * - 404: { success: false, error: "Session not found" }
 * - 400: { success: false, error: "Missing key parameter" }
 * - 500: { success: false, error: <error-message> }
 */
export default async (req: Request, context: Context) => {
  try {
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

    // Parse query parameters
    const url = new URL(req.url);
    const key = url.searchParams.get("key");

    if (!key) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing key parameter" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Validate key format (sessionId:participantId)
    if (!key.includes(":")) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid key format. Expected: sessionId:participantId",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Get blob store - uses environment context automatically
    const store = getStore({
      name: resolveBlobStoreName("sessions", context?.deploy?.context),
      consistency: "strong", // Ensure strong consistency for session data
    });

    // Retrieve data from blob store
    const data = await store.get(key, { type: "json" });

    if (!data) {
      return new Response(
        JSON.stringify({ success: false, error: "Session not found" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Return session data
    return new Response(
      JSON.stringify({
        success: true,
        data,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error in get-session edge function:", error);
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

export const config: Config = {
  path: "/.netlify/edge-functions/get-session",
};
