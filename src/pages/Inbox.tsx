import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  subscribeNotificationsUpdates,
} from "../lib/notifications";
import type { UserInboxItem } from "../lib/notifications";
import { StadiumBackground } from "../components/StadiumBackground";
import toast from "react-hot-toast";
import {
  BellIcon,
  CheckIcon,
  TrashIcon,
  UserPlusIcon,
  TrophyIcon,
} from "@heroicons/react/24/outline";

export default function Inbox() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<UserInboxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getNotifications(filter === "unread");
      setNotifications(data);
    } catch (error) {
      console.error("Error loading notifications:", error);
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    loadNotifications();

    // Subscribe to real-time updates
    const unsubscribe = subscribeNotificationsUpdates(user.id, () => {
      loadNotifications();
    });

    return () => {
      unsubscribe();
    };
  }, [user, navigate, loadNotifications]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);
      toast.success("Marked as read");
      loadNotifications();
    } catch (error) {
      console.error("Error marking as read:", error);
      toast.error("Failed to mark as read");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      toast.success("All notifications marked as read");
      loadNotifications();
    } catch (error) {
      console.error("Error marking all as read:", error);
      toast.error("Failed to mark all as read");
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      await deleteNotification(notificationId);
      toast.success("Notification deleted");
      loadNotifications();
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast.error("Failed to delete notification");
    }
  };

  const handleNotificationClick = async (notification: UserInboxItem) => {
    // Mark as read
    if (!notification.is_read && notification.id) {
      await handleMarkAsRead(String(notification.id));
    }

    // Navigate to the link if provided
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "friend_request":
        return <UserPlusIcon className="h-6 w-6 text-blue-500" />;
      case "friend_accepted":
        return <CheckIcon className="h-6 w-6 text-green-500" />;
      case "match_invite":
      case "match_result":
        return <TrophyIcon className="h-6 w-6 text-yellow-500" />;
      default:
        return <BellIcon className="h-6 w-6 text-gray-500" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <StadiumBackground variant="bright" animated={true}>
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <BellIcon className="h-8 w-8 text-green-600" />
                <div>
                  <h1 className="text-3xl font-bold text-gray-800">Inbox</h1>
                  <p className="text-gray-600">
                    {unreadCount > 0
                      ? `${unreadCount} unread`
                      : "All caught up!"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate("/profile")}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
              >
                Back to Profile
              </button>
            </div>

            {/* Filters and Actions */}
            <div className="flex flex-wrap gap-2 justify-between items-center">
              <div className="flex gap-2">
                <button
                  onClick={() => setFilter("all")}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filter === "all"
                      ? "bg-green-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter("unread")}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filter === "unread"
                      ? "bg-green-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  Unread ({unreadCount})
                </button>
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium"
                >
                  Mark All as Read
                </button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className="space-y-3">
            {loading ? (
              <div className="bg-white/95 backdrop-blur-sm rounded-xl p-12 text-center">
                <div className="animate-spin h-12 w-12 border-4 border-green-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-600">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="bg-white/95 backdrop-blur-sm rounded-xl p-12 text-center">
                <BellIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-xl font-semibold text-gray-700 mb-2">
                  No notifications
                </p>
                <p className="text-gray-500">You're all caught up!</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg hover:shadow-xl transition-all cursor-pointer ${
                    !notification.is_read ? "border-l-4 border-green-600" : ""
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type || "default")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-gray-800 mb-1">
                            {notification.title || "Notification"}
                          </h3>
                          <p className="text-gray-600 text-sm">
                            {notification.message}
                          </p>
                          {notification.sender_username && (
                            <p className="text-gray-500 text-xs mt-1">
                              From: @{notification.sender_username}
                            </p>
                          )}
                        </div>
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {formatTimestamp(notification.created_at || "")}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {!notification.is_read && notification.id && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead(String(notification.id));
                          }}
                          className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                          title="Mark as read"
                        >
                          <CheckIcon className="h-5 w-5 text-blue-600" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (notification.id) handleDelete(String(notification.id));
                        }}
                        className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <TrashIcon className="h-5 w-5 text-red-600" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </StadiumBackground>
  );
}
