import type { Context, Config } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../src/lib/types/supabase";

/**
 * Update Quiz State (Host Only)
 *
 * Allows host to update quiz_state table:
 * - Change segment
 * - Set current question
 * - Update scores
 * - Change turn
 * - Lock/unlock buzzer
 * - Set buzzer winner
 *
 * POST body: Partial quiz_state row
 */

export default async (req: Request, context: Context) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const { session_id, ...updates } = body;

    if (!session_id) {
      return new Response(JSON.stringify({ error: "session_id required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Initialize Supabase client
    const supabaseUrl = Netlify.env.get("VITE_SUPABASE_DATABASE_URL");
    const supabaseServiceKey = Netlify.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase credentials not configured");
    }

    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

    // Verify user is Host for this session
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Authorization required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));

    if (!user || authError) {
      return new Response(
        JSON.stringify({ error: "Invalid authorization token" }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      );
    }

    // Check if user is Host
    const { data: participant, error: roleError } = await supabase
      .from("Participants")
      .select("role")
      .eq("session_id", session_id)
      .eq("profile_id", user.id)
      .single();

    if (roleError || !participant) {
      return new Response(JSON.stringify({ error: "Participant not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Type assertion for participant role
    const participantRole = (participant as { role: string }).role;

    if (participantRole !== "Host" && participantRole !== "GameMaster") {
      return new Response(
        JSON.stringify({ error: "Only Host can update quiz state" }),
        { status: 403, headers: { "Content-Type": "application/json" } },
      );
    }

    // Upsert quiz_state (insert if not exists, update if exists)
    const { data: quizState, error: updateError } = await supabase
      .from("quiz_state")
      .upsert(
        {
          session_id,
          ...updates,
        },
        { onConflict: "session_id" },
      )
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update quiz state: ${updateError.message}`);
    }

    return new Response(
      JSON.stringify({ success: true, quiz_state: quizState }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error updating quiz state:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};

export const config: Config = {
  path: "/api/quiz/state",
};
