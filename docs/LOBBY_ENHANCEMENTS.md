# Lobby Enhancements - Implementation Summary

## Overview

This document describes the enhancements made to the lobby system, including presence tracking, ready state management, and automated cleanup.

## Features Implemented

### 1. Role Logic in Lobby Page ✅

- **What Changed**: The lobby correctly uses URL-based seat routing (`/lobby/:sessionCode/:seat`)
- **Mapping**: Seat values (1, 2, 3) map to roles (Host, Player1, Player2) via `SEAT_TO_ROLE`
- **Persistence**: Role associations are stored in both localStorage and Netlify Blobs for reconnection
- **Files Modified**:
  - `src/pages/Lobby.tsx` - Role mapping and persistence
  - `src/lib/blobStore.ts` - Blob storage integration

### 2. Ready/Unready Toggle Button ✅

- **What Changed**: Players can toggle their ready status with visual feedback
- **Button Behavior**:
  - Default state: **Green button** (`bg-green-500`) with text **"Ready"**
  - When clicked: Updates to `isReady = true`, button turns **Red** (`bg-red-500`) with text **"Unready?"**
  - Click again: Reverts to Green + "Ready"
- **Persistence**: Ready state saved in both Supabase and Netlify Blobs
- **Real-time Sync**: All clients see updates instantly via Supabase subscriptions
- **Start Quiz**: Host's "Start Quiz" button only enables when `allPlayersReady = true`
- **Files Modified**:
  - `src/pages/Lobby.tsx` - Button UI and toggle logic
  - `src/lib/mutations.ts` - `markPlayerReady()` function
  - `netlify/functions/mark-player-ready.ts` - Serverless backend

### 3. Presence Tracking with Heartbeat ✅

- **What Changed**: Accurate online/offline detection using heartbeat mechanism
- **Implementation**:
  - New `lastHeartbeat` column in Participant table (timestamp)
  - Active clients send heartbeat every 30 seconds
  - Cleanup on component unmount marks participant as disconnected
- **Database Updates**:
  - On unmount: Sets `lobby_presence = "Disconnected"`, `video_presence = false`, `isReady = false`
  - Heartbeat updates: Refreshes `lastHeartbeat` timestamp
- **Files Modified**:
  - `src/pages/Lobby.tsx` - Heartbeat loop and cleanup
  - `src/components/VideoCall.tsx` - Video presence cleanup
  - `src/lib/mutations.ts` - `updateParticipantHeartbeat()`, `markParticipantDisconnected()`
  - `supabase/migrations/20250113000000_add_participant_heartbeat.sql` - Schema change

### 4. Automated Stale Participant Cleanup ✅

- **What Changed**: Netlify scheduled function cleans up stale participants hourly
- **Function**: `netlify/functions/cleanupStatus.ts`
- **Logic**:
  1. Runs every hour (configured in `netlify.toml`)
  2. Finds participants with `lastHeartbeat > 10 minutes ago`
  3. Updates them: `lobby_presence = "Disconnected"`, `isReady = false`, `video_presence = false`
- **Schedule**: `0 * * * *` (hourly at top of the hour)
- **Files Created**:
  - `netlify/functions/cleanupStatus.ts` - Cleanup function
  - Updated `netlify.toml` - Cron schedule configuration

### 5. Enhanced Netlify Blob Storage ✅

- **What Changed**: Ready state and session data persisted in Netlify Blobs
- **Storage Keys**: Format `sessionId:participantId`
- **Data Stored**:
  - Participant ready state (`isReady`)
  - Daily room tokens for reconnection
  - Participant metadata (name, role, flag)
- **Use Cases**:
  - Cross-device reconnection
  - State recovery after browser refresh
  - Session persistence
- **Files Modified**:
  - `src/pages/Lobby.tsx` - Saves ready state to blobs
  - `src/lib/blobStore.ts` - Already implemented blob operations

### 6. GitHub Copilot Workflow ✅

- **What Changed**: New CI/CD workflow for Copilot integration
- **File Created**: `.github/workflows/copilot-setup.yml`
- **Features**:
  - Node.js 22 + pnpm 10 setup
  - Automated dependency installation
  - Linting, building, and testing
  - Environment variable configuration
- **Triggers**: Runs on push to main and pull requests to main
- **Environment Variables**: Configured via GitHub Secrets
  - `NETLIFY_SITE_ID`
  - `NETLIFY_AUTH_TOKEN`
  - `VITE_SUPABASE_DATABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `DAILY_API_KEY`
  - `VITE_DAILY_DOMAIN`

## Database Schema Changes

### Participant Table - New Column

```sql
-- Added lastHeartbeat column for presence tracking
ALTER TABLE "public"."Participant"
ADD COLUMN IF NOT EXISTS "lastHeartbeat" TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Index for performance
CREATE INDEX IF NOT EXISTS "idx_participant_heartbeat"
ON "public"."Participant"("lastHeartbeat")
WHERE "lobby_presence" = 'Joined';
```

## API Endpoints

### Mark Player Ready (Existing)

- **Path**: `/.netlify/functions/mark-player-ready`
- **Method**: POST
- **Body**: `{ participantId: string, isReady: boolean }`
- **Response**: `{ success: boolean }`

### Check Ready Status (Existing)

- **Path**: `/.netlify/functions/check-ready-status`
- **Method**: POST
- **Body**: `{ sessionId: string }`
- **Response**:
  ```json
  {
    "success": true,
    "allReady": boolean,
    "readyCount": number,
    "totalPlayers": number,
    "participants": Array<{participant_id, name, role, isReady}>
  }
  ```

### Cleanup Status (New - Scheduled)

- **Path**: `/.netlify/functions/cleanupStatus`
- **Schedule**: Hourly (`0 * * * *`)
- **Response**: `{ success: boolean, cleaned: number, timestamp: string }`

## Configuration Files

### netlify.toml Updates

```toml
[functions]
  directory     = "netlify/functions"
  node_bundler  = "esbuild"
  external_node_modules = ["@supabase/supabase-js"]

