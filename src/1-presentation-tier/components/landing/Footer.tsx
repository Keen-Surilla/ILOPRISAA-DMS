import { ShieldCheck, ArrowRight } from 'lucide-react';
import Logo2 from '../../../assets/Frame 100.svg';
import { ROLES, SCHOOLS } from './functions';

export function Footer() {
  return (
    <footer className="w-full border-t border-slate-200 bg-slate-50 pb-12 pt-16 dark:border-slate-800/80 dark:bg-[#070d1a]">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-blue-500/20 to-transparent dark:via-sky-500/30" />
      <div className="mx-auto max-w-[1600px] px-4 pb-12 pt-16 md:px-8 xl:px-12">
        <div className="grid grid-cols-1 gap-10 border-b border-slate-200 pb-16 dark:border-slate-800/80 md:grid-cols-2 lg:grid-cols-12 lg:gap-12">
          
          <div className="flex flex-col justify-between space-y-6 lg:col-span-5">
            <div className="space-y-4">
              <div className="flex items-center gap-3.5">
                <img src={Logo2} alt="ILOPRISAA" className="h-10 w-auto object-contain" />
                <div className="border-l border-slate-300 pl-3.5 dark:border-slate-700/80" />
              </div>
              <p className="max-w-sm text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                Digital athlete document verification for the Private Schools Athletic Association in Iloilo,
                built for auditable integrity and strict collegiate athletic compliance.
              </p>
            </div>
          </div>
          
          <div className="flex flex-col space-y-3.5 lg:col-span-2">
            <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-widest text-slate-900 dark:text-slate-200">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
              Platform &amp; security
            </div>
            <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400">
              <li><a href="#how-it-works" className="block transition-colors hover:text-blue-600 dark:hover:text-sky-400">Verification pipeline</a></li>
              <li><a href="#state-machine" className="block transition-colors hover:text-blue-600 dark:hover:text-sky-400">Postgres state machine</a></li>
              <li><a href="#roles" className="block transition-colors hover:text-blue-600 dark:hover:text-sky-400">Audit trail</a></li>
            </ul>
          </div>
          
          <div className="flex flex-col space-y-3.5 lg:col-span-2">
            <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-widest text-slate-900 dark:text-slate-200">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-500 dark:bg-sky-400" />
              Roles
            </div>
            <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400">
              {ROLES.map((role) => (
                <li key={role.title}>
                  <a href="#roles" className="block transition-colors hover:text-blue-600 dark:hover:text-sky-400">
                    {role.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="flex flex-col space-y-3.5 lg:col-span-3">
            <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-widest text-slate-900 dark:text-slate-200">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-600 dark:bg-cyan-400" />
              Member institutions
            </div>
            <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400">
              {SCHOOLS.slice(0, 5).map((school) => (
                <li key={school.code}>
                  <a href="#institutions" className="block transition-colors hover:text-blue-600 dark:hover:text-sky-400">
                    {school.name}
                  </a>
                </li>
              ))}
              <li>
                <a href="#institutions" className="mt-1 inline-flex items-center gap-1 font-medium text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                  View all {SCHOOLS.length} schools
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="flex flex-col items-center justify-between gap-4 pt-8 font-mono text-xs text-slate-500 dark:text-slate-400 lg:flex-row">
          <p className="text-center lg:text-left">
            © {new Date().getFullYear()} Iloilo Private Schools Athletic Association (ILOPRISAA).
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-[11px]">
            <span className="flex items-center gap-1.5 text-slate-500">
              <ShieldCheck className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
              Powered by Supabase RLS &amp; Postgres triggers
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}