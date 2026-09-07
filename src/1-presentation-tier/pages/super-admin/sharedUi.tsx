// src/1-presentation-tier/pages/super-admin/shared-ui.tsx
import React from 'react';

export function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export function formatCountdown(expiresAt: number, now: number): { label: string; urgent: boolean; expired: boolean } {
  const diff = expiresAt - now;
  if (diff <= 0) return { label: 'Expired', urgent: true, expired: true };
  const hours = Math.floor(diff / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  return { label: `${hours}h ${String(minutes).padStart(2, '0')}m remaining`, urgent: hours < 6, expired: false };
}

export function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function Toast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="fixed bottom-6 right-6 z-[60] max-w-sm rounded-xl border border-slate-200 bg-white/90 backdrop-blur-xl px-4 py-3 text-sm font-medium text-slate-800 shadow-2xl dark:border-slate-700 dark:bg-slate-800/90 dark:text-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {message}
    </div>
  );
}

export function SectionIntro({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2">
      <div>
        <span className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">{eyebrow}</span>
        <h2 className="mt-1 font-sora text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">{title}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">{description}</p>
      </div>
      {action ? <div className="flex shrink-0 items-center gap-3">{action}</div> : null}
    </div>
  );
}

export function StatCard({ label, value, sublabel, badge, badgeTone, icon }: { label: string; value: string; sublabel: string; badge: string; badgeTone: 'emerald' | 'amber'; icon: React.ReactNode }) {
  const tone = badgeTone === 'emerald'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30'
      : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30';
  return (
    <div className="group relative flex items-start justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg dark:border-slate-700 dark:bg-slate-800/40 dark:hover:border-blue-500/40 dark:hover:bg-slate-800/80">
      <div className="relative z-10">
        <span className="mb-2 block font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">{label}</span>
        <div className="flex items-baseline gap-3">
          <span className="font-sora text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">{value}</span>
          <span className={cx('rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider', tone)}>{badge}</span>
        </div>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{sublabel}</p>
      </div>
      <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 text-blue-600 transition-transform duration-300 group-hover:scale-110 dark:from-blue-500/20 dark:to-blue-600/5 dark:text-blue-400">
        {icon}
      </div>
    </div>
  );
}