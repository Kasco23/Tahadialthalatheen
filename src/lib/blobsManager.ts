/**
 * Netlify Blobs Manager
 *
 * Comprehensive client-side interface for managing application data in Netlify Blobs.
 * This provides a smart, dynamic layer that integrates seamlessly with:
 * - Supabase (database of record)
 * - Jotai atoms (in-memory state)
 * - LocalStorage (offline fallback)
 * - Browser Cache API (performance optimization)
 *
 * Architecture Philosophy:
 * - Blobs for cross-device session persistence
 * - Supabase for authoritative data
 * - Jotai for reactive UI state
 * - localStorage for offline resilience
 * - Cache API for performance
 *
 * Store Structure:
 * - `sessions` (global): Session-level data, configs, host info, Daily room info
 * - `participants` (global): Per-participant data across sessions and devices
 * - `lobby-snapshots` (deploy): Real-time lobby state snapshots for quick recovery
 */

import { Logger } from "./logger";

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Session-level data stored in Blobs
 * Represents configuration and state for an entire quiz session
 */
export interface SessionBlobData {
  session_id: string;
  session_code: string;
  host_profile_id: string | null;

  // Daily.co Video Integration
  daily_room_url: string | null;
  daily_room_name: string | null;
  daily_room_created_at: string | null;

  // Session Configuration
  phase:
    | "Setup"
    | "Lobby"
    | "Full Lobby"
    | "In-Progress"
    | "Tie-Breaker"
    | "Results"
    | "Review";
  game_state: "pre-quiz" | "active" | "post-quiz" | "concluded";
  segments_configured: boolean;

  // Participant Tracking
  active_participant_ids: string[];
  participant_count: number;
  max_participants: number;

  // Metadata
  created_at: string;
  last_updated: string;
  last_sync_with_supabase: string | null;

  // Custom extensible data
  metadata?: Record<string, unknown>;
}

/**
 * Participant-level data stored in Blobs
 * Represents individual user data that persists across devices and sessions
 */
export interface ParticipantBlobData {
  participant_id: string;
  profile_id: string | null;

  // Identity & Display
  name: string;
  username: string | null;
  flag: string;
  team_url: string | null;
  team_logo_url: string | null;

  // Session Relationship
  current_session_id: string | null;
  current_session_code: string | null;
  role: "Host" | "Home" | "Away" | "GameMaster" | "Guest";

  // Presence & Connection
  session_presence: "NotJoined" | "Joined" | "Disconnected";
  video_presence: boolean;
  last_heartbeat: string;
  join_at: string | null;
  disconnect_at: string | null;

  // Device Tracking (for cross-device continuity)
  device_id: string; // Browser fingerprint or UUID
  last_device_sync: string;

  // User Preferences (persists across sessions)
  preferred_flag: string | null;
  preferred_team_url: string | null;
  audio_enabled: boolean;
  video_enabled: boolean;

  // Metadata
  created_at: string;
  last_updated: string;
  session_history: string[]; // Recent session IDs
  active_games?: Array<{
    session_id: string;
    session_code: string;
    role: "Host" | "Home" | "Away" | "GameMaster" | "Guest";
    session_presence: "NotJoined" | "Joined" | "Disconnected";
    phase?: string;
    game_state?: string;
    host_name?: string | null;
    participant_count?: number;
    has_daily_room?: boolean;
    invited?: boolean;
    last_seen_at?: string;
  }>;

  // Custom extensible data
  metadata?: Record<string, unknown>;
}

/**
 * Lobby snapshot data for quick recovery
 * Captures real-time lobby state for resilience
 */
export interface LobbySnapshotData {
  session_id: string;
  session_code: string;
  snapshot_timestamp: string;

  // Participant Snapshots
  participants: Array<{
    participant_id: string;
    name: string;
    role: string;
    flag: string;
    team_url: string | null;
    session_presence: string;
    video_presence: boolean;
    join_at: string | null;
  }>;

  // Session State
  phase: string;
  daily_room_url: string | null;
  participant_count: number;
}

/**
 * Quiz Chosen Questions data stored in Blobs
 * Represents the selected questions for a quiz session
 */
