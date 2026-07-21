/**
 * TIER 3 - DATA TIER: Supabase Client
 */
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';

const configuredUrl = (import.meta.env.VITE_SUPABASE_URL ?? '').trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim();

if (!configuredUrl || !supabaseAnonKey) {
  // Fail-secure: crash loudly at startup rather than silently connecting
  // to an undefined endpoint that could be hijacked.
  throw new Error(
    '[ILOPRISAA] Missing Supabase environment variables. ' +
    'Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in .env'
  );
}

// FIX: Connect directly to Supabase instead of routing through a local proxy
export const supabase = createClient<Database>(configuredUrl, supabaseAnonKey, {
  auth: {
    // Persist session in localStorage so users survive page refreshes.
    persistSession: true,
    autoRefreshToken: true,
    // Detect OAuth code in URL fragment to prevent open-redirect abuse.
    detectSessionInUrl: true,
  },
});

export type SupabaseClient = typeof supabase;