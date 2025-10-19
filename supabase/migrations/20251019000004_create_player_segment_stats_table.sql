-- Create PlayerSegmentStats table for detailed segment-level statistics
-- This table tracks performance metrics for each player in each segment type

CREATE TABLE IF NOT EXISTS public."PlayerSegmentStats" (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  profile_id uuid NOT NULL REFERENCES public."Profiles"(id) ON DELETE CASCADE,
  segment_code text NOT NULL CHECK (segment_code IN ('WDYK', 'AUCT', 'BELL', 'UPDW', 'REMO')),
  games_played integer NOT NULL DEFAULT 0,
  total_questions integer NOT NULL DEFAULT 0,
  correct_answers integer NOT NULL DEFAULT 0,
  strikes integer NOT NULL DEFAULT 0,
  points integer NOT NULL DEFAULT 0,
  wins integer NOT NULL DEFAULT 0,
  losses integer NOT NULL DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT unique_player_segment UNIQUE (profile_id, segment_code)
);

-- Create indexes for performance
CREATE INDEX player_segment_stats_profile_idx ON public."PlayerSegmentStats"(profile_id);
CREATE INDEX player_segment_stats_segment_idx ON public."PlayerSegmentStats"(segment_code);
CREATE INDEX player_segment_stats_points_idx ON public."PlayerSegmentStats"(points DESC);

-- Add comments
COMMENT ON TABLE public."PlayerSegmentStats" IS 'Tracks detailed statistics for each player per segment type';
COMMENT ON COLUMN public."PlayerSegmentStats".segment_code IS 'Quiz segment type: WDYK, AUCT, BELL, UPDW, REMO';
COMMENT ON COLUMN public."PlayerSegmentStats".games_played IS 'Number of times this segment was played by this player';
COMMENT ON COLUMN public."PlayerSegmentStats".total_questions IS 'Total questions answered in this segment';
COMMENT ON COLUMN public."PlayerSegmentStats".correct_answers IS 'Number of correct answers in this segment';
COMMENT ON COLUMN public."PlayerSegmentStats".strikes IS 'Total strikes accumulated in this segment (WDYK only)';
COMMENT ON COLUMN public."PlayerSegmentStats".points IS 'Total points earned in this segment';

-- Enable Row Level Security
ALTER TABLE public."PlayerSegmentStats" ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view all player stats (public leaderboard)
CREATE POLICY "Users can view all player stats" ON public."PlayerSegmentStats"
  FOR SELECT
  USING (true);

-- Users can only update their own stats
CREATE POLICY "Users can update own stats" ON public."PlayerSegmentStats"
  FOR INSERT
  WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can modify own stats" ON public."PlayerSegmentStats"
  FOR UPDATE
  USING (auth.uid() = profile_id);

-- Create trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_player_segment_stats_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER player_segment_stats_updated_at_trigger
  BEFORE UPDATE ON public."PlayerSegmentStats"
  FOR EACH ROW
  EXECUTE FUNCTION public.update_player_segment_stats_updated_at();

-- Create helper function to upsert segment stats
CREATE OR REPLACE FUNCTION public.upsert_player_segment_stats(
  p_profile_id uuid,
  p_segment_code text,
  p_games_played integer DEFAULT 1,
  p_total_questions integer DEFAULT 0,
  p_correct_answers integer DEFAULT 0,
  p_strikes integer DEFAULT 0,
  p_points integer DEFAULT 0,
  p_wins integer DEFAULT 0,
  p_losses integer DEFAULT 0
)
RETURNS void AS $$
BEGIN
  INSERT INTO public."PlayerSegmentStats" (
    profile_id,
    segment_code,
    games_played,
    total_questions,
    correct_answers,
    strikes,
    points,
    wins,
    losses
  )
  VALUES (
    p_profile_id,
    p_segment_code,
    p_games_played,
    p_total_questions,
    p_correct_answers,
    p_strikes,
    p_points,
    p_wins,
    p_losses
  )
  ON CONFLICT (profile_id, segment_code)
  DO UPDATE SET
    games_played = public."PlayerSegmentStats".games_played + EXCLUDED.games_played,
    total_questions = public."PlayerSegmentStats".total_questions + EXCLUDED.total_questions,
    correct_answers = public."PlayerSegmentStats".correct_answers + EXCLUDED.correct_answers,
    strikes = public."PlayerSegmentStats".strikes + EXCLUDED.strikes,
    points = public."PlayerSegmentStats".points + EXCLUDED.points,
    wins = public."PlayerSegmentStats".wins + EXCLUDED.wins,
    losses = public."PlayerSegmentStats".losses + EXCLUDED.losses,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.upsert_player_segment_stats TO authenticated;
