import type { Context, Config } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
import type { Database, Json } from "../../src/lib/types/supabase";
import {
  searchPlayerCached,
  getPlayerStatsCached,
} from "../../src/lib/api/transfermarktCache";

/**
 * Generate Bellegoal Question
 *
 * Creates quick buzzer questions using player statistics (goals, assists, appearances)
 *
 * Request body (JSON):
 * {
 *   "playerName": string,          // Player name to search for
 *   "sessionId": string,            // UUID of the session (optional, for tracking)
 *   "generatedBy": string,          // UUID of the profile generating the question
 *   "statType": "goals" | "assists" | "appearances" // Type of statistic to query
 * }
 *
 * Response:
 * {
 *   "questionId": string,           // UUID of generated question
 *   "question": string,             // The question text
 *   "answers": string[],            // Array of stat values (correct answer first)
 *   "correct_answer_index": number, // Index of correct answer
 *   "metadata": object              // Generation metadata
 * }
 */

interface GenerateBellQuestionRequest {
  playerName: string;
  sessionId?: string;
  generatedBy: string;
  statType?: "goals" | "assists" | "appearances";
}

export default async (req: Request, context: Context) => {
  // Only accept POST requests
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Parse request body
    const body: GenerateBellQuestionRequest = await req.json();
    const { playerName, sessionId, generatedBy, statType = "goals" } = body;

    // Validate inputs
    if (!playerName || !generatedBy) {
      return new Response(
        JSON.stringify({ error: "playerName and generatedBy are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
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
        { status: 404, headers: { "Content-Type": "application/json" } },
      );
    }

    // Use first search result
    const player = searchData.results[0];
    const playerId = player.id;

    // Step 2: Get player statistics
    const statsData = await getPlayerStatsCached(playerId);

    if (!statsData || !statsData.stats || statsData.stats.length === 0) {
      return new Response(
        JSON.stringify({
          error: `No statistics found for player: ${player.name}`,
        }),
        { status: 404, headers: { "Content-Type": "application/json" } },
      );
    }

    // Step 3: Extract the requested statistic
    // Find total career stats (competition with id "total" or sum all competitions)
    let totalStat = 0;
    let statLabel = "";

    for (const stat of statsData.stats) {
      if (
        stat.competitionId === "total" ||
        stat.competitionName?.toLowerCase().includes("total")
      ) {
        // Use total row if available
        if (statType === "goals") {
          totalStat = stat.goals || 0;
          statLabel = "career goals";
        } else if (statType === "assists") {
          totalStat = stat.assists || 0;
          statLabel = "career assists";
        } else if (statType === "appearances") {
          totalStat = stat.appearances || 0;
          statLabel = "career appearances";
        }
        break;
      }
    }

    // If no total row found, sum all competitions
    if (totalStat === 0) {
      for (const stat of statsData.stats) {
        if (stat.competitionId !== "total") {
          if (statType === "goals") {
            totalStat += stat.goals || 0;
            statLabel = "career goals";
          } else if (statType === "assists") {
            totalStat += stat.assists || 0;
            statLabel = "career assists";
          } else if (statType === "appearances") {
            totalStat += stat.appearances || 0;
            statLabel = "career appearances";
          }
        }
      }
    }

    if (totalStat === 0) {
      return new Response(
        JSON.stringify({
          error: `No ${statType} data found for ${player.name}`,
        }),
        { status: 422, headers: { "Content-Type": "application/json" } },
      );
    }

    // Step 4: Generate question
    const questionText = `How many ${statLabel} does ${player.name} have?`;

    // Step 5: Create answers array (correct answer + 3 plausible wrong answers)
    const correctAnswer = totalStat.toString();

    // Generate plausible wrong answers (±10%, ±20%, ±30% of correct value)
    const wrongAnswers = [
      Math.floor(totalStat * 0.9).toString(), // 10% lower
      Math.floor(totalStat * 1.15).toString(), // 15% higher
      Math.floor(totalStat * 0.75).toString(), // 25% lower
    ].filter((answer) => answer !== correctAnswer); // Remove if accidentally matches correct

    // Ensure we have exactly 3 unique wrong answers
    const uniqueWrong = [...new Set(wrongAnswers)];
    while (uniqueWrong.length < 3) {
      const variation = Math.floor(totalStat * (0.5 + Math.random() * 0.8));
      if (
        !uniqueWrong.includes(variation.toString()) &&
        variation.toString() !== correctAnswer
      ) {
        uniqueWrong.push(variation.toString());
      }
    }

    // Shuffle answers and track correct position
    const allAnswers = [correctAnswer, ...uniqueWrong.slice(0, 3)];
    let currentCorrectIndex = 0;

    // Fisher-Yates shuffle
    for (let i = allAnswers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allAnswers[i], allAnswers[j]] = [allAnswers[j], allAnswers[i]];

      // Track correct answer position
      if (i === currentCorrectIndex) currentCorrectIndex = j;
      else if (j === currentCorrectIndex) currentCorrectIndex = i;
    }

    // Step 6: Insert into Questions table
    const insertData = {
      segment_code: "BELL",
      question_text: questionText,
      answers: allAnswers as unknown as Json,
      correct_answer_index: currentCorrectIndex,
      difficulty: "easy", // Bellegoal questions are typically quick/easy
      api_source: "transfermarkt",
      api_params: {
        playerName,
        playerId,
        playerTransfermarktId: player.id,
        queryType: "player_statistics",
        statType,
        correctValue: totalStat,
      },
      total_answers_available: 4, // Fixed 4 answers for BELL questions
      answers_truncated: false,
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

    // Step 7: Insert metadata
    const metadataInsert = {
      question_id: questionId,
      generator_function: "generate-bell-question",
      api_endpoint: "/players/{id}/stats",
      cache_hit: true,
      generation_time_ms: generationTime,
    };

    const { error: metadataError } = await supabase
      .from("generated_questions_metadata")
      .insert(metadataInsert as any);

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
          statType,
          correctValue: totalStat,
          generationTime: `${generationTime}ms`,
          cached: true,
        },
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error generating bell question:", error);

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};

export const config: Config = {
  path: "/api/generate-bell-question",
};
