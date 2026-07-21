/**
 * TIER 2 — APPLICATION TIER: Input Validators
 */

import type { DocumentType, DocumentStatus } from '../../3-data-tier/types/database.types';
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES, type AllowedMimeType } from '../../3-data-tier/services/documentService';

export interface ValidationResult<T = unknown> { valid: boolean; errors: string[]; sanitized: T | null; }
function ok<T>(sanitized: T): ValidationResult<T> { return { valid: true, errors: [], sanitized }; }
function fail<T>(errors: string[]): ValidationResult<T> { return { valid: false, errors, sanitized: null }; }

const VALID_DOCUMENT_TYPES = new Set<DocumentType>(['psa_certificate', 'medical_clearance', 'birth_certificate', 'school_id', 'parental_consent', 'physical_exam']);
const VALID_STATUSES = new Set<DocumentStatus>(['draft', 'pending_review', 'verified', 'action_required']);

export function sanitizeText(input: unknown, maxLength = 2000): string {
  if (typeof input !== 'string') return '';
  return input.slice(0, maxLength).replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;').replace(/\//g, '&#x2F;').replace(/\0/g, '').trim();
}

export function isValidUUID(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export interface UploadPayloadInput { athleteId: unknown; documentType: unknown; file: unknown; notes?: unknown; }
export interface ValidatedUploadPayload { athleteId: string; documentType: DocumentType; file: File; notes: string | undefined; }

export function validateUploadPayload(input: UploadPayloadInput): ValidationResult<ValidatedUploadPayload> {
  const errors: string[] = [];
  if (!isValidUUID(input.athleteId)) errors.push('Invalid athlete ID format.');
  if (!VALID_DOCUMENT_TYPES.has(input.documentType as DocumentType)) errors.push('Invalid document type.');
  if (!(input.file instanceof File)) {
    errors.push('No file provided.');
  } else {
    if (!ALLOWED_MIME_TYPES.includes(input.file.type as AllowedMimeType)) errors.push('File type not allowed. Accepted: PDF, JPG, PNG.');
    if (input.file.size > MAX_FILE_SIZE_BYTES) errors.push('File exceeds 5 MB size limit.');
    if (input.file.size === 0) errors.push('File is empty.');
  }
  if (errors.length > 0) return fail(errors);
  return ok({
    athleteId: input.athleteId as string,
    documentType: input.documentType as DocumentType,
    file: input.file as File,
    notes: input.notes !== undefined ? sanitizeText(input.notes, 500) : undefined,
  });
}

export interface StatusUpdateInput { documentId: unknown; newStatus: unknown; reviewerId: unknown; notes?: unknown; }
export interface ValidatedStatusUpdate { documentId: string; newStatus: DocumentStatus; reviewerId: string; notes: string | undefined; }

export function validateStatusUpdatePayload(input: StatusUpdateInput): ValidationResult<ValidatedStatusUpdate> {
  const errors: string[] = [];
  if (!isValidUUID(input.documentId)) errors.push('Invalid document ID format.');
  if (!VALID_STATUSES.has(input.newStatus as DocumentStatus)) errors.push('Invalid status value.');
  if (!isValidUUID(input.reviewerId)) errors.push('Invalid reviewer ID format.');
  if (errors.length > 0) return fail(errors);
  return ok({
    documentId: input.documentId as string,
    newStatus: input.newStatus as DocumentStatus,
    reviewerId: input.reviewerId as string,
    notes: input.notes !== undefined ? sanitizeText(input.notes, 500) : undefined,
  });
}



// --- Auth Validators Login---

export interface LoginValidationResult {
  valid: boolean;
  error: string | null;
  sanitizedEmail?: string;
}

export function validateLoginInput(email: string, password: string): LoginValidationResult {
  const trimmedEmail = email.trim();

  if (!trimmedEmail) {
    return { valid: false, error: 'Email is required.' };
  }
  // Basic email format check
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    return { valid: false, error: 'Please enter a valid email address.' };
  }
  if (!password) {
    return { valid: false, error: 'Password is required.' };
  }

  return { 
    valid: true, 
    error: null, 
    sanitizedEmail: trimmedEmail 
  };
}