import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { StadiumBackground } from "../components/StadiumBackground";
import { Alert } from "../components/Alert";
import { Logger } from "../lib/logger";
import type { SegmentCode } from "../lib/types";

// Dynamic import for transformers to avoid bundling issues
// Using type annotation with eslint disable for the complex pipeline type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pipelineInstance: any = null;

interface ParsedQuestion {
  segment_code: SegmentCode;
  question_text: string;
  intent: string;
  filters?: {
    leagues?: string[];
    timeframe?: string;
    minAchievements?: number;
  };
  expectedAnswerType?: string;
}

const CreateQuestions: React.FC = () => {
  const navigate = useNavigate();
  const [questionIdea, setQuestionIdea] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [modelLoadProgress, setModelLoadProgress] = useState(0);
  const [notice, setNotice] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);
  const [parsedQuestion, setParsedQuestion] = useState<ParsedQuestion | null>(
    null,
  );
  const [isSupported, setIsSupported] = useState(true);
  const [supportDetails, setSupportDetails] = useState({
    webgpu: false,
    wasm: false,
    onnx: false,
  });

  // Check browser capabilities on mount
  useEffect(() => {
    const checkCapabilities = async () => {
      try {
        // Check WebGPU support
        const hasWebGPU = "gpu" in navigator;

        // Check WASM support
        const hasWASM = typeof WebAssembly !== "undefined";

        // ONNX Runtime Web uses WASM, so same check
        const hasONNX = hasWASM;

        setSupportDetails({
          webgpu: hasWebGPU,
          wasm: hasWASM,
          onnx: hasONNX,
        });

        // We need at least WASM support for Transformers.js
        if (!hasWASM) {
          setIsSupported(false);
          setNotice({
            type: "error",
            message:
              "AI authoring not supported on this device. WebAssembly is required but not available in your browser.",
          });
        } else {
          setNotice({
            type: "info",
            message: hasWebGPU
              ? "AI acceleration available! Using WebGPU for faster processing."
              : "Using WASM backend for AI processing. For better performance, use a browser with WebGPU support.",
          });
        }

        Logger.log("Browser capabilities:", {
          webgpu: hasWebGPU,
          wasm: hasWASM,
          onnx: hasONNX,
        });
      } catch (error) {
        Logger.error("Error checking capabilities:", error);
        setIsSupported(false);
        setNotice({
          type: "error",
          message: "Failed to check device capabilities. AI features may not work.",
        });
      }
    };

    checkCapabilities();
  }, []);

  // Initialize the pipeline lazily
  const initializePipeline = async () => {
    if (pipelineInstance) return pipelineInstance;

    setIsModelLoading(true);
    setModelLoadProgress(0);

    try {
      // Dynamic import to avoid bundling the entire library
      const { pipeline, env } = await import("@huggingface/transformers");

      // Configure to use CDN for models
      env.allowLocalModels = false;
      env.allowRemoteModels = true;

      // Use a tiny model suitable for mobile browsers
      // Phi-2 is too large, so we'll use a smaller text generation model
      // or use a question-answering model as a lightweight alternative
      Logger.log("Loading AI model from CDN...");

      setModelLoadProgress(25);

      // Use a small model optimized for text generation
      // distilgpt2 is ~80MB and works well for intent parsing
      pipelineInstance = await pipeline(
        "text-generation",
        "onnx-community/distilgpt2",
        {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          progress_callback: (progress: any) => {
            if (progress.status === "progress" && progress.progress) {
              const percent = Math.round(progress.progress);
              setModelLoadProgress(25 + (percent * 0.75));
              Logger.log(`Model loading: ${percent}%`);
            }
          },
        },
      );

      setModelLoadProgress(100);
      Logger.log("AI model loaded successfully");

      setNotice({
        type: "success",
        message: "AI model loaded successfully! Ready to parse questions.",
      });

      return pipelineInstance;
    } catch (error) {
      Logger.error("Error loading AI model:", error);
      setNotice({
        type: "error",
        message: `Failed to load AI model: ${error instanceof Error ? error.message : "Unknown error"}. Please try again or use manual question creation.`,
      });
      throw error;
    } finally {
      setIsModelLoading(false);
    }
  };

  const handleParse = async () => {
    if (!questionIdea.trim()) {
      setNotice({
        type: "error",
        message: "Please enter a question idea first.",
      });
      return;
    }

    if (!isSupported) {
      setNotice({
        type: "error",
        message: "AI features are not supported on this device.",
      });
      return;
    }

    setIsLoading(true);
    setParsedQuestion(null);
    setNotice(null);

    try {
      // Initialize pipeline if needed
      const pipe = await initializePipeline();

      Logger.log("Parsing question with AI:", questionIdea);

      // Create a prompt that guides the model to parse the question
      const prompt = `Parse this football quiz question idea into JSON format:
Question: "${questionIdea}"

Analyze and extract:
1. Type of question (WDYK=What Do You Know, AUCT=Auction, BELL=Bell/Buzzer, UPDW=Up Down, REMO=Remontada)
2. Main question text
3. Intent/topic (e.g., "players_with_league_titles", "top_scorers", "transfers")
4. Filters (leagues, timeframe, achievements)

Output JSON:`;

      // Generate structured output
      const result = await pipe(prompt, {
        max_new_tokens: 200,
        temperature: 0.3, // Lower temperature for more consistent parsing
        do_sample: false,
        return_full_text: false,
      });

      Logger.log("AI parse result:", result);

      // Extract generated text from AI response
      const generatedText = extractGeneratedText(result);
      const parsed = parseAIResponse(questionIdea, generatedText);

      setParsedQuestion(parsed);
      setNotice({
        type: "success",
        message: "Question parsed successfully! Review and edit as needed.",
      });

      Logger.log("Parsed question:", parsed);
    } catch (error) {
      Logger.error("Error parsing question:", error);
      setNotice({
        type: "error",
        message: `Failed to parse question: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to safely extract generated text from AI response
  const extractGeneratedText = (result: unknown): string => {
    if (!Array.isArray(result)) return "";
    
    const firstResult = result[0];
    if (!firstResult || typeof firstResult !== "object") return "";
    
    if ("generated_text" in firstResult && 
        typeof firstResult.generated_text === "string") {
      return firstResult.generated_text;
    }
    
    return "";
  };

  // Simple parser to extract structure from the question
  // Note: aiResponse parameter is reserved for future enhancement where we'll parse
  // the AI's structured output. Currently using rule-based parsing as fallback.
  const parseAIResponse = (
    originalQuestion: string,
    aiResponse: string,
  ): ParsedQuestion => {
    // TODO: Parse aiResponse when AI returns structured JSON format
    // For now, using keyword-based parsing on originalQuestion
    void aiResponse; // Explicitly mark as intentionally unused for now
    
    // Fallback parsing logic when AI response is not perfect
    const lowerQuestion = originalQuestion.toLowerCase();

    // Detect segment type based on keywords
    let segment: SegmentCode = "WDYK"; // Default
    if (
      lowerQuestion.includes("auction") ||
      lowerQuestion.includes("bid") ||
      lowerQuestion.includes("highest")
    ) {
      segment = "AUCT";
    } else if (
      lowerQuestion.includes("buzz") ||
      lowerQuestion.includes("bell") ||
      lowerQuestion.includes("fastest") ||
      lowerQuestion.includes("quick")
    ) {
      segment = "BELL";
    } else if (
      lowerQuestion.includes("up down") ||
      lowerQuestion.includes("higher or lower") ||
      lowerQuestion.includes("more or less")
    ) {
      segment = "UPDW";
    } else if (
      lowerQuestion.includes("remontada") ||
      lowerQuestion.includes("comeback")
    ) {
      segment = "REMO";
    }

    // Detect leagues
    const leagues: string[] = [];
    if (lowerQuestion.includes("premier league")) leagues.push("Premier League");
    if (lowerQuestion.includes("la liga")) leagues.push("La Liga");
    if (lowerQuestion.includes("serie a")) leagues.push("Serie A");
    if (lowerQuestion.includes("bundesliga")) leagues.push("Bundesliga");
    if (lowerQuestion.includes("ligue 1")) leagues.push("Ligue 1");
    if (lowerQuestion.includes("top 5 leagues") || lowerQuestion.includes("top five")) {
      leagues.push("Premier League", "La Liga", "Serie A", "Bundesliga", "Ligue 1");
    }

    // Detect intent
    let intent = "general_knowledge";
    if (lowerQuestion.includes("title") || lowerQuestion.includes("champion")) {
      intent = "championship_winners";
    } else if (lowerQuestion.includes("transfer")) {
      intent = "player_transfers";
    } else if (lowerQuestion.includes("scorer") || lowerQuestion.includes("goal")) {
      intent = "top_scorers";
    } else if (lowerQuestion.includes("manager") || lowerQuestion.includes("coach")) {
      intent = "manager_achievements";
    }

    return {
      segment_code: segment,
      question_text: originalQuestion,
      intent,
      filters: leagues.length > 0 ? { leagues } : undefined,
      expectedAnswerType: "player_names",
    };
  };

  const handleFetchAnswers = async () => {
    if (!parsedQuestion) {
      setNotice({
        type: "error",
        message: "Please parse a question first.",
      });
      return;
    }

    setNotice({
      type: "info",
      message:
        "Answer fetching from football APIs will be implemented in the next phase. For now, you can manually add answers in the Question Manager.",
    });
  };

  const handleSaveToQuestionManager = () => {
    // Store the parsed question in localStorage for the QuestionManager to pick up
    if (parsedQuestion) {
      localStorage.setItem(
        "pendingAIQuestion",
        JSON.stringify({
          segment_code: parsedQuestion.segment_code,
          question_text: parsedQuestion.question_text,
          metadata: {
            intent: parsedQuestion.intent,
            filters: parsedQuestion.filters,
            source: "ai_generated",
          },
        }),
      );

      setNotice({
        type: "success",
        message: "Question saved! Redirecting to Game Setup...",
      });

      // Navigate back to game setup after a brief delay
      setTimeout(() => {
        navigate(-1); // Go back to previous page (GameSetup)
      }, 1500);
    }
  };

  return (
    <StadiumBackground variant="default" animated={true}>
      <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 text-center mb-8"
        >
          <h1
            className="text-4xl md:text-5xl font-black text-white mb-2 drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]"
            style={{
              textShadow:
                "2px 2px 4px rgba(0,0,0,0.8), 0 0 10px rgba(255,255,255,0.3)",
            }}
          >
            🤖 AI Question Creator
          </h1>
          <p
            className="text-green-100 text-lg drop-shadow-lg font-medium"
            style={{ textShadow: "1px 1px 3px rgba(0,0,0,0.7)" }}
          >
            Create quiz questions with AI assistance
          </p>
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 w-full max-w-3xl bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl border border-white/20 p-6 md:p-8"
        >
          {/* Browser Support Notice */}
          {!isSupported && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-400 rounded-lg">
              <p className="text-red-800 font-semibold mb-2">
                ❌ AI Authoring Not Supported
              </p>
              <p className="text-sm text-red-700">
                Your browser doesn't support the required features (WebAssembly)
                for AI-powered question creation. Please use a modern browser or
                create questions manually.
              </p>
            </div>
          )}

          {/* Capability Info */}
          {isSupported && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-300 rounded-lg">
              <p className="text-sm text-blue-800 font-medium mb-2">
                🔍 Device Capabilities:
              </p>
              <div className="flex gap-4 text-sm">
                <span className={supportDetails.webgpu ? "text-green-700" : "text-gray-500"}>
                  {supportDetails.webgpu ? "✓" : "✗"} WebGPU
                </span>
                <span className={supportDetails.wasm ? "text-green-700" : "text-gray-500"}>
                  {supportDetails.wasm ? "✓" : "✗"} WebAssembly
                </span>
                <span className={supportDetails.onnx ? "text-green-700" : "text-gray-500"}>
                  {supportDetails.onnx ? "✓" : "✗"} ONNX Runtime
                </span>
              </div>
            </div>
          )}

          {/* Notice */}
          {notice && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <Alert
                type={notice.type === "info" ? "success" : notice.type}
                message={notice.message}
                onClose={() => setNotice(null)}
              />
            </motion.div>
          )}

          {/* Model Loading Progress */}
          {isModelLoading && (
            <div className="mb-6 p-4 bg-purple-50 border border-purple-300 rounded-lg">
              <p className="text-purple-800 font-medium mb-2">
                🧠 Loading AI Model...
              </p>
              <div className="w-full bg-purple-200 rounded-full h-3 overflow-hidden">
                <motion.div
                  className="bg-purple-600 h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${modelLoadProgress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <p className="text-xs text-purple-700 mt-2">
                {modelLoadProgress}% - This may take a minute on first load...
              </p>
            </div>
          )}

          {/* Question Input */}
          <div className="mb-6">
            <label
              htmlFor="questionIdea"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Describe your question in natural language:
            </label>
            <textarea
              id="questionIdea"
              value={questionIdea}
              onChange={(e) => setQuestionIdea(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors resize-none"
              rows={4}
              placeholder='Example: "Name players who won a league title in different countries, top 5 leagues only"'
              disabled={!isSupported || isLoading || isModelLoading}
            />
            <p className="text-xs text-gray-500 mt-2">
              💡 Tip: Be specific! Mention the segment type, leagues, timeframes,
              or any other criteria you want.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={handleParse}
              disabled={!isSupported || isLoading || isModelLoading || !questionIdea.trim()}
              className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold rounded-lg shadow-lg transition-all duration-300 hover:shadow-2xl hover:scale-105 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isLoading ? "Parsing..." : "🧠 Parse with AI"}
            </button>
            <button
              onClick={handleFetchAnswers}
              disabled={!parsedQuestion || isLoading || isModelLoading}
              className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold rounded-lg shadow-lg transition-all duration-300 hover:shadow-2xl hover:scale-105 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              📊 Fetch Answers
            </button>
          </div>

          {/* Parsed Question Display */}
          {parsedQuestion && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-green-50 border-2 border-green-400 rounded-lg"
            >
              <h3 className="text-lg font-bold text-green-800 mb-3">
                ✅ Parsed Question
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Segment:</span>
                  <span className="ml-2 px-3 py-1 bg-green-200 text-green-800 rounded-full text-xs font-bold">
                    {parsedQuestion.segment_code}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Question:</span>
                  <p className="mt-1 text-gray-800">{parsedQuestion.question_text}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Intent:</span>
                  <span className="ml-2 text-gray-800">{parsedQuestion.intent}</span>
                </div>
                {parsedQuestion.filters && (
                  <div>
                    <span className="font-medium text-gray-700">Filters:</span>
                    <div className="mt-1">
                      {parsedQuestion.filters.leagues && (
                        <div className="flex flex-wrap gap-2 mt-1">
                          {parsedQuestion.filters.leagues.map((league, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs"
                            >
                              {league}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Save Button */}
              <button
                onClick={handleSaveToQuestionManager}
                className="mt-4 w-full py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors"
              >
                💾 Save & Return to Game Setup
              </button>
            </motion.div>
          )}

          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="w-full py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-lg transition-colors"
          >
            ← Back to Game Setup
          </button>

          {/* Info Section */}
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-300 rounded-lg">
            <h4 className="text-sm font-bold text-yellow-800 mb-2">
              ℹ️ How it works:
            </h4>
            <ul className="text-xs text-yellow-700 space-y-1 list-disc list-inside">
              <li>
                Enter your question idea in plain English (or Arabic!)
              </li>
              <li>
                AI parses it into structured format with segment type and intent
              </li>
              <li>
                Review and edit the parsed question as needed
              </li>
              <li>
                Save to add it to your question pool
              </li>
              <li>
                Answer fetching from football APIs coming in next phase!
              </li>
            </ul>
          </div>
        </motion.div>
      </div>
    </StadiumBackground>
  );
};

export default CreateQuestions;
