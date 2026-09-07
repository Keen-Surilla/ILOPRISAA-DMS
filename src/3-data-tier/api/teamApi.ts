import { supabase } from '../config/SupabaseClient';
import type { Database } from '../types/database.types';
import { withAuthRetry } from '../../2-application-tier/utils/withAuthRetry';

export type TeamMember = Database['public']['Tables']['team_members']['Row'];
export type NewTeamMember = Database['public']['Tables']['team_members']['Insert'];

export class TeamApiError extends Error {
  readonly code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = 'TeamApiError';
    this.code = code;
  }
}

export const teamApi = {
  async getTeamMembers(coachId: string): Promise<TeamMember[]> {
    const { data, error } = await withAuthRetry(() =>
      supabase
        .from('team_members')
        .select(
          'id, name, email, role, coach_id, user_id, created_at, status, date_of_birth, division, year_level, sport, gender, prisaa_academic_data'
        )
        .eq('coach_id', coachId)
        .eq('status', 'active')
    );

    if (error) {
      console.error('API Error fetching team members:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });

      throw new TeamApiError(
        error.message || 'Could not load your team. Please try again.',
        error.code || 'FETCH_FAILED'
      );
    }

    return data ?? [];
  },

  async getArchivedTeamMembers(coachId: string): Promise<TeamMember[]> {
    const { data, error } = await withAuthRetry(() =>
      supabase
        .from('team_members')
        .select(
          'id, name, email, role, coach_id, user_id, created_at, status, date_of_birth, division, year_level, sport, gender, prisaa_academic_data'
        )
        .eq('coach_id', coachId)
        .eq('status', 'archived')
    );

    if (error) {
      console.error('API Error fetching archived team members:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });

      throw new TeamApiError(
        error.message ||
          'Could not load archived athletes. Please try again.',
        error.code || 'FETCH_FAILED'
      );
    }

    return data ?? [];
  },

  async restoreAthlete(athleteId: string): Promise<void> {
    const { error } = await withAuthRetry(() =>
      supabase
        .from('team_members')
        .update({ status: 'active' })
        .eq('id', athleteId)
    );

    if (error) {
      console.error('API Error restoring athlete:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });

      throw new TeamApiError(
        error.message ||
          'Could not restore this athlete. Please try again.',
        error.code || 'UPDATE_FAILED'
      );
    }
  },

  async getTeamMembersForViewer(): Promise<TeamMember[]> {
    const { data, error } = await withAuthRetry(() =>
      supabase
        .from('team_members')
        .select(
          'id, name, email, role, coach_id, user_id, created_at, status, date_of_birth, division, year_level, sport, gender, prisaa_academic_data'
        )
    );

    if (error) {
      console.error('API Error fetching roster:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });

      throw new TeamApiError(
        error.message || 'Could not load your team. Please try again.',
        error.code || 'FETCH_FAILED'
      );
    }

    return data ?? [];
  },

  async addAthlete(athleteData: NewTeamMember): Promise<TeamMember> {
    const name = athleteData.name?.trim();
    const email = athleteData.email?.trim().toLowerCase();

    if (!name) {
      throw new TeamApiError(
        'Athlete name is required.',
        'VALIDATION_FAILED'
      );
    }

    if (!email || !email.includes('@')) {
      throw new TeamApiError(
        'A valid email is required.',
        'VALIDATION_FAILED'
      );
    }

    const { data, error } = await withAuthRetry(() =>
      supabase
        .from('team_members')
        .insert([{ ...athleteData, name, email }])
        .select(
          'id, name, email, role, coach_id, user_id, created_at, status, date_of_birth, division, year_level, sport, gender, prisaa_academic_data'
        )
        .single()
    );

    if (error || !data) {
      console.error('API Error adding athlete:', {
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code,
        athleteData,
      });

      throw new TeamApiError(
        error?.message || 'Could not add this athlete. Please try again.',
        error?.code || 'INSERT_FAILED'
      );
    }

    return data;
  },

  async deleteAthlete(id: string, coachId: string): Promise<void> {
    const { error, count } = await withAuthRetry(() =>
      supabase
        .from('team_members')
        .delete({ count: 'exact' })
        .eq('id', id)
        .eq('coach_id', coachId)
    );

    if (error) {
      console.error('API Error deleting athlete:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });

      throw new TeamApiError(
        error.message ||
          'Could not remove this athlete. Please try again.',
        error.code || 'DELETE_FAILED'
      );
    }

    if (!count) {
      throw new TeamApiError('Athlete not found.', 'NOT_FOUND');
    }
  },

  async updateAthlete(
    id: string,
    coachId: string,
    data: Pick<
      TeamMember,
      'name' | 'email' | 'date_of_birth' | 'division' | 'year_level' | 'sport' | 'gender'
    >
  ): Promise<void> {
    const { error } = await withAuthRetry(() =>
      supabase
        .from('team_members')
        .update(data)
        .eq('id', id)
        .eq('coach_id', coachId)
    );

    if (error) {
      console.error('API Error updating athlete:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });

      throw new TeamApiError(
        error.message ||
          'Could not update this athlete. Please try again.',
        error.code || 'UPDATE_FAILED'
      );
    }
  },
};