import { Logger } from "./logger";

/**
 * Session State Store
 *
 * Client-side interface for managing session-level state in Netlify Blobs.
 * This is separate from participant-level session data and is used for
 * coordinating session-wide events like room creation, phase changes, etc.
 *
 * Use Cases:
 * - GameSetup creates Daily room → updates session state
 * - Lobby polls session state → detects room creation → updates UI
 * - Host changes quiz phase → all participants see updated phase
 */

export interface SessionState {
  dailyRoomCreated?: boolean;
  dailyRoomUrl?: string;
  phase?: string;
  segmentsConfigured?: boolean;
  participantCount?: number;
  lastUpdated?: number;
  [key: string]: unknown;
}

/**
 * Get current session state
 */
export async function getSessionState(
  sessionId: string,
): Promise<SessionState | null> {
  try {
    const response = await fetch(
      `/.netlify/edge-functions/session-state?sessionId=${encodeURIComponent(sessionId)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (response.status === 404) {
      // Session state doesn't exist yet - this is normal for new sessions
      return null;
    }

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: "Unknown error" }));
      Logger.error("Failed to get session state:", error);
      return null;
    }

    const result = await response.json();
    return result.success ? result.state : null;
  } catch (error) {
    Logger.error("Error getting session state:", error);
    return null;
  }
}

/**
 * Update session state (partial update - merges with existing state)
 */
export async function updateSessionState(
  sessionId: string,
  updates: Partial<SessionState>,
): Promise<SessionState | null> {
  try {
    const response = await fetch(`/.netlify/edge-functions/session-state`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sessionId,
        state: updates,
      }),
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: "Unknown error" }));
      Logger.error("Failed to update session state:", error);
      return null;
    }

    const result = await response.json();
    Logger.log("Session state updated:", result.state);
    return result.success ? result.state : null;
  } catch (error) {
    Logger.error("Error updating session state:", error);
    return null;
  }
}

/**
 * Replace entire session state (full replacement)
 */
export async function setSessionState(
  sessionId: string,
  state: SessionState,
): Promise<SessionState | null> {
  try {
    const response = await fetch(`/.netlify/edge-functions/session-state`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sessionId,
        state,
      }),
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: "Unknown error" }));
      Logger.error("Failed to set session state:", error);
      return null;
    }

    const result = await response.json();
    Logger.log("Session state set:", result.state);
    return result.success ? result.state : null;
  } catch (error) {
    Logger.error("Error setting session state:", error);
    return null;
  }
}

/**
 * Delete session state
 */
export async function deleteSessionState(sessionId: string): Promise<boolean> {
  try {
    const response = await fetch(`/.netlify/edge-functions/session-state`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sessionId,
      }),
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: "Unknown error" }));
      Logger.error("Failed to delete session state:", error);
      return false;
    }

    const result = await response.json();
    Logger.log("Session state deleted");
    return result.success;
  } catch (error) {
    Logger.error("Error deleting session state:", error);
    return false;
  }
}

/**
 * Subscribe to session state changes with polling
 * Returns a cleanup function to stop polling
 */
export function subscribeToSessionState(
  sessionId: string,
  callback: (state: SessionState | null) => void,
  intervalMs: number = 3000,
): () => void {
  let lastState: SessionState | null = null;
  let lastUpdated: number | undefined = undefined;

  const poll = async () => {
    const state = await getSessionState(sessionId);

    // Only trigger callback if state actually changed
    if (state && state.lastUpdated !== lastUpdated) {
      lastUpdated = state.lastUpdated;
      lastState = state;
      callback(state);
    } else if (!state && lastState !== null) {
      // State was deleted
      lastState = null;
      callback(null);
    }
  };

  // Initial poll
  poll();

  // Set up interval
  const intervalId = setInterval(poll, intervalMs);

  // Return cleanup function
  return () => {
    clearInterval(intervalId);
  };
}
