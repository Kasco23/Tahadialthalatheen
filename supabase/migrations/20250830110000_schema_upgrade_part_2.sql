-- Migration: Schema Upgrade Part 2 - New Tables
-- Date: 2025-08-30
-- Description: Create new core tables (lobbies, rooms, session_segments, questions)

BEGIN;

-- Try to enable pg_partman extension if available (optional)
-- CREATE EXTENSION IF NOT EXISTS pg_partman;
-- Note: pg_partman may not be available in all Supabase instances

-- 2-A: lobbies table
CREATE TABLE IF NOT EXISTS lobbies (
  session_id TEXT PRIMARY KEY REFERENCES sessions(session_id) ON DELETE CASCADE,
  host_connected BOOLEAN NOT NULL DEFAULT false,
  playerA_connected BOOLEAN NOT NULL DEFAULT false,
  playerB_connected BOOLEAN NOT NULL DEFAULT false,
  room_state TEXT DEFAULT 'not_created',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for lobbies
ALTER TABLE lobbies ENABLE ROW LEVEL SECURITY;

-- 2-B: rooms table
CREATE TABLE IF NOT EXISTS rooms (
  room_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT REFERENCES sessions(session_id) ON DELETE CASCADE,
  daily_room_name TEXT NOT NULL,
  url TEXT NOT NULL,
  started_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ,
  participant_count INT DEFAULT 0,
  recording_url TEXT,
  is_active BOOLEAN DEFAULT true
);

-- Enable RLS for rooms
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

-- Create index for rooms
CREATE INDEX IF NOT EXISTS rooms_session_idx ON rooms(session_id);

-- 2-C: session_segments table
CREATE TABLE IF NOT EXISTS session_segments (
  session_id TEXT REFERENCES sessions(session_id) ON DELETE CASCADE,
  segment_code TEXT,
  current_question INT DEFAULT 0,
  questions_total INT NOT NULL,
  playerA_strikes INT DEFAULT 0,
  playerB_strikes INT DEFAULT 0,
  PRIMARY KEY (session_id, segment_code)
);

-- Enable RLS for session_segments
ALTER TABLE session_segments ENABLE ROW LEVEL SECURITY;

-- 2-D: questions_pool and session_questions tables
CREATE TABLE IF NOT EXISTS questions_pool (
  question_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  segment_code TEXT NOT NULL,
  prompt TEXT NOT NULL,
  choices JSONB,
  answer INT,
  media_url TEXT
);

-- Enable RLS for questions_pool
ALTER TABLE questions_pool ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS session_questions (
  session_id TEXT REFERENCES sessions(session_id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions_pool(question_id) ON DELETE CASCADE,
  segment_code TEXT NOT NULL,
  sequence INT,
  PRIMARY KEY (session_id, question_id)
);

-- Enable RLS for session_questions
ALTER TABLE session_questions ENABLE ROW LEVEL SECURITY;

-- 2-E: Session events table (replacing game_events)
-- Note: Partitioning with pg_partman is optional and may not be available
-- For now, create a simple session_events table with proper indexing
CREATE TABLE IF NOT EXISTS session_events (
  event_id BIGSERIAL PRIMARY KEY,
  session_id TEXT REFERENCES sessions(session_id) ON DELETE CASCADE,
  event_type TEXT,
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for session_events
ALTER TABLE session_events ENABLE ROW LEVEL SECURITY;

-- Create indexes for session_events
CREATE INDEX IF NOT EXISTS session_events_session_idx ON session_events(session_id);
CREATE INDEX IF NOT EXISTS session_events_created_at_idx ON session_events(created_at);
CREATE INDEX IF NOT EXISTS session_events_type_idx ON session_events(event_type);

COMMIT;
