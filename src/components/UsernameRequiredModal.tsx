import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";

interface UsernameRequiredModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
  message?: string;
}

export default function UsernameRequiredModal({
  isOpen,
  onClose,
  onSuccess,
  message = "You need to create a username to use this feature.",
}: UsernameRequiredModalProps) {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [saving, setSaving] = useState(false);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Validate username
    if (!username || username.length < 3) {
      toast.error("Username must be at least 3 characters");
      return;
    }

    if (!/^[a-z0-9_]{3,20}$/.test(username)) {
      toast.error(
        "Username can only contain lowercase letters, numbers, and underscores"
      );
      return;
    }

    setSaving(true);

    try {
      await updateProfile({ username });
      toast.success("Username created successfully!");
      
      if (onSuccess) {
        onSuccess();
      }
      
      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error("Error creating username:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create username";

      // Check for unique constraint violation
      if (
        errorMessage.includes("duplicate") ||
        errorMessage.includes("unique")
      ) {
        toast.error(
          "This username is already taken. Please choose another one."
        );
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleGoToProfile = () => {
    navigate("/profile");
    if (onClose) {
      onClose();
    }
  };

  const handleSkip = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-b from-green-900 via-green-800 to-green-900 rounded-2xl shadow-2xl max-w-md w-full border-4 border-green-500/50 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 text-center">
          <div className="text-6xl mb-3">👤</div>
          <h2 className="text-2xl font-black text-white">Username Required</h2>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-green-100 text-center">{message}</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-green-200 font-semibold mb-2">
                Choose Your Username
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-green-400 font-bold text-lg">
                  @
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) =>
                    setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))
                  }
                  placeholder="yourname"
                  className="w-full pl-9 pr-4 py-3 bg-black/30 border-2 border-green-500/50 rounded-lg text-white placeholder-green-300/50 focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-400/50"
                  maxLength={20}
                  required
                  autoFocus
                />
              </div>
              <p className="text-xs text-green-300/70 mt-2">
                3-20 characters: lowercase letters, numbers, underscores only
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 pt-2">
              <button
                type="submit"
                disabled={saving || username.length < 3}
                className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
              >
                {saving ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Creating...
                  </span>
                ) : (
                  "Create Username"
                )}
              </button>

              <button
                type="button"
                onClick={handleGoToProfile}
                className="w-full px-6 py-3 bg-green-700/50 hover:bg-green-700 text-white font-semibold rounded-lg transition-all duration-200"
              >
                Go to Profile Settings
              </button>

              {onClose && (
                <button
                  type="button"
                  onClick={handleSkip}
                  className="w-full px-6 py-3 text-green-300 hover:text-white font-medium transition-colors"
                >
                  Skip for Now
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
