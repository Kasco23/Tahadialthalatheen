import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAtom } from "jotai";
import { useDaily, useDailyEvent } from "@daily-co/daily-react";
import { supabase } from "../lib/supabaseClient";
import { useSession } from "../lib/sessionHooks";
import {
  getSessionIdByCode,
  getDailyRoom,
  leaveLobby,
  createDailyToken,
} from "../lib/mutations";
import {
  sessionAtom,
  sessionCodeAtom,
  participantsAtom,
  dailyRoomUrlAtom,
} from "../atoms";
import { VideoCall } from "../components/VideoCall";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import type { Database } from "../lib/types/supabase";

type ParticipantRow = Database["public"]["Tables"]["Participant"]["Row"];

interface ParticipantCardProps {
  player: ParticipantRow;
  lobbyPresence: string;
  videoPresence: string;
  getRoleDisplay: (player: ParticipantRow) => string;
}

const ParticipantCard: React.FC<ParticipantCardProps> = ({ 
  player, 
  lobbyPresence, 
  videoPresence, 
  getRoleDisplay 
}) => {
  return (
    <div
      className={`bg-white/5 backdrop-blur-sm rounded-lg p-4 border-2 transition-all duration-300 ${
        player.lobby_presence === "Joined"
          ? "border-green-400 bg-green-500/10"
          : "border-red-400 bg-red-500/10"
      }`}
    >
      {/* Player Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className={`fi fi-${player.flag || "sa"} text-lg`}></span>
          {player.team_logo_url && (
            <img
              src={player.team_logo_url}
              alt={`${player.name} team logo`}
              className="w-6 h-6 object-contain rounded"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          )}
          <div>
            <div className="text-sm font-bold text-white">{player.name}</div>
            <div className="text-xs text-blue-200">{getRoleDisplay(player)}</div>
          </div>
        </div>
        <div
          className={`text-lg ${player.lobby_presence === "Joined" ? "animate-pulse text-green-500" : "text-red-500"}`}
        >
          {player.lobby_presence === "Joined" ? "🟢" : "🔴"}
        </div>
      </div>

      {/* Presence Status */}
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-xs text-blue-200">Lobby:</span>
          <span
            className={`text-xs font-medium ${
              player.lobby_presence === "Joined"
                ? "text-green-400"
                : "text-red-400"
            }`}
          >
            {lobbyPresence}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-blue-200">Video:</span>
          <span
            className={`text-xs font-medium ${
              player.video_presence ? "text-blue-400" : "text-gray-400"
            }`}
          >
            {videoPresence}
          </span>
        </div>
      </div>
    </div>
  );
};

