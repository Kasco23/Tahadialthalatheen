import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getActiveSessions, type ActiveSession } from "../lib/mutations";

const ActiveGames: React.FC = () => {
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchActiveSessions = async () => {
      try {
        setLoading(true);
        const sessions = await getActiveSessions();
        setActiveSessions(sessions);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch active sessions:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load active games",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchActiveSessions();

    // Refresh every 30 seconds
    const interval = setInterval(fetchActiveSessions, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleQuickJoin = (sessionCode: string) => {
    // Navigate to join page and auto-fill the session code
    navigate(`/join?sessionCode=${sessionCode}`);
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
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
