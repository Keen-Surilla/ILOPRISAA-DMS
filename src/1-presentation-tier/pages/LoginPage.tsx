import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../2-application-tier/stores/authStore';
import { validateLoginInput } from '../../2-application-tier/validators/payloadValidators';
import { Eye, EyeOff, ChevronLeft } from 'lucide-react';

import Logo1 from '../../assets/Logo1.svg';
import Logo2 from '../../assets/Logo2.svg';

export default function LoginPage() {
  // Changed from username to email to match Supabase requirements
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { signIn, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // TIER 2 DELEGATION: Validate the email and password
    const validation = validateLoginInput(email, password);
    
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    // Safely use the sanitized email from Tier 2
    const safeEmail = validation.sanitizedEmail!;
    
    // Proceed with authentication using the exact email
    const result = await signIn(safeEmail, password);
    
    if (result.error) {
      setError(result.error);
      return;
    }
    navigate('/home', { replace: true });
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <header className="w-full px-8 py-4 flex justify-between items-center border-b border-slate-100">
        <div className="flex items-center gap-7">
          {/* Back button added here */}
          <button 
            onClick={() => navigate('/')} 
            className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
            title="Go back to landing page"
          >
            <ChevronLeft className="h-8 w-8" />
          </button>
          
          <img 
            src={Logo2} 
            alt="ILOPRISAA Logo" 
            className="h-7 w-auto object-contain flex-none" 
          />
        </div>

        <div className="flex items-center gap-4 text-sm">
          <span className="text-slate-600">Don't have an account?</span>
          <Link 
            to="/signup" 
            className="border border-blue-600 text-blue-600 px-5 py-1.5 rounded-lg font-medium hover:bg-blue-50 transition-colors"
          >
            Register
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6 bg-slate-50/30">
        <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl shadow-blue-900/5 border border-slate-100 transition-all">
          
          <div className="flex items-start gap-3 mb-6">
            <div className="w-16 h-16 flex items-center justify-center shrink-0">
              <img src={Logo1} alt="Welcome Badge" className="w-full h-full object-contain" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 tracking-tight mt-1">Welcome Back!</h2>
              <p className="text-xs text-slate-400 mt-0.5">Login to continue with your account</p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Email
              </label>
              <input 
                type="email" 
                required 
                maxLength={100} // Tier 1 HTML defense
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition-all text-sm text-slate-800 placeholder-slate-400" 
                placeholder="Enter your email" 
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  required 
                  maxLength={50} // Tier 1 HTML defense
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  className="w-full pl-4 pr-10 py-2 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition-all text-sm text-slate-800 placeholder-slate-400 [&::-ms-reveal]:hidden [&::-ms-clear]:hidden" 
                  placeholder="Enter your password" 
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

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 select-none cursor-pointer group">
                <input 
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500/20"
                />
                <span className="text-xs text-slate-500 group-hover:text-slate-700 transition-colors">
                  Remember me
                </span>
              </label>
            </div>

            <button 
              type="submit" 
              disabled={isLoading} 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl mt-2 disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-md shadow-blue-600/10 active:scale-[0.99]"
            >
              {isLoading ? 'Processing...' : 'Login'}
            </button>
          </form>

        </div>
      </main>
    </div>
  );
}