import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { parseIntent, validateIntent, type Intent } from "../lib/ai/intentParser";
import { supabase } from "../lib/supabaseClient";

// Type definitions for AI inference
interface ModelStatus {
  loaded: boolean;
  backend: "webgpu" | "wasm" | "cpu" | null;
  loading: boolean;
  error?: string;
}

interface Question {
  segment_code: string;
  question_text: string;
  answers: string[];
  correct_answer_index: number | null;
  api_source: string;
  total_answers_available: number;
  answers_truncated: boolean;
}

interface LocationState {
  sessionId?: string;
  sessionCode?: string;
  roundCounts?: {
    WDYK: number;
    AUCT: number;
    BELL: number;
    UPDW: number;
    REMO: number;
  };
}

function CreateQuestions() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;
  
  const [userPrompt, setUserPrompt] = useState("");
  const [modelStatus, setModelStatus] = useState<ModelStatus>({
    loaded: false,
    backend: null,
    loading: false,
  });
  const [parsedIntent, setParsedIntent] = useState<Intent | null>(null);
  const [resolving, setResolving] = useState(false);
  const [question, setQuestion] = useState<Question | null>(null);

  // Check if AI authoring is enabled
  const aiAuthoringEnabled = import.meta.env.VITE_ENABLE_AI_AUTHORING === "true";
  const useMocks = import.meta.env.VITE_USE_MOCKS === "true";

  // Detect WebGPU support on mount
  useEffect(() => {
    const checkWebGPU = async () => {
      if (!("gpu" in navigator)) {
        setModelStatus((prev) => ({
          ...prev,
          backend: "wasm",
          error: "WebGPU not available, will use WASM/CPU fallback",
        }));
        return;
      }

      try {
        const gpu = (navigator as { gpu?: { requestAdapter: () => Promise<unknown> } }).gpu;
        const adapter = await gpu?.requestAdapter();
        if (adapter) {
          setModelStatus((prev) => ({ ...prev, backend: "webgpu" }));
        } else {
          setModelStatus((prev) => ({
            ...prev,
            backend: "wasm",
            error: "WebGPU adapter not available",
          }));
        }
      } catch (error) {
        console.error("WebGPU check failed:", error);
        setModelStatus((prev) => ({
          ...prev,
          backend: "wasm",
          error: "WebGPU check failed, using fallback",
        }));
      }
    };

    checkWebGPU();
  }, []);

  const handleLoadModel = async () => {
    if (!aiAuthoringEnabled) {
      toast.error("AI authoring is not enabled. Set VITE_ENABLE_AI_AUTHORING=true");
      return;
    }

    setModelStatus((prev) => ({ ...prev, loading: true }));

    try {
      // For rules-first approach, no model loading needed
      // LLM model loads on-demand if rules fail
      setModelStatus({
        loaded: true,
        backend: modelStatus.backend || "wasm",
        loading: false,
      });
      toast.success("Parser ready (rules-first mode)");
    } catch (error: unknown) {
      console.error("Initialization failed:", error);
      setModelStatus((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : "Initialization failed",
      }));
      toast.error("Failed to initialize: " + (error instanceof Error ? error.message : "Unknown error"));
    }
  };

  const handleParseIntent = async () => {
    if (!userPrompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    if (!modelStatus.loaded) {
      // Auto-initialize on first parse
      await handleLoadModel();
    }

    try {
      const intent = await parseIntent(userPrompt, {
        allowLLMFallback: true,
        preferRules: true,
      });
      
      // Validate the parsed intent
      const validation = validateIntent(intent);
      if (!validation.valid) {
        toast.error("Invalid intent: " + validation.errors.join(", "));
        return;
      }
      
      setParsedIntent(intent);
      toast.success(`Intent parsed (${intent.metadata?.method || "unknown"} method)`);
    } catch (error: unknown) {
      console.error("Intent parsing failed:", error);
      toast.error("Failed to parse intent: " + (error instanceof Error ? error.message : "Unknown error"));
    }
  };

  const handleResolveIntent = async () => {
    if (!parsedIntent) {
      toast.error("Please parse intent first");
      return;
    }

    setResolving(true);

    try {
      const response = await fetch("/.netlify/functions/resolve-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intent: parsedIntent,
          useMocks,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Resolution failed: ${response.statusText}`);
      }

      const data = await response.json();
      setQuestion(data);
      toast.success("Answers fetched successfully");
    } catch (error: unknown) {
      console.error("Intent resolution failed:", error);
      toast.error("Failed to fetch answers: " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      setResolving(false);
    }
  };

  const handleSaveQuestion = async () => {
    if (!question) {
      toast.error("No question to save");
      return;
    }

    try {
      // Check authentication
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to save questions");
        return;
      }

      // Insert question into Questions table
      const { data: insertedQuestion, error: questionError } = await supabase
        .from("Questions")
        .insert({
          segment_code: question.segment_code,
          question_text: question.question_text,
          answers: question.answers,
          correct_answer_index: question.correct_answer_index,
          api_source: question.api_source as "manual" | "transfermarkt",
          api_params: parsedIntent?.constraints || null,
          total_answers_available: question.total_answers_available,
          answers_truncated: question.answers_truncated,
          difficulty: "medium", // Default, can be made configurable later
          metadata: {
            intent: parsedIntent,
            generated_at: new Date().toISOString(),
            user_id: user.id,
          },
        })
        .select("question_id")
        .single();

      if (questionError) {
        throw new Error(`Failed to insert question: ${questionError.message}`);
      }

      // Add to user's question bank
      const { error: bankError } = await supabase
        .from("question_bank")
        .insert({
          user_id: user.id,
          question_id: insertedQuestion.question_id,
          folder_name: "AI Generated",
          tags: [question.segment_code, parsedIntent?.task || "ai-generated"],
          notes: `Generated from prompt: "${userPrompt}"`,
        });

      if (bankError) {
        console.warn("Failed to add to question bank:", bankError.message);
        // Don't throw - question was saved, bank is just organization
      }

      toast.success("Question saved successfully!");
      
      // Reset state and navigate
      setParsedIntent(null);
      setQuestion(null);
      setUserPrompt("");
      
      // Navigate to profile after a brief delay to show toast
      setTimeout(() => {
        navigate("/profile");
      }, 1000);
    } catch (error: unknown) {
      console.error("Save failed:", error);
      toast.error("Failed to save question: " + (error instanceof Error ? error.message : "Unknown error"));
    }
  };

  if (!aiAuthoringEnabled) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <div className="alert alert-warning">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <div>
            <h3 className="font-bold">AI Authoring Disabled</h3>
            <p className="text-sm">
              Enable AI question authoring by setting <code>VITE_ENABLE_AI_AUTHORING=true</code> in
              your .env.local file.
            </p>
          </div>
        </div>
        <button className="btn btn-primary mt-4" onClick={() => navigate("/")}>
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Create Questions with AI</h1>
          <p className="text-gray-600">
            Use natural language to generate football quiz questions
          </p>
        </div>
        {state?.sessionCode && (
          <button
            onClick={() => navigate(`/game-setup/${state.sessionCode}`)}
            className="btn btn-outline btn-sm"
          >
            ← Back to Setup
          </button>
        )}
      </div>

      {/* Round Counts Info (if coming from GameSetup) */}
      {state?.roundCounts && (
        <div className="alert alert-info mb-6">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="flex-1">
            <h3 className="font-bold">Session Round Counts</h3>
            <div className="text-sm mt-1 flex gap-4 flex-wrap">
              <span>WDYK: {state.roundCounts.WDYK}</span>
              <span>AUCT: {state.roundCounts.AUCT}</span>
              <span>BELL: {state.roundCounts.BELL}</span>
              <span>UPDW: {state.roundCounts.UPDW}</span>
              <span>REMO: {state.roundCounts.REMO}</span>
            </div>
          </div>
        </div>
      )}

      {/* Backend Status Badge */}
      <div className="mb-6">
        <div className="badge badge-lg gap-2">
          {modelStatus.backend === "webgpu" && "🚀 GPU Accelerated"}
          {modelStatus.backend === "wasm" && "💻 CPU Mode"}
          {modelStatus.backend === "cpu" && "💻 CPU Mode"}
          {!modelStatus.backend && "⏳ Detecting..."}
        </div>
        {useMocks && (
          <div className="badge badge-warning badge-lg ml-2">
            🧪 Mock Mode
          </div>
        )}
        {modelStatus.error && (
          <div className="text-sm text-warning mt-2">{modelStatus.error}</div>
        )}
      </div>

      {/* Prompt Input */}
      <div className="card bg-base-200 shadow-xl mb-6">
        <div className="card-body">
          <h2 className="card-title">Step 1: Describe Your Questions</h2>
          
          {/* Example Prompts Dropdown */}
          <div className="mb-4">
            <details className="dropdown w-full">
              <summary className="btn btn-sm btn-outline m-1">
                💡 Example Prompts
              </summary>
              <ul className="p-2 shadow menu dropdown-content z-[1] bg-base-100 rounded-box w-full max-h-96 overflow-y-auto">
                <li>
                  <button
                    onClick={() =>
                      setUserPrompt(
                        "What are the stats for Messi in Champions League season 2014/15?"
                      )
                    }
                  >
                    Player stats in competition season
                  </button>
                </li>
                <li>
                  <button
                    onClick={() =>
                      setUserPrompt(
                        "List Manchester United squad from 2007/08 season"
                      )
                    }
                  >
                    Club squad by season
                  </button>
                </li>
                <li>
                  <button
                    onClick={() =>
                      setUserPrompt(
                        "Who won the Ballon d'Or in 2023?"
                      )
                    }
                  >
                    Achievement winner by year
                  </button>
                </li>
                <li>
                  <button
                    onClick={() =>
                      setUserPrompt(
                        "Find players who won La Liga with Barcelona and Serie A with Juventus"
                      )
                    }
                  >
                    Multi-country title winners
                  </button>
                </li>
                <li>
                  <button
                    onClick={() =>
                      setUserPrompt(
                        "Show players who won Champions League before 2010"
                      )
                    }
                  >
                    Players with trophy before/after year
                  </button>
                </li>
              </ul>
            </details>
          </div>

          <textarea
            className="textarea textarea-bordered h-32"
            placeholder="Example: Create 5 questions about Premier League top scorers in 2023"
            value={userPrompt}
            onChange={(e) => setUserPrompt(e.target.value)}
          />
          <div className="card-actions justify-end mt-4">
            {!modelStatus.loaded && !modelStatus.loading && (
              <button
                className="btn btn-secondary"
                onClick={handleLoadModel}
              >
                Load Model First
              </button>
            )}
            <button
              className={`btn btn-primary ${modelStatus.loading ? "loading" : ""}`}
              onClick={handleParseIntent}
              disabled={!userPrompt.trim() || modelStatus.loading}
            >
              {modelStatus.loading ? "Loading Model..." : "Parse Intent"}
            </button>
          </div>
        </div>
      </div>

      {/* Parsed Intent Display */}
      {parsedIntent && (
        <div className="card bg-base-200 shadow-xl mb-6">
          <div className="card-body">
            <h2 className="card-title">Step 2: Parsed Intent</h2>
            <div className="bg-base-300 p-4 rounded-lg font-mono text-sm space-y-2">
              <div>
                <strong>Segment:</strong> {parsedIntent.segment}
              </div>
              <div>
                <strong>Task:</strong> {parsedIntent.task}
              </div>
              <div>
                <strong>Method:</strong> {parsedIntent.metadata?.method || "unknown"}
              </div>
              <div>
                <strong>Confidence:</strong> {((parsedIntent.metadata?.confidence || 0) * 100).toFixed(1)}%
              </div>
              {parsedIntent.constraints && Object.keys(parsedIntent.constraints).length > 0 && (
                <div>
                  <strong>Constraints:</strong>
                  <pre className="mt-2 text-xs">{JSON.stringify(parsedIntent.constraints, null, 2)}</pre>
                </div>
              )}
              {parsedIntent.timeframe && (
                <div>
                  <strong>Timeframe:</strong>
                  <pre className="mt-2 text-xs">{JSON.stringify(parsedIntent.timeframe, null, 2)}</pre>
                </div>
              )}
            </div>
            <div className="card-actions justify-end mt-4">
              <button
                className={`btn btn-primary ${resolving ? "loading" : ""}`}
                onClick={handleResolveIntent}
                disabled={resolving}
              >
                {resolving ? "Fetching Answers..." : "Fetch Answers"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generated Question */}
      {question && (
        <div className="card bg-base-200 shadow-xl mb-6">
          <div className="card-body">
            <h2 className="card-title">Step 3: Review Generated Question</h2>
            <div className="bg-base-300 p-4 rounded-lg space-y-3">
              <div>
                <strong className="text-sm">Segment:</strong>
                <div className="badge badge-primary ml-2">{question.segment_code}</div>
              </div>
              <div>
                <strong className="text-sm">Question:</strong>
                <div className="mt-1">{question.question_text}</div>
              </div>
              <div>
                <strong className="text-sm">Answers ({question.total_answers_available}):</strong>
                <div className="flex flex-wrap gap-2 mt-2">
                  {question.answers.map((answer, idx) => (
                    <div 
                      key={idx} 
                      className={`badge ${question.correct_answer_index === idx ? "badge-success" : "badge-neutral"}`}
                    >
                      {answer}
                    </div>
                  ))}
                </div>
                {question.answers_truncated && (
                  <div className="text-xs text-warning mt-1">
                    ⚠️ Answers truncated (more available than shown)
                  </div>
                )}
              </div>
              <div className="text-xs text-gray-500 mt-2">
                Source: {question.api_source}
              </div>
            </div>
            <div className="card-actions justify-end mt-4">
              <button
                className="btn btn-outline"
                onClick={() => {
                  setParsedIntent(null);
                  setQuestion(null);
                  setUserPrompt("");
                }}
              >
                Start Over
              </button>
              <button className="btn btn-success" onClick={handleSaveQuestion}>
                Save Question
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CreateQuestions;
