import React, { useState } from 'react';
import LLMConsole from '../components/LLMConsole';

interface QuestionGenerationResult {
  questionId: string;
  question: string;
  answers: string[];
  metadata: {
    season: string;
    totalPlayers: number;
    truncated: boolean;
    finals: {
      ucl: string;
      uel: string;
      uecl: string;
    };
  };
}

/**
 * DebugLLM Page
 * Development-only route exposing the LLMConsole for experimenting
 * with local WebGPU/WASM inference vs remote Hugging Face inference.
 * Also includes testing tools for Netlify serverless functions.
 */
const DebugLLM: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QuestionGenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [season, setSeason] = useState("2023/24");

  const handleGenerateFinalsQuestion = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Mock generatedBy for testing (in production, use actual profile ID)
      const mockProfileId = "00000000-0000-0000-0000-000000000000";
      
      const response = await fetch("/.netlify/functions/generate-wdyk-final-losers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          season,
          generatedBy: mockProfileId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details || "Failed to generate question");
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">LLM Debug Console</h1>
      <p className="text-sm opacity-80">
        This page is only available in development mode. It lets you compare local in-browser
        model generation against remote inference for football-related prompts. Local generation
        uses a tiny instruct model and attempts WebGPU acceleration when available.
      </p>
      
      {/* Question Generator Testing Section */}
      <div className="border border-base-300 rounded-lg p-4 bg-base-200">
        <h2 className="text-xl font-semibold mb-3">🏆 European Finals Question Generator</h2>
        <p className="text-sm opacity-70 mb-4">
          Test the WDYK losing squads question generator. This calls the Netlify function
          that aggregates players from UCL, UEL, and UECL final losing teams.
        </p>
        
        <div className="flex gap-3 items-end mb-4">
          <div className="form-control flex-1">
            <label className="label">
              <span className="label-text">Season</span>
            </label>
            <select 
              className="select select-bordered select-sm"
              value={season}
              onChange={(e) => setSeason(e.target.value)}
              disabled={loading}
            >
              <option value="2022/23">2022/23</option>
              <option value="2023/24">2023/24</option>
            </select>
          </div>
          
          <button
            className="btn btn-primary btn-sm"
            onClick={handleGenerateFinalsQuestion}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="loading loading-spinner loading-xs"></span>
                Generating...
              </>
            ) : (
              "Generate Question"
            )}
          </button>
        </div>

        {error && (
          <div className="alert alert-error">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {result && (
          <div className="space-y-3">
            <div className="alert alert-success">
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Question generated successfully!</span>
            </div>

            <div className="bg-base-100 p-4 rounded-lg space-y-2">
              <div>
                <span className="font-semibold">Question ID:</span>
                <code className="ml-2 text-xs bg-base-300 px-2 py-1 rounded">{result.questionId}</code>
              </div>
              
              <div>
                <span className="font-semibold">Question:</span>
                <p className="text-sm mt-1">{result.question}</p>
              </div>
              
              <div>
                <span className="font-semibold">Metadata:</span>
                <ul className="text-sm mt-1 space-y-1 ml-4 list-disc">
                  <li>Season: {result.metadata.season}</li>
                  <li>Total Players: {result.metadata.totalPlayers}</li>
                  <li>Truncated: {result.metadata.truncated ? "Yes" : "No"}</li>
                  <li>Finals:
                    <ul className="ml-4 list-circle">
                      <li>UCL: {result.metadata.finals.ucl}</li>
                      <li>UEL: {result.metadata.finals.uel}</li>
                      <li>UECL: {result.metadata.finals.uecl}</li>
                    </ul>
                  </li>
                </ul>
              </div>

              <details className="collapse collapse-arrow bg-base-200">
                <summary className="collapse-title font-medium text-sm">
                  View Answers ({result.answers.length} shown)
                </summary>
                <div className="collapse-content">
                  <div className="grid grid-cols-2 gap-1 text-xs max-h-60 overflow-y-auto">
                    {result.answers.map((answer: string, idx: number) => (
                      <div key={idx} className="px-2 py-1 bg-base-100 rounded">
                        {idx + 1}. {answer}
                      </div>
                    ))}
                  </div>
                </div>
              </details>
            </div>
          </div>
        )}
      </div>

      <LLMConsole />
    </div>
  );
};

export default DebugLLM;

