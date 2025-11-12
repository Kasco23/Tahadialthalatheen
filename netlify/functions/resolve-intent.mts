import type { Context, Config } from "@netlify/functions";

/**
 * Resolve Intent Function
 * 
 * Takes parsed intent from the AI model and resolves it to concrete questions
 * Supports mock mode for fast dev iteration without hitting external APIs
 * 
 * Request body (JSON):
 * {
 *   "task": string,                 // Intent task type
 *   "params": object,                // Task parameters
 *   "useMocks": boolean              // Whether to use fixture data
 * }
 * 
 * Response:
 * {
 *   "questions": array,              // Generated questions
 *   "metadata": object               // Resolution metadata
 * }
 */

interface ResolveIntentRequest {
  task: string;
  params: Record<string, unknown>;
  useMocks?: boolean;
}

interface Question {
  question: string;
  answer: string;
  options?: string[];
  difficulty?: string;
  category?: string;
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
    const body: ResolveIntentRequest = await req.json();
    const { task, params, useMocks = false } = body;

    console.log(`🎯 Resolving intent: ${task}`, { params, useMocks });

    // Mock mode: Load fixtures instead of calling APIs
    if (useMocks) {
      return handleMockMode(task, params);
    }

    // Real mode: Switch based on task type
    switch (task) {
      case "generate_questions":
        return await handleGenerateQuestions(params);

      case "top_scorers":
        return await handleTopScorers(params);

      case "transfers":
        return await handleTransfers(params);

      case "team_squad":
        return await handleTeamSquad(params);

      case "general_query":
        return await handleGeneralQuery(params);

      default:
        return new Response(
          JSON.stringify({
            error: `Unknown task: ${task}`,
            questions: [],
          }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
    }
  } catch (error: unknown) {
    console.error("❌ Error resolving intent:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
        questions: [],
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

/**
 * Mock mode handler - returns fixture data
 */
function handleMockMode(task: string, params: Record<string, unknown>) {
  console.log("🧪 Using mock mode");

  // TODO: Load from src/fixtures/transfermarkt/{task}.json
  // For now, return hardcoded mocks

  const mockQuestions: Record<string, Question[]> = {
    generate_questions: [
      {
        question: "Who won the Premier League Golden Boot in 2023?",
        answer: "Erling Haaland",
        options: ["Erling Haaland", "Harry Kane", "Mohamed Salah", "Bukayo Saka"],
        difficulty: "medium",
        category: "Premier League",
      },
      {
        question: "Which club signed Jude Bellingham in 2023?",
        answer: "Real Madrid",
        options: ["Real Madrid", "Barcelona", "Bayern Munich", "Liverpool"],
        difficulty: "easy",
        category: "Transfers",
      },
    ],
    top_scorers: [
      {
        question: "Who was the top scorer in Premier League 2023?",
        answer: "Erling Haaland",
        options: ["Erling Haaland", "Harry Kane", "Ivan Toney", "Callum Wilson"],
        difficulty: "medium",
      },
    ],
    transfers: [
      {
        question: "Which player transferred from Dortmund to Real Madrid in 2023?",
        answer: "Jude Bellingham",
        options: ["Jude Bellingham", "Jadon Sancho", "Marco Reus", "Youssoufa Moukoko"],
        difficulty: "easy",
      },
    ],
    team_squad: [
      {
        question: "Name 5 players from Manchester City's 2023 squad",
        answer: "Multiple correct answers",
        difficulty: "medium",
        category: "Squads",
      },
    ],
  };

  const questions = mockQuestions[task] || [];

  return new Response(
    JSON.stringify({
      questions,
      metadata: {
        task,
        params,
        mock: true,
        count: questions.length,
      },
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}

/**
 * Generate general questions based on topic
 */
async function handleGenerateQuestions(params: Record<string, unknown>) {
  const count = (params.count as number) || 5;
  const topic = (params.topic as string) || "football";

  console.log(`📝 Generating ${count} questions about: ${topic}`);

  // TODO: Integrate with Transfermarkt API or use existing question generators
  // For now, return placeholder

  const questions: Question[] = Array.from({ length: count }, (_, i) => ({
    question: `Question ${i + 1} about ${topic}`,
    answer: `Answer ${i + 1}`,
    difficulty: "medium",
  }));

  return new Response(
    JSON.stringify({
      questions,
      metadata: {
        task: "generate_questions",
        params,
        count: questions.length,
      },
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}

/**
 * Generate questions about top scorers
 */
async function handleTopScorers(params: Record<string, unknown>) {
  const league = (params.league as string) || "premier-league";
  const season = (params.season as string) || new Date().getFullYear().toString();

  console.log(`⚽ Fetching top scorers for ${league} ${season}`);

  // TODO: Use transfermarktCache helpers
  // Example: getLeagueTopScorers(league, season)

  const questions: Question[] = [
    {
      question: `Who was the top scorer in ${league} for the ${season} season?`,
      answer: "Placeholder Answer",
      difficulty: "medium",
      category: "Scorers",
    },
  ];

  return new Response(
    JSON.stringify({
      questions,
      metadata: {
        task: "top_scorers",
        params,
        count: questions.length,
      },
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}

/**
 * Generate questions about transfers
 */
async function handleTransfers(params: Record<string, unknown>) {
  const season = (params.season as string) || new Date().getFullYear().toString();

  console.log(`🔄 Fetching transfers for ${season}`);

  // TODO: Use transfermarktCache helpers
  // Example: getSeasonTransfers(season)

  const questions: Question[] = [
    {
      question: `Which major transfer happened in ${season}?`,
      answer: "Placeholder Transfer",
      difficulty: "medium",
      category: "Transfers",
    },
  ];

  return new Response(
    JSON.stringify({
      questions,
      metadata: {
        task: "transfers",
        params,
        count: questions.length,
      },
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}

/**
 * Generate questions about team squads
 */
async function handleTeamSquad(params: Record<string, unknown>) {
  const team = (params.team as string) || "Unknown Team";

  console.log(`👥 Fetching squad for ${team}`);

  // TODO: Use getClubPlayersCached from transfermarktCache

  const questions: Question[] = [
    {
      question: `Name 5 players from ${team}'s current squad`,
      answer: "Multiple answers accepted",
      difficulty: "medium",
      category: "Squads",
    },
  ];

  return new Response(
    JSON.stringify({
      questions,
      metadata: {
        task: "team_squad",
        params,
        count: questions.length,
      },
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}

/**
 * Handle general query fallback
 */
async function handleGeneralQuery(params: Record<string, unknown>) {
  const query = (params.query as string) || "";

  console.log(`❓ General query: ${query}`);

  const questions: Question[] = [
    {
      question: `General question based on: ${query}`,
      answer: "Placeholder answer",
      difficulty: "medium",
    },
  ];

  return new Response(
    JSON.stringify({
      questions,
      metadata: {
        task: "general_query",
        params,
        count: questions.length,
      },
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}

export const config: Config = {
  path: "/api/resolve-intent",
};
