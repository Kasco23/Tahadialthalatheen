import { useState } from "react";
import { toast } from "react-hot-toast";

interface Answer {
  question: string;
  answer: string;
  details?: string;
  reasoning?: string;
  sources?: string[];
  confidence: number;
}

export default function AskFootball() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAsk = async () => {
    if (!question.trim()) {
      toast.error("Please enter a question");
      return;
    }

    setLoading(true);
    setAnswer(null);

    try {
      const response = await fetch("/api/answer-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, useMocks: true }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to get answer");
      }

      const data: Answer = await response.json();
      setAnswer(data);
      toast.success("Got your answer!");
    } catch (error) {
      console.error("Failed to get answer:", error);
      toast.error(error instanceof Error ? error.message : "Failed to get answer");
    } finally {
      setLoading(false);
    }
  };

  const exampleQuestions = [
    "Who was La Liga top scorer last season?",
    "Who has the most assists in Premier League this season?",
    "Who won the Champions League in 2023?",
    "Which player scored the most goals in Serie A last season?",
  ];

  return (
    <div className="min-h-screen bg-linear-to-br from-green-900 via-green-800 to-green-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <span className="text-6xl">⚽</span>
            <div>
              <h1 className="text-4xl font-bold bg-linear-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                Ask Football
              </h1>
              <p className="text-gray-600 text-lg">Ask any football question, get intelligent answers</p>
            </div>
          </div>
        </div>

        {/* Question Input */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 mb-6">
          <label className="block text-xl font-bold text-gray-800 mb-4">
            What do you want to know?
          </label>
          
          <textarea
            className="w-full px-6 py-4 text-lg border-2 border-green-300 rounded-xl focus:border-green-500 focus:outline-none resize-none"
            rows={3}
            placeholder="E.g., Who was La Liga top scorer last season?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                handleAsk();
              }
            }}
          />

          {/* Example Questions */}
          <div className="mt-4">
            <details className="group">
              <summary className="cursor-pointer text-green-700 font-semibold hover:text-green-800 flex items-center gap-2">
                <span>💡</span>
                <span>Example Questions</span>
              </summary>
              <div className="mt-3 space-y-2">
                {exampleQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => setQuestion(q)}
                    className="block w-full text-left px-4 py-2 bg-green-50 hover:bg-green-100 rounded-lg text-gray-700 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </details>
          </div>

          <button
            onClick={handleAsk}
            disabled={loading || !question.trim()}
            className={`mt-6 w-full py-4 px-6 text-xl font-bold rounded-xl shadow-lg transition-all ${
              loading || !question.trim()
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-linear-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white"
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-3">
                <span className="animate-spin">🔄</span>
                <span>Thinking...</span>
              </span>
            ) : (
              <span className="flex items-center justify-center gap-3">
                <span>🧠</span>
                <span>Ask AI</span>
              </span>
            )}
          </button>
        </div>

        {/* Answer Display */}
        {answer && (
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 animate-fade-in">
            {/* Question */}
            <div className="mb-6">
              <div className="text-sm font-semibold text-gray-500 mb-2">QUESTION</div>
              <div className="text-xl text-gray-800">{answer.question}</div>
            </div>

            {/* Answer */}
            <div className="mb-6">
              <div className="text-sm font-semibold text-green-600 mb-2">ANSWER</div>
              <div className="text-3xl font-bold bg-linear-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                {answer.answer}
              </div>
            </div>

            {/* Details */}
            {answer.details && (
              <div className="mb-6 p-4 bg-blue-50 rounded-xl border-l-4 border-blue-500">
                <div className="text-sm font-semibold text-blue-700 mb-2">DETAILS</div>
                <div className="text-gray-700">{answer.details}</div>
              </div>
            )}

            {/* AI Reasoning */}
            {answer.reasoning && (
              <details className="mb-6 group">
                <summary className="cursor-pointer text-gray-700 font-semibold hover:text-gray-900 flex items-center gap-2">
                  <span>🤖</span>
                  <span>How AI figured this out</span>
                </summary>
                <div className="mt-3 p-4 bg-gray-50 rounded-xl text-sm text-gray-600 font-mono">
                  {answer.reasoning}
                </div>
              </details>
            )}

            {/* Confidence & Sources */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Confidence:</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        answer.confidence >= 0.8
                          ? "bg-green-500"
                          : answer.confidence >= 0.5
                          ? "bg-yellow-500"
                          : "bg-orange-500"
                      }`}
                      style={{ width: `${answer.confidence * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-gray-700">
                    {(answer.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              </div>

              {answer.sources && answer.sources.length > 0 && (
                <div className="text-sm text-gray-500">
                  Sources: {answer.sources.join(", ")}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="mt-6 p-6 bg-blue-900/20 backdrop-blur-sm rounded-xl border border-blue-500/30">
          <div className="flex gap-3">
            <span className="text-2xl">ℹ️</span>
            <div className="text-white">
              <div className="font-bold mb-1">How it works</div>
              <div className="text-sm opacity-90">
                AI analyzes your question, understands the context (like "last season" based on current date),
                identifies the competition and stat type, then fetches real data from football APIs to give you
                accurate answers with reasoning.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
