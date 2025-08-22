import { createContext } from 'react';
import type { GameState, PlayerId, SegmentCode } from '@/types/game';

interface GameContextType {
  state: GameState;
  actions: {
    /**
     * Initialize a game and persist the record in Supabase.
     *
     * @param gameId - Unique ID for the game session
     * @param hostName - Optional host name to store with the game
     */
    startGame: (gameId: string, hostName?: string) => Promise<void>;
    joinGame: (
      playerId: PlayerId,
      playerData: Partial<GameState['players'][PlayerId]>,
    ) => void;
    updateHostName: (hostName: string) => void;
    updateSegmentSettings: (settings: Record<SegmentCode, number>) => void;
    createVideoRoom: (
      gameId: string,
    ) => Promise<{ success: boolean; roomUrl?: string; error?: string }>;
    endVideoRoom: (
      gameId: string,
    ) => Promise<{ success: boolean; error?: string }>;
    /**
     * Request a Daily.co meeting token for a participant
     * @param room - Daily.co room name
     * @param user - Display name for the token
     * @param isHost - Whether the user should have host privileges
     */
    generateDailyToken: (
      room: string,
      user: string,
      isHost: boolean,
    ) => Promise<{ success: boolean; token?: string; error?: string }>;
    trackPresence: (participantData: {
      id: string;
      name: string;
      type: 'controller' | 'host' | 'player';
      playerId?: PlayerId;
      flag?: string;
      club?: string;
    }) => void;
    nextQuestion: () => void;
    nextSegment: () => void;
    updateScore: (playerId: PlayerId, points: number) => void;
    addStrike: (playerId: PlayerId) => void;
    useSpecialButton: (
      playerId: PlayerId,
      buttonType: keyof GameState['players'][PlayerId]['specialButtons'],
    ) => void;
    startTimer: (duration: number) => void;
    stopTimer: () => void;
    tickTimer: () => void;
    resetGame: () => void;
  };
}

export const GameContext = createContext<GameContextType | undefined>(
  undefined,
);
export type { GameContextType };
