import React from "react";
import {
  useDaily,
  useMeetingState,
  useLocalParticipant,
  // useDevices
} from "@daily-co/daily-react";
import { Mic, MicOff, Video, VideoOff, Phone, PhoneOff } from "lucide-react";

interface ControlsBarProps {
  sessionCode: string;
  participantName: string;
  onJoinCall?: () => void;
  onLeaveCall?: () => void;
  demoMode?: boolean;
  demoIsInCall?: boolean;
  isTopPosition?: boolean;
}

export const ControlsBar: React.FC<ControlsBarProps> = ({
  onJoinCall,
  onLeaveCall,
  demoMode = false,
  demoIsInCall = false,
  isTopPosition = false,
}) => {
  const daily = useDaily();
  const meetingState = useMeetingState();
  const localParticipant = useLocalParticipant();
  // Device management (can be expanded later for device switching)
  // const { currentCam, currentMic } = useDevices();
  const [isJoining, setIsJoining] = React.useState(false);

  // Use demo state or actual Daily.co state
  const isInCall = demoMode ? demoIsInCall : meetingState === "joined-meeting";

  // Get current audio/video state from local participant
  const isMuted = localParticipant?.tracks?.audio?.state !== "playable";
  const isCameraOff = localParticipant?.tracks?.video?.state !== "playable";

  const handleToggleMute = async () => {
    if (demoMode) {
      // In demo mode, we can't actually change state
      return;
    } else if (daily && isInCall) {
      await daily.setLocalAudio(isMuted); // Toggle opposite of current state
    }
  };

  const handleToggleCamera = async () => {
    if (demoMode) {
      // In demo mode, we can't actually change state
      return;
    } else if (daily && isInCall) {
      await daily.setLocalVideo(isCameraOff); // Toggle opposite of current state
    }
  };

  const handleJoinCall = async () => {
    if (onJoinCall) {
      setIsJoining(true);
      try {
        await onJoinCall();
      } finally {
        setIsJoining(false);
      }
    }
  };

  const handleLeaveCall = async () => {
    if (onLeaveCall) {
      await onLeaveCall();
    }
  };

  return (
    <div
      className="fixed left-1/2 -translate-x-1/2 z-50"
      style={{ bottom: "20px" }}
    >
      <div className="bg-white/10 backdrop-blur-sm rounded-full px-6 py-3 border border-white/20 shadow-lg">
        <div className="flex items-center space-x-4">
          {isInCall ? (
            <>
              {/* Mute/Unmute Button */}
              <button
                onClick={handleToggleMute}
                className={`p-3 rounded-full transition-all duration-200 ${
                  isMuted
                    ? "bg-red-500 hover:bg-red-600 text-white"
                    : "bg-white/20 hover:bg-white/30 text-white"
                }`}
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
              </button>

              {/* Camera On/Off Button */}
              <button
                onClick={handleToggleCamera}
                className={`p-3 rounded-full transition-all duration-200 ${
                  isCameraOff
                    ? "bg-red-500 hover:bg-red-600 text-white"
                    : "bg-white/20 hover:bg-white/30 text-white"
                }`}
                title={isCameraOff ? "Turn camera on" : "Turn camera off"}
              >
                {isCameraOff ? <VideoOff size={20} /> : <Video size={20} />}
              </button>

              {/* Leave Call Button */}
              <button
                onClick={handleLeaveCall}
                className="p-3 rounded-full bg-red-500 hover:bg-red-600 text-white transition-all duration-200"
                title="Leave call"
              >
                <PhoneOff size={20} />
              </button>
            </>
          ) : (
            /* Join Call Button */
            <button
              onClick={handleJoinCall}
              disabled={isJoining}
              className={`${
                isTopPosition
                  ? "px-8 py-4 text-lg rounded-xl"
                  : "px-6 py-3 rounded-full"
              } font-medium transition-all duration-200 flex items-center space-x-2 ${
                isJoining
                  ? "bg-gray-500 cursor-not-allowed text-white"
                  : "bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-xl"
              }`}
              title="Join video call"
            >
              <Phone size={isTopPosition ? 24 : 20} />
              <span>{isJoining ? "Joining..." : "Join Call"}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ControlsBar;
