import { useMemo, useState } from 'react';
import { Loader2, Users, Clock, AlertTriangle } from 'lucide-react';
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

  return (
    <div className="animate-in fade-in duration-300 space-y-8">
      <header>
        <h2 className="text-3xl font-bold tracking-tight text-slate-800">Compliance Overview</h2>
        <p className="text-slate-500 text-sm mt-1">Document clearance by school, and documents nearing expiry</p>
      </header>

      {/* School compliance cards */}
      <section>
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
          <Users className="w-4 h-4" /> Roster Clearance
        </h3>

        {complianceLoading ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 flex items-center justify-center text-sm text-slate-400 gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading…
          </div>
        ) : schools.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center text-sm text-slate-400">
            No active athletes on record yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {schools.map((school) => {
              const pct = school.totalAthletes === 0 ? 0 : Math.round((school.clearedAthletes / school.totalAthletes) * 100);
              const isExpanded = expandedSchool === school.schoolId;
              const schoolAthletes = athletesBySchool.get(school.schoolId) ?? [];
              return (
                <div key={school.schoolId} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                  <button
                    onClick={() => setExpandedSchool(isExpanded ? null : school.schoolId)}
                    className="w-full text-left p-5 hover:bg-slate-50/50 transition-colors"
                  >
                    <p className="text-sm font-bold text-slate-800 truncate mb-1">{school.schoolName}</p>
                    <p className="text-xs text-slate-400 mb-3">
                      {school.clearedAthletes} of {school.totalAthletes} athletes fully cleared
                    </p>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-green-500' : 'bg-amber-400'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-[11px] font-bold text-slate-400 mt-2">{pct}% complete</p>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-slate-100 divide-y divide-slate-50 max-h-64 overflow-y-auto">
                      {schoolAthletes.map((athlete) => (
                        <div key={athlete.athleteId} className="px-5 py-2.5 flex items-center justify-between text-xs">
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-700 truncate">{athlete.athleteName}</p>
                            <p className="text-slate-400 truncate">{athlete.coachName}</p>
                          </div>
                          <span className={`font-bold shrink-0 ml-2 ${athlete.isComplete ? 'text-green-600' : 'text-amber-600'}`}>
                            {athlete.verifiedCount}/8
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Expiring documents tracker */}
      <section>
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4" /> Expiring Soon
        </h3>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {expiringLoading ? (
            <div className="p-12 flex items-center justify-center text-sm text-slate-400 gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading…
            </div>
          ) : expiring.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400">
              Nothing expiring in the next 30 days.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs font-bold text-slate-400 uppercase tracking-wide">
                    <th className="px-5 py-3">School</th>
                    <th className="px-5 py-3">Athlete</th>
                    <th className="px-5 py-3">Document</th>
                    <th className="px-5 py-3">Expires</th>
                    <th className="px-5 py-3">Time Left</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {expiring.map((row) => (
                    <tr key={row.id} className="hover:bg-amber-50/30 transition-colors">
                      <td className="px-5 py-3 text-slate-600">{row.schoolName ?? 'Unassigned'}</td>
                      <td className="px-5 py-3 font-semibold text-slate-700">{row.athleteName}</td>
                      <td className="px-5 py-3 text-slate-600">{prettify(row.documentType)}</td>
                      <td className="px-5 py-3 text-slate-400 text-xs">
                        {new Date(row.expiresAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full ${
                            row.daysUntilExpiry <= 7 ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {row.daysUntilExpiry <= 7 && <AlertTriangle className="w-3 h-3" />}
                          {row.daysUntilExpiry <= 0 ? 'Overdue' : `${row.daysUntilExpiry} days`}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}