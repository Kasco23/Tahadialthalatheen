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

    const fetchDailyRoomData = async (sessionId: string) => {
      try {
        const roomData = await getDailyRoom(sessionId);
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
    };

    const handleSessionError = (sessionError: unknown) => {
      if (isCancelled) return;
      
      setError(
        sessionError instanceof Error
          ? sessionError.message
          : "Failed to fetch session data",
      );
      setSessionId(null);
      setDailyRoom(null);
    };

    const resolveSessionData = async (sessionCode: string) => {
      const resolvedSessionId = await getSessionIdByCode(sessionCode);
      
      if (isCancelled) return null;
      
      setSessionId(resolvedSessionId);
      
      if (resolvedSessionId) {
        await fetchDailyRoomData(resolvedSessionId);
      }
      
      return resolvedSessionId;
    };

    const fetchSessionData = async () => {
      if (!memoizedSessionCode) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        await resolveSessionData(memoizedSessionCode);
      } catch (sessionError) {
        handleSessionError(sessionError);
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
