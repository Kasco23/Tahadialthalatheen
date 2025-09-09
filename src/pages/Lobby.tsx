import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAtom } from "jotai";
import { useDaily } from "@daily-co/daily-react";
import { supabase } from "../lib/supabaseClient";
import { useSession } from "../lib/sessionHooks";
import { getSessionIdByCode, getDailyRoom, leaveLobby } from "../lib/mutations";
import { sessionAtom, sessionCodeAtom, participantsAtom, dailyRoomUrlAtom } from "../atoms";
import { DailyJoinButton } from "../components/DailyJoinButton";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import type { Database } from "../lib/types/supabase";

type ParticipantRow = Database["public"]["Tables"]["Participant"]["Row"];

const Lobby: React.FC = () => {
  const { sessionCode } = useParams<{ sessionCode: string }>();
  const navigate = useNavigate();

  // Use Jotai atoms
  const [sessionId, setSessionId] = useAtom(sessionAtom);
  const [_currentSessionCode, setCurrentSessionCode] = useAtom(sessionCodeAtom);
  const [_participants, _setParticipants] = useAtom(participantsAtom);
  const [dailyRoomUrl] = useAtom(dailyRoomUrlAtom);

  // Daily React hooks
  const daily = useDaily();

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
        // Log Daily context for debugging
        console.log("Daily context available:", !!daily);
        console.log("Daily room URL from atom:", dailyRoomUrl);
      } catch (error) {
        console.error("Failed to load Daily room data:", error);
      }
    };

    if (sessionId) {
      loadDailyRoom();
    }
  }, [sessionId, daily, dailyRoomUrl]);

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
    if (p.role === "Player1") return "⚽ Player A";
    if (p.role === "Player2") return "🏆 Player B";
    return `👤 ${p.role}`;
  };

  const canStartQuiz = () => {
    if (!session) return false;
    const joinedNonHosts = players.filter(
      (p) => p.role !== "Host" && p.lobby_presence === "Joined",
    );
    return joinedNonHosts.length >= 2 && session.phase === "Lobby";
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

  if (sessionLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 flex items-center justify-center">
        <div className="text-white text-xl">Loading Lobby...</div>
      </div>
    );
  }

  if (sessionError || error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-600 via-red-700 to-red-800 flex items-center justify-center">
        <div className="text-white text-xl">{sessionError || error}</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-600 via-gray-700 to-gray-800 flex items-center justify-center">
        <div className="text-white text-xl">Session not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🎮 Game Lobby</h1>
          <div className="text-xl text-blue-100">
            Session:{" "}
            <span className="font-bold text-yellow-300">{sessionCode}</span>
          </div>
          <div className="text-sm text-blue-200 mt-2">
            Phase: <span className="font-bold">{session.phase}</span> | Game
            State: <span className="font-bold">{session.game_state}</span>
          </div>
        </div>

        {/* Players List */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-6">
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
            <div className="grid gap-4 md:grid-cols-2">
              {players.map((player) => {
                const { lobbyPresence, videoPresence } =
                  getPresenceStatus(player);
                return (
                  <div
                    key={player.participant_id}
                    className={`bg-white/10 backdrop-blur-sm rounded-lg p-6 border-2 transition-all duration-300 ${
                      player.lobby_presence === "Joined"
                        ? "border-green-400 bg-green-500/10"
                        : "border-red-400 bg-red-500/10"
                    }`}
                  >
                    {/* Player Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`fi fi-${player.flag || "sa"} text-2xl`}
                          ></span>
                          {player.team_logo_url && (
                            <img
                              src={player.team_logo_url}
                              alt={`${player.name} team logo`}
                              className="w-8 h-8 object-contain rounded"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          )}
                        </div>
                        <div>
                          <div className="text-xl font-bold text-white">
                            {player.name}
                          </div>
                          <div className="text-sm text-blue-200">
                            {getRoleDisplay(player)}
                          </div>
                        </div>
                      </div>
                      <div
                        className={`text-2xl ${player.lobby_presence === "Joined" ? "animate-pulse text-green-500" : "text-red-500"}`}
                      >
                        {player.lobby_presence === "Joined" ? "🟢" : "🔴"}
                      </div>
                    </div>

                    {/* Presence Status */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-blue-200">Lobby:</span>
                        <span
                          className={`text-sm font-medium ${
                            player.lobby_presence === "Joined"
                              ? "text-green-400"
                              : "text-red-400"
                          }`}
                        >
                          {lobbyPresence}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-blue-200">Video:</span>
                        <span
                          className={`text-sm font-medium ${
                            player.video_presence
                              ? "text-blue-400"
                              : "text-gray-400"
                          }`}
                        >
                          {videoPresence}
                        </span>
                      </div>
                    </div>

                    {/* Join Time */}
                    <div className="mt-4 pt-4 border-t border-white/20">
                      <div className="text-xs text-blue-300">
                        Role: {player.role}
                      </div>
                      {player.lobby_presence === "Joined" && (
                        <div className="text-xs text-green-400 mt-1">
                          Video: {player.video_presence ? "On" : "Off"}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="text-center space-x-4">
          {canStartQuiz() && (
            <button
              onClick={handleStartQuiz}
              className="px-8 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg transition-colors duration-200 transform hover:scale-105"
            >
              🚀 Start Quiz
            </button>
          )}
          <button
            onClick={handleRefresh}
            className="px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg transition-colors duration-200"
          >
            🔄 Refresh
          </button>
          <button
            onClick={handleLeaveLobby}
            className="px-8 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg transition-colors duration-200"
          >
            🚪 Leave Lobby
          </button>
        </div>

        {/* Video Room Section */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-6 text-center">
          <h3 className="text-xl font-bold text-white mb-4">🎥 Video Communication</h3>
          <div className="text-sm text-blue-200 mb-4">
            Video Room: {dailyRoom?.ready ? "✅ Ready" : "⏳ Waiting for host"}
          </div>
          {sessionCode && (
            <DailyJoinButton 
              sessionCode={sessionCode} 
              participantName={localStorage.getItem("tt_participant_name") || "Player"} 
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Lobby;
