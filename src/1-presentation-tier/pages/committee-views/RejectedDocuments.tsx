// src/1-presentation-tier/pages/committee-views/RejectedDocuments.tsx
import { useMemo, useState } from 'react';
import { Search, ExternalLink, Loader2, ShieldAlert, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getAllDocumentRecords, applyRecordsFilters } from '../../../3-data-tier/api/recordsApi';
import { getSignedUrl } from '../../../3-data-tier/api/committeeApi';

function prettify(value: string): string {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function RejectedDocuments() {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<import('../../../3-data-tier/api/recordsApi').RecordsFilters>({ status: 'action_required' });

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['documentRecords'],
    queryFn: getAllDocumentRecords,
  });

  const rejectedRows = useMemo(
    () => applyRecordsFilters(rows, { ...filters, status: 'action_required', athleteQuery: search }),
    [rows, search, filters]
  );

  const schoolOptions = useMemo(() => Array.from(new Map(rows.filter((r) => r.school_id && r.school_name).map((r) => [r.school_id!, r.school_name!])).entries()).sort((a, b) => a[1].localeCompare(b[1])), [rows]);
  const sportOptions = useMemo(() => Array.from(new Set(rows.map((r) => r.sport).filter((v): v is string => !!v))).sort(), [rows]);
  const genderOptions = useMemo(() => Array.from(new Set(rows.map((r) => r.gender).filter((v): v is string => !!v))).sort(), [rows]);
  const divisionOptions = [['elementary', 'Elementary'], ['highschool', 'Secondary'], ['tertiary', 'Tertiary']] as const;
  const documentTypeOptions = useMemo(() => Array.from(new Set(rows.map((r) => r.document_type))).sort(), [rows]);
  const clearFilters = () => { setSearch(''); setFilters({ status: 'action_required' }); };

  const handleView = async (storagePath: string) => {
    const url = await getSignedUrl(storagePath);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="animate-in fade-in duration-300">
      <header className="mb-4">
        <h2 className="text-[22px] font-bold tracking-tight text-slate-800">Flagged Documents</h2>
        <p className="text-slate-500 text-[11px] mt-0.5">{rejectedRows.length} documents rejected, awaiting resubmission</p>
      </header>

      <div className="bg-white rounded-xl border border-slate-200 p-3 mb-3">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[210px]"><Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search athlete, coach, sport, or gender…" className="w-full pl-9 pr-3 py-2 text-[11px] border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100" /></div>
          <select value={filters.schoolId ?? ''} onChange={(e) => setFilters((f) => ({ ...f, schoolId: e.target.value || undefined }))} className="px-2.5 py-2 text-[11px] border border-slate-200 rounded-lg bg-white"><option value="">All schools</option>{schoolOptions.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select>
          <select value={filters.division ?? ''} onChange={(e) => setFilters((f) => ({ ...f, division: e.target.value || undefined }))} className="px-2.5 py-2 text-[11px] border border-slate-200 rounded-lg bg-white"><option value="">All levels</option>{divisionOptions.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select>
          <select value={filters.sport ?? ''} onChange={(e) => setFilters((f) => ({ ...f, sport: e.target.value || undefined }))} className="px-2.5 py-2 text-[11px] border border-slate-200 rounded-lg bg-white"><option value="">All sports</option>{sportOptions.map((v) => <option key={v} value={v}>{v}</option>)}</select>
          <select value={filters.gender ?? ''} onChange={(e) => setFilters((f) => ({ ...f, gender: e.target.value || undefined }))} className="px-2.5 py-2 text-[11px] border border-slate-200 rounded-lg bg-white"><option value="">All genders</option>{genderOptions.map((v) => <option key={v} value={v}>{v}</option>)}</select>
          <select value={filters.documentType ?? ''} onChange={(e) => setFilters((f) => ({ ...f, documentType: e.target.value || undefined }))} className="px-2.5 py-2 text-[11px] border border-slate-200 rounded-lg bg-white"><option value="">All document types</option>{documentTypeOptions.map((v) => <option key={v} value={v}>{prettify(v)}</option>)}</select>
          <button onClick={clearFilters} className="text-[10px] font-semibold text-slate-500 hover:text-slate-700 px-2 py-2">Clear filters</button>
        </div>
        {(filters.schoolId || filters.division || filters.sport || filters.gender || filters.documentType || search) && <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-slate-100 text-[9px] text-slate-500"><span>Active filters</span><X className="w-3 h-3" /><span>Clear filters to reset</span></div>}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex items-center justify-center text-sm text-slate-400 gap-2">
            <Loader2 className="w-4 h-4 animate-spin [animation-duration:650ms]" /> Loading…
          </div>
        ) : rejectedRows.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-3">
              <ShieldAlert className="w-5 h-5 text-slate-300" />
            </div>
            <p className="text-sm font-semibold text-slate-600">
              {search ? 'No matches found' : 'Nothing needs action'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {search ? 'Try a different athlete or coach.' : 'No rejected documents right now.'}
            </p>
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
                  <th className="px-5 py-3">Reason</th>
                  <th className="px-5 py-3">Rejected</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {rejectedRows.map((row, index) => (
                  <tr
                    key={row.id}
                    className="hover:bg-red-50/30 transition-colors animate-in fade-in slide-in-from-bottom-1 duration-300 motion-reduce:animate-none"
                    style={{ animationDelay: `${Math.min(index * 35, 350)}ms`, animationFillMode: 'backwards' }}
                  >
                    <td className="px-5 py-3 text-slate-600">{row.school_name ?? 'Unassigned'}</td>
                    <td className="px-5 py-3 text-slate-600">{row.coach_name}</td>
                    <td className="px-5 py-3 font-semibold text-slate-700">{row.athlete_name}</td>
                    <td className="px-5 py-3 text-slate-600">{prettify(row.document_type)}</td>
                    <td className="px-5 py-3 text-red-600 text-xs max-w-[240px]">
                      {row.rejection_reason || '—'}
                    </td>
                    <td className="px-5 py-3 text-slate-400 text-xs">
                      {row.reviewed_at ? new Date(row.reviewed_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => handleView(row.storage_path)}
                        title="View document"
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 active:scale-[0.97] rounded-lg transition-[color,background-color,transform] duration-150"
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