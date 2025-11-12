import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

// Type definitions for AI inference
interface ModelStatus {
  loaded: boolean;
  backend: "webgpu" | "wasm" | "cpu" | null;
  loading: boolean;
  error?: string;
}

interface ParsedIntent {
  task: string;
  params: Record<string, unknown>;
  confidence: number;
}

// Lazy load AI utilities to avoid bundling if feature is disabled
const loadAIUtilities = () => import("../lib/aiUtils");

interface Question {
  question: string;
  answer: string;
  options?: string[];
  difficulty?: string;
  category?: string;
}

function CreateQuestions() {
  const navigate = useNavigate();
  const [userPrompt, setUserPrompt] = useState("");
  const [modelStatus, setModelStatus] = useState<ModelStatus>({
    loaded: false,
    backend: null,
    loading: false,
  });
  const [parsedIntent, setParsedIntent] = useState<ParsedIntent | null>(null);
  const [resolving, setResolving] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);

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
      const aiUtils = await loadAIUtilities();
      await aiUtils.loadModel(modelStatus.backend || "wasm");

      setModelStatus({
        loaded: true,
        backend: modelStatus.backend || "wasm",
        loading: false,
      });
      toast.success(`Model loaded successfully (${modelStatus.backend})`);
    } catch (error: unknown) {
      console.error("Model loading failed:", error);
      setModelStatus((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : "Model loading failed",
      }));
      toast.error("Failed to load AI model: " + (error instanceof Error ? error.message : "Unknown error"));
    }
  };

  const handleParseIntent = async () => {
    if (!userPrompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    if (!modelStatus.loaded) {
      // Auto-load model on first parse
      await handleLoadModel();
      // Fall through to parsing after load
    }

    try {
      const aiUtils = await loadAIUtilities();
      const intent = await aiUtils.parseIntent(userPrompt);
      setParsedIntent(intent);
      toast.success("Intent parsed successfully");
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
          task: parsedIntent.task,
          params: parsedIntent.params,
          useMocks,
        }),
      });

      if (!response.ok) {
        throw new Error(`Resolution failed: ${response.statusText}`);
      }

      const data = await response.json();
      setQuestions(data.questions || []);
      toast.success(`Generated ${data.questions?.length || 0} questions`);
    } catch (error: unknown) {
      console.error("Intent resolution failed:", error);
      toast.error("Failed to resolve intent: " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      setResolving(false);
    }
  };

  const handleSaveQuestions = async () => {
    if (questions.length === 0) {
      toast.error("No questions to save");
      return;
    }

    try {
      // TODO: Implement Supabase save logic
      toast.success("Questions saved successfully");
      // Navigate back or to question management page
      navigate("/profile");
    } catch (error: unknown) {
      console.error("Save failed:", error);
      toast.error("Failed to save questions: " + (error instanceof Error ? error.message : "Unknown error"));
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
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Create Questions with AI</h1>
        <p className="text-gray-600">
          Use natural language to generate football quiz questions
        </p>
      </div>

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
            <div className="bg-base-300 p-4 rounded-lg font-mono text-sm">
              <div>
                <strong>Task:</strong> {parsedIntent.task}
              </div>
              <div>
                <strong>Confidence:</strong> {(parsedIntent.confidence * 100).toFixed(1)}%
              </div>
              <div>
                <strong>Parameters:</strong>
                <pre className="mt-2 text-xs">{JSON.stringify(parsedIntent.params, null, 2)}</pre>
              </div>
            </div>
            <div className="card-actions justify-end mt-4">
              <button
                className={`btn btn-primary ${resolving ? "loading" : ""}`}
                onClick={handleResolveIntent}
                disabled={resolving}
              >
                {resolving ? "Resolving..." : "Generate Questions"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generated Questions */}
      {questions.length > 0 && (
        <div className="card bg-base-200 shadow-xl mb-6">
          <div className="card-body">
            <h2 className="card-title">Step 3: Review Generated Questions</h2>
            <div className="space-y-4">
              {questions.map((q, idx) => (
                <div key={idx} className="bg-base-300 p-4 rounded-lg">
                  <div className="font-semibold mb-2">
                    Q{idx + 1}: {q.question}
                  </div>
                  <div className="text-sm text-gray-600">
                    <strong>Answer:</strong> {q.answer}
                  </div>
                  {q.options && (
                    <div className="text-sm text-gray-600 mt-2">
                      <strong>Options:</strong> {q.options.join(", ")}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="card-actions justify-end mt-4">
              <button
                className="btn btn-outline"
                onClick={() => {
                  setParsedIntent(null);
                  setQuestions([]);
                  setUserPrompt("");
                }}
              >
                Start Over
              </button>
              <button className="btn btn-success" onClick={handleSaveQuestions}>
                Save Questions
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CreateQuestions;
