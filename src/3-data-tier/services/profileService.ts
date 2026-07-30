import { supabase } from '../config/SupabaseClient';

export interface CoachProfile {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  dob?: string | null; // Allow null to fix the date crash
  gender?: string;
  sport?: string;
  team_motto?: string | null;
  institution_id?: string; // <--- Add this new field
}
export async function getProfile(userId: string): Promise<CoachProfile | null> {
  const { data, error } = await supabase
    .from('profiles' as any)
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
  return data as any;
}

export async function updateProfile(userId: string, payload: Partial<CoachProfile>) {
  const { data, error } = await supabase
    .from('profiles' as any)
    .update(payload)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message || 'Failed to update profile');
  }
  return data;
}