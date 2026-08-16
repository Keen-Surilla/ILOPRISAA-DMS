import { supabase } from '../../3-data-tier/config/SupabaseClient';

function isAuthError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const err = error as { message?: string; status?: number; code?: string };
  const message = (err.message ?? '').toLowerCase();
  return (
    err.status === 401 ||
    err.code === 'PGRST301' || 
    message.includes('jwt expired') ||
    message.includes('invalid jwt') ||
    message.includes('jwt is expired') ||
    message.includes('token is expired')
  );
}

export async function withAuthRetry<T extends { error: unknown }>(
  operation: () => PromiseLike<T>
): Promise<T> {
  const result = await operation();

  if (!isAuthError(result.error)) {
    return result;
  }

  console.warn('[withAuthRetry] Auth error detected, attempting session refresh...', result.error);

  const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();

  if (refreshError || !refreshData.session) {
    console.error('[withAuthRetry] Session refresh failed, signing out.', refreshError);
    await supabase.auth.signOut();
    throw new Error('Your session expired. Please sign in again.');
  }
  return operation();
}