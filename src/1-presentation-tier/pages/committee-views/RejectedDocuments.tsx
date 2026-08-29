// src/1-presentation-tier/pages/committee-views/RejectedDocuments.tsx
import { useMemo, useState } from 'react';
import { Search, ExternalLink, Loader2, ShieldAlert } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getAllDocumentRecords, applyRecordsFilters } from '../../../3-data-tier/api/recordsApi';
import { getSignedUrl } from '../../../3-data-tier/api/committeeApi';

function prettify(value: string): string {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function RejectedDocuments() {
  const [search, setSearch] = useState('');

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['documentRecords'],
    queryFn: getAllDocumentRecords,
  });

  const rejectedRows = useMemo(
    () => applyRecordsFilters(rows, { status: 'action_required', athleteQuery: search }),
    [rows, search]
  );

  const handleView = async (storagePath: string) => {
    const url = await getSignedUrl(storagePath);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="animate-in fade-in duration-300">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-800">Flagged Documents</h2>
          <p className="text-slate-500 text-sm mt-1">
            {rejectedRows.length} {rejectedRows.length === 1 ? 'document' : 'documents'} rejected, awaiting resubmission
          </p>
        </div>
        <div className="relative w-full sm:w-72 shrink-0">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search athlete or coach…"
            className="w-full pl-10 pr-3.5 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-shadow"
          />
        </div>
      </header>

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