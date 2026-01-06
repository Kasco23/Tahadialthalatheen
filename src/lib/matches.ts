/**
 * Matches and Statistics API client
 * Handles game match recording and player statistics tracking
 */

import { supabase } from "./supabaseClient";
import type {
  Tables,
  Views,
  SegmentCode,
  HeadToHeadStats,
  PlayerStats,
} from "./types";
import { Logger } from "./logger";

export type Match = Tables<"Matches">;
export type Profile = Tables<"Profiles">;
// PlayerSegmentStats table doesn't exist yet - using manual interface
export interface PlayerSegmentStats {
  profile_id: string;
  segment_code: string;
  games_played: number;
  total_questions: number;
  correct_answers: number;
  strikes: number;
  points: number;
  wins: number;
  losses: number;
}
export type LeaderboardPlayer = Views<"leaderboard_players">;
export type LeaderboardMatch = Views<"leaderboard_matches">;

/**
 * Record a completed match
 * @param sessionId - The session ID
 * @param homePlayerId - Profile ID of home player (Player1)
 * @param awayPlayerId - Profile ID of away player (Player2)
 * @param homeTotalPoints - Total points scored by home player
 * @param awayTotalPoints - Total points scored by away player
 * @param winnerId - Profile ID of winner (null for tie)
 * @param segmentsPlayed - Array of segment codes that were played
 */
export async function recordMatch(
  sessionId: string,
  homePlayerId: string,
  awayPlayerId: string,
  homeTotalPoints: number,
  awayTotalPoints: number,
  winnerId: string | null,
  segmentsPlayed: SegmentCode[]
): Promise<Match> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    const { data, error } = await supabase
      .from("Matches")
      .insert({
        session_id: sessionId,
        home_player_id: homePlayerId,
        away_player_id: awayPlayerId,
        home_total_points: homeTotalPoints,
        away_total_points: awayTotalPoints,
        winner_id: winnerId,
        segments_played: segmentsPlayed,
      })
      .select()
      .single();

    if (error) {
      Logger.error("Error recording match:", error);
      throw new Error(`Failed to record match: ${error.message}`);
    }

    Logger.log("Match recorded successfully:", data);
    return data;
  } catch (error) {
    Logger.error("Error in recordMatch:", error);
    throw error;
  }
}

/**
 * Update player segment statistics
 * This should be called after each segment is completed
 */
export async function updateSegmentStats(
  profileId: string,
  segmentCode: SegmentCode,
  gamesPlayed: number = 1,
  totalQuestions: number = 0,
  correctAnswers: number = 0,
  strikes: number = 0,
  points: number = 0,
  wins: number = 0,
  losses: number = 0
): Promise<void> {
  try {
    const { error } = await supabase.rpc("upsert_player_segment_stats", {
      p_profile_id: profileId,
      p_segment_code: segmentCode,
      p_games_played: gamesPlayed,
      p_total_questions: totalQuestions,
      p_correct_answers: correctAnswers,
      p_strikes: strikes,
      p_points: points,
      p_wins: wins,
      p_losses: losses,
    });

    if (error) {
      Logger.error("Error updating segment stats:", error);
      throw new Error(`Failed to update segment stats: ${error.message}`);
    }

    Logger.log("Segment stats updated successfully");
  } catch (error) {
    Logger.error("Error in updateSegmentStats:", error);
    throw error;
  }
}

/**
 * Get player's overall statistics
 * @param profileId - The profile ID (defaults to current user)
 */
