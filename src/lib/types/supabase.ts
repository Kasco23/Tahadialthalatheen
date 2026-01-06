export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      DailyRooms: {
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
        Relationships: [
          {
            foreignKeyName: "DailyRoom_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: true
            referencedRelation: "Sessions"
            referencedColumns: ["session_id"]
          },
        ]
      }
      Friends: {
        Row: {
          addressee_id: string | null
          created_at: string | null
          id: number
          requester_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          addressee_id?: string | null
          created_at?: string | null
          id?: number
          requester_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          addressee_id?: string | null
          created_at?: string | null
          id?: number
          requester_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Friends_addressee_fkey"
            columns: ["addressee_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_matches"
            referencedColumns: ["away_player_id"]
          },
          {
            foreignKeyName: "Friends_addressee_fkey"
            columns: ["addressee_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_matches"
            referencedColumns: ["home_player_id"]
          },
          {
            foreignKeyName: "Friends_addressee_fkey"
            columns: ["addressee_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_matches"
            referencedColumns: ["winner_id"]
          },
          {
            foreignKeyName: "Friends_addressee_fkey"
            columns: ["addressee_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Friends_addressee_fkey"
            columns: ["addressee_id"]
            isOneToOne: false
            referencedRelation: "Profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Friends_requester_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_matches"
            referencedColumns: ["away_player_id"]
          },
          {
            foreignKeyName: "Friends_requester_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_matches"
            referencedColumns: ["home_player_id"]
          },
          {
            foreignKeyName: "Friends_requester_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_matches"
            referencedColumns: ["winner_id"]
          },
          {
            foreignKeyName: "Friends_requester_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Friends_requester_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "Profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      Matches: {
        Row: {
          away_player_id: string | null
          away_total_points: number | null
          created_at: string | null
          home_player_id: string | null
          home_total_points: number | null
          id: number
          segments_played: string[] | null
          session_id: string | null
          winner_id: string | null
        }
        Insert: {
          away_player_id?: string | null
          away_total_points?: number | null
          created_at?: string | null
          home_player_id?: string | null
          home_total_points?: number | null
          id?: number
          segments_played?: string[] | null
          session_id?: string | null
          winner_id?: string | null
        }
        Update: {
          away_player_id?: string | null
          away_total_points?: number | null
          created_at?: string | null
          home_player_id?: string | null
          home_total_points?: number | null
          id?: number
          segments_played?: string[] | null
          session_id?: string | null
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Matches_away_player_fkey"
            columns: ["away_player_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_matches"
            referencedColumns: ["away_player_id"]
          },
          {
            foreignKeyName: "Matches_away_player_fkey"
            columns: ["away_player_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_matches"
            referencedColumns: ["home_player_id"]
          },
          {
            foreignKeyName: "Matches_away_player_fkey"
            columns: ["away_player_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_matches"
            referencedColumns: ["winner_id"]
          },
          {
            foreignKeyName: "Matches_away_player_fkey"
            columns: ["away_player_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Matches_away_player_fkey"
            columns: ["away_player_id"]
            isOneToOne: false
            referencedRelation: "Profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Matches_home_player_fkey"
            columns: ["home_player_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_matches"
            referencedColumns: ["away_player_id"]
          },
          {
            foreignKeyName: "Matches_home_player_fkey"
            columns: ["home_player_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_matches"
            referencedColumns: ["home_player_id"]
          },
          {
            foreignKeyName: "Matches_home_player_fkey"
            columns: ["home_player_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_matches"
            referencedColumns: ["winner_id"]
          },
          {
            foreignKeyName: "Matches_home_player_fkey"
            columns: ["home_player_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Matches_home_player_fkey"
            columns: ["home_player_id"]
            isOneToOne: false
            referencedRelation: "Profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Matches_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "Sessions"
            referencedColumns: ["session_id"]
          },
          {
            foreignKeyName: "Matches_winner_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_matches"
            referencedColumns: ["away_player_id"]
          },
          {
            foreignKeyName: "Matches_winner_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_matches"
            referencedColumns: ["home_player_id"]
          },
          {
            foreignKeyName: "Matches_winner_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_matches"
            referencedColumns: ["winner_id"]
          },
          {
            foreignKeyName: "Matches_winner_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Matches_winner_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "Profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      Notifications: {
        Row: {
          created_at: string | null
          id: number
          is_read: boolean | null
          link: string | null
          message: string | null
          metadata: Json | null
          read_at: string | null
          recipient_id: string | null
          sender_id: string | null
          title: string
          type: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          is_read?: boolean | null
          link?: string | null
          message?: string | null
          metadata?: Json | null
          read_at?: string | null
          recipient_id?: string | null
          sender_id?: string | null
          title?: string
          type: string
        }
        Update: {
          created_at?: string | null
          id?: number
          is_read?: boolean | null
          link?: string | null
          message?: string | null
          metadata?: Json | null
          read_at?: string | null
          recipient_id?: string | null
          sender_id?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "Notifications_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_matches"
            referencedColumns: ["away_player_id"]
          },
          {
            foreignKeyName: "Notifications_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_matches"
            referencedColumns: ["home_player_id"]
          },
          {
            foreignKeyName: "Notifications_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_matches"
            referencedColumns: ["winner_id"]
          },
          {
            foreignKeyName: "Notifications_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Notifications_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "Profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Notifications_user_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_matches"
            referencedColumns: ["away_player_id"]
          },
          {
            foreignKeyName: "Notifications_user_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_matches"
            referencedColumns: ["home_player_id"]
          },
          {
            foreignKeyName: "Notifications_user_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_matches"
            referencedColumns: ["winner_id"]
          },
          {
            foreignKeyName: "Notifications_user_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Notifications_user_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "Profiles"
            referencedColumns: ["id"]
          },
        ]
      }
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
        Relationships: [
          {
            foreignKeyName: "Participant_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "Sessions"
            referencedColumns: ["session_id"]
          },
          {
            foreignKeyName: "Participants_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_matches"
            referencedColumns: ["away_player_id"]
          },
          {
            foreignKeyName: "Participants_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_matches"
            referencedColumns: ["home_player_id"]
          },
          {
            foreignKeyName: "Participants_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_matches"
            referencedColumns: ["winner_id"]
          },
          {
            foreignKeyName: "Participants_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Participants_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "Profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      Profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          flag: string | null
          id: string
          name: string
          team: string | null
          updated_at: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          flag?: string | null
          id: string
          name: string
          team?: string | null
          updated_at?: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          flag?: string | null
          id?: string
          name?: string
          team?: string | null
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      Questions: {
        Row: {
          answers: Json
          question_id: string
          question_text: string
          question_type: string
          segment_code: string
          total_answers_available: number | null
        }
        Insert: {
          answers?: Json
          question_id?: string
          question_text: string
          question_type: string
          segment_code: string
          total_answers_available?: number | null
        }
        Update: {
          answers?: Json
          question_id?: string
          question_text?: string
          question_type?: string
          segment_code?: string
          total_answers_available?: number | null
        }
        Relationships: []
      }
      quiz_buzzes: {
        Row: {
          buzz_id: string
          buzz_ts: string | null
          created_at: string | null
          latency_ms: number | null
          participant_id: string
          question_id: string | null
          session_id: string
        }
        Insert: {
          buzz_id?: string
          buzz_ts?: string | null
          created_at?: string | null
          latency_ms?: number | null
          participant_id: string
          question_id?: string | null
          session_id: string
        }
        Update: {
          buzz_id?: string
          buzz_ts?: string | null
          created_at?: string | null
          latency_ms?: number | null
          participant_id?: string
          question_id?: string | null
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_buzzes_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "Participants"
            referencedColumns: ["participant_id"]
          },
          {
            foreignKeyName: "quiz_buzzes_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "Questions"
            referencedColumns: ["question_id"]
          },
          {
            foreignKeyName: "quiz_buzzes_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "Sessions"
            referencedColumns: ["session_id"]
          },
        ]
      }
      Scores: {
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
        Relationships: [
          {
            foreignKeyName: "Score_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "Participants"
            referencedColumns: ["participant_id"]
          },
          {
            foreignKeyName: "Score_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "Sessions"
            referencedColumns: ["session_id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "SegmentConfig_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "Sessions"
            referencedColumns: ["session_id"]
          },
        ]
      }
      SessionQuestions: {
        Row: {
          created_at: string | null
          display_order: number
          question_id: string
          segment_code: string
          session_id: string
          session_question_id: string
        }
        Insert: {
          created_at?: string | null
          display_order: number
          question_id: string
          segment_code: string
          session_id: string
          session_question_id?: string
        }
        Update: {
          created_at?: string | null
          display_order?: number
          question_id?: string
          segment_code?: string
          session_id?: string
          session_question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "SessionQuestions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "Questions"
            referencedColumns: ["question_id"]
          },
          {
            foreignKeyName: "SessionQuestions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "Sessions"
            referencedColumns: ["session_id"]
          },
        ]
      }
      Sessions: {
        Row: {
          created_at: string | null
          ended_at: string | null
          game_state: string
          host_profile_id: string | null
          phase: string
          session_code: string
          session_id: string
        }
        Insert: {
          created_at?: string | null
          ended_at?: string | null
          game_state: string
          host_profile_id?: string | null
          phase: string
          session_code: string
          session_id?: string
        }
        Update: {
          created_at?: string | null
          ended_at?: string | null
          game_state?: string
          host_profile_id?: string | null
          phase?: string
          session_code?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "Sessions_host_profile_id_fkey"
            columns: ["host_profile_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_matches"
            referencedColumns: ["away_player_id"]
          },
          {
            foreignKeyName: "Sessions_host_profile_id_fkey"
            columns: ["host_profile_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_matches"
            referencedColumns: ["home_player_id"]
          },
          {
            foreignKeyName: "Sessions_host_profile_id_fkey"
            columns: ["host_profile_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_matches"
            referencedColumns: ["winner_id"]
          },
          {
            foreignKeyName: "Sessions_host_profile_id_fkey"
            columns: ["host_profile_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Sessions_host_profile_id_fkey"
            columns: ["host_profile_id"]
            isOneToOne: false
            referencedRelation: "Profiles"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "Strikes_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "Participants"
            referencedColumns: ["participant_id"]
          },
          {
            foreignKeyName: "Strikes_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "Sessions"
            referencedColumns: ["session_id"]
          },
        ]
      }
    }
    Views: {
      leaderboard_matches: {
        Row: {
          away_avatar_url: string | null
          away_flag: string | null
          away_name: string | null
          away_player_id: string | null
          away_team: string | null
          away_total_points: number | null
          away_username: string | null
          created_at: string | null
          home_avatar_url: string | null
          home_flag: string | null
          home_name: string | null
          home_player_id: string | null
          home_team: string | null
          home_total_points: number | null
          home_username: string | null
          id: number | null
          segments_played: string[] | null
          session_id: string | null
          winner_id: string | null
          winner_name: string | null
          winner_username: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Matches_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "Sessions"
            referencedColumns: ["session_id"]
          },
        ]
      }
      leaderboard_players: {
        Row: {
          avatar_url: string | null
          flag: string | null
          games_played: number | null
          id: string | null
          losses: number | null
          name: string | null
          team: string | null
          total_points: number | null
          username: string | null
          win_rate: number | null
          wins: number | null
        }
        Relationships: []
      }
      UserInbox: {
        Row: {
          created_at: string | null
          id: number | null
          is_read: boolean | null
          message: string | null
          recipient_id: string | null
          sender_name: string | null
          type: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Notifications_user_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_matches"
            referencedColumns: ["away_player_id"]
          },
          {
            foreignKeyName: "Notifications_user_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_matches"
            referencedColumns: ["home_player_id"]
          },
          {
            foreignKeyName: "Notifications_user_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_matches"
            referencedColumns: ["winner_id"]
          },
          {
            foreignKeyName: "Notifications_user_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Notifications_user_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "Profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      get_buzz_winner: {
        Args: { p_question_id: string; p_session_id: string }
        Returns: string
      }
      get_question_difficulty: {
        Args: { question_uuid: string }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

// Re-export application-specific types for convenience
export type SegmentCode = "WDYK" | "AUCT" | "BELL" | "UPDW" | "REMO";
export type DifficultyLevel = "easy" | "medium" | "hard";
export type QuestionType = "multiple-choice" | "true-false" | "open-ended" | "list" | "buzz";

// Extended Participant type with joined Profile data
export type ParticipantRow = Tables<"Participants"> & {
  Profiles?: Tables<"Profiles"> | null;
  // Legacy fields for backward compatibility
  name?: string;
  flag?: string;
  team_logo_url?: string;
};

// Extended UserInbox view with full Notifications fields
export type UserInboxRow = Database["public"]["Views"]["UserInbox"]["Row"] & {
  title?: string;
  link?: string | null;
  sender_username?: string | null;
};

// Extended leaderboard views with computed fields
export type LeaderboardPlayerRow = Database["public"]["Views"]["leaderboard_players"]["Row"] & {
  rank?: number;
  total_games?: number;
};

export type LeaderboardMatchRow = Database["public"]["Views"]["leaderboard_matches"]["Row"] & {
  rank?: number;
  played_at?: string;
  total_points?: number;
  home_flag?: string | null;
  home_name?: string | null;
  home_username?: string | null;
  away_flag?: string | null;
  away_name?: string | null;
  away_username?: string | null;
};

// Segment stats interface (no table yet)
export interface SegmentStatsRow {
  segment_code: string;
  games_played: number;
  points: number;
  correct_answers: number;
  total_questions: number;
  wins: number;
  strikes?: number;
}
