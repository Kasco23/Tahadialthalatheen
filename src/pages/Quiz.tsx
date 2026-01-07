import { Logger } from "../lib/logger";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAtom } from "jotai";
import { useSession } from "../lib/sessionHooks";
import { useSegmentConfig, useParticipants } from "../lib/realtimeHooks";
import { activatePowerup, getSessionIdByCode } from "../lib/mutations";
import {
  getQuizQuestions,
  getAllStrikeCounts,
  incrementStrikeInBlob,
  decrementStrikeInBlob,
} from "../lib/blobsManager";
import { dailyUserNameAtom } from "../atoms";
import { VideoRoom } from "../components/VideoRoom";
import { useAuth } from "../contexts/AuthContext";
import type {
  SegmentCode,
  Database,
  ParticipantRow,
} from "../lib/types/supabase";

type Participant = Database["public"]["Tables"]["Participants"]["Row"];

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
  const { segmentConfig, loading: configLoading } = useSegmentConfig(sessionId);
  const { participants, loading: participantsLoading } =
    useParticipants(sessionId);

  // Strike counts from Blobs (local state)
  const [strikes, setStrikes] = useState<Record<string, number>>({});

  const [userName] = useAtom(dailyUserNameAtom);
  const { profile } = useAuth();

  // Determine if current user is host
  // Priority: 1) Match profile_id in participants, 2) Fallback to localStorage for testing
  const currentUserParticipant = participants.find(
    (p) => p.profile_id === profile?.id
  );
  const isHostClient =
    currentUserParticipant?.role === "Host" ||
    (typeof window !== "undefined" &&
      window.localStorage.getItem("isHost") === "true" &&
      !currentUserParticipant);

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
  // Host should see answers immediately; players never see answers
  const [showAnswers, setShowAnswers] = useState(isHostClient);
  // Track checked answers for list questions (WDYK and AUCT)
  const [checkedAnswers, setCheckedAnswers] = useState<Record<string, boolean>>(
    {}
  );

  // Segment completion tracking (in real app would be in database)
  const [completedSegments, setCompletedSegments] = useState<SegmentCode[]>([]);

  // Segment order definition
  const segmentOrder: SegmentCode[] = ["WDYK", "AUCT", "BELL", "UPDW", "REMO"];

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
      void resolveSessionId();
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
        // Load strike counts from blob
        setStrikes(result.data.strike_counts || {});
        Logger.log(
          `✅ Loaded ${result.data.questions.length} questions from Netlify Blobs`
        );
      } else {
        Logger.error("Failed to load questions:", result.error);
        setError("No questions found. Please go back and select questions.");
      }
      setLoading(false);
    };

    void fetchQuestions();
  }, [sessionCode, navigate]);

  // Poll for strike count updates every 2 seconds
  useEffect(() => {
    if (!sessionCode) return;

    const pollStrikes = setInterval(async () => {
      const strikeCounts = await getAllStrikeCounts(sessionCode);
      setStrikes(strikeCounts);
    }, 2000);

    return () => clearInterval(pollStrikes);
  }, [sessionCode]);

  // Helper: Check if segment can be started
  const canStartSegment = (segmentCode: SegmentCode): boolean => {
    const segmentIndex = segmentOrder.indexOf(segmentCode);
    if (segmentIndex === 0) return true; // First segment always available

    // All previous segments must be completed
    const previousSegment = segmentOrder[segmentIndex - 1];
    return completedSegments.includes(previousSegment);
  };

  // Helper: Mark current segment as complete
  const handleCompleteSegment = () => {
    if (!completedSegments.includes(currentSegment)) {
      setCompletedSegments([...completedSegments, currentSegment]);

      // Auto-advance to next segment if available
      const currentIndex = segmentOrder.indexOf(currentSegment);
      if (currentIndex < segmentOrder.length - 1) {
        const nextSegment = segmentOrder[currentIndex + 1];
        setCurrentSegment(nextSegment);
        setCurrentQuestionIndex(0);
        setShowAnswers(isHostClient);
        setCheckedAnswers({});
      }
    }
  };

  // Segment definitions
  const segments = {
    WDYK: { name: "What Do You Know", description: "Open-ended questions" },
    AUCT: { name: "Auction", description: "Bid-based questions" },
    BELL: { name: "Bell", description: "First to answer" },
    UPDW: { name: "Upside-down", description: "Hard questions" },
    REMO: { name: "Remontada", description: "Career path questions" },
  };

  // Identify host participant from session
  const host = participants.find((p) => p.role === "Host");

  // Add placeholder participants if testing solo
  const realPlayers = participants.filter((p) => p.role !== "Host");
  const placeholderParticipants: typeof realPlayers =
    realPlayers.length === 0
      ? [
          {
            participant_id: "placeholder-1",
            role: "Home",
            session_id: sessionId ?? "",
            session_presence: "joined",
            video_presence: false,
            powerup_pass_used: false,
            powerup_alhabeed: false,
            powerup_bellegoal: false,
            powerup_slippyg: false,
            profile_id: null,
            join_at: new Date().toISOString(),
            lastHeartbeat: new Date().toISOString(),
            disconnect_at: null,
            Profiles: {
              id: "placeholder-profile-1",
              name: "Player 1 (Test)",
              username: "player1",
              flag: "ps",
              team_url:
                "https://psdrwkjkgubatiemsgqn.supabase.co/storage/v1/object/public/logos/Ligue-1/paris-saint-germain.svg",
              avatar_url:
                "https://psdrwkjkgubatiemsgqn.supabase.co/storage/v1/object/public/avatars/Test_Users/profile-2-2197365079.jpg",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          } as ParticipantRow,
          {
            participant_id: "placeholder-2",
            role: "Away",
            session_id: sessionId || "",
            session_presence: "joined",
            video_presence: false,
            powerup_pass_used: false,
            powerup_alhabeed: false,
            powerup_bellegoal: false,
            powerup_slippyg: false,
            profile_id: null,
            join_at: new Date().toISOString(),
            lastHeartbeat: new Date().toISOString(),
            disconnect_at: null,
            Profiles: {
              id: "placeholder-profile-2",
              name: "Player 2 (Test)",
              username: "player2",
              flag: "ps",
              team_url:
                "https://psdrwkjkgubatiemsgqn.supabase.co/storage/v1/object/public/logos/Ligue-1/paris-saint-germain.svg",
              avatar_url:
                "https://psdrwkjkgubatiemsgqn.supabase.co/storage/v1/object/public/avatars/Test_Users/profile-2-2197365079.jpg",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          } as ParticipantRow,
        ]
      : [];

  const players =
    realPlayers.length > 0 ? realPlayers : placeholderParticipants;

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

  const remainingQuestions = getCurrentSegmentConfig()?.questions_count ?? 0;

  // PASS Button Logic - Enabled only if:
  // 1. currentSegment === 'WDYK'
  // 2. Player has exactly 2 strikes
  // 3. powerup_pass_used === false
  const canUsePass = (participant: Participant) => {
    const participantStrikes = strikes[participant.participant_id] || 0;
    return (
      currentSegment === "WDYK" &&
      participantStrikes === 2 &&
      !participant.powerup_pass_used
    );
  };

  const handlePassButtonClick = async (participant: Participant) => {
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

  const handleToggleAnswer = (answerIndex: number) => {
    const key = `${currentQuestion?.question_id}-${answerIndex}`;
    setCheckedAnswers((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleIncrementStrike = async (participantId: string) => {
    if (!sessionCode || !sessionId) return;

    setLoading(true);
    try {
      // Check max strikes limit
      const currentStrikes = strikes[participantId] ?? 0;
      if (currentStrikes >= 3) {
        Logger.log(`Participant ${participantId} already has 3 strikes (max)`);
        return;
      }

      // Update strike count in blob
      const result = await incrementStrikeInBlob(
        sessionCode,
        sessionId,
        participantId
      );
      if (result.success && result.data) {
        setStrikes(result.data.strike_counts || {});
        Logger.log(`✅ Incremented strike for ${participantId}`);
      }
    } catch (error) {
      Logger.error("Error incrementing strike:", error);
      setError(
        error instanceof Error ? error.message : "Failed to increment strike"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDecrementStrike = async (participantId: string) => {
    if (!sessionCode || !sessionId) return;

    setLoading(true);
    try {
      // Check min strikes limit
      const currentStrikes = strikes[participantId] ?? 0;
      if (currentStrikes <= 0) {
        Logger.log(`Participant ${participantId} already has 0 strikes (min)`);
        return;
      }

      // Update strike count in blob
      const result = await decrementStrikeInBlob(
        sessionCode,
        sessionId,
        participantId
      );
      if (result.success && result.data) {
        setStrikes(result.data.strike_counts || {});
        Logger.log(`✅ Decremented strike for ${participantId}`);
      }
    } catch (error) {
      Logger.error("Error decrementing strike:", error);
      setError(
        error instanceof Error ? error.message : "Failed to decrement strike"
      );
    } finally {
      setLoading(false);
    }
  };

  if (sessionLoading || configLoading || participantsLoading) {
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
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 text-white">
          <h1 className="text-4xl font-bold mb-2">⚽ Quiz In Progress</h1>
          <p className="text-xl opacity-90">Session: {sessionCode}</p>
          <p className="text-lg opacity-80">
            Phase: {session.phase} | Game State: {session.game_state}
          </p>
        </div>

        {/* Error Display - Show at top if present */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border-2 border-red-400 text-red-700 rounded-lg">
            <p className="font-bold text-lg mb-2">Error</p>
            <p className="mb-4">{error}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setError(null)}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 font-medium"
              >
                Dismiss
              </button>
              <button
                onClick={() => navigate(`/gamesetup/${sessionCode}`)}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 font-medium"
              >
                Go to Game Setup
              </button>
            </div>
          </div>
        )}

        {/* Main Grid Layout: Banners Left | Q&A Top-Right | Video Bottom-Right */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Column: Player and Host Banners */}
          <div className="lg:col-span-1 space-y-4">
            {/* Players Section - Compact */}
            {players.map((player) => {
              const playerStrikes = strikes[player.participant_id] || 0;
              return (
                <div
                  key={player.participant_id}
                  className="bg-white rounded-xl p-4 shadow-lg"
                >
                  <div className="flex items-center gap-3 mb-3">
                    {/* Profile Picture - Squared */}
                    {player.Profiles?.avatar_url && (
                      <img
                        src={player.Profiles.avatar_url}
                        alt={player.Profiles.name || "Player"}
                        className="w-12 h-12 rounded object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    )}
                    {/* Flag */}
                    {player.Profiles?.flag && (
                      <div className="w-12 h-12 flex items-center justify-center">
                        <span
                          className={`fi fi-${player.Profiles.flag.toLowerCase()} text-2xl`}
                        ></span>
                      </div>
                    )}
                    {/* Team Logo */}
                    {player.Profiles?.team_url && (
                      <img
                        src={player.Profiles.team_url}
                        alt="Team logo"
                        className="w-12 h-12 object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    )}
                  </div>
                  <div className="mb-2">
                    <h3 className="text-lg font-bold text-gray-800">
                      {player.Profiles?.name || "Unknown Player"}
                    </h3>
                    <p className="text-sm text-gray-600">{player.role}</p>
                  </div>
                  <div className="flex justify-between items-center mb-3">
                    <div className="text-xl font-bold text-gray-800">0 pts</div>
                    <div className="text-sm text-red-600 font-semibold">
                      Strikes: {playerStrikes}
                    </div>
                  </div>

                  {/* Strike Management (Host only, WDYK segment only) */}
                  {isHostClient && currentSegment === "WDYK" && (
                    <div className="mb-3 flex gap-2">
                      <button
                        onClick={() =>
                          void handleIncrementStrike(player.participant_id)
                        }
                        disabled={loading || playerStrikes >= 3}
                        className="flex-1 px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 disabled:opacity-50"
                      >
                        +1 Strike
                      </button>
                      <button
                        onClick={() =>
                          void handleDecrementStrike(player.participant_id)
                        }
                        disabled={loading || playerStrikes <= 0}
                        className="flex-1 px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 disabled:opacity-50"
                      >
                        -1 Strike
                      </button>
                    </div>
                  )}

                  {/* Powerup Buttons - Segment Specific */}
                  <div className="space-y-2">
                    {currentSegment === "WDYK" && (
                      <button
                        onClick={() => void handlePassButtonClick(player)}
                        disabled={!canUsePass(player) || loading}
                        className={`w-full py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                          canUsePass(player) && !loading
                            ? "bg-yellow-500 hover:bg-yellow-600 text-black"
                            : "bg-gray-300 text-gray-500 cursor-not-allowed"
                        }`}
                      >
                        {player.powerup_pass_used
                          ? "✓ PASS Used"
                          : playerStrikes !== 2
                            ? `PASS (Need 2 strikes)`
                            : "PASS Available"}
                      </button>
                    )}
                    {currentSegment === "AUCT" && (
                      <div className="space-y-2">
                        <button
                          disabled={
                            (player.powerup_alhabeed ?? false) || loading
                          }
                          className={`w-full py-2 px-3 rounded-lg text-sm font-medium ${
                            player.powerup_alhabeed
                              ? "bg-gray-300 text-gray-500"
                              : "bg-blue-500 hover:bg-blue-600 text-white"
                          }`}
                        >
                          {player.powerup_alhabeed
                            ? "✓ Al-Habeed Used"
                            : "Al-Habeed (30+)"}
                        </button>
                        <button
                          disabled={loading}
                          className="w-full py-2 px-3 rounded-lg text-sm font-medium bg-orange-500 hover:bg-orange-600 text-white"
                        >
                          Withdraw
                        </button>
                      </div>
                    )}
                    {currentSegment === "BELL" && (
                      <button
                        disabled={
                          (player.powerup_bellegoal ?? false) || loading
                        }
                        className={`w-full py-2 px-3 rounded-lg text-sm font-medium ${
                          player.powerup_bellegoal
                            ? "bg-gray-300 text-gray-500"
                            : "bg-purple-500 hover:bg-purple-600 text-white"
                        }`}
                      >
                        {player.powerup_bellegoal
                          ? "✓ Bellegoal Used"
                          : "Bellegoal"}
                      </button>
                    )}
                    {currentSegment === "UPDW" && (
                      <button
                        disabled={player.powerup_slippyg || loading}
                        className={`w-full py-2 px-3 rounded-lg text-sm font-medium ${
                          player.powerup_slippyg
                            ? "bg-gray-300 text-gray-500"
                            : "bg-red-500 hover:bg-red-600 text-white"
                        }`}
                      >
                        {player.powerup_slippyg
                          ? "✓ Slippy-G Used"
                          : "Slippy-G"}
                      </button>
                    )}
                    {currentSegment === "REMO" && (
                      <div className="text-center text-xs text-gray-500 py-2">
                        No powerups
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Host Section - Compact */}
            {host && (
              <div className="bg-white rounded-xl p-4 shadow-lg">
                <div className="flex items-center gap-3 mb-2">
                  {/* Profile Picture - Squared */}
                  {host.Profiles?.avatar_url && (
                    <img
                      src={host.Profiles.avatar_url}
                      alt={host.Profiles.name || "Host"}
                      className="w-12 h-12 rounded object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  )}
                  {/* Flag */}
                  {host.Profiles?.flag && (
                    <div className="w-12 h-12 flex items-center justify-center">
                      <span
                        className={`fi fi-${host.Profiles.flag.toLowerCase()} text-2xl`}
                      ></span>
                    </div>
                  )}
                  {/* Team Logo */}
                  {host.Profiles?.team_url && (
                    <img
                      src={host.Profiles.team_url}
                      alt="Team logo"
                      className="w-12 h-12 object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  )}
                </div>
                <h3 className="text-lg font-bold text-gray-800">
                  {host.Profiles?.name || "Unknown Host"}
                </h3>
                <p className="text-sm text-gray-600">Host</p>
              </div>
            )}
          </div>

          {/* Right Column: Segment Info, Questions, and Video */}
          <div className="lg:col-span-3 space-y-6">
            {/* Current Segment Info */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-white">
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
                {segmentOrder.map((code) => {
                  const info = segments[code];
                  const config = segmentConfig.find(
                    (c) => c.segment_code === code
                  );
                  // Use segmentConfig if available, otherwise count from loaded questions
                  const questionCount =
                    config?.questions_count ??
                    questions.filter((q) => q.segment_code === code).length;
                  const canStart = canStartSegment(code);
                  const isCompleted = completedSegments.includes(code);
                  const isActive = currentSegment === code;
                  return (
                    <button
                      key={code}
                      onClick={() => {
                        if (canStart) {
                          setCurrentSegment(code);
                        }
                      }}
                      disabled={!canStart}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        isActive
                          ? "bg-yellow-500 text-black"
                          : isCompleted
                            ? "bg-green-600 text-white"
                            : !canStart
                              ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                              : "bg-white/20 text-white hover:bg-white/30"
                      }`}
                    >
                      {isCompleted ? "✓ " : !canStart ? "🔒 " : ""}
                      {info.name} ({questionCount})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Segment Completion Button (Host Only) */}
            {isHostClient && !completedSegments.includes(currentSegment) && (
              <div className="mb-4 text-center">
                <button
                  onClick={handleCompleteSegment}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
                >
                  Complete {segments[currentSegment].name} Segment
                </button>
              </div>
            )}

            {/* Question Display Section */}
            {currentQuestion && (
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-3 py-1 bg-blue-500 text-white text-sm font-bold rounded-full">
                        Question {currentQuestionIndex + 1} of{" "}
                        {currentSegmentQuestions.length}
                      </span>
                      <span className="px-3 py-1 bg-purple-500 text-white text-sm font-bold rounded-full">
                        {currentQuestion.question_type === "list"
                          ? "List"
                          : "Buzz"}
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-4">
                      {currentQuestion.question_text}
                    </h3>
                  </div>
                  {isHostClient && (
                    <button
                      onClick={() => setShowAnswers(!showAnswers)}
                      className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg transition-colors"
                    >
                      {showAnswers ? "Hide Answers" : "Show Answers"}
                    </button>
                  )}
                </div>

                {/* Answers Section (Host View) */}
                {showAnswers && (
                  <div className="mt-4 p-4 bg-green-50 rounded-lg border-2 border-green-300">
                    {currentQuestion.question_type === "list" &&
                    (currentSegment === "WDYK" || currentSegment === "AUCT") ? (
                      <div className="space-y-2">
                        {(Array.isArray(currentQuestion.answers)
                          ? currentQuestion.answers
                          : JSON.parse(currentQuestion.answers as string)
                        ).map((answer: string, idx: number) => {
                          const checkKey = `${currentQuestion.question_id}-${idx}`;
                          return (
                            <label
                              key={idx}
                              className="flex items-center gap-3 px-3 py-2 bg-white rounded-lg border border-green-300 hover:bg-green-50 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={checkedAnswers[checkKey] || false}
                                onChange={() => handleToggleAnswer(idx)}
                                className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                              />
                              <span className="text-gray-800 font-medium">
                                {idx + 1}. {answer}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    ) : currentQuestion.question_type === "list" ? (
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
                      <p className="text-sm text-green-700 mt-3">
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
                      setCheckedAnswers({});
                    }}
                    disabled={currentQuestionIndex === 0}
                    className="px-4 py-2 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white font-bold rounded-lg disabled:cursor-not-allowed"
                  >
                    ← Previous
                  </button>
                  <span className="text-gray-600 font-medium">
                    {currentQuestionIndex + 1} /{" "}
                    {currentSegmentQuestions.length}
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
                      setCheckedAnswers({});
                    }}
                    disabled={
                      currentQuestionIndex ===
                      currentSegmentQuestions.length - 1
                    }
                    className="px-4 py-2 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white font-bold rounded-lg disabled:cursor-not-allowed"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}

            {!currentQuestion && (
              <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-6 text-center">
                <p className="text-xl text-yellow-800 font-bold">
                  No questions available for this segment
                </p>
                <p className="text-yellow-700 mt-2">
                  Go back to Game Setup to select questions for{" "}
                  {segments[currentSegment].name}
                </p>
              </div>
            )}

            {/* Video Room - Below Questions */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <VideoRoom
                players={participants}
                sessionCode={sessionCode ?? ""}
                sessionId={sessionId ?? ""}
                participantName={participantName}
                autoJoin={true}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Quiz;
