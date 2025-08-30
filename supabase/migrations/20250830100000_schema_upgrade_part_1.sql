-- Migration: Schema Upgrade Part 1 - Table Renames and Structure Changes
-- Date: 2025-08-30
-- Description: Rename games to sessions, update FK relationships, and prepare for new structure

-- 1. Rename games table to sessions and update primary key
BEGIN;

-- 1-A: Rename table
ALTER TABLE games RENAME TO sessions;

-- 1-B: Rename PK column to be explicit
ALTER TABLE sessions RENAME COLUMN id TO session_id;

-- 1-C: Update foreign key columns that reference games
ALTER TABLE players RENAME COLUMN game_id TO session_id;
ALTER TABLE game_events RENAME COLUMN game_id TO session_id;

-- 1-D: Update constraints and indexes
-- First drop foreign key constraints that depend on the primary key
ALTER TABLE players DROP CONSTRAINT IF EXISTS players_game_id_fkey;
ALTER TABLE game_events DROP CONSTRAINT IF EXISTS game_events_game_id_fkey;

-- Then drop and recreate the primary key constraint
ALTER TABLE sessions DROP CONSTRAINT IF EXISTS games_pkey;
ALTER TABLE sessions ADD CONSTRAINT sessions_pkey PRIMARY KEY (session_id);

-- Now add the foreign key constraints back with updated references
ALTER TABLE players ADD CONSTRAINT players_session_id_fkey 
  FOREIGN KEY (session_id) REFERENCES sessions(session_id) ON DELETE CASCADE;
ALTER TABLE game_events ADD CONSTRAINT game_events_session_id_fkey 
  FOREIGN KEY (session_id) REFERENCES sessions(session_id) ON DELETE CASCADE;

-- Update indexes
DROP INDEX IF EXISTS idx_games_host_id;
DROP INDEX IF EXISTS idx_games_status;
CREATE INDEX IF NOT EXISTS idx_sessions_host_id ON sessions(host_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_players_session_id ON players(session_id);

-- 2. Add controller_user_id to sessions (for RLS policies)
ALTER TABLE sessions ADD COLUMN controller_user_id UUID REFERENCES auth.users(id);

-- 3. Update players table structure
-- Rename strikes to strikes_legacy (keep old data)
ALTER TABLE players RENAME COLUMN strikes TO strikes_legacy;
-- Rename id to player_id
ALTER TABLE players RENAME COLUMN id TO player_id;
-- Add new columns
ALTER TABLE players ADD COLUMN slot TEXT DEFAULT NULL; -- playerA / playerB / host
-- is_host already exists, keeping it

-- Update players constraints
ALTER TABLE players DROP CONSTRAINT IF EXISTS players_pkey;
ALTER TABLE players ADD CONSTRAINT players_pkey PRIMARY KEY (player_id);

COMMIT;
