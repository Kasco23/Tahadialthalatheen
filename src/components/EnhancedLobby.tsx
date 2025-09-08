import React, { useEffect, useState } from "react";
import { useEnhancedRealtime, useParticipants, useChat } from "../lib/enhancedRealtimeHooks";
import { EnhancedPresenceHelper } from "../lib/enhancedPresence";

interface EnhancedLobbyProps {
  sessionId: string;
  currentUserId: string;
  currentUserName: string;
}

export const EnhancedLobby: React.FC<EnhancedLobbyProps> = ({
  sessionId,
  currentUserId,
  currentUserName,
}) => {
  const [presenceHelper, setPresenceHelper] = useState<EnhancedPresenceHelper | null>(null);
  
  // Use enhanced realtime hooks
  const { 
    isConnected, 
    sendGameAction, 
    trackPresence, 
    untrackPresence 
  } = useEnhancedRealtime(sessionId);
  
  const { 
    participantsWithPresence 
  } = useParticipants(sessionId);
  
  const { messages, sendMessage } = useChat(sessionId);

  // Initialize enhanced presence
  useEffect(() => {
    let helper: EnhancedPresenceHelper | null = null;

    const initPresence = async () => {
      helper = new EnhancedPresenceHelper(sessionId);
      
      await helper.joinPresence({
        user_id: currentUserId,
        name: currentUserName,
        flag: "🌍", // Default flag
        role: "Player",
        timestamp: new Date().toISOString(),
        is_active: true,
      });

      // Track presence in realtime channel as well
      trackPresence({
        user_id: currentUserId,
        name: currentUserName,
        role: "Player",
        flag: "🌍",
        last_seen: new Date().toISOString(),
      });

      setPresenceHelper(helper);
    };

    if (sessionId && currentUserId) {
      initPresence();
    }

    return () => {
      if (helper) {
        helper.leavePresence();
      }
      untrackPresence();
      setPresenceHelper(null);
    };
  }, [sessionId, currentUserId, currentUserName, trackPresence, untrackPresence]);

  // Handle game actions
  const handleStartGame = () => {
    sendGameAction("start_game", {
      sessionId,
      startedBy: currentUserId,
      timestamp: new Date().toISOString()
    });
  };

  const handlePlayerAction = (action: string, data: Record<string, unknown>) => {
    sendGameAction(action, {
      ...data,
      playerId: currentUserId,
      sessionId,
    });
  };

  // Handle lobby status updates
  const updateLobbyStatus = async (status: "Joined" | "NotJoined" | "Disconnected") => {
    if (presenceHelper) {
      await presenceHelper.updateLobbyStatus(status);
    }
  };

  const updateVideoStatus = async (inVideo: boolean) => {
    if (presenceHelper) {
      await presenceHelper.updateVideoStatus(inVideo);
    }
  };

  return (
    <div className="enhanced-lobby p-6">
      <div className="mb-4">
        <h2 className="text-2xl font-bold">Enhanced Realtime Lobby</h2>
        <p className={`text-sm ${isConnected ? "text-green-600" : "text-red-600"}`}>
          Realtime: {isConnected ? "Connected" : "Disconnected"}
        </p>
      </div>

      {/* Participants with enhanced presence */}
      <div className="participants mb-6">
        <h3 className="text-lg font-semibold mb-2">
          Participants ({participantsWithPresence.length})
        </h3>
        <div className="grid gap-2">
          {participantsWithPresence.map((participant) => (
            <div 
              key={participant.participant_id} 
              className="flex items-center justify-between p-3 bg-white rounded-lg shadow"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{participant.flag}</span>
                <div>
                  <p className="font-medium">{participant.name}</p>
                  <p className="text-sm text-gray-600">{participant.role}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Database lobby presence */}
                <span 
                  className={`px-2 py-1 rounded text-xs ${
                    participant.lobby_presence === "Joined" 
                      ? "bg-green-100 text-green-700" 
                      : participant.lobby_presence === "Disconnected"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  DB: {participant.lobby_presence}
                </span>
                
                {/* Realtime presence */}
                {participant.realtimePresence && (
                  <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-700">
                    RT: {participant.realtimePresence.is_active ? "Active" : "Inactive"}
                  </span>
                )}
                
                {/* Video presence */}
                <span className={`text-lg ${participant.video_presence ? "text-green-500" : "text-gray-400"}`}>
                  {participant.video_presence ? "📹" : "📵"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Game Actions */}
      <div className="game-actions mb-6">
        <h3 className="text-lg font-semibold mb-2">Game Actions</h3>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={handleStartGame}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Start Game
          </button>
          
          <button
            onClick={() => handlePlayerAction("player_ready", { ready: true })}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Mark Ready
          </button>
          
          <button
            onClick={() => updateLobbyStatus("Joined")}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            Join Lobby
          </button>
          
          <button
            onClick={() => updateVideoStatus(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Join Video
          </button>
        </div>
      </div>

      {/* Real-time Chat */}
      <div className="chat-section">
        <h3 className="text-lg font-semibold mb-2">Real-time Chat</h3>
        
        <div className="chat-messages mb-3 h-32 overflow-y-auto border rounded p-2 bg-gray-50">
          {messages.length === 0 ? (
            <p className="text-gray-500 text-sm">No messages yet...</p>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className="mb-2">
                <span className="font-medium text-sm">{msg.userName || msg.userId}:</span>
                <span className="ml-2 text-sm">{msg.message}</span>
                <span className="text-xs text-gray-500 ml-2">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))
          )}
        </div>
        
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyPress={(e) => {
              if (e.key === "Enter" && e.currentTarget.value.trim()) {
                sendMessage(e.currentTarget.value.trim(), currentUserId);
                e.currentTarget.value = "";
              }
            }}
          />
          <button
            onClick={(e) => {
              const input = e.currentTarget.previousElementSibling as HTMLInputElement;
              if (input.value.trim()) {
                sendMessage(input.value.trim(), currentUserId);
                input.value = "";
              }
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default EnhancedLobby;
