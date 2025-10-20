# Player Role Migration: Player1/Player2 → Home/Away

**Date**: October 20, 2025  
**Status**: ✅ Complete

## Summary

Successfully migrated all references of "Player1"/"Player 1"/"Player A" to "Home" and "Player2"/"Player 2"/"Player B" to "Away" throughout the entire codebase and database schema.

## Database Changes

### Migration Applied
- **Migration Name**: `rename_player_roles_to_home_away`
- **File**: Created in Supabase migrations

### Changes Made:
1. ✅ Dropped old `Participants_role_check` constraint
2. ✅ Updated all existing `Player1` records to `Home`
3. ✅ Updated all existing `Player2` records to `Away`
4. ✅ Added new constraint allowing: `Host`, `Home`, `Away`, `GameMaster`, `Guest`
5. ✅ Updated column comment to reflect new terminology

### SQL Executed:
```sql
-- Updated constraint
ALTER TABLE "public"."Participants" 
ADD CONSTRAINT "Participants_role_check" 
CHECK (("role" = ANY (ARRAY['Host'::text, 'Home'::text, 'Away'::text, 'GameMaster'::text, 'Guest'::text])));

-- Data migration
UPDATE "public"."Participants" SET "role" = 'Home' WHERE "role" = 'Player1';
UPDATE "public"."Participants" SET "role" = 'Away' WHERE "role" = 'Player2';
```

## Code Changes

### Type Definitions (`src/lib/types/index.ts`)

```typescript
// BEFORE
export type ParticipantRole = "Host" | "Player1" | "Player2" | "GameMaster";

export const PARTICIPANT_ROLE = {
  HOST: "Host" as const,
  PLAYER1: "Player1" as const,
  PLAYER2: "Player2" as const,
  GAME_MASTER: "GameMaster" as const,
};

export const ROLE_DISPLAY_LABELS: Record<ParticipantRole, string> = {
  Host: "Host",
  Player1: "Home",
  Player2: "Away",
  GameMaster: "Game Master",
};

export type SeatRole = "host" | "player1" | "player2";

// AFTER
export type ParticipantRole = "Host" | "Home" | "Away" | "GameMaster";

export const PARTICIPANT_ROLE = {
  HOST: "Host" as const,
  HOME: "Home" as const,  // Formerly Player1
  AWAY: "Away" as const,  // Formerly Player2
  GAME_MASTER: "GameMaster" as const,
};

export const ROLE_DISPLAY_LABELS: Record<ParticipantRole, string> = {
  Host: "Host",
  Home: "Home",
  Away: "Away",
  GameMaster: "Game Master",
};

export type SeatRole = "host" | "home" | "away";
```

### Files Modified

#### 1. **Core Types & Constants**
- ✅ `src/lib/types/index.ts` - Updated type definitions and constants

#### 2. **Database Mutations** (`src/lib/mutations.ts`)
- ✅ `joinAsPlayerWithCode()` - Updated role assignment logic
- ✅ `getActiveSessions()` - Updated player counting logic
- ✅ `checkAllPlayersReady()` - Updated role filtering
- ✅ `resetAllPlayersReady()` - Updated role filtering
- ✅ `checkAvailableSeats()` - Updated available seats logic
- ✅ Updated all database queries with `.in("role", ["Home", "Away"])`

#### 3. **Component Updates**
- ✅ `src/components/ActiveGames.tsx` - Updated seat navigation logic
- ✅ `src/components/LobbyStatus.tsx` - Updated participant filtering
- ✅ `src/components/ParticipantTile.test.tsx` - Updated test data

#### 4. **Page Updates**
- ✅ `src/pages/Lobby.tsx` - Updated all role references and mappings
  - Role display function
  - Seat-to-role conversions (3 occurrences)
  - Player slot rendering
  - Heartbeat mechanism
  - Presence tracking
  - Leave lobby handler
- ✅ `src/pages/JoinSimplified.tsx` - Updated role assignment logic
- ✅ `src/pages/Results.tsx` - Updated player finding logic

#### 5. **Helper Functions**
- ✅ `src/lib/joinHelpers.ts` - Updated participant filtering

## Video Component Update

As part of this update, the `ParticipantTile.tsx` component was also simplified:
- ✅ Removed flag and team logo from video overlay
- ✅ Removed role display from video overlay
- ✅ Now shows only player name in video frame

## Display Labels

The role display labels have been updated throughout the application:

| Old Value | New Value | Display Label | Icon |
|-----------|-----------|---------------|------|
| `Player1` | `Home` | "Home" | ⚽ |
| `Player2` | `Away` | "Away" | 🏆 |
| `Host` | `Host` | "Host" | 👑 |
| `GameMaster` | `GameMaster` | "Game Master" | 🎮 |

## Seat Routing Updates

Seat-based routing has been updated:

| Seat ID | Old Role | New Role |
|---------|----------|----------|
| `1` | `host` | `host` |
| `2` | `player1` | `home` |
| `3` | `player2` | `away` |

## Testing

### Compilation Status
- ✅ No TypeScript errors
- ✅ All files compile successfully
- ⚠️ Pre-existing complexity warnings (unrelated to changes)

### Codacy Analysis
- ✅ ESLint: No issues found
- ✅ Semgrep: No security issues
- ✅ Trivy: No vulnerabilities

### Manual Testing Required
- [ ] Create new session as Host
- [ ] Join session as Home player
- [ ] Join session as Away player
- [ ] Verify lobby displays correct roles
- [ ] Verify video call shows player names only
- [ ] Verify game progression with new roles
- [ ] Test rejoin functionality
- [ ] Verify match results recording

## Backward Compatibility

### Database
- ✅ All existing data migrated automatically
- ✅ Old `Player1`/`Player2` values converted to `Home`/`Away`
- ⚠️ **Breaking**: Old API calls using `Player1`/`Player2` will fail constraint checks

### Frontend
- ✅ All references updated
- ✅ Display labels updated
- ✅ No legacy code remains

## Deployment Notes

1. **Database migration runs automatically** via Supabase
2. **Frontend changes** require redeployment
3. **No downtime** - migration is backward compatible with data
4. **Post-deployment verification**:
   - Check that new sessions create `Home`/`Away` participants
   - Verify existing sessions display updated roles
   - Test full game flow end-to-end

## Documentation Updates Needed

- [ ] Update README.md player role references
- [ ] Update API documentation
- [ ] Update user-facing documentation (if any)
- [ ] Update developer onboarding docs

## Related Issues

This change improves code clarity and aligns with the application's sports/football theme where "Home" and "Away" are more intuitive than "Player1" and "Player2".

## Rollback Plan

If rollback is needed:

```sql
-- Rollback migration
ALTER TABLE "public"."Participants" DROP CONSTRAINT "Participants_role_check";
UPDATE "public"."Participants" SET "role" = 'Player1' WHERE "role" = 'Home';
UPDATE "public"."Participants" SET "role" = 'Player2' WHERE "role" = 'Away';
ALTER TABLE "public"."Participants" 
ADD CONSTRAINT "Participants_role_check" 
CHECK (("role" = ANY (ARRAY['Host'::text, 'Player1'::text, 'Player2'::text, 'GameMaster'::text, 'Guest'::text])));
```

Then revert code changes via Git.

---

## Success Criteria

✅ Database schema updated  
✅ All TypeScript types updated  
✅ All components updated  
✅ All mutations updated  
✅ All tests updated  
✅ No compilation errors  
✅ Codacy analysis passed  
⏳ Manual testing pending
