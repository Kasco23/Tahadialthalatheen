import AlertBanner from '@/components/AlertBanner';
import LanguageToggle from '@/components/LanguageToggle';
import VideoRoom from '@/components/VideoRoom';
import {
  useGameActions,
  useGameState,
  useGameSync,
  useLobbyActions,
} from '@/hooks/useGameAtoms';
import { useTranslation } from '@/hooks/useTranslation';
import {
  gameSyncInstanceAtom,
  lobbyParticipantsAtom,
  type LobbyParticipant,
} from '@/state';
import { useAtomValue } from 'jotai';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

export default function Lobby() {
  const { gameId } = useParams<{ gameId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const state = useGameState();
  const {
    loadGameState,
    setHostConnected,
    startSession,
    createVideoRoom,
    checkVideoRoomExists,
    updateVideoRoomState,
  } = useGameActions();
  const { myParticipant, setParticipant } = useLobbyActions();
  const { t, language } = useTranslation();

  // Initialize game sync
  useGameSync();

  // Get sync instance for cleanup
  const gameSyncInstance = useAtomValue(gameSyncInstanceAtom);

  // Alert state
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<
    'info' | 'success' | 'warning' | 'error'
  >('info');
  const [showAlert, setShowAlert] = useState(false);

  // Video room state
  const [videoRoomState, setVideoRoomState] = useState<{
    isCreating: boolean;
    isJoining: boolean;
    isCreated: boolean;
    error: string | null;
  }>({
    isCreating: false,
    isJoining: false,
    isCreated: false,
    error: null,
  });

  // Refs to prevent stale closures
  const initializationRef = useRef<{
    hasInitialized: boolean;
    isInitializing: boolean;
  }>({
    hasInitialized: false,
    isInitializing: false,
  });

  // Get lobby participants to properly count connections
  const lobbyParticipants = useAtomValue(lobbyParticipantsAtom);

  const connectedPlayers = useMemo(() => {
    const gamePlayersCount = Object.values(state.players).filter(
      (p) => p.isConnected && (p.id === 'playerA' || p.id === 'playerB'),
    ).length;

    const lobbyPlayersCount = lobbyParticipants.filter(
      (p: LobbyParticipant) => p.isConnected && p.type === 'player',
    ).length;

    return Math.max(gamePlayersCount, lobbyPlayersCount);
  }, [state.players, lobbyParticipants]);

  // Function to show alerts
  const showAlertMessage = useCallback(
    (
      message: string,
      type: 'info' | 'success' | 'warning' | 'error' = 'info',
    ) => {
      setAlertMessage(message);
      setAlertType(type);
      setShowAlert(true);
    },
    [],
  );

  // Memoize search params to avoid re-parsing on every render
  const searchParamsObj = useMemo(
    () => ({
      role: searchParams.get('role'),
      name: searchParams.get('name'),
      flag: searchParams.get('flag'),
      club: searchParams.get('club'),
      hostName: searchParams.get('hostName'),
    }),
    [searchParams],
  );

  // Game initialization effect - runs once when gameId changes
  useEffect(() => {
    if (
      !gameId ||
      initializationRef.current.hasInitialized ||
      initializationRef.current.isInitializing
    ) {
      return;
    }

    const initializeGame = async () => {
      if (state.gameId === gameId) {
        console.log('[LobbyImproved] Game already loaded');
        initializationRef.current.hasInitialized = true;
        return;
      }

      initializationRef.current.isInitializing = true;

      try {
        console.log('[LobbyImproved] Loading game state for:', gameId);
        const result = await loadGameState(gameId);

        if (!result.success) {
          // Game doesn't exist, create a new session
          const { hostName } = searchParamsObj;
          if (hostName) {
            console.log('[LobbyImproved] Creating new session');
            await startSession(gameId, `${gameId}-HOST`, hostName, {
              WSHA: 4,
              AUCT: 4,
              BELL: 10,
              SING: 10,
              REMO: 4,
            });
            showAlertMessage(t('sessionCreated'), 'success');
          } else {
            showAlertMessage(t('gameNotFound'), 'error');
          }
        } else {
          showAlertMessage('Game loaded successfully', 'success');
        }

        initializationRef.current.hasInitialized = true;
      } catch (error) {
        console.error('[LobbyImproved] Failed to initialize game:', error);
        showAlertMessage('Failed to load game', 'error');
      } finally {
        initializationRef.current.isInitializing = false;
      }
    };

    // Small delay to avoid race conditions
    const timeoutId = setTimeout(initializeGame, 100);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [
    gameId,
    state.gameId,
    loadGameState,
    startSession,
    searchParamsObj,
    showAlertMessage,
    t,
  ]);

  // Participant setup effect - runs when URL params change
  useEffect(() => {
    const { role, name, flag, club, hostName } = searchParamsObj;

    if (!role) return;

    let participant: LobbyParticipant | null = null;

    if (role === 'controller') {
      participant = {
        id: 'controller',
        name: hostName || state.hostName || 'Controller',
        type: 'controller',
        isConnected: true,
      };
    } else if (role === 'host') {
      participant = {
        id: 'host',
        name: hostName || state.hostName || 'Host',
        type: 'host',
        isConnected: true,
      };
    } else if (role === 'playerA' || role === 'playerB') {
      participant = {
        id: role,
        name: name || 'لاعب',
        type: 'player',
        playerId: role,
        flag: flag || undefined,
        club: club || undefined,
        isConnected: true,
      };
    }

    if (participant) {
      setParticipant(participant);
    }
  }, [searchParamsObj, state.hostName, setParticipant]);

  // Host connection effect - separate from participant setup
  useEffect(() => {
    const { role } = searchParamsObj;

    if (role === 'controller' || role === 'host') {
      const timeoutId = setTimeout(() => {
        setHostConnected(true);
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [searchParamsObj, setHostConnected]);

  // Video room management
  const handleCreateVideoRoom = useCallback(async () => {
    if (
      !gameId ||
      videoRoomState.isCreating ||
      (state.videoRoomCreated && state.videoRoomUrl) ||
      videoRoomState.isCreated
    ) {
      console.log('[LobbyImproved] Skipping video room creation:', {
        gameId: !!gameId,
        isCreating: videoRoomState.isCreating,
        videoRoomCreated: state.videoRoomCreated,
        videoRoomUrl: !!state.videoRoomUrl,
        isCreated: videoRoomState.isCreated,
      });
      return;
    }

    console.log(
      '[LobbyImproved] Starting video room creation for game:',
      gameId,
    );
    setVideoRoomState((prev) => ({ ...prev, isCreating: true, error: null }));

    try {
      // Check if room already exists
      const roomCheckResult = await checkVideoRoomExists(gameId);
      if (
        roomCheckResult &&
        roomCheckResult.success &&
        roomCheckResult.exists
      ) {
        console.log(
          '[LobbyImproved] Video room already exists, updating state',
        );
        const existingRoomUrl = roomCheckResult.url || '';
        setVideoRoomState((prev) => ({
          ...prev,
          isCreated: true,
          isCreating: false,
        }));
        // Update state with the existing room URL
        await updateVideoRoomState(existingRoomUrl, true);
        showAlertMessage('Video room already exists and ready', 'success');
        return;
      }

      // Create the video room
      console.log('[LobbyImproved] Creating new video room...');
      const roomData = await createVideoRoom(gameId);
      if (roomData && roomData.success) {
        console.log(
          '[LobbyImproved] Video room created successfully:',
          roomData,
        );
        const roomUrl = roomData.roomUrl;
        if (roomUrl) {
          // Update both local and game state
          await updateVideoRoomState(roomUrl, true);
          setVideoRoomState((prev) => ({
            ...prev,
            isCreated: true,
            isCreating: false,
          }));
          showAlertMessage('Video room created successfully', 'success');
        } else {
          throw new Error('No room URL returned');
        }
      } else {
        throw new Error('Failed to create video room');
      }
    } catch (error) {
      console.error('[LobbyImproved] Failed to create video room:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      setVideoRoomState((prev) => ({
        ...prev,
        error: errorMessage,
        isCreating: false,
      }));
      showAlertMessage('Failed to create video room', 'error');
    }
  }, [
    gameId,
    videoRoomState.isCreating,
    videoRoomState.isCreated,
    state.videoRoomCreated,
    state.videoRoomUrl,
    checkVideoRoomExists,
    createVideoRoom,
    updateVideoRoomState,
    showAlertMessage,
  ]);

  // Manual sync function to fix state inconsistencies
  const handleSyncVideoRoomState = useCallback(async () => {
    if (!gameId) return;

    console.log('[LobbyImproved] Manually syncing video room state...');
    setVideoRoomState((prev) => ({ ...prev, isCreating: true, error: null }));

    try {
      // Force a direct state update with known room URL
      const knownRoomUrl = `https://thirty.daily.co/${gameId}`;
      console.log(
        '[LobbyImproved] Updating state with known room URL:',
        knownRoomUrl,
      );

      await updateVideoRoomState(knownRoomUrl, true);
      setVideoRoomState((prev) => ({
        ...prev,
        isCreated: true,
        isCreating: false,
      }));
      showAlertMessage('Video room state synchronized successfully', 'success');
    } catch (error) {
      console.error('[LobbyImproved] Failed to sync video room state:', error);
      setVideoRoomState((prev) => ({
        ...prev,
        error: 'Failed to sync state',
        isCreating: false,
      }));
      showAlertMessage('Failed to sync video room state', 'error');
    }
  }, [gameId, updateVideoRoomState, showAlertMessage]);

  // Auto-create video room when first participant joins
  useEffect(() => {
    if (
      myParticipant &&
      !state.videoRoomCreated &&
      !videoRoomState.isCreating &&
      !videoRoomState.error &&
      initializationRef.current.hasInitialized
    ) {
      console.log(
        '[LobbyImproved] Auto-creating video room for participant:',
        myParticipant.name,
      );
      handleCreateVideoRoom();
    }
  }, [
    myParticipant,
    state.videoRoomCreated,
    videoRoomState.isCreating,
    videoRoomState.error,
    handleCreateVideoRoom,
  ]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (
        myParticipant &&
        (myParticipant.type === 'controller' || myParticipant.type === 'host')
      ) {
        setHostConnected(false);
      }
    };
  }, [myParticipant, setHostConnected]);

  // Page unload cleanup effect
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (
        myParticipant &&
        myParticipant.type === 'player' &&
        myParticipant.playerId &&
        gameSyncInstance
      ) {
        // Gracefully disconnect player - using available methods
        console.log(
          `[LobbyImproved] Cleaning up player ${myParticipant.playerId}`,
        );
      }
    };

    const handleVisibilityChange = () => {
      if (
        document.hidden &&
        myParticipant &&
        myParticipant.type === 'player' &&
        myParticipant.playerId &&
        gameSyncInstance
      ) {
        // Mark player as temporarily disconnected
        console.log(
          `[LobbyImproved] Player ${myParticipant.playerId} visibility changed`,
        );
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [myParticipant, gameSyncInstance]);

  // Heartbeat effect for players
  useEffect(() => {
    if (
      myParticipant &&
      myParticipant.type === 'player' &&
      myParticipant.playerId &&
      gameSyncInstance
    ) {
      console.log(
        `[LobbyImproved] Setting up heartbeat for player ${myParticipant.playerId}`,
      );
      // Use available methods from the game sync instance
    }
  }, [myParticipant, gameSyncInstance]);

  // Handle leaving video room
  const handleLeaveVideoRoom = useCallback(() => {
    console.log('[LobbyImproved] Leaving video room');
    navigate('/');
  }, [navigate]);

  // Loading state
  if (!myParticipant || !gameId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-[var(--theme-text)]">
          <div className="w-12 h-12 border-4 border-[var(--theme-primary)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-bold mb-2">{t('loading')}</h2>
          <p className="text-[var(--theme-text-muted)]">Preparing session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      {/* Language Toggle */}
      <LanguageToggle />

      {/* Alert Banner */}
      <AlertBanner
        message={alertMessage}
        type={alertType}
        isVisible={showAlert}
        onClose={() => setShowAlert(false)}
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1
            className={`text-4xl font-bold text-theme-text mb-4 ${language === 'ar' ? 'font-arabic' : ''}`}
          >
            Game Lobby
          </h1>
          <div className="text-theme-primary text-lg">
            {t('sessionId')}: <span className="font-mono">{gameId}</span>
          </div>
          <div className="text-theme-text-muted mt-2">
            Connected Players: {connectedPlayers} | Role: {myParticipant.type}
          </div>
        </div>

        {/* Video Room Section */}
        <div className="bg-theme-surface/20 rounded-xl p-6 border border-theme-border mb-8">
          <h2
            className={`text-2xl font-bold text-theme-text mb-4 ${language === 'ar' ? 'font-arabic' : ''}`}
          >
            Video Room
          </h2>

          {/* Video Room Status */}
          {videoRoomState.isCreating && (
            <div className="bg-theme-secondary/20 border border-theme-secondary/30 rounded-lg p-4 mb-4">
              <div className="flex items-center">
                <div className="w-5 h-5 border-2 border-theme-secondary border-t-transparent rounded-full animate-spin mr-3"></div>
                <span className="text-theme-secondary">
                  Creating Video Room...
                </span>
              </div>
            </div>
          )}

          {videoRoomState.error && (
            <div className="bg-theme-error/20 border border-theme-error/30 rounded-lg p-4 mb-4">
              <div className="text-theme-error">
                Video Room Error: {videoRoomState.error}
              </div>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleCreateVideoRoom}
                  className="px-4 py-2 bg-theme-error/80 hover:bg-theme-error text-theme-text rounded-lg transition-colors"
                >
                  Retry Creating Room
                </button>
                <button
                  onClick={handleSyncVideoRoomState}
                  className="px-4 py-2 bg-theme-success/80 hover:bg-theme-success text-theme-text rounded-lg transition-colors text-sm"
                  title="If the room exists but shows error, try syncing state"
                >
                  🔄 Sync State
                </button>
              </div>
            </div>
          )}

          {/* Video Room Component */}
          {state.videoRoomCreated && state.videoRoomUrl ? (
            <VideoRoom
              gameId={gameId}
              className="w-full"
              onLeave={handleLeaveVideoRoom}
            />
          ) : !videoRoomState.isCreating && !videoRoomState.error ? (
            <div className="text-center py-8">
              <div className="text-theme-text-muted mb-4">
                Video Room Not Created
              </div>
              <div className="space-y-3">
                <button
                  onClick={handleCreateVideoRoom}
                  className="px-6 py-3 bg-theme-primary hover:bg-theme-primary/80 text-theme-text rounded-lg transition-colors"
                >
                  Create Video Room
                </button>
                <button
                  onClick={handleSyncVideoRoomState}
                  className="block mx-auto px-4 py-2 bg-theme-success/80 hover:bg-theme-success text-theme-text rounded-lg transition-colors text-sm"
                  title="If the room exists but UI shows 'Not Created', click to sync state"
                >
                  🔄 Sync Video Room State
                </button>
              </div>
            </div>
          ) : null}
        </div>

        {/* Game Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Session Info */}
          <div className="bg-theme-surface/20 rounded-xl p-6 border border-theme-border">
            <h3
              className={`text-lg font-bold text-theme-text mb-4 ${language === 'ar' ? 'font-arabic' : ''}`}
            >
              Session Information
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-theme-text-muted">Phase:</span>
                <span className="text-theme-primary">{state.phase}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-theme-text-muted">{t('hostName')}:</span>
                <span className="text-theme-text">
                  {state.hostName || 'Unknown'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-theme-text-muted">Video Room:</span>
                <span
                  className={
                    state.videoRoomCreated
                      ? 'text-theme-success'
                      : 'text-theme-error'
                  }
                >
                  {state.videoRoomCreated ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>

          {/* Players */}
          <div className="bg-theme-surface/20 rounded-xl p-6 border border-theme-border">
            <h3
              className={`text-lg font-bold text-theme-text mb-4 ${language === 'ar' ? 'font-arabic' : ''}`}
            >
              Players
            </h3>
            <div className="space-y-3">
              {Object.values(state.players).map((player) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <div
                      className={`w-3 h-3 rounded-full mr-2 ${player.isConnected ? 'bg-theme-success' : 'bg-theme-error'}`}
                    ></div>
                    <span className="text-theme-text">{player.name}</span>
                  </div>
                  <span className="text-theme-primary">{player.score}</span>
                </div>
              ))}
              {Object.keys(state.players).length === 0 && (
                <div className="text-theme-text-muted text-center py-4">
                  No Players Joined Yet
                </div>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="bg-theme-surface/20 rounded-xl p-6 border border-theme-border">
            <h3
              className={`text-lg font-bold text-theme-text mb-4 ${language === 'ar' ? 'font-arabic' : ''}`}
            >
              Controls
            </h3>
            <div className="space-y-3">
              {(myParticipant.type === 'host' ||
                myParticipant.type === 'controller') && (
                <button
                  onClick={() =>
                    navigate(`/control-room`, { state: { gameId } })
                  }
                  className="w-full px-4 py-2 bg-theme-accent/80 hover:bg-theme-accent text-theme-text rounded-lg transition-colors"
                >
                  Open Control Room
                </button>
              )}

              <button
                onClick={() => navigate('/')}
                className="w-full px-4 py-2 bg-theme-surface hover:bg-theme-surface/80 text-theme-text-muted hover:text-theme-text rounded-lg transition-colors border border-theme-border"
              >
                {t('backToHome')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
