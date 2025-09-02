import { attachGameSync } from '@/lib/gameSync';
import { ReactNode, useEffect, useReducer } from 'react';
import { GameContext } from './GameContextDefinition';
import { gameReducer } from './gameReducer';
import { initialGameState } from './initialGameState';

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialGameState);

  useEffect(() => {
    if (!state.sessionId) return;

    let cleanup: (() => void) | undefined;

    // Call attachGameSync with sessionId and dispatch
    attachGameSync(state.sessionId, dispatch)
      .then((cleanupFn) => {
        cleanup = cleanupFn;
      })
      .catch(console.error);

    return () => {
      cleanup?.();
    };
  }, [state.sessionId]);

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}
