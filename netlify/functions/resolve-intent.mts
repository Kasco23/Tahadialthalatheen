import type { Context, Config } from "@netlify/functions";
import {
  searchPlayerCached,
  getPlayerStatsCached,
  getPlayerTransfersCached,
  getClubPlayersCached,
  getPlayerAchievementsCached,
} from "../../src/lib/api/transfermarktCache";

/**
 * Resolve Intent Function
 * 
 * Takes parsed Intent JSON from the AI intent parser and resolves it to DB-ready questions
 * Supports mock mode for fast dev iteration without hitting external APIs
 * 
 * Request body (JSON):
 * {
 *   "intent": Intent,              // Parsed intent from intentParser
 *   "useMocks": boolean            // Whether to use fixture data
 * }
 * 
 * Response (DB-ready payload matching Questions table):
 * {
 *   "segment_code": "WDYK"|"BELL"|"REMO"|"UPDW",
 *   "question_text": string,
 *   "answers": string[],
 *   "correct_answer_index": number|null,
 *   "api_source": "transfermarkt",
 *   "api_params": { intent: Intent, resolved_ids?: any },
 *   "total_answers_available": number,
 *   "answers_truncated": boolean
 * }
 */

// ============================================================================
// Types
// ============================================================================

type SegmentCode = "WDYK" | "BELL" | "REMO" | "UPDW" | "AUCTION";

interface Intent {
  segment: SegmentCode;
  task: string;
  constraints?: Record<string, unknown>;
  timeframe?: {
    from?: string | null;
    to?: string | null;
  };
  limit?: number;
  metadata?: {
    method: "rules" | "wasm-llm" | "ai-backend";
    confidence: number;
    fallback?: boolean;
    originalPrompt?: string;
  };
  // NEW: Support AI-first intent format
  rawPrompt?: string;
  method?: "ai-backend";
  confidence?: number;
}

interface ResolveIntentRequest {
  intent: Intent;
  useMocks?: boolean;
}

interface DBReadyQuestion {
  segment_code: SegmentCode;
  question_text: string;
  answers: string[];
  correct_answer_index: number | null;
  api_source: "transfermarkt" | "intent-gen";
  api_params: {
    intent: Intent;
    resolved_ids?: unknown;
    intentHash?: string;
  };
  total_answers_available: number;
  answers_truncated: boolean;
}

// ============================================================================
// Validation Helpers
// ============================================================================

interface ValidationResult {
  valid: boolean;
  error?: string;
  suggestion?: string;
}

function validateIntent(intent: Intent): ValidationResult {
  // Check required fields
  if (!intent.segment || !intent.task) {
    return {
      valid: false,
      error: "Intent must have 'segment' and 'task' fields",
    };
  }

  // Check segment is valid
  const validSegments: SegmentCode[] = ["WDYK", "BELL", "REMO", "UPDW", "AUCTION"];
  if (!validSegments.includes(intent.segment)) {
    return {
      valid: false,
      error: `Invalid segment: ${intent.segment}`,
      suggestion: `Must be one of: ${validSegments.join(", ")}`,
    };
  }

  // Task-specific validation
  if (!intent.constraints) {
    return {
      valid: false,
      error: "Intent must have 'constraints' object",
      suggestion: "Try phrasing your request more specifically (e.g., include player name, team, season)",
    };
  }

  // Validate based on task
  switch (intent.task) {
    case "club_squad_by_season":
      if (!intent.constraints.clubName || !intent.constraints.season) {
        return {
          valid: false,
          error: "Club squad queries require 'clubName' and 'season'",
          suggestion: "Try: 'List Manchester United squad from 2007/08 season'",
        };
      }
      break;

    case "player_stats_in_competition_season":
      if (!intent.constraints.playerName || !intent.constraints.competition) {
        return {
          valid: false,
          error: "Player stats queries require 'playerName' and 'competition'",
          suggestion: "Try: 'How many goals did Messi score in Champions League 2014/15?'",
        };
      }
      break;

    case "achievement_by_year":
      if (!intent.constraints.trophy || !intent.constraints.year) {
        return {
          valid: false,
          error: "Achievement queries require 'trophy' and 'year'",
          suggestion: "Try: 'Who won the Ballon d\\'Or in 2023?'",
        };
      }
      break;

    case "players_with_titles_multiple_countries":
      if (!intent.constraints.leagues || !Array.isArray(intent.constraints.leagues)) {
        return {
          valid: false,
          error: "Multi-country title queries require 'leagues' array",
          suggestion: "Try: 'Find players who won La Liga with Barcelona and Serie A with Juventus'",
        };
      }
      break;
  }

  return { valid: true };
}

