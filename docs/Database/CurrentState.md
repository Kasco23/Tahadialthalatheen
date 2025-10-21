# Database - Current State

**Last Updated**: October 21, 2025  
**Database**: Supabase PostgreSQL  
**Total Tables**: 13 (8 core + 5 v2.0 features)

---

## Core Tables (Quiz System)

### Sessions
- **Primary Key**: session_id (UUID)
- **Purpose**: Game session records
- **Key Columns**: session_code (unique), host_profile_id, phase, game_state, created_at, ended_at
- **Phase Values**: 'Setup', 'Lobby', 'Full Lobby', 'In-Progress', 'Tie-Breaker', 'Results', 'Review'
- **State Values**: 'pre-quiz', 'active', 'post-quiz', 'concluded'

### Participants
- **Primary Key**: participant_id (UUID)
- **Purpose**: Players/host in sessions
- **Key Columns**: session_id, profile_id, name, role, lobby_presence, video_presence, isReady, lastHeartbeat
- **Roles**: 'Host', 'Player1', 'Player2', 'GameMaster'
- **Presence States**: 'NotJoined', 'Joined', 'Disconnected'

### Profiles
- **Primary Key**: id (UUID → auth.users.id)
- **Purpose**: User accounts
- **Key Columns**: name, username (unique), team, flag, avatar_url
- **Unique Index**: LOWER(username) for case-insensitive lookup

### SegmentConfig, Scores, Strikes, DailyRooms
- **Purpose**: Quiz configuration, scoring, strike tracking, video room URLs

---

## Social Features (v2.0)

### Friends
- **Primary Key**: id (UUID)
- **Purpose**: Friend requests and relationships
- **Unique Constraint**: (requester_id, addressee_id)
- **Status Values**: 'pending', 'accepted', 'declined', 'blocked'

### Notifications
- **Primary Key**: id (UUID)
- **Purpose**: In-app notifications
- **Types**: 'friend_request', 'friend_accepted', 'match_invite', 'match_result'
- **Real-time**: ✅ Enabled

### Matches
- **Primary Key**: id (UUID)
- **Purpose**: Completed game records
- **Key Columns**: session_id, home_player_id, away_player_id, winner_id, total_points
- **Real-time**: ✅ Enabled

### PlayerSegmentStats
- **Primary Key**: id (UUID)
- **Purpose**: Segment-level performance tracking
- **Unique Constraint**: (profile_id, segment_code)
- **Real-time**: ✅ Enabled

---

## Views

### UserInbox
- **Type**: SQL View
- **Purpose**: Notifications with sender profile info
- **Joins**: Notifications LEFT JOIN Profiles

### leaderboard_players, leaderboard_matches
- **Type**: SQL Views
- **Purpose**: Ranked leaderboards by win rate and total points

---

## Real-time & Security

**Real-time Enabled Tables**: Friends, Notifications, Matches, PlayerSegmentStats, Participants, Sessions, Scores, Strikes

**RLS Policies**: Optimized single-policy design for core tables, user-scoped for social features

**Functions**: verify_host_password (RPC), upsert_player_segment_stats

**Triggers**: Auto-update timestamps, auto-create notifications on friend actions
