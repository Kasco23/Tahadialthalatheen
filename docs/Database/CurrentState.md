# Database - Current State

**Last Updated**: October 21, 2025  
**Database**: Supabase PostgreSQL  
**Schema Version**: 20251020170018 (Latest Migration)  
**Total Tables**: 13 public tables + auth/storage schemas  
**Extensions Installed**: uuid-ossp, pgcrypto, pg_stat_statements, pg_graphql, supabase_vault

---

## 📊 Public Schema Tables

### 1. Sessions

**Purpose**: Core table for quiz game sessions

**Columns**:

- `session_id` UUID PRIMARY KEY (auto-generated)
- `session_code` TEXT UNIQUE (auto-generated 6-char alphanumeric)
- `host_profile_id` UUID → Profiles(id)
- `phase` TEXT CHECK constraint ('Setup', 'Lobby', 'Full Lobby', 'In-Progress', 'Tie-Breaker', 'Results', 'Review')
- `game_state` TEXT CHECK constraint ('pre-quiz', 'active', 'post-quiz', 'concluded')
- `created_at` TIMESTAMPTZ DEFAULT now()
- `ended_at` TIMESTAMPTZ

**Indexes**:

- None beyond primary key (small table, frequent full scans acceptable)

**RLS Policies**:

- ✅ `Sessions are readable` - SELECT (public) - All users can view
- ✅ `Anyone can create a session` - INSERT (public)
- ✅ `Only host can update session state` - UPDATE (public) - Checks host ownership

**Real-time**: ✅ Enabled (publication: supabase_realtime)

**Triggers**:

- `set_session_code` BEFORE INSERT - Generates cryptographically secure session code

---

### 2. Participants

**Purpose**: Tracks players and hosts in game sessions

**Columns**:

- `participant_id` UUID PRIMARY KEY (auto-generated)
- `session_id` UUID → Sessions(session_id) ON DELETE CASCADE
- `profile_id` UUID → Profiles(id)
- `role` TEXT CHECK constraint ('Host', 'Home', 'Away', 'GameMaster', 'Guest')
- `lobby_presence` TEXT CHECK constraint ('NotJoined', 'Joined', 'Disconnected')
- `video_presence` BOOLEAN DEFAULT false
- `isReady` BOOLEAN DEFAULT false
- `lastHeartbeat` TIMESTAMPTZ DEFAULT now() (updated every 30s by clients)
- `powerup_pass_used` BOOLEAN DEFAULT false
- `powerup_alhabeed` BOOLEAN DEFAULT false
- `powerup_bellegoal` BOOLEAN DEFAULT false
- `powerup_slippyg` BOOLEAN DEFAULT false
- `join_at` TIMESTAMPTZ
- `disconnect_at` TIMESTAMPTZ

**Indexes**:

- `idx_participant_session_id` - session_id
- `idx_participant_session_presence` - (session_id, lobby_presence)
- `idx_participant_active` - session_id WHERE lobby_presence = 'Joined'
- `idx_participant_heartbeat` - lastHeartbeat WHERE lobby_presence = 'Joined'
- `idx_participant_video` - session_id WHERE video_presence = true

**RLS Policies**:

- ✅ `Participants are readable` - SELECT (public)
- ✅ `Participants can join sessions` - INSERT (public)
- ✅ `Allow participant updates` - UPDATE (public)

**Real-time**: ✅ Enabled

**Notes**:

- Heartbeat mechanism for stale participant detection
- Role 'Home'/'Away' renamed from 'Player1'/'Player2' (Oct 20, 2025)

---

### 3. Profiles

**Purpose**: User profile information linked to auth.users

**Columns**:

- `id` UUID PRIMARY KEY → auth.users(id)
- `username` TEXT UNIQUE CHECK (length >= 3)
- `name` TEXT CHECK (length between 2-40)
- `team` TEXT (team logo selection)
- `flag` TEXT (country flag selection)
- `avatar_url` TEXT (storage path to avatar image)
- `created_at` TIMESTAMPTZ DEFAULT now()
- `updated_at` TIMESTAMPTZ DEFAULT now()

