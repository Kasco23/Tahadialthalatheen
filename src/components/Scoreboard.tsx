import { motion } from 'framer-motion';
import { useGameState } from '@/hooks/useGameAtoms';
import type { PlayerId } from '@/types/game';

export default function Scoreboard() {
  const state = useGameState();

  // Special button configurations
  const buttonConfig = {
    LOCK_BUTTON: {
      name: 'القفل',
      color: 'bg-yellow-500',
      icon: '🔒',
    },
    TRAVELER_BUTTON: {
      name: 'المسافر',
      color: 'bg-blue-500',
      icon: '✈️',
    },
    PIT_BUTTON: {
      name: 'الحفرة',
      color: 'bg-red-500',
      icon: '🕳️',
    },
  };

  const renderPlayer = (playerId: PlayerId) => {
    const player = state.players[playerId];
    if (!player) return null;

    const playerIndex = playerId === 'playerA' ? 0 : 1;

    return (
      <motion.div
        key={playerId}
        className="relative bg-theme-surface/20 backdrop-blur-sm rounded-2xl p-4 border-2 border-theme-border"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: playerIndex * 0.1 }}
      >
        {/* Player Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            {/* Flag */}
            {player.flag && (
              <span className={`fi fi-${player.flag} text-2xl`}></span>
            )}

            {/* Player Name */}
            <div>
              <h3 className="text-theme-text font-bold font-arabic">
                {player.name}
              </h3>
              <div
                className={`text-xs px-2 py-1 rounded-full ${
                  player.isConnected
                    ? 'bg-theme-success/20 text-theme-success'
                    : 'bg-theme-error/20 text-theme-error'
                }`}
              >
                {player.isConnected ? 'متصل' : 'غير متصل'}
              </div>
            </div>
          </div>
        </div>

        {/* Score Display */}
        <div className="text-center mb-3">
          <motion.div
            className="text-3xl font-bold text-theme-text mb-1"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 0.3 }}
            key={player.score}
          >
            {player.score}
          </motion.div>
          <p className="text-theme-text-muted text-sm font-arabic">النقاط</p>
        </div>

        {/* Strikes */}
        <div className="flex justify-center gap-1 mb-3">
          {[...Array(3)].map((_, index) => (
            <div
              key={index}
              className={`w-3 h-3 rounded-full ${
                index < (player.strikes ?? 0) ? 'bg-theme-error' : 'bg-theme-border'
              }`}
            />
          ))}
        </div>

        {/* Special Buttons */}
        <div className="space-y-2">
          {Object.entries(player.specialButtons).map(
            ([buttonType, available]) => {
              const config =
                buttonConfig[buttonType as keyof typeof buttonConfig];
              if (!config) return null;

              return (
                <div
                  key={buttonType}
                  className={`flex items-center justify-between p-2 rounded-lg ${
                    available ? config.color + '/20' : 'bg-gray-500/20'
                  }`}
                >
                  <span className="text-theme-text-muted text-xs font-arabic">
                    {config.name}
                  </span>
                  <span
                    className={`text-lg ${available ? '' : 'grayscale opacity-50'}`}
                  >
                    {config.icon}
                  </span>
                </div>
              );
            },
          )}
        </div>

        {/* Connection Status Indicator */}
        <div className="absolute top-2 right-2">
          <div
            className={`w-3 h-3 rounded-full ${
              player.isConnected ? 'bg-theme-success' : 'bg-theme-error'
            }`}
          />
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-theme-text text-center mb-4 font-arabic">
        لوحة النتائج
      </h2>

      <div className="grid gap-4">
        {(['playerA', 'playerB'] as const).map(renderPlayer)}
      </div>

      {/* Current Segment Info */}
      <div className="bg-theme-surface/20 backdrop-blur-sm rounded-xl p-4 text-center">
        <h3 className="text-theme-text font-bold mb-2 font-arabic">
          الفقرة الحالية
        </h3>
        <div className="text-theme-accent font-arabic text-lg">
          {state.currentSegment}
        </div>
        {state.currentSegment && (
          <div className="text-theme-text-muted text-sm font-arabic">
            السؤال {state.currentQuestionIndex + 1} من{' '}
            {state.segmentSettings[state.currentSegment]}
          </div>
        )}
      </div>
    </div>
  );
}
