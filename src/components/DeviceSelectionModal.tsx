import React from "react";

interface DeviceSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (device: "pc" | "phone") => void;
}

export const DeviceSelectionModal: React.FC<DeviceSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelect,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-white/20 rounded-2xl p-6 w-full max-w-md shadow-2xl relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-blue-500/20 blur-[50px] rounded-full pointer-events-none" />

        <div className="relative z-10">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl font-bold text-white uppercase tracking-wider">
              🎮 Choose Device
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-1"
            >
              ✕
            </button>
          </div>

          <p className="text-gray-300 mb-6 text-sm">
            How would you like to manage the game? PC hosts combine lobby and game setup, while Phone users get separated setup logic.
          </p>

          <div className="grid grid-cols-2 gap-4 h-full">
            <button
              onClick={() => onSelect("pc")}
              className="flex flex-col items-center justify-center gap-3 p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-blue-500/20 hover:border-blue-500/50 transition-all duration-300 group"
            >
              <div className="text-4xl group-hover:scale-110 transition-transform">
                💻
              </div>
              <div className="text-center">
                <div className="font-bold text-white text-md">PC</div>
                <div className="text-xs text-gray-400 mt-1">
                  Unified Setup
                </div>
              </div>
            </button>

            <button
              onClick={() => onSelect("phone")}
              className="flex flex-col items-center justify-center gap-3 p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-green-500/20 hover:border-green-500/50 transition-all duration-300 group"
            >
              <div className="text-4xl group-hover:scale-110 transition-transform">
                📱
              </div>
              <div className="text-center">
                <div className="font-bold text-white text-md">Phone</div>
                <div className="text-xs text-gray-400 mt-1">
                  Classic Setup
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
