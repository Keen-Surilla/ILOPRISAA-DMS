import { supabase } from '../config/SupabaseClient';
import { REQUIRED_DOCUMENTS } from './documentsApi';
import type { DocumentType } from '../types/database.types.extras';
import { withAuthRetry } from '../../2-application-tier/utils/withAuthRetry';

export interface AthleteScreeningStatus {
  athleteId: string;
  name: string;
  email: string;
  dateOfBirth: string | null;
  division: string | null;
  yearLevel: string | null;
  eligibility: 'ready' | 'missing_documents' | 'pending_verification';
  missingTypes: DocumentType[];
  pendingTypes: DocumentType[];
}

export async function getScreeningRoster(
  coachId: string
): Promise<AthleteScreeningStatus[]> {
  const { data: athletes, error: athletesError } = await withAuthRetry(() =>
    supabase
      .from('team_members')
      .select('id, name, email, date_of_birth, division, year_level')
      .eq('coach_id', coachId)
      .eq('status', 'active')
  );

  if (athletesError) {
    console.error('Error fetching athletes for screening:', {
      message: athletesError.message,
      details: athletesError.details,
      hint: athletesError.hint,
      code: athletesError.code,
    });

    throw new Error(
      athletesError.message ||
        'Could not load your roster. Please try again.'
    );
  }

  if (!athletes || athletes.length === 0) return [];

  const athleteIds = athletes.map((a) => a.id);

  const { data: documents, error: docsError } = await withAuthRetry(() =>
    supabase
      .from('documents')
      .select('athlete_id, document_type, status')
      .in('athlete_id', athleteIds)
  );

  if (docsError) {
    console.error('Error fetching documents for screening:', {
      message: docsError.message,
      details: docsError.details,
      hint: docsError.hint,
      code: docsError.code,
    });

    throw new Error(
      docsError.message ||
        'Could not load document status. Please try again.'
    );
  }

  const requiredTypes = REQUIRED_DOCUMENTS.map((d) => d.type);

  return athletes.map((athlete) => {
    const athleteDocs = (documents ?? []).filter(
      (d) => d.athlete_id === athlete.id
    );

    const docsByType = new Map(
      athleteDocs.map((d) => [
        d.document_type as DocumentType,
        d.status,
      ])
    );

    const missingTypes = requiredTypes.filter(
      (type) => !docsByType.has(type)
    );

    const pendingTypes = requiredTypes.filter(
      (type) =>
        docsByType.has(type) &&
        docsByType.get(type) !== 'verified'
    );

    const hasUploadedAtLeastOneDoc = athleteDocs.length > 0;
    const isFullyVerified =
      missingTypes.length === 0 && pendingTypes.length === 0;

    let eligibility: AthleteScreeningStatus['eligibility'] =
      'missing_documents';

    if (isFullyVerified) {
      eligibility = 'ready';
    } else if (hasUploadedAtLeastOneDoc) {
      eligibility = 'pending_verification';
    }

    return {
      athleteId: athlete.id,
      name: athlete.name,
      email: athlete.email,
      dateOfBirth: athlete.date_of_birth,
      division: athlete.division,
      yearLevel: athlete.year_level,
      eligibility,
      missingTypes,
      pendingTypes,
    };
  });
}