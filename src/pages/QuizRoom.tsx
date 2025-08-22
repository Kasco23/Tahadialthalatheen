import { useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import {
  useGameState,
  useGameActions,
  usePlayerActions,
} from '@/hooks/useGameAtoms';
import { getQuestionsForSegment } from '@/data/questions';
import type { SegmentCode } from '@/types/game';
import Buzzer from '@/components/Buzzer';
import Scoreboard from '@/components/Scoreboard';
import Timer from '@/components/Timer';

type UserRole = 'host' | 'playerA' | 'playerB';

export default function QuizRoom() {
  const { gameId } = useParams<{ gameId: string }>();
  const [searchParams] = useSearchParams();
  const state = useGameState();
  const { startSession, startGame, advanceQuestion } = useGameActions();
  const { updatePlayer, scorePlayer } = usePlayerActions();
  // Currently unused helpers prepared for later features
  void startSession;

  const userRole = (searchParams.get('role') as UserRole) || 'playerA';
  const isMobile = window.innerWidth < 768;

  // Initialize game if needed
  useState(() => {
    if (gameId && gameId !== state.gameId) {
      startGame();
    }
  });

  const currentGameId = gameId || state.gameId;
  const questions = getQuestionsForSegment(state.currentSegment as SegmentCode);

  const handleNextQuestion = () => {
    advanceQuestion();
  };

  const handleNextSegment = () => {
    // TODO: Implement nextSegment action using atoms
    console.warn('nextSegment not yet implemented with atoms');
  };

  const handleAddStrike = (playerId: 'playerA' | 'playerB') => {
    updatePlayer({
      playerId: playerId as 'playerA' | 'playerB',
      update: {
        strikes: (state.players[playerId]?.strikes || 0) + 1,
      },
    });
  };

  const handleUpdateScore = (
    playerId: 'playerA' | 'playerB',
    points: number,
  ) => {
    scorePlayer(playerId as 'playerA' | 'playerB', points);
  };

  if (!currentGameId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-[#10102a] to-blue-900 flex items-center justify-center">
        <div className="text-white text-center font-arabic">
          <h1 className="text-2xl mb-4">جاري التحميل...</h1>
        </div>
      </div>
    );
  }

  // Host PC View
  if (userRole === 'host' && !isMobile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-[#10102a] to-blue-900 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-white mb-2 font-arabic">
              {state.currentSegment} - السؤال {state.currentQuestionIndex + 1}
            </h1>
            <p className="text-accent2 font-arabic">
              رمز الجلسة: {currentGameId}
            </p>
          </div>

          {/* Host Controls */}
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <button
              onClick={handleNextQuestion}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-xl font-arabic"
            >
              السؤال التالي
            </button>
            <button
              onClick={handleNextSegment}
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-xl font-arabic"
            >
              الفقرة التالية
            </button>
            <button
              onClick={() => handleAddStrike('playerA')}
              className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-xl font-arabic"
            >
              خطأ لاعب أ
            </button>
            <button
              onClick={() => handleAddStrike('playerB')}
              className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-xl font-arabic"
            >
              خطأ لاعب ب
            </button>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Question Area */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-4 font-arabic">
                منطقة الأسئلة
              </h2>
              {questions.length > 0 && (
                <div className="space-y-4">
                  <div className="bg-white/20 rounded-lg p-4">
                    <p className="text-white font-arabic mb-2">السؤال:</p>
                    <p className="text-accent2 font-arabic text-lg">
                      {questions[0]?.text}
                    </p>
                  </div>
                  <div className="bg-white/20 rounded-lg p-4">
                    <p className="text-white font-arabic mb-2">الإجابات:</p>
                    <ul className="space-y-1">
                      {questions[0]?.answers.map(
                        (answer: string, index: number) => (
                          <li key={index} className="text-accent2 font-arabic">
                            • {answer}
                          </li>
                        ),
                      )}
                    </ul>
                  </div>
                </div>
              )}

              {/* Score Update Controls */}
              <div className="mt-6 space-y-3">
                <div className="flex gap-2">
                  <button
                    onClick={() => handleUpdateScore('playerA', 1)}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg font-arabic"
                  >
                    +1 لاعب أ
                  </button>
                  <button
                    onClick={() => handleUpdateScore('playerB', 1)}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg font-arabic"
                  >
                    +1 لاعب ب
                  </button>
                </div>
              </div>
            </div>

            {/* Scoreboard */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
              <Scoreboard />
            </div>
          </div>

          {/* Video Chat Areas */}
          <div className="grid md:grid-cols-2 gap-6 mt-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
              <h3 className="font-bold text-white mb-2 font-arabic">لاعب أ</h3>
              <div className="aspect-video bg-black/30 rounded-lg"></div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
              <h3 className="font-bold text-white mb-2 font-arabic">لاعب ب</h3>
              <div className="aspect-video bg-black/30 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Mobile Player View
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-[#10102a] to-blue-900 flex flex-col">
      {/* Header */}
      <div className="text-center p-4 bg-black/20">
        <h1 className="text-xl font-bold text-white mb-1 font-arabic">
          {state.currentSegment}
        </h1>
        <p className="text-accent2 text-sm font-arabic">
          السؤال {state.currentQuestionIndex + 1} من{' '}
          {state.currentSegment
            ? state.segmentSettings[state.currentSegment]
            : 0}
        </p>
      </div>

      {/* Timer */}
      <div className="p-4">
        <Timer />
      </div>

      {/* Scoreboard */}
      <div className="px-4 pb-4">
        <Scoreboard />
      </div>

      {/* Question Area */}
      <div className="flex-1 p-4">
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 h-full">
          {/* Hide question text for BELL and SING segments */}
          {state.currentSegment !== 'BELL' &&
            state.currentSegment !== 'SING' &&
            questions.length > 0 && (
              <div className="mb-4">
                <p className="text-white font-arabic text-center text-lg">
                  {questions[0]?.text}
                </p>
              </div>
            )}

          {/* Bell segment buzzer */}
          {state.currentSegment === 'BELL' && (
            <div className="flex items-center justify-center h-full">
              <Buzzer />
            </div>
          )}

          {/* Other segments - waiting area */}
          {state.currentSegment !== 'BELL' && (
            <div className="flex items-center justify-center h-full">
              <p className="text-white/70 font-arabic text-center">
                انتظر المقدم...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
