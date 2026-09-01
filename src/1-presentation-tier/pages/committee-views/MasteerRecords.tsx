// src/1-presentation-tier/pages/committee-views/MasterRecords.tsx
import { useMemo, useState } from 'react';
import { Search, ExternalLink, Loader2, FileText } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import {
  getAllDocumentRecords,
  applyRecordsFilters,
  type DocumentStatus,
  type RecordsFilters,
} from '../../../3-data-tier/api/recordsApi';
import { getSignedUrl } from '../../../3-data-tier/api/committeeApi';

const STATUS_OPTIONS: { value: DocumentStatus; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'pending_review', label: 'Pending Review' },
  { value: 'verified', label: 'Verified' },
  { value: 'action_required', label: 'Action Required' },
  { value: 'expired', label: 'Expired' },
];

const STATUS_STYLES: Record<DocumentStatus, string> = {
  draft: 'bg-slate-100 text-slate-600',
  pending_review: 'bg-amber-50 text-amber-700',
  verified: 'bg-green-50 text-green-700',
  action_required: 'bg-red-50 text-red-700',
  expired: 'bg-slate-200 text-slate-500',
};

function prettify(value: string): string {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function MasterRecords() {
  const [filters, setFilters] = useState<RecordsFilters>({});
  const [athleteQuery, setAthleteQuery] = useState('');

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['documentRecords'],
    queryFn: getAllDocumentRecords,
  });

  // List schools with documents; unmatched institutions go to "Unassigned"
  const schoolOptions = useMemo(() => {
    const byId = new Map<string, string>();
    let hasUnassigned = false;
    for (const row of rows) {
      if (row.school_id && row.school_name) {
        byId.set(row.school_id, row.school_name);
      } else {
        hasUnassigned = true;
      }
    }
    const options = Array.from(byId.entries()).sort((a, b) => a[1].localeCompare(b[1]));
    if (hasUnassigned) options.push(['UNASSIGNED', 'Unassigned']);
    return options;
  }, [rows]);

  const documentTypeOptions = useMemo(() => {
    return Array.from(new Set(rows.map((r) => r.document_type))).sort();
  }, [rows]);

  const filteredRows = useMemo(() => {
    const effectiveFilters: RecordsFilters = { ...filters, athleteQuery };
    if (filters.schoolId === 'UNASSIGNED') {
      // Special case: "Unassigned" isn't a real school_id, so filter it separately.
      const base = applyRecordsFilters(rows, { ...effectiveFilters, schoolId: undefined });
      return base.filter((r) => !r.school_id);
    }
    return applyRecordsFilters(rows, effectiveFilters);
  }, [rows, filters, athleteQuery]);

  const handleView = async (storagePath: string) => {
    const url = await getSignedUrl(storagePath);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const clearFilters = () => {
    setFilters({});
    setAthleteQuery('');
  };

  const hasActiveFilters = !!(filters.schoolId || filters.documentType || filters.status || athleteQuery);

  return (
    <div className="animate-in fade-in duration-300">
      <header className="mb-6">
        <h2 className="text-3xl font-bold tracking-tight text-slate-800">Document Records</h2>
        <p className="text-slate-500 text-sm mt-1">
          {filteredRows.length} of {rows.length} {rows.length === 1 ? 'document' : 'documents'}
        </p>
      </header>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 mb-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            value={athleteQuery}
            onChange={(e) => setAthleteQuery(e.target.value)}
            placeholder="Search athlete or coach…"
            className="w-full pl-10 pr-3.5 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-shadow"
          />
        </div>

        <select
          value={filters.schoolId ?? ''}
          onChange={(e) => setFilters((f) => ({ ...f, schoolId: e.target.value || undefined }))}
          className="px-3 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:border-blue-500 bg-white"
        >
          <option value="">All schools</option>
          {schoolOptions.map(([id, name]) => (
            <option key={id} value={id}>{name}</option>
          ))}
        </select>

        <select
          value={filters.documentType ?? ''}
          onChange={(e) => setFilters((f) => ({ ...f, documentType: e.target.value || undefined }))}
          className="px-3 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:border-blue-500 bg-white"
        >
          <option value="">All document types</option>
          {documentTypeOptions.map((type) => (
            <option key={type} value={type}>{prettify(type)}</option>
          ))}
        </select>

        <select
          value={filters.status ?? ''}
          onChange={(e) => setFilters((f) => ({ ...f, status: (e.target.value || undefined) as DocumentStatus | undefined }))}
          className="px-3 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:border-blue-500 bg-white"
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>

               <button
          onClick={clearFilters}
          disabled={!hasActiveFilters}
          className="text-xs font-bold text-slate-500 hover:text-slate-700 disabled:text-slate-300 disabled:cursor-not-allowed px-3 py-2.5"
        >
          Clear filters
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex items-center justify-center text-sm text-slate-400 gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading…
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-3">
              <FileText className="w-5 h-5 text-slate-300" />
            </div>
            <p className="text-sm font-semibold text-slate-600">No matching documents</p>
            <p className="text-xs text-slate-400 mt-1">Try adjusting or clearing your filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs font-bold text-slate-400 uppercase tracking-wide">
                  <th className="px-5 py-3">School</th>
                  <th className="px-5 py-3">Coach</th>
                  <th className="px-5 py-3">Athlete</th>
                  <th className="px-5 py-3">Document</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Updated</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredRows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3 text-slate-600">{row.school_name ?? 'Unassigned'}</td>
                    <td className="px-5 py-3 text-slate-600">{row.coach_name}</td>
                    <td className="px-5 py-3 font-semibold text-slate-700">{row.athlete_name}</td>
                    <td className="px-5 py-3 text-slate-600">
                      {prettify(row.document_type)}
                      {row.status === 'action_required' && row.rejection_reason && (
                        <p className="text-[11px] text-red-500 mt-0.5">{row.rejection_reason}</p>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${STATUS_STYLES[row.status]}`}>
                        {prettify(row.status)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-400 text-xs">
                      {new Date(row.updated_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => handleView(row.storage_path)}
                        title="View document"
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}