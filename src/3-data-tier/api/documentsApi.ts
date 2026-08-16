import { supabase } from '../config/SupabaseClient';
import type { Database } from '../types/database.types';
import type { DocumentType } from '../types/database.types.extras';

import { withAuthRetry } from '../../2-application-tier/utils/withAuthRetry';

export type DocumentRow = Database['public']['Tables']['documents']['Row'];

export interface DocumentCategoryItem {
  type: DocumentType;
  label: string;
}

export interface DocumentCategory {
  id: string;
  title: string;
  items: DocumentCategoryItem[];
}

// Single source of truth for the whole checklist. Add/remove/reorder a
// requirement here and the accordion sections, progress bar, roster badge,
// and completion count all update automatically — nothing else to touch.
export const DOCUMENT_CATEGORIES: DocumentCategory[] = [
  {
    id: 'academic_records',
    title: 'Academic Records',
    items: [
      { type: 'transcript_sem1', label: 'Transcript Semester 1' },
      { type: 'transcript_sem2', label: 'Transcript Semester 2' },
    ],
  },
  {
    id: 'civil_identity',
    title: 'Civil Identity Documents',
    items: [
      { type: 'birth_cert_original', label: 'Original Birth Certificate' },
      { type: 'birth_cert_xerox', label: 'Xerox Birth Certificate' },
    ],
  },
  {
    id: 'medical_clearances',
    title: 'Medical Clearances',
    items: [
      { type: 'medical_cert_1', label: 'Medical Certificate 1' },
      { type: 'medical_cert_2', label: 'Medical Certificate 2' },
    ],
  },
  {
    id: 'visual_identification',
    title: 'Visual Identification',
    items: [
      { type: 'id_picture_1', label: '2x2 Picture 1' },
      { type: 'id_picture_2', label: '2x2 Picture 2' },
    ],
  },
  {
    id: 'legal_consent',
    title: 'Legal & Consent Requirements',
    items: [
      { type: 'parental_consent', label: 'Parental Consent' },
    ],
  },
];

// Derived, not hand-duplicated — flattening DOCUMENT_CATEGORIES instead of
// maintaining a second parallel list that could drift out of sync.
export const REQUIRED_DOCUMENTS: DocumentCategoryItem[] = DOCUMENT_CATEGORIES.flatMap(c => c.items);
export const TOTAL_REQUIRED_DOCUMENTS = REQUIRED_DOCUMENTS.length;

const BUCKET = 'athlete-documents';
const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME = ['application/pdf', 'image/jpeg', 'image/png'];
const UPLOAD_TIMEOUT_MS = 20_000; // never let the UI spin forever

export class DocumentApiError extends Error {
  readonly code: string;
  constructor(message: string, code: string) {
    super(message);
    this.name = 'DocumentApiError';
    this.code = code;
  }
}

function describeDbError(fallbackMessage: string, fallbackCode: string, error: unknown): DocumentApiError {
  const message = (error as { message?: string })?.message ?? '';
  if (message.includes('RATE_LIMIT_EXCEEDED')) {
    return new DocumentApiError("You're doing that too quickly. Please wait a moment and try again.", 'RATE_LIMITED');
  }
  return new DocumentApiError(fallbackMessage, fallbackCode);
}

function assertValidFile(file: File): void {
  if (file.size > MAX_FILE_BYTES) {
    throw new DocumentApiError('File is too large (max 10MB).', 'FILE_TOO_LARGE');
  }
  if (!ALLOWED_MIME.includes(file.type)) {
    throw new DocumentApiError('Only PDF, JPG, or PNG files are allowed.', 'INVALID_FILE_TYPE');
  }
}

async function hashFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function fileExtension(filename: string): string {
  const idx = filename.lastIndexOf('.');
  return idx >= 0 ? filename.slice(idx) : '';
}

function withTimeout<T>(operation: () => PromiseLike<T>, ms: number, timeoutMessage: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new DocumentApiError(timeoutMessage, 'TIMEOUT')), ms);
  });

  return Promise.race([Promise.resolve(operation()), timeout]).finally(() => {
    clearTimeout(timer);
  });
}

