import { Logger } from "./logger";
import { useState, useEffect, useMemo } from "react";
import { getSessionIdByCode, getDailyRoom } from "./mutations";

interface SessionDataHookState {
  sessionId: string | null;
  dailyRoom: {
    room_url: string;
    ready: boolean;
  } | null;
  loading: boolean;
  error: string | null;
}

/**
 * Consolidated hook for session data fetching
 * Prevents duplicate calls to getSessionIdByCode and getDailyRoom
 * between GameSetup and Lobby pages
 */
export const useSessionData = (
  sessionCode: string | null,
): SessionDataHookState => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [dailyRoom, setDailyRoom] =
    useState<SessionDataHookState["dailyRoom"]>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoize the session code to prevent unnecessary re-fetches
  const memoizedSessionCode = useMemo(() => sessionCode, [sessionCode]);

  useEffect(() => {
    let isCancelled = false;

    const fetchSessionData = async () => {
      if (!memoizedSessionCode) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // First resolve session ID
        const resolvedSessionId = await getSessionIdByCode(memoizedSessionCode);

        if (isCancelled) return;

        setSessionId(resolvedSessionId);

        // Now fetch Daily room data with the resolved session ID
        if (resolvedSessionId) {
          try {
            const roomData = await getDailyRoom(resolvedSessionId);
            if (!isCancelled) {
              setDailyRoom(roomData);
            }
          } catch (roomError) {
            // Daily room might not exist yet - this is not necessarily an error
            Logger.warn("Daily room not found:", roomError);
            if (!isCancelled) {
              setDailyRoom(null);
            }
          }
        }
      } catch (sessionError) {
        if (!isCancelled) {
          setError(
            sessionError instanceof Error
              ? sessionError.message
              : "Failed to fetch session data",
          );
          setSessionId(null);
          setDailyRoom(null);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    fetchSessionData();

    // Cleanup function to prevent state updates if component unmounts
    return () => {
      isCancelled = true;
    };
  }, [memoizedSessionCode]);

  return {
    sessionId,
    dailyRoom,
    loading,
    error,
  };
};

/**
 * Hook specifically for session ID resolution
 * Can be used when only session ID is needed without Daily room data
 */
export const useSessionId = (sessionCode: string | null) => {
  const { sessionId, loading, error } = useSessionData(sessionCode);
  return { sessionId, loading, error };
};
