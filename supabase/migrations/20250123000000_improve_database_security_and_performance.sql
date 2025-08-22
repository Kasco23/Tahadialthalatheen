-- Migration: Improve Database Security and Performance
-- Created: 2025-01-23
-- Description: Comprehensive improvements including rooms table, secure RLS policies, performance indexes
-- Author: GitHub Copilot
-- 
-- This migration addresses all TODOs from docs/supabase.md:
-- ✅ Create and implement new table "Rooms" for daily room information
-- ✅ Improve policies and supabase settings with secure RLS
-- ✅ Implement game event logging enhancements
-- ✅ Optimize player session tracking
-- ✅ Add game state management improvements

BEGIN;

-- =============================================================================
-- PHASE 1: CREATE ROOMS TABLE FOR DAILY.CO INTEGRATION
-- =============================================================================

-- Create rooms table for Daily.co video room management
CREATE TABLE IF NOT EXISTS public.rooms (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    game_id text NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
    daily_room_name text UNIQUE NOT NULL,
    daily_room_url text,
    created_at timestamptz DEFAULT now() NOT NULL,
    expires_at timestamptz,
    is_active boolean DEFAULT true NOT NULL,
    max_participants integer DEFAULT 10 CHECK (max_participants > 0),
    created_by uuid REFERENCES auth.users(id),
    updated_at timestamptz DEFAULT now() NOT NULL,
    
    -- Ensure only one active room per game
    CONSTRAINT unique_active_room_per_game UNIQUE (game_id, is_active) 
    DEFERRABLE INITIALLY DEFERRED
);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_rooms_updated_at 
    BEFORE UPDATE ON public.rooms 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- PHASE 2: ENHANCE EXISTING TABLES
-- =============================================================================

-- Add session tracking columns to players table
ALTER TABLE public.players 
ADD COLUMN IF NOT EXISTS last_seen timestamptz DEFAULT now(),
ADD COLUMN IF NOT EXISTS session_id text,
ADD COLUMN IF NOT EXISTS connection_status text DEFAULT 'offline' 
    CHECK (connection_status IN ('online', 'offline', 'away'));

-- Add enhanced logging columns to game_events table
ALTER TABLE public.game_events 
ADD COLUMN IF NOT EXISTS player_id text REFERENCES public.players(id),
ADD COLUMN IF NOT EXISTS sequence_number integer,
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}';

-- Add game state management to games table
ALTER TABLE public.games 
ADD COLUMN IF NOT EXISTS last_activity timestamptz DEFAULT now(),
ADD COLUMN IF NOT EXISTS settings jsonb DEFAULT '{}';

-- =============================================================================
-- PHASE 3: CREATE PERFORMANCE INDEXES
-- =============================================================================

