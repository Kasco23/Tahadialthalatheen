import type { Context, Config } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
import type { Database, Json } from "../../src/lib/types/supabase";
import { 
  searchClubCached, 
  getClubPlayersCached 
} from "../../src/lib/api/transfermarktCache";

/**
 * Generate WDYK (Who Do You Know) Question
 * 
 * Creates open-ended list questions about club squads
 * Example: "Name players from Manchester United's 2023 squad"
 * 
 * Request body (JSON):
 * {
 *   "clubName": string,             // Club name to search for
 *   "sessionId": string,            // UUID of the session (optional, for tracking)
 *   "generatedBy": string,          // UUID of the profile generating the question
 *   "season": string                // Season year (optional, e.g., "2023")
 * }
 * 
 * Response:
 * {
 *   "questionId": string,           // UUID of generated question
 *   "question": string,             // The question text
 *   "answers": string[],            // Array of player names (all are correct answers)
 *   "correct_answer_index": null,   // N/A for WDYK (open-ended)
 *   "metadata": object              // Generation metadata
 * }
 */

interface GenerateWDYKQuestionRequest {
  clubName: string;
  sessionId?: string;
  generatedBy: string;
  season?: string;
}

export default async (req: Request, context: Context) => {
  // Only accept POST requests
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    // Parse request body
    const body: GenerateWDYKQuestionRequest = await req.json();
    const { clubName, sessionId, generatedBy, season } = body;

    // Validate inputs
    if (!clubName || !generatedBy) {
      return new Response(
        JSON.stringify({ error: "clubName and generatedBy are required" }),
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

    // Track generation start time
    const startTime = Date.now();

    // Step 1: Search for club
    const searchData = await searchClubCached(clubName);
    
    if (!searchData || !searchData.results || searchData.results.length === 0) {
      return new Response(
        JSON.stringify({ error: `No club found with name: ${clubName}` }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Use first search result
    const club = searchData.results[0];
    const clubId = club.id;

    // Step 2: Get club players
    const playersData = await getClubPlayersCached(clubId, season);

    if (!playersData || !playersData.players || playersData.players.length === 0) {
      return new Response(
        JSON.stringify({ error: `No players found for club: ${club.name}` }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Step 3: Extract player names (filter out duplicates)
    const playerNames = playersData.players
      .map(player => player.name)
      .filter((name, index, self) => self.indexOf(name) === index); // Remove duplicates

    if (playerNames.length < 10) {
      return new Response(
        JSON.stringify({ 
          error: `Insufficient players for ${club.name} (${playerNames.length} found, need at least 10)` 
        }),
        { status: 422, headers: { "Content-Type": "application/json" } }
      );
    }

    // Step 4: Generate question
    const seasonText = season ? ` from the ${season} season` : "";
    const questionText = `Name players from ${club.name}${seasonText}`;

    // For WDYK questions, we store ALL player names (up to 100 to avoid excessive data)
    // The UI will show a subset during gameplay, but we track all available answers
    const allAnswers = playerNames.slice(0, 100);
    const totalAnswersAvailable = playerNames.length;
    const answersTruncated = playerNames.length > 100;

    // Step 5: Insert into Questions table
    const insertData = {
      segment_code: "WDYK",
      question_text: questionText,
      answers: allAnswers as unknown as Json,
      correct_answer_index: null, // WDYK questions don't have a single correct answer
      difficulty: "medium",
      api_source: "transfermarkt",
      api_params: {
        clubName,
        clubId,
        clubTransfermarktId: club.id,
        queryType: "club_squad",
        season: season || "current"
      },
      total_answers_available: totalAnswersAvailable,
      answers_truncated: answersTruncated
    };
    
    const { data: questionData, error: questionError } = await supabase
      .from("Questions")
      .insert(insertData as any)
      .select("question_id")
      .single();

    if (questionError) {
      console.error("Failed to insert question:", questionError);
      throw new Error(`Database error: ${questionError.message}`);
    }

    if (!questionData) {
      throw new Error("Question created but no data returned");
    }

    const questionId = (questionData as { question_id: string }).question_id;
    const generationTime = Date.now() - startTime;

    // Step 6: Insert metadata
    const metadataInsert = {
      question_id: questionId,
      generator_function: "generate-wdyk-question",
      api_endpoint: "/clubs/{id}/players",
      cache_hit: true,
      generation_time_ms: generationTime
    };
    
    const { error: metadataError } = await supabase
      .from("generated_questions_metadata")
      .insert(metadataInsert as any);

    if (metadataError) {
      console.error("Failed to insert metadata:", metadataError);
      // Don't fail the request, just log the error
    }

    // Step 7: Return success response
    return new Response(
      JSON.stringify({
        questionId,
        question: questionText,
        answers: allAnswers,
        correct_answer_index: null, // WDYK questions are open-ended
        metadata: {
          clubName: club.name,
          totalPlayers: totalAnswersAvailable,
          answersTruncated,
          generationTime: `${generationTime}ms`,
          cached: true
        }
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" }
      }
    );

  } catch (error) {
    console.error("Error generating WDYK question:", error);
    
    return new Response(
      JSON.stringify({ 
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

export const config: Config = {
  path: "/api/generate-wdyk-question"
};