export const documentsApi = {
  async getDocumentsForAthlete(athleteId: string): Promise<DocumentRow[]> {
    const { data, error } = await withAuthRetry(() => supabase
      .from('documents')
      .select('*')
      .eq('athlete_id', athleteId));

    if (error) {
      console.error('API Error fetching documents:', error);
      throw new DocumentApiError('Could not load documents. Please try again.', 'FETCH_FAILED');
    }
    return data ?? [];
  },

  // One query for the whole roster's progress badges instead of one query
  // per athlete row.
  async getDocumentCountsForAthletes(athleteIds: string[]): Promise<Record<string, number>> {
    if (athleteIds.length === 0) return {};

    const { data, error } = await withAuthRetry(() => supabase
      .from('documents')
      .select('athlete_id, document_type')
      .in('athlete_id', athleteIds));

    if (error) {
      console.error('API Error fetching document counts:', error);
      throw new DocumentApiError('Could not load document status.', 'FETCH_FAILED');
    }

    const requiredTypes = new Set(REQUIRED_DOCUMENTS.map(d => d.type));
    const counts: Record<string, number> = {};
    for (const row of data ?? []) {
      if (!requiredTypes.has(row.document_type as DocumentType)) continue;
      counts[row.athlete_id] = (counts[row.athlete_id] ?? 0) + 1;
    }
    return counts;
  },

  // Counts documents by review status across the whole roster in one query
  // — powers the dashboard's "Pending Reviews" KPI.
  async getDocumentStatusCounts(athleteIds: string[]): Promise<Record<string, number>> {
    if (athleteIds.length === 0) return {};

    const { data, error } = await withAuthRetry(() => supabase
      .from('documents')
      .select('status')
      .in('athlete_id', athleteIds));

    if (error) {
      console.error('API Error fetching document status counts:', error);
      throw new DocumentApiError('Could not load document status.', 'FETCH_FAILED');
    }

    const counts: Record<string, number> = {};
    for (const row of data ?? []) {
      counts[row.status] = (counts[row.status] ?? 0) + 1;
    }
    return counts;
  },

  // Every document row already has created_at — reusing it here to
  // reconstruct historical completion progress, rather than requiring a
  // new column or a separate event-log table just for a trend chart.
  async getUploadTimestamps(athleteIds: string[]): Promise<string[]> {
    if (athleteIds.length === 0) return [];

    const { data, error } = await withAuthRetry(() => supabase
      .from('documents')
      .select('created_at')
      .in('athlete_id', athleteIds));

    if (error) {
      console.error('API Error fetching upload timestamps:', error);
      throw new DocumentApiError('Could not load upload history.', 'FETCH_FAILED');
    }
    return (data ?? []).map(row => row.created_at);
  },

  async uploadDocument(athleteId: string, documentType: DocumentType, file: File): Promise<DocumentRow> {
    assertValidFile(file);

    const digitalSignature = await hashFile(file);
    const storagePath = `${athleteId}/${documentType}${fileExtension(file.name)}`;

    const { error: uploadError } = await withAuthRetry(() => withTimeout(
      () => supabase.storage.from(BUCKET).upload(storagePath, file, { upsert: true, contentType: file.type }),
      UPLOAD_TIMEOUT_MS,
      'Upload timed out. Please check your connection and try again.'
    ));

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      throw new DocumentApiError('Could not upload the file. Please try again.', 'UPLOAD_FAILED');
    }

    // Upsert so re-uploading a slot replaces its existing row instead of
    // creating a duplicate — relies on the unique(athlete_id, document_type)
    // constraint from documents_requirements_migration.sql.
    const { data, error } = await withAuthRetry(() => withTimeout(
      () => supabase
        .from('documents')
        .upsert(
          {
            athlete_id: athleteId,
            document_type: documentType,
            status: 'pending_review',
            storage_path: storagePath,
            file_size_bytes: file.size,
            mime_type: file.type,
            original_filename: file.name.slice(0, 200),
            notes: null,
            digital_signature: digitalSignature,
            metadata: null,
          },
          { onConflict: 'athlete_id,document_type' }
        )
        .select()
        .single(),
      UPLOAD_TIMEOUT_MS,
      'Saving the file record timed out. Please try again.'
    ));

    if (error || !data) {
      console.error('DB error saving document record:', error);
      throw describeDbError('File uploaded, but saving the record failed. Please try again.', 'SAVE_FAILED', error);
    }
    return data;
  },

  // Bucket is private — files are only accessible via short-lived signed URLs.
  async getSignedUrl(storagePath: string): Promise<string> {
    const { data, error } = await withAuthRetry(() => supabase.storage
      .from(BUCKET)
      .createSignedUrl(storagePath, 60 * 5)); // 5 minutes

    if (error || !data) {
      throw new DocumentApiError('Could not generate a link to view this file.', 'SIGNED_URL_FAILED');
    }
    return data.signedUrl;
  },

  async removeDocument(documentId: string, storagePath: string): Promise<void> {
    const { error: storageError } = await withAuthRetry(() => supabase.storage.from(BUCKET).remove([storagePath]));
    if (storageError) {
      // Not fatal — the DB row is the source of truth for "is this slot
      // filled", so still remove the row even if the storage cleanup fails.
      console.error('Storage removal error (continuing):', storageError);
    }

    const { error } = await withAuthRetry(() => supabase.from('documents').delete().eq('id', documentId));
    if (error) {
      console.error('DB error removing document:', error);
      throw describeDbError('Could not remove this document. Please try again.', 'DELETE_FAILED', error);
    }
  },
};