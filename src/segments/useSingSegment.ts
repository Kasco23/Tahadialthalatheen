import { useAtomValue } from 'jotai';
import { gameStateAtom } from '@/state';

/**
 * SING segment hook
 * Players compete in singing-related questions
 */
export function useSingSegment() {
  const gameState = useAtomValue(gameStateAtom);

  const isActive = gameState.currentSegment === 'SING';
  const questionsTotal = gameState.segmentSettings.SING;
  const currentQuestion = gameState.currentQuestionIndex;

  return {
    isActive,
    questionsTotal,
    currentQuestion,
    isComplete: currentQuestion >= questionsTotal,
  };
}
