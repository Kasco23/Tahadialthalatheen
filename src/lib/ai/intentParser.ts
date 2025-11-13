/**
 * AI-First Intent Parser
 * 
 * Philosophy: Don't try to predict all possible questions with regex patterns.
 * Instead, pass the raw prompt to the backend where actual AI (OpenAI/Claude/local LLM)
 * can intelligently understand the user's intent.
 * 
 * This frontend parser just packages the prompt and sends it to the backend.
 */

export type ParserMode = "ai-backend" | "gpu" | "cpu";

export interface Intent {
  rawPrompt: string;
  method: "ai-backend";
  confidence: number;
  segment?: string;
  taskType?: string;
}

export interface ParserOptions {
  mode?: ParserMode;
  timeout?: number;
}

/**
 * Parse user's natural language question into a structured Intent.
 * 
 * This is intentionally simple - just wrap the prompt and send to backend.
 * The backend will use actual AI to understand what the user is asking for.
 * 
 * @param prompt - Raw user input (e.g., "Who was La Liga top scorer last season?")
 * @param options - Parser configuration
 * @returns Intent object with raw prompt for backend processing
 */
export async function parseIntent(
  prompt: string,
  _options: ParserOptions = {}
): Promise<Intent> {
  // Validate input
  if (!prompt || prompt.trim().length === 0) {
    throw new Error("Prompt cannot be empty");
  }

  // Clean the prompt
  const cleanedPrompt = prompt.trim();

  // Return a simple intent that delegates all understanding to the backend
  return {
    rawPrompt: cleanedPrompt,
    method: "ai-backend",
    confidence: 1.0, // We're confident the backend AI can handle this
  };
}

/**
 * Initialize the parser (no-op for AI-backend mode)
 */
export async function initParser(mode: ParserMode = "ai-backend"): Promise<void> {
  // No initialization needed - backend handles all AI processing
  console.log(`✅ Parser ready (${mode} mode - backend AI will process all prompts)`);
}

/**
 * Validate intent structure
 */
export function validateIntent(intent: Intent): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!intent.rawPrompt) {
    errors.push("Missing raw prompt");
  }

  if (!intent.method) {
    errors.push("Missing method");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
