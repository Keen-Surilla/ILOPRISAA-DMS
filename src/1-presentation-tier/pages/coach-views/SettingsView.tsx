import React, { useState, useEffect } from 'react';
import { User, Shield, Info, Save, Search, X, ChevronDown, Users } from 'lucide-react';
import { useAuthStore } from '../../../2-application-tier/stores/authStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProfile, updateProfile } from '../../../3-data-tier/services/profileService';
import { supabase } from '../../../3-data-tier/config/SupabaseClient';

// Put this near your imports at the top of the file
const ILOPRISAA_SCHOOLS = [
  { id: 'CPU', name: 'Central Philippine University' },
  { id: 'USA', name: 'University of San Agustin' },
  { id: 'JBLFMU', name: 'John B. Lacson Foundation Maritime University' },
  { id: 'WIT', name: 'Western Institute of Technology' },
  { id: 'IDC', name: 'Iloilo Doctors College' },
  { id: 'SPUI', name: 'St. Paul University Iloilo' },
  { id: 'UI', name: 'PHINMA University of Iloilo' },
  { id: 'HSCI', name: 'Hua Siong College of Iloilo' },
  { id: 'CSCJ', name: 'Colegio del Sagrado Corazon de Jesus' },
  { id: 'SJI', name: 'Sun Yat Sen High School' },
];

export function useRealtimeSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ['coachProfile'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}

export default function SettingsView({ onClose }: { onClose: () => void }) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState('account');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  
// Put this inside your component, near your other state variables
  const [institution, setInstitution] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  // This magic line instantly filters the schools as the coach types!
