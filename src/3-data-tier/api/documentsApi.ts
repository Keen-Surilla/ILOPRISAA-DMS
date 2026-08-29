import { supabase } from '../config/SupabaseClient';
import { transitionDocumentStatus } from '../services/documentStateMachine';
import type { Document, DocumentType } from '../types/database.types.extras';

// Total number of document slots (permanent + annual) required per athlete per cycle.
export const TOTAL_REQUIRED_DOCUMENTS = 8;

export type DocumentRow = Document;

export interface RequiredDocumentItem {
  type: DocumentType;
  label: string;
  category: 'permanent' | 'annual';
}

export interface DocumentCategoryGroup {
  id: 'permanent' | 'annual';
  title: string;
  items: RequiredDocumentItem[];
}

export const DOCUMENT_CATEGORIES: DocumentCategoryGroup[] = [
  {
    id: 'permanent',
    title: 'Permanent Documents',
    items: [
      { type: 'birth_certificate_copy1', label: 'Birth Certificate (Copy 1)', category: 'permanent' },
      { type: 'birth_certificate_copy2', label: 'Birth Certificate (Copy 2)', category: 'permanent' },
      { type: 'data_privacy_consent', label: 'Data Privacy Consent', category: 'permanent' },
    ],
  },
  {
    id: 'annual',
    title: 'Annual Documents',
    items: [
      { type: 'waiver', label: 'Waiver', category: 'annual' },
      { type: 'tor_1st_sem', label: 'Transcript of Records (1st Sem)', category: 'annual' },
      { type: 'tor_2nd_sem', label: 'Transcript of Records (2nd Sem)', category: 'annual' },
      { type: 'medical_clearance_copy1', label: 'Medical Clearance (Copy 1)', category: 'annual' },
      { type: 'medical_clearance_copy2', label: 'Medical Clearance (Copy 2)', category: 'annual' },
    ],
  },
];

// Flat list of all 8 required document slots, derived from DOCUMENT_CATEGORIES above.
export const REQUIRED_DOCUMENTS: RequiredDocumentItem[] = DOCUMENT_CATEGORIES.flatMap((c) => c.items);

// Quick lookup of permanent/annual for a given document_type, used when saving a new upload.
const DOCUMENT_TYPE_CATEGORY: Record<string, 'permanent' | 'annual'> = Object.fromEntries(
  REQUIRED_DOCUMENTS.map((d) => [d.type, d.category])
);

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

/**
 * Number of submitted document slots per athlete (verified or pending_review).
 * Documents in 'action_required' are excluded since they need to be re-submitted
 * and shouldn't count toward a "complete" checklist.
 * NOTE: adjust the status list below if your state machine uses different values.
 */
export async function getDocumentCountsForAthletes(athleteIds: string[]): Promise<Record<string, number>> {
  if (athleteIds.length === 0) return {};

  const { data, error } = await supabase
    .from('documents')
    .select('athlete_id, status')
    .in('athlete_id', athleteIds)
    .in('status', ['verified', 'pending_review']);

  if (error) {
    console.error('Error fetching document counts:', error);
    throw new Error('Could not load document counts. Please try again.');
  }

  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    counts[row.athlete_id] = (counts[row.athlete_id] ?? 0) + 1;
  }
  return counts;
}

/**
 * Counts of documents grouped by status across the given athletes.
 * e.g. { pending_review: 4, verified: 12, action_required: 1 }
 */
export async function getDocumentStatusCounts(athleteIds: string[]): Promise<Record<string, number>> {
  if (athleteIds.length === 0) return {};

  const { data, error } = await supabase
    .from('documents')
    .select('status')
    .in('athlete_id', athleteIds);

  if (error) {
    console.error('Error fetching document status counts:', error);
    throw new Error('Could not load document status counts. Please try again.');
  }

  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    counts[row.status] = (counts[row.status] ?? 0) + 1;
  }
  return counts;
}

/**
 * Raw created_at timestamps for every document belonging to the given athletes.
 * Used to build the cumulative "Activity Overview" trend line.
 */
export async function getUploadTimestamps(athleteIds: string[]): Promise<string[]> {
  if (athleteIds.length === 0) return [];

  const { data, error } = await supabase
    .from('documents')
    .select('created_at')
    .in('athlete_id', athleteIds);

  if (error) {
    console.error('Error fetching upload timestamps:', error);
    throw new Error('Could not load upload timestamps. Please try again.');
  }

  return (data ?? []).map((row) => row.created_at);
}

/**
 * All documents currently on file for one athlete (used by the checklist modal).
 */
export async function getDocumentsForAthlete(athleteId: string): Promise<DocumentRow[]> {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('athlete_id', athleteId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching documents for athlete:', error);
    throw new Error("Could not load this athlete's documents. Please try again.");
  }

  return (data ?? []) as DocumentRow[];
}

/**
 * Uploads a file for one checklist slot (document_type) and saves the row.
 * Also used for "Replace" in the checklist modal — if a document already exists
 * for this athlete + type, the old file and row are removed first so the slot
 * only ever holds one current file.
 */
export async function uploadDocument(
  athleteId: string,
  type: DocumentType,
  file: File
): Promise<DocumentRow> {
  const { data: existing, error: existingError } = await supabase
    .from('documents')
    .select('id, storage_path')
    .eq('athlete_id', athleteId)
    .eq('document_type', type)
    .maybeSingle();

  if (existingError) {
    console.error('Error checking for existing document:', existingError);
    throw new Error('Could not check for an existing file. Please try again.');
  }

  if (existing) {
    await removeDocument(existing.id, existing.storage_path);
  }

  const storagePath = `${athleteId}/${type}/${Date.now()}-${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from('athlete-documents')
    .upload(storagePath, file, { upsert: false });

  if (uploadError) {
    console.error('Error uploading file:', uploadError);
    throw new Error('Could not upload file. Please try again.');
  }

  const { data, error: insertError } = await supabase
    .from('documents')
    .insert({
      athlete_id: athleteId,
      document_type: type,
      document_category: DOCUMENT_TYPE_CATEGORY[type] ?? null,
      original_filename: file.name,
      mime_type: file.type,
      file_size_bytes: file.size,
      storage_path: storagePath,
      status: 'pending_review',
    })
    .select()
    .single();

  if (insertError) {
    // Clean up the orphaned storage file since the row failed to save.
    await supabase.storage.from('athlete-documents').remove([storagePath]);
    console.error('Error saving document record:', insertError);
    throw new Error('Could not save this document. Please try again.');
  }

  return data as DocumentRow;
}

/**
 * Removes a document's file from storage and deletes its row.
 */
export async function removeDocument(documentId: string, storagePath: string): Promise<void> {
  const { error: storageError } = await supabase.storage.from('athlete-documents').remove([storagePath]);
  if (storageError) {
    console.error('Error removing file from storage:', storageError);
    throw new Error('Could not remove file from storage. Please try again.');
  }

  const { error: dbError } = await supabase.from('documents').delete().eq('id', documentId);
  if (dbError) {
    console.error('Error removing document record:', dbError);
    throw new Error('Could not remove this document. Please try again.');
  }
}

// Grouped object so callers can do `documentsApi.getX(...)` (used by CoachDashboard.tsx
// and DocumentChecklistModal.tsx). Individual named exports above are kept for any
// files importing them directly.
export const documentsApi = {
  getPendingDocuments,
  verifyDocument,
  rejectDocument,
  getSignedUrl,
  getDocumentCountsForAthletes,
  getDocumentStatusCounts,
  getUploadTimestamps,
  getDocumentsForAthlete,
  uploadDocument,
  removeDocument,
};