export interface QuizQuestionsBlob {
  session_id: string;
  session_code: string;
  created_at: string;
  last_updated: string;

  // Questions grouped by segment
  questions: Array<{
    question_id: string;
    segment_code: string;
    question_text: string;
    question_type: "list" | "buzz";
    answers: string | string[];
    total_answers_available?: number;
    display_order: number;
  }>;

  // Current quiz progress
  current_segment: string | null;
  current_question_index: number;
  completed_segments: string[];

  // Strike counters per participant (participant_id -> strike count)
  strike_counts?: Record<string, number>;
}

/**
 * Blob operation result with error handling
 */
export interface BlobResult<T> {
  success: boolean;
  data: T | null;
  error: string | null;
  cached: boolean; // Whether data came from cache
  source: "blob" | "cache" | "localStorage" | "supabase" | "disabled";
}

// ============================================================================
// Cache Management
// ============================================================================

const CACHE_NAME = "tahadialthalatheen-blobs-v1";
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  etag?: string;
}

/**
 * Convert cache key to valid URL for Cache API
 * Cache API only accepts HTTP/HTTPS URLs, not custom schemes
 */
function keyToUrl(key: string): string {
  // Use a dummy domain with the key as path
  return `https://cache.local/${encodeURIComponent(key)}`;
}

/**
 * Cache wrapper for Blob operations
 * Uses browser Cache API for HTTP responses, memory for JSON
 */
class BlobCache {
  private memoryCache = new Map<string, CacheEntry<unknown>>();

  async get<T>(key: string): Promise<T | null> {
    // Check memory cache first
    const memEntry = this.memoryCache.get(key);
    if (memEntry && Date.now() - memEntry.timestamp < CACHE_TTL_MS) {
      return memEntry.data as T;
    }

    // Check Cache API
    try {
      const cache = await caches.open(CACHE_NAME);
      const response = await cache.match(keyToUrl(key));

      if (response) {
        const cachedData = await response.json();
        const age = Date.now() - cachedData.timestamp;

        if (age < CACHE_TTL_MS) {
          Logger.log(`[BlobCache] Cache API hit for key: ${key}`);
          // Update memory cache
          this.memoryCache.set(key, cachedData);
          return cachedData.data as T;
        }
      }
    } catch (error) {
      Logger.warn(`[BlobCache] Cache API error for key ${key}:`, error);
    }

    return null;
  }

  async set<T>(key: string, data: T, etag?: string): Promise<void> {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      etag,
    };

    // Update memory cache
    this.memoryCache.set(key, entry);

    // Update Cache API
    try {
      const cache = await caches.open(CACHE_NAME);
      const response = new Response(JSON.stringify(entry), {
        headers: { "Content-Type": "application/json" },
      });
      await cache.put(keyToUrl(key), response);
    } catch (error) {
      Logger.warn(
        `[BlobCache] Failed to cache to Cache API for key ${key}:`,
        error
      );
    }
  }

  async invalidate(key: string): Promise<void> {
    this.memoryCache.delete(key);

    try {
      const cache = await caches.open(CACHE_NAME);
      await cache.delete(keyToUrl(key));
    } catch (error) {
      Logger.warn(
        `[BlobCache] Failed to invalidate cache for key ${key}:`,
        error
      );
    }
  }

  async clear(): Promise<void> {
    this.memoryCache.clear();

    try {
      await caches.delete(CACHE_NAME);
    } catch (error) {
      Logger.warn("[BlobCache] Failed to clear Cache API:", error);
    }
  }
}

const cache = new BlobCache();

// ============================================================================
// Runtime guards to keep Blobs non-disruptive in dev
// ============================================================================

// Netlify Functions/Edge are not available when hitting the raw Vite dev server (5173)
const isPlainViteDev =
  typeof window !== "undefined" &&
  window.location.hostname === "localhost" &&
  window.location.port === "5173";

let blobServiceDisabled = isPlainViteDev;
let blobDisableReason = isPlainViteDev
  ? "Blob/Edge functions are unavailable on the Vite dev server; skipping blob calls."
  : null;
let blobDisableLogged = false;

