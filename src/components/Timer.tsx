import { useState, useEffect, useCallback } from "react";
import { Logger } from "../lib/logger";

export interface TimerProps {
  /** Duration in seconds */
  duration: number;
  /** Callback when timer completes */
  onComplete?: () => void;
  /** Callback called every second with remaining time */
  onTick?: (remaining: number) => void;
  /** Auto-start timer on mount */
  autoStart?: boolean;
  /** Custom className for styling */
  className?: string;
  /** Show timer display (default: true) */
  showDisplay?: boolean;
  /** Warning threshold in seconds (when to show warning color) */
  warningThreshold?: number;
}

/**
 * Timer Component
 * 
 * A flexible countdown timer that can be used for quiz questions,
 * lobby countdowns, or any time-limited interactions.
 * 
 * Features:
 * - Countdown display with visual feedback
 * - Color changes based on remaining time (green → yellow → red)
 * - Callback support for completion and tick events
 * - Manual start/stop/reset controls
 * - Auto-start option
 * 
 * Usage:
 * ```tsx
 * <Timer 
 *   duration={30} 
 *   onComplete={() => console.log('Time up!')}
 *   autoStart={true}
 * />
 * ```
 */
export const Timer: React.FC<TimerProps> = ({
  duration,
  onComplete,
  onTick,
  autoStart = false,
  className = "",
  showDisplay = true,
  warningThreshold = 10,
}) => {
  const [timeRemaining, setTimeRemaining] = useState(duration);
  const [isRunning, setIsRunning] = useState(autoStart);
  const [isComplete, setIsComplete] = useState(false);

  // Reset timer when duration changes
  useEffect(() => {
    setTimeRemaining(duration);
    setIsComplete(false);
    if (autoStart) {
      setIsRunning(true);
    }
  }, [duration, autoStart]);

  // Main timer logic
  useEffect(() => {
    if (!isRunning || isComplete) {
      return;
    }

    const intervalId = setInterval(() => {
      setTimeRemaining((prev) => {
        const newTime = prev - 1;
        
        // Call onTick callback
        if (onTick) {
          onTick(newTime);
        }

        // Check if timer completed
        if (newTime <= 0) {
          setIsRunning(false);
          setIsComplete(true);
          if (onComplete) {
            Logger.log("Timer completed, calling onComplete callback");
            onComplete();
          }
          return 0;
        }

        return newTime;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [isRunning, isComplete, onComplete, onTick]);

  const start = useCallback(() => {
    if (!isComplete && timeRemaining > 0) {
      setIsRunning(true);
      Logger.log("Timer started");
    }
  }, [isComplete, timeRemaining]);

  const pause = useCallback(() => {
    setIsRunning(false);
    Logger.log("Timer paused");
  }, []);

  const reset = useCallback(() => {
    setTimeRemaining(duration);
    setIsRunning(false);
    setIsComplete(false);
    Logger.log("Timer reset");
  }, [duration]);

  const restart = useCallback(() => {
    setTimeRemaining(duration);
    setIsComplete(false);
    setIsRunning(true);
    Logger.log("Timer restarted");
  }, [duration]);

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Determine color based on remaining time
  const getTimerColor = (): string => {
    if (isComplete) return "text-gray-400";
    if (timeRemaining <= warningThreshold / 2) return "text-error";
    if (timeRemaining <= warningThreshold) return "text-warning";
    return "text-success";
  };

  // Determine background color for progress
  const getProgressColor = (): string => {
    if (isComplete) return "bg-gray-400";
    if (timeRemaining <= warningThreshold / 2) return "bg-error";
    if (timeRemaining <= warningThreshold) return "bg-warning";
    return "bg-success";
  };

  const progress = (timeRemaining / duration) * 100;

  if (!showDisplay) {
    // Return null but still run the timer logic
    return null;
  }

  return (
    <div className={`timer-container ${className}`}>
      <div className="flex flex-col items-center gap-2">
        {/* Time Display */}
        <div className={`text-4xl font-bold font-mono ${getTimerColor()}`}>
          {formatTime(timeRemaining)}
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full ${getProgressColor()} transition-all duration-1000 ease-linear`}
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Timer Status */}
        {isComplete && (
          <div className="text-sm text-gray-500 font-semibold">Time's Up!</div>
        )}

        {/* Control Buttons (for testing/debugging) */}
        {process.env.NODE_ENV === "development" && (
          <div className="flex gap-2 mt-2">
            {!isRunning && !isComplete && (
              <button
                onClick={start}
                className="btn btn-xs btn-primary"
                type="button"
              >
                Start
              </button>
            )}
            {isRunning && (
              <button
                onClick={pause}
                className="btn btn-xs btn-warning"
                type="button"
              >
                Pause
              </button>
            )}
            <button
              onClick={reset}
              className="btn btn-xs btn-secondary"
              type="button"
            >
              Reset
            </button>
            <button
              onClick={restart}
              className="btn btn-xs btn-accent"
              type="button"
            >
              Restart
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Timer;
