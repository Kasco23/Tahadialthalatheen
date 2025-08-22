import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGameState } from '@/hooks/useGameAtoms';
import { useSetAtom } from 'jotai';
import { updateGameStateAtom } from '@/state';

interface TimerProps {
  onTimeUp?: () => void;
}

export default function Timer({ onTimeUp }: TimerProps) {
  const state = useGameState();
  const updateGameState = useSetAtom(updateGameStateAtom);
  const [localTime, setLocalTime] = useState(state.timer);

  useEffect(() => {
    setLocalTime(state.timer);
  }, [state.timer]);

  // Timer countdown effect
  useEffect(() => {
    if (state.isTimerRunning && localTime > 0) {
      const interval = setInterval(() => {
        setLocalTime((prev: number) => {
          const newTime = prev - 1;
          if (newTime <= 0) {
            updateGameState({ isTimerRunning: false });
            if (onTimeUp) {
              onTimeUp();
            }
            return 0;
          }
          return newTime;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [state.isTimerRunning, localTime, updateGameState, onTimeUp]);

  const progress = localTime > 0 ? (localTime / 30) * 100 : 0; // Assuming 30 seconds default
  const isLowTime = localTime <= 10 && localTime > 0;

  if (!state.isTimerRunning && localTime === 0) {
    return null;
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-24 h-24 mb-2">
        {/* Background circle */}
        <svg className="w-24 h-24 transform -rotate-90">
          <circle
            cx="48"
            cy="48"
            r="40"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="4"
            fill="none"
          />
          {/* Progress circle */}
          <motion.circle
            cx="48"
            cy="48"
            r="40"
            stroke={isLowTime ? '#ef4444' : '#3b82f6'}
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 40}`}
            strokeDashoffset={`${2 * Math.PI * 40 * (1 - progress / 100)}`}
            animate={{
              strokeDashoffset: `${2 * Math.PI * 40 * (1 - progress / 100)}`,
            }}
            transition={{ duration: 0.5 }}
          />
        </svg>

        {/* Timer text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.span
            className={`text-2xl font-bold ${
              isLowTime ? 'text-red-400' : 'text-white'
            }`}
            animate={isLowTime ? { scale: [1, 1.1, 1] } : { scale: 1 }}
            transition={{ duration: 0.5, repeat: isLowTime ? Infinity : 0 }}
          >
            {localTime}
          </motion.span>
        </div>
      </div>

      {/* Timer label */}
      <p className="text-white/70 text-sm font-arabic">
        {state.isTimerRunning ? 'الوقت المتبقي' : 'متوقف'}
      </p>
    </div>
  );
}
