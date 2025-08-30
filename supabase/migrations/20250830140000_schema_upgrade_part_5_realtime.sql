-- Migration: Schema Upgrade Part 5 - Realtime and Cleanup
-- Date: 2025-08-30
-- Description: Update realtime publication and create housekeeping functions

BEGIN;

-- 1. Update realtime publication
-- First, check what tables are currently in the publication
-- SELECT schemaname, tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime';

-- Add new tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE lobbies;
ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE session_segments;
ALTER PUBLICATION supabase_realtime ADD TABLE session_events;

-- Alternatively, you can recreate the publication with all tables:
-- DROP PUBLICATION IF EXISTS supabase_realtime;
-- CREATE PUBLICATION supabase_realtime
--   FOR TABLE sessions, lobbies, players, rooms,
--       session_segments, session_events, questions_pool, session_questions;

-- 2. Create housekeeping function for expired sessions
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

-- 3. Schedule the housekeeping function (requires pg_cron extension)
-- Note: This requires pg_cron to be enabled and may need superuser permissions
-- SELECT cron.schedule('nightly_session_cleanup',
--                      '0 4 * * *',
--                      $$CALL housekeeping_expired_sessions();$$);

-- 4. Create helper function to update last_activity
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

-- 5. Create triggers for activity updates
DROP TRIGGER IF EXISTS update_activity_on_player_change ON players;
CREATE TRIGGER update_activity_on_player_change
  AFTER INSERT OR UPDATE ON players
  FOR EACH ROW
  EXECUTE FUNCTION update_session_activity();

DROP TRIGGER IF EXISTS update_activity_on_event ON session_events;
CREATE TRIGGER update_activity_on_event
  AFTER INSERT ON session_events
  FOR EACH ROW
  EXECUTE FUNCTION update_session_activity();

COMMIT;
