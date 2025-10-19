import { Logger } from "../lib/logger";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ActiveGamesSidebar from "../components/ActiveGames";
import { createSession } from "../lib/mutations";
import { Alert } from "../components/Alert";
import { useAuth } from "../contexts/AuthContext";
import { JoinModal } from "../components/JoinModal";
import { StadiumBackground } from "../components/StadiumBackground";
import NotificationBell from "../components/NotificationBell";

const Homepage: React.FC = () => {
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isActiveGamesSidebarOpen, setIsActiveGamesSidebarOpen] = useState(false);
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
      const { sessionCode } = await createSession(user.id);
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
    <StadiumBackground variant="default">

      {/* User menu in top right */}
      {user && (
        <>
          {/* Top Right Actions */}
          <div className="absolute top-4 right-4 z-50 flex gap-3 items-center">
            {/* Notification Bell */}
            <NotificationBell />
            
            {/* Profile Button */}
            <button
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center hover:shadow-xl transition-shadow"
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
          </div>

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
                  to="/inbox"
                  onClick={() => setIsProfileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-green-50 transition-colors"
                >
                  <span className="text-xl">📬</span>
                  <span className="font-medium text-gray-700">Inbox</span>
                </Link>
                <Link
                  to="/leaderboard"
                  onClick={() => setIsProfileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-green-50 transition-colors"
                >
                  <span className="text-xl">🏆</span>
                  <span className="font-medium text-gray-700">Leaderboard</span>
                </Link>
                <div className="border-t border-gray-200 my-2"></div>
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
              className="fixed inset-0 bg-black bg-opacity-50 z-35"
              onClick={() => setIsProfileMenuOpen(false)}
            />
          )}
        </>
      )}

      {/* Sign in/Sign up buttons when not authenticated */}
      {!user && (
        <div className="absolute top-4 right-4 z-50 flex gap-2">
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

      {/* Header with Title */}
      <div className="relative z-20 pt-20 pb-8 px-4">
        <div className="text-center">
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white mb-4 drop-shadow-2xl">
            تحدي الثلاثين
          </h1>
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-12 h-1 bg-yellow-400"></div>
            <span className="text-2xl">⚽</span>
            <div className="w-12 h-1 bg-yellow-400"></div>
          </div>
          <p className="text-xl md:text-2xl text-white/90 font-medium">
            The Ultimate Football Quiz Showdown
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 pb-20">
        <div className="w-full max-w-5xl">
          {/* Action Cards Container */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {/* Create Session Card */}
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105">
              <div className="text-center">
                <div className="text-6xl mb-4">🏆</div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Create Session
                </h2>
                <p className="text-white/70 mb-6">
                  Start a new quiz and invite friends
                </p>
                <button
                  onClick={handleCreateSession}
                  disabled={isCreatingSession}
                  className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 disabled:from-gray-400 disabled:to-gray-500 text-black font-bold text-lg py-4 px-6 rounded-xl shadow-lg transition-all duration-300 hover:shadow-2xl disabled:cursor-not-allowed"
                >
                  {isCreatingSession ? "Creating..." : "Create New Game"}
                </button>
              </div>
            </div>

            {/* Join Session Card */}
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105">
              <div className="text-center">
                <div className="text-6xl mb-4">🎮</div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Join Session
                </h2>
                <p className="text-white/70 mb-6">
                  Enter a session code to play
                </p>
                <button
                  onClick={() => setIsJoinModalOpen(true)}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold text-lg py-4 px-6 rounded-xl shadow-lg transition-all duration-300 hover:shadow-2xl"
                >
                  Join Existing Game
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Expandable Arrow for Active Sessions - Only show if user is logged in */}
      {user && (
        <button
          onClick={() => setIsActiveGamesSidebarOpen(!isActiveGamesSidebarOpen)}
          className="fixed left-0 top-1/2 -translate-y-1/2 z-30 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white p-4 rounded-r-2xl shadow-2xl transition-all duration-300 hover:pl-6 group"
          aria-label="Toggle Active Sessions"
        >
          <div className="flex items-center gap-2">
            <svg
              className={`w-6 h-6 transition-transform duration-300 ${isActiveGamesSidebarOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
            <span className="text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
              Active Games
            </span>
          </div>
        </button>
      )}

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

      {/* Join Modal */}
      <JoinModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
      />

      {/* Active Games Sidebar */}
      {user && (
        <ActiveGamesSidebar
          isOpen={isActiveGamesSidebarOpen}
          onClose={() => setIsActiveGamesSidebarOpen(false)}
        />
      )}
    </StadiumBackground>
  );
};

export default Homepage;
