import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../2-application-tier/stores/authStore';
import { Eye, EyeOff, ChevronDown } from 'lucide-react';
import { PhilippinePhoneInput } from '../../1-presentation-tier/components/ui/PhilippinePhoneInput';
import { SexOption } from '../components/ui/SexOption';
import { ILOPRISAA_SCHOOLS } from '../../3-data-tier/constant/schools';
import { SportSelect } from '../components/ui/SportSelect';
import { SchoolList } from '../components/ui/SchoolList';


import Logo1 from '../../assets/Logo1.svg';
import Logo2 from '../../assets/Logo2.svg';

export default function SignUpPage() {
  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [school, setSchool] = useState('');
  const [sport, setSport] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  
  // UI State
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const { signUp, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!agreeTerms) {
      setError("You must agree to the Terms of Service and Privacy Policy.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    const result = await signUp(
      email, 
      password, 
      fullName, 
      phone, 
      dob, 
      gender, 
      school, 
      sport
    );
    
    if (result.error) {
      setError(result.error);
      return;
    }
    
    setSuccess(true);
  };

  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50/30 p-4">
        <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl text-center border border-slate-100">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">✓</div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Account Created!</h2>
          <p className="text-slate-500 mt-2 text-sm">Welcome to ILOPRISAA. Your coach account has been successfully registered.</p>
          <button onClick={() => navigate('/login')} className="mt-6 w-full bg-blue-600 text-white py-2.5 rounded-xl font-medium hover:bg-blue-700 transition-all shadow-md shadow-blue-600/10">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <header className="w-full px-8 py-4 flex justify-between items-center border-b border-slate-100">
        <div className="flex items-center gap-2">
            <img src={Logo2} alt="ILOPRISAA" className="h-7 w-auto" />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6 bg-slate-50/30">
        <div className="w-full max-w-xl bg-white p-8 rounded-2xl shadow-xl shadow-blue-900/5 border border-slate-100 transition-all">
          
          <div className="flex items-start gap-3 mb-6">
            <div className="w-14 h-14 flex items-center justify-center shrink-0">
              <img src={Logo1} alt="Create Account Badge" className="w-full h-full object-contain" />
            </div>
            <div className="mt-1">
              <h2 className="text-xl font-bold text-blue-600 tracking-tight">Create Coach Account</h2>
              <p className="text-xs text-slate-400 mt-0.5">Fill to create your account</p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-xs font-medium border border-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <h3 className="text-xs font-bold text-blue-600 mb-3">Personal Information</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 ml-1">Full Name</label>
                  <input type="text" required maxLength={100} value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition-all text-sm text-slate-800 placeholder-slate-400" placeholder="Enter full name" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 ml-1">Tel. No.</label>
                  <PhilippinePhoneInput value={phone} onChange={setPhone} required />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 ml-1">Date of Birth</label>
                    <input type="date" required value={dob} onChange={(e) => setDob(e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition-all text-sm text-slate-800" />
                  </div>
                  <div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1 ml-1">Sex</label>
                      <SexOption value={gender} onChange={setGender} options={['Male', 'Female']} />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1 ml-1">School</label>
                        <SchoolList value={school} onChange={setSchool} required />
                      </div>
                    
                    </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 ml-1">Primary Sport</label>
                    <div className="relative">
                     <SportSelect value={sport} onChange={setSport} required />
                    </div>
                  </div>
                </div>

              </div>
            </div>

            <div className="pt-2">
              <h3 className="text-xs font-bold text-blue-600 mb-3">Account Information</h3>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 ml-1">Email Address</label>
                  <input type="email" required maxLength={100} value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition-all text-sm text-slate-800 placeholder-slate-400" placeholder="Example@gmail.com" />
                </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 ml-1">Password</label>
                  <div className="relative">
                    <input type={showPassword ? "text" : "password"} required maxLength={128} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-4 pr-10 py-2 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition-all text-sm text-slate-800 placeholder-slate-400 [&::-ms-reveal]:hidden [&::-ms-clear]:hidden" placeholder="Enter password" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition-colors">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 ml-1">Confirm Password</label>
                  <div className="relative">
                    <input type={showConfirmPassword ? "text" : "password"} required maxLength={128} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full pl-4 pr-10 py-2 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition-all text-sm text-slate-800 placeholder-slate-400 [&::-ms-reveal]:hidden [&::-ms-clear]:hidden" placeholder="Confirm password" />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition-colors">
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-2 select-none cursor-pointer group">
                <input 
                  type="checkbox"
                  required
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500/20"
                />
                <span className="text-[11px] text-slate-500 group-hover:text-slate-700 transition-colors">
                  I agree to the Terms of Services and Privacy Policy
                </span>
              </label>
            </div>

            <button 
              type="submit" 
              disabled={isLoading} 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl mt-4 disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-md shadow-blue-600/10 active:scale-[0.99]"
            >
              {isLoading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>

        </div>
      </main>
    </div>
  );
}