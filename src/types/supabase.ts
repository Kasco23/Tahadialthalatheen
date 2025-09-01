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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      game_events: {
        Row: {
          created_at: string | null
          event_data: Json | null
          event_type: string
          id: string
          session_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          session_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "game_events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["session_id"]
          },
        ]
      }
      lobbies: {
        Row: {
          host_connected: boolean
          playera_connected: boolean
          playerb_connected: boolean
          room_state: string | null
          session_id: string
          updated_at: string | null
        }
        Insert: {
          host_connected?: boolean
          playera_connected?: boolean
          playerb_connected?: boolean
          room_state?: string | null
          session_id: string
          updated_at?: string | null
        }
        Update: {
          host_connected?: boolean
          playera_connected?: boolean
          playerb_connected?: boolean
          room_state?: string | null
          session_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lobbies_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: true
            referencedRelation: "sessions"
            referencedColumns: ["session_id"]
          },
        ]
      }
      players: {
        Row: {
          club: string | null
          flag: string | null
          is_connected: boolean | null
          is_host: boolean | null
          joined_at: string | null
          last_active: string | null
          name: string
          player_id: string
          role: string
          score: number | null
          session_id: string | null
          slot: string | null
          special_buttons: Json | null
          strikes_legacy: number | null
          user_id: string | null
        }
        Insert: {
          club?: string | null
          flag?: string | null
          is_connected?: boolean | null
          is_host?: boolean | null
          joined_at?: string | null
          last_active?: string | null
          name: string
          player_id: string
          role?: string
          score?: number | null
          session_id?: string | null
          slot?: string | null
          special_buttons?: Json | null
          strikes_legacy?: number | null
          user_id?: string | null
        }
        Update: {
          club?: string | null
          flag?: string | null
          is_connected?: boolean | null
          is_host?: boolean | null
          joined_at?: string | null
          last_active?: string | null
          name?: string
          player_id?: string
          role?: string
          score?: number | null
          session_id?: string | null
          slot?: string | null
          special_buttons?: Json | null
          strikes_legacy?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "players_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["session_id"]
          },
        ]
      }
      questions_pool: {
        Row: {
          answer: number | null
          choices: Json | null
          media_url: string | null
          prompt: string
          question_id: string
          segment_code: string
        }
        Insert: {
          answer?: number | null
          choices?: Json | null
          media_url?: string | null
          prompt: string
          question_id?: string
          segment_code: string
        }
        Update: {
          answer?: number | null
          choices?: Json | null
          media_url?: string | null
          prompt?: string
          question_id?: string
          segment_code?: string
        }
        Relationships: []
      }
      rooms: {
        Row: {
          daily_room_name: string
          ended_at: string | null
          is_active: boolean | null
          participant_count: number | null
          recording_url: string | null
          room_id: string
          session_id: string | null
          started_at: string | null
          url: string
        }
        Insert: {
          daily_room_name: string
          ended_at?: string | null
          is_active?: boolean | null
          participant_count?: number | null
          recording_url?: string | null
          room_id?: string
          session_id?: string | null
          started_at?: string | null
          url: string
        }
        Update: {
          daily_room_name?: string
          ended_at?: string | null
          is_active?: boolean | null
          participant_count?: number | null
          recording_url?: string | null
          room_id?: string
          session_id?: string | null
          started_at?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "rooms_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["session_id"]
          },
        ]
      }
      session_events: {
        Row: {
          created_at: string | null
          event_id: number
          event_type: string | null
          payload: Json | null
          session_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_id?: number
          event_type?: string | null
          payload?: Json | null
          session_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_id?: number
          event_type?: string | null
          payload?: Json | null
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "session_events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["session_id"]
          },
        ]
      }
      session_questions: {
        Row: {
          question_id: string
          segment_code: string
          sequence: number | null
          session_id: string
        }
        Insert: {
          question_id: string
          segment_code: string
          sequence?: number | null
          session_id: string
        }
        Update: {
          question_id?: string
          segment_code?: string
          sequence?: number | null
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_questions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions_pool"
            referencedColumns: ["question_id"]
          },
          {
            foreignKeyName: "session_questions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["session_id"]
          },
        ]
      }
      session_segments: {
        Row: {
          current_question: number | null
          playera_strikes: number | null
          playerb_strikes: number | null
          questions_total: number
          segment_code: string
          session_id: string
        }
        Insert: {
          current_question?: number | null
          playera_strikes?: number | null
          playerb_strikes?: number | null
          questions_total: number
          segment_code: string
          session_id: string
        }
        Update: {
          current_question?: number | null
          playera_strikes?: number | null
          playerb_strikes?: number | null
          questions_total?: number
          segment_code?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_segments_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["session_id"]
          },
        ]
      }
      sessions: {
        Row: {
          controller_user_id: string | null
          created_at: string | null
          current_question_index: number | null
          current_segment: string | null
          host_code: string
          host_id: string | null
          host_is_connected: boolean | null
          host_name: string | null
          is_timer_running: boolean | null
          last_activity: string | null
          phase: string
          segment_settings: Json | null
          session_id: string
          status: string | null
          timer: number | null
          updated_at: string | null
          video_room_created: boolean | null
          video_room_url: string | null
        }
        Insert: {
          controller_user_id?: string | null
          created_at?: string | null
          current_question_index?: number | null
          current_segment?: string | null
          host_code?: string
          host_id?: string | null
          host_is_connected?: boolean | null
          host_name?: string | null
          is_timer_running?: boolean | null
          last_activity?: string | null
          phase?: string
          segment_settings?: Json | null
          session_id: string
          status?: string | null
          timer?: number | null
          updated_at?: string | null
          video_room_created?: boolean | null
          video_room_url?: string | null
        }
        Update: {
          controller_user_id?: string | null
          created_at?: string | null
          current_question_index?: number | null
          current_segment?: string | null
          host_code?: string
          host_id?: string | null
          host_is_connected?: boolean | null
          host_name?: string | null
          is_timer_running?: boolean | null
          last_activity?: string | null
          phase?: string
          segment_settings?: Json | null
          session_id?: string
          status?: string | null
          timer?: number | null
          updated_at?: string | null
          video_room_created?: boolean | null
          video_room_url?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      housekeeping_expired_sessions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      validate_security_upgrade: {
        Args: Record<PropertyKey, never>
        Returns: Json
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
