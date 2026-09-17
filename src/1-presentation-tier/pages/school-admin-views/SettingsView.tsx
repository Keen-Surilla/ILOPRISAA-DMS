import React, { useEffect, useState } from 'react';
import { Building2, Info, Search, Shield, User, X } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../../2-application-tier/stores/authStore';
import { getProfile, updateProfile } from '../../../3-data-tier/services/profileService';
import { supabase } from '../../../3-data-tier/config/SupabaseClient';
import { findSchool } from '../../../3-data-tier/constant/schools';
import { PhilippinePhoneInput } from '../../components/ui/PhilippinePhoneInput';
import { SchoolList } from '../../components/ui/SchoolList';
import { SexOption } from '../../components/ui/SexOption';

export function useSchoolAdminRealtimeSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        queryClient.invalidateQueries({ queryKey: ['schoolAdminProfile'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}

const inputClassName =
  'w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 dark:border-white/[0.06] dark:bg-[#151b2d] dark:text-[#f8fafc]';

export default function SchoolAdminSettingsView({ onClose }: { onClose: () => void }) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('account');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [institution, setInstitution] = useState('');

  const { data: profile, isLoading } = useQuery({
    queryKey: ['schoolAdminProfile', user?.id],
    queryFn: () => getProfile(user?.id || ''),
    enabled: !!user?.id,
  });

  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    dob: '',
    gender: '',
    institution_id: '',
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        dob: profile.dob || '',
        gender: profile.gender || '',
        institution_id: profile.institution_id || '',
      });

      if (profile.institution_id) {
        const matchedSchool = findSchool(profile.institution_id);
        setInstitution(matchedSchool ? matchedSchool.name : profile.institution_id);
      }
    }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: (updatedData: any) => updateProfile(user?.id || '', updatedData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schoolAdminProfile', user?.id] });
      setSuccessMessage('Admin settings updated successfully.');
      setTimeout(() => setSuccessMessage(null), 3000);
    },
    onError: (error: any) => {
      console.error('Profile update failed:', error);
      alert(`Failed to update profile: ${error?.message || 'Unknown error'}`);
    },
  });

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const payloadToSave = {
      ...formData,
      dob: formData.dob === '' ? null : formData.dob,
    };
    updateMutation.mutate(payloadToSave);
  };

  const getInitials = (name: string) => {
    if (!name) return 'AD';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const navItems = [
    { id: 'account', label: 'Profile', icon: <User className="h-4 w-4" /> },
    { id: 'institution', label: 'Institution', icon: <Building2 className="h-4 w-4" /> },
    { id: 'security', label: 'Security', icon: <Shield className="h-4 w-4" /> },
    { id: 'about', label: 'About', icon: <Info className="h-4 w-4" /> },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm animate-in fade-in duration-200 dark:bg-black/60 md:p-8">
      <div className="relative flex h-full max-h-[750px] w-full max-w-5xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl animate-in zoom-in-95 duration-200 dark:border-white/[0.06] dark:bg-[#0b1220] dark:shadow-black/50">
        <div className="flex w-64 shrink-0 flex-col bg-[#0b1120] p-4 dark:bg-[#0f172a]">
          <div className="relative mb-6 mt-2">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search"
              className="w-full rounded-lg border-transparent bg-white/[0.05] py-2 pl-9 pr-4 text-sm text-[#f8fafc] outline-none transition-all placeholder:text-[#64748b] focus:bg-white/[0.08] focus:ring-2 focus:ring-white/[0.06]"
            />
          </div>

          <div className="mb-3 px-2 text-xs font-semibold text-[#64748b]">Admin Settings</div>

          <nav className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  activeTab === item.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-[#94a3b8] hover:bg-white/[0.04] hover:text-[#f8fafc]'
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="relative flex flex-1 flex-col overflow-hidden bg-white dark:bg-[#0b1220]">
          <div className="flex h-14 shrink-0 items-center justify-end border-b border-slate-100 px-4 dark:border-white/[0.06]">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-slate-100 p-1.5 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-700 focus:outline-none dark:bg-white/[0.06] dark:text-[#94a3b8] dark:hover:bg-white/[0.1] dark:hover:text-[#f8fafc]"
              title="Close Settings"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {isLoading ? (
            <div className="w-full max-w-3xl space-y-6 p-8">
              <div className="h-12 w-full animate-pulse rounded-lg bg-slate-100 dark:bg-white/[0.06]" />
              <div className="h-12 w-full animate-pulse rounded-lg bg-slate-100 dark:bg-white/[0.06]" />
            </div>
          ) : (
            <form onSubmit={handleSaveProfile} className="flex h-full flex-1 flex-col overflow-y-auto">
              <div className="relative w-full max-w-3xl flex-1 p-6 md:p-8">
                {successMessage && (
                  <div className="absolute left-8 right-8 top-4 z-10 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 animate-in fade-in slide-in-from-top-2 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
                    {successMessage}
                  </div>
                )}

                {activeTab === 'account' && (
                  <div className={`animate-in fade-in duration-200 ${successMessage ? 'mt-12' : ''}`}>
                    <h2 className="mb-6 text-xl font-bold text-slate-900 dark:text-[#f8fafc]">Admin Profile</h2>

                    <div className="divide-y divide-slate-100 dark:divide-white/[0.06]">
                      <div className="flex items-center justify-between py-5">
                        <span className="text-sm font-medium text-slate-700 dark:text-[#cbd5e1]">Avatar</span>
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-xs font-bold tracking-widest text-white shadow-sm dark:bg-[#1e293b]">
                          {getInitials(formData.full_name)}
                        </div>
                      </div>

                      <div className="flex flex-col justify-between gap-4 py-5 md:flex-row md:items-center">
                        <label className="text-sm font-medium text-slate-700 dark:text-[#cbd5e1] md:w-1/3">Full name</label>
                        <input
                          type="text"
                          value={formData.full_name}
                          onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                          className={`${inputClassName} md:w-2/3`}
                        />
                      </div>

                      <div className="flex flex-col justify-between gap-4 py-5 md:flex-row md:items-center">
                        <label className="text-sm font-medium text-slate-700 dark:text-[#cbd5e1] md:w-1/3">Tel. No.</label>
                        <div className="w-full md:w-2/3">
                          <PhilippinePhoneInput value={formData.phone} onChange={(v) => setFormData({ ...formData, phone: v })} />
                        </div>
                      </div>

                      <div className="flex flex-col justify-between gap-4 py-5 md:flex-row md:items-center">
                        <label className="text-sm font-medium text-slate-700 dark:text-[#cbd5e1] md:w-1/3">Date of Birth</label>
                        <input
                          type="date"
                          value={formData.dob}
                          onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                          className={`${inputClassName} md:w-2/3`}
                        />
                      </div>

                      <div className="flex flex-col justify-between gap-4 py-5 md:flex-row md:items-center">
                        <label className="text-sm font-medium text-slate-700 dark:text-[#cbd5e1] md:w-1/3">Sex</label>
                        <div className="w-full md:w-2/3">
                          <SexOption value={formData.gender} onChange={(v) => setFormData({ ...formData, gender: v })} options={['Male', 'Female']} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'institution' && (
                  <div className={`animate-in fade-in duration-200 ${successMessage ? 'mt-12' : ''}`}>
                    <h2 className="mb-6 text-xl font-bold text-slate-900 dark:text-[#f8fafc]">School Settings</h2>

                    <div className="divide-y divide-slate-100 dark:divide-white/[0.06]">
                      <div className="flex flex-col justify-between gap-4 py-5 md:flex-row md:items-center">
                        <div className="md:w-1/3">
                          <label className="text-sm font-medium text-slate-700 dark:text-[#cbd5e1]">Assigned Institution</label>
                          <p className="mt-1 text-[11px] text-slate-500 dark:text-[#94a3b8]">Select the school you are administering.</p>
                        </div>
                        <div className="w-full md:w-2/3">
                          <SchoolList
                            value={institution}
                            onChange={(name, institutionName) => {
                              setInstitution(name);
                              setFormData({ ...formData, institution_id: institutionName });
                            }}
                            placeholder="e.g. Western Institute of Technology"
                            inputClassName={inputClassName}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'security' && (
                  <div className="animate-in fade-in duration-200">
                    <h2 className="mb-6 text-xl font-bold text-slate-900 dark:text-[#f8fafc]">Security & Privacy</h2>
                    <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-slate-200 text-sm text-slate-400 dark:border-white/[0.1] dark:text-[#64748b]">
                      Security settings coming soon.
                    </div>
                  </div>
                )}

                {activeTab === 'about' && (
                  <div className="animate-in fade-in duration-200">
                    <h2 className="mb-6 text-xl font-bold text-slate-900 dark:text-[#f8fafc]">About</h2>
                    <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-slate-200 text-sm text-slate-400 dark:border-white/[0.1] dark:text-[#64748b]">
                      App information coming soon.
                    </div>
                  </div>
                )}
              </div>

              {(activeTab === 'account' || activeTab === 'institution') && (
                <div className="sticky bottom-0 flex shrink-0 justify-end border-t border-slate-100 bg-white p-5 dark:border-white/[0.06] dark:bg-[#0b1220]">
                  <button
                    type="submit"
                    disabled={updateMutation.isPending}
                    className="flex h-10 items-center rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                  >
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
