// src/1-presentation-tier/pages/coach-views/ScreeningSubmissions.tsx
import { useState, useMemo, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Clock, ArrowLeft, Save, Filter } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuthStore } from '../../../2-application-tier/stores/authStore';
import { getScreeningRoster, type AthleteScreeningStatus } from '../../../3-data-tier/api/screeningApi';
import { getAthletesAcademicData, saveAthleteAcademicData } from '../../../3-data-tier/api/reviewApi';
import { SchoolList } from '../../components/ui/SchoolList';
import { getExportData } from '../../../3-data-tier/api/exportApi';
import { generatePrisaaForm01B } from '../../../2-application-tier/services/prisaaFormGenerator';
import { getSignatureUrl } from '../../../3-data-tier/api/signatureApi';
import { coachProfileApi } from '../../../3-data-tier/api/coachProfileApi';
import { SexOption } from '../../components/ui/SexOption';
import { SportSelect } from '../../components/ui/SportSelect';
import { ILOPRISAA_SPORTS } from '../../../3-data-tier/constant/sports';
import { getProfile } from '../../../3-data-tier/services/profileService';
import { generatePrisaaForm01AYouth } from '../../../2-application-tier/services/prisaaFormGeneratorYouth';
import { CardSkeleton } from '../../components/ui/SkeletonLoading';

function prettifyDocType(type: string): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

const PASS_THRESHOLD = 60;
const FAIL_THRESHOLD = 40;

function getAcademicEligibility(semester: { enrolled: number; passed: number; failed: number; percentage: number }) {
  const isComplete = semester.enrolled > 0 && semester.passed >= 0 && (semester.passed > 0 || semester.failed > 0);
  if (!isComplete) return { eligible: true, reason: null };

  if (semester.percentage < PASS_THRESHOLD) {
    return { eligible: false, reason: `Below ${PASS_THRESHOLD}% passing rate` };
  }
  const failRate = (semester.failed / semester.enrolled) * 100;
  if (failRate >= FAIL_THRESHOLD) {
    return { eligible: false, reason: `failure rate exceeds ${FAIL_THRESHOLD}% limit` };
  }
  return { eligible: true, reason: null };
}

function StatusBadge({ status }: { status: AthleteScreeningStatus['eligibility'] }) {
  if (status === 'ready') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-green-100 text-green-700 border border-green-200">
        <CheckCircle2 className="w-3 h-3" /> Ready
      </span>
    );
  }
  if (status === 'pending_verification') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
        <Clock className="w-3 h-3" /> Pending Verification
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-700 border border-red-200">
      <AlertCircle className="w-3 h-3" /> Incomplete Files
    </span>
  );
}

type Step = 'select' | 'review';

const DIVISION_LABELS: Record<string, string> = {
  elementary: 'Elementary',
  highschool: 'High School',
  tertiary: 'Tertiary',
};

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'ready', label: 'Ready' },
  { key: 'pending_verification', label: 'Pending' },
  { key: 'missing_documents', label: 'Incomplete' },
] as const;

