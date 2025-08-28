import type { GameState } from '@/types/game';
import { createContext } from 'react';
import type { GameAction } from './gameReducer';

export const GameContext = createContext<
  { state: GameState; dispatch: React.Dispatch<GameAction> } | undefined
>(undefined);
