import { useState, useEffect, lazy, Suspense } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { joinAsHost, joinAsPlayerWithCode } from "../lib/mutations";
import { Alert } from "../components/Alert";

// Lazy load TeamLogoPicker for better bundle splitting
const TeamLogoPicker = lazy(() => import("../components/TeamLogoPicker").then(module => ({
  default: module.TeamLogoPicker
})));

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

  // Player form state
  const [playerSessionCode, setPlayerSessionCode] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [selectedFlag, setSelectedFlag] = useState("");
  const [flagSearch, setFlagSearch] = useState("");
  const [teamLogoUrl, setTeamLogoUrl] = useState("");
  const [playerLoading, setPlayerLoading] = useState(false);

  const allFlags = [
    // Arabic/Middle Eastern countries
    { code: "sa", name: "Saudi Arabia" },
    { code: "eg", name: "Egypt" },
    { code: "ae", name: "United Arab Emirates" },
    { code: "qa", name: "Qatar" },
    { code: "kw", name: "Kuwait" },
    { code: "bh", name: "Bahrain" },
    { code: "om", name: "Oman" },
    { code: "jo", name: "Jordan" },
    { code: "lb", name: "Lebanon" },
    { code: "iq", name: "Iraq" },
    { code: "sy", name: "Syria" },
    { code: "ye", name: "Yemen" },
    { code: "ps", name: "Palestine" },
    { code: "tn", name: "Tunisia" },
    { code: "ma", name: "Morocco" },
    { code: "dz", name: "Algeria" },
    { code: "ly", name: "Libya" },
    { code: "sd", name: "Sudan" },

    // European countries (popular for football)
    { code: "es", name: "Spain" },
    { code: "gb-eng", name: "England" },
    { code: "fr", name: "France" },
    { code: "de", name: "Germany" },
    { code: "it", name: "Italy" },
    { code: "pt", name: "Portugal" },
    { code: "nl", name: "Netherlands" },
    { code: "be", name: "Belgium" },
    { code: "tr", name: "Turkey" },
    { code: "pl", name: "Poland" },
    { code: "ua", name: "Ukraine" },
    { code: "rs", name: "Serbia" },
    { code: "hr", name: "Croatia" },
    { code: "cz", name: "Czech Republic" },
    { code: "gr", name: "Greece" },
    { code: "ro", name: "Romania" },
    { code: "hu", name: "Hungary" },
    { code: "sk", name: "Slovakia" },
    { code: "si", name: "Slovenia" },
    { code: "me", name: "Montenegro" },
    { code: "al", name: "Albania" },
    { code: "mk", name: "North Macedonia" },
    { code: "ba", name: "Bosnia and Herzegovina" },
    { code: "xk", name: "Kosovo" },

    // South American countries
    { code: "br", name: "Brazil" },
    { code: "ar", name: "Argentina" },
    { code: "uy", name: "Uruguay" },
    { code: "co", name: "Colombia" },
    { code: "cl", name: "Chile" },
    { code: "pe", name: "Peru" },
    { code: "ec", name: "Ecuador" },
    { code: "py", name: "Paraguay" },
    { code: "bo", name: "Bolivia" },
    { code: "ve", name: "Venezuela" },

    // North American countries
    { code: "us", name: "United States" },
    { code: "mx", name: "Mexico" },
    { code: "ca", name: "Canada" },
    { code: "cr", name: "Costa Rica" },
    { code: "pa", name: "Panama" },
    { code: "jm", name: "Jamaica" },
    { code: "ht", name: "Haiti" },

    // African countries (beyond Arabic)
    { code: "za", name: "South Africa" },
    { code: "ng", name: "Nigeria" },
    { code: "gh", name: "Ghana" },
    { code: "ci", name: "Ivory Coast" },
    { code: "cm", name: "Cameroon" },
    { code: "sn", name: "Senegal" },
    { code: "ml", name: "Mali" },
    { code: "bf", name: "Burkina Faso" },
    { code: "tg", name: "Togo" },
    { code: "bj", name: "Benin" },
    { code: "ne", name: "Niger" },
    { code: "td", name: "Chad" },
    { code: "cf", name: "Central African Republic" },
    { code: "gq", name: "Equatorial Guinea" },
    { code: "ga", name: "Gabon" },
    { code: "cg", name: "Republic of the Congo" },
    { code: "cd", name: "Democratic Republic of the Congo" },
    { code: "ao", name: "Angola" },
    { code: "mz", name: "Mozambique" },
    { code: "zw", name: "Zimbabwe" },
    { code: "zm", name: "Zambia" },
    { code: "bw", name: "Botswana" },
    { code: "na", name: "Namibia" },
    { code: "zw", name: "Zimbabwe" },
    { code: "tz", name: "Tanzania" },
    { code: "ke", name: "Kenya" },
    { code: "ug", name: "Uganda" },
    { code: "rw", name: "Rwanda" },
    { code: "bi", name: "Burundi" },
    { code: "et", name: "Ethiopia" },
    { code: "so", name: "Somalia" },
    { code: "dj", name: "Djibouti" },
    { code: "er", name: "Eritrea" },

    // Asian countries (beyond Arabic)
    { code: "jp", name: "Japan" },
    { code: "kr", name: "South Korea" },
    { code: "cn", name: "China" },
    { code: "in", name: "India" },
    { code: "th", name: "Thailand" },
    { code: "vn", name: "Vietnam" },
    { code: "my", name: "Malaysia" },
    { code: "sg", name: "Singapore" },
    { code: "id", name: "Indonesia" },
    { code: "ph", name: "Philippines" },
    { code: "au", name: "Australia" },
    { code: "nz", name: "New Zealand" },
    { code: "ir", name: "Iran" },
    { code: "pk", name: "Pakistan" },
    { code: "bd", name: "Bangladesh" },
    { code: "lk", name: "Sri Lanka" },
    { code: "np", name: "Nepal" },
    { code: "bt", name: "Bhutan" },
    { code: "mv", name: "Maldives" },

    // Other notable countries
    { code: "ru", name: "Russia" },
    { code: "by", name: "Belarus" },
    { code: "am", name: "Armenia" },
    { code: "az", name: "Azerbaijan" },
    { code: "ge", name: "Georgia" },
    { code: "kz", name: "Kazakhstan" },
    { code: "uz", name: "Uzbekistan" },
    { code: "tm", name: "Turkmenistan" },
    { code: "tj", name: "Tajikistan" },
    { code: "kg", name: "Kyrgyzstan" },
  ];

  // Filter flags based on search
  const filteredFlags = allFlags.filter(
    (flag) =>
      flag.name.toLowerCase().includes(flagSearch.toLowerCase()) ||
      flag.code.toLowerCase().includes(flagSearch.toLowerCase()),
  );

  // Load team logo from Supabase
  useEffect(() => {
    const loadTeamLogo = async () => {
      try {
        // List files in logos/La Liga folder
        const { data: files, error: listError } = await supabase.storage
          .from("logos")
          .list("La Liga", {
            limit: 1,
            sortBy: { column: "name", order: "asc" },
          });

        if (listError) {
          console.error("Error listing logos:", listError);
          return;
        }

        if (files && files.length > 0) {
          const logoFile = files[0];
          // Get public URL for the logo
          const { data: urlData } = supabase.storage
            .from("logos")
            .getPublicUrl(`La Liga/${logoFile.name}`);

          if (urlData?.publicUrl) {
            setTeamLogoUrl(urlData.publicUrl);
          }
        }
      } catch (error) {
        console.error("Error loading team logo:", error);
      }
    };

    if (activeTab === "player") {
      loadTeamLogo();
    }
  }, [activeTab]);

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
      const participantId = await joinAsHost(sessionCode, hostPassword, "Host");

      // Persist participant id for presence updates
      try {
        localStorage.setItem("tt_participant_id", participantId);
      } catch {
        /* ignore */
      }

      console.log("Joined as host:", { sessionCode, participantId });
      navigate(`/lobby/${sessionCode}`);
    } catch (error) {
      console.error("Error joining as host:", error);
      setAlert({
        type: "error",
        message:
          "Failed to join session. Please check your session code and password.",
      });
    } finally {
      setHostLoading(false);
    }
  };

  const handlePlayerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!playerSessionCode.trim() || !playerName.trim() || !selectedFlag || !teamLogoUrl) {
      setAlert({ type: "error", message: "Please fill in all fields and select a team logo" });
      return;
    }

    setPlayerLoading(true);

    try {
      // Join as player using session code
      const participantId = await joinAsPlayerWithCode(
        playerSessionCode,
        playerName,
        selectedFlag,
        teamLogoUrl,
      );

      // Persist participant id for presence updates
      try {
        localStorage.setItem("tt_participant_id", participantId);
      } catch {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-600 via-green-700 to-green-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
          🎮 Join Game
        </h1>

        {/* Tab Navigation */}
        <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab("host")}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === "host"
                ? "bg-white text-gray-800 shadow-sm"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            👑 Join as Host
          </button>
          <button
            onClick={() => setActiveTab("player")}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
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
          <form onSubmit={handleHostSubmit} className="space-y-6">
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
                onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
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
          <form onSubmit={handlePlayerSubmit} className="space-y-6">
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

            <div>
              <label
                htmlFor="flag"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Select Your Flag
              </label>

              {/* Flag Search Input */}
              <input
                type="text"
                placeholder="Search countries..."
                value={flagSearch}
                onChange={(e) => setFlagSearch(e.target.value)}
                className="w-full px-4 py-2 mb-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
              />

              {flagSearch && (
                <div className="text-xs text-gray-500 mb-2">
                  {filteredFlags.length} countries found
                </div>
              )}

              <select
                id="flag"
                value={selectedFlag}
                onChange={(e) => setSelectedFlag(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                required
              >
                <option value="">Choose a flag...</option>
                {filteredFlags.map((flag) => (
                  <option key={flag.code} value={flag.code}>
                    <span className={`fi fi-${flag.code} mr-2`}></span>
                    {flag.name}
                  </option>
                ))}
              </select>

              {/* Selected Flag Display */}
              {selectedFlag && (
                <div className="mt-3 flex items-center justify-center">
                  <div className="flex items-center space-x-2 bg-gray-50 px-4 py-2 rounded-lg">
                    <span className={`fi fi-${selectedFlag} text-2xl`}></span>
                    <span className="text-sm font-medium text-gray-700">
                      {
                        filteredFlags.find((flag) => flag.code === selectedFlag)
                          ?.name
                      }
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Team Logo Picker */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Choose Your Team Logo
              </label>
              <Suspense 
                fallback={
                  <div className="p-4 text-center">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                    <p className="mt-2 text-sm text-gray-600">Loading team logos...</p>
                  </div>
                }
              >
                <TeamLogoPicker 
                  selectedUrl={teamLogoUrl}
                  onSelect={setTeamLogoUrl}
                />
              </Suspense>
            </div>

            {/* Team Logo Display */}
            {teamLogoUrl && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Team Logo
                </label>
                <div className="flex justify-center">
                  <img
                    src={teamLogoUrl}
                    alt="Team Logo"
                    className="w-24 h-24 object-contain border-2 border-gray-200 rounded-lg"
                    onError={(e) => {
                      console.error("Failed to load team logo");
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </div>
              </div>
            )}

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
