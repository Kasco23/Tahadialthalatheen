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
      {/* Stadium Tunnel Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        {/* Tunnel lines effect */}
        <div className="absolute inset-0 bg-tunnel-lines opacity-20"></div>

        {/* Central spotlight */}
        <div className="absolute inset-0 bg-spotlight animate-tunnel-glow"></div>

        {/* Atmospheric particles/dust effect */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute bg-white rounded-full opacity-10 animate-pulse-slow"
              style={{
                width: Math.random() * 4 + 1 + "px",
                height: Math.random() * 4 + 1 + "px",
                left: Math.random() * 100 + "%",
                top: Math.random() * 100 + "%",
                animationDelay: Math.random() * 3 + "s",
                animationDuration: Math.random() * 2 + 2 + "s",
              }}
            ></div>
          ))}
        </div>

        {/* Converging perspective lines */}
        <svg
          className="absolute inset-0 w-full h-full opacity-10"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="transparent" />
              <stop offset="50%" stopColor="rgba(255,255,255,0.3)" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
          </defs>

          {/* Top converging lines */}
          <polygon
            points="0,0 50,200 100,200 100,0"
            fill="url(#lineGrad)"
            transform="scale(100 1)"
          />
          <polygon
            points="0,100 100,100 80,300 20,300"
            fill="url(#lineGrad)"
            transform="scale(100 1)"
          />

          {/* Side tunnel walls */}
          <polygon
            points="0,0 0,100 30,80 30,20"
            fill="rgba(255,255,255,0.05)"
            transform="scale(100 1)"
          />
          <polygon
            points="100,0 100,100 70,80 70,20"
            fill="rgba(255,255,255,0.05)"
            transform="scale(100 1)"
          />
        </svg>
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                        placeholder="Enter host password"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={hostLoading}
                      className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 transform hover:scale-105 disabled:transform-none"
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                        placeholder="Enter your name"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={playerLoading}
                      className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 transform hover:scale-105 disabled:transform-none"
                    >
                      {playerLoading ? "Joining..." : "⚽ Join as Player"}
                    </button>
                  </form>
                )}
              </div>
            </div>

            {/* Flag Selector - Right side on desktop, below form on mobile */}
            <div className="w-full lg:w-1/3 lg:max-w-md">
              <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-xl p-6 border border-white/20">
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
              <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-xl p-6 border border-white/20">
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
