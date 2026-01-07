import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useAtom } from "jotai";
import {
  setSegmentConfig,
  createDailyRoom,
  getSegmentConfig,
  endSession,
  joinAsHost,
} from "../lib/mutations";
import { useSessionData } from "../lib/useSessionData";
import { supabase } from "../lib/supabaseClient";
import LobbyStatus from "../components/LobbyStatus";
import { Alert } from "../components/Alert";
import { motion } from "framer-motion";
import { sessionAtom, sessionCodeAtom, dailyRoomUrlAtom } from "../atoms";
import type { SegmentCode } from "../lib/types";
import PresenceHelper from "../lib/presence";
import { Logger } from "../lib/logger";
import { useAuth } from "../contexts/AuthContext";
import { updateSessionState } from "../lib/sessionState";
import { StadiumBackground } from "../components/StadiumBackground";
import { InviteFriendsModal } from "../components/InviteFriendsModal";
import { UsernameSetupBanner } from "../components/UsernameSetupBanner";
import { QuestionSelectorModal } from "../components/QuestionSelectorModal";
import {
  saveSessionBlob,
  getSessionBlob,
  saveQuizQuestions,
  type SessionBlobData,
} from "../lib/blobsManager";

const GameSetup: React.FC = () => {
  const navigate = useNavigate();
  const { sessionCode } = useParams<{ sessionCode: string }>();
  const { user } = useAuth();

  // Use consolidated session data hook instead of separate fetches
  const { sessionId } = useSessionData(sessionCode || null);

  // Use Jotai atoms for shared state
  const [, setSessionId] = useAtom(sessionAtom);
  const [, setCurrentSessionCode] = useAtom(sessionCodeAtom);
  const [, setDailyRoomUrl] = useAtom(dailyRoomUrlAtom);

  const [isLoading, setIsLoading] = useState(false);
  const [isDailyRoomCreated, setIsDailyRoomCreated] = useState(false);
  const [roomInfo, setRoomInfo] = useState<{ room_url: string } | null>(null);
  const [participantCount, setParticipantCount] = useState(0);
  const [hostParticipantId, setHostParticipantId] = useState<string | null>(
    () => localStorage.getItem("hostParticipantId")
  );
  const [presenceHelper, setPresenceHelper] = useState<PresenceHelper | null>(
    null
  );
  const [heartbeat, setHeartbeat] = useState<NodeJS.Timeout | null>(null);
  const [notice, setNotice] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [segments, setSegments] = useState({
    WDYK: 0, // What Do You Know
    AUCT: 0, // Auction
    BELL: 0, // Bell
    UPDW: 0, // Up Down
    REMO: 0, // Remontada
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
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  // Update atoms when sessionId is resolved
  useEffect(() => {
    if (sessionId) {
      setSessionId(sessionId);
      if (sessionCode) {
        setCurrentSessionCode(sessionCode);
      }
    }
  }, [sessionId, sessionCode, setSessionId, setCurrentSessionCode]);

  // Join as host when sessionId is available
  useEffect(() => {
    const joinAsHostEffect = async () => {
      if (!sessionId || !sessionCode || !user?.id || hostParticipantId) {
        return; // Don't join if already joined or missing required data
      }

      try {
        Logger.log("Joining as host...", { sessionCode, sessionId });
        const hostResult = await joinAsHost(sessionCode, user.id);

        const participantId = hostResult.participantId;

        setHostParticipantId(participantId);

        // Store in localStorage for persistence
        localStorage.setItem("hostParticipantId", participantId);

        Logger.log("Successfully joined as host:", participantId);

        // Set up presence tracking for the host
        const helper = new PresenceHelper(sessionId);

        // Get host's selected flag and logo from localStorage
        const hostFlag = localStorage.getItem("selectedFlag") || "";
        const hostLogoUrl = localStorage.getItem("teamLogoUrl") || "";
        const hostTeamName = localStorage.getItem("teamName") || "";

        await helper.joinPresence({
          id: participantId,
          user_id: participantId,
          name: hostTeamName, // Use team name for host display
          flag: hostFlag, // Use host's selected flag
          team_logo_url: hostLogoUrl, // Use host's selected team logo
          isHost: true,
          lastSeen: new Date(),
          role: "Host",
          timestamp: new Date().toISOString(),
          is_active: true,
        });

        setPresenceHelper(helper);

        // Start heartbeat to maintain presence
        const heartbeatInterval = PresenceHelper.createHeartbeat(helper);
        setHeartbeat(heartbeatInterval);

        Logger.log("Host presence tracking started");
      } catch (error) {
        Logger.error("Failed to join as host:", error);
        setNotice({
          type: "error",
          message: `Failed to join as host: ${error instanceof Error ? error.message : "Unknown error"}`,
        });
      }
    };

    joinAsHostEffect();
  }, [sessionId, sessionCode, user, hostParticipantId]);

  // Cleanup presence tracking on unmount
  useEffect(() => {
    return () => {
      if (heartbeat) {
        PresenceHelper.clearHeartbeat(heartbeat);
      }
      if (presenceHelper) {
        presenceHelper.leavePresence().catch(Logger.error);
      }
    };
  }, [heartbeat, presenceHelper]);

  const fetchRoomInfo = useCallback(async () => {
    if (!sessionId) return;
    try {
      const { data, error } = await supabase
        .from("DailyRooms")
        .select("*")
        .eq("room_id", sessionId)
        .maybeSingle();

      if (error) {
        Logger.error("Error fetching room info:", error.message);
        return;
      }

      if (data) {
        setIsDailyRoomCreated(true);
        setRoomInfo(data);
      }
    } catch (error) {
      Logger.error("Unexpected error fetching room info:", error);
    }
  }, [sessionId]);

  // ✨ PHASE 2.1: Load session data from Blobs on mount for resilience
  useEffect(() => {
    const loadSessionFromBlobs = async () => {
      if (!sessionId) return;

      Logger.log("🔍 Loading session data from Blobs...");
      const result = await getSessionBlob(sessionId);

      if (result.success && result.data) {
        Logger.log("✅ Session data loaded from Blobs", {
          source: result.source,
          cached: result.cached,
          room_created_at: result.data.daily_room_created_at,
        });

        // Restore UI state from blob if available
        if (result.data.daily_room_url) {
          setIsDailyRoomCreated(true);
          setRoomInfo({ room_url: result.data.daily_room_url });
          setDailyRoomUrl(result.data.daily_room_url);
          Logger.log("🎬 Daily room state restored from Blobs", {
            room_name: result.data.daily_room_name,
          });
        }

        // Could also restore segment configuration if needed
        if (result.data.metadata?.segments_config) {
          Logger.log("⚙️ Segments config available in Blobs", {
            segments: result.data.metadata.segments_config,
          });
        }
      } else {
        Logger.log("ℹ️ No session blob found or load failed", {
          error: result.error,
        });
      }
    };

    loadSessionFromBlobs();
  }, [sessionId, setDailyRoomUrl]);

  // Load existing segment configuration when component mounts
  useEffect(() => {
    const loadConfig = async () => {
      if (!sessionId) return;

      try {
        const fetchedConfig = await getSegmentConfig(sessionId);
        const configMap = fetchedConfig.reduce(
          (acc, config) => {
            acc[config.segment_code] = config.questions_count;
            return acc;
          },
          {} as Record<SegmentCode, number>
        );

        // Update local state with fetched config
        setSegments((prev) => ({ ...prev, ...configMap }));
      } catch (error) {
        Logger.error("Failed to load segment config:", error);
      }
    };

    if (sessionId) {
      loadConfig();
      fetchRoomInfo();
    }
  }, [sessionId, fetchRoomInfo]);

  // (removed duplicate effect)

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

  const handleCreateDailyRoom = async () => {
    if (!sessionId) {
      setNotice({
        type: "error",
        message:
          "No session available. Please go back to homepage and create a session.",
      });
      return;
    }
    if (!sessionCode) {
      setNotice({ type: "error", message: "Missing session code." });
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
          "Please select questions for at least one segment before creating the room.",
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

      Logger.log("✅ Segment configuration saved");

      // Use the already-created session code from DB (in route params)
      const created = await createDailyRoom(sessionId, sessionCode);
      setIsDailyRoomCreated(true);
      setRoomInfo({ room_url: created.room_url });
      setDailyRoomUrl(created.room_url); // Store in global atom

      // ✨ PHASE 2.1: Save comprehensive session data to Blobs
      Logger.log("💾 Saving comprehensive session data to Netlify Blobs...");

      const sessionBlobData: SessionBlobData = {
        session_id: sessionId,
        session_code: sessionCode,
        host_profile_id: user?.id || null,

        // Daily.co Video Integration
        daily_room_url: created.room_url,
        daily_room_name: created.room_name || null,
        daily_room_created_at: new Date().toISOString(),

        // Session Configuration
        phase: "Setup",
        game_state: "pre-quiz",
        segments_configured: true,

        // Participant Tracking
        active_participant_ids: hostParticipantId ? [hostParticipantId] : [],
        participant_count: 1,
        max_participants: 10,

        // Metadata
        created_at: new Date().toISOString(),
        last_updated: new Date().toISOString(),
        last_sync_with_supabase: new Date().toISOString(),

        metadata: {
          segments_config: segments,
          created_by: user?.id || "unknown",
          creation_context: "GameSetup",
        },
      };

      const blobResult = await saveSessionBlob(sessionBlobData);

      if (blobResult.success) {
        Logger.log("✅ Session data saved to Blobs successfully", {
          source: blobResult.source,
          cached: blobResult.cached,
        });
      } else {
        Logger.warn("⚠️ Failed to save to Blobs, but continuing", {
          error: blobResult.error,
        });
      }

      // Also update legacy session state for backward compatibility
      await updateSessionState(sessionId, {
        dailyRoomCreated: true,
        dailyRoomUrl: created.room_url,
        segmentsConfigured: true,
      });

      Logger.log("🎉 Room creation complete with Blobs persistence");

      setNotice({
        type: "success",
        message:
          "Daily room created successfully with cross-device sync enabled.",
      });
    } catch (error) {
      Logger.error("Error setting up game:", error);
      setNotice({
        type: "error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartQuiz = async (isTestMode: boolean = false) => {
    if (!sessionId) {
      setNotice({
        type: "error",
        message:
          "No session available. Please go back to homepage and create a session.",
      });
      return;
    }
    if (!isDailyRoomCreated) {
      setNotice({
        type: "error",
        message:
          'Please create a Daily room first by clicking "Create Daily Room"',
      });
      return;
    }

    // If test mode, create 2 test participants
    if (isTestMode) {
      try {
        setIsLoading(true);

        // Create test player 1 (Home role)
        const { error: testPlayer1Error } = await supabase
          .from("Participants")
          .insert({
            session_id: sessionId,
            role: "Home",
            session_presence: "Joined",
            video_presence: false,
          });

        if (testPlayer1Error) {
          Logger.error("Error creating test player 1:", testPlayer1Error);
        }

        // Create test player 2 (Away role)
        const { error: testPlayer2Error } = await supabase
          .from("Participants")
          .insert({
            session_id: sessionId,
            role: "Away",
            session_presence: "Joined",
            video_presence: false,
          });

        if (testPlayer2Error) {
          Logger.error("Error creating test player 2:", testPlayer2Error);
        }

        Logger.log("✅ Test players created successfully");
      } catch (error) {
        Logger.error("Error creating test players:", error);
        setNotice({
          type: "error",
          message: "Failed to create test players",
        });
        setIsLoading(false);
        return;
      }
    }

    // Fetch full question data and save to Netlify Blobs
    try {
      setIsLoading(true);

      // Get all selected question IDs with their segment codes
      const questionIdsWithSegments = Object.entries(selectedQuestions).flatMap(
        ([segment, questionIds]) =>
          questionIds.map((questionId) => ({
            questionId,
            segmentCode: segment as SegmentCode,
          }))
      );

      if (questionIdsWithSegments.length === 0) {
        setNotice({
          type: "error",
          message:
            "Please select at least one question before starting the quiz.",
        });
        setIsLoading(false);
        return;
      }

      // Fetch full question data from the Questions table
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
        Logger.error("Error fetching questions:", questionsError);
        setNotice({
          type: "error",
          message: "Failed to fetch question data. Please try again.",
        });
        setIsLoading(false);
        return;
      }

      if (!questionsData || questionsData.length === 0) {
        setNotice({
          type: "error",
          message: "No questions found. Please select questions again.",
        });
        setIsLoading(false);
        return;
      }

      // Prepare questions with display order based on segment and selection order
      const questionsWithOrder = questionsData.map((question, index) => {
        // Find the corresponding segment code from selected questions
        const selectedQuestion = questionIdsWithSegments.find(
          (q) => q.questionId === question.question_id
        );

        return {
          question_id: question.question_id,
          segment_code: selectedQuestion?.segmentCode || question.segment_code,
          question_text: question.question_text,
          question_type: question.question_type as "list" | "buzz",
          answers: question.answers,
          total_answers_available:
            question.total_answers_available || undefined,
          display_order: index,
        };
      });

      // Save to Netlify Blobs
      const result = await saveQuizQuestions(
        sessionCode!,
        sessionId,
        questionsWithOrder
      );

      if (!result.success) {
        setNotice({
          type: "error",
          message:
            result.error || "Failed to save questions. Please try again.",
        });
        setIsLoading(false);
        return;
      }

      Logger.log(
        `✅ Saved ${questionsWithOrder.length} questions to Netlify Blobs`
      );
    } catch (error) {
      Logger.error("Error saving questions:", error);
      setNotice({
        type: "error",
        message: "Failed to save questions",
      });
      setIsLoading(false);
      return;
    } finally {
      setIsLoading(false);
    }

    // Navigate to the quiz with the session code
    navigate(`/quiz/${sessionCode}`);
  };

  const handleLobbyUpdate = useCallback(
    (info: { participantCount: number; roomReady: boolean }) => {
      setParticipantCount(info.participantCount);
      if (info.roomReady) {
        setIsDailyRoomCreated(true);
      }
    },
    []
  );

  const handleEndSession = async () => {
    if (!sessionId) {
      setNotice({ type: "error", message: "No session available." });
      return;
    }

    const confirmed = confirm(
      "Are you sure you want to end this session? This action cannot be undone."
    );
    if (confirmed) {
      try {
        await endSession(sessionId);
        setNotice({ type: "success", message: "Session ended successfully." });
        navigate("/");
      } catch (error) {
        Logger.error("Error ending session:", error);
        setNotice({
          type: "error",
          message: `Error ending session: ${error instanceof Error ? error.message : "Unknown error"}`,
        });
      }
    }
  };

  return (
    <StadiumBackground variant="default" animated={true}>
      {/* Username Setup Banner */}
      <UsernameSetupBanner />

      <div className="min-h-screen flex flex-col p-4 md:p-8 relative">
        {/* Header */}
        <div className="relative z-10 text-center mb-6">
          <h1
            className="text-4xl md:text-5xl font-black text-white mb-2 drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]"
            style={{
              textShadow:
                "2px 2px 4px rgba(0,0,0,0.8), 0 0 10px rgba(255,255,255,0.3)",
            }}
          >
            🎮 Game Setup
          </h1>
          <p
            className="text-green-100 text-lg drop-shadow-lg font-medium"
            style={{ textShadow: "1px 1px 3px rgba(0,0,0,0.7)" }}
          >
            Manager's Tactical Board
          </p>
        </div>

        {/* Main content container */}
        <div className="relative z-10 flex-1 max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
            {/* Left side - Questions Configuration */}
            <div className="flex items-start justify-center">
              <div className="w-full max-w-lg bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl border border-white/20 p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                  📋 Questions Configuration
                </h2>

                {/* Notice */}
                {notice && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6"
                  >
                    <Alert
                      type={notice.type}
                      message={notice.message}
                      onClose={() => {
                        setNotice(null);
                      }}
                    />
                  </motion.div>
                )}

                {/* Create Daily Room Button */}
                {!isDailyRoomCreated && (
                  <button
                    onClick={handleCreateDailyRoom}
                    disabled={isLoading}
                    className="w-full mb-6 py-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold rounded-xl shadow-lg transition-all duration-300 hover:shadow-2xl hover:scale-105 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {isLoading ? "Creating Room..." : "🎬 Create Daily Room"}
                  </button>
                )}

                {/* Segment Configuration Form */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleStartQuiz();
                  }}
                  className="space-y-4"
                >
                  {/* Manage Questions Button - Moved to Top */}
                  <div className="mb-6">
                    <Link
                      to="/quiz-admin"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold rounded-xl shadow-lg transition-all duration-300 hover:shadow-2xl hover:scale-105 text-base text-center"
                    >
                      📝 Manage Questions
                    </Link>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2 border-b pb-2">
                      Select Questions by Segment
                    </h3>
                    <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
                      💡 Click each segment to choose questions. The question
                      count updates automatically.
                    </p>

                    <div className="space-y-3">
                      {/* WDYK */}
                      <button
                        type="button"
                        onClick={() => setActiveSegmentModal("WDYK")}
                        className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border-2 border-blue-300 rounded-lg transition-all hover:shadow-md"
                      >
                        <div className="flex items-center gap-3">
                          <div className="text-left">
                            <div className="font-semibold text-gray-800">
                              What Do You Know
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className={`px-4 py-2 rounded-full font-bold ${segments.WDYK > 0 ? "bg-green-500 text-white" : "bg-gray-300 text-gray-600"}`}
                          >
                            {segments.WDYK} questions
                          </span>
                          <span className="text-gray-400">→</span>
                        </div>
                      </button>

                      {/* AUCT */}
                      <button
                        type="button"
                        onClick={() => setActiveSegmentModal("AUCT")}
                        className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 border-2 border-orange-300 rounded-lg transition-all hover:shadow-md"
                      >
                        <div className="flex items-center gap-3">
                          <div className="text-left">
                            <div className="font-semibold text-gray-800">
                              Auction
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className={`px-4 py-2 rounded-full font-bold ${segments.AUCT > 0 ? "bg-green-500 text-white" : "bg-gray-300 text-gray-600"}`}
                          >
                            {segments.AUCT} questions
                          </span>
                          <span className="text-gray-400">→</span>
                        </div>
                      </button>

                      {/* BELL */}
                      <button
                        type="button"
                        onClick={() => setActiveSegmentModal("BELL")}
                        className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-yellow-50 to-yellow-100 hover:from-yellow-100 hover:to-yellow-200 border-2 border-yellow-300 rounded-lg transition-all hover:shadow-md"
                      >
                        <div className="flex items-center gap-3">
                          <div className="text-left">
                            <div className="font-semibold text-gray-800">
                              Bell Round
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className={`px-4 py-2 rounded-full font-bold ${segments.BELL > 0 ? "bg-green-500 text-white" : "bg-gray-300 text-gray-600"}`}
                          >
                            {segments.BELL} questions
                          </span>
                          <span className="text-gray-400">→</span>
                        </div>
                      </button>

                      {/* UPDW */}
                      <button
                        type="button"
                        onClick={() => setActiveSegmentModal("UPDW")}
                        className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 border-2 border-purple-300 rounded-lg transition-all hover:shadow-md"
                      >
                        <div className="flex items-center gap-3">
                          <div className="text-left">
                            <div className="font-semibold text-gray-800">
                              Upside-Down
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className={`px-4 py-2 rounded-full font-bold ${segments.UPDW > 0 ? "bg-green-500 text-white" : "bg-gray-300 text-gray-600"}`}
                          >
                            {segments.UPDW} questions
                          </span>
                          <span className="text-gray-400">→</span>
                        </div>
                      </button>

                      {/* REMO */}
                      <button
                        type="button"
                        onClick={() => setActiveSegmentModal("REMO")}
                        className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 border-2 border-red-300 rounded-lg transition-all hover:shadow-md"
                      >
                        <div className="flex items-center gap-3">
                          <div className="text-left">
                            <div className="font-semibold text-gray-800">
                              Remontada
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className={`px-4 py-2 rounded-full font-bold ${segments.REMO > 0 ? "bg-green-500 text-white" : "bg-gray-300 text-gray-600"}`}
                          >
                            {segments.REMO} questions
                          </span>
                          <span className="text-gray-400">→</span>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Start Quiz Buttons */}
                  <div className="pt-4 space-y-3">
                    <button
                      type="submit"
                      disabled={!isDailyRoomCreated || participantCount < 3}
                      className="w-full py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 disabled:from-gray-400 disabled:to-gray-500 text-black font-bold rounded-xl shadow-lg transition-all duration-300 hover:shadow-2xl hover:scale-105 disabled:cursor-not-allowed disabled:hover:scale-100 text-lg"
                    >
                      🚀 Start Quiz
                      {participantCount < 3 && " (Requires 3 participants)"}
                    </button>
                    <button
                      type="button"
                      disabled={!isDailyRoomCreated}
                      onClick={() => handleStartQuiz(true)}
                      className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold rounded-xl shadow-lg transition-all duration-300 hover:shadow-2xl hover:scale-105 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      🧪 Start Test Quiz (2 Test Players)
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Right side - Lobby Status */}
            <div className="flex items-start justify-center">
              <div className="w-full max-w-2xl">
                {sessionId && (
                  <LobbyStatus
                    sessionId={sessionId}
                    sessionCode={sessionCode || ""}
                    onEndSession={handleEndSession}
                    onLobbyUpdate={handleLobbyUpdate}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Invite Friends Button - Fixed Position */}
        {sessionId && sessionCode && (
          <button
            onClick={() => {
              setIsInviteModalOpen(true);
            }}
            className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-4 px-6 rounded-full shadow-2xl transition-all duration-300 hover:shadow-blue-500/50 hover:scale-110 flex items-center gap-2"
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            Invite Friends
          </button>
        )}

        {/* Invite Friends Modal */}
        {sessionId && sessionCode && (
          <InviteFriendsModal
            isOpen={isInviteModalOpen}
            onClose={() => {
              setIsInviteModalOpen(false);
            }}
            sessionCode={sessionCode}
            sessionId={sessionId}
          />
        )}

        {/* Question Selector Modals */}
        {activeSegmentModal && (
          <QuestionSelectorModal
            isOpen={!!activeSegmentModal}
            onClose={() => setActiveSegmentModal(null)}
            segment={activeSegmentModal}
            selectedQuestions={selectedQuestions[activeSegmentModal]}
            onSelectionChange={(questionIds) =>
              handleQuestionSelectionChange(activeSegmentModal, questionIds)
            }
          />
        )}
      </div>
    </StadiumBackground>
  );
};

export default GameSetup;
