import React from "react";
import { useDaily } from "@daily-co/daily-react";
import { Mic, MicOff, Video, VideoOff, Phone, PhoneOff } from "lucide-react";

interface ControlsBarProps {
  sessionCode: string;
  participantName: string;
  onJoinCall?: () => void;
  onLeaveCall?: () => void;
  demoMode?: boolean;
  demoIsInCall?: boolean;
}

export const ControlsBar: React.FC<ControlsBarProps> = ({
  onJoinCall,
  onLeaveCall,
  demoMode = false,
  demoIsInCall = false,
}) => {
  const daily = useDaily();
  const [isMuted, setIsMuted] = React.useState(false);
  const [isCameraOff, setIsCameraOff] = React.useState(false);
  const [isJoining, setIsJoining] = React.useState(false);

  // Use demo state or actual Daily.co state
  const isInCall = demoMode ? demoIsInCall : daily?.meetingState() === "joined-meeting";

  // Get current audio/video state from Daily
  React.useEffect(() => {
    if (daily && isInCall && !demoMode) {
      const participants = daily.participants();
      const localParticipant = participants.local;
      if (localParticipant) {
        setIsMuted(!localParticipant.audio);
        setIsCameraOff(!localParticipant.video);
      }
    }
  }, [daily, isInCall, demoMode]);

  const handleToggleMute = async () => {
    if (demoMode) {
      setIsMuted(!isMuted);
    } else if (daily && isInCall) {
      await daily.setLocalAudio(!isMuted);
      setIsMuted(!isMuted);
    }
  };

  const handleToggleCamera = async () => {
    if (demoMode) {
      setIsCameraOff(!isCameraOff);
    } else if (daily && isInCall) {
      await daily.setLocalVideo(!isCameraOff);
      setIsCameraOff(!isCameraOff);
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
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-10">
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
              className={`px-6 py-3 rounded-full font-medium transition-all duration-200 flex items-center space-x-2 ${
                isJoining
                  ? "bg-gray-500 cursor-not-allowed text-white"
                  : "bg-green-500 hover:bg-green-600 text-white"
              }`}
              title="Join video call"
            >
              <Phone size={20} />
              <span>{isJoining ? "Joining..." : "Join Call"}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ControlsBar;