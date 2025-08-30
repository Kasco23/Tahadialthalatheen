# Supabase Schema Upgrade Guide

This document provides step-by-step instructions for upgrading the Supabase schema from the current state (games/players/game_events) to the new enhanced structure with sessions, lobbies, rooms, and improved organization.

## Overview

The upgrade transforms:
- `games` → `sessions` (renamed for clarity)
- Adds `lobbies` table for connection state management
- Adds `rooms` table for Daily.co video room tracking
- Adds `session_segments` for granular game segment management
- Adds `questions_pool` and `session_questions` for question management
- Replaces `game_events` with partitioned `session_events`
- Creates new storage buckets for avatars, question media, and recordings
- Implements optimized RLS policies and realtime subscriptions

## Prerequisites

1. **Backup Current Data**: Export existing data before running migrations
2. **Service Role Access**: Storage bucket creation requires service_role key
3. **Extensions**: Ensure `pg_cron` and `pg_partman` are available (optional features)

## Migration Order

### 1. Core Schema Changes (Part 1)
**File**: `20250830_schema_upgrade_part_1.sql`

This migration:
- Renames `games` table to `sessions`
- Updates primary key from `id` to `session_id`
- Updates all foreign key references
- Adds `controller_user_id` for enhanced RLS
- Restructures `players` table with new columns

**Execute**: Run this through Supabase Dashboard SQL Editor or CLI

### 2. New Tables Creation (Part 2)
**File**: `20250830_schema_upgrade_part_2.sql`

This migration:
- Creates `lobbies` table for connection state
- Creates `rooms` table for video room management
- Creates `session_segments` for game segment tracking
- Creates `questions_pool` and `session_questions` for question management
- Creates `session_events` table (with partitioning preparation)

**Execute**: Run through Supabase Dashboard SQL Editor

### 3. Row Level Security (Part 3)
**File**: `20250830_schema_upgrade_part_3.sql`

This migration:
- Creates optimized RLS policies for all new tables
- Implements proper access control for controllers and players
- Optimizes auth function calls to address advisor warnings

**Execute**: Run through Supabase Dashboard SQL Editor

### 4. Storage Buckets (Part 4)
**File**: `20250830_schema_upgrade_part_4_storage.sql`

This migration:
- Creates `avatars`, `question_media`, and `recordings` buckets
- Sets up storage policies for public read and owner write access
- Configures service-role access for recordings

**Execute**: Requires service_role permissions - run with service key

### 5. Realtime and Cleanup (Part 5)
**File**: `20250830_schema_upgrade_part_5_realtime.sql`

This migration:
- Updates realtime publication to include new tables
- Creates housekeeping functions for expired sessions
- Sets up activity tracking triggers
- Prepares cron jobs for automated cleanup

**Execute**: Run through Supabase Dashboard SQL Editor

## Post-Migration Steps

### 1. Update TypeScript Types
```bash
pnpm supabase gen types typescript --linked > src/types/supabase.ts
```

### 2. Verify Realtime Subscriptions
Check that all new tables are included in realtime publication:
```sql
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';
```

### 3. Test RLS Policies
Verify that policies work correctly by testing with different user roles:
- Controller (session owner)
- PlayerA and PlayerB
- Unauthenticated users

### 4. Update Frontend Code
Update React components to use new table names and structure:
- `games` → `sessions`
- `game_id` → `session_id`
- New tables: `lobbies`, `rooms`, `session_segments`

### 5. Update Netlify Functions
Modify serverless functions to work with new schema:
- Video room creation should populate `rooms` table
- Game state changes should update `session_segments`
- Event logging should use `session_events`

## Storage Bucket Usage

### Avatars Bucket
- **Purpose**: User profile pictures and avatars
- **Access**: Public read, owner write
- **Frontend**: `supabase.storage.from('avatars').upload(...)`

### Question Media Bucket
- **Purpose**: Images and media for quiz questions
- **Access**: Public read, owner write
- **Frontend**: `supabase.storage.from('question_media').getPublicUrl(...)`

### Recordings Bucket
- **Purpose**: Daily.co video recordings
- **Access**: Service role only
- **Usage**: Netlify functions with service key

## Rollback Plan

If issues arise, rollback order:
1. Stop using new tables in application code
2. Remove realtime subscriptions to new tables
3. Drop new tables (data will be lost)
4. Rename `sessions` back to `games`
5. Restore original foreign key relationships

## Performance Optimizations

The new schema addresses advisor warnings:
- **RLS Optimization**: Auth function calls wrapped in subselects
- **Indexing**: Composite indexes on frequently queried columns
- **Partitioning**: `session_events` prepared for monthly partitioning
- **Activity Tracking**: Efficient triggers for session activity updates

## Monitoring

After migration, monitor:
- Query performance on new tables
- RLS policy execution times
- Storage bucket usage and access patterns
- Realtime subscription performance

## Troubleshooting

### Common Issues
1. **Permission Denied**: Ensure proper role access for each migration part
2. **Foreign Key Violations**: Check data consistency before running migrations
3. **RLS Policy Conflicts**: Test policies with actual user contexts
4. **Storage Access**: Verify bucket policies and service key permissions

### Recovery Steps
1. Check migration logs in Supabase Dashboard
2. Verify data integrity with `SELECT` queries
3. Test functionality with different user roles
4. Monitor error logs in application

## Next Steps

After successful migration:
1. **Data Migration**: Populate new tables with existing game data
2. **Frontend Updates**: Update all React components and hooks
3. **API Updates**: Modify Netlify functions for new schema
4. **Testing**: Comprehensive testing of all user flows
5. **Documentation**: Update API documentation and user guides

---

**Important**: Always test migrations in a development environment before applying to production.
