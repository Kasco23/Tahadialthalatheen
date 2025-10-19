-- Create leaderboard views for top players and matches
-- These materialized views provide efficient queries for leaderboard displays

-- View 1: Top Players Leaderboard
-- Shows players ranked by win rate and total wins
CREATE OR REPLACE VIEW public."leaderboard_players" AS
WITH player_stats AS (
  SELECT 
    p.id,
    p.username,
    p.name,
    p.avatar_url,
    p.flag,
    COUNT(m.id) as total_games,
    SUM(CASE WHEN m.winner_id = p.id THEN 1 ELSE 0 END) as wins,
    SUM(CASE WHEN m.winner_id IS NOT NULL AND m.winner_id != p.id THEN 1 ELSE 0 END) as losses,
    SUM(CASE WHEN m.winner_id IS NULL THEN 1 ELSE 0 END) as ties,
    SUM(CASE 
      WHEN m.home_player_id = p.id THEN m.home_total_points 
      WHEN m.away_player_id = p.id THEN m.away_total_points 
      ELSE 0 
    END) as total_points,
    ROUND(
      CAST(SUM(CASE WHEN m.winner_id = p.id THEN 1 ELSE 0 END) AS NUMERIC) / 
      NULLIF(COUNT(m.id), 0) * 100, 
      2
    ) as win_rate
  FROM public."Profiles" p
  LEFT JOIN public."Matches" m 
    ON p.id = m.home_player_id OR p.id = m.away_player_id
  WHERE p.username IS NOT NULL
  GROUP BY p.id, p.username, p.name, p.avatar_url, p.flag
  HAVING COUNT(m.id) > 0
)
SELECT 
  id,
  username,
  name,
  avatar_url,
  flag,
  total_games,
  wins,
  losses,
  ties,
  total_points,
  win_rate,
  RANK() OVER (ORDER BY win_rate DESC, wins DESC, total_points DESC) as rank
FROM player_stats
ORDER BY rank;

-- Add comment
COMMENT ON VIEW public."leaderboard_players" IS 'Leaderboard showing top players by win rate and wins';

-- Grant access
GRANT SELECT ON public."leaderboard_players" TO authenticated;
GRANT SELECT ON public."leaderboard_players" TO anon;

-- View 2: Top Matches Leaderboard
-- Shows matches ranked by total combined points
CREATE OR REPLACE VIEW public."leaderboard_matches" AS
SELECT 
  m.id,
  m.session_id,
  m.played_at,
  m.total_points,
  m.home_total_points,
  m.away_total_points,
  m.segments_played,
  home.id as home_player_id,
  home.username as home_username,
  home.name as home_name,
  home.avatar_url as home_avatar,
  home.flag as home_flag,
  away.id as away_player_id,
  away.username as away_username,
  away.name as away_name,
  away.avatar_url as away_avatar,
  away.flag as away_flag,
  winner.id as winner_id,
  winner.username as winner_username,
  winner.name as winner_name,
  RANK() OVER (ORDER BY m.total_points DESC, m.played_at DESC) as rank
FROM public."Matches" m
INNER JOIN public."Profiles" home ON m.home_player_id = home.id
INNER JOIN public."Profiles" away ON m.away_player_id = away.id
LEFT JOIN public."Profiles" winner ON m.winner_id = winner.id
ORDER BY rank;

-- Add comment
COMMENT ON VIEW public."leaderboard_matches" IS 'Leaderboard showing top matches by total combined points';

-- Grant access
GRANT SELECT ON public."leaderboard_matches" TO authenticated;
GRANT SELECT ON public."leaderboard_matches" TO anon;
