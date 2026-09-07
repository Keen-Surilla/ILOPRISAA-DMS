import type { Database } from './database.types';

export type DocumentType = Database['public']['Tables']['documents']['Row']['document_type'];
export type Document = Database['public']['Tables']['documents']['Row'];
export type DocumentStatus = Database['public']['Tables']['documents']['Row']['status'];
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type UserRole = Database['public']['Enums']['user_role'];
export type EventKind = 'event' | 'deadline' | 'meeting';
export type CoachProfile = Database['public']['Tables']['coach_profiles']['Row'];

export type Invite = Database['public']['Tables']['invites']['Row'];
export type InviteStatus = Database['public']['Enums']['invite_status'];
export type InviteRole = Exclude<UserRole, 'athlete'>;