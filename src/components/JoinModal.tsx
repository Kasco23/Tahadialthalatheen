import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { joinAsPlayerWithCode } from "../lib/mutations";
import { getSeatsFromRole, setSeatInStorage } from "../lib/userSession";
import { storeParticipantData, getLobbyUrl } from "../lib/joinHelpers";
import type { ParticipantRole } from "../lib/types";
import { Logger } from "../lib/logger";
import toast from "react-hot-toast";

interface JoinModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const JoinModal: React.FC<JoinModalProps> = ({ isOpen, onClose }) => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [sessionCode, setSessionCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  if (!isOpen) return null;

  const handleJoinSession = async (e: FormEvent) => {
    e.preventDefault();

    if (!sessionCode.trim()) {
      toast.error("Please enter a session code");
      return;
    }

    if (!user || !profile) {
      toast.error("Please sign in to join a session");
      navigate("/login");
      return;
    }

    setIsJoining(true);

    try {
      // Determine role based on user's profile
      // For simplicity, we'll try to join as a player first
      // The backend will assign the appropriate role (Player1 or Player2)
      const { participantId, role } = await joinAsPlayerWithCode(
        sessionCode.toUpperCase(),
        profile.name || "Player",
        profile.flag || "",
        "" // Team logo URL - can be added from profile if needed
      );

      // Store participant data in localStorage
      storeParticipantData(
        participantId,
        sessionCode.toUpperCase(),
        role,
        false,
        profile.name || undefined,
        profile.flag || undefined,
        undefined, // team logo url
        profile.team || undefined
      );

      // Navigate to lobby
      const seat = getSeatsFromRole(role as ParticipantRole);
      if (seat) {
        setSeatInStorage(seat);
      }
      navigate(getLobbyUrl(sessionCode.toUpperCase(), role as ParticipantRole, seat));
      
      toast.success("Joined session successfully!");
      onClose();
    } catch (error) {
      Logger.error("Error joining session:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to join session. Please check your session code."
      );
    } finally {
      setIsJoining(false);
    }
  };

  const handleClose = () => {
    if (!isJoining) {
      setSessionCode("");
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-gray-800">🎮 Join Session</h2>
          <button
            onClick={handleClose}
            disabled={isJoining}
            className="text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
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
        </div>

        {user && profile ? (
          <>
            <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-xl border border-blue-200">
              <p className="text-sm text-gray-600 mb-2">Joining as:</p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg">
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt="Avatar"
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl">👤</span>
                  )}
                </div>
                <div>
                  <p className="font-bold text-gray-800">{profile.name}</p>
                  <p className="text-sm text-gray-600">{user.email}</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleJoinSession} className="space-y-6">
              <div>
                <label
                  htmlFor="sessionCode"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Session Code
                </label>
                <input
                  id="sessionCode"
                  type="text"
                  value={sessionCode}
                  onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 outline-none text-center text-lg font-mono tracking-widest uppercase"
                  placeholder="e.g., ABC123"
                  required
                  maxLength={6}
                  disabled={isJoining}
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter the 6-character session code
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isJoining}
                  className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-xl transition-all duration-200 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isJoining || !sessionCode.trim()}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-300 disabled:to-gray-400 text-white font-bold rounded-xl transition-all duration-200 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                >
                  {isJoining ? "Joining..." : "Join Session"}
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">🔒</div>
            <p className="text-lg text-gray-700 mb-6">
              Please sign in to join a session
            </p>
            <button
              onClick={() => {
                navigate("/login");
                onClose();
              }}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
