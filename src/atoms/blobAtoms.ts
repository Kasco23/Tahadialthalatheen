/**
 * Blob-Backed Jotai Atoms
 *
 * Provides reactive state management with automatic persistence to Netlify Blobs.
 * Uses optimistic updates with error handling and multi-layer fallback.
 *
 * Architecture:
 * - Base atoms: Hold the current state in memory
 * - Derived atoms: Provide read/write interface with automatic Blob sync
 * - onMount: Load initial data from Blobs on first mount
 * - Write: Update local state immediately, save to Blobs asynchronously
 *
 * Fallback chain (5 layers):
 * 1. Memory (Jotai atom state)
 * 2. Browser Cache API (5min TTL)
 * 3. Netlify Blobs (strong consistency)
 * 4. localStorage (offline fallback)
 * 5. Error state
 */

import { atom } from "jotai";
import type { SessionBlobData, ParticipantBlobData } from "../lib/blobsManager";
import {
  getSessionBlob,
  saveSessionBlob,
  updateSessionBlob,
  getParticipantBlob,
  saveParticipantBlob,
} from "../lib/blobsManager";

// Logger utility for debugging
const Logger = {
  log: (...args: unknown[]) => console.log(...args),
  warn: (...args: unknown[]) => console.warn(...args),
  error: (...args: unknown[]) => console.error(...args),
};

// ===========================
// Base Atoms (Internal State)
// ===========================

/**
 * Internal atom holding session blob data
 * Not exported - use sessionBlobAtom instead
 */
const _sessionBlobBaseAtom = atom<SessionBlobData | null>(null);

/**
 * Internal atom holding participant blob data
 * Not exported - use participantBlobAtom instead
 */
const _participantBlobBaseAtom = atom<ParticipantBlobData | null>(null);

/**
 * Loading state for session blob
 */
const sessionBlobLoadingAtom = atom<boolean>(false);

/**
 * Loading state for participant blob
 */
const participantBlobLoadingAtom = atom<boolean>(false);

/**
 * Error state for session blob operations
 */
const sessionBlobErrorAtom = atom<string | null>(null);

/**
 * Error state for participant blob operations
 */
const participantBlobErrorAtom = atom<string | null>(null);

// ===========================
// Session Blob Atom
// ===========================

/**
 * Session Blob Atom with automatic persistence
 *
 * Read: Returns current session blob data (loads from Blobs on first mount)
 * Write: Updates local state + saves to Blobs asynchronously
 *
 * Usage:
 * ```typescript
 * const [session, setSession] = useAtom(sessionBlobAtom);
 *
 * // Load session
 * setSession({ type: 'load', sessionId: 'abc123' });
 *
 * // Update session (optimistic)
 * setSession({ type: 'update', data: { phase: 'lobby' } });
 *
 * // Save complete session
 * setSession({ type: 'save', data: sessionBlobData });
 * ```
 */
export const sessionBlobAtom = atom(
  // Read function
  (get) => {
    const data = get(_sessionBlobBaseAtom);
    const loading = get(sessionBlobLoadingAtom);
    const error = get(sessionBlobErrorAtom);

    return {
      data,
      loading,
      error,
      isLoaded: data !== null,
    };
  },
  // Write function
  async (get, set, action: SessionBlobAction) => {
    try {
      if (action.type === "load") {
        // Load session from Blobs
        set(sessionBlobLoadingAtom, true);
        set(sessionBlobErrorAtom, null);

        Logger.log("🔄 [sessionBlobAtom] Loading session:", action.sessionId);

        const result = await getSessionBlob(
          action.sessionId,
          action.useCache ?? true,
        );

        if (result.success && result.data) {
          set(_sessionBlobBaseAtom, result.data);
          Logger.log("✅ [sessionBlobAtom] Session loaded:", {
            source: result.source,
            cached: result.cached,
            sessionId: action.sessionId,
          });
        } else {
          set(sessionBlobErrorAtom, result.error || "Failed to load session");
          Logger.warn(
            "⚠️ [sessionBlobAtom] Session load failed:",
            result.error,
          );
        }

        set(sessionBlobLoadingAtom, false);
      } else if (action.type === "save") {
        // Save complete session to Blobs
        set(sessionBlobErrorAtom, null);

        Logger.log(
          "💾 [sessionBlobAtom] Saving session:",
          action.data.session_id,
        );

        // Optimistic update: Update local state immediately
        set(_sessionBlobBaseAtom, action.data);

        // Async save to Blobs
        const result = await saveSessionBlob(action.data);

        if (result.success) {
          Logger.log("✅ [sessionBlobAtom] Session saved successfully");
        } else {
          // Rollback on failure (optional - can keep optimistic state)
          Logger.error(
            "❌ [sessionBlobAtom] Session save failed:",
            result.error,
          );
          set(sessionBlobErrorAtom, result.error || "Failed to save session");

          if (action.rollbackOnError) {
            set(_sessionBlobBaseAtom, null);
            Logger.warn("🔄 [sessionBlobAtom] Rolled back optimistic update");
          }
        }
      } else if (action.type === "update") {
        // Partial update (merge with existing session)
        const currentSession = get(_sessionBlobBaseAtom);

        if (!currentSession) {
          Logger.warn("⚠️ [sessionBlobAtom] Cannot update: No session loaded");
          set(sessionBlobErrorAtom, "No session loaded");
          return;
        }

        Logger.log(
          "🔄 [sessionBlobAtom] Updating session:",
          currentSession.session_id,
        );

        // Optimistic update
        const updatedSession = { ...currentSession, ...action.data };
        set(_sessionBlobBaseAtom, updatedSession);

        // Async save to Blobs
        const result = await updateSessionBlob(
          currentSession.session_id,
          action.data,
        );

        if (result.success) {
          Logger.log("✅ [sessionBlobAtom] Session updated successfully");
        } else {
          Logger.error(
            "❌ [sessionBlobAtom] Session update failed:",
            result.error,
          );
          set(sessionBlobErrorAtom, result.error || "Failed to update session");

          if (action.rollbackOnError) {
            set(_sessionBlobBaseAtom, currentSession);
            Logger.warn("🔄 [sessionBlobAtom] Rolled back optimistic update");
          }
        }
      } else if (action.type === "clear") {
        // Clear session from memory
        Logger.log("🗑️ [sessionBlobAtom] Clearing session");
        set(_sessionBlobBaseAtom, null);
        set(sessionBlobErrorAtom, null);
      }
    } catch (error) {
      Logger.error("❌ [sessionBlobAtom] Unexpected error:", error);
      set(
        sessionBlobErrorAtom,
        error instanceof Error ? error.message : "Unknown error",
      );
      set(sessionBlobLoadingAtom, false);
    }
  },
);