const markBlobServiceDisabled = (reason: string) => {
  blobServiceDisabled = true;
  blobDisableReason = reason;
  if (!blobDisableLogged) {
    Logger.info("Blobs disabled for this session", { reason });
    blobDisableLogged = true;
  }
};

const isBlobDisabled = () => blobServiceDisabled;

const disabledBlobResult = <T>(
  data: T | null,
  successWhenDisabled = false
): BlobResult<T> => ({
  success: successWhenDisabled,
  data,
  error: blobDisableReason,
  cached: false,
  source: "disabled",
});

// ============================================================================
// Session Blob Operations
// ============================================================================

/**
 * Get session data from Blobs with caching and fallback
 */
export async function getSessionBlob(
  sessionId: string,
  useCache = true
): Promise<BlobResult<SessionBlobData>> {
  const cacheKey = `session:${sessionId}`;

  if (isBlobDisabled()) {
    return disabledBlobResult<SessionBlobData>(null);
  }

  // Try cache first
  if (useCache) {
    const cached = await cache.get<SessionBlobData>(cacheKey);
    if (cached) {
      return {
        success: true,
        data: cached,
        error: null,
        cached: true,
        source: "cache",
      };
    }
  }

  // Fetch from Netlify Blobs via Edge Function
  try {
    const response = await fetch(
      `/.netlify/edge-functions/session-state?sessionId=${encodeURIComponent(sessionId)}`,
      {
        method: "GET",
      }
    );

    if (!response.ok) {
      // Check if it's a dev environment error
      if (response.status === 503) {
        const result = await response.json().catch(() => ({}));
        if (result.dev) {
          // Silently fail in development - Blobs not available
          return {
            success: false,
            data: null,
            error: "Blobs unavailable in dev",
            cached: false,
            source: "blob",
          };
        }
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    if (result.success && result.state) {
      const sessionData = result.state as SessionBlobData;

      // Update cache
      await cache.set(cacheKey, sessionData);

      return {
        success: true,
        data: sessionData,
        error: null,
        cached: false,
        source: "blob",
      };
    }

    return {
      success: false,
      data: null,
      error: "Session not found in blobs",
      cached: false,
      source: "blob",
    };
  } catch (error) {
    Logger.warn(`[getSessionBlob] Error fetching session ${sessionId}:`, error);

    markBlobServiceDisabled(
      error instanceof Error ? error.message : "Blob session fetch failed"
    );

    return disabledBlobResult<SessionBlobData>(null);
  }
}

/**
 * Save session data to Blobs with cache invalidation
 */
export async function saveSessionBlob(
  sessionData: SessionBlobData
): Promise<BlobResult<SessionBlobData>> {
  const cacheKey = `session:${sessionData.session_id}`;

  if (isBlobDisabled()) {
    return disabledBlobResult(sessionData, true);
  }

  try {
    // Update last_updated timestamp
    const dataToSave = {
      ...sessionData,
      last_updated: new Date().toISOString(),
    };

    const response = await fetch("/.netlify/edge-functions/session-state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: sessionData.session_id,
        state: dataToSave,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    if (result.success) {
      // Update cache
      await cache.set(cacheKey, dataToSave);

      return {
        success: true,
        data: dataToSave,
        error: null,
        cached: false,
        source: "blob",
      };
    }

    return {
      success: false,
      data: null,
      error: "Failed to save session to blobs",
      cached: false,
      source: "blob",
    };
  } catch (error) {
    Logger.warn(
      `[saveSessionBlob] Error saving session ${sessionData.session_id}:`,
      error
    );

    markBlobServiceDisabled(
      error instanceof Error ? error.message : "Blob session save failed"
    );

    return disabledBlobResult(sessionData, true);
  }
}

/**
 * Update session data partially (merges with existing)
 */
export async function updateSessionBlob(
  sessionId: string,
  updates: Partial<SessionBlobData>
): Promise<BlobResult<SessionBlobData>> {
  const cacheKey = `session:${sessionId}`;

  try {
    const response = await fetch("/.netlify/edge-functions/session-state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        state: {
          ...updates,
          last_updated: new Date().toISOString(),
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    if (result.success && result.state) {
      const updatedData = result.state as SessionBlobData;

      // Update cache
      await cache.set(cacheKey, updatedData);

      return {
        success: true,
        data: updatedData,
        error: null,
        cached: false,
        source: "blob",
      };
    }

    return {
      success: false,
      data: null,
      error: "Failed to update session in blobs",
      cached: false,
      source: "blob",
    };
  } catch (error) {
    Logger.error(
      `[updateSessionBlob] Error updating session ${sessionId}:`,
      error
    );

    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : "Unknown error",
      cached: false,
      source: "blob",
    };
  }
}

// ============================================================================
// Participant Blob Operations
// ============================================================================

/**
 * Get participant data from Blobs with caching
 */
export async function getParticipantBlob(
  participantId: string,
  useCache = true
): Promise<BlobResult<ParticipantBlobData>> {
  const cacheKey = `participant:${participantId}`;

  if (isBlobDisabled()) {
    return disabledBlobResult<ParticipantBlobData>(null);
  }

  // Try cache first
  if (useCache) {
    const cached = await cache.get<ParticipantBlobData>(cacheKey);
    if (cached) {
      return {
        success: true,
        data: cached,
        error: null,
        cached: true,
        source: "cache",
      };
    }
  }

  // Fetch from Netlify Blobs via serverless function
  try {
    const response = await fetch(
      `/api/get-active-profile?userId=${encodeURIComponent(participantId)}`,
      {
        method: "GET",
      }
    );

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      const fallbackText = await response.text();
      Logger.warn("[getParticipantBlob] Unexpected response:", {
        contentType,
        preview: fallbackText.slice(0, 120),
      });
      throw new Error("Netlify Functions unavailable");
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    const participantData =
      (result.profile as ParticipantBlobData | undefined) ??
      (result.profileData as ParticipantBlobData | undefined) ??
      (result.data as ParticipantBlobData | undefined) ??
      null;

    if (result.success && participantData) {
      // Update cache
      await cache.set(cacheKey, participantData);

      return {
        success: true,
        data: participantData,
        error: null,
        cached: false,
        source: "blob",
      };
    }

    return {
      success: false,
      data: null,
      error: result.error || "Participant not found in blobs",
      cached: false,
      source: "blob",
    };
  } catch (error) {
    Logger.warn(
      `[getParticipantBlob] Error fetching participant ${participantId}:`,
      error
    );

    // Try localStorage fallback
    try {
      const localData = localStorage.getItem(`participant:${participantId}`);
      if (localData) {
        const parsedData = JSON.parse(localData) as ParticipantBlobData;
        return {
          success: true,
          data: parsedData,
          error: null,
          cached: false,
          source: "localStorage",
        };
      }
    } catch (localError) {
      Logger.warn(
        "[getParticipantBlob] localStorage fallback failed:",
        localError
      );
    }

    markBlobServiceDisabled(
      error instanceof Error ? error.message : "Blob participant fetch failed"
    );

    return disabledBlobResult<ParticipantBlobData>(null);
  }
}

/**
 * Save participant data to Blobs with localStorage backup
 */
export async function saveParticipantBlob(
  participantData: ParticipantBlobData
): Promise<BlobResult<ParticipantBlobData>> {
  const cacheKey = `participant:${participantData.participant_id}`;

  if (isBlobDisabled()) {
    return disabledBlobResult(participantData, true);
  }

  // Save to localStorage first (for offline resilience)
  try {
    localStorage.setItem(
      `participant:${participantData.participant_id}`,
      JSON.stringify(participantData)
    );
  } catch (error) {
    Logger.warn("[saveParticipantBlob] localStorage save failed:", error);
  }

  try {
    // Update last_updated timestamp
    const dataToSave = {
      ...participantData,
      last_updated: new Date().toISOString(),
    };

    const response = await fetch("/api/store-active-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: participantData.participant_id,
        profileData: dataToSave,
      }),
    });

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      const fallbackText = await response.text();
      Logger.warn("[saveParticipantBlob] Unexpected response:", {
        contentType,
        preview: fallbackText.slice(0, 120),
      });
      return {
        success: true,
        data: dataToSave,
        error: "Netlify Functions unavailable (dev mode)",
        cached: false,
        source: "localStorage",
      };
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    if (result.success) {
      const savedRecord =
        (result.profile as ParticipantBlobData | undefined) ?? dataToSave;

      // Update cache
      await cache.set(cacheKey, savedRecord);

      return {
        success: true,
        data: savedRecord,
        error: null,
        cached: false,
        source: "blob",
      };
    }

    return {
      success: false,
      data: null,
      error: "Failed to save participant to blobs",
      cached: false,
      source: "blob",
    };
  } catch (error) {
    Logger.warn(
      `[saveParticipantBlob] Error saving participant ${participantData.participant_id}:`,
      error
    );

    markBlobServiceDisabled(
      error instanceof Error ? error.message : "Blob participant save failed"
    );

    // Return success if localStorage save succeeded (offline mode)
    return disabledBlobResult(participantData, true);
  }
}

