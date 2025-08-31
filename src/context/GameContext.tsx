import { attachGameSync } from '@/lib/gameSync';
import { ReactNode, useContext, useEffect, useReducer } from 'react';
import { GameContext } from './GameContextDefinition';
import { gameReducer } from './gameReducer';
import { initialGameState } from './initialGameState';
import { defaultPlayers } from './defaults';
import type { GameState, SegmentCode, GamePhase } from '@/types/game';
import type { GameRecord } from '@/lib/gameDatabase';

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialGameState);
  useEffect(() => {
    if (!state.gameId) return;

    let detachFn: (() => void) | null = null;
    const isActive = { current: true };

    // Setup async attachment
    attachGameSync(state.gameId, dispatch)
      .then((detach) => {
        if (isActive.current) {
          detachFn = detach;
        } else {
          // If effect already cleaned up, call detach immediately
          detach();
        }
      })
      .catch(console.error);

    // Cleanup function
    return () => {
      isActive.current = false;
      if (detachFn) {
        detachFn();
      }
    };
  }, [state.gameId]);
  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}

// Custom hook to use the game context
export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}

// Map GameRecord from database to GameState
export function mapRecordToState(record: GameRecord): GameState {
  return {
    gameId: record.session_id, // Was id
    hostCode: record.host_code,
    hostName: record.host_name,
    hostIsConnected: record.host_is_connected,
    phase: record.phase as GamePhase,
    currentSegment: record.current_segment as SegmentCode | null,
    currentQuestionIndex: record.current_question_index,
    videoRoomUrl: record.video_room_url ?? undefined,
    videoRoomCreated: record.video_room_created,
    timer: record.timer,
    isTimerRunning: record.is_timer_running,
    segmentSettings: record.segment_settings as Record<SegmentCode, number>,
    players: defaultPlayers,
    scoreHistory: [],
  };
}
