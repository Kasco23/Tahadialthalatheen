/**
 * LLM Loader Module
 * Separate module for loading Transformers.js to allow easy mocking in tests
 */

let llmModelLoaded = false;

/**
 * Load Transformers.js LLM model
 * This is an optional dependency
 */
export async function loadTransformersModel(): Promise<void> {
  if (llmModelLoaded) return;

  try {
    // @ts-expect-error - Optional dependency
    const transformers = await import("@xenova/transformers");
    const { pipeline, env } = transformers;
    
    // Configure for WASM backend
    env.backends.onnx.wasm.numThreads = 1;
    
    // Load classification model
    await pipeline(
      "text-classification",
      "Xenova/distilbert-base-uncased-finetuned-sst-2-english",
      { device: "wasm" }
    );
    
    llmModelLoaded = true;
    console.log("✅ Transformers.js model loaded");
  } catch (_error) {
    throw new Error(
      "@xenova/transformers not installed. Install with: pnpm add @xenova/transformers"
    );
  }
}

export function isTransformersLoaded(): boolean {
  return llmModelLoaded;
}
