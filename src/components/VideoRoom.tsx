import { useGameActions, useGameState } from '@/hooks/useGameAtoms';
import { debugError, debugLog, debugWarn } from '@/utils/debugLog';
import DailyIframe, { type DailyCall } from '@daily-co/daily-js';
import {
  DailyAudio,
  DailyProvider,
  DailyVideo,
  useDaily,
  useDailyError,
  useDailyEvent,
  useDevices,
  useInputSettings,
  useLocalParticipant,
  useMeetingState,
  useNetwork,
  useParticipant,
  useParticipantIds,
  useScreenShare,
} from '@daily-co/daily-react';
import { useCallback, useEffect, useState } from 'react';
import AlertBanner from './AlertBanner';

interface VideoRoomProps {
  gameId: string;
  className?: string;
  onLeave?: () => void;
  observerMode?: boolean;
}

interface ParticipantVideoProps {
  participantId: string;
}

interface VideoControlsProps {
  gameId: string;
  userRole: string;
  onLeave?: () => void;
}

// Enhanced video controls component with Daily Kitchen Sink patterns
function VideoControls({ gameId, userRole, onLeave }: VideoControlsProps) {
  const daily = useDaily();
  const localParticipant = useLocalParticipant();
  const { endVideoRoom } = useGameActions();
  const meetingState = useMeetingState();
  const network = useNetwork();
  const { errorMsg, updateInputSettings } = useInputSettings();
  const {
    cameras,
    microphones,
    speakers,
    currentCam,
    currentMic,
    currentSpeaker,
    setCamera,
    setMicrophone,
    setSpeaker,
    cameraError,
  } = useDevices();
  const { startScreenShare, stopScreenShare, isSharingScreen } =
    useScreenShare();

  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isAudioOn, setIsAudioOn] = useState(false);
  const [enableBlur, setEnableBlur] = useState(false);

  // Update local states based on participant data
  useEffect(() => {
    if (localParticipant) {
      setIsVideoOn(localParticipant.tracks?.video?.state === 'playable');
      setIsAudioOn(localParticipant.tracks?.audio?.state === 'playable');
    }
  }, [localParticipant]);

  // Log camera errors
  useEffect(() => {
    if (cameraError) {
      debugError('Camera error detected', 'VideoControls', {
        error: cameraError,
      });
    }
  }, [cameraError]);

  const toggleVideo = useCallback(async () => {
    if (!daily) return;
    try {
      if (isVideoOn) {
        await daily.setLocalVideo(false);
      } else {
        await daily.startCamera();
      }
    } catch (error) {
      debugError('Failed to toggle video', 'VideoControls', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }, [daily, isVideoOn]);

  const toggleAudio = useCallback(async () => {
    if (!daily) return;
    try {
      await daily.setLocalAudio(!isAudioOn);
    } catch (error) {
      debugError('Failed to toggle audio', 'VideoControls', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }, [daily, isAudioOn]);

  const toggleScreenShare = useCallback(async () => {
    if (!daily) return;
    try {
      if (isSharingScreen) {
        await stopScreenShare();
      } else {
        await startScreenShare();
      }
    } catch (error) {
      debugError('Failed to toggle screen share', 'VideoControls', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }, [daily, isSharingScreen, startScreenShare, stopScreenShare]);

  const handleBlurToggle = useCallback(async () => {
    if (!daily || !updateInputSettings) return;
    try {
      if (enableBlur) {
        // Disable blur
        await updateInputSettings({
          video: {
            processor: {
              type: 'none',
            },
          },
        });
        setEnableBlur(false);
      } else {
        // Enable blur
        await updateInputSettings({
          video: {
            processor: {
              type: 'background-blur',
              config: { strength: 0.5 },
            },
          },
        });
        setEnableBlur(true);
      }
    } catch (error) {
      debugError('Failed to toggle blur', 'VideoControls', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }, [daily, updateInputSettings, enableBlur]);

  const handleCameraChange = useCallback(
    async (deviceId: string) => {
      try {
        await setCamera(deviceId);
      } catch (error) {
        debugError('Failed to change camera', 'VideoControls', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    },
    [setCamera],
  );

  const handleMicrophoneChange = useCallback(
    async (deviceId: string) => {
      try {
        await setMicrophone(deviceId);
      } catch (error) {
        debugError('Failed to change microphone', 'VideoControls', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    },
    [setMicrophone],
  );

  const leaveCall = useCallback(async () => {
    if (daily) {
      try {
        await daily.leave();
      } catch (error) {
        debugError('Failed to leave call', 'VideoControls', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
    onLeave?.();
  }, [daily, onLeave]);

  const deleteRoom = useCallback(async () => {
    if (userRole === 'host' || userRole === 'controller') {
      const confirmed = window.confirm(
        'Are you sure you want to delete this room?',
      );
      if (confirmed) {
        try {
          await endVideoRoom(gameId);
          onLeave?.();
        } catch (error) {
          debugError('Failed to delete room', 'VideoControls', {
            gameId,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    }
  }, [userRole, gameId, endVideoRoom, onLeave]);

  return (
    <div className="space-y-4 p-4 bg-black/20 rounded-lg mt-4">
      {/* Meeting State and Network Info */}
      <div className="text-center text-sm">
        <div className="text-white">Meeting State: {meetingState}</div>
        <div className="text-white/70">
          Network: {network.quality || 'Unknown'}
        </div>
        {errorMsg && <div className="text-red-400">Error: {errorMsg}</div>}
      </div>

      {/* Device Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
        {/* Camera Selection */}
        <select
          value={currentCam?.device?.deviceId || ''}
          onChange={(e) => handleCameraChange(e.target.value)}
          className="bg-gray-700 text-white rounded px-2 py-1"
          disabled={!cameras.length}
          aria-label="Select camera"
        >
          <option value="">Select Camera</option>
          {cameras.map((cam) => (
            <option key={cam.device.deviceId} value={cam.device.deviceId}>
              {cam.device.label || 'Camera'}
            </option>
          ))}
        </select>

        {/* Microphone Selection */}
        <select
          value={currentMic?.device?.deviceId || ''}
          onChange={(e) => handleMicrophoneChange(e.target.value)}
          className="bg-gray-700 text-white rounded px-2 py-1"
          disabled={!microphones.length}
          aria-label="Select microphone"
        >
          <option value="">Select Microphone</option>
          {microphones.map((mic) => (
            <option key={mic.device.deviceId} value={mic.device.deviceId}>
              {mic.device.label || 'Microphone'}
            </option>
          ))}
        </select>

        {/* Speaker Selection */}
        <select
          value={currentSpeaker?.device?.deviceId || ''}
          onChange={(e) => setSpeaker(e.target.value)}
          className="bg-gray-700 text-white rounded px-2 py-1"
          disabled={!speakers.length}
          aria-label="Select speaker"
        >
          <option value="">Select Speaker</option>
          {speakers.map((speaker) => (
            <option
              key={speaker.device.deviceId}
              value={speaker.device.deviceId}
            >
              {speaker.device.label || 'Speaker'}
            </option>
          ))}
        </select>
      </div>

      {/* Main Controls */}
      <div className="flex flex-wrap gap-2 justify-center">
        {/* Video toggle */}
        <button
          onClick={toggleVideo}
          className={`px-3 py-2 rounded-lg text-sm transition-all ${
            isVideoOn
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-red-600 hover:bg-red-700 text-white'
          }`}
          title={isVideoOn ? 'Turn video off' : 'Turn video on'}
        >
          📹 {isVideoOn ? 'Video On' : 'Video Off'}
        </button>

        {/* Audio toggle */}
        <button
          onClick={toggleAudio}
          className={`px-3 py-2 rounded-lg text-sm transition-all ${
            isAudioOn
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-red-600 hover:bg-red-700 text-white'
          }`}
          title={isAudioOn ? 'Mute audio' : 'Unmute audio'}
        >
          🎤 {isAudioOn ? 'Audio On' : 'Audio Off'}
        </button>

        {/* Blur toggle */}
        <button
          onClick={handleBlurToggle}
          className={`px-3 py-2 rounded-lg text-sm transition-all ${
            enableBlur
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-600 hover:bg-gray-700 text-white'
          }`}
          title={enableBlur ? 'Disable blur' : 'Enable blur'}
        >
          🌫️ {enableBlur ? 'Blur On' : 'Blur Off'}
        </button>

        {/* Screen share (only for hosts and controllers) */}
        {(userRole === 'host' || userRole === 'controller') && (
          <button
            onClick={toggleScreenShare}
            className={`px-3 py-2 rounded-lg text-sm transition-all ${
              isSharingScreen
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-600 hover:bg-gray-700 text-white'
            }`}
            title={isSharingScreen ? 'Stop screen share' : 'Start screen share'}
          >
            🖥️ {isSharingScreen ? 'Stop Sharing' : 'Share Screen'}
          </button>
        )}

        {/* Leave call */}
        <button
          onClick={leaveCall}
          className="px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm transition-all"
          title="Leave call"
        >
          📞 Leave
        </button>

        {/* Delete room (only hosts/controllers) */}
        {(userRole === 'host' || userRole === 'controller') && (
          <button
            onClick={deleteRoom}
            className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-all"
            title="Delete room"
          >
            🗑️ Delete Room
          </button>
        )}
      </div>
    </div>
  );
}

// Enhanced participant video component
function ParticipantVideo({ participantId }: ParticipantVideoProps) {
  const participant = useParticipant(participantId);

  if (!participant) {
    return null;
  }

  const hasVideo =
    participant.tracks.video.state === 'playable' ||
    participant.tracks.video.state === 'sendable';
  const hasAudio =
    participant.tracks.audio.state === 'playable' ||
    participant.tracks.audio.state === 'sendable';

  return (
    <div className="flex-1 min-w-0 bg-gray-800 rounded-lg overflow-hidden relative">
      {/* Video element */}
      <div className="aspect-[3/4] md:aspect-video relative bg-gray-900">
        {hasVideo ? (
          <DailyVideo
            type="video"
            sessionId={participantId}
            automirror={participant.local}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center text-white text-xl font-bold mb-2">
                {(participant.user_name || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="text-gray-400 text-sm">Camera off</div>
            </div>
          </div>
        )}

        {/* Status indicators */}
        <div className="absolute bottom-2 right-2 flex gap-1">
          <div
            className={`w-6 h-6 rounded flex items-center justify-center ${
              hasAudio ? 'bg-green-600' : 'bg-red-600'
            }`}
          >
            <span className="text-white text-xs">{hasAudio ? '🎤' : '🚫'}</span>
          </div>
          <div
            className={`w-6 h-6 rounded flex items-center justify-center ${
              hasVideo ? 'bg-green-600' : 'bg-red-600'
            }`}
          >
            <span className="text-white text-xs">{hasVideo ? '📷' : '🚫'}</span>
          </div>
        </div>

        {/* Participant name overlay */}
        <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-sm">
          {participant.user_name || participantId}
          {participant.local && ' (You)'}
        </div>
      </div>
    </div>
  );
}

// Enhanced screen share component
function ScreenShareVideo() {
  const { screens } = useScreenShare();

  if (!screens.length) return null;

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden">
      <div className="aspect-video relative bg-gray-900">
        {screens.map((screen) => (
          <DailyVideo
            key={screen.screenId}
            type="screenVideo"
            sessionId={screen.session_id}
            className="w-full h-full object-contain"
          />
        ))}
        <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-sm">
          🖥️ Screen Share
        </div>
      </div>
    </div>
  );
}

function VideoRoomContent({
  gameId,
  className = '',
  onLeave,
  observerMode = false,
}: VideoRoomProps) {
  const daily = useDaily();
  const participantIds = useParticipantIds();
  const state = useGameState();
  const { generateDailyToken } = useGameActions();
  const { screens } = useScreenShare();

  // Enhanced error handling with Daily Kitchen Sink patterns
  const { meetingError, nonFatalError } = useDailyError();
  const [joinError, setJoinError] = useState<string | null>(null);

  // Enhanced event listeners with proper types
  useDailyEvent(
    'joined-meeting',
    useCallback((event) => {
      debugLog('Daily event: joined-meeting', 'VideoRoom', event);
      setJoinError(null);
    }, []),
  );

  useDailyEvent(
    'left-meeting',
    useCallback((event) => {
      debugLog('Daily event: left-meeting', 'VideoRoom', event);
    }, []),
  );

  useDailyEvent(
    'error',
    useCallback((event) => {
      debugLog('Daily event: error', 'VideoRoom', event);
      setJoinError('Connection error occurred');
    }, []),
  );

  useDailyEvent(
    'participant-joined',
    useCallback((event) => {
      debugLog('Daily event: participant-joined', 'VideoRoom', event);
    }, []),
  );

  useDailyEvent(
    'participant-left',
    useCallback((event) => {
      debugLog('Daily event: participant-left', 'VideoRoom', event);
    }, []),
  );

  // Handle errors
  useEffect(() => {
    if (meetingError) {
      debugError('Meeting error', 'VideoRoom', meetingError);
      setJoinError('Meeting error occurred');
    }
  }, [meetingError]);

  useEffect(() => {
    if (nonFatalError) {
      debugWarn('Non-fatal error', 'VideoRoom', nonFatalError);
    }
  }, [nonFatalError]);

  // Get user info from URL parameters
  const getUserInfo = useCallback(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const role = urlParams.get('role');
    const name = urlParams.get('name');
    const hostName = urlParams.get('hostName');

    let userName = 'Anonymous';
    if (role === 'host' || role === 'controller') {
      userName = hostName || state.hostName || 'Host';
    } else if (name) {
      userName = name;
    }

    // If in observer mode, force role to be viewer regardless of URL params
    const effectiveRole = observerMode ? 'viewer' : role || 'viewer';
    return { role: effectiveRole, userName };
  }, [state.hostName, observerMode]);

  const { role, userName } = getUserInfo();

  // Join room effect with enhanced error handling
  useEffect(() => {
    if (!daily || !state.videoRoomUrl) return;

    const joinRoom = async () => {
      try {
        debugLog('Attempting to join video room', 'VideoRoom', {
          url: state.videoRoomUrl,
          userName,
          role,
        });

        if (!state.videoRoomUrl) return;

        const joinConfig: { url: string; userName: string; token?: string } = {
          url: state.videoRoomUrl,
          userName,
        };

        // Add token if available
        const token = await generateDailyToken(
          gameId,
          role as 'host' | 'controller' | 'viewer',
          false,
        );
        if (token) {
          joinConfig.token = token;
        }

        await daily.join(joinConfig);
        debugLog('Successfully joined video room', 'VideoRoom');
      } catch (error) {
        debugError('Failed to join video room', 'VideoRoom', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        setJoinError('Failed to join video room');
      }
    };

    joinRoom();
  }, [daily, state.videoRoomUrl, userName, role, gameId, generateDailyToken]);

  return (
    <div className={`${className} min-h-96`}>
      {/* Alert for join errors */}
      {joinError && (
        <AlertBanner
          message={joinError}
          type="error"
          isVisible={true}
          onClose={() => setJoinError(null)}
        />
      )}

      {/* Main video grid */}
      <div className="space-y-4">
        {/* Screen share section */}
        {screens.length > 0 && (
          <div className="w-full">
            <ScreenShareVideo />
          </div>
        )}

        {/* Participants grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {participantIds.map((id) => (
            <ParticipantVideo key={id} participantId={id} />
          ))}
        </div>

        {/* No participants message */}
        {participantIds.length === 0 && (
          <div className="text-center py-8">
            <div className="text-gray-400">
              Waiting for participants to join...
            </div>
          </div>
        )}
      </div>

      {/* Audio component for all remote participants */}
      <DailyAudio />

      {/* Enhanced controls */}
      <VideoControls gameId={gameId} userRole={role} onLeave={onLeave} />
    </div>
  );
}

// Main component wrapper with DailyProvider
export default function VideoRoom(props: VideoRoomProps) {
  const { className } = props;
  const state = useGameState();
  const [callObject, setCallObject] = useState<DailyCall | null>(null);

  // Create Daily call object
  useEffect(() => {
    if (!state.videoRoomUrl) {
      debugWarn('No video room URL available', 'VideoRoom');
      return;
    }

    try {
      const dailyCall = DailyIframe.createCallObject({
        dailyConfig: {
          useDevicePreferenceCookies: true,
        },
      });

      // Add to window for debugging
      (window as { dailyCallObject?: DailyCall }).dailyCallObject = dailyCall;

      setCallObject(dailyCall);

      return () => {
        dailyCall?.destroy().catch((error) => {
          debugError('Failed to destroy Daily call object', 'VideoRoom', {
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        });
      };
    } catch (error) {
      debugError('Failed to create Daily call object', 'VideoRoom', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }, [state.videoRoomUrl]);

  // Loading state
  if (!callObject || !state.videoRoomUrl) {
    return (
      <div className={`${className} min-h-96 flex items-center justify-center`}>
        <div className="text-center text-white">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div>Setting up video room...</div>
        </div>
      </div>
    );
  }

  return (
    <DailyProvider
      callObject={callObject}
      subscribeToTracksAutomatically={true}
    >
      <VideoRoomContent {...props} />
    </DailyProvider>
  );
}
