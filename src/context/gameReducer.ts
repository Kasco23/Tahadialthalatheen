import { produce, Draft } from 'immer';
import type {
  GameState,
  GamePhase,
  SegmentCode,
  Player,
  PlayerId,
  ScoreEvent,
} from '@/types/game';

export type GameAction =
  | { type: 'INIT'; payload: GameState }
  | { type: 'SET_PHASE'; phase: GamePhase }
  | { type: 'SET_CURRENT_SEGMENT'; segment: SegmentCode | null }
  | { type: 'ADVANCE_QUESTION' }
  | { type: 'ADD_PLAYER'; player: Player }
  | { type: 'UPDATE_PLAYER'; id: PlayerId; partial: Partial<Player> }
  | { type: 'UPDATE_TIMER'; timer: number; isRunning: boolean }
  | { type: 'PUSH_SCORE_EVENT'; event: ScoreEvent }
  | { type: 'RESET_STRIKES' }
  | { type: 'COMPLETE_GAME' }
  | { type: 'SET_VIDEO_ROOM_URL'; url: string | undefined }
  | { type: 'SET_VIDEO_ROOM_CREATED'; created: boolean };

export function gameReducer(state: GameState, action: GameAction) {
  return produce<GameState>(state, (draft: Draft<GameState>) => {
    switch (action.type) {
      case 'INIT':
        return action.payload;

      case 'SET_PHASE':
        draft.phase = action.phase;
        if (action.phase === 'CONFIG') draft.currentSegment = null;
        return;

      case 'SET_CURRENT_SEGMENT':
        draft.currentSegment = action.segment;
        draft.currentQuestionIndex = 0;
        draft.timer = 0;
        draft.isTimerRunning = false;
        return;

      case 'ADVANCE_QUESTION':
        draft.currentQuestionIndex += 1;
        draft.timer = 0;
        draft.isTimerRunning = false;
        Object.values(draft.players).forEach((p) => {
          p.strikes = 0;
        });
        return;

      case 'ADD_PLAYER':
        draft.players[action.player.id] = action.player;
        return;

      case 'UPDATE_PLAYER':
        Object.assign(draft.players[action.id], action.partial);
        return;

      case 'UPDATE_TIMER':
        draft.timer = action.timer;
        draft.isTimerRunning = action.isRunning;
        return;

      case 'PUSH_SCORE_EVENT':
        draft.scoreHistory.push(action.event);
        return;

      case 'RESET_STRIKES':
        Object.values(draft.players).forEach((p) => {
          p.strikes = 0;
        });
        return;

      case 'COMPLETE_GAME':
        draft.phase = 'COMPLETED';
        draft.isTimerRunning = false;
        return;

      case 'SET_VIDEO_ROOM_URL':
        draft.videoRoomUrl = action.url;
        return;

      case 'SET_VIDEO_ROOM_CREATED':
        draft.videoRoomCreated = action.created;
        return;
    }
  });
}
