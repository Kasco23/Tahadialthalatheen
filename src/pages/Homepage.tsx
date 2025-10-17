import { Logger } from "../lib/logger";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ActiveGames from "../components/ActiveGames";
import { createSession } from "../lib/mutations";
import { Alert } from "../components/Alert";
import { useAuth } from "../contexts/AuthContext";

const Homepage: React.FC = () => {
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
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
        <>
          {/* Profile Button */}
          <button
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className="absolute top-4 right-4 z-30 w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center hover:shadow-xl transition-shadow"
          >
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="Avatar"
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className="text-2xl">👤</span>
            )}
          </button>

          {/* Slide-out Profile Menu */}
          <div
            className={`fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-40 transform transition-transform duration-300 ease-in-out ${
              isProfileMenuOpen ? "translate-x-0" : "translate-x-full"
            }`}
          >
            <div className="flex flex-col h-full p-6">
              {/* Close Button */}
              <button
                onClick={() => setIsProfileMenuOpen(false)}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>

              {/* Profile Header */}
              <div className="flex flex-col items-center mb-6 mt-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center mb-3 shadow-lg">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt="Avatar"
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-4xl">👤</span>
                  )}
                </div>
                <h3 className="text-xl font-bold text-gray-800">
                  {profile?.name || "User"}
                </h3>
                <p className="text-sm text-gray-600">{user.email}</p>
              </div>

              {/* Menu Items */}
              <nav className="flex-1 space-y-2">
                <Link
                  to="/profile"
                  onClick={() => setIsProfileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-green-50 transition-colors"
                >
                  <span className="text-xl">⚙️</span>
                  <span className="font-medium text-gray-700">
                    Profile Settings
                  </span>
                </Link>
                <Link
                  to="/select-flag"
                  onClick={() => setIsProfileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-green-50 transition-colors"
                >
                  <span className="text-xl">🏴</span>
                  <span className="font-medium text-gray-700">Change Flag</span>
                </Link>
                <Link
                  to="/select-team"
                  onClick={() => setIsProfileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-green-50 transition-colors"
                >
                  <span className="text-xl">⚽</span>
                  <span className="font-medium text-gray-700">Change Team</span>
                </Link>
              </nav>

              {/* Sign Out Button */}
              <button
                onClick={() => {
                  handleSignOut();
                  setIsProfileMenuOpen(false);
                }}
                className="w-full px-4 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg transition-colors shadow-lg"
              >
                Sign Out
              </button>
            </div>
          </div>

          {/* Backdrop */}
          {isProfileMenuOpen && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-30"
              onClick={() => setIsProfileMenuOpen(false)}
            />
          )}
        </>
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8 h-full">
          {/* Left side - Main content */}
          <div className="flex flex-col items-center justify-center text-center px-4 py-8 lg:py-0">
            {/* Arabic Title */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white mb-4 lg:mb-6 drop-shadow-[0_4px_20px_rgba(0,0,0,0.8)] filter contrast-125 brightness-110">
              تحدي الثلاثين ⚽
            </h1>

            {/* Tagline */}
            <p className="text-lg sm:text-xl md:text-2xl text-green-100 mb-8 lg:mb-12 font-medium drop-shadow-lg">
              The ultimate football quiz showdown
            </p>

            {/* CTA Buttons */}
            <div className="space-y-4 lg:space-y-6 w-full max-w-sm">
              <button
                onClick={handleCreateSession}
                disabled={isCreatingSession}
                className="block w-full bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 hover:from-yellow-500 hover:via-yellow-600 hover:to-yellow-700 disabled:from-gray-300 disabled:to-gray-400 text-black font-bold text-lg sm:text-xl md:text-2xl py-4 sm:py-5 lg:py-6 px-6 lg:px-8 rounded-2xl shadow-2xl transform transition-all duration-300 hover:scale-105 hover:shadow-3xl border-4 border-yellow-300 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isCreatingSession ? "Creating..." : "🏆 Create Session"}
              </button>

              <div className="grid grid-cols-1 gap-3 lg:gap-4">
                <Link
                  to="/join"
                  className="block w-full bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 hover:from-blue-600 hover:via-blue-700 hover:to-blue-800 text-white font-bold text-base sm:text-lg md:text-xl py-3 sm:py-4 px-4 lg:px-6 rounded-xl shadow-2xl transform transition-all duration-300 hover:scale-105 hover:shadow-3xl border-4 border-blue-300"
                >
                  🎮 Join Session
                </Link>
              </div>
            </div>
          </div>

          {/* Right side - Active Games */}
          {user && (
            <div className="flex items-center justify-center py-4 lg:py-8">
              <div className="w-full max-w-2xl">
                <ActiveGames />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Football-themed decorations - positioned lower and more central, responsive */}
      <div className="relative z-10 pb-4 lg:pb-8">
        <div className="flex justify-center space-x-4 lg:space-x-8 opacity-70">
          <div className="text-3xl lg:text-5xl animate-bounce">⚽</div>
          <div
            className="text-3xl lg:text-5xl animate-bounce"
            style={{ animationDelay: "0.2s" }}
          >
            🏆
          </div>
          <div
            className="text-3xl lg:text-5xl animate-bounce"
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
