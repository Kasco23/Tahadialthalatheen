# Netlify Blobs Integration

## Overview

This project uses Netlify Blobs for cross-device session persistence, complementing the existing Supabase database for structured data.

## Architecture

### Data Storage Strategy

- **Supabase Database**: Structured relational data (players, scores, segments, phases, passwords)
- **Netlify Blobs**: Unstructured session data (Daily room tokens, participant roles, readiness state)
- **localStorage**: Browser-side fallback for offline support

### Why Netlify Blobs?

1. **Cross-device persistence**: Session data available across browsers and devices
2. **High availability**: Optimized for frequent reads and writes
3. **Simple key-value store**: Perfect for temporary session state
4. **Edge Function integration**: Secure server-side access with client proxy

## Features

### Readiness System

Players can mark themselves as ready/not ready in the lobby before starting the quiz. This state is persisted both in Supabase and Netlify Blobs for cross-device consistency.

**Implementation:**
- Database: `isReady` boolean column in Participant table
- Real-time updates via Supabase subscriptions
- Persistence in Netlify Blobs for reconnection scenarios
- UI: Ready/Unready toggle button in lobby

### Rejoin System (New)

Participants can rejoin sessions with password authentication and optionally update their configuration (name, flag, logo).

**Key Features:**
- Password authentication for secure rejoin
- Automatic detection of existing participants when entering session code
- Option to keep existing configuration or update it
- Works for both Host and Player roles
- Password stored as SHA-256 hash in Supabase

**User Flow:**
1. **First Join**: Enter session code → Create password → Select flag/logo → Join lobby
2. **Rejoin**: Enter session code → Click "Rejoin" button → Select participant → Enter password → Optionally update config → Rejoin lobby

**Implementation:**
- Database: `password` column in Participant table (nullable)
- Password hashing: SHA-256 via Web Crypto API (client-side)
- UI: RejoinModal component for participant selection
- Mutations: Complete rejoin flow with verification and config updates

## Implementation

### Directory Structure

```
netlify/
  edge-functions/
    get-session.ts    # Retrieve session data from blob store
    set-session.ts    # Save/delete session data in blob store
  functions/
    createDailyRoom.ts
    create-daily-token.ts

src/
  lib/
    blobStore.ts      # Client-side blob operations via edge functions
    userSession.ts    # Hybrid localStorage + blob storage
    mutations.ts      # Supabase operations including readiness state
```

### Edge Functions

#### get-session.ts

- **Method**: GET
- **Query Params**: `key` (format: `sessionId:participantId`)
- **Returns**: Session data JSON or 404 if not found

#### set-session.ts

- **Method**: POST (save), DELETE (remove)
- **Body**: `{ key, data }` for POST, `{ key }` for DELETE
- **Returns**: Success status

### Client Integration

```typescript
import { saveSession, loadSession } from "./lib/blobStore";

// Save session data
await saveSession(sessionId, participantId, {
  participantName: "Player 1",
  role: "Player1",
  flag: "us",
  isReady: true,
  dailyRoomToken: "token123",
});

// Load session data
const data = await loadSession(sessionId, participantId);
```

### Hybrid Storage in UserSession

The `UserSession` class automatically syncs to blob storage when:

- Session code and participant ID are available
- User updates session data via `UserSession.set()`

Falls back to localStorage for:

- Offline operation
- Fast synchronous reads
- Initial data before network sync

## Environment Variables

### Required for Edge Functions

```bash
# Netlify site configuration
NETLIFY_SITE_ID=<your-netlify-site-id>

# Personal access token for Netlify API
NETLIFY_PERSONAL_ACCESS_TOKEN=<your-netlify-personal-access-token>
```

### How to Get These Values

1. **NETLIFY_SITE_ID**:
   - Go to Netlify dashboard → Your site → Site settings → General
   - Copy the "Site ID" (also called API ID)

2. **NETLIFY_PERSONAL_ACCESS_TOKEN**:
   - Go to Netlify dashboard → User settings → Applications → Personal access tokens
   - Create new token with appropriate scopes

## Database Schema Updates

### Participant Table

The readiness and rejoin systems require additional columns in the Participant table:

#### isReady Column (for Readiness System)

```sql
-- Add isReady column to Participant table
ALTER TABLE "public"."Participant" 
ADD COLUMN IF NOT EXISTS "isReady" BOOLEAN DEFAULT false;

-- Optional: Add index for performance
CREATE INDEX IF NOT EXISTS "idx_participant_ready" 
ON "public"."Participant"("session_id", "isReady") 
WHERE "lobby_presence" = 'Joined';
```

#### password Column (for Rejoin System)

```sql
-- Add password column to Participant table
ALTER TABLE "public"."Participant" 
ADD COLUMN IF NOT EXISTS "password" TEXT DEFAULT NULL;
```

**Security Notes:**
- Passwords are hashed using SHA-256 on the client side before storage
- Password column is nullable for backward compatibility
- Never store plain-text passwords
- Password hashes are stored in the database for verification during rejoin

Run these migrations in your Supabase SQL editor before using the readiness and rejoin features.

**Migration Files:**
- `supabase/migrations/20251012000000_add_participant_ready_column.sql`
- `supabase/migrations/20251013000000_add_participant_password.sql`

## API Reference

### Blob Store Functions

#### `saveSession(sessionId, participantId, data)`

- Saves session data to blob store via edge function
- Returns `Promise<boolean>` indicating success
- Automatically adds `lastUpdated` timestamp

#### `loadSession(sessionId, participantId)`

- Loads session data from blob store via edge function
- Returns `Promise<BlobSessionData | null>`
- Returns null if not found

#### `deleteSession(sessionId, participantId)`

