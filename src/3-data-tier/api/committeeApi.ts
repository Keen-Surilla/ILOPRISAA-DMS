import { supabase } from '../config/SupabaseClient';
import { transitionDocumentStatus } from '../services/documentStateMachine';

export interface PendingDocumentRow {
  id: string;
  athlete_id: string;
  document_type: string;
  status: string;
  original_filename: string;
  storage_path: string;
  created_at: string;
  athlete_name: string;
  coach_name: string;
  institution_id: string | null;
}

export async function getPendingDocuments(): Promise<PendingDocumentRow[]> {
  const { data: documents, error: docsError } = await supabase
    .from('documents')
    .select('id, athlete_id, document_type, status, original_filename, storage_path, created_at')
    .eq('status', 'pending_review')
    .order('created_at', { ascending: true });

  if (docsError) {
    console.error('Error fetching pending documents:', docsError);
    throw new Error('Could not load pending documents. Please try again.');
  }

  if (!documents || documents.length === 0) return [];

  const athleteIds = [...new Set(documents.map((d) => d.athlete_id))];

  const { data: athletes, error: athletesError } = await supabase
    .from('team_members')
    .select('id, name, coach_id')
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
    return {
      id: doc.id,
      athlete_id: doc.athlete_id,
      document_type: doc.document_type,
      status: doc.status,
      original_filename: doc.original_filename,
      storage_path: doc.storage_path,
      created_at: doc.created_at,
      athlete_name: athlete?.name ?? 'Unknown',
      coach_name: coach?.full_name ?? 'Unknown',
      institution_id: coach?.institution_id ?? null,
    };
  });
}

export async function verifyDocument(documentId: string, reviewerId: string): Promise<void> {
  try {
    await transitionDocumentStatus(supabase, {
      documentId,
      from: 'pending_review',
      to: 'verified',
      reviewerId,
    });
  } catch (error) {
    console.error('Error verifying document:', error);
    throw new Error('Could not verify this document. Please try again.');
  }
}

export async function rejectDocument(documentId: string, reviewerId: string, notes: string): Promise<void> {
  try {
    await transitionDocumentStatus(supabase, {
      documentId,
      from: 'pending_review',
      to: 'action_required',
      rejectionReason: notes,
      reviewerId,
    });
  } catch (error) {
    console.error('Error rejecting document:', error);
    throw new Error('Could not reject this document. Please try again.');
  }
}

export async function getSignedUrl(storagePath: string): Promise<string> {
  const { data, error } = await supabase.storage.from('athlete-documents').createSignedUrl(storagePath, 60 * 5);
  if (error || !data) throw new Error('Could not generate a link to view this file.');
  return data.signedUrl;
}