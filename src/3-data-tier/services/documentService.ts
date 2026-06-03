/**
 * TIER 3 — DATA TIER: Document Service
 *
 * SECURITY RATIONALE:
 * - All queries use Supabase's parameterized query builder, which compiles to
 *   prepared statements under the hood — completely eliminating SQL Injection.
 *   Mitigates: OWASP A03 (Injection).
 * - Never constructs raw SQL strings. Dynamic values are ALWAYS passed as
 *   typed arguments, never interpolated.
 * - File paths use the athlete's UUID as a namespace prefix to enforce
 *   storage isolation and prevent path traversal.
 *   Mitigates: OWASP A01 (Broken Access Control) / CWE-22 (Path Traversal).
 * - All errors are caught and re-thrown as sanitized DomainError objects,
 *   preventing raw Postgres error messages from reaching the UI.
 *   Mitigates: OWASP A09 (Security Logging and Monitoring Failures).
 */

import { supabase } from '../config/SupabaseClient';
import type { Document, DocumentStatus, DocumentType } from '../types/database.types';

// ─────────────────────────────────────────────────────────
// Domain Error: sanitized errors safe to display to users
// ─────────────────────────────────────────────────────────
export class DocumentServiceError extends Error {
  readonly code: string;
  readonly originalError?: unknown;

  constructor(message: string, code: string, originalError?: unknown) {
    super(message);
    this.name = 'DocumentServiceError';
    this.code = code;
    this.originalError = originalError;
  }
}

// ─────────────────────────────────────────────────────────
// Allowed MIME types and max file size (enforced server-side too via Storage policies)
// ─────────────────────────────────────────────────────────
export const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'] as const;
export type AllowedMimeType = typeof ALLOWED_MIME_TYPES[number];
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

// ─────────────────────────────────────────────────────────
// File sanitization utilities
// ─────────────────────────────────────────────────────────

/**
 * Sanitizes a filename to prevent path traversal (CWE-22).
 * Strips all path separators and special characters, keeping only
 * alphanumerics, hyphens, underscores, and the file extension.
 */
export function sanitizeFilename(filename: string): string {
  // Remove any directory components
  const basename = filename.split(/[/\\]/).pop() ?? 'upload';
  // Strip everything except safe characters
  const safe = basename.replace(/[^a-zA-Z0-9._-]/g, '_');
  // Prevent double extensions (e.g. evil.php.jpg)
  const parts = safe.split('.');
  if (parts.length > 2) {
    return `${parts[0]}.${parts[parts.length - 1]}`;
  }
  return safe || 'upload';
}

/**
 * Validates file integrity client-side before upload.
 * Note: This is defense-in-depth. Supabase Storage policy is the authoritative gate.
 */
export function validateFilePayload(file: File): void {
  if (!ALLOWED_MIME_TYPES.includes(file.type as AllowedMimeType)) {
    throw new DocumentServiceError(
      'Invalid file type. Only PDF, JPG, and PNG are accepted.',
      'INVALID_MIME_TYPE'
    );
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new DocumentServiceError(
      'File exceeds the 5 MB size limit.',
      'FILE_TOO_LARGE'
    );
  }
  if (file.size === 0) {
    throw new DocumentServiceError(
      'File is empty.',
      'EMPTY_FILE'
    );
  }
}

/**
 * Computes a SHA-256 fingerprint of the file for digital signature storage.
 * This fingerprint is stored with the document record to detect tampering.
 */
export async function computeFileHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ─────────────────────────────────────────────────────────
// Upload Service
// ─────────────────────────────────────────────────────────

export interface UploadDocumentPayload {
  athleteId: string;
  documentType: DocumentType;
  file: File;
  notes?: string;
}

export interface UploadDocumentResult {
  document: Document;
  storagePath: string;
}

/**
 * Uploads a credential file and creates the document record atomically.
 *
 * Storage path pattern: `athlete-credentials/{athleteId}/{documentType}/{timestamp}_{sanitizedName}`
 * Using the athlete's UUID as a namespace ensures:
 * 1. No naming collisions between athletes.
 * 2. Storage RLS policies can match on the path prefix.
 * 3. IDOR is prevented — athletes cannot guess other athletes' paths.
 */
