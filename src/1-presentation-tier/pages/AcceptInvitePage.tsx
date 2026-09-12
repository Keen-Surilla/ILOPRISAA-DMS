import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Lock, ShieldCheck, UserPlus } from 'lucide-react';
import { supabase } from '../../3-data-tier/config/SupabaseClient';
import { useAuthStore } from '../../2-application-tier/stores/authStore';

import Logo2 from '../../assets/Logo2.svg';

type InviteInfo = {
  email: string;
  role: string;
  status: string;
  expires_at: string;
  institution_id: string | null;
};

const ROLE_LABELS: Record<string, string> = {
  school_admin: 'School Admin',
  admin: 'Admin',
  committee: 'Eligibility Committee',
  coach: 'Coach',
};

// Small wrapper so both the token lookup (guessable-token brute forcing) and
// the password-set submit go through the same server-side, IP-based guard.
// The actual block decision always lives in the security-guard Edge Function
// / blocked_ips table — never in this component's state.
async function checkSecurityGuard(flagged: boolean): Promise<{ blocked: boolean; reason?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('security-guard', { body: { flagged } });
    if (error) {
      console.error('security-guard check failed:', error);
      return { blocked: false }; // fail open on infra errors
    }
    return { blocked: !!data?.blocked, reason: data?.reason };
  } catch (err) {
    console.error('security-guard check failed:', err);
    return { blocked: false };
  }
}

export default function AcceptInvitePage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const initialize = useAuthStore((state) => state.initialize);

  const [pageState, setPageState] = useState<'loading' | 'ready' | 'invalid' | 'success'>('loading');
  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadInvite() {
      if (!token) {
        setPageState('invalid');
        setError('This invite link is missing a token.');
        return;
      }

      // A wrong/guessed token is exactly the signature of someone brute-forcing
      // invite links, so an initial (unflagged) guard check runs first; if the
      // lookup then fails, we retroactively count it as suspicious below.
      const preCheck = await checkSecurityGuard(false);
      if (cancelled) return;
      if (preCheck.blocked) {
        setPageState('invalid');
        setError('Access from your network has been temporarily restricted. Please try again later or contact an administrator.');
        return;
      }

      const { data, error: rpcError } = await supabase
        .rpc('get_invite_by_token', { p_token: token })
        .single();

      if (cancelled) return;

      if (rpcError || !data) {
        // Flag this attempt server-side; repeated invalid tokens from the
        // same IP will trip the suspicious-input threshold.
        await checkSecurityGuard(true);
        setPageState('invalid');
        setError('This invite link is invalid.');
        return;
      }

      const inviteData = data as InviteInfo;

      if (inviteData.status !== 'pending') {
        setPageState('invalid');
        setError(`This invite has already been ${inviteData.status}.`);
        return;
      }

      if (new Date(inviteData.expires_at) < new Date()) {
        setPageState('invalid');
        setError('This invite link has expired. Please ask for a new one.');
        return;
      }

      setInvite(inviteData);
      setPageState('ready');
    }

    loadInvite();
    return () => {
      cancelled = true;
    };
  }, [token]);

