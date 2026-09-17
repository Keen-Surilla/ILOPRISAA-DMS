import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  ChevronDown,
  Users,
  ShieldCheck,
  Building2,
  Clock3,
  TriangleAlert,
  SlidersHorizontal,
  X,
  Eye,
  Bell,
  CheckCircle2,
  Clock,
  AlertCircle,
  Trash2,
} from 'lucide-react';

import AthleteDetailsDrawer from './AthleteDetailsDrawer';
import NotifyCoachModal from './NotifyCoachModal';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import {
  getMasterRoster,
  type MasterRosterEligibility,
  type MasterRosterRecord,
} from '../../../2-application-tier/services/masterRosterService';
import { sendCoachNotification } from '../../../2-application-tier/services/notificationService';
import { useAuthStore } from '../../../2-application-tier/stores/authStore';
import {
  listEvents,
  type CalendarEventRow,
} from '../../../3-data-tier/services/eventService';

export type EligibilityStatus = MasterRosterEligibility;
export type AthleteRecord = MasterRosterRecord;
type RosterCategory = MasterRosterRecord['category'];
type CategoryFilter = 'ALL' | RosterCategory;
type StatusFilter = 'ALL' | EligibilityStatus;

const STATUS_PRIORITY: Record<EligibilityStatus, number> = {
  FLAGGED: 0,
  PENDING: 1,
  VERIFIED: 2,
};

const CATEGORY_FILTER_OPTIONS: RosterCategory[] = [
  'Elementary Boys',
  'Elementary Girls',
  'High School Boys',
  'High School Girls',
  'Tertiary Men',
  'Tertiary Women',
];

function parseLocalDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function formatDeadlineDate(value: string) {
  return parseLocalDate(value).toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatRemainingDays(value: string) {
  const deadlineDate = parseLocalDate(value);
  deadlineDate.setHours(0, 0, 0, 0);
  const today = startOfToday();
  const diffDays = Math.ceil(
    (deadlineDate.getTime() - today.getTime()) / 86_400_000
  );

  if (diffDays < 0) return 'Deadline passed';
  if (diffDays === 0) return 'Due today';
  return `${diffDays} day${diffDays === 1 ? '' : 's'} remaining`;
}

export const MasterRoster: React.FC = () => {
  const { user } = useAuthStore();
  const [athletes, setAthletes] = useState<AthleteRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSport, setSelectedSport] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>('ALL');
    const [needsAttentionOnly, setNeedsAttentionOnly] = useState(false);
    
    const [selectedAthlete, setSelectedAthlete] =
  useState<AthleteRecord | null>(null);

  const [isDrawerOpen, setIsDrawerOpen] =
  useState(false);
  const [isNotifyModalOpen, setIsNotifyModalOpen] = useState(false);
  const [isSendingNotification, setIsSendingNotification] = useState(false);
  const [notificationError, setNotificationError] = useState<string | null>(null);
  const [athletePendingRemoval, setAthletePendingRemoval] =
    useState<AthleteRecord | null>(null);
  const schoolName = user?.institution_id?.trim() || 'School';

  const {
    data: scheduleEvents = [],
    isLoading: isDeadlineLoading,
    isError: isDeadlineError,
  } = useQuery({
    queryKey: ['events', 'school-admin-master-roster-deadlines'],
    queryFn: () => listEvents(),
    staleTime: 30_000,
  });

  useEffect(() => {
    let isMounted = true;

    const loadRoster = async () => {
      try {
        const roster = await getMasterRoster();
        if (isMounted) setAthletes(roster);
      } catch (error) {
        if (isMounted) {
          setLoadError(error instanceof Error ? error.message : 'Could not load the roster.');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void loadRoster();
    return () => {
      isMounted = false;
    };
  }, []);

  const sportsList = useMemo(
    () =>
      Array.from(
        new Set(
          athletes
            .map((athlete) => athlete.sport.trim())
            .filter((sport) => sport.length > 0)
        )
      ).sort(),
    [athletes]
  );

  const rosterKpis = useMemo(
    () => ({
      registeredAthletes: athletes.length,
      verified: athletes.filter((athlete) => athlete.eligibility === 'VERIFIED').length,
      actionRequired: athletes.filter((athlete) => athlete.eligibility === 'FLAGGED').length,
      pendingReview: athletes.filter((athlete) => athlete.eligibility === 'PENDING').length,
    }),
    [athletes]
  );

  const verifiedPercentage =
    rosterKpis.registeredAthletes > 0
      ? ((rosterKpis.verified / rosterKpis.registeredAthletes) * 100).toFixed(1)
      : '0.0';

  const submissionDeadline = useMemo<CalendarEventRow | null>(() => {
    const today = startOfToday();

    return (
      scheduleEvents
        .filter(
          (event) =>
            event.type === 'deadline' &&
            Boolean(event.event_date) &&
            parseLocalDate(event.event_date) >= today
        )
        .sort(
          (a, b) =>
            parseLocalDate(a.event_date).getTime() -
            parseLocalDate(b.event_date).getTime()
        )[0] ?? null
    );
  }, [scheduleEvents]);

  const deadlineValue = isDeadlineLoading
    ? 'Loading...'
    : isDeadlineError
      ? 'Unavailable'
      : submissionDeadline
        ? formatDeadlineDate(submissionDeadline.event_date)
        : 'No deadline set';

  const deadlineMeta =
    !isDeadlineLoading && !isDeadlineError && submissionDeadline
      ? formatRemainingDays(submissionDeadline.event_date)
      : null;

  const filteredAthletes = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return athletes
      .filter((athlete) => {
        const matchesSearch =
          !normalizedSearch ||
          athlete.name.toLowerCase().includes(normalizedSearch);
        const matchesSport = selectedSport === 'ALL' || athlete.sport.trim() === selectedSport;
        const matchesCategory = selectedCategory === 'ALL' || athlete.category === selectedCategory;
        const matchesStatus = selectedStatus === 'ALL' || athlete.eligibility === selectedStatus;
        const matchesAttention = !needsAttentionOnly || athlete.eligibility !== 'VERIFIED';

        return (
          matchesSearch &&
          matchesSport &&
          matchesCategory &&
          matchesStatus &&
          matchesAttention
        );
      })
      .sort(
        (a, b) =>
          STATUS_PRIORITY[a.eligibility] - STATUS_PRIORITY[b.eligibility] ||
          a.name.localeCompare(b.name)
      );
  }, [athletes, searchTerm, selectedSport, selectedCategory, selectedStatus, needsAttentionOnly]);

  const hasActiveFilters =
    Boolean(searchTerm.trim()) ||
    selectedSport !== 'ALL' ||
    selectedCategory !== 'ALL' ||
    selectedStatus !== 'ALL' ||
    needsAttentionOnly;

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedSport('ALL');
    setSelectedCategory('ALL');
    setSelectedStatus('ALL');
    setNeedsAttentionOnly(false);
  };

    const handleViewAthlete = (athlete: AthleteRecord) => {
  setSelectedAthlete(athlete);
  setIsDrawerOpen(true);
    };
    
  const handleNotifyCoach = (athlete: AthleteRecord) => {
    setSelectedAthlete(athlete);
    setIsDrawerOpen(false);
    setIsNotifyModalOpen(true);
  };

  const handleSendNotification = async (athlete: AthleteRecord, message: string) => {
    setNotificationError(null);

    if (!user?.id) {
      setNotificationError('Your session is unavailable. Please sign in again.');
      return;
    }
    if (!athlete.coachId) {
      setNotificationError('This athlete has no assigned coach.');
      return;
    }
    if (!athlete.teamMemberId) {
      setNotificationError('This athlete record is missing an internal ID.');
      return;
    }
    const trimmedMessage = message.trim();
    if (!trimmedMessage) {
      setNotificationError('Enter a message before sending.');
      return;
    }

    setIsSendingNotification(true);
    try {
      await sendCoachNotification({
        recipientProfileId: athlete.coachId,
        athleteId: athlete.teamMemberId,
        createdByProfileId: user.id,
        message: trimmedMessage,
      });
      setIsNotifyModalOpen(false);
      setNotificationError(null);
    } catch (error) {
      console.error('Error sending coach notification:', error);
      setNotificationError('Could not send notification. Please try again.');
    } finally {
      setIsSendingNotification(false);
    }
  };

  const handleConfirmRemoval = () => {
    setAthletePendingRemoval(null);
  };

  const renderStatus = (status: EligibilityStatus) => {
    if (status === 'VERIFIED') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
          <CheckCircle2 className="h-3.5 w-3.5" /> Verified
        </span>
      );
    }
    if (status === 'PENDING') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 dark:text-blue-400 whitespace-nowrap">
          <Clock className="h-3.5 w-3.5" /> Under Review
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400 whitespace-nowrap">
        <AlertCircle className="h-3.5 w-3.5" /> Action Required
      </span>
    );
  };

  return (
<div className="animate-in fade-in duration-300">
  <div className="w-full space-y-6 max-w-[1600px] mx-auto">
        {/* HEADER */}
        <header className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-200">
                Master Roster
              </h1>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300">
  <Building2 className="h-3.5 w-3.5 shrink-0" />
  {schoolName}
</span>
            </div>
            <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
              View all active athletes registered under your school and monitor their
              document and eligibility status.
            </p>
          </div>

          <div className="flex w-full max-w-[320px] items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 xl:w-auto dark:border-amber-500/30 dark:bg-amber-500/10">
  <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-400" />
  <div>
    <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
      Submission Deadline
    </p>
    <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
      {deadlineValue}
      {deadlineMeta && (
        <span className="ml-1.5 font-normal text-slate-500 dark:text-slate-400">
          {deadlineMeta}
        </span>
      )}
    </p>
  </div>
</div>
        </header>

        {/* KPI CARDS */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Registered Athletes
                </p>
                <p className="mt-1 text-2xl font-bold text-slate-800 dark:text-slate-200">
                  {rosterKpis.registeredAthletes}
                </p>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  Across {sportsList.length} {sportsList.length === 1 ? 'sport' : 'sports'}
                </p>
              </div>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400">
                <Users className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Verified
                </p>
                <p className="mt-1 text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                  {rosterKpis.verified}
                </p>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  {verifiedPercentage}% of athletes
                </p>
              </div>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                <ShieldCheck className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Pending Review
                </p>
                <p className="mt-1 text-2xl font-bold text-blue-700 dark:text-blue-400">
                  {rosterKpis.pendingReview}
                </p>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  Awaiting committee inspection
                </p>
              </div>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400">
                <Clock3 className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Action Required
                </p>
                <p className="mt-1 text-2xl font-bold text-amber-700 dark:text-amber-400">
                  {rosterKpis.actionRequired}
                </p>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  Action required before deadline
                </p>
              </div>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400">
                <TriangleAlert className="h-5 w-5" />
              </div>
            </div>
          </div>
        </section>

        {/* MAIN DATA TABLE */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 py-4 xl:flex-row xl:items-center">
            <div className="relative min-w-0 flex-1 xl:max-w-[290px]">
  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-[#64748b]" />
  <input
    type="text"
    value={searchTerm}
    onChange={(event) => setSearchTerm(event.target.value)}
    placeholder="Search athlete name..."
    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700 py-2 pl-10 pr-9 text-sm text-slate-700 dark:text-slate-300 outline-none transition placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
  />
  {searchTerm && (
    <button
      type="button"
      onClick={() => setSearchTerm('')}
      aria-label="Clear search"
      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-[#64748b] dark:hover:text-[#f8fafc]"
    >
      <X className="h-3.5 w-3.5" />
    </button>
  )}
</div>
<div className="flex flex-wrap items-center gap-2 xl:ml-auto">
  <div className="relative">
    <select
      value={selectedSport}
      onChange={(event) => setSelectedSport(event.target.value)}
      className="appearance-none rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-2 pl-3 pr-9 text-sm text-slate-600 dark:text-slate-400 outline-none transition hover:bg-slate-50 dark:hover:bg-slate-800 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
      aria-label="All Sports"
    >
      <option value="ALL">All Sports</option>
      {sportsList.map((sport) => (
        <option key={sport} value={sport}>
          {sport}
        </option>
      ))}
    </select>
    <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 dark:text-[#64748b]" />
  </div>

  <div className="relative">
    <select
      value={selectedCategory}
      onChange={(event) => setSelectedCategory(event.target.value as CategoryFilter)}
      className="appearance-none rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-2 pl-3 pr-9 text-sm text-slate-600 dark:text-slate-400 outline-none transition hover:bg-slate-50 dark:hover:bg-slate-800 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
      aria-label="All Categories"
    >
      <option value="ALL">All Categories</option>
      {CATEGORY_FILTER_OPTIONS.map((category) => (
        <option key={category} value={category}>
          {category}
        </option>
      ))}
    </select>
    <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 dark:text-[#64748b]" />
  </div>

  <div className="relative">
    <select
      value={selectedStatus}
      onChange={(event) => setSelectedStatus(event.target.value as StatusFilter)}
      className="appearance-none rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-2 pl-3 pr-9 text-sm text-slate-600 dark:text-slate-400 outline-none transition hover:bg-slate-50 dark:hover:bg-slate-800 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
      aria-label="All Statuses"
    >
      <option value="ALL">All Statuses</option>
      <option value="VERIFIED">Verified</option>
      <option value="PENDING">Pending Review</option>
      <option value="FLAGGED">Flagged</option>
    </select>
    <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 dark:text-[#64748b]" />
  </div>

  <button
    type="button"
    onClick={() => setNeedsAttentionOnly((current) => !current)}
    className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition ${
      needsAttentionOnly
        ? 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-400'
        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800'
    }`}
  >
    <SlidersHorizontal className="h-3.5 w-3.5" />
    Needs Attention
  </button>
</div>
          </div>

          {/* ACTIVE FILTER READOUT */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-transparent px-5 py-3">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Active Filters:</span>
              <span className="inline-flex items-center rounded-lg bg-white dark:bg-slate-900 px-3 py-1 text-xs font-medium text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                School: {schoolName}
              </span>
              <span className="inline-flex items-center rounded-lg bg-blue-50 dark:bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30">
                Sort: Priority Issues First
              </span>
              
              <button
                type="button"
                onClick={clearFilters}
                className="ml-auto text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                Clear All
              </button>
            </div>
          )}

          {/* TABLE CONTENT */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] border-collapse text-left bg-white dark:bg-slate-900">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Athlete</th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Category</th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Sport</th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Head Coach</th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Documents</th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Eligibility</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Actions</th>
                </tr>
              </thead>

              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center text-[13px] text-slate-500 dark:text-[#94a3b8]">
                      Loading roster...
                    </td>
                  </tr>
                ) : loadError ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center text-sm text-red-600 dark:text-red-400">
                      {loadError}
                    </td>
                  </tr>
                ) : filteredAthletes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center">
                      <div className="mx-auto max-w-sm">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500">
                          <Users className="h-5 w-5" />
                        </div>
                        <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
                          No athletes found
                        </p>
                        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                          No active athletes match your current search or filter criteria.
                        </p>
                        <button
                          type="button"
                          onClick={clearFilters}
                          className="mt-4 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          Clear filters
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredAthletes.map((athlete) => {
                    const isIncomplete = athlete.documentsSubmitted < athlete.documentsTotal;
                    const needsAttention = athlete.eligibility !== 'VERIFIED';

                    return (
                      <tr key={athlete.teamMemberId} className="border-b border-slate-100 dark:border-slate-800 last:border-0 transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/50 group">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-500/10 text-xs font-bold text-blue-700 dark:text-blue-400">
                              {athlete.name
                                .split(' ')
                                .filter(Boolean)
                                .slice(0, 2)
                                .map((part) => part[0])
                                .join('')
                                .toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                                {athlete.name}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                          {athlete.category}
                        </td>

                        <td className="px-5 py-4 text-sm font-medium text-slate-900 dark:text-slate-100">
                          {athlete.sport.trim() || 'Not set'}
                        </td>

                        <td className="px-5 py-4">
                          <div className="min-w-[150px]">
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                              {athlete.coachName.trim() || 'Not set'}
                            </p>
                            <p className="mt-0.5 truncate text-xs text-slate-400 dark:text-slate-500">
                              {athlete.coachEmail.trim() || 'Not set'}
                            </p>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span className={`text-xs font-medium ${isIncomplete ? 'text-amber-700 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
                            {athlete.documentsSubmitted}/{athlete.documentsTotal} Documents
                          </span>
                        </td>

                        <td className="px-5 py-4">{renderStatus(athlete.eligibility)}</td>

                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-1 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleViewAthlete(athlete)}
                              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition"
                            >
                              <Eye className="h-4 w-4" />
                              View
                            </button>

                            {needsAttention && (
                              <button
                                type="button"
                                onClick={() => handleNotifyCoach(athlete)}
                                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:text-blue-700 dark:hover:text-blue-400 transition"
                              >
                                <Bell className="h-4 w-4" />
                                Notify
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => setAthletePendingRemoval(athlete)}
                              className="rounded-lg p-2 text-slate-400 dark:text-slate-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400 transition"
                              title="Archive/Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          <div className="flex flex-col gap-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Showing{' '}
              <span className="font-semibold text-slate-700 dark:text-slate-300">{filteredAthletes.length}</span>{' '}
              of <span className="font-semibold text-slate-700 dark:text-slate-300">{athletes.length}</span> registered athletes
            </p>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled
                className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-400 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                className="h-8 min-w-[32px] rounded-lg bg-blue-600 px-2 text-xs font-semibold text-white"
              >
                1
              </button>
              <button
                type="button"
                disabled
                className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-400 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
                </section>
      </div>

      <AthleteDetailsDrawer
        isOpen={isDrawerOpen}
        athlete={selectedAthlete}
        onClose={() => setIsDrawerOpen(false)}
        onNotifyCoach={handleNotifyCoach}
      />
      <NotifyCoachModal
        isOpen={isNotifyModalOpen}
        athlete={selectedAthlete}
        isSending={isSendingNotification}
        errorMessage={notificationError ?? undefined}
        onClose={() => setIsNotifyModalOpen(false)}
        onSend={handleSendNotification}
      />
      <ConfirmModal
        isOpen={athletePendingRemoval !== null}
        title="Archive Athlete"
        message={
          athletePendingRemoval
            ? `${athletePendingRemoval.name} will be removed from this roster view using the existing School Admin removal workflow.`
            : 'This athlete will be removed from this roster view using the existing School Admin removal workflow.'
        }
        confirmText="Archive"
        onConfirm={handleConfirmRemoval}
        onCancel={() => setAthletePendingRemoval(null)}
      />
    </div>
  );
};

export default MasterRoster;
