import React from 'react';
import { User, Shuffle, X, CheckCircle2, Mail, Plus, Bell, Monitor, Sun, Moon } from 'lucide-react';
import { PhilippinePhoneInput } from '../../components/ui/PhilippinePhoneInput';
import { SexOption } from '../../components/ui/SexOption';
import { SchoolList } from '../../components/ui/SchoolList';
import { PremiumDateTimePicker } from '../../components/ui/PremiumDateTimePicker';
import {
  cn,
  buildAvatarUrl,
  sharedInputBase,
  FieldRow,
  ToggleSwitch,
  SportDropdown,
 type  SettingsFormData,
 type SportOption,
} from './sharedui';

interface ProfileTabProps {
  formData: SettingsFormData;
  setFormData: React.Dispatch<React.SetStateAction<SettingsFormData>>;
  user: any;
  selectedSchool: { name: string } | undefined;
  institution: string;
  setInstitution: (name: string) => void;
  handleTypingFocus: () => void;
  handleTypingBlur: () => void;
  handleShuffleAvatar: () => void;
  handleResetAvatar: () => void;
  sportGroups: { label?: string; items: SportOption[] }[];
  remainingSportGroups: { label?: string; items: SportOption[] }[];
  addingDiscipline: boolean;
  setAddingDiscipline: (v: boolean) => void;
  handleAddDiscipline: (sportId: string) => void;
  handleRemoveDiscipline: (sportId: string) => void;
  getSportName: (id: string) => string;
  isGoogleVerified: boolean;
  appTheme: 'system' | 'light' | 'dark';
  handleThemeChange: (mode: 'system' | 'light' | 'dark') => void;
}