// ===========================
// Participant Blob Atom
// ===========================

/**
 * Participant Blob Atom with automatic persistence
 *
 * Read: Returns current participant blob data (loads from Blobs on first mount)
 * Write: Updates local state + saves to Blobs asynchronously
 *
 * Usage:
 * ```typescript
 * const [participant, setParticipant] = useAtom(participantBlobAtom);
 *
 * // Load participant
 * setParticipant({ type: 'load', participantId: 'xyz789' });
 *
 * // Update participant (optimistic)
 * setParticipant({ type: 'update', data: { session_presence: 'active' } });
 *
 * // Save complete participant
 * setParticipant({ type: 'save', data: participantBlobData });
 * ```
 */
export const participantBlobAtom = atom(
  // Read function
  (get) => {
    const data = get(_participantBlobBaseAtom);
    const loading = get(participantBlobLoadingAtom);
    const error = get(participantBlobErrorAtom);

    return {
      data,
      loading,
      error,
      isLoaded: data !== null,
    };
  },
  // Write function
  async (get, set, action: ParticipantBlobAction) => {
    try {
      if (action.type === "load") {
        // Load participant from Blobs
        set(participantBlobLoadingAtom, true);
        set(participantBlobErrorAtom, null);

        Logger.log(
          "🔄 [participantBlobAtom] Loading participant:",
          action.participantId,
        );

        const result = await getParticipantBlob(
          action.participantId,
          action.useCache ?? true,
        );

        if (result.success && result.data) {
          set(_participantBlobBaseAtom, result.data);
          Logger.log("✅ [participantBlobAtom] Participant loaded:", {
            source: result.source,
            cached: result.cached,
            participantId: action.participantId,
          });
        } else {
          set(
            participantBlobErrorAtom,
            result.error || "Failed to load participant",
          );
          Logger.warn(
            "⚠️ [participantBlobAtom] Participant load failed:",
            result.error,
          );
        }

        set(participantBlobLoadingAtom, false);
      } else if (action.type === "save") {
        // Save complete participant to Blobs
        set(participantBlobErrorAtom, null);

        Logger.log(
          "💾 [participantBlobAtom] Saving participant:",
          action.data.participant_id,
        );

        // Optimistic update: Update local state immediately
        set(_participantBlobBaseAtom, action.data);

        // Async save to Blobs
        const result = await saveParticipantBlob(action.data);

        if (result.success) {
          Logger.log("✅ [participantBlobAtom] Participant saved successfully");
        } else {
          // Rollback on failure (optional - can keep optimistic state)
          Logger.error(
            "❌ [participantBlobAtom] Participant save failed:",
            result.error,
          );
          set(
            participantBlobErrorAtom,
            result.error || "Failed to save participant",
          );

          if (action.rollbackOnError) {
            set(_participantBlobBaseAtom, null);
            Logger.warn(
              "🔄 [participantBlobAtom] Rolled back optimistic update",
            );
          }
        }
      } else if (action.type === "update") {
        // Partial update (merge with existing participant)
        const currentParticipant = get(_participantBlobBaseAtom);

        if (!currentParticipant) {
          Logger.warn(
            "⚠️ [participantBlobAtom] Cannot update: No participant loaded",
          );
          set(participantBlobErrorAtom, "No participant loaded");
          return;
        }

        Logger.log(
          "🔄 [participantBlobAtom] Updating participant:",
          currentParticipant.participant_id,
        );

        // Optimistic update
        const updatedParticipant = { ...currentParticipant, ...action.data };
        set(_participantBlobBaseAtom, updatedParticipant);

        // Async save to Blobs (note: no updateParticipantBlob helper, use saveParticipantBlob)
        const result = await saveParticipantBlob(updatedParticipant);

        if (result.success) {
          Logger.log(
            "✅ [participantBlobAtom] Participant updated successfully",
          );
        } else {
          Logger.error(
            "❌ [participantBlobAtom] Participant update failed:",
            result.error,
          );
          set(
            participantBlobErrorAtom,
            result.error || "Failed to update participant",
          );

          if (action.rollbackOnError) {
            set(_participantBlobBaseAtom, currentParticipant);
            Logger.warn(
              "🔄 [participantBlobAtom] Rolled back optimistic update",
            );
          }
        }
      } else if (action.type === "clear") {
        // Clear participant from memory
        Logger.log("🗑️ [participantBlobAtom] Clearing participant");
        set(_participantBlobBaseAtom, null);
        set(participantBlobErrorAtom, null);
      }
    } catch (error) {
      Logger.error("❌ [participantBlobAtom] Unexpected error:", error);
      set(
        participantBlobErrorAtom,
        error instanceof Error ? error.message : "Unknown error",
      );
      set(participantBlobLoadingAtom, false);
    }
  },
);

