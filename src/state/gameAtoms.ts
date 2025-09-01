import { atom } from 'jotai';
import type {
  GameState,
  Player,
  PlayerId,
  SegmentCode,
  GamePhase,
} from '@/types/game';

// Default values
const defaultPlayers: Record<PlayerId, Player> = {
  playerA: {
    id: 'playerA',
    name: '',
    score: 0,
    strikes: 0,
    isConnected: false,
    specialButtons: {
      LOCK_BUTTON: false,
      TRAVELER_BUTTON: false,
      PIT_BUTTON: false,
    },
  },
  playerB: {
    id: 'playerB',
    name: '',
    score: 0,
    strikes: 0,
    isConnected: false,
    specialButtons: {
      LOCK_BUTTON: false,
      TRAVELER_BUTTON: false,
      PIT_BUTTON: false,
    },
  },
};

const defaultSegmentSettings: Record<SegmentCode, number> = {
  WSHA: 4,
  AUCT: 4,
  BELL: 10,
  SING: 10,
  REMO: 4,
};

// Core game identity atoms
export const sessionIdAtom = atom<string>(''); // Updated from gameIdAtom
export const hostCodeAtom = atom<string>('');
export const hostNameAtom = atom<string | null>(null);
export const hostIsConnectedAtom = atom<boolean>(false);

// Game phase and progress atoms
export const phaseAtom = atom<GamePhase>('CONFIG');
export const currentSegmentAtom = atom<SegmentCode | null>(null);
export const currentQuestionIndexAtom = atom<number>(0);

// Video room atoms
export const videoRoomUrlAtom = atom<string | undefined>(undefined);
export const videoRoomCreatedAtom = atom<boolean>(false);

// Timer atoms
export const timerAtom = atom<number>(0);
export const isTimerRunningAtom = atom<boolean>(false);

// Configuration atoms
export const segmentSettingsAtom = atom<Record<SegmentCode, number>>(
  defaultSegmentSettings,
);

// Player atoms
export const playersAtom = atom<Record<PlayerId, Player>>(defaultPlayers);

// Score history atom
export const scoreHistoryAtom = atom<GameState['scoreHistory']>([]);

// Derived atom for complete game state
export const gameStateAtom = atom<GameState>((get) => ({
  sessionId: get(sessionIdAtom), // Updated from gameId
  hostCode: get(hostCodeAtom),
  hostName: get(hostNameAtom),
  hostIsConnected: get(hostIsConnectedAtom),
  phase: get(phaseAtom),
  currentSegment: get(currentSegmentAtom),
  currentQuestionIndex: get(currentQuestionIndexAtom),
  videoRoomUrl: get(videoRoomUrlAtom),
  videoRoomCreated: get(videoRoomCreatedAtom),
  timer: get(timerAtom),
  isTimerRunning: get(isTimerRunningAtom),
  segmentSettings: get(segmentSettingsAtom),
  players: get(playersAtom),
  scoreHistory: get(scoreHistoryAtom),
}));

// Writable atom for updating entire game state at once
export const updateGameStateAtom = atom(
  null,
  (_get, set, update: Partial<GameState>) => {
    if (update.sessionId !== undefined) set(sessionIdAtom, update.sessionId); // Updated from gameId
    if (update.hostCode !== undefined) set(hostCodeAtom, update.hostCode);
    if (update.hostName !== undefined) set(hostNameAtom, update.hostName);
    if (update.hostIsConnected !== undefined)
      set(hostIsConnectedAtom, update.hostIsConnected);
    if (update.phase !== undefined) set(phaseAtom, update.phase);
    if (update.currentSegment !== undefined)
      set(currentSegmentAtom, update.currentSegment);
    if (update.currentQuestionIndex !== undefined)
      set(currentQuestionIndexAtom, update.currentQuestionIndex);
    if (update.videoRoomUrl !== undefined)
      set(videoRoomUrlAtom, update.videoRoomUrl);
    if (update.videoRoomCreated !== undefined)
      set(videoRoomCreatedAtom, update.videoRoomCreated);
    if (update.timer !== undefined) set(timerAtom, update.timer);
    if (update.isTimerRunning !== undefined)
      set(isTimerRunningAtom, update.isTimerRunning);
    if (update.segmentSettings !== undefined)
      set(segmentSettingsAtom, update.segmentSettings);
    if (update.players !== undefined) set(playersAtom, update.players);
    if (update.scoreHistory !== undefined)
      set(scoreHistoryAtom, update.scoreHistory);
  },
);

// Action atoms for specific operations
export const updatePlayerAtom = atom(
  null,
  (
    get,
    set,
    { playerId, update }: { playerId: PlayerId; update: Partial<Player> },
  ) => {
    const currentPlayers = get(playersAtom);
    set(playersAtom, {
      ...currentPlayers,
      [playerId]: {
        ...currentPlayers[playerId],
        ...update,
      },
    });
  },
);

export const addPlayerAtom = atom(null, (get, set, player: Player) => {
  const currentPlayers = get(playersAtom);
  set(playersAtom, {
    ...currentPlayers,
    [player.id]: player,
  });
});

export const updateScoreAtom = atom(
  null,
  (get, set, { playerId, points }: { playerId: PlayerId; points: number }) => {
    const currentPlayers = get(playersAtom);
    const player = currentPlayers[playerId];
    if (player) {
      set(playersAtom, {
        ...currentPlayers,
        [playerId]: {
          ...player,
          score: player.score + points,
        },
      });
    }
  },
);

export const initializeGameAtom = atom(
  null,
  (_get, set, gameState: GameState) => {
    set(sessionIdAtom, gameState.sessionId); // Updated from gameId
    set(hostCodeAtom, gameState.hostCode);
    set(hostNameAtom, gameState.hostName);
    set(phaseAtom, gameState.phase);
    set(currentSegmentAtom, gameState.currentSegment);
    set(currentQuestionIndexAtom, gameState.currentQuestionIndex);
    set(videoRoomUrlAtom, gameState.videoRoomUrl);
    set(videoRoomCreatedAtom, gameState.videoRoomCreated);
    set(timerAtom, gameState.timer);
    set(isTimerRunningAtom, gameState.isTimerRunning);
    set(segmentSettingsAtom, gameState.segmentSettings);
    set(playersAtom, gameState.players);
    set(scoreHistoryAtom, gameState.scoreHistory);
  },
);
