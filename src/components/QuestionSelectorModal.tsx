import { useState, useEffect } from "react";
import type { SegmentCode } from "../lib/types";
import { Logger } from "../lib/logger";

interface Question {
  question_id: string;
  segment_code: SegmentCode;
  question_text: string;
  question_type: "list" | "buzz";
  answers: string | string[];
  total_answers_available?: number;
}

interface QuestionSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  segment: SegmentCode;
  selectedQuestions: string[];
  onSelectionChange: (_questionIds: string[]) => void;
}

const segmentNames: Record<SegmentCode, string> = {
  WDYK: "What Do You Know",
  AUCT: "Auction",
  BELL: "Bell Round",
  UPDW: "Upside-Down",
  REMO: "Remontada",
};

const segmentEmojis: Record<SegmentCode, string> = {
  WDYK: "🧠",
  AUCT: "🔨",
  BELL: "🔔",
  UPDW: "🔄",
  REMO: "⚡",
};

const segmentDescriptions: Record<SegmentCode, string> = {
  WDYK: "📝 List Question - Players recall multiple answers from memory",
  AUCT: "🎯 Auction - Bid on questions and compete for points",
  BELL: "⏱️ Buzz Question - First to answer wins",
  UPDW: "🔀 Upside-Down - Answer order matters",
  REMO: "⚡ Remontada - Comeback round with high stakes",
};

/**
 * QuestionSelectorModal Component
 *
 * Modal for selecting questions for a specific segment.
 * Updates selection and automatically adjusts segment question count.
 */
export const QuestionSelectorModal: React.FC<QuestionSelectorModalProps> = ({
  isOpen,
  onClose,
  segment,
  selectedQuestions,
  onSelectionChange,
}) => {
  const [availableQuestions, setAvailableQuestions] = useState<Question[]>([]);
  const [localSelections, setLocalSelections] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize local selections from prop
  useEffect(() => {
    setLocalSelections(selectedQuestions);
  }, [selectedQuestions, isOpen]);

  // Fetch questions for this segment
  useEffect(() => {
    if (!isOpen) return;

    const fetchQuestions = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Try Netlify function first, fallback to direct Supabase query
        let questions: Question[] = [];

        try {
          const response = await fetch(
            `/.netlify/functions/list-questions?segment_code=${segment}&limit=100`
          );

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data) {
              questions = data.data;
            }
          }
        } catch (_fetchError) {
          Logger.warn(
            "Netlify function not available, using direct Supabase query"
          );
        }

        // Fallback to direct Supabase query if function fails
        if (questions.length === 0) {
          const { supabase } = await import("../lib/supabaseClient");
          const { data: dbQuestions, error: dbError } = await supabase
            .from("Questions")
            .select("*")
            .eq("segment_code", segment)
            .order("question_id", { ascending: false })
            .limit(100);

          if (dbError) {
            throw new Error(`Database error: ${dbError.message}`);
          }

          questions = dbQuestions || [];
        }

        setAvailableQuestions(questions);
        Logger.log(`✅ Loaded ${questions.length} questions for ${segment}`);
      } catch (err) {
        Logger.error(`❌ Failed to fetch questions for ${segment}:`, err);
        setError(
          err instanceof Error ? err.message : "Failed to load questions"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuestions();
  }, [segment, isOpen]);

  // Handle question toggle
  const handleToggle = (questionId: string) => {
    setLocalSelections((prev) => {
      if (prev.includes(questionId)) {
        return prev.filter((id) => id !== questionId);
      } else {
        return [...prev, questionId];
      }
    });
  };

  // Handle save
  const handleSave = () => {
    onSelectionChange(localSelections);
    Logger.log(`💾 Saved ${localSelections.length} questions for ${segment}`);
    onClose();
  };

  // Handle cancel
  const handleCancel = () => {
    setLocalSelections(selectedQuestions); // Reset to original
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col mx-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{segmentEmojis[segment]}</span>
              <div>
                <h2 className="text-2xl font-bold">
                  {segment} - {segmentNames[segment]}
                </h2>
                <p className="text-blue-100 text-sm mt-1">
                  {segmentDescriptions[segment]}
                </p>
              </div>
            </div>
            <button
              onClick={handleCancel}
              className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Selection Status Bar */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 border-b-2 border-blue-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📊</span>
              <span className="font-semibold text-gray-700">
                Selected Questions:
              </span>
              <span
                className={`text-xl font-bold ${
                  localSelections.length > 0
                    ? "text-green-600"
                    : "text-gray-400"
                }`}
              >
                {localSelections.length}
              </span>
            </div>
            <div className="text-sm text-gray-600">
              {localSelections.length === 0
                ? "No questions selected"
                : `${localSelections.length} question${localSelections.length !== 1 ? "s" : ""} will be used in this segment`}
            </div>
          </div>
        </div>

        {/* Questions List */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin text-4xl mb-4">⏳</div>
                <p className="text-gray-600 font-medium">
                  Loading questions...
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6 text-center">
              <p className="text-red-800 font-semibold mb-2">
                ❌ Error loading questions
              </p>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          ) : availableQuestions.length === 0 ? (
            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-8 text-center">
              <div className="text-6xl mb-4">📝</div>
              <p className="text-yellow-800 font-semibold mb-2">
                No questions available for this segment
              </p>
              <p className="text-sm text-yellow-700 mb-4">
                Create questions in the Quiz Admin page first.
              </p>
              <a
                href="/quiz-admin"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white font-bold rounded-lg transition-colors"
              >
                📝 Go to Quiz Admin
              </a>
            </div>
          ) : (
            <div className="space-y-3">
              {availableQuestions.map((question) => {
                const isSelected = localSelections.includes(
                  question.question_id
                );

                return (
                  <label
                    key={question.question_id}
                    className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      isSelected
                        ? "border-green-500 bg-green-50 shadow-md"
                        : "border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggle(question.question_id)}
                      className="mt-1 w-6 h-6 text-green-600 focus:ring-2 focus:ring-green-500 rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 text-base">
                        {question.question_text}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <span
                          className={`text-xs px-3 py-1 rounded-full font-semibold ${
                            question.question_type === "list"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-orange-100 text-orange-700"
                          }`}
                        >
                          {question.question_type === "list"
                            ? "📚 List"
                            : "🔔 Buzz"}
                        </span>
                        {question.question_type === "list" &&
                          question.total_answers_available && (
                            <span className="text-xs text-gray-500">
                              {question.total_answers_available} answers
                              available
                            </span>
                          )}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t-2 border-gray-200 p-6 bg-gray-50 rounded-b-2xl">
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={handleCancel}
              className="px-6 py-3 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold rounded-lg transition-colors"
            >
              Cancel
            </button>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setLocalSelections([])}
                disabled={localSelections.length === 0}
                className="px-6 py-3 bg-red-100 hover:bg-red-200 disabled:bg-gray-100 disabled:text-gray-400 text-red-700 font-bold rounded-lg transition-colors disabled:cursor-not-allowed"
              >
                Clear All
              </button>
              <button
                onClick={handleSave}
                className="px-8 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold rounded-lg shadow-lg transition-all hover:shadow-xl hover:scale-105"
              >
                ✅ Save Selection ({localSelections.length})
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
