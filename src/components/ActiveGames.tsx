import { useTranslation } from '@/hooks/useTranslation';
import { GameDatabase, type GameRecord } from '@/lib/gameDatabase';
import { isArabicAtom } from '@/state/languageAtoms';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { motion } from 'framer-motion';
import { useAtomValue } from 'jotai';
import { useEffect, useState } from 'react';

// Extend dayjs with relativeTime plugin
dayjs.extend(relativeTime);

interface ActiveGamesProps {
  onJoinGame: (gameId: string) => void;
}

/**
 * Component to display active games that players can quickly join
 */
export default function ActiveGames({ onJoinGame }: ActiveGamesProps) {
  const { t } = useTranslation();
  const isArabic = useAtomValue(isArabicAtom);
  const [games, setGames] = useState<GameRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const fetchActiveGames = async () => {
    try {
      setLoading(true);
      setError('');

      // Get games that are in CONFIG or LOBBY phase (joinable)
      const allGames = await GameDatabase.getAllGames(20);
      const joinableGames = allGames.filter(
        (game) => game.phase === 'CONFIG' || game.phase === 'LOBBY',
      );

      if (joinableGames.length === 0) {
        setGames([]);
        return;
      }

      // Extract room names for batch checking
      const roomNames = joinableGames.map((game) => game.id);

      // Batch check which rooms are active in Daily.co
      const roomCheckResponse = await fetch(
        '/.netlify/functions/batch-check-rooms',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ roomNames }),
        },
      );

      if (!roomCheckResponse.ok) {
        console.warn('Failed to check room status, showing all joinable games');
        setGames(joinableGames);
        return;
      }

      const roomCheckData = await roomCheckResponse.json();
      const activeRoomNames = new Set(roomCheckData.activeRooms || []);

      // Filter games to only those with active or existing Daily.co rooms
      // For LOBBY phase, we want to show games even if no participants yet
      // For CONFIG phase, only show if there's an active room
      const activeGames = joinableGames.filter((game) => {
        if (game.phase === 'LOBBY') {
          // Show LOBBY games if they have a video room (active or not)
          const roomExists = roomCheckData.results?.find(
            (r: { roomName: string; exists: boolean }) =>
              r.roomName === game.id,
          )?.exists;
          return roomExists || game.video_room_created;
        } else if (game.phase === 'CONFIG') {
          // Only show CONFIG games if they have active participants
          return activeRoomNames.has(game.id);
        }
        return false;
      });

      setGames(activeGames);
    } catch (err) {
      console.error('Failed to fetch active games:', err);
      setError('Failed to load active games');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveGames();
    // Refresh every 30 seconds
    const interval = setInterval(fetchActiveGames, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleQuickJoin = (gameId: string) => {
    // Use the provided onJoinGame function
    onJoinGame(gameId);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = dayjs(dateString);
    const now = dayjs();
    const diffMins = now.diff(date, 'minute');

    if (diffMins < 1) return isArabic ? 'الآن' : 'Now';
    if (diffMins < 60)
      return isArabic ? `${diffMins} دقيقة` : `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    return isArabic ? `${diffHours} ساعة` : `${diffHours}h ago`;
  };

  const getPhaseDisplay = (phase: string) => {
    switch (phase) {
      case 'CONFIG':
        return t('config');
      case 'LOBBY':
        return t('lobby');
      case 'PLAYING':
        return t('playing');
      case 'COMPLETED':
        return t('completed');
      default:
        return phase;
    }
  };

  if (loading) {
    return (
      <motion.div
        className="w-full max-w-md mx-auto mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <h3
              className={`text-lg font-semibold text-accent2 ${isArabic ? 'font-arabic' : ''}`}
            >
              {t('activeGames')}
            </h3>
            <div className="w-4 h-4 border-2 border-accent2 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p
            className={`text-white/60 text-sm ${isArabic ? 'font-arabic' : ''}`}
          >
            {t('loading')}
          </p>
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        className="w-full max-w-md mx-auto mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <div className="bg-red-500/10 rounded-xl p-4 border border-red-500/20">
          <h3
            className={`text-lg font-semibold text-red-400 ${isArabic ? 'font-arabic' : ''}`}
          >
            {t('error')}
          </h3>
          <p
            className={`text-red-300 text-sm ${isArabic ? 'font-arabic' : ''}`}
          >
            {error}
          </p>
          <button
            onClick={fetchActiveGames}
            className={`mt-2 px-3 py-1 text-sm rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-200 transition-all ${isArabic ? 'font-arabic' : ''}`}
          >
            {t('refreshGames')}
          </button>
        </div>
      </motion.div>
    );
  }

  if (games.length === 0) {
    return (
      <motion.div
        className="w-full max-w-md mx-auto mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <h3
              className={`text-lg font-semibold text-accent2 ${isArabic ? 'font-arabic' : ''}`}
            >
              {t('activeGames')}
            </h3>
            <button
              onClick={fetchActiveGames}
              className="text-white/60 hover:text-accent2 transition-all"
              title={t('refreshGames')}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
          </div>
          <p
            className={`text-white/60 text-sm ${isArabic ? 'font-arabic' : ''}`}
          >
            {t('noActiveGames')}
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="w-full max-w-md mx-auto mb-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8 }}
    >
      <div className="bg-white/5 rounded-xl p-4 border border-white/10 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <h3
            className={`text-lg font-semibold text-accent2 ${isArabic ? 'font-arabic' : ''}`}
          >
            {t('activeGames')}
          </h3>
          <button
            onClick={fetchActiveGames}
            className="text-white/60 hover:text-accent2 transition-all"
            title={t('refreshGames')}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>

        <div className="space-y-3 max-h-64 overflow-y-auto">
          {games.map((game) => (
            <motion.div
              key={game.id}
              className="bg-white/5 rounded-lg p-3 border border-white/10 hover:border-accent2/50 transition-all"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div
                    className={`font-semibold text-white ${isArabic ? 'font-arabic' : ''}`}
                  >
                    {game.host_name || 'Anonymous Host'}
                  </div>
                  <div
                    className={`text-xs text-white/60 ${isArabic ? 'font-arabic' : ''}`}
                  >
                    {t('created')} {formatTimeAgo(game.created_at)}
                  </div>
                </div>
                <div
                  className={`text-xs px-2 py-1 rounded-full ${
                    game.phase === 'LOBBY'
                      ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                      : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  } ${isArabic ? 'font-arabic' : ''}`}
                >
                  {getPhaseDisplay(game.phase)}
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div
                  className={`text-xs text-white/60 ${isArabic ? 'font-arabic' : ''}`}
                >
                  ID: {game.id}
                </div>
                <button
                  onClick={() => handleQuickJoin(game.id)}
                  className={`px-3 py-1 text-sm rounded-lg bg-accent2/20 hover:bg-accent2/30 text-accent2 hover:text-white transition-all border border-accent2/30 hover:border-accent2 ${isArabic ? 'font-arabic' : ''}`}
                >
                  {t('quickJoin')}
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        <div
          className={`mt-3 text-xs text-white/50 text-center ${isArabic ? 'font-arabic' : ''}`}
        >
          {t('joinAsHostPlayer')}
        </div>
      </div>
    </motion.div>
  );
}
