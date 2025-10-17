# Database Schema Dump

## Overview
This document contains the full schema structure for project **psdrwkjkgubatiemsgqn** including tables, indexes, extensions, and migrations.

---

## 🧱 Tables (Schema: public)

### Sessions
Primary Key: `session_id`
Comment: RLS optimized: Single SELECT policy for all roles

**Columns**
- phase: text — must be one of ['Setup', 'Lobby', 'Full Lobby', 'In-Progress', 'Tie-Breaker', 'Results', 'Review']
- game_state: text — must be one of ['pre-quiz', 'active', 'post-quiz', 'concluded']
- ended_at: timestamptz
- session_code: text (unique)
- session_id: uuid (default: extensions.uuid_generate_v4())
- created_at: timestamptz (default: now())
- host_profile_id: uuid

**Foreign Keys**
- Sessions.host_profile_id → Profiles.id
- Scores.session_id → Sessions.session_id
- SegmentConfig.session_id → Sessions.session_id
- Strikes.session_id → Sessions.session_id
- DailyRooms.room_id → Sessions.session_id
- Participants.session_id → Sessions.session_id

---

### Participants
Primary Key: `participant_id`
Comment: RLS optimized: Single SELECT policy for all roles

**Columns**
- session_id: uuid
- name: text
- role: text — one of ['Host', 'Player1', 'Player2', 'GameMaster']
- flag: text (nullable)
- team_logo_url: text (nullable)
- join_at: timestamptz
- disconnect_at: timestamptz
- participant_id: uuid (default: extensions.uuid_generate_v4())
- video_presence: boolean (default: false)
- lobby_presence: text (default: 'NotJoined', allowed: ['NotJoined', 'Joined', 'Disconnected'])
- powerup_pass_used, powerup_alhabeed, powerup_bellegoal, powerup_slippyg: boolean (default: false)
- isReady: boolean (default: false)
- lastHeartbeat: timestamptz (default: now())
- profile_id: uuid

**Foreign Keys**
- Strikes.participant_id → Participants.participant_id
- Participant.session_id → Sessions.session_id
- Score.participant_id → Participants.participant_id
- Participants.profile_id → Profiles.id

---

### SegmentConfig
Primary Key: `config_id`

**Columns**
- session_id: uuid
- segment_code: text — one of ['WDYK', 'AUCT', 'BELL', 'UPDW', 'REMO']
- questions_count: integer
- config_id: uuid (default: extensions.uuid_generate_v4())

**Foreign Keys**
- SegmentConfig.session_id → Sessions.session_id

---

### Scores
Primary Key: `score_id`
Comment: RLS optimized: Single SELECT policy for all roles

**Columns**
- session_id: uuid
- participant_id: uuid
- segment_code: text — one of ['WDYK', 'AUCT', 'BELL', 'UPDW', 'REMO']
- score_id: uuid (default: extensions.uuid_generate_v4())
- points: integer (default: 0)

**Foreign Keys**
- Score.participant_id → Participants.participant_id
- Score.session_id → Sessions.session_id

---

### DailyRooms
Primary Key: `room_id`

**Columns**
- room_id: uuid
- room_url: text
- active_participants: jsonb (default: [])
- host_permissions: jsonb (default: {})
- ready: boolean (default: false)

**Foreign Keys**
- DailyRooms.room_id → Sessions.session_id

---

### Strikes
Primary Key: `strike_id`

**Columns**
- session_id: uuid
- participant_id: uuid
- segment_code: text — must equal 'WDYK'
- strike_id: uuid (default: extensions.uuid_generate_v4())
- strikes: integer (default: 0)

**Foreign Keys**
- Strikes.participant_id → Participants.participant_id
- Strikes.session_id → Sessions.session_id

---

### Profiles
Primary Key: `id`

**Columns**
- id: uuid
- name: text (2–40 chars)
- team: text (nullable)
- flag: text (nullable)
- avatar_url: text (nullable)
- created_at: timestamptz (default: now())
- updated_at: timestamptz (default: now())

**Foreign Keys**
- profiles.id → auth.users.id
- Sessions.host_profile_id → Profiles.id
- Participants.profile_id → Profiles.id

---

## ⚙️ Installed Extensions

- uuid-ossp (generate UUIDs)
- pgcrypto (encryption functions)
- pg_graphql (GraphQL support)
- supabase_vault (secrets management)
- vector (vector data type and indexes)
- postgis (geospatial functions)
- pg_stat_statements (SQL performance tracking)
- pgjwt (JSON Web Tokens)
- pgaudit (auditing)
- pg_cron (job scheduler)
- pg_net (async HTTP)
- pgmq (lightweight message queue)
- pg_repack (table reorganization)
- plpgsql_check (PL/pgSQL function validation)
- pgtap (unit testing)
- pg_trgm (text similarity)
- pgroonga (fast multilingual full-text search)
- index_advisor (index recommendation)
- pg_sodium (cryptography)
- hstore, citext, unaccent, intarray, ltree (common PostgreSQL utilities)

(…plus 60+ system and optional extensions for GIS, FDWs, monitoring, and performance tuning.)

---

## 🧩 Migrations

| Version | Name |
|----------|------|
| 20250908133643 | remote_schema |
| 20250908133702 | remote_schema |
| 20250914035421 | fix_secure_session_code_generation |
| 20250916083430 | fix_function_search_path_security |
| 20250916085918 | fix_pgcrypto_function_references |
| 20250916085947 | optimize_rls_policies_fixed |

---

**End of Schema Dump**