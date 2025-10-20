import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import {
  getPlayerStats,
  getPlayerSegmentStats,
  getNemesis,
  getRecentMatches,
} from "../../lib/matches";
import type { PlayerStats, HeadToHeadStats } from "../../lib/types";
import type { PlayerSegmentStats, Match } from "../../lib/matches";
import { TrophyIcon, FireIcon, ChartBarIcon } from "@heroicons/react/24/solid";

export default function StatisticsTab() {
  const { user } = useAuth();
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [segmentStats, setSegmentStats] = useState<PlayerSegmentStats[]>([]);
  const [nemesis, setNemesis] = useState<HeadToHeadStats | null>(null);
  const [recentMatches, setRecentMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStatistics = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const [playerStats, segments, nemesisData, matches] = await Promise.all(
          [
            getPlayerStats(),
            getPlayerSegmentStats(),
            getNemesis(),
            getRecentMatches(undefined, 5),
          ],
        );

        setStats(playerStats);
        setSegmentStats(segments);
        setNemesis(nemesisData);
        setRecentMatches(matches);
      } catch (error) {
        console.error("Error loading statistics:", error);
      } finally {
        setLoading(false);
      }
    };

    loadStatistics();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-green-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <ChartBarIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-600 text-lg">No statistics yet</p>
        <p className="text-gray-500 text-sm mt-2">
          Play some matches to see your stats!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600">
            {stats.total_games}
          </div>
          <div className="text-sm text-gray-600">Games Played</div>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.wins}</div>
          <div className="text-sm text-gray-600">Wins</div>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-red-600">{stats.losses}</div>
          <div className="text-sm text-gray-600">Losses</div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">
            {stats.win_rate.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-600">Win Rate</div>
        </div>
      </div>

      {/* Nemesis Section */}
      {nemesis && nemesis.games_played > 0 && (
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <FireIcon className="h-6 w-6 text-red-600" />
            <h3 className="text-xl font-bold text-red-800">Your Nemesis</h3>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-semibold text-gray-800">
                @{nemesis.opponent_username}
              </p>
              <p className="text-sm text-gray-600">{nemesis.opponent_name}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">
                You've lost {nemesis.losses} out of {nemesis.games_played} games
              </p>
              <p className="text-xs text-gray-500">
                W: {nemesis.wins} | L: {nemesis.losses} | T: {nemesis.ties}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Segment Performance */}
      {segmentStats.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <ChartBarIcon className="h-5 w-5" />
            Segment Performance
          </h3>
          <div className="space-y-3">
            {segmentStats.map((segment) => (
              <div
                key={segment.segment_code}
                className="bg-gray-50 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="font-semibold text-gray-800">
                    {segment.segment_code}
                  </div>
                  <div className="text-sm text-gray-600">
                    {segment.games_played} games
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center text-sm">
                  <div>
                    <div className="font-bold text-green-600">
                      {segment.points}
                    </div>
                    <div className="text-xs text-gray-500">Points</div>
                  </div>
                  <div>
                    <div className="font-bold text-blue-600">
                      {segment.correct_answers}/{segment.total_questions}
                    </div>
                    <div className="text-xs text-gray-500">Correct</div>
                  </div>
                  <div>
                    <div className="font-bold text-purple-600">
                      {segment.wins}
                    </div>
                    <div className="text-xs text-gray-500">Wins</div>
                  </div>
                  <div>
                    <div className="font-bold text-red-600">
                      {segment.strikes || 0}
                    </div>
                    <div className="text-xs text-gray-500">Strikes</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Matches */}
      {recentMatches.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <TrophyIcon className="h-5 w-5" />
            Recent Matches
          </h3>
          <div className="space-y-2">
            {recentMatches.map((match) => {
              const isHome = match.home_player_id === user?.id;
              const myScore = isHome
                ? match.home_total_points
                : match.away_total_points;
              const opponentScore = isHome
                ? match.away_total_points
                : match.home_total_points;
              const won = match.winner_id === user?.id;
              const tied = match.winner_id === null;

              return (
                <div
                  key={match.id}
                  className={`rounded-lg p-3 flex items-center justify-between ${
                    won
                      ? "bg-green-50 border border-green-200"
                      : tied
                        ? "bg-gray-50 border border-gray-200"
                        : "bg-red-50 border border-red-200"
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          won
                            ? "bg-green-600 text-white"
                            : tied
                              ? "bg-gray-600 text-white"
                              : "bg-red-600 text-white"
                        }`}
                      >
                        {won ? "WIN" : tied ? "TIE" : "LOSS"}
                      </span>
                      <span className="text-sm text-gray-600">
                        {new Date(match.played_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="text-lg font-bold text-gray-800">
                    {myScore} - {opponentScore}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
