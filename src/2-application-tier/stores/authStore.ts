import { create } from 'zustand';
import { supabase } from '../../3-data-tier/config/SupabaseClient';
import type { Profile, UserRole } from '../../3-data-tier/types/database.types.extras';



interface AuthState {
  sendAthleteOtp: (email: string) => Promise<{ error: string | null }>;
  verifyAthleteOtp: (email: string, token: string) => Promise<{ error: string | null }>;
  user: Profile | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (
  email: string, 
  password: string, 
  fullName: string,
  phone: string,
  dob: string,
  gender: string,
  school: string,
  sport: string,
  role: UserRole
) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AUTH_TIMEOUT_MS = 15_000;


function withTimeout<T>(operation: () => PromiseLike<T>, timeoutMessage: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(timeoutMessage)), AUTH_TIMEOUT_MS);
  });
  return Promise.race([Promise.resolve(operation()), timeout]).finally(() => clearTimeout(timer));
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  role: null,
  isAuthenticated: false,
  isLoading: true, 

sendAthleteOtp: async (email: string) => {
  set({ isLoading: true });
  try {
    const { error } = await withTimeout(
      () => supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { shouldCreateUser: true }
      }),
      'Sending the code timed out. Please check your connection and try again.'
    );
    console.log('OTP send result, full error object:', error);
    return { error: error ? error.message : null };
  } catch (err: any) {
      return { error: err?.message || 'Could not send the code. Please try again.' };
    } finally {
      set({ isLoading: false });
    }
  },

  verifyAthleteOtp: async (email: string, token: string) => {
    set({ isLoading: true });
    try {
      const { data, error } = await withTimeout(
        () => supabase.auth.verifyOtp({ email: email.trim(), token: token.trim(), type: 'email' }),
        'Verifying the code timed out. Please check your connection and try again.'
      );

      if (error) {
        return { error: "Invalid or expired PIN. Please try again." };
      }

      const { error: linkError } = await withTimeout(
        () => supabase.rpc('link_athlete_account' as any),
        'Verifying your roster access timed out. Please try again.'
      );

      if (linkError) {
        await supabase.auth.signOut();
        const message = linkError.message.includes('NO_ROSTER_MATCH')
          ? "Access Denied: Your coach has not added this email to the team roster yet."
          : "We couldn't verify your athlete account. Please try again or contact your coach.";
        return { error: message };
      }

      if (data.user) {
        const profile = await withTimeout(
          () => fetchProfile(data.user!.id),
          'Loading your profile timed out. Please try signing in again.'
        );
        if (!profile) {
          await supabase.auth.signOut();
          return { error: 'Your account is missing a profile. Please contact your coach or an admin.' };
        }
        set({ user: profile, role: profile.role, isAuthenticated: true });
      }

      return { error: null };
    } catch (err: any) {
      return { error: err?.message || 'Verification failed. Please try again.' };
    } finally {
      set({ isLoading: false });
    }
  },
  
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

signUp: async (email, password, fullName, phone, dob, gender, school, sport, role) => {
  set({ isLoading: true });
  try {
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName,
          phone: phone,
          dob: dob,
          gender: gender,
          school: school,
          sport: sport,
          role: role,
        },
      },
    });

    if (error) {
      set({ isLoading: false });
      return { error: error.message };
    }
    
    set({ isLoading: false });
    return { error: null };
  } catch (err) {
     set({ isLoading: false });
     return { error: 'An unexpected error occurred during sign up.' };
  }
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
    try {
      const { error } = await withTimeout(
        () => supabase.auth.signOut(),
        'Sign out timed out.'
      );
      if (error) throw error;
    } catch (error) {
      console.error("Error during sign out:", error);
    } finally {
      set({ user: null, role: null, isAuthenticated: false });
    }
  },
}));

function mapAuthSignInError(error: { code?: string; message?: string; status?: number }): string {
  const code = error.code ?? '';
  const message = (error.message ?? '').toLowerCase();

  if (code === 'email_not_confirmed' || message.includes('email not confirmed')) {
    return 'Email not confirmed';
  }
  if (code === 'invalid_credentials' || message.includes('invalid login credentials')) {
    return 'Invalid email or password';
  }
  if (code === 'user_banned' || message.includes('banned')) {
    return 'This account has been disabled. Contact your administrator';
  }
  if (error.status === 429 || message.includes('rate limit')) {
    return 'Too many attempts. Please wait a moment and try again.';
  }
  if (error.status === 502) {
    return 'Supabase returned Bad Gateway (502)';
  }
  if (error.status === 0 || message.includes('failed to fetch')) {
    return 'Cannot reach Supabase';
  }
  return 'Invalid email or password.';
}

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
  if (error || !data) return null;
  return data;
}