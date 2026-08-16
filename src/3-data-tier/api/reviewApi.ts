import { supabase } from '../config/SupabaseClient';
import type { YouthAthleteEntry, SeniorAthleteEntry } from '../types/prisaa.types';

type AthleteAcademicData = Partial<YouthAthleteEntry> & Partial<SeniorAthleteEntry>;

export async function getAthletesAcademicData(
  athleteIds: string[]
): Promise<Record<string, AthleteAcademicData>> {
  const { data, error } = await supabase
    .from('team_members')
    .select('id, prisaa_academic_data')
    .in('id', athleteIds);

  if (error) {
    console.error('Error fetching academic data:', error);
    throw new Error('Could not load review data. Please try again.');
  }

  const map: Record<string, AthleteAcademicData> = {};
  for (const row of data ?? []) {
    map[row.id] = (row.prisaa_academic_data as AthleteAcademicData) ?? {};
  }
  return map;
}

export async function saveAthleteAcademicData(
  athleteId: string,
  data: AthleteAcademicData
): Promise<void> {
  const { error } = await supabase
    .from('team_members')
    .update({ prisaa_academic_data: data as any })
    .eq('id', athleteId);

  if (error) {
    console.error('Error saving academic data:', error);
    throw new Error('Could not save changes. Please try again.');
  }
}