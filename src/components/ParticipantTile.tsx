import { Logger } from "../lib/logger";
import React, { useState } from "react";
import {
  useParticipantProperty,
  useVideoTrack,
  DailyVideo,
  useDaily,
} from "@daily-co/daily-react";
import type { Database } from "../lib/types/supabase";

type ParticipantRow = Database["public"]["Tables"]["Participant"]["Row"];

interface ParticipantTileProps {
  participantId: string;
  playersByName: Map<string, ParticipantRow>;
  isHost?: boolean;
  currentUserParticipantId?: string;
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
  isHost = false,
  currentUserParticipantId,
}) => {
  const [isActioning, setIsActioning] = useState(false);

  // Use Daily hook for moderation controls
  const callObject = useDaily();

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

  // Determine if this is the current user's tile
  const isCurrentUser = participantId === currentUserParticipantId;

  // Show moderation controls only if user is host and this is not their own tile
  const showModerationControls = isHost && !isCurrentUser && callObject;

  const handleMute = async () => {
    if (!callObject || isActioning) return;

    setIsActioning(true);
    try {
      await callObject.updateParticipant(participantId, { setAudio: false });
      Logger.log(`Muted participant: ${displayName}`);
    } catch (error) {
      Logger.error("Failed to mute participant:", error);
    } finally {
      setIsActioning(false);
    }
  };

  const handleEject = async () => {
    if (!callObject || isActioning) return;

    const confirmEject = confirm(
      `Are you sure you want to remove ${displayName} from the call?`,
    );
    if (!confirmEject) return;

    setIsActioning(true);
    try {
      await callObject.updateParticipant(participantId, { eject: true });
      Logger.log(`Ejected participant: ${displayName}`);
    } catch (error) {
      Logger.error("Failed to eject participant:", error);
    } finally {
      setIsActioning(false);
    }
  };

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

      {/* Host Moderation Controls */}
      {showModerationControls && (
        <div className="absolute top-2 left-2 flex space-x-1">
          <button
            onClick={handleMute}
            disabled={isActioning}
            className={`p-2 rounded-full bg-orange-500 hover:bg-orange-600 text-white text-sm transition-all duration-200 ${
              isActioning
                ? "opacity-50 cursor-not-allowed"
                : "shadow-lg hover:shadow-xl"
            }`}
            title={`Mute ${displayName}`}
          >
            🔈
          </button>
          <button
            onClick={handleEject}
            disabled={isActioning}
            className={`p-2 rounded-full bg-red-500 hover:bg-red-600 text-white text-sm transition-all duration-200 ${
              isActioning
                ? "opacity-50 cursor-not-allowed"
                : "shadow-lg hover:shadow-xl"
            }`}
            title={`Remove ${displayName} from call`}
          >
            ❌
          </button>
        </div>
      )}
    </div>
  );
};

export { ParticipantTile };
export default ParticipantTile;