const Lobby: React.FC = () => {
  const { sessionCode } = useParams<{ sessionCode: string }>();
  const navigate = useNavigate();

  // Use Jotai atoms
  const [sessionId, setSessionId] = useAtom(sessionAtom);
  const [_currentSessionCode, setCurrentSessionCode] = useAtom(sessionCodeAtom);
  const [_participants, _setParticipants] = useAtom(participantsAtom);
  const [dailyRoomUrl] = useAtom(dailyRoomUrlAtom);

  // Daily call object state
  // Use modern Daily hooks
  const callObject = useDaily();
  const [isJoiningCall, setIsJoiningCall] = useState(false);
  const [callError, setCallError] = useState<string | null>(null);
  const [isInCall, setIsInCall] = useState(false);

  const {
    session,
    loading: sessionLoading,
    error: sessionError,
  } = useSession(sessionId);
  const [players, setPlayers] = useState<ParticipantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dailyRoom, setDailyRoom] = useState<{
    room_url: string;
    ready: boolean;
  } | null>(null);

  // Convert sessionCode to sessionId when component mounts
  useEffect(() => {
    const resolveSessionId = async () => {
      if (!sessionCode) {
        setError("No session code provided");
        setLoading(false);
        return;
      }

      try {
        const resolvedSessionId = await getSessionIdByCode(sessionCode);
        setSessionId(resolvedSessionId);
        setCurrentSessionCode(sessionCode);
      } catch (error) {
        console.error("Failed to resolve session code:", error);
        setError("Invalid session code");
        setLoading(false);
      }
    };

    if (sessionCode && !sessionId) {
      resolveSessionId();
    }
  }, [sessionCode, sessionId, setSessionId, setCurrentSessionCode]);

  // Load Daily room data when sessionId is available
  useEffect(() => {
    const loadDailyRoom = async () => {
      if (!sessionId) return;

      try {
        const roomData = await getDailyRoom(sessionId);
        setDailyRoom(roomData);
        console.log("Daily room URL from atom:", dailyRoomUrl);
      } catch (error) {
        console.error("Failed to load Daily room data:", error);
      }
    };

    if (sessionId) {
      loadDailyRoom();
    }
  }, [sessionId, dailyRoomUrl]);

  useEffect(() => {
    if (!sessionId) {
      setError("No session ID provided");
      setLoading(false);
      return;
    }

    let isMounted = true;

    // Subscribe to participant changes
    const subscribeToPlayers = () => {
      const channel = supabase
        .channel(`participants_${sessionId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "Participant",
            filter: `session_id=eq.${sessionId}`,
          },
          (
            payload: RealtimePostgresChangesPayload<
              Database["public"]["Tables"]["Participant"]["Row"]
            >,
          ) => {
            console.log("Participant update:", payload);

            if (!isMounted) return;

            if (payload.eventType === "INSERT") {
              if (payload.new)
                setPlayers((prev) => [...prev, payload.new as ParticipantRow]);
            } else if (payload.eventType === "UPDATE") {
              setPlayers((prev) =>
                prev.map((player) =>
                  player.participant_id === (payload.new?.participant_id || "")
                    ? { ...player, ...(payload.new as ParticipantRow) }
                    : player,
                ),
              );
            } else if (payload.eventType === "DELETE") {
              setPlayers((prev) =>
                prev.filter(
                  (player) =>
                    player.participant_id !==
                    (payload.old?.participant_id || ""),
                ),
              );
            }
          },
        )
        .subscribe((status) => {
          console.log("Participants subscription status:", status);
        });

      return channel;
    };

    // Load initial participants
    const loadInitialPlayers = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from("Participant")
          .select("*")
          .eq("session_id", sessionId)
          .order("name", { ascending: true });

        if (fetchError) {
          console.error("Error loading players:", fetchError);
          setError("Failed to load participants");
        } else {
          if (isMounted) {
            setPlayers((data as ParticipantRow[]) || []);
            setError(null);
          }
        }
      } catch (err) {
        console.error("Error in loadInitialPlayers:", err);
        if (isMounted) {
          setError("An unexpected error occurred");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Initialize
    loadInitialPlayers();
    const channel = subscribeToPlayers();

    // Cleanup
    return () => {
      isMounted = false;
      channel.unsubscribe();
    };
  }, [sessionId]);

  // Use Daily events with hooks for better integration
  useDailyEvent("joined-meeting", () => {
    console.log("✅ Successfully joined Daily call");
    setIsInCall(true);
  });

  useDailyEvent("left-meeting", (event) => {
    console.log("👋 Left Daily call:", event);
    setIsInCall(false);
    
    // Check if user was ejected
    if (event && "reason" in event) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const reason = (event as any).reason;
      if (reason === "ejected" || reason === "hidden") {
        setCallError("You have been removed from the call by the host.");
        setTimeout(() => {
          navigate("/");
        }, 3000);
      }
    }
  });

  useDailyEvent("participant-left", (event) => {
    console.log("👋 Participant left Daily call:", event.participant);
    
    if (event && "reason" in event) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const reason = (event as any).reason;
      if (reason === "ejected" || reason === "hidden") {
        const participantName =
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (event as any).participant?.user_name || "unknown";
        console.log(
          `Participant ${participantName} was ejected from the call`,
        );
      }
    }
  });

  useDailyEvent("error", (error) => {
    console.error("❌ Daily call error:", error);
    setCallError(
      typeof error === "string" ? error : "An error occurred during the call",
    );
  });

  const getPresenceStatus = (p: ParticipantRow) => {
    const lobbyPresence =
      p.lobby_presence === "Joined"
        ? "🟢 Online"
        : p.lobby_presence === "Disconnected"
          ? "🟠 Disconnected"
          : "🔴 Not Joined";
    const videoPresence = p.video_presence ? "📹 In Call" : "📵 Not in Call";
    return { lobbyPresence, videoPresence };
  };

  const getRoleDisplay = (p: ParticipantRow) => {
    if (p.role === "Host") return "👑 Host";
    if (p.role === "GameMaster") return "🎮 Game Master";
    if (p.role === "Player1") return "⚽ Player A";
    if (p.role === "Player2") return "🏆 Player B";
    return `👤 ${p.role}`;
  };

  const canStartQuiz = () => {
    if (!session) return false;
    const joinedNonHostsAndGMs = players.filter(
      (p) => !["Host", "GameMaster"].includes(p.role) && p.lobby_presence === "Joined",
    );
    return joinedNonHostsAndGMs.length >= 2 && session.phase === "Lobby";
  };

  const handleStartQuiz = () => {
    // Navigate to quiz page
    navigate(`/quiz/${sessionId}`);
  };

  const handleRefresh = async () => {
    // Re-run initial loaders
    try {
      setLoading(true);
      setError(null);
      // Participants
      const { data: pData, error: pErr } = await supabase
        .from("Participant")
        .select("*")
        .eq("session_id", sessionId);
      if (!pErr) setPlayers((pData as ParticipantRow[]) || []);
      // Daily room
      const { data: rData } = await supabase
        .from("DailyRoom")
        .select("room_url, ready")
        .eq("room_id", sessionId)
        .single();
      if (rData)
        setDailyRoom({
          room_url: (rData as { room_url: string }).room_url,
          ready: Boolean((rData as { ready: boolean | null }).ready),
        });
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveLobby = async () => {
    try {
      const pid = localStorage.getItem("tt_participant_id");
      if (pid) {
        await leaveLobby(pid);
      }
    } catch (e) {
      console.error("Failed to update presence on leave:", e);
    } finally {
      navigate("/");
    }
  };

  // Modern Daily call management using hooks
  const handleJoinDailyCall = async () => {
    if (!dailyRoom?.room_url) {
      setCallError(
        "No Daily room available. Host needs to create a room first.",
      );
      return;
    }

    if (!sessionCode || !callObject) {
      setCallError("No session code or call object available.");
      return;
    }

    // Check if we're in local development with mock room
    const isLocalDev = window.location.hostname === "localhost" && window.location.port === "5173";
    const isMockRoom = dailyRoom.room_url.includes("thirty.daily.co") && isLocalDev;

    if (isMockRoom) {
      setCallError("🚧 Video calls are disabled in development mode. Use 'netlify dev' for full functionality.");
      return;
    }

    setIsJoiningCall(true);
    setCallError(null);

    try {
      // Get participant name from localStorage or current participant data
      const participantName = 
        localStorage.getItem("tt_participant_name") || 
        localStorage.getItem("playerName") ||
        localStorage.getItem("hostName") ||
        (players.length > 0 && players.find(p => p.participant_id === localStorage.getItem("participantId"))?.name) ||
        "Player";

      console.log("Using participant name for token:", participantName);

      // Fetch the token for joining the Daily room
      const tokenResponse = await createDailyToken(
        sessionCode,
        participantName,
      );

      // Join the Daily room using the modern hook-based approach
      await callObject.join({
        url: dailyRoom.room_url,
        token: tokenResponse.token,
        userName: participantName,
      });

      console.log("Successfully initiated Daily room join:", {
        roomUrl: dailyRoom.room_url,
        userName: participantName,
      });
    } catch (error) {
      console.error("Failed to join Daily room:", error);
      setCallError(
        error instanceof Error ? error.message : "Failed to join video call",
      );
    } finally {
      setIsJoiningCall(false);
    }
  };

  const handleLeaveDailyCall = async () => {
    if (callObject) {
      try {
        await callObject.leave();
        setIsInCall(false);
        console.log("Left Daily call");
      } catch (error) {
        console.error("Error leaving Daily call:", error);
      }
    }
  };

  if (sessionLoading || loading) {
    return (
      <div className="dugout-background">
        <div className="dugout-seating"></div>
        <div className="dugout-canopy"></div>
        <div className="dugout-pitch"></div>

        <div className="dugout-content flex items-center justify-center">
          <div className="text-white text-xl">Loading Lobby...</div>
        </div>
      </div>
    );
  }

  if (sessionError || error) {
    return (
      <div className="dugout-background">
        <div className="dugout-seating"></div>
        <div className="dugout-canopy"></div>
        <div className="dugout-pitch"></div>

        <div className="dugout-content flex items-center justify-center">
          <div className="text-white text-xl">{sessionError || error}</div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="dugout-background">
        <div className="dugout-seating"></div>
        <div className="dugout-canopy"></div>
        <div className="dugout-pitch"></div>

        <div className="dugout-content flex items-center justify-center">
          <div className="text-white text-xl">Session not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="dugout-background">
      {/* Stadium lighting effect */}
      <div className="dugout-seating"></div>
      <div className="dugout-canopy"></div>
      <div className="dugout-pitch"></div>

      <div className="dugout-content p-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            🎮 Game Lobby
          </h1>
          <div className="text-xl text-blue-100">
            Session:{" "}
            <span className="font-bold text-yellow-300">{sessionCode}</span>
          </div>
          <div className="text-sm text-blue-200 mt-2">
            Phase: <span className="font-bold">{session.phase}</span> | Game
            State: <span className="font-bold">{session.game_state}</span>
          </div>
        </div>

        {/* Responsive Layout Container */}
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            
            {/* Participants Sidebar */}
            <div className="xl:col-span-1 space-y-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                <h2 className="text-2xl font-bold text-white mb-4 text-center">
                  👥 Participants ({players.length})
                </h2>

                {players.length === 0 ? (
                  <div className="text-center text-blue-200 py-8">
                    <div className="text-4xl mb-4">👤</div>
                    <div>No players have joined yet</div>
                    <div className="text-sm mt-2">Waiting for participants...</div>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {players.map((player) => {
                      const { lobbyPresence, videoPresence } = getPresenceStatus(player);
                      return (
                        <ParticipantCard 
                          key={player.participant_id}
                          player={player}
                          lobbyPresence={lobbyPresence}
                          videoPresence={videoPresence}
                          getRoleDisplay={getRoleDisplay}
                        />
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                <div className="space-y-3">
                  {canStartQuiz() && (
                    <button
                      onClick={handleStartQuiz}
                      className="w-full px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg transition-colors duration-200 transform hover:scale-105"
                    >
                      🚀 Start Quiz
                    </button>
                  )}
                  <button
                    onClick={handleRefresh}
                    className="w-full px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg transition-colors duration-200"
                  >
                    🔄 Refresh
                  </button>
                  <button
                    onClick={handleLeaveLobby}
                    className="w-full px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg transition-colors duration-200"
                  >
                    🚪 Leave Lobby
                  </button>
                </div>
              </div>
            </div>

            {/* Main Video Area */}
            <div className="xl:col-span-2 space-y-6">
              
              {/* Video Call Component */}
              {dailyRoom && (
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                  <VideoCall
                    players={players}
                    sessionCode={sessionCode || ""}
                    participantName={
                      localStorage.getItem("tt_participant_name") || 
                      localStorage.getItem("playerName") ||
                      localStorage.getItem("hostName") ||
                      (players.length > 0 && players.find(p => p.participant_id === localStorage.getItem("participantId"))?.name) ||
                      "Player"
                    }
                    onJoinCall={handleJoinDailyCall}
                    onLeaveCall={handleLeaveDailyCall}
                  />
                </div>
              )}

              {/* Video Room Controls */}
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                <h3 className="text-xl font-bold text-white mb-4 text-center">
                  🎥 Video Communication
                </h3>
                <div className="text-sm text-blue-200 mb-4 text-center">
                  Video Room:{" "}
                  {dailyRoom?.ready ? "✅ Ready" : "⏳ Waiting for host"}
                </div>

                {/* Error message */}
                {callError && (
                  <div className="p-3 mb-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                    {callError}
                  </div>
                )}

                {/* Join/Leave button */}
                <div className="text-center">
                  {!isInCall ? (
                    <button
                      onClick={handleJoinDailyCall}
                      disabled={isJoiningCall || !dailyRoom?.room_url}
                      className={`px-8 py-3 rounded-lg font-medium transition-colors ${
                        isJoiningCall || !dailyRoom?.room_url
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                    >
                      {isJoiningCall ? "Joining..." : "🎥 Join Video Call"}
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <div className="text-green-400 font-medium">
                        ✅ Connected to video call
                      </div>
                      <button
                        onClick={handleLeaveDailyCall}
                        className="px-8 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                      >
                        📞 Leave Video Call
                      </button>
                    </div>
                  )}

                  {!dailyRoom?.room_url && (
                    <p className="text-sm text-blue-300 mt-3">
                      Waiting for host to create video room...
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Lobby;
