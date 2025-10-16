import { Logger } from "../lib/logger";
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  joinAsHost,
  joinAsPlayerWithCode,
  rejoinAsParticipant,
  setParticipantPassword,
} from "../lib/mutations";
import {
  checkForExistingPreset,
  checkForExistingParticipants,
  storeParticipantData,
  getLobbyUrl,
  extractTeamNameFromLogoUrl,
  type ExistingPreset,
  type ExistingParticipant,
} from "../lib/joinHelpers";
import { Alert } from "../components/Alert";
import OptimizedFlagSelector from "../components/OptimizedFlagSelector";
import PresetConfirmationModal from "../components/PresetConfirmationModal";
import RejoinModal from "../components/RejoinModal";
import { supabase } from "../lib/supabaseClient";
import { getSeatsFromRole, setSeatInStorage } from "../lib/userSession";
import type { ParticipantRole } from "../lib/types";
import { useAuth } from "../contexts/AuthContext";

// ReactBits Components
import { AnimatedList, SpotlightCard, Dock } from "../components/ReactBits";

interface League {
  name: string;
  displayName: string;
  leagueLogo?: string;
  teams: Team[];
}

interface Team {
  name: string;
  displayName: string;
  logoUrl: string;
}

interface LogoResponse {
  categories: Record<
    string,
    {
      displayName: string;
      leagueLogo?: string;
      teams: { name: string; url: string }[];
    }
  >;
}

