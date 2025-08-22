import { useGameActions, useGameState } from '@/hooks/useGameAtoms';
import { debugError, debugLog, debugWarn } from '@/utils/debugLog';
import DailyIframe, { type DailyCall } from '@daily-co/daily-js';
import {
  DailyProvider,
  useDaily,
  useDailyEvent,
  useLocalParticipant,
  useParticipant,
  useParticipantIds,
} from '@daily-co/daily-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AlertBanner from './AlertBanner';

interface VideoRoomProps {
  gameId: string;
  className?: string;
  observerMode?: boolean;
  onLeave?: () => void;
}

interface ParticipantVideoProps {
  participantId: string;
}

interface VideoControlsProps {
  gameId: string;
  userRole: string;
  onLeave?: () => void;
}

// Video controls component
function VideoControls({ gameId, userRole, onLeave }: VideoControlsProps) {
  const daily = useDaily();
  const localParticipant = useLocalParticipant();
  const { endVideoRoom } = useGameActions();

  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isAudioOn, setIsAudioOn] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  // Update local states based on participant data
  useEffect(() => {
    if (localParticipant) {
      setIsVideoOn(localParticipant.tracks?.video?.state === 'playable');
      setIsAudioOn(localParticipant.tracks?.audio?.state === 'playable');
      setIsScreenSharing(
        localParticipant.tracks?.screenVideo?.state === 'playable',
      );
    }
  }, [localParticipant]);

  const toggleVideo = useCallback(async () => {
    if (!daily) return;
    try {
      await daily.setLocalVideo(!isVideoOn);
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
      if (isScreenSharing) {
        await daily.stopScreenShare();
      } else {
        await daily.startScreenShare();
      }
    } catch (error) {
      debugError('Failed to toggle screen share', 'VideoControls', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }, [daily, isScreenSharing]);

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
    <div className="flex flex-wrap gap-2 justify-center p-4 bg-black/20 rounded-lg mt-4">
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

      {/* Screen share (only for hosts and controllers) */}
      {(userRole === 'host' || userRole === 'controller') && (
        <button
          onClick={toggleScreenShare}
          className={`px-3 py-2 rounded-lg text-sm transition-all ${
            isScreenSharing
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-600 hover:bg-gray-700 text-white'
          }`}
          title={isScreenSharing ? 'Stop screen share' : 'Start screen share'}
        >
          🖥️ {isScreenSharing ? 'Stop Sharing' : 'Share Screen'}
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
  );
}

function ParticipantVideo({ participantId }: ParticipantVideoProps) {
  const participant = useParticipant(participantId);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Set up video stream using MediaStreamTrack
  useEffect(() => {
    if (participant?.tracks.video.persistentTrack && videoRef.current) {
      const videoElement = videoRef.current;
      const stream = new MediaStream([
        participant.tracks.video.persistentTrack,
      ]);
      videoElement.srcObject = stream;
      videoElement.autoplay = true;
      videoElement.playsInline = true;

      // Mute local user video to prevent echo
      if (participant.local) {
        videoElement.muted = true;
      }
    }
  }, [participant?.tracks.video.persistentTrack, participant?.local]);

  // Set up audio stream using MediaStreamTrack
  useEffect(() => {
    if (
      participant?.tracks.audio.persistentTrack &&
      audioRef.current &&
      !participant.local
    ) {
      const audioElement = audioRef.current;
      const stream = new MediaStream([
        participant.tracks.audio.persistentTrack,
      ]);
      audioElement.srcObject = stream;
      audioElement.autoplay = true;
    }
  }, [participant?.tracks.audio.persistentTrack, participant?.local]);

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
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            autoPlay
            muted={participant.local}
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

        {/* Audio element (hidden, for non-local participants) */}
        {!participant.local && <audio ref={audioRef} autoPlay />}

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

function VideoRoomContent({
  gameId,
  className = '',
  observerMode = false,
  onLeave,
}: VideoRoomProps) {
  const daily = useDaily();
  const participantIds = useParticipantIds();
  const state = useGameState();
  const { generateDailyToken } = useGameActions();
  // Track join or permission errors to surface to the user via an alert banner
  const [joinError, setJoinError] = useState<string | null>(null);

  // Listen to Daily events for better connection handling
  useDailyEvent(
    'joined-meeting',
    useCallback(() => {
      debugLog('Successfully joined meeting', 'VideoRoom');
      setJoinError(null);
    }, []),
  );

  useDailyEvent(
    'left-meeting',
    useCallback(() => {
      debugLog('Left meeting', 'VideoRoom');
    }, []),
  );

  useDailyEvent(
    'error',
    useCallback((event) => {
      debugError('Daily error occurred', 'VideoRoom', { event });
      setJoinError('Connection error occurred');
    }, []),
  );

  useDailyEvent(
    'participant-joined',
    useCallback((event) => {
      debugLog('Participant joined', 'VideoRoom', {
        userName: event?.participant?.user_name,
      });
    }, []),
  );

  useDailyEvent(
    'participant-left',
    useCallback((event) => {
      debugLog('Participant left', 'VideoRoom', {
        userName: event?.participant?.user_name,
      });
    }, []),
  );

  // Get user info from URL parameters
  const getUserInfo = useCallback(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const role = urlParams.get('role');
    const name = urlParams.get('name') || 'User';

    if (observerMode) {
      return {
        userName: state.hostName || name,
        isHost: true,
        isObserver: true,
      };
    }

    if (role === 'host') {
      return {
        userName: state.hostName || name,
        isHost: true,
        isObserver: false,
      };
    } else if (role === 'playerA' || role === 'playerB') {
      return {
        userName: name,
        isHost: false,
        isObserver: false,
      };
    }

    return {
      userName: name,
      isHost: false,
      isObserver: false,
    };
  }, [state.hostName, observerMode]);

  // Join room when URL is available
  useEffect(() => {
    if (!daily || !state.videoRoomUrl) return;

    const joinRoom = async () => {
      try {
        const userInfo = getUserInfo();
        debugLog('Joining with user info', 'VideoRoom', { userInfo });

        // Generate token for this user
        const token = await generateDailyToken(
          gameId,
          userInfo.userName,
          userInfo.isHost,
          userInfo.isObserver,
        );

        if (!token) {
          throw new Error('Failed to get access token');
        }

        // Join the Daily call
        await daily.join({
          url: state.videoRoomUrl,
          token: token,
          userName: userInfo.userName,
        });

        // Attempt to enable the local user's camera and surface permission errors
        try {
          await daily.setLocalVideo(true);
        } catch (cameraError) {
          debugError('Camera permission error', 'VideoRoom', {
            error:
              cameraError instanceof Error
                ? cameraError.message
                : 'Unknown error',
          });
          setJoinError(
            'Unable to access your camera. Please allow camera permissions and refresh.',
          );
        }

        debugLog('Successfully joined the call', 'VideoRoom');
      } catch (error) {
        debugError('Failed to join call', 'VideoRoom', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        setJoinError('Failed to join the video call. Please try again.');
      }
    };

    joinRoom();
  }, [daily, state.videoRoomUrl, gameId, generateDailyToken, getUserInfo]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (daily) {
        daily.leave().catch((error) => {
          debugError('Error during daily cleanup', 'VideoRoom', {
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        });
      }
    };
  }, [daily]);

  if (!state.videoRoomCreated || !state.videoRoomUrl) {
    return (
      <div
        className={`bg-gray-500/20 border border-gray-500/30 rounded-xl p-6 ${className}`}
      >
        <div className="text-center">
          <div className="text-gray-400 text-lg font-bold mb-2">
            Video room not available
          </div>
          <div className="text-gray-300 text-sm">
            Waiting for video room creation...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      {/* Display any join or permission errors to the user */}
      {joinError && (
        <AlertBanner
          message={joinError}
          type="error"
          isVisible={Boolean(joinError)}
          onClose={() => setJoinError(null)}
        />
      )}

      <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-600/30">
        <h3 className="text-lg font-bold text-white mb-4 text-center">
          Live Video Room
        </h3>

        {/* Mobile-optimized participant layout */}
        <div className="flex flex-col sm:flex-row gap-4 min-h-[200px] sm:min-h-[300px]">
          {participantIds.map((participantId, index) => (
            <div key={participantId} className="flex items-stretch">
              <ParticipantVideo participantId={participantId} />

              {/* Divider between participants (not after the last one) */}
              {index < participantIds.length - 1 && (
                <div className="w-px bg-gray-600 mx-2 self-stretch hidden sm:block" />
              )}
            </div>
          ))}

          {/* Show message if no participants */}
          {participantIds.length === 0 && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="text-gray-400 text-lg font-bold mb-2">
                  No participants connected
                </div>
                <div className="text-gray-300 text-sm">
                  Waiting for participants to join...
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Info note */}
        <div className="mt-4 bg-blue-500/10 rounded-lg p-3 border border-blue-500/20">
          <p className="text-blue-300 text-sm text-center">
            💡 Horizontal layout with individual video frames and auto-play
          </p>
          <p className="text-blue-200 text-xs text-center mt-1">
            Connected participants: {participantIds.length}
          </p>
        </div>

        {/* Video Controls */}
        <VideoControls
          gameId={gameId}
          userRole={
            getUserInfo().isHost
              ? 'host'
              : getUserInfo().isObserver
                ? 'controller'
                : 'player'
          }
          onLeave={onLeave}
        />
      </div>
    </div>
  );
}

export default function VideoRoom(props: VideoRoomProps) {
  const state = useGameState();

  // Memoize Daily call object so the same instance is reused across re-renders.
  // Daily recommends creating a call object per room and disposing it when finished
  // to avoid leaking video/audio resources.
  const callObject = useMemo<DailyCall>(() => {
    try {
      return DailyIframe.createCallObject();
    } catch (error) {
      debugWarn('Failed to create Daily call object', 'VideoRoom', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      // Return a typed mock to avoid runtime issues while satisfying TypeScript
      return null as unknown as DailyCall;
    }
  }, []);

  // Destroy the Daily call object on unmount to free resources and prevent
  // lingering connections that could leave the UI in a loading state.
  useEffect(() => {
    return () => {
      if (callObject) {
        try {
          // Only destroy if not already destroyed or destroying
          const meetingState = callObject.meetingState();
          // Only destroy if not in a state that doesn't require cleanup
          if (
            meetingState !== 'left-meeting' &&
            meetingState !== 'error' &&
            meetingState !== 'new' &&
            meetingState !== 'loading'
          ) {
            callObject.destroy();
          }
        } catch (error) {
          debugWarn('Error during cleanup', 'VideoRoom', {
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    };
  }, [callObject]);

  // Only render if video room is created and call object is available
  if (!state.videoRoomCreated || !state.videoRoomUrl || !callObject) {
    return (
      <div
        className={`bg-gray-500/20 border border-gray-500/30 rounded-xl p-6 ${props.className || ''}`}
      >
        <div className="text-center">
          <div className="text-gray-400 text-lg font-bold mb-2">
            Video room not available
          </div>
          <div className="text-gray-300 text-sm">
            {!callObject
              ? 'Daily.co initialization failed'
              : 'Waiting for video room creation...'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <DailyProvider callObject={callObject}>
      <VideoRoomContent {...props} />
    </DailyProvider>
  );
}
