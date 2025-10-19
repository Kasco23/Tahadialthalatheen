-- Create Matches table to record game results
-- This table stores the outcome of each completed quiz game

CREATE TABLE IF NOT EXISTS public."Matches" (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  session_id uuid NOT NULL REFERENCES public."Sessions"(session_id) ON DELETE CASCADE,
  home_player_id uuid NOT NULL REFERENCES public."Profiles"(id) ON DELETE CASCADE,
  away_player_id uuid NOT NULL REFERENCES public."Profiles"(id) ON DELETE CASCADE,
  winner_id uuid REFERENCES public."Profiles"(id) ON DELETE SET NULL,
  home_total_points integer NOT NULL DEFAULT 0,
  away_total_points integer NOT NULL DEFAULT 0,
  total_points integer GENERATED ALWAYS AS (home_total_points + away_total_points) STORED,
  segments_played jsonb DEFAULT '[]',
  played_at timestamptz DEFAULT now(),
  CONSTRAINT different_players CHECK (home_player_id != away_player_id),
  CONSTRAINT valid_winner CHECK (winner_id IS NULL OR winner_id = home_player_id OR winner_id = away_player_id)
);

-- Create indexes for performance
CREATE INDEX matches_session_idx ON public."Matches"(session_id);
CREATE INDEX matches_home_player_idx ON public."Matches"(home_player_id);
CREATE INDEX matches_away_player_idx ON public."Matches"(away_player_id);
CREATE INDEX matches_winner_idx ON public."Matches"(winner_id);
CREATE INDEX matches_played_at_idx ON public."Matches"(played_at DESC);
CREATE INDEX matches_total_points_idx ON public."Matches"(total_points DESC);

-- Add comments
COMMENT ON TABLE public."Matches" IS 'Records completed quiz game matches with scores and winners';
COMMENT ON COLUMN public."Matches".home_player_id IS 'Player in the "home" position (formerly Player1)';
COMMENT ON COLUMN public."Matches".away_player_id IS 'Player in the "away" position (formerly Player2)';
COMMENT ON COLUMN public."Matches".winner_id IS 'Profile ID of the winning player (NULL for tie)';
COMMENT ON COLUMN public."Matches".segments_played IS 'Array of segment codes played in this match';
COMMENT ON COLUMN public."Matches".total_points IS 'Combined score of both players (auto-calculated)';

-- Enable Row Level Security
ALTER TABLE public."Matches" ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view all matches (public leaderboard)
CREATE POLICY "Users can view all matches" ON public."Matches"
  FOR SELECT
  USING (true);

-- Only authenticated users can insert matches (typically done by host at game end)
CREATE POLICY "Authenticated users can record matches" ON public."Matches"
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    (auth.uid() = home_player_id OR auth.uid() = away_player_id)
  );
