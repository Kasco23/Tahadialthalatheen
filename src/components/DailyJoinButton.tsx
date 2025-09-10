import { useState, useEffect, useCallback } from "react";
import { useAtom } from "jotai";
import { useDaily } from "@daily-co/daily-react";
import {
  dailyRoomUrlAtom,
  dailyTokenAtom,
  dailyUserNameAtom,
  dailyTokenExpiryAtom,
  dailyTokenRefreshingAtom,
} from "../atoms";
import {
  createDailyToken,
  clearDailyToken,
  getDailyTokenInfo,
} from "../lib/mutations";

interface DailyJoinButtonProps {
  sessionCode: string;
  participantName: string;
}

export const DailyJoinButton: React.FC<DailyJoinButtonProps> = ({
  sessionCode,
  participantName,
}) => {
  const daily = useDaily();
  const [dailyRoomUrl] = useAtom(dailyRoomUrlAtom);
  const [dailyToken, setDailyToken] = useAtom(dailyTokenAtom);
  const [, setDailyUserName] = useAtom(dailyUserNameAtom);
  const [tokenExpiry, setTokenExpiry] = useAtom(dailyTokenExpiryAtom);
  const [isRefreshing, setIsRefreshing] = useAtom(dailyTokenRefreshingAtom);

  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  // Check for token expiry and show warning
  const isTokenExpiringSoon =
    tokenExpiry && tokenExpiry - Date.now() < 5 * 60 * 1000; // 5 minutes
  const isTokenExpired = tokenExpiry && Date.now() >= tokenExpiry;

  // Refresh token if it's expiring soon or expired
  const refreshTokenIfNeeded = useCallback(async () => {
    if (!dailyRoomUrl || !sessionCode || !participantName) return;

    if (isTokenExpiringSoon || isTokenExpired || !dailyToken) {
      setIsRefreshing(true);
      try {
        const tokenResponse = await createDailyToken(
          sessionCode,
          participantName,
        );
        setDailyToken(tokenResponse.token);

        // Get token info to set expiry
        const tokenInfo = getDailyTokenInfo(sessionCode, participantName);
        if (tokenInfo) {
          setTokenExpiry(tokenInfo.expires_at);
        }

        console.log("Token refreshed successfully");
      } catch (error) {
        console.error("Failed to refresh token:", error);
        setJoinError("Failed to refresh video token. Please try again.");
      } finally {
        setIsRefreshing(false);
      }
    }
  }, [
    dailyRoomUrl,
    sessionCode,
    participantName,
    isTokenExpiringSoon,
    isTokenExpired,
    dailyToken,
    setDailyToken,
    setTokenExpiry,
    setIsRefreshing,
  ]);

  // Auto-refresh token when needed
  useEffect(() => {
    if (isTokenExpiringSoon || isTokenExpired) {
      refreshTokenIfNeeded();
    }
  }, [isTokenExpiringSoon, isTokenExpired, refreshTokenIfNeeded]);

  const handleJoinDaily = async () => {
    if (!dailyRoomUrl) {
      setJoinError(
        "No Daily room available. Host needs to create a room first.",
      );
      return;
    }

    setIsJoining(true);
    setJoinError(null);

    try {
      // Ensure we have a fresh token
      await refreshTokenIfNeeded();

      // Get the current token (might be refreshed)
      const currentToken =
        dailyToken ||
        (await createDailyToken(sessionCode, participantName)).token;
      setDailyToken(currentToken);
      setDailyUserName(participantName);

      // Get token info to set expiry
      const tokenInfo = getDailyTokenInfo(sessionCode, participantName);
      if (tokenInfo) {
        setTokenExpiry(tokenInfo.expires_at);
      }

      // Join the Daily room using the Daily instance
      await daily?.join({
        url: dailyRoomUrl,
        token: currentToken,
        userName: participantName,
      });

      console.log("Successfully joined Daily room:", {
        roomUrl: dailyRoomUrl,
        userName: participantName,
        tokenExpiry: tokenInfo?.expires_at,
      });
    } catch (error) {
      console.error("Failed to join Daily room:", error);
      setJoinError(
        error instanceof Error ? error.message : "Failed to join video call",
      );
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeaveDaily = async () => {
    if (daily) {
      await daily.leave();

      // Clear token cache and atoms
      clearDailyToken(sessionCode, participantName);
      setDailyToken(null);
      setDailyUserName(null);
      setTokenExpiry(null);

      console.log("Left Daily room and cleared token cache");
    }
  };

  const isInCall = daily?.meetingState() === "joined-meeting";

  return (
    <div className="space-y-2">
      {joinError && (
        <div className="p-2 bg-red-100 border border-red-400 text-red-700 rounded">
          {joinError}
        </div>
      )}

      {/* Token status indicators */}
      {isRefreshing && (
        <div className="p-2 bg-blue-100 border border-blue-400 text-blue-700 rounded text-sm">
          Refreshing video token...
        </div>
      )}

      {isTokenExpiringSoon && !isRefreshing && (
        <div className="p-2 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded text-sm">
          Video token expires soon. It will be refreshed automatically.
        </div>
      )}

      {isTokenExpired && !isRefreshing && (
        <div className="p-2 bg-orange-100 border border-orange-400 text-orange-700 rounded text-sm">
          Video token has expired. Please refresh or rejoin.
        </div>
      )}

      {!isInCall ? (
        <button
          onClick={handleJoinDaily}
          disabled={isJoining || !dailyRoomUrl || isRefreshing}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            isJoining || !dailyRoomUrl || isRefreshing
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          {isJoining
            ? "Joining..."
            : isRefreshing
              ? "Refreshing..."
              : "Join Video Call"}
        </button>
      ) : (
        <div className="space-y-2">
          <button
            onClick={handleLeaveDaily}
            className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
          >
            Leave Video Call
          </button>

          {/* Refresh token button for manual refresh */}
          <button
            onClick={refreshTokenIfNeeded}
            disabled={isRefreshing}
            className="ml-2 px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300 transition-colors disabled:opacity-50"
          >
            {isRefreshing ? "Refreshing..." : "Refresh Token"}
          </button>
        </div>
      )}

      {!dailyRoomUrl && (
        <p className="text-sm text-gray-500">
          Waiting for host to create video room...
        </p>
      )}

      {/* Debug info in development */}
      {process.env.NODE_ENV === "development" && tokenExpiry && (
        <div className="text-xs text-gray-400 mt-2">
          Token expires: {new Date(tokenExpiry).toLocaleTimeString()}
        </div>
      )}
    </div>
  );
};
