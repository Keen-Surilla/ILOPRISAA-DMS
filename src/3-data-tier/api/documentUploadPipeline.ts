import { supabase } from '../config/SupabaseClient';
import { documentsApi, type DocumentRow } from './documentsApi';
import { verifyDocumentAI, updateAthleteDOB, type AIVerificationResult } from './aiVerificationApi';
import type { DocumentType } from '../types/database.types.extras';

export interface AgeWarning {
  age: number;
  asOfDate: string;
}

export interface UploadPipelineResult {
  success: boolean;
  error?: string;
  ageWarning?: AgeWarning;
  data?: DocumentRow;
}

/**
 * The shared steps after identity verification has already run: check PRISAA
 * age eligibility from the extracted DOB (without overwriting it if the
 * athlete would be over the age limit), then save the file. Both
 * uploadAthleteDocument() (single-athlete flow) and the team-wide bulk
 * uploader call this same function so behavior never drifts between them.
 */
export async function finalizeAthleteDocumentUpload(
  athleteId: string,
  type: DocumentType,
  file: File,
  eligibilityCheckDate: string | null | undefined,
  aiResult: AIVerificationResult
): Promise<UploadPipelineResult> {
  let ageWarning: AgeWarning | undefined;

  if (aiResult.data?.dateOfBirth) {
    const eventYear = eligibilityCheckDate
      ? new Date(eligibilityCheckDate).getFullYear()
      : new Date().getFullYear();

    const { data: age, error: ageError } = (await supabase.rpc('calculate_prisaa_age', {
      dob: aiResult.data.dateOfBirth,
      event_year: eventYear,
    })) as { data: number | null; error: any };

    if (!ageError && age !== null) {
      if (age >= 26) {
        ageWarning = { age, asOfDate: `${eventYear}` };
      } else {
        await updateAthleteDOB(athleteId, aiResult.data.dateOfBirth);
      }
    }
  }

  try {
    const data = await documentsApi.uploadDocument(athleteId, type, file);
    return { success: true, ageWarning, data };
  } catch (err: any) {
    return { success: false, ageWarning, error: err?.message ?? 'Upload failed.' };
  }
}

/**
 * Full pipeline for the single-athlete flow: run identity verification, then
 * finalize. Kept separate from finalizeAthleteDocumentUpload() because the
 * team-wide flow needs to run verifyDocumentAI() *before* it knows which
 * athlete it's uploading for (the extracted name is what picks the athlete),
 * so it can't call this — it calls finalizeAthleteDocumentUpload() directly
 * with the aiResult it already has, avoiding a duplicate Vision API call.
 */
export async function uploadAthleteDocument(
  athleteId: string,
  type: DocumentType,
  file: File,
  eligibilityCheckDate?: string | null
): Promise<UploadPipelineResult> {
  const aiResult = await verifyDocumentAI(file, type);

  if (!aiResult.success) {
    return { success: false, error: aiResult.error ?? 'Document verification failed.' };
  }

  return finalizeAthleteDocumentUpload(athleteId, type, file, eligibilityCheckDate, aiResult);
}