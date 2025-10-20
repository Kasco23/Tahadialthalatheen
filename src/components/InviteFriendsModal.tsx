import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getFriends, type FriendWithProfile } from "../lib/friends";
import { createSessionInvite } from "../lib/notifications";
import toast from "react-hot-toast";
import { UserPlusIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Flag } from "./Flag";

interface InviteFriendsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionCode: string;
  sessionId: string;
}

export function InviteFriendsModal({
  isOpen,
  onClose,
  sessionCode,
  sessionId,
}: InviteFriendsModalProps) {
  const { user, profile } = useAuth();
  const [friends, setFriends] = useState<FriendWithProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [inviting, setInviting] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen && user) {
      loadFriends();
    }
  }, [isOpen, user]);

  const loadFriends = async () => {
    try {
      setLoading(true);
      const data = await getFriends();
      setFriends(data);
    } catch (error) {
      console.error("Error loading friends:", error);
      toast.error("Failed to load friends list");
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (friendId: string) => {
    if (!user || !profile) return;

    try {
      setInviting((prev) => new Set(prev).add(friendId));

      const senderName = profile.name || profile.username || "Someone";
      await createSessionInvite(
        friendId,
        user.id,
        senderName,
        sessionCode,
        sessionId,
      );

      toast.success("Invite sent!");
      
      // Keep the modal open so they can invite more friends
      setInviting((prev) => {
        const next = new Set(prev);
        next.delete(friendId);
        return next;
      });
    } catch (error) {
      console.error("Error sending invite:", error);
      toast.error("Failed to send invite");
      setInviting((prev) => {
        const next = new Set(prev);
        next.delete(friendId);
        return next;
      });
    }
  };

  // Get the friend's profile (either requester or addressee)
  const getFriendProfile = (friend: FriendWithProfile) => {
    if (!user) return null;
    if (friend.requester_id === user.id) {
      return friend.addressee;
    }
    return friend.requester;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <UserPlusIcon className="h-7 w-7" />
            Invite Friends
          </h2>
          <p className="text-green-100 text-sm mt-1">
            Session Code: <span className="font-bold">{sessionCode}</span>
          </p>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
              <p className="text-gray-500 mt-3">Loading friends...</p>
            </div>
          ) : friends.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">
                You don't have any friends yet. Add some friends to invite them
                to games!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {friends.map((friend) => {
                const friendProfile = getFriendProfile(friend);
                if (!friendProfile) return null;

                const isInviting = inviting.has(friendProfile.id);

                return (
                  <div
                    key={friend.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {friendProfile.avatar_url ? (
                        <img
                          src={friendProfile.avatar_url}
                          alt={friendProfile.name || "Friend"}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold">
                          {(friendProfile.name || friendProfile.username || "?")[0].toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900">
                            {friendProfile.name || friendProfile.username}
                          </p>
                          {friendProfile.flag && (
                            <Flag code={friendProfile.flag} className="w-5 h-4" />
                          )}
                        </div>
                        {friendProfile.username && (
                          <p className="text-sm text-gray-500">
                            @{friendProfile.username}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleInvite(friendProfile.id)}
                      disabled={isInviting}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        isInviting
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-green-500 text-white hover:bg-green-600 hover:shadow-lg"
                      }`}
                    >
                      {isInviting ? "Inviting..." : "Invite"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-4 border-t">
          <button
            onClick={onClose}
            className="w-full py-2 px-4 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
