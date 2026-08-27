// src/1-presentation-tier/pages/coach-views/ScreeningSubmissions.tsx
import { useState, useMemo } from 'react';
import { CheckCircle2, AlertCircle, Clock, Filter } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../../2-application-tier/stores/authStore';
import { getScreeningRoster, type AthleteScreeningStatus } from '../../../3-data-tier/api/screeningApi';
import { CardSkeleton } from '../../components/ui/SkeletonLoading';
import { ErrorState } from '../../components/ui/ErrorState';

function prettifyDocType(type: string): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

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

function AthleteCard({ athlete }: { athlete: AthleteScreeningStatus }) {
  const isReady = athlete.eligibility === 'ready';

  return (
    <div
      className={`relative text-left w-full bg-white rounded-2xl border p-4 transition-all ${
        isReady ? 'border-slate-100' : 'border-slate-100 opacity-90'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-slate-200 rounded-full shrink-0 flex items-center justify-center text-slate-500 text-sm font-bold uppercase">
          {athlete.name.charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-slate-800 truncate">{athlete.name}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <StatusBadge status={athlete.eligibility} />
            {athlete.division && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">
                {DIVISION_LABELS[athlete.division] ?? athlete.division}
              </span>
            )}
          </div>
        </div>
      </div>

      {athlete.eligibility === 'missing_documents' && (
        <p className="text-[11px] text-slate-500 mt-3">
          <span className="font-semibold text-red-500">{athlete.missingTypes.length}</span>{' '}
          {athlete.missingTypes.length === 1 ? 'document' : 'documents'} missing
        </p>
      )}
      {athlete.eligibility === 'pending_verification' && (
        <p className="text-[11px] text-slate-500 mt-3">
          <span className="font-semibold text-amber-600">{athlete.pendingTypes.length}</span>{' '}
          {athlete.pendingTypes.length === 1 ? 'document' : 'documents'} awaiting review
        </p>
      )}
      {isReady && <p className="text-[11px] text-slate-400 mt-3">All required documents verified</p>}
    </div>
  );
}

export default function ScreeningSubmissions() {
  const { user } = useAuthStore();
  const coachId = user?.id || '';

  const [filter, setFilter] = useState<(typeof FILTERS)[number]['key']>('all');
  const [showFilters, setShowFilters] = useState(false);

  const { data: roster = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['screeningRoster', coachId],
    queryFn: () => getScreeningRoster(coachId),
    enabled: !!coachId,
  });

  const filteredRoster = useMemo(
    () => (filter === 'all' ? roster : roster.filter((a) => a.eligibility === filter)),
    [roster, filter]
  );

  const readyCount = useMemo(() => roster.filter((a) => a.eligibility === 'ready').length, [roster]);

  return (
    <div className="animate-in fade-in duration-300 motion-reduce:animate-none">
      <header className="mb-6">
        <h2 className="text-3xl font-bold tracking-tight text-slate-800">Screening</h2>
        <p className="text-slate-500 text-sm mt-1">
          Check which athletes have all required documents verified before including them on your PRISAA submission.
        </p>
      </header>

      <div className="flex items-center justify-between mb-5">
        <div className="relative inline-block">
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

        <p className="text-sm text-slate-500">
          <span className="font-bold text-slate-700">{readyCount}</span> of {roster.length} ready
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <CardSkeleton count={6} />
        </div>
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : filteredRoster.length === 0 ? (
        <div className="p-8 text-center text-sm text-slate-400">
          {roster.length === 0 ? 'No active athletes on your roster yet.' : 'No athletes match this filter.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRoster.map((athlete) => (
            <AthleteCard key={athlete.athleteId} athlete={athlete} />
          ))}
        </div>
      )}
    </div>
  );
}