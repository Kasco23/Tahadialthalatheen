import type { Context } from "@netlify/edge-functions";
import { getStore } from "@netlify/blobs";

/**
 * Edge Function: Set/Delete Session Data
 * 
 * Saves or deletes session data in Netlify Blobs storage
 * 
 * POST Body (for save):
 * - key: The session key (format: "sessionId:participantId")
 * - data: The session data object to store
 * 
 * DELETE Body (for delete):
 * - key: The session key to delete
 * 
 * Returns:
 * - 200: { success: true }
 * - 400: { success: false, error: "Missing required parameters" }
 * - 500: { success: false, error: <error-message> }
 */
export default async (req: Request, context: Context) => {
  try {
    // Allow POST for save/update and DELETE for removal
    if (req.method !== "POST" && req.method !== "DELETE") {
      return new Response(
        JSON.stringify({ success: false, error: "Method not allowed" }),
        {
          status: 405,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Parse request body
    const body = await req.json();
    const { key, data } = body;

    if (!key) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing key parameter" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
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
        }
      );
    }

    // Get blob store
    const store = getStore({
      name: "session-data",
      siteID: context.site.id,
      token: Deno.env.get("NETLIFY_PERSONAL_ACCESS_TOKEN") || "",
    });

    if (req.method === "DELETE") {
      // Delete session data
      await store.delete(key);
      console.log(`Deleted session data for key: ${key}`);
      
      return new Response(
        JSON.stringify({ success: true }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // POST: Save/update session data
    if (!data) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing data parameter" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Store data in blob store
    await store.setJSON(key, data);
    console.log(`Saved session data for key: ${key}`);

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in set-session edge function:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
