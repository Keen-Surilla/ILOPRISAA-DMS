// src/1-presentation-tier/pages/committee-views/ComplianceOverview.tsx
import { Fragment, useMemo, useState } from 'react';
import {
  Loader2,
  Users,
  AlertTriangle,
  ChevronRight,
  CheckCircle2,
  Clock3,
  ShieldAlert,
  ExternalLink,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getComplianceOverview, getExpiringDocuments } from '../../../3-data-tier/api/complianceApi';

function prettify(value: string): string {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function ComplianceOverview() {
  const [expandedSchool, setExpandedSchool] = useState<string | null>(null);

  const { data: compliance, isLoading: complianceLoading } = useQuery({
    queryKey: ['complianceOverview'],
    queryFn: getComplianceOverview,
  });

  const { data: expiring = [], isLoading: expiringLoading } = useQuery({
    queryKey: ['expiringDocuments'],
    queryFn: getExpiringDocuments,
  });

  const schools = compliance?.schools ?? [];
  const athletes = compliance?.athletes ?? [];

  const athletesBySchool = useMemo(() => {
    const map = new Map<string, typeof athletes>();
    for (const athlete of athletes) {
      const key = athlete.schoolId ?? 'UNASSIGNED';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(athlete);
    }
    return map;
  }, [athletes]);

  const summary = useMemo(() => {
    const total = schools.reduce((sum, school) => sum + school.totalAthletes, 0);
    const cleared = schools.reduce((sum, school) => sum + school.clearedAthletes, 0);
    const notCleared = Math.max(total - cleared, 0);
    return { total, cleared, notCleared };
  }, [schools]);

  return (
    <div className="animate-in fade-in duration-300">
      <header className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-[22px] font-bold tracking-tight text-slate-800">Compliance Overview</h2>
          <p className="mt-1 text-[12px] text-slate-500">
            {summary.total} athletes · {schools.length} participating schools
          </p>
        </div>

        <button
          type="button"
          className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md bg-blue-600 px-3 text-[11px] font-semibold text-white shadow-sm hover:bg-blue-700"
        >
          View Review Queue
          <ExternalLink className="h-3.5 w-3.5" />
        </button>
      </header>

      <div className="mb-4 grid grid-cols-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm sm:grid-cols-4">
        <div className="border-b border-slate-100 p-3 sm:border-b-0 sm:border-r">
          <p className="text-[20px] font-bold text-slate-800">{summary.total}</p>
          <p className="text-[10px] font-medium text-slate-400">Total Athletes</p>
        </div>
        <div className="border-b border-slate-100 p-3 sm:border-b-0 sm:border-r">
          <p className="text-[20px] font-bold text-emerald-600">{summary.cleared}</p>
          <p className="text-[10px] font-medium text-slate-400">Fully Cleared</p>
        </div>
        <div className="border-r border-slate-100 p-3">
          <p className="text-[20px] font-bold text-amber-600">{summary.notCleared}</p>
          <p className="text-[10px] font-medium text-slate-400">Not Yet Cleared</p>
        </div>
        <div className="p-3">
          <p className="text-[11px] font-semibold text-slate-700">Institutional compliance status</p>
          <p className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            In Progress
          </p>
        </div>
      </div>

      <section className="mb-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <div>
            <h3 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.06em] text-slate-700">
              <Users className="h-3.5 w-3.5 text-slate-500" />
              Roster Clearance by School
            </h3>
            <p className="mt-1 text-[10px] text-slate-400">Institutional clearance progress and team verification breakdown</p>
          </div>
          <button type="button" className="hidden items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-semibold text-slate-500 sm:inline-flex">
            Filter: All Schools ({schools.length})
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>

        {complianceLoading ? (
          <div className="flex items-center justify-center gap-2 p-12 text-sm text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : schools.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-400">No active athletes on record yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-left text-[9px] font-bold uppercase tracking-[0.08em] text-slate-400">
                  <th className="px-4 py-2.5">School & Delegation</th>
                  <th className="px-4 py-2.5">Athletes</th>
                  <th className="px-4 py-2.5">Cleared</th>
                  <th className="px-4 py-2.5">Not Cleared</th>
                  <th className="px-4 py-2.5">Clearance Progress</th>
                  <th className="px-4 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {schools.map((school) => {
                  const pct =
                    school.totalAthletes === 0
                      ? 0
                      : Math.round((school.clearedAthletes / school.totalAthletes) * 100);
                  const isExpanded = expandedSchool === school.schoolId;
                  const schoolAthletes = athletesBySchool.get(school.schoolId) ?? [];

                  return (
                    <Fragment key={school.schoolId}>
                      <tr className="hover:bg-slate-50/60">
                        <td className="px-4 py-3">
                          <p className="max-w-[190px] text-[11px] font-semibold leading-tight text-slate-700">{school.schoolName}</p>
                          <p className="mt-0.5 text-[9px] text-slate-400">Participating delegation</p>
                        </td>
                        <td className="px-4 py-3 text-[11px] font-semibold text-slate-700">{school.totalAthletes}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex min-w-7 justify-center rounded-md bg-emerald-50 px-1.5 py-1 text-[10px] font-bold text-emerald-700">
                            {school.clearedAthletes}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex min-w-7 justify-center rounded-md bg-amber-50 px-1.5 py-1 text-[10px] font-bold text-amber-700">
                            {Math.max(school.totalAthletes - school.clearedAthletes, 0)}
                          </span>
                        </td>
                        <td className="min-w-[190px] px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className={`h-full rounded-full ${pct === 100 ? 'bg-emerald-500' : 'bg-emerald-400'}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="w-8 text-right text-[10px] font-bold text-slate-600">{pct}%</span>
                          </div>
                          <p className="mt-1 text-[9px] text-slate-400">{school.clearedAthletes} of {school.totalAthletes} cleared</p>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => setExpandedSchool(isExpanded ? null : school.schoolId)}
                            className="inline-flex h-7 items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 text-[10px] font-semibold text-blue-600 hover:bg-blue-50"
                          >
                            View Athletes
                            <ChevronRight className={`h-3 w-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                          </button>
                        </td>
                      </tr>

                      {isExpanded && schoolAthletes.length > 0 && (
                        <tr>
                          <td colSpan={6} className="border-t border-slate-100 bg-slate-50/60 px-4 py-2.5">
                            <div className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
                              {schoolAthletes.map((athlete) => (
                                <div key={athlete.athleteId} className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2">
                                  <div className="min-w-0">
                                    <p className="truncate text-[10px] font-semibold text-slate-700">{athlete.athleteName}</p>
                                    <p className="truncate text-[9px] text-slate-400">{athlete.coachName}</p>
                                  </div>
                                  <span className={`ml-2 shrink-0 text-[9px] font-bold ${athlete.isComplete ? 'text-emerald-600' : 'text-amber-600'}`}>
                                    {athlete.verifiedCount}/8
                                  </span>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mb-4 overflow-hidden rounded-xl border border-red-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-red-100 bg-red-50/40 px-4 py-3">
          <div>
            <h3 className="flex items-center gap-2 text-[12px] font-bold text-slate-800">
              <ShieldAlert className="h-4 w-4 text-red-500" />
              Eligibility Needs Attention
            </h3>
            <p className="mt-0.5 text-[10px] text-slate-500">Documents that require committee attention before final clearance.</p>
          </div>
          <button type="button" className="inline-flex h-7 items-center gap-1 rounded-md border border-red-200 bg-white px-2.5 text-[10px] font-semibold text-red-600">
            View Flagged
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>

        {expiringLoading ? (
          <div className="flex items-center justify-center gap-2 p-8 text-xs text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : expiring.length === 0 ? (
          <div className="flex items-center gap-2 px-4 py-5 text-[11px] text-slate-400">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            No expiring documents require attention in the next 30 days.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {expiring.slice(0, 5).map((row) => (
              <div key={row.id} className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-slate-50/60">
                <div className="flex min-w-0 items-center gap-3">
                  <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${row.daysUntilExpiry <= 7 ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
                    {row.daysUntilExpiry <= 7 ? <AlertTriangle className="h-3.5 w-3.5" /> : <Clock3 className="h-3.5 w-3.5" />}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[11px] font-semibold text-slate-700">{row.athleteName}</p>
                    <p className="truncate text-[9px] text-slate-400">
                      {row.schoolName ?? 'Unassigned'} · {prettify(row.documentType)}
                    </p>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className={`text-[10px] font-bold ${row.daysUntilExpiry <= 7 ? 'text-red-600' : 'text-amber-600'}`}>
                    {row.daysUntilExpiry <= 0 ? 'Overdue' : `${row.daysUntilExpiry} days left`}
                  </p>
                  <p className="mt-0.5 text-[9px] text-slate-400">{new Date(row.expiresAt).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
