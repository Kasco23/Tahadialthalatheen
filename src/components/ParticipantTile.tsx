import React from "react";
import { 
  useParticipantProperty, 
  useVideoTrack, 
  DailyVideo 
} from "@daily-co/daily-react";
import type { Database } from "../lib/types/supabase";

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
  playersByName 
}) => {
  // Get participant's display name and video track state
  const userName = useParticipantProperty(participantId, "user_name");
  const videoTrack = useVideoTrack(participantId);
  
  // Find matching player data
  const playerData = userName ? playersByName.get(userName.toLowerCase()) : null;
  
  // Determine display name and role
  const displayName = playerData?.name || userName || "Unknown Participant";
  const roleDisplay = playerData ? getRoleDisplay(playerData) : "Participant";
  
  // Flag and logo
  const flagCode = playerData?.flag || "sa"; // Default to Saudi Arabia
  const logoUrl = playerData?.team_logo_url;
  
  // Check if video is available
  const hasVideo = videoTrack?.track && videoTrack.state === "playable";

  return (
    <div className="relative bg-gray-800 rounded-lg overflow-hidden aspect-video">
      {/* Video stream */}
      {hasVideo ? (
        <DailyVideo 
          sessionId={participantId}
          type="video"
          className="w-full h-full object-cover"
        />
      ) : (
        // Placeholder when no video
        <div className="w-full h-full bg-gray-700 flex items-center justify-center">
          <div className="text-center text-white/70">
            <div className="text-4xl mb-2">👤</div>
            <div className="text-sm">No video</div>
          </div>
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
        <div className={`text-xs px-1 rounded ${hasVideo ? 'text-green-400' : 'text-red-400'}`}>
          {hasVideo ? '📹' : '📵'}
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
