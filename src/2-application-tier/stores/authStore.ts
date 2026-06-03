/**
 * TIER 2 — APPLICATION TIER: Auth Store (Zustand)
 */

import { create } from 'zustand';
import { supabase } from '../../3-data-tier/config/SupabaseClient';
import type { Profile, UserRole } from '../../3-data-tier/types/database.types';

interface AuthState {
  user: Profile | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  role: null,
  isAuthenticated: false,
  isLoading: true,

  initialize: async () => {
    set({ isLoading: true });
    const { data: { session } } = await supabase.auth.getSession();

    if (session?.user) {
      const profile = await fetchProfile(session.user.id);
      set({ user: profile, role: profile?.role ?? null, isAuthenticated: !!profile });
    } else {
      set({ user: null, role: null, isAuthenticated: false });
    }

    set({ isLoading: false });

    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        set({ user: null, role: null, isAuthenticated: false });
        return;
      }
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        const profile = await fetchProfile(session.user.id);
        set({ user: profile, role: profile?.role ?? null, isAuthenticated: !!profile });
      }
    });
  },

  signIn: async (email: string, password: string) => {
    const trimmedEmail = email.trim();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password,
    });
    if (error) return { error: mapAuthSignInError(error) };

    const userId = data.user?.id;
    if (!userId) return { error: 'Sign-in failed. Please try again.' };

    const profile = await fetchProfile(userId);
    if (!profile) {
      await supabase.auth.signOut();
      return { error: 'Your account is missing a profile. Ask an admin to complete setup in Supabase.' };
    }

    set({ user: profile, role: profile.role, isAuthenticated: true, isLoading: false });
    return { error: null };
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, role: null, isAuthenticated: false });
  },
}));

function mapAuthSignInError(error: { code?: string; message?: string; status?: number }): string {
  const code = error.code ?? '';
  const message = (error.message ?? '').toLowerCase();

  if (code === 'email_not_confirmed' || message.includes('email not confirmed')) {
    return 'Email not confirmed. In Supabase, confirm the user or enable Auto Confirm when creating the account.';
  }
  if (code === 'invalid_credentials' || message.includes('invalid login credentials')) {
    return 'Invalid email or password. Use the exact email from Authentication → Users and reset the password if needed.';
  }
  if (code === 'user_banned' || message.includes('banned')) {
    return 'This account has been disabled. Contact your administrator.';
  }
  if (error.status === 429 || message.includes('rate limit')) {
    return 'Too many attempts. Please wait a moment and try again.';
  }
  if (error.status === 502) {
    return 'Supabase returned Bad Gateway (502). Your VITE_SUPABASE_URL is wrong or the project does not exist. In Supabase Dashboard → Project Settings → API, copy Project URL into .env.local exactly, then restart npm run dev.';
  }
  if (error.status === 0 || message.includes('failed to fetch')) {
    return 'Cannot reach Supabase. Check internet/VPN/firewall, or fix VITE_SUPABASE_URL in .env.local (Dashboard → Project Settings → API).';
  }
  return 'Invalid email or password.';
}

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
  if (error || !data) return null;
  return data;
}