**Indexes**:

- None documented beyond unique username

**RLS Policies**:

- ✅ `profiles_public_read` - SELECT (public) - All profiles viewable
- ✅ `profiles_self_insert` - INSERT (authenticated) - Users create own profile
- ✅ `profiles_self_update` - UPDATE (authenticated) - Users update own profile

**Real-time**: ✅ Enabled

**Triggers**:

- `trg_profiles_touch` BEFORE UPDATE - Auto-updates `updated_at` timestamp

**Foreign Keys Referenced By**:

- Sessions(host_profile_id)
- Participants(profile_id)
- Friends(requester_id, addressee_id)
- Notifications(sender_id, recipient_id)
- Matches(home_player_id, away_player_id, winner_id)
- PlayerSegmentStats(player_id)

---

### 4. SegmentConfig

**Purpose**: Quiz segment configuration per session

**Columns**:

- `config_id` UUID PRIMARY KEY (auto-generated)
- `session_id` UUID → Sessions(session_id)
- `segment_code` TEXT CHECK constraint ('WDYK', 'AUCT', 'BELL', 'UPDW', 'REMO')
- `questions_count` INTEGER

**Indexes**:

- None documented

**RLS Policies**:

- ✅ `Allow read config` - SELECT (public)
- ✅ `Allow host insert config` - INSERT (public)
- ✅ `Allow host update config` - UPDATE (public)

**Real-time**: ❌ Not enabled (static config data)

---

### 5. Scores

**Purpose**: Point tracking per participant per segment

**Columns**:

- `score_id` UUID PRIMARY KEY (auto-generated)
- `session_id` UUID → Sessions(session_id)
- `participant_id` UUID → Participants(participant_id)
- `segment_code` TEXT CHECK constraint ('WDYK', 'AUCT', 'BELL', 'UPDW', 'REMO')
- `points` INTEGER DEFAULT 0

**Indexes**:

- None documented

**RLS Policies**:

- ✅ `Scores are readable` - SELECT (public)

**Real-time**: ✅ Enabled

**Comment**: "RLS optimized: Single SELECT policy for all roles"

---

### 6. Strikes

**Purpose**: Wrong answer tracking for 'WDYK' segment

**Columns**:

- `strike_id` UUID PRIMARY KEY (auto-generated)
- `session_id` UUID → Sessions(session_id)
- `participant_id` UUID → Participants(participant_id)
- `segment_code` TEXT CHECK constraint ('WDYK')
- `strikes` INTEGER DEFAULT 0

**Indexes**:

- None documented

**RLS Policies**:

- ✅ `Allow read strikes` - SELECT (public)
- ✅ `Allow host insert strikes` - INSERT (public)
- ✅ `Allow host update strikes` - UPDATE (public)

**Real-time**: ✅ Enabled

---

### 7. DailyRooms

**Purpose**: Daily.co video room URLs and state

**Columns**:

- `room_id` UUID PRIMARY KEY → Sessions(session_id)
- `room_url` TEXT
- `active_participants` JSONB DEFAULT '[]'
- `host_permissions` JSONB DEFAULT '{}'
- `ready` BOOLEAN DEFAULT false

**Indexes**:

- `idx_dailyroom_ready` - ready

**RLS Policies**:

- ✅ `dailyroom_select_policy` - SELECT (anon, authenticated, authenticator, dashboard_user)
- ✅ `Anyone can insert DailyRoom` - INSERT (public)
- ✅ `Only host can update DailyRoom` - UPDATE (public)

**Real-time**: ❌ Not enabled

---

### 8. Friends

**Purpose**: Friend request management and relationships

**Columns**:

