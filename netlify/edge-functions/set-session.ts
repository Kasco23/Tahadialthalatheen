import type { Context, Config } from "@netlify/edge-functions";
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
export default async (req: Request, _context: Context) => {
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

    // Parse request body with error handling for dev mode
    let body;
    try {
      const clonedReq = req.clone();
      body = await clonedReq.json();
    } catch (cloneError) {
      console.warn(
        "Failed to read cloned request body, trying original:",
        cloneError
      );
      try {
        body = await req.json();
      } catch (finalError) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Failed to parse request body",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

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

    // Get blob store with strong consistency
    const store = getStore({
      name: "session-data",
      consistency: "strong",
    });

    if (req.method === "DELETE") {
      // Delete session data
      await store.delete(key);
      console.log(`Deleted session data for key: ${key}`);

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
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

    // Store data in blob store with metadata
    await store.setJSON(key, data, {
      metadata: {
        updated_at: new Date().toISOString(),
      },
    });

    console.log(`Saved session data for key: ${key}`);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
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

export const config: Config = {
  path: "/.netlify/edge-functions/set-session",
};
