// src/1-presentation-tier/pages/super-admin/WatchlistSection.tsx
import { AlertTriangle, Fingerprint } from 'lucide-react';
import { WATCHLIST, FORENSIC_FEED, SEVERITY_STYLES, EVENT_STYLES } from './constants';
import { SectionIntro, cx } from './sharedUi';

export function WatchlistSection({ toast }: { toast: (msg: string) => void }) {
  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500">
      <SectionIntro eyebrow="Region VI Governance Intelligence" title="Watchlist & Audit Feed" description="Schools requiring immediate escalation, alongside the live forensic activity stream." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7 flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white/50 backdrop-blur-sm p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-sora text-base font-bold text-slate-900 dark:text-white">Overdue & Expiring Documents</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Requires administrative escalation</p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {WATCHLIST.map((w) => (
              <div key={w.code} className="group flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 transition-all hover:border-slate-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-800/80 dark:hover:border-slate-600">
                <div className="flex items-center gap-3.5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-100 bg-slate-50 text-xs font-bold text-slate-700 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200">{w.code}</span>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">{w.name}</span>
                    <span className={cx('mt-0.5 text-xs font-semibold', SEVERITY_STYLES[w.severity].text)}>{w.issue}</span>
                  </div>
                </div>
                <button onClick={() => toast(`${w.actionLabel} — ${w.name}`)} className={cx('whitespace-nowrap rounded-lg border px-3.5 py-2 text-xs font-bold transition-all active:scale-95', SEVERITY_STYLES[w.severity].badge)}>
                  {w.actionLabel}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-5 flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white/50 backdrop-blur-sm p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                <Fingerprint className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-sora text-base font-bold text-slate-900 dark:text-white">Forensic Activity</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Live audit ledger stream</p>
              </div>
            </div>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 font-mono text-[10px] font-bold tracking-widest text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400">
              <span className="mr-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" /> LIVE
            </span>
          </div>

          <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-700/60">
            {FORENSIC_FEED.map((f, i) => (
              <div key={i} className="flex flex-col gap-1.5 py-3.5 first:pt-0">
                <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  <span>{f.time}</span>
                  <span className={cx('font-bold', EVENT_STYLES[f.event === 'pass' ? 'trg_transition' : f.event === 'pending' ? 'auth_grant' : 'suspension_lock'])}>
                    {f.event === 'pass' ? 'INVARIANT PASS' : f.event === 'pending' ? 'NONCE DISPATCHED' : 'DISCREPANCY FLAGGED'}
                  </span>
                </div>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{f.summary}</span>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-slate-500 dark:text-slate-400">{f.target}</span>
                  <span className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-[10px] text-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-blue-400">sha256: {f.hash}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}