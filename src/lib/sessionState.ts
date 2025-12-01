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

const edgeBases = (): string[] => {
  const bases = ["/.netlify/edge-functions"];

  if (typeof window !== "undefined") {
    const { hostname, port } = window.location;
    const isLocal =
      hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";

    if (isLocal && port === "5173") {
      bases.unshift("http://localhost:3000/.netlify/edge-functions");
    }
  }

  return bases;
};

const isPlainViteDev =
  typeof window !== "undefined" &&
  window.location.hostname === "localhost" &&
  window.location.port === "5173";

let sessionStateDisabled = isPlainViteDev;
let sessionStateReason: string | null = null;
let sessionStateLogged = false;

const disableSessionState = (reason: string) => {
  sessionStateDisabled = true;
  sessionStateReason = reason;
  if (!sessionStateLogged) {
    Logger.info("Session state polling disabled", { reason });
    sessionStateLogged = true;
  }
};

const callSessionState = async (
  path: string,
  init: RequestInit
): Promise<Response | null> => {
  if (sessionStateDisabled) return null;

  const errors: string[] = [];

  for (const base of edgeBases()) {
    try {
      const response = await fetch(`${base}${path}`, init);
      if (response.ok || response.status === 404) return response;
      errors.push(`${base} -> ${response.status} ${response.statusText}`);
    } catch (error) {
      errors.push(
        `${base} -> ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  disableSessionState(
    errors.length
      ? errors.join(" | ")
      : sessionStateReason || "Edge functions unavailable"
  );
  return null;
};

/**
 * Get current session state
 */
export async function getSessionState(
  sessionId: string,
): Promise<SessionState | null> {
  try {
    if (sessionStateDisabled) return null;

    const response = await callSessionState(
      `/session-state?sessionId=${encodeURIComponent(sessionId)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (!response) return null;

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
    const response = await callSessionState(`/session-state`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sessionId,
        state: updates,
      }),
    });

    if (!response) return null;

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
    const response = await callSessionState(`/session-state`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sessionId,
        state,
      }),
    });

    if (!response) return null;

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
    const response = await callSessionState(`/session-state`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sessionId,
      }),
    });

    if (!response) return false;

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
  if (sessionStateDisabled) {
    Logger.info("Session state subscription skipped", {
      reason: sessionStateReason || "Edge functions disabled in dev",
    });
    return () => undefined;
  }

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
