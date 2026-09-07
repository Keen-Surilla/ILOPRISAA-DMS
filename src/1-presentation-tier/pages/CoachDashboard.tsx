// src/1-presentation-tier/pages/CoachDashboard.tsx
import React, { useMemo, useState, useEffect, Suspense, lazy } from 'react';
import {
  Calendar, Users, LayoutDashboard, Settings, Clock, ClipboardCheck, Bell,
  CheckCircle2, UserCircle, FileText, Archive,
  ShieldCheck, AlertTriangle, Search, ChevronRight, ChevronLeft, XCircle, UploadCloud, Send,
  Sun, Moon,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../2-application-tier/stores/authStore';
import { useThemeStore } from '../../2-application-tier/stores/themeStore';
import { teamApi } from '../../3-data-tier/api/teamApi';
import { documentsApi, TOTAL_REQUIRED_DOCUMENTS } from '../../3-data-tier/api/documentsApi';
import { listEvents } from '../../3-data-tier/services/eventService';
import { PortalShell } from '../components/layout/PortalShell';
import { DocumentChecklistModal } from '../components/ui/DocumentChecklistModal';
import ReportsPage from './coach-views/Reports';

// Lazy Load other tabs
const TeamView = React.lazy(() => import('./coach-views/TeamView'));
const ScheduleView = lazy(() => import('./coach-views/ScheduleView'));
const SettingsView = lazy(() => import('./coach-views/SettingsView'));
const ArchivedTeamView = lazy(() => import('./coach-views/ArchivedTeamView'));
const ResourceTabs = lazy(() => import('./coach-views/ResourceTabs'));
const CoachProfileForm = lazy(() => import('./coach-views/CoachProfileForm'));
const ScreeningSubmissions = lazy(() => import('./coach-views/ScreeningSubmissions'));//

const fontImport = "@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap');";

function SkeletonBlock({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-white/[0.06] ${className}`} />;
}

function SkeletonRows({ count = 3 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <SkeletonBlock className="w-10 h-10 rounded-xl shrink-0" />
          <div className="flex-1 flex flex-col gap-2">
            <SkeletonBlock className="h-3 w-1/3" />
            <SkeletonBlock className="h-2 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ProgressBar({
  value,
  colorClass = 'bg-blue-600 dark:bg-[#adc6ff]',
  trackClass = 'bg-slate-100 dark:bg-[#23293c]',
  className = '',
}: { value: number; colorClass?: string; trackClass?: string; className?: string }) {
  const pct = Math.min(100, Math.max(0, Number.isFinite(value) ? value : 0));
  return (
    <div className={`w-full h-1.5 rounded-full overflow-hidden ${trackClass} ${className}`}>
      <div
        className={`h-full rounded-full transition-all duration-500 ease-out ${colorClass}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function SectionCard({
  title,
  eyebrow,
  subtitle,
  icon,
  iconWrapClass = 'bg-white/5 text-blue-600 dark:text-[#adc6ff]',
  action,
  children,
  className = '',
  bodyClassName = '',
}: {
  title?: string;
  eyebrow?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  iconWrapClass?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <div className={`bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/[0.06] rounded-2xl ${className}`}>
      {(title || action) && (
        <div className="flex items-start justify-between gap-3 px-6 pt-6">
          <div className="flex items-start gap-2.5 min-w-0">
            {icon && (
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconWrapClass}`}>
                {icon}
              </div>
            )}
            <div className="min-w-0">
              {eyebrow && (
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-[#4edea3] mb-0.5">{eyebrow}</p>
              )}
              {title && <h3 className="text-[15px] font-semibold text-slate-900 dark:text-[#f8fafc]">{title}</h3>}
              {subtitle && <p className="text-[12px] text-slate-500 dark:text-[#94a3b8] mt-1 max-w-lg leading-relaxed">{subtitle}</p>}
            </div>
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className={`p-6 ${title || action ? 'pt-4' : ''} ${bodyClassName}`}>{children}</div>
    </div>
  );
}

function FilterTabs({
  options,
  active,
  onChange,
}: {
  options: { key: string; label: string; count: number }[];
  active: string;
  onChange: (key: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {options.map((opt) => (
        <button
          key={opt.key}
          onClick={() => onChange(opt.key)}
          className={`px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-wide transition-colors ${
            active === opt.key
              ? 'bg-blue-50 dark:bg-[#adc6ff]/15 text-blue-600 dark:text-[#adc6ff]'
              : 'bg-slate-50 dark:bg-[#151b2d] text-slate-500 dark:text-[#94a3b8] hover:text-slate-900 dark:hover:text-[#f8fafc] hover:bg-slate-50 dark:hover:bg-[#191f31]'
          }`}
        >
          {opt.label} ({opt.count})
        </button>
      ))}
    </div>
  );
}

function shortLabel(label: string, maxWords = 3) {
  const words = label.split(' ');
  return words.length <= maxWords ? label : words.slice(0, maxWords).join(' ');
}

interface KpiCardProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  meta?: string;
  metaTone?: 'up' | 'warn' | 'neutral';
  progress?: number;
  progressColor?: string;
  iconColorClass?: string;
  iconBgClass?: string;
}

function KpiCard({
  icon,
  label,
  value,
  meta,
  metaTone = 'neutral',
  progress,
  progressColor = 'bg-blue-600 dark:bg-[#adc6ff]',
  iconColorClass = 'text-blue-600 dark:text-[#adc6ff]',
  iconBgClass = 'bg-blue-50 dark:bg-[#adc6ff]/10',
}: KpiCardProps) {
  const metaColor =
    metaTone === 'up' ? 'text-emerald-600 dark:text-[#4edea3]' : metaTone === 'warn' ? 'text-[#f59e0b]' : 'text-[#64748b]';
  return (
    <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/[0.06] rounded-2xl p-5 flex flex-col justify-between gap-4 hover:border-slate-300 dark:hover:border-white/[0.12] transition-colors">
      <div className="flex items-start justify-between gap-3">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748b]">{label}</span>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconBgClass} ${iconColorClass}`}>
          {icon}
        </div>
      </div>
      <div>
        <p className="text-[30px] font-bold leading-none tracking-tight text-slate-900 dark:text-[#f8fafc]">{value}</p>
        {typeof progress === 'number' ? (
          <div className="mt-3">
            <ProgressBar value={progress} colorClass={progressColor} />
          </div>
        ) : meta ? (
          <p className={`text-[12px] font-semibold mt-2 ${metaColor}`}>{meta}</p>
        ) : (
          <div className="h-[8px] mt-2" />
        )}
      </div>
    </div>
  );
}

function DonutChart({
  segments,
  centerValue,
  centerLabel,
}: {
  segments: { value: number; color: string; label: string }[];
  centerValue: string;
  centerLabel: string;
}) {
  const total = segments.reduce((s, seg) => s + Math.max(0, seg.value), 0) || 1;
  let cumulative = 0;

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="relative w-36 h-36 shrink-0">
        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
          <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#23293c" strokeWidth="3.2" />
          {segments.map((seg, i) => {
            const pct = (Math.max(0, seg.value) / total) * 100;
            const dashOffset = -cumulative;
            cumulative += pct;
            if (pct <= 0) return null;
            return (
              <circle
                key={i}
                cx="18"
                cy="18"
                r="15.9155"
                fill="none"
                stroke={seg.color}
                strokeWidth="3.6"
                strokeDasharray={`${pct} ${100 - pct}`}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-slate-900 dark:text-[#f8fafc]">{centerValue}</span>
          <span className="text-[9px] font-bold uppercase tracking-wider text-[#64748b] mt-0.5">{centerLabel}</span>
        </div>
      </div>
      <div className="w-full flex flex-col gap-2">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#151b2d]">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
              <span className="text-[12px] text-slate-500 dark:text-[#c2c6d6] truncate">{seg.label}</span>
            </div>
            <span className="text-[12px] font-semibold text-slate-900 dark:text-[#f8fafc] shrink-0 ml-2">
              {seg.value}
              <span className="text-[#64748b] font-normal"> ({total ? Math.round((Math.max(0, seg.value) / total) * 100) : 0}%)</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

type DocDetailStatus = 'verified' | 'pending' | 'missing' | 'rejected';
interface DocDetail {
  label: string;
  group?: string;
  status: DocDetailStatus;
  note?: string;
}

// EXACT MATCH TO USER'S NEW 8-ITEM REQUIREMENTS
const CHECKLIST_FALLBACK: string[] = [
  'Birth Certificate (Copy 1)',
  'Birth Certificate (Copy 2)',
  'Data Privacy Consent',
  'Parent/Guardian Waiver',
  'TOR (1st Semester)',
  'TOR (2nd Semester)',
  'Medical Clearance (Copy 1)',
  'Medical Clearance (Copy 2)',
];

const REQUIRED_DOCUMENT_TYPES: string[] =
  Array.isArray((documentsApi as any).REQUIRED_DOCUMENT_TYPES) && (documentsApi as any).REQUIRED_DOCUMENT_TYPES.length > 0
    ? (documentsApi as any).REQUIRED_DOCUMENT_TYPES
    : CHECKLIST_FALLBACK;

// The individual document chip does NOT have the upload button anymore
function DocumentChip({ label, status, note }: DocDetail) {
  const styles: Record<DocDetailStatus, { icon: React.ReactNode; text: string }> = {
    verified: { icon: <CheckCircle2 className="w-4 h-4" />, text: 'text-[#10b981]' },
    pending: { icon: <Clock className="w-4 h-4" />, text: 'text-[#f59e0b]' },
    missing: { icon: <XCircle className="w-4 h-4" />, text: 'text-[#f43f5e]' },
    rejected: { icon: <AlertTriangle className="w-4 h-4" />, text: 'text-[#f43f5e]' },
  };
  const s = styles[status] ?? styles.missing;
  return (
    <div className="flex items-start justify-between gap-2.5 p-2.5 rounded-lg bg-white dark:bg-[#0f172a]">
      <div className="flex items-start gap-2.5 min-w-0">
        <span className={`shrink-0 mt-0.5 ${s.text}`}>{s.icon}</span>
        <div className="min-w-0">
          <p className="text-[12px] font-semibold text-slate-900 dark:text-[#f8fafc] leading-snug">{label}</p>
          {note && <p className={`text-[11px] mt-0.5 leading-snug ${s.text}`}>{note}</p>}
        </div>
      </div>
    </div>
  );
}

function AttentionAthleteCard({
  athlete,
  total,
  details,
  activeFilter,
  onReview,
}: {
  athlete: { id: string; name: string; completed: number; sport?: string };
  total: number;
  details?: DocDetail[];
  activeFilter?: string;
  onReview: () => void;
}) {
  const pct = total > 0 ? Math.round((athlete.completed / total) * 100) : 0;
  const initials = athlete.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
  const urgent = pct < 50;

  const extra = athlete as Record<string, any>;
  
  // Removed jersey number as requested
  const badges = [
    [extra.sport, extra.position].filter(Boolean).join(' • ') || null,
  ].filter(Boolean) as string[];
  
  const subline = [extra.student_id, extra.year_level, extra.course].filter(Boolean).join(' • ');

  const knownDetails = details ?? [];
  const isFilterActive = !!activeFilter && activeFilter !== 'all';
  const scopedDetails = isFilterActive
    ? knownDetails.filter((d) => (d.group ?? d.label) === activeFilter)
    : knownDetails;

  const knownOutstanding = scopedDetails.filter((d) => d.status !== 'verified');
  const verifiedLabels = knownDetails.filter((d) => d.status === 'verified').map((d) => d.label);
  const isFlagged = knownDetails.some((d) => d.status === 'rejected');

  const missingCount = isFilterActive ? knownOutstanding.length : Math.max(0, total - athlete.completed);

  const accountedLabels = new Set(knownDetails.map((d) => d.label.toLowerCase()));
  const candidatePool = REQUIRED_DOCUMENT_TYPES.filter((t) => !accountedLabels.has(t.toLowerCase()));
  const unnamedGap = isFilterActive ? 0 : Math.max(0, missingCount - knownOutstanding.length);
  const inferredMissing: DocDetail[] = isFilterActive
    ? []
    : candidatePool.slice(0, unnamedGap).map((label) => ({
        label,
        status: 'missing',
        note: 'Not yet uploaded',
      }));
  const remainingGap = isFilterActive ? 0 : Math.max(0, unnamedGap - inferredMissing.length);
  const outstanding = [...knownOutstanding, ...inferredMissing];

  const uploadLabel =
    outstanding.length === 1 && remainingGap === 0 ? `Upload ${shortLabel(outstanding[0].label)}` : 'Upload Missing';

  return (
    <div className="bg-slate-50 dark:bg-[#151b2d] rounded-xl p-4 flex flex-col gap-4 hover:bg-slate-50 dark:hover:bg-[#191f31] transition-colors">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-[13px] shrink-0 ${
              isFlagged ? 'bg-[#f43f5e]/10 text-[#f43f5e]' : 'bg-slate-100 dark:bg-[#1e293b] text-blue-600 dark:text-[#adc6ff]'
            }`}
          >
            {initials}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-[13px] font-semibold text-slate-900 dark:text-[#f8fafc]">{athlete.name}</p>
              {badges.map((b, i) => (
                <span key={i} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#1e293b] text-slate-500 dark:text-[#94a3b8] text-[10px] font-semibold shrink-0">
                  {b}
                </span>
              ))}
              {isFlagged && (
                <span className="px-2 py-0.5 rounded bg-[#f43f5e]/10 text-[#f43f5e] text-[9px] font-bold uppercase tracking-wide shrink-0">
                  Committee Flagged
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#64748b] truncate">{subline || `${athlete.completed}/${total} documents on file`}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex flex-col items-end gap-1 w-32">
            <span className={`text-[11px] font-bold whitespace-nowrap ${urgent ? 'text-[#f43f5e]' : 'text-[#f59e0b]'}`}>
              {athlete.completed}/{total} Uploaded ({pct}%)
            </span>
            <ProgressBar value={pct} colorClass={urgent ? 'bg-[#f43f5e]' : 'bg-[#f59e0b]'} />
          </div>
          {/* Main Upload Button Restored Here */}
          <button
            onClick={onReview}
            className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3.5 py-2 rounded-full bg-blue-50 dark:bg-[#adc6ff]/15 text-blue-600 dark:text-[#adc6ff] hover:bg-blue-100 dark:hover:bg-[#adc6ff]/25 transition-colors whitespace-nowrap"
          >
            <UploadCloud className="w-3.5 h-3.5" /> {uploadLabel}
          </button>
        </div>
      </div>

      {(outstanding.length > 0 || remainingGap > 0) && (
        <div className="bg-white dark:bg-[#0c1324] rounded-lg p-3.5 flex flex-col gap-2.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748b]">
            Immediate Documents Required ({missingCount})
          </span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {outstanding.map((d, i) => (
              <DocumentChip key={i} label={d.label} status={d.status} note={d.note} />
            ))}
            {remainingGap > 0 && (
              <button
                onClick={onReview}
                className="flex items-center justify-between gap-2.5 p-2.5 rounded-lg bg-white dark:bg-[#0f172a] hover:bg-slate-50 dark:hover:bg-[#191f31] transition-colors text-left"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <XCircle className="w-4 h-4 text-[#f43f5e] shrink-0" />
                  <p className="text-[12px] font-semibold text-slate-900 dark:text-[#f8fafc]">
                    +{remainingGap} more document{remainingGap === 1 ? '' : 's'} required
                  </p>
                </div>
                <span className="text-[10px] font-bold text-blue-600 dark:text-[#adc6ff] shrink-0 whitespace-nowrap">View checklist</span>
              </button>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-0.5">
        <span className="text-[11px] text-[#64748b] truncate">
          {verifiedLabels.length > 0 ? `Verified On File: ${verifiedLabels.join(', ')}` : '\u00A0'}
        </span>
        <button className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-blue-600 dark:text-[#adc6ff] hover:underline shrink-0">
          <Send className="w-3 h-3" /> Notify Student via SMS/Email
        </button>
      </div>
    </div>
  );
}

function TimelineItem({ event, isLast }: { event: any; isLast: boolean }) {
  const date = event?.event_date ? new Date(event.event_date) : null;
  return (
    <div className="flex items-start gap-3.5">
      <div className="flex flex-col items-center mt-1">
        <span className="w-2.5 h-2.5 rounded-full bg-blue-600 dark:bg-[#adc6ff] shrink-0 ring-4 ring-blue-100 dark:ring-[#adc6ff]/15" />
        {!isLast && <span className="w-px flex-1 bg-slate-100 dark:bg-[#23293c] mt-1.5 min-h-[26px]" />}
      </div>
      <div className="flex flex-col gap-0.5 pb-5 min-w-0">
        <span className="text-[10px] font-bold text-blue-600 dark:text-[#adc6ff] uppercase tracking-wider">
          {date ? date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'TBD'}
          {event?.event_time ? ` · ${event.event_time}` : ''}
        </span>
        <span className="text-[13px] font-semibold text-slate-900 dark:text-[#f8fafc] truncate">{event?.title}</span>
        {event?.type && <span className="text-[11px] text-[#64748b]">{event.type}</span>}
      </div>
    </div>
  );
}

function DashboardUI() {
  const { user } = useAuthStore();
  const coachId = user?.id;
  const [docsAthlete, setDocsAthlete] = useState<{ id: string; name: string } | null>(null);

  // Pagination State for Athletes Needing Attention
  const [currentPage, setCurrentPage] = useState(1);
  const athletesPerPage = 3;

  // Data Fetching
  const { data: athletes = [], isLoading: isLoadingAthletes } = useQuery({
    queryKey: ['teamMembers', coachId],
    queryFn: () => teamApi.getTeamMembers(coachId as string),
    enabled: !!coachId,
    select: (data) => data.filter((m) => m.status === 'active'),
  });
  const athleteIds = useMemo(() => athletes.map((a) => a.id), [athletes]);
  const { data: documentCounts = {}, isLoading: isLoadingDocCounts } = useQuery({
    queryKey: ['documentCounts', coachId, athleteIds],
    queryFn: () => documentsApi.getDocumentCountsForAthletes(athleteIds),
    enabled: athleteIds.length > 0,
  });
  const { data: statusCounts = {}, isLoading: isLoadingStatusCounts } = useQuery({
    queryKey: ['documentStatusCounts', coachId, athleteIds],
    queryFn: () => documentsApi.getDocumentStatusCounts(athleteIds),
    enabled: athleteIds.length > 0,
  });
  const { data: events = [], isLoading: isLoadingEvents } = useQuery({
    queryKey: ['events', coachId],
    queryFn: () => listEvents({ userId: coachId }),
    enabled: !!coachId,
    staleTime: 30_000,
  });

  const isLoading = isLoadingAthletes || isLoadingDocCounts || isLoadingStatusCounts || isLoadingEvents;

  const incompleteAthleteIds = useMemo(
    () => athletes.filter((a) => (documentCounts[a.id] ?? 0) < TOTAL_REQUIRED_DOCUMENTS).map((a) => a.id),
    [athletes, documentCounts],
  );
  
  const { data: documentDetails = {} } = useQuery({
    queryKey: ['documentDetails', coachId, incompleteAthleteIds],
    queryFn: () => documentsApi.getDocumentDetailsForAthletes(incompleteAthleteIds),
    enabled: incompleteAthleteIds.length > 0 && typeof (documentsApi as any).getDocumentDetailsForAthletes === 'function',
  });

  const totalAthletes = athletes.length;
  const totalRequiredSlots = totalAthletes * TOTAL_REQUIRED_DOCUMENTS;
  const athletesFullyComplete = athletes.filter((a) => (documentCounts[a.id] ?? 0) === TOTAL_REQUIRED_DOCUMENTS).length;
  const verifiedCount = (statusCounts as Record<string, number>)['verified'] ?? 0;
  const pendingReviews = statusCounts['pending_review'] ?? 0;
  const flaggedCount = (statusCounts as Record<string, number>)['rejected'] ?? 0;
  const missingDocs = Math.max(0, totalRequiredSlots - verifiedCount - pendingReviews - flaggedCount);
  const incompleteAthletes = Math.max(0, totalAthletes - athletesFullyComplete);
  const actionNeededDocs = missingDocs + flaggedCount;
  const eligiblePct = totalAthletes > 0 ? Math.round((athletesFullyComplete / totalAthletes) * 100) : 0;

  const upcomingEventsList = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return events.filter((e) => e?.event_date && new Date(e.event_date) >= today).slice(0, 5);
  }, [events]);

  const allAthletesNeedingAttention = useMemo(() => {
    return athletes
      .map((a) => ({ ...a, completed: documentCounts[a.id] ?? 0 }))
      .filter((a) => a.completed < TOTAL_REQUIRED_DOCUMENTS)
      .sort((a, b) => a.completed - b.completed);
  }, [athletes, documentCounts]);

  const clearedAthletes = useMemo(() => {
    return athletes
      .filter((a) => (documentCounts[a.id] ?? 0) === TOTAL_REQUIRED_DOCUMENTS)
      .slice(0, 4);
  }, [athletes, documentCounts]);

  const newAthletesThisWeek = useMemo(() => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return athletes.filter((a) => a.created_at && new Date(a.created_at) >= weekAgo).length;
  }, [athletes]);

  const nextDeadline = upcomingEventsList[0];

  const [docFilter, setDocFilter] = useState('all');

  // When filter changes, reset to page 1
  const handleFilterChange = (key: string) => {
    setDocFilter(key);
    setCurrentPage(1);
  };

  const outstandingByGroup = useMemo(() => {
    const map = new Map<string, number>();
    allAthletesNeedingAttention.forEach((a) => {
      const items = (documentDetails as Record<string, DocDetail[]>)[a.id] ?? [];
      const groups = new Set(items.filter((d) => d.status !== 'verified').map((d) => d.group ?? d.label));
      groups.forEach((group) => map.set(group, (map.get(group) ?? 0) + 1));
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [allAthletesNeedingAttention, documentDetails]);

  // Committee rejections across the whole roster, as a direct action feed —
  // "Athlete: Document Rejected - reason" — instead of a passive tracker.
  const urgentRemarks = useMemo(() => {
    const list: { athleteId: string; athleteName: string; label: string; note?: string }[] = [];
    incompleteAthleteIds.forEach((id) => {
      const items = (documentDetails as Record<string, DocDetail[]>)[id] ?? [];
      const athlete = athletes.find((a) => a.id === id);
      items.forEach((d) => {
        if (d.status === 'rejected') {
          list.push({ athleteId: id, athleteName: athlete?.name ?? 'Unknown Athlete', label: d.label, note: d.note });
        }
      });
    });
    return list;
  }, [incompleteAthleteIds, documentDetails, athletes]);

  // Total missing document INSTANCES per group across the whole incomplete
  // roster (both copies count separately) — tells the coach exactly which
  // forms to print and how many, e.g. "18 Waivers", "15 Medical Clearances".
  const bottleneckByGroup = useMemo(() => {
    const map = new Map<string, number>();
    incompleteAthleteIds.forEach((id) => {
      const items = (documentDetails as Record<string, DocDetail[]>)[id] ?? [];
      items.forEach((d) => {
        if (d.status !== 'verified') {
          const key = d.group ?? d.label;
          map.set(key, (map.get(key) ?? 0) + 1);
        }
      });
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [incompleteAthleteIds, documentDetails]);
  const maxBottleneckCount = bottleneckByGroup[0]?.[1] ?? 0;

  const totalMissingDocCount = useMemo(
    () =>
      athletes.reduce((sum, a) => {
        const completed = documentCounts[a.id] ?? 0;
        return completed < TOTAL_REQUIRED_DOCUMENTS ? sum + (TOTAL_REQUIRED_DOCUMENTS - completed) : sum;
      }, 0),
    [athletes, documentCounts],
  );

  const filterOptions = useMemo(
    () => [
      { key: 'all', label: 'All Incomplete', count: totalMissingDocCount },
      ...outstandingByGroup.map(([group, count]) => ({ key: group, label: shortLabel(group, 3), count })),
    ],
    [totalMissingDocCount, outstandingByGroup],
  );

  const filteredAttentionAthletes = useMemo(() => {
    if (docFilter === 'all') return allAthletesNeedingAttention;
    return allAthletesNeedingAttention.filter((a) => {
      const items = (documentDetails as Record<string, DocDetail[]>)[a.id] ?? [];
      return items.some((d) => d.status !== 'verified' && (d.group ?? d.label) === docFilter);
    });
  }, [allAthletesNeedingAttention, documentDetails, docFilter]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredAttentionAthletes.length / athletesPerPage) || 1;
  const paginatedAthletes = useMemo(() => {
    const start = (currentPage - 1) * athletesPerPage;
    return filteredAttentionAthletes.slice(start, start + athletesPerPage);
  }, [filteredAttentionAthletes, currentPage]);

  return (
    <div className="animate-in fade-in duration-300">
      <style>{fontImport}</style>

      {/* Header */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-[#4edea3]">
              Coach Operations &amp; Eligibility
            </span>
            <span className="w-1 h-1 rounded-full bg-slate-200 dark:bg-[#334155]" />
            <span className="text-[11px] font-medium text-[#64748b]">Current Season</span>
          </div>
          <h2 className="text-[26px] font-bold tracking-tight text-slate-900 dark:text-[#f8fafc]">Overview</h2>
          <p className="text-[13px] text-slate-500 dark:text-[#94a3b8]">An at-a-glance view of your team's document readiness.</p>
        </div>
      </header>

      {/* Action banner */}
      {!isLoading && (incompleteAthletes > 0 || nextDeadline) && (
        <div className="w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/[0.06] rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 relative overflow-hidden">
          <div className="absolute -left-10 -top-10 w-40 h-40 bg-blue-50 dark:bg-[#adc6ff]/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center gap-4 relative z-10 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-[#f59e0b]/10 flex items-center justify-center text-[#f59e0b] shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-[12px] font-bold uppercase tracking-wide text-[#f59e0b]">
                {incompleteAthletes > 0 ? `${incompleteAthletes} Athlete${incompleteAthletes === 1 ? '' : 's'} Need Attention` : 'Roster Fully Cleared'}
              </span>
              <p className="text-[13px] text-slate-500 dark:text-[#94a3b8] truncate">
                {nextDeadline
                  ? `Next milestone: ${nextDeadline.title} — ${new Date(nextDeadline.event_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`
                  : 'No upcoming milestones scheduled.'}
              </p>
            </div>
          </div>
          {incompleteAthletes > 0 && (
            <a
              href="#attention-section"
              className="px-5 py-2.5 rounded-full bg-[#f59e0b] text-[#0c1324] text-[13px] font-bold hover:brightness-105 transition-all shrink-0 relative z-10"
            >
              Resolve Now
            </a>
          )}
        </div>
      )}

      {/* KPI deck */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <KpiCard
          icon={<Users className="w-4 h-4" />}
          label="Total Athletes"
          value={isLoading ? '—' : totalAthletes}
          meta={newAthletesThisWeek > 0 ? `+${newAthletesThisWeek} this week` : 'No new athletes this week'}
          metaTone={newAthletesThisWeek > 0 ? 'up' : 'neutral'}
          iconColorClass="text-blue-600 dark:text-[#adc6ff]"
          iconBgClass="bg-blue-50 dark:bg-[#adc6ff]/10"
        />
        <KpiCard
          icon={<ShieldCheck className="w-4 h-4" />}
          label="Tournament Eligible"
          value={isLoading ? '—' : `${athletesFullyComplete}/${totalAthletes}`}
          progress={isLoading ? 0 : eligiblePct}
          progressColor="bg-[#10b981]"
          iconColorClass="text-blue-600 dark:text-[#adc6ff]"
          iconBgClass="bg-blue-50 dark:bg-[#adc6ff]/10"
        />
        <KpiCard
          icon={<AlertTriangle className="w-4 h-4" />}
          label="Action Needed"
          value={isLoading ? '—' : actionNeededDocs}
          meta={
            isLoading
              ? undefined
              : actionNeededDocs > 0
                ? `Across ${incompleteAthletes} athlete${incompleteAthletes === 1 ? '' : 's'}`
                : 'Everyone is cleared'
          }
          metaTone={actionNeededDocs > 0 ? 'warn' : 'up'}
          iconColorClass="text-blue-600 dark:text-[#adc6ff]"
          iconBgClass="bg-blue-50 dark:bg-[#adc6ff]/10"
        />
        <KpiCard
          icon={<ClipboardCheck className="w-4 h-4" />}
          label="Screening Review Queue"
          value={isLoading ? '—' : pendingReviews}
          meta="Under committee review"
          metaTone="neutral"
          iconColorClass="text-blue-600 dark:text-[#adc6ff]"
          iconBgClass="bg-blue-50 dark:bg-[#adc6ff]/10"
        />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* LEFT column */}
        <section className="xl:col-span-8 flex flex-col gap-6" id="attention-section">
          {!isLoading && urgentRemarks.length > 0 && (
            <SectionCard
              eyebrow="Action Queue"
              title="Urgent Committee Remarks"
              icon={<AlertTriangle className="w-4 h-4" />}
              iconWrapClass="bg-[#f43f5e]/10 text-[#f43f5e]"
              action={
                <span className="px-3.5 py-1.5 rounded-full bg-[#f43f5e] text-white text-[11px] font-bold whitespace-nowrap">
                  {urgentRemarks.length} Rejected
                </span>
              }
            >
              <div className="flex flex-col divide-y divide-slate-100 dark:divide-white/[0.06]">
                {urgentRemarks.map((r, i) => (
                  <button
                    key={`${r.athleteId}-${r.label}-${i}`}
                    onClick={() => setDocsAthlete({ id: r.athleteId, name: r.athleteName })}
                    className="flex items-start gap-3 py-3 text-left first:pt-0 last:pb-0 group"
                  >
                    <span className="mt-0.5 w-6 h-6 rounded-full bg-[#f43f5e]/10 text-[#f43f5e] flex items-center justify-center shrink-0">
                      <XCircle className="w-3.5 h-3.5" />
                    </span>
                    <span className="text-[13px] leading-snug">
                      <span className="font-bold text-slate-900 dark:text-[#f8fafc]">{r.athleteName}</span>
                      <span className="text-slate-500 dark:text-[#94a3b8]">: {r.label} Rejected</span>
                      {r.note ? <span className="text-slate-500 dark:text-[#94a3b8]"> — {r.note}</span> : null}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400 dark:text-[#64748b] ml-auto shrink-0 mt-0.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                ))}
              </div>
            </SectionCard>
          )}

          <SectionCard
            icon={<AlertTriangle className="w-4 h-4" />}
            iconWrapClass="bg-[#f59e0b]/10 text-[#f59e0b]"
            title="Athletes with Missing Documents & Immediate Action Required"
            subtitle="Specific missing credentials per athlete. Documents must be verified before PRISAA biometric ID issuance."
            action={
              <span className="px-3.5 py-1.5 rounded-full bg-[#f59e0b] text-[#0c1324] text-[11px] font-bold whitespace-nowrap">
                {isLoading ? '—' : incompleteAthletes} Incomplete Athletes
              </span>
            }
          >
            {!isLoading && allAthletesNeedingAttention.length > 0 && (
              <div className="mb-4">
                <FilterTabs options={filterOptions} active={docFilter} onChange={handleFilterChange} />
              </div>
            )}
            {isLoading ? (
              <SkeletonRows count={3} />
            ) : allAthletesNeedingAttention.length === 0 ? (
              <div className="py-6 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-[#4edea3] mx-auto mb-2" />
                <p className="text-[13px] text-slate-500 dark:text-[#94a3b8]">Everyone on the roster is fully documented.</p>
              </div>
            ) : filteredAttentionAthletes.length === 0 ? (
              <p className="text-[13px] text-[#64748b] py-6 text-center">No athletes match this filter.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {paginatedAthletes.map((a) => (
                  <AttentionAthleteCard
                    key={a.id}
                    athlete={a as any}
                    total={TOTAL_REQUIRED_DOCUMENTS}
                    details={(documentDetails as Record<string, DocDetail[]>)[a.id]}
                    activeFilter={docFilter}
                    onReview={() => setDocsAthlete({ id: a.id, name: a.name })}
                  />
                ))}

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between border-t border-slate-200 dark:border-white/[0.06] pt-4 mt-2">
                    <span className="text-[11px] font-medium text-slate-500 dark:text-[#94a3b8]">
                      Showing page <span className="font-bold text-slate-900 dark:text-white">{currentPage}</span> of <span className="font-bold text-slate-900 dark:text-white">{totalPages}</span>
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                        disabled={currentPage === 1}
                        className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-[#94a3b8] dark:hover:bg-white/[0.06] disabled:opacity-30 transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-7 h-7 rounded-lg text-[11px] font-bold transition-colors ${
                            currentPage === pageNum
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'text-slate-600 dark:text-[#94a3b8] hover:bg-slate-100 dark:hover:bg-white/[0.06]'
                          }`}
                        >
                          {pageNum}
                        </button>
                      ))}

                      <button
                        onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-[#94a3b8] dark:hover:bg-white/[0.06] disabled:opacity-30 transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="Tournament-Ready Cleared Athletes"
            icon={<CheckCircle2 className="w-4 h-4" />}
            action={
              <span className="text-[11px] font-bold text-emerald-600 dark:text-[#4edea3] tracking-wide shrink-0">
                {isLoading ? '—' : `${athletesFullyComplete} OF ${totalAthletes} CLEARED`}
              </span>
            }
          >
            {isLoading ? (
              <SkeletonRows count={3} />
            ) : clearedAthletes.length === 0 ? (
              <p className="text-[13px] text-[#64748b] py-4">No athletes have cleared the full checklist yet.</p>
            ) : (
              <div className="overflow-x-auto -mx-2">
                <table className="w-full text-left text-[13px]">
                  <thead>
                    <tr className="text-[#64748b] text-[10px] font-bold uppercase tracking-wider border-b border-slate-200 dark:border-white/[0.06]">
                      <th className="py-2.5 px-2">Athlete</th>
                      <th className="py-2.5 px-2">Dossier</th>
                      <th className="py-2.5 px-2 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {clearedAthletes.map((a) => (
                      <tr key={a.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-2 font-semibold text-slate-900 dark:text-[#f8fafc]">{a.name}</td>
                        <td className="py-3 px-2 text-slate-500 dark:text-[#94a3b8] font-mono text-[12px]">
                          {TOTAL_REQUIRED_DOCUMENTS}/{TOTAL_REQUIRED_DOCUMENTS} Complete
                        </td>
                        <td className="py-3 px-2 text-right">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#10b981]/10 text-[#10b981] text-[11px] font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" /> CLEARED
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {!isLoading && athletesFullyComplete > clearedAthletes.length && (
              <button className="mt-3 text-[12px] font-bold text-blue-600 dark:text-[#adc6ff] hover:underline flex items-center gap-1">
                View all cleared athletes <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </SectionCard>
        </section>

        {/* RIGHT column */}
        <aside className="xl:col-span-4 flex flex-col gap-6">
          <SectionCard title="Document Portfolio Status" icon={<FileText className="w-4 h-4" />}>
            {isLoading ? (
              <div className="flex justify-center py-4">
                <SkeletonBlock className="w-36 h-36 rounded-full" />
              </div>
            ) : totalAthletes === 0 ? (
              <p className="text-[13px] text-[#64748b] text-center py-6">No athletes on the roster yet.</p>
            ) : (
              <DonutChart
                centerValue={`${totalRequiredSlots ? Math.round((verifiedCount / totalRequiredSlots) * 100) : 0}%`}
                centerLabel="Verified"
                segments={[
                  { value: verifiedCount, color: '#10b981', label: 'Verified & Signed' },
                  { value: pendingReviews, color: '#adc6ff', label: 'In Screening Review' },
                  { value: missingDocs, color: '#f59e0b', label: 'Missing / Awaiting Upload' },
                  { value: flaggedCount, color: '#f43f5e', label: 'Flagged / Needs Correction' },
                ]}
              />
            )}
          </SectionCard>

          <SectionCard eyebrow="Bottleneck Tracker" title="Top Missing Documents" icon={<FileText className="w-4 h-4" />}>
            {isLoading ? (
              <SkeletonRows count={4} />
            ) : bottleneckByGroup.length === 0 ? (
              <p className="text-[13px] text-[#64748b] text-center py-6">No documents outstanding — roster is fully cleared.</p>
            ) : (
              <div className="flex flex-col gap-3.5">
                {bottleneckByGroup.map(([group, count]) => (
                  <div key={group}>
                    <div className="flex items-center justify-between text-[13px] mb-1.5">
                      <span className="font-semibold text-slate-900 dark:text-[#f8fafc]">{group}</span>
                      <span className="font-bold text-[#f59e0b]">{count} missing</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 dark:bg-[#1e293b] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#f59e0b]"
                        style={{ width: `${maxBottleneckCount ? Math.max(4, (count / maxBottleneckCount) * 100) : 0}%` }}
                      />
                    </div>
                  </div>
                ))}
                <p className="text-[11px] text-[#64748b] pt-1">
                  Print a stack of the top items above and hand them out at the next practice.
                </p>
              </div>
            )}
          </SectionCard>

          <SectionCard title="Upcoming Milestones" icon={<Calendar className="w-4 h-4" />}>
            {isLoading ? (
              <SkeletonRows count={3} />
            ) : upcomingEventsList.length === 0 ? (
              <p className="text-[13px] text-[#64748b] py-4">Nothing scheduled.</p>
            ) : (
              <div className="flex flex-col">
                {upcomingEventsList.map((evt, i) => (
                  <TimelineItem key={evt.id} event={evt} isLast={i === upcomingEventsList.length - 1} />
                ))}
              </div>
            )}
          </SectionCard>
        </aside>
      </div>

      <DocumentChecklistModal
        isOpen={docsAthlete !== null}
        athleteId={docsAthlete?.id ?? null}
        athleteName={docsAthlete?.name ?? ''}
        coachUserId={coachId ?? ''}
        onClose={() => setDocsAthlete(null)}
      />
    </div>
  );
}

export default function CoachDashboard() {
  const { user } = useAuthStore();
  const { isDark, toggleTheme } = useThemeStore();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('coachDashboardTab') || 'dashboard');

  useEffect(() => {
    localStorage.setItem('coachDashboardTab', activeTab);
  }, [activeTab]);

  const profileName = user?.full_name || user?.email || 'Coach Profile';
  const profileSport = (user as Record<string, any>)?.sport || 'Coach';

  // Tab switcher
  const renderActiveView = () => {
    let TabContent;
    switch (activeTab) {
      case 'dashboard':
        TabContent = <DashboardUI />;
        break;
      case 'schedule':
        TabContent = <ScheduleView />;
        break;
      case 'team':
        TabContent = <TeamView />;
        break;
      case 'archives':
        TabContent = <ArchivedTeamView />;
        break;
      case 'resources':
        TabContent = <ResourceTabs />;
        break;
      case 'coach-profile':
        TabContent = <CoachProfileForm />;
        break;
      case 'screening':
        TabContent = <ScreeningSubmissions />;
        break;
      case 'reports':
        TabContent = <ReportsPage/>;
        break;
      default:
        TabContent = <DashboardUI />;
        break;
    }

    return <Suspense>{TabContent}</Suspense>;
  };

  return (
    <>
      <PortalShell
        portalTitle="Coach Portal"
        navGroups={[
          {
            label: null,
            items: [
              { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" />, active: activeTab === 'dashboard', onClick: () => setActiveTab('dashboard') },
            ],
          },
          {
            label: 'Roster',
            items: [
              { id: 'schedule', label: 'Schedule', icon: <Calendar className="w-5 h-5" />, active: activeTab === 'schedule', onClick: () => setActiveTab('schedule') },
              { id: 'team', label: 'Team', icon: <Users className="w-5 h-5" />, active: activeTab === 'team', onClick: () => setActiveTab('team') },
            ],
          },
          {
            label: 'Eligibility',
            items: [
              { id: 'resources', label: 'Resources', icon: <FileText className="w-5 h-5" />, active: activeTab === 'resources', onClick: () => setActiveTab('resources') },
              { id: 'screening', label: 'Screening', icon: <ClipboardCheck className="w-5 h-5" />, active: activeTab === 'screening', onClick: () => setActiveTab('screening') },
              { id: 'reports', label: 'Reports', icon: <FileText className="w-5 h-5" />, active: activeTab === 'reports', onClick: () => setActiveTab('reports') },
              { id: 'archives', label: 'Archives', icon: <Archive className="w-5 h-5" />, active: activeTab === 'archives', onClick: () => setActiveTab('archives') },
            ],
          },
          {
            label: 'Account',
            items: [
              { id: 'coach-profile', label: 'My Profile', icon: <UserCircle className="w-5 h-5" />, active: activeTab === 'coach-profile', onClick: () => setActiveTab('coach-profile') },
              { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" />, active: false, onClick: () => setIsSettingsOpen(true) },
            ],
          },
        ]}
      >
        <div className="relative min-h-screen bg-slate-100 dark:bg-[#020617]" style={{ fontFamily: "'Sora', ui-sans-serif, system-ui, sans-serif" }}>
          <style>{fontImport}</style>

          {/* Shared Top Header */}
          <div className="sticky top-0 z-20 w-full h-16 px-8 bg-white/90 dark:bg-[#0c1324]/90 backdrop-blur-xl border-b border-slate-200 dark:border-white/[0.06] flex flex-row justify-between items-center gap-6">
            <div className="relative w-full max-w-sm hidden md:block">
              <Search className="w-4 h-4 text-[#64748b] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                className="w-full pl-9 pr-4 py-2 rounded-full bg-white dark:bg-[#0f172a] text-slate-900 dark:text-[#f8fafc] placeholder:text-[#64748b] text-[13px] border border-slate-200 dark:border-white/[0.06] focus:outline-none focus:ring-1 focus:ring-blue-300 dark:focus:ring-[#adc6ff]/50 transition-shadow"
                placeholder="Search athlete or document…"
                type="text"
              />
            </div>
            <div className="flex items-center gap-5 shrink-0">
              <button
                onClick={toggleTheme}
                className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition-all hover:bg-slate-50 hover:text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
              <button className="relative w-9 h-9 rounded-full bg-white dark:bg-[#0f172a] flex items-center justify-center text-slate-500 dark:text-[#94a3b8] hover:text-slate-900 dark:hover:text-[#f8fafc] hover:bg-slate-50 dark:hover:bg-[#191f31] transition-colors">
                <Bell className="w-[18px] h-[18px]" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#f43f5e] ring-2 ring-white dark:ring-[#0c1324]" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-600 dark:bg-[#adc6ff] flex items-center justify-center overflow-hidden shrink-0">
                  <span className="text-white dark:text-[#00285d] font-bold text-[13px] uppercase">{profileName ? profileName.charAt(0) : 'C'}</span>
                </div>
                <div className="flex flex-col hidden sm:flex">
                  <span className="text-[13px] font-semibold text-slate-900 dark:text-[#f8fafc] leading-tight">{profileName}</span>
                  <span className="text-[10px] font-medium text-slate-600 dark:text-[#94a3b8] uppercase tracking-wide capitalize">{profileSport}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-[1600px] mx-auto px-8 py-8">
            <Suspense
              fallback={
                <div className="flex items-center justify-center h-64 text-[#64748b] text-sm font-medium animate-pulse">
                  Loading…
                </div>
              }
            >
              {renderActiveView()}
            </Suspense>
          </div>
        </div>
      </PortalShell>

      {/* Settings roleModal */}
      {isSettingsOpen && <SettingsView onClose={() => setIsSettingsOpen(false)} />}
    </>
  );
}