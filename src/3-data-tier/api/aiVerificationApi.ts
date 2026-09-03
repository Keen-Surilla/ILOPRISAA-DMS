import { supabase } from '../config/SupabaseClient';
import type { DocumentType } from '../types/database.types.extras';
// Maps your granular document slots to the broader categories
// the verify-document Edge Function validates against.
export const AI_DOCUMENT_TYPE_MAP: Partial<Record<DocumentType, string>> = {
  birth_certificate_copy1: 'birth_certificate',
  birth_certificate_copy2: 'birth_certificate',
  tor_1st_sem: 'transcript',
  tor_2nd_sem: 'transcript',
  medical_clearance_copy1: 'medical',
  medical_clearance_copy2: 'medical',
  data_privacy_consent: 'consent',
  waiver: 'consent',
};

export interface AIVerificationResult {
  success: boolean;
  error?: string;
  data?: {
    name: string;
    dateOfBirth: string;
    dobSource: string | null;
    verified: boolean;
    confidence: string;
  };
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // reader.result is "data:image/jpeg;base64,XXXXX" — strip the prefix
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = () => reject(new Error('Could not read file for verification.'));
    reader.readAsDataURL(file);
  });
}


export async function verifyDocumentAI(
  file: File,
  documentType: DocumentType
): Promise<AIVerificationResult> {
  const aiType = AI_DOCUMENT_TYPE_MAP[documentType];

  // Not every document type needs AI verification (e.g. if you add a new
  // slot later that isn't mapped yet) — skip gracefully instead of erroring.
  if (!aiType) {
    return { success: true };
  }

  // PDFs aren't images — Vision's DOCUMENT_TEXT_DETECTION here expects an
  // image payload, so skip AI verification for PDF uploads for now.
  if (file.type === 'application/pdf') {
    return { success: true };
  }

  try {
    const base64Image = await fileToBase64(file);

    const { data, error } = await supabase.functions.invoke('verify-document', {
      body: { base64Image, documentType: aiType },
    });

    if (error) {
      console.error('AI verification invoke error:', error);
      return {
        success: false,
        error: 'Document verification failed. Please try again.',
      };
    }

    if (!data.success) {
      return { success: false, error: data.error ?? 'Document verification failed.' };
    }

    return { success: true, data: data.data };
  } catch (err) {
    console.error('AI verification error:', err);
    return { success: false, error: 'Could not verify this document. Please try again.' };
  }
}

export interface ClassificationResult {
  success: boolean;
  error?: string;
  documentType?: DocumentType | null;
  confidence?: 'high' | 'medium' | 'low';
  /**
   * The full OCR text Cloud Vision extracted from the page. Exposed so callers
   * (e.g. the team-wide bulk uploader) can search it for an athlete's name
   * without triggering a second Vision API call — this one already ran
   * DOCUMENT_TEXT_DETECTION to figure out the category.
   */
  fullText?: string;
}

/**
 * Reverse lookup: broad AI category (e.g. 'transcript') -> the FIRST matching
 * granular DocumentType slot (e.g. 'tor_1st_sem'). Since one AI category maps
 * to two slots (sem1/sem2, copy1/copy2), this only picks a starting guess —
 * the coach still confirms/adjusts which specific slot in the UI, this never
 * silently overwrites without confirmation.
 */
const CATEGORY_TO_DEFAULT_SLOT: Record<string, DocumentType> = Object.entries(AI_DOCUMENT_TYPE_MAP).reduce(
  (acc, [slot, category]) => {
    if (category && !(category in acc)) acc[category] = slot as DocumentType;
    return acc;
  },
  {} as Record<string, DocumentType>
);

/**
 * Classifies which document-type slot an uploaded file most likely belongs to,
 * using the same 'classify-document' Edge Function (Cloud Vision OCR + keyword
 * matching). This is separate from verifyDocumentAI(), which checks IDENTITY
 * (name/DOB) for a slot the coach already picked — this instead guesses the
 * SLOT itself, for the bulk-upload flow.
 *
 * NOTE: requires a 'classify-document' Edge Function to be deployed — this
 * does not exist yet and needs to be created in Supabase (see accompanying
 * classify-document/index.ts).
 */
export async function classifyDocumentType(file: File): Promise<ClassificationResult> {
  if (file.type === 'application/pdf') {
    // Same limitation as verifyDocumentAI: Vision's DOCUMENT_TEXT_DETECTION
    // here expects an image payload, not PDF bytes.
    return { success: true, documentType: null, confidence: 'low' };
  }

  try {
    const base64Image = await fileToBase64(file);

    const { data, error } = await supabase.functions.invoke('classify-document', {
      body: { base64Image },
    });

    if (error) {
      console.error('AI classification invoke error:', error);
      return { success: false, error: 'Could not classify this file.' };
    }

    if (!data?.success) {
      return { success: false, error: data?.error ?? 'Could not classify this file.' };
    }

    const guessedCategory: string | null = data.category ?? null;
    const documentType = guessedCategory ? CATEGORY_TO_DEFAULT_SLOT[guessedCategory] ?? null : null;

    return {
      success: true,
      documentType,
      confidence: data.confidence ?? 'low',
      fullText: data.fullText ?? '',
    };
  } catch (err) {
    console.error('AI classification error:', err);
    return { success: false, error: 'Could not classify this file.' };
  }
}

export async function updateAthleteDOB(athleteId: string, dateOfBirth: string): Promise<void> {
  const { error } = await supabase
    .from('team_members')
    .update({ date_of_birth: dateOfBirth })
    .eq('id', athleteId);

  if (error) {
    console.error('Error updating athlete DOB:', error);
    throw new Error('Could not save the date of birth.');
  }
}