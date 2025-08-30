# Supabase Snapshot – 30 Aug 2025

Comprehensive point‑in‑time documentation of the current Supabase setup before planned restructuring (adding tables, buckets, functions, realtime channels, and new policies).

## 1. Overview
- Schema covered: `public`
- Tables: `games`, `players`, `game_events` (all RLS enabled)
- Edge Functions: none deployed (empty list)
- Migrations present: 3 (chronological order)
  1. `20250828183443_remote_schema`
  2. `20250828190047_initial_schema`
  3. `20250828194901_production_security_fixes_only`
- Extensions installed (subset actually enabled): large catalog available; key actively installed versions include: `pg_graphql 1.5.11`, `pgcrypto 1.3`, `pg_net 0.14.0`, `wrappers 0.5.3`, `supabase_vault 0.3.1`, `pg_cron 1.6`, `vector 0.8.0`, `pgmq 1.4.4`, `uuid-ossp 1.1` and others.
- Advisors: Security (3 warnings), Performance (many RLS initplan warnings + unused index infos)

## 2. Table Schemas

### 2.1 games
| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | text | — | NO | PK |
| host_name | text | — | YES |  |
| phase | text | 'CONFIG' | NO |  |
| current_segment | text | '' | YES |  |
| current_question_index | integer | 0 | YES |  |
| timer | integer | 0 | YES |  |
| is_timer_running | boolean | false | YES |  |
| video_room_url | text | — | YES |  |
| video_room_created | boolean | false | YES |  |
| segment_settings | jsonb | {"AUCT":8,"BELL":12,"REMO":5,"SING":6,"WSHA":10} | YES | Per‑segment quotas |
| created_at | timestamptz | now() | YES |  |
| updated_at | timestamptz | now() | YES |  |
| host_code | text | '' | NO |  |
| host_is_connected | boolean | — | YES |  |
| host_id | uuid | — | YES | FK auth.users |
| status | text | 'waiting' | YES | CHECK: waiting|active|completed |
| last_activity | timestamptz | now() | YES | Activity heartbeat |

Foreign Keys:
- `games_host_id_fkey` → `auth.users.id`
- Referenced by `players.game_id`, `game_events.game_id`

### 2.2 players
| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | text | — | NO | PK |
| game_id | text | — | YES | FK games.id |
| name | text | — | NO |  |
| flag | text | — | YES |  |
| club | text | — | YES |  |
| role | text | 'playerA' | NO | Player role slot |
| score | integer | 0 | YES |  |
| strikes | integer | 0 | YES |  |
| is_connected | boolean | true | YES | Presence flag |
| special_buttons | jsonb | {"PIT_BUTTON":true,"LOCK_BUTTON":true,"TRAVELER_BUTTON":true} | YES | Power-up availability |
| joined_at | timestamptz | now() | YES |  |
| last_active | timestamptz | now() | YES | Activity heartbeat |
| user_id | uuid | — | YES | FK auth.users |
| is_host | boolean | false | YES | Denormalized convenience |
| session_id | text | — | YES | Connection/session tracking |

Foreign Keys:
- `players_game_id_fkey` → `games.id`
- `players_user_id_fkey` → `auth.users.id`

### 2.3 game_events
| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | uuid | gen_random_uuid() | NO | PK |
| game_id | text | — | YES | FK games.id |
| event_type | text | — | NO | Event discriminator |
| event_data | jsonb | — | YES | Payload blob |
| created_at | timestamptz | now() | YES | Insertion timestamp |

Foreign Keys:
- `game_events_game_id_fkey` → `games.id`

## 3. Row Level Security (RLS)
RLS enabled on all three tables (`games`, `players`, `game_events`). Advisor indicates policies call auth functions per row (initplan warnings) and can be optimized by wrapping `auth.*` calls in a subselect: `(select auth.role())` or similar to avoid repeated evaluation.