// ===========================
// Derived Atoms
// ===========================

/**
 * Computed atom: Current session ID
 */
export const currentSessionIdAtom = atom((get) => {
  const { data } = get(sessionBlobAtom);
  return data?.session_id || null;
});

/**
 * Computed atom: Current session code
 */
export const currentSessionCodeAtom = atom((get) => {
  const { data } = get(sessionBlobAtom);
  return data?.session_code || null;
});

/**
 * Computed atom: Current session phase
 */
export const currentSessionPhaseAtom = atom((get) => {
  const { data } = get(sessionBlobAtom);
  return data?.phase || null;
});

/**
 * Computed atom: Current participant ID
 */
export const currentParticipantIdAtom = atom((get) => {
  const { data } = get(participantBlobAtom);
  return data?.participant_id || null;
});

/**
 * Computed atom: Current participant role
 */
export const currentParticipantRoleAtom = atom((get) => {
  const { data } = get(participantBlobAtom);
  return data?.role || null;
});

/**
 * Computed atom: Current participant preferences (flag, team, team_logo_url)
 */
export const currentParticipantPreferencesAtom = atom((get) => {
  const { data } = get(participantBlobAtom);
  if (!data) return null;

  return {
    preferred_flag: data.preferred_flag,
    preferred_team: data.preferred_team,
    flag: data.flag,
    team: data.team,
    team_logo_url: data.team_logo_url,
    audio_enabled: data.audio_enabled,
    video_enabled: data.video_enabled,
  };
});

// ===========================
// Action Types
// ===========================

type SessionBlobAction =
  | { type: "load"; sessionId: string; useCache?: boolean }
  | { type: "save"; data: SessionBlobData; rollbackOnError?: boolean }
  | {
      type: "update";
      data: Partial<SessionBlobData>;
      rollbackOnError?: boolean;
    }
  | { type: "clear" };

type ParticipantBlobAction =
  | { type: "load"; participantId: string; useCache?: boolean }
  | { type: "save"; data: ParticipantBlobData; rollbackOnError?: boolean }
  | {
      type: "update";
      data: Partial<ParticipantBlobData>;
      rollbackOnError?: boolean;
    }
  | { type: "clear" };

// ===========================
// Helper Functions
// ===========================

/**
 * Helper to check if session is loaded
 */
export const isSessionLoadedAtom = atom((get) => {
  const { isLoaded } = get(sessionBlobAtom);
  return isLoaded;
});

/**
 * Helper to check if participant is loaded
 */
export const isParticipantLoadedAtom = atom((get) => {
  const { isLoaded } = get(participantBlobAtom);
  return isLoaded;
});

/**
 * Helper to get both session and participant states
 */
export const blobStatesAtom = atom((get) => {
  const session = get(sessionBlobAtom);
  const participant = get(participantBlobAtom);

  return {
    session,
    participant,
    isFullyLoaded: session.isLoaded && participant.isLoaded,
    hasErrors: session.error !== null || participant.error !== null,
  };
});
