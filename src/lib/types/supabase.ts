export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4";
  };
  public: {
    Tables: {
      DailyRoom: {
        Row: {
          active_participants: Json | null;
          host_permissions: Json | null;
          ready: boolean | null;
          room_id: string;
          room_url: string;
        };
        Insert: {
          active_participants?: Json | null;
          host_permissions?: Json | null;
          ready?: boolean | null;
          room_id: string;
          room_url: string;
        };
        Update: {
          active_participants?: Json | null;
          host_permissions?: Json | null;
          ready?: boolean | null;
          room_id?: string;
          room_url?: string;
        };
        Relationships: [
          {
            foreignKeyName: "DailyRoom_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: true;
            referencedRelation: "Session";
            referencedColumns: ["session_id"];
          },
        ];
      };
      Participant: {
        Row: {
          flag: string | null;
          lobby_presence: string;
          name: string;
          participant_id: string;
          powerup_alhabeed: boolean | null;
          powerup_bellegoal: boolean | null;
          powerup_pass_used: boolean | null;
          powerup_slippyg: boolean | null;
          role: string;
          session_id: string;
          team_logo_url: string | null;
          video_presence: boolean | null;
        };
        Insert: {
          flag?: string | null;
          lobby_presence?: string;
          name: string;
          participant_id?: string;
          powerup_alhabeed?: boolean | null;
          powerup_bellegoal?: boolean | null;
          powerup_pass_used?: boolean | null;
          powerup_slippyg?: boolean | null;
          role: string;
          session_id: string;
          team_logo_url?: string | null;
          video_presence?: boolean | null;
        };
        Update: {
          flag?: string | null;
          lobby_presence?: string;
          name?: string;
          participant_id?: string;
          powerup_alhabeed?: boolean | null;
          powerup_bellegoal?: boolean | null;
          powerup_pass_used?: boolean | null;
          powerup_slippyg?: boolean | null;
          role?: string;
          session_id?: string;
          team_logo_url?: string | null;
          video_presence?: boolean | null;
        };
        Relationships: [
          {
            foreignKeyName: "Participant_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "Session";
            referencedColumns: ["session_id"];
          },
        ];
      };
      Score: {
        Row: {
          participant_id: string;
          points: number;
          score_id: string;
          segment_code: string;
          session_id: string;
        };
        Insert: {
          participant_id: string;
          points?: number;
          score_id?: string;
          segment_code: string;
          session_id: string;
        };
        Update: {
          participant_id?: string;
          points?: number;
          score_id?: string;
          segment_code?: string;
          session_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "Score_participant_id_fkey";
            columns: ["participant_id"];
            isOneToOne: false;
            referencedRelation: "Participant";
            referencedColumns: ["participant_id"];
          },
          {
            foreignKeyName: "Score_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "Session";
            referencedColumns: ["session_id"];
          },
        ];
      };
      SegmentConfig: {
        Row: {
          config_id: string;
          questions_count: number;
          segment_code: string;
          session_id: string;
        };
        Insert: {
          config_id?: string;
          questions_count: number;
          segment_code: string;
          session_id: string;
        };
        Update: {
          config_id?: string;
          questions_count?: number;
          segment_code?: string;
          session_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "SegmentConfig_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "Session";
            referencedColumns: ["session_id"];
          },
        ];
      };
      Session: {
        Row: {
          created_at: string | null;
          ended_at: string | null;
          game_state: string;
          host_password: string;
          phase: string;
          session_code: string;
          session_id: string;
        };
        Insert: {
          created_at?: string | null;
          ended_at?: string | null;
          game_state: string;
          host_password: string;
          phase: string;
          session_code: string;
          session_id?: string;
        };
        Update: {
          created_at?: string | null;
          ended_at?: string | null;
          game_state?: string;
          host_password?: string;
          phase?: string;
          session_code?: string;
          session_id?: string;
        };
        Relationships: [];
      };
      Strikes: {
        Row: {
          participant_id: string;
          segment_code: string;
          session_id: string;
          strike_id: string;
          strikes: number;
        };
        Insert: {
          participant_id: string;
          segment_code: string;
          session_id: string;
          strike_id?: string;
          strikes?: number;
        };
        Update: {
          participant_id?: string;
          segment_code?: string;
          session_id?: string;
          strike_id?: string;
          strikes?: number;
        };
        Relationships: [
          {
            foreignKeyName: "Strikes_participant_id_fkey";
            columns: ["participant_id"];
            isOneToOne: false;
            referencedRelation: "Participant";
            referencedColumns: ["participant_id"];
          },
          {
            foreignKeyName: "Strikes_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "Session";
            referencedColumns: ["session_id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      verify_host_password: {
        Args: { password_input: string; session_code_input: string };
        Returns: boolean;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
