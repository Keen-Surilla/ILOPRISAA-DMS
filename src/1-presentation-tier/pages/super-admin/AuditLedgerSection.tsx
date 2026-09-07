// src/1-presentation-tier/pages/super-admin/AuditLedgerSection.tsx
import { useState, useMemo } from 'react';
import { Search, Download, Copy } from 'lucide-react';
import { AUDIT_LOG, type AuditEventType, EVENT_STYLES } from './constants';
import { SectionIntro, cx, downloadCsv } from './sharedUi';

export function AuditLedgerSection({ toast }: { toast: (msg: string) => void }) {
  const [search, setSearch] = useState('');
  const [eventType, setEventType] = useState<'ALL' | AuditEventType>('ALL');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return AUDIT_LOG.filter((row) => {
      const matchesSearch = !q || row.actor.toLowerCase().includes(q) || row.target.toLowerCase().includes(q) || row.hash.toLowerCase().includes(q);
      const matchesEvent = eventType === 'ALL' || row.action === eventType;
      return matchesSearch && matchesEvent;
    });
  }, [search, eventType]);

  function copyHash(hash: string) {
    navigator.clipboard.writeText(hash).then(() => toast('SHA-256 Hash copied to clipboard.'));
  }

  function exportCsv() {
    const rows = [
      ['Timestamp (UTC)', 'Actor', 'Action', 'Target', 'Institution', 'SHA-256 Hash'],
      ...filtered.map((r) => [r.timestamp, r.actor, r.action, r.target, r.institution, r.hash]),
    ];
    downloadCsv(`document_audit_log_${Date.now()}.csv`, rows);
    toast(`Exported ${filtered.length} immutable ledger records.`);
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <SectionIntro
        eyebrow="Cryptographic Ledger Mirror"
        title="Audit Log Viewer"
        description="Immutable ledger entries with SHA-256 verification hashes and actor signatures."
        action={
          <button onClick={exportCsv} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:shadow dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 active:scale-95">
            <Download className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> Export CSV
          </button>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white/50 backdrop-blur-sm p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800/40">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search hash, actor, or target..."
              className="w-full rounded-xl border border-slate-200 bg-white/80 py-2.5 pl-10 pr-4 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-100 sm:w-64 transition-colors"
            />
          </div>
          <select value={eventType} onChange={(e) => setEventType(e.target.value as typeof eventType)} className="cursor-pointer rounded-xl border border-slate-200 bg-white/80 px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/40 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-100 transition-colors">
            <option value="ALL">All Event Types</option>
            <option value="trg_transition">trg_transition</option>
            <option value="auth_grant">auth_grant</option>
            <option value="policy_override">policy_override</option>
            <option value="suspension_lock">suspension_lock</option>
          </select>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
          Synced with Database
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white/50 backdrop-blur-sm shadow-sm dark:border-slate-700 dark:bg-slate-800/40">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50/50 text-[10px] uppercase tracking-wider text-slate-500 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400">
              <tr>
                <th className="px-6 py-4 font-bold">Timestamp (UTC)</th>
                <th className="px-6 py-4 font-bold">Actor</th>
                <th className="px-6 py-4 font-bold">Action</th>
                <th className="px-6 py-4 font-bold">Target</th>
                <th className="px-6 py-4 font-bold">Institution</th>
                <th className="px-6 py-4 font-bold">SHA-256 Hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-xs dark:divide-slate-700/60">
              {filtered.map((row) => (
                <tr key={row.id} className="transition-colors hover:bg-white dark:hover:bg-slate-700/30">
                  <td className="whitespace-nowrap px-6 py-4 text-slate-400">{row.timestamp}</td>
                  <td className="px-6 py-4 font-sans text-sm font-bold text-slate-900 dark:text-white">{row.actor}</td>
                  <td className={cx('px-6 py-4 font-bold', EVENT_STYLES[row.action])}>{row.action}</td>
                  <td className="px-6 py-4 font-sans text-slate-500 dark:text-slate-400">{row.target}</td>
                  <td className="px-6 py-4 font-sans">{row.institution}</td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center gap-2 group">
                      <span className="text-slate-600 dark:text-slate-300">{row.hash.slice(0, 24)}<span className="text-slate-400">...</span></span>
                      <button onClick={() => copyHash(row.hash)} title="Copy hash" className="p-1 text-slate-300 opacity-0 transition-all hover:text-blue-600 group-hover:opacity-100 dark:text-slate-500 dark:hover:text-blue-400">
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center font-sans text-sm text-slate-400">
                    No ledger entries match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}