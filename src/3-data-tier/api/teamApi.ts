import { supabase } from '../config/SupabaseClient';
import type { Database } from '../types/database.types';
import { withAuthRetry } from '../../2-application-tier/utils/withAuthRetry';

export type TeamMember = Database['public']['Tables']['team_members']['Row'];
export type NewTeamMember = Database['public']['Tables']['team_members']['Insert'];

const TEAM_MEMBER_COLUMNS =
  'id, name, email, role, coach_id, user_id, created_at, status, date_of_birth, division, year_level, course, year_graduated_shs, sport, gender, prisaa_academic_data';

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
        .select(TEAM_MEMBER_COLUMNS)
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
        .select(TEAM_MEMBER_COLUMNS)
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
      supabase.from('team_members').select(TEAM_MEMBER_COLUMNS)
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
        .select(TEAM_MEMBER_COLUMNS)
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

  /**
   * Permanently deletes an athlete record, including any Storage documents
   * (PSA certs, medical clearances) tied to them, and writes an audit log
   * entry. This is a hard, irreversible delete.
   *
   * Deliberately NOT `.from('team_members').delete().eq('coach_id', coachId)`:
   * that pattern trusts whatever `coachId` the caller happens to pass, which
   * is an IDOR risk (OWASP A01:2021) — a modified client or a future bug
   * could pass someone else's coach_id. Instead this calls a
   * SECURITY DEFINER Postgres function that re-derives the caller's identity
   * and role from their verified JWT and only allows the delete if they are
   * an admin OR the coach who actually owns this athlete. See
   * 2026xxxx_admin_delete_athlete.sql.
   */
  async deleteAthlete(id: string, _legacyCoachId?: string): Promise<void> {
    // `_legacyCoachId` is intentionally unused — kept only so any existing
    // `teamApi.deleteAthlete(id, coachId)` call sites still compile. Ownership
    // is now verified server-side from the caller's own session, not from
    // whatever id is passed in here. Update call sites to drop the second
    // argument when convenient.
    const { error } = await withAuthRetry(() =>
      supabase.rpc('delete_athlete_permanently', { p_athlete_id: id })
    );

    if (error) {
      console.error('API Error deleting athlete:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });

      const code = error.code === '42501' ? 'PERMISSION_DENIED' : error.code || 'DELETE_FAILED';
      const message =
        code === 'PERMISSION_DENIED'
          ? "You don't have permission to delete this athlete."
          : error.message || 'Could not remove this athlete. Please try again.';

      throw new TeamApiError(message, code);
    }
  },

  /** Alias used by the Archived Athletes view — same server-enforced delete. */
  async permanentlyDeleteAthlete(id: string): Promise<void> {
    return teamApi.deleteAthlete(id);
  },

  async archiveAthlete(id: string, coachId: string): Promise<void> {
    const { error, count } = await withAuthRetry(() =>
      supabase
        .from('team_members')
        .update({ status: 'archived' }, { count: 'exact' })
        .eq('id', id)
        .eq('coach_id', coachId)
    );

    if (error) {
      console.error('API Error archiving athlete:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });

      throw new TeamApiError(
        error.message ||
          'Could not archive this athlete. Please try again.',
        error.code || 'UPDATE_FAILED'
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
      | 'name'
      | 'email'
      | 'date_of_birth'
      | 'division'
      | 'year_level'
      | 'course'
      | 'year_graduated_shs'
      | 'sport'
      | 'gender'
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