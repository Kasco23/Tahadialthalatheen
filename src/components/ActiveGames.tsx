import { Logger } from "../lib/logger";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getActiveSessions,
  joinAsPlayerWithCode,
  type ActiveSession,
} from "../lib/mutations";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabaseClient";
import UsernameRequiredModal from "./UsernameRequiredModal";
import { useUsernameCheck } from "../hooks/useUsernameCheck";

const REFRESH_INTERVAL_MS = 30000; // 30 seconds

interface ActiveGamesSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const ActiveGamesSidebar: React.FC<ActiveGamesSidebarProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { requireUsername, showModal, hideUsernameModal } = useUsernameCheck();

  useEffect(() => {
    const fetchActiveSessions = async () => {
      try {
        setLoading(true);
        const sessions = await getActiveSessions();
        setActiveSessions(sessions);
        setError(null);
      } catch (err) {
        Logger.error("Failed to fetch active sessions:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load active games",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchActiveSessions();

    // Refresh every 30 seconds
    const interval = setInterval(fetchActiveSessions, REFRESH_INTERVAL_MS);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const handleQuickJoin = async (sessionCode: string) => {
    try {
      // Check if user is authenticated
      if (!user) {
        // Not authenticated - navigate to join page with session code pre-filled
        navigate(`/join?sessionCode=${sessionCode}&role=player`);
        return;
      }

      // Check if user has username
      if (!requireUsername()) {
        return;
      }

      // Fetch session to check if user is the host
      const { data: sessionData, error: sessionError } = await supabase
        .from("Sessions")
        .select("session_id, host_profile_id")
        .eq("session_code", sessionCode.toUpperCase())
        .single();

      if (sessionError || !sessionData) {
        Logger.error("Failed to fetch session:", sessionError);
        navigate(`/join?sessionCode=${sessionCode}&role=player`);
        return;
      }

      const isHost = sessionData.host_profile_id === user.id;

      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from("Profiles")
        .select("name, flag, team")
        .eq("id", user.id)
        .single();

      if (profileError || !profileData) {
        Logger.error("Failed to fetch profile for quick join:", profileError);
        navigate(`/join?sessionCode=${sessionCode}&role=player`);
        return;
      }

      if (isHost) {
        // User is the host - create or update host participant
        const { data: existingHost } = await supabase
          .from("Participants")
          .select("participant_id")
          .eq("session_id", sessionData.session_id)
          .eq("profile_id", user.id)
          .eq("role", "Host")
          .maybeSingle();

        if (existingHost) {
          // Update existing host presence
          await supabase
            .from("Participants")
            .update({
              lobby_presence: "Joined",
              join_at: new Date().toISOString(),
              disconnect_at: null,
            })
            .eq("participant_id", existingHost.participant_id);
        } else {
          // Create new host participant
          await supabase.from("Participants").insert({
            session_id: sessionData.session_id,
            name: profileData.name || "Host",
            flag: profileData.flag || "",
            team_logo_url: profileData.team || "",
            role: "Host",
            lobby_presence: "Joined",
            join_at: new Date().toISOString(),
            profile_id: user.id,
          });
        }

        Logger.info("Host joined session");
        navigate(`/lobby/${sessionCode}/host`);
        return;
      }

      // Not host - join as player using available seat
      const { participantId, role } = await joinAsPlayerWithCode(
        sessionCode,
        profileData.name || "Player",
        profileData.flag || "",
        profileData.team || "",
        user.id,
      );

      Logger.info(
        `Quick join successful - Participant ${participantId} joined as ${role}`,
      );

      // Navigate directly to lobby
      const seat = role === "Player1" ? "1" : "2";
      navigate(`/lobby/${sessionCode}/${seat}`);
    } catch (err) {
      Logger.error("Quick join error:", err);
      // Fallback to normal join flow
      navigate(`/join?sessionCode=${sessionCode}`);
    }
  };

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case "Setup":
        return "bg-yellow-100 text-yellow-800";
      case "Lobby":
        return "bg-blue-100 text-blue-800";
      case "Full Lobby":
        return "bg-green-100 text-green-800";
      case "In-Progress":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="bg-green-900/20 backdrop-blur-md rounded-xl shadow-lg p-6 border border-green-500/30">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400"></div>
          <span className="ml-3 text-green-100">Loading games...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-green-900/20 backdrop-blur-md rounded-xl shadow-lg p-6 border border-green-500/30">
        <div className="bg-red-500/20 border border-red-400/50 rounded-lg p-4">
          <p className="text-red-200">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Username Required Modal */}
      <UsernameRequiredModal
        isOpen={showModal}
        onClose={hideUsernameModal}
        message="You need to create a username before joining games."
      />

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Slide-out Sidebar - LEFT SIDE */}
      <div
        className={`fixed top-0 left-0 h-full w-96 bg-gradient-to-b from-green-900/95 via-green-800/95 to-green-900/95 backdrop-blur-md shadow-2xl z-50 transform transition-transform duration-300 ease-in-out border-r-4 border-green-500/50 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <span className="text-3xl">🎮</span>
              Active Games
            </h2>
            <button
              onClick={onClose}
              className="text-green-200 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Games List */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
            {activeSessions.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-green-300 text-6xl mb-4">⚽</div>
                <p className="text-green-100 text-lg font-semibold">
                  No active games
                </p>
                <p className="text-green-300 text-sm mt-2">
                  Create a session to get started!
                </p>
              </div>
            ) : (
              activeSessions.map((session) => (
                <div
                  key={session.session_id}
                  className="bg-black/30 backdrop-blur-sm border border-green-500/30 rounded-lg p-4 hover:bg-black/40 hover:border-green-400/50 transition-all duration-200 shadow-lg"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-mono text-xl font-black text-green-300">
                          {session.session_code}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-bold ${getPhaseColor(session.phase)}`}
                        >
                          {session.phase}
                        </span>
                      </div>

                      <div className="space-y-1.5 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-green-400">👤</span>
                          <span className="text-green-100 font-medium">
                            {session.host_name}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-green-400">👥</span>
                          <span className="text-green-100">
                            {session.participant_count}/2 players
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={
                              session.has_daily_room
                                ? "text-green-400"
                                : "text-yellow-400"
                            }
                          >
                            {session.has_daily_room ? "📹" : "⏳"}
                          </span>
                          <span
                            className={`text-sm ${session.has_daily_room ? "text-green-200" : "text-yellow-200"}`}
                          >
                            {session.has_daily_room
                              ? "Video Ready"
                              : "Setting up"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      handleQuickJoin(session.session_code);
                      onClose();
                    }}
                    className="w-full px-4 py-2.5 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                  >
                    Quick Join →
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Custom Scrollbar Styles */}
        <style>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.2);
            border-radius: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(34, 197, 94, 0.5);
            border-radius: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(34, 197, 94, 0.7);
          }
        `}</style>
      </div>
    </>
  );
};

export default ActiveGamesSidebar;
