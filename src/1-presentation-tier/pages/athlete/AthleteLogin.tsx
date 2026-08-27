import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, AlertTriangle, Clock } from 'lucide-react';
import { useAuthStore } from '../../../2-application-tier/stores/authStore';
import { useSearchParams } from 'react-router-dom';
import Logo1 from '../../../assets/logo1.svg';

export default function AthleteGuesztLogin() {
  const { sendAthleteOtp, verifyAthleteOtp } = useAuthStore();
  const [searchParams] = useSearchParams();
  const [isLinkExpired, setIsLinkExpired] = useState(false);
  const [coachId, setCoachId] = useState<string | null>(null);
  const navigate = useNavigate();

  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');

  // 6 digits — this project's Supabase Auth is configured for 6-digit
  // email OTPs, confirmed by what's actually arriving in the inbox.
  const [pinArray, setPinArray] = useState(Array(6).fill(''));
  const [pinShake, setPinShake] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  useEffect(() => {
    // 1. Grab the token from the URL
    const inviteToken = searchParams.get('invite');

    if (inviteToken) {
      try {
        // 2. Unscramble the token back into readable data
        const decodedData = JSON.parse(atob(inviteToken));

        // 3. Check if the current time is PAST the expiration time
        if (Date.now() > decodedData.exp) {
          setIsLinkExpired(true);
        } else {
          // Link is valid! You can save the coachId to link them to this specific coach
          setCoachId(decodedData.coachId);
        }
      } catch (error) {
        // If they mess with the token in the URL, it will fail to unscramble and instantly expire
        setIsLinkExpired(true);
      }
    }
  }, [searchParams]);

  // 4. The "Link Expired" Error UI
  if (isLinkExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-slate-100 animate-in fade-in zoom-in-95 duration-300 motion-reduce:animate-none">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Link Expired</h2>
          <p className="text-slate-500 mb-6">
            For security reasons, this team invitation link has expired because it is older than 30 minutes.
          </p>
          <p className="text-sm font-medium text-slate-700 bg-slate-100 py-3 rounded-2xl">
            Please ask your coach to generate a new invite link for you.
          </p>
        </div>
      </div>
    );
  }

  const handleSendPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setErrorMsg(null);
    setIsSending(true);

    try {
      const { error } = await sendAthleteOtp(email);
      if (error) {
        setErrorMsg(error);
      } else {
        setStep('otp');
        setResendCooldown(30);
      }
    } catch (err: any) {
      console.error('Sending OTP failed:', err);
      setErrorMsg(err?.message || 'Could not send the code. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handlePinChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return; // Numbers only

    const newPin = [...pinArray];
    newPin[index] = value;
    setPinArray(newPin);

    // Auto-advance up to the last box
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pinArray[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyPin = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullPin = pinArray.join('');

    // Wait for exactly 6 digits
    if (fullPin.length < 6) return;

    setErrorMsg(null);
    setIsVerifying(true);

    try {
      const { error } = await verifyAthleteOtp(email, fullPin);
      if (error) {
        setErrorMsg(error);
        setPinShake(true);
        setTimeout(() => setPinShake(false), 500);
      } else {
        // This was the actual missing piece — verifyAthleteOtp was
        // succeeding (role/profile correctly set in the store), but
        // nothing ever told the router to leave this page. RoleBasedRedirect
        // at /home sends 'athlete' role to the right portal from here.
        navigate('/home', { replace: true });
      }
    } catch (err: any) {
      // If verifyAthleteOtp throws instead of returning {error}, the spinner
      // used to hang forever here — this is what was causing "stuck in
      // verifying" whenever the request failed in an unexpected way.
      console.error('OTP verification failed:', err);
      setErrorMsg(err?.message || 'Verification failed. Please try again.');
      setPinShake(true);
      setTimeout(() => setPinShake(false), 500);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <style>{`
        @keyframes shake {
          10%, 90% { transform: translateX(-1px); }
          20%, 80% { transform: translateX(2px); }
          30%, 50%, 70% { transform: translateX(-4px); }
          40%, 60% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-shake { animation: none; }
        }
      `}</style>

      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-100 p-8 animate-in fade-in zoom-in-95 duration-300 motion-reduce:animate-none">

        <div className="flex items-center gap-3 mb-8">
          <img src={Logo1} alt="ILOPRISAA" className="h-12 w-auto shrink-0" />
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Welcome Back!</h2>
            <p className="text-slate-500 text-xs mt-0.5">
              {step === 'email' ? 'Enter your roster email to continue.' : `Enter the 6-digit code sent to ${email}`}
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-6 flex items-start gap-3 p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-2xl">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {step === 'email' ? (
          <form onSubmit={handleSendPin} className="space-y-5 animate-in fade-in duration-200 motion-reduce:animate-none">
            <div>
              <label htmlFor="athlete-email" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Email</label>
              <input
                id="athlete-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-5 py-3.5 bg-slate-100 border border-transparent rounded-full text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-600 focus:bg-white outline-none transition-[border-color,background-color]"
              />
            </div>
            <button
              type="submit"
              disabled={isSending || !email}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white py-3.5 rounded-full font-bold transition-[background-color,transform] disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed shadow-md shadow-blue-600/20"
            >
              {isSending ? 'Sending Code...' : 'Continue'} <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyPin} className="space-y-6 animate-in fade-in duration-200 motion-reduce:animate-none">
            <div>
              <label id="otp-label" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 text-center">
                Enter Verification Code
              </label>

              <div
                className="flex justify-between gap-1 sm:gap-2"
                role="group"
                aria-labelledby="otp-label"
              >
                {pinArray.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { inputRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handlePinChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    aria-label={`Digit ${index + 1} of 6`}
                    aria-invalid={pinShake}
                    style={pinShake ? { animationDelay: `${index * 25}ms` } : undefined}
                    className={`w-10 h-12 sm:w-11 sm:h-12 text-center text-lg font-bold rounded-2xl outline-none transition-[border-color,background-color,box-shadow] ${
                      pinShake
                        ? 'bg-red-50 border-2 border-red-400 ring-2 ring-red-200 animate-shake'
                        : 'bg-slate-100 border border-transparent focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-600/20'
                    }`}
                  />
                ))}
              </div>

              <div className="flex justify-between items-center mt-3">
                <button type="button" onClick={() => setStep('email')} className="text-xs text-blue-600 font-bold hover:underline">
                  Change email
                </button>
                <button
                  type="button"
                  onClick={handleSendPin}
                  disabled={isSending || resendCooldown > 0}
                  className="text-xs text-slate-500 hover:text-slate-800 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSending ? 'Sending…' : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isVerifying || pinArray.join('').length < 6}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white py-3.5 rounded-full font-bold transition-[background-color,transform] shadow-md shadow-blue-600/20 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              {isVerifying ? 'Verifying...' : 'Verify & Sign In'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}