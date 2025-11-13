/**
 * Intent Parser for AI Question Authoring
 * 
 * Uses rules-first approach with Transformers.js wasm LLM fallback
 * Parses natural language into structured Intent JSON for question generation
 */

// ============================================================================
// Types
// ============================================================================

export type SegmentCode = "WDYK" | "BELL" | "REMO" | "UPDW" | "AUCTION";

export interface Intent {
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

// ============================================================================
// Rule-Based Pattern Matching
// ============================================================================

interface Pattern {
  regex: RegExp;
  segment: SegmentCode;
  task: string;
  extractor: (match: RegExpMatchArray, prompt: string) => Partial<Intent>;
}

const patterns: Pattern[] = [
  // WDYK: Club squad by season
  {
    regex: /(?:squad|team|players?)\s+(?:at|from|for|of)\s+([a-z\s]+?)\s+(?:in|during|season)\s*(\d{4}(?:[-/]\d{2,4})?)/i,
    segment: "WDYK",
    task: "club_squad_by_season",
    extractor: (match) => ({
      constraints: {
        clubName: match[1].trim(),
        season: match[2],
      },
    }),
  },

  // WDYK: Players with titles in multiple countries (top 5 leagues)
  {
    regex: /players?\s+(?:who\s+)?(?:won|with|having)\s+(?:league\s+)?(?:titles?|championships?|trophies)\s+in\s+(?:multiple|different|several)\s+(?:countries|leagues)/i,
    segment: "WDYK",
    task: "players_won_league_titles_in_multiple_countries",
    extractor: (_match, prompt) => {
      const topFiveMatch = /top\s*5|top\s*five|major\s+leagues/i.test(prompt);
      const minCountriesMatch = prompt.match(/(?:at least|minimum|min)\s*(\d+)/i);
      
      return {
        constraints: {
          leagues: topFiveMatch ? "top5" : "all",
          min_countries: minCountriesMatch ? parseInt(minCountriesMatch[1]) : 2,
        },
      };
    },
  },

  // BELL: Player stat totals by competition/season
  {
    regex: /(?:stats?|goals?|assists?|appearances?)\s+(?:for|of|by)\s+([A-Z][a-z]+(?:\s+[A-Z]?[a-z]+)?)\s+in\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:season\s+)?(\d{4}(?:[-/]\d{2,4})?)/,
    segment: "BELL",
    task: "player_stats_by_competition",
    extractor: (match) => ({
      constraints: {
        playerName: match[1].trim(),
        competition: match[2].trim(),
        season: match[3],
      },
    }),
  },

  // REMO: After X before Y (transfers/achievements)
  {
    regex: /(?:after|following)\s+([a-z0-9\s]+?)\s+(?:but\s+)?before\s+([a-z0-9\s]+)/i,
    segment: "REMO",
    task: "after_x_before_y",
    extractor: (match) => ({
      timeframe: {
        from: match[1].trim(),
        to: match[2].trim(),
      },
      constraints: {
        eventType: "transfer", // Can be refined based on context
      },
    }),
  },

