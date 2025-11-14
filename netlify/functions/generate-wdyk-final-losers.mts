import type { Context, Config } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
import type { Database, Json } from "../../src/lib/types/supabase";
import { searchClubCached, getClubPlayersCached } from "../../src/lib/api/transfermarktCache";

/**
 * Request body schema for generating European finals losing squad questions.
 */
interface GenerateFinalLosersRequest {
  /** Season in format "YYYY/YY" (e.g. "2023/24"). Defaults to "2023/24" */
  season?: string;
  /** UUID of the profile generating this question (required) */
  generatedBy: string;
  /** Optional session ID for tracking question usage */
  sessionId?: string;
  /** Optional override for which competitions to include (not yet implemented) */
  competitions?: string[];
}

/**
 * Hardcoded mapping of supported seasons to their losing finalists.
 * Each entry contains the club names that lost the UCL, UEL, and UECL finals.
 * 
 * To add a new season:
 * 1. Verify the losing finalists from official UEFA records
 * 2. Use exact club names as they appear in Transfermarkt
 * 3. Add entry in chronological order
 */
const FINAL_LOSERS_BY_SEASON: Record<string, { ucl: string; uel: string; uecl: string }> = {
  "2022/23": {
    ucl: "Inter", // lost to Manchester City
    uel: "AS Roma", // lost to Sevilla
    uecl: "Fiorentina", // lost to West Ham United
  },
  "2023/24": {
    ucl: "Borussia Dortmund", // lost to Real Madrid
    uel: "Bayer 04 Leverkusen", // lost to Atalanta
    uecl: "Fiorentina", // lost to Olympiacos
  },
};

/**
 * Validates UUID v4 format
 */
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Netlify serverless function to generate WDYK (Who Do You Know) questions
 * based on European competition finals losing squads.
 * 
 * This function aggregates all players from the losing teams of the UEFA Champions League,
 * Europa League, and Europa Conference League finals for a given season.
 * 
 * @endpoint /.netlify/functions/generate-wdyk-final-losers
 * @method POST
 */
export default async (req: Request, _ctx: Context) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body: GenerateFinalLosersRequest = await req.json();
    const season = body.season || "2023/24";
    const { generatedBy, sessionId } = body;

    // Validate required fields
    if (!generatedBy) {
      return new Response(
        JSON.stringify({ 
          error: "generatedBy is required",
          details: "Must provide the UUID of the profile generating this question"
        }), 
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!isValidUUID(generatedBy)) {
      return new Response(
        JSON.stringify({ 
          error: "Invalid generatedBy format",
          details: "generatedBy must be a valid UUID v4"
        }), 
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Check season support
    const mapping = FINAL_LOSERS_BY_SEASON[season];
    if (!mapping) {
      const supportedSeasons = Object.keys(FINAL_LOSERS_BY_SEASON).join(", ");
      return new Response(
        JSON.stringify({ 
          error: `Season ${season} not supported`,
          supportedSeasons,
          details: "To add a new season, update FINAL_LOSERS_BY_SEASON mapping in the function code with verified UEFA final results"
        }),
        { status: 422, headers: { "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Netlify.env.get("VITE_SUPABASE_DATABASE_URL");
    const supabaseServiceKey = Netlify.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase credentials not configured");
    }
    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

    // Fetch players from all three losing clubs
    const losingClubs = [mapping.ucl, mapping.uel, mapping.uecl];
    const uniquePlayers: Set<string> = new Set();
    const clubMetadata: Record<string, { clubId?: string; playerCount: number }> = {};

    for (const clubName of losingClubs) {
      try {
        const searchRes = await searchClubCached(clubName);
        if (!searchRes.results.length) {
          console.warn(`No club found for "${clubName}"`);
          continue;
        }
        const club = searchRes.results[0];
        const playersRes = await getClubPlayersCached(club.id, season.split("/")[0]);
        const names = playersRes.players.map(p => p.name);
        names.forEach(n => uniquePlayers.add(n));
        clubMetadata[club.name] = { clubId: club.id, playerCount: names.length };
      } catch (e) {
        console.error(`Failed to fetch players for ${clubName}:`, e);
        // Continue with other clubs - partial data is acceptable
      }
    }

    const answers = Array.from(uniquePlayers);
    if (answers.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: "No players resolved",
          details: "Failed to fetch squad data for any of the losing finalist clubs. This may be a temporary API issue."
        }), 
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const questionText = `Name players who were in the losing squads of the European finals (UCL, UEL, UECL) in ${season}`;

    // Prepare insert data (using same pattern as existing generate-wdyk-question.mts)
    const insertData = {
      segment_code: "WDYK",
      question_text: questionText,
      answers: answers.slice(0, 150) as unknown as Json,
      correct_answer_index: null,
      difficulty: "hard",
      api_source: "transfermarkt",
      api_params: {
        season,
        finals: {
          ucl: mapping.ucl,
          uel: mapping.uel,
          uecl: mapping.uecl,
        },
        queryType: "european_finals_losers",
      },
      total_answers_available: answers.length,
      answers_truncated: answers.length > 150,
    };

    const { data: questionData, error: questionError } = await supabase
      .from("Questions")
      .insert(insertData as any)
      .select("question_id")
      .single();

    if (questionError) {
      console.error("Database insert error:", questionError);
      throw new Error(`Failed to save question: ${questionError.message}`);
    }

    const questionId = (questionData as { question_id: string }).question_id;

    // Insert metadata (non-blocking if it fails)
    const metadataInsert = {
      question_id: questionId,
      generator_function: "generate-wdyk-final-losers",
      api_endpoint: "multiple:/clubs/{id}/players",
      cache_hit: true, // Using cached data
      generation_time_ms: 0, // Could be measured in future
    };

    try {
      await supabase
        .from("generated_questions_metadata")
        .insert(metadataInsert as any);
    } catch (metaError) {
      console.warn("Metadata insert failed (non-critical):", metaError);
    }

    return new Response(
      JSON.stringify({
        questionId,
        question: questionText,
        answers: answers.slice(0, 150),
        correct_answer_index: null,
        metadata: {
          season,
          finals: mapping,
          clubs: clubMetadata,
          totalPlayers: answers.length,
          truncated: answers.length > 150,
        },
      }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating final losers question:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

export const config: Config = {
  path: "/api/generate-wdyk-final-losers",
};
