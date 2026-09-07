// src/1-presentation-tier/pages/super-admin/OverviewSection.tsx
import { UserPlus, Plus, Building2, Users, ShieldCheck } from 'lucide-react';
import { type SectionId } from './constants';
import { SectionIntro, StatCard, cx } from './sharedUi';

export function OverviewSection({ onNavigate }: { onNavigate: (s: SectionId) => void }) {
  const totalDocs = 1248;
  
  // Custom metrics mapping matching the design layout exactly
  const metrics = [
    { label: 'Verified', count: '1,042', sub: '83.5% Cleared', dot: 'bg-emerald-500', text: 'text-emerald-400' },
    { label: 'Pending Review', count: '124', sub: '9.9% In Pipeline', dot: 'bg-amber-500', text: 'text-amber-400' },
    { label: 'Discrepancy', count: '58', sub: '4.6% Flagged', dot: 'bg-rose-500', text: 'text-rose-400' },
    { label: 'Expired', count: '24', sub: '2% Invalid Nonce/TTL', dot: 'bg-purple-500', text: 'text-purple-400' },
  ];

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500">
      <SectionIntro
        eyebrow="Region VI Governance Intelligence"
        title="Super-Admin Overview"
        description="Compliance rollup, audit invariants, and urgent document watchlists across 10 member institutions."
        action={
          <>
            <button onClick={() => onNavigate('invitations')} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:shadow dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">
              <UserPlus className="h-4 w-4 text-blue-600 dark:text-blue-400" /> Account Invite
            </button>
            <button onClick={() => onNavigate('institutions')} className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm shadow-blue-600/20 transition-all hover:bg-blue-500 hover:shadow-blue-600/40 active:scale-95">
              <Plus className="h-4 w-4" /> Add Member School
            </button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <StatCard label="Accredited Schools" value="10" sublabel="Private Schools Athletic Association member bodies" badge="100% Region VI" badgeTone="emerald" icon={<Building2 className="h-6 w-6" />} />
        <StatCard label="Athletes Enrolled" value="1,248" sublabel="Tertiary & secondary division active rosters" badge="+184 this season" badgeTone="emerald" icon={<Users className="h-6 w-6" />} />
        <StatCard label="Active Officers" value="26" sublabel="14 School Admins • 8 Screening • 4 Super-Admins" badge="5 Invites Pending" badgeTone="amber" icon={<ShieldCheck className="h-6 w-6" />} />
      </div>

      {/* Aggregated Document Compliance Rollup Card */}
      <div className="flex flex-col gap-6 rounded-2xl border border-slate-800 bg-[#0b1220] p-6 sm:p-8 shadow-xl">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-sora text-lg font-bold text-white">Aggregated Document Compliance Rollup</h3>
            <p className="mt-1 text-sm text-slate-400">Real-time audit status of {totalDocs.toLocaleString()} athlete document portfolios (PSA Birth Cert, DepEd Form 137, Medical Clearances).</p>
          </div>
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-bold text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" /> 93.4% Total Compliance
          </span>
        </div>

        {/* Multi-segmented Progress Bar */}
        <div className="flex h-3.5 w-full overflow-hidden rounded-full bg-slate-900 border border-slate-800 p-0.5 gap-1 shadow-inner">
          <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: '83.5%' }} title="Verified: 83.5%" />
          <div className="h-full rounded-full bg-amber-500 transition-all" style={{ width: '9.9%' }} title="Pending Review: 9.9%" />
          <div className="h-full rounded-full bg-rose-500 transition-all" style={{ width: '4.6%' }} title="Discrepancy: 4.6%" />
          <div className="h-full rounded-full bg-purple-500 transition-all" style={{ width: '2.0%' }} title="Expired: 2%" />
        </div>

        {/* 4 Metric Breakdown Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((m) => (
            <div key={m.label} className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm transition-colors hover:border-slate-700">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{m.label}</span>
                <span className={cx('h-2 w-2 rounded-full', m.dot)} />
              </div>
              <div className="mt-4 flex flex-col">
                <span className="font-sora text-3xl font-extrabold tracking-tight text-white">{m.count}</span>
                <span className={cx('mt-1 text-xs font-semibold', m.text)}>{m.sub}</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}