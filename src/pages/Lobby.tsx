import { Logger } from "../lib/logger";
import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAtom } from "jotai";

import { supabase } from "../lib/supabaseClient";
import { useSession } from "../lib/sessionHooks";
import {
  leaveLobbyByRole,
  createDailyToken,
  markPlayerReady,
  checkAllPlayersReady,
  updateParticipantHeartbeat,
  markParticipantDisconnected,
} from "../lib/mutations";
import { useSessionData } from "../lib/useSessionData";
import {
  sessionAtom,
  sessionCodeAtom,
  dailyRoomUrlAtom,
  dailyTokenAtom,
  dailyUserNameAtom,
} from "../atoms";
import { VideoRoom } from "../components/VideoRoom";
import { Flag } from "../components/Flag";
import { LobbyLogo } from "../components/LobbyLogo";
import { StadiumBackground } from "../components/StadiumBackground";
import {
  LOBBY_PRESENCE,
  PARTICIPANT_ROLE,
  SEAT_TO_ROLE,
  type ParticipantRole,
} from "../lib/types";
import { resolveSeatFromUrl, setSeatInStorage } from "../lib/userSession";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import type { Database } from "../lib/types/supabase";
import { getTeamLogoUrl } from "../lib/teamLogoHelper";
import {
  subscribeToSessionState,
  type SessionState,
} from "../lib/sessionState";

type ParticipantRow = Database["public"]["Tables"]["Participants"]["Row"] & {
  Profiles?: {
    flag?: string | null;
    team?: string | null;
  } | null;
};

interface ParticipantCardProps {
  player: ParticipantRow;
  lobbyPresence: string;
  videoPresence: string;
  getRoleDisplay: (player: ParticipantRow) => string;
  isReady?: boolean;
  onToggleReady?: (participantId: string, currentReady: boolean) => void;
  canToggleReady?: boolean;
  isTogglingReady?: boolean;
}

