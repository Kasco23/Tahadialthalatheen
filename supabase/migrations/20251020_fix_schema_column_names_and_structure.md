# Database Schema Fix Migration - October 20, 2025

## Summary
This migration fixes column naming inconsistencies between the database schema and TypeScript code expectations, enabling proper functionality for Friends, Notifications, and Matches features.

## Changes Made

### 1. Friends Table
- **Renamed columns:**
  - `requester` → `requester_id`
  - `addressee` → `addressee_id`
- **Added column:**
  - `updated_at` (TIMESTAMPTZ)
- **Recreated RLS policies** with new column names
- **Added DELETE policy** for users to remove friendships

### 2. Notifications Table
- **Renamed column:**
  - `user_id` → `recipient_id`
- **Added columns:**
  - `title` (TEXT, default: 'Notification')
  - `link` (TEXT, nullable)
  - `metadata` (JSONB, default: {})
  - `read_at` (TIMESTAMPTZ, nullable)
- **Recreated RLS policies** with new column name
- **Added DELETE policy** for users to delete their notifications

### 3. Matches Table
- **Renamed columns:**
  - `home_player` → `home_player_id`
  - `away_player` → `away_player_id`
  - `winner` → `winner_id`
- **Added columns:**
  - `session_id` (UUID, references Sessions)
  - `home_total_points` (INT, default: 0)
  - `away_total_points` (INT, default: 0)
  - `segments_played` (TEXT[], default: {})
- **Removed column:**
  - `total_points` (migrated data to home_total_points)
- **Added INSERT policy** for players to record matches

### 4. Performance Indexes
Added indexes on frequently queried columns:
- `idx_profiles_username` on Profiles(username)
- `idx_friends_requester_id`, `idx_friends_addressee_id`, `idx_friends_status`
- `idx_notifications_recipient_id`, `idx_notifications_is_read`
- `idx_matches_session_id`, `idx_matches_home_player_id`, `idx_matches_away_player_id`

### 5. Profile Component Updates
- Added username field to profile form
- Username validation: 3-20 characters, lowercase letters, numbers, and underscores only
- Unique constraint enforcement with user-friendly error messages
- Username displayed in profile header

## Breaking Changes
None - this migration fixes existing issues and aligns schema with code expectations.

## Testing Required
- [x] Friends requests work correctly
- [x] Notifications load properly
- [x] Statistics and matches tracking functional
- [x] Profile username can be set and updated
- [x] Friend search by username works

## Rollback
If needed, rollback would require:
1. Reversing all column renames
2. Dropping new columns
3. Recreating original RLS policies

However, this is not recommended as it would break the application code.
