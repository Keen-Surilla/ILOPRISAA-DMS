/**
 * Reports.tsx
 * ---------------------------------------------------------------------------
 * Official Roster Eligibility & Screening Report
 * 
 * - Outline alert-circle for documents uploaded but not yet verified (pending).
 * - A plain dash (—) for documents the coach hasn't uploaded yet (missing).
 * - Outline check-circle (verified) / x-circle (rejected) for the other two states.
 */

import * as React from "react";
import {
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Info,
  Trophy,
  ChevronLeft,
  ChevronRight,
  Download,
  ChevronDown,
  FileDown,
  FileText,
  Loader2,
  X,
} from "lucide-react";

import { useAuthStore } from "../../../2-application-tier/stores/authStore";
import { useTeamRoster } from "../../../2-application-tier/hooks/useTeamRoster";

// Export dependencies — install if not already present:
//   npm install jspdf jspdf-autotable docx file-saver
//   npm install -D @types/file-saver
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Document as DocxDocument,
  Packer as DocxPacker,
  Paragraph as DocxParagraph,
  Table as DocxTable,
  TableRow as DocxTableRow,
  TableCell as DocxTableCell,
  TextRun as DocxTextRun,
  HeadingLevel as DocxHeadingLevel,
  WidthType as DocxWidthType,
  AlignmentType as DocxAlignmentType,
} from "docx";
import { saveAs } from "file-saver";

// ============================================================================
// 1. INLINE UTILITIES & COMPONENTS
// ============================================================================

const cn = (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(" ");

const Badge = ({ className, children, ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
  <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", className)} {...props}>
    {children}
  </span>
);

const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, ...props }, ref) => (
    <button
      ref={ref}
      className={cn("inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50", className)}
      {...props}
    />
  )
);
Button.displayName = "Button";

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      className={cn("flex w-full rounded-md border bg-transparent px-3 py-1 text-sm transition-colors focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50", className)}
      {...props}
    />
  )
);
Input.displayName = "Input";

