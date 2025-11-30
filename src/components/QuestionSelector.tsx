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

interface QuestionSelectorProps {
  sessionId: string;
  segments: Record<SegmentCode, number>;
  onSelectionChange: (selections: Record<SegmentCode, string[]>) => void;
}

/**
 * QuestionSelector Component
 * 
 * Allows hosts to manually select specific questions for each quiz segment.
 * Ensures the number of selected questions matches the configured count per segment.
 */
export const QuestionSelector: React.FC<QuestionSelectorProps> = ({
  sessionId: _sessionId, // Unused but kept for future use
  segments,
  onSelectionChange,
}) => {
  const [availableQuestions, setAvailableQuestions] = useState<
    Record<SegmentCode, Question[]>
  >({
    WDYK: [],
    AUCT: [],
    BELL: [],
    UPDW: [],
    REMO: [],
  });

  const [selectedQuestions, setSelectedQuestions] = useState<
    Record<SegmentCode, string[]>
  >({
    WDYK: [],
    AUCT: [],
    BELL: [],
    UPDW: [],
    REMO: [],
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch available questions for all segments
  useEffect(() => {
    const fetchQuestions = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Use Supabase directly for better development experience
        const { supabase } = await import("../lib/supabaseClient");
        
        const { data, error: fetchError } = await supabase
          .from("Questions")
          .select("*")
          .order("question_id", { ascending: false });

        if (fetchError) {
          throw new Error(`Failed to fetch questions: ${fetchError.message}`);
        }

        if (!data) {
          throw new Error("No questions data returned");
        }

        const questions: Question[] = data as Question[];

        // Group questions by segment
        const grouped: Record<SegmentCode, Question[]> = {
          WDYK: [],
          AUCT: [],
          BELL: [],
          UPDW: [],
          REMO: [],
        };

        questions.forEach((q) => {
          if (q.segment_code && grouped[q.segment_code]) {
            grouped[q.segment_code].push(q);
          }
        });

        setAvailableQuestions(grouped);
        Logger.log("✅ Questions loaded for selection", {
          counts: Object.entries(grouped).map(([code, qs]) => ({
            segment: code,
            count: qs.length,
          })),
        });
      } catch (err) {
        Logger.error("❌ Failed to fetch questions:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load questions"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuestions();
  }, []);

  // Handle question selection toggle
  const handleToggleQuestion = (segment: SegmentCode, questionId: string) => {
    setSelectedQuestions((prev) => {
      const currentSelections = prev[segment];
      const isSelected = currentSelections.includes(questionId);
      const requiredCount = segments[segment];

      let newSelections: string[];

      if (isSelected) {
        // Deselect
        newSelections = currentSelections.filter((id) => id !== questionId);
      } else {
        // Select only if under the limit
        if (currentSelections.length >= requiredCount) {
          Logger.warn(
            `⚠️ Cannot select more than ${requiredCount} questions for ${segment}`
          );
          return prev;
        }
        newSelections = [...currentSelections, questionId];
      }

      const updated = { ...prev, [segment]: newSelections };
      onSelectionChange(updated);
      return updated;
    });
  };

  // Get selection status for display
  const getSelectionStatus = (segment: SegmentCode): {
    selected: number;
    required: number;
    isComplete: boolean;
  } => {
    const selected = selectedQuestions[segment].length;
    const required = segments[segment];
    return {
      selected,
      required,
      isComplete: selected === required,
    };
  };

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

  if (isLoading) {
    return (
      <div className="p-6 bg-blue-50 border-2 border-blue-300 rounded-lg">
        <p className="text-blue-800 font-semibold flex items-center gap-2">
          <span className="animate-spin">⏳</span> Loading questions...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border-2 border-red-300 rounded-lg">
        <p className="text-red-800 font-semibold">❌ Error loading questions</p>
        <p className="text-sm text-red-600 mt-2">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-300 rounded-lg">
        <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
          🎯 Question Selection
        </h3>
        <p className="text-sm text-gray-600">
          Choose specific questions for each segment. Select{" "}
          <strong>exactly</strong> the number of questions configured above.
        </p>
      </div>

      {(Object.keys(segments) as SegmentCode[]).map((segment) => {
        const status = getSelectionStatus(segment);
        const questions = availableQuestions[segment];

        // Skip if no questions configured for this segment
        if (segments[segment] === 0) return null;

        return (
          <div
            key={segment}
            className="border-2 border-gray-300 rounded-lg p-4 bg-white shadow-sm"
          >
            {/* Segment Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{segmentEmojis[segment]}</span>
                <div>
                  <h4 className="font-bold text-gray-800">
                    {segment} - {segmentNames[segment]}
                  </h4>
                  <p
                    className={`text-sm font-medium ${
                      status.isComplete
                        ? "text-green-600"
                        : status.selected > status.required
                          ? "text-red-600"
                          : "text-orange-600"
                    }`}
                  >
                    {status.isComplete ? "✅" : "⚠️"} Selected: {status.selected}{" "}
                    / {status.required}
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              {status.isComplete && (
                <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                  Complete
                </span>
              )}
            </div>

            {/* Questions List */}
            {questions.length === 0 ? (
              <p className="text-sm text-gray-500 italic">
                No questions available for this segment. Create some in the Quiz
                Admin page.
              </p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {questions.map((question) => {
                  const isSelected = selectedQuestions[segment].includes(
                    question.question_id
                  );
                  const canSelect =
                    isSelected ||
                    selectedQuestions[segment].length < segments[segment];

                  return (
                    <label
                      key={question.question_id}
                      className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        isSelected
                          ? "border-green-500 bg-green-50"
                          : canSelect
                            ? "border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50"
                            : "border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() =>
                          handleToggleQuestion(segment, question.question_id)
                        }
                        disabled={!canSelect}
                        className="mt-1 w-5 h-5 text-green-600 focus:ring-2 focus:ring-green-500"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 text-sm">
                          {question.question_text}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-700 rounded">
                            {question.question_type === "list"
                              ? "📚 List"
                              : "🔔 Buzz"}
                          </span>
                          {question.question_type === "list" &&
                            question.total_answers_available && (
                              <span className="text-xs text-gray-500">
                                {question.total_answers_available} answers
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
        );
      })}
    </div>
  );
};
