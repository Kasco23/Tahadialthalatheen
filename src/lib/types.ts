export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      DailyRoom: {
        Row: {
          active_participants: Json | null
          host_permissions: Json | null
          ready: boolean | null
          room_id: string
          room_url: string
        }
        Insert: {
          active_participants?: Json | null
          host_permissions?: Json | null
          ready?: boolean | null
          room_id: string
          room_url: string
        }
        Update: {
          active_participants?: Json | null
          host_permissions?: Json | null
          ready?: boolean | null
          room_id?: string
          room_url?: string
        }
      }
      Participant: {
        Row: {
          flag: string | null
          lobby_presence: string
          name: string
          participant_id: string
          powerup_alhabeed: boolean | null
          powerup_bellegoal: boolean | null
          powerup_pass_used: boolean | null
          powerup_slippyg: boolean | null
          role: string
          session_id: string
          team_logo_url: string | null
          video_presence: boolean | null
        }
        Insert: {
          flag?: string | null
          lobby_presence?: string
          name: string
          participant_id?: string
          powerup_alhabeed?: boolean | null
          powerup_bellegoal?: boolean | null
          powerup_pass_used?: boolean | null
          powerup_slippyg?: boolean | null
          role: string
          session_id: string
          team_logo_url?: string | null
          video_presence?: boolean | null
        }
        Update: {
          flag?: string | null
          lobby_presence?: string
          name?: string
          participant_id?: string
          powerup_alhabeed?: boolean | null
          powerup_bellegoal?: boolean | null
          powerup_pass_used?: boolean | null
          powerup_slippyg?: boolean | null
          role?: string
          session_id?: string
          team_logo_url?: string | null
          video_presence?: boolean | null
        }
      }
      Score: {
        Row: {
          participant_id: string
          points: number
          score_id: string
          segment_code: string
          session_id: string
        }
        Insert: {
          participant_id: string
          points?: number
          score_id?: string
          segment_code: string
          session_id: string
        }
        Update: {
          participant_id?: string
          points?: number
          score_id?: string
          segment_code?: string
          session_id?: string
        }
      }
      SegmentConfig: {
        Row: {
          config_id: string
          questions_count: number
          segment_code: string
          session_id: string
        }
        Insert: {
          config_id?: string
          questions_count: number
          segment_code: string
          session_id: string
        }
        Update: {
          config_id?: string
          questions_count?: number
          segment_code?: string
          session_id?: string
        }
      }
      Session: {
        Row: {
          created_at: string | null
          ended_at: string | null
          game_state: string
          host_password: string
          phase: string
          session_id: string
          session_code: string
        }
        Insert: {
          created_at?: string | null
          ended_at?: string | null
          game_state: string
          host_password: string
          phase: string
          session_id?: string
          session_code?: string
        }
        Update: {
          created_at?: string | null
          ended_at?: string | null
          game_state?: string
          host_password?: string
          phase?: string
          session_id?: string
          session_code?: string
        }
      }
      Strikes: {
        Row: {
          participant_id: string
          segment_code: string
          session_id: string
          strike_id: string
          strikes: number
        }
        Insert: {
          participant_id: string
          segment_code: string
          session_id: string
          strike_id?: string
          strikes?: number
        }
        Update: {
          participant_id?: string
          segment_code?: string
          session_id?: string
          strike_id?: string
          strikes?: number
        }
      }
    }
    Functions: {
      verify_host_password: {
        Args: { p_password: string; p_session: string }
        Returns: boolean
      }
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Type definitions for the mutations
export type SegmentCode = 'WDYK' | 'AUCT' | 'BELL' | 'UPDW' | 'REMO'
export type ParticipantRole = 'Host' | 'Player1' | 'Player2'
export type LobbyPresence = 'NotJoined' | 'Joined' | 'Disconnected'
export type SessionPhase = 'Setup' | 'Lobby' | 'Full Lobby' | 'In-Progress' | 'Tie-Breaker' | 'Results' | 'Review'
export type GameState = 'pre-quiz' | 'active' | 'post-quiz' | 'concluded'
export type Powerup = 'pass' | 'alhabeed' | 'bellegoal' | 'slippyg'

export interface SegmentConfigInput {
  segment_code: SegmentCode
  questions_count: number
}

export interface CreateDailyRoomResponse {
  room_url: string
  room_name?: string
}

// Strike-related types
export interface StrikeData {
  participant_id: string
  session_id: string
  segment_code: 'WDYK'
  strikes: number
}
