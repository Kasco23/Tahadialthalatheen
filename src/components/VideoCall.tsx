import React from "react";
import { useParticipantIds, DailyAudio, useLocalParticipant } from "@daily-co/daily-react";
import type { DailyCall } from "@daily-co/daily-js";
import { ParticipantTile } from "./ParticipantTile";
import { ControlsBar } from "./ControlsBar";
import type { Database } from "../lib/types/supabase";

type ParticipantRow = Database["public"]["Tables"]["Participant"]["Row"];

interface VideoCallProps {
  players: ParticipantRow[];
  sessionCode: string;
  participantName: string;
  onJoinCall?: () => void;
  onLeaveCall?: () => void;
  callObject?: DailyCall | null;
}

export const VideoCall: React.FC<VideoCallProps> = ({ 
  players, 
  sessionCode, 
  participantName, 
  onJoinCall, 
  onLeaveCall,
  callObject
}) => {
  // Get all participant IDs in the call (including local user)
  const participantIds = useParticipantIds();
  const localParticipant = useLocalParticipant();
  
  // Determine if current user is host
  const isHost = localStorage.getItem("isHost") === "true";
  
  // Get current user's participant ID
  const currentUserParticipantId = localParticipant?.session_id;

  // Create a lookup map for player data by name
  const playersByName = React.useMemo(() => {
    const map = new Map<string, ParticipantRow>();
    players.forEach(player => {
      map.set(player.name.toLowerCase(), player);
    });
    return map;
  }, [players]);

  return (
    <div className="relative bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-6">
      <h3 className="text-xl font-bold text-white mb-4 text-center">
        🎥 Video Call ({participantIds.length} participants)
      </h3>
      
      {/* Audio component - handles all remote audio tracks */}
      <DailyAudio />
      
      {/* Video grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {participantIds.map((participantId) => (
          <ParticipantTile
            key={participantId}
            participantId={participantId}
            playersByName={playersByName}
            isHost={isHost}
            currentUserParticipantId={currentUserParticipantId}
            callObject={callObject}
          />
        ))}
      </div>
      
      {participantIds.length === 0 && (
        <div className="text-center text-white/70 py-8">
          <div className="text-4xl mb-4">📹</div>
          <div>No participants in call yet</div>
          <div className="text-sm mt-2">Waiting for participants to join...</div>
        </div>
      )}

      {/* Controls Bar - Fixed at bottom */}
      <ControlsBar
        sessionCode={sessionCode}
        participantName={participantName}
        onJoinCall={onJoinCall}
        onLeaveCall={onLeaveCall}
      />
    </div>
  );
};

export default VideoCall;
