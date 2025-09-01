import LanguageToggle from '@/components/LanguageToggle';
import {
  useGameActions,
  useGameState,
  useGameSync,
} from '@/hooks/useGameAtoms';
import { useTranslation } from '@/hooks/useTranslation';
import '@/styles/ControlRoom.css';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface ParticipantCardProps {
  name: string;
  role: string;
  status: 'connected' | 'disconnected' | 'pending';
  score?: number;
  avatar?: string;
  lastActivity?: Date;
  isOnline?: boolean;
}

function ParticipantCard({
  name,
  role,
  status,
  score,
  avatar,
  lastActivity,
  isOnline,
}: ParticipantCardProps) {
  const { language } = useTranslation();

  const statusColors = {
    connected: 'border-green-500/30 bg-green-500/10',
    disconnected: 'border-red-500/30 bg-red-500/10',
    pending: 'border-yellow-500/30 bg-yellow-500/10',
  };

  const statusIcons = {
    connected: '✅',
    disconnected: '🔴',
    pending: '⏳',
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`relative overflow-hidden rounded-xl border p-4 backdrop-blur-sm ${statusColors[status]}`}
    >
      <div className="flex items-center space-x-3">
        <div className="relative">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
            {avatar || name.charAt(0).toUpperCase()}
          </div>
          <div
            className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-xs ${
              isOnline ? 'bg-green-500' : 'bg-gray-500'
            }`}
          >
            {isOnline ? '●' : '○'}
          </div>
        </div>

        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <h3
              className={`font-semibold text-white ${language === 'ar' ? 'font-arabic' : ''}`}
            >
              {name || 'Not Joined Yet'}
            </h3>
            <span className="text-lg">{statusIcons[status]}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-white/70">
            <span className={language === 'ar' ? 'font-arabic' : ''}>
              {role}
            </span>
            {score !== undefined && (
              <>
                <span>•</span>
                <span className={language === 'ar' ? 'font-arabic' : ''}>
                  Score: {score}
                </span>
              </>
            )}
          </div>
          {lastActivity && (
            <div
              className={`text-xs text-white/50 mt-1 ${language === 'ar' ? 'font-arabic' : ''}`}
            >
              Last Seen: {lastActivity.toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Enhanced Host Control Interface
 * Features: Real-time participant tracking, session management, and creative controller tools
 */
export default function ControlRoom() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = useGameState();
  const { loadGameState, startGame, setHostConnected, endVideoRoom } =
    useGameActions();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [sessionTime, setSessionTime] = useState<number>(0);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { language } = useTranslation();

  // Initialize game sync
  useGameSync();

  // Session timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSessionTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Format session time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get game ID from location state
  useEffect(() => {
    const locationState = location.state as {
      gameId?: string;
      hostCode?: string;
      hostName?: string;
    } | null;

    if (locationState?.gameId) {
      setIsLoading(true);
      loadGameState(locationState.gameId)
        .then((result) => {
          if (!result.success) {
            setError(result.error || 'Failed to load game');
          } else {
            setHostConnected(true);
          }
        })
        .catch((err) => {
          console.error('Failed to load game state:', err);
          setError('خطأ في تحميل بيانات الجلسة');
        })
        .finally(() => setIsLoading(false));
    } else if (state.sessionId) {
      setHostConnected(true);
      navigate(
        `/lobby/${state.sessionId}?role=host&hostName=${encodeURIComponent(state.hostName || (language === 'ar' ? 'المقدم' : 'Host'))}`,
      );
    } else {
      navigate('/');
    }
  }, [
    location.state,
    state.sessionId,
    state.hostName,
    loadGameState,
    setHostConnected,
    navigate,
    language,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (state.sessionId) {
        setHostConnected(false);
      }
    };
  }, [state.sessionId, setHostConnected]);

  const handleStartGame = () => {
    startGame();
  };

  const handleCloseSession = async () => {
    if (!state.sessionId) return;

    const confirmed = window.confirm(
      language === 'ar'
        ? 'هل أنت متأكد من إغلاق الجلسة؟ سيتم إنهاء جميع الاتصالات وحذف غرفة الفيديو.'
        : 'Are you sure you want to close the session? This will end all connections and delete the video room.',
    );

    if (confirmed) {
      try {
        await endVideoRoom(state.sessionId);
        navigate('/');
      } catch (error) {
        console.error('Failed to close session:', error);
        alert(
          language === 'ar'
            ? 'فشل في إغلاق الجلسة. يرجى المحاولة مرة أخرى.'
            : 'Failed to close session. Please try again.',
        );
      }
    }
  };

  const handleQuickAction = (action: string) => {
    console.log(`Quick action: ${action}`);
    // Implement quick actions like pause, resume, skip question, etc.
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center text-white"
        >
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className={`text-xl ${language === 'ar' ? 'font-arabic' : ''}`}>
            {language === 'ar'
              ? 'جاري تحميل بيانات الجلسة...'
              : 'Loading session data...'}
          </p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center text-white bg-slate-800/50 p-8 rounded-xl border border-slate-700"
        >
          <div className="text-red-400 text-6xl mb-6">⚠️</div>
          <p
            className={`text-xl mb-6 ${language === 'ar' ? 'font-arabic' : ''}`}
          >
            {error}
          </p>
          <button
            onClick={() => navigate('/')}
            className={`px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors ${language === 'ar' ? 'font-arabic' : ''}`}
          >
            {language === 'ar' ? 'العودة للرئيسية' : 'Back to Home'}
          </button>
        </motion.div>
      </div>
    );
  }

  const participants = [
    {
      name: state.hostName || (language === 'ar' ? 'المقدم' : 'Host'),
      role: language === 'ar' ? 'المقدم' : 'Host',
      status: state.hostIsConnected ? 'connected' : ('disconnected' as const),
      isOnline: state.hostIsConnected,
      avatar: '🎮',
    },
    {
      name: state.players.playerA.name,
      role: language === 'ar' ? 'اللاعب الأول' : 'Player A',
      status: state.players.playerA.name ? 'connected' : ('pending' as const),
      score: state.players.playerA.score,
      isOnline: !!state.players.playerA.name,
      avatar: '⚽',
    },
    {
      name: state.players.playerB.name,
      role: language === 'ar' ? 'اللاعب الثاني' : 'Player B',
      status: state.players.playerB.name ? 'connected' : ('pending' as const),
      score: state.players.playerB.score,
      isOnline: !!state.players.playerB.name,
      avatar: '🏆',
    },
  ];

  return (
    <div className="min-h-screen relative">
      {/* Remove static background to use ThemedHexBackground from App level */}
      <div className="relative z-10 p-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mb-8"
        >
          <div className="flex items-center space-x-4">
            <img
              src="/images/Logo.png"
              alt="تحدي الثلاثين"
              className="w-12 h-12"
            />
            <div>
              <h1
                className={`text-3xl font-bold text-white ${language === 'ar' ? 'font-arabic' : ''}`}
              >
                Control Room
              </h1>
              <p
                className={`text-slate-400 ${language === 'ar' ? 'font-arabic' : ''}`}
              >
                Host Control Interface
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div
              className={`text-white bg-slate-800/50 px-4 py-2 rounded-lg ${language === 'ar' ? 'font-arabic' : ''}`}
            >
              ⏱️ {formatTime(sessionTime)}
            </div>
            <LanguageToggle />
          </div>
        </motion.div>

        {/* Session Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card-bg backdrop-blur-sm rounded-xl p-6 border border-card-border"
          >
            <div className="text-center">
              <div className="text-2xl mb-2">🎮</div>
              <h3
                className={`text-lg font-semibold text-white mb-1 ${language === 'ar' ? 'font-arabic' : ''}`}
              >
                Session ID
              </h3>
              <p className="text-3xl font-mono text-football-green font-bold">
                {state.sessionId}
              </p>
              <p
                className={`text-xs text-slate-400 mt-2 ${language === 'ar' ? 'font-arabic' : ''}`}
              >
                Players Join Code
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card-bg backdrop-blur-sm rounded-xl p-6 border border-card-border"
          >
            <div className="text-center">
              <div className="text-2xl mb-2">🔐</div>
              <h3
                className={`text-lg font-semibold text-white mb-1 ${language === 'ar' ? 'font-arabic' : ''}`}
              >
                Host Code
              </h3>
              <p className="text-3xl font-mono text-accent-green font-bold">
                {state.hostCode}
              </p>
              <p
                className={`text-xs text-slate-400 mt-2 ${language === 'ar' ? 'font-arabic' : ''}`}
              >
                Controller Code
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700"
          >
            <div className="text-center">
              <div className="text-2xl mb-2">📊</div>
              <h3
                className={`text-lg font-semibold text-white mb-1 ${language === 'ar' ? 'font-arabic' : ''}`}
              >
                Game Phase
              </h3>
              <p
                className={`text-xl text-yellow-400 font-bold ${language === 'ar' ? 'font-arabic' : ''}`}
              >
                {state.phase}
              </p>
              <p
                className={`text-xs text-slate-400 mt-2 ${language === 'ar' ? 'font-arabic' : ''}`}
              >
                Current Stage
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700"
          >
            <div className="text-center">
              <div
                className={`text-2xl mb-2 ${state.videoRoomCreated ? '' : 'grayscale'}`}
              >
                📹
              </div>
              <h3
                className={`text-lg font-semibold text-white mb-1 ${language === 'ar' ? 'font-arabic' : ''}`}
              >
                Video Room
              </h3>
              <p
                className={`text-xl font-bold ${state.videoRoomCreated ? 'text-green-400' : 'text-red-400'} ${language === 'ar' ? 'font-arabic' : ''}`}
              >
                {state.videoRoomCreated ? 'Active' : 'Inactive'}
              </p>
              <p
                className={`text-xs text-slate-400 mt-2 ${language === 'ar' ? 'font-arabic' : ''}`}
              >
                Video Status
              </p>
            </div>
          </motion.div>
        </div>

        {/* Participants Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-8"
        >
          <h2
            className={`text-2xl font-bold text-white mb-6 ${language === 'ar' ? 'font-arabic' : ''}`}
          >
            👥 Session Participants
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {participants.map((participant, index) => (
              <ParticipantCard
                key={index}
                name={participant.name}
                role={participant.role}
                status={
                  participant.status as 'connected' | 'disconnected' | 'pending'
                }
                score={participant.score}
                avatar={participant.avatar}
                isOnline={participant.isOnline}
              />
            ))}
          </div>
        </motion.div>

        {/* Control Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-8"
        >
          <h2
            className={`text-2xl font-bold text-white mb-6 ${language === 'ar' ? 'font-arabic' : ''}`}
          >
            🎮 Session Controls
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={handleStartGame}
              disabled={state.phase !== 'LOBBY'}
              className={`p-4 rounded-xl transition-all duration-300 transform hover:scale-105 ${
                state.phase === 'LOBBY'
                  ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              } ${language === 'ar' ? 'font-arabic' : ''}`}
            >
              <div className="text-2xl mb-2">🚀</div>
              <div className="text-sm font-semibold">
                {state.phase === 'LOBBY' ? 'Start Game' : 'Game In Progress'}
              </div>
            </button>

            <button
              onClick={() =>
                navigate(
                  `/lobby/${state.sessionId}?role=host&hostName=${encodeURIComponent(state.hostName || 'Host')}`,
                )
              }
              className={`p-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all duration-300 transform hover:scale-105 shadow-lg ${language === 'ar' ? 'font-arabic' : ''}`}
            >
              <div className="text-2xl mb-2">📹</div>
              <div className="text-sm font-semibold">Manage Video</div>
            </button>

            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={`p-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white transition-all duration-300 transform hover:scale-105 shadow-lg ${language === 'ar' ? 'font-arabic' : ''}`}
            >
              <div className="text-2xl mb-2">⚙️</div>
              <div className="text-sm font-semibold">Advanced Controls</div>
            </button>

            <button
              onClick={handleCloseSession}
              className={`p-4 rounded-xl bg-red-600 hover:bg-red-700 text-white transition-all duration-300 transform hover:scale-105 shadow-lg ${language === 'ar' ? 'font-arabic' : ''}`}
            >
              <div className="text-2xl mb-2">🔚</div>
              <div className="text-sm font-semibold">End Session</div>
            </button>
          </div>
        </motion.div>

        {/* Advanced Controls */}
        <AnimatePresence>
          {showAdvanced && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
                <h3
                  className={`text-xl font-bold text-white mb-4 ${language === 'ar' ? 'font-arabic' : ''}`}
                >
                  🛠️ Advanced Controls
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <button
                    onClick={() => handleQuickAction('pause')}
                    className={`p-3 rounded-lg bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400 border border-yellow-600/30 transition-colors ${language === 'ar' ? 'font-arabic' : ''}`}
                  >
                    ⏸️ Pause Game
                  </button>
                  <button
                    onClick={() => handleQuickAction('skip')}
                    className={`p-3 rounded-lg bg-orange-600/20 hover:bg-orange-600/30 text-orange-400 border border-orange-600/30 transition-colors ${language === 'ar' ? 'font-arabic' : ''}`}
                  >
                    ⏭️ Skip Question
                  </button>
                  <button
                    onClick={() => handleQuickAction('reset')}
                    className={`p-3 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600/30 transition-colors ${language === 'ar' ? 'font-arabic' : ''}`}
                  >
                    🔄 Reset Scores
                  </button>
                  <button
                    onClick={() => handleQuickAction('announce')}
                    className={`p-3 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-600/30 transition-colors ${language === 'ar' ? 'font-arabic' : ''}`}
                  >
                    📢 Announce
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-blue-500/10 rounded-xl p-6 border border-blue-500/30"
        >
          <h3
            className={`text-lg font-bold text-blue-300 mb-4 ${language === 'ar' ? 'font-arabic' : ''}`}
          >
            💡 Controller Instructions
          </h3>
          <div
            className={`space-y-2 text-white/80 ${language === 'ar' ? 'font-arabic' : ''}`}
          >
            <p>• Share the Game ID with players to join</p>
            <p>• Use video management features in the lobby</p>
            <p>• Monitor participant connections and activity</p>
            <p>• Use advanced controls for game management</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
