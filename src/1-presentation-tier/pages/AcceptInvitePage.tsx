import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { supabase } from '../../3-data-tier/config/SupabaseClient';
import { useAuthStore } from '../../2-application-tier/stores/authStore';

import Logo1 from '../../assets/Logo1.svg';
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

      const { data, error: rpcError } = await supabase
        .rpc('get_invite_by_token', { p_token: token })
        .single();

      if (cancelled) return;

      if (rpcError || !data) {
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-sm text-slate-400">Checking your invite…</p>
      </div>
    );
  }

  if (pageState === 'invalid') {
    return (
      <div className="min-h-screen bg-white flex flex-col font-sans">
        <header className="w-full px-8 py-4 flex items-center border-b border-slate-100">
          <img src={Logo2} alt="ILOPRISAA" className="h-7 w-auto" />
        </header>
        <main className="flex-1 flex items-center justify-center p-6 bg-slate-50/30">
          <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl shadow-blue-900/5 border border-slate-100 text-center">
            <h2 className="text-lg font-bold text-slate-800 mb-2">Invite Not Available</h2>
            <p className="text-sm text-slate-500">{error}</p>
          </div>
        </main>
      </div>
    );
  }

  const roleLabel = invite ? (ROLE_LABELS[invite.role] ?? invite.role) : '';

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <header className="w-full px-8 py-4 flex items-center border-b border-slate-100">
        <img src={Logo2} alt="ILOPRISAA" className="h-7 w-auto" />
      </header>

      <main className="flex-1 flex items-center justify-center p-6 bg-slate-50/30">
        <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl shadow-blue-900/5 border border-slate-100 transition-all">

          <div className="flex items-start gap-3 mb-6">
            <div className="w-16 h-16 flex items-center justify-center shrink-0">
              <img src={Logo1} alt="Welcome Badge" className="w-full h-full object-contain" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 tracking-tight mt-1">
                Join as {roleLabel}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Set a password to activate your {invite?.email} account
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 ml-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  maxLength={50}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-4 pr-10 py-2 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition-all text-sm text-slate-800 placeholder-slate-400 [&::-ms-reveal]:hidden [&::-ms-clear]:hidden"
                  placeholder="Create a password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 ml-1">
                Confirm Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                maxLength={50}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition-all text-sm text-slate-800 placeholder-slate-400"
                placeholder="Re-enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl mt-2 disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-md shadow-blue-600/10 active:scale-[0.99]"
            >
              {isSubmitting ? 'Setting up your account…' : 'Activate Account'}
            </button>
          </form>

        </div>
      </main>
    </div>
  );
}