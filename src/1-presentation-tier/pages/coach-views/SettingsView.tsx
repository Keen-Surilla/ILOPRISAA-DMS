import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  User,
  Shield,
  Info,
  Search,
  X,
  ChevronDown,
  Shuffle,
  CheckCircle2,
  Mail,
  Landmark,
  Bell,
  Plus,
  AlertCircle,
} from 'lucide-react';
import { useAuthStore } from '../../../2-application-tier/stores/authStore';
import { useTeamRoster } from '../../../2-application-tier/hooks/useTeamRoster';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProfile, updateProfile } from '../../../3-data-tier/services/profileService';
import { supabase } from '../../../3-data-tier/config/SupabaseClient';
import { PhilippinePhoneInput } from '../../components/ui/PhilippinePhoneInput';
import { SexOption } from '../../components/ui/SexOption';
import { ILOPRISAA_SCHOOLS } from '../../../3-data-tier/constant/schools';
import { ILOPRISAA_SPORTS } from '../../../3-data-tier/constant/sports';
import { SchoolList } from '../../components/ui/SchoolList';

const cn = (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(' ');

// DiceBear — free, MIT-licensed, no API key. Seed drives the glyph; shuffling
// just swaps to a new random seed. Swap the style segment for a different look:
// https://www.dicebear.com/styles
const buildAvatarUrl = (seed: string) =>
  `https://api.dicebear.com/9.x/shapes/svg?seed=${encodeURIComponent(seed)}&backgroundType=gradientLinear&backgroundColor=0f766e,0891b2,0e7490`;

const generateRandomSeed = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

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

// Small inline toggle switch — teal/emerald "on" state.
function ToggleSwitch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/40',
        checked ? 'bg-emerald-500 dark:bg-[#10b981]' : 'bg-slate-200 dark:bg-white/[0.12]'
      )}
    >
      <span
        className={cn(
          'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
          checked ? 'translate-x-6' : 'translate-x-1'
        )}
      />
    </button>
  );
}

// Bottom-right toast, portaled to document.body so it always sits above
// everything at the viewport level instead of being clipped/positioned
// relative to the modal.
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

interface SportOption {
  id: string;
  name: string;
}

// Custom dropdown for sport selection — native <select> popups render with
// the OS's own white chrome and can't be dark-mode styled, which is why the
// sport picker looked broken. This one is fully ours to theme.
function SportDropdown({
  value,
  onChange,
  groups,
  placeholder,
}: {
  value: string;
  onChange: (id: string) => void;
  groups: { label?: string; items: SportOption[] }[];
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selected = groups.flatMap(g => g.items).find(s => s.id === value);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-2 pl-4 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-gradient-to-b from-white to-slate-50 dark:from-white/[0.07] dark:to-white/[0.02] text-sm text-slate-800 dark:text-[#f8fafc] shadow-sm hover:border-sky-300 dark:hover:border-[#7dd3fc]/40 focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:focus:ring-[#7dd3fc]/20 transition-all"
      >
        <span className={selected ? 'font-medium' : 'text-slate-400 dark:text-[#64748b]'}>
          {selected ? selected.name : placeholder || 'Select…'}
        </span>
        <ChevronDown className={cn('h-4 w-4 text-slate-400 dark:text-[#7dd3fc] transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute z-30 mt-2 w-full max-h-64 overflow-auto rounded-xl border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-[#0f172a] shadow-xl shadow-black/10 dark:shadow-black/50 p-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
          {groups.map((group, gi) => (
            <div key={gi}>
              {group.label && (
                <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-[#64748b]">
                  {group.label}
                </div>
              )}
              {group.items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onChange(item.id);
                    setOpen(false);
                  }}
                  className={cn(
                    'w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-sm transition-colors text-left',
                    value === item.id
                      ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold'
                      : 'text-slate-700 dark:text-[#cbd5e1] hover:bg-slate-50 dark:hover:bg-white/[0.06]'
                  )}
                >
                  {item.name}
                  {value === item.id && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                </button>
              ))}
            </div>
          ))}
          {groups.every(g => g.items.length === 0) && (
            <div className="px-2.5 py-3 text-sm text-slate-400 dark:text-[#64748b] text-center">No options left</div>
          )}
        </div>
      )}
    </div>
  );
}

