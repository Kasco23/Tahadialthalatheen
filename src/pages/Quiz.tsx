import { Logger } from "../lib/logger";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAtom } from "jotai";
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
import { getQuizQuestions } from "../lib/blobsManager";
import { dailyUserNameAtom } from "../atoms";
import { VideoRoom } from "../components/VideoRoom";
import type { Tables, SegmentCode } from "../lib/types";

/**
 * Quiz Page - Main gameplay interface
 *
 * Video Call Integration:
 * - VideoRoom component consumes roomUrl and token from global Jotai atoms
 * - The call persists from Lobby via shared DailyProvider at App level
 * - VideoRoom auto-joins on mount using stored credentials
 * - Daily.co WebSocket connections remain stable during route transitions
 */

const Quiz: React.FC = () => {
  const { sessionCode } = useParams<{ sessionCode: string }>();
  const navigate = useNavigate();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const { session, loading: sessionLoading } = useSession(sessionId);
  const { strikes, loading: strikesLoading } = useStrikes(sessionId);
  const { segmentConfig, loading: configLoading } = useSegmentConfig(sessionId);
  const { participants, loading: participantsLoading } =
    useParticipants(sessionId);

  const [userName] = useAtom(dailyUserNameAtom);
  const [currentSegment, setCurrentSegment] = useState<SegmentCode>("WDYK");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<
    Array<{
      question_id: string;
      segment_code: string;
      display_order: number;
      question_text: string;
      question_type: "list" | "buzz";
      answers: string | string[];
      total_answers_available?: number;
    }>
  >([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showAnswers, setShowAnswers] = useState(false);

  // Get participant name
  const participantName =
    userName ||
    localStorage.getItem("tt_participant_name") ||
    localStorage.getItem("playerName") ||
    localStorage.getItem("hostName") ||
    "Player";

  // Convert sessionCode to sessionId when component mounts
  useEffect(() => {
    const resolveSessionId = async () => {
      if (!sessionCode) return;

      try {
        const resolvedSessionId = await getSessionIdByCode(sessionCode);
        setSessionId(resolvedSessionId);
      } catch (error) {
        Logger.error("Failed to resolve session code:", error);
        setError("Invalid session code");
      }
    };

    if (sessionCode) {
      resolveSessionId();
    }
  }, [sessionCode]);

  // Fetch questions from Netlify Blobs
  useEffect(() => {
    const fetchQuestions = async () => {
      if (!sessionCode) return;

      setLoading(true);
      const result = await getQuizQuestions(sessionCode);

      if (result.success && result.data) {
        setQuestions(result.data.questions);
        Logger.log(
          `✅ Loaded ${result.data.questions.length} questions from Netlify Blobs`
        );
      } else {
        Logger.error("Failed to load questions:", result.error);
        setError("No questions found. Please go back and select questions.");

        // Redirect back to GameSetup after 3 seconds
        setTimeout(() => {
          navigate(`/gamesetup/${sessionCode}`);
        }, 3000);
      }
      setLoading(false);
    };

    void fetchQuestions();
  }, [sessionCode]);

  // Segment definitions
  const segments = {
    WDYK: { name: "What Do You Know", description: "Open-ended questions" },
    AUCT: { name: "Auction", description: "Bid-based questions" },
    BELL: { name: "Bell", description: "First to answer" },
    UPDW: { name: "Upside-down", description: "Hard questions" },
    REMO: { name: "Remontada", description: "Career path questions" },
  };

  // Add placeholder participants if testing solo
  const realPlayers = participants.filter((p) => p.role !== "Host");
  const placeholderParticipants: typeof realPlayers =
    realPlayers.length === 0
      ? [
          {
            participant_id: "placeholder-1",
            name: "Player 1 (Test)",
            role: "Home",
            flag: "gb-eng",
            team_logo_url:
              "https://tmssl.akamaized.net/images/wappen/head/11.png",
            session_id: sessionId || "",
            lobby_presence: "joined",
            video_presence: false,
            powerup_pass_used: false,
            powerup_alhabeed: false,
            powerup_bellegoal: false,
            powerup_slippyg: false,
            profile_id: null,
            password: null,
            isReady: true,
            join_at: new Date().toISOString(),
            lastHeartbeat: new Date().toISOString(),
            disconnect_at: null,
          } as (typeof realPlayers)[0],
          {
            participant_id: "placeholder-2",
            name: "Player 2 (Test)",
            role: "Away",
            flag: "es",
            team_logo_url:
              "https://tmssl.akamaized.net/images/wappen/head/418.png",
            session_id: sessionId || "",
            lobby_presence: "joined",
            video_presence: false,
            powerup_pass_used: false,
            powerup_alhabeed: false,
            powerup_bellegoal: false,
            powerup_slippyg: false,
            profile_id: null,
            password: null,
            isReady: true,
            join_at: new Date().toISOString(),
            lastHeartbeat: new Date().toISOString(),
            disconnect_at: null,
          } as (typeof realPlayers)[0],
        ]
      : [];

  const players =
    realPlayers.length > 0 ? realPlayers : placeholderParticipants;
  const host = participants.find((p) => p.role === "Host");

  // Get questions for current segment
  const currentSegmentQuestions = questions.filter(
    (q) => q.segment_code === currentSegment
  );
  const currentQuestion = currentSegmentQuestions[currentQuestionIndex] || null;

  // Get remaining questions for current segment
  const getCurrentSegmentConfig = () => {
    return segmentConfig.find(
      (config) => config.segment_code === currentSegment
    );
  };

  const remainingQuestions = getCurrentSegmentConfig()?.questions_count || 0;

  // PASS Button Logic - Enabled only if:
  // 1. currentSegment === 'WDYK'
  // 2. Player has exactly 2 strikes
  // 3. powerup_pass_used === false
  const canUsePass = (participant: Tables<"Participants">) => {
    const participantStrikes = strikes[participant.participant_id] || 0;
    return (
      currentSegment === "WDYK" &&
      participantStrikes === 2 &&
      !participant.powerup_pass_used
    );
  };

  const handlePassButtonClick = async (participant: Tables<"Participants">) => {
    if (!canUsePass(participant)) return;

    setLoading(true);
    try {
      await activatePowerup(participant.participant_id, "pass");
      // Note: This would also lock the other player's PASS until they answer correctly
      // That logic would be implemented in the game flow management
    } catch (error) {
      Logger.error("Error using PASS powerup:", error);
      setError(
        error instanceof Error ? error.message : "Failed to use PASS powerup"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleIncrementStrike = async (participantId: string) => {
    setLoading(true);
    try {
      // Skip database operations for placeholder test participants
      if (participantId.startsWith("placeholder-")) {
        Logger.log(
          `Skipping strike increment for test participant ${participantId}`
        );
        return;
      }
      await incrementStrike(sessionId!, participantId);
    } catch (error) {
      Logger.error("Error incrementing strike:", error);
      setError(
        error instanceof Error ? error.message : "Failed to increment strike"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetStrikes = async (participantId: string) => {
    setLoading(true);
    try {
      // Skip database operations for placeholder test participants
      if (participantId.startsWith("placeholder-")) {
        Logger.log(
          `Skipping strike reset for test participant ${participantId}`
        );
        return;
      }
      await resetStrikes(sessionId!, participantId);
    } catch (error) {
      Logger.error("Error resetting strikes:", error);
      setError(
        error instanceof Error ? error.message : "Failed to reset strikes"
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

        {/* Video Room - Persists from Lobby */}
        <div className="mb-8">
          <VideoRoom
            players={participants}
            sessionCode={sessionCode || ""}
            sessionId={sessionId || ""}
            participantName={participantName}
            autoJoin={true} // Auto-join in Quiz to maintain call from Lobby
          />
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

        {/* Question Display Section */}
        {currentQuestion && (
          <div className="bg-white rounded-xl p-6 shadow-lg mb-8">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-3 py-1 bg-blue-500 text-white text-sm font-bold rounded-full">
                    Question {currentQuestionIndex + 1} of{" "}
                    {currentSegmentQuestions.length}
                  </span>
                  <span className="px-3 py-1 bg-purple-500 text-white text-sm font-bold rounded-full">
                    {currentQuestion.question_type === "list"
                      ? "📚 List"
                      : "🔔 Buzz"}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-4">
                  {currentQuestion.question_text}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowAnswers(!showAnswers);
                }}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg transition-colors"
              >
                {showAnswers ? "🙈 Hide Answers" : "👁️ Show Answers"}
              </button>
            </div>

            {/* Answers Section (Host View) */}
            {showAnswers && (
              <div className="mt-4 p-4 bg-green-50 rounded-lg border-2 border-green-300">
                <h4 className="text-lg font-bold text-green-800 mb-3">
                  ✅ Correct Answers:
                </h4>
                {currentQuestion.question_type === "list" ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {(Array.isArray(currentQuestion.answers)
                      ? currentQuestion.answers
                      : JSON.parse(currentQuestion.answers as string)
                    ).map((answer: string, idx: number) => (
                      <div
                        key={idx}
                        className="px-3 py-2 bg-white rounded-lg border border-green-300 text-gray-800 font-medium"
                      >
                        {idx + 1}. {answer}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-3 bg-white rounded-lg border border-green-300">
                    <p className="text-gray-800 font-bold text-lg">
                      {typeof currentQuestion.answers === "string"
                        ? currentQuestion.answers
                        : (currentQuestion.answers as string[])[0]}
                    </p>
                  </div>
                )}
                {currentQuestion.total_answers_available && (
                  <p className="text-sm text-green-700 mt-2">
                    Total answers available:{" "}
                    {currentQuestion.total_answers_available}
                  </p>
                )}
              </div>
            )}

            {/* Question Navigation */}
            <div className="flex justify-between items-center mt-6 pt-4 border-t">
              <button
                onClick={() => {
                  setCurrentQuestionIndex(
                    Math.max(0, currentQuestionIndex - 1)
                  );
                  setShowAnswers(false);
                }}
                disabled={currentQuestionIndex === 0}
                className="px-4 py-2 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white font-bold rounded-lg disabled:cursor-not-allowed"
              >
                ← Previous
              </button>
              <span className="text-gray-600 font-medium">
                {currentQuestionIndex + 1} / {currentSegmentQuestions.length}
              </span>
              <button
                onClick={() => {
                  setCurrentQuestionIndex(
                    Math.min(
                      currentSegmentQuestions.length - 1,
                      currentQuestionIndex + 1
                    )
                  );
                  setShowAnswers(false);
                }}
                disabled={
                  currentQuestionIndex === currentSegmentQuestions.length - 1
                }
                className="px-4 py-2 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white font-bold rounded-lg disabled:cursor-not-allowed"
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {!currentQuestion && (
          <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-6 text-center mb-8">
            <p className="text-xl text-yellow-800 font-bold">
              📝 No questions available for this segment
            </p>
            <p className="text-yellow-700 mt-2">
              Go back to Game Setup to select questions for{" "}
              {segments[currentSegment].name}
            </p>
          </div>
        )}

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
                          <span
                            className={`fi fi-${player.flag} text-lg`}
                          ></span>
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
