import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent, type ClipboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ShieldCheck, ArrowRight, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../../3-data-tier/config/SupabaseClient';

import Logo2 from '../../../assets/Frame 100.svg';

const EMAIL_FORMAT_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESEND_COOLDOWN_SECONDS = 30;
const OTP_LENGTH = 6;

type Step = 'email' | 'password' | 'otp' | 'success';

export function ForgotPasswordPage() {
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('email');

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isSendingCode, setIsSendingCode] = useState(false);

  const [otpDigits, setOtpDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [otpError, setOtpError] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, []);

  function startResendCooldown() {
    setResendCooldown(RESEND_COOLDOWN_SECONDS);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setResendCooldown((s) => {
        if (s <= 1) {
          if (cooldownRef.current) clearInterval(cooldownRef.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }

  // Step 1: email is just collected here, NOT checked against the database.
  function handleEmailSubmit(e: FormEvent) {
    e.preventDefault();
    setEmailError(null);
    const trimmed = email.trim();
    if (!trimmed || !EMAIL_FORMAT_RE.test(trimmed)) {
      setEmailError('Enter a valid email address.');
      return;
    }
    setStep('password');
  }

  // Step 2: the password is only staged here. Submitting this step is what
  // actually triggers sending the code — and shouldCreateUser: false means
  // THIS is where an unregistered email gets rejected, not the email step.
  async function handlePasswordSubmit(e: FormEvent) {
    e.preventDefault();
    setPasswordError(null);

    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    setIsSendingCode(true);
    const sent = await sendCode();
    setIsSendingCode(false);

    if (sent) {
      setOtpError(null); // Clear any lingering OTP errors
      setOtpDigits(Array(OTP_LENGTH).fill('')); // Clear typed digits
      setStep('otp');
      startResendCooldown();
      setTimeout(() => otpRefs.current[0]?.focus(), 0);
    }
  }

  async function sendCode(): Promise<boolean> {
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: false },
    });

    if (error) {
      const message = (error.message ?? '').toLowerCase();
      const looksLikeNoAccount =
        message.includes('not found') ||
        message.includes('not allowed') ||
        message.includes('signups not allowed') ||
        message.includes('user not found');

      // Updated UX writing for a missing account
      setPasswordError(
        looksLikeNoAccount
          ? "We don't recognize this email address. Please double-check the spelling, or contact your school admin to ensure your account has been created."
          : 'Something went wrong sending the code. Please try again.'
      );
      return false;
    }
    return true;
  }

  function triggerShake(message: string) {
    setOtpError(message);
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  }

  function handleDigitChange(index: number, rawValue: string) {
    const digit = rawValue.replace(/\D/g, '').slice(-1);
    setOtpDigits((prev) => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });
    if (digit && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  }

  function handleDigitKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
      setOtpDigits((prev) => {
        const next = [...prev];
        next[index - 1] = '';
        return next;
      });
    }
  }

  function handleOtpPaste(e: ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;
    e.preventDefault();
    const next = Array(OTP_LENGTH).fill('');
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setOtpDigits(next);
    const lastIndex = Math.min(pasted.length, OTP_LENGTH) - 1;
    otpRefs.current[lastIndex]?.focus();
  }

  // Auto-verify once all 6 boxes are filled — classic OTP UX, no separate
  // submit button needed.
  useEffect(() => {
    const code = otpDigits.join('');
    if (code.length === OTP_LENGTH && !isVerifying) {
      void handleVerify(code);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otpDigits]);

  async function handleVerify(code: string) {
    setOtpError(null);
    setIsVerifying(true);
    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: code,
        type: 'email',
      });

      if (verifyError) {
        triggerShake('Incorrect code. Please try again.');
        setOtpDigits(Array(OTP_LENGTH).fill(''));
        setTimeout(() => otpRefs.current[0]?.focus(), 0);
        return;
      }

      // Session is now active from the verified OTP — apply the password
      // that was staged back in step 2.
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) {
        setOtpError(updateError.message);
        return;
      }

      await supabase.auth.signOut();
      setStep('success');
    } catch (err: any) {
      triggerShake(err?.message || 'Something went wrong. Please try again.');
      setOtpDigits(Array(OTP_LENGTH).fill(''));
    } finally {
      setIsVerifying(false);
    }
  }

  async function handleResendCode() {
    if (resendCooldown > 0) return;
    setOtpError(null);
    setIsSendingCode(true);
    const sent = await sendCode();
    setIsSendingCode(false);
    if (sent) {
      startResendCooldown();
      setOtpError('A new code has been sent.');
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a1120] flex flex-col font-sans">
      <style>{`
        @keyframes otpShake {
          10%, 90% { transform: translateX(-2px); }
          20%, 80% { transform: translateX(4px); }
          30%, 50%, 70% { transform: translateX(-8px); }
          40%, 60% { transform: translateX(8px); }
        }
        .otp-shake { animation: otpShake 0.5s cubic-bezier(.36,.07,.19,.97) both; }
      `}</style>

      <header className="w-full px-8 py-4 flex items-center border-b border-slate-100 dark:border-slate-800">
        <img src={Logo2} alt="ILOPRISAA" className="h-7 w-auto" />
      </header>

      <main className="flex-1 flex items-center justify-center p-6 bg-slate-50/30 dark:bg-transparent">
        <div className="w-full max-w-md">
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1 font-mono text-xs font-semibold uppercase tracking-wider text-blue-600 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-400">
              <Lock className="h-3.5 w-3.5" aria-hidden="true" />
              Account recovery
            </div>
            <h1 className="font-sora text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              {step === 'success' ? 'Password changed' : 'Reset your account password'}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {step === 'email' && 'Enter the email tied to your ILOPRISAA account to get started.'}
              {step === 'password' && 'Create the new password you want to use.'}
              {step === 'otp' && (
                <>
                  Enter the 6-digit code sent to <strong>{email}</strong>.
                </>
              )}
              {step === 'success' && 'Your password has been updated. You can sign in with it now.'}
            </p>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-white/90 p-6 shadow-xl backdrop-blur-xl dark:border-blue-500/30 dark:bg-[#0f172a] dark:shadow-2xl sm:p-8">
            {step === 'email' && (
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div>
                  <label htmlFor="recoveryEmail" className="mb-2 block font-mono text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Email
                  </label>
                  <div className="relative flex items-center">
                    <Mail
                      className={`pointer-events-none absolute left-3.5 h-4 w-4 ${emailError ? 'text-red-400' : 'text-slate-400'}`}
                      aria-hidden="true"
                    />
                    <input
                      id="recoveryEmail"
                      type="email"
                      required
                      maxLength={100}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="officer@iloprisaa.org"
                      className={`w-full rounded-xl border py-3 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 transition-all focus:outline-none focus:ring-1 dark:bg-[#131f37] dark:text-slate-200 dark:placeholder-slate-500 ${
                        emailError
                          ? 'border-red-400 bg-red-50/40 focus:border-red-500 focus:ring-red-500 dark:border-red-500/60'
                          : 'border-slate-200 bg-slate-50 focus:border-blue-500 focus:ring-blue-500 dark:border-slate-700/80'
                      }`}
                    />
                  </div>
                  {emailError && (
                    <p className="mt-1.5 text-xs font-medium text-red-500 dark:text-red-400">{emailError}</p>
                  )}
                </div>

                <button
                  type="submit"
                  className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white shadow-[0_0_24px_rgba(59,130,246,0.4)] transition-all hover:bg-blue-500 hover:shadow-[0_0_32px_rgba(59,130,246,0.65)] active:scale-95"
                >
                  Next
                </button>
              </form>
            )}

            {step === 'password' && (
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <button
                  type="button"
                  onClick={() => {
                    setPasswordError(null);
                    setStep('email');
                  }}
                  className="w-full mb-10 text-start font-mono text-[11px] text-slate-500 hover:underline dark:text-slate-400"
                >
                  ← Change email
                </button>
                <div>
                  <label htmlFor="newPassword" className="mb-2 block font-mono text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    New password
                  </label>
                  <div className="relative flex items-center">
                    <Lock className={`pointer-events-none absolute left-3.5 h-4 w-4 ${passwordError ? 'text-red-400' : 'text-slate-400'}`} aria-hidden="true" />
                    <input
                      id="newPassword"
                      type={showPassword ? 'text' : 'password'}
                      required
                      maxLength={50}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Create a password"
                      className={`w-full rounded-xl border py-3 pl-10 pr-10 text-sm text-slate-900 placeholder-slate-400 transition-all focus:outline-none focus:ring-1 dark:bg-[#131f37] dark:text-slate-200 dark:placeholder-slate-500 ${
                        passwordError
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
                    Confirm new password
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
                      passwordError
                        ? 'border-red-400 bg-red-50/40 focus:border-red-500 focus:ring-red-500 dark:border-red-500/60'
                        : 'border-slate-200 bg-slate-50 focus:border-blue-500 focus:ring-blue-500 dark:border-slate-700/80'
                    }`}
                  />
                  {passwordError && (
                    <p className="mt-1.5 text-xs font-medium text-red-500 dark:text-red-400">{passwordError}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSendingCode}
                  className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white shadow-[0_0_24px_rgba(59,130,246,0.4)] transition-all hover:bg-blue-500 hover:shadow-[0_0_32px_rgba(59,130,246,0.65)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSendingCode ? 'Sending code...' : 'Continue'}
                </button>
              </form>
            )}

            {step === 'otp' && (
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => {
                    setOtpError(null);
                    setOtpDigits(Array(OTP_LENGTH).fill(''));
                    setStep('password');
                  }}
                  className="w-full text-start mb-10 font-mono text-[11px] text-slate-500 hover:underline dark:text-slate-400"
                >
                  ← Back
                </button>
                <div>
                  <label className="mb-2 block text-center font-mono text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Verification code
                  </label>
                  <div className={`flex justify-center gap-2 ${isShaking ? 'otp-shake' : ''}`}>
                    {otpDigits.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => {
                          otpRefs.current[i] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        disabled={isVerifying}
                        onChange={(e) => handleDigitChange(i, e.target.value)}
                        onKeyDown={(e) => handleDigitKeyDown(i, e)}
                        onPaste={handleOtpPaste}
                        className={`h-12 w-11 rounded-xl border text-center text-lg font-semibold text-slate-900 transition-all focus:outline-none focus:ring-1 dark:bg-[#131f37] dark:text-slate-200 ${
                          otpError
                            ? 'border-red-400 bg-red-50/40 focus:border-red-500 focus:ring-red-500 dark:border-red-500/60'
                            : 'border-slate-200 bg-slate-50 focus:border-blue-500 focus:ring-blue-500 dark:border-slate-700/80'
                        }`}
                      />
                    ))}
                  </div>
                  {otpError && (
                    <p className="mt-2 text-center text-xs font-medium text-red-500 dark:text-red-400">{otpError}</p>
                  )}
                  {isVerifying && (
                    <p className="mt-2 text-center text-xs text-slate-500 dark:text-slate-400">Verifying...</p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={resendCooldown > 0 || isSendingCode}
                  className="w-full text-center font-mono text-[11px] font-semibold text-blue-600 hover:text-blue-500 hover:underline disabled:cursor-not-allowed disabled:opacity-60 dark:text-blue-400"
                >
                  {resendCooldown > 0 ? `Resend code (${resendCooldown}s)` : 'Resend code'}
                </button>
              </div>
            )}

            {step === 'success' && (
              <div className="flex flex-col items-center gap-4 py-2 text-center">
                <CheckCircle2 className="h-10 w-10 text-emerald-500" aria-hidden="true" />
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  You can now sign in with your new password.
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white shadow-[0_0_24px_rgba(59,130,246,0.4)] transition-all hover:bg-blue-500 hover:shadow-[0_0_32px_rgba(59,130,246,0.65)] active:scale-95"
                >
                  Continue to sign in
                </button>
              </div>
            )}

            {step !== 'success' && (
              <div className="mt-6 flex items-center justify-center gap-2 border-t border-slate-100 pt-5 font-mono text-[11px] text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <ShieldCheck className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                TLS 256-bit encrypted
                <span className="mx-1 text-slate-300 dark:text-slate-700">|</span>
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" aria-hidden="true" />
                Postgres RLS active
              </div>
            )}
          </div>

          {step !== 'success' && (
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-500 hover:underline dark:text-blue-400"
              >
                Return to sign in
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
              <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                Lost access to your email? Contact your school admin or the ILOPRISAA committee.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}