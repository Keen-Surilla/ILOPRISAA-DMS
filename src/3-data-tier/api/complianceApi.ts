import { supabase } from '../config/SupabaseClient';
import { findSchool } from '../constant/schools';
import { REQUIRED_DOCUMENTS, TOTAL_REQUIRED_DOCUMENTS } from './documentsApi';

export interface AthleteComplianceRow {
  athleteId: string;
  athleteName: string;
  coachName: string;
  schoolId: string | null;
  schoolName: string | null;
  verifiedCount: number;
  isComplete: boolean;
}

export interface SchoolComplianceSummary {
  schoolId: string;
  schoolName: string;
  totalAthletes: number;
  clearedAthletes: number;
}

// A slot only counts toward compliance once it's actually verified — matches
// the "isSlotFilled" logic in DocumentChecklistModal.tsx, except stricter:
// that modal also counts pending_review as "filled" for progress purposes,
// but compliance here means fully cleared, so only 'verified' counts.
const REQUIRED_TYPES = new Set(REQUIRED_DOCUMENTS.map((d) => d.type));

export async function getComplianceOverview(): Promise<{
  athletes: AthleteComplianceRow[];
  schools: SchoolComplianceSummary[];
}> {
  const { data: athletes, error: athletesError } = await supabase
    .from('team_members')
    .select('id, name, coach_id')
    .eq('status', 'active');

  if (athletesError) {
    console.error('Error fetching athletes for compliance overview:', athletesError);
    throw new Error('Could not load athlete roster. Please try again.');
  }

  if (!athletes || athletes.length === 0) return { athletes: [], schools: [] };

  const athleteIds = athletes.map((a) => a.id);
  const coachIds = [...new Set(athletes.map((a) => a.coach_id).filter(Boolean))];

  const { data: coaches, error: coachesError } = await supabase
    .from('profiles')
    .select('id, full_name, institution_id')
    .in('id', coachIds);

  if (coachesError) {
    console.error('Error fetching coaches for compliance overview:', coachesError);
    throw new Error('Could not load coach info. Please try again.');
  }

  const { data: documents, error: docsError } = await supabase
    .from('documents')
    .select('athlete_id, document_type, status')
    .in('athlete_id', athleteIds)
    .eq('status', 'verified');

  if (docsError) {
    console.error('Error fetching documents for compliance overview:', docsError);
    throw new Error('Could not load document data. Please try again.');
  }

  const coachMap = new Map((coaches ?? []).map((c) => [c.id, c]));

  // athlete_id -> set of verified required document types on file
  const verifiedByAthlete = new Map<string, Set<string>>();
  for (const doc of documents ?? []) {
    if (!REQUIRED_TYPES.has(doc.document_type as any)) continue;
    if (!verifiedByAthlete.has(doc.athlete_id)) verifiedByAthlete.set(doc.athlete_id, new Set());
    verifiedByAthlete.get(doc.athlete_id)!.add(doc.document_type);
  }

  const athleteRows: AthleteComplianceRow[] = athletes.map((athlete) => {
    const coach = coachMap.get(athlete.coach_id);
    const school = findSchool(coach?.institution_id ?? null);
    const verifiedCount = verifiedByAthlete.get(athlete.id)?.size ?? 0;
    return {
      athleteId: athlete.id,
      athleteName: athlete.name,
      coachName: coach?.full_name ?? 'Unknown',
      schoolId: school?.id ?? null,
      schoolName: school?.name ?? null,
      verifiedCount,
      isComplete: verifiedCount === TOTAL_REQUIRED_DOCUMENTS,
    };
  });

  const schoolMap = new Map<string, SchoolComplianceSummary>();
  for (const row of athleteRows) {
    const key = row.schoolId ?? 'UNASSIGNED';
    const name = row.schoolName ?? 'Unassigned School';
    if (!schoolMap.has(key)) {
      schoolMap.set(key, { schoolId: key, schoolName: name, totalAthletes: 0, clearedAthletes: 0 });
    }
    const summary = schoolMap.get(key)!;
    summary.totalAthletes += 1;
    if (row.isComplete) summary.clearedAthletes += 1;
  }

  const schools = Array.from(schoolMap.values()).sort((a, b) => a.schoolName.localeCompare(b.schoolName));

  return { athletes: athleteRows, schools };
}

export interface ExpiringDocumentRow {
  id: string;
  athleteName: string;
  coachName: string;
  schoolName: string | null;
  documentType: string;
  reviewedAt: string;
  expiresAt: string;
  daysUntilExpiry: number;
}

// Annual documents are valid for 10 months from verification (see
// expire_stale_annual_documents() in Postgres, which transitions them to
// 'expired' on the same schedule). This tracker surfaces ones approaching
// that mark before the cron job flips them, so committee/coaches have advance
// warning rather than finding out only after a document has already expired.
const VALIDITY_MONTHS = 10;
const WARNING_WINDOW_DAYS = 30;

export async function getExpiringDocuments(): Promise<ExpiringDocumentRow[]> {
  const { data: documents, error: docsError } = await supabase
    .from('documents')
    .select('id, athlete_id, document_type, reviewed_at')
    .eq('status', 'verified')
    .eq('document_category', 'annual')
    .not('reviewed_at', 'is', null);

  if (docsError) {
    console.error('Error fetching documents for expiry tracker:', docsError);
    throw new Error('Could not load document data. Please try again.');
  }

  if (!documents || documents.length === 0) return [];

  const athleteIds = [...new Set(documents.map((d) => d.athlete_id))];

  const { data: athletes, error: athletesError } = await supabase
    .from('team_members')
    .select('id, name, coach_id')
    .in('id', athleteIds);

  if (athletesError) {
    console.error('Error fetching athletes for expiry tracker:', athletesError);
    throw new Error('Could not load athlete info. Please try again.');
  }

  const coachIds = [...new Set((athletes ?? []).map((a) => a.coach_id).filter(Boolean))];

  const { data: coaches, error: coachesError } = await supabase
    .from('profiles')
    .select('id, full_name, institution_id')
    .in('id', coachIds);

  if (coachesError) {
    console.error('Error fetching coaches for expiry tracker:', coachesError);
    throw new Error('Could not load coach info. Please try again.');
  }

  const athleteMap = new Map((athletes ?? []).map((a) => [a.id, a]));
  const coachMap = new Map((coaches ?? []).map((c) => [c.id, c]));

  const now = Date.now();
  const rows: ExpiringDocumentRow[] = [];

  for (const doc of documents) {
    const reviewedAt = new Date(doc.reviewed_at as string);
    const expiresAt = new Date(reviewedAt);
    expiresAt.setMonth(expiresAt.getMonth() + VALIDITY_MONTHS);

    const daysUntilExpiry = Math.ceil((expiresAt.getTime() - now) / (1000 * 60 * 60 * 24));
    if (daysUntilExpiry > WARNING_WINDOW_DAYS) continue; // not close enough yet

    const athlete = athleteMap.get(doc.athlete_id);
    const coach = athlete ? coachMap.get(athlete.coach_id) : undefined;
    const school = findSchool(coach?.institution_id ?? null);

    rows.push({
      id: doc.id,
      athleteName: athlete?.name ?? 'Unknown',
      coachName: coach?.full_name ?? 'Unknown',
      schoolName: school?.name ?? null,
      documentType: doc.document_type,
      reviewedAt: doc.reviewed_at as string,
      expiresAt: expiresAt.toISOString(),
      daysUntilExpiry,
    });
  }

  return rows.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
}