/**
 * TIER 3 — DATA TIER: Database Type Definitions
 *
 * SECURITY RATIONALE:
 * - Strict TypeScript types eliminate an entire class of runtime errors that
 *   could arise from mismatched data shapes between tiers.
 * - Prevents OWASP A03 (Injection) at compile-time: if a field doesn't exist
 *   on the type, the compiler catches it before it reaches the DB layer.
 * - Prevents OWASP A04 (Insecure Design): impossible states are unrepresentable.
 *   e.g. a document status MUST be one of the enum values.
 */

export type DocumentStatus = 'draft' | 'pending_review' | 'verified' | 'action_required';
export type UserRole = 'athlete' | 'coach' | 'admin';
export type DocumentType =
  | 'psa_certificate'
  | 'medical_clearance'
  | 'birth_certificate'
  | 'school_id'
  | 'parental_consent'
  | 'physical_exam';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;               // UUID - matches auth.users.id (FK)
          role: UserRole;
          full_name: string;
          email: string;
          institution_id: string | null;
          phone: string | null;     // NEW
          dob: string | null;       // NEW
          gender: string | null;    // NEW
          sport: string | null;     // NEW
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      institutions: {
        Row: {
          id: string;
          name: string;
          region: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['institutions']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['institutions']['Insert']>;
      };
      coach_athlete_assignments: {
        Row: {
          id: string;
          coach_id: string;
          athlete_id: string;
          institution_id: string;
          assigned_at: string;
        };
        Insert: Omit<Database['public']['Tables']['coach_athlete_assignments']['Row'], 'id' | 'assigned_at'>;
        Update: never; // Assignments are immutable; revoke then re-assign
      };
      documents: {
        Row: {
          id: string;
          athlete_id: string;          // FK → profiles.id
          document_type: DocumentType;
          status: DocumentStatus;
          storage_path: string;        // Supabase Storage object path
          file_size_bytes: number;
          mime_type: string;
          original_filename: string;   // Sanitized at upload time
          notes: string | null;        // User-provided — must be sanitized before render
          reviewed_by: string | null;  // FK → profiles.id (coach/admin)
          reviewed_at: string | null;
          digital_signature: string | null; // SHA-256 hash of file content
          metadata: Record<string, string> | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database['public']['Tables']['documents']['Row'],
          'id' | 'created_at' | 'updated_at' | 'reviewed_by' | 'reviewed_at'
        >;
        Update: Partial<Pick<
          Database['public']['Tables']['documents']['Row'],
          'status' | 'notes' | 'reviewed_by' | 'reviewed_at' | 'digital_signature' | 'metadata'
        >>;
      };
      audit_logs: {
        Row: {
          id: string;
          actor_id: string;       // Who performed the action
          action: string;         // 'upload' | 'review' | 'verify' | 'reject' | 'login'
          resource_type: string;  // 'document' | 'profile'
          resource_id: string;
          ip_address: string | null;
          user_agent: string | null;
          details: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['audit_logs']['Row'], 'id' | 'created_at'>;
        Update: never; // Audit logs are write-once, append-only
      };
      events: {
        Row: {
          id: string;
          title: string;
          event_date: string;
          event_time: string;
          type: 'event' | 'deadline';
          status: 'Pending' | 'Completed';
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          event_date: string;
          event_time: string;
          type: 'event' | 'deadline';
          status?: 'Pending' | 'Completed';
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          event_date?: string;
          event_time?: string;
          type?: 'event' | 'deadline';
          status?: 'Pending' | 'Completed';
          user_id?: string;
          created_at?: string;
        };
      };
    };
    Views: {
      athlete_document_summary: {
        Row: {
          athlete_id: string;
          full_name: string;
          institution_id: string | null;
          total_documents: number;
          verified_count: number;
          pending_count: number;
          action_required_count: number;
        };
      };
    };
    Functions: {
      get_my_role: {
        Args: Record<string, never>;
        Returns: UserRole;
      };
    };
    Enums: {
      document_status: DocumentStatus;
      user_role: UserRole;
      document_type: DocumentType;
    };
  };
}

// Convenience row-type aliases
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Document = Database['public']['Tables']['documents']['Row'];
export type Institution = Database['public']['Tables']['institutions']['Row'];
export type AuditLog = Database['public']['Tables']['audit_logs']['Row'];
export type CoachAthleteAssignment = Database['public']['Tables']['coach_athlete_assignments']['Row'];
export type EventRow = Database['public']['Tables']['events']['Row'];