- `id` BIGSERIAL PRIMARY KEY
- `requester_id` UUID → Profiles(id) (who sent the request)
- `addressee_id` UUID → Profiles(id) (who received the request)
- `status` TEXT DEFAULT 'pending' CHECK ('pending', 'accepted', 'declined')
- `created_at` TIMESTAMPTZ DEFAULT now()
- `updated_at` TIMESTAMPTZ DEFAULT now()

**Indexes**:

- `idx_friends_requester` - requester_id
- `idx_friends_requester_id` - requester_id (duplicate?)
- `idx_friends_addressee` - addressee_id
- `idx_friends_addressee_id` - addressee_id (duplicate?)
- `idx_friends_status` - status
- `unique_friendship` UNIQUE - (LEAST(requester_id, addressee_id), GREATEST(requester_id, addressee_id))

**RLS Policies**:

- ✅ `Users can view their own friendships` - SELECT (public)
- ✅ `Users can send friend requests` - INSERT (public)
- ✅ `Users can update their own requests` - UPDATE (public)
- ✅ `Users can delete their own friendships` - DELETE (public)

**Real-time**: ✅ Enabled

**Triggers**:

- `friends_notify_trigger` AFTER INSERT/UPDATE - Creates notifications on friend activity

---

### 9. Notifications

**Purpose**: In-app notification system

**Columns**:

- `id` BIGSERIAL PRIMARY KEY
- `recipient_id` UUID → Profiles(id)
- `sender_id` UUID → Profiles(id)
- `type` TEXT CHECK ('friend_request', 'friend_accept', 'match_invite', 'message')
- `title` TEXT DEFAULT 'Notification'
- `message` TEXT
- `link` TEXT (optional navigation path)
- `metadata` JSONB DEFAULT '{}'
- `is_read` BOOLEAN DEFAULT false
- `read_at` TIMESTAMPTZ
- `created_at` TIMESTAMPTZ DEFAULT now()

**Indexes**:

- `idx_notifications_user_id` - recipient_id
- `idx_notifications_recipient_id` - recipient_id (duplicate?)
- `idx_notifications_is_read` - is_read
- `idx_notifications_created_at` - created_at DESC

**RLS Policies**:

- ✅ `Users can view their own notifications` - SELECT (public)
- ✅ `Service role can insert notifications` - INSERT (authenticated, service_role)
- ✅ `Users can mark their own notifications as read` - UPDATE (public)
- ✅ `Users can delete their own notifications` - DELETE (public)

**Real-time**: ✅ Enabled

**Notes**: Fixed notification insert policy added on Oct 20, 2025

---

### 10. Matches

**Purpose**: Historical match records and results

**Columns**:

- `id` BIGSERIAL PRIMARY KEY
- `session_id` UUID → Sessions(session_id)
- `home_player_id` UUID → Profiles(id)
- `away_player_id` UUID → Profiles(id)
- `winner_id` UUID → Profiles(id)
- `home_total_points` INTEGER DEFAULT 0
- `away_total_points` INTEGER DEFAULT 0
- `segments_played` TEXT[] DEFAULT '{}' (array of segment codes)
- `created_at` TIMESTAMPTZ DEFAULT now()

**Indexes**:

- `idx_matches_session_id` - session_id
- `idx_matches_home_player` - home_player_id
- `idx_matches_home_player_id` - home_player_id (duplicate?)
- `idx_matches_away_player` - away_player_id
- `idx_matches_away_player_id` - away_player_id (duplicate?)
- `idx_matches_winner` - winner_id

**RLS Policies**:

- ✅ `Players can view their own matches` - SELECT (public)
- ✅ `Players can insert their own matches` - INSERT (public)

**Real-time**: ✅ Enabled

---

### 11. PlayerSegmentStats

**Purpose**: Aggregated performance statistics per player per segment

**Columns**:

- `id` BIGSERIAL PRIMARY KEY
- `player_id` UUID → Profiles(id)
- `segment_name` TEXT (e.g., 'WDYK', 'AUCT')
- `games_played` INTEGER DEFAULT 0
- `total_questions` INTEGER DEFAULT 0
- `strikes` INTEGER DEFAULT 0
- `points` INTEGER DEFAULT 0
- `updated_at` TIMESTAMPTZ DEFAULT now()

