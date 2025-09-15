import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { joinAsHost, joinAsPlayerWithCode } from "../lib/mutations";
import { Alert } from "../components/Alert";
import OptimizedFlagSelector from "../components/OptimizedFlagSelector";
import { supabase } from "../lib/supabaseClient";

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
  const [activeTab, setActiveTab] = useState<"host" | "player">("host");
  const [currentStep, setCurrentStep] = useState<"role" | "details" | "team">(
    "role",
  );

  // Alert state
  const [alert, setAlert] = useState<{
    type: "error" | "success" | "info";
    message: string;
  } | null>(null);

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

  // Load team logos from Supabase
  useEffect(() => {
    const loadLogos = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("list-logos");

        if (error) {
          console.error("Error fetching logos:", error);
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
        console.error("Error loading logos:", error);
        setError("Failed to load team logos");
      } finally {
        setLoading(false);
      }
    };

    loadLogos();
  }, []);

  // Event handlers
  const handleHostLogoSelect = (logoUrl: string, teamName: string) => {
    setHostTeamLogoUrl(logoUrl);
    setHostTeamName(teamName);
  };

  const handlePlayerLogoSelect = (logoUrl: string, teamName: string) => {
    setTeamLogoUrl(logoUrl);
    setTeamName(teamName);
  };

  const handleHostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!sessionCode.trim() || !hostPassword.trim()) {
      setAlert({ type: "error", message: "Please fill in all fields" });
      return;
    }

    setHostLoading(true);

    try {
      const participantId = await joinAsHost(
        sessionCode,
        hostPassword,
        hostSelectedFlag,
        hostTeamLogoUrl,
      );

      // Persist participant data
      try {
        localStorage.setItem("participantId", participantId);
        localStorage.setItem("sessionCode", sessionCode);
        localStorage.setItem("isHost", "true");
        localStorage.setItem("userRole", "Host");
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
        console.warn("Could not save to localStorage:", storageError);
      }

      navigate(`/lobby/${sessionCode}`);
    } catch (error) {
      console.error("Error joining as host:", error);
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
      const participantId = await joinAsPlayerWithCode(
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
        localStorage.setItem("userRole", "Player");
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
        console.warn("Could not save to localStorage:", storageError);
      }

      navigate(`/lobby/${playerSessionCode}`);
    } catch (error) {
      console.error("Error joining as player:", error);
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

        <form
          onSubmit={
            activeTab === "host" ? handleHostSubmit : handlePlayerSubmit
          }
          className="space-y-6"
        >
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
          )}

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
              onClick={() => setCurrentStep("role")}
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
        </form>
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
                  onClick={() => setCurrentStep("details")}
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
    </div>
  );
};

export default JoinRevolutionary;
