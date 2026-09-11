import { useEffect, useState } from 'react';
import { X, GraduationCap, CheckCircle2 } from 'lucide-react';

export type EducationLevel = 'elementary' | 'secondary' | 'tertiary';

export interface ExportableAthlete {
  id: string;
  name: string;
  year_level: string | null;
  gender: string | null;
}

interface AthleteExportSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  athletes: ExportableAthlete[];
  onConfirm: (selection: { athleteIds: string[]; level: EducationLevel }) => void;
  isExporting?: boolean;
  errorMessage?: string | null;
}

const MAX_SELECTABLE = 5;
const MIN_SELECTABLE = 1;

const LEVEL_TABS: { key: EducationLevel; label: string; available: boolean }[] = [
  { key: 'elementary', label: 'Elementary', available: false },
  { key: 'secondary', label: 'Secondary', available: false },
  { key: 'tertiary', label: 'Tertiary', available: true },
];

// Grade 1-6 -> elementary, Grade 7-12 -> secondary, 1st-5th Year -> tertiary.
// Returns null for anything unrecognized so it's simply excluded from every list.
export function getEducationLevel(yearLevel: string | null | undefined): EducationLevel | null {
  if (!yearLevel) return null;

  const gradeMatch = yearLevel.match(/^Grade\s+(\d{1,2})$/i);
  if (gradeMatch) {
    const grade = parseInt(gradeMatch[1], 10);
    if (grade >= 1 && grade <= 6) return 'elementary';
    if (grade >= 7 && grade <= 12) return 'secondary';
    return null;
  }

  if (/year$/i.test(yearLevel.trim())) return 'tertiary';

  return null;
}

export function AthleteExportSelectModal({
  isOpen,
  onClose,
  athletes,
  onConfirm,
  isExporting = false,
  errorMessage = null,
}: AthleteExportSelectModalProps) {
  const [selectedLevel, setSelectedLevel] = useState<EducationLevel>('tertiary');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Reset selection whenever the modal is (re)opened or the level changes,
  // since switching levels can never carry over a mixed-level selection.
  useEffect(() => {
    if (isOpen) setSelectedIds([]);
  }, [isOpen, selectedLevel]);

  if (!isOpen) return null;

  const filteredAthletes = athletes.filter(
    (a) => getEducationLevel(a.year_level) === selectedLevel
  );

  // Once at least one athlete is selected, every other selectable athlete
  // must share the same gender — the form has a single MEN/WOMEN checkbox
  // for the whole sheet, so a mixed selection would mislabel someone.
  const lockedGender =
    filteredAthletes.find((a) => selectedIds.includes(a.id))?.gender ?? null;

  const toggleAthlete = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_SELECTABLE) return prev;

      const athlete = filteredAthletes.find((a) => a.id === id);
      if (lockedGender && athlete?.gender && athlete.gender !== lockedGender) return prev;

      return [...prev, id];
    });
  };

  // Select-all only grabs athletes matching the first filtered athlete's
  // gender, so it can never produce a mixed selection either.
  const selectAllGender = filteredAthletes[0]?.gender ?? null;
  const selectAllTargetIds = filteredAthletes
    .filter((a) => !selectAllGender || a.gender === selectAllGender)
    .slice(0, MAX_SELECTABLE)
    .map((a) => a.id);
  const isAllSelected =
    selectAllTargetIds.length > 0 &&
    selectedIds.length === selectAllTargetIds.length &&
    selectAllTargetIds.every((id) => selectedIds.includes(id));

  const toggleSelectAll = () => {
    setSelectedIds(isAllSelected ? [] : selectAllTargetIds);
  };

  // Safety net: even though the checkboxes above should prevent it, don't
  // allow export to fire on a mixed-gender selection under any circumstance.
  const selectedGenders = new Set(
    filteredAthletes.filter((a) => selectedIds.includes(a.id)).map((a) => a.gender)
  );
  const hasMixedGender = selectedGenders.size > 1;

  const canExport =
    selectedIds.length >= MIN_SELECTABLE &&
    selectedIds.length <= MAX_SELECTABLE &&
    !hasMixedGender &&
    !isExporting;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col">
        {/* HEADER */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Export PRISAA Form 01B
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Select up to {MAX_SELECTABLE} athletes from the same level.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* LEVEL TABS */}
        <div className="flex gap-1.5 px-5 pt-4">
          {LEVEL_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              disabled={!tab.available}
              onClick={() => setSelectedLevel(tab.key)}
              title={tab.available ? undefined : 'Coming soon'}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                selectedLevel === tab.key
                  ? 'bg-blue-600 text-white'
                  : tab.available
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  : 'bg-slate-50 dark:bg-slate-800/50 text-slate-300 dark:text-slate-600 cursor-not-allowed'
              }`}
            >
              {tab.label}
              {!tab.available && ' (soon)'}
            </button>
          ))}
        </div>

        {/* ATHLETE CHECKLIST */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-1.5">
          {filteredAthletes.length === 0 ? (
            <div className="text-center py-10">
              <GraduationCap className="w-6 h-6 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">
                No athletes at this level
              </p>
            </div>
          ) : (
            <>
              <label className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 mb-1">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Select all
                  {filteredAthletes.length > MAX_SELECTABLE &&
                    ` (first ${MAX_SELECTABLE} of ${filteredAthletes.length})`}
                </span>
              </label>

              {lockedGender && (
                <p className="text-[11px] text-slate-400 dark:text-slate-500 px-3 pb-1">
                  Only showing {lockedGender.toLowerCase()} athletes — one sheet can't mix genders.
                </p>
              )}

              {filteredAthletes.map((athlete) => {
              const isChecked = selectedIds.includes(athlete.id);
              const isWrongGender = !!(
                lockedGender &&
                athlete.gender &&
                athlete.gender !== lockedGender
              );
              const isDisabled =
                !isChecked && (selectedIds.length >= MAX_SELECTABLE || isWrongGender);

              return (
                <label
                  key={athlete.id}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors ${
                    isChecked
                      ? 'border-blue-300 bg-blue-50 dark:border-blue-500/40 dark:bg-blue-500/10'
                      : 'border-slate-200 dark:border-slate-700'
                  } ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                  title={isWrongGender ? "Different gender from your current selection" : undefined}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    disabled={isDisabled}
                    onChange={() => toggleAthlete(athlete.id)}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />

                  <span className="flex-1 text-sm font-medium text-slate-800 dark:text-slate-200">
                    {athlete.name}
                  </span>

                  {athlete.year_level && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                      {athlete.year_level}
                    </span>
                  )}

                  {isChecked && <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />}
                </label>
              );
            })}
            </>
          )}
        </div>

        {/* FOOTER */}
        <div className="flex flex-col gap-2 px-5 py-4 border-t border-slate-100 dark:border-slate-800">
          {errorMessage && (
            <div className="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 px-3 py-2 rounded-lg text-xs border border-red-100 dark:border-red-500/20">
              {errorMessage}
            </div>
          )}

          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {selectedIds.length} of {MAX_SELECTABLE} selected
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-lg text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={!canExport}
                onClick={() => onConfirm({ athleteIds: selectedIds, level: selectedLevel })}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isExporting ? 'Generating…' : 'Export'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}