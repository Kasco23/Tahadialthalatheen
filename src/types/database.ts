// Database types generated from Supabase schema
// This file provides TypeScript types that match the database structure

export type GamePhase = 'CONFIG' | 'LOBBY' | 'QUIZ' | 'RESULTS' | 'ENDED';
export type PlayerRole = 'playerA' | 'playerB' | 'host' | 'controller';

// Database record types (matching SQL schema exactly)
export interface DatabaseSessionRecord {
  session_id: string; // 6-character session code
  host_code: string; // Full host code with HOST/CTRL suffix
  host_name: string | null;
  phase: GamePhase;
  segment_settings: Record<string, number>;
  video_room_created: boolean;
  video_room_url: string | null;
  current_question_index: number | null;
  current_segment: string | null;
  status: string | null; // waiting, active, completed
  controller_user_id: string | null;
  last_activity: string | null; // ISO timestamp
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

export interface DatabasePlayerRecord {
  player_id: string; // Unique player identifier
  session_id: string;
  name: string;
  flag: string | null; // Emoji flag or country code
  club: string | null;
  role: PlayerRole;
  score: number;
  strikes_legacy: number; // Legacy strikes field
  is_connected: boolean;
  slot: string | null; // Player slot assignment
  special_buttons: Record<string, boolean>;
  user_id: string | null;
  is_host: boolean;
  joined_at: string; // ISO timestamp
  last_active: string; // ISO timestamp
}

export interface DatabaseGameEvent {
  id: string; // UUID
  session_id: string;
  event_type: string;
  event_data: Record<string, unknown>;
  created_at: string; // ISO timestamp
}

// Legacy types for backward compatibility with existing code
export interface GameRecord extends Omit<DatabaseSessionRecord, 'phase'> {
  phase: string; // Keep as string for backward compatibility
  host_is_connected: boolean; // Added for UI state
  current_question_index: number; // Alias for current_question_index
  timer: number; // UI timer state
  is_timer_running: boolean; // UI timer state
}

export interface PlayerRecord
  extends Omit<
    DatabasePlayerRecord,
    'last_active' | 'joined_at'
  > {
  strikes: number; // UI state for quiz penalties, maps to strikes_legacy
  is_connected: boolean; // UI connection state (already in DB)
  special_buttons: Record<string, boolean>; // UI button states (already in DB)
  joined_at: string; // Alias for joined_at
  last_active: string; // Alias for last_active
}

// Event type definitions for type safety
export type GameEventType =
  | 'session_created'
  | 'session_updated'
  | 'player_joined'
  | 'player_left'
  | 'player_updated'
  | 'phase_changed'
  | 'video_room_created'
  | 'video_room_deleted'
  | 'quiz_started'
  | 'quiz_ended'
  | 'question_started'
  | 'question_ended'
  | 'player_answer'
  | 'player_buzz'
  | 'score_updated'
  | 'segment_changed'
  | 'timer_started'
  | 'timer_stopped';

export interface GameEventData {
  session_created: {
    host_name: string;
    segment_settings: Record<string, number>;
  };
  player_joined: {
    player_name: string;
    role: PlayerRole;
  };
  player_left: {
    player_name: string;
    reason?: string;
  };
  phase_changed: {
    from: GamePhase;
    to: GamePhase;
  };
  video_room_created: {
    room_url: string;
  };
  quiz_started: {
    segment: string;
    question_count: number;
  };
  player_answer: {
    question_id: number;
    answer: string;
    is_correct: boolean;
    time_taken: number;
    points_awarded: number;
  };
  player_buzz: {
    question_id: number;
    buzz_time: number;
  };
  score_updated: {
    player_id: string;
    old_score: number;
    new_score: number;
    reason: string;
  };
}

// Utility types for API responses
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

export interface GameStats {
  total_games: number;
  active_games: number;
  total_players: number;
  games_last_24h: number;
}

export interface GameValidation {
  is_valid: boolean;
  issues: string[];
}

// Supabase client types
export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConfigured: boolean;
}

// Type guards
export function isDatabaseSessionRecord(
  data: unknown,
): data is DatabaseSessionRecord {
  if (!data || typeof data !== 'object') return false;

  const record = data as Record<string, unknown>;

  return (
    typeof record.session_id === 'string' &&
    typeof record.host_code === 'string' &&
    (record.host_name === null || typeof record.host_name === 'string') &&
    typeof record.phase === 'string' &&
    typeof record.segment_settings === 'object' &&
    typeof record.video_room_created === 'boolean' &&
    (record.video_room_url === null ||
      typeof record.video_room_url === 'string') &&
    typeof record.created_at === 'string' &&
    typeof record.updated_at === 'string'
  );
}

export function isDatabasePlayerRecord(
  data: unknown,
): data is DatabasePlayerRecord {
  if (!data || typeof data !== 'object') return false;

  const record = data as Record<string, unknown>;

  return (
    typeof record.player_id === 'string' &&
    typeof record.session_id === 'string' &&
    typeof record.name === 'string' &&
    (record.flag === null || typeof record.flag === 'string') &&
    (record.club === null || typeof record.club === 'string') &&
    typeof record.role === 'string' &&
    typeof record.score === 'number' &&
    typeof record.is_connected === 'boolean' &&
    typeof record.last_active === 'string' &&
    typeof record.joined_at === 'string'
  );
}
