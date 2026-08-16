// src/3-data-tier/api/screeningApi.ts
import { supabase } from '../config/SupabaseClient';
import { REQUIRED_DOCUMENTS, type DocumentRow } from './documentsApi';
import type { DocumentType } from '../types/database.types.extras';

export interface AthleteScreeningStatus {
  athleteId: string;
  name: string;
  email: string;
  dateOfBirth: string | null;
  division: string | null;
  eligibility: 'ready' | 'missing_documents' | 'pending_verification';
  missingTypes: DocumentType[];
  pendingTypes: DocumentType[];
}

export async function getScreeningRoster(coachId: string): Promise<AthleteScreeningStatus[]> {
  const { data: athletes, error: athletesError } = await supabase
    .from('team_members')
    .select('id, name, email, date_of_birth, division')
    .eq('coach_id', coachId)
    .eq('status', 'active');

  if (athletesError) {
    console.error('Error fetching athletes for screening:', athletesError);
    throw new Error('Could not load your roster. Please try again.');
  }

  if (!athletes || athletes.length === 0) return [];

  const athleteIds = athletes.map((a) => a.id);

  const { data: documents, error: docsError } = await supabase
    .from('documents')
    .select('athlete_id, document_type, status')
    .in('athlete_id', athleteIds);

  if (docsError) {
    console.error('Error fetching documents for screening:', docsError);
    throw new Error('Could not load document status. Please try again.');
  }

  const requiredTypes = REQUIRED_DOCUMENTS.map((d) => d.type);

  return athletes.map((athlete) => {
    const athleteDocs = (documents ?? []).filter((d) => d.athlete_id === athlete.id);
    const docsByType = new Map(athleteDocs.map((d) => [d.document_type as DocumentType, d.status]));

    const missingTypes = requiredTypes.filter((type) => !docsByType.has(type));
    const pendingTypes = requiredTypes.filter(
      (type) => docsByType.has(type) && docsByType.get(type) !== 'verified'
    );

    let eligibility: AthleteScreeningStatus['eligibility'] = 'ready';
    if (missingTypes.length > 0) {
      eligibility = 'missing_documents';
    } else if (pendingTypes.length > 0) {
      eligibility = 'pending_verification';
    }

 return {
  athleteId: athlete.id,
  name: athlete.name,
  email: athlete.email,
  dateOfBirth: athlete.date_of_birth,
  division: athlete.division,
  eligibility,
  missingTypes,
  pendingTypes,
};
  });
}