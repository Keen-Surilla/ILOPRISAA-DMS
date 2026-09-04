import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, AlertTriangle, ShieldCheck, KeyRound, IdCard, Clock, Eye, EyeOff, UserX } from 'lucide-react';
import { useAuthStore } from '../../../2-application-tier/stores/authStore';
import { validateLoginInput } from '../../../2-application-tier/utils/validators/payloadValidators';
import { Reveal } from './functions';

export function AccessSection() {
  const navigate = useNavigate();
  const { signIn } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleLoginSubmit(e: FormEvent) {
    e.preventDefault();
    setLoginError(null);

    const validation = validateLoginInput(email, password);
    if (!validation.valid) {
      setLoginError(validation.error);
      return;
    }
    const safeEmail = validation.sanitizedEmail!;

    setIsSubmitting(true);
    try {
      const result = await signIn(safeEmail, password);

      if (result.error) {
        setLoginError(result.error);
        return;
      }

      const userRole = result.role;
      if (userRole === 'committee') {
        navigate('/committee', { replace: true });
      } else {
        navigate('/home', { replace: true });
      }
    } catch (err: any) {
      setLoginError(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

 
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
                {loginError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-3 font-mono text-xs text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
                    {loginError}
                  </div>
                )}
                
                <div>
                  <label htmlFor="officerEmail" className="mb-2 block font-mono text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Email
                  </label>
                  <div className="relative flex items-center">
                    <IdCard className="pointer-events-none absolute left-3.5 h-4 w-4 text-slate-400" aria-hidden="true" />
                    <input
                      id="officerEmail"
                      type="email"
                      required
                      maxLength={100}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="officer@iloprisaa.org"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 transition-all focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700/80 dark:bg-[#131f37] dark:text-slate-200 dark:placeholder-slate-500"
                    />
                  </div>
                </div>
                
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label htmlFor="officerPassword" className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                      Password
                    </label>
                  </div>
                  <div className="relative flex items-center">
                    <Lock className="pointer-events-none absolute left-3.5 h-4 w-4 text-slate-400" aria-hidden="true" />
                    <input
                      id="officerPassword"
                      type={showPassword ? 'text' : 'password'}
                      required
                      maxLength={50}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="********"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-10 text-sm text-slate-900 placeholder-slate-400 transition-all focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 [&::-ms-reveal]:hidden [&::-ms-clear]:hidden dark:border-slate-700/80 dark:bg-[#131f37] dark:text-slate-200 dark:placeholder-slate-500"
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
                  disabled={isSubmitting}
                  className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white shadow-[0_0_24px_rgba(59,130,246,0.4)] transition-all hover:bg-blue-500 hover:shadow-[0_0_32px_rgba(59,130,246,0.65)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? 'Signing in...' : 'Continue to sign-in'}
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