  // UPDW: Trophy/achievement by year
  {
    regex: /who\s+won\s+(?:the\s+)?([A-Z][a-zA-Z'\s-]+?)\s+in\s+(\d{4})/,
    segment: "UPDW",
    task: "achievement_by_year",
    extractor: (match) => ({
      constraints: {
        trophy: match[1].trim(),
        year: parseInt(match[2]),
      },
    }),
  },

  // WDYK: General player search
  {
    regex: /players?\s+(?:named|called)\s+([a-z\s]+)/i,
    segment: "WDYK",
    task: "player_search",
    extractor: (match) => ({
      constraints: {
        playerName: match[1].trim(),
      },
    }),
  },

  // AUCTION: Player value/fee patterns
  {
    regex: /(?:transfer\s+fee|market\s+value|worth)\s+(?:of|for)\s+([a-z\s]+)/i,
    segment: "AUCTION",
    task: "player_market_value",
    extractor: (match) => ({
      constraints: {
        playerName: match[1].trim(),
      },
    }),
  },
];

/**
 * Attempt to parse intent using rule-based pattern matching
 */
function parseWithRules(prompt: string): Intent | null {
  const normalizedPrompt = prompt.trim();

  for (const pattern of patterns) {
    const match = normalizedPrompt.match(pattern.regex);
    if (match) {
      const extracted = pattern.extractor(match, normalizedPrompt);
      
      return {
        segment: pattern.segment,
        task: pattern.task,
        ...extracted,
        metadata: {
          method: "rules",
          confidence: 0.85,
        },
      };
    }
  }

  return null;
}

// ============================================================================
// WASM LLM Fallback (Transformers.js)
// ============================================================================

const llmModelLoaded = false;

/**
 * Load tiny LLM model for intent classification
 * Uses Transformers.js with ONNX/WASM backend
 * 
 * NOTE: This requires @xenova/transformers to be installed
 * For MVP, this is optional - rules-first approach handles most cases
 */
async function loadLLMModel(): Promise<void> {
  if (llmModelLoaded) return;

  try {
    // TODO: Implement transformers.js loading when package is installed
    // For now, throw error indicating it's not available
    throw new Error(
      "@xenova/transformers not installed. LLM fallback unavailable. " +
      "Install with: pnpm add @xenova/transformers"
    );
  } catch (error) {
    console.error("❌ Failed to load LLM model:", error);
    throw new Error("LLM model loading failed: " + (error instanceof Error ? error.message : "Unknown error"));
  }
}

/**
 * Parse intent using tiny LLM model
 * This is a fallback when rule-based parsing fails
 */
async function parseWithLLM(prompt: string): Promise<Intent> {
  if (!llmModelLoaded) {
    await loadLLMModel();
  }

  try {
    // For MVP, use a simple heuristic approach with keyword detection
    // A production system would fine-tune a model on intent classification
    
    const segment = detectSegment(prompt);
    const task = detectTask(prompt, segment);
    const constraints = extractConstraints(prompt);
    
    return {
      segment,
      task,
      constraints,
      metadata: {
        method: "wasm-llm",
        confidence: 0.6, // Lower confidence for LLM fallback
        fallback: true,
      },
    };
  } catch (error) {
    console.error("❌ LLM parsing failed:", error);
    
    // Ultimate fallback: return a generic intent
    return {
      segment: "WDYK",
      task: "general_query",
      constraints: { rawPrompt: prompt },
      metadata: {
        method: "wasm-llm",
        confidence: 0.3,
        fallback: true,
      },
    };
  }
}

/**
 * Detect segment from prompt using keyword heuristics
 */
function detectSegment(prompt: string): SegmentCode {
  const lowerPrompt = prompt.toLowerCase();
  
  const segmentKeywords: Array<[SegmentCode, string[]]> = [
    ["BELL", ["stat", "goal", "assist"]],
    ["REMO", ["after", "before"]],
    ["UPDW", ["won", "champion", "winner"]],
    ["AUCTION", ["transfer", "value", "fee"]],
  ];
  
  for (const [segment, keywords] of segmentKeywords) {
    if (keywords.every(kw => lowerPrompt.includes(kw)) || 
        keywords.some(kw => lowerPrompt.includes(kw))) {
      return segment;
    }
  }
  
  return "WDYK";
}

/**
 * Detect task based on segment and prompt
 */
function detectTask(_prompt: string, segment: SegmentCode): string {
  switch (segment) {
    case "BELL":
      return "player_stats_general";
    case "REMO":
      return "after_x_before_y";
    case "UPDW":
      return "achievement_query";
    case "AUCTION":
      return "transfer_query";
    default:
      return "general_query";
  }
}

/**
 * Extract constraints from prompt
 */
function extractConstraints(prompt: string): Record<string, unknown> {
  const constraints: Record<string, unknown> = {};
  
  // Extract year mentions
  const yearMatch = prompt.match(/\b(19|20)\d{2}\b/);
  if (yearMatch) {
    constraints.year = yearMatch[0];
  }
  
  // Extract player names (simple heuristic: capitalized words)
  const capitalizedWords = prompt.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g);
  if (capitalizedWords && capitalizedWords.length > 0) {
    constraints.playerName = capitalizedWords[0];
  }
  
  return constraints;
}

// ============================================================================
// Main Parser Interface
// ============================================================================

/**
 * Parse natural language prompt into Intent JSON
 * 
 * Strategy:
 * 1. Try rule-based parsing first (fast, accurate for known patterns)
 * 2. Fall back to tiny LLM if rules fail (slower, more flexible)
 * 
 * @param prompt - Natural language question description
 * @param options - Parser options
 * @returns Parsed Intent or throws error
 */
export async function parseIntent(
  prompt: string,
  options: {
    allowLLMFallback?: boolean;
    preferRules?: boolean;
  } = {}
): Promise<Intent> {
  const { allowLLMFallback = true, preferRules = true } = options;

  if (!prompt || prompt.trim().length === 0) {
    throw new Error("Prompt cannot be empty");
  }

  // Step 1: Try rule-based parsing
  if (preferRules) {
    const rulesResult = parseWithRules(prompt);
    if (rulesResult) {
      console.log("✅ Parsed with rules:", rulesResult);
      return rulesResult;
    }
  }

  // Step 2: Fall back to LLM if allowed
  if (allowLLMFallback) {
    console.log("🔄 Rules failed, falling back to LLM...");
    const llmResult = await parseWithLLM(prompt);
    console.log("✅ Parsed with LLM:", llmResult);
    return llmResult;
  }

  // No fallback allowed and rules failed
  throw new Error("Failed to parse intent: No matching rules and LLM fallback disabled");
}

/**
 * Check if LLM model is ready
 */
export function isLLMModelLoaded(): boolean {
  return llmModelLoaded;
}

/**
 * Preload LLM model for faster first parse
 */
export async function preloadLLM(): Promise<void> {
  await loadLLMModel();
}

/**
 * Validate intent structure
 */
export function validateIntent(intent: Intent): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!intent.segment) {
    errors.push("Missing segment code");
  }

  if (!intent.task) {
    errors.push("Missing task description");
  }

  const validSegments: SegmentCode[] = ["WDYK", "BELL", "REMO", "UPDW", "AUCTION"];
  if (intent.segment && !validSegments.includes(intent.segment)) {
    errors.push(`Invalid segment: ${intent.segment}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
