-- ============================================
-- CRITICAL SECURITY AND SCHEMA FIXES
-- Date: 2025-01-28
-- Author: GitHub Copilot Supabase Architect
-- ============================================

-- First, drop all existing insecure policies
DROP POLICY IF EXISTS "Allow All" ON public.game_events;
DROP POLICY IF EXISTS "Anyone can create game_events" ON public.game_events;
DROP POLICY IF EXISTS "Anyone can read game_events" ON public.game_events;
DROP POLICY IF EXISTS "Anyone can create games" ON public.games;
DROP POLICY IF EXISTS "Anyone can delete games" ON public.games;
DROP POLICY IF EXISTS "Anyone can read games" ON public.games;
DROP POLICY IF EXISTS "Anyone can update games" ON public.games;
DROP POLICY IF EXISTS "Anyone can create players" ON public.players;
DROP POLICY IF EXISTS "Anyone can delete players" ON public.players;
DROP POLICY IF EXISTS "Anyone can read players" ON public.players;
DROP POLICY IF EXISTS "Anyone can update players" ON public.players;

-- ============================================
-- SCHEMA UPDATES TO MATCH DOCUMENTATION
-- ============================================

-- Update games table to match documented schema
ALTER TABLE public.games
  DROP COLUMN IF EXISTS host_name,
  DROP COLUMN IF EXISTS phase,
  DROP COLUMN IF EXISTS host_code,
  DROP COLUMN IF EXISTS host_is_connected;

-- Add missing columns with proper auth integration
ALTER TABLE public.games
  ADD COLUMN IF NOT EXISTS host_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'completed')),
  ADD COLUMN IF NOT EXISTS settings jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS last_activity timestamptz DEFAULT now();

-- Update game_events table
ALTER TABLE public.game_events
  RENAME COLUMN event_data TO data;

ALTER TABLE public.game_events
  ADD COLUMN IF NOT EXISTS player_id text,
  ADD COLUMN IF NOT EXISTS sequence_number integer,
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}';

-- Update players table to match documented schema
ALTER TABLE public.players
  DROP COLUMN IF EXISTS flag,
  DROP COLUMN IF EXISTS club,
  DROP COLUMN IF EXISTS role,
  DROP COLUMN IF EXISTS strikes,
  DROP COLUMN IF EXISTS special_buttons;

ALTER TABLE public.players
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS is_host boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_seen timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS session_id text;

-- Update existing columns instead of renaming to avoid conflicts
-- Convert is_connected boolean to connection_status text
ALTER TABLE public.players
  DROP COLUMN IF EXISTS is_connected,
  ADD COLUMN IF NOT EXISTS connection_status text DEFAULT 'online' CHECK (connection_status IN ('online', 'offline', 'away'));

-- Rename columns that don't conflict
ALTER TABLE public.players RENAME COLUMN name TO display_name;

-- Create the missing rooms table
CREATE TABLE IF NOT EXISTS public.rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id text NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  daily_room_name text UNIQUE NOT NULL,
  daily_room_url text NOT NULL,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL,
  is_active boolean DEFAULT true,
  max_participants integer DEFAULT 10,
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on rooms table
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

-- Add unique constraint for one active room per game
CREATE UNIQUE INDEX IF NOT EXISTS idx_rooms_game_active
ON public.rooms (game_id) WHERE is_active = true;

-- ============================================
-- PERFORMANCE INDEXES FOR RLS OPTIMIZATION
-- ============================================

-- Indexes for RLS policy columns (critical for performance)
CREATE INDEX IF NOT EXISTS idx_games_host_id ON public.games (host_id);
CREATE INDEX IF NOT EXISTS idx_games_status ON public.games (status);
CREATE INDEX IF NOT EXISTS idx_games_last_activity ON public.games (last_activity);

CREATE INDEX IF NOT EXISTS idx_players_user_id ON public.players (user_id);
CREATE INDEX IF NOT EXISTS idx_players_game_id_user_id ON public.players (game_id, user_id);
CREATE INDEX IF NOT EXISTS idx_players_connection_status ON public.players (connection_status);
CREATE INDEX IF NOT EXISTS idx_players_last_seen ON public.players (last_seen);

CREATE INDEX IF NOT EXISTS idx_game_events_game_id_timestamp ON public.game_events (game_id, created_at);
CREATE INDEX IF NOT EXISTS idx_game_events_player_id ON public.game_events (player_id);
CREATE INDEX IF NOT EXISTS idx_game_events_sequence ON public.game_events (game_id, sequence_number);

