import {
  createContext,
  useContext,
  useReducer,
  ReactNode,
  useEffect,
} from 'react';
import type { GameState, SegmentCode } from '@/types/game';
import { GameDatabase, type GameRecord } from '@/lib/gameDatabase';
import { attachGameSync } from '@/lib/gameSync';
import { gameReducer, type GameAction } from './gameReducer';
import { initialGameState } from './initialGameState';
import { defaultPlayers } from './defaults';

/** Map a Supabase record to our internal GameState shape */
export function mapRecordToState(record: GameRecord): GameState {
  return {
    ...initialGameState,
    gameId: record.id,
    hostCode: record.host_code,
    hostName: record.host_name ?? null,
    phase: record.phase as GameState['phase'],
    currentSegment: record.current_segment as GameState['currentSegment'],
    currentQuestionIndex: record.current_question_index,
    videoRoomUrl: record.video_room_url ?? undefined,
    videoRoomCreated: record.video_room_created,
    timer: record.timer,
    isTimerRunning: record.is_timer_running,
    segmentSettings: record.segment_settings as Record<SegmentCode, number>,
    players: defaultPlayers,
  };
}

export const GameContext = createContext<
  { state: GameState; dispatch: React.Dispatch<GameAction> } | undefined
>(undefined);

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

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within a GameProvider');
  const { state, dispatch } = ctx;

  // ================ Helper actions =================

  const startSession = async (
    gameId: string,
    hostCode: string,
    hostName: string | null,
    segmentSettings: Record<SegmentCode, number>,
  ) => {
    const record = await GameDatabase.createGame(
      gameId,
      hostCode,
      hostName,
      segmentSettings,
    );
    if (record) dispatch({ type: 'INIT', payload: mapRecordToState(record) });
  };

  const startGame = () => dispatch({ type: 'SET_PHASE', phase: 'PLAYING' });

  const advanceQuestion = () => dispatch({ type: 'ADVANCE_QUESTION' });

  // ================= Daily.co video helpers =================
  const callFn = async (name: string, payload: unknown) => {
    const res = await fetch(`/.netlify/functions/${name}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  };

  /**
   * @deprecated Video room creation should only be done through the Lobby component.
   * This function is kept for backward compatibility but should not be used.
   */
  const createVideoRoom = async (gameId: string) => {
    console.warn(
      '[DEPRECATED] createVideoRoom called from GameContext. Use Lobby component instead.',
    );
    const result = (await callFn('create-daily-room', {
      roomName: gameId,
    })) as {
      url?: string;
      error?: string;
    };
    if (result.url) {
      await GameDatabase.updateGame(gameId, {
        video_room_url: result.url,
        video_room_created: true,
      });
      return { success: true, roomUrl: result.url };
    }
    return { success: false, error: result.error || 'create failed' };
  };

  /**
   * @deprecated Video room deletion should only be done through the Lobby component.
   * This function is kept for backward compatibility but should not be used.
   */
  const endVideoRoom = async (gameId: string) => {
    console.warn(
      '[DEPRECATED] endVideoRoom called from GameContext. Use Lobby component instead.',
    );
    await callFn('delete-daily-room', { roomName: gameId });
    await GameDatabase.updateGame(gameId, {
      video_room_created: false,
      video_room_url: null,
    });
    return { success: true };
  };

  /**
   * Request a Daily.co meeting token for a participant.
   *
   * @param room - Daily.co room name
   * @param user - Display name for the token
   * @param isHost - Whether the user should have host privileges
   * @returns The token string, or null if generation failed
   */
  const generateDailyToken = async (
    room: string,
    user: string,
    isHost: boolean,
  ): Promise<string | null> => {
    try {
      const res = await fetch('/.netlify/functions/create-daily-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room, user, isHost }),
      });
      const json = (await res.json()) as { token?: string; error?: string };
      if (!json.token) throw new Error(json.error || 'No token');
      return json.token;
    } catch (err) {
      console.error('generateDailyToken error', err);
      return null;
    }
  };

  // Return legacy actions object for backward compatibility
  const actions: Record<string, (...args: unknown[]) => unknown> = {};
  return {
    state,
    dispatch,
    startSession,
    startGame,
    advanceQuestion,
    createVideoRoom,
    endVideoRoom,
    generateDailyToken,
    actions,
  };
}