const JoinRevolutionary: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"host" | "player">("host");
  const [currentStep, setCurrentStep] = useState<
    "role" | "details" | "flag" | "team"
  >("role");

  // Alert state
  const [alert, setAlert] = useState<{
    type: "error" | "success" | "info";
    message: string;
  } | null>(null);

  // Preset confirmation state
  const [showPresetModal, setShowPresetModal] = useState(false);
  const [existingPreset, setExistingPreset] = useState<ExistingPreset | null>(
    null,
  );
  const [presetModalLoading, setPresetModalLoading] = useState(false);

  // Rejoin state
  const [showRejoinModal, setShowRejoinModal] = useState(false);
  const [rejoinParticipants, setRejoinParticipants] = useState<
    ExistingParticipant[]
  >([]);
  const [rejoinLoading, setRejoinLoading] = useState(false);

  // Host form state
  const [sessionCode, setSessionCode] = useState("");
  const [hostPassword, setHostPassword] = useState("");
  const [hostLoading, setHostLoading] = useState(false);
  const [hostSelectedFlag, setHostSelectedFlag] = useState("");
  const [hostTeamLogoUrl, setHostTeamLogoUrl] = useState("");
  const [hostTeamName, setHostTeamName] = useState("");

  // Player form state
  const [playerSessionCode, setPlayerSessionCode] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [playerPassword, setPlayerPassword] = useState("");
  const [selectedFlag, setSelectedFlag] = useState("");
  const [teamLogoUrl, setTeamLogoUrl] = useState("");
  const [teamName, setTeamName] = useState("");
  const [playerLoading, setPlayerLoading] = useState(false);

  // League and team data
  const [leagues, setLeagues] = useState<League[]>([]);
  const [selectedLeague, setSelectedLeague] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Auto-fill session code and role from query parameters
  useEffect(() => {
    const sessionCodeParam = searchParams.get("sessionCode");
    const roleParam = searchParams.get("role");

    if (sessionCodeParam) {
      setSessionCode(sessionCodeParam);
      setPlayerSessionCode(sessionCodeParam);
      setActiveTab("player");
    }

    if (roleParam === "host" || roleParam === "player") {
      setActiveTab(roleParam);
      setCurrentStep("details"); // Skip role selection and go directly to details
    }
  }, [searchParams]);

  // Check for existing participants when session code changes (for rejoin)
  useEffect(() => {
    const checkExistingParticipantsForRejoin = async () => {
      const codeToCheck =
        activeTab === "host" ? sessionCode : playerSessionCode;

      if (!codeToCheck.trim() || codeToCheck.length < 4) {
        setRejoinParticipants([]);
        return;
      }

      const participants = await checkForExistingParticipants(
        codeToCheck,
        activeTab,
      );

      setRejoinParticipants(participants);
    };

    // Debounce the check by 500ms
    const timer = setTimeout(checkExistingParticipantsForRejoin, 500);
    return () => clearTimeout(timer);
  }, [sessionCode, playerSessionCode, activeTab]);

  // Load team logos from Supabase
  useEffect(() => {
    const loadLogos = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("list-logos");

        if (error) {
          Logger.error("Error fetching logos:", error);
          setError("Failed to load team logos");
          return;
        }

        const response = data as LogoResponse;
        const leaguesList: League[] = Object.entries(response.categories).map(
          ([key, value]) => ({
            name: key,
            displayName: value.displayName,
            leagueLogo: value.leagueLogo,
            teams: value.teams.map((team) => ({
              name: team.name,
              displayName: team.name,
              logoUrl: team.url,
            })),
          }),
        );

        setLeagues(leaguesList);
      } catch (error) {
        Logger.error("Error loading logos:", error);
        setError("Failed to load team logos");
      } finally {
        setLoading(false);
      }
    };

    loadLogos();
  }, []);

  // Check for existing preset
  const handleCheckPreset = async (
    name: string,
    sessionCode?: string,
    role?: string,
  ) => {
    const preset = await checkForExistingPreset(name, sessionCode, role);
    if (preset && preset.flag && preset.team_logo_url) {
      setExistingPreset(preset);
      setShowPresetModal(true);
      return true; // Preset found
    }
    return false; // No preset found
  };

  // Handle preset modal responses
  const handleUseExistingPreset = async () => {
    setPresetModalLoading(true);

    if (!existingPreset) return;

    try {
      // Set the existing preset values
      if (activeTab === "host") {
        setHostSelectedFlag(existingPreset.flag || "");
        setHostTeamLogoUrl(existingPreset.team_logo_url || "");
        const teamName = extractTeamNameFromLogoUrl(
          existingPreset.team_logo_url || "",
        );
        setHostTeamName(teamName);

        // Proceed directly to join
        await joinAsHostWithPreset();
      } else {
        setSelectedFlag(existingPreset.flag || "");
        setTeamLogoUrl(existingPreset.team_logo_url || "");
        const teamName = extractTeamNameFromLogoUrl(
          existingPreset.team_logo_url || "",
        );
        setTeamName(teamName);

        // Proceed directly to join
        await joinAsPlayerWithPreset();
      }
    } catch (error) {
      Logger.error("Error using existing preset:", error);
      setAlert({
        type: "error",
        message: "Failed to use existing preset. Please try again.",
      });
    } finally {
      setPresetModalLoading(false);
      setShowPresetModal(false);
    }
  };

  const handleCreateNewPreset = () => {
    setShowPresetModal(false);
    setCurrentStep("flag"); // Go to flag selection step
  };

  // Separate join functions for preset flow
  const joinAsHostWithPreset = async () => {
    if (!sessionCode.trim()) {
      setAlert({ type: "error", message: "Please enter a session code" });
      return;
    }

    if (!user?.id) {
      setAlert({ type: "error", message: "Please sign in to join as host" });
      navigate("/login");
      return;
    }

    setHostLoading(true);

    try {
      const { participantId, role } = await joinAsHost(
        sessionCode,
        user.id,
        hostSelectedFlag,
        hostTeamLogoUrl,
      );

      // Store password for rejoin (database handles hashing)
      if (hostPassword.trim()) {
        await setParticipantPassword(participantId, hostPassword);
      }

      // Store participant data in localStorage
      storeParticipantData(
        participantId,
        sessionCode,
        role,
        true,
        undefined,
        hostSelectedFlag ?? undefined,
        hostTeamLogoUrl ?? undefined,
        hostTeamName ?? undefined,
      );

      // Navigate to lobby
      const seat = getSeatsFromRole(role as ParticipantRole);
      if (seat) {
        setSeatInStorage(seat);
      }
      navigate(getLobbyUrl(sessionCode, role as ParticipantRole, seat));
    } catch (error) {
      Logger.error("Error joining as host:", error);
      setAlert({
        type: "error",
        message: "Failed to join as host. Please check your credentials.",
      });
    } finally {
      setHostLoading(false);
    }
  };

  const joinAsPlayerWithPreset = async () => {
    if (!playerSessionCode.trim() || !playerName.trim()) {
      setAlert({
        type: "error",
        message: "Please fill in session code and player name",
      });
      return;
    }

    if (!playerPassword.trim()) {
      setAlert({
        type: "error",
        message: "Please create a password for rejoining",
      });
      return;
    }

    setPlayerLoading(true);

    try {
      const { participantId, role } = await joinAsPlayerWithCode(
        playerSessionCode,
        playerName,
        selectedFlag,
        teamLogoUrl,
      );

      // Store password for rejoin (database handles hashing)
      await setParticipantPassword(participantId, playerPassword);

      // Store participant data in localStorage
      storeParticipantData(
        participantId,
        playerSessionCode,
        role,
        false,
        playerName,
        selectedFlag ?? undefined,
        teamLogoUrl ?? undefined,
        teamName ?? undefined,
      );

      // Navigate to lobby
      const seat = getSeatsFromRole(role as ParticipantRole);
      if (seat) {
        setSeatInStorage(seat);
      }
      navigate(getLobbyUrl(playerSessionCode, role as ParticipantRole, seat));
    } catch (error) {
      Logger.error("Error joining as player:", error);
      setAlert({
        type: "error",
        message: "Failed to join as player. Please check your session code.",
      });
    } finally {
      setPlayerLoading(false);
    }
  };

  // Event handlers
  const handleHostLogoSelect = (logoUrl: string, teamName: string) => {
    setHostTeamLogoUrl(logoUrl);
    setHostTeamName(teamName);
  };

  const handlePlayerLogoSelect = (logoUrl: string, teamName: string) => {
    setTeamLogoUrl(logoUrl);
    setTeamName(teamName);
  };

  // Handle rejoin flow
  const handleRejoin = async (
    participantId: string,
    password: string,
    updateConfig: boolean,
  ) => {
    setRejoinLoading(true);
    try {
      // Rejoin with password (database handles verification)
      const { role, sessionId } = await rejoinAsParticipant(
        participantId,
        password,
      );

      // Get session code
      const { data: sessionData } = await supabase
        .from("Session")
        .select("session_code")
        .eq("session_id", sessionId)
        .single();

      const code = sessionData?.session_code;

      if (!code) {
        throw new Error("Failed to get session code");
      }

      // Store participant data
      storeParticipantData(
        participantId,
        code,
        role,
        role === "Host",
        undefined,
        undefined,
        undefined,
        undefined,
      );

      // Navigate based on update config preference
      if (updateConfig) {
        // Close rejoin modal and let user update config through normal flow
        setShowRejoinModal(false);
        setCurrentStep("flag"); // Go to flag selection

        // Pre-fill the session code
        if (activeTab === "host") {
          setSessionCode(code);
        } else {
          setPlayerSessionCode(code);
        }
      } else {
        // Navigate directly to lobby
        const seat = getSeatsFromRole(role as ParticipantRole);
        if (seat) {
          setSeatInStorage(seat);
        }
        navigate(getLobbyUrl(code, role as ParticipantRole, seat));
      }
    } catch (error) {
      Logger.error("Error rejoining:", error);
      throw new Error(
        error instanceof Error ? error.message : "Failed to rejoin session",
      );
    } finally {
      setRejoinLoading(false);
    }
  };

  // Handle details form submission - now checks for presets
  const handleDetailsFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (activeTab === "host") {
      if (!sessionCode.trim() || !hostPassword.trim()) {
        setAlert({ type: "error", message: "Please fill in all fields" });
        return;
      }

      // Check for existing preset based on actual host name from session
      try {
        const { data: hostParticipant } = await supabase
          .from("Participant")
          .select("name, Session!inner(session_code)")
          .eq("role", "Host")
          .eq("Session.session_code", sessionCode.toUpperCase())
          .single();

        if (hostParticipant) {
          const hasPreset = await handleCheckPreset(
            hostParticipant.name,
            sessionCode,
            "Host",
          );
          if (!hasPreset) {
            setCurrentStep("flag"); // Go to flag selection if no preset
          }
          // If preset exists, modal will handle the flow
        } else {
          // No host found, proceed to flag selection
          setCurrentStep("flag");
        }
      } catch (error) {
        Logger.error("Error checking host participant:", error);
        setCurrentStep("flag"); // Default to flag selection on error
      }
    } else {
      if (!playerSessionCode.trim() || !playerName.trim()) {
        setAlert({
          type: "error",
          message: "Please fill in session code and player name",
        });
        return;
      }

      // Check for existing preset based on player name
      const hasPreset = await handleCheckPreset(playerName, playerSessionCode);
      if (!hasPreset) {
        setCurrentStep("flag"); // Go to flag selection if no preset
      }
      // If preset exists, modal will handle the flow
    }
  };

  const handleHostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!sessionCode.trim()) {
      setAlert({ type: "error", message: "Please enter a session code" });
      return;
    }

    if (!user?.id) {
      setAlert({ type: "error", message: "Please sign in to join as host" });
      navigate("/login");
      return;
    }

    setHostLoading(true);

    try {
      const { participantId, role } = await joinAsHost(
        sessionCode,
        user.id,
        hostSelectedFlag,
        hostTeamLogoUrl,
      );

      // Persist participant data
      try {
        localStorage.setItem("participantId", participantId);
        localStorage.setItem("sessionCode", sessionCode);
        localStorage.setItem("isHost", "true");
        localStorage.setItem("userRole", role);
        if (hostSelectedFlag) {
          localStorage.setItem("selectedFlag", hostSelectedFlag);
        }
        if (hostTeamLogoUrl) {
          localStorage.setItem("teamLogoUrl", hostTeamLogoUrl);
        }
        if (hostTeamName) {
          localStorage.setItem("teamName", hostTeamName);
        }
      } catch (storageError) {
        Logger.warn("Could not save to localStorage:", storageError);
      }

      // Set seat in storage and navigate with seat in URL
      const seat = getSeatsFromRole(role as ParticipantRole);
      if (seat) {
        try {
          setSeatInStorage(seat);
        } catch (storageError) {
          Logger.warn("Could not save seat to localStorage:", storageError);
        }
        navigate(`/lobby/${sessionCode}/${seat}`);
      } else {
        navigate(`/lobby/${sessionCode}`);
      }
    } catch (error) {
      Logger.error("Error joining as host:", error);
      setAlert({
        type: "error",
        message: "Failed to join as host. Please check your credentials.",
      });
    } finally {
      setHostLoading(false);
    }
  };

  const handlePlayerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!playerSessionCode.trim() || !playerName.trim()) {
      setAlert({
        type: "error",
        message: "Please fill in session code and player name",
      });
      return;
    }

    setPlayerLoading(true);

    try {
      const { participantId, role } = await joinAsPlayerWithCode(
        playerSessionCode,
        playerName,
        selectedFlag,
        teamLogoUrl,
      );

      // Persist data to localStorage
      try {
        localStorage.setItem("participantId", participantId);
        localStorage.setItem("sessionCode", playerSessionCode);
        localStorage.setItem("playerName", playerName);
        localStorage.setItem("isHost", "false");
        localStorage.setItem("userRole", role);
        localStorage.setItem("tt_participant_name", playerName);
        if (selectedFlag) {
          localStorage.setItem("selectedFlag", selectedFlag);
        }
        if (teamLogoUrl) {
          localStorage.setItem("teamLogoUrl", teamLogoUrl);
        }
        if (teamName) {
          localStorage.setItem("teamName", teamName);
        }
      } catch (storageError) {
        Logger.warn("Could not save to localStorage:", storageError);
      }

      // Set seat in storage and navigate with seat in URL
      const seat = getSeatsFromRole(role as ParticipantRole);
      if (seat) {
        try {
          setSeatInStorage(seat);
        } catch (storageError) {
          Logger.warn("Could not save seat to localStorage:", storageError);
        }
        navigate(`/lobby/${playerSessionCode}/${seat}`);
      } else {
        navigate(`/lobby/${playerSessionCode}`);
      }
    } catch (error) {
      Logger.error("Error joining as player:", error);
      setAlert({
        type: "error",
        message: "Failed to join as player. Please check your session code.",
      });
    } finally {
      setPlayerLoading(false);
    }
  };

  // Create dock items for navigation
  const dockItems = [
    {
      icon: <span className="text-2xl">👑</span>,
      label: "Host",
      onClick: () => {
        setActiveTab("host");
        setCurrentStep("role");
      },
      className:
        activeTab === "host" ? "bg-purple-500/20 border-purple-400" : "",
    },
    {
      icon: <span className="text-2xl">🎮</span>,
      label: "Player",
      onClick: () => {
        setActiveTab("player");
        setCurrentStep("role");
      },
      className: activeTab === "player" ? "bg-blue-500/20 border-blue-400" : "",
    },
  ];

  // Step navigation
  const stepItems = [
    {
      icon: <span className="text-xl">📋</span>,
      label: "Details",
      onClick: () => setCurrentStep("details"),
      className:
        currentStep === "details" ? "bg-green-500/20 border-green-400" : "",
    },
    {
      icon: <span className="text-xl">🏴</span>,
      label: "Flag",
      onClick: () => setCurrentStep("flag"),
      className: currentStep === "flag" ? "bg-blue-500/20 border-blue-400" : "",
    },
    {
      icon: <span className="text-xl">🏆</span>,
      label: "Team",
      onClick: () => setCurrentStep("team"),
      className:
        currentStep === "team" ? "bg-yellow-500/20 border-yellow-400" : "",
    },
  ];

  const renderRoleSelection = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center space-y-8"
    >
      <div>
        <h1 className="text-6xl font-bold text-white mb-4">
          🏟️{" "}
          <span className="bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
            Join the Arena
          </span>
        </h1>
        <p className="text-xl text-blue-200">
          Choose your role and step into the football knowledge challenge!
        </p>
      </div>

      <div className="flex justify-center gap-8">
        <SpotlightCard
          className="w-72 h-64 transform transition-transform hover:scale-105"
          spotlightColor="rgba(59, 130, 246, 0.4)"
          onClick={() => {
            setActiveTab("host");
            setCurrentStep("details");
          }}
        >
          <div className="text-center">
            <div className="text-5xl mb-4">👑</div>
            <h3 className="text-xl font-bold text-white mb-2">Join as Host</h3>
            <p className="text-sm text-blue-200">
              Lead the game and control the quiz flow
            </p>
          </div>
        </SpotlightCard>

        <SpotlightCard
          className="w-72 h-64 transform transition-transform hover:scale-105"
          spotlightColor="rgba(234, 179, 8, 0.4)"
          onClick={() => {
            setActiveTab("player");
            setCurrentStep("details");
          }}
        >
          <div className="text-center">
            <div className="text-5xl mb-4">🎮</div>
            <h3 className="text-xl font-bold text-white mb-2">
              Join as Player
            </h3>
            <p className="text-sm text-yellow-200">
              Join a session and compete against others
            </p>
          </div>
        </SpotlightCard>
      </div>
    </motion.div>
  );

  const renderDetailsForm = () => (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      className="max-w-2xl mx-auto"
    >
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
        <h2 className="text-3xl font-bold text-white mb-6 text-center">
          {activeTab === "host" ? "👑 Host Details" : "🎮 Player Details"}
        </h2>

        <form onSubmit={handleDetailsFormSubmit} className="space-y-6">
          <div>
            <label className="block text-white font-medium mb-2">
              Session Code
            </label>
            <input
              type="text"
              value={activeTab === "host" ? sessionCode : playerSessionCode}
              onChange={(e) =>
                activeTab === "host"
                  ? setSessionCode(e.target.value.toUpperCase())
                  : setPlayerSessionCode(e.target.value.toUpperCase())
              }
              className="w-full px-4 py-3 rounded-lg bg-white/20 text-white placeholder-white/60 border border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Enter session code"
              required
            />
            {rejoinParticipants.length > 0 && (
              <button
                type="button"
                onClick={() => setShowRejoinModal(true)}
                className="mt-2 w-full px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-lg transition-all shadow-md"
              >
                🔄 Rejoin as Existing Participant
              </button>
            )}
          </div>

          {activeTab === "host" ? (
            <div>
              <label className="block text-white font-medium mb-2">
                Host Password
              </label>
              <input
                type="password"
                value={hostPassword}
                onChange={(e) => setHostPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-white/20 text-white placeholder-white/60 border border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Enter host password"
                required
              />
            </div>
          ) : (
            <>
              <div>
                <label className="block text-white font-medium mb-2">
                  Player Name
                </label>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-white/20 text-white placeholder-white/60 border border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="Enter your name"
                  required
                />
              </div>
              <div>
                <label className="block text-white font-medium mb-2">
                  Create Password (for rejoining later)
                </label>
                <input
                  type="password"
                  value={playerPassword}
                  onChange={(e) => setPlayerPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-white/20 text-white placeholder-white/60 border border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="Create a password"
                  required
                  minLength={4}
                />
                <p className="mt-1 text-xs text-blue-200">
                  You'll need this password to rejoin the session later
                </p>
              </div>
            </>
          )}

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setCurrentStep("role")}
              className="flex-1 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-lg transition-colors"
            >
              ← Back
            </button>

            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors"
            >
              Continue →
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );

  const renderFlagSelection = () => (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      className="max-w-2xl mx-auto"
    >
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
        <h2 className="text-3xl font-bold text-white mb-6 text-center">
          🏴 Choose Your Flag
        </h2>
        <p className="text-blue-200 text-center mb-6">
          Select your country flag to represent you in the game
        </p>

        <div className="space-y-6">
          <div>
            <label className="block text-white font-medium mb-2">
              Choose Your Country
            </label>
            <OptimizedFlagSelector
              selectedFlag={
                activeTab === "host" ? hostSelectedFlag : selectedFlag
              }
              onFlagSelect={
                activeTab === "host"
                  ? (flag: string) => setHostSelectedFlag(flag)
                  : (flag: string) => setSelectedFlag(flag)
              }
            />
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setCurrentStep("details")}
              className="flex-1 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-lg transition-colors"
            >
              ← Back
            </button>

            <button
              type="button"
              onClick={() => setCurrentStep("team")}
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors"
            >
              Choose Team →
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderTeamSelection = () => {
    const selectedTeamLogoUrl =
      activeTab === "host" ? hostTeamLogoUrl : teamLogoUrl;
    const selectedTeamName = activeTab === "host" ? hostTeamName : teamName;

    return (
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold text-white mb-2">
            🏆 Choose Your Team
          </h2>
          <p className="text-xl text-blue-200">
            Select a league and pick your favorite team
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* League Selection */}
          <div className="lg:col-span-1">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <h3 className="text-2xl font-bold text-white mb-4 text-center">
                ⚽ Leagues
              </h3>

              {loading ? (
                <div className="text-center text-white py-8">
                  Loading leagues...
                </div>
              ) : error ? (
                <div className="text-center text-red-400 py-8">{error}</div>
              ) : (
                <AnimatedList
                  items={leagues.map((league) => league.displayName)}
                  onItemSelect={(_item, index) => {
                    setSelectedLeague(leagues[index].name);
                  }}
                  className="w-full"
                  itemClassName="hover:bg-white/10 cursor-pointer"
                  initialSelectedIndex={
                    selectedLeague
                      ? leagues.findIndex((l) => l.name === selectedLeague)
                      : -1
                  }
                />
              )}
            </div>
          </div>

          {/* Team Selection */}
          <div className="lg:col-span-2">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <h3 className="text-2xl font-bold text-white mb-4 text-center">
                {selectedLeague
                  ? `🏟️ ${leagues.find((l) => l.name === selectedLeague)?.displayName || "Teams"}`
                  : "👈 Select a League First"}
              </h3>

              {selectedLeague ? (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 max-h-96 overflow-y-auto">
                  {leagues
                    .find((l) => l.name === selectedLeague)
                    ?.teams.map((team) => (
                      <motion.div
                        key={team.name}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`bg-white/5 backdrop-blur-sm rounded-lg p-4 cursor-pointer border-2 transition-all ${
                          selectedTeamLogoUrl === team.logoUrl
                            ? "border-yellow-400 bg-yellow-500/20"
                            : "border-white/20 hover:border-white/40"
                        }`}
                        onClick={() => {
                          if (activeTab === "host") {
                            handleHostLogoSelect(
                              team.logoUrl,
                              team.displayName,
                            );
                          } else {
                            handlePlayerLogoSelect(
                              team.logoUrl,
                              team.displayName,
                            );
                          }
                        }}
                      >
                        <div className="aspect-square mb-2">
                          <img
                            src={team.logoUrl}
                            alt={team.displayName}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        </div>
                        <p
                          className="text-white text-sm text-center truncate"
                          title={team.displayName}
                        >
                          {team.displayName}
                        </p>
                      </motion.div>
                    ))}
                </div>
              ) : (
                <div className="text-center text-blue-200 py-12">
                  <div className="text-6xl mb-4">⚽</div>
                  <p>Select a league to see available teams</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Selected Team Preview & Actions */}
        {selectedTeamLogoUrl && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-8 bg-gradient-to-r from-green-500/20 to-blue-500/20 backdrop-blur-sm rounded-2xl p-6 border border-green-400/50"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <img
                  src={selectedTeamLogoUrl}
                  alt={selectedTeamName}
                  className="w-16 h-16 object-contain rounded"
                />
                <div>
                  <h4 className="text-2xl font-bold text-white">
                    Ready to Join!
                  </h4>
                  <p className="text-green-200">
                    Playing as {selectedTeamName}
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setCurrentStep("flag")}
                  className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-lg transition-colors"
                >
                  ← Back
                </button>

                <button
                  onClick={
                    activeTab === "host" ? handleHostSubmit : handlePlayerSubmit
                  }
                  disabled={activeTab === "host" ? hostLoading : playerLoading}
                  className="px-8 py-3 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white font-bold rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {activeTab === "host"
                    ? hostLoading
                      ? "Joining..."
                      : "🚀 Start Game"
                    : playerLoading
                      ? "Joining..."
                      : "🎮 Join Game"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-10 left-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute top-20 right-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-75"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-150"></div>
      </div>

      {/* Navigation Dock */}
      <div className="relative z-10 flex justify-center pt-4">
        <Dock>
          {(currentStep === "role"
            ? dockItems
            : [...dockItems, ...stepItems]
          ).map((item, index) => (
            <Dock.Icon
              key={index}
              onClick={item.onClick}
              className={`${item.className} transition-all duration-200`}
            >
              {item.icon}
            </Dock.Icon>
          ))}
        </Dock>
      </div>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 py-12">
        <AnimatePresence mode="wait">
          {currentStep === "role" && (
            <motion.div
              key="role"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {renderRoleSelection()}
            </motion.div>
          )}

          {currentStep === "details" && (
            <motion.div
              key="details"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {renderDetailsForm()}
            </motion.div>
          )}

          {currentStep === "flag" && (
            <motion.div
              key="flag"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {renderFlagSelection()}
            </motion.div>
          )}

          {currentStep === "team" && (
            <motion.div
              key="team"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {renderTeamSelection()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Alert Component */}
      {alert && (
        <div className="fixed top-4 right-4 z-50">
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        </div>
      )}

      {/* Preset Confirmation Modal */}
      <PresetConfirmationModal
        isOpen={showPresetModal}
        onClose={() => setShowPresetModal(false)}
        onUseExisting={handleUseExistingPreset}
        onCreateNew={handleCreateNewPreset}
        preset={existingPreset}
        isLoading={presetModalLoading}
      />

      {/* Rejoin Modal */}
      <RejoinModal
        isOpen={showRejoinModal}
        participants={rejoinParticipants}
        onClose={() => setShowRejoinModal(false)}
        onRejoin={handleRejoin}
        isLoading={rejoinLoading}
      />
    </div>
  );
};

export default JoinRevolutionary;
