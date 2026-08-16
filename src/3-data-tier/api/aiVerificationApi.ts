import { supabase } from '../config/SupabaseClient';
import type { DocumentType } from '../types/database.types.extras';
// Maps your granular document slots to the broader categories
// the verify-document Edge Function validates against.
export const AI_DOCUMENT_TYPE_MAP: Partial<Record<DocumentType, string>> = {
  birth_cert_original: 'birth_certificate',
  birth_cert_xerox: 'birth_certificate',
  transcript_sem1: 'transcript',
  transcript_sem2: 'transcript',
  medical_cert_1: 'medical',
  medical_cert_2: 'medical',
  parental_consent: 'consent',
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