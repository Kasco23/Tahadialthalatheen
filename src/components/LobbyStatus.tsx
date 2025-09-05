import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

interface LobbyStatusProps {
  sessionId: string;
  sessionCode: string;
  onEndSession: () => void;
}

interface ParticipantInfo {
  participant_id: string;
  name: string;
  role: string;
  lobby_presence: string;
  flag?: string;
  team_logo_url?: string;
}

interface DailyRoomInfo {
  room_url: string;
  room_name: string;
}

const LobbyStatus: React.FC<LobbyStatusProps> = ({ sessionId, sessionCode, onEndSession }) => {
  const [participants, setParticipants] = useState<ParticipantInfo[]>([]);
  const [dailyRoom, setDailyRoom] = useState<DailyRoomInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLobbyData = async () => {
      try {
        setLoading(true);
        
        // Fetch participants
        const { data: participantsData, error: participantsError } = await supabase
          .from('Participant')
          .select('participant_id, name, role, lobby_presence, flag, team_logo_url')
          .eq('session_id', sessionId);

        if (participantsError) {
          console.error('Error fetching participants:', participantsError);
        } else {
          setParticipants(participantsData || []);
        }

        // Fetch daily room info
        const { data: dailyRoomData, error: dailyRoomError } = await supabase
          .from('DailyRoom')
          .select('room_url, room_name')
          .eq('session_id', sessionId)
          .single();

        if (dailyRoomError) {
          if (dailyRoomError.code !== 'PGRST116') { // Not found error is ok
            console.error('Error fetching daily room:', dailyRoomError);
          }
        } else {
          setDailyRoom(dailyRoomData);
        }
      } catch (error) {
        console.error('Error fetching lobby data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (sessionId) {
      fetchLobbyData();
      
      // Set up real-time subscriptions
      const participantsChannel = supabase
        .channel('participants_updates')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'Participant',
            filter: `session_id=eq.${sessionId}`
          },
          () => {
            fetchLobbyData();
          }
        )
        .subscribe();

      const dailyRoomChannel = supabase
        .channel('daily_room_updates')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'DailyRoom',
            filter: `session_id=eq.${sessionId}`
          },
          () => {
            fetchLobbyData();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(participantsChannel);
        supabase.removeChannel(dailyRoomChannel);
      };
    }
  }, [sessionId]);

  const getPresenceColor = (presence: string) => {
    switch (presence) {
      case 'Joined': return 'text-green-600 bg-green-100';
      case 'Disconnected': return 'text-yellow-600 bg-yellow-100';
      case 'NotJoined': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'Host': return '👑';
      case 'Player1': return '🎮';
      case 'Player2': return '🎯';
      default: return '👤';
    }
  };

  const activeParticipantCount = participants.filter(p => p.lobby_presence === 'Joined').length;
  const totalSlots = 3; // Host + 2 Players

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          🎯 Lobby Status
        </h2>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          <span className="ml-3 text-gray-600">Loading lobby status...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        🎯 Lobby Status
      </h2>

      {/* Session Info */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-blue-600 font-medium">Session Code:</span>
            <span className="ml-2 font-mono text-lg font-bold text-blue-800">{sessionCode}</span>
          </div>
          <div>
            <span className="text-blue-600 font-medium">Active Players:</span>
            <span className="ml-2 font-bold text-blue-800">{activeParticipantCount}/{totalSlots}</span>
          </div>
        </div>
      </div>

      {/* Daily Room Status */}
      <div className="mb-6 p-4 border rounded-lg">
        <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
          📹 Daily Room Status
        </h3>
        {dailyRoom ? (
          <div className="space-y-2">
            <div className="flex items-center text-green-600">
              <span className="text-xl mr-2">✅</span>
              <span className="font-medium">Room Created</span>
            </div>
            <div className="text-sm text-gray-600">
              <div><strong>Room Name:</strong> {dailyRoom.room_name}</div>
              <div><strong>Room URL:</strong> 
                <a 
                  href={dailyRoom.room_url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="ml-1 text-blue-600 hover:underline truncate inline-block max-w-xs"
                >
                  {dailyRoom.room_url}
                </a>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center text-gray-500">
            <span className="text-xl mr-2">⏳</span>
            <span>Not Created</span>
          </div>
        )}
      </div>

      {/* Participants List */}
      <div className="mb-6">
        <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
          👥 Participants
        </h3>
        <div className="space-y-3">
          {participants.map((participant) => (
            <div 
              key={participant.participant_id}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{getRoleIcon(participant.role)}</span>
                <div>
                  <div className="font-medium text-gray-800">{participant.name}</div>
                  <div className="text-sm text-gray-500">{participant.role}</div>
                </div>
                {participant.flag && (
                  <span className={`fi fi-${participant.flag} text-lg`}></span>
                )}
                {participant.team_logo_url && (
                  <img 
                    src={participant.team_logo_url} 
                    alt="Team Logo" 
                    className="w-6 h-6 rounded"
                  />
                )}
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPresenceColor(participant.lobby_presence)}`}>
                {participant.lobby_presence}
              </span>
            </div>
          ))}
          
          {/* Empty slots */}
          {participants.length < totalSlots && (
            <>
              {Array(totalSlots - participants.length).fill(0).map((_, index) => (
                <div key={`empty-${index}`} className="flex items-center space-x-3 p-3 border-2 border-dashed border-gray-300 rounded-lg">
                  <span className="text-2xl text-gray-400">⭕</span>
                  <div className="text-gray-500">
                    <div className="font-medium">Empty Slot</div>
                    <div className="text-sm">Waiting for player...</div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* End Session Button */}
      <button
        onClick={onEndSession}
        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200"
      >
        🔚 End Session
      </button>
    </div>
  );
};

export default LobbyStatus;