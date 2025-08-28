import { createContext } from 'react';
import type { GameState } from '../types/game';
import type { GameAction } from './gameReducer';

export type GameContextType = {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
};

export const GameContext = createContext<GameContextType | undefined>(
  undefined,
);
