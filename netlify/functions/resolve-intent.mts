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
    method: "rules" | "wasm-llm";
    confidence: number;
    fallback?: boolean;
  };
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
    const { intent, useMocks = false } = body;

    if (!intent || !intent.segment || !intent.task) {
      return new Response(
        JSON.stringify({ error: "Invalid intent structure" }),
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
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
        details: error instanceof Error ? error.stack : undefined,
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
  
  const answers = [
    "Zlatan Ibrahimović",
    "David Alaba",
    "Arjen Robben",
    "Thiago Alcântara",
    "Samuel Eto'o",
  ];

  return {
    segment_code: "WDYK",
    question_text: `Name players who won league titles in at least ${minCountries} different ${leagues === "top5" ? "top 5 European" : ""} countries`,
    answers,
    correct_answer_index: null, // Multiple correct answers
    api_source: "transfermarkt",
    api_params: {
      intent,
      resolved_ids: { task: "multi_country_titles", leagues, minCountries },
    },
    total_answers_available: answers.length,
    answers_truncated: false,
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
