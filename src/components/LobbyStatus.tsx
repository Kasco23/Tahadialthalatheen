import { Logger } from "../lib/logger";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "../lib/supabaseClient";
import { getRoleIcon, DISPLAY_PARTICIPANT_SLOTS } from "../lib/roleUtils";
import { getTeamLogoUrl } from "../lib/teamLogoHelper";

interface LobbyStatusProps {
  sessionId: string;
  sessionCode: string;
  hostPassword?: string | null;
  onEndSession: () => void;
  onLobbyUpdate?: (info: {
    participantCount: number;
    roomReady: boolean;
  }) => void;
}

interface ParticipantInfo {
  participant_id: string;
  role: string;
  session_presence: string;
  Profiles?: {
    name?: string | null;
    flag?: string | null;
    team_url?: string | null;
  } | null;
}

interface DailyRoomInfo {
  room_url: string;
}

const LobbyStatus: React.FC<LobbyStatusProps> = ({
  sessionId,
  sessionCode,
  hostPassword: hostPasswordProp,
  onEndSession,
  onLobbyUpdate,
}) => {
  const [participants, setParticipants] = useState<ParticipantInfo[]>([]);
  const [dailyRoom, setDailyRoom] = useState<DailyRoomInfo | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLobbyData = async () => {
      try {
        setLoading(true);

        // Fetch participants with Profile data
        const { data: participantsData, error: participantsError } =
          await supabase
            .from("Participants")
            .select(
              `
              participant_id,
              role,
              session_presence,
              profile_id,
              Profiles!Participants_profile_id_fkey (
                name,
                flag,
                team_url
              )
            `
            )
            .eq("session_id", sessionId);

        if (participantsError) {
          Logger.error("Error fetching participants:", participantsError);
        } else {
          // Normalize the data - Profiles could be object or array
          const normalizedParticipants = (participantsData || []).map(
            (p: any) => {
              const profileData = Array.isArray(p.Profiles)
                ? p.Profiles[0]
                : p.Profiles;
              return {
                ...p,
                Profiles: profileData || null,
              };
            }
          );
          setParticipants(normalizedParticipants);
        }

        // Fetch daily room info
        const { data: dailyRoomData, error: dailyRoomError } = await supabase
          .from("DailyRooms")
          .select("room_url")
          .eq("room_id", sessionId)
          .maybeSingle();

        if (dailyRoomError) {
          Logger.error("Error fetching daily room:", dailyRoomError);
        } else if (dailyRoomData) {
          setDailyRoom(dailyRoomData);
        }

        // If host password not supplied from navigation state, fetch hashed value
        // Note: we prefer showing plaintext passed via navigation state (hostPassword prop)
        // Notify parent about lobby updates
        if (onLobbyUpdate) {
          const count = (participantsData || []).filter(
            (p) => p.session_presence === "Joined"
          ).length;
          onLobbyUpdate({
            participantCount: count,
            roomReady: !!dailyRoomData?.room_url,
          });
        }
      } catch (error) {
        Logger.error("Error fetching lobby data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (sessionId) {
      fetchLobbyData();

      // Set up real-time subscriptions
      const participantsChannel = supabase
        .channel("participants_updates")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "Participants",
            filter: `session_id=eq.${sessionId}`,
          },
          () => {
            fetchLobbyData();
          }
        )
        .subscribe();

      const dailyRoomChannel = supabase
        .channel("daily_room_updates")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "DailyRooms",
            filter: `room_id=eq.${sessionId}`,
          },
          () => {
            fetchLobbyData();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(participantsChannel);
        supabase.removeChannel(dailyRoomChannel);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const getPresenceColor = (presence: string) => {
    switch (presence) {
      case "Joined":
        return "text-green-600 bg-green-100";
      case "Disconnected":
        return "text-yellow-600 bg-yellow-100";
      case "NotJoined":
        return "text-gray-600 bg-gray-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  // Create ordered participant slots (Host, Home, Away)
  const roles = ["Host", "Home", "Away"];
  const participantSlots = roles.map((role) => {
    const participant = participants.find((p) => p.role === role);
    return { role, participant };
  });
  
  const activeParticipantCount = participants.filter(
    (p) => ["Host", "Home", "Away"].includes(p.role) && p.session_presence === "Joined"
  ).length;
  const totalSlots = DISPLAY_PARTICIPANT_SLOTS; // Host + 2 Players (excludes GameMaster)

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          🎯 Lobby Status
        </h2>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          <span className="ml-3 text-gray-600">Loading lobby status...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">🎯 Lobby Status</h2>

      {/* Session Info */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-blue-600 font-medium">Session Code:</span>
            <span className="ml-2 font-mono text-lg font-bold text-blue-800">
              {sessionCode}
            </span>
          </div>
          <div>
            <span className="text-blue-600 font-medium">Active Players:</span>
            <span className="ml-2 font-bold text-blue-800">
              {activeParticipantCount}/{totalSlots}
            </span>
          </div>
          {hostPasswordProp && (
            <div className="md:col-span-2 mt-2 flex items-center space-x-3">
              <div>
                <span className="text-blue-600 font-medium">
                  Host Password:
                </span>
                <span className="ml-2 font-mono text-sm text-blue-800">
                  {showPassword ? hostPasswordProp : "••••••"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="px-3 py-1 bg-gray-100 border rounded text-sm"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Daily Room Status */}
      <div className="mb-6 p-4 border rounded-lg">
        <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
          📹 Daily Room Status
        </h3>
        {dailyRoom ? (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-2"
          >
            <div className="flex items-center text-green-600 mb-3">
              <span className="text-xl mr-2">✅</span>
              <span className="font-medium">Room Created</span>
            </div>
            <div className="text-sm text-gray-600 space-y-1">
              <div className="flex items-start">
                <strong className="min-w-[80px]">Room Name:</strong>
                <span className="ml-2">{sessionCode}</span>
              </div>
              <div className="flex items-start">
                <strong className="min-w-[80px]">Room URL:</strong>
                <a
                  href={dailyRoom.room_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 text-blue-600 hover:underline break-all"
                >
                  {dailyRoom.room_url}
                </a>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="flex items-center text-gray-500">
            <span className="text-xl mr-2">⏳</span>
            <span>Not Created</span>
          </div>
        )}
      </div>

      {/* Host Device Selection */}
      <div className="mb-6 p-4 border-2 border-purple-300 bg-purple-50 rounded-lg">
        <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
          📱 Join Lobby
        </h3>
        <p className="text-sm text-gray-700 mb-3">
          Choose how you want to join the video call:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button
            onClick={() => {
              // Navigate to lobby from current device
              window.location.href = `/lobby/${sessionCode}`;
            }}
            className="flex flex-col items-center justify-center p-4 bg-white border-2 border-purple-400 rounded-lg hover:bg-purple-100 hover:border-purple-500 transition-all"
          >
            <span className="text-3xl mb-2">💻</span>
            <span className="font-semibold text-gray-800">Current Device</span>
            <span className="text-xs text-gray-600 mt-1">
              Join from this browser
            </span>
          </button>
          <button
            onClick={() => {
              // Copy lobby link to clipboard for another device
              const lobbyUrl = `${window.location.origin}/lobby/${sessionCode}`;
              navigator.clipboard.writeText(lobbyUrl);
              alert(
                `Lobby link copied! Open this link on your other device:\n\n${lobbyUrl}`
              );
            }}
            className="flex flex-col items-center justify-center p-4 bg-white border-2 border-blue-400 rounded-lg hover:bg-blue-100 hover:border-blue-500 transition-all"
          >
            <span className="text-3xl mb-2">📱</span>
            <span className="font-semibold text-gray-800">Another Device</span>
            <span className="text-xs text-gray-600 mt-1">
              Copy link for phone/tablet
            </span>
          </button>
        </div>
      </div>

      {/* Participants List */}
      <div className="mb-6">
        <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
          👥 Participants
        </h3>
        <div className="space-y-3">
          {participantSlots.map(({ role, participant }) => {
            if (participant && participant.profile_id) {
              // Show participant with profile data
              return (
                <div
                  key={participant.participant_id}
                  className="flex items-center justify-between p-4 border rounded-lg bg-gray-50"
                >
                  <div className="flex items-center space-x-4">
                    {/* Flag - convert to lowercase for flag-icons */}
                    {participant.Profiles?.flag && (
                      <span
                        className={`fi fi-${participant.Profiles.flag.toLowerCase()} text-3xl`}
                      ></span>
                    )}
                    {/* Team Logo */}
                    {participant.Profiles?.team_url && (
                      <img
                        src={
                          getTeamLogoUrl(participant.Profiles.team_url) ||
                          participant.Profiles.team_url
                        }
                        alt="Team Logo"
                        className="w-10 h-10 rounded object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    )}
                    {/* Name and Role */}
                    <div>
                      <div className="font-bold text-gray-900 text-lg">
                        {participant.Profiles?.name}
                      </div>
                      <div className="text-sm text-gray-600 flex items-center gap-1">
                        <span>{getRoleIcon(participant.role)}</span>
                        <span>{participant.role}</span>
                      </div>
                    </div>
                  </div>
                  {/* Status */}
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${getPresenceColor(participant.session_presence)}`}
                  >
                    {participant.session_presence === "Joined"
                      ? "Joined"
                      : "Disconnected"}
                  </span>
                </div>
              );
            } else {
              // Show empty slot for missing or test players
              return (
                <div
                  key={`empty-${role}`}
                  className="flex items-center space-x-3 p-4 border-2 border-dashed border-gray-300 rounded-lg"
                >
                  <span className="text-2xl text-gray-400">⭕</span>
                  <div className="text-gray-500">
                    <div className="font-medium flex items-center gap-1">
                      <span>{getRoleIcon(role)}</span>
                      <span>{role}</span>
                    </div>
                    <div className="text-sm">Waiting for player...</div>
                  </div>
                </div>
              );
            }
          })}
        </div>
      </div>

      {/* End Session Button */}
      <button
        onClick={onEndSession}
        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200"
      >
        🔚 End Session
      </button>
    </div>
  );
};

export default LobbyStatus;