CREATE INDEX IF NOT EXISTS idx_rooms_game_id ON public.rooms (game_id);
CREATE INDEX IF NOT EXISTS idx_rooms_created_by ON public.rooms (created_by);
CREATE INDEX IF NOT EXISTS idx_rooms_expires_at ON public.rooms (expires_at);
CREATE INDEX IF NOT EXISTS idx_rooms_is_active ON public.rooms (is_active);

-- ============================================
-- SECURE RLS POLICIES WITH AUTH INTEGRATION
-- ============================================

-- Games table policies
CREATE POLICY "games_select_policy" ON public.games
  FOR SELECT TO authenticated, anon
  USING (
    status = 'waiting' OR -- Allow viewing of waiting games for joining
    (SELECT auth.uid()) = host_id OR -- Host can always view their games
    EXISTS (
      SELECT 1 FROM public.players
      WHERE game_id = games.id
      AND user_id = (SELECT auth.uid())
    ) -- Players can view their games
  );

CREATE POLICY "games_insert_policy" ON public.games
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = host_id);

CREATE POLICY "games_update_policy" ON public.games
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = host_id)
  WITH CHECK ((SELECT auth.uid()) = host_id);

CREATE POLICY "games_delete_policy" ON public.games
  FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = host_id);

-- Players table policies
CREATE POLICY "players_select_policy" ON public.players
  FOR SELECT TO authenticated, anon
  USING (
    EXISTS (
      SELECT 1 FROM public.players p2
      WHERE p2.game_id = players.game_id
      AND p2.user_id = (SELECT auth.uid())
    ) OR -- Players can see other players in their games
    EXISTS (
      SELECT 1 FROM public.games g
      WHERE g.id = players.game_id
      AND g.host_id = (SELECT auth.uid())
    ) -- Game host can see all players
  );

CREATE POLICY "players_insert_policy" ON public.players
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = user_id AND -- Can only insert own user_id
    EXISTS (
      SELECT 1 FROM public.games
      WHERE id = game_id
      AND status = 'waiting' -- Can only join waiting games
    )
  );

CREATE POLICY "players_update_policy" ON public.players
  FOR UPDATE TO authenticated
  USING (
    (SELECT auth.uid()) = user_id OR -- Players can update their own records
    EXISTS (
      SELECT 1 FROM public.games g
      WHERE g.id = players.game_id
      AND g.host_id = (SELECT auth.uid())
    ) -- Game host can update any player
  )
  WITH CHECK (
    (SELECT auth.uid()) = user_id OR -- Players can update their own records
    EXISTS (
      SELECT 1 FROM public.games g
      WHERE g.id = players.game_id
      AND g.host_id = (SELECT auth.uid())
    ) -- Game host can update any player
  );

CREATE POLICY "players_delete_policy" ON public.players
  FOR DELETE TO authenticated
  USING (
    (SELECT auth.uid()) = user_id OR -- Players can remove themselves
    EXISTS (
      SELECT 1 FROM public.games g
      WHERE g.id = players.game_id
      AND g.host_id = (SELECT auth.uid())
    ) -- Game host can remove any player
  );

-- Game events table policies (append-only log)
CREATE POLICY "game_events_select_policy" ON public.game_events
  FOR SELECT TO authenticated, anon
  USING (
    EXISTS (
      SELECT 1 FROM public.players p
      WHERE p.game_id = game_events.game_id
      AND p.user_id = (SELECT auth.uid())
    ) OR -- Players can view events for their games
    EXISTS (
      SELECT 1 FROM public.games g
      WHERE g.id = game_events.game_id
      AND g.host_id = (SELECT auth.uid())
    ) -- Game host can view all events
  );

CREATE POLICY "game_events_insert_policy" ON public.game_events
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.players p
      WHERE p.game_id = game_events.game_id
      AND p.user_id = (SELECT auth.uid())
    ) OR -- Only players in the game can log events
    EXISTS (
      SELECT 1 FROM public.games g
      WHERE g.id = game_events.game_id
      AND g.host_id = (SELECT auth.uid())
    ) -- Game host can log events
  );

-- No UPDATE policy for game_events (append-only)

CREATE POLICY "game_events_delete_policy" ON public.game_events
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.games g
      WHERE g.id = game_events.game_id
      AND g.host_id = (SELECT auth.uid())
    ) -- Only game host can delete events
  );

