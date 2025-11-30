import type { Context, Config } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../src/lib/types/supabase";

/**
 * Get Random Question
 *
 * Retrieves a random question from the database for gameplay.
 * Used by the Quiz system to fetch questions during active games.
 *
 * GET Query params:
 * - segment_code: 'WDYK' | 'AUCT' | 'BELL' | 'UPDW' | 'REMO' (required)
 * - difficulty?: 'easy' | 'medium' | 'hard' (optional filter)
 * - exclude_ids?: comma-separated question IDs to exclude (optional)
 */

export default async (req: Request, context: Context) => {
  // Only allow GET requests
  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Parse query params
    const url = new URL(req.url);
    const segmentCode = url.searchParams.get("segment_code");
    const difficulty = url.searchParams.get("difficulty");
    const excludeIdsParam = url.searchParams.get("exclude_ids");

    // Validate segment code
    if (!segmentCode) {
      return new Response(
        JSON.stringify({ error: "segment_code is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const validSegments = ["WDYK", "AUCT", "BELL", "UPDW", "REMO"];
    if (!validSegments.includes(segmentCode)) {
      return new Response(JSON.stringify({ error: "Invalid segment_code" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Parse exclude IDs
    const excludeIds = excludeIdsParam
      ? excludeIdsParam.split(",").filter(Boolean)
      : [];

    // Initialize Supabase client
    const supabaseUrl = Netlify.env.get("VITE_SUPABASE_DATABASE_URL");
    const supabaseServiceKey = Netlify.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase credentials not configured");
    }

    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

    // Build query for random question
    let query = supabase
      .from("Questions")
      .select("*")
      .eq("segment_code", segmentCode);

    // Apply difficulty filter if provided
    if (difficulty) {
      const validDifficulties = ["easy", "medium", "hard"];
      if (validDifficulties.includes(difficulty)) {
        query = query.eq("difficulty", difficulty);
      }
    }

    // Exclude specific question IDs
    if (excludeIds.length > 0) {
      query = query.not("question_id", "in", `(${excludeIds.join(",")})`);
    }

    // Fetch all matching questions (we'll pick random on client side for simplicity)
    // For production with large datasets, consider using PostgreSQL's random() function
    const { data, error } = await query;

    if (error) {
      console.error("Database error:", error);
      return new Response(
        JSON.stringify({
          error: "Failed to fetch question",
          details: error.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!data || data.length === 0) {
      return new Response(
        JSON.stringify({
          error: "No questions available",
          message: `No questions found for segment ${segmentCode}${difficulty ? ` with difficulty ${difficulty}` : ""}`,
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Pick a random question
    const randomIndex = Math.floor(Math.random() * data.length);
    const randomQuestion = data[randomIndex];

    return new Response(JSON.stringify({ question: randomQuestion }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error fetching random question:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

export const config: Config = {
  path: "/api/questions/random",
};
