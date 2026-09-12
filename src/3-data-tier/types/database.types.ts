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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      account_lockouts: {
        Row: {
          email: string
          expires_at: string | null
          locked_at: string
          reason: string
        }
        Insert: {
          email: string
          expires_at?: string | null
          locked_at?: string
          reason?: string
        }
        Update: {
          email?: string
          expires_at?: string | null
          locked_at?: string
          reason?: string
        }
        Relationships: []
      }
      athlete_audit_log: {
        Row: {
          action: string
          athlete_id: string
          athlete_name: string
          created_at: string
          id: string
          metadata: Json
          performed_by: string
          performed_by_role: string
        }
        Insert: {
          action: string
          athlete_id: string
          athlete_name: string
          created_at?: string
          id?: string
          metadata?: Json
          performed_by: string
          performed_by_role: string
        }
        Update: {
          action?: string
          athlete_id?: string
          athlete_name?: string
          created_at?: string
          id?: string
          metadata?: Json
          performed_by?: string
          performed_by_role?: string
        }
        Relationships: []
      }
      blocked_ips: {
        Row: {
          blocked_at: string
          expires_at: string | null
          ip_address: string
          reason: string
        }
        Insert: {
          blocked_at?: string
          expires_at?: string | null
          ip_address: string
          reason: string
        }
        Update: {
          blocked_at?: string
          expires_at?: string | null
          ip_address?: string
          reason?: string
        }
        Relationships: []
      }
      coach_profiles: {
        Row: {
          avatar_seed: string | null
          created_at: string
          id: string
          notify_committee_status: boolean | null
          notify_roster_freeze: boolean | null
          notify_sms_missing_document: boolean | null
          prisaa_form_data: Json | null
          profile_id: string
          secondary_disciplines: string[] | null
          signature_storage_path: string | null
          updated_at: string
        }
        Insert: {
          avatar_seed?: string | null
          created_at?: string
          id?: string
          notify_committee_status?: boolean | null
          notify_roster_freeze?: boolean | null
          notify_sms_missing_document?: boolean | null
          prisaa_form_data?: Json | null
          profile_id: string
          secondary_disciplines?: string[] | null
          signature_storage_path?: string | null
          updated_at?: string
        }
        Update: {
          avatar_seed?: string | null
          created_at?: string
          id?: string
          notify_committee_status?: boolean | null
          notify_roster_freeze?: boolean | null
          notify_sms_missing_document?: boolean | null
          prisaa_form_data?: Json | null
          profile_id?: string
          secondary_disciplines?: string[] | null
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
      document_audit_log: {
        Row: {
          changed_by: string | null
          created_at: string
          document_id: string
          from_status: string
          id: string
          rejection_reason: string | null
          to_status: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          document_id: string
          from_status: string
          id?: string
          rejection_reason?: string | null
          to_status: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          document_id?: string
          from_status?: string
          id?: string
          rejection_reason?: string | null
          to_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_audit_log_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_audit_log_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
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
      invites: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          full_name: string | null
          id: string
          institution_id: string | null
          invited_by: string
          role: Database["public"]["Enums"]["user_role"]
          status: Database["public"]["Enums"]["invite_status"]
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          full_name?: string | null
          id?: string
          institution_id?: string | null
          invited_by: string
          role: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["invite_status"]
          token?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          full_name?: string | null
          id?: string
          institution_id?: string | null
          invited_by?: string
          role?: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["invite_status"]
          token?: string
        }
        Relationships: []
      }
      login_failures: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
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
      resource_documents: {
        Row: {
          category: Database["public"]["Enums"]["resource_category"]
          created_at: string
          file_name: string
          file_type: string
          id: string
          label: string
          size_bytes: number | null
          storage_path: string
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          category: Database["public"]["Enums"]["resource_category"]
          created_at?: string
          file_name: string
          file_type: string
          id?: string
          label: string
          size_bytes?: number | null
          storage_path: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["resource_category"]
          created_at?: string
          file_name?: string
          file_type?: string
          id?: string
          label?: string
          size_bytes?: number | null
          storage_path?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: []
      }
      security_incidents: {
        Row: {
          created_at: string
          event_type: string
          id: string
          ip_address: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          ip_address: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          ip_address?: string
        }
        Relationships: []
      }
      team_members: {
        Row: {
          coach_id: string
          course: string | null
          created_at: string
          date_of_birth: string | null
          division: string | null
          email: string
          gender: string | null
          id: string
          name: string
          prisaa_academic_data: Json | null
          role: string
          sport: string | null
          status: string
          user_id: string | null
          year_graduated_shs: string | null
          year_level: string | null
        }
        Insert: {
          coach_id: string
          course?: string | null
          created_at?: string
          date_of_birth?: string | null
          division?: string | null
          email: string
          gender?: string | null
          id?: string
          name: string
          prisaa_academic_data?: Json | null
          role?: string
          sport?: string | null
          status?: string
          user_id?: string | null
          year_graduated_shs?: string | null
          year_level?: string | null
        }
        Update: {
          coach_id?: string
          course?: string | null
          created_at?: string
          date_of_birth?: string | null
          division?: string | null
          email?: string
          gender?: string | null
          id?: string
          name?: string
          prisaa_academic_data?: Json | null
          role?: string
          sport?: string | null
          status?: string
          user_id?: string | null
          year_graduated_shs?: string | null
          year_level?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_invite: { Args: { p_token: string }; Returns: undefined }
      admin_delete_athlete: {
        Args: { p_athlete_id: string }
        Returns: undefined
      }
      calculate_prisaa_age: {
        Args: { dob: string; event_year: number }
        Returns: number
      }
      cleanup_expired_events: { Args: never; Returns: undefined }
      create_invite: {
        Args: {
          p_email: string
          p_institution_id: string
          p_invited_by: string
          p_role: string
        }
        Returns: undefined
      }
      delete_athlete_permanently: {
        Args: { p_athlete_id: string }
        Returns: undefined
      }
      expire_stale_annual_documents: { Args: never; Returns: undefined }
      get_invite_by_token: {
        Args: { p_token: string }
        Returns: {
          email: string
          expires_at: string
          institution_id: string
          role: Database["public"]["Enums"]["user_role"]
          status: Database["public"]["Enums"]["invite_status"]
        }[]
      }
      get_my_role: { Args: never; Returns: string }
      link_athlete_account: { Args: never; Returns: undefined }
      my_coach_id: { Args: never; Returns: string }
      my_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      revoke_invite: { Args: { p_invite_id: string }; Returns: undefined }
      run_daily_archival: { Args: never; Returns: undefined }
    }
    Enums: {
      invite_status: "pending" | "accepted" | "expired" | "revoked"
      resource_category: "guideline" | "form"
      user_role: "athlete" | "coach" | "school_admin" | "committee" | "admin"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      invite_status: ["pending", "accepted", "expired", "revoked"],
      resource_category: ["guideline", "form"],
      user_role: ["athlete", "coach", "school_admin", "committee", "admin"],
    },
  },
} as const