const MAX_ANSWERS = 100; // Cap for WDYK questions

function truncateAnswers(answers: string[], maxCount: number = MAX_ANSWERS): {
  truncated: string[];
  wasTruncated: boolean;
  total: number;
} {
  const total = answers.length;
  const truncated = answers.slice(0, maxCount);
  return {
    truncated,
    wasTruncated: total > maxCount,
    total,
  };
}

// ============================================================================
// Main Handler
// ============================================================================

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
    const body: ResolveIntentRequest = await req.json();
    const { useMocks = false } = body;
    let { intent } = body;

    // ========================================================================
    // AI-FIRST INTENT ADAPTER
    // ========================================================================
    // NEW: Check if this is the new AI-first intent format (has rawPrompt)
    // If so, use a simple keyword-based parser to convert to old format
    // TODO: Replace this with actual AI (OpenAI/Claude API) for production
    if ('rawPrompt' in intent && intent.rawPrompt) {
      console.log(`🤖 AI-first intent detected, converting from: "${intent.rawPrompt}"`);
      
      const rawPrompt = intent.rawPrompt.toLowerCase();
      
      // Simple keyword-based detection for demo
      if (rawPrompt.includes("la liga") && (rawPrompt.includes("top scorer") || rawPrompt.includes("scorer"))) {
        // Convert to old format for BELL segment
        intent = {
          segment: "BELL" as SegmentCode,
          task: "top_scorers_by_competition",
          constraints: {
            competition: "La Liga",
            season: "2023/24", // Default to last season
            limit: 10
          },
          metadata: {
            method: "ai-backend" as const,
            confidence: 0.8,
            originalPrompt: intent.rawPrompt
          }
        };
        console.log(`✅ Converted to structured intent:`, intent);
      } else {
        // Generic fallback
        intent = {
          segment: "WDYK" as SegmentCode,
          task: "general_query",
          constraints: {
            rawPrompt: intent.rawPrompt
          },
          metadata: {
            method: "ai-backend" as const,
            confidence: 0.5,
            originalPrompt: intent.rawPrompt
          }
        };
        console.log(`⚠️ Generic intent fallback:`, intent);
      }
    }
    // ========================================================================

    // Validate intent structure
    const validation = validateIntent(intent);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({
          error: validation.error,
          suggestion: validation.suggestion,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`🎯 Resolving intent: ${intent.task}`, { 
      segment: intent.segment, 
      useMocks 
    });

    // Mock mode: Load fixtures instead of calling APIs
    if (useMocks) {
      return handleMockMode(intent);
    }

    // Real mode: Route based on task type
    const result = await resolveIntent(intent);

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("❌ Error resolving intent:", error);
    
    // Parse user-friendly error messages
    let errorMessage = "Internal server error";
    let userSuggestion: string | undefined;

    if (error instanceof Error) {
      if (error.message.includes("not found") || error.message.includes("No results")) {
        errorMessage = "Couldn't find data matching your request";
        userSuggestion = "Try a different player name, team, or season";
      } else if (error.message.includes("rate limit")) {
        errorMessage = "API rate limit reached";
        userSuggestion = "Please wait a moment and try again";
      } else if (error.message.includes("timeout")) {
        errorMessage = "Request timed out";
        userSuggestion = "The data source is slow right now. Try again in a moment";
      } else if (error.message.includes("Not enough")) {
        errorMessage = error.message; // Already user-friendly
        userSuggestion = "Try broadening your search criteria";
      } else {
        errorMessage = error.message;
      }
    }

    return new Response(
      JSON.stringify({
        error: errorMessage,
        suggestion: userSuggestion,
        debug: error instanceof Error ? error.stack : undefined,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

// ============================================================================
// Intent Resolution Router
// ============================================================================

async function resolveIntent(intent: Intent): Promise<DBReadyQuestion> {
  switch (intent.task) {
    case "players_won_league_titles_in_multiple_countries":
      return await resolvePlayersWithTitlesMultipleCountries(intent);
    
    case "club_squad_by_season":
      return await resolveClubSquadBySeason(intent);
    
    case "player_stats_by_competition":
    case "player_stats_general":
      return await resolvePlayerStats(intent);
    
    case "after_x_before_y":
      return await resolveAfterBeforeQuery(intent);
    
    case "achievement_by_year":
    case "achievement_query":
      return await resolveAchievementByYear(intent);
    
    default:
      throw new Error(`Unsupported task: ${intent.task}`);
  }
}

// ============================================================================
// Task Resolvers
// ============================================================================

/**
 * Task 1: Players who won league titles in multiple countries (top 5 leagues)
 */
async function resolvePlayersWithTitlesMultipleCountries(
  intent: Intent
): Promise<DBReadyQuestion> {
  const constraints = intent.constraints || {};
  const leagues = constraints.leagues as string || "top5";
  const minCountries = (constraints.min_countries as number) || 2;

  // For MVP, return a placeholder that would be resolved by querying player achievements
  // In production, this would:
  // 1. Query all players with league titles (champions)
  // 2. Group by player and count distinct countries
  // 3. Filter by minCountries threshold
  
  console.log(`🔍 Resolving: Players with titles in ${minCountries}+ countries (${leagues})`);

  // TODO: Implement proper resolution using getPlayerAchievementsCached
  // For now, return structure with known examples
  
  const allAnswers = [
    "Zlatan Ibrahimović",
    "David Alaba",
    "Arjen Robben",
    "Thiago Alcântara",
    "Samuel Eto'o",
    "Clarence Seedorf",
    "Gerard Piqué",
    "Xabi Alonso",
    "Pepe Reina",
    "Deco",
  ];

  // Apply truncation if needed
  const { truncated, wasTruncated, total } = truncateAnswers(allAnswers);

  // Validate minimum answer count
  if (truncated.length < 3) {
    throw new Error(`Not enough players found matching this filter (found ${total}, need at least 3). Try broadening your search criteria.`);
  }

  return {
    segment_code: "WDYK",
    question_text: `Name players who won league titles in at least ${minCountries} different ${leagues === "top5" ? "top 5 European" : ""} countries`,
    answers: truncated,
    correct_answer_index: null, // Multiple correct answers
    api_source: "transfermarkt",
    api_params: {
      intent,
      resolved_ids: { task: "multi_country_titles", leagues, minCountries },
    },
    total_answers_available: total,
    answers_truncated: wasTruncated,
  };
}

/**
 * Task 2: Club squad by season (WDYK)
 */
async function resolveClubSquadBySeason(intent: Intent): Promise<DBReadyQuestion> {
  const constraints = intent.constraints || {};
  const clubName = constraints.clubName as string;
  const season = constraints.season as string;

  if (!clubName || !season) {
    throw new Error("Missing clubName or season in constraints");
  }

  console.log(`� Resolving: ${clubName} squad for ${season}`);

  // Step 1: Search for club
  // For MVP, we need a searchClubCached function (not yet implemented)
  // Placeholder logic:
  
  // Step 2: Get club players for that season
  // const clubId = "searched_club_id";
  // const playersData = await getClubPlayersCached(clubId, season);

  // For now, return mock structure
  const answers = [
    "Example Player 1",
    "Example Player 2",
    "Example Player 3",
  ];

  return {
    segment_code: "WDYK",
    question_text: `Name players from ${clubName}'s squad in ${season}`,
    answers,
    correct_answer_index: null,
    api_source: "transfermarkt",
    api_params: {
      intent,
      resolved_ids: { clubName, season },
    },
    total_answers_available: answers.length,
    answers_truncated: false,
  };
}

/**
 * Task 3: Player stat totals (BELL)
 */
async function resolvePlayerStats(intent: Intent): Promise<DBReadyQuestion> {
  const constraints = intent.constraints || {};
  const playerName = constraints.playerName as string;
  const competition = constraints.competition as string;
  const season = constraints.season as string;
  const scope = constraints.scope as string || "career";

  if (!playerName) {
    throw new Error("Missing playerName in constraints");
  }

  console.log(`🔍 Resolving: Stats for ${playerName}`);

  // Step 1: Search for player
  const searchData = await searchPlayerCached(playerName);
  if (!searchData.results || searchData.results.length === 0) {
    throw new Error(`Player not found: ${playerName}`);
  }

  const player = searchData.results[0];
  const playerId = player.id;

  // Step 2: Get player stats
  const statsData = await getPlayerStatsCached(playerId);

  // Filter stats by competition and season if specified
  let relevantStats = statsData.stats || [];
  
  if (competition) {
    relevantStats = relevantStats.filter((s: { competitionName: string }) => 
      s.competitionName?.toLowerCase().includes(competition.toLowerCase())
    );
  }
  
  if (season) {
    relevantStats = relevantStats.filter((s: { seasonId: string }) => 
      s.seasonId === season
    );
  }

  // Generate question based on stats
  const totalGoals = relevantStats.reduce((sum: number, s) => sum + (s.goals || 0), 0);
  const totalAssists = relevantStats.reduce((sum: number, s) => sum + (s.assists || 0), 0);

  const questionText = competition
    ? `How many goals did ${player.name} score in ${competition}${season ? ` (${season})` : ""}?`
    : `How many career goals has ${player.name} scored?`;

  return {
    segment_code: "BELL",
    question_text: questionText,
    answers: [String(totalGoals)],
    correct_answer_index: 0,
    api_source: "transfermarkt",
    api_params: {
      intent,
      resolved_ids: { playerId, playerName: player.name },
    },
    total_answers_available: 1,
    answers_truncated: false,
  };
}

/**
 * Task 4: After X before Y (REMO)
 */
async function resolveAfterBeforeQuery(intent: Intent): Promise<DBReadyQuestion> {
  const timeframe = intent.timeframe || {};
  const from = timeframe.from as string;
  const to = timeframe.to as string;

  if (!from || !to) {
    throw new Error("Missing timeframe in intent");
  }

  console.log(`� Resolving: After "${from}" before "${to}"`);

  // For MVP, this would parse club names from the timeframe and query transfers
  // TODO: Implement with getPlayerTransfersCached
  
  return {
    segment_code: "REMO",
    question_text: `What happened after ${from} but before ${to}?`,
    answers: ["Example transfer or event"],
    correct_answer_index: 0,
    api_source: "transfermarkt",
    api_params: {
      intent,
      resolved_ids: { from, to },
    },
    total_answers_available: 1,
    answers_truncated: false,
  };
}

/**
 * Task 5: Achievement by year (UPDW)
 */
async function resolveAchievementByYear(intent: Intent): Promise<DBReadyQuestion> {
  const constraints = intent.constraints || {};
  const trophy = constraints.trophy as string;
  const year = constraints.year as number;

  if (!trophy || !year) {
    throw new Error("Missing trophy or year in constraints");
  }

  console.log(`� Resolving: ${trophy} winner in ${year}`);

  // For MVP, this would query historical achievements
  // TODO: Implement with getPlayerAchievementsCached or competition data
  
  return {
    segment_code: "UPDW",
    question_text: `Who won the ${trophy} in ${year}?`,
    answers: ["Example winner"],
    correct_answer_index: 0,
    api_source: "transfermarkt",
    api_params: {
      intent,
      resolved_ids: { trophy, year },
    },
    total_answers_available: 1,
    answers_truncated: false,
  };
}

// ============================================================================
// Mock Mode Handler
// ============================================================================

function handleMockMode(intent: Intent) {
  console.log("🧪 Using mock mode");

  // Return mock data based on segment type
  const mockAnswers: Record<string, string[]> = {
    WDYK: ["Cristiano Ronaldo", "Lionel Messi", "Neymar Jr", "Kylian Mbappé", "Erling Haaland"],
    BELL: ["42"], // Mock stat answer
    REMO: ["Joined Manchester City"],
    UPDW: ["Lionel Messi"],
    AUCTION: ["€100 million"],
  };

  const answers = mockAnswers[intent.segment] || ["Mock Answer"];

  const result: DBReadyQuestion = {
    segment_code: intent.segment,
    question_text: `Mock question for ${intent.task}`,
    answers,
    correct_answer_index: intent.segment === "BELL" || intent.segment === "UPDW" ? 0 : null,
    api_source: "intent-gen",
    api_params: {
      intent,
      intentHash: "mock-hash-123",
    },
    total_answers_available: answers.length,
    answers_truncated: false,
  };

  return new Response(
    JSON.stringify(result),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}

export const config: Config = {
  path: "/api/resolve-intent",
};
