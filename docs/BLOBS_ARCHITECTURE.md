# Netlify Blobs Architecture Implementation Plan

## Overview
This document outlines the comprehensive Blobs architecture for Tahadialthalatheen quiz application, designed to work seamlessly with Supabase, Jotai atoms, localStorage, and browser cache.

## Current State Analysis

### Existing Blobs Usage ✅
1. **Edge Functions**:
   - `get-session.ts` - Uses `session-data` store
   - `set-session.ts` - Uses `session-data` store with strong consistency
   - `session-state.ts` - Uses `session-state` store with strong consistency

2. **Serverless Functions**:
   - `store-active-profile.mts` - Uses `active-profiles` store with strong consistency
   - `get-active-profile.mts` - Uses `active-profiles` store with strong consistency

### Issues Identified 🔧

#### 1. **Edge Functions Syntax** - ✅ CORRECT
- All edge functions use proper `getStore()` import and syntax
- Strong consistency configured correctly
- Error handling present

#### 2. **Serverless Functions Syntax** - ✅ CORRECT  
- Use `@netlify/functions` Context and Config types correctly
- Use `Netlify.env.get()` for environment variables (where needed)
- Have Config exports with custom paths
- Use strong consistency for blobs

#### 3. **Store Naming Inconsistency** - ⚠️ NEEDS ALIGNMENT
- `session-data` vs `session-state` - Two different stores for similar purposes
- `active-profiles` for participant data - Not aligned with new comprehensive schema

#### 4. **Missing Integration** - ❌ TODO
- No Jotai atom integration with Blobs
- No automatic cache invalidation
- No sync with Supabase database
- No cross-device continuity hooks
- No offline-first strategy

## Proposed Architecture

### Store Structure

```
Global Stores (cross-deploy, production only):
├── sessions               # Session-level configuration and state
├── participants           # Cross-device participant profiles  
└── lobby-snapshots       # Quick recovery snapshots

Deploy Stores (per-deployment):
├── dev-sessions          # Development environment sessions
├── dev-participants      # Development environment participants
└── dev-lobby-snapshots   # Development environment snapshots
```

### Data Models

#### SessionBlobData
```typescript
{
  session_id: string
  session_code: string
  host_profile_id: string | null
  daily_room_url: string | null
  daily_room_name: string | null
  phase: SessionPhase
  game_state: GameState
  segments_configured: boolean
  active_participant_ids: string[]
  participant_count: number
  created_at: string
  last_updated: string
  metadata?: Record<string, unknown>
}
```

#### ParticipantBlobData
```typescript
{
  participant_id: string
  profile_id: string | null
  name: string
  username: string | null
  flag: string
  team: string | null
  team_logo_url: string | null
  current_session_id: string | null
  current_session_code: string | null
  role: ParticipantRole
  lobby_presence: LobbyPresence
  video_presence: boolean
  last_heartbeat: string
  join_at: string | null
  disconnect_at: string | null
  device_id: string
  last_device_sync: string
  preferred_flag: string | null
  preferred_team: string | null
  audio_enabled: boolean
  video_enabled: boolean
  session_history: string[]
  metadata?: Record<string, unknown>
}
```

#### LobbySnapshotData
```typescript
{
  session_id: string
  session_code: string
  snapshot_timestamp: string
  participants: ParticipantSnapshot[]
  phase: string
  daily_room_url: string | null
  participant_count: number
}
```

### Integration Strategy

#### 1. **Supabase → Blobs → Jotai → UI** (Read Path)
```
Supabase (source of truth)
    ↓
Blobs (fast cross-device cache)
    ↓
Browser Cache API (5min TTL)
    ↓
Jotai Atoms (reactive state)
    ↓
React Components (UI)
```

#### 2. **UI → Jotai → Blobs → Supabase** (Write Path)
```
User Action
    ↓
Jotai Atom Update (optimistic)
    ↓
Blobs Write (fast persistence)
    ↓
Supabase Write (authoritative)
    ↓
Invalidate Cache
    ↓
Re-sync if needed
```

## Implementation Tasks

### Phase 1: Core Infrastructure ✅ (Completed)
- [x] Create `blobsManager.ts` with comprehensive types
- [x] Implement cache wrapper (Browser Cache API + memory)
- [x] Build session blob operations (get, save, update)
- [x] Build participant blob operations (get, save)
- [x] Build lobby snapshot operations
- [x] Add device ID generation
- [x] Add cache invalidation utilities

### Phase 2: Function Updates (In Progress)
- [ ] Update `store-active-profile.mts` with enhanced participant schema
- [ ] Update `get-active-profile.mts` with cache awareness
- [ ] Create new `sync-participant.mts` for Supabase sync
- [ ] Update `session-state.ts` edge function with full SessionBlobData
- [ ] Add environment-aware store selection (prod vs dev)

### Phase 3: Jotai Integration (Planned)
- [ ] Create `blobAtoms.ts` with blob-backed atoms
- [ ] Add auto-sync hooks for session atoms
- [ ] Add auto-sync hooks for participant atoms
- [ ] Implement optimistic updates with rollback
- [ ] Add real-time sync with Supabase subscriptions

