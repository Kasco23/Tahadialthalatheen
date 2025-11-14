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
  const [manualMode, setManualMode] = useState(false);

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

    try {
      const intent = await parseIntent(userPrompt);
      
      // Validate the parsed intent
      const validation = validateIntent(intent);
      if (!validation.valid) {
        toast.error("Invalid intent: " + validation.errors.join(", "));
        return;
      }
      
      setParsedIntent(intent);
      toast.success(`Intent parsed (${intent.method} method - backend AI will process)`);
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
      const response = await fetch("/api/resolve-intent", {
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
          api_params: parsedIntent ? { rawPrompt: parsedIntent.rawPrompt } : null,
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
    <div className="min-h-screen bg-linear-to-br from-green-900 via-green-800 to-green-900">
      {/* Football pitch pattern background */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: `
          repeating-linear-gradient(90deg, transparent, transparent 50px, rgba(255,255,255,0.1) 50px, rgba(255,255,255,0.1) 51px),
          repeating-linear-gradient(0deg, transparent, transparent 50px, rgba(255,255,255,0.1) 50px, rgba(255,255,255,0.1) 51px)
        `
      }}></div>
      
      <div className="container mx-auto p-6 max-w-5xl relative z-10">
        {/* Header with football theme */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 mb-6 border-4 border-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="text-6xl">⚽</div>
              <div>
                <h1 className="text-4xl font-black mb-2 bg-linear-to-r from-green-700 to-green-900 bg-clip-text text-transparent">
                  AI Question Generator
                </h1>
                <p className="text-gray-600 font-medium">
                  Powered by AI • Create professional football quiz questions
                </p>
              </div>
            </div>
            {state?.sessionCode && (
              <button
                onClick={() => navigate(`/game-setup/${state.sessionCode}`)}
                className="btn btn-ghost gap-2 text-gray-700 hover:bg-green-100"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                Back to Setup
              </button>
            )}
          </div>
        </div>

        {/* Round Counts Info */}
        {state?.roundCounts && (
          <div className="bg-linear-to-r from-blue-50 to-blue-100 rounded-xl p-6 mb-6 border-l-4 border-blue-500 shadow-lg">
            <div className="flex items-start gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 shrink-0 mt-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <h3 className="font-bold text-blue-900 text-lg mb-2">Session Configuration</h3>
                <div className="flex gap-4 flex-wrap">
                  {Object.entries(state.roundCounts).map(([key, value]) => (
                    <div key={key} className="bg-white px-4 py-2 rounded-lg shadow-sm border border-blue-200">
                      <span className="font-bold text-blue-900">{key}:</span>
                      <span className="ml-2 text-gray-700">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Status Bar */}
        <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-4 mb-6 border border-gray-200">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div className="flex gap-3 flex-wrap">
              <div className="flex items-center gap-2 px-4 py-2 bg-linear-to-r from-green-600 to-green-700 text-white rounded-lg shadow-md font-semibold">
                {modelStatus.backend === "webgpu" && (
                  <>
                    <span>🚀</span>
                    <span>GPU Accelerated</span>
                  </>
                )}
                {(modelStatus.backend === "wasm" || modelStatus.backend === "cpu") && (
                  <>
                    <span>💻</span>
                    <span>CPU Mode</span>
                  </>
                )}
                {!modelStatus.backend && (
                  <>
                    <span>⏳</span>
                    <span>Detecting...</span>
                  </>
                )}
              </div>
              {useMocks && (
                <div className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg shadow-md font-semibold">
                  <span>🧪</span>
                  <span>Mock Mode</span>
                </div>
              )}
              {modelStatus.error && (
                <div className="text-sm text-orange-600 font-medium bg-orange-50 px-3 py-2 rounded-lg">
                  {modelStatus.error}
                </div>
              )}
            </div>
            
            {!manualMode && (
              <button
                className="btn btn-sm gap-2 bg-white border-2 border-gray-300 hover:border-green-600 hover:bg-green-50"
                onClick={() => {
                  setManualMode(true);
                  toast("Manual mode coming soon! For now, use 'Manage Questions' in GameSetup.", { icon: "✏️" });
                }}
              >
                <span>✏️</span>
                <span>Manual Entry</span>
              </button>
            )}
          </div>
        </div>

        {/* Prompt Input */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl mb-6 border-2 border-green-200 overflow-hidden">
          <div className="bg-linear-to-r from-green-600 to-green-700 px-8 py-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <span className="text-3xl">📝</span>
              <span>Step 1: Describe Your Question</span>
            </h2>
          </div>
          
          <div className="p-8">
            {/* Example Prompts */}
            <div className="mb-6">
              <details className="dropdown w-full">
                <summary className="btn btn-outline border-2 border-green-500 hover:bg-green-50 hover:border-green-600 gap-2 w-full justify-start font-semibold">
                  <span className="text-xl">💡</span>
                  <span>View Example Prompts</span>
                </summary>
                <ul className="p-2 shadow-xl menu dropdown-content z-1 bg-white rounded-xl w-full max-h-96 overflow-y-auto border-2 border-green-200 mt-2">
                  <li>
                    <button
                      onClick={() => setUserPrompt("What are the stats for Messi in Champions League season 2014/15?")}
                      className="hover:bg-green-50 rounded-lg p-3 text-left"
                    >
                      <div className="font-semibold text-green-800">Player stats in competition season</div>
                      <div className="text-sm text-gray-600">"What are the stats for Messi in Champions League season 2014/15?"</div>
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => setUserPrompt("List Manchester United squad from 2007/08 season")}
                      className="hover:bg-green-50 rounded-lg p-3 text-left"
                    >
                      <div className="font-semibold text-green-800">Club squad by season</div>
                      <div className="text-sm text-gray-600">"List Manchester United squad from 2007/08 season"</div>
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => setUserPrompt("Who won the Ballon d'Or in 2023?")}
                      className="hover:bg-green-50 rounded-lg p-3 text-left"
                    >
                      <div className="font-semibold text-green-800">Achievement winner by year</div>
                      <div className="text-sm text-gray-600">"Who won the Ballon d'Or in 2023?"</div>
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => setUserPrompt("Find players who won La Liga with Barcelona and Serie A with Juventus")}
                      className="hover:bg-green-50 rounded-lg p-3 text-left"
                    >
                      <div className="font-semibold text-green-800">Multi-country title winners</div>
                      <div className="text-sm text-gray-600">"Find players who won La Liga with Barcelona and Serie A with Juventus"</div>
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => setUserPrompt("Show players who won Champions League before 2010")}
                      className="hover:bg-green-50 rounded-lg p-3 text-left"
                    >
                      <div className="font-semibold text-green-800">Players with trophy before/after year</div>
                      <div className="text-sm text-gray-600">"Show players who won Champions League before 2010"</div>
                    </button>
                  </li>
                </ul>
              </details>
            </div>

            <textarea
              className="textarea textarea-bordered w-full h-32 text-lg border-2 border-gray-300 focus:border-green-500 rounded-xl resize-none"
              placeholder="Example: Create questions about Premier League top scorers in 2023..."
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
            />
            
            <div className="flex justify-end gap-3 mt-6">
              {!modelStatus.loaded && !modelStatus.loading && (
                <button
                  className="btn btn-lg gap-2 bg-blue-600 hover:bg-blue-700 text-white border-none shadow-lg"
                  onClick={handleLoadModel}
                >
                  <span>⚡</span>
                  <span>Load AI Model</span>
                </button>
              )}
              <button
                className={`btn btn-lg gap-2 bg-green-600 hover:bg-green-700 text-white border-none shadow-lg ${modelStatus.loading ? "loading" : ""}`}
                onClick={handleParseIntent}
                disabled={!userPrompt.trim() || modelStatus.loading}
              >
                {!modelStatus.loading && <span>🔍</span>}
                <span>{modelStatus.loading ? "Loading Model..." : "Analyze Intent"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Parsed Intent Display */}
        {parsedIntent && (
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl mb-6 border-2 border-blue-200 overflow-hidden">
            <div className="bg-linear-to-r from-blue-600 to-blue-700 px-8 py-4">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <span className="text-3xl">🎯</span>
                <span>Step 2: Intent Analysis</span>
              </h2>
            </div>
            
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-linear-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                  <div className="text-sm font-semibold text-blue-700 mb-1">Segment Type</div>
                  <div className="text-2xl font-bold text-blue-900">{parsedIntent.segment || "Backend AI Processing"}</div>
                </div>
                <div className="bg-linear-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
                  <div className="text-sm font-semibold text-purple-700 mb-1">Task</div>
                  <div className="text-2xl font-bold text-purple-900">{parsedIntent.task || "AI Will Determine"}</div>
                </div>
                <div className="bg-linear-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
                  <div className="text-sm font-semibold text-green-700 mb-1">Method</div>
                  <div className="text-2xl font-bold text-green-900">{parsedIntent.metadata?.method || parsedIntent.method || "Unknown"}</div>
                </div>
                <div className="bg-linear-to-br from-amber-50 to-amber-100 p-4 rounded-xl border border-amber-200">
                  <div className="text-sm font-semibold text-amber-700 mb-1">Confidence</div>
                  <div className="text-2xl font-bold text-amber-900">
                    {((parsedIntent.metadata?.confidence || 0) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 mb-4">
                <div className="font-bold text-gray-800 mb-3 text-lg">Your Prompt:</div>
                <pre className="text-sm bg-white p-4 rounded-lg border border-gray-200 overflow-x-auto font-mono text-gray-700">
                  {parsedIntent.rawPrompt}
                </pre>
              </div>
              
              <div className="flex justify-end mt-6">
                <button
                  className={`btn btn-lg gap-2 bg-blue-600 hover:bg-blue-700 text-white border-none shadow-lg ${resolving ? "loading" : ""}`}
                  onClick={handleResolveIntent}
                  disabled={resolving}
                >
                  {!resolving && <span>🔎</span>}
                  <span>{resolving ? "Fetching Data..." : "Generate Question"}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Generated Question */}
        {question && (
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl mb-6 border-2 border-green-200 overflow-hidden">
            <div className="bg-linear-to-r from-green-600 to-green-700 px-8 py-4">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <span className="text-3xl">✅</span>
                <span>Step 3: Review Your Question</span>
              </h2>
            </div>
            
            <div className="p-8">
              {/* Segment Badge */}
              <div className="mb-6">
                <div className="inline-flex items-center gap-2 px-6 py-3 bg-linear-to-r from-green-600 to-green-700 text-white rounded-full shadow-lg font-bold text-lg">
                  <span>🏆</span>
                  <span>{question.segment_code}</span>
                </div>
              </div>
              
              {/* Question Text */}
              <div className="bg-linear-to-br from-gray-50 to-gray-100 p-6 rounded-xl border-2 border-gray-300 mb-6">
                <div className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">Question</div>
                <div className="text-xl font-bold text-gray-900 leading-relaxed">{question.question_text}</div>
              </div>
              
              {/* Answers Section */}
              <div className="bg-linear-to-br from-blue-50 to-blue-100 p-6 rounded-xl border-2 border-blue-300 mb-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm font-semibold text-blue-800 uppercase tracking-wide">
                    Answers
                  </div>
                  <div className="px-3 py-1 bg-blue-600 text-white rounded-full text-sm font-bold">
                    {question.total_answers_available} total
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-3">
                  {question.answers.map((answer, idx) => (
                    <div 
                      key={idx} 
                      className={`px-4 py-2 rounded-lg font-semibold shadow-md transition-all hover:scale-105 ${
                        question.correct_answer_index === idx 
                          ? "bg-green-500 text-white border-2 border-green-700" 
                          : "bg-white text-gray-800 border-2 border-gray-300"
                      }`}
                    >
                      {answer}
                    </div>
                  ))}
                </div>
                
                {question.answers_truncated && (
                  <div className="mt-4 bg-amber-100 border-l-4 border-amber-500 p-4 rounded-r-lg">
                    <div className="flex items-start gap-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <div className="font-bold text-amber-900 mb-1">Truncated for Performance</div>
                        <div className="text-sm text-amber-800">
                          Showing {question.answers.length} of {question.total_answers_available} answers (capped at 100 for optimal game performance)
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Source Badge */}
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                <span className="font-semibold">Data Source:</span>
                <span className="px-3 py-1 bg-gray-200 rounded-full font-medium">{question.api_source}</span>
              </div>
              
              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t-2 border-gray-200">
                <button
                  className="btn btn-lg gap-2 bg-gray-200 hover:bg-gray-300 text-gray-800 border-none"
                  onClick={() => {
                    setParsedIntent(null);
                    setQuestion(null);
                    setUserPrompt("");
                  }}
                >
                  <span>🔄</span>
                  <span>Start Over</span>
                </button>
                <button 
                  className="btn btn-lg gap-2 bg-green-600 hover:bg-green-700 text-white border-none shadow-lg" 
                  onClick={handleSaveQuestion}
                >
                  <span>💾</span>
                  <span>Save Question</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CreateQuestions;
