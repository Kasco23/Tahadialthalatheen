-- Migration: Schema Upgrade Part 3 - RLS Policies
-- Date: 2025-08-30
-- Description: Create Row Level Security policies for all new tables

BEGIN;

-- Drop existing policies if they exist (for clean migration)
DROP POLICY IF EXISTS "controller_rw" ON sessions;
DROP POLICY IF EXISTS "lobby_read" ON lobbies;
DROP POLICY IF EXISTS "lobby_write" ON lobbies;
DROP POLICY IF EXISTS "rooms_read" ON rooms;
DROP POLICY IF EXISTS "rooms_write" ON rooms;
DROP POLICY IF EXISTS "session_segments_read" ON session_segments;
DROP POLICY IF EXISTS "session_segments_write" ON session_segments;
DROP POLICY IF EXISTS "questions_pool_read" ON questions_pool;
DROP POLICY IF EXISTS "session_questions_read" ON session_questions;
DROP POLICY IF EXISTS "session_questions_write" ON session_questions;
DROP POLICY IF EXISTS "session_events_read" ON session_events;
DROP POLICY IF EXISTS "session_events_write" ON session_events;

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

-- Update existing players table policies if needed
-- (Assuming similar pattern - controller and session participants can access)

COMMIT;
