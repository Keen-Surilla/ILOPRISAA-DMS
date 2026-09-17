import { useEffect, useMemo, useState } from 'react';
import { X, Mail, UserPlus, Check, Info, Pencil, GraduationCap, AlertTriangle } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { teamApi } from '../../../3-data-tier/api/teamApi';
import { PremiumDateTimePicker } from '../ui/PremiumDateTimePicker';

type DivisionKey = 'elementary' | 'highschool' | 'tertiary';

const DIVISION_OPTIONS: { key: DivisionKey; label: string }[] = [
  { key: 'elementary', label: 'Elementary' },
  { key: 'highschool', label: 'Secondary' },
  { key: 'tertiary', label: 'Tertiary' },
];

const YEAR_LEVELS_BY_DIVISION: Record<DivisionKey, string[]> = {
  elementary: ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6'],
  highschool: ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'],
  tertiary: ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'],
};

const DIVISION_SUFFIX: Record<DivisionKey, string> = {
  elementary: 'Elementary',
  highschool: 'Secondary',
  tertiary: 'Tertiary',
};

// Single source of truth for age eligibility. Ranges are contiguous and
// non-overlapping: min is inclusive, max is exclusive (i.e. "age < max").
// A 14-year-old, for example, only falls inside the `highschool` range,
// so Elementary and Tertiary are correctly excluded for them.
const DIVISION_AGE_RANGE: Record<DivisionKey, { min: number; max: number }> = {
  elementary: { min: 0, max: 13 },   // age < 13
  highschool: { min: 13, max: 18 },  // 13 <= age < 18
  tertiary: { min: 18, max: 25 },    // 18 <= age < 25
};

function isAgeEligibleForDivision(age: number, division: DivisionKey): boolean {
  const range = DIVISION_AGE_RANGE[division];
  return age >= range.min && age < range.max;
}

export const TERTIARY_COURSES = [
  'BSIT', 'BSCS', 'BSIS', 'BSHM', 'BSTM', 'BSBA', 'BSA', 'BSED', 'BEED',
  'BSN', 'BS Pharmacy', 'BS RadTech', 'BS MedTech', 'BSCRIM',
  'BSCE', 'BSEE', 'BSME', 'BSCpE', 'BSArch',
  'AB PolSci', 'AB Comm', 'AB English', 'AB Psych',
  'Others'
].sort();

interface AthleteData {
  id?: string;
  name: string;
  email: string;
  sport: string;
  gender: '' | 'Male' | 'Female';
  division: '' | DivisionKey;
  year_level: string;
  course?: string;
  year_graduated_shs?: string;
  date_of_birth: string;
}

interface AddAthleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  coachId: string;
  coachSport?: string | null;
  coachSports?: readonly string[];
  eligibilityCheckDate?: string | null;
  athleteToEdit?: AthleteData | null;
}

const EMPTY_ATHLETE: AthleteData = {
  name: '',
  email: '',
  sport: '',
  gender: '',
  division: '',
  year_level: '',
  course: '',
  year_graduated_shs: '',
  date_of_birth: '',
};

