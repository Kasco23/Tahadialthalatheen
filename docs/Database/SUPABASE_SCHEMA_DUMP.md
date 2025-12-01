# Supabase Database Schema - Complete Dump

**Generated:** December 1, 2025  
**Project:** Tahadialthalatheen - Football Quiz Application

---

## Table of Contents

1. [Database Tables](#database-tables)
2. [Storage Configuration](#storage-configuration)
3. [Database Functions](#database-functions)
4. [Database Triggers](#database-triggers)
5. [Database Views](#database-views)
6. [RLS Policies](#rls-policies)
7. [Extensions](#extensions)
8. [Edge Functions](#edge-functions)
9. [Migrations History](#migrations-history)
10. [Security Advisories](#security-advisories)

---

## Database Tables

### Public Schema Tables

#### 1. **Sessions**

Primary table for quiz sessions.

**Columns:**

- `session_id` (uuid, PK) - Unique session identifier
- `session_code` (text, unique) - 6-character session code for joining
- `phase` (text) - Session phase: Setup, Lobby, Full Lobby, In-Progress, Tie-Breaker, Results, Review
- `game_state` (text) - Game state: pre-quiz, active, post-quiz, concluded
- `host_profile_id` (uuid, FK → Profiles.id) - Host's profile ID
- `created_at` (timestamptz) - Session creation timestamp
- `ended_at` (timestamptz, nullable) - Session end timestamp

**RLS:** Enabled  
**Rows:** 2

---

#### 2. **Participants**

Tracks participants in sessions.

**Columns:**

- `participant_id` (uuid, PK) - Unique participant identifier
- `session_id` (uuid, FK → Sessions.session_id)
- `profile_id` (uuid, FK → Profiles.id, nullable)
- `role` (text) - Host, Home, Away, GameMaster, Guest
- `join_at` (timestamptz, nullable)
- `disconnect_at` (timestamptz, nullable)
- `video_presence` (boolean) - Default: false
- `lobby_presence` (text) - NotJoined, Joined, Disconnected
- `lastHeartbeat` (timestamptz) - Default: now()
- `powerup_pass_used` (boolean) - Default: false
- `powerup_alhabeed` (boolean) - Default: false
- `powerup_bellegoal` (boolean) - Default: false
- `powerup_slippyg` (boolean) - Default: false

**RLS:** Enabled  
**Rows:** 2

**Comment:** RLS optimized: Single SELECT policy for all roles

---

#### 3. **Profiles**

User profile information.

**Columns:**

- `id` (uuid, PK, FK → auth.users.id) - User ID from auth
- `username` (text, unique) - Must be >= 3 chars
- `name` (text) - Display name, 2-40 chars
- `team` (text, nullable) - Favorite team
- `flag` (text, nullable) - Country flag
- `avatar_url` (text, nullable)
- `created_at` (timestamptz) - Default: now()
- `updated_at` (timestamptz) - Default: now()

**RLS:** Enabled  
**Rows:** 0

---

#### 4. **Questions**

Quiz questions for all segments.

**Columns:**

- `question_id` (uuid, PK) - Unique question identifier
- `segment_code` (text) - WDYK, AUCT, BELL, UPDW, REMO
- `question_type` (text) - 'list' or 'buzz'
- `question_text` (text) - The question
- `answers` (jsonb) - Array for list, string for buzz
- `total_answers_available` (integer, nullable) - For 100+ scenarios

**RLS:** Enabled  
**Rows:** 6

**Comment:** Quiz questions with segment-specific data

---

#### 5. **SessionQuestions**

Links sessions to selected questions.

**Columns:**

- `session_question_id` (uuid, PK)
- `session_id` (uuid, FK → Sessions.session_id)
- `question_id` (uuid, FK → Questions.question_id)
- `segment_code` (text)
- `display_order` (integer) - Order during quiz
- `created_at` (timestamptz) - Default: now()

**RLS:** Enabled  
**Rows:** 0

**Comment:** Links quiz sessions to specific questions selected by the host

---

#### 6. **Scores**

Player scoring per segment.

**Columns:**

- `score_id` (uuid, PK)
- `session_id` (uuid, FK → Sessions.session_id)
- `participant_id` (uuid, FK → Participants.participant_id)
- `segment_code` (text) - WDYK, AUCT, BELL, UPDW, REMO
- `points` (integer) - Default: 0

**RLS:** Enabled  
**Rows:** 0

**Comment:** RLS optimized: Single SELECT policy for all roles

---

#### 7. **Strikes**

Tracks player strikes (WDYK segment).

**Columns:**

- `strike_id` (uuid, PK)
- `session_id` (uuid, FK → Sessions.session_id)
- `participant_id` (uuid, FK → Participants.participant_id)
- `segment_code` (text) - Must be 'WDYK'
- `strikes` (integer) - Default: 0

**RLS:** Enabled  
**Rows:** 0

---

#### 8. **SegmentConfig**

Configuration for quiz segments per session.

**Columns:**

- `config_id` (uuid, PK)
- `session_id` (uuid, FK → Sessions.session_id)
- `segment_code` (text) - WDYK, AUCT, BELL, UPDW, REMO
- `questions_count` (integer)

**RLS:** Enabled  
**Rows:** 0

---

#### 9. **quiz_buzzes**

Buzzer press history for buzz questions.

**Columns:**

- `buzz_id` (uuid, PK)
- `session_id` (uuid, FK → Sessions.session_id)
- `participant_id` (uuid, FK → Participants.participant_id)
- `question_id` (uuid, FK → Questions.question_id, nullable)
- `buzz_ts` (timestamptz) - Default: now()
- `latency_ms` (integer, nullable)
- `created_at` (timestamptz) - Default: now()

**RLS:** Enabled  
**Rows:** 0

**Comment:** Buzzer press history with timestamps for race resolution

---

#### 10. **DailyRooms**

Video call room configuration.

**Columns:**

- `room_id` (uuid, PK, FK → Sessions.session_id)
- `room_url` (text) - Daily.co room URL
- `active_participants` (jsonb) - Default: []
- `host_permissions` (jsonb) - Default: {}
- `ready` (boolean) - Default: false

**RLS:** Enabled  
**Rows:** 2

---

#### 11. **Friends**

Friend relationships between users.

**Columns:**

- `id` (bigint, PK) - Auto-increment
- `requester_id` (uuid, FK → Profiles.id, nullable) - Who sent request
- `addressee_id` (uuid, FK → Profiles.id, nullable) - Who received request
- `status` (text) - pending, accepted, declined (Default: pending)
- `created_at` (timestamptz) - Default: now()
- `updated_at` (timestamptz) - Default: now()

**RLS:** Enabled  
**Rows:** 0

---

#### 12. **Notifications**

User notifications system.

**Columns:**

- `id` (bigint, PK) - Auto-increment
- `recipient_id` (uuid, FK → Profiles.id, nullable) - User receiving notification
- `sender_id` (uuid, FK → Profiles.id, nullable)
- `type` (text) - friend_request, friend_accept, match_invite, message
- `title` (text) - Default: 'Notification'
- `message` (text, nullable)
- `link` (text, nullable)
- `metadata` (jsonb) - Default: {}
- `is_read` (boolean) - Default: false
- `read_at` (timestamptz, nullable)
- `created_at` (timestamptz) - Default: now()

**RLS:** Enabled  
**Rows:** 0

---

#### 13. **Matches**

Historical match records.

**Columns:**

- `id` (bigint, PK) - Auto-increment
- `session_id` (uuid, FK → Sessions.session_id, nullable)
- `home_player_id` (uuid, FK → Profiles.id, nullable)
- `away_player_id` (uuid, FK → Profiles.id, nullable)
- `winner_id` (uuid, FK → Profiles.id, nullable)
- `home_total_points` (integer) - Default: 0
- `away_total_points` (integer) - Default: 0
- `segments_played` (text[]) - Default: {}
- `created_at` (timestamptz) - Default: now()

**RLS:** Enabled  
**Rows:** 0

**Comment:** Array of segment codes played in this match

---

### Auth Schema Tables

#### auth.users

Core authentication table (managed by Supabase Auth).

**Key Columns:**

- `id` (uuid, PK)
- `email` (varchar, nullable)
- `encrypted_password` (varchar, nullable)
- `email_confirmed_at` (timestamptz, nullable)
- `raw_user_meta_data` (jsonb, nullable)
- `created_at` (timestamptz, nullable)
- `updated_at` (timestamptz, nullable)

**RLS:** Enabled  
**Rows:** 0

---

### Storage Schema Tables

#### storage.buckets

Storage bucket configuration.

**Columns:**

- `id` (text, PK)
- `name` (text)
- `owner_id` (text, nullable)
- `public` (boolean) - Default: false
- `file_size_limit` (bigint, nullable)
- `allowed_mime_types` (text[], nullable)
- `type` (buckettype) - STANDARD, ANALYTICS, VECTOR
- `created_at` (timestamptz) - Default: now()
- `updated_at` (timestamptz) - Default: now()

**RLS:** Enabled  
**Rows:** 0

---

#### storage.objects

Stored objects/files.

**Columns:**

- `id` (uuid, PK)
- `bucket_id` (text, FK → buckets.id, nullable)
- `name` (text, nullable)
- `owner_id` (text, nullable)
- `metadata` (jsonb, nullable)
- `version` (text, nullable)
- `user_metadata` (jsonb, nullable)
- `created_at` (timestamptz) - Default: now()
- `updated_at` (timestamptz) - Default: now()
- `last_accessed_at` (timestamptz) - Default: now()

**RLS:** Enabled  
**Rows:** 0

---

## Database Functions

### 1. **generate_session_code()**

**Type:** Trigger Function  
**Returns:** trigger  
**Language:** plpgsql

**Purpose:** Generates a cryptographically secure 6-character session code (3 digits + 3 letters, shuffled).

**Security:** Uses `gen_random_bytes()` from pgcrypto for secure randomness.

---

### 2. **get_buzz_winner(p_session_id uuid, p_question_id uuid)**

**Type:** Function  
**Returns:** uuid  
**Language:** sql  
**Stability:** STABLE

**Purpose:** Returns the participant_id of the winner for a buzz question (earliest buzz_ts, ties broken by latency_ms).

---

### 3. **get_question_difficulty(question_uuid uuid)**

**Type:** Function  
**Returns:** text  
**Language:** plpgsql

**Purpose:** Calculates question difficulty based on historical success rate:

- Unrated: No data
- Easy: >= 80%
- Medium: >= 50%
- Hard: >= 30%
- Very Hard: < 30%

**Note:** References `player_question_history` table (may not exist yet).

---

### 4. **handle_new_user()**

**Type:** Trigger Function  
**Returns:** trigger  
**Language:** plpgsql  
**Security:** DEFINER  
**Search Path:** public, auth

**Purpose:** Automatically creates a profile when a new user signs up via auth.users.

**Inserts:**

- `id` from auth.users.id
- `name` from metadata or defaults to 'Player'
- `username` from metadata or email prefix

---

### 5. **notify_friend_activity()**

**Type:** Trigger Function  
**Returns:** trigger  
**Language:** plpgsql  
**Security:** DEFINER

**Purpose:** Automatically creates notifications for friend requests and acceptances.

**Logic:**

- INSERT + status='pending' → Notification to addressee
- UPDATE + status='accepted' → Notification to requester

---

### 6. **touch_profiles_updated_at()**

**Type:** Trigger Function  
**Returns:** trigger  
**Language:** plpgsql

**Purpose:** Updates `updated_at` timestamp on Profiles table updates.

---

### 7. **update_quiz_state_timestamp()**

**Type:** Trigger Function  
**Returns:** trigger  
**Language:** plpgsql

**Purpose:** Updates `updated_at` timestamp for quiz state changes.

---

### 8. **update_updated_at_column()**

**Type:** Trigger Function  
**Returns:** trigger  
**Language:** plpgsql

**Purpose:** Generic trigger to update `updated_at` column.

---

### 9. **validate_question_answers()**

**Type:** Trigger Function  
**Returns:** trigger  
**Language:** plpgsql

**Purpose:** Validates question answers match question type:

- `buzz` → Single string
- `list` → Non-empty array

---

## Database Triggers

### 1. **friends_notify_trigger**

**Table:** Friends  
**Timing:** AFTER INSERT OR UPDATE  
**Function:** notify_friend_activity()

---

### 2. **trg_profiles_touch**

**Table:** Profiles  
**Timing:** BEFORE UPDATE  
**Function:** touch_profiles_updated_at()

---

### 3. **trigger_questions_updated_at**

**Table:** Questions  
**Timing:** BEFORE UPDATE  
**Function:** update_quiz_state_timestamp()

---

### 4. **validate_question_answers_trigger**

**Table:** Questions  
**Timing:** BEFORE INSERT OR UPDATE  
**Function:** validate_question_answers()

---

### 5. **set_session_code**

**Table:** Sessions  
**Timing:** BEFORE INSERT  
**Condition:** session_code IS NULL OR session_code = ''  
**Function:** generate_session_code()

---

## Database Views

### 1. **UserInbox**

**Purpose:** Simplified notification view for current user.

**Columns:**

- id, recipient_id, type, message, is_read, created_at
- sender_name (joined from Profiles)

**Filter:** recipient_id = auth.uid()  
**Order:** created_at DESC

---

### 2. **leaderboard_matches**

**Purpose:** Enriched match history with player details.

**Columns:**

- Match: id, created_at, session_id, points, segments_played
- Home Player: id, username, name, flag, team, avatar_url
- Away Player: id, username, name, flag, team, avatar_url
- Winner: id, username, name

**Order:** created_at DESC

---

### 3. **leaderboard_players**

**Purpose:** Player statistics and rankings.

**Columns:**

- Player: id, username, name, flag, team, avatar_url
- Stats: games_played, wins, losses, total_points, win_rate

**Filter:** games_played > 0  
**Order:** wins DESC, total_points DESC

---

## RLS Policies

### Sessions Table

1. **Anyone can create a session** (INSERT)
   - Roles: public
   - Policy: true

2. **Only host can update session state** (UPDATE)
   - Roles: public
   - Policy: true

3. **Sessions are readable** (SELECT)
   - Roles: public
   - Policy: true

---

### Participants Table

1. **Participants can join sessions** (INSERT)
   - Roles: public
   - Policy: true

2. **Allow participant updates** (UPDATE)
   - Roles: public
   - Policy: true

3. **Participants are readable** (SELECT)
   - Roles: public
   - Policy: true

---

### Profiles Table

1. **profiles_public_read** (SELECT)
   - Roles: public
   - Policy: true

2. **profiles_self_insert** (INSERT)
   - Roles: authenticated
   - Policy: id = auth.uid()

3. **profiles_self_update** (UPDATE)
   - Roles: authenticated
   - Policy: id = auth.uid()

---

### Questions Table

1. **Everyone can read questions** (SELECT)
   - Roles: public
   - Policy: true

2. **Authenticated users can insert questions** (INSERT)
   - Roles: public
   - Policy: auth.uid() IS NOT NULL

3. **Authenticated users can update questions** (UPDATE)
   - Roles: public
   - Policy: auth.uid() IS NOT NULL

4. **Authenticated users can delete questions** (DELETE)
   - Roles: public
   - Policy: auth.uid() IS NOT NULL

---

### Friends Table

1. **Users can view their own friendships** (SELECT)
   - Roles: public
   - Policy: auth.uid() = requester_id OR auth.uid() = addressee_id

2. **Users can send friend requests** (INSERT)
   - Roles: public
   - Policy: auth.uid() = requester_id

3. **Users can update their own requests** (UPDATE)
   - Roles: public
   - Policy: auth.uid() = requester_id OR auth.uid() = addressee_id

4. **Users can delete their own friendships** (DELETE)
   - Roles: public
   - Policy: auth.uid() = requester_id OR auth.uid() = addressee_id

---

### Notifications Table

1. **Users can view their own notifications** (SELECT)
   - Roles: public
   - Policy: auth.uid() = recipient_id

2. **Service role can insert notifications** (INSERT)
   - Roles: authenticated, service_role
   - Policy: true

3. **Users can mark their own notifications as read** (UPDATE)
   - Roles: public
   - Policy: auth.uid() = recipient_id

4. **Users can delete their own notifications** (DELETE)
   - Roles: public
   - Policy: auth.uid() = recipient_id

---

### Matches Table

1. **Players can view their own matches** (SELECT)
   - Roles: public
   - Policy: auth.uid() = home_player_id OR auth.uid() = away_player_id

2. **Players can insert their own matches** (INSERT)
   - Roles: public
   - Policy: auth.uid() = home_player_id OR auth.uid() = away_player_id

---

### DailyRooms Table

1. **dailyroom_select_policy** (SELECT)
   - Roles: anon, authenticated, authenticator, dashboard_user
   - Policy: true

2. **Anyone can insert DailyRoom** (INSERT)
   - Roles: public
   - Policy: true

3. **Only host can update DailyRoom** (UPDATE)
   - Roles: public
   - Policy: true

---

### quiz_buzzes Table

1. **Everyone can read quiz_buzzes** (SELECT)
   - Roles: public
   - Policy: true

2. **Players can insert own buzzes** (INSERT)
   - Roles: public
   - Policy: EXISTS (SELECT 1 FROM Participants p WHERE p.participant_id = quiz_buzzes.participant_id AND p.profile_id = auth.uid())

---

### Scores Table

1. **Scores are readable** (SELECT)
   - Roles: public
   - Policy: true

---

### SegmentConfig Table

1. **Allow read config** (SELECT)
   - Roles: public
   - Policy: true

2. **Allow host insert config** (INSERT)
   - Roles: public
   - Policy: true

3. **Allow host update config** (UPDATE)
   - Roles: public
   - Policy: true

---

### Strikes Table

1. **Allow read strikes** (SELECT)
   - Roles: public
   - Policy: true

2. **Allow host insert strikes** (INSERT)
   - Roles: public
   - Policy: true

3. **Allow host update strikes** (UPDATE)
   - Roles: public
   - Policy: true

---

### SessionQuestions Table

1. **Anyone can view session questions** (SELECT)
   - Roles: public
   - Policy: true

2. **Authenticated users can insert session questions** (INSERT)
   - Roles: authenticated
   - Policy: true

3. **Authenticated users can delete session questions** (DELETE)
   - Roles: authenticated
   - Policy: true

---

## Extensions

### Installed Extensions

1. **uuid-ossp** (v1.1) - UUID generation
   - Schema: extensions
2. **pgcrypto** (v1.3) - Cryptographic functions
   - Schema: extensions
3. **pg_stat_statements** (v1.11) - Query statistics
   - Schema: extensions
4. **pg_graphql** (v1.5.11) - GraphQL support
   - Schema: graphql
5. **supabase_vault** (v0.3.1) - Secrets management
   - Schema: vault
6. **plpgsql** (v1.0) - Procedural language
   - Schema: pg_catalog

### Available (Not Installed)

- postgis, vector, pgroonga, pg_cron, wrappers, pgjwt, and many more...

---

## Edge Functions

### 1. **list-logos**

- **ID:** 1a0f6eb7-3dda-4989-8aed-3742d4227f89
- **Version:** 8
- **Status:** ACTIVE
- **Verify JWT:** true
- **Entrypoint:** /home/tareq/Desktop/Tahadialthalatheen/supabase/functions/list-logos/index.ts
- **Created:** 2025-12-08
- **Updated:** 2025-12-08

---

### 2. **create-daily-token**

- **ID:** 8a20068f-4fd7-4baf-bbc6-b28559891d5b
- **Version:** 3
- **Status:** ACTIVE
- **Verify JWT:** true
- **Entrypoint:** index.ts
- **Created:** 2025-12-21
- **Updated:** 2025-12-21

---

## Migrations History

Total Migrations: 21

### Recent Migrations

1. **20251130122028** - create_session_questions_table
2. **20251130111021** - add_question_type_and_refactor_answers
3. **20251030112825** - add_question_generation_support
4. **20251030090442** - create_quiz_room_tables_v2
5. **20251022163139** - fix_profile_creation_with_username
6. **20251022122637** - drop_isready_column
7. **20251020170018** - add_notifications_insert_policy
8. **20251020164846** - fix_friend_notification_trigger
9. **20251020162722** - rename_player_roles_to_home_away
10. **20251020152738** - remove_duplicate_leaderboards_view_and_fix_permissions

### Earlier Migrations

- **20251020152400** - fix_userinbox_view_add_recipient_id
- **20251020151952** - create_leaderboards_view_and_fix_permissions
- **20251020150211** - remove_name_from_participants
- **20251020145329** - create_leaderboard_views
- **20251020142840** - remove_flag_and_team_from_participants
- **20251020135529** - fix_schema_with_policies_update
- **20250916085947** - optimize_rls_policies_fixed
- **20250916085918** - fix_pgcrypto_function_references
- **20250916083430** - fix_function_search_path_security
- **20250914035421** - fix_secure_session_code_generation
- **20250908133702** - remote_schema

---

## Security Advisories

### Security Warnings (8 Issues)

#### 1. Function Search Path Mutable (×8)

**Affected Functions:**

1. `public.get_buzz_winner`
2. `public.update_quiz_state_timestamp`
3. `public.update_updated_at_column`
4. `public.get_question_difficulty`
5. `public.validate_question_answers`
6. `public.generate_session_code`
7. `public.notify_friend_activity`
8. `public.touch_profiles_updated_at`

**Issue:** Functions do not have search_path parameter set, making them vulnerable to schema injection attacks.

**Remediation:** https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable

**Fix:** Add `SET search_path = public` to each function definition.

---

#### 2. Leaked Password Protection Disabled

**Issue:** Auth leaked password protection is currently disabled. Supabase Auth can check passwords against HaveIBeenPwned.org to prevent use of compromised passwords.

**Remediation:** https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

**Fix:** Enable in Supabase dashboard under Authentication → Settings → Password Protection.

---

## Performance Considerations

### Table Sizes

- **auth.refresh_tokens**: 128 rows
- **auth.audit_log_entries**: 276 rows
- **auth.sessions**: 4 rows
- **auth.mfa_amr_claims**: 4 rows
- **storage.migrations**: 5 rows
- **auth.schema_migrations**: 2 rows
- **public.Sessions**: 2 rows
- **public.Participants**: 2 rows
- **public.DailyRooms**: 2 rows
- **public.Questions**: 6 rows

### Indexing Recommendations

- Primary keys are automatically indexed
- Foreign keys are automatically indexed
- Consider indexes on frequently queried columns:
  - `Sessions.session_code` (already unique, so indexed)
  - `Participants.profile_id`
  - `Participants.session_id`
  - `quiz_buzzes.session_id, question_id, buzz_ts` (composite index for get_buzz_winner)

---

## Data Relationships

### Core Entity Relationships

```
auth.users (Supabase Auth)
    ↓
Profiles (1:1)
    ↓
    ├─→ Friends (requester_id, addressee_id)
    ├─→ Notifications (recipient_id, sender_id)
    ├─→ Matches (home_player_id, away_player_id, winner_id)
    ├─→ Sessions (host_profile_id)
    └─→ Participants (profile_id)

Sessions
    ├─→ Participants (session_id)
    ├─→ SegmentConfig (session_id)
    ├─→ Scores (session_id)
    ├─→ Strikes (session_id)
    ├─→ DailyRooms (room_id = session_id)
    ├─→ quiz_buzzes (session_id)
    ├─→ SessionQuestions (session_id)
    └─→ Matches (session_id)

Questions
    ├─→ SessionQuestions (question_id)
    └─→ quiz_buzzes (question_id)

Participants
    ├─→ Scores (participant_id)
    ├─→ Strikes (participant_id)
    └─→ quiz_buzzes (participant_id)
```

---

## Backup & Restore

### Recommended Backup Strategy

1. **Database Dumps:** Daily automated backups via Supabase dashboard
2. **Point-in-Time Recovery:** Available on Pro plan
3. **Migration Files:** Version controlled in `/supabase/migrations/`
4. **Seed Data:** Store sample data in `/supabase/seed.sql` (if needed)

### Manual Backup Command

```bash
# Export schema + data
supabase db dump -f backup.sql

# Export schema only
supabase db dump --schema-only -f schema.sql

# Export data only
supabase db dump --data-only -f data.sql
```

---

## Future Improvements

### Recommended Changes

1. **Fix Security Warnings:**
   - Add `SET search_path = public` to all functions
   - Enable leaked password protection in Auth settings

2. **Add Indexes:**
   - Composite index on `quiz_buzzes(session_id, question_id, buzz_ts)`
   - Index on `Participants.lastHeartbeat` for cleanup queries

3. **Add Constraints:**
   - Check constraints for valid segment codes
   - Check constraints for valid role values

4. **Monitoring:**
   - Set up pg_stat_statements monitoring
   - Enable slow query logging
   - Track RLS policy performance

5. **Cleanup:**
   - Remove unused functions (e.g., `get_question_difficulty` references non-existent table)
   - Archive old sessions periodically
   - Clean up expired refresh tokens

---

## Documentation Maintenance

**Last Updated:** December 1, 2025  
**Schema Version:** Based on migration 20251130122028  
**Review Schedule:** Update after major schema changes or quarterly

---

## Appendix: Useful Queries

### Check Table Sizes

```sql
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### List All Foreign Keys

```sql
SELECT
  tc.table_schema,
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public';
```

### Check Active Sessions

```sql
SELECT
  s.session_id,
  s.session_code,
  s.phase,
  s.game_state,
  COUNT(p.participant_id) as participant_count
FROM "Sessions" s
LEFT JOIN "Participants" p ON s.session_id = p.session_id
WHERE s.ended_at IS NULL
GROUP BY s.session_id;
```

---

**END OF SCHEMA DUMP**
