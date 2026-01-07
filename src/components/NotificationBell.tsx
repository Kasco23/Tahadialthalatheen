import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  getUnreadNotificationCount,
  subscribeNotificationsUpdates,
} from "../lib/notifications";
import { BellIcon } from "@heroicons/react/24/outline";

export default function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  const loadUnreadCount = useCallback(async () => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    try {
      const count = await getUnreadNotificationCount();
      setUnreadCount(count);
    } catch (error) {
      console.error("Error loading unread count:", error);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    // Load initial count asynchronously
    const loadInitial = async () => {
      await loadUnreadCount();
    };
    void loadInitial();

    // Subscribe to real-time updates
    const unsubscribe = subscribeNotificationsUpdates(user.id, () => {
      void loadUnreadCount();
    });

    return () => {
      unsubscribe();
    };
  }, [loadUnreadCount, user]);

  const handleClick = () => {
    navigate("/inbox");
  };

  if (!user) {
    return null;
  }

  return (
    <button
      onClick={handleClick}
      className="relative w-10 h-10 rounded-lg bg-white shadow-lg flex items-center justify-center hover:shadow-xl transition-shadow"
      title="Notifications"
    >
      <BellIcon className="h-6 w-6 text-gray-700" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </button>
  );
}
