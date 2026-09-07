import { supabase } from '../config/SupabaseClient';
import { findSchool } from '../constant/schools';

export type DocumentStatus = 'draft' | 'pending_review' | 'verified' | 'action_required' | 'expired';

export interface DocumentRecordRow {
  id: string;
  athlete_id: string;
  document_type: string;
  document_category: string | null;
  status: DocumentStatus;
  original_filename: string;
  storage_path: string;
  rejection_reason: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  athlete_name: string;
  coach_name: string;
  institution_id: string | null;
  school_id: string | null;
  school_name: string | null;
  division: string | null;
  sport: string | null;
  gender: string | null;
}

export interface RecordsFilters {
  schoolId?: string;      // canonical School.id, e.g. 'WIT'
  athleteQuery?: string;  // free-text match on athlete/coach name
  documentType?: string;
  status?: DocumentStatus;
  division?: string;
  sport?: string;
  gender?: string;
}

export async function getAllDocumentRecords(): Promise<DocumentRecordRow[]> {
  const { data: documents, error: docsError } = await supabase
    .from('documents')
    .select(
      'id, athlete_id, document_type, document_category, status, original_filename, storage_path, rejection_reason, reviewed_by, reviewed_at, created_at, updated_at'
    )
    .order('created_at', { ascending: false });

  if (docsError) {
    console.error('Error fetching document records:', docsError);
    throw new Error('Could not load document records. Please try again.');
  }

  if (!documents || documents.length === 0) return [];

  const athleteIds = [...new Set(documents.map((d) => d.athlete_id))];

  const { data: athletes, error: athletesError } = await supabase
    .from('team_members')
    .select('id, name, coach_id, division, user_id, sport, gender')
    .in('id', athleteIds);

  if (athletesError) {
    console.error('Error fetching athletes:', athletesError);
    throw new Error('Could not load athlete info. Please try again.');
  }

  const coachIds = [...new Set((athletes ?? []).map((a) => a.coach_id).filter(Boolean))];

  const { data: coaches, error: coachesError } = await supabase
    .from('profiles')
    .select('id, full_name, institution_id')
    .in('id', coachIds);

  if (coachesError) {
    console.error('Error fetching coaches:', coachesError);
    throw new Error('Could not load coach info. Please try again.');
  }

  const athleteMap = new Map((athletes ?? []).map((a) => [a.id, a]));
  const coachMap = new Map((coaches ?? []).map((c) => [c.id, c]));

  return documents.map((doc) => {
    const athlete = athleteMap.get(doc.athlete_id);
    const coach = athlete ? coachMap.get(athlete.coach_id) : undefined;
    const school = findSchool(coach?.institution_id ?? null);
    return {
      id: doc.id,
      athlete_id: doc.athlete_id,
      document_type: doc.document_type,
      document_category: doc.document_category,
      status: doc.status as DocumentStatus,
      original_filename: doc.original_filename,
      storage_path: doc.storage_path,
      rejection_reason: doc.rejection_reason,
      reviewed_by: doc.reviewed_by,
      reviewed_at: doc.reviewed_at,
      created_at: doc.created_at,
      updated_at: doc.updated_at,
      athlete_name: athlete?.name ?? 'Unknown',
      coach_name: coach?.full_name ?? 'Unknown',
      institution_id: coach?.institution_id ?? null,
      school_id: school?.id ?? null,
      school_name: school?.name ?? null,
      division: athlete?.division ?? null,
      sport: athlete?.sport ?? null,
      gender: athlete?.gender ?? null,
    };
  });
}

export function applyRecordsFilters(rows: DocumentRecordRow[], filters: RecordsFilters): DocumentRecordRow[] {
  return rows.filter((row) => {
    if (filters.schoolId && row.school_id !== filters.schoolId) return false;
    if (filters.documentType && row.document_type !== filters.documentType) return false;
    if (filters.status && row.status !== filters.status) return false;
    if (filters.division && row.division !== filters.division) return false;
    if (filters.sport && row.sport !== filters.sport) return false;
    if (filters.gender && row.gender !== filters.gender) return false;
    if (filters.athleteQuery) {
      const q = filters.athleteQuery.trim().toLowerCase();
      if (q && !row.athlete_name.toLowerCase().includes(q) && !row.coach_name.toLowerCase().includes(q) && !(row.sport ?? '').toLowerCase().includes(q) && !(row.gender ?? '').toLowerCase().includes(q)) return false;
    }
    return true;
  });
}