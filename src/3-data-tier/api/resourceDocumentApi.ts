// src/3-data-tier/api/resourceDocumentsApi.ts
import { supabase } from '../config/SupabaseClient';

export const RESOURCE_BUCKET = 'committee_templates';

export type ResourceCategory = 'guideline' | 'form';
export type ResourceFileType = 'pdf' | 'doc' | 'docx' | 'xlsx';

export interface ResourceDocument {
  id: string;
  file_name: string;
  storage_path: string;
  label: string;
  category: ResourceCategory;
  file_type: ResourceFileType;
  size_bytes: number | null;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ResourceDocumentWithUrl extends ResourceDocument {
  publicUrl: string;
}

// --- Classification -----------------------------------------------------
// Deterministic keyword match on the filename, same "explainable over AI"
// principle as athleteNameMatcher.ts. Anything that doesn't hit a guideline
// keyword defaults to Forms, per the "rest goes to forms" instruction.
const GUIDELINE_KEYWORDS = [
  'rule', 'rulebook', 'guideline', 'guidelines', 'handbook',
  'policy', 'manual', 'constitution', 'by-law', 'bylaw',
];

export function classifyDocument(fileName: string): ResourceCategory {
  const lower = fileName.toLowerCase();
  return GUIDELINE_KEYWORDS.some((kw) => lower.includes(kw)) ? 'guideline' : 'form';
}

export function getFileTypeFromName(fileName: string): ResourceFileType {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return 'pdf';
  if (ext === 'xlsx' || ext === 'xls') return 'xlsx';
  if (ext === 'docx') return 'docx';
  return 'doc';
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
}

// --- Reads ----------------------------------------------------------------
export async function fetchResourceDocuments(): Promise<ResourceDocumentWithUrl[]> {
  const { data, error } = await supabase
    .from('resource_documents')
    .select('*')
    .order('category', { ascending: true })
    .order('label', { ascending: true });

  if (error) throw new Error('Could not load resource documents. Please try again.');

  const rows = (data ?? []) as unknown as ResourceDocument[];

  return rows.map((row) => {
    const { data: urlData } = supabase.storage.from(RESOURCE_BUCKET).getPublicUrl(row.storage_path);
    return { ...row, publicUrl: urlData.publicUrl };
  });
}

// --- Upload (classifies automatically) -------------------------------------
export async function uploadResourceDocument(file: File): Promise<ResourceDocument> {
  const category = classifyDocument(file.name);
  const fileType = getFileTypeFromName(file.name);
  const storagePath = `${category}s/${crypto.randomUUID()}-${sanitizeFileName(file.name)}`;

  const { error: uploadError } = await supabase.storage
    .from(RESOURCE_BUCKET)
    .upload(storagePath, file, { upsert: false });

  if (uploadError) throw new Error(`Upload failed for ${file.name}: ${uploadError.message}`);

  const label = file.name.replace(/\.[^/.]+$/, '');
  const { data: userData } = await supabase.auth.getUser();

  const { data, error: insertError } = await supabase
    .from('resource_documents')
    .insert({
      file_name: file.name,
      storage_path: storagePath,
      label,
      category,
      file_type: fileType,
      size_bytes: file.size,
      uploaded_by: userData.user?.id ?? null,
    })
    .select()
    .single();

  if (insertError) {
    // Roll back the uploaded object so storage doesn't end up with orphans.
    await supabase.storage.from(RESOURCE_BUCKET).remove([storagePath]);
    throw new Error(`Could not save ${file.name}: ${insertError.message}`);
  }

  return data as unknown as ResourceDocument;
}

export async function uploadResourceDocuments(files: File[]): Promise<ResourceDocument[]> {
  const results: ResourceDocument[] = [];
  for (const file of files) {
    results.push(await uploadResourceDocument(file));
  }
  return results;
}

// --- Edit -------------------------------------------------------------------
export async function updateResourceDocument(
  id: string,
  updates: { label?: string; category?: ResourceCategory }
): Promise<ResourceDocument> {
  const { data, error } = await supabase
    .from('resource_documents')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error('Could not update this document. Please try again.');
  return data as unknown as ResourceDocument;
}

// --- Delete -------------------------------------------------------------------
export async function deleteResourceDocument(
  doc: Pick<ResourceDocument, 'id' | 'storage_path'>
): Promise<void> {
  const { error: storageError } = await supabase.storage
    .from(RESOURCE_BUCKET)
    .remove([doc.storage_path]);

  if (storageError) throw new Error(`Could not remove file from storage: ${storageError.message}`);

  const { error: dbError } = await supabase.from('resource_documents').delete().eq('id', doc.id);
  if (dbError) throw new Error('File removed from storage but the record could not be deleted. Please refresh.');
}