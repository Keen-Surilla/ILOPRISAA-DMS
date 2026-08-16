import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';

const configuredUrl = (import.meta.env.VITE_SUPABASE_URL ?? '').trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim();

if (!configuredUrl || !supabaseAnonKey) {
  throw new Error(
    '[ILOPRISAA] Missing Supabase environment variables. ' +
    'Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in .env'
  );
}

export const supabase = createClient<Database>(configuredUrl, supabaseAnonKey, {
  auth: {
    // Persist session in localStorage so users survive page refreshes.
    persistSession: true,
    autoRefreshToken: true,
    // Detect OAuth code in URL fragment to prevent open-redirect abuse.
    detectSessionInUrl: true,
  },
});

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      // Tab is active again — resume the refresh timer AND immediately
      // check/refresh the session right now, rather than waiting for
      // whatever the timer's next scheduled tick happens to be.
      supabase.auth.startAutoRefresh();
      supabase.auth.getSession(); // getSession() internally refreshes if the token is expired/near-expiry
    } else {
      // Tab is hidden/backgrounded — stop the refresh timer so it isn't
      // wastefully ticking (and potentially throttled/queued oddly) while
      // nobody's looking anyway.
      supabase.auth.stopAutoRefresh();
    }
  });
}

export type SupabaseClient = typeof supabase;

// ============================================================
// Fixes the "stale session after tab sleep" issue: supabase-js schedules
// its token refresh with setTimeout(), which browsers throttle or fully
// suspend in backgrounded/sleeping tabs. That means the scheduled refresh
// can simply never fire while the computer sleeps or the tab is minimized
// — so when you come back, the client is still holding an expired JWT,
// and every CRUD call/Sign Out silently fails until a manual page refresh.
//
// This ties auto-refresh to actual page visibility instead of trusting
// the background timer alone (Supabase's own recommended pattern):
// https://supabase.com/docs/reference/javascript/auth-startautorefresh
// ============================================================
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      // Tab is active again — resume the refresh timer AND immediately
      // check/refresh the session right now, rather than waiting for
      // whatever the timer's next scheduled tick happens to be.
      supabase.auth.startAutoRefresh();
      supabase.auth.getSession(); // internally refreshes if expired/near-expiry
    } else {
      // Tab is hidden/backgrounded — stop the refresh timer so it isn't
      // wastefully ticking while nobody's looking anyway.
      supabase.auth.stopAutoRefresh();
    }
  });
}