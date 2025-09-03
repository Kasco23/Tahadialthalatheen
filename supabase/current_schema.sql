--
-- Current Schema for Tahadialthalatheen Project
-- Generated from recent migrations (2025-08-30)
-- Description: Complete schema reflecting all applied migrations
--

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";
CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";

COMMENT ON SCHEMA "public" IS 'standard public schema';

-- Core Tables

-- Sessions table (renamed from games)
CREATE TABLE IF NOT EXISTS "public"."sessions" (
    "session_id" text PRIMARY KEY,
    "host_name" text,
    "host_id" text,
    "controller_user_id" UUID REFERENCES auth.users(id),
    "phase" text NOT NULL DEFAULT 'CONFIG',
    "current_segment" text DEFAULT '',
    "current_question_index" integer DEFAULT 0,
    "timer" integer DEFAULT 0,
    "is_timer_running" boolean DEFAULT false,
    "video_room_url" text,
    "video_room_created" boolean DEFAULT false,
    "segment_settings" jsonb DEFAULT '{"AUCT": 8, "BELL": 12, "REMO": 5, "SING": 6, "WSHA": 10}',
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    "last_activity" timestamptz DEFAULT now(),
    "host_code" text NOT NULL DEFAULT '',
    "host_is_connected" boolean
);

ALTER TABLE "public"."sessions" ENABLE ROW LEVEL SECURITY;

-- Players table (updated structure)
CREATE TABLE IF NOT EXISTS "public"."players" (
    "player_id" text PRIMARY KEY,
    "session_id" text REFERENCES sessions(session_id) ON DELETE CASCADE,
    "user_id" UUID REFERENCES auth.users(id),
    "name" text NOT NULL,
    "flag" text,
    "club" text,
    "role" text NOT NULL DEFAULT 'playerA',
    "slot" text DEFAULT NULL, -- playerA / playerB / host
    "score" integer DEFAULT 0,
    "strikes_legacy" integer DEFAULT 0, -- old strikes column
    "is_host" boolean DEFAULT false,
    "is_connected" boolean DEFAULT true,
    "special_buttons" jsonb DEFAULT '{"PIT_BUTTON": true, "LOCK_BUTTON": true, "TRAVELER_BUTTON": true}',
    "joined_at" timestamptz DEFAULT now(),
    "last_active" timestamptz DEFAULT now()
);

ALTER TABLE "public"."players" ENABLE ROW LEVEL SECURITY;

-- Lobbies table
CREATE TABLE IF NOT EXISTS "public"."lobbies" (
    "session_id" text PRIMARY KEY REFERENCES sessions(session_id) ON DELETE CASCADE,
    "host_connected" boolean NOT NULL DEFAULT false,
    "playerA_connected" boolean NOT NULL DEFAULT false,
    "playerB_connected" boolean NOT NULL DEFAULT false,
    "room_state" text DEFAULT 'not_created',
    "updated_at" timestamptz DEFAULT now()
);

ALTER TABLE "public"."lobbies" ENABLE ROW LEVEL SECURITY;

-- Rooms table
CREATE TABLE IF NOT EXISTS "public"."rooms" (
    "room_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "session_id" text REFERENCES sessions(session_id) ON DELETE CASCADE,
    "daily_room_name" text NOT NULL,
    "url" text NOT NULL,
    "started_at" timestamptz DEFAULT now(),
    "ended_at" timestamptz,
    "participant_count" integer DEFAULT 0,
    "recording_url" text,
    "is_active" boolean DEFAULT true,
    "created_by" UUID REFERENCES auth.users(id),
    "config" jsonb
);

ALTER TABLE "public"."rooms" ENABLE ROW LEVEL SECURITY;

-- Session segments table
CREATE TABLE IF NOT EXISTS "public"."session_segments" (
    "session_id" text REFERENCES sessions(session_id) ON DELETE CASCADE,
    "segment_code" text,
    "current_question" integer DEFAULT 0,
    "questions_total" integer NOT NULL,
    "playerA_strikes" integer DEFAULT 0,
    "playerB_strikes" integer DEFAULT 0,
    PRIMARY KEY (session_id, segment_code)
);

ALTER TABLE "public"."session_segments" ENABLE ROW LEVEL SECURITY;

-- Questions pool table
CREATE TABLE IF NOT EXISTS "public"."questions_pool" (
    "question_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "segment_code" text NOT NULL,
    "prompt" text NOT NULL,
    "choices" jsonb,
    "answer" integer,
    "media_url" text
);

ALTER TABLE "public"."questions_pool" ENABLE ROW LEVEL SECURITY;

-- Session questions table
CREATE TABLE IF NOT EXISTS "public"."session_questions" (
    "session_id" text REFERENCES sessions(session_id) ON DELETE CASCADE,
    "question_id" UUID REFERENCES questions_pool(question_id) ON DELETE CASCADE,
    "segment_code" text NOT NULL,
    "sequence" integer,
    PRIMARY KEY (session_id, question_id)
);

ALTER TABLE "public"."session_questions" ENABLE ROW LEVEL SECURITY;

-- Session events table (replacing game_events)
CREATE TABLE IF NOT EXISTS "public"."session_events" (
    "event_id" bigserial PRIMARY KEY,
    "session_id" text REFERENCES sessions(session_id) ON DELETE CASCADE,
    "event_type" text,
    "payload" jsonb,
    "created_at" timestamptz DEFAULT now()
);

