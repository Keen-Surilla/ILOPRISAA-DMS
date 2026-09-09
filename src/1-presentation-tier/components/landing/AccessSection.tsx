import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, AlertTriangle, ShieldCheck, KeyRound, IdCard, Clock, Eye, EyeOff, UserX, ShieldAlert } from 'lucide-react';
import { useAuthStore } from '../../../2-application-tier/stores/authStore';
import { validateLoginInput, containsInjectionSignature } from '../../../2-application-tier/utils/validators/payloadValidators';
import { supabase } from '../../../3-data-tier/config/SupabaseClient';
import { Reveal } from './functions';

const LOCAL_WARNING_ESCALATION = 2;

const IP_BLOCK_MESSAGE =
  'Access from your network has been temporarily restricted due to repeated flagged activity.';
const ACCOUNT_LOCK_MESSAGE =
  'This account has been temporarily locked after repeated failed sign-in attempts.';

function formatRemaining(ms: number): string {
  if (ms <= 0) return '0:00';
  const totalSeconds = Math.ceil(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const mm = String(m).padStart(h > 0 ? 2 : 1, '0');
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

type GuardResult = {
  blocked: boolean;
  expiresAt?: string;
  accountLocked?: boolean;
  accountExpiresAt?: string;
};

type Restriction = { type: 'ip' | 'account'; expiresAt: Date | null } | null;

export function AccessSection() {
  const navigate = useNavigate();
  const { signIn } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [emailErrorMsg, setEmailErrorMsg] = useState<string | null>(null);
  const [passwordErrorMsg, setPasswordErrorMsg] = useState<string | null>(null);

  const [securityWarning, setSecurityWarning] = useState<string | null>(null);
  const [restriction, setRestriction] = useState<Restriction>(null);
  const [remainingLabel, setRemainingLabel] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const flaggedAttemptCount = useRef(0);

  const isBlocked = !!restriction;

  function clearFieldState() {
    setSecurityWarning(null);
    setEmailErrorMsg(null);
    setPasswordErrorMsg(null);
  }

  function applyIpBlock(expiresAt?: string) {
    setRestriction({ type: 'ip', expiresAt: expiresAt ? new Date(expiresAt) : null });
  }

  function applyAccountLock(expiresAt?: string) {
    setRestriction({ type: 'account', expiresAt: expiresAt ? new Date(expiresAt) : null });
  }

  // Live countdown, works for either restriction type. Auto-clears once the
  // timer hits zero (the server-side row will have expired by then too).
  useEffect(() => {
    if (!restriction?.expiresAt) {
      setRemainingLabel(null);
      return;
    }
    const expiresAt = restriction.expiresAt;
    const tick = () => {
      const msLeft = expiresAt.getTime() - Date.now();
      if (msLeft <= 0) {
        setRestriction(null);
        setRemainingLabel(null);
        return;
      }
      setRemainingLabel(formatRemaining(msLeft));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [restriction]);

  async function callGuard(opts: {
    flagged?: boolean;
    checkOnly?: boolean;
    email?: string;
    loginFailed?: boolean;
    loginSucceeded?: boolean;
  }): Promise<GuardResult> {
    try {
      const { data, error } = await supabase.functions.invoke('security-guard', { body: opts });
      if (error) {
        console.error('security-guard check failed:', error);
        return { blocked: false }; // fail open on infra errors
      }
      return data as GuardResult;
    } catch (err) {
      console.error('security-guard check failed (thrown):', err);
      return { blocked: false };
    }
  }

  // On mount / refresh: check for an existing IP block immediately. No email
  // is known yet at this point, so account-lock status isn't checked here.
  useEffect(() => {
    let cancelled = false;
    callGuard({ checkOnly: true }).then((result) => {
      if (!cancelled && result.blocked) applyIpBlock(result.expiresAt);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleLoginSubmit(e: FormEvent) {
    e.preventDefault();
    clearFieldState();

    if (isBlocked) return;

    const flagged = containsInjectionSignature(email);
    const trimmedEmail = email.trim() || undefined;

    if (flagged) {
      setIsSubmitting(true);
      const result = await callGuard({ flagged: true, email: trimmedEmail });
      setIsSubmitting(false);

      if (result.blocked) {
        applyIpBlock(result.expiresAt);
        return;
      }
      if (result.accountLocked) {
        applyAccountLock(result.accountExpiresAt);
        return;
      }

      flaggedAttemptCount.current += 1;
      setEmailErrorMsg(
        flaggedAttemptCount.current >= LOCAL_WARNING_ESCALATION
          ? 'This input has been flagged again. Continuing may restrict your access to this system.'
          : 'This input contains characters that are not allowed here. Please remove them and try again.'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const preCheck = await callGuard({ flagged: false, email: trimmedEmail });
      if (preCheck.blocked) {
        applyIpBlock(preCheck.expiresAt);
        return;
      }
      if (preCheck.accountLocked) {
        applyAccountLock(preCheck.accountExpiresAt);
        return;
      }

      const validation = validateLoginInput(email, password);
      if (!validation.valid) {
        if (validation.field === 'email') setEmailErrorMsg(validation.error);
        if (validation.field === 'password') setPasswordErrorMsg(validation.error);
        return;
      }
      const safeEmail = validation.sanitizedEmail!;

      const result = await signIn(safeEmail, password);

      if (result.error) {
        // NOTE: names the password specifically — user-enumeration trade-off
        // flagged in earlier review, kept as you set it.
        setPasswordErrorMsg("The password you've entered is incorrect.");

        // Log this failure against the ACCOUNT (not the IP). Awaited so that
        // if this submission is the one crossing the threshold, the lock
        // shows immediately instead of requiring one more attempt.
        const failResult = await callGuard({ loginFailed: true, email: safeEmail });
        if (failResult.accountLocked) {
          applyAccountLock(failResult.accountExpiresAt);
        }
        return;
      }

      // Successful login — clear this account's failure history. Not awaited;
      // navigation shouldn't wait on this housekeeping call.
      callGuard({ loginSucceeded: true, email: safeEmail }).catch(() => {});

      const userRole = result.role;
      if (userRole === 'committee') {
        navigate('/committee', { replace: true });
      } else {
        navigate('/home', { replace: true });
      }
    } catch (err: any) {
      setPasswordErrorMsg(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const emailHasError = !!emailErrorMsg;
  const passwordHasError = !!passwordErrorMsg || isBlocked;

  const emailFieldClasses = `w-full rounded-xl border py-3 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 transition-all focus:outline-none focus:ring-1 dark:bg-[#131f37] dark:text-slate-200 dark:placeholder-slate-500 ${
    emailHasError
      ? 'border-red-400 bg-red-50/40 focus:border-red-500 focus:ring-red-500 dark:border-red-500/60'
      : 'border-slate-200 bg-slate-50 focus:border-blue-500 focus:ring-blue-500 dark:border-slate-700/80'
  }`;

  const passwordFieldClasses = `w-full rounded-xl border py-3 pl-10 pr-10 text-sm text-slate-900 placeholder-slate-400 transition-all focus:outline-none focus:ring-1 [&::-ms-reveal]:hidden [&::-ms-clear]:hidden dark:bg-[#131f37] dark:text-slate-200 dark:placeholder-slate-500 ${
    passwordHasError
      ? 'border-red-400 bg-red-50/40 focus:border-red-500 focus:ring-red-500 dark:border-red-500/60'
      : 'border-slate-200 bg-slate-50 focus:border-blue-500 focus:ring-blue-500 dark:border-slate-700/80'
  }`;

  const restrictionMessage = restriction?.type === 'account' ? ACCOUNT_LOCK_MESSAGE : IP_BLOCK_MESSAGE;

  return (
    <section className="relative w-full overflow-hidden py-24" id="access">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-blue-600/5 via-transparent to-cyan-500/5 dark:from-blue-600/10 dark:to-cyan-500/10" />
      <div className="relative z-10 mx-auto max-w-[1200px] px-4 md:px-8 xl:px-12">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
          <Reveal className="flex flex-col lg:col-span-5">
            <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1 font-mono text-xs font-semibold uppercase tracking-wider text-blue-600 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-400">
              <Lock className="h-3.5 w-3.5" aria-hidden="true" />
              Strictly invite-only
            </div>
            <h2 className="mb-4 font-sora text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              Authorize sign in
            </h2>
            <p className="mb-6 text-base leading-relaxed text-slate-600 dark:text-slate-300">
              Access is restricted to designated <strong>Admins</strong>, <strong>School Admins</strong>,{' '}
              <strong>Committee members</strong>, and <strong>Coaches</strong>.
            </p>
            <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-blue-100 bg-white p-5 text-xs text-slate-600 shadow-sm dark:border-blue-500/30 dark:bg-[#0f172a] dark:text-slate-300 dark:shadow-md">
              <div className="flex items-center gap-2 font-mono font-semibold text-blue-600 dark:text-blue-400">
                <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                No public self-registration
              </div>
              <p className="leading-relaxed text-slate-500 dark:text-slate-400">
                Student-athletes do not hold system accounts.
              </p>
            </div>
            <div className="flex items-center gap-3 font-mono text-xs text-slate-500 dark:text-slate-400">
              <ShieldCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />
              Protected by Supabase Auth &amp; PostgreSQL RLS policies
            </div>
          </Reveal>
          
          <Reveal className="lg:col-span-7">
            <div className="relative rounded-2xl border border-blue-100 bg-white/90 p-6 shadow-xl backdrop-blur-xl dark:border-blue-500/30 dark:bg-[#0f172a] dark:shadow-2xl sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-5 dark:border-slate-800">
                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <KeyRound className="h-5 w-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                    <h3 className="font-sora text-xl font-bold text-slate-900 dark:text-white">Login</h3>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Sign in to reach your designated workspace.</p>
                </div>
              </div>
              
              <form className="space-y-4 pt-6" onSubmit={handleLoginSubmit}>
                {securityWarning && (
                  <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 font-mono text-xs text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400">
                    <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    {securityWarning}
                  </div>
                )}

                {isBlocked && (
                  <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 font-mono text-xs text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
                    <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>
                      {restrictionMessage}{' '}
                      {remainingLabel
                        ? <>Try again in <strong>{remainingLabel}</strong>.</>
                        : 'Please try again later or contact an administrator.'}
                    </span>
                  </div>
                )}
                
                <div>
                  <label htmlFor="officerEmail" className="mb-2 block font-mono text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Email
                  </label>
                  <div className="relative flex items-center">
                    <IdCard className={`pointer-events-none absolute left-3.5 h-4 w-4 ${emailHasError ? 'text-red-400' : 'text-slate-400'}`} aria-hidden="true" />
                    <input
                      id="officerEmail"
                      type="email"
                      required
                      maxLength={100}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="officer@iloprisaa.org"
                      className={emailFieldClasses}
                    />
                  </div>
                  {emailErrorMsg && (
                    <p className="mt-1.5 text-xs font-medium text-red-500 dark:text-red-400">
                      {emailErrorMsg}
                    </p>
                  )}
                </div>
                
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label htmlFor="officerPassword" className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                      Password
                    </label>
                  </div>
                  <div className="relative flex items-center">
                    <Lock className={`pointer-events-none absolute left-3.5 h-4 w-4 ${passwordHasError ? 'text-red-400' : 'text-slate-400'}`} aria-hidden="true" />
                    <input
                      id="officerPassword"
                      type={showPassword ? 'text' : 'password'}
                      required
                      maxLength={50}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="********"
                      className={passwordFieldClasses}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute right-3.5 text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {showPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>
                  </div>
                  {passwordErrorMsg && (
                    <p className="mt-1.5 text-xs font-medium text-red-500 dark:text-red-400">
                      {passwordErrorMsg}
                    </p>
                  )}
                </div>
                
                <div className="flex items-center justify-between pt-1">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 bg-white text-blue-600 focus:ring-0 focus:ring-offset-0 dark:border-slate-700 dark:bg-[#131f37]"
                    />
                    <span className="text-xs text-slate-600 dark:text-slate-300">Remember this session (24h)</span>
                  </label>
                  <span className="flex items-center gap-1 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                    <Clock className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" aria-hidden="true" />
                    2FA enforced
                  </span>
                </div>
                
                <button
                  type="submit"
                  disabled={isSubmitting || isBlocked}
                  className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white shadow-[0_0_24px_rgba(59,130,246,0.4)] transition-all hover:bg-blue-500 hover:shadow-[0_0_32px_rgba(59,130,246,0.65)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting
                    ? 'Signing in...'
                    : isBlocked
                    ? remainingLabel
                      ? `Try again in ${remainingLabel}`
                      : 'Access restricted'
                    : 'Continue to sign-in'}
                </button>
              </form>
              
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5 font-mono text-[11px] text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                  TLS 256-bit encrypted
                </div>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" aria-hidden="true" />
                  Postgres RLS active
                </div>
                <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
                  <UserX className="h-3.5 w-3.5" aria-hidden="true" />
                  No athlete accounts
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}