**Indexes**:

- None documented

**RLS Policies**:

- ✅ `Users can view their own stats` - SELECT (public)
- ✅ `Users can upsert their own stats` - INSERT (public)
- ✅ `Users can update their own stats` - UPDATE (public)

**Real-time**: ✅ Enabled

---

## 📸 Database Views

### UserInbox

**Type**: SQL View (read-only)  
**Purpose**: User-specific notifications with sender information  
**Access**: Filtered by auth.uid()

**Definition**:

```sql
SELECT
  n.id,
  n.recipient_id,
  n.type,
  n.message,
  n.is_read,
  n.created_at,
  p.username AS sender_name
FROM Notifications n
JOIN Profiles p ON n.sender_id = p.id
WHERE n.recipient_id = auth.uid()
ORDER BY n.created_at DESC;
```

---

### leaderboard_players

**Type**: SQL View (read-only)  
**Purpose**: Player rankings by wins, win rate, and total points

**Returns**:

- Player profile info (id, username, name, flag, team, avatar_url)
- Aggregate stats (games_played, wins, losses, total_points, win_rate)

**Ordering**: wins DESC, total_points DESC

**Filters**: Only players with games_played > 0

---

### leaderboard_matches

**Type**: SQL View (read-only)  
**Purpose**: Match history with full player details

**Returns**:

- Match metadata (id, created_at, session_id, segments_played)
- Home player full profile
- Away player full profile
- Winner profile
- Score totals

**Ordering**: created_at DESC

---

## 🔐 Authentication Schema (auth.\*)

### auth.users

**Rows**: 7 active users  
**Purpose**: Supabase Auth core user table  
**RLS**: ✅ Enabled  
**Key Features**:

- Email/password authentication
- OAuth support (SSO ready but not configured)
- Phone authentication support
- MFA support (TOTP, WebAuthn, Phone)
- Anonymous user support
- Soft delete capability (deleted_at)

**Triggers**:

- `on_auth_user_created` AFTER INSERT → calls `handle_new_user()` to auto-create Profile

---

### auth.sessions

**Rows**: 12 active sessions  
**Purpose**: User session tracking  
**Key Columns**:

- session_id, user_id, aal (authentication assurance level)
- user_agent, ip
- not_after (expiry), refreshed_at

---

### auth.identities

**Rows**: 6 identities  
**Purpose**: Third-party identity provider links (Google, GitHub, etc.)

---

### auth.refresh_tokens

**Rows**: 36 tokens  
**Purpose**: JWT refresh token storage

---

## 📦 Storage Schema (storage.\*)

### storage.buckets

**Total Buckets**: 3

1. **logos** (public)
   - Purpose: Team/club logos
   - Size Limit: None
   - Allowed Types: All

2. **assets** (public)
   - Purpose: General application assets
   - Size Limit: None
   - Allowed Types: All

3. **avatars** (public)
   - Purpose: User profile pictures
   - Size Limit: None
   - Allowed Types: All

**Storage Policies**:

- `read_logos` - SELECT (public)
- `avatars_public_read` - SELECT (public)
- `avatars_own_write` - INSERT (authenticated) - User owns path
- `avatars_own_update` - UPDATE (authenticated) - User owns path
- `avatars_own_delete` - DELETE (authenticated) - User owns path

---

### storage.objects

**Rows**: 5 files stored  
**Purpose**: File metadata and paths

---

## ⚙️ Database Functions

### 1. generate_session_code()

**Returns**: TRIGGER  
**Purpose**: Generate cryptographically secure 6-character session codes  
**Algorithm**:

- 3 random digits + 3 random uppercase letters
- Fisher-Yates shuffle using `gen_random_bytes()`
- Uniqueness check against existing session codes
- Loops until unique code found