- Removes session data from blob store
- Returns `Promise<boolean>` indicating success

### Readiness Mutations

#### `markPlayerReady(participantId, isReady)`

- Updates participant's ready status
- Throws error on failure

#### `checkAllPlayersReady(sessionId)`

- Returns object with:
  - `allReady`: boolean (true if all players ready)
  - `readyCount`: number of ready players
  - `totalPlayers`: total player count
  - `participants`: array of participant objects with ready status

#### `resetAllPlayersReady(sessionId)`

- Resets all players' ready status to false
- Useful when starting new rounds

## Usage Examples

### Lobby Ready System

```typescript
import { markPlayerReady, checkAllPlayersReady } from "./lib/mutations";

// Player marks themselves ready
const handleReadyClick = async () => {
  await markPlayerReady(participantId, true);
};

// Host checks if all players ready
const { allReady, readyCount, totalPlayers } =
  await checkAllPlayersReady(sessionId);

if (allReady) {
  // Enable "Start Quiz" button
}
```

### Rejoin System

```typescript
import {
  getSessionParticipants,
  rejoinAsParticipant,
  updateParticipantConfig,
} from "./lib/mutations";
import { hashPassword } from "./lib/passwordHash";

// Check for existing participants when session code is entered
const participants = await getSessionParticipants(sessionId);

// User selects a participant and enters password
const passwordHash = await hashPassword(password);

// Option 1: Rejoin with existing configuration
const { participantId, role, sessionId } = await rejoinAsParticipant(
  participantId,
  passwordHash,
);

// Option 2: Rejoin and update configuration
const result = await rejoinAsParticipant(participantId, passwordHash, {
  name: "New Name",
  flag: "us",
  team_logo_url: "https://example.com/logo.png",
});

// Navigate to lobby
navigate(`/lobby/${sessionCode}/${seat}`);
```

### Password Management

```typescript
import { setParticipantPassword } from "./lib/mutations";
import { hashPassword } from "./lib/passwordHash";

// Set password when participant first joins
const passwordHash = await hashPassword(userPassword);
await setParticipantPassword(participantId, passwordHash);

// Password is automatically verified during rejoin
```

### Timer Integration

```typescript
import Timer from './components/Timer';

// In Quiz component
<Timer
  duration={30}
  autoStart={true}
  onComplete={() => {
    // Move to next question or deduct points
    handleTimeUp();
  }}
  onTick={(remaining) => {
    // Update UI with remaining time
    if (remaining === 10) {
      showWarning("10 seconds remaining!");
    }
  }}
/>
```

## Testing

### Local Development

Edge functions require Netlify CLI for local testing:

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Run dev server with edge functions
pnpm run dev:netlify
```

Note: For pure frontend development without edge functions, use `pnpm dev` instead.

### Manual Testing Checklist

1. **Session Creation Flow**
   - Create session and verify blob storage saves participant data
   - Check localStorage has backup copy

2. **Cross-Device Persistence**
   - Join session from different browser/device
   - Verify session data loads from blob store

3. **Readiness System**
   - Players mark themselves ready
   - Host sees updated ready status
   - "Start Quiz" button enables when all ready
   - Ready state persists after reconnection

4. **Rejoin Flow**
   - **Initial Join**: Enter session code → Create password → Select flag/logo → Join
   - **Rejoin Detection**: Enter session code → See rejoin button appear
   - **Password Authentication**: Select participant → Enter password → Verify success
   - **Config Update**: Choose to update config → Change name/flag/logo → Verify updates in Supabase
   - **Quick Rejoin**: Rejoin without config update → Verify immediate lobby access
   - **Failed Authentication**: Enter wrong password → Verify error message

5. **Timer Component**
   - Timer counts down correctly
   - Warning colors activate at thresholds
   - onComplete callback fires when time expires

6. **Integration Testing**
   - Test rejoin from "Active Games" quick join button
   - Test multiple participants rejoining same session
   - Test rejoin after session disconnect
   - Verify password security (cannot rejoin without correct password)

## Troubleshooting

### Edge Functions Not Working

1. Check environment variables are set in Netlify UI
2. Verify netlify.toml has edge_functions configuration
3. Check browser console for edge function errors
4. Ensure NETLIFY_PERSONAL_ACCESS_TOKEN has correct scopes

### Blob Store Errors

1. Verify NETLIFY_SITE_ID matches your site
2. Check token has not expired
3. Review edge function logs in Netlify dashboard
4. Test with simpler key-value pairs first

### Ready Status Not Syncing

1. Confirm database migration was applied (isReady column exists)
2. Check Supabase real-time subscriptions are active
3. Verify participantId is correct in markPlayerReady calls
4. Review network tab for failed Supabase queries

## Security Considerations

1. **Edge Functions as Proxy**: Client never directly accesses blob store
2. **Token Security**: NETLIFY_PERSONAL_ACCESS_TOKEN stays server-side
3. **Key Format Validation**: Edge functions validate sessionId:participantId format
4. **Supabase RLS**: Continue using Row Level Security for database access
5. **No Secrets in Client**: All sensitive operations via serverless/edge functions

## Future Enhancements

1. **TTL for Blob Data**: Auto-expire old session data after 24 hours
2. **Compression**: Compress large session objects before storing
3. **Batch Operations**: Support saving multiple participant states at once
4. **Real-time Sync**: WebSocket integration for instant cross-device updates
5. **Analytics**: Track blob store usage and performance metrics

## References

- [Netlify Blobs Documentation](https://docs.netlify.com/build/data-and-storage/netlify-blobs/)
- [Netlify Edge Functions API](https://docs.netlify.com/build/edge-functions/api/)
- [Supabase Real-time Subscriptions](https://supabase.com/docs/guides/realtime)
