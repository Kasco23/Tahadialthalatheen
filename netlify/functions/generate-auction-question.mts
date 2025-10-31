import type { Context, Config } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
import type { Database, Json } from "../../src/lib/types/supabase";
import { 
  searchPlayerCached, 
  getPlayerProfileCached 
} from "../../src/lib/api/transfermarktCache";

/**
 * Generate Auction Question
 * 
 * Creates auction-style questions about player market values or transfer fees
 * Example: "What is Kylian Mbappé's current market value?"
 * 
 * Request body (JSON):
 * {
 *   "playerName": string,           // Player name to search for
 *   "sessionId": string,            // UUID of the session (optional, for tracking)
 *   "generatedBy": string,          // UUID of the profile generating the question
 *   "questionType": "market_value" | "age" | "nationality" // Type of auction question
 * }
 * 
 * Response:
 * {
 *   "questionId": string,           // UUID of generated question
 *   "question": string,             // The question text
 *   "answers": string[],            // Array of possible answers (correct answer first)
 *   "correct_answer_index": number, // Index of correct answer
 *   "metadata": object              // Generation metadata
 * }
 */

interface GenerateAuctionQuestionRequest {
  playerName: string;
  sessionId?: string;
  generatedBy: string;
  questionType?: "market_value" | "age" | "nationality";
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
    const body: GenerateAuctionQuestionRequest = await req.json();
    const { playerName, sessionId, generatedBy, questionType = "market_value" } = body;

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

    // Step 2: Get player profile for detailed information
    const profileData = await getPlayerProfileCached(playerId);

    if (!profileData) {
      return new Response(
        JSON.stringify({ error: `No profile data found for player: ${player.name}` }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Step 3: Generate question based on type
    let questionText = "";
    let correctAnswer = "";
    let wrongAnswers: string[] = [];

    if (questionType === "market_value") {
      const marketValue = profileData.marketValue;
      
      if (!marketValue || marketValue === 0) {
        return new Response(
          JSON.stringify({ error: `No market value data for ${player.name}` }),
          { status: 422, headers: { "Content-Type": "application/json" } }
        );
      }

      // Format market value in millions
      const valueInMillions = marketValue / 1000000;
      questionText = `What is ${player.name}'s approximate market value?`;
      correctAnswer = `€${valueInMillions.toFixed(1)}M`;

      // Generate plausible wrong answers
      wrongAnswers = [
        `€${(valueInMillions * 0.7).toFixed(1)}M`,
        `€${(valueInMillions * 1.3).toFixed(1)}M`,
        `€${(valueInMillions * 0.5).toFixed(1)}M`,
      ];

    } else if (questionType === "age") {
      const age = profileData.age;
      
      if (!age) {
        return new Response(
          JSON.stringify({ error: `No age data for ${player.name}` }),
          { status: 422, headers: { "Content-Type": "application/json" } }
        );
      }

      questionText = `How old is ${player.name}?`;
      correctAnswer = `${age} years old`;

      // Generate plausible wrong answers (±2, ±4, ±6 years)
      wrongAnswers = [
        `${age - 2} years old`,
        `${age + 3} years old`,
        `${age - 5} years old`,
      ].filter(a => !a.startsWith("-")); // Remove negative ages

      // Add more if we filtered some out
      while (wrongAnswers.length < 3) {
        const variation = age + (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * 8 + 1);
        const answer = `${variation} years old`;
        if (variation > 0 && !wrongAnswers.includes(answer) && answer !== correctAnswer) {
          wrongAnswers.push(answer);
        }
      }

    } else if (questionType === "nationality") {
      const citizenship = profileData.citizenship;
      
      if (!citizenship || citizenship.length === 0) {
        return new Response(
          JSON.stringify({ error: `No nationality data for ${player.name}` }),
          { status: 422, headers: { "Content-Type": "application/json" } }
        );
      }

      questionText = `What is ${player.name}'s nationality?`;
      correctAnswer = citizenship[0]; // Primary nationality

      // Generate plausible wrong answers (neighboring or similar football nations)
      const commonNations = [
        "Brazil", "Argentina", "France", "Germany", "Spain", "Italy",
        "England", "Portugal", "Netherlands", "Belgium", "Croatia"
      ].filter(nation => !citizenship.includes(nation));

      wrongAnswers = commonNations.slice(0, 3);
    }

    // Ensure we have exactly 3 unique wrong answers
    const uniqueWrong = [...new Set(wrongAnswers)].slice(0, 3);

    // Shuffle answers and track correct position
    const allAnswers = [correctAnswer, ...uniqueWrong];
    let currentCorrectIndex = 0;

    // Fisher-Yates shuffle
    for (let i = allAnswers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allAnswers[i], allAnswers[j]] = [allAnswers[j], allAnswers[i]];
      
      // Track correct answer position
      if (i === currentCorrectIndex) currentCorrectIndex = j;
      else if (j === currentCorrectIndex) currentCorrectIndex = i;
    }

    // Step 4: Insert into Questions table
    const insertData = {
      segment_code: "AUCT",
      question_text: questionText,
      answers: allAnswers as unknown as Json,
      correct_answer_index: currentCorrectIndex,
      difficulty: "medium",
      api_source: "transfermarkt",
      api_params: {
        playerName,
        playerId,
        playerTransfermarktId: player.id,
        queryType: `player_${questionType}`,
        correctValue: correctAnswer
      },
      total_answers_available: 4,
      answers_truncated: false
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

    // Step 5: Insert metadata
    const metadataInsert = {
      question_id: questionId,
      generator_function: "generate-auction-question",
      api_endpoint: "/players/{id}/profile",
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

    // Step 6: Return success response
    return new Response(
      JSON.stringify({
        questionId,
        question: questionText,
        answers: allAnswers,
        correct_answer_index: currentCorrectIndex,
        metadata: {
          playerName: player.name,
          questionType,
          correctAnswer,
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
    console.error("Error generating auction question:", error);
    
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
  path: "/api/generate-auction-question"
};
