import type { GameState } from '@/types/game';
import { defaultPlayers } from './defaults';

export const initialGameState: GameState = {
  gameId: '',
  hostCode: '',
  hostName: '',
  hostIsConnected: false,
  phase: 'CONFIG',
  currentSegment: null,
  currentQuestionIndex: 0,
  timer: 0,
  isTimerRunning: false,
  videoRoomUrl: undefined,
  videoRoomCreated: false,
  segmentSettings: { WSHA: 4, AUCT: 4, BELL: 10, SING: 10, REMO: 4 },
  players: defaultPlayers,
  scoreHistory: [],
};
