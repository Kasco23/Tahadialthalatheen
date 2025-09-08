# Enhanced Realtime Features with Supabase Policies

This document explains how to use the enhanced realtime functionality that leverages the new Supabase realtime policies for broadcasts and presence.

## Overview

Your realtime policies enable:
1. **Broadcasts** - Real-time messages between clients
2. **Presence** - Real-time user presence tracking  
3. **Postgres Changes** - Database change subscriptions

## Key Files

### Core Functionality
- `src/lib/enhancedRealtimeHooks.ts` - Enhanced hooks combining broadcasts, presence, and postgres changes
- `src/lib/enhancedPresence.ts` - Advanced presence helper with broadcasting
- `src/components/EnhancedLobby.tsx` - Example component using all features

### Database
- `supabase/migrations/20250908160000_add_realtime_policies.sql` - Migration with realtime policies

## Usage Examples

### 1. Enhanced Realtime Hook

```tsx
import { useEnhancedRealtime } from '../lib/enhancedRealtimeHooks';

function MyComponent({ sessionId }) {
  const { 
    isConnected, 
    sendGameAction, 
    sendChatMessage,
    trackPresence,
    untrackPresence 
  } = useEnhancedRealtime(sessionId);

  // Send game actions via broadcast
  const handlePlayerAction = () => {
    sendGameAction('player_ready', { 
      playerId: 'user123',
      ready: true 
    });
  };

  // Send chat messages via broadcast
  const handleSendMessage = () => {
    sendChatMessage('Hello everyone!', 'user123');
  };

  // Track user presence
  useEffect(() => {
    trackPresence({
      user_id: 'user123',
      name: 'John Doe',
      role: 'Player',
      flag: '🌍',
      last_seen: new Date().toISOString()
    });

    return () => untrackPresence();
  }, []);
}
```

### 2. Enhanced Participants with Presence

```tsx
import { useParticipants } from '../lib/enhancedRealtimeHooks';

function ParticipantsList({ sessionId }) {
  const { participantsWithPresence, loading } = useParticipants(sessionId);

  return (
    <div>
      {participantsWithPresence.map(participant => (
        <div key={participant.participant_id}>
          <span>{participant.name}</span>
          <span>{participant.lobby_presence}</span> {/* DB status */}
          {participant.realtimePresence && (
            <span>{participant.realtimePresence.is_active ? 'Online' : 'Offline'}</span>
          )}
        </div>
      ))}
    </div>
  );
}
```

### 3. Real-time Chat

```tsx
import { useChat } from '../lib/enhancedRealtimeHooks';

function ChatComponent({ sessionId }) {
  const { messages, sendMessage } = useChat(sessionId);

  return (
    <div>
      <div className="messages">
        {messages.map(msg => (
          <div key={msg.id}>
            <strong>{msg.userName}:</strong> {msg.message}
          </div>
        ))}
      </div>
      
      <input 
        onKeyPress={(e) => {
          if (e.key === 'Enter') {
            sendMessage(e.target.value, 'currentUserId');
            e.target.value = '';
          }
        }}
      />
    </div>
  );
}
```

### 4. Enhanced Presence Helper

```tsx
import { EnhancedPresenceHelper } from '../lib/enhancedPresence';

function GameLobby({ sessionId, userId }) {
  const [presenceHelper, setPresenceHelper] = useState(null);

  useEffect(() => {
    const helper = new EnhancedPresenceHelper(sessionId);
    
    helper.joinPresence({
      user_id: userId,
      name: 'Player Name',
      flag: '🌍',
      role: 'Player',
      timestamp: new Date().toISOString(),
      is_active: true
    });

    // Listen for presence updates
    helper.onPresenceUpdate((presenceState) => {
      console.log('Active users:', Object.keys(presenceState));
    });

    setPresenceHelper(helper);

    return () => helper.leavePresence();
  }, [sessionId, userId]);

  // Update lobby status with broadcast
  const joinLobby = () => {
    presenceHelper?.updateLobbyStatus('Joined');
  };

  // Update video status with broadcast  
  const joinVideo = () => {
    presenceHelper?.updateVideoStatus(true);
  };
}
```

## Benefits Over Previous Implementation

### 1. **Improved Performance**
- **Broadcasts**: Instant UI updates without waiting for DB round-trips
- **Native Presence**: Built-in Supabase presence is more efficient than manual tracking
- **Reduced DB Load**: Less frequent database updates for transient state

### 2. **Better Real-time Experience**
- **Immediate Feedback**: Actions broadcast instantly to all clients
- **Dual Updates**: Database for persistence + broadcast for immediate UI
- **Heartbeat Management**: Automatic presence heartbeat with cleanup

### 3. **Enhanced Features**
- **Chat**: Real-time chat via broadcasts
- **Game Actions**: Instant game state broadcasts
- **Presence Events**: Granular presence event handling (join/leave/activity)

## Migration Strategy

### Phase 1: Add Enhanced Hooks (Current)
- ✅ Created enhanced realtime hooks
- ✅ Added enhanced presence helper
- ✅ Created example components
- ✅ Applied realtime policies

### Phase 2: Gradual Migration
1. Update `LobbyStatus.tsx` to use `useParticipants` from enhanced hooks
2. Replace `PresenceHelper` usage with `EnhancedPresenceHelper`
3. Add chat functionality to lobby
4. Migrate other components as needed

### Phase 3: Cleanup
1. Remove old `realtimeHooks.ts` once fully migrated
2. Remove old `presence.ts` once enhanced version is stable
3. Optimize policies for production (tighten security)

## Security Considerations

### Current Policies (Development)
```sql
-- Very permissive for development
USING (true)
WITH CHECK (true)
```

### Production Recommendations
```sql
-- Restrict to authenticated users
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated')

-- Or restrict to session participants
USING (EXISTS (
  SELECT 1 FROM participants 
  WHERE session_id = extract_session_from_topic(topic) 
  AND user_id = auth.uid()
))
```

## Testing the Enhanced Features

1. **Start the development server**: `pnpm dev`
2. **Open multiple browser tabs** to test real-time sync
3. **Use the Enhanced Lobby component** to test all features
4. **Check browser console** for realtime connection logs
5. **Monitor Supabase realtime dashboard** for policy usage

## Troubleshooting

### Common Issues

1. **"relation realtime.messages does not exist"**
   - Run the migration: `supabase db push`
   - Or apply policies manually in SQL editor

2. **Policies not working**
   - Check if RLS is enabled: `ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;`
   - Verify policy syntax in Supabase dashboard

3. **Presence not syncing**
   - Ensure presence is enabled in channel config
   - Check browser network tab for websocket connections
   - Verify user has proper authentication

4. **Broadcasts not received**
   - Check if `self: true` is set in broadcast config
   - Verify event names match between sender and receiver
   - Check browser console for subscription errors

## Performance Monitoring

Monitor these metrics:
- **Realtime connections**: Supabase dashboard
- **Message volume**: Check broadcast frequency
- **Presence updates**: Monitor heartbeat intervals
- **Database queries**: Ensure broadcasts reduce DB load

## Next Steps

1. **Test thoroughly** in development
2. **Monitor performance** with multiple users
3. **Tighten security policies** before production
4. **Add error handling** and retry logic
5. **Consider rate limiting** for broadcasts
