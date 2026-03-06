import { Logger } from "../lib/logger";
import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useSession } from "../lib/sessionHooks";
import { getSessionIdByCode } from "../lib/mutations";
import { recordMatch } from "../lib/matches";
import { SegmentCode } from "../lib/types";
import toast from "react-hot-toast";

interface PlayerData {
  participant_id: string;
  session_id: string;
  role: string;
  profile_id?: string | null;
  score?: number; // Computed from Scores table
  Profiles?: {
    name?: string | null;
    flag?: string | null;
    team?: string | null; // team logo URL
  } | null;
  // Legacy properties for backwards compatibility
  name?: string;
  flag?: string;
  team_logo_url?: string;
}

interface SegmentScore {
  segment_code: string;
  player1_score: number;
  player2_score: number;
}

type PlayerWithProfilePayload = Omit<
  PlayerData,
  "Profiles" | "name" | "flag" | "team_logo_url"
> & {
  Profiles?: PlayerData["Profiles"] | PlayerData["Profiles"][] | null;
};

const Results: React.FC = () => {
  const { sessionCode } = useParams<{ sessionCode: string }>();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const { session, loading: sessionLoading } = useSession(sessionId);
  const [players, setPlayers] = useState<PlayerData[]>([]);
  const [segmentScores, setSegmentScores] = useState<SegmentScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [matchRecorded, setMatchRecorded] = useState(false);

  // Convert sessionCode to sessionId when component mounts
  useEffect(() => {
    const resolveSessionId = async () => {
      if (!sessionCode) {
        setError("No session code provided");
        setLoading(false);
        return;
      }

      try {
        const resolvedSessionId = await getSessionIdByCode(sessionCode);
        setSessionId(resolvedSessionId);
      } catch (error) {
        Logger.error("Failed to resolve session code:", error);
        setError("Invalid session code");
        setLoading(false);
      }
    };

    if (sessionCode) {
      resolveSessionId();
    }
  }, [sessionCode]);

  // Segment definitions with full names
  const segments = [
    { code: "WDYK", name: "What Do You Know" },
    { code: "AUCT", name: "Auction" },
    { code: "BELL", name: "Bell" },
    { code: "UPDW", name: "Upside-down" },
    { code: "REMO", name: "Remontada" },
  ];

  useEffect(() => {
    if (!sessionId) {
      setError("No session ID provided");
      setLoading(false);
      return;
    }

    // Subscribe to player changes (includes score updates)
    const subscribeToPlayers = () => {
      const channel = supabase
        .channel("results_player_updates")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "Participants",
            filter: `session_id=eq.${sessionId}`,
          },
          (payload) => {
            Logger.log("Player update in results:", payload);
            loadPlayers();
          }
        )
        .subscribe();

      return channel;
    };

    const loadPlayers = async () => {
      try {
        const { data: playersData, error: playersError } = await supabase
          .from("Participants")
          .select(
            `
            participant_id,
            session_id,
            role,
            profile_id,
            Profiles!profile_id (
              name,
              flag,
              team
            )
          `
          )
          .eq("session_id", sessionId);

        if (playersError) {
          Logger.error("Error loading players:", playersError);
          setError("Failed to load player data");
        } else {
          // Normalize the data - Profiles could be object or array
          const normalizedPlayers: PlayerData[] = (playersData || []).map(
            (p: PlayerWithProfilePayload) => {
              const profileData = Array.isArray(p.Profiles)
                ? p.Profiles[0]
                : p.Profiles;
              return {
                ...p,
                Profiles: profileData || null,
                // Add legacy fields for backward compatibility
                name: profileData?.name || "Guest",
                flag: profileData?.flag || "xx",
                team_logo_url: profileData?.team || undefined,
              };
            }
          );
          setPlayers(normalizedPlayers);
        }
      } catch (err) {
        Logger.error("Error loading players:", err);
        setError("Failed to load results data");
      }
    };

    const loadInitialData = async () => {
      try {
        await loadPlayers();
        // For now, we'll use the player scores directly
        // In the future, this could load from a separate scores table
        setSegmentScores([
          { segment_code: "WDYK", player1_score: 0, player2_score: 0 },
          { segment_code: "AUCT", player1_score: 0, player2_score: 0 },
          { segment_code: "BELL", player1_score: 0, player2_score: 0 },
          { segment_code: "UPDW", player1_score: 0, player2_score: 0 },
          { segment_code: "REMO", player1_score: 0, player2_score: 0 },
        ]);
      } catch (err) {
        Logger.error("Error loading initial data:", err);
        setError("Failed to load results");
      } finally {
        setLoading(false);
      }
    };

    const playerChannel = subscribeToPlayers();
    loadInitialData();

    return () => {
      playerChannel.unsubscribe();
    };
  }, [sessionId]);

  const getPlayerScores = useCallback(() => {
    const player1 = players.find(
      (p) => p.role === "Home" || p.role === "playerA"
    );
    const player2 = players.find(
      (p) => p.role === "Away" || p.role === "playerB"
    );

    return {
      player1: player1 || null,
      player2: player2 || null,
      total1: player1?.score || 0,
      total2: player2?.score || 0,
    };
  }, [players]);

  const getWinner = () => {
    const { total1, total2, player1, player2 } = getPlayerScores();

    if (total1 === total2) return { winner: null, message: "It's a tie!" };
    if (total1 > total2)
      return { winner: player1, message: `${player1?.name} Wins!` };
    return { winner: player2, message: `${player2?.name} Wins!` };
  };

  // Record match in database
  useEffect(() => {
    const recordMatchResult = async () => {
      // Only record once and only if we have valid data
      if (matchRecorded || !sessionId || !session || players.length < 2) {
        return;
      }

      const { player1, player2, total1, total2 } = getPlayerScores();

      // Check if both players have profile_id
      if (!player1?.profile_id || !player2?.profile_id) {
        Logger.log("Cannot record match: players don't have profile_id");
        return;
      }

      // Get segments played from SegmentConfig
      try {
        const { data: segmentConfigs } = await supabase
          .from("SegmentConfig")
          .select("segment_code")
          .eq("session_id", sessionId);

        const segmentsPlayed = (segmentConfigs || []).map(
          (sc) => sc.segment_code as SegmentCode
        );

        // Determine winner
        const winnerId =
          total1 > total2
            ? player1.profile_id
            : total2 > total1
              ? player2.profile_id
              : null; // tie

        // Record the match
        await recordMatch(
          sessionId,
          player1.profile_id,
          player2.profile_id,
          total1,
          total2,
          winnerId,
          segmentsPlayed
        );

        setMatchRecorded(true);
        toast.success("Match recorded! Check the leaderboard.");
        Logger.log("Match recorded successfully");
      } catch (error) {
        Logger.error("Error recording match:", error);
        // Don't show error to user - match recording is optional
      }
    };

    // Wait a bit for all data to load before recording
    if (!loading && !sessionLoading && session && players.length >= 2) {
      setTimeout(recordMatchResult, 1000);
    }
  }, [
    loading,
    sessionLoading,
    session,
    players,
    sessionId,
    matchRecorded,
    getPlayerScores,
  ]);

  if (loading || sessionLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-600 via-green-700 to-green-800 flex items-center justify-center">
        <div className="text-white text-xl">Loading Results...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-600 via-red-700 to-red-800 flex items-center justify-center">
        <div className="text-white text-xl">{error}</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-600 via-gray-700 to-gray-800 flex items-center justify-center">
        <div className="text-white text-xl">No session data available</div>
      </div>
    );
  }

  const { player1, player2, total1, total2 } = getPlayerScores();
  const winner = getWinner();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-600 via-green-700 to-green-800 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🏆 Results</h1>
          <div className="text-xl text-green-100">
            Session:{" "}
            <span className="font-bold text-yellow-300">
              {session.session_id}
            </span>
          </div>
        </div>

        {/* Winner Announcement */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 mb-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            {winner.message}
          </h2>
          {winner.winner && (
            <div className="flex items-center justify-center">
              <span
                className={`fi fi-${winner.winner.flag} text-3xl mr-3`}
              ></span>
              <div className="text-2xl font-bold text-yellow-300">
                {winner.winner.name}
              </div>
            </div>
          )}
        </div>

        {/* Score Overview */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center">
            <div className="flex items-center justify-center mb-4">
              {player1 && (
                <span className={`fi fi-${player1.flag} text-3xl mr-3`}></span>
              )}
              {player1?.team_logo_url && (
                <img
                  src={player1.team_logo_url}
                  alt={`${player1.name} team logo`}
                  className="w-8 h-8 object-contain rounded mr-3"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              )}
              <div className="text-2xl font-bold text-white">
                {player1?.name || "Home"}
              </div>
            </div>
            <div className="text-4xl font-bold text-yellow-300">{total1}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center">
            <div className="flex items-center justify-center mb-4">
              {player2 && (
                <span className={`fi fi-${player2.flag} text-3xl mr-3`}></span>
              )}
              {player2?.team_logo_url && (
                <img
                  src={player2.team_logo_url}
                  alt={`${player2.name} team logo`}
                  className="w-8 h-8 object-contain rounded mr-3"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              )}
              <div className="text-2xl font-bold text-white">
                {player2?.name || "Away"}
              </div>
            </div>
            <div className="text-4xl font-bold text-yellow-300">{total2}</div>
          </div>
        </div>

        {/* Detailed Score Table */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
          <h3 className="text-2xl font-bold text-white mb-6 text-center">
            Segment Breakdown
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-white">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="text-left py-4 px-2">Segment</th>
                  <th className="text-center py-4 px-2">
                    {player1 && (
                      <div className="flex items-center justify-center">
                        <span className={`fi fi-${player1.flag} mr-2`}></span>
                        {player1.team_logo_url && (
                          <img
                            src={player1.team_logo_url}
                            alt={`${player1.name} team logo`}
                            className="w-6 h-6 object-contain rounded mr-2"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        )}
                        {player1.name}
                      </div>
                    )}
                  </th>
                  <th className="text-center py-4 px-2">
                    {player2 && (
                      <div className="flex items-center justify-center">
                        <span className={`fi fi-${player2.flag} mr-2`}></span>
                        {player2.team_logo_url && (
                          <img
                            src={player2.team_logo_url}
                            alt={`${player2.name} team logo`}
                            className="w-6 h-6 object-contain rounded mr-2"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        )}
                        {player2.name}
                      </div>
                    )}
                  </th>
                </tr>
              </thead>
              <tbody>
                {segments.map((segment) => {
                  const segmentScore = segmentScores.find(
                    (s) => s.segment_code === segment.code
                  );
                  return (
                    <tr key={segment.code} className="border-b border-white/10">
                      <td className="py-4 px-2">
                        <div className="font-bold">{segment.code}</div>
                        <div className="text-sm text-green-200">
                          {segment.name}
                        </div>
                      </td>
                      <td className="text-center py-4 px-2 text-lg font-bold text-yellow-300">
                        {segmentScore?.player1_score || 0}
                      </td>
                      <td className="text-center py-4 px-2 text-lg font-bold text-yellow-300">
                        {segmentScore?.player2_score || 0}
                      </td>
                    </tr>
                  );
                })}
                {/* Totals Row */}
                <tr className="border-t-2 border-white/30 font-bold text-xl">
                  <td className="py-4 px-2 text-yellow-300">TOTAL</td>
                  <td className="text-center py-4 px-2 text-yellow-300">
                    {total1}
                  </td>
                  <td className="text-center py-4 px-2 text-yellow-300">
                    {total2}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 mt-8">
          <button
            onClick={() => (window.location.href = "/")}
            className="px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg transition-colors duration-200"
          >
            New Game
          </button>
          <button
            onClick={() => window.print()}
            className="px-8 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg transition-colors duration-200"
          >
            Print Results
          </button>
        </div>

        {/* Session Info */}
        <div className="text-center mt-8">
          <div className="text-sm text-green-200">
            Session Phase:{" "}
            <span className="font-bold text-white">{session.phase}</span>
          </div>
          <div className="text-sm text-green-200 mt-1">
            Game State:{" "}
            <span className="font-bold text-yellow-300">
              {session.game_state}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Results;
