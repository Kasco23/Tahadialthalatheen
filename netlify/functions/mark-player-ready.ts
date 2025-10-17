import type { Context } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

/**
 * Netlify Function: Mark Player Ready
 *
 * Server-side endpoint to update a player's ready status.
 * Keeps Supabase service role key secure on the server.
 *
 * POST Body:
 * {
 *   "participantId": "uuid-of-participant",
 *   "isReady": boolean
 * }
 *
 * Returns:
 * {
 *   "success": true
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
      },
    );
  }

  try {
    // Parse request body
    const { participantId, isReady } = await req.json();

    if (!participantId || typeof isReady !== "boolean") {
      return new Response(
        JSON.stringify({
          success: false,
          error: "participantId and isReady (boolean) are required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
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
        },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });

    // Update ready status
    const { error } = await supabase
      .from("Participants")
      .update({ isReady: isReady })
      .eq("participant_id", participantId);

    if (error) {
      console.error("Error updating ready status:", error);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Database error: ${error.message}`,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    console.log(`Player ${participantId} ready status set to: ${isReady}`);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in mark-player-ready function:", error);
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