## 4. Functions (Referenced by Advisors)
- `public.update_updated_at_column` – likely a trigger helper (search_path mutable warning)
- `public.update_last_active` – updates activity timestamp
- `public.validate_security_upgrade` – validation logic post security migration

Action: set explicit `search_path` or add `SET search_path = pg_catalog, public;` inside function definitions to satisfy advisor.

## 5. Extensions Inventory (Selected Active)
| Extension | Schema | Version | Purpose |
|-----------|--------|---------|---------|
| pg_graphql | graphql | 1.5.11 | GraphQL API over Postgres |
| pgcrypto | extensions | 1.3 | Crypto functions (UUID gen, hashing) |
| pg_net | extensions | 0.14.0 | Async HTTP from DB |
| wrappers | extensions | 0.5.3 | FDWs (S3, stripe, etc.) |
| supabase_vault | vault | 0.3.1 | Secrets storage |
| pg_cron | pg_catalog | 1.6 | Scheduled jobs |
| vector | (default) | 0.8.0 | Vector embeddings / similarity |
| pgmq | pgmq | 1.4.4 | Message queue |
| uuid-ossp | extensions | 1.1 | UUID generation |
| pg_stat_statements | extensions | 1.11 | Query statistics |
| pg_hashids | (default) | 1.3 | Hashid encoding |

(Others available but not necessarily enabled.)

## 6. Advisor Findings Summary

### 6.1 Security
| Issue | Objects | Level | Remediation |
|-------|---------|-------|-------------|
| Function search_path mutable | update_updated_at_column, update_last_active, validate_security_upgrade | WARN | Set stable search_path or schema-qualify objects |

### 6.2 Performance
| Issue | Objects | Level | Remediation |
|-------|---------|-------|-------------|
| RLS auth initplan re-evaluation | games (4 policies), players (4), game_events (3) | WARN | Wrap auth/current_setting calls in subselect `(select auth.uid())` |
| Unused indexes | idx_games_host_id, idx_games_status, idx_players_user_id, idx_players_game_user | INFO | Monitor usage; drop if still unused after traffic |

## 7. Gaps / Opportunities Before Redesign
1. No dedicated buckets (storage) documented yet – plan: add buckets for `avatars`, `recordings`, `assets` with RLS + signed URL policies.
2. Event sourcing limited: `game_events` generic; consider specialized tables or composite indexes for query speed (e.g., `(game_id, created_at)` index).
3. Player presence & activity: rely on `last_active`; could add realtime presence channel or ephemeral table for low-latency presence.
4. Missing audit / soft-delete columns (e.g., `deleted_at`) if historical trace required.
5. Functions lack stable search_path declarations (advisor warnings).
6. Policy optimization needed to reduce per-row function calls (scales poorly).
7. No partitioning or archiving strategy for `game_events` growth.
8. Index coverage minimal (no composite indexes on frequent filters). Potential: `(game_id, status)` for games, `(game_id, score)` or `(game_id, strikes)` if leaderboard queries emerge.
9. Vector extension present; could enable similarity search for question bank semantics in future.

## 8. Proposed Next-Step Categories (To be fleshed out separately)
- Storage: design buckets + RLS (avatars, recordings, exports)
- Realtime Channels: per-game presence & scoreboard updates
- Policies: rewrite with optimized auth calls + least privilege
- Functions: encapsulate game phase transitions, scoring atomicity
- Indexing: add composite indexes for hot queries; drop unused ones after monitoring
- Observability: add cron-based cleanup & stats snapshots using `pg_cron`

## 9. Checklist for Redesign Phase (Baseline Ready)
- [x] Snapshot current schema & advisors (this doc)
- [ ] Collect actual query patterns (enable pg_stat_statements analysis window)
- [ ] Define new entities (questions, segments_config, media_assets)
- [ ] Draft migration plan (idempotent, reversible)
- [ ] Add tests for RLS correctness before changes

---
Generated 2025-08-30. Use this file as the baseline reference before applying structural changes.
