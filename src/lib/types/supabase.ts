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
      DailyRooms: {
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
            foreignKeyName: "DailyRooms_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: true;
            referencedRelation: "Sessions";
            referencedColumns: ["session_id"];
          },
        ];
      };
      Participants: {
        Row: {
          disconnect_at: string | null;
          flag: string | null;
          isReady: boolean | null;
          join_at: string | null;
          lastHeartbeat: string | null;
          lobby_presence: string;
          name: string;
          participant_id: string;
          password: string | null;
          profile_id: string | null;
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
          disconnect_at?: string | null;
          flag?: string | null;
          isReady?: boolean | null;
          join_at?: string | null;
          lastHeartbeat?: string | null;
          lobby_presence?: string;
          name: string;
          participant_id?: string;
          password?: string | null;
          profile_id?: string | null;
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
          disconnect_at?: string | null;
          flag?: string | null;
          isReady?: boolean | null;
          join_at?: string | null;
          lastHeartbeat?: string | null;
          lobby_presence?: string;
          name?: string;
          participant_id?: string;
          password?: string | null;
          profile_id?: string | null;
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
            foreignKeyName: "Participants_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "Profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "Participants_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "Sessions";
            referencedColumns: ["session_id"];
          },
        ];
      };
      Profiles: {
        Row: {
          id: string;
          name: string | null;
          username: string | null;
          team: string | null;
          flag: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name?: string | null;
          username?: string | null;
          team?: string | null;
          flag?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string | null;
          username?: string | null;
          team?: string | null;
          flag?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "Profiles_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      Friends: {
        Row: {
          id: string;
          requester_id: string;
          addressee_id: string;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          requester_id: string;
          addressee_id: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          requester_id?: string;
          addressee_id?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "Friends_requester_id_fkey";
            columns: ["requester_id"];
            isOneToOne: false;
            referencedRelation: "Profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "Friends_addressee_id_fkey";
            columns: ["addressee_id"];
            isOneToOne: false;
            referencedRelation: "Profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      Notifications: {
        Row: {
          id: string;
          recipient_id: string;
          sender_id: string | null;
          type: string;
          title: string;
          message: string;
          link: string | null;
          is_read: boolean;
          metadata: Json;
          created_at: string;
          read_at: string | null;
        };
        Insert: {
          id?: string;
          recipient_id: string;
          sender_id?: string | null;
          type: string;
          title: string;
          message: string;
          link?: string | null;
          is_read?: boolean;
          metadata?: Json;
          created_at?: string;
          read_at?: string | null;
        };
        Update: {
          id?: string;
          recipient_id?: string;
          sender_id?: string | null;
          type?: string;
          title?: string;
          message?: string;
          link?: string | null;
          is_read?: boolean;
          metadata?: Json;
          created_at?: string;
          read_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "Notifications_recipient_id_fkey";
            columns: ["recipient_id"];
            isOneToOne: false;
            referencedRelation: "Profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "Notifications_sender_id_fkey";
            columns: ["sender_id"];
            isOneToOne: false;
            referencedRelation: "Profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      Matches: {
        Row: {
          id: string;
          session_id: string;
          home_player_id: string;
          away_player_id: string;
          winner_id: string | null;
          home_total_points: number;
          away_total_points: number;
          total_points: number;
          segments_played: Json;
          played_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          home_player_id: string;
          away_player_id: string;
          winner_id?: string | null;
          home_total_points?: number;
          away_total_points?: number;
          segments_played?: Json;
          played_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          home_player_id?: string;
          away_player_id?: string;
          winner_id?: string | null;
          home_total_points?: number;
          away_total_points?: number;
          segments_played?: Json;
          played_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "Matches_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "Sessions";
            referencedColumns: ["session_id"];
          },
          {
            foreignKeyName: "Matches_home_player_id_fkey";
            columns: ["home_player_id"];
            isOneToOne: false;
            referencedRelation: "Profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "Matches_away_player_id_fkey";
            columns: ["away_player_id"];
            isOneToOne: false;
            referencedRelation: "Profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "Matches_winner_id_fkey";
            columns: ["winner_id"];
            isOneToOne: false;
            referencedRelation: "Profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      PlayerSegmentStats: {
        Row: {
          id: string;
          profile_id: string;
          segment_code: string;
          games_played: number;
          total_questions: number;
          correct_answers: number;
          strikes: number;
          points: number;
          wins: number;
          losses: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          segment_code: string;
          games_played?: number;
          total_questions?: number;
          correct_answers?: number;
          strikes?: number;
          points?: number;
          wins?: number;
          losses?: number;
          updated_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          segment_code?: string;
          games_played?: number;
          total_questions?: number;
          correct_answers?: number;
          strikes?: number;
          points?: number;
          wins?: number;
          losses?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "PlayerSegmentStats_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "Profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      Scores: {
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
            foreignKeyName: "Scores_participant_id_fkey";
            columns: ["participant_id"];
            isOneToOne: false;
            referencedRelation: "Participants";
            referencedColumns: ["participant_id"];
          },
          {
            foreignKeyName: "Scores_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "Sessions";
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
      Sessions: {
        Row: {
          created_at: string | null;
          ended_at: string | null;
          game_state: string;
          host_profile_id: string | null;
          phase: string;
          session_code: string;
          session_id: string;
        };
        Insert: {
          created_at?: string | null;
          ended_at?: string | null;
          game_state: string;
          host_profile_id?: string | null;
          phase: string;
          session_code?: string;
          session_id?: string;
        };
        Update: {
          created_at?: string | null;
          ended_at?: string | null;
          game_state?: string;
          host_profile_id?: string | null;
          phase?: string;
          session_code?: string;
          session_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "Sessions_host_profile_id_fkey";
            columns: ["host_profile_id"];
            isOneToOne: false;
            referencedRelation: "Profiles";
            referencedColumns: ["id"];
          },
        ];
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
            referencedRelation: "Participants";
            referencedColumns: ["participant_id"];
          },
          {
            foreignKeyName: "Strikes_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "Sessions";
            referencedColumns: ["session_id"];
          },
        ];
      };
    };
    Views: {
      UserInbox: {
        Row: {
          id: string;
          recipient_id: string;
          sender_id: string | null;
          type: string;
          title: string;
          message: string;
          link: string | null;
          is_read: boolean;
          metadata: Json;
          created_at: string;
          read_at: string | null;
          sender_username: string | null;
          sender_name: string | null;
          sender_avatar: string | null;
        };
      };
      leaderboard_players: {
        Row: {
          id: string;
          username: string | null;
          name: string | null;
          avatar_url: string | null;
          flag: string | null;
          total_games: number;
          wins: number;
          losses: number;
          ties: number;
          total_points: number;
          win_rate: number | null;
          rank: number | null;
        };
      };
      leaderboard_matches: {
        Row: {
          id: string;
          session_id: string;
          played_at: string;
          total_points: number;
          home_total_points: number;
          away_total_points: number;
          segments_played: Json;
          home_player_id: string;
          home_username: string | null;
          home_name: string | null;
          home_avatar: string | null;
          home_flag: string | null;
          away_player_id: string;
          away_username: string | null;
          away_name: string | null;
          away_avatar: string | null;
          away_flag: string | null;
          winner_id: string | null;
          winner_username: string | null;
          winner_name: string | null;
          rank: number | null;
        };
      };
    };
    Functions: {
      verify_host_password: {
        Args: { password_input: string; session_code_input: string };
        Returns: boolean;
      };
      upsert_player_segment_stats: {
        Args: {
          p_profile_id: string;
          p_segment_code: string;
          p_games_played?: number;
          p_total_questions?: number;
          p_correct_answers?: number;
          p_strikes?: number;
          p_points?: number;
          p_wins?: number;
          p_losses?: number;
        };
        Returns: void;
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
