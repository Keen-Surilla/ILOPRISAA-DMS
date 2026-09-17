import { supabase } from '../config/SupabaseClient';
import type { Database } from '../types/database.types';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
export type ProfileLookup = Pick<ProfileRow, 'id' | 'full_name' | 'email'>;

export async function getProfilesByIds(profileIds: string[]): Promise<ProfileLookup[]> {
  if (profileIds.length === 0) return [];

  const { data, error } = await supabase.rpc(
    'get_school_admin_coaches_by_ids' as any,
    { p_coach_ids: profileIds }
  );

  if (error) {
    console.error('Error fetching coach profiles:', error);
    throw new Error('Could not load coach profile information. Please try again.');
  }

  return (data ?? []) as ProfileLookup[];
}