export default function ProfileTab({
  formData,
  setFormData,
  user,
  selectedSchool,
  institution,
  setInstitution,
  handleTypingFocus,
  handleTypingBlur,
  handleShuffleAvatar,
  handleResetAvatar,
  sportGroups,
  remainingSportGroups,
  addingDiscipline,
  setAddingDiscipline,
  handleAddDiscipline,
  handleRemoveDiscipline,
  getSportName,
  isGoogleVerified,
  appTheme,
  handleThemeChange,
}: ProfileTabProps) {
  return (
    <div className="animate-in fade-in duration-200">
      <div className="flex items-center gap-2 flex-wrap mb-1">
        <h2 className="text-xl font-bold text-slate-900 dark:text-[#f8fafc]">Profile</h2>
      </div>
      <p className="text-[13px] text-slate-500 dark:text-[#94a3b8] mb-6">
        {selectedSchool?.name
          ? `Official registered profile for ${selectedSchool.name} athletics delegation.`
          : 'Official registered coach profile for your athletics delegation.'}
      </p>

      <div>
        {/* Avatar */}
        <FieldRow label="Avatar">
          <div className="flex justify-end">
            <div className="relative group w-11 h-11">
              <img
                src={buildAvatarUrl(formData.avatar_seed || user?.id || 'coach')}
                alt="Coach avatar"
                className="w-11 h-11 rounded-full border border-slate-200 dark:border-white/[0.08] shadow-sm bg-slate-100 dark:bg-white/[0.04] object-cover"
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
          </div>
        </FieldRow>

        {/* Full name */}
        <FieldRow label="Full name">
          <div className="relative">
            <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-[#64748b]" />
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              onFocus={handleTypingFocus}
              onBlur={handleTypingBlur}
              className={cn(sharedInputBase, 'pl-9')}
            />
          </div>
        </FieldRow>

        {/* Tel. No. */}
        <FieldRow label="Tel. No.">
          <div className="flex justify-end">
            <div className="w-full">
              <PhilippinePhoneInput value={formData.phone} onChange={(v) => setFormData({ ...formData, phone: v })} />
            </div>
          </div>
        </FieldRow>

        {/* Date of Birth using PremiumDateTimePicker */}
        <FieldRow label="Date of Birth">
          <div className="flex justify-end">
            <div className="w-full">
              <PremiumDateTimePicker
                label="Date"
                value={formData.dob || null}
                onChange={(v) => setFormData({ ...formData, dob: v.split('T')[0] })}
                showTime={false}
                placeholder="dd/mm/yyyy"
                minYear={1900}
                maxYear={new Date().getFullYear()}
                width="full"
                height="h-11"
              />
            </div>
          </div>
        </FieldRow>

        {/* Sex */}
        <FieldRow label="Sex">
          <div className="flex justify-end">
            <div className="w-full">
              <SexOption value={formData.gender} onChange={(v) => setFormData({ ...formData, gender: v })} options={['Male', 'Female']} />
            </div>
          </div>
        </FieldRow>

        {/* Institution */}
        <FieldRow label="Institution">
          <SchoolList
            value={institution}
            onChange={(name, institutionName) => {
              setInstitution(name);
              setFormData({ ...formData, institution_id: institutionName });
            }}
            placeholder="e.g. Western Institute of Technology"
            inputClassName={cn(sharedInputBase, 'pl-3')}
          />
        </FieldRow>

        {/* Primary Sport + Secondary Discipline */}
        <FieldRow label="Primary Sport" align="start">
          <SportDropdown
            value={formData.sport}
            onChange={(id) => setFormData({ ...formData, sport: id })}
            groups={sportGroups}
            placeholder="Select your sport"
          />

          <div className="flex items-center justify-end gap-2 flex-wrap mt-3">
            <span className="text-[11px] font-medium text-slate-500 dark:text-[#94a3b8] mr-1">Secondary Sport:</span>
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
                <SportDropdown value="" onChange={handleAddDiscipline} groups={remainingSportGroups} placeholder="Choose sport…" />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setAddingDiscipline(true)}
                className="inline-flex items-center gap-1 rounded-md border border-dashed border-slate-300 dark:border-white/[0.15] px-2.5 py-1 text-[11px] font-semibold text-slate-500 dark:text-[#94a3b8] hover:border-blue-600 dark:hover:border-[#7dd3fc]/60 hover:text-blue-600 dark:hover:text-[#7dd3fc] transition-colors"
              >
                <Plus className="w-3 h-3" /> Add Secondary
              </button>
            )}
          </div>
        </FieldRow>

        {/* Team Motto */}
        <FieldRow label="Team Motto / Subtitle" align="start">
          <textarea
            value={formData.team_motto}
            onChange={(e) => setFormData({ ...formData, team_motto: e.target.value })}
            onFocus={handleTypingFocus}
            onBlur={handleTypingBlur}
            placeholder="e.g. We swim together, we win together"
            rows={3}
            className={cn(sharedInputBase, 'pl-3 resize-none')}
          />
        </FieldRow>

        {/* Institutional Email */}
        <FieldRow label="Institutional Email" border={true}>
          <div className="flex items-center justify-end gap-3">
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

        {/* APPEARANCE SEGMENTED CONTROL */}
        <FieldRow label="Appearance" border={false}>
          <div className="flex justify-end">
            <div className="flex items-center p-1 bg-slate-100 dark:bg-[#0c1324] rounded-xl border border-slate-200 dark:border-white/[0.06] w-fit">
              {(['system', 'light', 'dark'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => handleThemeChange(mode)}
                  title={mode.charAt(0).toUpperCase() + mode.slice(1)}
                  className={cn(
                    'w-10 h-8 flex items-center justify-center rounded-lg transition-all duration-200 focus:outline-none',
                    appTheme === mode
                      ? 'bg-white dark:bg-[#1e293b] text-blue-600 dark:text-[#adc6ff] shadow-sm ring-1 ring-slate-200 dark:ring-white/[0.06]'
                      : 'text-slate-500 dark:text-[#94a3b8] hover:text-slate-900 dark:hover:text-[#f8fafc]'
                  )}
                >
                  {mode === 'system' && <Monitor className="w-4 h-4" />}
                  {mode === 'light' && <Sun className="w-4 h-4" />}
                  {mode === 'dark' && <Moon className="w-4 h-4" />}
                </button>
              ))}
            </div>
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
    </div>
  );
}
