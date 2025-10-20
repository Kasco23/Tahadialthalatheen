import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { XMarkIcon, UserCircleIcon } from "@heroicons/react/24/outline";
import { useState } from "react";

export function UsernameSetupBanner() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [isDismissed, setIsDismissed] = useState(false);

  // Don't show if user has username or banner is dismissed
  if (!profile || profile.username || isDismissed) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-amber-500 to-orange-600 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <UserCircleIcon className="h-6 w-6 text-white flex-shrink-0" />
            <div className="flex-1">
              <p className="text-white font-medium text-sm md:text-base">
                Please set up your username to continue using all features
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/profile")}
              className="px-4 py-2 bg-white text-orange-600 font-semibold rounded-lg hover:bg-orange-50 transition-colors text-sm whitespace-nowrap"
            >
              Set Username
            </button>
            <button
              onClick={() => setIsDismissed(true)}
              className="p-1 text-white/80 hover:text-white transition-colors"
              title="Dismiss"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
