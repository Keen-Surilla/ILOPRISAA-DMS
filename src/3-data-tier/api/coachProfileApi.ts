// src/3-data-tier/api/coachProfileApi.ts
import { supabase } from '../config/SupabaseClient';
import type { PrisaaCoachFormData } from '../types/prisaa.types';
import type { Json } from '../types/database.types';

export class CoachProfileApiError extends Error {
  readonly code: string;
  constructor(message: string, code: string) {
    super(message);
    this.name = 'CoachProfileApiError';
    this.code = code;
  }
}
export interface CoachProfileWithSignature {
  formData: PrisaaCoachFormData | null;
  signatureStoragePath: string | null;
}

export const coachProfileApi = {
  async getMyProfile(profileId: string): Promise<CoachProfileWithSignature> {
  const { data, error } = await supabase
    .from('coach_profiles')
    .select('prisaa_form_data, signature_storage_path')
    .eq('profile_id', profileId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching coach profile:', error);
    throw new CoachProfileApiError('Could not load your profile. Please try again.', 'FETCH_FAILED');
  }

  return {
    formData: (data?.prisaa_form_data as unknown as PrisaaCoachFormData) ?? null,
    signatureStoragePath: data?.signature_storage_path ?? null,
  };
},

async saveMyProfile(profileId: string, formData: PrisaaCoachFormData): Promise<void> {
  const { error } = await supabase
    .from('coach_profiles')
    .upsert(
      { profile_id: profileId, prisaa_form_data: formData as unknown as Json },
      { onConflict: 'profile_id' }
    );

  if (error) {
    console.error('Error saving coach profile:', error);
    throw new CoachProfileApiError('Could not save your profile. Please try again.', 'SAVE_FAILED');
  }
},
};

