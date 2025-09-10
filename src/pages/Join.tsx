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
      {/* Champions League Stadium Tunnel Background */}
      <div className="absolute inset-0 bg-[#0A1B51] tunnel-perspective-mobile lg:tunnel-desktop-enhance">
        {/* Base Champions League gradient */}
        <div className="absolute inset-0 bg-champions-tunnel"></div>

        {/* Angled geometric light bands - Left side */}
        <div className="absolute inset-0 light-bands-mobile lg:light-bands-desktop before:content-[''] before:absolute before:top-0 before:left-0 before:w-full before:h-full before:bg-gradient-to-br before:from-transparent before:via-cyan-400/20 before:to-transparent before:transform before:skew-x-12 before:animate-light-sweep before:blur-sm"></div>

        {/* Angled geometric light bands - Right side */}
        <div
          className="absolute inset-0 light-bands-mobile lg:light-bands-desktop after:content-[''] after:absolute after:top-0 after:right-0 after:w-full after:h-full after:bg-gradient-to-bl after:from-transparent after:via-pink-400/20 after:to-transparent after:transform after:-skew-x-12 after:animate-light-sweep after:blur-sm"
          style={{ animationDelay: "3s" }}
        ></div>

        {/* Perspective tunnel walls with Champions League colors */}
        <div className="absolute inset-0 opacity-30 tunnel-mobile-compress lg:opacity-40">
          <div className="absolute top-0 left-0 w-1/4 h-full bg-gradient-to-r from-cyan-500/10 to-transparent transform skew-y-2 origin-top"></div>
          <div className="absolute top-0 right-0 w-1/4 h-full bg-gradient-to-l from-pink-500/10 to-transparent transform -skew-y-2 origin-top"></div>
          <div className="absolute bottom-0 left-1/4 right-1/4 h-1/3 bg-gradient-to-t from-cyan-300/5 to-transparent"></div>
        </div>

        {/* Champions League star pattern overlay */}
        <div className="absolute inset-0 bg-champions-stars animate-champions-pulse opacity-60 lg:opacity-80"></div>

        {/* Stadium spotlight at the end of tunnel */}
        <div className="absolute inset-0 bg-stadium-spotlight animate-tunnel-glow"></div>

        {/* Enhanced perspective lines with Champions League accent colors */}
        <svg
          className="absolute inset-0 w-full h-full opacity-15 lg:opacity-20"
          preserveAspectRatio="none"
          viewBox="0 0 100 100"
        >
          <defs>
            <linearGradient id="cyanGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="transparent" />
              <stop offset="30%" stopColor="rgba(51, 239, 255, 0.6)" />
              <stop offset="70%" stopColor="rgba(51, 239, 255, 0.3)" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
            <linearGradient id="magentaGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="transparent" />
              <stop offset="30%" stopColor="rgba(246, 89, 253, 0.6)" />
              <stop offset="70%" stopColor="rgba(246, 89, 253, 0.3)" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
          </defs>

          {/* Converging tunnel ceiling */}
          <polygon points="0,0 100,0 85,30 15,30" fill="url(#cyanGrad)" />
          <polygon points="0,5 100,5 85,35 15,35" fill="url(#magentaGrad)" />

          {/* Converging tunnel floor */}
          <polygon points="15,70 85,70 100,100 0,100" fill="url(#cyanGrad)" />
          <polygon
            points="15,75 85,75 100,100 0,100"
            fill="url(#magentaGrad)"
          />

          {/* Side walls with perspective */}
          <polygon
            points="0,0 15,30 15,70 0,100"
            fill="rgba(51, 239, 255, 0.1)"
          />
          <polygon
            points="100,0 85,30 85,70 100,100"
            fill="rgba(246, 89, 253, 0.1)"
          />

          {/* Central converging lines */}
          <line
            x1="50"
            y1="0"
            x2="50"
            y2="100"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="0.5"
          />
          <line
            x1="0"
            y1="50"
            x2="100"
            y2="50"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="0.3"
          />
        </svg>

        {/* Atmospheric light particles */}
        <div className="absolute inset-0">
          {[...Array(25)].map((_, i) => (
            <div
              key={i}
              className={`absolute rounded-full animate-pulse-slow ${
                i % 3 === 0
                  ? "bg-cyan-300"
                  : i % 3 === 1
                    ? "bg-pink-300"
                    : "bg-white"
              }`}
              style={{
                width: Math.random() * 3 + 1 + "px",
                height: Math.random() * 3 + 1 + "px",
                left: Math.random() * 100 + "%",
                top: Math.random() * 100 + "%",
                opacity: Math.random() * 0.6 + 0.1,
                animationDelay: Math.random() * 4 + "s",
                animationDuration: Math.random() * 3 + 2 + "s",
              }}
            ></div>
          ))}
        </div>

        {/* Semi-transparent dark overlay for text legibility */}
        <div className="absolute inset-0 bg-black/30"></div>
      </div>

      {/* Content with proper z-index */}
      <div className="relative z-10 p-4">
        {/* Mobile-first responsive container */}
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-6 items-start justify-center min-h-screen py-8">
            {/* Main Form Card */}
            <div className="w-full lg:w-1/3 lg:max-w-md">
              <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-xl p-6 lg:p-8 border border-white/20">
                <h1 className="text-2xl lg:text-3xl font-bold text-center text-gray-800 mb-6 lg:mb-8">
                  🎮 Join Game
                </h1>

                {/* Tab Navigation */}
                <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
                  <button
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

            {/* Flag Selector - Right side on desktop, below form on mobile */}
            <div className="w-full lg:w-1/3 lg:max-w-md">
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
                />
              </div>
            </div>

            {/* Logo Selector - Right side on desktop, below flag on mobile */}
            <div className="w-full lg:w-1/3 lg:max-w-md">
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
                />
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
