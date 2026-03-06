import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { setSegmentConfig, getSegmentConfig } from "../lib/mutations";
import { supabase } from "../lib/supabaseClient";
import { Alert } from "./Alert";
import { AnimatePresence } from "framer-motion";
import type { SegmentCode } from "../lib/types";
import { Logger } from "../lib/logger";
import { QuestionSelectorModal } from "./QuestionSelectorModal";
import { saveQuizQuestions, getQuizQuestions } from "../lib/blobsManager";

interface GameConfigurationModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  sessionCode: string;
}

export const GameConfigurationModal: React.FC<GameConfigurationModalProps> = ({
  isOpen,
  onClose,
  sessionId,
  sessionCode,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [notice, setNotice] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [segments, setSegments] = useState({
    WDYK: 0,
    AUCT: 0,
    BELL: 0,
    UPDW: 0,
    REMO: 0,
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

  const [activeSegmentModal, setActiveSegmentModal] =
    useState<SegmentCode | null>(null);

  // Load existing segment configuration when component mounts
  useEffect(() => {
    const loadConfig = async () => {
      if (!sessionId || !sessionCode || !isOpen) return;

      try {
        const fetchedConfig = await getSegmentConfig(sessionId);
        const configMap = fetchedConfig.reduce(
          (acc, config) => {
            acc[config.segment_code as SegmentCode] = config.questions_count;
            return acc;
          },
          {} as Record<SegmentCode, number>
        );
        setSegments((prev) => ({ ...prev, ...configMap }));

        // Load existing selected questions from Blob so they are not lost
        const blobRes = await getQuizQuestions(sessionCode);
        if (blobRes.success && blobRes.data) {
          const sq: Record<SegmentCode, string[]> = {
            WDYK: [],
            AUCT: [],
            BELL: [],
            UPDW: [],
            REMO: [],
          };
          blobRes.data.questions.forEach((q) => {
            if (sq[q.segment_code as SegmentCode]) {
              sq[q.segment_code as SegmentCode].push(q.question_id);
            }
          });
          setSelectedQuestions(sq);
        }
      } catch (error) {
        Logger.error("Failed to load configuration:", error);
      }
    };

    loadConfig();
  }, [sessionId, sessionCode, isOpen]);

  const handleQuestionSelectionChange = (
    segment: SegmentCode,
    questionIds: string[]
  ) => {
    setSelectedQuestions((prev) => ({
      ...prev,
      [segment]: questionIds,
    }));

    // Auto-update segment count based on selection
    setSegments((prev) => ({
      ...prev,
      [segment]: questionIds.length,
    }));

    Logger.log(`Question selections updated for ${segment}`, {
      count: questionIds.length,
      questionIds,
    });
  };

  const handleSaveConfiguration = async () => {
    if (!sessionId || !sessionCode) {
      setNotice({ type: "error", message: "Missing session information." });
      return;
    }

    // Validate segment configuration
    const hasInvalidSegments = Object.entries(segments).some(
      ([, count]) => count < 0 || count > 50
    );
    if (hasInvalidSegments) {
      setNotice({
        type: "error",
        message: "All segments must have between 0 and 50 questions.",
      });
      return;
    }

    // Check if at least one segment has questions
    const totalQuestions = Object.values(segments).reduce(
      (sum, count) => sum + count,
      0
    );
    if (totalQuestions === 0) {
      setNotice({
        type: "error",
        message:
          "Please select questions for at least one segment before saving.",
      });
      return;
    }

    setIsLoading(true);
    setNotice(null);
    try {
      const segmentConfigs = Object.entries(segments).map(([code, count]) => ({
        segment_code: code as SegmentCode,
        questions_count: count,
      }));
      await setSegmentConfig(sessionId, segmentConfigs);

      // Save questions to blob explicitly
      const questionIdsWithSegments = Object.entries(selectedQuestions).flatMap(
        ([segment, questionIds]) =>
          questionIds.map((questionId) => ({
            questionId,
            segmentCode: segment as SegmentCode,
          }))
      );

      // Only prepare blob storage if questions were implicitly selected
      // (This requires that they have navigated the tree or just selected some)
      if (questionIdsWithSegments.length > 0) {
        const { data: questionsData, error: questionsError } = await supabase
          .from("Questions")
          .select(
            "question_id, question_text, question_type, answers, total_answers_available, segment_code"
          )
          .in(
            "question_id",
            questionIdsWithSegments.map((q) => q.questionId)
          );

        if (questionsError) {
          throw new Error("Failed to fetch complete question details.");
        }

        if (questionsData && questionsData.length > 0) {
          const questionsWithOrder = questionsData.map((question) => {
            const originalSelectionForSegment =
              selectedQuestions[question.segment_code as SegmentCode];
            const originalIndex = originalSelectionForSegment
              ? originalSelectionForSegment.indexOf(question.question_id)
              : 0;

            const segmentOrder = ["WDYK", "AUCT", "BELL", "UPDW", "REMO"];
            const segmentBaseIndex =
              segmentOrder.indexOf(question.segment_code as string) * 1000;

            return {
              question_id: question.question_id,
              segment_code: question.segment_code,
              question_text: question.question_text,
              question_type: question.question_type as "list" | "buzz",
              answers: question.answers,
              total_answers_available:
                question.total_answers_available || undefined,
              display_order: segmentBaseIndex + originalIndex,
            };
          });

          // Sort by display order to maintain sequence
          questionsWithOrder.sort((a, b) => a.display_order - b.display_order);

          // Save to Netlify Blobs
          const result = await saveQuizQuestions(
            sessionCode,
            sessionId,
            questionsWithOrder
          );

          if (!result.success) {
            Logger.error("Failed to save questions to Blobs:", result.error);
            setNotice({
              type: "error",
              message:
                "Configuration saved to database safely, but blob synchronization skipped. You can start the quiz.",
            });
          }
        }
      }

      setNotice({
        type: "success",
        message:
          "Configuration saved successfully. You can now start the quiz!",
      });

      // Automatically close modal after short delay on success
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      Logger.error("Error saving configuration:", error);
      setNotice({
        type: "error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-white/20 rounded-2xl p-6 w-full max-w-4xl shadow-2xl relative">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-3xl font-bold text-white uppercase tracking-wider">
            ⚙️ Game Configuration
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1"
          >
            ✕
          </button>
        </div>

        {notice && (
          <div className="mb-4">
            <Alert type={notice.type} message={notice.message} />
          </div>
        )}

        <div className="grid grid-cols-1 gap-6">
          {/* Active Configuration Panel */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span>📋</span> Segment Configuration
              </h2>
              <Link
                to="/quiz-admin"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm bg-blue-500/20 hover:bg-blue-500/40 text-blue-300 px-4 py-2 rounded-lg border border-blue-500/30 transition-colors flex items-center gap-2"
              >
                <span>📝</span> Manage Questions
              </Link>
            </div>

            <div className="space-y-4">
              {/* What Do You Know */}
              <button
                onClick={() => setActiveSegmentModal("WDYK")}
                className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-blue-900/40 to-blue-800/40 hover:from-blue-800/60 hover:to-blue-700/60 border border-blue-500/30 rounded-lg transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-xl">
                    🧠
                  </div>
                  <div className="text-left">
                    <h3 className="text-white font-bold text-lg">
                      What Do You Know
                    </h3>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span
                    className={`font-bold ${segments.WDYK > 0 ? "text-green-400" : "text-gray-400"}`}
                  >
                    {segments.WDYK} questions
                  </span>
                  <span className="text-blue-400">Configure →</span>
                </div>
              </button>

              {/* Auction */}
              <button
                onClick={() => setActiveSegmentModal("AUCT")}
                className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-orange-900/40 to-orange-800/40 hover:from-orange-800/60 hover:to-orange-700/60 border border-orange-500/30 rounded-lg transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center text-xl">
                    🔨
                  </div>
                  <div className="text-left">
                    <h3 className="text-white font-bold text-lg">Auction</h3>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span
                    className={`font-bold ${segments.AUCT > 0 ? "text-green-400" : "text-gray-400"}`}
                  >
                    {segments.AUCT} questions
                  </span>
                  <span className="text-orange-400">Configure →</span>
                </div>
              </button>

              {/* Bell Selection */}
              <button
                onClick={() => setActiveSegmentModal("BELL")}
                className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-yellow-900/40 to-yellow-800/40 hover:from-yellow-800/60 hover:to-yellow-700/60 border border-yellow-500/30 rounded-lg transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center text-xl">
                    🔔
                  </div>
                  <div className="text-left">
                    <h3 className="text-white font-bold text-lg">Bell Round</h3>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span
                    className={`font-bold ${segments.BELL > 0 ? "text-green-400" : "text-gray-400"}`}
                  >
                    {segments.BELL} questions
                  </span>
                  <span className="text-yellow-400">Configure →</span>
                </div>
              </button>

              {/* Upside Down */}
              <button
                onClick={() => setActiveSegmentModal("UPDW")}
                className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-purple-900/40 to-purple-800/40 hover:from-purple-800/60 hover:to-purple-700/60 border border-purple-500/30 rounded-lg transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-xl">
                    🙃
                  </div>
                  <div className="text-left">
                    <h3 className="text-white font-bold text-lg">
                      Upside-Down
                    </h3>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span
                    className={`font-bold ${segments.UPDW > 0 ? "text-green-400" : "text-gray-400"}`}
                  >
                    {segments.UPDW} questions
                  </span>
                  <span className="text-purple-400">Configure →</span>
                </div>
              </button>

              {/* Remontada */}
              <button
                onClick={() => setActiveSegmentModal("REMO")}
                className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-red-900/40 to-red-800/40 hover:from-red-800/60 hover:to-red-700/60 border border-red-500/30 rounded-lg transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center text-xl">
                    📈
                  </div>
                  <div className="text-left">
                    <h3 className="text-white font-bold text-lg">Remontada</h3>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span
                    className={`font-bold ${segments.REMO > 0 ? "text-green-400" : "text-gray-400"}`}
                  >
                    {segments.REMO} questions
                  </span>
                  <span className="text-red-400">Configure →</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-500/20 hover:bg-gray-500/40 text-white font-bold rounded-lg transition-colors duration-200 border border-gray-400/50"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveConfiguration}
            disabled={isLoading}
            className={`px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg transition-colors duration-200 shadow-lg shadow-blue-500/20 border border-blue-400/50 ${
              isLoading ? "opacity-75 cursor-not-allowed" : ""
            }`}
          >
            {isLoading ? "Saving..." : "💾 Save Configuration"}
          </button>
        </div>

        {/* Question Selector Modal inside the Config Modal */}
        <AnimatePresence>
          {activeSegmentModal && (
            <QuestionSelectorModal
              isOpen={true}
              onClose={() => setActiveSegmentModal(null)}
              segment={activeSegmentModal}
              onSelectionChange={(questionIds: string[]) => {
                handleQuestionSelectionChange(activeSegmentModal, questionIds);
                setActiveSegmentModal(null);
              }}
              selectedQuestions={selectedQuestions[activeSegmentModal] || []}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
