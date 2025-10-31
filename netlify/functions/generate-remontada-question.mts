import type { Context, Config } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
import type { Database, Json } from "../../src/lib/types/supabase";
import { 
  searchPlayerCached, 
  getPlayerTransfersCached 
} from "../../src/lib/api/transfermarktCache";

/**
 * Generate Remontada Question
 * 
 * Creates career path timeline questions using Transfermarkt player transfer data
 * 
 * Request body (JSON):
 * {
 *   "playerName": string,          // Player name to search for
 *   "sessionId": string,            // UUID of the session (optional, for tracking)
 *   "generatedBy": string           // UUID of the profile generating the question
 * }
 * 
 * Response:
 * {
 *   "questionId": string,           // UUID of generated question
 *   "question": string,             // The question text
 *   "answers": string[],            // Array of club names (correct answer first)
 *   "correct_answer_index": number, // Index of correct answer
 *   "metadata": object              // Generation metadata
 * }
 */

interface GenerateQuestionRequest {
  playerName: string;
  sessionId?: string;
  generatedBy: string;
}

interface TransferClub {
  name: string;
  season?: string;
  date?: string;
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
    const body: GenerateQuestionRequest = await req.json();
    const { playerName, sessionId, generatedBy } = body;

    // Validate inputs
    if (!playerName || !generatedBy) {
      return new Response(
        JSON.stringify({ error: "playerName and generatedBy are required" }),
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

    // Step 1: Search for player
    const searchData = await searchPlayerCached(playerName);
    
    if (!searchData || !searchData.results || searchData.results.length === 0) {
      return new Response(
        JSON.stringify({ error: `No player found with name: ${playerName}` }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Use first search result
    const player = searchData.results[0];
    const playerId = player.id;

    // Step 2: Get player transfers
    const transferData = await getPlayerTransfersCached(playerId);

    if (!transferData?.transfers || transferData.transfers.length === 0) {
      return new Response(
        JSON.stringify({ error: `No transfer data found for player: ${player.name}` }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Step 3: Extract clubs from transfers (chronological order)
    const clubs: TransferClub[] = [];
    
    for (const transfer of transferData.transfers) {
      // Add "from" club (clubFrom property)
      if (transfer.clubFrom?.name && !clubs.some(c => c.name === transfer.clubFrom.name)) {
        clubs.push({
          name: transfer.clubFrom.name,
          season: transfer.season,
          date: transfer.date
        });
      }
      // Add "to" club (clubTo property)
      if (transfer.clubTo?.name && !clubs.some(c => c.name === transfer.clubTo.name)) {
        clubs.push({
          name: transfer.clubTo.name,
          season: transfer.season,
          date: transfer.date
        });
      }
    }

    if (clubs.length < 4) {
      return new Response(
        JSON.stringify({ 
          error: `Insufficient transfer history for ${player.name} (${clubs.length} clubs found, need at least 4)` 
        }),
        { status: 422, headers: { "Content-Type": "application/json" } }
      );
    }

    // Step 4: Generate question (pick a middle club as the answer)
    const middleIndex = Math.floor(clubs.length / 2);
    const correctClub = clubs[middleIndex];
    const previousClub = clubs[middleIndex - 1];
    const nextClub = clubs[middleIndex + 1];

    // Question: Which club did [Player] join after [Previous Club] and before [Next Club]?
    const questionText = `Which club did ${player.name} join after ${previousClub.name} and before ${nextClub.name}?`;

    // Step 5: Create answers array (correct answer + 3 random wrong clubs)
    const wrongClubs = clubs
      .filter(c => c.name !== correctClub.name && c.name !== previousClub.name && c.name !== nextClub.name)
      .slice(0, 3);

    // If not enough wrong clubs from player's history, we need at least 4 total answers
    if (wrongClubs.length < 3) {
      // Add generic wrong answers
      const genericWrongAnswers = [
        "Real Madrid", "Barcelona", "Bayern Munich", "Manchester United",
        "Liverpool", "Chelsea", "Paris Saint-Germain", "Juventus"
      ].filter(club => 
        club !== correctClub.name && 
        club !== previousClub.name && 
        club !== nextClub.name &&
        !clubs.some(c => c.name === club)
      );
      
      while (wrongClubs.length < 3 && genericWrongAnswers.length > 0) {
        wrongClubs.push({ name: genericWrongAnswers.shift()! });
      }
    }

    // Shuffle answers and track correct position
    const allAnswers = [correctClub.name, ...wrongClubs.map(c => c.name)];
    const correctAnswerIndex = 0; // Will shuffle and update this

    // Fisher-Yates shuffle
    let currentCorrectIndex = correctAnswerIndex;
    for (let i = allAnswers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allAnswers[i], allAnswers[j]] = [allAnswers[j], allAnswers[i]];
      
      // Track correct answer position
      if (i === currentCorrectIndex) currentCorrectIndex = j;
      else if (j === currentCorrectIndex) currentCorrectIndex = i;
    }

    // Step 6: Insert into Questions table
    const insertData = {
      segment_code: "REMO",
      question_text: questionText,
      answers: allAnswers as unknown as Json, // Cast string[] to Json for database compatibility
      correct_answer_index: currentCorrectIndex,
      difficulty: "medium",
      api_source: "transfermarkt",
      api_params: {
        playerName,
        playerId,
        playerTransfermarktId: player.id,
        queryType: "career_path_timeline"
      },
      total_answers_available: clubs.length,
      answers_truncated: clubs.length > 4
    };
    
    const { data: questionData, error: questionError } = await supabase
      .from("Questions")
      .insert(insertData as any) // Type cast needed due to Supabase type inference limitations
      .select("question_id")
      .single();

    if (questionError) {
      console.error("Failed to insert question:", questionError);
      throw new Error(`Database error: ${questionError.message}`);
    }

    if (!questionData) {
      throw new Error("Question created but no data returned");
    }

    // Safely extract question_id with type assertion
    const questionId = (questionData as { question_id: string }).question_id;
    const generationTime = Date.now() - startTime;

    // Step 7: Insert metadata
    const metadataInsert = {
      question_id: questionId,
      generator_function: "generate-remontada-question",
      api_endpoint: "/players/{id}/transfers",
      cache_hit: true,
      generation_time_ms: generationTime
    };
    
    const { error: metadataError } = await supabase
      .from("generated_questions_metadata")
      .insert(metadataInsert as any); // Type cast needed due to Supabase type inference limitations

    if (metadataError) {
      console.error("Failed to insert metadata:", metadataError);
      // Don't fail the request, just log the error
    }

    // Step 8: Return success response
    return new Response(
      JSON.stringify({
        questionId,
        question: questionText,
        answers: allAnswers,
        correct_answer_index: currentCorrectIndex,
        metadata: {
          playerName: player.name,
          totalClubs: clubs.length,
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
    console.error("Error generating remontada question:", error);
    
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
  path: "/api/generate-remontada-question"
};
