import { Logger } from "../lib/logger";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ActiveGames from "../components/ActiveGames";
import { createSession } from "../lib/mutations";
import { Alert } from "../components/Alert";
import { useAuth } from "../contexts/AuthContext";

const Homepage: React.FC = () => {
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [alert, setAlert] = useState<{
    type: "error" | "success" | "info";
    message: string;
  } | null>(null);
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();

  const handleCreateSession = async () => {
    // Check if user is authenticated
    if (!user) {
      setAlert({
        type: "info",
        message: "Please sign in to create a session",
      });
      setTimeout(() => navigate("/login"), 1500);
      return;
    }

    setIsCreatingSession(true);
    try {
      if (!user?.id) {
        throw new Error("User not authenticated");
      }
      // Use profile name as host name, or default to "Host"
      const hostName = profile?.name || "Host";
      const { sessionCode } = await createSession(user.id, hostName);
      // Navigate to game setup
      navigate(`/gamesetup/${sessionCode}`);
    } catch (error) {
      Logger.error("Error creating session:", error);
      setAlert({
        type: "error",
        message: `Error creating session: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    } finally {
      setIsCreatingSession(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setAlert({
        type: "success",
        message: "Signed out successfully",
      });
    } catch (error) {
      Logger.error("Error signing out:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-600 via-green-700 to-green-800 flex flex-col p-4 relative overflow-hidden">
      {/* Football pitch grass pattern with horizontal stripes */}
      <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,rgba(0,0,0,0.1)_0px,rgba(0,0,0,0.1)_30px,transparent_30px,transparent_60px)] opacity-60"></div>

      {/* Football pitch markings */}
      <div className="absolute inset-0">
        {/* Center line */}
        <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-white transform -translate-x-1/2 opacity-80"></div>

        {/* Center circle */}
        <div className="absolute top-1/2 left-1/2 w-32 h-32 border-2 border-white rounded-full transform -translate-x-1/2 -translate-y-1/2 opacity-80"></div>

        {/* Center spot */}
        <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-white rounded-full transform -translate-x-1/2 -translate-y-1/2 opacity-80"></div>

        {/* Left penalty area (18-yard box) */}
        <div className="absolute left-0 top-1/2 w-20 h-48 border-2 border-white border-l-0 transform -translate-y-1/2 opacity-80"></div>

        {/* Left goal area (6-yard box) */}
        <div className="absolute left-0 top-1/2 w-8 h-20 border-2 border-white border-l-0 transform -translate-y-1/2 opacity-80"></div>

        {/* Left penalty spot */}
        <div className="absolute left-14 top-1/2 w-2 h-2 bg-white rounded-full transform -translate-y-1/2 opacity-80"></div>

        {/* Left goal posts */}
        <div className="absolute left-0 top-1/2 w-1 h-16 bg-white transform -translate-y-1/2 opacity-90"></div>
        <div className="absolute left-0 top-1/2 w-4 h-1 bg-white transform -translate-y-8 opacity-90"></div>
        <div className="absolute left-0 top-1/2 w-4 h-1 bg-white transform translate-y-7 opacity-90"></div>

        {/* Right penalty area (18-yard box) */}
        <div className="absolute right-0 top-1/2 w-20 h-48 border-2 border-white border-r-0 transform -translate-y-1/2 opacity-80"></div>

        {/* Right goal area (6-yard box) */}
        <div className="absolute right-0 top-1/2 w-8 h-20 border-2 border-white border-r-0 transform -translate-y-1/2 opacity-80"></div>

        {/* Right penalty spot */}
        <div className="absolute right-14 top-1/2 w-2 h-2 bg-white rounded-full transform -translate-y-1/2 opacity-80"></div>

        {/* Right goal posts */}
        <div className="absolute right-0 top-1/2 w-1 h-16 bg-white transform -translate-y-1/2 opacity-90"></div>
        <div className="absolute right-0 top-1/2 w-4 h-1 bg-white transform -translate-y-8 opacity-90"></div>
        <div className="absolute right-0 top-1/2 w-4 h-1 bg-white transform translate-y-7 opacity-90"></div>

        {/* Corner arcs */}
        <div className="absolute top-0 left-0 w-8 h-8 border-2 border-white border-t-0 border-l-0 rounded-br-full opacity-80"></div>
        <div className="absolute top-0 right-0 w-8 h-8 border-2 border-white border-t-0 border-r-0 rounded-bl-full opacity-80"></div>
        <div className="absolute bottom-0 left-0 w-8 h-8 border-2 border-white border-b-0 border-l-0 rounded-tr-full opacity-80"></div>
        <div className="absolute bottom-0 right-0 w-8 h-8 border-2 border-white border-b-0 border-r-0 rounded-tl-full opacity-80"></div>

        {/* Pitch boundary */}
        <div className="absolute inset-4 border-2 border-white opacity-60 rounded-sm"></div>
      </div>

      {/* User menu in top right */}
      {user && (
        <div className="absolute top-4 right-4 z-20">
          <div className="bg-white rounded-xl shadow-lg p-3 flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Avatar"
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-sm">👤</span>
                )}
              </div>
              <span className="font-semibold text-gray-800 text-sm">
                {profile?.name || user.email}
              </span>
            </div>
            <Link
              to="/profile"
              className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Profile
            </Link>
            <button
              onClick={handleSignOut}
              className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-medium transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Sign in/Sign up buttons when not authenticated */}
      {!user && (
        <div className="absolute top-4 right-4 z-20 flex gap-2">
          <Link
            to="/login"
            className="px-4 py-2 bg-white hover:bg-gray-100 text-gray-800 font-semibold rounded-lg shadow-lg transition-colors"
          >
            Sign In
          </Link>
          <Link
            to="/signup"
            className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black font-semibold rounded-lg shadow-lg transition-colors"
          >
            Sign Up
          </Link>
        </div>
      )}

      {/* Main content container */}
      <div className="relative z-10 flex-1 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
          {/* Left side - Main content */}
          <div className="flex flex-col items-center justify-center text-center px-4">
            {/* Arabic Title */}
            <h1 className="text-5xl md:text-7xl font-black text-white mb-6 drop-shadow-[0_4px_20px_rgba(0,0,0,0.8)] filter contrast-125 brightness-110">
              تحدي الثلاثين ⚽
            </h1>

            {/* Tagline */}
            <p className="text-xl md:text-2xl text-green-100 mb-12 font-medium drop-shadow-lg">
              The ultimate football quiz showdown
            </p>

            {/* CTA Buttons */}
            <div className="space-y-6 w-full max-w-sm">
              <button
                onClick={handleCreateSession}
                disabled={isCreatingSession}
                className="block w-full bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 hover:from-yellow-500 hover:via-yellow-600 hover:to-yellow-700 disabled:from-gray-300 disabled:to-gray-400 text-black font-bold text-xl md:text-2xl py-6 px-8 rounded-2xl shadow-2xl transform transition-all duration-300 hover:scale-105 hover:shadow-3xl border-4 border-yellow-300 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isCreatingSession ? "Creating..." : "🏆 Create Session"}
              </button>

              <div className="grid grid-cols-1 gap-4">
                <Link
                  to="/join?role=host"
                  className="block w-full bg-gradient-to-r from-purple-500 via-purple-600 to-purple-700 hover:from-purple-600 hover:via-purple-700 hover:to-purple-800 text-white font-bold text-lg md:text-xl py-4 px-6 rounded-xl shadow-2xl transform transition-all duration-300 hover:scale-105 hover:shadow-3xl border-4 border-purple-300"
                >
                  👑 Join as Host
                </Link>

                <Link
                  to="/join?role=player"
                  className="block w-full bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 hover:from-blue-600 hover:via-blue-700 hover:to-blue-800 text-white font-bold text-lg md:text-xl py-4 px-6 rounded-xl shadow-2xl transform transition-all duration-300 hover:scale-105 hover:shadow-3xl border-4 border-blue-300"
                >
                  🎮 Join as Player
                </Link>
              </div>
            </div>
          </div>

          {/* Right side - Active Games */}
          <div className="flex items-center justify-center lg:py-8">
            <div className="w-full max-w-2xl">
              <ActiveGames />
            </div>
          </div>
        </div>
      </div>

      {/* Football-themed decorations - positioned lower and more central */}
      <div className="relative z-10 pb-8">
        <div className="flex justify-center space-x-8 opacity-70">
          <div className="text-5xl animate-bounce">⚽</div>
          <div
            className="text-5xl animate-bounce"
            style={{ animationDelay: "0.2s" }}
          >
            🏆
          </div>
          <div
            className="text-5xl animate-bounce"
            style={{ animationDelay: "0.4s" }}
          >
            🎯
          </div>
        </div>
      </div>

      {/* Stadium atmosphere effects */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black via-transparent to-transparent opacity-30"></div>

      {/* Alert Component */}
      {alert && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[60] w-full max-w-md px-4">
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

export default Homepage;
