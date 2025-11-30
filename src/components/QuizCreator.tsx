/**
 * Quiz Creator Component - Modern Football-Themed Design
 *
 * A comprehensive UI for creating and managing quiz questions.
 * Supports both List and Buzz-in question types across all 5 segments.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle, Plus, Trash2, Target } from "lucide-react";
import type { SegmentCode, QuestionType } from "../lib/types/supabase";
import { validateQuestionInsert } from "../lib/validation/questionSchemas";

// Segment configuration
const SEGMENT_CONFIG: Record<
  SegmentCode,
  { name: string; type: "list" | "buzz"; color: string; icon: string }
> = {
  WDYK: { name: "What Do You Know", type: "list", color: "from-purple-600 to-purple-700", icon: "🧠" },
  AUCT: { name: "Auction", type: "list", color: "from-yellow-600 to-amber-700", icon: "🔨" },
  BELL: { name: "Bell Round", type: "buzz", color: "from-red-600 to-rose-700", icon: "🔔" },
  UPDW: { name: "Upside-Down", type: "buzz", color: "from-blue-600 to-cyan-700", icon: "🔄" },
  REMO: { name: "Remontada", type: "buzz", color: "from-green-600 to-emerald-700", icon: "⚡" },
};

interface Question {
  question_id: string;
  segment_code: SegmentCode;
  question_type: "list" | "buzz";
  question_text: string;
  answers: string | string[];
}

interface QuizCreatorProps {
  onQuestionCreated?: (question: Question) => void;
}

export const QuizCreator: React.FC<QuizCreatorProps> = ({
  onQuestionCreated,
}) => {
  // Form state
  const [segmentCode, setSegmentCode] = useState<SegmentCode>("WDYK");
  const [questionText, setQuestionText] = useState("");
  const [listAnswers, setListAnswers] = useState<string[]>(["", "", "", ""]);
  const [buzzAnswer, setBuzzAnswer] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Derived state
  const questionType: QuestionType = SEGMENT_CONFIG[segmentCode].type;
  const segmentInfo = SEGMENT_CONFIG[segmentCode];

  // Handlers
  const handleSegmentChange = (code: SegmentCode) => {
    setSegmentCode(code);
    setQuestionText("");
    setListAnswers(["", "", "", ""]);
    setBuzzAnswer("");
    setError(null);
    setSuccess(null);
  };

  const handleAddListAnswer = () => {
    setListAnswers([...listAnswers, ""]);
  };

  const handleRemoveListAnswer = (index: number) => {
    if (listAnswers.length > 2) {
      setListAnswers(listAnswers.filter((_, i) => i !== index));
    }
  };

  const handleListAnswerChange = (index: number, value: string) => {
    const updated = [...listAnswers];
    updated[index] = value;
    setListAnswers(updated);
  };

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      // Prepare question data
      const questionData = {
        segment_code: segmentCode,
        question_type: questionType,
        question_text: questionText.trim(),
        answers:
          questionType === "list"
            ? listAnswers.filter((a) => a.trim() !== "")
            : buzzAnswer.trim(),
      };

      // Validate with Zod
      const validatedQuestion = validateQuestionInsert(questionData);

      // Submit to API
      const response = await fetch("/api/questions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validatedQuestion),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create question");
      }

      // Success!
      setSuccess("✅ Question created successfully!");
      if (onQuestionCreated) {
        onQuestionCreated(result.question);
      }

      // Reset form
      setQuestionText("");
      setListAnswers(["", "", "", ""]);
      setBuzzAnswer("");
    } catch (err) {
      console.error("Error creating question:", err);
      setError(
        err instanceof Error ? err.message : "Failed to create question"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = () => {
    if (!questionText.trim()) return false;
    if (questionType === "list") {
      const validAnswers = listAnswers.filter((a) => a.trim() !== "");
      return validAnswers.length >= 2;
    } else {
      return buzzAnswer.trim() !== "";
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Segment Selector Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-200"
      >
        <div className="flex items-center gap-3 mb-4">
          <Target className="w-6 h-6 text-green-600" />
          <h3 className="text-xl font-bold text-gray-800">Select Segment</h3>
        </div>
        
        <div className="grid grid-cols-5 gap-3">
          {(Object.keys(SEGMENT_CONFIG) as SegmentCode[]).map((code) => {
            const config = SEGMENT_CONFIG[code];
            const isSelected = segmentCode === code;
            
            return (
              <motion.button
                key={code}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSegmentChange(code)}
                className={`
                  relative px-4 py-6 rounded-xl font-bold text-white transition-all
                  ${isSelected 
                    ? `bg-linear-to-br ${config.color} shadow-xl ring-4 ring-white ring-offset-2` 
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }
                `}
              >
                <div className="text-3xl mb-2">{config.icon}</div>
                <div className="text-sm">{code}</div>
                {isSelected && (
                  <motion.div
                    layoutId="selectedSegment"
                    className="absolute -top-1 -right-1 bg-white rounded-full p-1"
                  >
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </div>

        <motion.div
          key={segmentCode}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className={`mt-4 p-4 rounded-xl bg-linear-to-r ${segmentInfo.color} text-white`}
        >
          <p className="font-semibold text-lg">{segmentInfo.name}</p>
          <p className="text-white/90 text-sm">
            {questionType === "list"
              ? "📝 List Question - Players recall multiple answers from memory"
              : "⚡ Buzz Question - First to buzz with the correct single answer"}
          </p>
        </motion.div>
      </motion.div>

      {/* Question Text Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-200"
      >
        <label className="block mb-3">
          <span className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <span className="text-2xl">📋</span>
            Question Text
          </span>
        </label>
        <textarea
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all resize-none"
          rows={4}
          placeholder="Enter your football quiz question here..."
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
        />
        <p className="text-sm text-gray-500 mt-2">
          Minimum 10 characters required
        </p>
      </motion.div>

      {/* Answers Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-200"
      >
        <label className="block mb-4">
          <span className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <span className="text-2xl">{questionType === "list" ? "📚" : "🎯"}</span>
            {questionType === "list" ? "Answers (List)" : "Answer (Single)"}
          </span>
        </label>

        {questionType === "list" ? (
          <div className="space-y-3">
            <AnimatePresence>
              {listAnswers.map((answer, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex gap-3"
                >
                  <input
                    type="text"
                    className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                    placeholder={`Answer ${index + 1}`}
                    value={answer}
                    onChange={(e) => handleListAnswerChange(index, e.target.value)}
                  />
                  {listAnswers.length > 2 && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
                      onClick={() => handleRemoveListAnswer(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                      Remove
                    </motion.button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 border-2 border-dashed border-gray-300 hover:border-green-500 hover:bg-green-50 rounded-xl font-medium text-gray-600 hover:text-green-600 transition-all flex items-center justify-center gap-2"
              onClick={handleAddListAnswer}
            >
              <Plus className="w-5 h-5" />
              Add Answer
            </motion.button>
            
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-3 mt-4">
              <p className="text-sm text-blue-800">
                💡 <strong>Tip:</strong> Add at least 2 answers. Players will recall answers from memory during gameplay.
              </p>
            </div>
          </div>
        ) : (
          <div>
            <input
              type="text"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all"
              placeholder="Enter the correct answer"
              value={buzzAnswer}
              onChange={(e) => setBuzzAnswer(e.target.value)}
            />
            <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-3 mt-4">
              <p className="text-sm text-orange-800">
                ⚡ <strong>Buzz-in Mode:</strong> Single correct answer. First player to buzz in gets to answer!
              </p>
            </div>
          </div>
        )}
      </motion.div>

      {/* Error/Success Messages */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="bg-red-50 border-2 border-red-300 rounded-2xl p-4 shadow-lg"
          >
            <div className="flex items-center gap-3 text-red-800">
              <AlertCircle className="w-6 h-6" />
              <span className="font-medium">{error}</span>
            </div>
          </motion.div>
        )}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="bg-green-50 border-2 border-green-300 rounded-2xl p-4 shadow-lg"
          >
            <div className="flex items-center gap-3 text-green-800">
              <CheckCircle2 className="w-6 h-6" />
              <span className="font-medium">{success}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submit Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`
          w-full py-4 rounded-2xl font-bold text-lg text-white shadow-xl transition-all
          ${isFormValid() && !isSubmitting
            ? "bg-linear-to-r from-green-600 to-emerald-600 hover:shadow-2xl cursor-pointer"
            : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }
        `}
        onClick={handleSubmit}
        disabled={!isFormValid() || isSubmitting}
      >
        {isSubmitting ? (
          <div className="flex items-center justify-center gap-3">
            <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
            Creating Question...
          </div>
        ) : (
          <div className="flex items-center justify-center gap-3">
            <CheckCircle2 className="w-6 h-6" />
            Create Question
          </div>
        )}
      </motion.button>
    </div>
  );
};