### Phase 4: Component Integration (Planned)
- [ ] Update GameSetup.tsx to use session blobs
- [ ] Update Lobby.tsx to use participant blobs + snapshots
- [ ] Add offline detection and fallback
- [ ] Add cross-device session recovery
- [ ] Add "Continue on another device" feature

### Phase 5: Testing & Optimization (Planned)
- [ ] Test cross-device continuity
- [ ] Test offline mode with localStorage fallback
- [ ] Test cache invalidation strategies
- [ ] Optimize blob read/write patterns
- [ ] Add error boundaries and retry logic
- [ ] Performance profiling

## Usage Examples

### Example 1: Store Session Data in GameSetup
```typescript
import { saveSessionBlob } from '../lib/blobsManager';

// After creating Daily room
const sessionData: SessionBlobData = {
  session_id: sessionId,
  session_code: sessionCode,
  host_profile_id: user.id,
  daily_room_url: roomUrl,
  daily_room_name: roomName,
  daily_room_created_at: new Date().toISOString(),
  phase: 'Setup',
  game_state: 'pre-quiz',
  segments_configured: false,
  active_participant_ids: [hostParticipantId],
  participant_count: 1,
  max_participants: 10,
  created_at: new Date().toISOString(),
  last_updated: new Date().toISOString(),
  last_sync_with_supabase: new Date().toISOString(),
};

const result = await saveSessionBlob(sessionData);
if (result.success) {
  console.log('Session saved to blobs!');
}
```

### Example 2: Load Participant Data on Page Load
```typescript
import { getParticipantBlob } from '../lib/blobsManager';

// On component mount
useEffect(() => {
  const loadParticipant = async () => {
    const participantId = localStorage.getItem('participantId');
    if (!participantId) return;

    const result = await getParticipantBlob(participantId);
    if (result.success && result.data) {
      // Restore participant state
      setName(result.data.name);
      setFlag(result.data.flag);
      setTeam(result.data.team);
      setPreferredSettings({
        audio: result.data.audio_enabled,
        video: result.data.video_enabled,
      });
    }
  };

  loadParticipant();
}, []);
```

### Example 3: Save Lobby Snapshot Periodically
```typescript
import { saveLobbySnapshot } from '../lib/blobsManager';

// In Lobby.tsx - save snapshot every 30 seconds
useEffect(() => {
  const interval = setInterval(async () => {
    if (!sessionId || participants.length === 0) return;

    const snapshot: LobbySnapshotData = {
      session_id: sessionId,
      session_code: sessionCode,
      snapshot_timestamp: new Date().toISOString(),
      participants: participants.map(p => ({
        participant_id: p.participant_id,
        name: p.Profiles?.name || 'Unknown',
        role: p.role,
        flag: p.Profiles?.flag || 'sa',
        team: p.Profiles?.team,
        lobby_presence: p.lobby_presence,
        video_presence: p.video_presence,
        join_at: p.join_at,
      })),
      phase: session?.phase || 'Lobby',
      daily_room_url: dailyRoomUrl,
      participant_count: participants.length,
    };

    await saveLobbySnapshot(snapshot);
  }, 30000);

  return () => clearInterval(interval);
}, [sessionId, participants, dailyRoomUrl]);
```

## Key Design Principles

1. **Supabase is Source of Truth**: Always treat Supabase as authoritative data
2. **Blobs for Speed**: Use Blobs for fast cross-device access and session persistence
3. **Cache for Performance**: Use Browser Cache API to minimize network requests
4. **localStorage for Offline**: Fallback to localStorage when network unavailable
5. **Jotai for Reactivity**: Keep UI responsive with optimistic updates
6. **Strong Consistency**: Use `consistency: "strong"` for all participant/session data
7. **Environment Awareness**: Use global stores in production, deploy stores in dev
8. **Metadata Rich**: Store comprehensive metadata for debugging and analytics

## Benefits

### For Users
- ✅ Seamless cross-device experience
- ✅ Continue sessions on different devices
- ✅ Faster load times (cached data)
- ✅ Offline resilience
- ✅ No data loss on page refresh

### For Developers
- ✅ Clear data flow architecture
- ✅ Easy to debug (rich metadata)
- ✅ Testable (each layer isolated)
- ✅ Scalable (proper caching strategy)
- ✅ Maintainable (single source of truth)

## Monitoring & Debugging

### Cache Hit Rates
```typescript
// Track cache performance
const cacheStats = {
  hits: 0,
  misses: 0,
  hitRate: () => hits / (hits + misses)
};
```

### Blob Operation Logs
```typescript
// All blob operations log:
// - Timestamp
// - Operation type (get/set/delete)
// - Data source (blob/cache/localStorage/supabase)
// - Success/failure
// - Latency
```

### Error Recovery
```typescript
// Automatic fallback chain:
Blobs → Cache → localStorage → Supabase → Error
```

## Next Steps

1. ✅ Review this plan with team
2. 🔄 Complete Phase 2 (Function Updates)
3. ⏳ Start Phase 3 (Jotai Integration)
4. ⏳ Implement Phase 4 (Component Integration)
5. ⏳ Execute Phase 5 (Testing & Optimization)
