import type { DocumentType } from '../../3-data-tier/types/database.types';

export interface ScannedFormFields {
  documentType: DocumentType;
  notes: string;
  detectedText: string;
}

const TYPE_KEYWORDS: { type: DocumentType; patterns: RegExp[] }[] = [
  { type: 'psa_certificate', patterns: [/psa/i, /philstat/i, /birth\s*certificate/i] },
  { type: 'birth_certificate', patterns: [/birth\s*cert/i, /certificate\s*of\s*live\s*birth/i] },
  { type: 'medical_clearance', patterns: [/medical/i, /clearance/i, /physician/i] },
  { type: 'physical_exam', patterns: [/physical\s*exam/i, /pe\s*form/i] },
  { type: 'school_id', patterns: [/school\s*id/i, /student\s*id/i, /enrollment/i] },
  { type: 'parental_consent', patterns: [/parental/i, /consent/i, /waiver/i, /guardian/i] },
];

function guessTypeFromText(text: string): DocumentType {
  const hay = `${text}`.toLowerCase();
  for (const entry of TYPE_KEYWORDS) {
    if (entry.patterns.some((p) => p.test(hay))) return entry.type;
  }
  return 'psa_certificate';
}

function guessTypeFromFilename(name: string): DocumentType {
  return guessTypeFromText(name.replace(/[_-]/g, ' '));
}

export function scanFromFilename(file: File): ScannedFormFields {
  const detectedText = file.name;
  const documentType = guessTypeFromFilename(file.name);
  return {
    documentType,
    notes: `Auto-filled from file: ${file.name}`,
    detectedText,
  };
}

/** OCR scan for images; uses dynamic import to keep initial bundle smaller. */
export async function scanFromImageFile(file: File): Promise<ScannedFormFields> {
  if (!file.type.startsWith('image/')) {
    return scanFromFilename(file);
  }

  try {
    const { createWorker } = await import('tesseract.js');
    const worker = await createWorker('eng');
    const { data } = await worker.recognize(file);
    await worker.terminate();
    const detectedText = data.text?.trim() ?? '';
    const documentType = guessTypeFromText(`${file.name} ${detectedText}`);
    const preview = detectedText.slice(0, 280).replace(/\s+/g, ' ');
    return {
      documentType,
      notes: preview ? `Scanned text: ${preview}` : `Auto-filled from ${file.name}`,
      detectedText: detectedText || file.name,
    };
  } catch {
    return scanFromFilename(file);
  }
}

export async function scanDocumentFile(file: File): Promise<ScannedFormFields> {
  if (file.type.startsWith('image/')) {
    return scanFromImageFile(file);
  }
  return scanFromFilename(file);
}
