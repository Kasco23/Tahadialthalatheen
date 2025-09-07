import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useSession } from "../lib/sessionHooks";
import {
  useStrikes,
  useSegmentConfig,
  useParticipants,
} from "../lib/realtimeHooks";
import {
  incrementStrike,
  resetStrikes,
  activatePowerup,
  getSessionIdByCode,
} from "../lib/mutations";
import type { Tables, SegmentCode } from "../lib/types";

const Quiz: React.FC = () => {
  const { sessionCode } = useParams<{ sessionCode: string }>();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const { session, loading: sessionLoading } = useSession(sessionId);
  const { strikes, loading: strikesLoading } = useStrikes(sessionId);
  const { segmentConfig, loading: configLoading } = useSegmentConfig(sessionId);
  const { participants, loading: participantsLoading } =
    useParticipants(sessionId);

  const [currentSegment, setCurrentSegment] = useState<SegmentCode>("WDYK");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Convert sessionCode to sessionId when component mounts
  useEffect(() => {
    const resolveSessionId = async () => {
      if (!sessionCode) return;

      try {
        const resolvedSessionId = await getSessionIdByCode(sessionCode);
        setSessionId(resolvedSessionId);
      } catch (error) {
        console.error("Failed to resolve session code:", error);
        setError("Invalid session code");
      }
    };

    if (sessionCode) {
      resolveSessionId();
    }
  }, [sessionCode]);

  // Segment definitions
  const segments = {
    WDYK: { name: "What Do You Know", description: "Open-ended questions" },
    AUCT: { name: "Auction", description: "Bid-based questions" },
    BELL: { name: "Bell", description: "First to answer" },
    UPDW: { name: "Upside-down", description: "Hard questions" },
    REMO: { name: "Remontada", description: "Career path questions" },
  };

  const players = participants.filter((p) => p.role !== "Host");
  const host = participants.find((p) => p.role === "Host");

  // Get remaining questions for current segment
  const getCurrentSegmentConfig = () => {
    return segmentConfig.find(
      (config) => config.segment_code === currentSegment,
    );
  };

  const remainingQuestions = getCurrentSegmentConfig()?.questions_count || 0;

  // PASS Button Logic - Enabled only if:
  // 1. currentSegment === 'WDYK'
  // 2. Player has exactly 2 strikes
  // 3. powerup_pass_used === false
  const canUsePass = (participant: Tables<"Participant">) => {
    const participantStrikes = strikes[participant.participant_id] || 0;
    return (
      currentSegment === "WDYK" &&
      participantStrikes === 2 &&
      !participant.powerup_pass_used
    );
  };

  const handlePassButtonClick = async (participant: Tables<"Participant">) => {
    if (!canUsePass(participant)) return;

    setLoading(true);
    try {
      await activatePowerup(participant.participant_id, "pass");
      // Note: This would also lock the other player's PASS until they answer correctly
      // That logic would be implemented in the game flow management
    } catch (error) {
      console.error("Error using PASS powerup:", error);
      setError(
        error instanceof Error ? error.message : "Failed to use PASS powerup",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleIncrementStrike = async (participantId: string) => {
    setLoading(true);
    try {
      await incrementStrike(sessionId!, participantId);
    } catch (error) {
      console.error("Error incrementing strike:", error);
      setError(
        error instanceof Error ? error.message : "Failed to increment strike",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetStrikes = async (participantId: string) => {
    setLoading(true);
    try {
      await resetStrikes(sessionId!, participantId);
    } catch (error) {
      console.error("Error resetting strikes:", error);
      setError(
        error instanceof Error ? error.message : "Failed to reset strikes",
      );
    } finally {
      setLoading(false);
    }
  };

  if (
    sessionLoading ||
    strikesLoading ||
    configLoading ||
    participantsLoading
  ) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-600 via-green-700 to-green-800 flex items-center justify-center">
        <div className="text-white text-xl">Loading quiz...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-600 via-red-700 to-red-800 flex items-center justify-center">
        <div className="text-white text-xl">Session not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-600 via-green-700 to-green-800 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 text-white">
          <h1 className="text-4xl font-bold mb-2">⚽ Quiz In Progress</h1>
          <p className="text-xl opacity-90">Session: {sessionId}</p>
          <p className="text-lg opacity-80">
            Phase: {session.phase} | Game State: {session.game_state}
          </p>
        </div>

        {/* Current Segment Info */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-8 text-white">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">
              Current Segment: {segments[currentSegment].name}
            </h2>
            <div className="text-right">
              <div className="text-lg font-semibold">
                Questions Remaining: {remainingQuestions}
              </div>
              <div className="text-sm opacity-80">
                {segments[currentSegment].description}
              </div>
            </div>
          </div>

          {/* Segment Selector */}
          <div className="flex flex-wrap gap-2">
            {Object.entries(segments).map(([code, info]) => {
              const config = segmentConfig.find((c) => c.segment_code === code);
              return (
                <button
                  key={code}
                  onClick={() => setCurrentSegment(code as SegmentCode)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    currentSegment === code
                      ? "bg-yellow-500 text-black"
                      : "bg-white/20 text-white hover:bg-white/30"
                  }`}
                >
                  {info.name} ({config?.questions_count || 0})
                </button>
              );
            })}
          </div>
        </div>

        {/* Players Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {players.map((player) => {
            const playerStrikes = strikes[player.participant_id] || 0;

            return (
              <div
                key={player.participant_id}
                className="bg-white rounded-xl p-6 shadow-lg"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                        {player.flag ? (
                          <span className={`fi fi-${player.flag} text-lg`}></span>
                        ) : (
                          player.name.charAt(0)
                        )}
                      </div>
                      {player.team_logo_url && (
                        <img 
                          src={player.team_logo_url} 
                          alt={`${player.name} team logo`} 
                          className="w-10 h-10 object-contain rounded"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      )}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">
                        {player.name}
                      </h3>
                      <p className="text-sm text-gray-600">{player.role}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-800">
                      0 pts
                    </div>
                    <div className="text-sm text-red-600 font-semibold">
                      Strikes: {playerStrikes}
                    </div>
                  </div>
                </div>

                {/* Strike Management (WDYK only) */}
                {currentSegment === "WDYK" && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        Strike Management:
                      </span>
                      <div className="flex space-x-2">
                        <button
                          onClick={() =>
                            handleIncrementStrike(player.participant_id)
                          }
                          disabled={loading}
                          className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 disabled:opacity-50"
                        >
                          +1 Strike
                        </button>
                        <button
                          onClick={() =>
                            handleResetStrikes(player.participant_id)
                          }
                          disabled={loading}
                          className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 disabled:opacity-50"
                        >
                          Reset
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Powerup Buttons */}
                <div className="space-y-2">
                  {/* PASS Button - WDYK only, specific conditions */}
                  <button
                    onClick={() => handlePassButtonClick(player)}
                    disabled={!canUsePass(player) || loading}
                    className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                      canUsePass(player) && !loading
                        ? "bg-yellow-500 hover:bg-yellow-600 text-black"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    {player.powerup_pass_used
                      ? "✓ PASS Used"
                      : currentSegment !== "WDYK"
                        ? "PASS (WDYK only)"
                        : playerStrikes !== 2
                          ? `PASS (Need 2 strikes, have ${playerStrikes})`
                          : "PASS Available"}
                  </button>

                  {/* Other Powerups */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      disabled={player.powerup_alhabeed || loading}
                      className={`py-1 px-2 text-xs rounded font-medium ${
                        player.powerup_alhabeed
                          ? "bg-gray-300 text-gray-500"
                          : "bg-blue-500 hover:bg-blue-600 text-white"
                      }`}
                    >
                      {player.powerup_alhabeed ? "✓ Al-Habeed" : "Al-Habeed"}
                    </button>

                    <button
                      disabled={player.powerup_bellegoal || loading}
                      className={`py-1 px-2 text-xs rounded font-medium ${
                        player.powerup_bellegoal
                          ? "bg-gray-300 text-gray-500"
                          : "bg-purple-500 hover:bg-purple-600 text-white"
                      }`}
                    >
                      {player.powerup_bellegoal ? "✓ Bellegoal" : "Bellegoal"}
                    </button>

                    <button
                      disabled={player.powerup_slippyg || loading}
                      className={`py-1 px-2 text-xs rounded font-medium ${
                        player.powerup_slippyg
                          ? "bg-gray-300 text-gray-500"
                          : "bg-red-500 hover:bg-red-600 text-white"
                      }`}
                    >
                      {player.powerup_slippyg ? "✓ Slippy-G" : "Slippy-G"}
                    </button>
                  </div>
                </div>

                {/* Connection Status */}
                <div className="mt-4 flex items-center space-x-2">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      player.video_presence ? "bg-green-500" : "bg-red-500"
                    }`}
                  ></div>
                  <span className="text-sm text-gray-600">
                    {player.video_presence ? "Connected" : "Disconnected"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Host Section */}
        {host && (
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              🎯 Host: {host.name}
            </h3>
            <div className="flex items-center space-x-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  host.video_presence ? "bg-green-500" : "bg-red-500"
                }`}
              ></div>
              <span className="text-sm text-gray-600">
                {host.video_presence ? "Connected" : "Disconnected"}
              </span>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            <p className="font-medium">Error:</p>
            <p>{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Quiz;
