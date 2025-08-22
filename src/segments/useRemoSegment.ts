import { useAtomValue } from 'jotai';
import { gameStateAtom } from '@/state';

/**
 * REMO segment hook
 * Remote control segment for video questions
 */
export function useRemoSegment() {
  const gameState = useAtomValue(gameStateAtom);

  const isActive = gameState.currentSegment === 'REMO';
  const questionsTotal = gameState.segmentSettings.REMO;
  const currentQuestion = gameState.currentQuestionIndex;

  return {
    isActive,
    questionsTotal,
    currentQuestion,
    isComplete: currentQuestion >= questionsTotal,
  };
}