-- Rooms table policies
CREATE POLICY "rooms_select_policy" ON public.rooms
  FOR SELECT TO authenticated, anon
  USING (
    EXISTS (
      SELECT 1 FROM public.players p
      WHERE p.game_id = rooms.game_id
      AND p.user_id = (SELECT auth.uid())
    ) OR -- Players can view rooms for their games
    EXISTS (
      SELECT 1 FROM public.games g
      WHERE g.id = rooms.game_id
      AND g.host_id = (SELECT auth.uid())
    ) -- Game host can view rooms
  );

CREATE POLICY "rooms_insert_policy" ON public.rooms
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.games g
      WHERE g.id = rooms.game_id
      AND g.host_id = (SELECT auth.uid())
    ) AND -- Only game host can create rooms
    (SELECT auth.uid()) = created_by -- Must match creator
  );

CREATE POLICY "rooms_update_policy" ON public.rooms
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.games g
      WHERE g.id = rooms.game_id
      AND g.host_id = (SELECT auth.uid())
    ) -- Only game host can update rooms
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.games g
      WHERE g.id = rooms.game_id
      AND g.host_id = (SELECT auth.uid())
    ) -- Only game host can update rooms
  );

CREATE POLICY "rooms_delete_policy" ON public.rooms
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.games g
      WHERE g.id = rooms.game_id
      AND g.host_id = (SELECT auth.uid())
    ) -- Only game host can delete rooms
  );

-- ============================================
-- UTILITY FUNCTIONS FOR COMMON OPERATIONS
-- ============================================

-- Security definer function to check if user is game host (optimized for RLS)
CREATE OR REPLACE FUNCTION public.is_game_host(game_id_param text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.games
    WHERE id = game_id_param
    AND host_id = auth.uid()
  );
END;
$$;

-- Security definer function to check if user is in game (optimized for RLS)
CREATE OR REPLACE FUNCTION public.is_game_participant(game_id_param text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.players
    WHERE game_id = game_id_param
    AND user_id = auth.uid()
  );
END;
$$;

-- Function to update player last seen timestamp
CREATE OR REPLACE FUNCTION public.update_player_last_seen(player_id_param text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.players
  SET last_seen = now()
  WHERE id = player_id_param
  AND user_id = auth.uid(); -- Security check
END;
$$;

-- Function to cleanup expired rooms
CREATE OR REPLACE FUNCTION public.cleanup_expired_rooms()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.rooms
  WHERE expires_at < now()
  AND is_active = false;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Function to get active players for a game
CREATE OR REPLACE FUNCTION public.get_active_players(game_id_param text)
RETURNS TABLE (
  id text,
  display_name text,
  score integer,
  connection_status text,
  last_seen timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Security check: user must be in the game or be the host
  IF NOT (public.is_game_participant(game_id_param) OR public.is_game_host(game_id_param)) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT p.id, p.display_name, p.score, p.connection_status, p.last_seen
  FROM public.players p
  WHERE p.game_id = game_id_param
  AND p.connection_status IN ('online', 'away')
  ORDER BY p.score DESC, p.created_at ASC;
END;
$$;

-- ============================================
-- REALTIME CONFIGURATION
-- ============================================

-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.games;
ALTER PUBLICATION supabase_realtime ADD TABLE public.players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;

-- ============================================
-- TRIGGER UPDATES
-- ============================================

-- Update triggers for new columns
CREATE OR REPLACE FUNCTION public.update_last_activity()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.last_activity = now();
  RETURN NEW;
END;
$$;

-- Add trigger for games last_activity
DROP TRIGGER IF EXISTS update_games_last_activity ON public.games;
CREATE TRIGGER update_games_last_activity
  BEFORE UPDATE ON public.games
  FOR EACH ROW
  EXECUTE FUNCTION public.update_last_activity();

-- Add trigger for rooms updated_at
CREATE TRIGGER update_rooms_updated_at
  BEFORE UPDATE ON public.rooms
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Update player last_seen trigger
DROP TRIGGER IF EXISTS update_players_last_active ON public.players;
CREATE TRIGGER update_players_last_seen
  BEFORE UPDATE ON public.players
  FOR EACH ROW
  EXECUTE FUNCTION public.update_last_active();

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE public.games IS 'Game sessions with secure host-based access control';
COMMENT ON TABLE public.players IS 'Players linked to games with auth integration';
COMMENT ON TABLE public.game_events IS 'Append-only event log for game actions';
COMMENT ON TABLE public.rooms IS 'Daily.co video room management';

COMMENT ON FUNCTION public.is_game_host(text) IS 'Security definer function to check game host status';
COMMENT ON FUNCTION public.is_game_participant(text) IS 'Security definer function to check game participation';
COMMENT ON FUNCTION public.cleanup_expired_rooms() IS 'Maintenance function to remove expired video rooms';
