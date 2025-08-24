import ActiveGames from '@/components/ActiveGames';
import LanguageToggle from '@/components/LanguageToggle';
import { useTranslation } from '@/hooks/useTranslation';
import { isArabicAtom } from '@/state/languageAtoms';
import { motion } from 'framer-motion';
import { useAtomValue } from 'jotai';
import { useNavigate } from 'react-router-dom';

export default function Landing() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const isArabic = useAtomValue(isArabicAtom);

  const handleCreateSession = () => {
    navigate('/create-session');
  };

  const handleJoinGame = () => {
    navigate('/join');
  };

  const handleJoinGameById = (gameId: string) => {
    navigate(`/join?gameId=${gameId}`);
  };

  const handleApiStatus = () => {
    navigate('/api-status');
  };

  return (
    <div className="min-h-screen bg-[var(--theme-bg-primary)] relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 opacity-30">
        <motion.div
          className="absolute top-20 left-10 w-2 h-2 bg-green-400 rounded-full"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            delay: 0,
          }}
        />
        <motion.div
          className="absolute top-40 right-20 w-1 h-1 bg-blue-400 rounded-full"
          animate={{
            scale: [1, 2, 1],
            opacity: [0.3, 0.8, 0.3],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            delay: 1,
          }}
        />
        <motion.div
          className="absolute bottom-32 left-1/4 w-3 h-3 bg-purple-400 rounded-full"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.4, 0.9, 0.4],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            delay: 2,
          }}
        />
      </div>

      {/* Language Toggle */}
      <div className="absolute top-4 right-4 z-50">
        <LanguageToggle />
      </div>

      {/* API Status Button */}
      <motion.button
        onClick={handleApiStatus}
        className="absolute top-4 left-4 z-50 px-3 py-2 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white/80 hover:text-white rounded-lg transition-all duration-300 text-sm border border-white/20"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        API Status
      </motion.button>

      {/* Main Content */}
      <div className="relative z-10">
        <motion.div
          className="flex flex-col items-center justify-center min-h-screen px-4"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          {/* Logo with enhanced animation */}
          <motion.div
            className="relative mb-6"
            initial={{ y: -100, opacity: 0, rotate: -10 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            transition={{
              delay: 0.2,
              duration: 1,
              type: 'spring',
              stiffness: 100,
            }}
          >
            <motion.img
              src="/images/Logo.png"
              alt="تحدي الثلاثين"
              className="w-24 sm:w-32 filter drop-shadow-lg"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: 'spring', stiffness: 300 }}
            />
            <motion.div
              className="absolute -inset-4 bg-[var(--theme-primary)]/20 rounded-full blur-xl"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
              }}
            />
          </motion.div>

          {/* Title with enhanced typography */}
          <motion.h1
            className={`text-4xl sm:text-6xl lg:text-7xl font-extrabold mb-4 text-center ${
              isArabic ? 'font-arabic' : ''
            } text-[var(--theme-text)]`}
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            <motion.span
              animate={{
                textShadow: [
                  '0 0 10px rgba(34, 197, 94, 0.5)',
                  '0 0 20px rgba(59, 130, 246, 0.5)',
                  '0 0 10px rgba(34, 197, 94, 0.5)',
                ],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
              }}
            >
              تحدي الثلاثين
            </motion.span>
          </motion.h1>

          {/* Subtitle with typewriter effect */}
          <motion.p
            className={`mb-8 text-lg text-center ${
              isArabic ? 'font-arabic' : ''
            } text-white/80`}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            {t('startChallenge')}
          </motion.p>

          {/* Active Games Section with enhanced card design */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="mb-8 w-full max-w-sm"
          >
            <motion.div
              className="relative"
              whileHover={{ scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <ActiveGames onJoinGame={handleJoinGameById} />
              <motion.div
                className="absolute -inset-1 bg-[var(--theme-primary)]/20 rounded-xl blur opacity-0"
                whileHover={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              />
            </motion.div>
          </motion.div>

          {/* Action Buttons with enhanced animations */}
          <motion.div
            className="flex flex-col gap-6 items-center w-full max-w-md"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1, duration: 0.6 }}
          >
            <motion.button
              onClick={handleCreateSession}
              className={`group relative w-full px-10 py-4 text-xl rounded-2xl font-bold transition-all shadow-lg overflow-hidden ${
                isArabic ? 'font-arabic' : ''
              }`}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.5 }}
            >
              <motion.div
                className="absolute inset-0 bg-[var(--theme-primary)]"
                whileHover={{
                  backgroundColor: 'var(--theme-primary)',
                }}
              />
              <motion.div
                className="absolute inset-0 bg-white/20"
                initial={{ x: '-100%' }}
                whileHover={{ x: '100%' }}
                transition={{ duration: 0.6 }}
              />
              <span className="relative z-10 text-white">
                {t('createSession')}
              </span>
            </motion.button>

            <motion.button
              onClick={handleJoinGame}
              className={`group relative w-full px-6 py-3 text-lg rounded-xl font-bold transition-all overflow-hidden border-2 border-white/30 ${
                isArabic ? 'font-arabic' : ''
              }`}
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 1.4, duration: 0.5 }}
            >
              <motion.div
                className="absolute inset-0 bg-[var(--theme-secondary)]/20"
                whileHover={{
                  backgroundColor: 'var(--theme-secondary)',
                  opacity: 0.3,
                }}
              />
              <span className="relative z-10 text-white/90 group-hover:text-white">
                {t('joinSession')}
              </span>
            </motion.button>
          </motion.div>

          {/* Footer Info with fade-in animation */}
          <motion.div
            className={`mt-12 text-center text-sm max-w-md ${
              isArabic ? 'font-arabic' : ''
            } text-white/60`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.6, duration: 0.8 }}
          >
            <motion.p
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.8, duration: 0.5 }}
            >
              {t('createSessionDesc')}
            </motion.p>
            <motion.p
              className="mt-1"
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 2, duration: 0.5 }}
            >
              {t('joinSessionDesc')}
            </motion.p>
          </motion.div>
        </motion.div>
      </div>

      {/* Floating particles animation */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 8 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -100, 0],
              x: [0, Math.random() * 100 - 50, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 5 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>
    </div>
  );
}