export async function getPlayerStats(
  profileId?: string
): Promise<PlayerStats | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const targetId = profileId || user?.id;

    if (!targetId) {
      throw new Error("User not authenticated and no profile ID provided");
    }

    // Get stats from leaderboard view
    const { data, error } = await supabase
      .from("leaderboard_players")
      .select("*")
      .eq("id", targetId)
      .maybeSingle();

    if (error) {
      Logger.error("Error fetching player stats:", error);
      throw new Error(`Failed to fetch player stats: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    return {
      profile_id: data.id,
      total_games: data.total_games,
      wins: data.wins,
      losses: data.losses,
      ties: data.ties,
      total_points: data.total_points,
      win_rate: data.win_rate || 0,
    };
  } catch (error) {
    Logger.error("Error in getPlayerStats:", error);
    throw error;
  }
}

/**
 * Get player's segment-level statistics
 * @param profileId - The profile ID (defaults to current user)
 */
export async function getPlayerSegmentStats(
  profileId?: string
): Promise<PlayerSegmentStats[]> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const targetId = profileId || user?.id;

    if (!targetId) {
      throw new Error("User not authenticated and no profile ID provided");
    }

    const { data, error } = await supabase
      .from("PlayerSegmentStats")
      .select("*")
      .eq("profile_id", targetId)
      .order("points", { ascending: false });

    if (error) {
      Logger.error("Error fetching segment stats:", error);
      throw new Error(`Failed to fetch segment stats: ${error.message}`);
    }

    return data;
  } catch (error) {
    Logger.error("Error in getPlayerSegmentStats:", error);
    throw error;
  }
}

/**
 * Get head-to-head statistics against another player
 * @param opponentId - The opponent's profile ID
 * @param currentUserId - Current user's profile ID (defaults to authenticated user)
 */
export async function getHeadToHeadStats(
  opponentId: string,
  currentUserId?: string
): Promise<HeadToHeadStats | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const userId = currentUserId || user?.id;

    if (!userId) {
      throw new Error("User not authenticated and no user ID provided");
    }

    // Get opponent profile
    const { data: opponent } = await supabase
      .from("Profiles")
      .select("id, username, name")
      .eq("id", opponentId)
      .single();

    if (!opponent) {
      return null;
    }

    // Get all matches between these two players
    const { data: matches, error } = await supabase
      .from("Matches")
      .select("*")
      .or(
        `and(home_player_id.eq.${userId},away_player_id.eq.${opponentId}),and(home_player_id.eq.${opponentId},away_player_id.eq.${userId})`
      );

    if (error) {
      Logger.error("Error fetching head-to-head stats:", error);
      throw new Error(`Failed to fetch head-to-head stats: ${error.message}`);
    }

    if (!matches || matches.length === 0) {
      return {
        opponent_id: opponentId,
        opponent_username: opponent.username || "",
        opponent_name: opponent.name || "",
        games_played: 0,
        wins: 0,
        losses: 0,
        ties: 0,
      };
    }

    // Calculate stats
    let wins = 0;
    let losses = 0;
    let ties = 0;

    matches.forEach((match) => {
      if (match.winner_id === userId) {
        wins++;
      } else if (match.winner_id === opponentId) {
        losses++;
      } else {
        ties++;
      }
    });

    return {
      opponent_id: opponentId,
      opponent_username: opponent.username || "",
      opponent_name: opponent.name || "",
      games_played: matches.length,
      wins,
      losses,
      ties,
    };
  } catch (error) {
    Logger.error("Error in getHeadToHeadStats:", error);
    throw error;
  }
}

/**
 * Get nemesis (player you've lost to the most)
 * @param currentUserId - Current user's profile ID (defaults to authenticated user)
 */
export async function getNemesis(
  currentUserId?: string
): Promise<HeadToHeadStats | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const userId = currentUserId || user?.id;

    if (!userId) {
      throw new Error("User not authenticated and no user ID provided");
    }

    // Get all matches where user lost
    const { data: matches, error } = await supabase
      .from("Matches")
      .select(
        `
        *,
        home_player:home_player_id(id, username, name),
        away_player:away_player_id(id, username, name)
      `
      )
      .or(
        `and(home_player_id.eq.${userId},winner_id.neq.${userId}),and(away_player_id.eq.${userId},winner_id.neq.${userId})`
      )
      .not("winner_id", "is", null);

    if (error || !matches || matches.length === 0) {
      return null;
    }

    // Count losses by opponent
    const lossCountByOpponent: Record<
      string,
      { count: number; profile: Profile | null }
    > = {};

    matches.forEach(
      (match: Match & { home_player: Profile; away_player: Profile }) => {
        const opponentId =
          match.home_player_id === userId
            ? match.away_player_id
            : match.home_player_id;
        const opponentProfile =
          match.home_player_id === userId
            ? match.away_player
            : match.home_player;

        if (opponentId && !lossCountByOpponent[opponentId]) {
          lossCountByOpponent[opponentId] = {
            count: 0,
            profile: opponentProfile,
          };
        }
        if (opponentId) {
          lossCountByOpponent[opponentId].count++;
        }
      }
    );

    // Find opponent with most losses
    let maxLosses = 0;
    let nemesisId = "";
    let nemesisProfile: Profile | null = null;

    Object.entries(lossCountByOpponent).forEach(([opponentId, data]) => {
      if (data.count > maxLosses) {
        maxLosses = data.count;
        nemesisId = opponentId;
        nemesisProfile = data.profile;
      }
    });

    if (!nemesisProfile) {
      return null;
    }

    // Get full head-to-head stats against nemesis
    return getHeadToHeadStats(nemesisId, userId);
  } catch (error) {
    Logger.error("Error in getNemesis:", error);
    throw error;
  }
}

/**
 * Get leaderboard of top players
 * @param limit - Number of players to return
 */
export async function getLeaderboardPlayers(
  limit: number = 10
): Promise<LeaderboardPlayer[]> {
  try {
    const { data, error } = await supabase
      .from("leaderboard_players")
      .select("*")
      .limit(limit);

    if (error) {
      Logger.error("Error fetching player leaderboard:", error);
      throw new Error(`Failed to fetch player leaderboard: ${error.message}`);
    }

    return data;
  } catch (error) {
    Logger.error("Error in getLeaderboardPlayers:", error);
    throw error;
  }
}

/**
 * Get leaderboard of top matches
 * @param limit - Number of matches to return
 */
export async function getLeaderboardMatches(
  limit: number = 10
): Promise<LeaderboardMatch[]> {
  try {
    const { data, error } = await supabase
      .from("leaderboard_matches")
      .select("*")
      .limit(limit);

    if (error) {
      Logger.error("Error fetching match leaderboard:", error);
      throw new Error(`Failed to fetch match leaderboard: ${error.message}`);
    }

    return data;
  } catch (error) {
    Logger.error("Error in getLeaderboardMatches:", error);
    throw error;
  }
}

/**
 * Get recent matches for a player
 * @param profileId - The profile ID (defaults to current user)
 * @param limit - Number of matches to return
 */
export async function getRecentMatches(
  profileId?: string,
  limit: number = 5
): Promise<Match[]> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const targetId = profileId || user?.id;

    if (!targetId) {
      throw new Error("User not authenticated and no profile ID provided");
    }

    const { data, error } = await supabase
      .from("Matches")
      .select("*")
      .or(`home_player_id.eq.${targetId},away_player_id.eq.${targetId}`)
      .order("played_at", { ascending: false })
      .limit(limit);

    if (error) {
      Logger.error("Error fetching recent matches:", error);
      throw new Error(`Failed to fetch recent matches: ${error.message}`);
    }

    return data;
  } catch (error) {
    Logger.error("Error in getRecentMatches:", error);
    throw error;
  }
}