function AthleteCard({
  athlete,
  onClick,
  exportMode = false,
  isSelected = false,
  onToggleSelect,
}: {
  athlete: AthleteScreeningStatus;
  onClick: () => void;
  exportMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
}) {
  const isReady = athlete.eligibility === 'ready';

  const handleCardClick = () => {
    if (!isReady) return;
    if (exportMode) {
      onToggleSelect?.();
    } else {
      onClick();
    }
  };

  return (
    <div
      role="button"
      tabIndex={isReady ? 0 : -1}
      onClick={handleCardClick}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && isReady) {
          e.preventDefault();
          handleCardClick();
        }
      }}
      className={`relative text-left w-full bg-white rounded-2xl border p-4 transition-[border-color,box-shadow,transform] ${
        isReady ? 'hover:border-blue-200 hover:shadow-sm active:scale-[0.98] cursor-pointer' : 'opacity-60 cursor-not-allowed'
      } ${
        exportMode && isSelected ? 'border-green-400 ring-1 ring-green-400 bg-green-50/30' : 'border-slate-100'
      }`}
    >
      {exportMode && (
        <input
          type="checkbox"
          checked={isSelected}
          disabled={!isReady}
          onChange={(e) => {
            e.stopPropagation();
            onToggleSelect?.();
          }}
          onClick={(e) => e.stopPropagation()}
          className="absolute top-3 right-3 w-4 h-4 rounded border-slate-300 text-green-600 disabled:opacity-40"
        />
      )}

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-slate-200 rounded-full shrink-0 flex items-center justify-center text-slate-500 text-sm font-bold uppercase">
          {athlete.name.charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-slate-800 truncate">{athlete.name}</p>
          <div className="flex items-center gap-2 mt-1">
            <StatusBadge status={athlete.eligibility} />
            {athlete.division && (
              <span className="text-[11px] font-medium text-slate-400">
                {DIVISION_LABELS[athlete.division] ?? athlete.division}
              </span>
            )}
          </div>
        </div>
      </div>

      {athlete.eligibility === 'missing_documents' && (
        <p className="text-[11px] text-red-500 mt-3 line-clamp-2">
          Missing: {athlete.missingTypes.map(prettifyDocType).join(', ')}
        </p>
      )}
      {athlete.eligibility === 'pending_verification' && (
        <p className="text-[11px] text-amber-600 mt-3 line-clamp-2">
          Awaiting committee review: {athlete.pendingTypes.map(prettifyDocType).join(', ')}
        </p>
      )}
      {isReady && <p className="text-[11px] text-slate-400 mt-3">All 9 documents verified</p>}
    </div>
  );
}

export default function ScreeningSubmissions() {
  const { user } = useAuthStore();
  const coachId = user?.id || '';
  const coachName = user?.full_name || 'Coach';

  const [step, setStep] = useState<Step>('select');
  const [selectedIds] = useState<Set<string>>(new Set());
  const [reviewData, setReviewData] = useState<Record<string, any>>({});
  const [savedRows, setSavedRows] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['key']>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [exportMode, setExportMode] = useState(false);
  const [exportSelectedIds, setExportSelectedIds] = useState<Set<string>>(new Set());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);


const { data: coachProfileResult } = useQuery({
  queryKey: ['prisaaCoachProfile', coachId],
  queryFn: () => coachProfileApi.getMyProfile(coachId),
  enabled: !!coachId,
});
const coachSignatureStoragePath = coachProfileResult?.signatureStoragePath ?? null;

const { data: coachBaseProfile } = useQuery({
  queryKey: ['coachProfile', coachId],
  queryFn: () => getProfile(coachId),
  enabled: !!coachId,
});

useEffect(() => {
  if (coachBaseProfile?.sport && !exportDetails.sportsEvent) {
    const sport = ILOPRISAA_SPORTS.find((s) => s.id === coachBaseProfile.sport);
    setExportDetails((prev) => ({ ...prev, sportsEvent: sport?.name ?? coachBaseProfile.sport ?? '' }));
  }
}, [coachBaseProfile]);



const MAX_ATHLETES_PER_SHEET = 5;

const toggleExportSelection = (athleteId: string, eligibility: AthleteScreeningStatus['eligibility'], division: string | null) => {
  if (eligibility !== 'ready') return;

setExportSelectedIds((prev) => {
  const next = new Set(prev);

  if (next.has(athleteId)) {
    next.delete(athleteId);
    return next;
  }

  if (next.size > 0) {
    const alreadySelected = roster.filter((a) => next.has(a.athleteId));
    const existingDivision = alreadySelected[0]?.division;
    console.log('DEBUG division check:', { next: Array.from(next), alreadySelected, existingDivision, tryingToAdd: division });
    if (existingDivision && existingDivision !== division) {
      setErrorMessage(`All selected athletes must belong to the same division (e.g., all Tertiary, all High School, or Elementary). Please select athletes from one division at a time for export.`);
      return prev;
    }
    }

    if (next.size >= MAX_ATHLETES_PER_SHEET) return prev;
    setErrorMessage(null); 
    next.add(athleteId);
    return next;
  });
};
  

