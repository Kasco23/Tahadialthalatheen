import React from "react";
import {
  useParticipantProperty,
  useVideoTrack,
  DailyVideo,
} from "@daily-co/daily-react";
import type { Database } from "../lib/types/supabase";

/**
 * ParticipantTile Component - Individual video participant display
 *
 * Simplified Design:
 * - Removed mute/eject moderation controls to prevent video freezing issues
 * - The controls were causing WebSocket state conflicts when clicked, even if canceled
 * - Video streams now maintain stability without moderation interference
 *
 * Display Features:
 * - Player name, role, flag, and team logo
 * - Live video stream or "Camera Off" placeholder
 * - Connection status indicator (green pulse)
 * - Video status indicator (camera on/off emoji)
 *
 * WebSocket Stability:
 * - Uses Daily.co's reactive hooks for participant data
 * - No direct WebSocket manipulation - all handled by Daily.co internally
 * - Video state updates automatically through useVideoTrack hook
 */

type ParticipantRow = Database["public"]["Tables"]["Participant"]["Row"];

interface ParticipantTileProps {
  participantId: string;
  playersByName: Map<string, ParticipantRow>;
}

// Helper function to get role display (copied from Lobby logic)
const getRoleDisplay = (player: ParticipantRow) => {
  switch (player.role) {
    case "Host":
      return "👑 Host";
    case "Player1":
      return "⚽ Player 1";
    case "Player2":
      return "🏆 Player 2";
    default:
      return player.role;
  }
};

const ParticipantTile: React.FC<ParticipantTileProps> = ({
  participantId,
  playersByName,
}) => {
  // Get participant's display name and video track state
  const userName = useParticipantProperty(participantId, "user_name");
  const videoTrack = useVideoTrack(participantId);

  // Find matching player data
  const playerData = userName
    ? playersByName.get(userName.toLowerCase())
    : null;

  // Determine display name and role
  const displayName = playerData?.name || userName || "Unknown Participant";
  const roleDisplay = playerData ? getRoleDisplay(playerData) : "Participant";

  // Flag and logo
  const flagCode = playerData?.flag || "sa"; // Default to Saudi Arabia
  const logoUrl = playerData?.team_logo_url;

  // Check if video is available
  const hasVideo = videoTrack?.track && videoTrack.state === "playable";

  return (
    <div className="relative bg-gradient-to-br from-gray-800 via-gray-700 to-gray-800 rounded-xl overflow-hidden aspect-[3/4] shadow-2xl border border-gray-600/50 backdrop-blur-sm">
      {/* Video stream */}
      {hasVideo ? (
        <DailyVideo
          sessionId={participantId}
          type="video"
          className="w-full h-full object-cover"
          style={{
            objectFit: "cover",
            aspectRatio: "3/4",
          }}
        />
      ) : (
        // Enhanced placeholder when no video
        <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center relative">
          {/* Background pattern */}
          <div className="absolute inset-0 bg-black/20"></div>

          {/* Content */}
          <div className="text-center text-white/80 z-10">
            <div className="text-5xl mb-3 filter drop-shadow-sm">👤</div>
            <div className="text-sm font-medium bg-black/30 px-3 py-1 rounded-full backdrop-blur-sm">
              Camera Off
            </div>
          </div>

          {/* Subtle pattern overlay */}
          <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_25%_25%,white_2px,transparent_2px)] bg-[length:30px_30px]"></div>
        </div>
      )}

      {/* Overlay with participant info */}
      <div className="absolute bottom-0 left-0 w-full bg-black/50 text-white text-sm p-2 flex items-center space-x-2">
        {/* Flag */}
        <span className={`fi fi-${flagCode} text-base`}></span>

        {/* Team logo */}
        {logoUrl && (
          <img
            src={logoUrl}
            alt="Team logo"
            className="w-5 h-5 object-contain inline"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        )}

        {/* Name and role */}
        <span className="flex-1 truncate">
          {displayName} • {roleDisplay}
        </span>

        {/* Video status indicator */}
        <div
          className={`text-xs px-1 rounded ${hasVideo ? "text-green-400" : "text-red-400"}`}
        >
          {hasVideo ? "📹" : "📵"}
        </div>
      </div>

      {/* Connection status indicator */}
      <div className="absolute top-2 right-2">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
      </div>
    </div>
  );
};

export { ParticipantTile };
export default ParticipantTile;