export function AddAthleteModal({
  isOpen,
  onClose,
  coachId,
  coachSport,
  coachSports,
  eligibilityCheckDate,
  athleteToEdit,
}: AddAthleteModalProps) {
  const queryClient = useQueryClient();

  const [newAthlete, setNewAthlete] = useState<AthleteData>(EMPTY_ATHLETE);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [shouldRender, setShouldRender] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const isEditMode = !!athleteToEdit;

  const allowedSports = useMemo(() => {
    const sourceSports =
      coachSports && coachSports.length > 0
        ? coachSports
        : coachSport
          ? [coachSport]
          : [];

    return Array.from(
      new Set(
        sourceSports
          .map((sport) => sport.trim())
          .filter(Boolean)
      )
    );
  }, [coachSport, coachSports]);

  const currentSportIsAllowed =
    !newAthlete.sport || allowedSports.includes(newAthlete.sport);
  const hasInvalidLegacySport =
    isEditMode &&
    Boolean(newAthlete.sport) &&
    allowedSports.length > 0 &&
    !currentSportIsAllowed;
  const shouldShowSportSelect =
    allowedSports.length > 1 || hasInvalidLegacySport;

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setIsClosing(false);
      setErrorMessage(null);
      const defaultSport = allowedSports[0] ?? '';
      
      if (athleteToEdit) {
        const existingSport = athleteToEdit.sport?.trim() ?? '';
        setNewAthlete({
          name: athleteToEdit.name || '',
          email: athleteToEdit.email || '',
          sport:
            existingSport && (allowedSports.length === 0 || allowedSports.includes(existingSport))
              ? existingSport
              : existingSport || defaultSport,
          gender: athleteToEdit.gender || '',
          division: athleteToEdit.division || '',
          year_level: athleteToEdit.year_level || '',
          course: athleteToEdit.course || '',
          year_graduated_shs: athleteToEdit.year_graduated_shs || '',
          date_of_birth: athleteToEdit.date_of_birth || '',
        });
      } else {
        setNewAthlete({ ...EMPTY_ATHLETE, sport: defaultSport });
      }
    } else if (shouldRender) {
      setIsClosing(true);
      const timeout = setTimeout(() => {
        setShouldRender(false);
        setIsClosing(false);
      }, 150);
      return () => clearTimeout(timeout);
    }
  }, [isOpen, athleteToEdit, allowedSports, shouldRender]);

  const saveAthleteMutation = useMutation<any, Error, any>({
    mutationFn: async (athleteData) => {
      if (isEditMode && athleteToEdit?.id) {
        const { role, coach_id, ...updatePayload } = athleteData;
        return await teamApi.updateAthlete(athleteToEdit.id, coachId, updatePayload);
      }
      return await teamApi.addAthlete(athleteData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamMembers', coachId] });
      queryClient.invalidateQueries({ queryKey: ['screeningRoster', coachId] });

      setNewAthlete(EMPTY_ATHLETE);
      setErrorMessage(null);
      onClose();
    },
    onError: (error: any) => {
      setErrorMessage(error?.message || `Failed to ${isEditMode ? 'update' : 'add'} athlete.`);
    },
  });

  const handleClose = () => {
    setErrorMessage(null);
    setNewAthlete(EMPTY_ATHLETE);
    onClose();
  };

  const handleDivisionChange = (division: DivisionKey) => {
    setNewAthlete((current) => ({
      ...current,
      division,
      year_level: '',
      course: division === 'tertiary' ? current.course : '', 
      year_graduated_shs: division === 'tertiary' ? current.year_graduated_shs : '', 
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!coachId) {
      setErrorMessage('Unable to identify your account. Please log in again.');
      return;
    }

    const trimmedName = newAthlete.name.trim();

    if (!trimmedName) {
      setErrorMessage("The athlete's name is required.");
      return;
    }

    if (trimmedName.length > 100) {
      setErrorMessage("The athlete's name cannot exceed 100 characters.");
      return;
    }

    const cleanedEmail = newAthlete.email.trim().toLowerCase();

    if (!cleanedEmail.endsWith('@gmail.com')) {
      setErrorMessage('Please use a valid Gmail address (@gmail.com).');
      return;
    }

    if (allowedSports.length === 0 || !newAthlete.sport) {
      setErrorMessage('Your coach profile does not have a sport assigned.');
      return;
    }

    if (!allowedSports.includes(newAthlete.sport)) {
      setErrorMessage('Please choose one of your assigned sports before saving.');
      return;
    }

    if (!newAthlete.gender) {
      setErrorMessage("Please select the athlete's gender.");
      return;
    }

    if (!newAthlete.division) {
      setErrorMessage("Please select the athlete's division.");
      return;
    }

    if (!newAthlete.year_level) {
      setErrorMessage("Please select the athlete's year level.");
      return;
    }
    
    if (newAthlete.division === 'tertiary') {
      if (!newAthlete.course?.trim()) {
        setErrorMessage("Please specify the athlete's course for the tertiary division.");
        return;
      }
      if (!newAthlete.year_graduated_shs?.trim()) {
        setErrorMessage("Please specify the year graduated from high school.");
        return;
      }
    }

    if (!newAthlete.date_of_birth) {
      setErrorMessage("Please enter the athlete's date of birth.");
      return;
    }

    const dobDate = new Date(newAthlete.date_of_birth);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (Number.isNaN(dobDate.getTime()) || dobDate > today) {
      setErrorMessage("Please enter a valid date of birth (it can't be in the future).");
      return;
    }

    // --- STRICT AGE RESTRICTION VALIDATION (range-based, min AND max) ---
    const eventYear = eligibilityCheckDate ? new Date(eligibilityCheckDate).getFullYear() : today.getFullYear();
    const athleteAge = eventYear - dobDate.getFullYear();

    if (!isAgeEligibleForDivision(athleteAge, newAthlete.division)) {
      const range = DIVISION_AGE_RANGE[newAthlete.division];
      setErrorMessage(
        `Age restriction: ${DIVISION_SUFFIX[newAthlete.division]} division requires an age of ${range.min}-${range.max - 1} years (Athlete is ${athleteAge}).`
      );
      return;
    }

    saveAthleteMutation.mutate({
      name: trimmedName,
      email: cleanedEmail,
      role: 'Athlete',
      coach_id: coachId,
      division: newAthlete.division,
      year_level: newAthlete.year_level || null,
      course: newAthlete.division === 'tertiary' ? newAthlete.course?.trim() : null,
      year_graduated_shs: newAthlete.division === 'tertiary' ? newAthlete.year_graduated_shs?.trim() : null,
      date_of_birth: newAthlete.date_of_birth,
      sport: newAthlete.sport,
      gender: newAthlete.gender,
    });
  };

  const eligibilityEventYear = eligibilityCheckDate
    ? new Date(eligibilityCheckDate).getFullYear()
    : new Date().getFullYear();

  const birthYear = newAthlete.date_of_birth
    ? new Date(newAthlete.date_of_birth).getFullYear()
    : null;

  const prisaaAge =
    birthYear && !Number.isNaN(birthYear) ? eligibilityEventYear - birthYear : null;

  // Whether ANY division could possibly accept this age at all.
  const anyDivisionAgeEligible =
    prisaaAge !== null && DIVISION_OPTIONS.some((opt) => isAgeEligibleForDivision(prisaaAge, opt.key));

  // Determine if eligible based on currently selected division
  let isAgeEligible = false;
  if (prisaaAge !== null) {
    isAgeEligible = newAthlete.division
      ? isAgeEligibleForDivision(prisaaAge, newAthlete.division)
      : anyDivisionAgeEligible; // no division chosen yet: only "ok so far" if some division could fit
  }

  const currentYear = new Date().getFullYear();
  const availableYearLevels = newAthlete.division
    ? YEAR_LEVELS_BY_DIVISION[newAthlete.division]
    : [];

  const isDivisionAgeEligible = (division: DivisionKey): boolean => {
    if (prisaaAge === null) return true;
    return isAgeEligibleForDivision(prisaaAge, division);
  };

  if (!shouldRender) return null;

  return (
    <div
      className={`fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 motion-reduce:animate-none ${
        isClosing
          ? 'animate-out fade-out duration-150'
          : 'animate-in fade-in duration-200'
      }`}
    >
      <div
        className={`bg-white dark:bg-[#0b1120] border border-transparent dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden motion-reduce:animate-none ${
          isClosing
            ? 'animate-out fade-out zoom-out-95 duration-150'
            : 'animate-in fade-in zoom-in-95 duration-200'
        }`}
      >
        {/* HEADER */}
        <div className="flex justify-between items-start gap-3 px-5 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="shrink-0 p-2.5 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/30">
              {isEditMode ? (
                <Pencil className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              ) : (
                <UserPlus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              )}
            </div>

     
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                {isEditMode ? 'Edit Athlete' : 'Add New Athlete'}
              </h3>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto settings-scrollbar">
          {/* TEXT ONLY ERROR MESSAGE */}
          {errorMessage && (
            <p className="text-red-500 dark:text-red-400 text-xs font-semibold px-1 pb-1">
              {errorMessage}
            </p>
          )}

       
          {/* FULL NAME */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Full Name <span className="text-blue-500">*</span>
              </label>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">
                Last name, First name, M.I.
              </span>
            </div>

            <input
              required
              type="text"
              value={newAthlete.name}
              onChange={(e) => setNewAthlete({ ...newAthlete, name: e.target.value })}
              maxLength={100}
              placeholder="e.g. Alarcon, Jumelle Faith B."
              className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm bg-white dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition"
            />
          </div>

          {/* GMAIL */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5">
              Gmail Address <span className="text-blue-500">*</span>
            </label>

            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
              <input
                required
                type="email"
                value={newAthlete.email}
                onChange={(e) => setNewAthlete({ ...newAthlete, email: e.target.value })}
                placeholder="athlete@gmail.com"
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-sm bg-white dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition"
              />
            </div>
          </div>

          {/* DATE OF BIRTH + GENDER (2 Columns Side-by-Side) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5">
                Date of Birth <span className="text-blue-500">*</span>
              </label>

              <PremiumDateTimePicker
                label="DOB"
                value={newAthlete.date_of_birth ? `${newAthlete.date_of_birth}T00:00:00` : null}
                onChange={(isoLocal) =>
                  setNewAthlete({ ...newAthlete, date_of_birth: isoLocal.split('T')[0] })
                }
                placeholder="dd/mm/yyyy"
                showTime={false}
                minYear={currentYear - 100}
                maxYear={currentYear}
                width="w-full"
                height="py-2.5"
              />

              {prisaaAge !== null && (
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 mt-1.5 text-[10px] font-bold ${
                    !anyDivisionAgeEligible || (newAthlete.division && !isAgeEligible)
                      ? 'bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400'
                      : newAthlete.division && isAgeEligible
                      ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                      : 'bg-slate-100 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {!anyDivisionAgeEligible || (newAthlete.division && !isAgeEligible) ? (
                    <AlertTriangle className="w-3 h-3" />
                  ) : newAthlete.division && isAgeEligible ? (
                    <Check className="w-3 h-3" />
                  ) : null}
                  Age {prisaaAge} yrs
                  {!anyDivisionAgeEligible
                    ? ' • Ineligible'
                    : newAthlete.division
                    ? isAgeEligible
                      ? ' • Eligible'
                      : ' • Ineligible'
                    : ' • Select a division'}
                </span>
              )}

          
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5">
                Gender <span className="text-blue-500">*</span>
              </label>

              <div className="grid grid-cols-2 gap-2.5">
                {(['Male', 'Female'] as const).map((g) => {
                  const active = newAthlete.gender === g;
                  return (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setNewAthlete({ ...newAthlete, gender: g })}
                      className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-sm font-semibold transition ${
                        active
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {active && <Check className="w-3.5 h-3.5" />}
                      {g}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ASSIGNED SPORT + DIVISION (2 Columns Side-by-Side) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5">
                Assigned Sport
              </label>
              {shouldShowSportSelect ? (
                <>
                  <select
                    value={newAthlete.sport}
                    onChange={(e) => setNewAthlete({ ...newAthlete, sport: e.target.value })}
                    className={`w-full border rounded-xl px-3.5 py-2.5 text-sm bg-white dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition ${
                      hasInvalidLegacySport
                        ? 'border-amber-300 dark:border-amber-500/50'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {hasInvalidLegacySport && (
                      <option value={newAthlete.sport} disabled>
                        {newAthlete.sport} (no longer assigned)
                      </option>
                    )}
                    {allowedSports.map((sport) => (
                      <option key={sport} value={sport}>
                        {sport}
                      </option>
                    ))}
                  </select>
                  {hasInvalidLegacySport && (
                    <p className="mt-1.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                      Choose one of your assigned sports before saving.
                    </p>
                  )}
                </>
              ) : (
                <input
                  type="text"
                  value={newAthlete.sport || allowedSports[0] || ''}
                  readOnly
                  disabled={allowedSports.length === 0}
                  placeholder="Set your sport in Settings"
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/30 text-slate-600 dark:text-slate-400 cursor-not-allowed disabled:opacity-60"
                />
              )}
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5">
                Division <span className="text-blue-500">*</span>
              </label>

              <div className="grid grid-cols-3 gap-1.5">
                {DIVISION_OPTIONS.map((opt) => {
                  const active = newAthlete.division === opt.key;
                  const eligible = isDivisionAgeEligible(opt.key);
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      disabled={!eligible}
                      onClick={() => handleDivisionChange(opt.key)}
                      title={
                        !eligible
                          ? `Not selectable: athlete's age (${prisaaAge}) is outside the ${opt.label} division limit.`
                          : undefined
                      }
                      className={`rounded-xl border py-3 text-xs font-semibold transition ${
                        active
                          ? 'border-blue-500 bg-blue-600 text-white shadow-sm'
                          : !eligible
                          ? 'border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/30 text-slate-300 dark:text-slate-600 opacity-50 cursor-not-allowed'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              {prisaaAge !== null && !isAgeEligible && newAthlete.division && anyDivisionAgeEligible && (
                <p className="flex items-start gap-1.5 text-[10px] font-medium text-amber-600 dark:text-amber-400 mt-1.5">
                  <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                  This athlete is {prisaaAge} yrs old — outside the {DIVISION_SUFFIX[newAthlete.division]} age limit. Choose an eligible division before saving.
                </p>
              )}
            </div>
          </div>

          {/* SECTION: ACADEMIC BACKGROUND & ELIGIBILITY */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20">
                <GraduationCap className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              </div>
              <h4 className="text-[11px] font-bold uppercase tracking-wide text-slate-700 dark:text-slate-300">
                Academic Background
              </h4>
            </div>
          </div>

          {/* COURSE / PROGRAM + YEAR LEVEL (2 Columns Side-by-Side) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`block text-[11px] font-bold uppercase tracking-wide mb-1.5 transition-colors ${
                newAthlete.division === 'tertiary' 
                  ? 'text-slate-500 dark:text-slate-400' 
                  : 'text-slate-400/50 dark:text-slate-600'
              }`}>
                Course / Program {newAthlete.division === 'tertiary' && <span className="text-blue-500">*</span>}
              </label>
              <select
                required={newAthlete.division === 'tertiary'}
                disabled={newAthlete.division !== 'tertiary'}
                value={newAthlete.course || ''}
                onChange={(e) => setNewAthlete({ ...newAthlete, course: e.target.value })}
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2.5 text-xs font-medium bg-white dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 disabled:opacity-50 disabled:bg-slate-50 dark:disabled:bg-slate-900/50 disabled:cursor-not-allowed transition"
              >
                <option value="">
                  {newAthlete.division === 'tertiary' ? 'Select Course' : 'Not required'}
                </option>
                {TERTIARY_COURSES.map((course) => (
                  <option key={course} value={course}>
                    {course}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5">
                Year Level <span className="text-blue-500">*</span>
              </label>

              <select
                value={newAthlete.year_level}
                disabled={!newAthlete.division}
                onChange={(e) => setNewAthlete({ ...newAthlete, year_level: e.target.value })}
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2.5 text-xs font-medium bg-white dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 disabled:opacity-50 disabled:bg-slate-50 dark:disabled:bg-slate-900/50 disabled:cursor-not-allowed transition"
              >
                <option value="">
                  {newAthlete.division ? 'Select level' : 'Select division'}
                </option>
                {availableYearLevels.map((opt) => (
                  <option key={opt} value={opt}>
                    {newAthlete.division
                      ? `${opt} - ${DIVISION_SUFFIX[newAthlete.division]}`
                      : opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* SHS YEAR GRADUATED (always visible, tertiary only to edit) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className={`text-[11px] font-bold uppercase tracking-wide transition-colors ${
                newAthlete.division === 'tertiary'
                  ? 'text-slate-500 dark:text-slate-400'
                  : 'text-slate-400/50 dark:text-slate-600'
              }`}>
                SHS Year Graduated {newAthlete.division === 'tertiary' && <span className="text-blue-500">*</span>}
              </label>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">
                Senior High School
              </span>
            </div>

            <input
              required={newAthlete.division === 'tertiary'}
              disabled={newAthlete.division !== 'tertiary'}
              type="text"
              value={newAthlete.year_graduated_shs || ''}
              onChange={(e) => setNewAthlete({ ...newAthlete, year_graduated_shs: e.target.value.replace(/\D/g, '').slice(0, 4) })}
              placeholder={newAthlete.division === 'tertiary' ? 'e.g. 2023' : 'Not required'}
              className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm bg-white dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 disabled:opacity-50 disabled:bg-slate-50 dark:disabled:bg-slate-900/50 disabled:cursor-not-allowed transition"
            />
          </div>

          {/* ACTIONS */}
          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2.5 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-sm font-medium transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saveAthleteMutation.isPending}
              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition shadow-sm shadow-blue-500/20"
            >
              {saveAthleteMutation.isPending ? (
                'Saving...'
              ) : isEditMode ? (
                'Save Changes'
              ) : (
                <>
                  <Check className="w-4 h-4" />
                   Register
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
