import React, { useState } from 'react';
import { generateLocal, localLLMStatus, preloadLocalLLM } from '../lib/ai/webGpuLLM';
import { HfInference } from '@huggingface/inference';

interface RemoteOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export const LLMConsole: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'local' | 'remote'>('local');
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState(localLLMStatus());

  async function handlePreload() {
    setLoading(true);
    await preloadLocalLLM();
    setStatus(localLLMStatus());
    setLoading(false);
  }

  async function runLocal() {
    setLoading(true);
    setError(null);
    try {
      const result = await generateLocal(prompt, {
        maxNewTokens: 96,
        systemPrompt: 'You are a concise football knowledge assistant.'
      });
      setOutput(result.text);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function runRemote(opts: RemoteOptions = {}) {
    setLoading(true);
    setError(null);
    try {
  const apiKey = (import.meta as ImportMeta).env?.VITE_HF_API_KEY as string | undefined;
      if (!apiKey) throw new Error('Missing VITE_HF_API_KEY environment variable');
      const hf = new HfInference(apiKey);
      const completion = await hf.textGeneration({
        model: opts.model || 'meta-llama/Llama-3.2-3B-Instruct',
        inputs: prompt,
        parameters: { max_new_tokens: opts.maxTokens || 128, temperature: opts.temperature || 0.7 }
      });
      setOutput(completion.generated_text || '');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRun() {
    if (mode === 'local') return runLocal();
    return runRemote();
  }

  return (
    <div className="p-4 border rounded bg-base-200 space-y-3 max-w-xl">
      <h2 className="text-lg font-semibold">LLM Console</h2>
      <div className="text-sm text-gray-500">Backend: {status.backend || 'not-loaded'} | WebGPU: {String(status.webgpuAvailable)} | Model: {status.model || 'none'}</div>
      <textarea
        className="textarea textarea-bordered w-full h-32"
        placeholder="Enter football question..."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />
      <div className="flex gap-2 items-center flex-wrap">
        <button className="btn btn-sm" disabled={loading} onClick={handlePreload}>Preload Local</button>
        <button className="btn btn-sm" disabled={loading} onClick={handleRun}>{loading ? 'Running...' : (mode === 'local' ? 'Run Local' : 'Run Remote')}</button>
        <select className="select select-sm" value={mode} onChange={(e) => setMode(e.target.value as 'local' | 'remote')}>
          <option value="local">Local (WebGPU/WASM)</option>
          <option value="remote">Remote (HF)</option>
        </select>
      </div>
      {error && <div className="text-error text-sm">Error: {error}</div>}
      {output && <div className="p-2 rounded bg-base-100 border text-sm whitespace-pre-wrap">{output}</div>}
    </div>
  );
};

export default LLMConsole;
