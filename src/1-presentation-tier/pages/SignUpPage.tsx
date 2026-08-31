import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../2-application-tier/stores/authStore';
import { 
  Eye, 
  EyeOff, 
  Trophy, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight,
  // UserCheck //
} from 'lucide-react';
import { PhilippinePhoneInput } from '../../1-presentation-tier/components/ui/PhilippinePhoneInput';
import { SexOption } from '../components/ui/SexOption';
import { SportSelect } from '../components/ui/SportSelect';
import { SchoolList } from '../components/ui/SchoolList';

import Logo1 from '../../assets/Logo1.svg';
import Logo2 from '../../assets/Logo2.svg';

export default function SignUpPage() {
  // Step & Role State
  const [step, setStep] = useState<'role-select' | 'form'>('role-select');
  const [selectedRole, setSelectedRole] = useState<'coach' | 'committee' | null>(null);

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

  if (!selectedRole) {
    setError("Please select a role before continuing.");
    return;
  }
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
      sport,
      selectedRole!
    );
    
    if (result.error) {
      setError(result.error);
      return;
    }
    
    setSuccess(true);
  };

  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50/50 p-4 font-sans">
        <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl text-center border border-slate-100">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Account Created!</h2>
          <p className="text-slate-500 mt-2 text-sm leading-relaxed">
            Welcome to ILOPRISAA. Your {selectedRole === 'committee' ? 'Eligibility Committee' : 'Coach'} account has been successfully registered.
          </p>
          <button 
            onClick={() => navigate('/login')} 
            className="mt-6 w-full bg-blue-600 text-white py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-md shadow-blue-600/10 active:scale-[0.99]"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      {/* Header */}
      <header className="w-full px-8 py-4 flex justify-between items-center border-b border-slate-100">
        <div className="flex items-center gap-2">
          <img src={Logo2} alt="ILOPRISAA" className="h-7 w-auto" />
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-slate-500">Already have an account?</span>
          <Link 
            to="/login" 
            className="border border-blue-600 text-blue-600 px-5 py-1.5 rounded-lg font-medium hover:bg-blue-50 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center p-6 bg-slate-50/50">
        <div className="w-full max-w-xl bg-white p-8 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 transition-all">
          
          {step === 'role-select' ? (
            /* ======================================================== */
            /* STEP 1: ROLE SELECTION                                   */
            /* ======================================================== */
            <div>
              <div className="text-center mb-8">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                  Registration Step 1 of 2
                </span>
                <h2 className="text-2xl font-bold text-slate-900 mt-3 tracking-tight">Select Your Role</h2>
                <p className="text-xs text-slate-500 mt-1">Choose how you will participate in the ILOPRISAA portal</p>
              </div>

              {/* Role Selection Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                {/* Option 1: Coach */}
                <div
                  onClick={() => setSelectedRole('coach')}
                  className={`relative flex flex-col justify-between p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                    selectedRole === 'coach'
                      ? 'border-blue-600 bg-blue-50/30 shadow-sm ring-1 ring-blue-600/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${
                        selectedRole === 'coach' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600'
                      }`}>
                        <Trophy className="w-5 h-5" />
                      </div>
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                        selectedRole === 'coach' ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300'
                      }`}>
                        {selectedRole === 'coach' && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                    <h3 className="font-bold text-slate-900 text-base mb-1">Coach</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Register teams, manage sports events, and submit athlete credentials for verification.
                    </p>
                  </div>
                </div>

                {/* Option 2: Eligibility Committee */}
                <div
                  onClick={() => setSelectedRole('committee')}
                  className={`relative flex flex-col justify-between p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                    selectedRole === 'committee'
                      ? 'border-blue-600 bg-blue-50/30 shadow-sm ring-1 ring-blue-600/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${
                        selectedRole === 'committee' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600'
                      }`}>
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                        selectedRole === 'committee' ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300'
                      }`}>
                        {selectedRole === 'committee' && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                    <h3 className="font-bold text-slate-900 text-base mb-1">Eligibility Committee</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Review submitted athlete documents, approve rosters, and verify event compliance.
                    </p>
                  </div>
                </div>
              </div>

              {/* Continue Button */}
              <button
                disabled={!selectedRole}
                onClick={() => setStep('form')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-blue-600/10 flex items-center justify-center gap-2 group active:scale-[0.99]"
              >
                <span>
                  {selectedRole
                    ? `Continue as ${selectedRole === 'coach' ? 'Coach' : 'Eligibility Committee'}`
                    : 'Select a Role to Continue'}
                </span>
                {selectedRole && <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />}
              </button>
            </div>
          ) : (
            /* ======================================================== */
            /* STEP 2: REGISTRATION FORM                                */
            /* ======================================================== */
            <div>
              {/* Header with Role & Change Button */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 flex items-center justify-center shrink-0">
                    <img src={Logo1} alt="Badge" className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                      {selectedRole === 'coach' ? 'Create Coach Account' : 'Create Committee Account'}
                    </h2>
                    <p className="text-xs text-slate-500">Fill in your details below</p>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={() => setStep('role-select')} 
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                >
                  Change Role
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-xs font-medium border border-red-100">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-3">Personal Information</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1 ml-1">Full Name</label>
                      <input 
                        type="text" 
                        required 
                        maxLength={100} 
                        value={fullName} 
                        onChange={(e) => setFullName(e.target.value)} 
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition-all text-sm text-slate-800 placeholder-slate-400" 
                        placeholder="Enter full name" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1 ml-1">Tel. No.</label>
                      <PhilippinePhoneInput value={phone} onChange={setPhone} required />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="dob" className="block text-xs font-bold text-slate-700 mb-1 ml-1">Date of Birth</label>
                        <input 
                          type="date" 
                          id ="dob"
                          required 
                          value={dob} 
                          onChange={(e) => setDob(e.target.value)} 
                          className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition-all text-sm text-slate-800" 
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1 ml-1">Sex</label>
                        <SexOption value={gender} onChange={setGender} options={['Male', 'Female']} />
                      </div>
                    </div>

                    {/* Show School and Sport for Coach */}
                    {selectedRole === 'coach' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1 ml-1">School</label>
                          <SchoolList value={school} onChange={setSchool} required />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1 ml-1">Primary Sport</label>
                          <SportSelect value={sport} onChange={setSport} required />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2">
                  <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-3">Account Information</h3>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 ml-1">Email Address</label>
                    <input 
                      type="email" 
                      required 
                      maxLength={100} 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition-all text-sm text-slate-800 placeholder-slate-400" 
                      placeholder="Example@gmail.com" 
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1 ml-1">Password</label>
                      <div className="relative">
                        <input 
                          type={showPassword ? "text" : "password"} 
                          required 
                          maxLength={128} 
                          value={password} 
                          onChange={(e) => setPassword(e.target.value)} 
                          className="w-full pl-4 pr-10 py-2 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition-all text-sm text-slate-800 placeholder-slate-400" 
                          placeholder="Enter password" 
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition-colors">
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1 ml-1">Confirm Password</label>
                      <div className="relative">
                        <input 
                          type={showConfirmPassword ? "text" : "password"} 
                          required 
                          maxLength={128} 
                          value={confirmPassword} 
                          onChange={(e) => setConfirmPassword(e.target.value)} 
                          className="w-full pl-4 pr-10 py-2 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition-all text-sm text-slate-800 placeholder-slate-400" 
                          placeholder="Confirm password" 
                        />
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
                      I agree to the Terms of Service and Privacy Policy
                    </span>
                  </label>
                </div>

                <button 
                  type="submit" 
                  disabled={isLoading} 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl mt-4 disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-md shadow-blue-600/10 active:scale-[0.99]"
                >
                  {isLoading ? 'Creating Account...' : 'Sign Up'}
                </button>
              </form>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}