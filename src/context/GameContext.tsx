import { attachGameSync } from '@/lib/gameSync';
import { ReactNode, useEffect, useReducer } from 'react';
import { GameContext } from './GameContextDefinition';
import { gameReducer } from './gameReducer';
import { initialGameState } from './initialGameState';

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
