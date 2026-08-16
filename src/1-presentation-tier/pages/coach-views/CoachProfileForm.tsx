// src/1-presentation-tier/pages/coach-views/CoachProfileForm.tsx
import { useState, useEffect } from 'react';
import { ChevronDown, Plus, Trash2, Save, CheckCircle2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../../2-application-tier/stores/authStore';
import { coachProfileApi } from '../../../3-data-tier/api/coachProfileApi';
import type { PrisaaCoachFormData, RelatedExperienceEntry } from '../../../3-data-tier/types/prisaa.types';
import { getProfile } from '../../../3-data-tier/services/profileService';
import { SexOption } from '../../components/ui/SexOption';
import { supabase } from '../../../3-data-tier/config/SupabaseClient';
import { uploadSignature, getSignatureUrl } from '../../../3-data-tier/api/signatureApi';
import { SignaturePad } from '../../components/ui/SignaturePad';
import { FormSkeleton } from '../../components/ui/SkeletonLoading';

const EMPTY_EXPERIENCE: RelatedExperienceEntry = {
  dateEntered: '', status: '', rankLevel: '', position: '', yearsInService: '',
};

const EMPTY_FORM: PrisaaCoachFormData = {
  eventSports: '', date: '',
  name: '', address: '', telNo: '', dateOfBirth: '', placeOfBirth: '',
  height: '', weight: '', sex: '', email: '', civilStatus: '', citizenship: '', religion: '',
  fathersName: '', fathersOccupation: '', mothersName: '', mothersOccupation: '',
  theirAddress: '', nameOfSpouse: '', spouseOccupation: '',
  educationalBackground: {
    elementary: { school: '', yearGraduated: '', degreeUnitsEarned: '' },
    secondary: { school: '', yearGraduated: '', degreeUnitsEarned: '' },
    tertiary: { school: '', yearGraduated: '', degreeUnitsEarned: '' },
    postGraduate: { school: '', yearGraduated: '', degreeUnitsEarned: '' },
  },
  relatedExperience: [{ ...EMPTY_EXPERIENCE }],
  dateAccomplished: '',
};

type SectionId = 'personal' | 'family' | 'education' | 'experience';

const inputClass = "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-600";
const labelClass = "block text-xs font-bold text-slate-600 mb-1";

function Field({ label, value, onChange, type = 'text', placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={inputClass} />
    </div>
  );
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={inputClass}>
        <option value="">Select…</option>
        {options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </div>
  );
}


function Accordion({ id, title, subtitle, isOpen, onToggle, children }: {
  id: SectionId; title: string; subtitle: string; isOpen: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-slate-50 hover:bg-slate-100 active:scale-[0.99] transition-[background-color,transform] text-left"
      >
        <div>
          <p className="text-sm font-bold text-slate-800">{title}</p>
          <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform motion-reduce:transition-none ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-in-out motion-reduce:transition-none ${
          isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden" inert={!isOpen}>
          <div className="p-4 space-y-4 bg-white">{children}</div>
        </div>
      </div>
    </div>
  );
}

export default function CoachProfileForm() {
  const { user } = useAuthStore();
  const profileId = user?.id || '';
  const queryClient = useQueryClient();

  const [form, setForm] = useState<PrisaaCoachFormData>(EMPTY_FORM);
  const [openSection, setOpenSection] = useState<SectionId | null>('personal');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showSaved, setShowSaved] = useState(false);

  const { data: baseProfile } = useQuery({
  queryKey: ['coachProfile', profileId],
  queryFn: () => getProfile(profileId),
  enabled: !!profileId,
});


const { data: profileResult, isLoading } = useQuery({
  queryKey: ['prisaaCoachProfile', profileId],
  queryFn: () => coachProfileApi.getMyProfile(profileId),
  enabled: !!profileId,
});

const existingPrisaaProfile = profileResult?.formData ?? null;
const signatureStoragePath = profileResult?.signatureStoragePath ?? null;

  function toggleSection(id: SectionId) {
  setOpenSection((prev) => (prev === id ? null : id));
}

useEffect(() => {
  if (existingPrisaaProfile) {
    setForm({
      ...EMPTY_FORM,
      ...existingPrisaaProfile,
      educationalBackground: {
        ...EMPTY_FORM.educationalBackground,
        ...(existingPrisaaProfile.educationalBackground || {}),
      },
      relatedExperience:
        existingPrisaaProfile.relatedExperience?.length
          ? existingPrisaaProfile.relatedExperience
          : EMPTY_FORM.relatedExperience,
    });
  } else if (baseProfile) {
    setForm((prev) => ({
      ...EMPTY_FORM,
      ...prev,
      name: baseProfile.full_name || '',
      telNo: baseProfile.phone || '',
      dateOfBirth: baseProfile.dob || '',
      email: baseProfile.email || '',
      sex: baseProfile.gender || '',
    }));
  }
}, [existingPrisaaProfile, baseProfile]);

useEffect(() => {
  if (!baseProfile) return;

  setForm((prev) => {
    const base = existingPrisaaProfile
      ? { ...EMPTY_FORM, ...existingPrisaaProfile }
      : { ...EMPTY_FORM, ...prev };

    return {
      ...base,
      educationalBackground: {
        ...EMPTY_FORM.educationalBackground,
        ...(base.educationalBackground || {}),
      },
      relatedExperience: base.relatedExperience?.length
        ? base.relatedExperience
        : EMPTY_FORM.relatedExperience,
      name: baseProfile.full_name || '',
      telNo: baseProfile.phone || '',
      dateOfBirth: baseProfile.dob || '',
      sex: baseProfile.gender || '',
    };
  });
}, [existingPrisaaProfile, baseProfile]);

useEffect(() => {
  if (!profileId) return;

  const channel = supabase
    .channel('profile_changes_for_coach_form')
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${profileId}` },
      () => {
        queryClient.invalidateQueries({ queryKey: ['coachProfile', profileId] });
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [profileId, queryClient]);

  const saveMutation = useMutation({
    mutationFn: () => coachProfileApi.saveMyProfile(profileId, form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coachProfile', profileId] });
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 2500);
    },
    onError: (error: any) => setErrorMessage(error?.message || 'Could not save. Please try again.'),
  });

  const updateEducation = (level: keyof PrisaaCoachFormData['educationalBackground'], field: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      educationalBackground: {
        ...prev.educationalBackground,
        [level]: { ...prev.educationalBackground[level], [field]: value },
      },
    }));
  };

  const updateExperience = (index: number, field: keyof RelatedExperienceEntry, value: string) => {
    setForm((prev) => ({
      ...prev,
      relatedExperience: prev.relatedExperience.map((exp, i) => (i === index ? { ...exp, [field]: value } : exp)),
    }));
  };

  const addExperience = () => {
    setForm((prev) => ({ ...prev, relatedExperience: [...prev.relatedExperience, { ...EMPTY_EXPERIENCE }] }));
  };

  const removeExperience = (index: number) => {
    setForm((prev) => ({ ...prev, relatedExperience: prev.relatedExperience.filter((_, i) => i !== index) }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    saveMutation.mutate();
  };

  const { data: signatureUrl } = useQuery({
  queryKey: ['coachSignatureUrl', profileId],
  queryFn: () => getSignatureUrl(signatureStoragePath),
  enabled: !!signatureStoragePath,
});

const signatureMutation = useMutation({
  mutationFn: (blob: Blob) => uploadSignature(profileId, blob),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['coachSignatureUrl', profileId] });
  },
});

if (isLoading) {
return <FormSkeleton />;
}


  return (
    <div className="animate-in fade-in duration-300 motion-reduce:animate-none max-w-3xl">
      <header className="mb-6">
        <h2 className="text-3xl font-bold tracking-tight text-slate-800">Coach Profile</h2>
        <p className="text-slate-500 text-sm mt-1">
          Fill this out once — it's reused automatically for every PRISAA form you generate.
        </p>
      </header>

      {errorMessage && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">{errorMessage}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">

        <Accordion id="personal" title="Personal Information" subtitle="Name, contact, and demographic details"
          isOpen={openSection === 'personal'} onToggle={() => toggleSection('personal')}>
            <div className="grid grid-cols-2 gap-4">
             <div>
              <label className={labelClass}>Full Name</label>
              <input value={form.name} disabled className={`${inputClass} bg-slate-100 text-slate-500 cursor-not-allowed`} />
              <p className="text-[10px] text-slate-400 mt-1">Synced from your account. Edit in Settings.</p>
            </div>

            <div>
              <label className={labelClass}>Address</label>
              <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Street, Barangay, City" className={inputClass} />
            </div>

            <div>
              <label className={labelClass}>Tel. No.</label>
              <input value={form.telNo} disabled className={`${inputClass} bg-slate-100 text-slate-500 cursor-not-allowed`} />
              <p className="text-[10px] text-slate-400 mt-1">Synced from your account. Edit in Settings.</p>
            </div>

            <Field label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} type="email" placeholder="name@example.com" />

            <div>
              <label className={labelClass}>Date of Birth</label>
              <input value={form.dateOfBirth} disabled type="date" className={`${inputClass} bg-slate-100 text-slate-500 cursor-not-allowed`} />
              <p className="text-[10px] text-slate-400 mt-1">Synced from your account. Edit in Settings.</p>
            </div>

            <Field label="Place of Birth" value={form.placeOfBirth} onChange={(v) => setForm({ ...form, placeOfBirth: v })} placeholder="City, Province" />
            <Field label="Height (cm)" value={form.height} onChange={(v) => setForm({ ...form, height: v })} type="number" placeholder="170" />
            <Field label="Weight (kg)" value={form.weight} onChange={(v) => setForm({ ...form, weight: v })} type="number" placeholder="65" />

            <div>
              <label className={labelClass}>Sex</label>
              <div className="opacity-60 pointer-events-none">
                <SexOption value={form.sex} onChange={() => {}} />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Synced from your account. Edit in Settings.</p>
            </div>

            <SelectField label="Civil Status" value={form.civilStatus} onChange={(v) => setForm({ ...form, civilStatus: v })} options={['Single', 'Married', 'Widowed', 'Separated']} />
            <Field label="Citizenship" value={form.citizenship} onChange={(v) => setForm({ ...form, citizenship: v })} placeholder="Filipino" />
            <Field label="Religion" value={form.religion} onChange={(v) => setForm({ ...form, religion: v })} placeholder="Roman Catholic" />
          </div>
        </Accordion>

        <Accordion id="family" title="Family Background" subtitle="Parents / spouse information" 
          isOpen={openSection === 'family'} onToggle={() => toggleSection('family')}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Father's Name" value={form.fathersName} onChange={(v) => setForm({ ...form, fathersName: v })} />
            <Field label="Father's Occupation" value={form.fathersOccupation} onChange={(v) => setForm({ ...form, fathersOccupation: v })} />
            <Field label="Mother's Name" value={form.mothersName} onChange={(v) => setForm({ ...form, mothersName: v })} />
            <Field label="Mother's Occupation" value={form.mothersOccupation} onChange={(v) => setForm({ ...form, mothersOccupation: v })} />
            <Field label="Their Address" value={form.theirAddress} onChange={(v) => setForm({ ...form, theirAddress: v })} />
            <Field label="Name of Spouse" value={form.nameOfSpouse} onChange={(v) => setForm({ ...form, nameOfSpouse: v })} />
            <Field label="Spouse Occupation" value={form.spouseOccupation} onChange={(v) => setForm({ ...form, spouseOccupation: v })} />
          </div>
        </Accordion>
        <Accordion id="education" title="Educational Background" subtitle="Elementary through Post-Graduate"
          isOpen={openSection === 'education'} onToggle={() => toggleSection('education')}>
          {(['elementary', 'secondary', 'tertiary', 'postGraduate'] as const).map((level) => (
            <div key={level} className="grid grid-cols-3 gap-3 pb-3 border-b border-slate-100 last:border-0 last:pb-0">
              <div className="col-span-3 text-xs font-bold text-slate-500 uppercase">{level.replace(/([A-Z])/g, ' $1')}</div>
              <Field label="School" value={form.educationalBackground[level].school} onChange={(v) => updateEducation(level, 'school', v)} />
              <Field label="Year Graduated" value={form.educationalBackground[level].yearGraduated} onChange={(v) => updateEducation(level, 'yearGraduated', v)} />
              <Field label="Degree/Units Earned" value={form.educationalBackground[level].degreeUnitsEarned} onChange={(v) => updateEducation(level, 'degreeUnitsEarned', v)} />
            </div>
          ))}
        </Accordion>

        <Accordion id="experience" title="Related Experience" subtitle={`${form.relatedExperience.length} entr${form.relatedExperience.length === 1 ? 'y' : 'ies'}`}
          isOpen={openSection === 'experience'} onToggle={() => toggleSection('experience')}>
            {form.relatedExperience.map((exp, i) => (
            <div key={i} className="grid grid-cols-5 gap-2 items-end pb-3 border-b border-slate-100 last:border-0">
              <Field label="Date Entered" value={exp.dateEntered} onChange={(v) => updateExperience(i, 'dateEntered', v)} />
              <Field label="Status" value={exp.status} onChange={(v) => updateExperience(i, 'status', v)} />
              <Field label="Rank/Level" value={exp.rankLevel} onChange={(v) => updateExperience(i, 'rankLevel', v)} />
              <Field label="Position" value={exp.position} onChange={(v) => updateExperience(i, 'position', v)} />
              <div className="flex gap-1">
                <div className="flex-1">
                  <Field label="Yrs. In Service" value={exp.yearsInService} onChange={(v) => updateExperience(i, 'yearsInService', v)} />
                </div>
                {form.relatedExperience.length > 1 && (
                  <button type="button" onClick={() => removeExperience(i)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 active:scale-90 rounded-lg shrink-0 mb-0.5 transition-[color,background-color,transform]">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
          <button type="button" onClick={addExperience} className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 active:scale-[0.97] rounded-lg transition-[background-color,transform]">
            <Plus className="w-3.5 h-3.5" /> Add Experience
          </button>
        </Accordion>

        <div className="border border-slate-200 rounded-xl overflow-hidden">
  <div className="px-4 py-3 bg-slate-50">
    <p className="text-sm font-bold text-slate-800">Signature</p>
    <p className="text-xs text-slate-500 mt-0.5">Saved once, automatically used on every generated PRISAA form.</p>
  </div>
  <div className="p-4">
    <SignaturePad
      existingUrl={signatureUrl}
      onSave={(blob) => signatureMutation.mutateAsync(blob)}
      isSaving={signatureMutation.isPending}
    />
  </div>
</div>

        <div className="pt-2 flex items-center gap-3 justify-end">
          {showSaved && (
            <span className="flex items-center gap-1.5 text-xs font-bold text-green-600">
              <CheckCircle2 className="w-4 h-4" /> Saved
            </span>
          )}
          <button
            type="submit"
            disabled={saveMutation.isPending}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.97] disabled:opacity-50 rounded-lg shadow-md shadow-blue-600/20 transition-[background-color,transform]"
          >
            <Save className="w-4 h-4" /> {saveMutation.isPending ? 'Saving…' : 'Save Profile'}
          </button>
        </div>
      </form>
    </div>
  );
}