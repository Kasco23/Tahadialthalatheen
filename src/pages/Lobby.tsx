import { Logger } from "../lib/logger";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAtom } from "jotai";

import { supabase } from "../lib/supabaseClient";
import { useSession } from "../lib/sessionHooks";
import { leaveLobby } from "../lib/mutations";
import { useSessionData } from "../lib/useSessionData";
import { sessionAtom, sessionCodeAtom } from "../atoms";
import { VideoCall } from "../components/VideoCall";
import { VideoCallJoinButton } from "../components/VideoCallJoinButton";
import { Flag } from "../components/Flag";
import { LobbyLogo } from "../components/LobbyLogo";
import { LOBBY_PRESENCE, PARTICIPANT_ROLE, SEAT_TO_ROLE } from "../lib/types";
import { resolveSeatFromUrl, setSeatInStorage } from "../lib/userSession";
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
  getRoleDisplay,
}) => {
  return (
    <div
      className={`bg-white/5 backdrop-blur-sm rounded-lg p-4 border-2 transition-all duration-300 ${
        player.lobby_presence === LOBBY_PRESENCE.JOINED
          ? "border-green-400 bg-green-500/10"
          : "border-red-400 bg-red-500/10"
      }`}
    >
      {/* Player Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Flag code={player.flag || "sa"} className="text-lg" />
          {player.team_logo_url && (
            <LobbyLogo logoUrl={player.team_logo_url} teamName={player.name} />
          )}
          <div>
            <div className="text-sm font-bold text-white">{player.name}</div>
            <div className="text-xs text-blue-200">
              {getRoleDisplay(player)}
            </div>
          </div>
        </div>
        <div
          className={`text-lg ${player.lobby_presence === LOBBY_PRESENCE.JOINED ? "animate-pulse text-green-500" : "text-red-500"}`}
        >
          {player.lobby_presence === LOBBY_PRESENCE.JOINED ? "🟢" : "🔴"}
        </div>
      </div>

      {/* Presence Status */}
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-xs text-blue-200">Lobby:</span>
          <span
            className={`text-xs font-medium ${
              player.lobby_presence === LOBBY_PRESENCE.JOINED
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
  const { sessionCode, seat } = useParams<{ sessionCode: string; seat?: string }>();
  const navigate = useNavigate();

  // Resolve seat using priority: URL param > localStorage > null
  const resolvedSeat = resolveSeatFromUrl(seat);
  
  // Set resolved seat in localStorage if found
  useEffect(() => {
    if (resolvedSeat) {
      setSeatInStorage(resolvedSeat);
    }
  }, [resolvedSeat]);

  // Navigate to canonical URL if seat is resolved but not in URL
  useEffect(() => {
    if (resolvedSeat && !seat && sessionCode) {
      navigate(`/lobby/${sessionCode}/${resolvedSeat}`, { replace: true });
    }
  }, [resolvedSeat, seat, sessionCode, navigate]);

  // Map seat to role using SEAT_TO_ROLE helper
  const userRole = resolvedSeat ? SEAT_TO_ROLE[resolvedSeat] : null;

  // Log user role for debugging (will be used in future steps)
  useEffect(() => {
    if (userRole) {
      Logger.log("User role resolved from seat:", { seat: resolvedSeat, role: userRole });
    }
  }, [userRole, resolvedSeat]);

  // Use consolidated session data hook
  const {
    sessionId,
    dailyRoom,
    loading: sessionLoading,
    error: sessionError,
  } = useSessionData(sessionCode || null);

  // Use Jotai atoms
  const [, setSessionId] = useAtom(sessionAtom);
  const [, setCurrentSessionCode] = useAtom(sessionCodeAtom);

  const { session } = useSession(sessionId);
  const [players, setPlayers] = useState<ParticipantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Update atoms when session data is resolved
  useEffect(() => {
    if (sessionId) {
      setSessionId(sessionId);
      if (sessionCode) {
        setCurrentSessionCode(sessionCode);
      }
    }
  }, [sessionId, sessionCode, setSessionId, setCurrentSessionCode]);

  // Handle session resolution errors
  useEffect(() => {
    if (sessionError) {
      setError(sessionError);
      setLoading(false);
    } else if (sessionId) {
      setError(null);
    }
  }, [sessionError, sessionId]);

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
            Logger.log("Participant update:", payload);

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
          Logger.log("Participants subscription status:", status);
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
          Logger.error("Error loading players:", fetchError);
          setError("Failed to load participants");
        } else {
          if (isMounted) {
            setPlayers((data as ParticipantRow[]) || []);
            setError(null);
          }
        }
      } catch (err) {
        Logger.error("Error in loadInitialPlayers:", err);
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
      p.lobby_presence === LOBBY_PRESENCE.JOINED
        ? "🟢 Online"
        : p.lobby_presence === LOBBY_PRESENCE.DISCONNECTED
          ? "🟠 Disconnected"
          : "🔴 Not Joined";
    const videoPresence = p.video_presence ? "📹 In Call" : "📵 Not in Call";
    return { lobbyPresence, videoPresence };
  };

  const getRoleDisplay = (p: ParticipantRow) => {
    if (p.role === PARTICIPANT_ROLE.HOST) return "👑 Host";
    if (p.role === PARTICIPANT_ROLE.GAME_MASTER) return "🎮 Game Master";
    if (p.role === PARTICIPANT_ROLE.PLAYER1) return "⚽ Player A";
    if (p.role === PARTICIPANT_ROLE.PLAYER2) return "🏆 Player B";
    return `👤 ${p.role}`;
  };

  const canStartQuiz = () => {
    if (!session) return false;
    const joinedNonHostsAndGMs = players.filter(
      (p) =>
        p.role !== PARTICIPANT_ROLE.HOST &&
        p.role !== PARTICIPANT_ROLE.GAME_MASTER &&
        p.lobby_presence === LOBBY_PRESENCE.JOINED,
    );
    return joinedNonHostsAndGMs.length >= 2 && session.phase === "Lobby";
  };

  const handleStartQuiz = () => {
    // Navigate to quiz page
    navigate(`/quiz/${sessionId}`);
  };

  const handleRefresh = async () => {
    // Refresh participants - Daily room data will be automatically updated via hook
    try {
      setLoading(true);
      setError(null);
      // Participants
      const { data: pData, error: pErr } = await supabase
        .from("Participant")
        .select("*")
        .eq("session_id", sessionId);
      if (!pErr) setPlayers((pData as ParticipantRow[]) || []);
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
      Logger.error("Failed to update presence on leave:", e);
    } finally {
      navigate("/");
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

        {/* Responsive Layout Container */}
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            {/* Participants Sidebar */}
            <div className="xl:col-span-1 space-y-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                <h2 className="text-2xl font-bold text-white mb-4 text-center">
                  👥 Participants (
                  {
                    players.filter(
                      (p) => p.role !== PARTICIPANT_ROLE.GAME_MASTER,
                    ).length
                  }
                  )
                </h2>

                {players.filter((p) => p.role !== PARTICIPANT_ROLE.GAME_MASTER)
                  .length === 0 ? (
                  <div className="text-center text-blue-200 py-8">
                    <div className="text-4xl mb-4">👤</div>
                    <div>No players have joined yet</div>
                    <div className="text-sm mt-2">
                      Waiting for participants...
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {players
                      .filter((p) => p.role !== PARTICIPANT_ROLE.GAME_MASTER)
                      .map((player) => {
                        const { lobbyPresence, videoPresence } =
                          getPresenceStatus(player);
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
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                <div className="space-y-3">
                  {canStartQuiz() && (
                    <button
                      onClick={handleStartQuiz}
                      className="w-full px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg transition-colors duration-200 transform hover:scale-105 border border-green-400/50"
                    >
                      🚀 Start Quiz
                    </button>
                  )}
                  <button
                    onClick={handleRefresh}
                    className="w-full px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg transition-colors duration-200 border border-blue-400/50"
                  >
                    🔄 Refresh
                  </button>
                  <button
                    onClick={handleLeaveLobby}
                    className="w-full px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg transition-colors duration-200 border border-red-400/50"
                  >
                    🚪 Leave Lobby
                  </button>
                </div>
              </div>
            </div>

            {/* Main Video Area */}
            <div className="xl:col-span-3 space-y-6">
              {/* Industry-Grade Video Call Interface */}
              {dailyRoom ? (
                <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 overflow-hidden">
                  {/* Video Header */}
                  <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 px-6 py-4 border-b border-white/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-3 h-3 rounded-full ${dailyRoom?.ready ? "bg-green-400 animate-pulse" : "bg-yellow-400"}`}
                        ></div>
                        <h3 className="text-xl font-bold text-white">
                          Video Conference
                        </h3>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-blue-200">
                        <span className="flex items-center space-x-1">
                          <span>🏠</span>
                          <span>
                            {dailyRoom?.ready ? "Ready" : "Setting up"}
                          </span>
                        </span>
                        {dailyRoom?.ready && (
                          <>
                            <span className="flex items-center space-x-1">
                              <span>🔗</span>
                              <span>Live</span>
                            </span>
                            {/* Embedded Join Button */}
                            <VideoCallJoinButton
                              sessionId={sessionId || ""}
                              sessionCode={sessionCode || ""}
                              participantName={
                                localStorage.getItem("tt_participant_name") ||
                                localStorage.getItem("playerName") ||
                                localStorage.getItem("hostName") ||
                                (players.length > 0 &&
                                  players.find(
                                    (p) =>
                                      p.participant_id ===
                                      localStorage.getItem("participantId"),
                                  )?.name) ||
                                "Player"
                              }
                            />
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Video Content */}
                  <div className="p-6">
                    <VideoCall
                      players={players}
                      sessionCode={sessionCode || ""}
                      sessionId={sessionId || ""}
                      participantName={
                        localStorage.getItem("tt_participant_name") ||
                        localStorage.getItem("playerName") ||
                        localStorage.getItem("hostName") ||
                        (players.length > 0 &&
                          players.find(
                            (p) =>
                              p.participant_id ===
                              localStorage.getItem("participantId"),
                          )?.name) ||
                        "Player"
                      }
                      showControlsAtTop={false}
                    />
                  </div>
                </div>
              ) : (
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 border border-white/20 text-center">
                  <div className="text-6xl mb-4">⏳</div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    Initializing Video Room
                  </h3>
                  <p className="text-blue-200 mb-4">
                    Host is setting up the video conference...
                  </p>
                  <div className="inline-flex items-center space-x-2 text-sm text-blue-300">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-ping"></div>
                    <span>Please wait</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Lobby;
