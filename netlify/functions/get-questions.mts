import type { Context, Config } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../src/lib/types/supabase";

/**
 * Get Questions for Quiz
 *
 * - Returns questions for a segment
 * - If user is Host role: includes correct_answer_index
 * - If user is Player role: answers hidden (correct_answer_index set to null)
 *
 * Query params:
 * - segment_code: WDYK | AUCT | BELL | UPDW | REMO
 * - session_id: UUID (required for role check)
 * - count: number of questions (optional, default: 10)
 */

export default async (req: Request, context: Context) => {
  // Parse query params
  const url = new URL(req.url);
  const segmentCode = url.searchParams.get("segment_code");
  const sessionId = url.searchParams.get("session_id");
  const count = parseInt(url.searchParams.get("count") || "10");

  // Validate inputs
  if (!segmentCode || !sessionId) {
    return new Response(
      JSON.stringify({ error: "segment_code and session_id required" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const validSegments = ["WDYK", "AUCT", "BELL", "UPDW", "REMO"];
  if (!validSegments.includes(segmentCode)) {
    return new Response(JSON.stringify({ error: "Invalid segment_code" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Initialize Supabase client with service role for RLS bypass on role check
    const supabaseUrl = Netlify.env.get("VITE_SUPABASE_DATABASE_URL");
    const supabaseServiceKey = Netlify.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase credentials not configured");
    }

    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

    // Get auth header from request
    const authHeader = req.headers.get("authorization");
    let userRole: string | null = null;
    let userId: string | null = null;

    if (authHeader) {
      // Extract user from JWT
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));

      if (user && !authError) {
        userId = user.id;

        // Get user's role in this session
        const { data: participant, error: roleError } = await supabase
          .from("Participants")
          .select("role")
          .eq("session_id", sessionId)
          .eq("profile_id", userId)
          .single();

        if (participant && !roleError) {
          userRole = participant.role;
        }
      }
    }

    // Fetch questions for segment
    const { data: questions, error: questionsError } = await supabase
      .from("Questions")
      .select("*")
      .eq("segment_code", segmentCode)
      .limit(count);

    if (questionsError) {
      throw new Error(`Failed to fetch questions: ${questionsError.message}`);
    }

    if (!questions || questions.length === 0) {
      return new Response(
        JSON.stringify({
          questions: [],
          message: `No questions available for segment ${segmentCode}`,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    // Filter answers based on role
    const filteredQuestions = questions.map((q) => {
      // Host sees everything, players don't see correct answer
      if (userRole === "Host" || userRole === "GameMaster") {
        return q;
      } else {
        // Hide correct answer for players
        return {
          ...q,
          correct_answer_index: null,
        };
      }
    });

    return new Response(
      JSON.stringify({
        questions: filteredQuestions,
        role: userRole,
        total_available: questions.length,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error fetching questions:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};

export const config: Config = {
  path: "/api/quiz/questions",
};
