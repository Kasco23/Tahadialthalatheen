// Compatibility index: re-export generated Supabase types and expose
// the small set of handwritten types the app expects.
import type { Database } from "./supabase";

// Provide a simple Tables/TablesInsert/TablesUpdate alias matching the
// old `src/lib/types.ts` shape used across the repo.
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

export type SegmentCode = "WDYK" | "AUCT" | "BELL" | "UPDW" | "REMO";

// Application-specific enums and inputs (moved from the older single-file
// `types.ts`). Keep these small and explicit rather than relying on
// regenerated DB types for behaviour-level enums.
export type ParticipantRole = "Host" | "Player1" | "Player2" | "GameMaster";
export type LobbyPresence = "NotJoined" | "Joined" | "Disconnected";

// Constants for lobby presence states
export const LOBBY_PRESENCE = {
  NOT_JOINED: "NotJoined" as const,
  JOINED: "Joined" as const,
  DISCONNECTED: "Disconnected" as const,
} satisfies Record<string, LobbyPresence>;

export type SessionPhase =
  | "Setup"
  | "Lobby"
  | "Full Lobby"
  | "In-Progress"
  | "Tie-Breaker"
  | "Results"
  | "Review";
export type GameState = "pre-quiz" | "active" | "post-quiz" | "concluded";
export type Powerup = "pass" | "alhabeed" | "bellegoal" | "slippyg";

export interface SegmentConfigInput {
  segment_code: SegmentCode;
  questions_count: number;
}

export interface CreateDailyRoomResponse {
  room_url: string;
  room_name?: string;
  session_id: string;
}

export interface StrikeData {
  participant_id: string;
  session_id: string;
  segment_code: "WDYK";
  strikes: number;
}

// Daily.co token management types
export interface DailyTokenData {
  token: string;
  room_name: string;
  user_name: string;
  created_at: number; // timestamp in milliseconds
  expires_at: number; // timestamp in milliseconds
  refresh_threshold: number; // milliseconds before expiry to refresh
}

export interface DailyTokenCache {
  [key: string]: DailyTokenData; // key format: `${room_name}:${user_name}`
}

export interface DailyTokenRefreshConfig {
  maxRetries: number;
  baseDelay: number; // milliseconds
  maxDelay: number; // milliseconds
  refreshThresholdMinutes: number; // minutes before expiry to refresh
}
