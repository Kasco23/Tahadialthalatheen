import { Logger } from "../lib/logger";
import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAtom } from "jotai";

import { supabase } from "../lib/supabaseClient";
import { useSession } from "../lib/sessionHooks";
import { useAuth } from "../contexts/AuthContext";
import {
  leaveLobbyByRole,
  updateParticipantHeartbeat,
  markParticipantDisconnected,
  createDailyToken,
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
  SESSION_PRESENCE,
  PARTICIPANT_ROLE,
  ROLE_DISPLAY_LABELS,
  ROLE_TO_SEAT,
  SEAT_TO_ROLE,
  type ParticipantRole,
  type SeatRole,
} from "../lib/types";
import { resolveSeatFromUrl, setSeatInStorage } from "../lib/userSession";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import type { Database, ParticipantRow } from "../lib/types/supabase";
import { getTeamLogoUrl } from "../lib/teamLogoHelper";
import {
  subscribeToSessionState,
  type SessionState,
} from "../lib/sessionState";
import { InviteFriendsModal } from "../components/InviteFriendsModal";
import { UsernameSetupBanner } from "../components/UsernameSetupBanner";
import {
  saveParticipantBlob,
  getParticipantBlob,
  getDeviceId,
  saveLobbySnapshot,
  getLobbySnapshot,
  type ParticipantBlobData,
  type LobbySnapshotData,
} from "../lib/blobsManager";

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
  // Generate team logo URL from Profile data only
  const teamLogoUrl = useMemo(() => {
    const profileTeam = player.Profiles?.team_url;

    // If profile team exists and doesn't look like a URL, try to generate one
    if (profileTeam && !profileTeam.startsWith("http")) {
      return getTeamLogoUrl(profileTeam) ?? "";
    }

    // Otherwise use as-is
    return profileTeam ?? "";
  }, [player.Profiles?.team_url]);

  return (
    <div
      className={`bg-white/5 backdrop-blur-sm rounded-lg p-4 border-2 transition-all duration-300 ${
        player.session_presence === SESSION_PRESENCE.JOINED
          ? "border-green-400 bg-green-500/10"
          : "border-red-400 bg-red-500/10"
      }`}
    >
      {/* Player Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Flag code={player.Profiles?.flag ?? "sa"} className="text-lg" />
          {teamLogoUrl && (
            <LobbyLogo
              logoUrl={teamLogoUrl}
              teamName={player.Profiles?.name ?? "Unknown"}
            />
          )}
          <div>
            <div className="text-sm font-bold text-white">
              {player.Profiles?.name ?? "Unknown"}
            </div>
            <div className="text-xs text-blue-200">
              {getRoleDisplay(player)}
            </div>
          </div>
        </div>
        <div
          className={`text-lg ${player.session_presence === SESSION_PRESENCE.JOINED ? "animate-pulse text-green-500" : "text-red-500"}`}
        >
          {player.session_presence === SESSION_PRESENCE.JOINED ? "🟢" : "🔴"}
        </div>
      </div>

      {/* Presence Status */}
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-xs text-blue-200">Lobby:</span>
          <span
            className={`text-xs font-medium ${
              player.session_presence === SESSION_PRESENCE.JOINED
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
  const { sessionCode, seat } = useParams<{
    sessionCode: string;
    seat?: string;
  }>();
  const navigate = useNavigate();
  const { profile } = useAuth();

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

  // Session state from Netlify Blobs (room creation, etc.)
  const [sessionState, setSessionState] = useState<SessionState | null>(null);

  // Invite modal state
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  // ✨ PHASE 2.3: Snapshot recovery indicator
  const [recoveredFromSnapshot, setRecoveredFromSnapshot] = useState(false);

  // Get participant name from Supabase Profiles table via current participant
  // Initialize as empty string and ONLY set from Profiles table (not from localStorage)
  // This ensures Daily token is created with the correct name from database
  const [participantName, setParticipantName] = useState<string>("");

  // Separate state for Daily token username (safe, no spaces)
  // Uses username from Profiles (e.g., "tareq") instead of full name (e.g., "Tareq Salah")
  // This prevents Daily.co token issues with names containing spaces
  const [tokenUsername, setTokenUsername] = useState<string>("");

  const seatRoleFromParticipantRole = (
    role?: string | null
  ): SeatRole | null => {
    switch (role) {
      case PARTICIPANT_ROLE.HOST:
        return "host";
      case PARTICIPANT_ROLE.HOME:
        return "home";
      case PARTICIPANT_ROLE.AWAY:
        return "away";
      default:
        return null;
    }
  };

  const participantRoleFromSeatRole = (
    seatRole?: SeatRole | null
  ): ParticipantRole | null => {
    switch (seatRole) {
      case "host":
        return PARTICIPANT_ROLE.HOST;
      case "home":
        return PARTICIPANT_ROLE.HOME;
      case "away":
        return PARTICIPANT_ROLE.AWAY;
      default:
        return null;
    }
  };

  const participantRoleFromSeat = useMemo<ParticipantRole | null>(() => {
    if (!resolvedSeat) return null;

    const seatRole = SEAT_TO_ROLE[resolvedSeat];
    return participantRoleFromSeatRole(seatRole);
  }, [resolvedSeat]);

  const participantFromSeat = useMemo(() => {
    if (!participantRoleFromSeat) return null;
    return players.find((p) => p.role === participantRoleFromSeat) || null;
  }, [participantRoleFromSeat, players]);

  const participantFromProfile = useMemo(() => {
    if (!profile?.id) return null;
    return players.find((p) => p.profile_id === profile.id) || null;
  }, [players, profile?.id]);

  const currentParticipant = useMemo(
    () => participantFromProfile ?? participantFromSeat ?? null,
    [participantFromSeat, participantFromProfile]
  );

  const derivedSeat = useMemo(() => {
    const seatRole = seatRoleFromParticipantRole(currentParticipant?.role);
    if (seatRole) return ROLE_TO_SEAT[seatRole];

    return resolvedSeat || null;
  }, [resolvedSeat, currentParticipant?.role]);

  const userRole = useMemo<SeatRole | null>(() => {
    const roleFromProfile = seatRoleFromParticipantRole(
      currentParticipant?.role
    );
    if (roleFromProfile) return roleFromProfile;
    if (resolvedSeat) return SEAT_TO_ROLE[resolvedSeat];
    return null;
  }, [resolvedSeat, currentParticipant?.role]);

  const currentParticipantRef = useRef<ParticipantRow | null>(null);

  useEffect(() => {
    currentParticipantRef.current = currentParticipant;
  }, [currentParticipant]);

  const participantId = currentParticipant?.participant_id ?? null;

  // When seat is missing but we can resolve it from profile/role, persist and normalize URL
  useEffect(() => {
    if (derivedSeat && derivedSeat !== resolvedSeat && sessionCode) {
      setSeatInStorage(derivedSeat);
      navigate(`/lobby/${sessionCode}/${derivedSeat}`, { replace: true });
    }
  }, [derivedSeat, resolvedSeat, sessionCode, navigate]);

  // Log resolved role for debugging (profile match takes precedence, seat is fallback)
  useEffect(() => {
    if (userRole) {
      const roleSource = seatRoleFromParticipantRole(currentParticipant?.role)
        ? "profile"
        : resolvedSeat
          ? "url/storage"
          : "unknown";

      Logger.log("User role resolved:", {
        seat: resolvedSeat ?? derivedSeat,
        role: userRole,
        source: roleSource,
      });
    }
  }, [userRole, resolvedSeat, derivedSeat, currentParticipant?.role]);

  // Update atoms when session data is resolved
  useEffect(() => {
    if (sessionId) {
      setSessionId(sessionId);
      if (sessionCode) {
        setCurrentSessionCode(sessionCode);
      }
    }
  }, [sessionId, sessionCode, setSessionId, setCurrentSessionCode]);

  // ✨ PHASE 2.3: Try to recover from lobby snapshot on mount
  useEffect(() => {
    if (!sessionId || !sessionCode || players.length > 0) return;

    const attemptSnapshotRecovery = async () => {
      Logger.log("🔍 Checking for lobby snapshot...");
      const result = await getLobbySnapshot(sessionId);

      if (result.success && result.data) {
        const snapshot = result.data;
        const snapshotAge =
          Date.now() - new Date(snapshot.snapshot_timestamp).getTime();
        const twoMinutes = 2 * 60 * 1000;

        if (snapshotAge < twoMinutes) {
          Logger.log("✅ Recovered lobby from snapshot", {
            age_seconds: Math.floor(snapshotAge / 1000),
            participant_count: snapshot.participant_count,
          });
          setRecoveredFromSnapshot(true);

          // Could restore participant list from snapshot if needed
          // For now, just indicate recovery happened
          setTimeout(() => setRecoveredFromSnapshot(false), 5000); // Clear after 5s
        } else {
          Logger.log("⏰ Snapshot too old, ignoring", {
            age_minutes: Math.floor(snapshotAge / 60000),
          });
        }
      } else {
        Logger.log("ℹ️ No lobby snapshot found");
      }
    };

    attemptSnapshotRecovery();
  }, [sessionId, sessionCode, players.length]);

  // Update participant name from Profiles table based on current user's role/profile
  useEffect(() => {
    if (!currentParticipant) return;

    const profileName =
      currentParticipant.Profiles?.name || currentParticipant.name;
    const profileUsername = currentParticipant.Profiles?.username || null;

    // Use username for Daily token (no spaces, safe for tokens)
    // If username is null/empty, sanitize name by removing spaces
    // Use name for display in UI
    const safeTokenName =
      profileUsername ||
      (profileName ? profileName.replace(/\s+/g, "") : null) ||
      "player";
    const displayName = profileName || profileUsername || "Unknown";

    // Log username changes for debugging
    if (sessionCode && tokenUsername && tokenUsername !== safeTokenName) {
      Logger.log("Username changed, will create new token:", {
        old: tokenUsername,
        new: safeTokenName,
      });
    }

    setTokenUsername(safeTokenName);
    setParticipantName(displayName);
    setDailyUserName(displayName);
  }, [currentParticipant, setDailyUserName, sessionCode, tokenUsername]);

  // Store Daily room data in atoms when available and create token
  useEffect(() => {
    const setupDailyRoom = async () => {
      // Log current state for debugging
      Logger.log("Lobby: Daily room setup check", {
        hasDailyRoom: !!dailyRoom,
        roomUrl: dailyRoom?.room_url,
        hasSessionCode: !!sessionCode,
        hasTokenUsername: !!tokenUsername,
        hasParticipantName: !!participantName,
        tokenUsername,
        displayName: participantName,
      });

      // IMPORTANT: Only create token after tokenUsername is loaded from Profiles table
      // Use username (no spaces) for token, name (full) for display
      if (
        dailyRoom?.room_url &&
        sessionCode &&
        tokenUsername &&
        participantName
      ) {
        Logger.log("Lobby: Setting up Daily room data in atoms", {
          roomUrl: dailyRoom.room_url,
          tokenUsername,
          displayName: participantName,
        });

        setDailyRoomUrl(dailyRoom.room_url);
        setDailyUserName(participantName); // Display name in UI

        // Create and store token via Netlify Function
        try {
          const response = await createDailyToken(
            sessionCode,
            tokenUsername // Use username for token (safe, no spaces)
          );

          // Update token atom
          setDailyToken(response.token);

          // If room URL is provided in response, update it (fallback/verification)
          if (response.room_url && response.room_url !== dailyRoom.room_url) {
            Logger.log(
              "Updating room URL from token response:",
              response.room_url
            );
            setDailyRoomUrl(response.room_url);
          }

          Logger.log("Lobby: Daily token created successfully", {
            tokenUsername,
            displayName: participantName,
            hasRoomUrl: !!response.room_url,
          });
        } catch (error) {
          Logger.error("Lobby: Failed to create Daily token:", error);
          // Show error to user
          const message =
            error instanceof Error
              ? error.message
              : "Failed to join video call. Please try again.";

          if (message.includes("Netlify function unavailable")) {
            setError(
              "Video calling requires Netlify Functions. Start `netlify dev` and open http://localhost:3000 or deploy to Netlify."
            );
          } else {
            setError(message);
          }
        }
      } else if (dailyRoom?.room_url && (!tokenUsername || !participantName)) {
        Logger.warn(
          "Lobby: Daily room available but waiting for participant data from Profiles",
          {
            hasTokenUsername: !!tokenUsername,
            hasDisplayName: !!participantName,
          }
        );
      }
    };

    setupDailyRoom();
  }, [
    dailyRoom,
    sessionCode,
    tokenUsername,
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
            table: "Participants",
            filter: `session_id=eq.${sessionId}`,
          },
          (
            payload: RealtimePostgresChangesPayload<
              Database["public"]["Tables"]["Participants"]["Row"]
            >
          ) => {
            if (!isMounted) return;

            if (payload.eventType === "INSERT") {
              if (payload.new) {
                const newParticipant = payload.new as ParticipantRow;
                setPlayers((prev) => [...prev, newParticipant]);
              }
            } else if (payload.eventType === "UPDATE") {
              const updatedParticipant = payload.new as ParticipantRow;
              setPlayers((prev) =>
                prev.map((player) =>
                  player.participant_id ===
                  (updatedParticipant.participant_id || "")
                    ? { ...player, ...updatedParticipant }
                    : player
                )
              );
            } else if (payload.eventType === "DELETE") {
              setPlayers((prev) =>
                prev.filter(
                  (player) =>
                    player.participant_id !==
                    (payload.old?.participant_id || "")
                )
              );
            }
          }
        )
        .subscribe();

      return channel;
    };

    // Load initial participants
    const loadInitialPlayers = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from("Participants")
          .select(
            `
            *,
            Profiles!profile_id (
              name,
              username,
              flag,
              team
            )
          `
          )
          .eq("session_id", sessionId)
          .order("join_at", { ascending: true });

        if (fetchError) {
          Logger.error("Error loading players:", fetchError);
          setError("Failed to load participants");
        } else {
          if (isMounted) {
            const playersData = (data as ParticipantRow[]) || [];
            setPlayers(playersData);
            setError(null);

            // ✨ PHASE 2.2: Save participant blobs for all players (debounced)
            // Only save if we're the host or this is our participant
            const ourParticipantId = localStorage.getItem("participant_id");
            const deviceId = getDeviceId();

            // Save only our own participant blob to reduce noise
            const ourPlayer = playersData.find(
              (p) => p.participant_id === ourParticipantId
            );

            if (ourPlayer) {
              const participantBlobData: ParticipantBlobData = {
                participant_id: ourPlayer.participant_id,
                profile_id: ourPlayer.profile_id,
                name: ourPlayer.Profiles?.name || "Unknown",
                username: ourPlayer.Profiles?.username || null,
                flag: ourPlayer.Profiles?.flag || "sa",
                team_url: ourPlayer.Profiles?.team_url || null,
                team_logo_url: ourPlayer.Profiles?.team_url
                  ? getTeamLogoUrl(ourPlayer.Profiles.team_url)
                  : null,

                current_session_id: sessionId,
                current_session_code: sessionCode || null,
                role: ourPlayer.role as
                  | "Host"
                  | "Home"
                  | "Away"
                  | "GameMaster"
                  | "Guest",

                session_presence: ourPlayer.session_presence as
                  | "NotJoined"
                  | "Joined"
                  | "Disconnected",
                video_presence: ourPlayer.video_presence || false,
                last_heartbeat:
                  ourPlayer.lastHeartbeat || new Date().toISOString(),

                join_at: ourPlayer.join_at || new Date().toISOString(),
                disconnect_at: ourPlayer.disconnect_at || null,

                device_id: deviceId,
                last_device_sync: new Date().toISOString(),

                preferred_flag: ourPlayer.Profiles?.flag || null,
                preferred_team_url: ourPlayer.Profiles?.team_url || null,

                audio_enabled: true, // Default values
                video_enabled: true,

                created_at: ourPlayer.join_at || new Date().toISOString(),
                last_updated: new Date().toISOString(),
                session_history: [sessionId],

                metadata: {
                  join_context: "Lobby",
                  last_sync: new Date().toISOString(),
                },
              };

              try {
                const result = await saveParticipantBlob(participantBlobData);
                if (result.success) {
                  Logger.log(
                    `✅ Saved blob for participant ${ourPlayer.participant_id}`
                  );
                } else {
                  Logger.warn(
                    `⚠️ Failed to save blob for ${ourPlayer.participant_id}:`,
                    result.error
                  );
                }
              } catch (error) {
                Logger.warn(`⚠️ Error saving participant blob:`, error);
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
  }, [sessionId, sessionCode]);

  const getPresenceStatus = (p: ParticipantRow) => {
    const lobbyPresence =
      p.session_presence === SESSION_PRESENCE.JOINED
        ? "🟢 Online"
        : p.session_presence === SESSION_PRESENCE.DISCONNECTED
          ? "🟠 Disconnected"
          : "🔴 Not Joined";
    const videoPresence = p.video_presence ? "📹 In Call" : "📵 Not in Call";
    return { lobbyPresence, videoPresence };
  };

  const getRoleDisplay = (p: ParticipantRow) => {
    if (p.role === PARTICIPANT_ROLE.HOST) return "👑 Host";
    if (p.role === PARTICIPANT_ROLE.GAME_MASTER) return "🎮 Game Master";
    if (p.role === PARTICIPANT_ROLE.HOME) return "⚽ Home";
    if (p.role === PARTICIPANT_ROLE.AWAY) return "🏆 Away";
    return `👤 ${p.role}`;
  };

  const canStartQuiz = () => {
    if (!session) return false;

    // Allow starting from Setup or Lobby phases for testing
    if (session.phase !== "Setup" && session.phase !== "Lobby") return false;

    // Relaxed requirement for testing: Allow host to start even without 2 players
    // In production, you'd want to check: joinedNonHostsAndGMs.length >= 2
    return true; // Always allow for development/testing
  };

  // ✨ PHASE 2.2: Load participant blob on mount to restore preferences
  useEffect(() => {
    if (!currentParticipant) return;

    const loadParticipantPreferences = async () => {
      const result = await getParticipantBlob(
        currentParticipant.participant_id
      );

      if (result.success && result.data) {
        // Could restore audio/video preferences here if needed
        // Preferences are available in result.data
      }
    };

    loadParticipantPreferences();
  }, [currentParticipant]);

  // Heartbeat mechanism - send heartbeat every 30 seconds for current participant
  // ✨ PHASE 2.2: Enhanced with participant blob updates
  useEffect(() => {
    if (!sessionId || !sessionCode || !participantId) return;

    // Helper function to update participant blob
    const updateCurrentParticipantBlob = async () => {
      const participant = currentParticipantRef.current;
      if (!participant) return;

      const deviceId = getDeviceId();
      const participantBlobData: ParticipantBlobData = {
        participant_id: participant.participant_id,
        profile_id: participant.profile_id,
        name: participant.Profiles?.name || participant.name || "Unknown",
        username: participant.Profiles?.username || null,
        flag: participant.Profiles?.flag || "sa",
        team_url: participant.Profiles?.team_url || null,
        team_logo_url: participant.Profiles?.team_url
          ? getTeamLogoUrl(participant.Profiles.team_url)
          : null,

        current_session_id: sessionId,
        current_session_code: sessionCode,
        role: participant.role as
          | "Host"
          | "Home"
          | "Away"
          | "GameMaster"
          | "Guest",

        session_presence: participant.session_presence as
          | "NotJoined"
          | "Joined"
          | "Disconnected",
        video_presence: participant.video_presence || false,
        last_heartbeat: new Date().toISOString(),

        join_at: participant.join_at || new Date().toISOString(),
        disconnect_at: participant.disconnect_at || null,

        device_id: deviceId,
        last_device_sync: new Date().toISOString(),

        preferred_flag: participant.Profiles?.flag || null,
        preferred_team_url: participant.Profiles?.team_url || null,

        audio_enabled: true,
        video_enabled: true,

        created_at: participant.join_at || new Date().toISOString(),
        last_updated: new Date().toISOString(),
        session_history: [sessionId],

        metadata: {
          join_context: "Lobby",
          last_sync: new Date().toISOString(),
        },
      };

      const result = await saveParticipantBlob(participantBlobData);
      if (!result.success) {
        Logger.warn("⚠️ Failed to update participant blob:", result.error);
      }
    };

    // Send initial heartbeat to DB (silently)
    updateParticipantHeartbeat(participantId, sessionId);

    // Update initial participant blob (silently)
    updateCurrentParticipantBlob();

    // Set up interval to send heartbeat every 30 seconds
    const heartbeatInterval = setInterval(() => {
      updateParticipantHeartbeat(participantId, sessionId);
      updateCurrentParticipantBlob(); // Also update blob
    }, 30000); // 30 seconds

    // Cleanup on unmount or when dependencies change
    return () => {
      clearInterval(heartbeatInterval);
      // Mark as disconnected when leaving
      markParticipantDisconnected(participantId).catch((err) => {
        Logger.error("Failed to mark participant as disconnected:", err);
      });
    };
  }, [sessionId, sessionCode, participantId]);

  // ✨ PHASE 2.3: Save lobby snapshot every 30 seconds
  useEffect(() => {
    if (!sessionId || !sessionCode || players.length === 0) return;

    const saveSnapshot = async () => {
      const snapshotData: LobbySnapshotData = {
        session_id: sessionId,
        session_code: sessionCode,
        snapshot_timestamp: new Date().toISOString(),

        participants: players.map((p) => ({
          participant_id: p.participant_id,
          name: p.Profiles?.name || "Unknown",
          role: p.role,
          flag: p.Profiles?.flag || "sa",
          team_url: p.Profiles?.team_url || null,
          session_presence: p.session_presence,
          video_presence: p.video_presence || false,
          join_at: p.join_at || null,
        })),

        phase: session?.phase || "Lobby",
        daily_room_url: dailyRoom?.room_url || null,
        participant_count: players.length,
      };

      const result = await saveLobbySnapshot(snapshotData);
      if (!result.success) {
        Logger.warn("⚠️ Failed to save lobby snapshot:", result.error);
      }
      // Success is silent to reduce console noise
    };

    // Save initial snapshot
    saveSnapshot();

    // Set up interval to save snapshot every 30 seconds
    const snapshotInterval = setInterval(() => {
      saveSnapshot();
    }, 30000); // 30 seconds

    return () => {
      clearInterval(snapshotInterval);
    };
  }, [sessionId, sessionCode, players, session?.phase, dailyRoom?.room_url]);

  // Presence tracking: Detect tab close, navigation, and visibility changes
  useEffect(() => {
    if (!sessionId || !participantId) return;

    // Handle beforeunload: Mark as disconnected when user closes tab or navigates away
    const handleBeforeUnload = () => {
      // Use navigator.sendBeacon for reliable last-second requests
      const disconnectUrl = `${window.location.origin}/.netlify/functions/mark-player-disconnected`;
      const data = JSON.stringify({
        participantId,
        sessionId: sessionId,
      });

      try {
        navigator.sendBeacon(disconnectUrl, data);
      } catch (error) {
        Logger.error("Failed to send disconnect beacon:", error);
      }

      // Also mark in database (may not complete if page unloads fast)
      markParticipantDisconnected(participantId).catch((err) =>
        Logger.error("Failed to mark disconnected on unload:", err)
      );
    };

    // Set initial presence to Joined when lobby loads
    const setInitialPresence = async () => {
      try {
        await supabase
          .from("Participants")
          .update({ session_presence: "Joined" })
          .eq("participant_id", participantId);
      } catch (err) {
        Logger.warn("Failed to set initial presence:", err);
      }
    };

    setInitialPresence();

    // Handle visibilitychange: Detect when user switches tabs
    const handleVisibilityChange = async () => {
      if (document.hidden) {
        // User switched away - mark as Disconnected
        try {
          await supabase
            .from("Participants")
            .update({ session_presence: "Disconnected" })
            .eq("participant_id", participantId);
        } catch (err) {
          Logger.error("Failed to update presence on hide:", err);
        }
      } else {
        // User returned - mark as Joined and send heartbeat
        try {
          await supabase
            .from("Participants")
            .update({ session_presence: "Joined" })
            .eq("participant_id", participantId);
          await updateParticipantHeartbeat(participantId, sessionId);
        } catch (err) {
          Logger.error("Failed to update presence on show:", err);
        }
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
  }, [sessionId, participantId]);

  const handleStartQuiz = () => {
    // Navigate to quiz page using session code
    navigate(`/quiz/${sessionCode}`);
  };

  const handleRefresh = async () => {
    // Refresh participants - Daily room data will be automatically updated via hook
    try {
      setLoading(true);
      setError(null);

      // Fetch participants WITH Profiles data to preserve name/flag/team
      const { data: pData, error: pErr } = await supabase
        .from("Participants")
        .select(
          `
            *,
            Profiles!profile_id (
              name,
              username,
              flag,
              team
            )
          `
        )
        .eq("session_id", sessionId);

      if (pErr) {
        Logger.error("Error refreshing participants:", pErr);
        setError("Failed to refresh participants");
      } else {
        setPlayers((pData as ParticipantRow[]) || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveLobby = async () => {
    try {
      // Use role-based lookup instead of localStorage participant_id
      if (sessionId) {
        const participantRole =
          participantRoleFromSeatRole(userRole) ||
          (currentParticipant?.role as ParticipantRole | null);

        if (!participantRole) {
          Logger.error("No participant role available for leaving lobby", {
            userRole,
            participantId: currentParticipant?.participant_id,
          });
          return;
        }

        await leaveLobbyByRole(sessionId, participantRole);
      } else {
        Logger.error("No session ID available for leaving lobby");
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

  if (sessionLoading || loading) {
    return (
      <StadiumBackground variant="dark" animated={true}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="bg-black/40 backdrop-blur-md rounded-2xl p-8 border border-green-500/30 shadow-2xl">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400"></div>
              <div className="text-white text-xl font-semibold">
                Loading Lobby...
              </div>
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
            <div className="text-white text-xl font-semibold mb-2">
              Session Not Found
            </div>
            <div className="text-orange-200">
              The requested session could not be found
            </div>
          </div>
        </div>
      </StadiumBackground>
    );
  }

  return (
    <StadiumBackground variant="default" animated={true}>
      {/* Username Setup Banner */}
      <UsernameSetupBanner />

      <div className="p-4 min-h-screen">
        {/* Header */}
        <div className="text-center mb-8 pt-8">
          <h1 className="text-5xl font-black text-white mb-4 drop-shadow-[0_0_20px_rgba(34,197,94,0.5)]">
            🎮 Game Lobby
          </h1>
          <div className="text-2xl text-green-100 font-semibold mb-2">
            Session:{" "}
            <span className="font-black text-green-300 px-4 py-2 bg-green-900/30 rounded-lg border border-green-500/30">
              {sessionCode}
            </span>
          </div>
          <div className="flex items-center justify-center space-x-6 text-sm text-green-200 mt-4">
            <div className="bg-black/30 px-4 py-2 rounded-lg border border-green-500/20">
              Phase:{" "}
              <span className="font-bold text-green-300">{session.phase}</span>
            </div>
            <div className="bg-black/30 px-4 py-2 rounded-lg border border-green-500/20">
              State:{" "}
              <span className="font-bold text-green-300">
                {session.game_state}
              </span>
            </div>
            {sessionState?.dailyRoomCreated && (
              <div className="bg-green-600/20 px-4 py-2 rounded-lg border border-green-400/40 animate-pulse">
                📹{" "}
                <span className="font-bold text-green-300">
                  Video Room Ready
                </span>
              </div>
            )}
            {recoveredFromSnapshot && (
              <div className="bg-blue-600/20 px-4 py-2 rounded-lg border border-blue-400/40 animate-pulse">
                📸{" "}
                <span className="font-bold text-blue-300">
                  Recovered from Snapshot
                </span>
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
                      (p) => p.role !== PARTICIPANT_ROLE.GAME_MASTER
                    ).length
                  }
                  )
                </h2>

                {/* Show 3 slots: Host, Home, Away */}
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {[
                    PARTICIPANT_ROLE.HOST,
                    PARTICIPANT_ROLE.HOME,
                    PARTICIPANT_ROLE.AWAY,
                  ].map((requiredRole) => {
                    const player = players.find(
                      (p) =>
                        p.role === requiredRole &&
                        p.session_presence !== SESSION_PRESENCE.NOT_JOINED
                    );

                    if (player) {
                      // Show actual participant
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
                    } else {
                      // Show placeholder for empty slot
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
                                  Waiting for{" "}
                                  {ROLE_DISPLAY_LABELS[requiredRole]}
                                  ...
                                </div>
                                <div className="text-xs text-gray-500">
                                  {ROLE_DISPLAY_LABELS[requiredRole]}
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
                    onClick={() => void handleRefresh()}
                    className="w-full px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg transition-colors duration-200 border border-blue-400/50"
                  >
                    🔄 Refresh
                  </button>
                  <button
                    onClick={() => void handleLeaveLobby()}
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
    </StadiumBackground>
  );
};

export default Lobby;
