/**
 * TIER 3 — DATA TIER: Supabase Client
 *
 * SECURITY RATIONALE:
 * - Uses VITE_ env vars (never hardcoded keys) to prevent API key leakage.
 * - The anon key is safe to expose client-side; actual access is gated by
 *   Row-Level Security (RLS) policies enforced entirely in PostgreSQL.
 * - Mitigates: OWASP A02 (Cryptographic Failures) by keeping secrets out of source.
 * - Mitigates: OWASP A05 (Security Misconfiguration) via explicit session persistence.
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';

const configuredUrl = (import.meta.env.VITE_SUPABASE_URL ?? '').trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim();

// In dev, route API calls through Vite's proxy (see vite.config.ts) to avoid "Failed to fetch".
const supabaseUrl =
  import.meta.env.DEV && typeof window !== 'undefined'
    ? `${window.location.origin}/supabase-api`
    : configuredUrl;

if (!configuredUrl || !supabaseAnonKey) {
  // Fail-secure: crash loudly at startup rather than silently connecting
  // to an undefined endpoint that could be hijacked.
  throw new Error(
    '[ILOPRISAA] Missing Supabase environment variables. ' +
    'Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in .env'
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Persist session in localStorage so users survive page refreshes.
    // The JWT is short-lived (1h by default in Supabase), limiting replay attack windows.
    persistSession: true,
    autoRefreshToken: true,
    // Detect OAuth code in URL fragment to prevent open-redirect abuse.
    detectSessionInUrl: true,
  },
});

export type SupabaseClient = typeof supabase;