// This version safely handles null/undefined values so it never crashes!
  const filteredSchools = ILOPRISAA_SCHOOLS.filter(school => {
    // 1. Create a safe search string (if it's null, default to an empty string '')
    const searchStr = (institution || '').toLowerCase();
    
    // 2. Safely perform the search
    return (
      school.name.toLowerCase().includes(searchStr) ||
      school.id.toLowerCase().includes(searchStr)
    );
  });


  const { data: profile, isLoading } = useQuery({
    queryKey: ['coachProfile', user?.id],
    queryFn: () => getProfile(user?.id || ''),
    enabled: !!user?.id
  });

  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    dob: '',
    gender: '',
    sport: '',
    institution_id: '', 
    team_motto: '' // <--- Added custom team text field
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        dob: profile.dob || '',
        gender: profile.gender || '',
        sport: profile.sport || '',
        institution_id: profile.institution_id || '',
        team_motto: profile.team_motto || '' // <--- Populate it
      });
    }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: (updatedData: any) => updateProfile(user?.id || '', updatedData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coachProfile', user?.id] });
      setSuccessMessage('Settings updated successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    },
    onError: () => {
      alert("Failed to update profile. Please try again.");
    }
  });

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const payloadToSave = {
      ...formData,
      dob: formData.dob === '' ? null : formData.dob 
    };
    updateMutation.mutate(payloadToSave);
  };

  const getInitials = (name: string) => {
    if (!name) return 'CO';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  // Utility to format raw sport data (e.g., "basketball_5x5") into a clean Title (e.g., "Basketball 5x5 Team")
  const formatSportTeamName = (rawSport: string) => {
    if (!rawSport) return 'No Sport Selected';
    const cleanSport = rawSport.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    return `${cleanSport} Team`;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 md:p-8 animate-in fade-in duration-200">
      
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 flex overflow-hidden h-full max-h-[750px] w-full max-w-5xl relative animate-in zoom-in-95 duration-200">
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-50 p-2 bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* LEFT SIDEBAR */}
        <div className="w-64 bg-[#f8f9fa] border-r border-slate-200 p-4 flex flex-col shrink-0">
          <div className="relative mb-6 mt-2">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search" 
              className="w-full pl-9 pr-4 py-2 bg-slate-200/60 border-transparent rounded-lg text-sm text-slate-700 placeholder-slate-500 focus:bg-white focus:border-slate-300 focus:ring-2 focus:ring-slate-100 outline-none transition-all" 
            />
          </div>

          <div className="text-xs font-semibold text-slate-500 mb-3 px-2">Settings</div>
          
          <nav className="space-y-1">
            <button onClick={() => setActiveTab('account')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'account' ? 'bg-[#e9ecef] text-slate-900' : 'text-slate-600 hover:bg-slate-200/50'}`}>
              <User className="w-4 h-4" /> Profile
            </button>
            <button onClick={() => setActiveTab('team')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'team' ? 'bg-[#e9ecef] text-slate-900' : 'text-slate-600 hover:bg-slate-200/50'}`}>
              <Users className="w-4 h-4" /> Team
            </button>
            <button onClick={() => setActiveTab('security')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'security' ? 'bg-[#e9ecef] text-slate-900' : 'text-slate-600 hover:bg-slate-200/50'}`}>
              <Shield className="w-4 h-4" /> Security
            </button>
            <button onClick={() => setActiveTab('about')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'about' ? 'bg-[#e9ecef] text-slate-900' : 'text-slate-600 hover:bg-slate-200/50'}`}>
              <Info className="w-4 h-4" /> About
            </button>
          </nav>
        </div>

        {/* RIGHT CONTENT AREA - Now wrapped completely in the Form */}
        <div className="flex-1 bg-white overflow-hidden flex flex-col relative">
          
          {isLoading ? (
            <div className="p-8 space-y-6 animate-pulse w-full max-w-3xl">
              <div className="h-12 bg-slate-100 rounded-lg w-full"></div>
              <div className="h-12 bg-slate-100 rounded-lg w-full"></div>
            </div>
          ) : (
            <form onSubmit={handleSaveProfile} className="flex-1 flex flex-col h-full overflow-y-auto">
              
              <div className="p-8 max-w-3xl flex-1 w-full relative">
                
                {successMessage && (
                  <div className="absolute top-4 left-8 right-8 z-10 p-3 bg-green-50 text-green-700 text-sm border border-green-200 rounded-lg animate-in fade-in slide-in-from-top-2">
                    {successMessage}
                  </div>
                )}

                {/* --- ACCOUNT TAB --- */}
                {activeTab === 'account' && (
                  <div className={`animate-in fade-in duration-200 ${successMessage ? 'mt-12' : ''}`}>
                    <h2 className="text-xl font-bold text-slate-900 mb-8">Profile</h2>
                    
                    <div className="space-y-1">
                      <div className="flex items-center justify-between py-5 border-b border-slate-100">
                        <span className="text-sm font-medium text-slate-700">Avatar</span>
                        <div className="w-9 h-9 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs tracking-widest shadow-sm">
                          {getInitials(formData.full_name)}
                        </div>
                      </div>

                      <div className="flex flex-col md:flex-row md:items-center justify-between py-5 border-b border-slate-100 gap-4">
                        <label className="text-sm font-medium text-slate-700 md:w-1/3">Full name</label>
                        <input type="text" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} className="w-full md:w-2/3 px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm outline-none focus:border-slate-400 focus:bg-white transition-colors" />
                      </div>

                      <div className="flex flex-col md:flex-row md:items-center justify-between py-5 border-b border-slate-100 gap-4">
                        <label className="text-sm font-medium text-slate-700 md:w-1/3">Phone Number</label>
                        <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="+63 9XX XXX XXXX" className="w-full md:w-2/3 px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm outline-none focus:border-slate-400 focus:bg-white transition-colors" />
                      </div>

                      <div className="flex flex-col md:flex-row md:items-center justify-between py-5 border-b border-slate-100 gap-4">
                        <label className="text-sm font-medium text-slate-700 md:w-1/3">Date of Birth</label>
                        <input type="date" value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} className="w-full md:w-2/3 px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm outline-none focus:border-slate-400 focus:bg-white transition-colors" />
                      </div>

                      <div className="flex flex-col md:flex-row md:items-center justify-between py-5 border-b border-slate-100 gap-4">
                        <label className="text-sm font-medium text-slate-700 md:w-1/3">Gender</label>
                        <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} className="w-full md:w-2/3 px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm outline-none focus:border-slate-400 focus:bg-white transition-colors">
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                        </select>
                      </div>

                      <div className="flex flex-col md:flex-row md:items-center justify-between py-5 border-b border-slate-100 gap-4">
                        <label className="text-sm font-medium text-slate-700 md:w-1/3">Primary Sport</label>
                        <div className="relative w-full md:w-2/3">
                          <select 
                            required 
                            value={formData.sport} 
                            onChange={(e) => setFormData({...formData, sport: e.target.value})} 
                            className="w-full pl-4 pr-10 py-2 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition-all text-sm text-slate-800 appearance-none"
                          >
                            <option value="" disabled>Select your sport</option>
                            <optgroup label="Team Sports">
                              <option value="baseball">Baseball</option>
                              <option value="basketball_5x5">Basketball (5x5)</option>
                              <option value="basketball_3x3">Basketball (3x3)</option>
                              <option value="beach_volleyball">Beach Volleyball</option>
                              <option value="football">Football</option>
                              <option value="sepaktakraw">Sepaktakraw</option>
                              <option value="softball">Softball</option>
                              <option value="volleyball">Volleyball</option>
                            </optgroup>
                            <optgroup label="Individual Sports">
                              <option value="archery">Archery</option>
                              <option value="athletics">Athletics</option>
                              <option value="badminton">Badminton</option>
                              <option value="billiards">Billiards</option>
                              <option value="boxing">Boxing</option>
                              <option value="chess">Chess</option>
                              <option value="dancesport">Dancesport</option>
                              <option value="gymnastics">Gymnastics</option>
                              <option value="karatedo">Karatedo</option>
                              <option value="swimming">Swimming</option>
                              <option value="table_tennis">Table Tennis</option>
                              <option value="taekwondo">Taekwondo</option>
                              <option value="tennis">Tennis</option>
                              <option value="weightlifting">Weightlifting</option>
                            </optgroup>
                          </select>
                          <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* --- TEAM TAB --- */}
                {activeTab === 'team' && (
                  <div className={`animate-in fade-in duration-200 ${successMessage ? 'mt-12' : ''}`}>
                    <h2 className="text-xl font-bold text-slate-900 mb-8">Team Settings</h2>
                    
                    <div className="space-y-1">
                      {/* --- ILOPRISAA AUTOCOMPLETE INPUT --- */}
        <div className="flex flex-col md:flex-row md:items-center justify-between py-5 border-b border-slate-100 gap-4 relative">
  <label className="text-sm font-medium text-slate-700 md:w-1/3">Institution Name</label>
  
  <div className="w-full md:w-2/3 relative">
    <input
      type="text"
      value={institution}
      onChange={e => {
        setInstitution(e.target.value);
        setShowSuggestions(true);
      }}
      onFocus={() => setShowSuggestions(true)}
      onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm outline-none focus:border-slate-400 focus:bg-white transition-colors"
      placeholder="e.g. Western Institute of Technology"
    />

    {/* The ILOPRISAA Suggestion Dropdown */}
    {showSuggestions && institution && (
      <ul className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
        {filteredSchools.length > 0 ? (
          filteredSchools.map((school) => (
            <li
              key={school.id}
              onClick={() => {
                setInstitution(school.name);
                setShowSuggestions(false);
              }}
              className="px-4 py-2.5 hover:bg-slate-50 cursor-pointer flex items-center justify-between text-sm text-slate-700 border-b border-slate-50 last:border-0"
            >
              <span className="font-medium">{school.name}</span>
            </li>
          ))
        ) : (
          <li className="px-4 py-3 text-xs text-slate-400 italic text-center">
            No ILOPRISAA schools found matching "{institution}"
          </li>
        )}
      </ul>
    )}
  </div>
</div>

                      <div className="flex flex-col md:flex-row md:items-center justify-between py-5 border-b border-slate-100 gap-4">
                        <div className="md:w-1/3">
                          <label className="text-sm font-medium text-slate-700">Sport Classification</label>
                          <p className="text-[11px] text-slate-500 mt-1">Based on your Profile setting.</p>
                        </div>
                        <div className="w-full md:w-2/3">
                          <span className="inline-block px-3 py-1.5 bg-blue-50 text-blue-700 font-bold text-sm rounded-lg border border-blue-200/60">
                            {formatSportTeamName(formData.sport)}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col md:flex-row md:items-start justify-between py-5 border-b border-slate-100 gap-4">
                        <div className="md:w-1/3">
                          <label className="text-sm font-medium text-slate-700">Team Motto / Subtitle</label>
                          <p className="text-[11px] text-slate-500 mt-1">This text appears under your team name in the dashboard.</p>
                        </div>
                        <textarea 
                          value={formData.team_motto} 
                          onChange={e => setFormData({...formData, team_motto: e.target.value})} 
                          placeholder="e.g. We swim together, we win together"
                          rows={3}
                          className="w-full md:w-2/3 px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm outline-none focus:border-slate-400 focus:bg-white transition-colors resize-none" 
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* --- SECURITY & ABOUT TABS --- */}
                {activeTab === 'security' && (
                  <div className="animate-in fade-in duration-200">
                    <h2 className="text-xl font-bold text-slate-900 mb-8">Security & Privacy</h2>
                    <div className="flex items-center justify-center h-64 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-sm">Security Settings coming soon...</div>
                  </div>
                )}

                {activeTab === 'about' && (
                  <div className="animate-in fade-in duration-200">
                    <h2 className="text-xl font-bold text-slate-900 mb-8">About</h2>
                    <div className="flex items-center justify-center h-64 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-sm">App Information coming soon...</div>
                  </div>
                )}
              </div>

              {/* FLOATING SAVE BUTTON (Always visible for Account & Team tabs) */}
              {(activeTab === 'account' || activeTab === 'team') && (
                <div className="sticky bottom-0 bg-white p-6 border-t border-slate-100 flex justify-end shrink-0 shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.05)]">
                  <button 
                    type="submit" 
                    disabled={updateMutation.isPending} 
                    className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-[#0f172a] hover:bg-slate-800 disabled:bg-slate-400 rounded-lg shadow-sm transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    {updateMutation.isPending ? 'Saving...' : 'Save changes'}
                  </button>
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}