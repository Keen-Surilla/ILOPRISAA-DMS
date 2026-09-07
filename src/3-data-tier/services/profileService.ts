import { supabase } from '../config/SupabaseClient';

export interface CoachProfile {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  dob?: string | null; 
  gender?: string;
  sport?: string;
  team_motto?: string | null;
  institution_id?: string; 
  avatar_seed?: string;
  secondary_disciplines?: string[];
  notify_sms_missing_document?: boolean;
  notify_committee_status?: boolean;
  notify_roster_freeze?: boolean;
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

export const updateProfile = async (userId: string, data: any) => {
  const { data: updatedData, error } = await supabase
    .from('profiles')
    .update(data)
    .eq('id', userId)
    .select() // <-- IMPORTANT: Ask Supabase to return the updated row
    .single(); // <-- IMPORTANT: Ensure exactly one row is returned

  if (error) {
    throw new Error(error.message);
  }

  // If RLS blocked it, it will return null/empty data without throwing a DB error
  if (!updatedData) {
    throw new Error("Update blocked by Database Security (RLS) or user not found.");
  }

  return updatedData;
};