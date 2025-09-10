# Daily.co Video Integration Documentation

This document explains how the Daily.co video calling integration works in the Tahadialthalatheen quiz application. It covers the architecture, API flow, configuration, and usage patterns for future maintainers.

## Overview

The application integrates [Daily.co](https://www.daily.co/) for real-time video calling functionality during quiz sessions. Video calls are ephemeral and tied to quiz sessions, providing participants with face-to-face interaction during gameplay.

### Key Features

- **Session-based rooms**: Each quiz session gets a unique Daily.co room
- **Token-based authentication**: Secure access to video rooms via meeting tokens
- **React integration**: Uses Daily's React hooks for UI components
- **Host controls**: Hosts can moderate participants (mute, remove from call)
- **Responsive grid**: Adaptive video layout for different screen sizes
- **Audio management**: Separate audio handling with DailyAudio component

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Client  │───▶│ Netlify Funcs   │───▶│   Daily.co API  │
│                 │    │                 │    │                 │
│ - DailyProvider │    │ - createRoom    │    │ - Rooms API     │
│ - Components    │    │ - createToken   │    │ - Tokens API    │
│ - State Atoms   │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                        │
        │                        │
        └────────┐        ┌──────┘
                 ▼        ▼
         ┌─────────────────┐
         │   Supabase DB   │
         │                 │
         │ - DailyRoom     │
         │ - Participants  │
         └─────────────────┘
```

## File Structure

### Frontend Components

```
src/
├── atoms/index.ts              # Daily state atoms
├── components/
│   ├── DailyJoinButton.tsx     # Join/leave video call button
│   ├── VideoCall.tsx           # Main video call container
│   ├── ParticipantTile.tsx     # Individual participant video tile
│   └── ControlsBar.tsx         # Call controls (mute, video toggle)
├── pages/
│   ├── GameSetup.tsx          # Host room creation
│   └── Lobby.tsx              # Participant room joining
└── lib/
    └── mutations.ts           # API functions
```

### Backend Functions

```
netlify/functions/
├── createDailyRoom.ts         # Creates Daily.co rooms
└── create-daily-token.ts      # Creates meeting tokens
```

## API Flow

### 1. Room Creation (Host)

```typescript
// GameSetup.tsx
const response = await createDailyRoom(sessionId, sessionCode);
// Returns: { room_url: string, room_name: string, session_id: string }
```

**Flow:**
1. Host clicks "Create Video Room" in GameSetup
2. `createDailyRoom()` calls `/api/create-daily-room`
3. Netlify function creates room via Daily.co API
4. Room URL stored in `dailyRoomUrlAtom` and Supabase `DailyRoom` table
5. Room becomes available for participants

### 2. Token Creation & Joining (Participants)

```typescript
// DailyJoinButton.tsx
const tokenResponse = await createDailyToken(sessionCode, participantName);
await daily?.join({
  url: dailyRoomUrl,
  token: tokenResponse.token,
  userName: participantName,
});
```

**Flow:**
1. Participant clicks "Join Video Call" in Lobby
2. `createDailyToken()` calls `/create-daily-token`
3. Netlify function creates meeting token via Daily.co API
4. Daily React hook joins room with token and user name
5. Participant appears in video grid for all users

## Configuration

### Environment Variables

#### Frontend (Vite - exposed to browser)
```bash
# Optional: If Daily domain needs to be configurable
VITE_DAILY_DOMAIN=your-daily-domain
```

#### Backend (Netlify Functions - server-only)
```bash
# Required: Daily.co REST API key
DAILY_API_KEY=your_daily_api_key

# Required: Supabase connection (for session validation)
SUPABASE_DATABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Netlify Configuration

The `netlify.toml` includes Daily.co domains in Content Security Policy:

```toml
Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.daily.co; connect-src 'self' https://api.daily.co; frame-src https://call.daily.co;"
```

### Vite Build Configuration

Daily.co libraries are chunked separately for optimal loading:

```typescript
// vite.config.ts
manualChunks(id) {
  if (/@daily-co/.test(id)) return "vendor-daily";
}
```

## State Management

### Jotai Atoms

```typescript
// src/atoms/index.ts
export const dailyRoomUrlAtom = atom<string | null>(null);
export const dailyTokenAtom = atom<string | null>(null);
export const dailyUserNameAtom = atom<string | null>(null);
```

### Daily React Context

The app uses `DailyProvider` at the root level:

```tsx
// src/App.tsx
function App() {
  return (
    <DailyProvider>
      <Router>
        {/* Routes */}
      </Router>
    </DailyProvider>
  );
}
```

## Key Components

### VideoCall Component

Main container managing participant grid and controls:

```tsx
<VideoCall 
  players={players}           // Supabase participant data
  sessionCode={sessionCode}   // Session identifier
  participantName={name}      // Current user name
  onJoinCall={handleJoin}     // Optional join callback
  onLeaveCall={handleLeave}   // Optional leave callback
  callObject={callObject}     // Daily call instance
/>
```

**Features:**
- Responsive grid layout (1-3 columns based on screen size)
- Audio handling via `DailyAudio` component
- Participant count display
- Integration with Supabase player data

### ParticipantTile Component

Individual video tiles with moderation controls:

```tsx
<ParticipantTile
  participantId={participantId}       // Daily participant ID
  playersByName={playersByName}       // Map of Supabase player data
  isHost={isHost}                     // Current user host status
  currentUserParticipantId={userId}   // Current user's participant ID
  callObject={callObject}             // Daily call instance for controls
/>
```

**Features:**
- Video display with `DailyVideo` component
- Player role indicators (👑 Host, ⚽ Player 1, etc.)
- Host-only moderation controls (mute, remove)
- Fallback avatar when video is off

### DailyJoinButton Component

Join/leave call functionality:

```tsx
<DailyJoinButton
  sessionCode={sessionCode}     // Session identifier
  participantName={userName}    // User's display name
/>
```

**Features:**
- Token creation and room joining
- Loading states and error handling
- Join/leave button with status indicator

## Daily.co API Integration

### Room Creation

**Endpoint:** `POST https://api.daily.co/v1/rooms`

```typescript
// netlify/functions/createDailyRoom.ts
const roomResponse = await fetch("https://api.daily.co/v1/rooms", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${process.env.DAILY_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    name: session_code,              // Room name = session code
    privacy: "public",
    properties: {
      max_participants: 10,
      enable_recording: false,
      enable_chat: true,
      start_video_off: false,
      start_audio_off: false,
    },
  }),
});
```

**Idempotent behavior**: If room already exists (409 conflict), fetches existing room.

### Token Creation

**Endpoint:** `POST https://api.daily.co/v1/meeting-tokens`

```typescript
// netlify/functions/create-daily-token.ts
const tokenResponse = await fetch("https://api.daily.co/v1/meeting-tokens", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${process.env.DAILY_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    properties: {
      room_name: roomIdentifier,     // Session code
      user_name: user_name,          // Participant name
      is_owner: false,               // Non-owner by default
      enable_recording: false,
      start_video_off: false,
      start_audio_off: false,
    },
  }),
});
```

## Database Schema

### DailyRoom Table

```sql
CREATE TABLE "DailyRoom" (
  room_id TEXT PRIMARY KEY,           -- References Session.session_id
  room_url TEXT NOT NULL,             -- Daily.co room URL
  ready BOOLEAN DEFAULT false,        -- Room readiness status
  active_participants JSONB,          -- Current participants
  host_permissions JSONB,             -- Host control settings
  
  FOREIGN KEY (room_id) REFERENCES "Session"(session_id)
);
```

## Error Handling

### Common Error Scenarios

1. **Missing API Key**
   ```typescript
   if (!process.env.DAILY_API_KEY) {
     return new Response(JSON.stringify({ error: "Server configuration error" }), {
       status: 500
     });
   }
   ```

2. **Room Creation Conflicts**
   ```typescript
   if (roomResponse.status === 409) {
     // Fetch existing room instead of failing
     const getResp = await fetch(`https://api.daily.co/v1/rooms/${session_code}`);
   }
   ```

3. **Token Creation Failures**
   ```typescript
   if (!tokenResponse.ok) {
     const errorData = await tokenResponse.text();
     console.error("Daily.co API error:", errorData);
     return new Response(JSON.stringify({
       error: "Failed to create meeting token",
       details: errorData,
     }));
   }
   ```

4. **Frontend Join Errors**
   ```typescript
   try {
     await daily?.join({ url: dailyRoomUrl, token, userName });
   } catch (error) {
     setJoinError(
       error instanceof Error ? error.message : "Failed to join video call"
     );
   }
   ```

## Performance Considerations

### Code Splitting

Daily.co libraries are chunked separately to reduce initial bundle size:

```
vendor-daily-B6g9Zkvm.js     241.61 kB │ gzip:  66.82 kB
```

### Lazy Loading

Video components are only rendered when needed:

```tsx
// Only render VideoCall when Daily room is available
{dailyRoom && (
  <VideoCall 
    players={players}
    sessionCode={sessionCode}
    participantName={participantName}
  />
)}
```

### Cleanup

Proper cleanup prevents memory leaks:

```typescript
const handleLeaveDaily = async () => {
  if (daily) {
    await daily.leave();
    setDailyToken(null);
    setDailyUserName(null);
  }
};
```

## Security Considerations

### API Key Protection

- Daily API key is server-only (never exposed to client)
- Uses Netlify Functions to proxy Daily.co API calls
- Environment variables properly scoped (`DAILY_API_KEY` vs `VITE_*`)

### Content Security Policy

CSP headers allow Daily.co domains while restricting others:

```
script-src 'self' https://cdn.daily.co;
connect-src 'self' https://api.daily.co;
frame-src https://call.daily.co;
```

### Meeting Tokens

- Tokens provide room-specific access control
- Tokens are ephemeral and tied to specific sessions
- Non-owner permissions by default (participants can't record)

## Testing

### Unit Tests

```typescript
// src/components/DailyJoinButton.test.tsx
describe("DailyJoinButton", () => {
  it("should handle join call success", async () => {
    // Mock successful token creation and room join
  });
  
  it("should handle join call failure", async () => {
    // Mock failed token creation or network error
  });
});
```

### Integration Testing

Test the complete flow in E2E tests:

```typescript
// tests/e2e/video-call.spec.ts
test("Host can create room and participants can join", async ({ page }) => {
  // 1. Host creates session and Daily room
  // 2. Participant joins session
  // 3. Participant joins video call
  // 4. Verify video grid shows both participants
});
```

## Troubleshooting

### Common Issues

1. **"No Daily room available" Error**
   - Cause: Host hasn't created video room yet
   - Solution: Host must click "Create Video Room" in GameSetup

2. **Token Creation Fails**
   - Check `DAILY_API_KEY` environment variable
   - Verify room exists before creating tokens
   - Check Daily.co API rate limits

3. **Video Not Showing**
   - Check browser permissions for camera/microphone
   - Verify Daily.co domains in CSP headers
   - Check network connectivity to Daily.co services

4. **Participants Can't Join**
   - Verify session code is correct
   - Check room hasn't reached max participants (10)
   - Ensure room is still active (rooms auto-expire)

### Debug Tools

Enable Daily.co debug logging:

```typescript
// Add to development environment
if (process.env.NODE_ENV === 'development') {
  window.DailyIframe?.setDebug(true);
}
```

### Monitoring

Key metrics to monitor:

- Room creation success rate
- Token generation latency  
- Join success rate
- Active participant counts
- Daily.co API error rates

## Implementation Review & Improvements

### Current Implementation Strengths

The existing Daily.co integration demonstrates several best practices:

1. **Security First**: API keys properly isolated in server functions
2. **Clean Architecture**: Separation between UI components, state management, and API layer
3. **Error Handling**: Comprehensive error handling in both frontend and backend
4. **Performance**: Daily.co libraries chunked separately (66.82kB gzipped)
5. **Idempotent Operations**: Room creation handles conflicts gracefully
6. **Type Safety**: Strong TypeScript usage throughout

### Identified Improvement Opportunities

#### 1. Token Management Enhancements
**Current**: New token created on each join attempt
**Improvement**: Implement token caching and refresh logic
```typescript
// Potential enhancement for DailyJoinButton.tsx
const useTokenCache = (sessionCode: string, userName: string) => {
  // Cache tokens with expiration tracking
  // Refresh tokens before expiry
  // Handle token validation failures
};
```

#### 2. Enhanced Error Recovery
**Current**: Basic error handling without retry logic
**Improvement**: Add exponential backoff and connection recovery
```typescript
// Potential enhancement for mutations.ts
const createDailyTokenWithRetry = async (roomName: string, userName: string, maxRetries = 3) => {
  // Implement exponential backoff
  // Handle rate limiting (429 responses)
  // Retry on network failures
};
```

#### 3. Room Configuration Flexibility
**Current**: Hardcoded room properties (max_participants: 10)
**Improvement**: Make room settings configurable per session
```typescript
// Potential enhancement
interface RoomConfig {
  maxParticipants: number;
  enableRecording: boolean;
  startVideoOff: boolean;
  // Add per-session customization
}
```

#### 4. User Experience Enhancements
**Areas for improvement**:
- Loading states during room creation in GameSetup
- Participant presence indicators (in call vs available)
- Audio/video mute status indicators
- Connection quality feedback

#### 5. Monitoring & Analytics
**Missing capabilities**:
- Video usage metrics
- Call quality monitoring
- Participant engagement tracking
- Daily.co webhook integration for events

### Recommended Prioritization

**High Priority** (Production readiness):
1. Enhanced error recovery with retry logic
2. Token refresh mechanism for long sessions
3. Room cleanup when sessions end

**Medium Priority** (User experience):
1. Loading indicators and better status feedback
2. Participant presence indicators
3. Connection quality monitoring

**Low Priority** (Future enhancements):
1. Advanced moderation features
2. Recording capabilities
3. Analytics and metrics collection

## Future Improvements

### Potential Enhancements

1. **Persistent Rooms & Cleanup**
   - Store room URLs in database for session resume
   - Implement automatic room cleanup after session ends
   - Add room lifecycle management

2. **Advanced Moderation**
   - Waiting room functionality
   - Screen sharing controls
   - Recording capabilities for hosts
   - Breakout room support

3. **UI/UX Improvements**
   - Picture-in-picture mode
   - Virtual backgrounds
   - Audio level indicators
   - Participant status badges
   - Connection quality indicators

4. **Performance Optimizations**
   - Implement participant video quality controls
   - Add bandwidth optimization based on participant count
   - Lazy load video components based on call state
   - Reduce bundle size with dynamic imports

5. **Analytics Integration**
   - Track video usage metrics
   - Monitor call quality statistics
   - User engagement during video calls
   - Integration with Daily.co analytics API

## Migration Notes

If migrating away from Daily.co:

1. **Abstraction Layer**: Consider wrapping video calls in a provider pattern
2. **State Management**: Video state is cleanly separated in Jotai atoms
3. **Component Structure**: VideoCall component provides clean interface
4. **API Isolation**: Server functions are isolated and replaceable

## Conclusion

The Daily.co integration provides robust video calling functionality for the quiz application. The architecture prioritizes security, performance, and maintainability while providing a smooth user experience. The separation of concerns between frontend components, state management, and backend API functions makes the system both testable and extensible.

For questions or issues with the video integration, refer to:
- [Daily.co Documentation](https://docs.daily.co/)
- [Daily.co React Documentation](https://docs.daily.co/reference/daily-react)
- This project's implementation in the files listed above