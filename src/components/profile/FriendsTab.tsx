import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import {
  getFriends,
  getPendingRequests,
  getSentRequests,
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  removeFriend,
  searchUsersByUsername,
  subscribeFriendsUpdates,
} from "../../lib/friends";
import type { FriendWithProfile, Profile } from "../../lib/friends";
import toast from "react-hot-toast";
import {
  UserPlusIcon,
  CheckIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";

export default function FriendsTab() {
  const { user } = useAuth();
  const [friends, setFriends] = useState<FriendWithProfile[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendWithProfile[]>(
    [],
  );
  const [sentRequests, setSentRequests] = useState<FriendWithProfile[]>([]);
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFriends();

    // Subscribe to real-time updates
    if (user) {
      const unsubscribe = subscribeFriendsUpdates(user.id, () => {
        loadFriends();
      });
      return () => unsubscribe();
    }
  }, [user]);

  const loadFriends = async () => {
    try {
      setLoading(true);
      const [friendsList, pending, sent] = await Promise.all([
        getFriends(),
        getPendingRequests(),
        getSentRequests(),
      ]);
      setFriends(friendsList);
      setPendingRequests(pending);
      setSentRequests(sent);
    } catch (error) {
      console.error("Error loading friends:", error);
      toast.error("Failed to load friends");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm || searchTerm.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);
      const results = await searchUsersByUsername(searchTerm);
      // Filter out self and existing friends/requests
      const filtered = results.filter(
        (r) =>
          r.id !== user?.id &&
          !friends.some(
            (f) => f.requester_id === r.id || f.addressee_id === r.id,
          ) &&
          !pendingRequests.some((p) => p.requester_id === r.id) &&
          !sentRequests.some((s) => s.addressee_id === r.id),
      );
      setSearchResults(filtered);
    } catch (error) {
      console.error("Error searching users:", error);
      toast.error("Failed to search users");
    } finally {
      setSearching(false);
    }
  };

  const handleSendRequest = async (username: string) => {
    try {
      await sendFriendRequest(username);
      toast.success(`Friend request sent to @${username}`);
      setSearchResults([]);
      setSearchTerm("");
      loadFriends();
    } catch (error) {
      console.error("Error sending friend request:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to send request",
      );
    }
  };

  const handleAcceptRequest = async (friendshipId: string) => {
    try {
      await acceptFriendRequest(friendshipId);
      toast.success("Friend request accepted!");
      loadFriends();
    } catch (error) {
      console.error("Error accepting request:", error);
      toast.error("Failed to accept request");
    }
  };

  const handleDeclineRequest = async (friendshipId: string) => {
    try {
      await declineFriendRequest(friendshipId);
      toast.success("Friend request declined");
      loadFriends();
    } catch (error) {
      console.error("Error declining request:", error);
      toast.error("Failed to decline request");
    }
  };

  const handleRemoveFriend = async (friendshipId: string, username: string) => {
    if (
      !window.confirm(
        `Are you sure you want to remove @${username} as a friend?`,
      )
    ) {
      return;
    }

    try {
      await removeFriend(friendshipId);
      toast.success("Friend removed");
      loadFriends();
    } catch (error) {
      console.error("Error removing friend:", error);
      toast.error("Failed to remove friend");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-green-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Users */}
      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-3">Add Friends</h3>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search by username..."
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
            />
            <MagnifyingGlassIcon className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
          <button
            onClick={handleSearch}
            disabled={searching || searchTerm.length < 2}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors disabled:bg-gray-400"
          >
            {searching ? "..." : "Search"}
          </button>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mt-3 space-y-2">
            {searchResults.map((result) => (
              <div
                key={result.id}
                className="flex items-center justify-between bg-gray-50 rounded-lg p-3"
              >
                <div>
                  <p className="font-semibold text-gray-800">
                    @{result.username}
                  </p>
                  <p className="text-sm text-gray-600">{result.name}</p>
                </div>
                <button
                  onClick={() => handleSendRequest(result.username!)}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  <UserPlusIcon className="h-4 w-4 inline mr-1" />
                  Add Friend
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-gray-800 mb-3">
            Pending Requests ({pendingRequests.length})
          </h3>
          <div className="space-y-2">
            {pendingRequests.map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-3"
              >
                <div>
                  <p className="font-semibold text-gray-800">
                    @{request.requester?.username}
                  </p>
                  <p className="text-sm text-gray-600">
                    {request.requester?.name}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAcceptRequest(request.id)}
                    className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors"
                  >
                    <CheckIcon className="h-4 w-4 inline mr-1" />
                    Accept
                  </button>
                  <button
                    onClick={() => handleDeclineRequest(request.id)}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors"
                  >
                    <XMarkIcon className="h-4 w-4 inline mr-1" />
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sent Requests */}
      {sentRequests.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-gray-800 mb-3">
            Sent Requests ({sentRequests.length})
          </h3>
          <div className="space-y-2">
            {sentRequests.map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between bg-gray-50 rounded-lg p-3"
              >
                <div>
                  <p className="font-semibold text-gray-800">
                    @{request.addressee?.username}
                  </p>
                  <p className="text-sm text-gray-600">
                    {request.addressee?.name}
                  </p>
                  <p className="text-xs text-gray-500">Pending...</p>
                </div>
                <button
                  onClick={() =>
                    handleRemoveFriend(
                      request.id,
                      request.addressee?.username || "user",
                    )
                  }
                  className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Friends List */}
      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-3">
          Friends ({friends.length})
        </h3>
        {friends.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <UserPlusIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>No friends yet</p>
            <p className="text-sm">Search for users above to add friends!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {friends.map((friendship) => {
              const friend =
                friendship.requester_id === user?.id
                  ? friendship.addressee
                  : friendship.requester;

              return (
                <div
                  key={friendship.id}
                  className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3"
                >
                  <div>
                    <p className="font-semibold text-gray-800">
                      @{friend?.username}
                    </p>
                    <p className="text-sm text-gray-600">{friend?.name}</p>
                  </div>
                  <button
                    onClick={() =>
                      handleRemoveFriend(
                        friendship.id,
                        friend?.username || "user",
                      )
                    }
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors"
                  >
                    Remove
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
