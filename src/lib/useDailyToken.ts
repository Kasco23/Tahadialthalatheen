import { Logger } from "./logger";
import { useCallback, useEffect } from "react";
import { useAtom } from "jotai";
import {
  dailyTokenAtom,
  dailyTokenExpiryAtom,
  dailyTokenRefreshingAtom,
} from "../atoms";
import { createDailyToken, getDailyTokenInfo } from "./mutations";

interface UseDailyTokenOptions {
  sessionCode: string;
  participantName: string;
}

export const useDailyToken = ({
  sessionCode,
  participantName,
}: UseDailyTokenOptions) => {
  const [dailyToken, setDailyToken] = useAtom(dailyTokenAtom);
  const [tokenExpiry, setTokenExpiry] = useAtom(dailyTokenExpiryAtom);
  const [isRefreshing, setIsRefreshing] = useAtom(dailyTokenRefreshingAtom);

  // Check if token is expiring soon (within 5 minutes)
  const isTokenExpiringSoon =
    tokenExpiry && tokenExpiry - Date.now() < 5 * 60 * 1000;
  const isTokenExpired = tokenExpiry && Date.now() >= tokenExpiry;

  // Refresh token function
  const refreshToken = useCallback(async () => {
    if (!sessionCode || !participantName) return null;

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

      Logger.log("Daily token refreshed successfully");
      return tokenResponse.token;
    } catch (error) {
      Logger.error("Failed to refresh Daily token:", error);
      throw error;
    } finally {
      setIsRefreshing(false);
    }
  }, [
    sessionCode,
    participantName,
    setDailyToken,
    setTokenExpiry,
    setIsRefreshing,
  ]);

  // Auto-refresh token when it's expiring or expired
  useEffect(() => {
    if (isTokenExpiringSoon || isTokenExpired || !dailyToken) {
      refreshToken().catch((error) => {
        Logger.error("Auto token refresh failed:", error);
      });
    }
  }, [isTokenExpiringSoon, isTokenExpired, dailyToken, refreshToken]);

  // Set up periodic refresh (every 4 minutes to be safe)
  useEffect(() => {
    if (!sessionCode || !participantName) return;

    const interval = setInterval(
      () => {
        if (dailyToken && !isRefreshing) {
          refreshToken().catch((error) => {
            Logger.error("Periodic token refresh failed:", error);
          });
        }
      },
      4 * 60 * 1000,
    ); // 4 minutes

    return () => clearInterval(interval);
  }, [sessionCode, participantName, dailyToken, isRefreshing, refreshToken]);

  return {
    token: dailyToken,
    isExpiring: isTokenExpiringSoon,
    isExpired: isTokenExpired,
    isRefreshing,
    refreshToken,
  };
};
