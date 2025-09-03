import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useSession } from '../lib/sessionHooks';

interface PlayerData {
  player_id: string;
  session_id: string;
  name: string;
  role: string;
  flag: string;
  score: number;
  is_connected: boolean;
  is_host: boolean;
  special_buttons: {
    PIT_BUTTON: boolean;
    LOCK_BUTTON: boolean;
    TRAVELER_BUTTON: boolean;
  };
}

const Quiz: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { session, loading: sessionLoading } = useSession(sessionId || null);
  const [players, setPlayers] = useState<PlayerData[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<PlayerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Powerup definitions - map to special_buttons
  const powerups = [
    { id: 'PIT_BUTTON', name: 'Pass', description: 'Skip this question' },
    { id: 'LOCK_BUTTON', name: 'Al-Habeed', description: 'Lock question for yourself' },
    { id: 'TRAVELER_BUTTON', name: 'Bellegoal', description: 'Get first turn' },
    { id: 'EXTRA_BUTTON', name: 'Slippy-G', description: 'Lock question + bonus points' }
  ];

  // Segment definitions
  const segments = {
    WDYK: { name: 'What Do You Know', description: 'Open-ended questions' },
    AUCT: { name: 'Auction', description: 'Bid-based questions' },
    BELL: { name: 'Bell', description: 'First to answer' },
    UPDW: { name: 'Upside-down', description: 'Hard questions' },
    REMO: { name: 'Remontada', description: 'Career path questions' }
  };

  useEffect(() => {
    if (!sessionId) {
      setError('No session ID provided');
      setLoading(false);
      return;
    }

    // Subscribe to session changes
    const subscribeToSession = () => {
      const channel = supabase
        .channel('session_updates')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'sessions',
            filter: `session_id=eq.${sessionId}`
          },
          (payload) => {
            console.log('Session update:', payload);
            if (payload.new) {
              // Session updates are handled by useSession hook
            }
          }
        )
        .subscribe();

      return channel;
    };

    // Subscribe to player changes (including score updates)
    const subscribeToPlayers = () => {
      const channel = supabase
        .channel('player_updates')
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
            // Refresh players data when any player changes
            loadPlayers();
          }
        )
        .subscribe();

      return channel;
    };

    const loadInitialData = async () => {
      try {
        // Load players data and identify current player
        await loadPlayers();
        
        // For demo, set first player as current player
        const currentPlayerId = 'player1'; // This would come from auth
        const foundPlayer = players.find(p => p.player_id === currentPlayerId);
        if (foundPlayer) {
          setCurrentPlayer(foundPlayer);
        }

      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load quiz data');
      } finally {
        setLoading(false);
      }
    };

    // Load players for current session
    const loadPlayers = async () => {
      try {
        const { data: playersData, error: playersError } = await supabase
          .from('players')
          .select('*')
          .eq('session_id', sessionId);

        if (playersError) {
          console.error('Error loading players:', playersError);
        } else {
          setPlayers(playersData || []);
        }
      } catch (err) {
        console.error('Error loading players:', err);
      }
    };

    const sessionChannel = subscribeToSession();
    const playerChannel = subscribeToPlayers();
    loadInitialData();

    // Cleanup subscriptions
    return () => {
      sessionChannel.unsubscribe();
      playerChannel.unsubscribe();
    };
  }, [sessionId]);

  const handlePowerupClick = async (powerupId: string) => {
    if (!session || !currentPlayer) return;

    try {
      // Update the special_buttons field
      const updatedButtons = {
        ...currentPlayer.special_buttons,
        [powerupId]: false // Disable the button
      };

      const { error } = await supabase
        .from('players')
        .update({ special_buttons: updatedButtons })
        .eq('player_id', currentPlayer.player_id);

      if (error) {
        console.error('Error updating powerup:', error);
      } else {
        console.log(`Powerup ${powerupId} used by ${currentPlayer.name}`);
      }
    } catch (err) {
      console.error('Error using powerup:', err);
    }
  };

  const isPowerupUsed = (powerupId: string): boolean => {
    if (!currentPlayer) return true; // Disable if no current player
    return !currentPlayer.special_buttons[powerupId as keyof typeof currentPlayer.special_buttons];
  };

  // Calculate running scores for Player1 and Player2
  const getRunningScores = () => {
    const player1 = players.find(p => p.role === 'Player1');
    const player2 = players.find(p => p.role === 'Player2');

    return {
      player1Score: player1?.score || 0,
      player2Score: player2?.score || 0
    };
  };

  if (loading || sessionLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 flex items-center justify-center">
        <div className="text-white text-xl">Loading Quiz...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-600 via-red-700 to-red-800 flex items-center justify-center">
        <div className="text-white text-xl">{error}</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-600 via-gray-700 to-gray-800 flex items-center justify-center">
        <div className="text-white text-xl">No session data available</div>
      </div>
    );
  }

  const currentSegment = segments[session.current_segment as keyof typeof segments];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">⚽ Football Quiz</h1>
          <div className="text-xl text-blue-100">
            Current Segment: <span className="font-bold text-yellow-300">
              {currentSegment?.name || session.current_segment}
            </span>
            {session.current_segment && (
              <span className="ml-2 text-sm">
                (Phase: {session.phase})
              </span>
            )}
          </div>
          <div className="text-sm text-blue-200 mt-1">
            {currentSegment?.description}
          </div>
        </div>

        {/* Scores */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center">
            <div className="text-2xl font-bold text-white mb-2">Player 1</div>
            <div className="text-4xl font-bold text-yellow-300">
              {getRunningScores().player1Score}
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center">
            <div className="text-2xl font-bold text-white mb-2">Player 2</div>
            <div className="text-4xl font-bold text-yellow-300">
              {getRunningScores().player2Score}
            </div>
          </div>
        </div>

        {/* Question Area */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 mb-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Question</h2>
          <div className="text-xl text-blue-100">
            {/* Question content would go here */}
            Question content will be displayed here...
          </div>
        </div>

        {/* Powerups */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
          <h3 className="text-xl font-bold text-white mb-4 text-center">Power-ups</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {powerups.map((powerup) => {
              const isUsed = isPowerupUsed(powerup.id);
              return (
                <button
                  key={powerup.id}
                  onClick={() => handlePowerupClick(powerup.id)}
                  disabled={isUsed}
                  className={`p-4 rounded-lg font-bold transition-all duration-200 transform hover:scale-105 ${
                    isUsed
                      ? 'bg-gray-500 text-gray-300 cursor-not-allowed opacity-50'
                      : 'bg-yellow-500 hover:bg-yellow-600 text-black shadow-lg'
                  }`}
                >
                  <div className="text-sm">{powerup.name}</div>
                  <div className="text-xs mt-1 opacity-75">{powerup.description}</div>
                  {isUsed && <div className="text-xs mt-1">✅ Used</div>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Answer Input */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mt-6">
          <h3 className="text-xl font-bold text-white mb-4 text-center">Your Answer</h3>
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Type your answer here..."
              className="flex-1 px-4 py-3 rounded-lg bg-white/20 text-white placeholder-blue-200 border border-white/30 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
            <button className="px-8 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg transition-colors duration-200">
              Submit Answer
            </button>
          </div>
        </div>

        {/* Phase Info */}
        <div className="text-center mt-8">
          <div className="text-sm text-blue-200">
            Session Phase: <span className="font-bold text-white">{session.phase}</span>
          </div>
          <div className="text-sm text-blue-200 mt-1">
            Current Segment: <span className="font-bold text-yellow-300">{session.current_segment}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Quiz;
