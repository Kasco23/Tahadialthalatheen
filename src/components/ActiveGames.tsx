import { Logger } from "../lib/logger";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  getActiveSessions, 
  getAvailableSeats, 
  joinAsPlayerWithCode,
  type ActiveSession 
} from "../lib/mutations";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabaseClient";

const REFRESH_INTERVAL_MS = 30000; // 30 seconds

const ActiveGames: React.FC = () => {
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

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
        // User is the host - join as Host
        const { data: existingHost } = await supabase
          .from("Participants")
          .select("participant_id, role")
          .eq("session_id", sessionData.session_id)
          .eq("role", "Host")
          .maybeSingle();

        if (existingHost) {
          // Host already exists, just update presence and navigate
          await supabase
            .from("Participants")
            .update({
              lobby_presence: "Joined",
              join_at: new Date().toISOString(),
              disconnect_at: null,
            })
            .eq("participant_id", existingHost.participant_id);

          Logger.info("Host rejoined");
          navigate(`/lobby/${sessionCode}/host`);
          return;
        } else {
          // Create host participant
          const { data: newHost } = await supabase
            .from("Participants")
            .insert({
              session_id: sessionData.session_id,
              name: profileData.name || "Host",
              flag: profileData.flag || "",
              team_logo_url: profileData.team || "",
              role: "Host",
              lobby_presence: "Joined",
              join_at: new Date().toISOString(),
              disconnect_at: null,
              profile_id: user.id,
            })
            .select("participant_id")
            .single();

          if (newHost) {
            Logger.info("Host participant created");
            navigate(`/lobby/${sessionCode}/host`);
            return;
          }
        }
      }

      // Not host - check available player seats
      const { availableSeats } = await getAvailableSeats(sessionCode);

      if (availableSeats.length === 0) {
        // No seats available
        navigate(`/join?sessionCode=${sessionCode}&error=full`);
        return;
      }

      // Join as player
      const { participantId, role } = await joinAsPlayerWithCode(
        sessionCode,
        profileData.name || "Player",
        profileData.flag || "",
        profileData.team || "",
        user.id,
      );

      Logger.info(`Quick join successful - Participant ${participantId} joined as ${role}`);

      // Navigate directly to lobby
      const seat = role === "Player1" ? "1" : "2";
      navigate(`/lobby/${sessionCode}/${seat}`);
    } catch (err) {
      Logger.error("Quick join error:", err);
      // Fallback to normal join flow
      navigate(`/join?sessionCode=${sessionCode}`);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
          🎮 Active Games
        </h2>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          <span className="ml-3 text-gray-600">Loading active games...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
          🎮 Active Games
        </h2>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
        🎮 Active Games
      </h2>

      {activeSessions.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 text-6xl mb-4">⚽</div>
          <p className="text-gray-600 text-lg">No active games at the moment</p>
          <p className="text-gray-500 text-sm mt-2">
            Create a session to get started!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {activeSessions.map((session) => (
            <div
              key={session.session_id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="font-mono text-lg font-bold text-green-600">
                      {session.session_code}
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getPhaseColor(session.phase)}`}
                    >
                      {session.phase}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-500">Host:</span>
                      <span className="ml-2 font-medium">
                        {session.host_name}
                      </span>
                    </div>

                    <div>
                      <span className="text-gray-500">Created:</span>
                      <span className="ml-2">
                        {formatDateTime(session.created_at)}
                      </span>
                    </div>

                    <div>
                      <span className="text-gray-500">Players:</span>
                      <span className="ml-2 font-medium">
                        {session.participant_count}/2
                      </span>
                    </div>

                    <div>
                      <span className="text-gray-500">Daily Room:</span>
                      <span
                        className={`ml-2 font-medium ${session.has_daily_room ? "text-green-600" : "text-gray-400"}`}
                      >
                        {session.has_daily_room ? "✅ Ready" : "⏳ Not Created"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="ml-4">
                  <button
                    onClick={() => handleQuickJoin(session.session_code)}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
                  >
                    Quick Join
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ActiveGames;
