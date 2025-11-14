/**
 * webGpuLLM.ts
 * Client-side lightweight LLM utilities using @xenova/transformers.
 * Attempts WebGPU acceleration; falls back to WASM/CPU.
 */

export interface LocalGenerationOptions {
  model?: string;
  maxNewTokens?: number;
  temperature?: number;
  topK?: number;
  topP?: number;
  stopSequences?: string[];
  systemPrompt?: string;
}

export interface LocalGenerationResult {
  text: string;
  tokensGenerated: number;
  elapsedMs: number;
  backend: 'webgpu' | 'wasm';
  model: string;
}

type TextGenPipeline = (input: string, options: Record<string, unknown>) => Promise<unknown>;
let cachedPipeline: TextGenPipeline | null = null;
let cachedModelId: string | null = null;
let backendSelected: 'webgpu' | 'wasm' | null = null;

function canUseWebGPU(): boolean {
  return typeof navigator !== 'undefined' && 'gpu' in navigator;
}

function selectBackend(): 'webgpu' | 'wasm' {
  if (backendSelected) return backendSelected;
  backendSelected = canUseWebGPU() ? 'webgpu' : 'wasm';
  return backendSelected;
}

async function loadPipeline(modelId: string): Promise<TextGenPipeline> {
  if (cachedPipeline && cachedModelId === modelId) return cachedPipeline;
  const transformers = await import('@xenova/transformers');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { pipeline, env } = transformers as any;
  const backend = selectBackend();
  if (backend === 'wasm') {
    env.backends.onnx.wasm.numThreads = 1;
  }
  const textGen = await pipeline('text-generation', modelId);
  cachedPipeline = textGen as TextGenPipeline;
  cachedModelId = modelId;
  return cachedPipeline;
}

export async function generateLocal(
  prompt: string,
  options: LocalGenerationOptions = {}
): Promise<LocalGenerationResult> {
  if (!prompt || !prompt.trim()) throw new Error('Prompt cannot be empty');
  const model = options.model || 'Xenova/Phi-3-mini-4k-instruct';
  const maxNewTokens = options.maxNewTokens ?? 128;
  const temperature = options.temperature ?? 0.7;
  const topK = options.topK ?? 50;
  const topP = options.topP ?? 0.95;
  const systemPrompt = options.systemPrompt?.trim();
  const stopSequences = options.stopSequences || ['</s>'];
  const fullPrompt = systemPrompt ? `${systemPrompt}\n\nUser: ${prompt}\nAssistant:` : prompt;
  const start = performance.now();
  const pipe = await loadPipeline(model);
  const out = await pipe(fullPrompt, {
    max_new_tokens: maxNewTokens,
    temperature,
    top_k: topK,
    top_p: topP,
  });
  const backend = backendSelected as 'webgpu' | 'wasm';
  const rawText: string = Array.isArray(out) ? out[0]?.generated_text || '' : String(out);
  let finalText = rawText;
  for (const stop of stopSequences) {
    const idx = finalText.indexOf(stop);
    if (idx !== -1) {
      finalText = finalText.slice(0, idx);
      break;
    }
  }
  if (systemPrompt) finalText = finalText.replace(systemPrompt, '').trim();
  return {
    text: finalText.trim(),
    tokensGenerated: maxNewTokens,
    elapsedMs: performance.now() - start,
    backend,
    model,
  };
}

export function localLLMStatus() {
  return {
    model: cachedModelId,
    backend: backendSelected,
    ready: !!cachedPipeline,
    webgpuAvailable: canUseWebGPU(),
  };
}

export async function preloadLocalLLM(model?: string) {
  try {
    await loadPipeline(model || 'Xenova/Phi-3-mini-4k-instruct');
    return localLLMStatus();
  } catch (e) {
    console.warn('Local LLM preload failed:', e);
    return localLLMStatus();
  }
}
