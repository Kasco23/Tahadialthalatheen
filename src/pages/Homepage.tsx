import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PasswordModal from "../components/PasswordModal";
import ActiveGames from "../components/ActiveGames";
import { createSession } from "../lib/mutations";
import { Alert } from "../components/Alert";

const Homepage: React.FC = () => {
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [alert, setAlert] = useState<{
    type: "error" | "success" | "info";
    message: string;
  } | null>(null);
  const navigate = useNavigate();

  const handleCreateSession = () => {
    setIsPasswordModalOpen(true);
  };

  const handlePasswordConfirm = async (password: string, hostName: string) => {
    setIsCreatingSession(true);
    try {
      const { sessionCode } = await createSession(password, hostName);
      setIsPasswordModalOpen(false);
      // Navigate to game setup and pass the plaintext host password in location state
      navigate(`/gamesetup/${sessionCode}`, {
        state: { hostPassword: password },
      });
    } catch (error) {
      console.error("Error creating session:", error);
      setAlert({
        type: "error",
        message: `Error creating session: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    } finally {
      setIsCreatingSession(false);
    }
  };

  const handlePasswordModalClose = () => {
    setIsPasswordModalOpen(false);
  };

  return (
    <div className="relative">
      <div className="min-h-screen bg-gradient-to-br from-green-700 to-green-900 bg-[linear-gradient(45deg,rgba(0,0,0,0.05)_25%,transparent_25%,transparent_75%,rgba(0,0,0,0.05)_75%,rgba(0,0,0,0.05)),linear-gradient(-45deg,rgba(0,0,0,0.05)_25%,transparent_25%,transparent_75%,rgba(0,0,0,0.05)_75%,rgba(0,0,0,0.05))] bg-[length:20px_20px] flex flex-col p-4 relative overflow-hidden pitch-lines center-circle goal-area">
      {/* Football pitch background elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-2 border-white rounded-full"></div>
        <div className="absolute top-1/4 left-1/4 w-16 h-16 border-2 border-white rounded-full"></div>
        <div className="absolute bottom-1/4 right-1/4 w-16 h-16 border-2 border-white rounded-full"></div>
      </div>

      {/* Main content container */}
      <div className="relative z-10 flex-1 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
          {/* Left side - Main content */}
          <div className="flex flex-col items-center justify-center text-center">
            {/* Arabic Title */}
            <h1 className="text-5xl md:text-7xl font-black text-white mb-4 drop-shadow-2xl animate-pulse">
              تحدي الثلاثين ⚽
            </h1>

            {/* Tagline */}
            <p className="text-xl md:text-2xl text-green-100 mb-8 font-medium drop-shadow-lg">
              The ultimate football quiz showdown
            </p>

            {/* CTA Buttons */}
            <div className="space-y-6 w-full max-w-sm">
              <button
                onClick={handleCreateSession}
                className="block w-full bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 hover:from-yellow-500 hover:via-yellow-600 hover:to-yellow-700 text-black font-bold text-xl md:text-2xl py-6 px-8 rounded-2xl shadow-2xl transform transition-all duration-300 hover:scale-105 hover:shadow-3xl border-4 border-yellow-300"
              >
                🏆 Create Session
              </button>

              <Link
                to="/join"
                className="block w-full bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 hover:from-blue-600 hover:via-blue-700 hover:to-blue-800 text-white font-bold text-xl md:text-2xl py-6 px-8 rounded-2xl shadow-2xl transform transition-all duration-300 hover:scale-105 hover:shadow-3xl border-4 border-blue-300"
              >
                👥 Join Session
              </Link>
            </div>

            {/* Football-themed decorations */}
            <div className="mt-8 flex justify-center space-x-8 opacity-60">
              <div className="text-4xl animate-bounce">⚽</div>
              <div
                className="text-4xl animate-bounce"
                style={{ animationDelay: "0.2s" }}
              >
                🏆
              </div>
              <div
                className="text-4xl animate-bounce"
                style={{ animationDelay: "0.4s" }}
              >
                🎯
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

      {/* Stadium atmosphere effects */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black via-transparent to-transparent opacity-30"></div>

      {/* Password Modal */}
      <PasswordModal
        isOpen={isPasswordModalOpen}
        onClose={handlePasswordModalClose}
        onConfirm={handlePasswordConfirm}
        isLoading={isCreatingSession}
      />

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
    </div>
  );
};

export default Homepage;