// Row layout used throughout: label on the left, control on the right.
function FieldRow({
  label,
  hint,
  tag,
  children,
  align = 'center',
  border = true,
}: {
  label: string;
  hint?: string;
  tag?: React.ReactNode;
  children: React.ReactNode;
  align?: 'center' | 'start';
  border?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex flex-col md:flex-row gap-3 md:gap-4 py-5',
        align === 'start' ? 'md:items-start' : 'md:items-center',
        border && 'border-b border-slate-100 dark:border-white/[0.06]'
      )}
    >
      <div className="md:w-1/3 shrink-0">
        <label className="text-sm font-medium text-slate-700 dark:text-[#cbd5e1]">{label}</label>
        {hint && <p className="text-[11px] text-slate-500 dark:text-[#94a3b8] mt-1">{hint}</p>}
      </div>
      <div className="w-full md:w-2/3">
        {tag && <div className="flex justify-end mb-1.5">{tag}</div>}
        {children}
      </div>
    </div>
  );
}

export default function SettingsView({ onClose }: { onClose: () => void }) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('account');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [institution, setInstitution] = useState('');
  const [addingDiscipline, setAddingDiscipline] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['coachProfile', user?.id],
    queryFn: () => getProfile(user?.id || ''),
    enabled: !!user?.id
  });

  // Reused for the "Institutional Delegation Scope" footer count.
  const roster = useTeamRoster(user?.id);
  const athleteCount = (roster as any)?.athletes?.length ?? 0;

  const [formData, setFormData] = useState({
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
        team_motto: profile.team_motto || '',
        avatar_seed: profile.avatar_seed || user?.id || 'coach',
        secondary_disciplines: profile.secondary_disciplines || [],
        notify_sms_missing_document: profile.notify_sms_missing_document ?? true,
        notify_committee_status: profile.notify_committee_status ?? true,
        notify_roster_freeze: profile.notify_roster_freeze ?? true,
      });

      if (profile.institution_id) {
        const matchedSchool = ILOPRISAA_SCHOOLS.find(s => s.id === profile.institution_id);
        setInstitution(matchedSchool ? matchedSchool.name : profile.institution_id);
      }
    }
  }, [profile, user?.id]);

  const selectedSchool = useMemo(
    () => ILOPRISAA_SCHOOLS.find((s: any) => s.id === formData.institution_id),
    [formData.institution_id]
  );

  const updateMutation = useMutation({
    mutationFn: (updatedData: any) => updateProfile(user?.id || '', updatedData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coachProfile', user?.id] });
      setToast({ type: 'success', message: 'All changes saved automatically' });
      setTimeout(() => setToast(null), 3000);
    },
    onError: (error: any) => {
      console.error('Profile update failed:', error);
      setToast({ type: 'error', message: error?.message || 'Failed to save changes' });
      setTimeout(() => setToast(null), 5000);
    }
  });

  // --- Autosave, debounced. Team fields now live on this same page, so
  // everything autosaves together — there's no more separate Save button. ---
  const isFirstRun = useRef(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isLoading) return;
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const payloadToSave = { ...formData, dob: formData.dob === '' ? null : formData.dob };
      updateMutation.mutate(payloadToSave);
    }, 900);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData, isLoading]);

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

  const formatSportTeamName = (rawSport: string) => {
    if (!rawSport) return 'No Sport Selected';
    const cleanSport = rawSport.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    return `${cleanSport} Team`;
  };

  const isGoogleVerified = (user as any)?.app_metadata?.provider === 'google';

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

      <div className="bg-white dark:bg-[#0b1220] rounded-2xl shadow-2xl dark:shadow-black/50 border border-slate-200 dark:border-white/[0.06] flex overflow-hidden h-full max-h-[750px] w-full max-w-5xl relative animate-in zoom-in-95 duration-200">

        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 p-2 bg-slate-100 dark:bg-white/[0.06] text-slate-500 dark:text-[#94a3b8] hover:bg-slate-200 dark:hover:bg-white/[0.1] hover:text-slate-700 dark:hover:text-[#f8fafc] rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* LEFT SIDEBAR */}
        <div className="w-64 bg-[#f8f9fa] dark:bg-[#0c1324] border-r border-slate-200 dark:border-white/[0.06] p-4 flex flex-col shrink-0">
          <div className="relative mb-6 mt-2">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 dark:text-[#64748b]" />
            <input
              type="text"
              placeholder="Search"
              className="w-full pl-9 pr-4 py-2 bg-slate-200/60 dark:bg-white/[0.05] border-transparent rounded-lg text-sm text-slate-700 dark:text-[#f8fafc] placeholder-slate-500 dark:placeholder-[#64748b] focus:bg-white dark:focus:bg-white/[0.08] focus:border-slate-300 dark:focus:border-white/[0.15] focus:ring-2 focus:ring-slate-100 dark:focus:ring-white/[0.06] outline-none transition-all"
            />
          </div>

          <div className="text-xs font-semibold text-slate-500 dark:text-[#64748b] mb-3 px-2">Settings</div>

          <nav className="space-y-1">
            <button onClick={() => setActiveTab('account')} className={cn('w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors', activeTab === 'account' ? 'bg-[#e9ecef] dark:bg-white/[0.08] text-slate-900 dark:text-[#f8fafc]' : 'text-slate-600 dark:text-[#94a3b8] hover:bg-slate-200/50 dark:hover:bg-white/[0.04]')}>
              <User className="w-4 h-4" /> Profile
            </button>
            <button onClick={() => setActiveTab('security')} className={cn('w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors', activeTab === 'security' ? 'bg-[#e9ecef] dark:bg-white/[0.08] text-slate-900 dark:text-[#f8fafc]' : 'text-slate-600 dark:text-[#94a3b8] hover:bg-slate-200/50 dark:hover:bg-white/[0.04]')}>
              <Shield className="w-4 h-4" /> Security
            </button>
            <button onClick={() => setActiveTab('about')} className={cn('w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors', activeTab === 'about' ? 'bg-[#e9ecef] dark:bg-white/[0.08] text-slate-900 dark:text-[#f8fafc]' : 'text-slate-600 dark:text-[#94a3b8] hover:bg-slate-200/50 dark:hover:bg-white/[0.04]')}>
              <Info className="w-4 h-4" /> About
            </button>
          </nav>
        </div>

        {/* RIGHT CONTENT AREA */}
        <div className="flex-1 bg-white dark:bg-[#0b1220] overflow-hidden flex flex-col relative">

          {isLoading ? (
            <div className="p-8 space-y-6 animate-pulse w-full max-w-3xl">
              <div className="h-12 bg-slate-100 dark:bg-white/[0.06] rounded-lg w-full"></div>
              <div className="h-12 bg-slate-100 dark:bg-white/[0.06] rounded-lg w-full"></div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col h-full overflow-y-auto">

              <div className="p-8 max-w-3xl flex-1 w-full relative">

                {/* --- PROFILE TAB (Team fields merged in) --- */}
                {activeTab === 'account' && (
                  <div className="animate-in fade-in duration-200">

                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h2 className="text-xl font-bold text-slate-900 dark:text-[#f8fafc]">Profile Details</h2>
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-300">
                        <CheckCircle2 className="w-3 h-3" /> Institutional Verified
                      </span>
                    </div>
                    <p className="text-[13px] text-slate-500 dark:text-[#94a3b8] mb-6">
                      {selectedSchool?.name
                        ? `Official registered profile for ${selectedSchool.name} athletics delegation.`
                        : 'Official registered coach profile for your athletics delegation.'}
                    </p>

                    <div>

                      {/* Avatar — hover to shuffle, corner × to reset */}
                      <FieldRow label="Avatar">
                        <div className="relative group w-14 h-14">
                          <img
                            src={buildAvatarUrl(formData.avatar_seed || user?.id || 'coach')}
                            alt="Coach avatar"
                            className="w-14 h-14 rounded-full border border-slate-200 dark:border-white/[0.08] shadow-sm bg-slate-100 dark:bg-white/[0.04] object-cover"
                          />
                          <button
                            type="button"
                            onClick={handleShuffleAvatar}
                            title="Shuffle avatar"
                            className="absolute inset-0 rounded-full flex items-center justify-center bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Shuffle className="w-5 h-5 text-white" />
                          </button>
                          <button
                            type="button"
                            onClick={handleResetAvatar}
                            title="Reset to default"
                            className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/[0.15] shadow flex items-center justify-center text-slate-500 dark:text-[#94a3b8] opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500 hover:border-red-200 dark:hover:border-red-500/30"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </FieldRow>

                      {/* Full name */}
                      <FieldRow label="Full name" tag={<span className="text-[11px] font-semibold text-sky-600 dark:text-[#7dd3fc]">Official DepEd / CHED Name</span>}>
                        <div className="relative">
                          <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-[#64748b]" />
                          <input
                            type="text"
                            value={formData.full_name}
                            onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                            className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.1] rounded-xl text-sm text-slate-900 dark:text-[#f8fafc] shadow-sm outline-none focus:border-sky-400 dark:focus:border-[#7dd3fc]/40 focus:ring-2 focus:ring-sky-500/10 dark:focus:ring-[#7dd3fc]/10 transition-colors"
                          />
                        </div>
                      </FieldRow>

                      {/* Tel. No. */}
                      <FieldRow label="Tel. No." hint="Used for urgent screening committee callbacks & SMS alerts.">
                        <PhilippinePhoneInput value={formData.phone} onChange={(v) => setFormData({ ...formData, phone: v })} />
                      </FieldRow>

                      {/* Date of Birth */}
                      <FieldRow label="Date of Birth" hint="Age confirmation for collegiate coaching regulatory brackets.">
                        <input
                          type="date"
                          value={formData.dob}
                          onChange={e => setFormData({ ...formData, dob: e.target.value })}
                          className="w-full px-3 py-2.5 bg-white dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.1] rounded-xl text-sm text-slate-900 dark:text-[#f8fafc] shadow-sm outline-none focus:border-sky-400 dark:focus:border-[#7dd3fc]/40 focus:ring-2 focus:ring-sky-500/10 dark:focus:ring-[#7dd3fc]/10 transition-colors [color-scheme:light] dark:[color-scheme:dark]"
                        />
                      </FieldRow>

                      {/* Sex */}
                      <FieldRow label="Sex">
                        <SexOption value={formData.gender} onChange={(v) => setFormData({ ...formData, gender: v })} options={['Male', 'Female']} />
                      </FieldRow>

                      {/* Institution (merged from Team tab) */}
                      <FieldRow label="Institution">
                        <SchoolList
                          value={institution}
                          onChange={(name, id) => {
                            setInstitution(name);
                            setFormData({ ...formData, institution_id: id });
                          }}
                          placeholder="e.g. Western Institute of Technology"
                          inputClassName="w-full px-3 py-2.5 bg-white dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.1] rounded-xl text-sm text-slate-900 dark:text-[#f8fafc] shadow-sm outline-none focus:border-sky-400 dark:focus:border-[#7dd3fc]/40 focus:ring-2 focus:ring-sky-500/10 dark:focus:ring-[#7dd3fc]/10 transition-colors"
                        />
                      </FieldRow>

                      {/* Primary Sport + Secondary Discipline */}
                      <FieldRow
                        label="Primary Sport"
                        align="start"
                        tag={<span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">Official Division Allocation</span>}
                      >
                        <SportDropdown
                          value={formData.sport}
                          onChange={(id) => setFormData({ ...formData, sport: id })}
                          groups={sportGroups}
                          placeholder="Select your sport"
                        />

                        <div className="flex items-center gap-2 flex-wrap mt-3">
                          <span className="text-[11px] font-medium text-slate-500 dark:text-[#94a3b8] mr-1">Secondary Discipline:</span>
                          {formData.secondary_disciplines.map((id) => (
                            <span
                              key={id}
                              className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 dark:border-white/[0.1] bg-slate-100 dark:bg-white/[0.06] px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:text-[#cbd5e1]"
                            >
                              {getSportName(id)}
                              <button type="button" onClick={() => handleRemoveDiscipline(id)} className="text-slate-400 dark:text-[#64748b] hover:text-slate-600 dark:hover:text-[#f8fafc]">
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}

                          {addingDiscipline ? (
                            <div className="min-w-[180px]">
                              <SportDropdown
                                value=""
                                onChange={handleAddDiscipline}
                                groups={remainingSportGroups}
                                placeholder="Choose sport…"
                              />
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setAddingDiscipline(true)}
                              className="inline-flex items-center gap-1 rounded-md border border-dashed border-slate-300 dark:border-white/[0.15] px-2.5 py-1 text-[11px] font-semibold text-slate-500 dark:text-[#94a3b8] hover:border-slate-400 dark:hover:border-white/[0.3] hover:text-slate-700 dark:hover:text-[#f8fafc] transition-colors"
                            >
                              <Plus className="w-3 h-3" /> Add Discipline
                            </button>
                          )}
                        </div>
                      </FieldRow>

                      {/* Sport Classification (derived, read-only) */}
                      <FieldRow label="Sport Classification" hint="Based on your Primary Sport setting.">
                        <span className="inline-block px-3 py-1.5 bg-blue-50 dark:bg-[#adc6ff]/10 text-blue-700 dark:text-[#adc6ff] font-bold text-sm rounded-lg border border-blue-200/60 dark:border-[#adc6ff]/20">
                          {formatSportTeamName(formData.sport)}
                        </span>
                      </FieldRow>

                      {/* Team Motto (merged from Team tab) */}
                      <FieldRow label="Team Motto / Subtitle" align="start" hint="Appears under your team name in the dashboard.">
                        <textarea
                          value={formData.team_motto}
                          onChange={e => setFormData({ ...formData, team_motto: e.target.value })}
                          placeholder="e.g. We swim together, we win together"
                          rows={3}
                          className="w-full px-3 py-2.5 bg-white dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.1] rounded-xl text-sm text-slate-900 dark:text-[#f8fafc] shadow-sm outline-none focus:border-sky-400 dark:focus:border-[#7dd3fc]/40 focus:ring-2 focus:ring-sky-500/10 dark:focus:ring-[#7dd3fc]/10 transition-colors resize-none"
                        />
                      </FieldRow>

                      {/* Institutional Email */}
                      <FieldRow label="Institutional Email" border={false}>
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <Mail className="w-4 h-4 text-slate-400 dark:text-[#64748b] shrink-0" />
                            <span className="text-sm text-slate-700 dark:text-[#f8fafc] truncate">{user?.email || 'No institutional email on file'}</span>
                          </div>
                          {isGoogleVerified && (
                            <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-300">
                              <CheckCircle2 className="w-3 h-3" /> Google Verified
                            </span>
                          )}
                        </div>
                      </FieldRow>
                    </div>

                    {/* Screening Notifications */}
                    <div className="mt-8 pt-6 border-t border-slate-200 dark:border-white/[0.06]">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-[13px] font-bold uppercase tracking-wide text-sky-600 dark:text-[#7dd3fc]">
                          Screening Notifications &amp; Escalation Toggles
                        </h3>
                        <Bell className="w-4 h-4 text-sky-500 dark:text-[#7dd3fc]" />
                      </div>
                      <p className="text-[12px] text-slate-500 dark:text-[#94a3b8] mb-4">
                        Control how the ILOPRISAA DMS delivers urgent document rejection and freeze notices.
                      </p>

                      <div className="divide-y divide-slate-100 dark:divide-white/[0.06]">
                        <div className="flex items-center justify-between gap-4 py-4">
                          <div className="min-w-0">
                            <p className="text-[13px] font-semibold text-sky-700 dark:text-[#93c5fd]">Immediate SMS on Missing Athlete Document</p>
                            <p className="text-[11px] text-slate-500 dark:text-[#94a3b8] mt-0.5">
                              Receive instantaneous SMS notification when the Screening Committee flags an athlete credential.
                            </p>
                          </div>
                          <ToggleSwitch
                            checked={formData.notify_sms_missing_document}
                            onChange={(v) => setFormData({ ...formData, notify_sms_missing_document: v })}
                            label="Immediate SMS on Missing Athlete Document"
                          />
                        </div>

                        <div className="flex items-center justify-between gap-4 py-4">
                          <div className="min-w-0">
                            <p className="text-[13px] font-semibold text-sky-700 dark:text-[#93c5fd]">Committee Review Status Alerts</p>
                            <p className="text-[11px] text-slate-500 dark:text-[#94a3b8] mt-0.5">
                              Dispatches email summaries whenever an athlete dossier is marked Cleared or Rejected.
                            </p>
                          </div>
                          <ToggleSwitch
                            checked={formData.notify_committee_status}
                            onChange={(v) => setFormData({ ...formData, notify_committee_status: v })}
                            label="Committee Review Status Alerts"
                          />
                        </div>

                        <div className="flex items-center justify-between gap-4 py-4">
                          <div className="min-w-0">
                            <p className="text-[13px] font-semibold text-sky-700 dark:text-[#93c5fd]">Roster Freeze Countdowns</p>
                            <p className="text-[11px] text-slate-500 dark:text-[#94a3b8] mt-0.5">
                              Alerts sent at 72h, 48h, and 24h prior to irreversible database state locking.
                            </p>
                          </div>
                          <ToggleSwitch
                            checked={formData.notify_roster_freeze}
                            onChange={(v) => setFormData({ ...formData, notify_roster_freeze: v })}
                            label="Roster Freeze Countdowns"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Institutional Delegation Scope */}
                    <div className="mt-6 flex items-center justify-between gap-4 rounded-xl border border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.03] p-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center shrink-0">
                          <Landmark className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                            Institutional Delegation Scope
                          </p>
                          <p className="text-[13px] font-bold text-slate-900 dark:text-[#f8fafc] truncate">
                            {selectedSchool?.name || institution || 'No institution on file'}
                            {(selectedSchool as any)?.nickname ? ` · ${(selectedSchool as any).nickname}` : ''}
                          </p>
                          {(selectedSchool as any)?.department && (
                            <p className="text-[11px] text-slate-500 dark:text-[#94a3b8] truncate">
                              {(selectedSchool as any).department}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className="shrink-0 rounded-full border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] px-3 py-1.5 text-[11px] font-bold text-slate-600 dark:text-[#cbd5e1]">
                        Scope: {athleteCount} Varsity Athlete{athleteCount === 1 ? '' : 's'}
                      </span>
                    </div>
                  </div>
                )}

                {/* --- SECURITY & ABOUT TABS --- */}
                {activeTab === 'security' && (
                  <div className="animate-in fade-in duration-200">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-[#f8fafc] mb-8">Security &amp; Privacy</h2>
                    <div className="flex items-center justify-center h-64 border-2 border-dashed border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-400 dark:text-[#64748b] text-sm">Security Settings coming soon...</div>
                  </div>
                )}

                {activeTab === 'about' && (
                  <div className="animate-in fade-in duration-200">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-[#f8fafc] mb-8">About</h2>
                    <div className="flex items-center justify-center h-64 border-2 border-dashed border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-400 dark:text-[#64748b] text-sm">App Information coming soon...</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <Toast toast={toast} />
    </div>
  );
}