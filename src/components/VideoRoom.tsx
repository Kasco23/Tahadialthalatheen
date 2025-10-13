import { Logger } from "../lib/logger";
import React, { useEffect, useState } from "react";
import { useAtom } from "jotai";
import { useDaily, useMeetingState } from "@daily-co/daily-react";
import { dailyRoomUrlAtom, dailyTokenAtom, dailyUserNameAtom } from "../atoms";
import { VideoCall } from "./VideoCall";
import type { Database } from "../lib/types/supabase";

type ParticipantRow = Database["public"]["Tables"]["Participant"]["Row"];

interface VideoRoomProps {
  players: ParticipantRow[];
  sessionCode: string;
  sessionId: string;
  participantName: string;
  autoJoin?: boolean; // Whether to automatically join when room is available
}

/**
 * VideoRoom Component - Manages persistent video call state across routes
 *
 * This component:
 * - Reads roomUrl and token from global Jotai atoms
 * - Automatically joins the call when autoJoin is true and room data is available
 * - Maintains the call connection across route changes (Lobby -> Quiz)
 * - Shares the same Daily call instance via DailyProvider at App level
 */
export const VideoRoom: React.FC<VideoRoomProps> = ({
  players,
  sessionCode,
  sessionId,
  participantName,
  autoJoin = false,
}) => {
  const [roomUrl] = useAtom(dailyRoomUrlAtom);
  const [token] = useAtom(dailyTokenAtom);
  const [userName] = useAtom(dailyUserNameAtom);
  const callObject = useDaily();
  const meetingState = useMeetingState();
  const [joinError, setJoinError] = useState<string | null>(null);

  // Auto-join the call if enabled and not already joined
  useEffect(() => {
    if (!autoJoin || !callObject || !roomUrl || !token) {
      return;
    }

    // Only join if we're not already in a meeting
    if (
      meetingState !== "joined-meeting" &&
      meetingState !== "joining-meeting"
    ) {
      const join = async () => {
        try {
          Logger.log("VideoRoom: Auto-joining call", {
            roomUrl,
            userName: userName || participantName,
          });

          await callObject.join({
            url: roomUrl,
            token,
            userName: userName || participantName,
          });

          Logger.log("VideoRoom: Successfully joined call");
          setJoinError(null);
        } catch (error) {
          Logger.error("VideoRoom: Failed to auto-join call:", error);
          setJoinError(
            error instanceof Error
              ? error.message
              : "Failed to join video call",
          );
        }
      };

      join();
    }
  }, [
    autoJoin,
    callObject,
    roomUrl,
    token,
    userName,
    participantName,
    meetingState,
  ]);

  // If no room data available, show a message
  if (!roomUrl || !token) {
    return (
      <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 overflow-hidden p-6 text-center">
        <div className="text-white/70">
          <div className="text-6xl mb-4">📹</div>
          <div className="text-lg font-medium">Video call not available</div>
          <div className="text-sm mt-2">
            The host needs to create a video room first
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 overflow-hidden">
      {/* Video Header */}
      <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 px-6 py-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div
              className={`w-3 h-3 rounded-full ${
                meetingState === "joined-meeting"
                  ? "bg-green-400 animate-pulse"
                  : "bg-yellow-400"
              }`}
            ></div>
            <h3 className="text-xl font-bold text-white">Video Conference</h3>
          </div>
          <div className="flex items-center space-x-4 text-sm text-blue-200">
            <span className="flex items-center space-x-1">
              <span>🏠</span>
              <span>
                {meetingState === "joined-meeting"
                  ? "Connected"
                  : "Connecting..."}
              </span>
            </span>
            {meetingState === "joined-meeting" && (
              <span className="flex items-center space-x-1">
                <span>🔗</span>
                <span>Live</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {joinError && (
        <div className="m-4 p-4 bg-red-500/20 border border-red-400/50 text-red-200 rounded-lg">
          <p className="font-medium">Connection Error</p>
          <p className="text-sm mt-1">{joinError}</p>
        </div>
      )}

      {/* Video Content */}
      <div className="p-3">
        <VideoCall
          players={players}
          sessionCode={sessionCode}
          sessionId={sessionId}
          participantName={userName || participantName}
        />
      </div>
    </div>
  );
};

export default VideoRoom;
