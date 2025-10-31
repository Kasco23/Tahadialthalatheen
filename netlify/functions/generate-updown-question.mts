import type { Context, Config } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
import type { Database, Json } from "../../src/lib/types/supabase";
import { 
  searchPlayerCached, 
  getPlayerAchievementsCached 
} from "../../src/lib/api/transfermarktCache";

/**
 * Generate Up & Down Question
 * 
 * Creates difficulty-rated questions about player achievements and honors
 * Example: "Which trophy did Lionel Messi win in 2022?"
 * 
 * Request body (JSON):
 * {
 *   "playerName": string,           // Player name to search for
 *   "sessionId": string,            // UUID of the session (optional, for tracking)
 *   "generatedBy": string,          // UUID of the profile generating the question
 *   "difficulty": "easy" | "medium" | "hard" // Difficulty level
 * }
 * 
 * Response:
 * {
 *   "questionId": string,           // UUID of generated question
 *   "question": string,             // The question text
 *   "answers": string[],            // Array of trophy/achievement names
 *   "correct_answer_index": number, // Index of correct answer
 *   "metadata": object              // Generation metadata
 * }
 */

interface GenerateUpDownQuestionRequest {
  playerName: string;
  sessionId?: string;
  generatedBy: string;
  difficulty?: "easy" | "medium" | "hard";
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
    const body: GenerateUpDownQuestionRequest = await req.json();
    const { playerName, sessionId, generatedBy, difficulty = "medium" } = body;

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

    // Step 2: Get player achievements
    const achievementsData = await getPlayerAchievementsCached(playerId);

    if (!achievementsData || !achievementsData.achievements || achievementsData.achievements.length === 0) {
      return new Response(
        JSON.stringify({ error: `No achievements found for player: ${player.name}` }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Step 3: Filter achievements based on difficulty
    // Easy: Major trophies (World Cup, Champions League, League titles)
    // Medium: Secondary trophies (Domestic cups, Super cups)
    // Hard: Individual awards (Golden Ball, Golden Boot, etc.)
    
    const majorTrophies = ["World Cup", "Champions League", "UEFA Champions League", "Copa América", 
                          "European Championship", "Premier League", "La Liga", "Serie A", "Bundesliga"];
    const secondaryTrophies = ["FA Cup", "Copa del Rey", "DFB-Pokal", "UEFA Super Cup", "Club World Cup"];
    const individualAwards = ["Golden Ball", "Golden Boot", "Player of the Year", "Best Player"];

    let filteredAchievements = achievementsData.achievements;
    
    if (difficulty === "easy") {
      filteredAchievements = achievementsData.achievements.filter(ach => 
        majorTrophies.some(trophy => ach.title?.includes(trophy))
      );
    } else if (difficulty === "medium") {
      filteredAchievements = achievementsData.achievements.filter(ach => 
        secondaryTrophies.some(trophy => ach.title?.includes(trophy))
      );
    } else if (difficulty === "hard") {
      filteredAchievements = achievementsData.achievements.filter(ach => 
        individualAwards.some(award => ach.title?.includes(award))
      );
    }

    // Fallback to all achievements if filter is too restrictive
    if (filteredAchievements.length === 0) {
      filteredAchievements = achievementsData.achievements;
    }

    if (filteredAchievements.length < 4) {
      return new Response(
        JSON.stringify({ 
          error: `Insufficient achievements for ${player.name} at ${difficulty} difficulty (${filteredAchievements.length} found)` 
        }),
        { status: 422, headers: { "Content-Type": "application/json" } }
      );
    }

    // Step 4: Pick a random achievement as the correct answer
    const randomIndex = Math.floor(Math.random() * filteredAchievements.length);
    const correctAchievement = filteredAchievements[randomIndex];
    const correctAnswer = correctAchievement.title;
    
    // Extract year from first detail entry if available
    const achievementYear = correctAchievement.details?.[0]?.season?.name || "his career";

    // Generate question
    const questionText = `Which trophy did ${player.name} win in ${achievementYear}?`;

    // Step 5: Generate wrong answers from other achievements or common trophies
    const wrongAnswers: string[] = [];
    
    // Try to use other achievements from the same player
    for (const ach of filteredAchievements) {
      const achYear = ach.details?.[0]?.season?.name;
      if (ach.title !== correctAnswer && achYear !== achievementYear) {
        wrongAnswers.push(ach.title);
        if (wrongAnswers.length >= 3) break;
      }
    }

    // If not enough wrong answers, add generic common trophies
    if (wrongAnswers.length < 3) {
      const genericTrophies = [
        "UEFA Europa League", "FA Cup", "Copa del Rey", "DFB-Pokal",
        "League Cup", "UEFA Super Cup", "FIFA Club World Cup"
      ].filter(trophy => trophy !== correctAnswer && !wrongAnswers.includes(trophy));
      
      wrongAnswers.push(...genericTrophies.slice(0, 3 - wrongAnswers.length));
    }

    // Ensure exactly 3 unique wrong answers
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

    // Step 6: Insert into Questions table
    const insertData = {
      segment_code: "UPDW",
      question_text: questionText,
      answers: allAnswers as unknown as Json,
      correct_answer_index: currentCorrectIndex,
      difficulty,
      api_source: "transfermarkt",
      api_params: {
        playerName,
        playerId,
        playerTransfermarktId: player.id,
        queryType: "player_achievements",
        correctTrophy: correctAnswer,
        year: achievementYear
      },
      total_answers_available: filteredAchievements.length,
      answers_truncated: filteredAchievements.length > 4
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
      generator_function: "generate-updown-question",
      api_endpoint: "/players/{id}/achievements",
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

    // Step 8: Return success response
    return new Response(
      JSON.stringify({
        questionId,
        question: questionText,
        answers: allAnswers,
        correct_answer_index: currentCorrectIndex,
        metadata: {
          playerName: player.name,
          difficulty,
          correctTrophy: correctAnswer,
          year: achievementYear,
          totalAchievements: filteredAchievements.length,
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
    console.error("Error generating up-down question:", error);
    
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
  path: "/api/generate-updown-question"
};