const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Server-side flood/abuse check before touching Auth. Password content
      // is deliberately never pattern-checked here — see the note on
      // containsInjectionSignature in payloadValidators.ts for why.
      const guard = await checkSecurityGuard(false);
      if (guard.blocked) {
        setError('Access from your network has been temporarily restricted. Please try again later or contact an administrator.');
        return;
      }

      // Magic link already created session; set password on authenticated account
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError(updateError.message);
        return;
      }

      if (token) {
        const { error: acceptError } = await supabase.rpc('accept_invite', { p_token: token });
        if (acceptError) {
          setError('Your password was set, but we could not finalize the invite. Please contact an admin.');
          return;
        }
      }

      // 1. Sign out of the temporary magic link session
      await supabase.auth.signOut();
      
      setPageState('success');
      
      // 2. Redirect to the login page instead of home
      navigate('/login', { replace: true });
      
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (pageState === 'loading') {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0a1120] flex flex-col font-sans">
        <header className="w-full px-8 py-4 flex items-center border-b border-slate-100 dark:border-slate-800">
          <img src={Logo2} alt="ILOPRISAA" className="h-7 w-auto" />
        </header>
        <main className="flex-1 flex items-center justify-center p-6 bg-slate-50/30 dark:bg-transparent">
          <p className="font-mono text-xs text-slate-400 dark:text-slate-500">Checking your invite…</p>
        </main>
      </div>
    );
  }

  if (pageState === 'invalid') {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0a1120] flex flex-col font-sans">
        <header className="w-full px-8 py-4 flex items-center border-b border-slate-100 dark:border-slate-800">
          <img src={Logo2} alt="ILOPRISAA" className="h-7 w-auto" />
        </header>
        <main className="flex-1 flex items-center justify-center p-6 bg-slate-50/30 dark:bg-transparent">
          <div className="w-full max-w-md">
            <div className="rounded-2xl border border-blue-100 bg-white/90 p-8 shadow-xl backdrop-blur-xl dark:border-blue-500/30 dark:bg-[#0f172a] dark:shadow-2xl text-center">
              <h2 className="font-sora text-lg font-extrabold tracking-tight text-slate-900 dark:text-white mb-2">
                Invite Not Available
              </h2>
              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">{error}</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const roleLabel = invite ? (ROLE_LABELS[invite.role] ?? invite.role) : '';

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a1120] flex flex-col font-sans">
      <header className="w-full px-8 py-4 flex items-center border-b border-slate-100 dark:border-slate-800">
        <img src={Logo2} alt="ILOPRISAA" className="h-7 w-auto" />
      </header>

      <main className="flex-1 flex items-center justify-center p-6 bg-slate-50/30 dark:bg-transparent">
        <div className="w-full max-w-md">
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1 font-mono text-xs font-semibold uppercase tracking-wider text-blue-600 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-400">
              <UserPlus className="h-3.5 w-3.5" aria-hidden="true" />
              Account activation
            </div>
            <h1 className="font-sora text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              Join as {roleLabel}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              Set a password to activate your <strong>{invite?.email}</strong> account.
            </p>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-white/90 p-6 shadow-xl backdrop-blur-xl dark:border-blue-500/30 dark:bg-[#0f172a] dark:shadow-2xl sm:p-8">
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-xs font-medium dark:bg-red-500/10 dark:text-red-400">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="password" className="mb-2 block font-mono text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  Password
                </label>
                <div className="relative flex items-center">
                  <Lock className={`pointer-events-none absolute left-3.5 h-4 w-4 ${error ? 'text-red-400' : 'text-slate-400'}`} aria-hidden="true" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    maxLength={50}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a password"
                    className={`w-full rounded-xl border py-3 pl-10 pr-10 text-sm text-slate-900 placeholder-slate-400 transition-all focus:outline-none focus:ring-1 dark:bg-[#131f37] dark:text-slate-200 dark:placeholder-slate-500 [&::-ms-reveal]:hidden [&::-ms-clear]:hidden ${
                      error
                        ? 'border-red-400 bg-red-50/40 focus:border-red-500 focus:ring-red-500 dark:border-red-500/60'
                        : 'border-slate-200 bg-slate-50 focus:border-blue-500 focus:ring-blue-500 dark:border-slate-700/80'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3.5 text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="mb-2 block font-mono text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  required
                  maxLength={50}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  className={`w-full rounded-xl border px-4 py-3 text-sm text-slate-900 placeholder-slate-400 transition-all focus:outline-none focus:ring-1 dark:bg-[#131f37] dark:text-slate-200 dark:placeholder-slate-500 ${
                    error
                      ? 'border-red-400 bg-red-50/40 focus:border-red-500 focus:ring-red-500 dark:border-red-500/60'
                      : 'border-slate-200 bg-slate-50 focus:border-blue-500 focus:ring-blue-500 dark:border-slate-700/80'
                  }`}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white shadow-[0_0_24px_rgba(59,130,246,0.4)] transition-all hover:bg-blue-500 hover:shadow-[0_0_32px_rgba(59,130,246,0.65)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? 'Setting up your account…' : 'Activate Account'}
              </button>
            </form>

            <div className="mt-6 flex items-center justify-center gap-2 border-t border-slate-100 pt-5 font-mono text-[11px] text-slate-500 dark:border-slate-800 dark:text-slate-400">
              <ShieldCheck className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
              TLS 256-bit encrypted
              <span className="mx-1 text-slate-300 dark:text-slate-700">|</span>
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" aria-hidden="true" />
              Postgres RLS active
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}