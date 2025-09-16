import { motion } from "framer-motion";
import type { ExistingPreset } from "../lib/mutations";

interface PresetConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUseExisting: () => void;
  onCreateNew: () => void;
  preset: ExistingPreset | null;
  isLoading?: boolean;
}

const PresetConfirmationModal: React.FC<PresetConfirmationModalProps> = ({
  isOpen,
  onUseExisting,
  onCreateNew,
  preset,
  isLoading = false,
}) => {
  if (!isOpen || !preset) return null;

  const roleName = preset.role === "Host" ? "host" : "player";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl p-8 max-w-md w-full mx-4"
      >
        <div className="text-center mb-6">
          <div className="text-4xl mb-4">🎮</div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Existing Preset Found!
          </h2>
          <p className="text-blue-200">
            There is an existing flag and logo preset for{" "}
            <span className="font-bold text-white">{roleName} "{preset.name}"</span>
          </p>
        </div>

        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 mb-6 border border-white/10">
          <div className="flex items-center justify-center space-x-6">
            {/* Flag Display */}
            <div className="text-center">
              <div className="text-sm text-blue-200 mb-2">Country Flag</div>
              <div className="w-16 h-12 bg-white/10 rounded-lg flex items-center justify-center text-2xl border border-white/20">
                {preset.flag}
              </div>
            </div>

            {/* Logo Display */}
            <div className="text-center">
              <div className="text-sm text-blue-200 mb-2">Team Logo</div>
              <div className="w-16 h-16 bg-white/10 rounded-lg flex items-center justify-center border border-white/20 overflow-hidden">
                {preset.team_logo_url ? (
                  <img
                    src={preset.team_logo_url}
                    alt="Team Logo"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <div className="text-white/60 text-xs">No Logo</div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mb-6">
          <p className="text-white text-sm">
            Do you want to use this preset or create a new one?
          </p>
        </div>

        <div className="flex space-x-4">
          <button
            type="button"
            onClick={onCreateNew}
            disabled={isLoading}
            className="flex-1 px-4 py-3 bg-gray-600/50 hover:bg-gray-600/70 text-white rounded-lg transition-colors disabled:opacity-50 border border-gray-500/50"
          >
            {isLoading ? "⏳ Loading..." : "🆕 Create New"}
          </button>
          
          <button
            type="button"
            onClick={onUseExisting}
            disabled={isLoading}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white rounded-lg transition-all transform hover:scale-105 disabled:opacity-50"
          >
            {isLoading ? "⏳ Loading..." : "✅ Use Existing"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default PresetConfirmationModal;