// ============================================================================
// Lobby Snapshot Operations (Deploy-scoped for session recovery)
// ============================================================================

/**
 * Save lobby snapshot for quick recovery
 */
export async function saveLobbySnapshot(
  snapshotData: LobbySnapshotData
): Promise<BlobResult<LobbySnapshotData>> {
  if (isBlobDisabled()) {
    return disabledBlobResult<LobbySnapshotData>(snapshotData, true);
  }

  try {
    const dataToSave = {
      ...snapshotData,
      snapshot_timestamp: new Date().toISOString(),
    };

    // Store in session-state edge function with snapshot prefix
    const response = await fetch("/.netlify/edge-functions/session-state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: `snapshot:${snapshotData.session_id}`,
        state: dataToSave,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return {
      success: true,
      data: dataToSave,
      error: null,
      cached: false,
      source: "blob",
    };
  } catch (error) {
    Logger.warn(`[saveLobbySnapshot] Error:`, error);

    markBlobServiceDisabled(
      error instanceof Error ? error.message : "Blob snapshot save failed"
    );

    return disabledBlobResult<LobbySnapshotData>(snapshotData, true);
  }
}

/**
 * Get lobby snapshot for recovery
 */
export async function getLobbySnapshot(
  sessionId: string
): Promise<BlobResult<LobbySnapshotData>> {
  if (isBlobDisabled()) {
    return disabledBlobResult<LobbySnapshotData>(null);
  }

  try {
    const response = await fetch(
      `/.netlify/edge-functions/session-state?sessionId=${encodeURIComponent(`snapshot:${sessionId}`)}`,
      {
        method: "GET",
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    if (result.success && result.state) {
      return {
        success: true,
        data: result.state as LobbySnapshotData,
        error: null,
        cached: false,
        source: "blob",
      };
    }

    return {
      success: false,
      data: null,
      error: "Snapshot not found",
      cached: false,
      source: "blob",
    };
  } catch (error) {
    Logger.warn(`[getLobbySnapshot] Error:`, error);

    markBlobServiceDisabled(
      error instanceof Error ? error.message : "Blob snapshot fetch failed"
    );

    return disabledBlobResult<LobbySnapshotData>(null);
  }
}

// ============================================================================
// Quiz Questions Blob Operations
// ============================================================================

/**
 * Save quiz questions to Blobs
 * Stores the selected questions for a quiz session
 */
export async function saveQuizQuestions(
  sessionCode: string,
  sessionId: string,
  questions: Array<{
    question_id: string;
    segment_code: string;
    question_text: string;
    question_type: "list" | "buzz";
    answers: string | string[];
    total_answers_available?: number;
    display_order: number;
  }>
): Promise<BlobResult<QuizQuestionsBlob>> {
  const cacheKey = `quiz:${sessionCode}`;

  if (isBlobDisabled()) {
    return disabledBlobResult<QuizQuestionsBlob>(null, true);
  }

  try {
    const dataToSave: QuizQuestionsBlob = {
      session_id: sessionId,
      session_code: sessionCode,
      created_at: new Date().toISOString(),
      last_updated: new Date().toISOString(),
      questions,
      current_segment: null,
      current_question_index: 0,
      completed_segments: [],
    };

    const response = await fetch("/.netlify/edge-functions/session-state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: `quiz:${sessionCode}`,
        state: dataToSave,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    if (result.success) {
      // Update cache
      await cache.set(cacheKey, dataToSave);

      Logger.log(
        `[saveQuizQuestions] Saved ${questions.length} questions for session ${sessionCode}`
      );

      return {
        success: true,
        data: dataToSave,
        error: null,
        cached: false,
        source: "blob",
      };
    }

    return {
      success: false,
      data: null,
      error: "Failed to save quiz questions to blobs",
      cached: false,
      source: "blob",
    };
  } catch (error) {
    Logger.warn(
      `[saveQuizQuestions] Error saving questions for session ${sessionCode}:`,
      error
    );

    markBlobServiceDisabled(
      error instanceof Error ? error.message : "Blob quiz save failed"
    );

    return disabledBlobResult<QuizQuestionsBlob>(null, true);
  }
}

/**
 * Get quiz questions from Blobs with caching
 */
export async function getQuizQuestions(
  sessionCode: string,
  useCache = true
): Promise<BlobResult<QuizQuestionsBlob>> {
  const cacheKey = `quiz:${sessionCode}`;

  // Check cache first
  if (useCache) {
    const cached = await cache.get<QuizQuestionsBlob>(cacheKey);
    if (cached) {
      Logger.log(`[getQuizQuestions] Cache hit for session ${sessionCode}`);
      return {
        success: true,
        data: cached,
        error: null,
        cached: true,
        source: "cache",
      };
    }
  }

  if (isBlobDisabled()) {
    return disabledBlobResult<QuizQuestionsBlob>(null);
  }

  try {
    const response = await fetch(
      `/.netlify/edge-functions/session-state?sessionId=${encodeURIComponent(`quiz:${sessionCode}`)}`,
      {
        method: "GET",
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    if (result.success && result.state) {
      const quizData = result.state as QuizQuestionsBlob;

      // Update cache
      await cache.set(cacheKey, quizData);

      Logger.log(
        `[getQuizQuestions] Loaded ${quizData.questions.length} questions for session ${sessionCode}`
      );

      return {
        success: true,
        data: quizData,
        error: null,
        cached: false,
        source: "blob",
      };
    }

    return {
      success: false,
      data: null,
      error: "Quiz questions not found",
      cached: false,
      source: "blob",
    };
  } catch (error) {
    Logger.warn(
      `[getQuizQuestions] Error loading questions for session ${sessionCode}:`,
      error
    );

    markBlobServiceDisabled(
      error instanceof Error ? error.message : "Blob quiz fetch failed"
    );

    return disabledBlobResult<QuizQuestionsBlob>(null);
  }
}

/**
 * Delete quiz questions from Blobs
 * Useful for cleanup after quiz completion
 */
export async function deleteQuizQuestions(
  sessionCode: string
): Promise<BlobResult<void>> {
  const cacheKey = `quiz:${sessionCode}`;

  try {
    // Note: Edge function doesn't have DELETE method yet
    // For now, we'll just invalidate the cache
    await cache.invalidate(cacheKey);

    Logger.log(
      `[deleteQuizQuestions] Invalidated cache for session ${sessionCode}`
    );

    return {
      success: true,
      data: null,
      error: null,
      cached: false,
      source: "blob",
    };
  } catch (error) {
    Logger.error(
      `[deleteQuizQuestions] Error deleting questions for session ${sessionCode}:`,
      error
    );

    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : "Unknown error",
      cached: false,
      source: "blob",
    };
  }
}

// ============================================================================
// Sync Operations with Supabase
// ============================================================================

/**
 * Sync session blob data with Supabase database
 * Call this periodically to keep authoritative data in sync
 */
export async function syncSessionWithSupabase(
  sessionId: string
): Promise<BlobResult<SessionBlobData>> {
  // This would be implemented to fetch from Supabase and update blob
  // Left as a hook for future implementation
  Logger.log(
    `[syncSessionWithSupabase] Syncing session ${sessionId} with Supabase`
  );

  return {
    success: false,
    data: null,
    error: "Not implemented yet - use Supabase directly for now",
    cached: false,
    source: "supabase",
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generate device ID for cross-device tracking
 */
export function getDeviceId(): string {
  const stored = localStorage.getItem("device_id");
  if (stored) return stored;

  const deviceId = `device_${crypto.randomUUID()}`;
  localStorage.setItem("device_id", deviceId);
  return deviceId;
}

/**
 * Clear all cached blob data
 */
export async function clearBlobCache(): Promise<void> {
  await cache.clear();
  Logger.log("[BlobsManager] Cache cleared");
}

/**
 * Invalidate specific cache entries
 */
export async function invalidateBlobCache(keys: string[]): Promise<void> {
  for (const key of keys) {
    await cache.invalidate(key);
  }
  Logger.log(`[BlobsManager] Invalidated ${keys.length} cache entries`);
}

// ============================================================================
// Strike Counter Management (Blob-based persistence)
// ============================================================================

/**
 * Get strike count for a participant in a quiz session
 */
export async function getStrikeCount(
  sessionCode: string,
  participantId: string
): Promise<number> {
  try {
    const result = await getQuizQuestions(sessionCode);
    if (result.success && result.data) {
      return result.data.strike_counts?.[participantId] || 0;
    }
    return 0;
  } catch (error) {
    Logger.error(`[getStrikeCount] Error:`, error);
    return 0;
  }
}

/**
 * Get all strike counts for a quiz session
 */
export async function getAllStrikeCounts(
  sessionCode: string
): Promise<Record<string, number>> {
  try {
    const result = await getQuizQuestions(sessionCode);
    if (result.success && result.data) {
      return result.data.strike_counts || {};
    }
    return {};
  } catch (error) {
    Logger.error(`[getAllStrikeCounts] Error:`, error);
    return {};
  }
}

/**
 * Update strike count for a participant
 */
export async function updateStrikeCount(
  sessionCode: string,
  _sessionId: string,
  participantId: string,
  strikeCount: number
): Promise<BlobResult<QuizQuestionsBlob>> {
  try {
    // Get current quiz data
    const result = await getQuizQuestions(sessionCode, false);
    if (!result.success || !result.data) {
      return {
        success: false,
        data: null,
        error: "Quiz questions not found",
        cached: false,
        source: "blob",
      };
    }

    // Update strike count
    const updatedData: QuizQuestionsBlob = {
      ...result.data,
      strike_counts: {
        ...result.data.strike_counts,
        [participantId]: Math.max(0, Math.min(3, strikeCount)), // Clamp between 0-3
      },
      last_updated: new Date().toISOString(),
    };

    // Save back to blob
    const response = await fetch("/.netlify/edge-functions/session-state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: `quiz:${sessionCode}`,
        state: updatedData,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // Update cache
    const cacheKey = `quiz:${sessionCode}`;
    await cache.set(cacheKey, updatedData);

    Logger.log(
      `[updateStrikeCount] Updated strikes for ${participantId} to ${strikeCount}`
    );

    return {
      success: true,
      data: updatedData,
      error: null,
      cached: false,
      source: "blob",
    };
  } catch (error) {
    Logger.error(`[updateStrikeCount] Error:`, error);
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : "Unknown error",
      cached: false,
      source: "blob",
    };
  }
}

/**
 * Increment strike count for a participant
 */
export async function incrementStrikeInBlob(
  sessionCode: string,
  sessionId: string,
  participantId: string
): Promise<BlobResult<QuizQuestionsBlob>> {
  const currentCount = await getStrikeCount(sessionCode, participantId);
  return updateStrikeCount(sessionCode, sessionId, participantId, currentCount + 1);
}

/**
 * Decrement strike count for a participant
 */
export async function decrementStrikeInBlob(
  sessionCode: string,
  sessionId: string,
  participantId: string
): Promise<BlobResult<QuizQuestionsBlob>> {
  const currentCount = await getStrikeCount(sessionCode, participantId);
  return updateStrikeCount(sessionCode, sessionId, participantId, currentCount - 1);
}

/**
 * Reset strike count for a participant
 */
export async function resetStrikeInBlob(
  sessionCode: string,
  sessionId: string,
  participantId: string
): Promise<BlobResult<QuizQuestionsBlob>> {
  return updateStrikeCount(sessionCode, sessionId, participantId, 0);
}
