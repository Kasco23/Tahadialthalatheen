import { GameDatabase } from '@/lib/gameDatabase';
import type { SegmentCode } from '@/types/game';
import { useContext } from 'react';
import { GameContext } from './GameContextDefinition';
import { mapRecordToState } from './gameUtils';

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
    try {
      const result = await fetch('/.netlify/functions/daily-co-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: 'POST',
          endpoint: `/rooms/${state.gameId}`,
          body: { name, ...payload },
        }),
      });
      return await result.json();
    } catch (err) {
      console.error(`Error calling ${name}:`, err);
      throw err;
    }
  };

  const createVideoRoom = async () => {
    try {
      const res = await callFn('create-room', {
        privacy: 'private',
        properties: {
          exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
          enable_screenshare: true,
          enable_chat: true,
          start_video_off: true,
          start_audio_off: false,
        },
      });
      if (res.url) {
        dispatch({ type: 'SET_VIDEO_ROOM_URL', url: res.url });
        dispatch({ type: 'SET_VIDEO_ROOM_CREATED', created: true });
      }
    } catch (err) {
      console.error('createVideoRoom error', err);
    }
  };

  const endVideoRoom = async (gameId: string) => {
    try {
      await callFn('delete-room', { gameId });
      dispatch({ type: 'SET_VIDEO_ROOM_URL', url: undefined });
      dispatch({ type: 'SET_VIDEO_ROOM_CREATED', created: false });
    } catch (err) {
      console.error('endVideoRoom error', err);
    }
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