-- Games table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_games_host_id ON public.games(host_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_games_status ON public.games(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_games_created_at ON public.games(created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_games_last_activity ON public.games(last_activity);

-- Players table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_players_game_id ON public.players(game_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_players_user_id ON public.players(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_players_connection_status ON public.players(connection_status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_players_last_seen ON public.players(last_seen);

-- Game events table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_game_events_game_id ON public.game_events(game_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_game_events_timestamp ON public.game_events(timestamp);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_game_events_event_type ON public.game_events(event_type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_game_events_player_id ON public.game_events(player_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_game_events_sequence ON public.game_events(game_id, sequence_number);

-- Rooms table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rooms_game_id ON public.rooms(game_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rooms_is_active ON public.rooms(is_active);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rooms_expires_at ON public.rooms(expires_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rooms_daily_room_name ON public.rooms(daily_room_name);

-- =============================================================================
-- PHASE 4: REPLACE INSECURE RLS POLICIES WITH SECURE AUTHENTICATION-BASED ONES
-- =============================================================================

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Allow full access to all users" ON public.games;
DROP POLICY IF EXISTS "Allow full access to all users" ON public.players;
DROP POLICY IF EXISTS "Allow full access to all users" ON public.game_events;

-- ===== GAMES TABLE POLICIES =====
-- Enable RLS
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;

-- Anyone can view active games (for joining)
CREATE POLICY "Anyone can view active games" ON public.games 
    FOR SELECT USING (status IN ('waiting', 'active'));

-- Only authenticated users can create games
CREATE POLICY "Authenticated users can create games" ON public.games 
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Only game host can update their games
CREATE POLICY "Host can update own games" ON public.games 
    FOR UPDATE USING (host_id = auth.uid()::text OR host_id = (auth.jwt() ->> 'sub'));

-- Only game host can delete their games
CREATE POLICY "Host can delete own games" ON public.games 
    FOR DELETE USING (host_id = auth.uid()::text OR host_id = (auth.jwt() ->> 'sub'));

-- ===== PLAYERS TABLE POLICIES =====
-- Enable RLS
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

-- Players can view other players in their games
CREATE POLICY "Players can view players in their games" ON public.players 
    FOR SELECT USING (
        game_id IN (
            SELECT game_id FROM public.players 
            WHERE user_id = auth.uid()::text OR user_id = (auth.jwt() ->> 'sub')
        )
    );

-- Authenticated users can join games
CREATE POLICY "Authenticated users can join games" ON public.players 
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND 
        (user_id = auth.uid()::text OR user_id = (auth.jwt() ->> 'sub'))
    );

-- Players can only update their own records OR game host can update players
CREATE POLICY "Players can update own records or host can update" ON public.players 
    FOR UPDATE USING (
        user_id = auth.uid()::text OR 
        user_id = (auth.jwt() ->> 'sub') OR
        game_id IN (
            SELECT id FROM public.games 
            WHERE host_id = auth.uid()::text OR host_id = (auth.jwt() ->> 'sub')
        )
    );

-- Players can remove themselves OR game host can remove players
CREATE POLICY "Players can remove themselves or host can remove" ON public.players 
    FOR DELETE USING (
        user_id = auth.uid()::text OR 
        user_id = (auth.jwt() ->> 'sub') OR
        game_id IN (
            SELECT id FROM public.games 
            WHERE host_id = auth.uid()::text OR host_id = (auth.jwt() ->> 'sub')
        )
    );

-- ===== GAME_EVENTS TABLE POLICIES =====
-- Enable RLS
ALTER TABLE public.game_events ENABLE ROW LEVEL SECURITY;

-- Players can view events for their games
CREATE POLICY "Players can view events for their games" ON public.game_events 
    FOR SELECT USING (
        game_id IN (
            SELECT game_id FROM public.players 
            WHERE user_id = auth.uid()::text OR user_id = (auth.jwt() ->> 'sub')
        )
    );

-- Only players in the game can log events
CREATE POLICY "Players in game can log events" ON public.game_events 
    FOR INSERT WITH CHECK (
        game_id IN (
            SELECT game_id FROM public.players 
            WHERE user_id = auth.uid()::text OR user_id = (auth.jwt() ->> 'sub')
        )
    );

-- No updates allowed (append-only log)
-- UPDATE policy intentionally omitted for append-only behavior

-- Only game host can delete events
CREATE POLICY "Host can delete events" ON public.game_events 
    FOR DELETE USING (
        game_id IN (
            SELECT id FROM public.games 
            WHERE host_id = auth.uid()::text OR host_id = (auth.jwt() ->> 'sub')
        )
    );

-- ===== ROOMS TABLE POLICIES =====
-- Enable RLS
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

-- Players in the game can view room info
CREATE POLICY "Players can view room info for their games" ON public.rooms 
    FOR SELECT USING (
        game_id IN (
            SELECT game_id FROM public.players 
            WHERE user_id = auth.uid()::text OR user_id = (auth.jwt() ->> 'sub')
        )
    );

-- Only game host can create rooms
CREATE POLICY "Host can create rooms" ON public.rooms 
    FOR INSERT WITH CHECK (
        game_id IN (
            SELECT id FROM public.games 
            WHERE host_id = auth.uid()::text OR host_id = (auth.jwt() ->> 'sub')
        )
    );

-- Only game host can update rooms
CREATE POLICY "Host can update rooms" ON public.rooms 
    FOR UPDATE USING (
        game_id IN (
            SELECT id FROM public.games 
            WHERE host_id = auth.uid()::text OR host_id = (auth.jwt() ->> 'sub')
        )
    );

-- Only game host can delete rooms
CREATE POLICY "Host can delete rooms" ON public.rooms 
    FOR DELETE USING (
        game_id IN (
            SELECT id FROM public.games 
            WHERE host_id = auth.uid()::text OR host_id = (auth.jwt() ->> 'sub')
        )
    );

-- =============================================================================
-- PHASE 5: UTILITY FUNCTIONS AND OPTIMIZATIONS
-- =============================================================================

-- Function to clean up expired rooms
CREATE OR REPLACE FUNCTION cleanup_expired_rooms()
RETURNS integer AS $$
DECLARE
    deleted_count integer;
BEGIN
    DELETE FROM public.rooms 
    WHERE expires_at < now() AND is_active = false;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to update player last_seen timestamp
CREATE OR REPLACE FUNCTION update_player_last_seen(player_id_param text)
RETURNS void AS $$
BEGIN
    UPDATE public.players 
    SET last_seen = now(), connection_status = 'online'
    WHERE id = player_id_param;
END;
$$ LANGUAGE plpgsql;

-- Function to get active players in a game
CREATE OR REPLACE FUNCTION get_active_players(game_id_param text)
RETURNS TABLE(
    id text,
    user_id text,
    display_name text,
    connection_status text,
    last_seen timestamptz
) AS $$
BEGIN
    RETURN QUERY
    SELECT p.id, p.user_id, p.display_name, p.connection_status, p.last_seen
    FROM public.players p
    WHERE p.game_id = game_id_param 
    AND p.connection_status IN ('online', 'away')
    ORDER BY p.last_seen DESC;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- PHASE 6: ENABLE REALTIME FOR BETTER PERFORMANCE
-- =============================================================================

-- Enable realtime on all tables for better real-time functionality
ALTER publication supabase_realtime ADD table public.rooms;

-- Ensure all our tables are included in realtime (if not already)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'games'
    ) THEN
        ALTER publication supabase_realtime ADD table public.games;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'players'
    ) THEN
        ALTER publication supabase_realtime ADD table public.players;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'game_events'
    ) THEN
        ALTER publication supabase_realtime ADD table public.game_events;
    END IF;
END $$;

-- =============================================================================
-- COMMIT TRANSACTION
-- =============================================================================

COMMIT;

-- =============================================================================
-- POST-MIGRATION NOTES
-- =============================================================================

-- This migration includes:
-- ✅ New rooms table for Daily.co integration with proper foreign keys
-- ✅ Secure RLS policies using auth.uid() instead of permissive "Anyone can..." policies
-- ✅ Performance indexes for frequently queried columns
-- ✅ Enhanced session tracking with last_seen and connection_status
-- ✅ Improved game event logging with player references and metadata
-- ✅ Utility functions for common operations
-- ✅ Realtime enabled for all tables
-- 
-- Security improvements:
-- - Games: Only hosts can modify their games, anyone can view active games
-- - Players: Users can only modify their own records, hosts can manage players
-- - Game Events: Append-only logging, only players in game can create events
-- - Rooms: Only hosts can manage rooms, players in game can view room info
--
-- Performance improvements:
-- - Indexes on frequently queried columns
-- - Optimized queries for player status and game events
-- - Cleanup function for expired rooms
--
-- To rollback this migration if needed:
-- 1. Drop the rooms table: DROP TABLE IF EXISTS public.rooms CASCADE;
-- 2. Remove added columns from existing tables
-- 3. Restore original permissive RLS policies
-- 4. Drop the created indexes and functions
