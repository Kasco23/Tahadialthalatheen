import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { joinAsHost, joinAsPlayerWithCode } from "../lib/mutations";
import { Alert } from "../components/Alert";
import FlagSelector from "../components/FlagSelector";
import LogoSelector from "../components/LogoSelector";

const Join: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<"host" | "player">("host");

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

  // Auto-fill session code from query parameters
  useEffect(() => {
    const sessionCodeParam = searchParams.get("sessionCode");
    if (sessionCodeParam) {
      setSessionCode(sessionCodeParam);
      setPlayerSessionCode(sessionCodeParam);
      // Auto-switch to player tab if coming from quick join
      setActiveTab("player");
    }
  }, [searchParams]);

  const handleHostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!sessionCode.trim() || !hostPassword.trim()) {
      setAlert({ type: "error", message: "Please fill in all fields" });
      return;
    }

    setHostLoading(true);

    try {
      // Join as host using session code
      const participantId = await joinAsHost(sessionCode, hostPassword);

      // Persist participant id for presence updates
      try {
        localStorage.setItem("participantId", participantId);
        localStorage.setItem("sessionCode", sessionCode);
        localStorage.setItem("isHost", "true");
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
        /* ignore */
      }

      console.log("Joined as player:", {
        sessionCode: playerSessionCode,
        participantId,
        playerName,
        selectedFlag,
        teamLogoUrl,
      });
      navigate(`/lobby/${playerSessionCode}`);
    } catch (error) {
      console.error("Error joining as player:", error);
      setAlert({
        type: "error",
        message: "Failed to join session. Please check your session code.",
      });
    } finally {
      setPlayerLoading(false);
    }
  };

  const handleHostFlagSelect = (flagCode: string) => {
    setHostSelectedFlag(flagCode);
  };

  const handleHostLogoSelect = (logoUrl: string, teamDisplayName: string) => {
    setHostTeamLogoUrl(logoUrl);
    setHostTeamName(teamDisplayName);
  };

  const handlePlayerFlagSelect = (flagCode: string) => {
    setSelectedFlag(flagCode);
  };

  const handlePlayerLogoSelect = (logoUrl: string, teamDisplayName: string) => {
    setTeamLogoUrl(logoUrl);
    setTeamName(teamDisplayName);
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Champions League "Kick of Light" Stadium Tunnel Background */}
      <div className="absolute inset-0 bg-gray-900">
        {/* Base Champions League tunnel with enhanced visibility */}
        <div className="absolute inset-0 bg-kick-of-light"></div>
        
        {/* Prism rainbow effects along tunnel edges */}
        <div className="absolute inset-0 bg-prism-rainbow opacity-40 animate-champions-pulse"></div>

        {/* Glass starball effects */}
        <div className="absolute inset-0 bg-glass-starball animate-light-sweep"></div>

        {/* Enhanced tunnel walls with Champions League navy */}
        <div className="absolute inset-0 bg-tunnel-walls opacity-80"></div>

        {/* Brighter tunnel lighting effects */}
        <div className="absolute inset-0 bg-tunnel-lighting opacity-90"></div>

        {/* Perspective tunnel structure with realistic geometry */}
        <svg
          className="absolute inset-0 w-full h-full opacity-20"
          preserveAspectRatio="none"
          viewBox="0 0 100 100"
        >
          <defs>
            <linearGradient id="wallGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(21, 35, 91, 0.9)" />
              <stop offset="25%" stopColor="rgba(255, 0, 127, 0.3)" />
              <stop offset="50%" stopColor="rgba(12, 20, 55, 0.6)" />
              <stop offset="75%" stopColor="rgba(0, 255, 255, 0.3)" />
              <stop offset="100%" stopColor="rgba(21, 35, 91, 0.9)" />
            </linearGradient>
            <linearGradient
              id="ceilingGradient"
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <stop offset="0%" stopColor="rgba(21, 35, 91, 0.95)" />
              <stop offset="50%" stopColor="rgba(255, 255, 0, 0.2)" />
              <stop offset="100%" stopColor="rgba(5, 10, 25, 0.8)" />
            </linearGradient>
            <linearGradient
              id="floorGradient"
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <stop offset="0%" stopColor="rgba(5, 10, 25, 0.8)" />
              <stop offset="50%" stopColor="rgba(127, 0, 255, 0.2)" />
              <stop offset="100%" stopColor="rgba(21, 35, 91, 0.95)" />
            </linearGradient>
            <linearGradient id="prismEdge" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(255, 0, 127, 0.6)" />
              <stop offset="20%" stopColor="rgba(0, 255, 255, 0.6)" />
              <stop offset="40%" stopColor="rgba(127, 255, 0, 0.6)" />
              <stop offset="60%" stopColor="rgba(255, 127, 0, 0.6)" />
              <stop offset="80%" stopColor="rgba(127, 0, 255, 0.6)" />
              <stop offset="100%" stopColor="rgba(255, 255, 0, 0.6)" />
            </linearGradient>
          </defs>

          {/* Tunnel ceiling with perspective */}
          <polygon
            points="0,0 100,0 80,25 20,25"
            fill="url(#ceilingGradient)"
          />

          {/* Tunnel floor with perspective */}
          <polygon
            points="20,75 80,75 100,100 0,100"
            fill="url(#floorGradient)"
          />

          {/* Left wall */}
          <polygon points="0,0 20,25 20,75 0,100" fill="url(#wallGradient)" />

          {/* Right wall */}
          <polygon
            points="100,0 80,25 80,75 100,100"
            fill="url(#wallGradient)"
          />

          {/* Central perspective lines with prism effects */}
          <line
            x1="50"
            y1="0"
            x2="50"
            y2="100"
            stroke="url(#prismEdge)"
            strokeWidth="1"
          />
          
          {/* Prism light rays */}
          <line x1="20" y1="25" x2="80" y2="25" stroke="rgba(255, 0, 127, 0.4)" strokeWidth="0.5" />
          <line x1="20" y1="50" x2="80" y2="50" stroke="rgba(0, 255, 255, 0.4)" strokeWidth="0.5" />
          <line x1="20" y1="75" x2="80" y2="75" stroke="rgba(127, 255, 0, 0.4)" strokeWidth="0.5" />
        </svg>

        {/* Champions League prism light fixtures */}
        <div className="absolute inset-0">
          {[...Array(8)].map((_, i) => {
            const colors = [
              "rgba(255, 0, 127, 0.8)", // Magenta
              "rgba(0, 255, 255, 0.8)", // Cyan
              "rgba(127, 255, 0, 0.8)", // Lime
              "rgba(255, 127, 0, 0.8)", // Orange
              "rgba(127, 0, 255, 0.8)", // Purple
              "rgba(255, 255, 0, 0.8)", // Yellow
            ];
            return (
              <div
                key={i}
                className="absolute w-3 h-6 rounded-sm animate-champions-pulse"
                style={{
                  left: i % 2 === 0 ? "12%" : "88%",
                  top: `${15 + i * 10}%`,
                  background: colors[i % colors.length],
                  animationDelay: `${i * 0.3}s`,
                  boxShadow: `0 0 15px ${colors[i % colors.length]}, 0 0 30px ${colors[i % colors.length].replace('0.8', '0.4')}`,
                }}
              ></div>
            );
          })}
        </div>

        {/* Stadium light at the end of tunnel */}
        <div className="absolute inset-0 bg-stadium-spotlight animate-tunnel-glow"></div>

        {/* Lighter overlay for improved visibility */}
        <div className="absolute inset-0 bg-black/25"></div>
      </div>

      {/* Content with proper z-index */}
      <div className="relative z-10 p-4">
        {/* Mobile-first responsive container */}
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-6 items-start justify-center min-h-screen py-8">
            {/* Main Form Card */}
            <div className="w-full lg:w-1/3 lg:max-w-md order-1">
              <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-xl p-6 lg:p-8 border border-white/20">
                <h1 className="text-2xl lg:text-3xl font-bold text-center text-gray-800 mb-6 lg:mb-8">
                  🎮 Join Game
                </h1>

                {/* Tab Navigation */}
                <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
                  <button
                    data-testid="host-tab"
                    onClick={() => setActiveTab("host")}
                    className={`flex-1 py-2 px-3 lg:px-4 rounded-md text-sm font-medium transition-colors ${
                      activeTab === "host"
                        ? "bg-white text-gray-800 shadow-sm"
                        : "text-gray-600 hover:text-gray-800"
                    }`}
                  >
                    👑 Join as Host
                  </button>
                  <button
                    data-testid="player-tab"
                    onClick={() => setActiveTab("player")}
                    className={`flex-1 py-2 px-3 lg:px-4 rounded-md text-sm font-medium transition-colors ${
                      activeTab === "player"
                        ? "bg-white text-gray-800 shadow-sm"
                        : "text-gray-600 hover:text-gray-800"
                    }`}
                  >
                    ⚽ Join as Player
                  </button>
                </div>

                {/* Host Form */}
                {activeTab === "host" && (
                  <form
                    onSubmit={handleHostSubmit}
                    className="space-y-4 lg:space-y-6"
                  >
                    <div>
                      <label
                        htmlFor="sessionCode"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Session Code
                      </label>
                      <input
                        type="text"
                        id="sessionCode"
                        value={sessionCode}
                        onChange={(e) =>
                          setSessionCode(e.target.value.toUpperCase())
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        placeholder="Enter session code (e.g., ABC123)"
                        required
                        maxLength={6}
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="hostPassword"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Host Password
                      </label>
                      <input
                        type="password"
                        id="hostPassword"
                        value={hostPassword}
                        onChange={(e) => setHostPassword(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        placeholder="Enter host password"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={hostLoading}
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-blue-400 disabled:to-blue-400 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:transform-none shadow-lg"
                    >
                      {hostLoading ? "Joining..." : "👑 Join as Host"}
                    </button>
                  </form>
                )}

                {/* Player Form */}
                {activeTab === "player" && (
                  <form
                    onSubmit={handlePlayerSubmit}
                    className="space-y-4 lg:space-y-6"
                  >
                    <div>
                      <label
                        htmlFor="playerSessionCode"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Session Code
                      </label>
                      <input
                        type="text"
                        id="playerSessionCode"
                        value={playerSessionCode}
                        onChange={(e) =>
                          setPlayerSessionCode(e.target.value.toUpperCase())
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        placeholder="Enter session code (e.g., ABC123)"
                        required
                        maxLength={6}
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="playerName"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Player Name
                      </label>
                      <input
                        type="text"
                        id="playerName"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        placeholder="Enter your name"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={playerLoading}
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-blue-400 disabled:to-blue-400 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:transform-none shadow-lg"
                    >
                      {playerLoading ? "Joining..." : "⚽ Join as Player"}
                    </button>
                  </form>
                )}
              </div>
            </div>

            {/* Flag and Logo Selectors Container */}
            <div className="w-full lg:w-2/3 order-2">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Flag Selector */}
                <div className="w-full md:w-1/2 relative">
                  <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-xl p-6 border border-white/30">
                    <FlagSelector
                      selectedFlag={
                        activeTab === "host" ? hostSelectedFlag : selectedFlag
                      }
                      onFlagSelect={
                        activeTab === "host"
                          ? handleHostFlagSelect
                          : handlePlayerFlagSelect
                      }
                      title="Select Your Flag"
                      data-testid="flag-selector"
                    />
                  </div>
                </div>

                {/* Logo Selector */}
                <div className="w-full md:w-1/2 relative">
                  <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-xl p-6 border border-white/30">
                    <LogoSelector
                      selectedLogoUrl={
                        activeTab === "host" ? hostTeamLogoUrl : teamLogoUrl
                      }
                      onLogoSelect={
                        activeTab === "host"
                          ? handleHostLogoSelect
                          : handlePlayerLogoSelect
                      }
                      title="Choose Your Team Logo"
                      useChromaGrid={true}
                      data-testid="logo-selector"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
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

export default Join;
