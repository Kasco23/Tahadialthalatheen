import { generateLocal, localLLMStatus, preloadLocalLLM } from './webGpuLLM';
import { HfInference } from '@huggingface/inference';

export interface UnifiedOptions {
  prefer?: 'auto' | 'local' | 'remote';
  modelLocal?: string;
  modelRemote?: string;
  maxLocalTokens?: number;
  maxRemoteTokens?: number;
  temperature?: number;
  minPromptLengthForRemote?: number; // if prompt longer than this, prefer remote
  systemPrompt?: string;
  cache?: boolean;
}

export interface UnifiedResult {
  text: string;
  source: 'local' | 'remote';
  elapsedMs: number;
  model: string;
  cached: boolean;
}

const remoteCache = new Map<string, UnifiedResult>();

function shouldUseRemote(prompt: string, opts: UnifiedOptions): boolean {
  if (opts.prefer === 'remote') return true;
  if (opts.prefer === 'local') return false;
  // auto strategy
  const status = localLLMStatus();
  if (!status.webgpuAvailable && !status.ready) return true; // no local acceleration available yet
  const threshold = opts.minPromptLengthForRemote ?? 600; // characters
  return prompt.length > threshold; // long prompts -> remote for better quality
}

export async function unifiedGenerate(prompt: string, opts: UnifiedOptions = {}): Promise<UnifiedResult> {
  if (!prompt.trim()) throw new Error('Prompt cannot be empty');
  const useRemote = shouldUseRemote(prompt, opts);
  const start = performance.now();

  if (!useRemote) {
    // Ensure model is ready (preload opportunistically)
    if (!localLLMStatus().ready) await preloadLocalLLM(opts.modelLocal);
    const local = await generateLocal(prompt, {
      model: opts.modelLocal,
      maxNewTokens: opts.maxLocalTokens ?? 128,
      temperature: opts.temperature,
      systemPrompt: opts.systemPrompt,
    });
    return {
      text: local.text,
      source: 'local',
      elapsedMs: local.elapsedMs,
      model: local.model,
      cached: false,
    };
  }

  // Remote path with optional caching
  const cacheKey = `${opts.modelRemote || 'meta-llama/Llama-3.2-3B-Instruct'}::${prompt}`;
  if (opts.cache && remoteCache.has(cacheKey)) {
    return { ...remoteCache.get(cacheKey)!, cached: true };
  }

  const apiKey = (import.meta as ImportMeta).env?.VITE_HF_API_KEY as string | undefined;
  if (!apiKey) throw new Error('Missing VITE_HF_API_KEY environment variable for remote inference');
  const hf = new HfInference(apiKey);
  const completion = await hf.textGeneration({
    model: opts.modelRemote || 'meta-llama/Llama-3.2-3B-Instruct',
    inputs: opts.systemPrompt ? `${opts.systemPrompt}\n\nUser: ${prompt}\nAssistant:` : prompt,
    parameters: {
      max_new_tokens: opts.maxRemoteTokens ?? 256,
      temperature: opts.temperature ?? 0.7,
    }
  });
  const text = completion.generated_text || '';
  const result: UnifiedResult = {
    text,
    source: 'remote',
    elapsedMs: performance.now() - start,
    model: opts.modelRemote || 'meta-llama/Llama-3.2-3B-Instruct',
    cached: false,
  };
  if (opts.cache) remoteCache.set(cacheKey, result);
  return result;
}

export function unifiedLLMStatus() {
  const local = localLLMStatus();
  return {
    localModel: local.model,
    localReady: local.ready,
    backend: local.backend,
    webgpuAvailable: local.webgpuAvailable,
    remoteCacheSize: remoteCache.size,
  };
}
