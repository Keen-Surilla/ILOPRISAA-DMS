import { supabase } from '../config/SupabaseClient';

const BUCKET = 'coach-signatures';

export async function uploadSignature(profileId: string, blob: Blob): Promise<void> {
  const storagePath = `${profileId}/signature.png`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, blob, { upsert: true, contentType: 'image/png' });

  if (uploadError) {
    console.error('Error uploading signature:', uploadError);
    throw new Error('Could not save your signature. Please try again.');
  }

  const { error: dbError, data } = await supabase
    .from('coach_profiles')
    .upsert(
      { profile_id: profileId, signature_storage_path: storagePath },
      { onConflict: 'profile_id' }
    )
    .select();

  console.log('Signature DB upsert result:', { data, dbError }); // temporary, remove after confirming

  if (dbError) {
    console.error('Error saving signature path:', dbError);
    throw new Error('Signature uploaded, but could not link it to your profile.');
  }
}

export async function getSignatureUrl(storagePath: string | null): Promise<string | null> {
  if (!storagePath) return null;
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(storagePath, 60 * 5);
  if (error || !data) return null;
  return data.signedUrl;
}

export async function getSignatureBlob(storagePath: string): Promise<ArrayBuffer | null> {
  const { data, error } = await supabase.storage.from(BUCKET).download(storagePath);
  if (error || !data) return null;
  return data.arrayBuffer();
}