**Called By**: `set_session_code` trigger on Sessions INSERT

**Security**: Uses pgcrypto's `gen_random_bytes()` for cryptographic strength

---

### 2. handle_new_user()

**Returns**: TRIGGER  
**Purpose**: Auto-create Profile record when auth.users row inserted  
**Security**: SECURITY DEFINER with explicit search_path  
**Behavior**:

- Creates Profile with user's auth.id
- Uses `raw_user_meta_data->>'name'` or defaults to 'Player'
- ON CONFLICT DO NOTHING (idempotent)

**Called By**: `on_auth_user_created` trigger on auth.users INSERT

---

### 3. notify_friend_activity()

**Returns**: TRIGGER  
**Purpose**: Auto-create notifications for friend request actions  
**Security**: SECURITY DEFINER  
**Behavior**:

- INSERT + status='pending' → Notify addressee of friend request
- UPDATE from 'pending' to 'accepted' → Notify requester of acceptance

**Called By**: `friends_notify_trigger` on Friends INSERT/UPDATE

---

### 4. touch_profiles_updated_at()

**Returns**: TRIGGER  
**Purpose**: Auto-update `updated_at` timestamp on Profiles  
**Called By**: `trg_profiles_touch` on Profiles UPDATE

---

## 🔌 PostgreSQL Extensions

**Installed Extensions** (5):

1. **uuid-ossp** (v1.1) - UUID generation (used in all primary keys)
2. **pgcrypto** (v1.3) - Cryptographic functions (session code generation)
3. **pg_stat_statements** (v1.11) - Query performance monitoring
4. **pg_graphql** (v1.5.11) - GraphQL API support
5. **supabase_vault** (v0.3.1) - Secrets management

**Available but Not Installed** (69 extensions including):

- postgis, vector, pg_cron, wrappers, pgjwt, pgmq, rum, etc.

---

## 🚀 Edge Functions

### list-logos

**Status**: ✅ ACTIVE (v8)  
**Purpose**: List available team logos from storage  
**Entrypoint**: `/supabase/functions/list-logos/index.ts`  
**Verify JWT**: ✅ Enabled  
**Last Updated**: January 8, 2025

---

## 📡 Netlify Serverless Functions

Located in `/netlify/functions/`:

1. **createDailyRoom.ts** - Creates Daily.co video rooms
2. **create-daily-token.ts** - Generates Daily.co access tokens
3. **check-ready-status.ts** - Checks participant ready state
4. **mark-player-ready.ts** - Marks player as ready
5. **cleanupStatus.ts** - Cleanup stale participant status
6. **get-active-profile.ts** - Fetch active user profile
7. **store-active-profile.ts** - Store active profile data
8. **send-notification.ts** - Send push notifications

---

## 🔄 Database Migrations History

**Total Migrations**: 16

**Latest**: `20251020170018_add_notifications_insert_policy`

**Recent Changes** (October 20, 2025):

- Removed flag/team/name from Participants (moved to Profiles)
- Created leaderboard views
- Renamed Player1/Player2 roles to Home/Away
- Fixed friend notification triggers
- Added notification insert policies
- Optimized RLS policies for performance

**Security Fixes**:

- `20250916083430_fix_function_search_path_security` - Prevented privilege escalation
- `20250916085947_optimize_rls_policies_fixed` - Performance improvements
- `20250914035421_fix_secure_session_code_generation` - Cryptographic RNG

---

## 📊 Database Statistics

**Total Rows**:

- auth.users: 7
- auth.sessions: 12
- auth.refresh_tokens: 36
- auth.identities: 6
- auth.audit_log_entries: 102
- public.Sessions: 1
- public.Participants: 1
- public.Profiles: 6
- public.Friends: 4
- public.Notifications: 4
- public.Matches: 0
- public.PlayerSegmentStats: 0
- storage.buckets: 3
- storage.objects: 5

**Database Size**: Not explicitly queried (use `SELECT pg_size_pretty(pg_database_size(current_database()));`)

