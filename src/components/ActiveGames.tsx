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
  const [refreshing, setRefreshing] = useState(false);

  const fetchActiveGames = async () => {
    try {
      const wasInitialLoad = loading;
      if (!wasInitialLoad) {
        setRefreshing(true);
      }
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
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchActiveGames();
    // Refresh every 30 seconds
    const interval = setInterval(fetchActiveGames, 30000);
    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleQuickJoin = (gameId: string) => {
    try {
      // Use the provided onJoinGame function
      onJoinGame(gameId);
    } catch (err) {
      console.error('Failed to join game:', err);
      setError(`Failed to join game: ${gameId}`);
    }
  };

  const handleQuickJoinFirst = () => {
    if (games.length === 0) {
      setError('No games available to join');
      return;
    }

    // Join the first available game
    const firstGame = games[0];
    handleQuickJoin(firstGame.id);
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
        <div className="bg-theme-surface/20 rounded-xl p-4 border border-theme-border backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3">
            <h3
              className={`text-lg font-semibold text-theme-primary ${isArabic ? 'font-arabic' : ''}`}
            >
              {t('activeGames')}
            </h3>
            <div className="w-4 h-4 border-2 border-theme-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p
            className={`text-theme-text-muted text-sm ${isArabic ? 'font-arabic' : ''}`}
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
        <div className="bg-theme-error/10 rounded-xl p-4 border border-theme-error/30 backdrop-blur-sm">
          <h3
            className={`text-lg font-semibold text-theme-error ${isArabic ? 'font-arabic' : ''}`}
          >
            {t('error')}
          </h3>
          <p
            className={`text-theme-error text-sm opacity-80 ${isArabic ? 'font-arabic' : ''}`}
          >
            {error}
          </p>
          <button
            onClick={fetchActiveGames}
            className={`mt-2 px-3 py-1 text-sm rounded-lg bg-theme-error/20 hover:bg-theme-error/30 text-theme-error hover:text-theme-text transition-all border border-theme-error/30 hover:border-theme-error ${isArabic ? 'font-arabic' : ''}`}
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
        <div className="bg-theme-surface/20 rounded-xl p-4 border border-theme-border backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <h3
              className={`text-lg font-semibold text-theme-primary ${isArabic ? 'font-arabic' : ''}`}
            >
              {t('activeGames')}
            </h3>
            <button
              onClick={fetchActiveGames}
              disabled={refreshing}
              className="text-theme-text-muted hover:text-theme-primary transition-all disabled:opacity-50"
              title={t('refreshGames')}
            >
              <svg
                className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}
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
            className={`text-theme-text-muted text-sm ${isArabic ? 'font-arabic' : ''}`}
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
      <div className="bg-theme-surface/20 rounded-xl p-4 border border-theme-border backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <h3
            className={`text-lg font-semibold text-theme-primary ${isArabic ? 'font-arabic' : ''}`}
          >
            {t('activeGames')}
          </h3>
          <button
            onClick={fetchActiveGames}
            disabled={refreshing}
            className="text-theme-text-muted hover:text-theme-primary transition-all disabled:opacity-50"
            title={t('refreshGames')}
          >
            <svg
              className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}
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
              className="bg-theme-surface/20 rounded-lg p-3 border border-theme-border hover:border-theme-primary/50 transition-all"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div
                    className={`font-semibold text-theme-text ${isArabic ? 'font-arabic' : ''}`}
                  >
                    {game.host_name || 'Anonymous Host'}
                  </div>
                  <div
                    className={`text-xs text-theme-text-muted ${isArabic ? 'font-arabic' : ''}`}
                  >
                    {t('created')} {formatTimeAgo(game.created_at)}
                  </div>
                </div>
                <div
                  className={`text-xs px-2 py-1 rounded-full ${
                    game.phase === 'LOBBY'
                      ? 'bg-theme-success/20 text-theme-success border border-theme-success/30'
                      : 'bg-theme-secondary/20 text-theme-secondary border border-theme-secondary/30'
                  } ${isArabic ? 'font-arabic' : ''}`}
                >
                  {getPhaseDisplay(game.phase)}
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div
                  className={`text-xs text-theme-text-muted ${isArabic ? 'font-arabic' : ''}`}
                >
                  ID: {game.id}
                </div>
                <button
                  onClick={() => handleQuickJoin(game.id)}
                  className={`px-3 py-1 text-sm rounded-lg bg-theme-primary/20 hover:bg-theme-primary/30 text-theme-primary hover:text-theme-text transition-all border border-theme-primary/30 hover:border-theme-primary ${isArabic ? 'font-arabic' : ''}`}
                >
                  {t('quickJoin')}
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Quick Join First Button */}
        <div className="mt-4 pt-3 border-t border-theme-border">
          <button
            onClick={handleQuickJoinFirst}
            disabled={games.length === 0}
            className={`w-full px-4 py-2 text-sm rounded-lg bg-theme-secondary/20 hover:bg-theme-secondary/30 text-theme-secondary hover:text-theme-text transition-all border border-theme-secondary/30 hover:border-theme-secondary disabled:opacity-50 disabled:cursor-not-allowed ${isArabic ? 'font-arabic' : ''}`}
          >
            {games.length > 0
              ? t('quickJoinFirst') || 'Quick Join First Game'
              : t('noGamesAvailable') || 'No Games Available'}
          </button>
        </div>

        <div
          className={`mt-3 text-xs text-theme-text-muted text-center ${isArabic ? 'font-arabic' : ''}`}
        >
          {t('joinAsHostPlayer')}
        </div>
      </div>
    </motion.div>
  );
}
