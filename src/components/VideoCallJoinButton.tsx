import React from "react";
import {
  useDaily,
  useMeetingState,
  useLocalParticipant,
} from "@daily-co/daily-react";
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { createDailyToken } from "../lib/mutations";

interface VideoCallJoinButtonProps {
  sessionId: string;
  sessionCode: string;
  participantName: string;
}

export const VideoCallJoinButton: React.FC<VideoCallJoinButtonProps> = ({
  sessionId,
  sessionCode,
  participantName,
}) => {
  const daily = useDaily();
  const meetingState = useMeetingState();
  const localParticipant = useLocalParticipant();
  const [isJoining, setIsJoining] = React.useState(false);
  const [callError, setCallError] = React.useState<string | null>(null);

  const isInCall = meetingState === "joined-meeting";

  // Get current audio/video state from local participant
  const isMuted = localParticipant?.tracks?.audio?.state !== "playable";
  const isCameraOff = localParticipant?.tracks?.video?.state !== "playable";

  const handleJoinDailyCall = async () => {
    if (!sessionCode || !daily) {
      setCallError("No session code or call object available.");
      return;
    }

    setIsJoining(true);
    setCallError(null);

    try {
      // Get Daily room info from Supabase using sessionId (not sessionCode)
      const { data: roomData } = await supabase
        .from("DailyRoom")
        .select("room_url, ready")
        .eq("room_id", sessionId)
        .single();

      if (!roomData?.room_url) {
        setCallError(
          "No Daily room available. Host needs to create a room first.",
        );
        return;
      }

      // Check if we're in local development with mock room
      const isLocalDev =
        window.location.hostname === "localhost" &&
        window.location.port === "5173";
      const isMockRoom =
        roomData.room_url.includes("thirty.daily.co") && isLocalDev;

      if (isMockRoom) {
        setCallError(
          "🚧 Video calls are disabled in development mode. Use 'netlify dev' for full functionality.",
        );
        return;
      }

      console.log("Using participant name for token:", participantName);

      // Fetch the token for joining the Daily room
      const tokenResponse = await createDailyToken(
        sessionCode,
        participantName,
      );

      // Join the Daily room using the modern hook-based approach
      await daily.join({
        url: roomData.room_url,
        token: tokenResponse.token,
        userName: participantName,
      });

      console.log("Successfully initiated Daily room join:", {
        roomUrl: roomData.room_url,
        userName: participantName,
      });
    } catch (error) {
      console.error("Failed to join Daily room:", error);
      setCallError(
        error instanceof Error ? error.message : "Failed to join video call",
      );
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeaveDailyCall = async () => {
    if (daily) {
      try {
        await daily.leave();
        console.log("Left Daily call");
      } catch (error) {
        console.error("Error leaving Daily call:", error);
      }
    }
  };

  const handleToggleMute = async () => {
    if (daily && isInCall) {
      await daily.setLocalAudio(isMuted); // Toggle opposite of current state
    }
  };

  const handleToggleCamera = async () => {
    if (daily && isInCall) {
      await daily.setLocalVideo(isCameraOff); // Toggle opposite of current state
    }
  };

  if (isInCall) {
    return (
      <div className="flex items-center space-x-2">
        {/* Mute/Unmute Button */}
        <button
          onClick={handleToggleMute}
          className={`p-2 rounded-full transition-all duration-200 ${
            isMuted
              ? "bg-red-500 hover:bg-red-600 text-white"
              : "bg-white/20 hover:bg-white/30 text-white"
          }`}
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
        </button>

        {/* Camera On/Off Button */}
        <button
          onClick={handleToggleCamera}
          className={`p-2 rounded-full transition-all duration-200 ${
            isCameraOff
              ? "bg-red-500 hover:bg-red-600 text-white"
              : "bg-white/20 hover:bg-white/30 text-white"
          }`}
          title={isCameraOff ? "Turn camera on" : "Turn camera off"}
        >
          {isCameraOff ? <VideoOff size={16} /> : <Video size={16} />}
        </button>

        {/* Leave Call Button */}
        <button
          onClick={handleLeaveDailyCall}
          className="p-2 rounded-full bg-red-500 hover:bg-red-600 text-white transition-all duration-200"
          title="Leave call"
        >
          <PhoneOff size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      {/* Join Call Button */}
      <button
        onClick={handleJoinDailyCall}
        disabled={isJoining}
        className={`px-3 py-1 rounded-full font-medium transition-all duration-200 flex items-center space-x-1 text-xs ${
          isJoining
            ? "bg-gray-500 cursor-not-allowed text-white"
            : "bg-green-500 hover:bg-green-600 text-white shadow-sm hover:shadow-md"
        }`}
        title="Join video call"
      >
        <Phone size={14} />
        <span>{isJoining ? "Joining..." : "Join Call"}</span>
      </button>

      {/* Error Display (compact for header) */}
      {callError && (
        <div className="text-xs text-red-300" title={callError}>
          ⚠️
        </div>
      )}
    </div>
  );
};

export default VideoCallJoinButton;
