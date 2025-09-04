import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useSession } from '../lib/sessionHooks';
import { getSessionIdByCode } from '../lib/mutations';

interface Player {
  player_id: string;
  session_id: string;
  name: string;
  flag: string;
  role: string;
  is_connected: boolean;
  is_host: boolean;
  joined_at: string;
  last_active: string;
}

const Lobby: React.FC = () => {
  const { sessionCode } = useParams<{ sessionCode: string }>();
  const navigate = useNavigate();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const { session, loading: sessionLoading, error: sessionError } = useSession(sessionId);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Convert sessionCode to sessionId when component mounts
  useEffect(() => {
    const resolveSessionId = async () => {
      if (!sessionCode) {
        setError('No session code provided');
        setLoading(false);
        return;
      }
      
      try {
        const resolvedSessionId = await getSessionIdByCode(sessionCode);
        setSessionId(resolvedSessionId);
      } catch (error) {
        console.error('Failed to resolve session code:', error);
        setError('Invalid session code');
        setLoading(false);
      }
    };

    if (sessionCode) {
      resolveSessionId();
    }
  }, [sessionCode]);

  useEffect(() => {
    if (!sessionId) {
      setError('No session ID provided');
      setLoading(false);
      return;
    }

    let isMounted = true;

    // Subscribe to player changes
    const subscribeToPlayers = () => {
      const channel = supabase
        .channel(`players_${sessionId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'players',
            filter: `session_id=eq.${sessionId}`
          },
          (payload) => {
            console.log('Player update:', payload);

            if (!isMounted) return;

            if (payload.eventType === 'INSERT') {
              setPlayers(prev => [...prev, payload.new as Player]);
            } else if (payload.eventType === 'UPDATE') {
              setPlayers(prev =>
                prev.map(player =>
                  player.player_id === payload.new.player_id
                    ? { ...player, ...payload.new } as Player
                    : player
                )
              );
            } else if (payload.eventType === 'DELETE') {
              setPlayers(prev =>
                prev.filter(player => player.player_id !== payload.old.player_id)
              );
            }
          }
        )
        .subscribe((status) => {
          console.log('Players subscription status:', status);
        });

      return channel;
    };

    // Load initial players
    const loadInitialPlayers = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('players')
          .select('*')
          .eq('session_id', sessionId)
          .order('joined_at', { ascending: true });

        if (fetchError) {
          console.error('Error loading players:', fetchError);
          setError('Failed to load players');
        } else {
          if (isMounted) {
            setPlayers(data || []);
            setError(null);
          }
        }
      } catch (err) {
        console.error('Error in loadInitialPlayers:', err);
        if (isMounted) {
          setError('An unexpected error occurred');
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

  const getPresenceStatus = (player: Player) => {
    const lobbyPresence = player.is_connected ? '🟢 Online' : '🔴 Offline';
    // For video presence, we'll use a placeholder for now
    // In a real implementation, this would come from Daily.co or another video service
    const videoPresence = player.is_connected ? '📹 In Call' : '📵 Not in Call';
    return { lobbyPresence, videoPresence };
  };

  const getRoleDisplay = (player: Player) => {
    if (player.is_host) return '👑 Host';
    return player.role === 'playerA' ? '⚽ Player A' : '🏆 Player B';
  };

  const canStartQuiz = () => {
    if (!session) return false;
    const connectedPlayers = players.filter(p => p.is_connected);
    return connectedPlayers.length >= 2 && session.phase === 'lobby';
  };

  const handleStartQuiz = () => {
    // Navigate to quiz page
    navigate(`/quiz/${sessionId}`);
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
            Session: <span className="font-bold text-yellow-300">{sessionId}</span>
          </div>
          <div className="text-sm text-blue-200 mt-2">
            Phase: <span className="font-bold">{session.phase}</span> |
            Status: <span className="font-bold">{session.status}</span>
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
                const { lobbyPresence, videoPresence } = getPresenceStatus(player);
                return (
                  <div
                    key={player.player_id}
                    className={`bg-white/10 backdrop-blur-sm rounded-lg p-6 border-2 transition-all duration-300 ${
                      player.is_connected
                        ? 'border-green-400 bg-green-500/10'
                        : 'border-red-400 bg-red-500/10'
                    }`}
                  >
                    {/* Player Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <span className={`fi fi-${player.flag || 'sa'} text-2xl`}></span>
                        <div>
                          <div className="text-xl font-bold text-white">{player.name}</div>
                          <div className="text-sm text-blue-200">{getRoleDisplay(player)}</div>
                        </div>
                      </div>
                      <div className={`text-2xl ${player.is_connected ? 'animate-pulse' : ''}`}>
                        {player.is_connected ? '🟢' : '🔴'}
                      </div>
                    </div>

                    {/* Presence Status */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-blue-200">Lobby:</span>
                        <span className={`text-sm font-medium ${
                          player.is_connected ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {lobbyPresence}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-blue-200">Video:</span>
                        <span className={`text-sm font-medium ${
                          player.is_connected ? 'text-blue-400' : 'text-gray-400'
                        }`}>
                          {videoPresence}
                        </span>
                      </div>
                    </div>

                    {/* Join Time */}
                    <div className="mt-4 pt-4 border-t border-white/20">
                      <div className="text-xs text-blue-300">
                        Joined: {new Date(player.joined_at).toLocaleTimeString()}
                      </div>
                      {player.is_connected && (
                        <div className="text-xs text-green-400 mt-1">
                          Last active: {new Date(player.last_active).toLocaleTimeString()}
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
          <button className="px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg transition-colors duration-200">
            🔄 Refresh
          </button>
          <button className="px-8 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg transition-colors duration-200">
            🚪 Leave Lobby
          </button>
        </div>

        {/* Session Info */}
        <div className="text-center mt-8">
          <div className="text-sm text-blue-200">
            Video Room: {session.video_room_created ? '✅ Created' : '⏳ Pending'}
          </div>
          {session.video_room_url && (
            <div className="text-sm text-blue-200 mt-1">
              Room URL: {session.video_room_url}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Lobby;