// Inline Table Suite
const Table = ({ className, ...props }: React.HTMLAttributes<HTMLTableElement>) => (
  <table className={cn("w-full caption-bottom text-sm", className)} {...props} />
);
const TableHeader = ({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <thead className={cn("[&_tr]:border-b", className)} {...props} />
);
const TableBody = ({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <tbody className={cn("[&_tr:last-child]:border-0", className)} {...props} />
);
const TableRow = ({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) => (
  <tr className={cn("border-b transition-colors", className)} {...props} />
);
const TableHead = ({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) => (
  <th className={cn("h-12 px-4 text-center align-middle font-medium", className)} {...props} />
);
const TableCell = ({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) => (
  <td className={cn("p-4 align-middle", className)} {...props} />
);

// ============================================================================
// 2. TYPES
// ============================================================================

type DocStatus = "verified" | "pending" | "rejected" | "missing";
type EligibilityStatus = "eligible" | "pending" | "ineligible";

interface DocumentCheck {
  status: DocStatus;
  note?: string;
}

interface SemesterLoad {
  passedUnits: number;
  enrolledUnits: number;
  failed?: boolean;
}

export interface AthleteRecord {
  id: string;
  name: string;
  yearLevel: string;
  division?: string; 
  dateOfBirth: string;
  highSchoolGradYear: number;
  firstSemester: SemesterLoad;
  secondSemester: { enrolledUnits: number };
  documents: {
    psa: DocumentCheck;
    medical: DocumentCheck;
    waiver: DocumentCheck;
  };
  eligibility: EligibilityStatus;
  remarks: string;
}

export interface CoachRecord {
  role: string;
  name: string;
  title: string;
  status?: string;
}

export interface ReportsPageProps {
  institution?: string;
  department?: string;
  season?: string;
  coachId?: string;
  athletes?: AthleteRecord[];
  coaches?: CoachRecord[];
}

type EducationLevel = "Tertiary" | "Secondary" | "Elementary";

// ============================================================================
// 3. META & PRESENTATIONAL HELPERS
// ============================================================================

// status priority mirrors documentsApi.ts's collapseGroup() — rejected beats
// missing beats pending beats verified, so a partially-uploaded document
// group never accidentally reads as "further along" than it is.
const DOC_STATUS_META: Record<DocStatus, { icon: React.ElementType | null; className: string; label: string }> = {
  verified: { icon: CheckCircle2, className: "text-[#10b981]", label: "Verified" },
  pending: { icon: AlertCircle, className: "text-[#f59e0b]", label: "Uploaded — pending verification" },
  rejected: { icon: XCircle, className: "text-[#f43f5e]", label: "Rejected — needs re-submission" },
  missing: { icon: null, className: "text-slate-500 dark:text-[#64748b]", label: "Not yet uploaded" },
};

// DisplayEligibility is a UI-only projection of the raw `eligibility` field.
// The backend only ever stores "eligible" | "pending" | "ineligible" — but a
// single "pending" bucket hides an important distinction for coaches:
//   - documents are all in (nothing missing/rejected), just awaiting the
//     committee's sign-off  -> "underReview" (blue)
//   - something on the athlete's side needs attention (missing or rejected
//     document) before review can even start -> "actionRequired" (amber)
// This is purely derived for display; it never gets written back to the
// database, so it can't drift from the source of truth in `eligibility`.
type DisplayEligibility = "eligible" | "underReview" | "actionRequired" | "ineligible";

const ELIGIBILITY_META: Record<DisplayEligibility, { textClassName: string; numberClassName: string; label: string }> = {
  eligible: {
    textClassName: "text-[#10b981]",
    numberClassName: "text-[#10b981]",
    label: "Eligible to play",
  },
  underReview: {
    textClassName: "text-[#3b82f6]",
    numberClassName: "text-[#3b82f6]",
    label: "Under review",
  },
  actionRequired: {
    textClassName: "text-[#f59e0b]",
    numberClassName: "text-[#f59e0b]",
    label: "Action required",
  },
  ineligible: {
    textClassName: "text-[#f43f5e]",
    numberClassName: "text-[#f43f5e]",
    label: "Ineligible",
  },
};

/**
 * Projects the raw eligibility + document statuses into one of the four
 * display buckets above.
 *
 * - "eligible" / "ineligible" pass straight through from the backend value —
 *   those are committee decisions and this function never overrides them.
 * - Anything else ("pending", or unset) is split by document completeness:
 *   a missing or rejected document means the ball is in the athlete/coach's
 *   court ("actionRequired"); a full set of uploaded-but-not-yet-verified
 *   documents means the ball is in the committee's court ("underReview").
 */
function getDisplayEligibility(athlete: AthleteRecord): DisplayEligibility {
  if (athlete.eligibility === "eligible") return "eligible";
  if (athlete.eligibility === "ineligible") return "ineligible";

  const docs = [
    athlete.documents?.psa?.status ?? "missing",
    athlete.documents?.medical?.status ?? "missing",
    athlete.documents?.waiver?.status ?? "missing",
  ];

  const needsAction = docs.some((status) => status === "missing" || status === "rejected");
  return needsAction ? "actionRequired" : "underReview";
}

function DocStatusIcon({ check }: { check: DocumentCheck }) {
  const meta = DOC_STATUS_META[check.status] || DOC_STATUS_META.missing;
  const Icon = meta.icon;

  // Not uploaded yet — a plain dash, not "N/A". This only ever shows when
  // the coach genuinely hasn't submitted anything for this slot.
  if (!Icon) {
    return (
      <span className={cn("text-sm font-semibold", meta.className)} title={check.note ?? meta.label}>
        &#8212;
      </span>
    );
  }

  return (
    <span
      className={cn("inline-flex items-center justify-center cursor-help", meta.className)}
      title={check.note ?? meta.label}
    >
      <Icon className="w-[18px] h-[18px]" strokeWidth={2} />
    </span>
  );
}

function EligibilityPill({ status }: { status: DisplayEligibility }) {
  const meta = ELIGIBILITY_META[status];
  return (
    <div className={cn("inline-flex items-center font-label-md text-[11px] font-bold tracking-wide uppercase", meta.textClassName)}>
      {meta.label}
    </div>
  );
}

function RemarksCell({ status, remarks }: { status: DisplayEligibility; remarks: string }) {
  if (!remarks) return null;
  const meta = ELIGIBILITY_META[status];
  return (
    <div className={cn("text-[11px] leading-relaxed font-medium text-left", meta.textClassName)}>
      {remarks}
    </div>
  );
}



function unitLoadPercent(sem: SemesterLoad): number {
  if (sem.enrolledUnits === 0) return 0;
  return Math.round((sem.passedUnits / sem.enrolledUnits) * 100);
}

// ============================================================================
// 4. FILTER BAR
// ============================================================================

type FilterKey = "all" | DisplayEligibility;

function FilterBar({
  counts,
  active,
  onChange,
  query,
  onQueryChange,
}: {
  counts: Record<FilterKey, number>;
  active: FilterKey;
  onChange: (key: FilterKey) => void;
  query: string;
  onQueryChange: (value: string) => void;
}) {
  const filters: { key: FilterKey; label: string; dotClassName?: string }[] = [
    { key: "all", label: "All athletes" },
    { key: "eligible", label: "Eligible", dotClassName: "bg-[#10b981]" },
    { key: "underReview", label: "Under Review", dotClassName: "bg-[#3b82f6]" },
    { key: "actionRequired", label: "Action Required", dotClassName: "bg-[#f59e0b]" },
    { key: "ineligible", label: "Ineligible", dotClassName: "bg-[#f43f5e]" },
  ];

  return (
    <div className="flex flex-col items-center justify-between gap-3 rounded-2xl border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#0f172a] p-3 sm:flex-row mb-6">
      <div className="flex w-full items-center gap-2 overflow-x-auto pb-1 sm:w-auto sm:pb-0">
        {filters.map((filter) => {
          const isActive = active === filter.key;
          return (
            <button
              key={filter.key}
              type="button"
              onClick={() => onChange(filter.key)}
              aria-pressed={isActive}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-[11px] font-bold uppercase tracking-wide transition-colors",
                isActive
                  ? "bg-blue-50 dark:bg-[#adc6ff]/15 text-blue-600 dark:text-[#adc6ff]"
                  : "bg-slate-50 dark:bg-[#151b2d] text-slate-500 dark:text-[#94a3b8] hover:text-slate-900 dark:hover:text-[#f8fafc] hover:bg-slate-100 dark:hover:bg-[#191f31]",
              )}
            >
              {filter.dotClassName && (
                <span className={cn("size-2 rounded-full", filter.dotClassName)} />
              )}
              {filter.label} {counts[filter.key]}
            </button>
          );
        })}
      </div>
      <div className="relative w-full sm:w-64">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400 dark:text-[#64748b]" />
        <Input
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Filter roster entries…"
          className="h-9 rounded-full border border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-[#151b2d] pl-9 text-[13px] text-slate-900 dark:text-[#f8fafc] placeholder:text-slate-400 dark:placeholder:text-[#64748b] focus-visible:ring-1 focus-visible:ring-blue-300 dark:focus-visible:ring-[#adc6ff]/50"
        />
      </div>
    </div>
  );
}

// ============================================================================
// 5. ROSTER TABLE (WITH PAGINATION)
// ============================================================================

const ROW_TINT: Record<DisplayEligibility, string> = {
  eligible: "bg-white dark:bg-transparent hover:bg-slate-50 dark:hover:bg-white/[0.02]",
  underReview: "bg-blue-50/60 dark:bg-[#3b82f6]/[0.05] hover:bg-blue-50 dark:hover:bg-[#3b82f6]/[0.08]",
  actionRequired: "bg-amber-50/60 dark:bg-[#f59e0b]/[0.05] hover:bg-amber-50 dark:hover:bg-[#f59e0b]/[0.08]",
  ineligible: "bg-rose-50/60 dark:bg-[#f43f5e]/[0.05] hover:bg-rose-50 dark:hover:bg-[#f43f5e]/[0.08]",
};

function RosterRow({ athlete, index, level }: { athlete: AthleteRecord; index: number; level: EducationLevel }) {
  const sem1Percent = unitLoadPercent(athlete.firstSemester);
  const isTertiary = level === "Tertiary";
  const displayEligibility = getDisplayEligibility(athlete);
  const eligibilityMeta = ELIGIBILITY_META[displayEligibility];
  const rowTone = ROW_TINT[displayEligibility] ?? ROW_TINT.eligible;

  return (
    <TableRow className={cn("group border-slate-200 dark:border-white/[0.06] transition-colors", rowTone)}>
      <TableCell className={cn("py-4 text-center font-mono font-bold text-[13px]", eligibilityMeta.numberClassName)}>
        {String(index + 1).padStart(2, "0")}
      </TableCell>
      
      <TableCell className="py-4">
        <div className="text-[14px] font-semibold uppercase tracking-tight text-slate-900 dark:text-[#f8fafc]">
          {athlete.name}
        </div>
        {isTertiary && <div className="mt-0.5 text-[11px] text-slate-500 dark:text-[#94a3b8]">{athlete.yearLevel}</div>}
      </TableCell>
      <TableCell className="py-4 text-center font-mono text-[11px] font-medium text-slate-700 dark:text-[#f8fafc]">
        {athlete.dateOfBirth}
      </TableCell>
      <TableCell className="py-4 text-center">
        <span className="rounded-md border border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-[#151b2d] px-2 py-0.5 font-mono text-xs font-semibold text-slate-500 dark:text-[#94a3b8]">
          {athlete.highSchoolGradYear || "—"}
        </span>
      </TableCell>

      {/* Dynamic Academic Columns based on Level */}
      {isTertiary ? (
        <>
          <TableCell className="py-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-col items-start gap-1">
                <span className={cn("text-[11px] font-semibold", athlete.firstSemester.failed ? "text-[#f43f5e]" : "text-slate-900 dark:text-[#f8fafc]")}>
                  {athlete.firstSemester.passedUnits ? `Passed: ${athlete.firstSemester.passedUnits} units` : "Passed: —"}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-[#64748b]">
                  {athlete.firstSemester.enrolledUnits ? `Enrolled: ${athlete.firstSemester.enrolledUnits} units` : "Enrolled: —"}
                </span>
              </div>
              {athlete.firstSemester.failed ? (
                <Badge className="h-auto shrink-0 rounded border border-[#f43f5e]/20 bg-[#f43f5e]/10 px-1.5 py-0.5 font-mono text-[10px] font-bold leading-none text-[#f43f5e]">
                  Failed
                </Badge>
              ) : athlete.firstSemester.enrolledUnits && sem1Percent >= 100 ? (
                <Badge className="h-auto shrink-0 rounded border border-[#10b981]/20 bg-[#10b981]/10 px-1.5 py-0.5 font-mono text-[10px] font-bold leading-none text-[#10b981]">
                  {sem1Percent}%
                </Badge>
              ) : athlete.firstSemester.enrolledUnits ? (
                <Badge className="h-auto shrink-0 rounded border border-[#f59e0b]/20 bg-[#f59e0b]/10 px-1.5 py-0.5 font-mono text-[10px] font-bold leading-none text-[#f59e0b]">
                  {sem1Percent}%
                </Badge>
              ) : (
                <Badge className="h-auto shrink-0 rounded border border-slate-200 dark:border-white/[0.06] bg-slate-100 dark:bg-white/[0.03] px-1.5 py-0.5 font-mono text-[10px] font-bold leading-none text-slate-400 dark:text-[#64748b]">
                  —
                </Badge>
              )}
            </div>
          </TableCell>
          <TableCell className="py-4">
            <div className={cn("text-[11px] font-medium text-left", athlete.firstSemester.failed ? "text-[#f43f5e]/80" : "text-slate-500 dark:text-[#94a3b8]")}>
              {athlete.secondSemester.enrolledUnits ? `Enrolled: ${athlete.secondSemester.enrolledUnits} units` : "Enrolled: —"}
            </div>
          </TableCell>
        </>
      ) : (
        <>
          <TableCell className="py-4 text-center font-medium text-[11px] text-slate-700 dark:text-[#f8fafc]">
            {athlete.yearLevel || "—"}
          </TableCell>
          <TableCell className="py-4 text-center font-medium text-[11px] text-slate-700 dark:text-[#f8fafc]">
            {athlete.firstSemester.enrolledUnits || "—"}
          </TableCell>
          <TableCell className="py-4 text-center font-medium text-[11px] text-slate-700 dark:text-[#f8fafc]">
            {athlete.firstSemester.passedUnits || "—"}
          </TableCell>
        </>
      )}

      {/* Document status icons — dash for missing, alert-circle for pending, check for verified, x for rejected */}
      <TableCell className="py-4 text-center">
        <DocStatusIcon check={athlete.documents?.psa || { status: 'missing' }} />
      </TableCell>
      <TableCell className="py-4 text-center">
        <DocStatusIcon check={athlete.documents?.medical || { status: 'missing' }} />
      </TableCell>
      <TableCell className="py-4 text-center">
        <DocStatusIcon check={athlete.documents?.waiver || { status: 'missing' }} />
      </TableCell>
      <TableCell className="py-4 text-center">
        <EligibilityPill status={displayEligibility} />
      </TableCell>
      <TableCell className="py-4 text-left">
        <RemarksCell status={displayEligibility} remarks={athlete.remarks || ""} />
      </TableCell>
    </TableRow>
  );
}

function RosterTable({ athletes, loading, level }: { athletes: AthleteRecord[]; total: number, loading: boolean, level: EducationLevel }) {
  const isTertiary = level === "Tertiary";
  const colCount = isTertiary ? 11 : 12;

  const [currentPage, setCurrentPage] = React.useState(1);
  const ITEMS_PER_PAGE = 10;

  React.useEffect(() => {
    setCurrentPage(1);
  }, [athletes, level]);

  const totalPages = Math.ceil(athletes.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentAthletes = athletes.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#0f172a]">
      <div className="overflow-x-auto">
        <Table className="min-w-[1300px] border-collapse">
          <TableHeader>
            <TableRow className="border-b border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-[#020617] text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-[#94a3b8] hover:bg-slate-50 dark:hover:bg-[#020617]">
              <TableHead rowSpan={2} className="w-10 border-r border-slate-200 dark:border-white/[0.06] py-4 text-center align-middle">
                #
              </TableHead>
              <TableHead rowSpan={2} className="min-w-[220px] border-r border-slate-200 dark:border-white/[0.06] py-4 text-center align-middle">
                Athlete name & academic program
              </TableHead>
              <TableHead rowSpan={2} className="min-w-[130px] border-r border-slate-200 dark:border-white/[0.06] py-4 text-center align-middle">
                Date of birth
              </TableHead>
              <TableHead rowSpan={2} className="w-24 border-r border-slate-200 dark:border-white/[0.06] py-4 text-center align-middle">
                Yr of H.S. graduation
              </TableHead>

              {isTertiary ? (
                <TableHead colSpan={2} className="border-b border-r border-slate-200 dark:border-white/[0.06] bg-slate-100 dark:bg-white/[0.03] py-2 text-center font-bold tracking-widest text-blue-600 dark:text-[#adc6ff]">
                  Transcript of records
                </TableHead>
              ) : (
                <TableHead colSpan={3} className="border-b border-r border-slate-200 dark:border-white/[0.06] bg-slate-100 dark:bg-white/[0.03] py-2 text-center font-bold tracking-widest text-blue-600 dark:text-[#adc6ff]">
                  Certificate of Enrollment
                </TableHead>
              )}

              <TableHead rowSpan={2} className="w-24 border-r border-slate-200 dark:border-white/[0.06] py-4 text-center align-middle">
                PSA birth cert.
              </TableHead>
              <TableHead rowSpan={2} className="w-24 border-r border-slate-200 dark:border-white/[0.06] py-4 text-center align-middle">
                Medical
              </TableHead>
              <TableHead rowSpan={2} className="w-24 border-r border-slate-200 dark:border-white/[0.06] py-4 text-center align-middle">
                Waiver
              </TableHead>
              <TableHead rowSpan={2} className="w-24 border-r border-slate-200 dark:border-white/[0.06] py-4 text-center align-middle">
                Eligibility status
              </TableHead>
              <TableHead rowSpan={2} className="min-w-[150px] border-slate-200 dark:border-white/[0.06] py-4 text-center align-middle">
                Screening committee remarks
              </TableHead>
            </TableRow>
            <TableRow className="border-b border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-[#020617] text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-[#94a3b8] hover:bg-slate-50 dark:hover:bg-[#020617]">
              {isTertiary ? (
                <>
                  <TableHead className="min-w-[150px] border-r border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.01] py-2 text-center">
                    1st semester
                  </TableHead>
                  <TableHead className="min-w-[140px] border-r border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.01] py-2 text-center">
                    2nd semester
                  </TableHead>
                </>
              ) : (
                <>
                  <TableHead className="min-w-[110px] border-r border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.01] py-2 text-center">
                    Current Grade
                  </TableHead>
                  <TableHead className="min-w-[110px] border-r border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.01] py-2 text-center">
                    Subj. Enrolled
                  </TableHead>
                  <TableHead className="min-w-[110px] border-r border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.01] py-2 text-center">
                    Subj. Passed
                  </TableHead>
                </>
              )}
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-slate-200 dark:divide-white/[0.06] text-[13px]">
            {loading ? (
              <TableRow className="hover:bg-transparent bg-white dark:bg-transparent">
                <TableCell colSpan={colCount} className="py-16 text-center text-slate-500 dark:text-[#94a3b8] animate-pulse">
                  Fetching athletes from database...
                </TableCell>
              </TableRow>
            ) : athletes.length === 0 ? (
              <TableRow className="hover:bg-transparent bg-white dark:bg-transparent">
                <TableCell colSpan={colCount} className="py-16 text-center text-slate-500 dark:text-[#94a3b8]">
                  No athletes match this filter.
                </TableCell>
              </TableRow>
            ) : (
              currentAthletes.map((athlete, index) => (
                <RosterRow key={athlete.id} athlete={athlete} index={startIndex + index} level={level} />
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.02] px-6 py-4">
        <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-[#94a3b8]">
          <Info className="w-4 h-4 text-blue-600 dark:text-[#adc6ff]" />
          <span className="font-medium">
            Showing {athletes.length === 0 ? 0 : startIndex + 1} to {Math.min(startIndex + ITEMS_PER_PAGE, athletes.length)} of {athletes.length} audited athletes 
          </span>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 dark:text-[#94a3b8] dark:hover:bg-white/[0.06] disabled:opacity-30 transition-colors focus:outline-none"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={cn(
                  "w-7 h-7 rounded-lg text-[11px] font-bold transition-colors focus:outline-none",
                  currentPage === pageNum
                    ? "bg-blue-600 text-white shadow-sm dark:bg-blue-600 dark:text-white"
                    : "text-slate-600 dark:text-[#94a3b8] hover:bg-slate-200 dark:hover:bg-white/[0.06]"
                )}
              >
                {pageNum}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 dark:text-[#94a3b8] dark:hover:bg-white/[0.06] disabled:opacity-30 transition-colors focus:outline-none"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// 6. EXPORT (PDF / DOCX) — landscape, long (legal) size
// ============================================================================

function getExportColumns(level: EducationLevel): string[] {
  const base = ["#", "Athlete Name", "Date of Birth", "Yr of H.S. Grad."];
  const academic =
    level === "Tertiary"
      ? ["1st Semester", "2nd Semester"]
      : ["Current Grade", "Subj. Enrolled", "Subj. Passed"];
  const docs = ["PSA Birth Cert.", "Medical", "Waiver"];
  const tail = ["Eligibility Status", "Remarks"];
  return [...base, ...academic, ...docs, ...tail];
}

function getExportRows(athletes: AthleteRecord[], level: EducationLevel): string[][] {
  return athletes.map((athlete, index) => {
    const displayEligibility = getDisplayEligibility(athlete);
    const eligibilityLabel = ELIGIBILITY_META[displayEligibility].label;
    const docLabel = (check?: DocumentCheck) =>
      DOC_STATUS_META[check?.status || "missing"].label;

    const base = [
      String(index + 1).padStart(2, "0"),
      athlete.name,
      athlete.dateOfBirth,
      String(athlete.highSchoolGradYear || "—"),
    ];

    const academic =
      level === "Tertiary"
        ? [
            `Passed: ${athlete.firstSemester.passedUnits || "—"} / Enrolled: ${athlete.firstSemester.enrolledUnits || "—"}`,
            `Enrolled: ${athlete.secondSemester.enrolledUnits || "—"}`,
          ]
        : [
            athlete.yearLevel || "—",
            String(athlete.firstSemester.enrolledUnits || "—"),
            String(athlete.firstSemester.passedUnits || "—"),
          ];

    const docs = [
      docLabel(athlete.documents?.psa),
      docLabel(athlete.documents?.medical),
      docLabel(athlete.documents?.waiver),
    ];

    const tail = [eligibilityLabel, athlete.remarks || "—"];

    return [...base, ...academic, ...docs, ...tail];
  });
}

interface ExportArgs {
  athletes: AthleteRecord[];
  coaches: CoachRecord[];
  level: EducationLevel;
  season: string;
}

/** Generates a landscape, legal-size ("long") PDF and triggers a download. */
async function exportRosterToPdf({ athletes, coaches, level, season }: ExportArgs) {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "legal" });
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header band, matching the app's slate/blue theme
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 56, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Official Roster Eligibility & Screening Report", 28, 26);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(173, 198, 255); // #adc6ff
  doc.text(`${level} Division  ·  ${season}`, 28, 42);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.setFontSize(9);
  doc.text(
    `Generated ${new Date().toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })}`,
    pageWidth - 28,
    42,
    { align: "right" },
  );

  autoTable(doc, {
    head: [getExportColumns(level)],
    body: getExportRows(athletes, level),
    startY: 72,
    margin: { left: 24, right: 24, bottom: 30 },
    styles: { fontSize: 8, cellPadding: 5, valign: "middle", lineColor: [226, 232, 240], lineWidth: 0.5 },
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: "bold", halign: "center" },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: { 0: { halign: "center", cellWidth: 26 } },
    theme: "grid",
  });

  if (coaches.length > 0) {
    // lastAutoTable is attached to the jsPDF instance at runtime by jspdf-autotable,
    // but isn't always present in its shipped type defs — cast to any rather than
    // relying on @ts-expect-error, whose behavior varies by version/tsconfig.
    const finalY: number = (doc as any).lastAutoTable?.finalY || 72;
    let y = finalY + 26;
    if (y > doc.internal.pageSize.getHeight() - 80) {
      doc.addPage();
      y = 40;
    }
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Coaching Staff", 24, y);

    autoTable(doc, {
      head: [["Role", "Name", "Title", "Status"]],
      body: coaches.map((c) => [c.role, c.name, c.title, c.status || "—"]),
      startY: y + 8,
      margin: { left: 24, right: 24 },
      styles: { fontSize: 8, cellPadding: 5 },
      headStyles: { fillColor: [30, 41, 59], textColor: 255 },
      theme: "grid",
    });
  }

  doc.save(`${level.toLowerCase()}-screening-report.pdf`);
}

/** Generates a landscape, legal-size ("long") Word document and triggers a download. */
async function exportRosterToDocx({ athletes, coaches, level, season }: ExportArgs) {
  const columns = getExportColumns(level);
  const rows = getExportRows(athletes, level);

  const headerRow = new DocxTableRow({
    tableHeader: true,
    children: columns.map(
      (col) =>
        new DocxTableCell({
          shading: { fill: "2563EB" },
          children: [
            new DocxParagraph({
              alignment: DocxAlignmentType.CENTER,
              children: [new DocxTextRun({ text: col, bold: true, color: "FFFFFF", size: 16 })],
            }),
          ],
        }),
    ),
  });

  const bodyRows = rows.map(
    (row, i) =>
      new DocxTableRow({
        children: row.map(
          (cell, ci) =>
            new DocxTableCell({
              shading: i % 2 === 1 ? { fill: "F8FAFC" } : undefined,
              children: [
                new DocxParagraph({
                  alignment: ci === 1 ? DocxAlignmentType.LEFT : DocxAlignmentType.CENTER,
                  children: [new DocxTextRun({ text: String(cell), size: 16 })],
                }),
              ],
            }),
        ),
      }),
  );

  const rosterTable = new DocxTable({
    width: { size: 100, type: DocxWidthType.PERCENTAGE },
    rows: [headerRow, ...bodyRows],
  });

  const children: (DocxParagraph | DocxTable)[] = [
    new DocxParagraph({
      heading: DocxHeadingLevel.HEADING_1,
      children: [new DocxTextRun({ text: "Official Roster Eligibility & Screening Report", bold: true })],
    }),
    new DocxParagraph({
      spacing: { after: 200 },
      children: [new DocxTextRun({ text: `${level} Division  ·  ${season}`, color: "2563EB", bold: true })],
    }),
    rosterTable,
  ];

  if (coaches.length > 0) {
    children.push(
      new DocxParagraph({
        spacing: { before: 300, after: 150 },
        heading: DocxHeadingLevel.HEADING_2,
        children: [new DocxTextRun({ text: "Coaching Staff", bold: true })],
      }),
    );
    const coachHeader = new DocxTableRow({
      tableHeader: true,
      children: ["Role", "Name", "Title", "Status"].map(
        (h) =>
          new DocxTableCell({
            shading: { fill: "1E293B" },
            children: [
              new DocxParagraph({
                alignment: DocxAlignmentType.CENTER,
                children: [new DocxTextRun({ text: h, bold: true, color: "FFFFFF", size: 16 })],
              }),
            ],
          }),
      ),
    });
    const coachRows = coaches.map(
      (c) =>
        new DocxTableRow({
          children: [c.role, c.name, c.title, c.status || "—"].map(
            (v) =>
              new DocxTableCell({
                children: [new DocxParagraph({ children: [new DocxTextRun({ text: v, size: 16 })] })],
              }),
          ),
        }),
    );
    children.push(
      new DocxTable({ width: { size: 100, type: DocxWidthType.PERCENTAGE }, rows: [coachHeader, ...coachRows] }),
    );
  }

  // US Legal, landscape, in twips (1440 twips = 1 inch): 14in x 8.5in
  const doc = new DocxDocument({
    sections: [
      {
        properties: {
          page: {
            size: { width: 20160, height: 12240 },
            margin: { top: 640, bottom: 640, left: 560, right: 560 },
          },
        },
        children,
      },
    ],
  });

  const blob = await DocxPacker.toBlob(doc);
  saveAs(blob, `${level.toLowerCase()}-screening-report.docx`);
}

// ============================================================================
// 7. COACH CARDS
// ============================================================================

function CoachCard({ coach }: { coach: CoachRecord }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#0f172a] p-5 hover:border-slate-300 dark:hover:border-white/[0.12] transition-colors">
      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-[#adc6ff]">
        <Trophy className="w-4 h-4" />
        <span>{coach.role}</span>
      </div>
      <div className="pt-1">
        <p className="text-[14px] font-semibold text-slate-900 dark:text-[#f8fafc]">
          {coach.name}
        </p>
        <p className="text-[12px] text-slate-500 dark:text-[#94a3b8] mt-0.5">{coach.title}</p>
      </div>
      {coach.status && (
        <div className="flex items-center justify-between border-t border-slate-100 dark:border-white/[0.06] pt-3 mt-1 text-[11px]">
          <span className="font-mono text-slate-400 dark:text-[#64748b]">Status: {coach.status}</span>
        </div>
      )}
    </div>
  );
}


export default function ReportsPage({
  season = "AY 2026–2027 Season",
  coachId,
  athletes: athletesProp = [], 
  coaches = [],
}: ReportsPageProps) {
  
  const { user } = useAuthStore();
  const currentCoachId = coachId || user?.id;

  const roster = useTeamRoster(currentCoachId);
  const loading = roster.loading;

  const allAthletes = roster.athletes && roster.athletes.length > 0 ? roster.athletes : athletesProp;
  // Same fallback pattern as athletes above — if your hook exposes coaches under
  // a different key, swap `roster.coaches` for that key.
  const allCoaches: CoachRecord[] =
    (roster as any).coaches && (roster as any).coaches.length > 0 ? (roster as any).coaches : coaches;

  const [filter, setFilter] = React.useState<FilterKey>("all");
  const [query, setQuery] = React.useState("");
  
  const [level, setLevel] = React.useState<EducationLevel>("Tertiary");

  // --- Export panel state ---
  const [exportOpen, setExportOpen] = React.useState(false);
  const [exportLevel, setExportLevel] = React.useState<EducationLevel>("Tertiary");
  const [exportFormat, setExportFormat] = React.useState<"pdf" | "docx">("pdf");
  const [isExporting, setIsExporting] = React.useState(false);

  const toggleExportPanel = () => {
    setExportOpen((open) => {
      const next = !open;
      if (next) setExportLevel(level); // default export level to what's on screen
      return next;
    });
  };

  const exportAthletes = React.useMemo(() => {
    return allAthletes.filter((a: any) => {
      const athleteLevel = a.division || "Tertiary";
      return athleteLevel.toLowerCase() === exportLevel.toLowerCase();
    });
  }, [allAthletes, exportLevel]);

  const handleGenerateExport = async () => {
    setIsExporting(true);
    try {
      const args = { athletes: exportAthletes, coaches: allCoaches, level: exportLevel, season };
      if (exportFormat === "pdf") {
        await exportRosterToPdf(args);
      } else {
        await exportRosterToDocx(args);
      }
    } catch (err) {
      console.error("Failed to generate report:", err);
    } finally {
      setIsExporting(false);
    }
  };

  const levelAthletes = React.useMemo(() => {
    return allAthletes.filter((a: any) => {
      const athleteLevel = a.division || "Tertiary";
      return athleteLevel.toLowerCase() === level.toLowerCase();
    });
  }, [allAthletes, level]);

  // Counts are derived from getDisplayEligibility(), NOT the raw `eligibility`
  // field, so they stay in lockstep with what the chips/pills actually show.
  // If this instead re-implemented the "missing/rejected doc" check inline,
  // it would be trivial for the two to silently drift apart after an edit.
  const counts = React.useMemo<Record<FilterKey, number>>(() => {
    const base: Record<FilterKey, number> = {
      all: levelAthletes.length,
      eligible: 0,
      underReview: 0,
      actionRequired: 0,
      ineligible: 0,
    };
    levelAthletes.forEach((athlete: AthleteRecord) => {
      base[getDisplayEligibility(athlete)] += 1;
    });
    return base;
  }, [levelAthletes]);

  const visibleAthletes = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return levelAthletes.filter((athlete: AthleteRecord) => {
      const matchesFilter = filter === "all" || getDisplayEligibility(athlete) === filter;
      const matchesQuery = q.length === 0 || (athlete.name && athlete.name.toLowerCase().includes(q));
      return matchesFilter && matchesQuery;
    });
  }, [levelAthletes, filter, query]);

  return (
    <div className="w-full animate-in fade-in duration-300">
      
      <header className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 mb-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-[26px] font-bold tracking-tight text-slate-900 dark:text-[#f8fafc]">
            Screening Report
          </h2>
          <p className="text-[13px] text-slate-500 dark:text-[#94a3b8] max-w-4xl leading-relaxed mt-1">
            Athlete accreditation roster for the {season} Collegiate Championship. Review submitted credentials and academic compliance.
          </p>
        </div>
        
        <div className="flex items-end gap-3 shrink-0">
          <div className="flex flex-col items-start xl:items-end gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-[#64748b] ml-1 xl:ml-0">
              Education Level
            </span>
            <div className="flex items-center p-1 bg-slate-100 dark:bg-[#0c1324] rounded-xl border border-slate-200 dark:border-white/[0.06]">
              {(["Tertiary", "Secondary", "Elementary"] as EducationLevel[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    setLevel(tab);
                    setFilter("all"); 
                  }}
                  className={cn(
                    "px-5 py-2 text-[12px] font-bold rounded-lg transition-all duration-200 focus:outline-none",
                    level === tab
                      ? "bg-white dark:bg-[#1e293b] text-blue-600 dark:text-[#adc6ff] shadow-sm ring-1 ring-slate-200 dark:ring-white/[0.06]"
                      : "text-slate-500 dark:text-[#94a3b8] hover:text-slate-900 dark:hover:text-[#f8fafc]"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={toggleExportPanel}
            aria-expanded={exportOpen}
            className={cn(
              "h-[42px] gap-2 rounded-xl border px-4 text-[12px] font-bold shadow-sm transition-all",
              exportOpen
                ? "border-blue-300 dark:border-[#adc6ff]/40 bg-blue-50 dark:bg-[#adc6ff]/10 text-blue-600 dark:text-[#adc6ff]"
                : "border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#0f172a] text-slate-700 dark:text-[#f8fafc] hover:border-blue-300 dark:hover:border-[#adc6ff]/30 hover:text-blue-600 dark:hover:text-[#adc6ff]"
            )}
          >
            <Download className="w-4 h-4" />
            Export
            <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-200", exportOpen && "rotate-180")} />
          </Button>
        </div>
      </header>

      {exportOpen && (
        <div className="mb-6 rounded-2xl border border-blue-200/70 dark:border-[#adc6ff]/20 bg-gradient-to-br from-blue-50/70 via-white to-white dark:from-[#0f172a] dark:via-[#0c1324] dark:to-[#0c1324] p-5 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h3 className="text-[14px] font-bold text-slate-900 dark:text-[#f8fafc]">Export Screening Report</h3>
              <p className="text-[12px] text-slate-500 dark:text-[#94a3b8] mt-0.5">
                Pick the division and file type — the file downloads as landscape, long (legal) size.
              </p>
            </div>
            <button
              onClick={() => setExportOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors focus:outline-none"
              aria-label="Close export panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-col md:flex-row md:items-end gap-6">
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-[#64748b]">
                Education Level
              </span>
              <div className="flex items-center p-1 bg-slate-100 dark:bg-[#0c1324] rounded-xl border border-slate-200 dark:border-white/[0.06]">
                {(["Tertiary", "Secondary", "Elementary"] as EducationLevel[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setExportLevel(tab)}
                    className={cn(
                      "px-4 py-2 text-[12px] font-bold rounded-lg transition-all duration-200 focus:outline-none",
                      exportLevel === tab
                        ? "bg-white dark:bg-[#1e293b] text-blue-600 dark:text-[#adc6ff] shadow-sm ring-1 ring-slate-200 dark:ring-white/[0.06]"
                        : "text-slate-500 dark:text-[#94a3b8] hover:text-slate-900 dark:hover:text-[#f8fafc]"
                    )}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-[#64748b]">
                File Format
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setExportFormat("pdf")}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl border text-[12px] font-bold transition-all",
                    exportFormat === "pdf"
                      ? "border-blue-300 dark:border-[#adc6ff]/40 bg-blue-50 dark:bg-[#adc6ff]/10 text-blue-600 dark:text-[#adc6ff]"
                      : "border-slate-200 dark:border-white/[0.06] text-slate-500 dark:text-[#94a3b8] hover:bg-slate-50 dark:hover:bg-white/[0.04]"
                  )}
                >
                  <FileDown className="w-4 h-4" /> PDF
                </button>
                <button
                  onClick={() => setExportFormat("docx")}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl border text-[12px] font-bold transition-all",
                    exportFormat === "docx"
                      ? "border-blue-300 dark:border-[#adc6ff]/40 bg-blue-50 dark:bg-[#adc6ff]/10 text-blue-600 dark:text-[#adc6ff]"
                      : "border-slate-200 dark:border-white/[0.06] text-slate-500 dark:text-[#94a3b8] hover:bg-slate-50 dark:hover:bg-white/[0.04]"
                  )}
                >
                  <FileText className="w-4 h-4" /> Word (.docx)
                </button>
              </div>
            </div>

            <div className="flex md:ml-auto">
              <Button
                onClick={handleGenerateExport}
                disabled={isExporting || exportAthletes.length === 0}
                className="h-[38px] gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 dark:from-[#3b82f6] dark:to-[#2563eb] px-5 text-[12px] font-bold text-white shadow-sm shadow-blue-600/20 hover:shadow-md hover:shadow-blue-600/30 transition-all disabled:opacity-60 disabled:shadow-none"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Generating…
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" /> Generate Report
                  </>
                )}
              </Button>
            </div>
          </div>

          <p className="mt-3 text-[10px] text-slate-400 dark:text-[#64748b]">
            {exportAthletes.length} {exportLevel.toLowerCase()} athlete{exportAthletes.length === 1 ? "" : "s"} will be included
            {allCoaches.length > 0 ? ` · ${allCoaches.length} coaching staff entr${allCoaches.length === 1 ? "y" : "ies"}` : ""}.
          </p>
        </div>
      )}

      <FilterBar
        counts={counts}
        active={filter}
        onChange={setFilter}
        query={query}
        onQueryChange={setQuery}
      />

      <RosterTable 
        athletes={visibleAthletes} 
        total={levelAthletes.length} 
        loading={loading} 
        level={level} 
      />

      {allCoaches.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {allCoaches.map((coach) => (
            <CoachCard key={coach.name} coach={coach} />
          ))}
        </div>
      )}
    </div>
  );
}