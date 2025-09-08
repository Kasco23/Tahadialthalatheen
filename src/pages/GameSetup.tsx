import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useAtom } from "jotai";
import {
  setSegmentConfig,
  createDailyRoom,
  getSegmentConfig,
  getSessionIdByCode,
  endSession,
  joinAsHost,
} from "../lib/mutations";
import { supabase } from "../lib/supabaseClient";
import LobbyStatus from "../components/LobbyStatus";
import { Alert } from "../components/Alert";
import { motion } from "framer-motion";
import { sessionAtom, sessionCodeAtom } from "../atoms";
import type { SegmentCode } from "../lib/types";
import PresenceHelper from "../lib/presence";

const GameSetup: React.FC = () => {
  const navigate = useNavigate();
  const { sessionCode } = useParams<{ sessionCode: string }>();
  const location = useLocation();
  type LocationState = { hostPassword?: string } | undefined;
  const hostPasswordFromState =
    (location.state as LocationState)?.hostPassword || null;

  // Use Jotai atoms instead of local state
  const [sessionId, setSessionId] = useAtom(sessionAtom);
  const [_currentSessionCode, setCurrentSessionCode] = useAtom(sessionCodeAtom);

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

  // Convert sessionCode to sessionId when component mounts
  useEffect(() => {
    const resolveSessionId = async () => {
      if (!sessionCode) return;

      try {
        const resolvedSessionId = await getSessionIdByCode(sessionCode);
        setSessionId(resolvedSessionId);
        setCurrentSessionCode(sessionCode);
      } catch (error) {
        console.error("Failed to resolve session code:", error);
        navigate("/");
      }
    };

    if (sessionCode && !sessionId) {
      resolveSessionId();
    }
  }, [sessionCode, sessionId, setSessionId, setCurrentSessionCode, navigate]);

  // Join as host when sessionId is available and host password is provided
  useEffect(() => {
    const joinAsHostEffect = async () => {
      if (
        !sessionId ||
        !sessionCode ||
        !hostPasswordFromState ||
        hostParticipantId
      ) {
        return; // Don't join if already joined or missing required data
      }

      try {
        console.log("Joining as host...", { sessionCode, sessionId });
        const participantId = await joinAsHost(
          sessionCode,
          hostPasswordFromState,
        );

        setHostParticipantId(participantId);

        // Store in localStorage for persistence
        localStorage.setItem("hostParticipantId", participantId);

        console.log("Successfully joined as host:", participantId);

        // Set up presence tracking for the host
        const helper = new PresenceHelper(sessionId);
        await helper.joinPresence({
          user_id: participantId,
          name: "", // Don't use name for host - we'll use role instead
          flag: "", // Host doesn't need a flag
          role: "Host",
          timestamp: new Date().toISOString(),
          is_active: true,
        });

        setPresenceHelper(helper);

        // Start heartbeat to maintain presence
        const heartbeatInterval = PresenceHelper.createHeartbeat(helper);
        setHeartbeat(heartbeatInterval);

        console.log("Host presence tracking started");
      } catch (error) {
        console.error("Failed to join as host:", error);
        setNotice({
          type: "error",
          message: `Failed to join as host: ${error instanceof Error ? error.message : "Unknown error"}`,
        });
      }
    };

    joinAsHostEffect();
  }, [sessionId, sessionCode, hostPasswordFromState, hostParticipantId]);

  // Cleanup presence tracking on unmount
  useEffect(() => {
    return () => {
      if (heartbeat) {
        PresenceHelper.clearHeartbeat(heartbeat);
      }
      if (presenceHelper) {
        presenceHelper.leavePresence().catch(console.error);
      }
    };
  }, [heartbeat, presenceHelper]);

  const fetchRoomInfo = useCallback(async () => {
    if (!sessionId) return;
    try {
      const { data, error } = await supabase
        .from("DailyRoom")
        .select("*")
        .eq("room_id", sessionId)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching room info:", error.message);
        return;
      }

      if (data) {
        setIsDailyRoomCreated(true);
        setRoomInfo(data);
      }
    } catch (error) {
      console.error("Unexpected error fetching room info:", error);
    }
  }, [sessionId]);

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
        console.error("Failed to load segment config:", error);
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
        console.error("Failed to update segment config:", error);
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
      setNotice({
        type: "success",
        message: "Daily room created successfully.",
      });
    } catch (error) {
      console.error("Error setting up game:", error);
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
        console.error("Error ending session:", error);
        setNotice({
          type: "error",
          message: `Error ending session: ${error instanceof Error ? error.message : "Unknown error"}`,
        });
      }
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col p-4" 
         style={{
           background: `
             radial-gradient(circle at 20% 30%, rgba(0, 100, 0, 0.3) 0%, transparent 40%),
             radial-gradient(circle at 80% 70%, rgba(0, 80, 0, 0.2) 0%, transparent 40%),
             linear-gradient(135deg, 
               #0d2818 0%,
               #1a3d2e 25%, 
               #0f2419 50%,
               #0a1a12 75%,
               #000000 100%
             )
           `
         }}>
      
      {/* Chalkboard grid overlay */}
      <div 
        className="absolute inset-0 opacity-15"
        style={{
          backgroundImage: `
            repeating-linear-gradient(0deg, 
              rgba(255, 255, 255, 0.1) 0px, 
              rgba(255, 255, 255, 0.1) 1px, 
              transparent 1px, 
              transparent 40px
            ),
            repeating-linear-gradient(90deg, 
              rgba(255, 255, 255, 0.1) 0px, 
              rgba(255, 255, 255, 0.1) 1px, 
              transparent 1px, 
              transparent 40px
            )
          `
        }}>
      </div>

      {/* Enhanced tactical board background */}
      <div className="absolute inset-0 opacity-25">
        {/* SVG tactical patterns */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice">
          <defs>
            {/* X pattern */}
            <g id="tacticalX">
              <path d="M-5,-5 L5,5 M5,-5 L-5,5" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round"/>
            </g>
            
            {/* O pattern */}
            <g id="tacticalO">
              <circle cx="0" cy="0" r="4" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2"/>
            </g>

            {/* 4-2-3-1 Formation pattern */}
            <g id="formation">
              {/* Goalkeeper */}
              <circle cx="600" cy="750" r="8" fill="rgba(255,255,255,0.8)" stroke="rgba(0,100,0,0.8)" strokeWidth="2"/>
              
              {/* Defense (4) */}
              <circle cx="450" cy="600" r="6" fill="rgba(255,255,255,0.7)" stroke="rgba(0,100,0,0.7)" strokeWidth="2"/>
              <circle cx="520" cy="580" r="6" fill="rgba(255,255,255,0.7)" stroke="rgba(0,100,0,0.7)" strokeWidth="2"/>
              <circle cx="680" cy="580" r="6" fill="rgba(255,255,255,0.7)" stroke="rgba(0,100,0,0.7)" strokeWidth="2"/>
              <circle cx="750" cy="600" r="6" fill="rgba(255,255,255,0.7)" stroke="rgba(0,100,0,0.7)" strokeWidth="2"/>
              
              {/* Midfield (2) */}
              <circle cx="520" cy="450" r="6" fill="rgba(255,255,255,0.7)" stroke="rgba(0,100,0,0.7)" strokeWidth="2"/>
              <circle cx="680" cy="450" r="6" fill="rgba(255,255,255,0.7)" stroke="rgba(0,100,0,0.7)" strokeWidth="2"/>
              
              {/* Attacking midfield (3) */}
              <circle cx="450" cy="320" r="6" fill="rgba(255,255,255,0.7)" stroke="rgba(0,100,0,0.7)" strokeWidth="2"/>
              <circle cx="600" cy="300" r="6" fill="rgba(255,255,255,0.7)" stroke="rgba(0,100,0,0.7)" strokeWidth="2"/>
              <circle cx="750" cy="320" r="6" fill="rgba(255,255,255,0.7)" stroke="rgba(0,100,0,0.7)" strokeWidth="2"/>
              
              {/* Striker (1) */}
              <circle cx="600" cy="180" r="8" fill="rgba(255,255,255,0.8)" stroke="rgba(0,100,0,0.8)" strokeWidth="2"/>

              {/* Attack arrows */}
              <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" 
                 refX="10" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill="rgba(255,255,255,0.6)" />
                </marker>
              </defs>
              
              {/* Forward passes */}
              <path d="M520,450 Q580,380 600,300" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" markerEnd="url(#arrowhead)" strokeDasharray="5,5"/>
              <path d="M680,450 Q620,380 600,300" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" markerEnd="url(#arrowhead)" strokeDasharray="5,5"/>
              
              {/* Wing attacks */}
              <path d="M450,320 Q400,250 450,180" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" markerEnd="url(#arrowhead)" strokeDasharray="5,5"/>
              <path d="M750,320 Q800,250 750,180" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" markerEnd="url(#arrowhead)" strokeDasharray="5,5"/>
              
              {/* Central attack */}
              <path d="M600,300 L600,180" stroke="rgba(255,255,255,0.6)" strokeWidth="3" markerEnd="url(#arrowhead)"/>
            </g>
          </defs>

          {/* Scattered tactical Xs */}
          <use href="#tacticalX" x="150" y="200" transform="rotate(15)"/>
          <use href="#tacticalX" x="950" y="300" transform="rotate(-20)"/>
          <use href="#tacticalX" x="200" y="500" transform="rotate(45)"/>
          <use href="#tacticalX" x="1000" y="600" transform="rotate(-30)"/>
          
          {/* Scattered tactical Os */}
          <use href="#tacticalO" x="100" y="350"/>
          <use href="#tacticalO" x="1050" y="450"/>
          <use href="#tacticalO" x="250" y="650"/>
          <use href="#tacticalO" x="950" y="150"/>

          {/* Center pitch circle */}
          <circle cx="600" cy="400" r="80" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2"/>
          
          {/* Formation diagram */}
          <use href="#formation"/>
          
          {/* Penalty areas */}
          <rect x="500" y="50" width="200" height="100" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" rx="10"/>
          <rect x="500" y="650" width="200" height="100" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" rx="10"/>
        </svg>
      </div>

      {/* Subtle chalk dust texture overlay */}
      <div 
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `
            radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 0%, transparent 2%),
            radial-gradient(circle at 75% 75%, rgba(255,255,255,0.1) 0%, transparent 2%),
            radial-gradient(circle at 50% 50%, rgba(255,255,255,0.05) 0%, transparent 3%)
          `,
          backgroundSize: '200px 200px, 150px 150px, 300px 300px'
        }}>
      </div>

      {/* Header */}
      <div className="relative z-10 text-center mb-6">
        <h1 className="text-4xl md:text-5xl font-black text-white mb-2 drop-shadow-2xl filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]" 
            style={{textShadow: '2px 2px 4px rgba(0,0,0,0.8), 0 0 10px rgba(255,255,255,0.3)'}}>
          🎮 Game Setup
        </h1>
        <p className="text-green-100 text-lg drop-shadow-lg font-medium" 
           style={{textShadow: '1px 1px 3px rgba(0,0,0,0.7)'}}>
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

              {notice && (
                <Alert
                  type={notice.type}
                  message={notice.message}
                  onClose={() => setNotice(null)}
                />
              )}

              {/* Live lobby summary */}
              <div className="mb-4 p-3 bg-gray-50 border rounded text-sm text-gray-700 flex items-center justify-between">
                <span>Participants joined:</span>
                <span className="font-semibold">{participantCount}/3</span>
              </div>

              {/* session code moved to LobbyStatus */}

              <form className="space-y-6">
                {/* Segment Settings */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Question Counts
                  </h3>
                  <div className="space-y-4">
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
                        min="0"
                        value={segments.WDYK}
                        onChange={(e) =>
                          handleSegmentChange("WDYK", e.target.value)
                        }
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
                        min="0"
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
                        min="0"
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
                        min="0"
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
                        min="0"
                        value={segments.REMO}
                        onChange={(e) =>
                          handleSegmentChange("REMO", e.target.value)
                        }
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-4">
                  {isDailyRoomCreated && roomInfo ? (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className="p-4 bg-green-50 border border-green-200 rounded-lg"
                    >
                      <p className="text-green-800 text-sm">
                        <strong>Daily Room Created!</strong>
                      </p>
                      <p className="text-green-600 text-xs mt-1">
                        Room URL: {roomInfo.room_url}
                      </p>
                    </motion.div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleCreateDailyRoom}
                      disabled={isLoading}
                      className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 transform hover:scale-105 disabled:transform-none"
                    >
                      {isLoading ? "⏳ Creating..." : "📹 Create Daily Room"}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleStartQuiz}
                    disabled={!sessionId || !isDailyRoomCreated}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 transform hover:scale-105 disabled:transform-none"
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
                  hostPassword={hostPasswordFromState}
                  onEndSession={handleEndSession}
                  onLobbyUpdate={handleLobbyUpdate}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Chalkboard atmosphere effects */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/60 via-green-900/20 to-transparent opacity-40"></div>
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/40 via-green-900/10 to-transparent opacity-30"></div>
    </div>
  );
};

export default GameSetup;