ALTER TABLE "public"."session_events" ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sessions_host_id ON sessions(host_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(phase);
CREATE INDEX IF NOT EXISTS idx_players_session_id ON players(session_id);
CREATE INDEX IF NOT EXISTS rooms_session_idx ON rooms(session_id);
CREATE INDEX IF NOT EXISTS session_events_session_idx ON session_events(session_id);
CREATE INDEX IF NOT EXISTS session_events_created_at_idx ON session_events(created_at);
CREATE INDEX IF NOT EXISTS session_events_type_idx ON session_events(event_type);

-- Functions
CREATE OR REPLACE FUNCTION update_last_active()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.last_active = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION update_session_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE sessions 
  SET last_activity = now()
  WHERE session_id = NEW.session_id;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION housekeeping_expired_sessions() 
RETURNS VOID 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
BEGIN
  -- Mark sessions completed if older than 48h and still in LOBBY/PLAYING
  UPDATE sessions
  SET phase = 'COMPLETED'
  WHERE phase IN ('LOBBY','PLAYING')
    AND created_at < now() - INTERVAL '48 hours';

  -- Mark rooms as inactive for completed sessions
  UPDATE rooms
  SET is_active = false, ended_at = now()
  WHERE session_id IN (
    SELECT session_id FROM sessions WHERE phase = 'COMPLETED'
  ) AND is_active = true;

  -- Log the cleanup
  INSERT INTO session_events (session_id, event_type, payload)
  SELECT session_id, 'SYSTEM_CLEANUP', 
         jsonb_build_object('action', 'expired_session_cleanup', 'timestamp', now())
  FROM sessions 
  WHERE phase = 'COMPLETED' 
    AND updated_at > now() - INTERVAL '1 hour'; -- Only log recent cleanups
END $$;

-- Triggers
CREATE TRIGGER update_sessions_updated_at
  BEFORE UPDATE ON sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_players_last_active
  BEFORE UPDATE ON players
  FOR EACH ROW
  EXECUTE FUNCTION update_last_active();

CREATE TRIGGER update_activity_on_player_change
  AFTER INSERT OR UPDATE ON players
  FOR EACH ROW
  EXECUTE FUNCTION update_session_activity();

CREATE TRIGGER update_activity_on_event
  AFTER INSERT ON session_events
  FOR EACH ROW
  EXECUTE FUNCTION update_session_activity();

-- Row Level Security Policies

-- Sessions: owner (controller) can do anything
CREATE POLICY "controller_rw" ON sessions
  FOR ALL
  USING (auth.uid() = controller_user_id);

-- Lobbies: visible to anyone linked to that session
CREATE POLICY "lobby_read" ON lobbies
  FOR SELECT
  USING (
    auth.uid() = (SELECT controller_user_id FROM sessions s WHERE s.session_id = lobbies.session_id)
    OR auth.uid() IN (SELECT user_id FROM players p WHERE p.session_id = lobbies.session_id)
  );

CREATE POLICY "lobby_write" ON lobbies
  FOR ALL
  USING (
    auth.uid() = (SELECT controller_user_id FROM sessions s WHERE s.session_id = lobbies.session_id)
  );

-- Rooms: visible to session participants
CREATE POLICY "rooms_read" ON rooms
  FOR SELECT
  USING (
    auth.uid() = (SELECT controller_user_id FROM sessions s WHERE s.session_id = rooms.session_id)
    OR auth.uid() IN (SELECT user_id FROM players p WHERE p.session_id = rooms.session_id)
  );

CREATE POLICY "rooms_write" ON rooms
  FOR ALL
  USING (
    auth.uid() = (SELECT controller_user_id FROM sessions s WHERE s.session_id = rooms.session_id)
  );

-- Session segments: readable by participants, writable by controller
CREATE POLICY "session_segments_read" ON session_segments
  FOR SELECT
  USING (
    auth.uid() = (SELECT controller_user_id FROM sessions s WHERE s.session_id = session_segments.session_id)
    OR auth.uid() IN (SELECT user_id FROM players p WHERE p.session_id = session_segments.session_id)
  );

CREATE POLICY "session_segments_write" ON session_segments
  FOR ALL
  USING (
    auth.uid() = (SELECT controller_user_id FROM sessions s WHERE s.session_id = session_segments.session_id)
  );

-- Questions pool: public read for now (can be restricted later)
CREATE POLICY "questions_pool_read" ON questions_pool
  FOR SELECT
  TO authenticated
  USING (true);

-- Session questions: readable by participants
CREATE POLICY "session_questions_read" ON session_questions
  FOR SELECT
  USING (
    auth.uid() = (SELECT controller_user_id FROM sessions s WHERE s.session_id = session_questions.session_id)
    OR auth.uid() IN (SELECT user_id FROM players p WHERE p.session_id = session_questions.session_id)
  );

CREATE POLICY "session_questions_write" ON session_questions
  FOR ALL
  USING (
    auth.uid() = (SELECT controller_user_id FROM sessions s WHERE s.session_id = session_questions.session_id)
  );

-- Session events: readable by participants, writable by controller and players
CREATE POLICY "session_events_read" ON session_events
  FOR SELECT
  USING (
    auth.uid() = (SELECT controller_user_id FROM sessions s WHERE s.session_id = session_events.session_id)
    OR auth.uid() IN (SELECT user_id FROM players p WHERE p.session_id = session_events.session_id)
  );

CREATE POLICY "session_events_write" ON session_events
  FOR INSERT
  WITH CHECK (
    auth.uid() = (SELECT controller_user_id FROM sessions s WHERE s.session_id = session_events.session_id)
    OR auth.uid() IN (SELECT user_id FROM players p WHERE p.session_id = session_events.session_id)
  );

-- Realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE lobbies;
ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE session_segments;
ALTER PUBLICATION supabase_realtime ADD TABLE session_events;

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;