const handleYearChange = (athleteId: string, rawValue: string) => {
const digitsOnly = rawValue.replace(/[^0-9]/g, '').slice(0, 8);

  let formatted = digitsOnly;
  if (digitsOnly.length > 4) {
    formatted = `${digitsOnly.slice(0, 4)}-${digitsOnly.slice(4)}`;
  }

  updateField(athleteId, 'yearGraduatedFromSHS', formatted);

  if (yearErrors[athleteId]) {
    setYearErrors((prev) => {
      const next = { ...prev };
      delete next[athleteId];
      return next;
    });
  }
};

const [isGenerating, setIsGenerating] = useState(false);

const [showExportDetailsModal, setShowExportDetailsModal] = useState(false);
const [shouldRenderExportModal, setShouldRenderExportModal] = useState(false);
const [isExportModalClosing, setIsExportModalClosing] = useState(false);

useEffect(() => {
  if (showExportDetailsModal) {
    setShouldRenderExportModal(true);
    setIsExportModalClosing(false);
    return;
  }
  if (shouldRenderExportModal) {
    setIsExportModalClosing(true);
    const timeout = setTimeout(() => {
      setShouldRenderExportModal(false);
      setIsExportModalClosing(false);
    }, 150);
    return () => clearTimeout(timeout);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [showExportDetailsModal]);
const [exportDetails, setExportDetails] = useState({
  cluster: 'ILOILO',
  region: '6 - Western Visayas',
  sportsEvent: '', 
  divisionGender: 'MEN' as 'MEN' | 'WOMEN',
});

const handleGenerateForm = async () => {
  setErrorMessage(null);

  const ids = Array.from(exportSelectedIds);
  const selectedRosterEntries = roster.filter((a) => ids.includes(a.athleteId));

  const divisions = new Set(selectedRosterEntries.map((a) => a.division));
  if (divisions.size > 1) {
    setErrorMessage('Please select athletes from only one division at a time (Elementary, High School, or Tertiary).');
    return;
  }
  const division = selectedRosterEntries[0]?.division ?? 'tertiary';

  setIsGenerating(true);
  try {
    const exportData = await getExportData(ids);
    const signatureUrl = await getSignatureUrl(coachSignatureStoragePath);

const blob = division === 'tertiary'
  ? await generatePrisaaForm01B(exportData, exportDetails, { name: coachName, signatureUrl, photoBuffer: null })
  : await generatePrisaaForm01AYouth(
      exportData,
      { ...exportDetails, divisionGender: exportDetails.divisionGender === 'MEN' ? 'BOYS' : 'GIRLS' },
      { name: coachName, signatureUrl, photoBuffer: null },
      division as 'highschool' | 'elementary'
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = division === 'tertiary' ? 'PRISAA-Form-01B.xlsx' : 'PRISAA-Form-01A.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setShowExportDetailsModal(false);
  } catch (err: any) {
    setErrorMessage(err?.message || 'Could not generate the form. Please try again.');
  } finally {
    setIsGenerating(false);
  }
};


const [yearErrors, setYearErrors] = useState<Record<string, boolean>>({});
const handleYearBlur = (athleteId: string) => {
  const value = reviewData[athleteId]?.yearGraduatedFromSHS || '';
  const isValidRange = /^\d{4}-\d{4}$/.test(value);

  if (value.length > 0 && !isValidRange) {
    setYearErrors((prev) => ({ ...prev, [athleteId]: true }));
  }
};

  const { data: roster = [], isLoading, isError } = useQuery({
    queryKey: ['screeningRoster', coachId],
    queryFn: () => getScreeningRoster(coachId),
    enabled: !!coachId,
  });

 const selectedAthletes = useMemo(
  () => roster.filter((a) => Object.prototype.hasOwnProperty.call(reviewData, a.athleteId)),
  [roster, reviewData]
);
  const filteredRoster = useMemo(
    () => (filter === 'all' ? roster : roster.filter((a) => a.eligibility === filter)),
    [roster, filter]
  );

  const EMPTY_SEMESTER = { enrolled: 0, units: 0, passed: 0, failed: 0, percentage: 0 };

const EMPTY_ACADEMIC_DATA = {
  lastName: '',
  firstName: '',
  middleInitial: '',
  yearGraduatedFromSHS: '',
  yearLevel: '',
  course: '',
  schoolPresentlyEnrolled: '',
  academicLoad: {
    firstSemester: { ...EMPTY_SEMESTER },
    secondSemester: { ...EMPTY_SEMESTER },
  },
};

function splitNameGuess(fullName: string): { lastName: string; firstName: string; middleInitial: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { lastName: '', firstName: '', middleInitial: '' };
  if (parts.length === 1) return { lastName: parts[0], firstName: '', middleInitial: '' };

  const last = parts[parts.length - 1];
  const rest = parts.slice(0, -1);


  const possibleMI = rest[rest.length - 1];
  if (possibleMI && /^[A-Za-z]\.?$/.test(possibleMI) && rest.length > 1) {
    return {
      lastName: last,
      firstName: rest.slice(0, -1).join(' '),
      middleInitial: possibleMI.replace('.', ''),
    };
  }

  return { lastName: last, firstName: rest.join(' '), middleInitial: '' };
}

const goToReview = async (athleteIdsToReview: string[]) => {
  const existing = await getAthletesAcademicData(athleteIdsToReview);

  const initialData: Record<string, any> = {};
  const athletesToProcess = roster.filter((a) => athleteIdsToReview.includes(a.athleteId));

  for (const athlete of athletesToProcess) {
    const existingData = existing[athlete.athleteId] || {};
    const nameGuess = splitNameGuess(athlete.name);

    initialData[athlete.athleteId] = {
      ...EMPTY_ACADEMIC_DATA,
      lastName: nameGuess.lastName,
      firstName: nameGuess.firstName,
      middleInitial: nameGuess.middleInitial,
      ...existingData,
      academicLoad: {
        firstSemester: { ...EMPTY_SEMESTER, ...(existingData.academicLoad?.firstSemester || {}) },
        secondSemester: { ...EMPTY_SEMESTER, ...(existingData.academicLoad?.secondSemester || {}) },
      },
    };
  }
  setReviewData(initialData);
  setStep('review');
};

const updateSemesterField = (
  athleteId: string,
  semester: 'firstSemester' | 'secondSemester',
  field: 'enrolled' | 'passed',
  rawValue: number
) => {
  setReviewData((prev) => {
    const current = prev[athleteId].academicLoad[semester];
    const updated = { ...current, [field]: rawValue };

    // Failed is always derived — never independently typed, so it can
    // never disagree with enrolled/passed.
    updated.failed = Math.max(0, updated.enrolled - updated.passed);

    updated.percentage = updated.enrolled > 0
      ? Math.round((updated.passed / updated.enrolled) * 1000) / 10
      : 0;

    return {
      ...prev,
      [athleteId]: {
        ...prev[athleteId],
        academicLoad: { ...prev[athleteId].academicLoad, [semester]: updated },
      },
    };
  });
  setSavedRows((prev) => {
    const next = new Set(prev);
    next.delete(athleteId);
    return next;
  });
};



const [unitWarnings, setUnitWarnings] = useState<Record<string, string>>({});
const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});

const clampSemesterField = (
  athleteId: string,
  semester: 'firstSemester' | 'secondSemester',
  field: 'enrolled' | 'passed'
) => {
  const touchKey = `${athleteId}-${semester}-${field}`;
  setTouchedFields((t) => ({ ...t, [touchKey]: true }));

  setReviewData((prev) => {
    const current = prev[athleteId].academicLoad[semester];
    const clampedEnrolled = Math.max(0, Math.min(30, current.enrolled));
    const clampedPassed = Math.max(0, Math.min(clampedEnrolled, current.passed));

    if (current.passed > clampedEnrolled && clampedEnrolled > 0) {
      const warningKey = `${athleteId}-${semester}`;
      setUnitWarnings((w) => ({
        ...w,
        [warningKey]: `Passed units can't exceed Enrolled (${clampedEnrolled}). Adjusted automatically.`,
      }));
      setTimeout(() => {
        setUnitWarnings((w) => {
          const next = { ...w };
          delete next[warningKey];
          return next;
        });
      }, 4000);
    }

    const updated = {
      ...current,
      enrolled: clampedEnrolled,
      passed: clampedPassed,
      failed: Math.max(0, clampedEnrolled - clampedPassed),
      percentage: clampedEnrolled > 0 ? Math.round((clampedPassed / clampedEnrolled) * 1000) / 10 : 0,
    };

    return {
      ...prev,
      [athleteId]: {
        ...prev[athleteId],
        academicLoad: { ...prev[athleteId].academicLoad, [semester]: updated },
      },
    };
  });
};

  const updateField = (athleteId: string, field: string, value: string) => {
    setReviewData((prev) => ({
      ...prev,
      [athleteId]: { ...prev[athleteId], [field]: value },
    }));
    setSavedRows((prev) => {
      const next = new Set(prev);
      next.delete(athleteId); 
      return next;
    });
  };

  const saveMutation = useMutation({
    mutationFn: async (athleteId: string) => {
      await saveAthleteAcademicData(athleteId, reviewData[athleteId]);
    },
    onSuccess: (_data, athleteId) => {
      setSavedRows((prev) => new Set(prev).add(athleteId));
    },
  });

  if (step === 'review') {
    return (
      <div className="animate-in fade-in duration-300 motion-reduce:animate-none">
        <header className="mb-6 flex items-center gap-3">
          <button onClick={() => setStep('select')} className="p-2 hover:bg-slate-100 active:scale-90 rounded-lg text-slate-500 transition-[background-color,transform]">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-800">
              {selectedAthletes.length === 1 ? `Review ${selectedAthletes[0].name}` : 'Review Athletes'}
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              Confirm or correct each athlete's info before generating the PRISAA form.
            </p>
          </div>
        </header>

        <div className="space-y-4">
          {selectedAthletes.map((athlete) => {


            return (
              <div key={athlete.athleteId} className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-slate-200 rounded-full flex items-center justify-center text-slate-500 text-xs font-bold uppercase">
                        {athlete.name.charAt(0)}
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-800">{athlete.name}</p>
                        <p className="text-[11px] text-slate-400">DOB: {athlete.dateOfBirth ?? '—'}</p>
                    </div>
                    </div>
                    <button
                    onClick={() => saveMutation.mutate(athlete.athleteId)}
                    disabled={saveMutation.isPending}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg active:scale-[0.97] transition-[color,background-color,transform] ${
                        savedRows.has(athlete.athleteId) ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                    }`}
                    >
                    {savedRows.has(athlete.athleteId) ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                    {savedRows.has(athlete.athleteId) ? 'Saved' : 'Save'}
                    </button>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-3">
  <div>
    <label className="block text-[11px] font-bold text-slate-500 mb-1">Last Name</label>
    <input
      value={reviewData[athlete.athleteId]?.lastName || ''}
      onChange={(e) => updateField(athlete.athleteId, 'lastName', e.target.value)}
      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-600"
    />
  </div>
  <div>
    <label className="block text-[11px] font-bold text-slate-500 mb-1">First Name</label>
    <input
      value={reviewData[athlete.athleteId]?.firstName || ''}
      onChange={(e) => updateField(athlete.athleteId, 'firstName', e.target.value)}
      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-600"
    />
  </div>
  <div>
    <label className="block text-[11px] font-bold text-slate-500 mb-1">M.I.</label>
    <input
      value={reviewData[athlete.athleteId]?.middleInitial || ''}
      onChange={(e) => updateField(athlete.athleteId, 'middleInitial', e.target.value.slice(0, 1))}
      maxLength={1}
      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-600"
    />
  </div>
</div>

                {/* Row 1: Basic academic info */}
               <div className={`grid gap-3 mb-4 ${athlete.division === 'tertiary' ? 'grid-cols-4' : 'grid-cols-2'}`}>
  {athlete.division === 'tertiary' && (
    <div>
      <label className="block text-[11px] font-bold text-slate-500 mb-1">Year Graduated from SHS</label>
      <input
        type="text"
        inputMode="numeric"
        pattern="\d{4}-\d{4}"
        maxLength={9}
        value={reviewData[athlete.athleteId]?.yearGraduatedFromSHS || ''}
        onChange={(e) => handleYearChange(athlete.athleteId, e.target.value)}
        onBlur={() => handleYearBlur(athlete.athleteId)}
        placeholder="e.g. 2022-2023"
        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-600"
      />
      {yearErrors[athlete.athleteId] && (
        <p className="text-[10px] text-red-500 mt-1">Please enter a valid school year (e.g. 2022-2023).</p>
      )}
    </div>
  )}

  <div>
    <label className="block text-[11px] font-bold text-slate-500 mb-1">Year Level</label>
    <input
      value={reviewData[athlete.athleteId]?.yearLevel || ''}
      onChange={(e) => updateField(athlete.athleteId, 'yearLevel', e.target.value)}
      placeholder="e.g. 3rd Year"
      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-600"
    />
  </div>

  {athlete.division === 'tertiary' && (
    <div>
      <label className="block text-[11px] font-bold text-slate-500 mb-1">Course</label>
      <input
        value={reviewData[athlete.athleteId]?.course || ''}
        onChange={(e) => updateField(athlete.athleteId, 'course', e.target.value)}
        placeholder="e.g. BSIT"
        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-600"
      />
    </div>
  )}

  <div>
    <label className="block text-[11px] font-bold text-slate-500 mb-1">School Presently Enrolled</label>
    <SchoolList
      value={reviewData[athlete.athleteId]?.schoolPresentlyEnrolled || ''}
      onChange={(name) => updateField(athlete.athleteId, 'schoolPresentlyEnrolled', name)}
    />
  </div>
</div>

                {/* Row 2: Academic Load — 1st & 2nd Semester */}
            {athlete.division === 'tertiary' && (
              <div className="grid grid-cols-2 gap-4">
                {(['firstSemester', 'secondSemester'] as const).map((sem) => {
                    const semData = reviewData[athlete.athleteId]?.academicLoad?.[sem] || {};
                    const enrolledTouched = touchedFields[`${athlete.athleteId}-${sem}-enrolled`];
                    const passedTouched = touchedFields[`${athlete.athleteId}-${sem}-passed`];
                    const isComplete = enrolledTouched && passedTouched;
                    const eligibility = isComplete ? getAcademicEligibility(semData) : { eligible: true, reason: null };

                return (
              <div key={sem} className={`border rounded-lg p-3 ${eligibility.eligible ? 'border-slate-100 bg-slate-50/50' : 'border-red-200 bg-red-50/50'}`}>

                <div className="flex items-center justify-between mb-3">
                  <p className="text-[11px] font-bold text-slate-600 uppercase">
                    {sem === 'firstSemester' ? '1st Semester' : '2nd Semester'}
                  </p>
                  {!eligibility.eligible && (
                    <span className="text-[10px] font-bold text-red-600"> {eligibility.reason}</span>
                  )}
                </div>

                {unitWarnings[`${athlete.athleteId}-${sem}`] && (
                  <div className="mb-2 px-2 py-1.5 bg-amber-50 border border-amber-200 rounded text-[10px] text-amber-700">
                    {unitWarnings[`${athlete.athleteId}-${sem}`]}
                  </div>
                )}
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                      <label className="text-[11px] text-slate-500 shrink-0">Units Enrolled</label>
                      <input
                        type="number"
                        min="0"
                        max="30"
                        value={semData.enrolled || ''}
                        onChange={(e) => {
                          const raw = e.target.value;
                          if (raw.length > 2) return; // block a 3rd digit from being typed at all
                          updateSemesterField(athlete.athleteId, sem, 'enrolled', Number(raw));
                        }}
                        onBlur={() => clampSemesterField(athlete.athleteId, sem, 'enrolled')}
                        className="w-24 px-2 py-1 border border-slate-200 rounded text-xs outline-none focus:border-blue-600 text-right"
                      />
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <label className="text-[11px] text-slate-500 shrink-0">Units Passed</label>
                     <input
                        type="number"
                        min="0"
                        max={semData.enrolled || 30}
                        value={semData.passed || ''}
                        onChange={(e) => {
                          const raw = e.target.value;
                          if (raw.length > 2) return;
                          updateSemesterField(athlete.athleteId, sem, 'passed', Number(raw));
                        }}
                        onBlur={() => clampSemesterField(athlete.athleteId, sem, 'passed')}
                        className="w-24 px-2 py-1 border border-slate-200 rounded text-xs outline-none focus:border-blue-600 text-right"
                      />
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <label className="text-[11px] text-slate-500 shrink-0">Units Failed</label>
                      <input
                        type="number"
                        value={semData.failed || 0}
                        disabled
                        className="w-24 px-2 py-1 border border-slate-200 rounded text-xs bg-slate-100 text-slate-500 text-right cursor-not-allowed"
                      />
                    </div>

                    <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-200">
                      <label className="text-[11px] text-slate-500 shrink-0">Percentage (%)</label>
                      <input
                        type="number"
                        value={semData.percentage || 0}
                        disabled
                        className={`w-24 px-2 py-1 border rounded text-xs text-right cursor-not-allowed ${
                          eligibility.eligible ? 'bg-slate-100 border-slate-200 text-slate-500' : 'bg-red-100 border-red-300 text-red-700 font-bold'
                        }`}
                      />
                    </div>
                    </div>
                </div>
                    );
                  })}
                </div>
                )}
                </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-300 motion-reduce:animate-none">
      <header className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-800">Screening Submissions</h2>
            <p className="text-slate-500 text-sm mt-1">
              {exportMode
                ? `Select up to ${MAX_ATHLETES_PER_SHEET} athletes to include in one PRISAA Form 01B sheet.`
                : 'Click an athlete to review or edit their information.'}
            </p>
          </div>
          <div className="flex items-center gap-2">

    

            {shouldRenderExportModal && (
              <div
                className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 motion-reduce:animate-none ${
                  isExportModalClosing ? 'animate-out fade-out duration-150' : 'animate-in fade-in duration-200'
                }`}
              >
                <div
                  className={`bg-white rounded-2xl shadow-xl w-full max-w-md p-6 motion-reduce:animate-none ${
                    isExportModalClosing ? 'animate-out fade-out zoom-out-95 duration-150' : 'animate-in fade-in zoom-in-95 duration-200'
                  }`}
                >
                  <h3 className="font-bold text-lg text-slate-800 mb-4">Submission Details</h3>
                  <div className="space-y-3">
                    <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Cluster</label>
              <div className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-lg text-sm text-slate-600">
                {exportDetails.cluster}
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Region</label>
              <div className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-lg text-sm text-slate-600">
                {exportDetails.region}
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Sports / Event</label>
              <SportSelect
                value={ILOPRISAA_SPORTS.find((s) => s.name === exportDetails.sportsEvent)?.id ?? ''}
                onChange={(v) => {
                  const sport = ILOPRISAA_SPORTS.find((s) => s.id === v);
                  setExportDetails({ ...exportDetails, sportsEvent: sport?.name ?? v });
                }}
              />
            </div>
        <SexOption
          value={exportDetails.divisionGender === 'MEN' ? 'Male' : 'Female'}
          onChange={(v) => setExportDetails({ ...exportDetails, divisionGender: v === 'Male' ? 'MEN' : 'WOMEN' })}
        />
      </div>
      <div className="flex gap-2 mt-6">
        <button onClick={() => setShowExportDetailsModal(false)} className="flex-1 px-4 py-2 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 active:scale-[0.97] rounded-lg transition-[color,background-color,transform]">
          Cancel
        </button>
       <button onClick={handleGenerateForm} disabled={isGenerating} className="flex-1 px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.97] disabled:opacity-50 rounded-lg transition-[background-color,transform]">
          {isGenerating ? 'Generating…' : 'Generate'}
        </button>
      </div>
    </div>
  </div>
)}

            {exportMode && exportSelectedIds.size > 0 && (
  <button
    onClick={() => setShowExportDetailsModal(true)}
    disabled={exportSelectedIds.size === 0}
    className="px-4 py-2.5 text-sm font-bold rounded-lg active:scale-[0.97] transition-[color,background-color,transform] bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 disabled:opacity-40 disabled:cursor-not-allowed"
  >
    Generate Form ({exportSelectedIds.size}/{MAX_ATHLETES_PER_SHEET})
  </button>
            )}
            <button
              onClick={() => {
                setExportMode(!exportMode);
                setExportSelectedIds(new Set());
              }}
              className={`px-4 py-2.5 text-sm font-bold rounded-lg active:scale-[0.97] transition-[color,background-color,transform] ${
                exportMode ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
              }`}
            >
              {exportMode ? 'Cancel' : 'Select for Export'}
            </button>
          </div>
        </header>

      <div className="relative inline-block mb-5">
        <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold border border-slate-200 bg-white text-slate-600 hover:border-slate-300 active:scale-[0.97] transition-[color,border-color,transform]"
          >
            <Filter className="w-4 h-4 text-slate-400" />
            {FILTERS.find((f) => f.key === filter)?.label ?? 'Filter'}
          </button>

        {showFilters && (
          <>
            {/* Click anywhere outside the panel to close it */}
            <div className="fixed inset-0 z-10" onClick={() => setShowFilters(false)} />

            <div className="absolute left-0 top-full mt-2 z-20 w-44 bg-white rounded-xl border border-slate-200 shadow-lg p-1.5">
              {FILTERS.map((f) => {
                const isActive = filter === f.key;
                return (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => {
                      setFilter(f.key);
                      setShowFilters(false);
                    }}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm text-left active:scale-[0.98] transition-[color,background-color,transform] ${
                      isActive ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {f.label}
                    {isActive && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {errorMessage && (
  <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg flex items-center gap-2">
    <AlertCircle className="w-4 h-4 shrink-0" />
    {errorMessage}
  </div>
)}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <CardSkeleton count={6} />
        </div>
        ) : isError ? (
        <div className="p-6 text-center text-sm text-red-600">Could not load your roster. Please refresh.</div>
      ) : roster.length === 0 ? (
        <div className="p-8 text-center text-sm text-slate-400">No active athletes on your roster yet.</div>
      ) : filteredRoster.length === 0 ? (
        <div className="p-8 text-center text-sm text-slate-400">No athletes match this filter.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRoster.map((athlete) => (
            <AthleteCard
              key={athlete.athleteId}
              athlete={athlete}
              onClick={() => goToReview([athlete.athleteId])}
              exportMode={exportMode}
              isSelected={exportSelectedIds.has(athlete.athleteId)}
              onToggleSelect={() => toggleExportSelection(athlete.athleteId, athlete.eligibility, athlete.division)}
            />
          ))}
        </div>
      )}
    </div>
  );
}