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

export type Views<T extends keyof Database["public"]["Views"]> =
  Database["public"]["Views"][T]["Row"];

export type SegmentCode = "WDYK" | "AUCT" | "BELL" | "UPDW" | "REMO";

// Application-specific enums and inputs (moved from the older single-file
// `types.ts`). Keep these small and explicit rather than relying on
// regenerated DB types for behaviour-level enums.
export type ParticipantRole = "Host" | "Player1" | "Player2" | "GameMaster";

// Constants for participant roles - Update to use "Home" and "Away" terminology
export const PARTICIPANT_ROLE = {
  HOST: "Host" as const,
  PLAYER1: "Player1" as const, // Home player
  PLAYER2: "Player2" as const, // Away player
  GAME_MASTER: "GameMaster" as const,
} satisfies Record<string, ParticipantRole>;

// Display labels for roles
export const ROLE_DISPLAY_LABELS: Record<ParticipantRole, string> = {
  Host: "Host",
  Player1: "Home",
  Player2: "Away",
  GameMaster: "Game Master",
};

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

// Seat-based routing system types
export type SeatRole = "host" | "player1" | "player2";

export const SEAT_TO_ROLE: Record<string, SeatRole> = {
  "1": "host",
  "2": "player1",
  "3": "player2",
};

export const ROLE_TO_SEAT: Record<SeatRole, string> = {
  host: "1",
  player1: "2",
  player2: "3",
};

// Friend request types
export type FriendStatus = "pending" | "accepted" | "declined" | "blocked";

export interface FriendRequest {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: FriendStatus;
  created_at: string;
  updated_at: string;
}

// Notification types
export type NotificationType =
  | "friend_request"
  | "friend_accepted"
  | "match_invite"
  | "match_result";

export interface Notification {
  id: string;
  recipient_id: string;
  sender_id: string | null;
  type: NotificationType;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  read_at: string | null;
}

// Match statistics types
export interface MatchRecord {
  id: string;
  session_id: string;
  home_player_id: string;
  away_player_id: string;
  winner_id: string | null;
  home_total_points: number;
  away_total_points: number;
  total_points: number;
  segments_played: SegmentCode[];
  played_at: string;
}

export interface PlayerStats {
  profile_id: string;
  total_games: number;
  wins: number;
  losses: number;
  ties: number;
  total_points: number;
  win_rate: number;
}

export interface HeadToHeadStats {
  opponent_id: string;
  opponent_username: string;
  opponent_name: string;
  games_played: number;
  wins: number;
  losses: number;
  ties: number;
}

export interface SegmentStats {
  segment_code: SegmentCode;
  games_played: number;
  total_questions: number;
  correct_answers: number;
  strikes: number;
  points: number;
  wins: number;
  losses: number;
}
