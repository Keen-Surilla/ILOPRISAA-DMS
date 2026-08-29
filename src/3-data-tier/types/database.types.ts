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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      coach_profiles: {
        Row: {
          created_at: string
          id: string
          prisaa_form_data: Json | null
          profile_id: string
          signature_storage_path: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          prisaa_form_data?: Json | null
          profile_id: string
          signature_storage_path?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          prisaa_form_data?: Json | null
          profile_id?: string
          signature_storage_path?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      document_status_transitions: {
        Row: {
          from_status: string
          to_status: string
        }
        Insert: {
          from_status: string
          to_status: string
        }
        Update: {
          from_status?: string
          to_status?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          athlete_id: string
          created_at: string
          digital_signature: string | null
          document_category: string | null
          document_type: string
          file_size_bytes: number
          id: string
          metadata: Json | null
          mime_type: string
          notes: string | null
          original_filename: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          storage_path: string
          updated_at: string
        }
        Insert: {
          athlete_id: string
          created_at?: string
          digital_signature?: string | null
          document_category?: string | null
          document_type: string
          file_size_bytes: number
          id?: string
          metadata?: Json | null
          mime_type: string
          notes?: string | null
          original_filename: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          storage_path: string
          updated_at?: string
        }
        Update: {
          athlete_id?: string
          created_at?: string
          digital_signature?: string | null
          document_category?: string | null
          document_type?: string
          file_size_bytes?: number
          id?: string
          metadata?: Json | null
          mime_type?: string
          notes?: string | null
          original_filename?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          storage_path?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          event_date: string
          event_time: string
          id: string
          status: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_date: string
          event_time: string
          id?: string
          status?: string
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_date?: string
          event_time?: string
          id?: string
          status?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          dob: string | null
          email: string
          full_name: string
          gender: string | null
          id: string
          institution_id: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          sport: string | null
          team_motto: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          dob?: string | null
          email: string
          full_name: string
          gender?: string | null
          id: string
          institution_id?: string | null
          phone?: string | null
          role: Database["public"]["Enums"]["user_role"]
          sport?: string | null
          team_motto?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          dob?: string | null
          email?: string
          full_name?: string
          gender?: string | null
          id?: string
          institution_id?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          sport?: string | null
          team_motto?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      rate_limit_events: {
        Row: {
          action: string
          created_at: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          user_id?: string
        }
        Relationships: []
      }
      team_members: {
        Row: {
          coach_id: string
          created_at: string
          date_of_birth: string | null
          division: string | null
          email: string
          id: string
          name: string
          prisaa_academic_data: Json | null
          role: string
          status: string
          user_id: string | null
        }
        Insert: {
          coach_id: string
          created_at?: string
          date_of_birth?: string | null
          division?: string | null
          email: string
          id?: string
          name: string
          prisaa_academic_data?: Json | null
          role?: string
          status?: string
          user_id?: string | null
        }
        Update: {
          coach_id?: string
          created_at?: string
          date_of_birth?: string | null
          division?: string | null
          email?: string
          id?: string
          name?: string
          prisaa_academic_data?: Json | null
          role?: string
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_prisaa_age: {
        Args: { dob: string; event_year: number }
        Returns: number
      }
      cleanup_expired_events: { Args: never; Returns: undefined }
      get_my_role: { Args: never; Returns: string }
      link_athlete_account: { Args: never; Returns: undefined }
      my_coach_id: { Args: never; Returns: string }
      my_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      run_daily_archival: { Args: never; Returns: undefined }
    }
    Enums: {
      user_role: "athlete" | "coach" | "admin" | "committee"
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
    Enums: {
      user_role: ["athlete", "coach", "admin", "committee"],
    },
  },
} as const
