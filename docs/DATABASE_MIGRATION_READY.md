# Database Migration: Add Readiness System

## Overview

This migration adds the `is_ready` boolean field to the `Participant` table to support the lobby readiness system. This allows players to signal when they're ready to start the quiz.

## Migration File

**File**: `supabase/migrations/20251012000000_add_participant_ready_column.sql`

## Changes Made

1. **New Column**: `is_ready BOOLEAN DEFAULT false`
   - Type: Boolean
   - Default: `false`
   - Nullable: No (NOT NULL after default is applied)
   - Purpose: Track player readiness status in lobby

2. **Performance Index**: `idx_participant_ready`
   - Columns: `(session_id, is_ready)`
   - Filter: `WHERE lobby_presence = 'Joined'`
   - Purpose: Optimize queries checking ready status of joined players

3. **Data Cleanup**:
   - Updates existing rows to set `is_ready = false`
   - Ensures consistency across all existing participants

## How to Apply

### Using Supabase CLI (Recommended)

```bash
# Navigate to project root
cd /path/to/Tahadialthalatheen

# Run migration
supabase db push

# Or apply specific migration
supabase migration up
```

### Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to: SQL Editor → New Query
3. Copy and paste the contents of `20251012000000_add_participant_ready_column.sql`
4. Click "Run" to execute

### Manual Application (SQL)

Connect to your database and run:

```sql
-- Add the is_ready column
ALTER TABLE "public"."Participant" 
ADD COLUMN IF NOT EXISTS "is_ready" BOOLEAN DEFAULT false;

-- Add performance index
CREATE INDEX IF NOT EXISTS "idx_participant_ready" 
ON "public"."Participant"("session_id", "is_ready") 
WHERE "lobby_presence" = 'Joined';

-- Update existing rows
UPDATE "public"."Participant" 
SET "is_ready" = false 
WHERE "is_ready" IS NULL;
```

## Verification

After applying the migration, verify it worked:

```sql
-- Check column exists
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'Participant' 
  AND column_name = 'is_ready';

-- Check index exists
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'Participant' 
  AND indexname = 'idx_participant_ready';

-- Verify data
SELECT COUNT(*), is_ready 
FROM "Participant" 
GROUP BY is_ready;
```

Expected results:
- Column `is_ready` should exist with type `boolean` and default `false`
- Index `idx_participant_ready` should exist
- All existing rows should have `is_ready = false`

## Rollback

If you need to rollback this migration:

```sql
-- Remove index
DROP INDEX IF EXISTS "public"."idx_participant_ready";

-- Remove column
ALTER TABLE "public"."Participant" 
DROP COLUMN IF EXISTS "is_ready";
```

**Warning**: Rolling back will remove readiness data. Only do this if necessary.

## Impact Analysis

### Application Impact
- **Minimal**: Application has fallback for missing field
- **Compatible**: Existing code continues to work without migration
- **Enhanced**: New readiness features become available after migration

### Performance Impact
- **Positive**: Index improves ready status queries
- **Negligible**: Boolean column adds minimal storage overhead
- **Optimized**: Partial index only covers joined participants

### Database Size
- Additional storage per row: ~1 byte (boolean)
- Index overhead: Minimal (only joined participants)
- Total estimated increase: < 1 MB for 10,000 participants

## Related Code

### Mutations (src/lib/mutations.ts)

```typescript
// Mark player ready
await markPlayerReady(participantId, true);

// Check all players ready
const { allReady, readyCount } = await checkAllPlayersReady(sessionId);

// Reset all players
await resetAllPlayersReady(sessionId);
```

### Lobby UI (src/pages/Lobby.tsx)

```typescript
// Ready status display
<ParticipantCard
  player={player}
  isReady={readyStates[player.participant_id]}
  onToggleReady={handleToggleReady}
  canToggleReady={isCurrentPlayer}
/>

// Start quiz only when all ready
const canStartQuiz = () => {
  return joinedPlayers.length >= 2 && allPlayersReady;
};
```

## Testing

### Manual Testing Checklist

1. **Apply Migration**
   - [ ] Migration runs without errors
   - [ ] Column added successfully
   - [ ] Index created successfully
   - [ ] Existing data preserved

2. **Readiness System**
   - [ ] Player can mark themselves ready
   - [ ] Ready status displays correctly
   - [ ] Host sees all players' ready status
   - [ ] Start Quiz button enables when all ready

3. **Edge Cases**
   - [ ] Ready status persists across page reload
   - [ ] Ready status resets when appropriate
   - [ ] Works with 2 players minimum
   - [ ] Host/GameMaster not affected by ready requirement

### Automated Tests

Run existing test suite to ensure no regressions:

```bash
pnpm test
```

All tests should pass. The readiness system has defensive checks for missing database field.

## Documentation

- Main integration guide: `docs/NETLIFY_BLOBS_INTEGRATION.md`
- This migration: `docs/DATABASE_MIGRATION_READY.md`
- API reference: See mutations in `src/lib/mutations.ts`

## Support

If you encounter issues:

1. Check Supabase logs for SQL errors
2. Verify your database user has ALTER TABLE permissions
3. Ensure you're connected to the correct database
4. Try running migration statements individually

## Notes

- Migration is idempotent (safe to run multiple times)
- Uses `IF NOT EXISTS` to prevent duplicate columns/indexes
- Compatible with PostgreSQL 13+ (Supabase default)
- No downtime required for application
