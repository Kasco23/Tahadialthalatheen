import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
import { QuestionManager } from "../components/QuestionManager";
import {
  saveSessionBlob,
  getSessionBlob,
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
    () => localStorage.getItem("hostParticipantId"),
  );
  const [presenceHelper, setPresenceHelper] = useState<PresenceHelper | null>(
    null,
  );
  const [heartbeat, setHeartbeat] = useState<NodeJS.Timeout | null>(null);
  const [notice, setNotice] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [segments, setSegments] = useState({
    WDYK: 4, // What Do You Know
    AUCT: 2, // Auction
    BELL: 10, // Bell
    UPDW: 10, // Up Down
    REMO: 4, // Remontada
  });
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isQuestionManagerOpen, setIsQuestionManagerOpen] = useState(false);

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
          {} as Record<SegmentCode, number>,
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

  const handleSegmentChange = async (
    segment: keyof typeof segments,
    value: string,
  ) => {
    const numValue = parseInt(value) || 0;

    // Validate range (1-50 questions per segment)
    if (numValue < 0 || numValue > 50) {
      setNotice({
        type: "error",
        message: "Question count must be between 1 and 50",
      });
      return;
    }

    setSegments((prev) => ({
      ...prev,
      [segment]: numValue,
    }));

    // If session exists, update the config in Supabase immediately
    if (sessionId) {
      try {
        await setSegmentConfig(sessionId, [
          {
            segment_code: segment as SegmentCode,
            questions_count: numValue,
          },
        ]);
      } catch (error) {
        Logger.error("Failed to update segment config:", error);
        setNotice({
          type: "error",
          message: "Failed to save segment configuration",
        });
      }
    }
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
      ([, count]) => count < 1 || count > 50,
    );
    if (hasInvalidSegments) {
      setNotice({
        type: "error",
        message: "All segments must have between 1 and 50 questions.",
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

  const handleStartQuiz = () => {
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
    // Navigate to the quiz with the session code
    navigate(`/quiz/${sessionCode}`);
  };

  const handleLobbyUpdate = useCallback(
    (info: { participantCount: number; roomReady: boolean }) => {
      setParticipantCount(info.participantCount);
      if (info.roomReady && !isDailyRoomCreated) {
        setIsDailyRoomCreated(true);
      }
    },
    [isDailyRoomCreated],
  );

  const handleEndSession = async () => {
    if (!sessionId) {
      setNotice({ type: "error", message: "No session available." });
      return;
    }

    const confirmed = confirm(
      "Are you sure you want to end this session? This action cannot be undone.",
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
            {/* Left side - Game Configuration */}
            <div className="flex items-start justify-center">
              <div className="w-full max-w-lg bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl border border-white/20 p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                  ⚙️ Game Configuration
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

                {/* Room Created Confirmation */}
                {isDailyRoomCreated && roomInfo && (
                  <div className="mb-6 p-4 bg-green-50 border-2 border-green-400 rounded-lg">
                    <p className="text-green-800 font-semibold mb-2 flex items-center">
                      ✅ Daily Room Created!
                    </p>
                    <p className="text-sm text-green-700 break-all">
                      Room URL: {roomInfo.room_url}
                    </p>
                  </div>
                )}

                {/* Segment Configuration Form */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleStartQuiz();
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2 border-b pb-2">
                      <span>📋</span> Quiz Segments
                    </h3>

                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4 items-center">
                        <label
                          htmlFor="wdyk"
                          className="text-sm font-medium text-gray-700"
                        >
                          WDYK (What Do You Know)
                        </label>
                        <input
                          type="number"
                          id="wdyk"
                          min="1"
                          max="50"
                          value={segments.WDYK}
                          onChange={(e) => {
                            handleSegmentChange("WDYK", e.target.value);
                          }}
                          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4 items-center">
                        <label
                          htmlFor="auct"
                          className="text-sm font-medium text-gray-700"
                        >
                          AUCT (Auction)
                        </label>
                        <input
                          type="number"
                          id="auct"
                          min="1"
                          max="50"
                          value={segments.AUCT}
                          onChange={(e) =>
                            handleSegmentChange("AUCT", e.target.value)
                          }
                          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4 items-center">
                        <label
                          htmlFor="bell"
                          className="text-sm font-medium text-gray-700"
                        >
                          BELL (Bell)
                        </label>
                        <input
                          type="number"
                          id="bell"
                          min="1"
                          max="50"
                          value={segments.BELL}
                          onChange={(e) =>
                            handleSegmentChange("BELL", e.target.value)
                          }
                          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4 items-center">
                        <label
                          htmlFor="updw"
                          className="text-sm font-medium text-gray-700"
                        >
                          UPDW (Up Down)
                        </label>
                        <input
                          type="number"
                          id="updw"
                          min="1"
                          max="50"
                          value={segments.UPDW}
                          onChange={(e) =>
                            handleSegmentChange("UPDW", e.target.value)
                          }
                          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4 items-center">
                        <label
                          htmlFor="remo"
                          className="text-sm font-medium text-gray-700"
                        >
                          REMO (Remontada)
                        </label>
                        <input
                          type="number"
                          id="remo"
                          min="1"
                          max="50"
                          value={segments.REMO}
                          onChange={(e) =>
                            handleSegmentChange("REMO", e.target.value)
                          }
                          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Create Questions with AI Button */}
                  {import.meta.env.VITE_ENABLE_AI_AUTHORING === "true" && (
                    <div className="pt-4">
                      <button
                        type="button"
                        onClick={() =>
                          navigate("/create-questions", {
                            state: {
                              sessionId,
                              sessionCode,
                              roundCounts: segments,
                            },
                          })
                        }
                        className="w-full py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg transition-all duration-300 hover:shadow-2xl hover:scale-105 text-base"
                      >
                        🤖 Create Questions with AI
                      </button>
                    </div>
                  )}

                  {/* Manage Questions Button */}
                  <div className="pt-4">
                    <button
                      type="button"
                      onClick={() => setIsQuestionManagerOpen(true)}
                      className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold rounded-xl shadow-lg transition-all duration-300 hover:shadow-2xl hover:scale-105 text-base"
                    >
                      📝 Manage Questions
                    </button>
                  </div>

                  {/* Start Quiz Button */}
                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={!isDailyRoomCreated || participantCount < 2}
                      className="w-full py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 disabled:from-gray-400 disabled:to-gray-500 text-black font-bold rounded-xl shadow-lg transition-all duration-300 hover:shadow-2xl hover:scale-105 disabled:cursor-not-allowed disabled:hover:scale-100 text-lg"
                    >
                      🚀 Start Quiz
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
            onClick={() => setIsInviteModalOpen(true)}
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
            onClose={() => setIsInviteModalOpen(false)}
            sessionCode={sessionCode}
            sessionId={sessionId}
          />
        )}

        {/* Question Manager Modal */}
        {sessionId && (
          <QuestionManager
            isOpen={isQuestionManagerOpen}
            onClose={() => setIsQuestionManagerOpen(false)}
            sessionId={sessionId}
          />
        )}
      </div>
    </StadiumBackground>
  );
};

export default GameSetup;
