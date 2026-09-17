import React, { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  Award,
  Bell,
  CheckCircle2,
  Clock,
  Mail,
  UserCheck,
  Users,
} from 'lucide-react';

import {
  getMasterRoster,
  type MasterRosterRecord,
} from '../../../2-application-tier/services/masterRosterService';
import { sendSchoolComplianceReminder } from '../../../2-application-tier/services/notificationService';
import { useAuthStore } from '../../../2-application-tier/stores/authStore';

interface CoachAttentionSummary {
  coachId: string;
  name: string;
  sport: string;
  email: string;
  flaggedCount: number;
  pendingCount: number;
}

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function pluralizeAthletes(count: number) {
  return `${count} athlete${count === 1 ? '' : 's'}`;
}

function KpiCard({
  icon,
  label,
  value,
  meta,
  tone = 'blue',
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  meta: string;
  tone?: 'blue' | 'emerald' | 'amber';
}) {
  const toneClass =
    tone === 'emerald'
      ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300'
      : tone === 'amber'
        ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300'
        : 'bg-blue-50 text-blue-600 dark:bg-[#adc6ff]/10 dark:text-[#adc6ff]';

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-slate-300 dark:border-white/[0.06] dark:bg-[#0f172a] dark:hover:border-white/[0.12]">
      <div className="flex items-start justify-between gap-3">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748b]">
          {label}
        </span>
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${toneClass}`}>
          {icon}
        </div>
      </div>
      <p className="mt-4 text-[30px] font-bold leading-none tracking-tight text-slate-900 dark:text-[#f8fafc]">
        {value}
      </p>
      <p className="mt-2 text-[12px] font-medium text-slate-500 dark:text-[#94a3b8]">{meta}</p>
    </div>
  );
}

export const SchoolOverview: React.FC = () => {
  const { user } = useAuthStore();
  const [remindedList, setRemindedList] = useState<Record<string, boolean>>({});
  const [reminderError, setReminderError] = useState<string | null>(null);
  const [sendingCoachId, setSendingCoachId] = useState<string | null>(null);

  const {
    data: roster = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['schoolAdminMasterRoster'],
    queryFn: getMasterRoster,
    staleTime: 30_000,
  });

  const metrics = useMemo(() => {
    const totalCount = roster.length;
    const verifiedCount = roster.filter((athlete) => athlete.eligibility === 'VERIFIED').length;
    const flaggedCount = roster.filter((athlete) => athlete.eligibility === 'FLAGGED').length;
    const pendingCount = roster.filter((athlete) => athlete.eligibility === 'PENDING').length;
    const coachCount = new Set(
      roster
        .map((athlete) => athlete.coachId?.trim())
        .filter((coachId): coachId is string => Boolean(coachId))
    ).size;

    return {
      coaches: coachCount,
      athletes: totalCount,
      verifiedCount,
      clearedRate: totalCount > 0 ? `${((verifiedCount / totalCount) * 100).toFixed(1)}%` : '0%',
      flaggedCount,
      pendingCount,
    };
  }, [roster]);

  const coachSummaries = useMemo<CoachAttentionSummary[]>(() => {
    const summaryMap = new Map<
      string,
      CoachAttentionSummary & { sports: Set<string> }
    >();

    roster.forEach((athlete: MasterRosterRecord) => {
      const coachId = athlete.coachId?.trim();
      if (!coachId) return;
      if (athlete.eligibility !== 'FLAGGED' && athlete.eligibility !== 'PENDING') return;

      const existing =
        summaryMap.get(coachId) ??
        {
          coachId,
          name: athlete.coachName.trim() || 'Not set',
          email: athlete.coachEmail.trim() || 'Not set',
          sport: 'Not set',
          flaggedCount: 0,
          pendingCount: 0,
          sports: new Set<string>(),
        };

      const sport = athlete.sport.trim();
      if (sport) existing.sports.add(sport);
      if (athlete.eligibility === 'FLAGGED') existing.flaggedCount += 1;
      if (athlete.eligibility === 'PENDING') existing.pendingCount += 1;

      summaryMap.set(coachId, existing);
    });

    return Array.from(summaryMap.values())
      .map(({ sports, ...summary }) => ({
        ...summary,
        sport: sports.size > 0 ? Array.from(sports).sort().join(', ') : 'Not set',
      }))
      .sort(
        (a, b) =>
          b.flaggedCount - a.flaggedCount ||
          b.pendingCount - a.pendingCount ||
          a.name.localeCompare(b.name)
      );
  }, [roster]);

  const reminderMutation = useMutation({
    mutationFn: async (coach: CoachAttentionSummary) => {
      if (!user?.id) {
        throw new Error('Your session is unavailable. Please sign in again.');
      }

      const actionText =
        coach.flaggedCount > 0
          ? `${pluralizeAthletes(coach.flaggedCount)} requiring action`
          : '';
      const pendingText =
        coach.pendingCount > 0
          ? `${coach.pendingCount} pending review`
          : '';
      const outstandingText = [actionText, pendingText].filter(Boolean).join(' and ');

      await sendSchoolComplianceReminder({
        recipientProfileId: coach.coachId,
        createdByProfileId: user.id,
        message: `You have ${outstandingText} in your school roster.`,
      });

      return coach.coachId;
    },
    onMutate: (coach) => {
      setReminderError(null);
      setSendingCoachId(coach.coachId);
    },
    onSuccess: (coachId) => {
      setRemindedList((prev) => ({ ...prev, [coachId]: true }));
    },
    onError: (mutationError) => {
      setReminderError(
        mutationError instanceof Error
          ? mutationError.message
          : 'Could not send reminder. Please try again.'
      );
    },
    onSettled: () => {
      setSendingCoachId(null);
    },
  });

  const handleRemindCoach = (coach: CoachAttentionSummary) => {
    if (reminderMutation.isPending) return;
    reminderMutation.mutate(coach);
  };

  const kpiValue = (value: React.ReactNode) => {
    if (isLoading) return '...';
    if (isError) return '—';
    return value;
  };

  const kpiMeta = (value: string) => {
    if (isLoading) return 'Loading roster...';
    if (isError) return 'Unavailable';
    return value;
  };

  return (
    <div className="animate-in fade-in duration-300">
      <div className="mx-auto w-full max-w-[1600px] space-y-6">
        <header className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-200">
                School Overview
              </h1>
            </div>
            <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
              Institutional performance, athlete eligibility rates, and compliance actions for your school.
            </p>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            icon={<Users className="h-5 w-5" />}
            label="Assigned Coaches"
            value={kpiValue(metrics.coaches)}
            meta={kpiMeta('Currently assigned')}
          />
          <KpiCard
            icon={<UserCheck className="h-5 w-5" />}
            label="Registered Athletes"
            value={kpiValue(metrics.athletes)}
            meta={kpiMeta('Across active rosters')}
          />
          <KpiCard
            icon={<Award className="h-5 w-5" />}
            label="Cleared Rate"
            value={kpiValue(metrics.clearedRate)}
            meta={kpiMeta(`${metrics.verifiedCount} of ${metrics.athletes} verified`)}
            tone="emerald"
          />
          <KpiCard
            icon={<AlertTriangle className="h-5 w-5" />}
            label="Action Required"
            value={kpiValue(metrics.flaggedCount)}
            meta={kpiMeta(`${metrics.pendingCount} pending review`)}
            tone="amber"
          />
        </section>

        {isError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
            {error instanceof Error ? error.message : 'Could not load school overview data.'}
          </div>
        )}

        {reminderError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
            {reminderError}
          </div>
        )}

        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-white/[0.06] dark:bg-[#0f172a]">
          <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 dark:border-white/[0.06] sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300">
                <Bell className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <h2 className="text-[15px] font-semibold text-slate-900 dark:text-[#f8fafc]">
                  Attention Required
                </h2>
                <p className="mt-0.5 text-[12px] text-slate-500 dark:text-[#94a3b8]">
                  Coaches with athletes requiring action or pending eligibility review.
                </p>
              </div>
            </div>
            <span className="inline-flex w-fit items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-bold text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
              {isLoading ? 'Loading' : `${coachSummaries.length} Coaches`}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:border-white/[0.06] dark:text-[#64748b]">
                  <th className="px-5 py-3">Coach</th>
                  <th className="px-4 py-3">Sport</th>
                  <th className="px-4 py-3">Open Items</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-[13px] text-slate-500 dark:text-[#94a3b8]">
                      Loading school roster...
                    </td>
                  </tr>
                ) : isError ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-sm text-red-600 dark:text-red-400">
                      Could not load attention summaries.
                    </td>
                  </tr>
                ) : coachSummaries.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-sm font-medium text-slate-500 dark:text-[#94a3b8]">
                      No coaches currently require attention.
                    </td>
                  </tr>
                ) : (
                  coachSummaries.map((coach) => {
                  const isReminded = remindedList[coach.coachId];
                  const isSending = sendingCoachId === coach.coachId;

                  return (
                    <tr key={coach.coachId} className="transition-colors hover:bg-slate-50 dark:hover:bg-[#151b2d]/70">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-[11px] font-bold text-slate-600 dark:bg-[#1e293b] dark:text-[#adc6ff]">
                            {initials(coach.name)}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-[13px] font-semibold text-slate-900 dark:text-[#f8fafc]">
                              {coach.name}
                            </p>
                            <p className="truncate text-[11px] text-slate-500 dark:text-[#94a3b8]">
                              {coach.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="w-[240px] max-w-[240px] px-4 py-3">
                        <p
                          title={coach.sport}
                          className="max-w-[240px] truncate whitespace-nowrap text-[13px] font-medium text-slate-900 dark:text-[#f8fafc]"
                        >
                          {coach.sport}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {coach.flaggedCount > 0 && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-1 text-[11px] font-semibold text-red-600 dark:bg-red-500/10 dark:text-red-400">
                              {coach.flaggedCount} Flagged
                            </span>
                          )}
                          {coach.pendingCount > 0 && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                              {coach.pendingCount} Pending
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          type="button"
                          disabled={isReminded || isSending}
                          onClick={() => handleRemindCoach(coach)}
                          className={`inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border px-3 text-[11px] font-semibold transition-colors ${
                            isReminded
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300'
                              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-white/[0.06] dark:bg-[#0f172a] dark:text-[#94a3b8] dark:hover:bg-[#191f31]'
                          }`}
                        >
                          {isSending ? (
                            <>
                              <Mail className="h-3.5 w-3.5" />
                              Sending
                            </>
                          ) : isReminded ? (
                            <>
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Reminded
                            </>
                          ) : (
                            <>
                              <Mail className="h-3.5 w-3.5" />
                              Remind
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3 text-[12px] text-slate-500 dark:border-white/[0.06] dark:bg-[#151b2d] dark:text-[#94a3b8] sm:flex-row sm:items-center sm:justify-between">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              Reminder notices are sent through the platform notification workflow.
            </span>
          </div>
        </section>
      </div>
    </div>
  );
};

export default SchoolOverview;
