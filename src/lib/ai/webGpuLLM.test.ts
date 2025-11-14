import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateLocal, localLLMStatus } from './webGpuLLM';

// Mock dynamic import of @xenova/transformers
vi.mock('@xenova/transformers', () => {
  return {
    pipeline: async () => async (input: string) => [{ generated_text: input + ' <eos>' }],
    env: { backends: { onnx: { wasm: { numThreads: 0 } } } }
  };
});

describe('webGpuLLM', () => {
  beforeEach(() => {
    // @ts-expect-error test override for navigator
    global.navigator = { gpu: {} };
  });

  it('should generate text locally', async () => {
    const result = await generateLocal('Test prompt');
    expect(result.text.toLowerCase()).toContain('test prompt');
    expect(result.backend === 'webgpu' || result.backend === 'wasm').toBe(true);
  });

  it('should throw on empty prompt', async () => {
    await expect(generateLocal('')).rejects.toThrow();
  });

  it('status should reflect readiness after generation', async () => {
    await generateLocal('Another prompt');
    const status = localLLMStatus();
    expect(status.ready).toBe(true);
  });
});