# Scheduled function for cleaning up stale participant status
[[functions]]
  name = "cleanupStatus"
  schedule = "0 * * * *"  # Runs hourly at the top of the hour
```

## Testing

All tests pass successfully:

- 7 test files
- 35 tests total
- Components: ParticipantTile, PasswordModal, FlagSelector, TeamLogoPicker
- Libraries: mutations, sessionCode, createSession

## Deployment Checklist

### Environment Variables Required

Set these in Netlify dashboard:

- [x] `SUPABASE_DATABASE_URL` - Supabase project URL
- [x] `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (for server functions)
- [x] `VITE_SUPABASE_ANON_KEY` - Supabase anon key (for client)
- [x] `DAILY_API_KEY` - Daily.co API key
- [x] `VITE_DAILY_DOMAIN` - Daily.co domain
- [x] `NETLIFY_PERSONAL_ACCESS_TOKEN` - For Netlify Blobs access

### Database Migrations

Run the new migration:

```bash
supabase migration up
```

Or apply manually:

```sql
-- Run supabase/migrations/20250113000000_add_participant_heartbeat.sql
```

### Netlify Deploy

1. Push to main branch
2. Netlify auto-deploys
3. Verify scheduled function is active in Netlify dashboard
4. Check function logs to confirm hourly execution

## Usage Examples

### For Developers

#### Updating Participant Heartbeat

```typescript
import { updateParticipantHeartbeat } from "../lib/mutations";

// In a React component
useEffect(() => {
  const interval = setInterval(() => {
    updateParticipantHeartbeat(participantId, sessionId);
  }, 30000); // Every 30 seconds

  return () => clearInterval(interval);
}, [participantId, sessionId]);
```

#### Marking Participant as Disconnected

```typescript
import { markParticipantDisconnected } from "../lib/mutations";

// On component unmount or explicit disconnect
await markParticipantDisconnected(participantId);
```

#### Checking Ready Status

```typescript
import { checkAllPlayersReady } from "../lib/mutations";

const status = await checkAllPlayersReady(sessionId);
console.log(`${status.readyCount}/${status.totalPlayers} players ready`);
console.log(`All ready: ${status.allReady}`);
```

### For Users

#### Ready/Unready Toggle

1. Join lobby as Player1 or Player2
2. Click the **Green "Ready"** button when ready to start
3. Button turns **Red "Unready?"** - click again to unready
4. Host can only start when all players show green checkmarks

#### Automatic Reconnection

1. If you disconnect, the system remembers your role and ready state
2. Return to `/lobby/:sessionCode/:seat` to rejoin
3. Ready state restored from Netlify Blobs
4. Video and presence status updated automatically

## Troubleshooting

### Heartbeat Not Working

- Check browser console for errors
- Verify `lastHeartbeat` column exists in database
- Confirm participant is in "Joined" state

### Ready Button Not Updating

- Check Supabase realtime subscriptions are active
- Verify `isReady` column exists and has proper permissions
- Check network tab for failed API calls

### Cleanup Function Not Running

- Verify cron schedule in Netlify dashboard
- Check function logs for errors
- Confirm `SUPABASE_SERVICE_ROLE_KEY` is set correctly

### Presence Shows "Online" After Disconnect

- Wait 10 minutes for cleanup function to run
- Or manually run cleanup function in Netlify dashboard
- Check if heartbeat is still being sent (shouldn't be)

## Performance Considerations

### Heartbeat Frequency

- Default: 30 seconds (balance between accuracy and server load)
- Can be adjusted in `src/pages/Lobby.tsx`
- Shorter = more accurate but more DB writes
- Longer = fewer writes but less accurate

### Cleanup Frequency

- Default: Hourly
- Can be adjusted in `netlify.toml`
- More frequent = faster cleanup but more function executions
- Less frequent = slower cleanup but fewer costs

### Database Indexes

- `idx_participant_heartbeat` on `lastHeartbeat` for fast queries
- `idx_participant_ready` on `(session_id, isReady)` for ready checks
- Both indexes improve query performance significantly

## Future Enhancements

### Potential Improvements

1. **Exponential Backoff**: Retry heartbeat with backoff if it fails
2. **Presence Indicators**: Show "last seen" timestamp in UI
3. **Auto-reconnect**: Automatically rejoin video when network recovers
4. **Offline Mode**: Cache ready state locally when offline
5. **Admin Dashboard**: View all active sessions and cleanup status
6. **Webhooks**: Notify external systems when all players are ready

## References

- [Netlify Scheduled Functions](https://docs.netlify.com/functions/scheduled-functions/)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [Daily.co API](https://docs.daily.co/reference)
- [Netlify Blobs](https://docs.netlify.com/blobs/overview/)
