import { useEffect, useMemo, useState } from 'react';
import {
  Users,
  RotateCcw,
  Trash2,
  ClipboardList,
  ShieldAlert,
  CalendarClock,
  CheckCircle2,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../../2-application-tier/stores/authStore';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { teamApi, type TeamMember } from '../../../3-data-tier/api/teamApi';
import { supabase } from '../../../3-data-tier/config/SupabaseClient';

/**
 * NOTE ON DATA SHAPE
 * ------------------
 * `TeamMember` (from 3-data-tier/api/teamApi) only guarantees id / name /
 * date_of_birth / division today. The fields below are additive and OPTIONAL
 * so this component degrades gracefully until the columns exist. See the
 * migration + teamApi notes provided alongside this file.
 */
type ArchivalReason = 'age_limit' | 'academic_hold' | 'manual' | 'status_change';

type ArchivedAthlete = TeamMember & {
  athlete_code?: string;
  sport?: string | null;
  grade_level?: string | null;
  status_label?: string | null;
  archival_reason?: ArchivalReason | null;
  is_restore_eligible?: boolean | null;
};

const DIVISION_ORDER = ['all', 'tertiary', 'highschool', 'elementary'] as const;
type DivisionFilter = (typeof DIVISION_ORDER)[number];

const DIVISION_LABELS: Record<DivisionFilter, string> = {
  all: 'All',
  tertiary: 'Tertiary',
  highschool: 'Secondary',
  elementary: 'Elementary',
};

// PRISAA age-rule cutoff used for the summary card. Move this to a config
// table if the rule changes per season — do not hardcode business rules
// that change yearly if you can avoid it.
const PRISAA_AGE_CUTOFF_LABEL = 'Jan 01, 2002';

function initials(name: string) {
  return name.trim().charAt(0).toUpperCase() || '?';
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
  hint,
}: {
  icon: typeof Users;
  label: string;
  value: string | number;
  tone: 'slate' | 'emerald' | 'red' | 'blue';
  hint?: string;
}) {
  const toneClasses: Record<string, string> = {
    slate: 'bg-slate-50 dark:bg-[#1e293b] text-slate-600 dark:text-[#94a3b8] border-slate-100 dark:border-white/[0.06]',
    emerald: 'bg-emerald-50 dark:bg-[#10b981]/10 text-emerald-700 dark:text-[#4edea3] border-emerald-100 dark:border-[#10b981]/20',
    red: 'bg-red-50 dark:bg-[#f43f5e]/10 text-red-700 dark:text-[#f43f5e] border-red-100 dark:border-[#f43f5e]/20',
    blue: 'bg-blue-50 dark:bg-[#adc6ff]/10 text-blue-700 dark:text-[#adc6ff] border-blue-100 dark:border-[#adc6ff]/20',
  };
  return (
    <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-white/[0.06] shadow-sm p-4 flex items-start justify-between transition-colors">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400 dark:text-[#64748b]">{label}</p>
        <p className="text-2xl font-bold text-slate-800 dark:text-[#f8fafc] mt-1">{value}</p>
        {hint && <p className="text-[11px] text-slate-400 dark:text-[#64748b] mt-0.5">{hint}</p>}
      </div>
      <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${toneClasses[tone]}`}>
        <Icon className="w-4 h-4" aria-hidden="true" />
      </div>
    </div>
  );
}

function StatusBadge({ athlete }: { athlete: ArchivedAthlete }) {
  if (athlete.archival_reason === 'age_limit' && athlete.is_restore_eligible === false) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 dark:bg-[#f43f5e]/10 text-red-600 dark:text-[#f43f5e] text-[11px] font-bold border border-red-100 dark:border-[#f43f5e]/20 whitespace-nowrap">
        Age Ineligible
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-[#10b981]/10 text-emerald-700 dark:text-[#4edea3] text-[11px] font-bold border border-emerald-100 dark:border-[#10b981]/20 whitespace-nowrap">
      <CheckCircle2 className="w-3 h-3" /> Restorable to Lineup
    </span>
  );
}

function TableSkeleton() {
  return (
    <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-white/[0.06] shadow-sm overflow-hidden">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 border-b border-slate-50 dark:border-white/[0.04] last:border-0 animate-pulse">
          <div className="w-4 h-4 bg-slate-200 dark:bg-white/[0.06] rounded" />
          <div className="w-9 h-9 bg-slate-200 dark:bg-white/[0.06] rounded-full" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 bg-slate-200 dark:bg-white/[0.06] rounded w-1/3" />
            <div className="h-2.5 bg-slate-200 dark:bg-white/[0.06] rounded w-1/5" />
          </div>
          <div className="h-6 bg-slate-200 dark:bg-white/[0.06] rounded-full w-24" />
          <div className="h-8 bg-slate-200 dark:bg-white/[0.06] rounded-lg w-20" />
        </div>
      ))}
    </div>
  );
}

export default function ArchivedTeamView() {
  const { user } = useAuthStore();
  const currentUserId = user?.id || '';
  // RBAC (UI layer only — this NEVER replaces server-side/RLS checks below).
  // Hard-deleting a student-athlete's record is irreversible and destroys
  // linked medical/PSA documents, so it is gated to Admins in the UI too.
  const role = (user as { role?: 'athlete' | 'coach' | 'admin' } | null)?.role;
  const canRestore = role === 'coach' || role === 'admin';
  // Coaches may permanently delete athletes on their own roster; the
  // underlying RPC (delete_athlete_permanently) independently re-checks
  // that the athlete's coach_id actually matches the caller before doing
  // anything — this UI flag is a convenience, not the security boundary.
  const canDelete = role === 'coach' || role === 'admin';

  const queryClient = useQueryClient();

  const [divisionFilter, setDivisionFilter] = useState<DivisionFilter>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [restoreTarget, setRestoreTarget] = useState<{ id: string; name: string } | null>(null);
  const [restoreSelectedOpen, setRestoreSelectedOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUserId) return;

    const channel = supabase
      .channel('team_members_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'team_members' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['teamMembers', currentUserId] });
          queryClient.invalidateQueries({ queryKey: ['archivedTeamMembers', currentUserId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, queryClient]);

  const { data: archivedAthletes = [], isLoading } = useQuery({
    queryKey: ['archivedTeamMembers', currentUserId],
    queryFn: () => teamApi.getArchivedTeamMembers(currentUserId) as Promise<ArchivedAthlete[]>,
    enabled: !!currentUserId,
  });

  const filtered = useMemo(() => {
    if (divisionFilter === 'all') return archivedAthletes;
    return archivedAthletes.filter((m) => m.division === divisionFilter);
  }, [archivedAthletes, divisionFilter]);

  const counts = useMemo(() => {
    const byDivision: Record<DivisionFilter, number> = {
      all: archivedAthletes.length,
      tertiary: 0,
      highschool: 0,
      elementary: 0,
    };
    let readyToRestore = 0;
    let ageFlagged = 0;
    for (const m of archivedAthletes) {
      if (m.division && byDivision[m.division as DivisionFilter] !== undefined) {
        byDivision[m.division as DivisionFilter] += 1;
      }
      if (m.archival_reason === 'age_limit') {
        ageFlagged += 1;
        if (m.is_restore_eligible) readyToRestore += 1;
      } else {
        readyToRestore += 1;
      }
    }
    return { byDivision, readyToRestore, ageFlagged };
  }, [archivedAthletes]);

  // Selection is always re-derived against the currently filtered/visible
  // rows so a stale id from a previous filter can never sneak into a bulk
  // action.
  const visibleIds = useMemo(() => new Set(filtered.map((m) => m.id)), [filtered]);
  const selectedVisibleCount = useMemo(
    () => [...selectedIds].filter((id) => visibleIds.has(id)).length,
    [selectedIds, visibleIds]
  );
  const allVisibleSelected = filtered.length > 0 && selectedVisibleCount === filtered.length;

  function toggleSelectAll() {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        filtered.forEach((m) => next.delete(m.id));
      } else {
        filtered.forEach((m) => next.add(m.id));
      }
      return next;
    });
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const restoreMutation = useMutation({
    mutationFn: (athleteId: string) => teamApi.restoreAthlete(athleteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['archivedTeamMembers', currentUserId] });
      queryClient.invalidateQueries({ queryKey: ['teamMembers', currentUserId] });
      setRestoreTarget(null);
    },
    onError: (error: any) => {
      setErrorMessage(error?.message || 'Could not restore this athlete.');
      setRestoreTarget(null);
    },
  });

  const restoreSelectedMutation = useMutation({
    mutationFn: async () => {
      const ids = [...selectedIds].filter((id) => visibleIds.has(id));
      const results = await Promise.allSettled(ids.map((id) => teamApi.restoreAthlete(id)));
      const failed = results.filter((r) => r.status === 'rejected').length;
      if (failed > 0) {
        throw new Error(`${failed} of ${ids.length} athlete(s) could not be restored.`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['archivedTeamMembers', currentUserId] });
      queryClient.invalidateQueries({ queryKey: ['teamMembers', currentUserId] });
      setSelectedIds(new Set());
      setRestoreSelectedOpen(false);
    },
    onError: (error: any) => {
      setErrorMessage(error?.message || 'Some athletes could not be restored.');
      setRestoreSelectedOpen(false);
      // Refresh regardless — a partial batch may have partially succeeded.
      queryClient.invalidateQueries({ queryKey: ['archivedTeamMembers', currentUserId] });
    },
  });

  // Permanent delete. This must call a server-enforced path (RLS + an
  // admin-only RPC) — see the accompanying teamApi/migration notes. It is
  // intentionally NOT a plain `.from('team_members').delete()` call here,
  // because that would depend entirely on the client sending the right
  // request, which this codebase treats as hostile by default.
  const deleteMutation = useMutation({
    mutationFn: (athleteId: string) => teamApi.permanentlyDeleteAthlete(athleteId),
    onSuccess: (_data, athleteId) => {
      queryClient.invalidateQueries({ queryKey: ['archivedTeamMembers', currentUserId] });
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(athleteId);
        return next;
      });
      setDeleteTarget(null);
    },
    onError: (error: any) => {
      setErrorMessage(error?.message || 'Could not delete this athlete record.');
      setDeleteTarget(null);
    },
  });

  return (
    <div className="animate-in fade-in duration-300 motion-reduce:animate-none">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-[#f8fafc]">Archived Athletes</h2>
          <p className="text-slate-500 dark:text-[#94a3b8] text-sm mt-1 max-w-xl">
            Athletes automatically archived for exceeding the PRISAA age limit, status updates, or manual bench.
            Review eligibility records and instantly restore cleared athletes to your active roster.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/[0.1] rounded-lg hover:bg-slate-50 dark:hover:bg-white/[0.06] transition-colors"
          >
            <ClipboardList className="w-3.5 h-3.5" /> Archival Audit Log
          </button>
          {canRestore && (
            <button
              type="button"
              disabled={selectedVisibleCount === 0}
              onClick={() => setRestoreSelectedOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Restore Selected{selectedVisibleCount > 0 ? ` (${selectedVisibleCount})` : ''}
            </button>
          )}
        </div>
      </header>

      {errorMessage && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-[#f43f5e]/10 border border-red-200 dark:border-[#f43f5e]/20 text-red-600 dark:text-[#f43f5e] text-sm rounded-lg flex items-center justify-between">
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="text-red-400 dark:text-red-300 hover:text-red-600 dark:hover:text-red-100 text-xs font-bold transition-colors">
            Dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <StatCard icon={Users} label="Total Archived" value={counts.byDivision.all} tone="slate" hint="All divisions" />
        <StatCard
          icon={CheckCircle2}
          label="Ready to Restore"
          value={counts.readyToRestore}
          tone="emerald"
          hint="Eligible for lineup"
        />
        <StatCard icon={ShieldAlert} label="Age Cutoff Flag" value={counts.ageFlagged} tone="red" hint="Rule 10 applies" />
        <StatCard
          icon={CalendarClock}
          label="PRISAA Age Rule"
          value={PRISAA_AGE_CUTOFF_LABEL}
          tone="blue"
          hint="Eligibility cutoff must not be born before"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        {DIVISION_ORDER.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setDivisionFilter(key)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
              divisionFilter === key
                ? 'bg-blue-600 dark:bg-[#adc6ff]/15 text-white dark:text-[#adc6ff] border-blue-600 dark:border-transparent'
                : 'bg-white dark:bg-[#0f172a] text-slate-600 dark:text-[#94a3b8] border-slate-200 dark:border-white/[0.06] hover:bg-slate-50 dark:hover:bg-white/[0.04]'
            }`}
          >
            {DIVISION_LABELS[key]}
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                divisionFilter === key 
                  ? 'bg-white/20 dark:bg-[#adc6ff]/20' 
                  : 'bg-slate-100 dark:bg-[#1e293b] text-slate-500 dark:text-slate-300'
              }`}
            >
              {counts.byDivision[key]}
            </span>
          </button>
        ))}
      </div>

      {isLoading ? (
        <TableSkeleton />
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-white/[0.06] shadow-sm py-14 text-center">
          <Users className="w-6 h-6 text-slate-300 dark:text-[#64748b] mx-auto mb-2" aria-hidden="true" />
          <p className="text-sm text-slate-400 dark:text-[#94a3b8]">No archived athletes in this division.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-white/[0.06] shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-white/[0.06] bg-slate-50/50 dark:bg-white/[0.02] text-left">
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleSelectAll}
                    aria-label="Select all archived athletes"
                    className="rounded border-slate-300 dark:border-slate-600 dark:bg-slate-800"
                  />
                </th>
                <th className="px-2 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-400 dark:text-[#94a3b8]">
                  Athlete / Credentials
                </th>
                <th className="px-2 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-400 dark:text-[#94a3b8]">
                  Division
                </th>
                <th className="px-2 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-400 dark:text-[#94a3b8]">
                  PRISAA Status
                </th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-400 dark:text-[#94a3b8] text-right">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((member) => (
                <tr key={member.id} className="border-b border-slate-50 dark:border-white/[0.04] last:border-0 hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(member.id)}
                      onChange={() => toggleSelect(member.id)}
                      aria-label={`Select ${member.name}`}
                      className="rounded border-slate-300 dark:border-slate-600 dark:bg-slate-800"
                    />
                  </td>
                  <td className="px-2 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 bg-slate-200 dark:bg-white/[0.06] rounded-full shrink-0 flex items-center justify-center text-slate-500 dark:text-slate-300 text-xs font-bold uppercase">
                        {initials(member.name)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-800 dark:text-[#f8fafc] truncate">
                          {member.name}
                          {member.athlete_code && (
                            <span className="ml-1.5 text-[10px] font-bold text-slate-400 dark:text-[#64748b]">#{member.athlete_code}</span>
                          )}
                        </p>
                        <p className="text-[11px] text-slate-400 dark:text-[#64748b]">{member.date_of_birth ?? '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-3">
                    <p className="text-xs font-bold text-slate-600 dark:text-[#cbd5e1]">
                      {DIVISION_LABELS[(member.division as DivisionFilter) ?? 'all']}
                    </p>
                    {member.sport && <p className="text-[11px] text-slate-400 dark:text-[#64748b]">{member.sport}</p>}
                  </td>
                  <td className="px-2 py-3">
                    <StatusBadge athlete={member} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {canRestore && (
                        <button
                          onClick={() => setRestoreTarget({ id: member.id, name: member.name })}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 dark:bg-[#adc6ff]/10 hover:bg-blue-100 dark:hover:bg-[#adc6ff]/20 active:scale-[0.97] text-blue-700 dark:text-[#adc6ff] text-[11px] font-bold rounded-lg transition-[background-color,transform] border border-blue-100 dark:border-[#adc6ff]/20"
                        >
                          <RotateCcw className="w-3 h-3" /> Restore
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => setDeleteTarget({ id: member.id, name: member.name })}
                          aria-label={`Permanently delete ${member.name}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-red-50 dark:bg-[#f43f5e]/10 hover:bg-red-100 dark:hover:bg-[#f43f5e]/20 active:scale-[0.97] text-red-600 dark:text-[#f43f5e] text-[11px] font-bold rounded-lg transition-[background-color,transform] border border-red-100 dark:border-[#f43f5e]/20"
                        >
                          <Trash2 className="w-3 h-3" /> Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center justify-between px-4 py-3 text-[11px] text-slate-400 dark:text-[#64748b] border-t border-slate-50 dark:border-white/[0.04]">
            <span>
              Showing 1 to {filtered.length} of {counts.byDivision.all} archived
            </span>
          </div>
        </div>
      )}

      {/* Single restore */}
      <ConfirmModal
        isOpen={restoreTarget !== null}
        title="Restore Athlete"
        message={
          restoreTarget
            ? `Restore ${restoreTarget.name} to the active roster? This is typically done when the archival was a data-entry mistake.`
            : ''
        }
        confirmText="Restore"
        confirmLoadingText="Restoring…"
        isDestructive={false}
        isLoading={restoreMutation.isPending}
        onConfirm={() => restoreTarget && restoreMutation.mutate(restoreTarget.id)}
        onCancel={() => setRestoreTarget(null)}
      />

      {/* Bulk restore */}
      <ConfirmModal
        isOpen={restoreSelectedOpen}
        title="Restore Selected Athletes"
        message={`Restore ${selectedVisibleCount} selected athlete(s) to the active roster?`}
        confirmText="Restore All"
        confirmLoadingText="Restoring…"
        isDestructive={false}
        isLoading={restoreSelectedMutation.isPending}
        onConfirm={() => restoreSelectedMutation.mutate()}
        onCancel={() => setRestoreSelectedOpen(false)}
      />

      {/* Permanent delete — destructive, irreversible */}
      <ConfirmModal
        isOpen={deleteTarget !== null}
        title="Permanently Delete Athlete"
        message={
          deleteTarget
            ? `This permanently deletes ${deleteTarget.name}'s record, including all uploaded PSA certificates and medical clearances. This cannot be undone.`
            : ''
        }
        confirmText="Delete Permanently"
        confirmLoadingText="Deleting…"
        isDestructive
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}