import type { Context } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

/**
 * Netlify Function: Check Ready Status
 * 
 * Server-side endpoint to check if all players are ready in a session.
 * Keeps Supabase service role key secure on the server.
 * 
 * POST Body:
 * {
 *   "sessionId": "uuid-of-session"
 * }
 * 
 * Returns:
 * {
 *   "success": true,
 *   "allReady": boolean,
 *   "readyCount": number,
 *   "totalPlayers": number,
 *   "participants": Array<{participant_id, name, role, is_ready}>
 * }
 */
export default async (req: Request, _context: Context) => {
  // Only allow POST requests
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ success: false, error: "Method not allowed" }),
      {
        status: 405,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    // Parse request body
    const { sessionId } = await req.json();

    if (!sessionId) {
      return new Response(
        JSON.stringify({ success: false, error: "sessionId is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Initialize Supabase with service role key (server-only)
    const supabaseUrl = process.env.SUPABASE_DATABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error("Supabase environment variables not configured");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Server configuration error",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });

    // Query ready status
    const { data, error } = await supabase
      .from("Participant")
      .select("participant_id, name, role, is_ready")
      .eq("session_id", sessionId)
      .in("role", ["Player1", "Player2"])
      .eq("lobby_presence", "Joined");

    if (error) {
      console.error("Error querying ready status:", error);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Database error: ${error.message}`,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const participants = data || [];
    const totalPlayers = participants.length;
    const readyCount = participants.filter((p) => p.is_ready).length;
    const allReady = totalPlayers > 0 && readyCount === totalPlayers;

    return new Response(
      JSON.stringify({
        success: true,
        allReady,
        readyCount,
        totalPlayers,
        participants,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in check-ready-status function:", error);
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
