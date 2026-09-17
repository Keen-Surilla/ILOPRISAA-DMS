import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { User, Shield, Info, Search, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../../../2-application-tier/stores/authStore';
import { useThemeStore } from '../../../2-application-tier/stores/themeStore';
import { useTeamRoster } from '../../../2-application-tier/hooks/useTeamRoster';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProfile, updateProfile } from '../../../3-data-tier/services/profileService';
import { coachProfileApi } from '../../../3-data-tier/api/coachProfileApi';
import { supabase } from '../../../3-data-tier/config/SupabaseClient';
import { findSchool } from '../../../3-data-tier/constant/schools';
import { ILOPRISAA_SPORTS } from '../../../3-data-tier/constant/sports';
import { cn, generateRandomSeed, scrollbarStyles, type SettingsFormData } from '../../components/settings-tab/sharedui';
import ProfileTab from '../../components/settings-tab/ProfileTab';
import PrivacyTab from '../../components/settings-tab/PrivacyTab';
import AboutTab from '../../components/settings-tab/AboutTab';

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

// Bottom-right toast
function Toast({ toast }: { toast: { type: 'success' | 'error'; message: string } | null }) {
  if (typeof document === 'undefined') return null;
  const isError = toast?.type === 'error';
  return createPortal(
    <div className="fixed bottom-6 right-6 z-[300] pointer-events-none">
      {toast && (
        <div
          className={cn(
            'pointer-events-auto flex items-center gap-2 rounded-xl border px-4 py-3 shadow-xl shadow-black/10 dark:shadow-black/40 text-sm font-semibold animate-in fade-in slide-in-from-bottom-4 duration-200 max-w-sm',
            isError
              ? 'border-red-200 dark:border-red-500/20 bg-white dark:bg-[#0f172a] text-red-600 dark:text-red-400'
              : 'border-emerald-200 dark:border-emerald-500/20 bg-white dark:bg-[#0f172a] text-emerald-700 dark:text-emerald-300'
          )}
        >
          {isError ? (
            <AlertCircle className="w-4 h-4 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          )}
          {toast.message}
        </div>
      )}
    </div>,
    document.body
  );
}

export default function SettingsView({ onClose }: { onClose: () => void }) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { isDark, toggleTheme } = useThemeStore();
  const [appTheme, setAppTheme] = useState<'system' | 'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'system' | 'light' | 'dark') || 'system';
  });

  const handleThemeChange = (mode: 'system' | 'light' | 'dark') => {
    setAppTheme(mode);
    localStorage.setItem('theme', mode);

    const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const targetDark = mode === 'dark' || (mode === 'system' && isSystemDark);

    if (targetDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    if (targetDark !== isDark && typeof toggleTheme === 'function') {
      toggleTheme();
    }
  };

  const [activeTab, setActiveTab] = useState('account');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [saveCount, setSaveCount] = useState(0); // Tracks successful autosaves
  const [institution, setInstitution] = useState('');
  const [addingDiscipline, setAddingDiscipline] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['coachProfile', user?.id],
    queryFn: () => getProfile(user?.id || ''),
    enabled: !!user?.id
  });

  const {
    data: coachProfile,
    isLoading: isCoachProfileLoading,
  } = useQuery({
    queryKey: ['coachProfileDetails', user?.id],
    queryFn: () => coachProfileApi.getMyProfile(user?.id || ''),
    enabled: !!user?.id,
  });
  const isSettingsLoading = isLoading || isCoachProfileLoading;

  const roster = useTeamRoster(user?.id);
  const athleteCount = (roster as any)?.athletes?.length ?? 0;

  const [formData, setFormData] = useState<SettingsFormData>({
    full_name: '',
    phone: '',
    dob: '',
    gender: '',
    sport: '',
    institution_id: '',
    team_motto: '',
    avatar_seed: '',
    secondary_disciplines: [] as string[],
    notify_sms_missing_document: true,
    notify_committee_status: true,
    notify_roster_freeze: true,
    security_incident_alerts: true,
    aggregated_analytics: true,
    ocr_data_processing: true,
  });

  const initialLoadDone = useRef(false);
  const lastSavedData = useRef<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // True while the coach's cursor is inside a free-typing field (full name,
  // team motto). While true, the debounce effect below won't schedule any
  // save — the onBlur handlers on those fields save directly once the coach
  // leaves the field instead.
  const isTypingRef = useRef(false);

  const normalizeSecondaryDisciplines = (values: string[]) =>
    Array.from(
      new Set(
        values
          .map((value) => value.trim())
          .filter(Boolean)
      )
    );

  useEffect(() => {
    if (profile && !isCoachProfileLoading) {
      const initialData = {
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        dob: profile.dob || '',
        gender: profile.gender || '',
        sport: profile.sport || '',
        institution_id: profile.institution_id || '',
        team_motto: profile.team_motto || '',
        avatar_seed: (profile as any).avatar_seed || user?.id || 'coach',
        secondary_disciplines: coachProfile?.secondaryDisciplines ?? [],
        notify_sms_missing_document: (profile as any).notify_sms_missing_document ?? true,
        notify_committee_status: (profile as any).notify_committee_status ?? true,
        notify_roster_freeze: (profile as any).notify_roster_freeze ?? true,
        security_incident_alerts: (profile as any).security_incident_alerts ?? true,
        aggregated_analytics: (profile as any).aggregated_analytics ?? true,
        ocr_data_processing: (profile as any).ocr_data_processing ?? true,
      };

      setFormData(initialData);
      lastSavedData.current = JSON.stringify(initialData);
      initialLoadDone.current = true;

      if (profile.institution_id) {
        const matchedSchool = findSchool(profile.institution_id);
        setInstitution(matchedSchool ? matchedSchool.name : profile.institution_id);
      }
    }
  }, [profile, coachProfile, isCoachProfileLoading, user?.id]);

  const selectedSchool = useMemo(
    () => findSchool(formData.institution_id) ?? undefined,
    [formData.institution_id]
  );

  const updateMutation = useMutation({
    mutationFn: async ({
      profileData,
      secondaryDisciplines,
    }: {
      profileData: any;
      secondaryDisciplines: string[];
    }) => {
      const profileId = user?.id || '';
      await updateProfile(profileId, profileData);
      await coachProfileApi.saveSecondaryDisciplines(profileId, secondaryDisciplines);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coachProfile', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['coachProfileDetails', user?.id] });
      lastSavedData.current = JSON.stringify(formData);
      setSaveCount((prev) => {
        const nextCount = prev + 1;
        setToast({ type: 'success', message: `Saved (x${nextCount})` });
        return nextCount;
      });
      setTimeout(() => setToast(null), 8000);
    },
    onError: (error: any) => {
      console.error('Profile update failed:', error);
      setToast({ type: 'error', message: error?.message || 'Failed to save changes' });
      setTimeout(() => setToast(null), 5000);
    }
  });

  // The one place formData actually gets saved. Shared by both the
  // change-triggered debounce (for toggles/dropdowns/pickers, where there's
  // no "typing" state to wait out) and the onBlur handlers on free-typing
  // fields (full name, team motto).
  const saveNow = () => {
    const currentDataString = JSON.stringify(formData);
    if (currentDataString === lastSavedData.current) return;

    const {
      avatar_seed,
      secondary_disciplines,
      notify_sms_missing_document,
      notify_committee_status,
      notify_roster_freeze,
      security_incident_alerts,
      aggregated_analytics,
      ocr_data_processing,
      ...safeDatabaseFields
    } = formData;
    const normalizedSecondaryDisciplines = normalizeSecondaryDisciplines(
      formData.secondary_disciplines
    );

    const payloadToSave = {
      ...safeDatabaseFields,
      dob: safeDatabaseFields.dob === '' ? null : safeDatabaseFields.dob
    };

    updateMutation.mutate({
      profileData: payloadToSave,
      secondaryDisciplines: normalizedSecondaryDisciplines,
    });
  };

  // Called onFocus of a free-typing field: marks typing as in-progress and
  // cancels any save that was already scheduled from a prior field change,
  // so it can't fire mid-typing.
  const handleTypingFocus = () => {
    isTypingRef.current = true;
    if (debounceRef.current) clearTimeout(debounceRef.current);
  };

  // Called onBlur of a free-typing field: typing is done, save immediately.
  const handleTypingBlur = () => {
    isTypingRef.current = false;
    saveNow();
  };

  useEffect(() => {
    if (!initialLoadDone.current) return;
    // A text field is currently focused — wait for its onBlur to save
    // instead of debouncing here, so nothing saves mid-keystroke.
    if (isTypingRef.current) return;

    const currentDataString = JSON.stringify(formData);
    if (currentDataString === lastSavedData.current) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      saveNow();
    }, 900);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [formData]);

  const handleShuffleAvatar = () => {
    setFormData(prev => ({ ...prev, avatar_seed: generateRandomSeed() }));
  };

  const handleResetAvatar = () => {
    setFormData(prev => ({ ...prev, avatar_seed: user?.id || 'coach' }));
  };

  const handleAddDiscipline = (sportId: string) => {
    if (!sportId || formData.secondary_disciplines.includes(sportId) || sportId === formData.sport) return;
    setFormData(prev => ({ ...prev, secondary_disciplines: [...prev.secondary_disciplines, sportId] }));
    setAddingDiscipline(false);
  };

  const handleRemoveDiscipline = (sportId: string) => {
    setFormData(prev => ({
      ...prev,
      secondary_disciplines: prev.secondary_disciplines.filter(id => id !== sportId),
    }));
  };

  const getSportName = (id: string) => ILOPRISAA_SPORTS.find((s: any) => s.id === id)?.name || id;

  const isGoogleVerified = (user as any)?.app_metadata?.provider === 'google';

  // --- Privacy tab actions ---
  // Several of these (export, audit log view, consent tracker, deletion
  // request) point at views/services that already exist elsewhere in the
  // app per the spec this tab was built from — wire the TODOs below to
  // those instead of the placeholder toasts.

  const handleExportRoster = () => {
    // TODO: wire to the existing ExcelJS Form 01B generator
    setToast({ type: 'success', message: 'Preparing Form 01B export…' });
    setTimeout(() => setToast(null), 4000);
  };

  const handleViewAuditLogs = () => {
    // TODO: route to the document_audit_log view for this team
    setToast({ type: 'success', message: 'Opening audit logs…' });
    setTimeout(() => setToast(null), 4000);
  };

  const handleManageCredentials = () => {
    // Redirects back to TeamView/Screening Roster — close this modal so the
    // underlying roster view is visible.
    onClose();
  };

  const handleRequestDeletion = () => {
    if (
      !window.confirm(
        'This flags the school admin to permanently wipe your roster and associated document buckets once you leave the institution. Continue?'
      )
    )
      return;
    // TODO: wire to the actual deletion-request endpoint (email/flag to school admin)
    setToast({ type: 'success', message: 'Deletion request sent to your school admin.' });
    setTimeout(() => setToast(null), 5000);
  };

  const handleManageConsentWaivers = () => {
    // TODO: route to the athlete consent-waiver tracker
    setToast({ type: 'success', message: 'Opening consent waiver tracker…' });
    setTimeout(() => setToast(null), 4000);
  };

  const handleEmailDpo = () => {
    // TODO: replace with the real DPO inbox
    window.location.href = 'mailto:dpo@iloprisaa.org?subject=Data%20Privacy%20Inquiry';
  };

  const handleLogoutAllDevices = async () => {
    if (
      !window.confirm(
        'This signs you out on every device you are currently logged in on, including this one. Continue?'
      )
    )
      return;
    try {
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      if (error) throw error;
      setToast({ type: 'success', message: 'Signed out of all devices.' });
    } catch (error: any) {
      setToast({ type: 'error', message: error?.message || 'Failed to sign out of all devices.' });
    }
    setTimeout(() => setToast(null), 5000);
  };

  const sportGroups = [
    { label: 'Team Sports', items: ILOPRISAA_SPORTS.filter((s: any) => s.category === 'team') },
    { label: 'Individual Sports', items: ILOPRISAA_SPORTS.filter((s: any) => s.category === 'individual') },
  ];

  const remainingSportGroups = [
    {
      items: ILOPRISAA_SPORTS.filter(
        (s: any) => s.id !== formData.sport && !formData.secondary_disciplines.includes(s.id)
      ),
    },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm p-4 md:p-8 animate-in fade-in duration-200">
      <style>{scrollbarStyles}</style>

      <div className="bg-white dark:bg-[#0b1220] rounded-2xl shadow-2xl dark:shadow-black/50 border-slate-200 dark:border-white/[0.06] flex overflow-hidden h-full max-h-[750px] w-full max-w-5xl relative animate-in zoom-in-95 duration-200">

        {/* LEFT SIDEBAR */}
          <div className="w-55 bg-[#0b1120] dark:bg-[#0f172a] p-4 flex flex-col shrink-0">
            <div className="relative mb-6 mt-2">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 text-[#0b1120]" />
            <input
              type="text"
              placeholder="Search"
              className="w-full pl-9 pr-4 py-2 bg-white/[0.05] border-transparent rounded-lg text-sm text-[#f8fafc] placeholder-[#64748b] focus:bg-white/[0.08] focus:border-white/[0.15] focus:ring-2 focus:ring-white/[0.06] outline-none transition-all"
            />
          </div>

          <div className="text-xs font-semibold text-slate-500 dark:text-[#64748b] mb-3 px-2">Settings</div>

          <nav className="space-y-1">
            <button onClick={() => setActiveTab('account')} className={cn('w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors', activeTab === 'account' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 dark:text-[#94a3b8] hover:bg-white/[0.04]')}>
              <User className="w-4 h-4" /> Profile
            </button>
            <button onClick={() => setActiveTab('security')} className={cn('w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors', activeTab === 'security' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 dark:text-[#94a3b8] hover:bg-white/[0.04]')}>
              <Shield className="w-4 h-4" /> Security
            </button>
            <button onClick={() => setActiveTab('about')} className={cn('w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors', activeTab === 'about' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 dark:text-[#94a3b8] hover:bg-white/[0.04]')}>
              <Info className="w-4 h-4" /> About
            </button>
          </nav>
        </div>

        {/* RIGHT CONTENT AREA */}
        <div className="flex-1 bg-white dark:bg-[#0b1220] overflow-hidden flex flex-col relative">

          {/* DEDICATED HEADER FOR CLOSE BUTTON */}
          <div className="h-14 flex items-center justify-end px-4 shrink-0 border-b border-slate-100 dark:border-white/[0.06]">
            <button
              onClick={onClose}
              className="p-1.5 bg-slate-100 dark:bg-white/[0.06] text-slate-500 dark:text-[#94a3b8] hover:bg-slate-200 dark:hover:bg-white/[0.1] hover:text-slate-700 dark:hover:text-[#f8fafc] rounded-full transition-colors focus:outline-none"
              title="Close Settings"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {isSettingsLoading ? (
            <div className="p-8 space-y-6 animate-pulse w-full max-w-3xl">
              <div className="h-12 bg-slate-100 dark:bg-white/[0.06] rounded-lg w-full"></div>
              <div className="h-12 bg-slate-100 dark:bg-white/[0.06] rounded-lg w-full"></div>
            </div>
          ) : (
            <div className="settings-scrollbar flex-1 overflow-y-auto ">

              <div className="p-6 md:p-8 max-w-3xl w-full">

                {activeTab === 'account' && (
                  <ProfileTab
                    formData={formData}
                    setFormData={setFormData}
                    user={user}
                    selectedSchool={selectedSchool}
                    institution={institution}
                    setInstitution={setInstitution}
                    handleTypingFocus={handleTypingFocus}
                    handleTypingBlur={handleTypingBlur}
                    handleShuffleAvatar={handleShuffleAvatar}
                    handleResetAvatar={handleResetAvatar}
                    sportGroups={sportGroups}
                    remainingSportGroups={remainingSportGroups}
                    addingDiscipline={addingDiscipline}
                    setAddingDiscipline={setAddingDiscipline}
                    handleAddDiscipline={handleAddDiscipline}
                    handleRemoveDiscipline={handleRemoveDiscipline}
                    getSportName={getSportName}
                    isGoogleVerified={isGoogleVerified}
                    appTheme={appTheme}
                    handleThemeChange={handleThemeChange}
                  />
                )}

                {activeTab === 'security' && (
                  <PrivacyTab
                    formData={formData}
                    setFormData={setFormData}
                    handleExportRoster={handleExportRoster}
                    handleViewAuditLogs={handleViewAuditLogs}
                    handleManageCredentials={handleManageCredentials}
                    handleRequestDeletion={handleRequestDeletion}
                    handleManageConsentWaivers={handleManageConsentWaivers}
                    handleEmailDpo={handleEmailDpo}
                    handleLogoutAllDevices={handleLogoutAllDevices}
                  />
                )}

                {activeTab === 'about' && <AboutTab />}
              </div>
            </div>
          )}
        </div>
      </div>

      <Toast toast={toast} />
    </div>
  );
}
