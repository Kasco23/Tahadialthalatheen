import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PasswordModal from '../components/PasswordModal';
import { createSession } from '../lib/mutations';

const Homepage: React.FC = () => {
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const navigate = useNavigate();

  const handleCreateSession = () => {
    setIsPasswordModalOpen(true);
  };

  const handlePasswordConfirm = async (password: string, hostName: string) => {
    setIsCreatingSession(true);
    try {
      const { sessionCode } = await createSession(password, hostName);
      setIsPasswordModalOpen(false);
      // Navigate to game setup with the session code (not session ID)
      navigate(`/gamesetup/${sessionCode}`);
    } catch (error) {
      console.error('Error creating session:', error);
      alert(`Error creating session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsCreatingSession(false);
    }
  };

  const handlePasswordModalClose = () => {
    setIsPasswordModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-600 via-green-700 to-green-800 flex flex-col items-center justify-center relative overflow-hidden pitch-lines center-circle goal-area">
      {/* Football pitch background elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-2 border-white rounded-full"></div>
        <div className="absolute top-1/4 left-1/4 w-16 h-16 border-2 border-white rounded-full"></div>
        <div className="absolute bottom-1/4 right-1/4 w-16 h-16 border-2 border-white rounded-full"></div>
      </div>

      {/* Main content */}
      <div className="relative z-10 text-center px-6 max-w-2xl mx-auto">
        {/* Arabic Title */}
        <h1 className="text-6xl md:text-8xl font-black text-white mb-4 drop-shadow-2xl animate-pulse">
          تحدي الثلاثين ⚽
        </h1>

        {/* Tagline */}
        <p className="text-xl md:text-2xl text-green-100 mb-12 font-medium drop-shadow-lg">
          The ultimate football quiz showdown
        </p>



        {/* CTA Buttons */}
        <div className="space-y-6">
          <button
            onClick={handleCreateSession}
            className="block w-full max-w-sm mx-auto bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 hover:from-yellow-500 hover:via-yellow-600 hover:to-yellow-700 text-black font-bold text-xl md:text-2xl py-6 px-8 rounded-2xl shadow-2xl transform transition-all duration-300 hover:scale-105 hover:shadow-3xl border-4 border-yellow-300"
          >
            🏆 Create Session
          </button>

          <Link
            to="/join"
            className="block w-full max-w-sm mx-auto bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 hover:from-blue-600 hover:via-blue-700 hover:to-blue-800 text-white font-bold text-xl md:text-2xl py-6 px-8 rounded-2xl shadow-2xl transform transition-all duration-300 hover:scale-105 hover:shadow-3xl border-4 border-blue-300"
          >
            👥 Join Session
          </Link>
        </div>

        {/* Football-themed decorations */}
        <div className="mt-12 flex justify-center space-x-8 opacity-60">
          <div className="text-4xl animate-bounce">⚽</div>
          <div className="text-4xl animate-bounce" style={{ animationDelay: '0.2s' }}>🏆</div>
          <div className="text-4xl animate-bounce" style={{ animationDelay: '0.4s' }}>🎯</div>
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
    </div>
  );
};

export default Homepage;
