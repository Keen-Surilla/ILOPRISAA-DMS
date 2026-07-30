import { supabase } from '../config/SupabaseClient';
import type { Database } from '../types/database.types';

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
    const { data, error } = await supabase
      .from('team_members')
      .select('id, name, email, role, coach_id')
      .eq('coach_id', coachId);

    if (error) {
      // Log the real error server-side/console for debugging (table missing,
      // RLS denial, etc show up here) — but don't leak it to the UI.
      console.error("API Error fetching team members:", error);
      throw new TeamApiError('Could not load your team. Please try again.', 'FETCH_FAILED');
    }
    return data ?? [];
  },

  async addAthlete(athleteData: NewTeamMember): Promise<TeamMember> {
    const name = athleteData.name?.trim();
    const email = athleteData.email?.trim().toLowerCase();

    if (!name) {
      throw new TeamApiError('Athlete name is required.', 'VALIDATION_FAILED');
    }
    if (!email || !email.includes('@')) {
      throw new TeamApiError('A valid email is required.', 'VALIDATION_FAILED');
    }

    const { data, error } = await supabase
      .from('team_members')
      .insert([{ ...athleteData, name, email }])
      .select('id, name, email, role, coach_id')
      .single();

    if (error || !data) {
      console.error("API Error adding athlete:", error);
      throw new TeamApiError('Could not add this athlete. Please try again.', 'INSERT_FAILED');
    }
    return data;
  },

  async deleteAthlete(id: string, coachId: string): Promise<void> {
    const { error, count } = await supabase
      .from('team_members')
      .delete({ count: 'exact' })
      .eq('id', id)
      .eq('coach_id', coachId); // scoped — a coach can only delete their own athletes

    if (error) {
      console.error("API Error deleting athlete:", error);
      throw new TeamApiError('Could not remove this athlete. Please try again.', 'DELETE_FAILED');
    }
    if (!count) {
      throw new TeamApiError('Athlete not found.', 'NOT_FOUND');
    }
  }
};