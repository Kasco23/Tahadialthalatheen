/**
 * AI Utilities for intent parsing and model management
 * Uses Transformers.js for lightweight on-device inference
 */

// Simple in-memory model state
let modelLoaded = false;
let modelBackend: "webgpu" | "wasm" | "cpu" | null = null;

/**
 * Load the AI model for intent parsing
 * In production, this would load a tiny LLM (e.g., TinyLlama, Phi-2)
 * For now, we use rule-based parsing with plans to integrate Transformers.js
 */
export async function loadModel(backend: "webgpu" | "wasm" | "cpu" = "wasm"): Promise<void> {
  // Simulate model loading
  await new Promise((resolve) => setTimeout(resolve, 1000));

  modelLoaded = true;
  modelBackend = backend;

  console.log(`✅ AI model loaded with ${backend} backend`);
}

/**
 * Parse user intent from natural language prompt
 * Uses rule-based pattern matching for now
 * TODO: Replace with tiny LLM when Transformers.js is integrated
 */
export async function parseIntent(prompt: string): Promise<{
  task: string;
  params: Record<string, unknown>;
  confidence: number;
}> {
  if (!modelLoaded) {
    throw new Error("Model not loaded. Call loadModel() first.");
  }

  const lowerPrompt = prompt.toLowerCase();

  // Rule-based intent detection (v1 - simple pattern matching)
  // TODO: Replace with LLM-based parsing in Phase 2

  // Pattern: "create X questions about Y"
  const createPattern = /create\s+(\d+)\s+questions?\s+about\s+(.+)/i;
  const createMatch = prompt.match(createPattern);

  if (createMatch) {
    const [, count, topic] = createMatch;
    return {
      task: "generate_questions",
      params: {
        count: parseInt(count, 10),
        topic: topic.trim(),
      },
      confidence: 0.85,
    };
  }

  // Pattern: "top scorers in [league] [year]"
  if (lowerPrompt.includes("top scorer") || lowerPrompt.includes("leading scorer")) {
    const yearMatch = prompt.match(/\b(20\d{2})\b/);
    const leaguePatterns = {
      "premier league": "premier-league",
      "la liga": "laliga",
      "serie a": "serie-a",
      "bundesliga": "bundesliga",
      "ligue 1": "ligue-1",
    };

    let league = "premier-league"; // default
    for (const [name, slug] of Object.entries(leaguePatterns)) {
      if (lowerPrompt.includes(name)) {
        league = slug;
        break;
      }
    }

    return {
      task: "top_scorers",
      params: {
        league,
        season: yearMatch ? yearMatch[1] : new Date().getFullYear().toString(),
      },
      confidence: 0.75,
    };
  }

  // Pattern: "player transfers"
  if (lowerPrompt.includes("transfer") || lowerPrompt.includes("signing")) {
    const yearMatch = prompt.match(/\b(20\d{2})\b/);

    return {
      task: "transfers",
      params: {
        season: yearMatch ? yearMatch[1] : new Date().getFullYear().toString(),
      },
      confidence: 0.7,
    };
  }

  // Pattern: "team squad" or "lineup"
  if (lowerPrompt.includes("squad") || lowerPrompt.includes("lineup") || lowerPrompt.includes("roster")) {
    const teamPattern = /(?:squad|lineup|roster)\s+(?:of|for)\s+(.+?)(?:\s+in|\s+for|\s+20\d{2}|$)/i;
    const teamMatch = prompt.match(teamPattern);

    return {
      task: "team_squad",
      params: {
        team: teamMatch ? teamMatch[1].trim() : "unknown",
      },
      confidence: 0.65,
    };
  }

  // Default fallback
  return {
    task: "general_query",
    params: {
      query: prompt,
    },
    confidence: 0.4,
  };
}

/**
 * Check if model is loaded
 */
export function isModelLoaded(): boolean {
  return modelLoaded;
}

/**
 * Get current backend
 */
export function getBackend(): string | null {
  return modelBackend;
}