const ParticipantCard: React.FC<ParticipantCardProps> = ({
  player,
  lobbyPresence,
  videoPresence,
  getRoleDisplay,
  isReady = false,
  onToggleReady,
  canToggleReady = false,
  isTogglingReady = false,
}) => {
  const isPlayer = player.role === "Player1" || player.role === "Player2";

  // Generate team logo URL if needed
  const teamLogoUrl = useMemo(() => {
    const profileTeam = player.Profiles?.team;
    const participantLogo = player.team_logo_url;
    
    // If profile team exists and doesn't look like a URL, try to generate one
    if (profileTeam && !profileTeam.startsWith("http")) {
      return getTeamLogoUrl(profileTeam) ?? participantLogo ?? "";
    }
    
    // Otherwise use as-is
    return profileTeam ?? participantLogo ?? "";
  }, [player.Profiles?.team, player.team_logo_url]);

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
          <Flag 
            code={(player.Profiles?.flag || player.flag) ?? "sa"} 
            className="text-lg" 
          />
          {teamLogoUrl && (
            <LobbyLogo 
              logoUrl={teamLogoUrl} 
              teamName={player.name} 
            />
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

        {/* Ready Status - Only show for players */}
        {isPlayer && (
          <div className="flex justify-between items-center mt-2 pt-2 border-t border-white/10">
            <span className="text-xs text-blue-200">Ready:</span>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-medium ${
                  isReady ? "text-green-400" : "text-yellow-400"
                }`}
              >
                {isReady ? "✓ Ready" : "⏳ Not Ready"}
              </span>
              {canToggleReady && onToggleReady && (
                <button
                  onClick={() => onToggleReady(player.participant_id, isReady)}
                  disabled={isTogglingReady}
                  className={`
                    relative px-3 py-1.5 rounded-lg font-semibold text-xs
                    transition-all duration-200 ease-in-out
                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent
                    disabled:opacity-50 disabled:cursor-not-allowed
                    shadow-sm hover:shadow-md
                    ${
                      isReady
                        ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white focus:ring-red-400 border border-red-400/50"
                        : "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white focus:ring-green-400 border border-green-400/50"
                    }
                    ${isTogglingReady ? "animate-pulse" : ""}
                  `}
                  type="button"
                  aria-label={isReady ? "Mark as not ready" : "Mark as ready"}
                  aria-pressed={isReady}
                >
                  {isTogglingReady ? (
                    <span className="flex items-center gap-1">
                      <svg
                        className="animate-spin h-3 w-3"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      <span>...</span>
                    </span>
                  ) : isReady ? (
                    "✗ Unready"
                  ) : (
                    "✓ Ready"
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Lobby: React.FC = () => {
  const { sessionCode, seat } = useParams<{
    sessionCode: string;
    seat?: string;
  }>();
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
      Logger.log("User role resolved from seat:", {
        seat: resolvedSeat,
        role: userRole,
      });
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
  const [, setDailyRoomUrl] = useAtom(dailyRoomUrlAtom);
  const [, setDailyToken] = useAtom(dailyTokenAtom);
  const [, setDailyUserName] = useAtom(dailyUserNameAtom);

  const { session } = useSession(sessionId);
  const [players, setPlayers] = useState<ParticipantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSeatValidationModal, setShowSeatValidationModal] = useState(false);
  const [readyStates, setReadyStates] = useState<Record<string, boolean>>({});
  const [allPlayersReady, setAllPlayersReady] = useState(false);
  const [togglingReadyParticipant, setTogglingReadyParticipant] = useState<
    string | null
  >(null);
  
  // Session state from Netlify Blobs (room creation, etc.)
  const [sessionState, setSessionState] = useState<SessionState | null>(null);

  // Get participant name from localStorage
  const participantName =
    localStorage.getItem("tt_participant_name") ||
    localStorage.getItem("playerName") ||
    localStorage.getItem("hostName") ||
    "Unknown";

  // Update atoms when session data is resolved
  useEffect(() => {
    if (sessionId) {
      setSessionId(sessionId);
      if (sessionCode) {
        setCurrentSessionCode(sessionCode);
      }
    }
  }, [sessionId, sessionCode, setSessionId, setCurrentSessionCode]);

  // Store Daily room data in atoms when available and create token
  useEffect(() => {
    const setupDailyRoom = async () => {
      if (dailyRoom?.room_url && sessionCode && participantName) {
        Logger.log("Lobby: Storing Daily room data in atoms", {
          roomUrl: dailyRoom.room_url,
          participantName,
        });

        setDailyRoomUrl(dailyRoom.room_url);
        setDailyUserName(participantName);

        // Create and store token
        try {
          const { token } = await createDailyToken(
            sessionCode,
            participantName,
          );
          setDailyToken(token);
          Logger.log("Lobby: Daily token created and stored");
        } catch (error) {
          Logger.error("Lobby: Failed to create Daily token:", error);
        }
      }
    };

    setupDailyRoom();
  }, [
    dailyRoom,
    sessionCode,
    participantName,
    setDailyRoomUrl,
    setDailyToken,
    setDailyUserName,
  ]);

  // Handle session resolution errors
  useEffect(() => {
    if (sessionError) {
      setError(sessionError);
      setLoading(false);
    } else if (sessionId) {
      setError(null);
    }
  }, [sessionError, sessionId]);

  // Subscribe to session state changes from Netlify Blobs
  useEffect(() => {
    if (!sessionId) return;

    Logger.log("Subscribing to session state for:", sessionId);

    const unsubscribe = subscribeToSessionState(sessionId, (state) => {
      Logger.log("Session state updated:", state);
      setSessionState(state);

      // Update dailyRoomUrl atom if room was just created
      if (state?.dailyRoomCreated && state.dailyRoomUrl && !dailyRoom) {
        Logger.log("Room created detected, updating atom:", state.dailyRoomUrl);
        setDailyRoomUrl(state.dailyRoomUrl);
      }
    });

    return () => {
      Logger.log("Unsubscribing from session state");
      unsubscribe();
    };
  }, [sessionId, dailyRoom, setDailyRoomUrl]);

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
              Database["public"]["Tables"]["Participants"]["Row"]
            >,
          ) => {
            Logger.log("Participant update:", payload);

            if (!isMounted) return;

            if (payload.eventType === "INSERT") {
              if (payload.new) {
                const newParticipant = payload.new as ParticipantRow;
                setPlayers((prev) => [...prev, newParticipant]);
                // Sync ready state (handle null/undefined, default to false)
                setReadyStates((prev) => ({
                  ...prev,
                  [newParticipant.participant_id]:
                    newParticipant.isReady ?? false,
                }));
              }
            } else if (payload.eventType === "UPDATE") {
              const updatedParticipant = payload.new as ParticipantRow;
              setPlayers((prev) =>
                prev.map((player) =>
                  player.participant_id ===
                  (updatedParticipant.participant_id || "")
                    ? { ...player, ...updatedParticipant }
                    : player,
                ),
              );
              // Sync ready state immediately from realtime update (handle null/undefined, default to false)
              setReadyStates((prev) => ({
                ...prev,
                [updatedParticipant.participant_id]:
                  updatedParticipant.isReady ?? false,
              }));
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
          .from("Participants")
          .select(`
            *,
            Profiles!profile_id (
              flag,
              team
            )
          `)
          .eq("session_id", sessionId)
          .order("name", { ascending: true });

        if (fetchError) {
          Logger.error("Error loading players:", fetchError);
          setError("Failed to load participants");
        } else {
          if (isMounted) {
            const playersData = (data as ParticipantRow[]) || [];
            setPlayers(playersData);
            setError(null);

            // Validate seat access after players are loaded
            if (resolvedSeat && playersData.length > 0) {
              const seatRole = SEAT_TO_ROLE[resolvedSeat];

              // Convert seat role to participant role
              let participantRole: string;
              switch (seatRole) {
                case "host":
                  participantRole = PARTICIPANT_ROLE.HOST;
                  break;
                case "player1":
                  participantRole = PARTICIPANT_ROLE.PLAYER1;
                  break;
                case "player2":
                  participantRole = PARTICIPANT_ROLE.PLAYER2;
                  break;
                default:
                  return; // Invalid seat role
              }

              // Find participant with this role
              const participant = playersData.find(
                (p) => p.role === participantRole,
              );

              // If participant doesn't exist or hasn't joined, show validation modal
              if (
                !participant ||
                participant.lobby_presence !== LOBBY_PRESENCE.JOINED
              ) {
                setShowSeatValidationModal(true);
              }
            }
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
  }, [sessionId, resolvedSeat]);

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
    // Check if we have at least 2 players AND all players are ready
    return (
      joinedNonHostsAndGMs.length >= 2 &&
      session.phase === "Lobby" &&
      allPlayersReady
    );
  };

  // Check all players ready status
  useEffect(() => {
    if (!sessionId) return;

    const checkReadyStatus = async () => {
      try {
        const result = await checkAllPlayersReady(sessionId);
        setAllPlayersReady(result.allReady);

        // Update ready states map
        const newReadyStates: Record<string, boolean> = {};
        result.participants.forEach((p) => {
          newReadyStates[p.participant_id] = p.isReady;
        });
        setReadyStates(newReadyStates);
      } catch (error) {
        Logger.error("Failed to check ready status:", error);
      }
    };

    checkReadyStatus();

    // Poll every 2 seconds for ready status updates
    const interval = setInterval(checkReadyStatus, 2000);

    return () => clearInterval(interval);
  }, [sessionId, players]);

  // Heartbeat mechanism - send heartbeat every 30 seconds for current participant
  useEffect(() => {
    if (!sessionId || !resolvedSeat) return;

    // Find current participant by role
    const seatRole = SEAT_TO_ROLE[resolvedSeat];
    let participantRole: string;
    switch (seatRole) {
      case "host":
        participantRole = PARTICIPANT_ROLE.HOST;
        break;
      case "player1":
        participantRole = PARTICIPANT_ROLE.PLAYER1;
        break;
      case "player2":
        participantRole = PARTICIPANT_ROLE.PLAYER2;
        break;
      default:
        return;
    }

    const currentParticipant = players.find((p) => p.role === participantRole);
    if (!currentParticipant) return;

    // Send initial heartbeat
    updateParticipantHeartbeat(currentParticipant.participant_id, sessionId);

    // Set up interval to send heartbeat every 30 seconds
    const heartbeatInterval = setInterval(() => {
      updateParticipantHeartbeat(currentParticipant.participant_id, sessionId);
    }, 30000); // 30 seconds

    // Cleanup on unmount or when dependencies change
    return () => {
      clearInterval(heartbeatInterval);
      // Mark as disconnected when leaving
      markParticipantDisconnected(currentParticipant.participant_id).catch(
        (err) => {
          Logger.error("Failed to mark participant as disconnected:", err);
        },
      );
    };
  }, [sessionId, resolvedSeat, players]);

  // Presence tracking: Detect tab close, navigation, and visibility changes
  useEffect(() => {
    if (!sessionId || !resolvedSeat) return;

    // Find current participant by role
    const seatRole = SEAT_TO_ROLE[resolvedSeat];
    let participantRole: string;
    switch (seatRole) {
      case "host":
        participantRole = PARTICIPANT_ROLE.HOST;
        break;
      case "player1":
        participantRole = PARTICIPANT_ROLE.PLAYER1;
        break;
      case "player2":
        participantRole = PARTICIPANT_ROLE.PLAYER2;
        break;
      default:
        return;
    }

    const currentParticipant = players.find((p) => p.role === participantRole);
    if (!currentParticipant) return;

    // Handle beforeunload: Mark as disconnected when user closes tab or navigates away
    const handleBeforeUnload = () => {
      // Use navigator.sendBeacon for reliable last-second requests
      const disconnectUrl = `${window.location.origin}/.netlify/functions/mark-player-disconnected`;
      const data = JSON.stringify({ 
        participantId: currentParticipant.participant_id,
        sessionId: sessionId
      });
      
      try {
        navigator.sendBeacon(disconnectUrl, data);
      } catch (error) {
        Logger.error("Failed to send disconnect beacon:", error);
      }
      
      // Also mark in database (may not complete if page unloads fast)
      markParticipantDisconnected(currentParticipant.participant_id).catch(
        (err) => Logger.error("Failed to mark disconnected on unload:", err)
      );
    };

    // Handle visibilitychange: Detect when user switches tabs
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // User switched away - could mark as "Away" status
        Logger.log("User switched away from lobby tab");
      } else {
        // User returned - send heartbeat immediately
        Logger.log("User returned to lobby tab");
        updateParticipantHeartbeat(currentParticipant.participant_id, sessionId);
      }
    };

    // Attach event listeners
    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Cleanup
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [sessionId, resolvedSeat, players]);

  // Handle ready toggle for current player
  const handleToggleReady = async (
    participantId: string,
    currentReady: boolean,
  ) => {
    setTogglingReadyParticipant(participantId);
    try {
      await markPlayerReady(participantId, !currentReady);
      Logger.log(
        `Player ${participantId} ready status toggled to: ${!currentReady}`,
      );

      // Update local state immediately for better UX (optimistic update)
      setReadyStates((prev) => ({
        ...prev,
        [participantId]: !currentReady,
      }));

      // Persist ready state to Netlify Blobs for reconnection
      if (sessionId) {
        const { saveSession } = await import("../lib/blobStore");
        const currentPlayer = players.find(
          (p) => p.participant_id === participantId,
        );
        await saveSession(sessionId, participantId, {
          isReady: !currentReady,
          participantId,
          sessionCode: sessionCode || "",
          participantName,
          role: currentPlayer?.role as ParticipantRole | undefined,
        });
      }
    } catch (error) {
      Logger.error("Failed to toggle ready status:", error);
      // Revert optimistic update on error
      setReadyStates((prev) => ({
        ...prev,
        [participantId]: currentReady,
      }));
    } finally {
      setTogglingReadyParticipant(null);
    }
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
        .from("Participants")
        .select("*")
        .eq("session_id", sessionId);
      if (!pErr) setPlayers((pData as ParticipantRow[]) || []);
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveLobby = async () => {
    try {
      // Use role-based lookup instead of localStorage participant_id
      if (sessionId && userRole) {
        // Convert seat role to participant role
        let participantRole: string;
        switch (userRole) {
          case "host":
            participantRole = PARTICIPANT_ROLE.HOST;
            break;
          case "player1":
            participantRole = PARTICIPANT_ROLE.PLAYER1;
            break;
          case "player2":
            participantRole = PARTICIPANT_ROLE.PLAYER2;
            break;
          default:
            Logger.error("Invalid user role for leaving lobby:", userRole);
            return;
        }

        await leaveLobbyByRole(sessionId, participantRole);
      } else {
        Logger.error("No session ID or user role available for leaving lobby");
      }
    } catch (e) {
      Logger.error("Failed to update presence on leave:", e);
    } finally {
      // Clear Daily atoms when leaving lobby
      setDailyRoomUrl(null);
      setDailyToken(null);
      setDailyUserName(null);
      navigate("/");
    }
  };

  const handleSeatValidationRedirect = () => {
    setShowSeatValidationModal(false);
    navigate(`/join?sessionCode=${sessionCode}`);
  };

  if (sessionLoading || loading) {
    return (
      <StadiumBackground variant="dark" animated={true}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="bg-black/40 backdrop-blur-md rounded-2xl p-8 border border-green-500/30 shadow-2xl">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400"></div>
              <div className="text-white text-xl font-semibold">Loading Lobby...</div>
            </div>
          </div>
        </div>
      </StadiumBackground>
    );
  }

  if (sessionError || error) {
    return (
      <StadiumBackground variant="dark">
        <div className="flex items-center justify-center min-h-screen">
          <div className="bg-red-900/20 backdrop-blur-md rounded-2xl p-8 border border-red-500/50 shadow-2xl max-w-md text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <div className="text-white text-xl font-semibold mb-2">Error</div>
            <div className="text-red-200">{sessionError || error}</div>
          </div>
        </div>
      </StadiumBackground>
    );
  }

  if (!session) {
    return (
      <StadiumBackground variant="dark">
        <div className="flex items-center justify-center min-h-screen">
          <div className="bg-orange-900/20 backdrop-blur-md rounded-2xl p-8 border border-orange-500/50 shadow-2xl max-w-md text-center">
            <div className="text-6xl mb-4">🔍</div>
            <div className="text-white text-xl font-semibold mb-2">Session Not Found</div>
            <div className="text-orange-200">The requested session could not be found</div>
          </div>
        </div>
      </StadiumBackground>
    );
  }

  return (
    <StadiumBackground variant="default" animated={true}>
      <div className="p-4 min-h-screen">
        {/* Header */}
        <div className="text-center mb-8 pt-8">
          <h1 className="text-5xl font-black text-white mb-4 drop-shadow-[0_0_20px_rgba(34,197,94,0.5)]">
            🎮 Game Lobby
          </h1>
          <div className="text-2xl text-green-100 font-semibold mb-2">
            Session: <span className="font-black text-green-300 px-4 py-2 bg-green-900/30 rounded-lg border border-green-500/30">{sessionCode}</span>
          </div>
          <div className="flex items-center justify-center space-x-6 text-sm text-green-200 mt-4">
            <div className="bg-black/30 px-4 py-2 rounded-lg border border-green-500/20">
              Phase: <span className="font-bold text-green-300">{session.phase}</span>
            </div>
            <div className="bg-black/30 px-4 py-2 rounded-lg border border-green-500/20">
              State: <span className="font-bold text-green-300">{session.game_state}</span>
            </div>
            {sessionState?.dailyRoomCreated && (
              <div className="bg-green-600/20 px-4 py-2 rounded-lg border border-green-400/40 animate-pulse">
                📹 <span className="font-bold text-green-300">Video Room Ready</span>
              </div>
            )}
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

                {/* Show 3 slots: Host, Player 1, Player 2 */}
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {[
                    PARTICIPANT_ROLE.HOST,
                    PARTICIPANT_ROLE.PLAYER1,
                    PARTICIPANT_ROLE.PLAYER2,
                  ].map((requiredRole) => {
                    const player = players.find(
                      (p) =>
                        p.role === requiredRole &&
                        p.lobby_presence !== LOBBY_PRESENCE.NOT_JOINED,
                    );

                    if (player) {
                      // Show actual participant
                      const { lobbyPresence, videoPresence } =
                        getPresenceStatus(player);
                      const isPlayer =
                        player.role === "Player1" || player.role === "Player2";
                      const isCurrentPlayer = resolvedSeat
                        ? SEAT_TO_ROLE[resolvedSeat] ===
                          player.role.toLowerCase()
                        : false;

                      return (
                        <ParticipantCard
                          key={player.participant_id}
                          player={player}
                          lobbyPresence={lobbyPresence}
                          videoPresence={videoPresence}
                          getRoleDisplay={getRoleDisplay}
                          isReady={readyStates[player.participant_id] || false}
                          onToggleReady={handleToggleReady}
                          canToggleReady={isPlayer && isCurrentPlayer}
                          isTogglingReady={
                            togglingReadyParticipant === player.participant_id
                          }
                        />
                      );
                    } else {
                      // Show placeholder for empty slot
                      const roleDisplayNames = {
                        [PARTICIPANT_ROLE.HOST]: "Host",
                        [PARTICIPANT_ROLE.PLAYER1]: "Player 1",
                        [PARTICIPANT_ROLE.PLAYER2]: "Player 2",
                      };

                      return (
                        <div
                          key={requiredRole}
                          className="backdrop-blur-sm rounded-lg p-4 border-2 border-dashed border-gray-400 bg-gray-500/10"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <div className="text-lg">👤</div>
                              <div>
                                <div className="text-sm font-bold text-gray-400">
                                  Waiting for {roleDisplayNames[requiredRole]}
                                  ...
                                </div>
                                <div className="text-xs text-gray-500">
                                  {roleDisplayNames[requiredRole]}
                                </div>
                              </div>
                            </div>
                            <div className="text-lg text-gray-500">⏳</div>
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-gray-500">
                                Lobby:
                              </span>
                              <span className="text-xs font-medium text-gray-400">
                                Not joined
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-gray-500">
                                Video:
                              </span>
                              <span className="text-xs font-medium text-gray-400">
                                Not connected
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                  })}
                </div>
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
                <VideoRoom
                  players={players}
                  sessionCode={sessionCode || ""}
                  sessionId={sessionId || ""}
                  participantName={participantName}
                  autoJoin={false} // Manual join in Lobby, allow users to click join button
                />
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

      {/* Seat Validation Modal */}
      {showSeatValidationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="text-4xl mb-4">🚫</div>
              <h2 className="text-2xl font-bold text-white mb-4">
                Player Not Joined
              </h2>
              <p className="text-blue-200 mb-6">
                This player has not joined the game yet. You will be redirected
                to the joining page for this session.
              </p>
              <button
                onClick={handleSeatValidationRedirect}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold rounded-lg transition-all transform hover:scale-105"
              >
                Okay
              </button>
            </div>
          </div>
        </div>
      )}
    </StadiumBackground>
  );
};

export default Lobby;
