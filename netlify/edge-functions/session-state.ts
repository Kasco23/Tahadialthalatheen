import type { Context, Config } from "@netlify/edge-functions";
import { getStore } from "@netlify/blobs";

/**
 * Edge Function: Session State Management
 *
 * Manages session-level state in Netlify Blobs (e.g., room creation status, phase changes)
 *
 * Methods:
 * - GET: Retrieve current session state
 * - POST: Update session state (partial updates supported)
 * - PUT: Replace entire session state
 * - DELETE: Clear session state
 *
 * Query Parameters (GET):
 * - sessionId: The session ID
 *
 * POST/PUT Body:
 * - sessionId: The session ID
 * - state: State object to save/merge
 *
 * DELETE Body:
 * - sessionId: The session ID
 *
 * State Object Shape:
 * {
 *   dailyRoomCreated: boolean,
 *   dailyRoomUrl?: string,
 *   phase?: string,
 *   lastUpdated: number (timestamp),
 *   [key: string]: any
 * }
 *
 * Returns:
 * - 200: { success: true, state?: <session-state> }
 * - 404: { success: false, error: "Session state not found" }
 * - 400: { success: false, error: <validation-error> }
 * - 500: { success: false, error: <error-message> }
 */
export default async (req: Request, _context: Context) => {
  try {
    const method = req.method;

    // Parse request data
    let sessionId: string | null = null;
    let stateData: Record<string, unknown> | null = null;

    if (method === "GET") {
      const url = new URL(req.url);
      sessionId = url.searchParams.get("sessionId");
    } else {
      const body = await req.json();
      sessionId = body.sessionId;
      stateData = body.state;
    }

    // Validate sessionId
    if (!sessionId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing sessionId parameter",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Get consolidated "sessions" store with strong consistency
    // Migrated from "session-state" in Phase 3.2
    const store = getStore({
      name: "sessions",
      consistency: "strong",
    });

    const stateKey = `session:${sessionId}:state`;

    // Handle different HTTP methods
    switch (method) {
      case "GET": {
        // Retrieve session state
        const state = await store.get(stateKey, { type: "json" });

        if (!state) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "Session state not found",
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
            state,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      case "POST": {
        // Partial update - merge with existing state
        if (!stateData) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "Missing state parameter",
            }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            },
          );
        }

        // Get existing state
        const existingState = (await store.get(stateKey, {
          type: "json",
        })) as Record<string, unknown> | null;

        // Merge with new state
        const mergedState = {
          ...(existingState || {}),
          ...stateData,
          lastUpdated: Date.now(),
        };

        await store.setJSON(stateKey, mergedState, {
          metadata: {
            updated_at: new Date().toISOString(),
            operation: "partial_update",
          },
        });

        console.log(`Updated session state for ${sessionId}:`, mergedState);

        return new Response(
          JSON.stringify({
            success: true,
            state: mergedState,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      case "PUT": {
        // Full replace - overwrite entire state
        if (!stateData) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "Missing state parameter",
            }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            },
          );
        }

        const newState = {
          ...stateData,
          lastUpdated: Date.now(),
        };

        await store.setJSON(stateKey, newState, {
          metadata: {
            updated_at: new Date().toISOString(),
            operation: "full_replace",
          },
        });

        console.log(`Replaced session state for ${sessionId}:`, newState);

        return new Response(
          JSON.stringify({
            success: true,
            state: newState,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      case "DELETE": {
        // Clear session state
        await store.delete(stateKey);

        console.log(`Cleared session state for ${sessionId}`);

        return new Response(
          JSON.stringify({
            success: true,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      default:
        return new Response(
          JSON.stringify({
            success: false,
            error: "Method not allowed",
          }),
          {
            status: 405,
            headers: { "Content-Type": "application/json" },
          },
        );
    }
  } catch (error) {
    console.error("Error in session-state edge function:", error);
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
  path: "/.netlify/edge-functions/session-state",
};
