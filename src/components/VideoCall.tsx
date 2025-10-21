import { Logger } from "../lib/logger";
import React from "react";
import {
  useParticipantIds,
  DailyAudio,
  useDailyError,
  useDaily,
} from "@daily-co/daily-react";
import { useAtom } from "jotai";
import { ParticipantTile } from "./ParticipantTile";
import { ControlsBar } from "./ControlsBar";
import type { Database } from "../lib/types/supabase";
import { supabase } from "../lib/supabaseClient";
import { dailyRoomUrlAtom, dailyTokenAtom } from "../atoms";

/**
 * VideoCall Component - Daily.co video integration
 *
 * WebSocket Stability:
 * - Daily.co handles WebSocket connections internally via the callObject
 * - The useDaily() hook provides access to the stable call instance
 * - Participant updates are handled reactively through Daily's hooks
 * - No manual WebSocket management needed - Daily.co handles reconnection automatically
 *
 * Removed Features:
 * - Mute/Eject moderation controls (caused video freezing due to state conflicts)
 * - Host-specific moderation UI (simplified to prevent WebSocket state issues)
 *
 * Video Persistence:
 * - The call object persists across component remounts when wrapped in DailyProvider
 * - To maintain video across routes (Lobby -> Quiz), ensure DailyProvider is at App level
 */

type ParticipantRow = Database["public"]["Tables"]["Participants"]["Row"] & {
  Profiles?: {
    name?: string | null;
    flag?: string | null;
    team?: string | null;
  } | null;
};

interface VideoCallProps {
  players: ParticipantRow[];
  sessionCode: string;
  sessionId?: string; // Make optional since no longer used
  participantName: string;
}

export const VideoCall: React.FC<VideoCallProps> = ({
  players,
  sessionCode,
  participantName,
}) => {
  // Use modern Daily React hooks
  const { meetingError } = useDailyError();
  const callObject = useDaily();
  const [callError, setCallError] = React.useState<string | null>(null);

  // Get room and token data from atoms (already created in Lobby)
  const [roomUrl] = useAtom(dailyRoomUrlAtom);
  const [token] = useAtom(dailyTokenAtom);

  // Get all participant IDs in the call (including local user)
  const participantIds = useParticipantIds();

  // Log errors if they occur
  React.useEffect(() => {
    if (meetingError) {
      Logger.error("Daily meeting error:", meetingError);
    }
  }, [meetingError]);

  // Cleanup: Update video presence when unmounting
  React.useEffect(() => {
    return () => {
      // When component unmounts, update Supabase to reflect disconnection
      const updateVideoPresence = async () => {
        try {
          // Find current participant in players list
          const currentPlayer = players.find(
            (p) =>
              p.Profiles?.name?.toLowerCase() === participantName.toLowerCase(),
          );

          if (currentPlayer?.participant_id) {
            await supabase
              .from("Participants")
              .update({ video_presence: false })
              .eq("participant_id", currentPlayer.participant_id);

            Logger.log("Video presence cleared on unmount");
          }
        } catch (error) {
          Logger.error("Failed to update video presence on unmount:", error);
        }
      };

      updateVideoPresence();
    };
  }, [players, participantName]);

  // Handle joining Daily call
  const handleJoinDailyCall = async () => {
    if (!callObject) {
      setCallError("No call object available.");
      return;
    }

    // Use room URL and token from atoms (already created in Lobby)
    if (!roomUrl || !token) {
      setCallError(
        "No Daily room or token available. Host needs to create a room first.",
      );
      return;
    }

    // Check if we're in local development with mock room
    const isLocalDev =
      window.location.hostname === "localhost" &&
      window.location.port === "5173";
    const isMockRoom =
      roomUrl.includes("thirty.daily.co") && isLocalDev;

    if (isMockRoom) {
      setCallError(
        "🚧 Video calls are disabled in development mode. Use 'netlify dev' for full functionality.",
      );
      return;
    }

    setCallError(null);

    try {
      Logger.log("Using pre-created token for Daily room join:", {
        roomUrl,
        userName: participantName,
      });

      // Join the Daily room using the pre-created token from atoms
      await callObject.join({
        url: roomUrl,
        token: token,
        userName: participantName,
      });

      Logger.log("Successfully joined Daily room:", {
        roomUrl,
        userName: participantName,
      });
    } catch (error) {
      Logger.error("Failed to join Daily room:", error);
      setCallError(
        error instanceof Error ? error.message : "Failed to join video call",
      );
    }
  };

  const handleLeaveDailyCall = async () => {
    if (callObject) {
      try {
        await callObject.leave();
        Logger.log("Left Daily call");
      } catch (error) {
        Logger.error("Error leaving Daily call:", error);
      }
    }
  };

  // Create a lookup map for player data by name
  const playersByName = React.useMemo(() => {
    const map = new Map<string, ParticipantRow>();
    players.forEach((player) => {
      const playerName = player.Profiles?.name;
      if (playerName) {
        map.set(playerName.toLowerCase(), player);
      }
    });
    return map;
  }, [players]);

  return (
    <div className="relative pb-24 px-4">
      {/* Participant count emphasis */}
      <div className="mb-6 text-center">
        <div className="inline-flex items-center space-x-3 bg-white/20 backdrop-blur-sm rounded-full px-6 py-3 border border-white/30">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-lg font-bold text-white">
            {participantIds.length}{" "}
            {participantIds.length === 1 ? "Participant" : "Participants"}{" "}
            Connected
          </span>
        </div>
      </div>

      {/* Audio component - handles all remote audio tracks */}
      <DailyAudio />

      {/* FaceTime-style Video Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 auto-rows-auto max-h-[80vh] overflow-y-auto">
        {participantIds.map((participantId) => (
          <div key={participantId} className="w-full max-w-sm mx-auto">
            <ParticipantTile
              participantId={participantId}
              playersByName={playersByName}
            />
          </div>
        ))}
      </div>

      {participantIds.length === 0 && (
        <div className="text-center text-white/70 py-16">
          <div className="text-8xl mb-8">📹</div>
          <div className="text-2xl font-medium mb-4">
            Waiting for participants to join
          </div>
          <div className="text-lg text-blue-200">
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

      {/* Controls Bar - Fixed at bottom */}
      <ControlsBar
        sessionCode={sessionCode}
        participantName={participantName}
        onJoinCall={handleJoinDailyCall}
        onLeaveCall={handleLeaveDailyCall}
        isTopPosition={false}
      />
    </div>
  );
};

export default VideoCall;
