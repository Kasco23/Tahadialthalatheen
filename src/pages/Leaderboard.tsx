import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getLeaderboardPlayers, getLeaderboardMatches } from "../lib/matches";
import type { LeaderboardPlayer, LeaderboardMatch } from "../lib/matches";
import { StadiumBackground } from "../components/StadiumBackground";
import { Flag } from "../components/Flag";
import toast from "react-hot-toast";
import { TrophyIcon, FireIcon, ChartBarIcon } from "@heroicons/react/24/solid";

export default function Leaderboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"players" | "matches">("players");
  const [players, setPlayers] = useState<LeaderboardPlayer[]>([]);
  const [matches, setMatches] = useState<LeaderboardMatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboards();
  }, []);

  const loadLeaderboards = async () => {
    try {
      setLoading(true);
      const [playersData, matchesData] = await Promise.all([
        getLeaderboardPlayers(20),
        getLeaderboardMatches(20),
      ]);
      setPlayers(playersData);
      setMatches(matchesData);
    } catch (error) {
      console.error("Error loading leaderboards:", error);
      toast.error("Failed to load leaderboards");
    } finally {
      setLoading(false);
    }
  };

  const getRankColor = (rank: number | null) => {
    if (!rank) return "text-gray-700";
    if (rank === 1) return "text-yellow-500";
    if (rank === 2) return "text-gray-400";
    if (rank === 3) return "text-orange-600";
    return "text-gray-700";
  };

  const getRankIcon = (rank: number | null) => {
    if (!rank) return null;
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return null;
  };

  return (
    <StadiumBackground variant="bright" animated={true}>
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <TrophyIcon className="h-10 w-10 text-yellow-500" />
                <div>
                  <h1 className="text-4xl font-bold text-gray-800">
                    Leaderboard
                  </h1>
                  <p className="text-gray-600">Top players and epic matches</p>
                </div>
              </div>
              <button
                onClick={() => navigate("/")}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors font-medium"
              >
                Back to Home
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b-2 border-gray-200">
              <button
                onClick={() => setActiveTab("players")}
                className={`px-6 py-3 font-semibold transition-all ${
                  activeTab === "players"
                    ? "border-b-4 border-green-600 text-green-600"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                <div className="flex items-center gap-2">
                  <ChartBarIcon className="h-5 w-5" />
                  Top Players
                </div>
              </button>
              <button
                onClick={() => setActiveTab("matches")}
                className={`px-6 py-3 font-semibold transition-all ${
                  activeTab === "matches"
                    ? "border-b-4 border-green-600 text-green-600"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                <div className="flex items-center gap-2">
                  <FireIcon className="h-5 w-5" />
                  Epic Matches
                </div>
              </button>
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="bg-white/95 backdrop-blur-sm rounded-xl p-12 text-center">
              <div className="animate-spin h-12 w-12 border-4 border-green-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">Loading leaderboard...</p>
            </div>
          ) : (
            <>
              {activeTab === "players" && (
                <div className="space-y-3">
                  {players.length === 0 ? (
                    <div className="bg-white/95 backdrop-blur-sm rounded-xl p-12 text-center">
                      <ChartBarIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-xl font-semibold text-gray-700 mb-2">
                        No player data yet
                      </p>
                      <p className="text-gray-500">
                        Play some matches to see rankings!
                      </p>
                    </div>
                  ) : (
                    players.map((player, index) => {
                      const rank = index + 1;
                      return (
                        <div
                          key={player.id}
                          className="bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg hover:shadow-xl transition-all"
                        >
                          <div className="flex items-center gap-4">
                            {/* Rank */}
                            <div
                              className={`text-3xl font-bold w-16 text-center ${getRankColor(rank)}`}
                            >
                              {getRankIcon(rank) || `#${rank}`}
                            </div>

                            {/* Player Info */}
                            <div className="flex items-center gap-3 flex-1">
                              {player.avatar_url ? (
                                <img
                                  src={player.avatar_url}
                                  alt={player.name || "Player"}
                                  className="w-12 h-12 rounded-lg object-cover"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold text-lg">
                                  {(player.name || player.username || "?")
                                    .charAt(0)
                                    .toUpperCase()}
                                </div>
                              )}
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="font-bold text-gray-800">
                                    {player.name || "Unknown"}
                                  </h3>
                                  {player.flag && (
                                    <Flag
                                      code={player.flag}
                                      className="text-lg"
                                    />
                                  )}
                                </div>
                                <p className="text-sm text-gray-600">
                                  @{player.username || "unknown"}
                                </p>
                              </div>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-4 gap-4 text-center">
                              <div>
                                <p className="text-sm text-gray-600">Games</p>
                                <p className="font-bold text-gray-800">
                                  {player.games_played || 0}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">Wins</p>
                                <p className="font-bold text-green-600">
                                  {player.wins}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">
                                  Win Rate
                                </p>
                                <p className="font-bold text-blue-600">
                                  {player.win_rate?.toFixed(1) || 0}%
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">Points</p>
                                <p className="font-bold text-purple-600">
                                  {player.total_points}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {activeTab === "matches" && (
                <div className="space-y-3">
                  {matches.length === 0 ? (
                    <div className="bg-white/95 backdrop-blur-sm rounded-xl p-12 text-center">
                      <FireIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-xl font-semibold text-gray-700 mb-2">
                        No matches yet
                      </p>
                      <p className="text-gray-500">
                        Play some matches to see epic games!
                      </p>
                    </div>
                  ) : (
                    matches.map((match, index) => {
                      const rank = index + 1;
                      return (
                        <div
                          key={match.id}
                          className="bg-white/95 backdrop-blur-sm rounded-xl p-6 shadow-lg hover:shadow-xl transition-all"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <div
                              className={`text-2xl font-bold ${getRankColor(rank)}`}
                            >
                              {getRankIcon(rank) || `#${rank}`}
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-600">
                                {new Date(
                                  match.created_at || ""
                                ).toLocaleDateString()}
                              </p>
                              <p className="text-lg font-bold text-purple-600">
                                {(match.home_total_points || 0) +
                                  (match.away_total_points || 0)}{" "}
                                total points
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-4">
                            {/* Home Player */}
                            <div className="flex items-center gap-3 flex-1">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold text-gray-600">
                                    HOME
                                  </span>
                                  {match.home_flag && (
                                    <Flag
                                      code={match.home_flag}
                                      className="text-lg"
                                    />
                                  )}
                                </div>
                                <p className="font-bold text-gray-800">
                                  {match.home_name || "Unknown"}
                                </p>
                                <p className="text-sm text-gray-600">
                                  @{match.home_username || "unknown"}
                                </p>
                              </div>
                            </div>

                            {/* Score */}
                            <div className="text-center px-6">
                              <div className="flex items-center gap-2">
                                <div
                                  className={`text-3xl font-bold ${match.winner_id === match.home_player_id ? "text-green-600" : "text-gray-700"}`}
                                >
                                  {match.home_total_points}
                                </div>
                                <div className="text-2xl font-bold text-gray-400">
                                  -
                                </div>
                                <div
                                  className={`text-3xl font-bold ${match.winner_id === match.away_player_id ? "text-green-600" : "text-gray-700"}`}
                                >
                                  {match.away_total_points}
                                </div>
                              </div>
                              {match.winner_id && (
                                <p className="text-sm text-gray-600 mt-1">
                                  Winner: {match.winner_username}
                                </p>
                              )}
                            </div>

                            {/* Away Player */}
                            <div className="flex items-center gap-3 flex-1 justify-end text-right">
                              <div>
                                <div className="flex items-center gap-2 justify-end">
                                  {match.away_flag && (
                                    <Flag
                                      code={match.away_flag}
                                      className="text-lg"
                                    />
                                  )}
                                  <span className="text-sm font-semibold text-gray-600">
                                    AWAY
                                  </span>
                                </div>
                                <p className="font-bold text-gray-800">
                                  {match.away_name || "Unknown"}
                                </p>
                                <p className="text-sm text-gray-600">
                                  @{match.away_username || "unknown"}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Segments Played */}
                          {match.segments_played &&
                            Array.isArray(match.segments_played) &&
                            match.segments_played.length > 0 && (
                              <div className="mt-4 pt-4 border-t border-gray-200">
                                <p className="text-xs text-gray-600 mb-1">
                                  Segments Played:
                                </p>
                                <div className="flex gap-2">
                                  {(match.segments_played as string[]).map(
                                    (segment: string, idx: number) => (
                                      <span
                                        key={idx}
                                        className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded"
                                      >
                                        {segment}
                                      </span>
                                    )
                                  )}
                                </div>
                              </div>
                            )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </StadiumBackground>
  );
}
