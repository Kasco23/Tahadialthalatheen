import type { Context, Config } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../src/lib/types/supabase";

/**
 * Record Buzzer Press (Players Only)
 * 
 * Records a buzzer press in quiz_buzzes table
 * Uses Netlify Blobs for atomic first-writer-wins resolution
 * 
 * POST body: {
 *   session_id: UUID,
 *   participant_id: UUID,
 *   question_id: UUID,
 *   latency_ms: number (optional)
 * }
 */

export default async (req: Request, context: Context) => {
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await req.json();
    const { session_id, participant_id, question_id, latency_ms } = body;

    if (!session_id || !participant_id || !question_id) {
      return new Response(
        JSON.stringify({ error: "session_id, participant_id, and question_id required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Netlify.env.get("VITE_SUPABASE_DATABASE_URL");
    const supabaseServiceKey = Netlify.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase credentials not configured");
    }

    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

    // Check if buzzer is locked for this question
    const { data: quizState, error: stateError } = await supabase
      .from("quiz_state")
      .select("buzzer_locked, buzzer_winner_id")
      .eq("session_id", session_id)
      .single();

    if (stateError && stateError.code !== "PGRST116") {
      // PGRST116 = no rows, which is ok (quiz_state not initialized yet)
      throw new Error(`Failed to check buzzer state: ${stateError.message}`);
    }

    // Type assertion for quiz state
    const state = quizState as { buzzer_locked: boolean; buzzer_winner_id: string | null } | null;
    
    if (state && state.buzzer_locked) {
      return new Response(
        JSON.stringify({ 
          error: "Buzzer is locked", 
          winner_id: state.buzzer_winner_id 
        }),
        { status: 409, headers: { "Content-Type": "application/json" } }
      );
    }

    // Use Netlify Blobs for atomic first-writer-wins
    const { getStore } = await import("@netlify/blobs");
    const store = getStore("quiz-buzzes");
    const blobKey = `${session_id}:${question_id}:winner`;

    // Try to set winner atomically
    const existing = await store.get(blobKey, { type: "text" });
    
    if (existing) {
      // Someone already buzzed first
      const existingData = JSON.parse(existing);
      return new Response(
        JSON.stringify({ 
          success: false, 
          winner_id: existingData.participant_id,
          message: "Someone else buzzed first",
          your_latency_ms: latency_ms,
          winner_latency_ms: existingData.latency_ms
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Set as winner in blob
    const buzzData = {
      participant_id,
      session_id,
      question_id,
      latency_ms: latency_ms || 0,
      buzz_ts: new Date().toISOString(),
    };
    
    await store.set(blobKey, JSON.stringify(buzzData));

    // Record in database for audit trail
    const { data: buzzRecord, error: insertError } = await supabase
      .from("quiz_buzzes")
      .insert({
        session_id,
        participant_id,
        question_id,
        latency_ms: latency_ms || null,
      } as any)
      .select()
      .single();

    if (insertError) {
      console.error("Failed to record buzz in DB:", insertError);
      // Don't fail the request - blob is source of truth
    }

    // Lock buzzer and set winner in quiz_state
    await supabase
      .from("quiz_state")
      .upsert(
        {
          session_id,
          buzzer_locked: true,
          buzzer_winner_id: participant_id,
        } as any,
        { onConflict: "session_id" }
      );

    return new Response(
      JSON.stringify({ 
        success: true, 
        winner: true,
        buzz_data: buzzData,
        db_record: buzzRecord 
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error recording buzz:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Internal server error" 
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

export const config: Config = {
  path: "/api/quiz/buzz",
};
