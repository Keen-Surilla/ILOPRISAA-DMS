import { IdCard, Check, ShieldCheck } from 'lucide-react';
import { ROLES, RoleCard, Reveal } from './functions';

export function RolesSection() {
  return (
    <section className="mx-auto w-full max-w-[1600px] px-4 py-24 md:px-8 xl:px-12" id="roles">
      <Reveal className="mx-auto mb-16 max-w-3xl text-center">
        <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1 font-mono text-xs font-semibold uppercase tracking-wider text-blue-600 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400">
          <IdCard className="h-3.5 w-3.5" aria-hidden="true" />
         ACCESS CONTROL
        </div>
        <h2 className="mb-4 font-sora text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
          Clear permissions for every level of the league
        </h2>
        <p className="text-base leading-relaxed text-slate-600 dark:text-slate-300">
          Secure access ensures everyone, from league directors to team coaches, only sees what they need to. Athlete privacy is built in by default.
        </p>
      </Reveal>
      
      <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {ROLES.map((role) => (
          <RoleCard key={role.title} role={role} />
        ))}
      </div>
        <Reveal className="flex w-full flex-col items-center justify-between gap-6 rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 via-white to-slate-50 p-6 shadow-sm dark:border-blue-500/30 dark:from-blue-950/70 dark:via-[#131f37] dark:to-slate-900 dark:shadow-[0_0_40px_rgba(59,130,246,0.15)] md:flex-row md:p-8">
        <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-blue-200 bg-blue-100 text-blue-600 dark:border-blue-500/30 dark:bg-blue-600/20 dark:text-blue-400">
            <ShieldCheck className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
            <span className="mb-1 block font-mono text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Coach-Led Pipeline
            </span>
            <h4 className="mb-1 font-sora text-lg font-bold text-slate-900 dark:text-white">Built exclusively for institutional officers</h4>
            <p className="max-w-3xl text-sm text-slate-600 dark:text-slate-300">
                By keeping accounts restricted to coaches, school admins, and committee members, the league ensures complete accountability, zero student login friction, and strict compliance.
            </p>
            </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 font-mono text-xs text-slate-600 dark:border-blue-500/30 dark:bg-[#0b1120] dark:text-slate-300">
            <Check className="h-4 w-4 text-emerald-500 dark:text-emerald-400" aria-hidden="true" />
            Zero student accounts
        </div>
        </Reveal>
    </section>
  );
}