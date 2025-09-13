import React from "react";
import {
  useParticipantIds,
  DailyAudio,
  useLocalParticipant,
  useDailyError,
  useDaily,
} from "@daily-co/daily-react";
import { ParticipantTile } from "./ParticipantTile";
import { ControlsBar } from "./ControlsBar";
import type { Database } from "../lib/types/supabase";
import { supabase } from "../lib/supabaseClient";
import { createDailyToken } from "../lib/mutations";

type ParticipantRow = Database["public"]["Tables"]["Participant"]["Row"];

interface VideoCallProps {
  players: ParticipantRow[];
  sessionCode: string;
  participantName: string;
  showControlsAtTop?: boolean;
}

export const VideoCall: React.FC<VideoCallProps> = ({
  players,
  sessionCode,
  participantName,
  showControlsAtTop = false,
}) => {
  // Use modern Daily React hooks
  const { meetingError } = useDailyError();
  const callObject = useDaily();
  const [callError, setCallError] = React.useState<string | null>(null);
  
  // Get all participant IDs in the call (including local user)
  const participantIds = useParticipantIds();
  const localParticipant = useLocalParticipant();

  // Determine if current user has moderation privileges (Host or GameMaster)
  const currentUserRole = localStorage.getItem("userRole") || localStorage.getItem("isHost") === "true" ? "Host" : "Player";
  const canModerate = ["Host", "GameMaster"].includes(currentUserRole);

  // Get current user's participant ID
  const currentUserParticipantId = localParticipant?.session_id;

  // Log errors if they occur
  React.useEffect(() => {
    if (meetingError) {
      console.error("Daily meeting error:", meetingError);
    }
  }, [meetingError]);

  // Handle joining Daily call
  const handleJoinDailyCall = async () => {
    if (!sessionCode || !callObject) {
      setCallError("No session code or call object available.");
      return;
    }

    // Get Daily room info from Supabase
    const { data: roomData } = await supabase
      .from("DailyRoom")
      .select("room_url, ready")
      .eq("room_id", sessionCode)
      .single();

    if (!roomData?.room_url) {
      setCallError("No Daily room available. Host needs to create a room first.");
      return;
    }

    // Check if we're in local development with mock room
    const isLocalDev = window.location.hostname === "localhost" && window.location.port === "5173";
    const isMockRoom = roomData.room_url.includes("thirty.daily.co") && isLocalDev;

    if (isMockRoom) {
      setCallError("🚧 Video calls are disabled in development mode. Use 'netlify dev' for full functionality.");
      return;
    }

    setCallError(null);

    try {
      console.log("Using participant name for token:", participantName);

      // Fetch the token for joining the Daily room
      const tokenResponse = await createDailyToken(sessionCode, participantName);

      // Join the Daily room using the modern hook-based approach
      await callObject.join({
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
    }
  };

  const handleLeaveDailyCall = async () => {
    if (callObject) {
      try {
        await callObject.leave();
        console.log("Left Daily call");
      } catch (error) {
        console.error("Error leaving Daily call:", error);
      }
    }
  };

  // Create a lookup map for player data by name
  const playersByName = React.useMemo(() => {
    const map = new Map<string, ParticipantRow>();
    players.forEach((player) => {
      map.set(player.name.toLowerCase(), player);
    });
    return map;
  }, [players]);

  return (
    <div className="relative">
      {/* Controls Bar at top when requested */}
      {showControlsAtTop && (
        <div className="mb-6 flex justify-center">
          <ControlsBar
            sessionCode={sessionCode}
            participantName={participantName}
            onJoinCall={handleJoinDailyCall}
            onLeaveCall={handleLeaveDailyCall}
            isTopPosition={true}
          />
        </div>
      )}

      {/* Participant count emphasis */}
      <div className="mb-6 text-center">
        <div className="inline-flex items-center space-x-3 bg-white/20 backdrop-blur-sm rounded-full px-6 py-3 border border-white/30">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-lg font-bold text-white">
            {participantIds.length} {participantIds.length === 1 ? 'Participant' : 'Participants'} Connected
          </span>
        </div>
      </div>

      {/* Audio component - handles all remote audio tracks */}
      <DailyAudio />

      {/* Responsive Video grid with auto-fit */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-fr">
        {participantIds.map((participantId) => (
          <div key={participantId} className="min-h-0">
            <ParticipantTile
              participantId={participantId}
              playersByName={playersByName}
              isHost={canModerate}
              currentUserParticipantId={currentUserParticipantId}
            />
          </div>
        ))}
      </div>

      {participantIds.length === 0 && (
        <div className="text-center text-white/70 py-12">
          <div className="text-6xl mb-6">📹</div>
          <div className="text-xl font-medium mb-2">Waiting for participants to join</div>
          <div className="text-sm text-blue-200">
            The video call is ready and waiting for participants
          </div>
        </div>
      )}

      {/* Error Display */}
      {callError && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-400/50 text-red-200 rounded-lg flex items-start space-x-3">
          <span className="text-lg">⚠️</span>
          <div>
            <p className="font-medium">Connection Issue</p>
            <p className="text-sm opacity-90">{callError}</p>
          </div>
        </div>
      )}

      {/* Controls Bar - Fixed at bottom when not at top */}
      {!showControlsAtTop && (
        <ControlsBar
          sessionCode={sessionCode}
          participantName={participantName}
          onJoinCall={handleJoinDailyCall}
          onLeaveCall={handleLeaveDailyCall}
          isTopPosition={false}
        />
      )}
    </div>
  );
};

export default VideoCall;
