import ConfirmationModal from '@/components/ConfirmationModal';
import LazyImage from '@/components/LazyImage';
import { useTranslation } from '@/hooks/useTranslation';
import { GameDatabase } from '@/lib/gameDatabase';
import { getSupabase } from '@/lib/supabaseLazy';
import { isArabicAtom } from '@/state/languageAtoms';
import {
  getAllTeams,
  searchFlags,
  searchTeams,
  type Team,
} from '@/utils/teamUtils';
import { motion } from 'framer-motion';
import { useAtomValue } from 'jotai';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Join() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const isArabic = useAtomValue(isArabicAtom);
  const [step, setStep] = useState(1);
  const [joinType, setJoinType] = useState<'host' | 'player' | ''>('');
  // Session code that players use to join the lobby
  const [gameId, setGameId] = useState('');
  // Separate field for the host code when joining as phone host
  const [hostCode, setHostCode] = useState('');
  const [name, setName] = useState('');
  const [selectedFlag, setSelectedFlag] = useState<string>('');
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [flagSearch, setFlagSearch] = useState('');
  const [teamSearch, setTeamSearch] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [allTeams, setAllTeams] = useState<Team[]>([]);

  // Confirmation modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [playerRole, setPlayerRole] = useState<string>('');
  const [isJoining, setIsJoining] = useState(false);

  // Load teams lazily when component mounts
  useEffect(() => {
    const loadTeams = async () => {
      try {
        const teams = await getAllTeams();
        setAllTeams(teams);
      } catch (error) {
        console.error('Failed to load teams:', error);
      }
    };
    loadTeams();
  }, []);

  // Auto-populate gameId from URL if available
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomIdFromUrl = urlParams.get('roomId') || urlParams.get('gameId');
    if (roomIdFromUrl && !gameId) {
      setGameId(roomIdFromUrl.toUpperCase());
    }
  }, [gameId]);

  const filteredFlags = searchFlags(flagSearch);
  const filteredTeams = searchTeams(allTeams, teamSearch);

  const handleJoinTypeSelect = (type: 'host' | 'player') => {
    setJoinType(type);
    setStep(2);
  };

  const handleGameIdSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!gameId.trim()) return;

    if (joinType === 'host') {
      const sessionId = gameId.toUpperCase();
      const code = hostCode.toUpperCase();
      const supabase = await getSupabase();
      const { data } = await supabase
        .from('sessions') // Updated from 'games'
        .select('session_id') // Updated from 'id'
        .eq('session_id', sessionId) // Updated from 'id'
        .eq('host_code', code)

        .single();
      const foundId = data?.session_id; // Updated from 'id'
      if (!foundId) {
        setErrorMsg(t('gameNotFound'));
        return;
      }
      navigate(`/lobby/${foundId}?role=host`);
    } else {
      const actualGameId = gameId.toUpperCase();
      const existing = await GameDatabase.getGame(actualGameId);
      if (!existing) {
        setErrorMsg(t('gameNotFound'));
        return;
      }
      setStep(3);
    }
  };

  const handlePlayerJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !selectedFlag || !selectedTeam) return;

    setErrorMsg('');
    const sessionId = gameId.toUpperCase();

    try {
      // Check existing players to find available slot
      const existingPlayers = await GameDatabase.getGamePlayers(sessionId);
      const takenRoles = existingPlayers.map((p) => p.role);

      let availableRole: string;
      if (!takenRoles.includes('playerA')) {
        availableRole = 'playerA';
      } else if (!takenRoles.includes('playerB')) {
        availableRole = 'playerB';
      } else {
        setErrorMsg(t('gameIsFull'));
        return;
      }

      // Check if video room exists - just inform, don't offer to create
      const game = await GameDatabase.getGame(sessionId);
      if (!game?.video_room_created) {
        setErrorMsg(t('noVideoRoomYet') + ' ' + t('contactHostCreateRoom'));
        return;
      }

      // Double-check with Daily.co that the room actually exists
      try {
        const checkResult = await fetch(
          `/.netlify/functions/check-daily-room`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ roomName: sessionId }),
          },
        );
        const data = await checkResult.json();

        if (data && !data.exists) {
          setErrorMsg(
            'غرفة الفيديو غير موجودة على Daily.co. اتصل بالمقدم لإعادة إنشائها.',
          );
          return;
        }
      } catch (error) {
        console.warn('Could not verify room exists on Daily.co:', error);
        // Continue anyway since we have it in database
      }

      // Set role and show confirmation modal
      setPlayerRole(availableRole);
      setShowConfirmModal(true);
    } catch (error) {
      console.error('Error checking game:', error);
      setErrorMsg('حدث خطأ أثناء التحقق من اللعبة');
    }
  };

  const handleConfirmJoin = async () => {
    setIsJoining(true);
    const sessionId = gameId.toUpperCase();

    try {
      const result = await GameDatabase.addPlayer(playerRole, sessionId, {
        name,
        flag: selectedFlag,
        club: selectedTeam,
        role: playerRole,
      });

      if (!result) {
        setErrorMsg(t('failedJoinGame'));
        setShowConfirmModal(false);
        setIsJoining(false);
        return;
      }

      // Navigate to lobby
      try {
        navigate(
          `/lobby/${sessionId}?role=${playerRole}&name=${encodeURIComponent(name)}&flag=${selectedFlag}&club=${encodeURIComponent(selectedTeam)}&autoJoin=true`,
        );
      } catch (navError) {
        console.error('Navigation error:', navError);
        setErrorMsg('فشل في الانتقال إلى الردهة. حاول مرة أخرى.');
      }
    } catch (error) {
      console.error('Error joining game:', error);
      setErrorMsg(t('errorJoiningGame'));
      setShowConfirmModal(false);
      setIsJoining(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 w-full max-w-md"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center mb-8">
          <h1
            className={`text-3xl font-bold text-white mb-2 ${isArabic ? 'font-arabic' : ''}`}
          >
            {t('joinGame')}
          </h1>
          <p className={`text-white/70 ${isArabic ? 'font-arabic' : ''}`}>
            {step === 1
              ? t('chooseJoinType')
              : step === 2
                ? joinType === 'host'
                  ? t('enterSessionAndHostCode')
                  : t('enterCodeAndName')
                : t('selectFlag') + ' ' + t('selectTeam')}
          </p>
        </div>

        {step === 1 ? (
          // Step 1: Choose join type
          <div className="space-y-4">
            <motion.button
              onClick={() => handleJoinTypeSelect('host')}
              className="w-full p-6 bg-theme-secondary/20 hover:bg-theme-secondary/30 border border-theme-secondary/50 rounded-2xl text-theme-text transition-all"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="text-center">
                <div className="text-3xl mb-2">🎤</div>
                <h3
                  className={`text-lg font-bold mb-2 ${isArabic ? 'font-arabic' : ''}`}
                >
                  {t('hostMobile')}
                </h3>
                <p
                  className={`text-sm text-blue-200 ${isArabic ? 'font-arabic' : ''}`}
                >
                  {t('hostMobileDesc')}
                </p>
                <p
                  className={`text-xs text-blue-300 mt-1 ${isArabic ? 'font-arabic' : ''}`}
                >
                  {t('needSessionAndHostCode')}
                </p>
              </div>
            </motion.button>

            <motion.button
              onClick={() => handleJoinTypeSelect('player')}
              className="w-full p-6 bg-theme-success/20 hover:bg-theme-success/30 border border-theme-success/50 rounded-2xl text-theme-text transition-all"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="text-center">
                <div className="text-3xl mb-2">🎮</div>
                <h3
                  className={`text-lg font-bold mb-2 ${isArabic ? 'font-arabic' : ''}`}
                >
                  {t('playerJoin')}
                </h3>
                <p
                  className={`text-sm text-green-200 ${isArabic ? 'font-arabic' : ''}`}
                >
                  {t('participatingPlayers')}
                </p>
                <p
                  className={`text-xs text-green-300 mt-1 ${isArabic ? 'font-arabic' : ''}`}
                >
                  {t('sessionCode')}
                </p>
              </div>
            </motion.button>

            <button
              onClick={() => navigate('/')}
              className={`w-full mt-4 px-4 py-2 text-white/70 hover:text-white transition-colors ${isArabic ? 'font-arabic' : ''}`}
            >
              {t('back')}
            </button>
          </div>
        ) : step === 2 ? (
          // Step 2: Game ID and Name
          <form onSubmit={handleGameIdSubmit} className="space-y-6">
            {joinType === 'host' ? (
              <>
                <div>
                  <label
                    className={`block text-white/80 mb-2 ${isArabic ? 'font-arabic' : ''}`}
                  >
                    {t('sessionCode')}
                  </label>
                  <input
                    type="text"
                    value={gameId}
                    onChange={(e) => setGameId(e.target.value.toUpperCase())}
                    placeholder={t('enterSessionCode')}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-accent2 font-mono text-center text-lg"
                    required
                  />
                </div>
                <div>
                  <label
                    className={`block text-white/80 mb-2 ${isArabic ? 'font-arabic' : ''}`}
                  >
                    {t('hostCode')}
                  </label>
                  <input
                    type="text"
                    value={hostCode}
                    onChange={(e) => setHostCode(e.target.value.toUpperCase())}
                    placeholder={t('enterHostCode')}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-accent2 font-mono text-center text-lg"
                    required
                  />
                  <p
                    className={`text-xs text-blue-300 mt-1 text-center ${isArabic ? 'font-arabic' : ''}`}
                  >
                    {t('hostCodeFound')}
                  </p>
                  {errorMsg && (
                    <p
                      className={`text-xs text-red-400 mt-1 text-center ${isArabic ? 'font-arabic' : ''}`}
                    >
                      {errorMsg}
                    </p>
                  )}
                </div>
              </>
            ) : (
              <>
                <div>
                  <label
                    className={`block text-white/80 mb-2 ${isArabic ? 'font-arabic' : ''}`}
                  >
                    {t('sessionCode')}
                  </label>
                  <input
                    type="text"
                    value={gameId}
                    onChange={(e) => setGameId(e.target.value.toUpperCase())}
                    placeholder={t('enterSessionCode')}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-accent2 font-mono text-center text-lg"
                    required
                  />
                  {errorMsg && (
                    <p
                      className={`text-xs text-red-400 mt-1 text-center ${isArabic ? 'font-arabic' : ''}`}
                    >
                      {errorMsg}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    className={`block text-white/80 mb-2 ${isArabic ? 'font-arabic' : ''}`}
                  >
                    {t('playerName')}
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t('enterPlayerName')}
                    className={`w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-accent2 text-center ${isArabic ? 'font-arabic' : ''}`}
                    required
                  />
                </div>
              </>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className={`flex-1 px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl transition-colors ${isArabic ? 'font-arabic' : ''}`}
              >
                {t('back')}
              </button>
              <button
                type="submit"
                disabled={
                  !gameId.trim() ||
                  (joinType === 'host' ? !hostCode.trim() : !name.trim())
                }
                className={`flex-1 px-4 py-3 bg-accent2 hover:bg-accent text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${isArabic ? 'font-arabic' : ''}`}
              >
                {joinType === 'host' ? t('joinAsHost') : t('next')}
              </button>
            </div>
          </form>
        ) : (
          // Step 3: Flag and Team Selection (for players only)
          <form onSubmit={handlePlayerJoin} className="space-y-6">
            {/* Flag Selection */}
            <div>
              <label
                className={`block text-white/80 mb-2 ${isArabic ? 'font-arabic' : ''}`}
              >
                {t('selectFlag')}
              </label>
              <input
                type="text"
                value={flagSearch}
                onChange={(e) => setFlagSearch(e.target.value)}
                placeholder={t('flagSearch')}
                className={`w-full px-4 py-2 mb-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-accent2 ${isArabic ? 'font-arabic' : ''}`}
              />
              <div className="grid grid-cols-4 gap-2 max-h-32 overflow-y-auto">
                {filteredFlags.map((flag: { code: string; name: string }) => (
                  <button
                    key={flag.code}
                    type="button"
                    onClick={() => setSelectedFlag(flag.code)}
                    className={`p-2 rounded-lg border-2 transition-all ${
                      selectedFlag === flag.code
                        ? 'border-accent2 bg-accent2/20'
                        : 'border-white/20 bg-white/5 hover:border-white/40'
                    }`}
                  >
                    <span className={`fi fi-${flag.code} text-2xl`}></span>
                    <p
                      className={`text-xs text-white/80 mt-1 ${isArabic ? 'font-arabic' : ''}`}
                    >
                      {flag.name}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Team Selection */}
            <div>
              <label
                className={`block text-white/80 mb-2 ${isArabic ? 'font-arabic' : ''}`}
              >
                {t('selectTeam')}
              </label>
              <input
                type="text"
                value={teamSearch}
                onChange={(e) => setTeamSearch(e.target.value)}
                placeholder={t('teamSearch')}
                className={`w-full px-4 py-2 mb-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-accent2 ${isArabic ? 'font-arabic' : ''}`}
              />
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                {filteredTeams.map((team: import('@/utils/teamUtils').Team) => (
                  <button
                    key={team.name}
                    type="button"
                    onClick={() => setSelectedTeam(team.name)}
                    className={`p-3 rounded-lg border-2 transition-all flex items-center gap-2 ${
                      selectedTeam === team.name
                        ? 'border-accent2 bg-accent2/20'
                        : 'border-white/20 bg-white/5 hover:border-white/40'
                    }`}
                  >
                    <LazyImage
                      src={team.logoPath}
                      alt={team.name}
                      className="w-8 h-8 object-contain"
                    />
                    <span
                      className={`text-white text-sm ${isArabic ? 'font-arabic' : ''}`}
                    >
                      {team.displayName}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Error message for step 3 */}
            {errorMsg && (
              <div
                className={`text-red-400 text-sm text-center ${isArabic ? 'font-arabic' : ''}`}
              >
                {errorMsg}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className={`flex-1 px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl transition-colors ${isArabic ? 'font-arabic' : ''}`}
              >
                {t('back')}
              </button>
              <button
                type="submit"
                disabled={!selectedFlag || !selectedTeam}
                className={`flex-1 px-4 py-3 bg-theme-success hover:bg-theme-success/80 text-theme-text rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${isArabic ? 'font-arabic' : ''}`}
              >
                {t('joinGame')}
              </button>
            </div>
          </form>
        )}
      </motion.div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmJoin}
        title={t('confirmJoinGame')}
        message={`${t('aboutToJoinGame')} ${gameId} ${playerRole === 'playerA' ? t('firstPlayer') : t('secondPlayer')}. ${t('moveToLobbyWait')}`}
        confirmText={t('joinGame')}
        cancelText={t('cancel')}
        isLoading={isJoining}
      />
    </div>
  );
}
