import { supabase } from '../config/SupabaseClient';
import type { Document, Profile } from '../types/database.types';

export interface AthleteWithDocuments {
  profile: Profile;
  documents: Document[];
}

export async function getCoachAthletes(coachId: string): Promise<Profile[]> {
  const { data: assignments, error: assignError } = await supabase
    .from('coach_athlete_assignments')
    .select('athlete_id')
    .eq('coach_id', coachId);

  if (assignError || !assignments?.length) return [];

  const athleteIds = assignments.map((a) => a.athlete_id);
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .in('id', athleteIds)
    .eq('role', 'athlete');

  if (error) return [];
  return profiles ?? [];
}

export async function getAthleteDocumentsForCoach(athleteId: string): Promise<Document[]> {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('athlete_id', athleteId)
    .order('created_at', { ascending: false });

  if (error) return [];
  return data ?? [];
}

/** Documents awaiting committee eligibility review (all pending submissions). */
export async function getCommitteeReviewQueue(): Promise<AthleteWithDocuments[]> {
  const { data: docs, error } = await supabase
    .from('documents')
    .select('*')
    .eq('status', 'pending_review')
    .order('created_at', { ascending: false });

  if (error || !docs?.length) return [];

  const byAthlete = new Map<string, Document[]>();
  for (const doc of docs) {
    const list = byAthlete.get(doc.athlete_id) ?? [];
    list.push(doc);
    byAthlete.set(doc.athlete_id, list);
  }

  const athleteIds = [...byAthlete.keys()];
  const { data: profiles } = await supabase.from('profiles').select('*').in('id', athleteIds);

  if (!profiles) return [];

  return profiles.map((profile) => ({
    profile,
    documents: byAthlete.get(profile.id) ?? [],
  }));
}

export async function listAllAthleteProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase.from('profiles').select('*').eq('role', 'athlete').order('full_name');
  if (error) return [];
  return data ?? [];
}
