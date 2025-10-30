import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { SegmentCode } from "../lib/types";
import { Logger } from "../lib/logger";

interface Question {
  question_id: string;
  segment_code: SegmentCode;
  question_text: string;
  answers: string[];
  correct_answer_index: number | null;
  difficulty: "easy" | "medium" | "hard";
  metadata?: Record<string, any>;
}

interface QuestionManagerProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
}

export const QuestionManager: React.FC<QuestionManagerProps> = ({
  isOpen,
  onClose,
  sessionId,
}) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState<SegmentCode | "ALL">(
    "ALL",
  );
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [notice, setNotice] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // New question form state
  const [newQuestion, setNewQuestion] = useState({
    segment_code: "WDYK" as SegmentCode,
    question_text: "",
    answers: ["", "", "", ""],
    correct_answer_index: 0,
    difficulty: "medium" as "easy" | "medium" | "hard",
    metadata: {},
  });

  // Fetch questions on mount and when segment changes
  useEffect(() => {
    if (isOpen) {
      fetchQuestions();
    }
  }, [isOpen, selectedSegment]);

  const fetchQuestions = async () => {
    setIsLoading(true);
    try {
      // Fetch from Supabase Questions table
      const { data, error } = await (
        await import("../lib/supabaseClient")
      ).supabase
        .from("Questions")
        .select("*")
        .order("segment_code", { ascending: true });

      if (error) throw error;

      const filteredQuestions =
        selectedSegment === "ALL"
          ? data
          : data.filter((q) => q.segment_code === selectedSegment);

      setQuestions(filteredQuestions || []);
    } catch (error) {
      Logger.error("Error fetching questions:", error);
      setNotice({
        type: "error",
        message: `Failed to load questions: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddQuestion = async () => {
    if (!newQuestion.question_text.trim()) {
      setNotice({ type: "error", message: "Question text is required" });
      return;
    }

    const validAnswers = newQuestion.answers.filter((a) => a.trim() !== "");
    if (validAnswers.length < 2) {
      setNotice({
        type: "error",
        message: "At least 2 answers are required",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await (
        await import("../lib/supabaseClient")
      ).supabase
        .from("Questions")
        .insert({
          segment_code: newQuestion.segment_code,
          question_text: newQuestion.question_text,
          answers: validAnswers,
          correct_answer_index:
            newQuestion.segment_code === "WDYK" ||
            newQuestion.segment_code === "AUCT"
              ? null
              : newQuestion.correct_answer_index,
          difficulty: newQuestion.difficulty,
          metadata: newQuestion.metadata,
        })
        .select()
        .single();

      if (error) throw error;

      setNotice({
        type: "success",
        message: "Question added successfully!",
      });
      setIsAddingQuestion(false);
      // Reset form
      setNewQuestion({
        segment_code: "WDYK" as SegmentCode,
        question_text: "",
        answers: ["", "", "", ""],
        correct_answer_index: 0,
        difficulty: "medium",
        metadata: {},
      });
      fetchQuestions(); // Refresh list
    } catch (error) {
      Logger.error("Error adding question:", error);
      setNotice({
        type: "error",
        message: `Failed to add question: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm("Are you sure you want to delete this question?")) return;

    setIsLoading(true);
    try {
      const { error } = await (await import("../lib/supabaseClient")).supabase
        .from("Questions")
        .delete()
        .eq("question_id", questionId);

      if (error) throw error;

      setNotice({ type: "success", message: "Question deleted successfully!" });
      fetchQuestions(); // Refresh list
    } catch (error) {
      Logger.error("Error deleting question:", error);
      setNotice({
        type: "error",
        message: `Failed to delete question: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const segmentLabels: Record<SegmentCode | "ALL", string> = {
    ALL: "All Segments",
    WDYK: "What Do You Know",
    AUCT: "Auction",
    BELL: "Bell (Buzzer)",
    UPDW: "Up Down",
    REMO: "Remontada",
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">📝 Question Manager</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
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

        {/* Notice */}
        <AnimatePresence>
          {notice && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`m-4 p-4 rounded-lg ${
                notice.type === "success"
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              <div className="flex items-center justify-between">
                <span>{notice.message}</span>
                <button
                  onClick={() => setNotice(null)}
                  className="ml-4 text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Controls */}
          <div className="flex gap-4 mb-6">
            {/* Segment Filter */}
            <select
              value={selectedSegment}
              onChange={(e) =>
                setSelectedSegment(e.target.value as SegmentCode | "ALL")
              }
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              {Object.entries(segmentLabels).map(([code, label]) => (
                <option key={code} value={code}>
                  {label}
                </option>
              ))}
            </select>

            {/* Add Question Button */}
            <button
              onClick={() => setIsAddingQuestion(!isAddingQuestion)}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors"
            >
              {isAddingQuestion ? "Cancel" : "+ Add Question"}
            </button>
          </div>

          {/* Add Question Form */}
          <AnimatePresence>
            {isAddingQuestion && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200"
              >
                <h3 className="text-lg font-bold mb-4">Add New Question</h3>

                {/* Segment Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Segment
                  </label>
                  <select
                    value={newQuestion.segment_code}
                    onChange={(e) =>
                      setNewQuestion({
                        ...newQuestion,
                        segment_code: e.target.value as SegmentCode,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    {Object.entries(segmentLabels)
                      .filter(([code]) => code !== "ALL")
                      .map(([code, label]) => (
                        <option key={code} value={code}>
                          {label}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Question Text */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Question Text *
                  </label>
                  <textarea
                    value={newQuestion.question_text}
                    onChange={(e) =>
                      setNewQuestion({
                        ...newQuestion,
                        question_text: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    rows={3}
                    placeholder="Enter your question here..."
                  />
                </div>

                {/* Answers */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Answers * (at least 2)
                  </label>
                  {newQuestion.answers.map((answer, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={answer}
                        onChange={(e) => {
                          const newAnswers = [...newQuestion.answers];
                          newAnswers[index] = e.target.value;
                          setNewQuestion({
                            ...newQuestion,
                            answers: newAnswers,
                          });
                        }}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        placeholder={`Answer ${index + 1}`}
                      />
                      {newQuestion.segment_code !== "WDYK" &&
                        newQuestion.segment_code !== "AUCT" && (
                          <label className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="correct_answer"
                              checked={
                                newQuestion.correct_answer_index === index
                              }
                              onChange={() =>
                                setNewQuestion({
                                  ...newQuestion,
                                  correct_answer_index: index,
                                })
                              }
                              className="w-4 h-4"
                            />
                            <span className="text-sm text-gray-600">
                              Correct
                            </span>
                          </label>
                        )}
                    </div>
                  ))}
                  {newQuestion.segment_code === "WDYK" ||
                  newQuestion.segment_code === "AUCT" ? (
                    <p className="text-xs text-gray-500 mt-2">
                      Open-ended question - no correct answer needed
                    </p>
                  ) : null}
                </div>

                {/* Difficulty */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Difficulty
                  </label>
                  <select
                    value={newQuestion.difficulty}
                    onChange={(e) =>
                      setNewQuestion({
                        ...newQuestion,
                        difficulty: e.target.value as
                          | "easy"
                          | "medium"
                          | "hard",
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setIsAddingQuestion(false)}
                    className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddQuestion}
                    disabled={isLoading}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold rounded-lg transition-colors"
                  >
                    {isLoading ? "Adding..." : "Add Question"}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Questions List */}
          {isLoading && !isAddingQuestion ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-green-600 border-t-transparent"></div>
              <p className="mt-2 text-gray-600">Loading questions...</p>
            </div>
          ) : questions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No questions found for {segmentLabels[selectedSegment]}
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((question) => (
                <motion.div
                  key={question.question_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full">
                      {segmentLabels[question.segment_code]}
                    </span>
                    <button
                      onClick={() => handleDeleteQuestion(question.question_id)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                      title="Delete question"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                  <p className="text-gray-800 font-medium mb-2">
                    {question.question_text}
                  </p>
                  <div className="space-y-1">
                    {question.answers.map((answer, index) => (
                      <div
                        key={index}
                        className={`text-sm px-3 py-1 rounded ${
                          question.correct_answer_index === index
                            ? "bg-green-50 text-green-700 font-medium"
                            : "text-gray-600"
                        }`}
                      >
                        {index + 1}. {answer}
                        {question.correct_answer_index === index && " ✓"}
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 flex gap-2">
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        question.difficulty === "easy"
                          ? "bg-blue-100 text-blue-700"
                          : question.difficulty === "medium"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                      }`}
                    >
                      {question.difficulty}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-4 flex justify-between items-center border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Total Questions: {questions.length}
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};
