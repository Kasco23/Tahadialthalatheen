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
      Participants: {
        Row: {
          disconnect_at: string | null
          join_at: string | null
          lastHeartbeat: string | null
          participant_id: string
          powerup_alhabeed: boolean | null
          powerup_bellegoal: boolean | null
          powerup_pass_used: boolean | null
          powerup_slippyg: boolean | null
          profile_id: string | null
          role: string
          session_id: string
          session_presence: string
          video_presence: boolean | null
        }
        Insert: {
          disconnect_at?: string | null
          join_at?: string | null
          lastHeartbeat?: string | null
          participant_id?: string
          powerup_alhabeed?: boolean | null
          powerup_bellegoal?: boolean | null
          powerup_pass_used?: boolean | null
          powerup_slippyg?: boolean | null
          profile_id?: string | null
          role: string
          session_id: string
          session_presence?: string
          video_presence?: boolean | null
        }
        Update: {
          disconnect_at?: string | null
          join_at?: string | null
          lastHeartbeat?: string | null
          participant_id?: string
          powerup_alhabeed?: boolean | null
          powerup_bellegoal?: boolean | null
          powerup_pass_used?: boolean | null
          powerup_slippyg?: boolean | null
          profile_id?: string | null
          role?: string
          session_id?: string
          session_presence?: string
          video_presence?: boolean | null
        }
        Relationships: []
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
    CompositeTypes: {}
  }
}