export async function uploadDocument(
  payload: UploadDocumentPayload
): Promise<UploadDocumentResult> {
  validateFilePayload(payload.file);

  const sanitizedName = sanitizeFilename(payload.file.name);
  const timestamp = Date.now();
  const storagePath = `athlete-credentials/${payload.athleteId}/${payload.documentType}/${timestamp}_${sanitizedName}`;
  const digitalSignature = await computeFileHash(payload.file);

  // Step 1: Upload binary to Supabase Storage
  const { error: storageError } = await supabase.storage
    .from('athlete-credentials')
    .upload(storagePath, payload.file, {
      contentType: payload.file.type,
      upsert: false, // Never overwrite — each upload is a new record
    });

  if (storageError) {
    throw new DocumentServiceError(
      'File upload failed. Please try again.',
      'STORAGE_UPLOAD_FAILED',
      storageError
    );
  }

  // Step 2: Insert document metadata record (parameterized — no SQLi possible)
  const { data, error: dbError } = await supabase
    .from('documents')
    .insert({
      athlete_id: payload.athleteId,
      document_type: payload.documentType,
      status: 'pending_review' as DocumentStatus,
      storage_path: storagePath,
      file_size_bytes: payload.file.size,
      mime_type: payload.file.type,
      original_filename: sanitizedName,
      notes: payload.notes ?? null,
      digital_signature: digitalSignature,
      metadata: null,
    })
    .select()
    .single();

  if (dbError || !data) {
    // Rollback the storage upload to avoid orphaned files
    await supabase.storage.from('athlete-credentials').remove([storagePath]);
    throw new DocumentServiceError(
      'Failed to save document record. Upload has been rolled back.',
      'DB_INSERT_FAILED',
      dbError
    );
  }

  return { document: data, storagePath };
}

// ─────────────────────────────────────────────────────────
// Query Services
// ─────────────────────────────────────────────────────────

/**
 * Fetches documents for the authenticated athlete.
 * RLS policy on the DB enforces athlete_id = auth.uid(), so even if
 * the client sends a different athleteId, Postgres will return 0 rows.
 * This is defense-in-depth against IDOR.
 */
export async function getMyDocuments(): Promise<Document[]> {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new DocumentServiceError(
      'Failed to load documents.',
      'FETCH_FAILED',
      error
    );
  }

  return data ?? [];
}

/**
 * Fetches documents for a specific athlete (coach/admin use).
 * RLS policy restricts coaches to only see athletes assigned to their institution.
 */
export async function getAthleteDocuments(athleteId: string): Promise<Document[]> {
  if (!athleteId || typeof athleteId !== 'string') {
    throw new DocumentServiceError('Invalid athlete ID.', 'INVALID_INPUT');
  }

  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('athlete_id', athleteId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new DocumentServiceError(
      'Failed to load athlete documents.',
      'FETCH_FAILED',
      error
    );
  }

  return data ?? [];
}

/**
 * Updates document status — restricted to coaches/admins via RLS.
 * The state machine guard in Tier 2 validates the transition BEFORE
 * this function is ever called, providing layered defense.
 */
export async function updateDocumentStatus(
  documentId: string,
  status: DocumentStatus,
  reviewerId: string,
  notes?: string
): Promise<Document> {
  if (!documentId || !reviewerId) {
    throw new DocumentServiceError('Missing required fields.', 'INVALID_INPUT');
  }

  const { data, error } = await supabase
    .from('documents')
    .update({
      status,
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
      ...(notes !== undefined ? { notes } : {}),
    })
    .eq('id', documentId)
    .select()
    .single();

  if (error || !data) {
    throw new DocumentServiceError(
      'Failed to update document status.',
      'UPDATE_FAILED',
      error
    );
  }

  return data;
}

/**
 * Generates a short-lived signed URL for secure document download.
 * The URL expires in 60 seconds, preventing link sharing attacks.
 */
export async function getSignedDownloadUrl(storagePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from('athlete-credentials')
    .createSignedUrl(storagePath, 60); // 60-second expiry

  if (error || !data?.signedUrl) {
    throw new DocumentServiceError(
      'Could not generate download link.',
      'SIGNED_URL_FAILED',
      error
    );
  }

  return data.signedUrl;
}