---

## 🔒 Security Summary

**Row Level Security (RLS)**:

- ✅ Enabled on ALL public tables
- ✅ Enabled on auth.\* tables
- ✅ Enabled on storage.\* tables

**Policy Design**:

- Public read access for game data (Sessions, Participants, Scores)
- User-scoped access for personal data (Profiles, Notifications, Friends)
- Host-only write access for game state changes
- Service role bypass for admin operations

**Security Definer Functions**: 2

- `handle_new_user()` - Runs with elevated privileges to create profiles
- `notify_friend_activity()` - Creates notifications across users

**Sensitive Data**:

- No passwords stored in public schema
- auth.users contains encrypted_password (Supabase managed)
- No PII beyond username/name/email
- Avatar URLs are public storage paths

---

## 🎯 Performance Optimization

**Indexed Columns**:

- All primary keys
- Foreign key columns (session_id, participant_id, profile_id, etc.)
- Query-heavy columns (lobby_presence, lastHeartbeat, status, is_read)
- Unique constraints (session_code, username, email, phone)

**Partial Indexes**:

- `idx_participant_active` - Only WHERE lobby_presence = 'Joined'
- `idx_participant_heartbeat` - Only WHERE lobby_presence = 'Joined'
- `idx_participant_video` - Only WHERE video_presence = true

**Query Optimization**:

- Views use JOINs for frequently accessed data
- Comments indicate "RLS optimized" for core tables
- Search path explicitly set in SECURITY DEFINER functions

---

## 🔄 Real-time Subscriptions

**Enabled Tables** (via supabase_realtime publication):

- ✅ Sessions
- ✅ Participants
- ✅ Scores
- ✅ Strikes
- ✅ Friends
- ✅ Notifications
- ✅ Matches
- ✅ PlayerSegmentStats
- ✅ Profiles

**Use Cases**:

- Live score updates during quiz
- Participant join/leave events
- Friend request notifications
- Real-time leaderboard updates

---

## 📝 Data Integrity

**Foreign Key Constraints**: All relationships enforced

**Check Constraints**:

- Enums enforced via CHECK (phase, game_state, role, lobby_presence, status, type)
- Length validation (username >= 3, name 2-40)
- Value ranges validated

**Default Values**: Comprehensive defaults for timestamps, booleans, arrays, JSON

**Unique Constraints**:

- session_code, username, email, phone
- Composite unique on Friends (requester, addressee)

---

## 🚨 Known Issues / Tech Debt

1. **Duplicate Indexes**: Several tables have duplicate indexes (e.g., idx_friends_requester + idx_friends_requester_id)
2. **No File Size Limits**: Storage buckets have no size constraints
3. **No MIME Type Validation**: Storage allows any file type
4. **Missing Cascades**: Some foreign keys don't specify ON DELETE behavior
5. **Role Transition**: Legacy 'Player1'/'Player2' values may exist in old data (migration renamed to 'Home'/'Away')
6. **Heartbeat Cleanup**: No automated job to remove stale participants (lastHeartbeat > 5 minutes)

---

## 🎯 Recommended Enhancements

1. **Add pg_cron**: Schedule cleanup jobs for stale sessions/participants
2. **Enable PostGIS**: If geographic features needed (player location, regional leaderboards)
3. **Add vector extension**: For AI-powered features (question similarity, content recommendations)
4. **Implement Soft Deletes**: Add deleted_at to critical tables
5. **Add Audit Logging**: Track changes to Matches, Scores for dispute resolution
6. **Storage Quotas**: Set file_size_limit on storage buckets
7. **MIME Type Restrictions**: Limit avatars to image/\* only
8. **Remove Duplicate Indexes**: Clean up redundant index definitions
9. **Add Composite Indexes**: For multi-column query patterns (e.g., session_id + segment_code)
10. **Database Monitoring**: Enable pg_stat_monitor for detailed query analytics
