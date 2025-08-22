import { useAtomValue } from 'jotai';
import { gameStateAtom } from '@/state';

/**
 * BELL segment hook
 * Players compete to ring the bell first to answer questions
 */
export function useBellSegment() {
  const gameState = useAtomValue(gameStateAtom);

  const isActive = gameState.currentSegment === 'BELL';
  const questionsTotal = gameState.segmentSettings.BELL;
  const currentQuestion = gameState.currentQuestionIndex;

  return {
    isActive,
    questionsTotal,
    currentQuestion,
    isComplete: currentQuestion >= questionsTotal,
  };
}
