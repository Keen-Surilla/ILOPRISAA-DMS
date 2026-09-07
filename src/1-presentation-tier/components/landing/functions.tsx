import { Check, Upload, ClipboardCheck, Eye, ShieldCheck, GraduationCap, User } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';


export function SchoolChip({ school, hidden }: { school: (typeof SCHOOLS)[number]; hidden?: boolean }) {
  return (
    <div
      aria-hidden={hidden || undefined}
      className="group flex w-75 shrink-0 cursor-default items-center gap-3.5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-colors dark:border-slate-800 dark:bg-[#0f172a]"
    >
      <div className="flex h-12 w-15 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-center text-[10px] font-bold leading-tight tracking-tight text-blue-600 transition-transform group-hover:scale-105 dark:border-blue-500/20 dark:bg-blue-600/10 dark:text-blue-400">
        {school.code}
      </div>
      <div className="min-w-0 flex-1">
        <span className="block truncate text-xs font-bold text-slate-900 dark:text-slate-100">{school.name}</span>
        <span className="mt-0.5 block truncate font-mono text-[11px] font-medium text-blue-600/80 dark:text-blue-400/80">{school.mascot}</span>
      </div>
    </div>
  );
}

export function RoleCard({ role }: { role: (typeof ROLES)[number] }) {
  const Icon = role.icon;
  return (
    <div
      className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-md transition-all duration-300 hover:-translate-y-1 dark:border-slate-800 dark:bg-[#0f172a] dark:shadow-lg"
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = role.accent)}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = '')}
    >
      <div>
        <div
          className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border transition-colors"
          style={{ backgroundColor: `${role.accent}1a`, borderColor: `${role.accent}33`, color: role.accent }}
        >
          <Icon className="h-6 w-6" aria-hidden="true" />
        </div>
        <div className="mb-2 flex items-center justify-between">
          <span className="font-mono text-[11px] font-semibold uppercase tracking-wider" style={{ color: role.accent }}>
            {role.tier}
          </span>
          <span
            className="rounded border px-2 py-0.5 font-mono text-[10px]"
            style={{ backgroundColor: `${role.accent}1a`, borderColor: `${role.accent}33`, color: role.accent }}
          >
            {role.tag}
          </span>
        </div>
        <h3 className="mb-2 font-sora text-xl font-bold text-slate-900 dark:text-white">{role.title}</h3>
        <p className="mb-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{role.desc}</p>
      </div>
      <ul className="space-y-2 border-t border-slate-100 pt-4 font-mono text-xs text-slate-600 dark:border-slate-800 dark:text-slate-400">
        {role.bullets.map((bullet) => (
          <li key={bullet} className="flex items-center gap-2">
            <Check className="h-3.5 w-3.5 shrink-0" style={{ color: role.accent }} aria-hidden="true" />
            {bullet}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function StateCard({ state }: { state: (typeof STATE_MACHINE_STATES)[number] & { highlight?: boolean } }) {
  return (
    <div
      className="relative flex flex-col justify-between rounded-xl border bg-slate-50/80 p-5 dark:bg-[#131f37]/80"
      style={{
        borderColor: state.highlight ? `${state.accent}80` : undefined,
        boxShadow: state.highlight ? `0 0 20px ${state.accent}26` : undefined,
      }}
    >
      {state.highlight && (
        <span className="absolute -top-3 right-4 rounded-full bg-blue-600 px-2.5 py-0.5 font-mono text-[10px] font-bold text-white dark:bg-blue-500">
          Active queue
        </span>
      )}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <span className="font-mono text-xs font-semibold text-slate-500 dark:text-slate-400">{state.step}</span>
          <span className={`h-2.5 w-2.5 rounded-full ${state.highlight ? 'animate-pulse' : ''}`} style={{ backgroundColor: state.accent }} />
        </div>
        <div className="mb-1 font-sora text-lg font-bold text-slate-900 dark:text-white">{state.title}</div>
        <div className="mb-3 font-mono text-xs" style={{ color: state.accent }}>
          {state.status}
        </div>
        {state.desc ? (
          <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">{state.desc}</p>
        ) : (
          <div className="mt-1 space-y-2">
            <div className="rounded border border-emerald-200 bg-emerald-50 p-2 text-[11px] dark:border-emerald-500/30 dark:bg-emerald-900/30">
              <span className="block font-mono font-bold text-emerald-600 dark:text-emerald-400">verified</span>
              <span className="text-slate-700 dark:text-slate-300">Stamped, tournament eligible.</span>
            </div>
            <div className="rounded border border-rose-200 bg-rose-50 p-2 text-[11px] dark:border-rose-500/30 dark:bg-rose-900/30">
              <span className="block font-mono font-bold text-rose-600 dark:text-rose-400">rejected</span>
              <span className="text-slate-700 dark:text-slate-300">Requires a rejection reason.</span>
            </div>
          </div>
        )}
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4 font-mono text-[11px] text-slate-500 dark:border-slate-700 dark:text-slate-400">
        <span>Actor: {state.actor}</span>
        <span style={{ color: state.accent }}>{state.meta}</span>
      </div>
    </div>
  );
}



function useReveal<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, visible };
}

export function Reveal({ children, className = '' }: { children: ReactNode; className?: string }) {
  const { ref, visible } = useReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={`transition-[opacity,transform] duration-700 ease-out motion-reduce:transition-none ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
      } ${className}`}
    >
      {children}
    </div>
  );
}


export const PROCESS_STEPS = [
  {
    n: '01',
    icon: Upload,
    title: 'Physical handover to coach',
    desc: 'Athletes physically submit their PSA certificates, medical clearances, and school IDs directly to their team coach.',
  },
  {
    n: '02',
    icon: ClipboardCheck,
    title: 'Coach digitizes and uploads',
    desc: 'Your coach scans or photographs the physical documents and uploads them straight into the system file.',
  },
  {
    n: '03',
    icon: Eye,
    title: 'Committee reviews and verifies',
    desc: 'The committee reviews the digital dossier. Once approved, the record is locked and tournament-eligible.',
  },
] as const;

export const ROLES = [
  {
    tier: '01',
    tag: 'RLS bypass guarded',
    icon: ShieldCheck,
    accent: '#3b82f6',
    title: 'Admin',
    desc: 'League-wide governance and final oversight. Provisions member schools, controls state-machine parameters, and audits every action across ILOPRISAA.',
    bullets: ['Provision schools & issue credentials', 'Full audit trail access', 'Invite permissions'],
  },
  {
    tier: '02',
    tag: 'Institutional',
    icon: GraduationCap,
    accent: '#3b82f6',
    title: 'School Admin',
    desc: "Manages one school's delegation. Verifies coach credentials, assigns rosters, and signs off on completeness before submission. ",
    bullets: ['Manage delegation roster', ' Assign & supervise coaches', 'Export official roster'],
  },
  {
    tier: '03',
    tag: 'Review board',
    icon: ClipboardCheck,
    accent: '#3b82f6',
    title: 'Committee',
    desc: 'Runs document review across four tabs — Pending, Master Records, Action Required, Compliance Overview — and rules on every submission.',
    bullets: ['Review across four tabs', 'Approve or reject documents', 'Require a reason on every rejection'],
  },
  {
    tier: '04',
    tag: 'Dossier builder',
    icon: User,
    accent: '#3b82f6',
    title: 'Coach',
    desc: "Builds each athlete's dossier, birth certificates, medical clearances, transcripts, and manages secure, time-limited access to it." ,
    bullets: ['Tracks compliance status', 'Handles document submission', 'Manages their own roster'],
  },
] as const;

export const STATE_MACHINE_STATES = [
  {
    step: 'State 01',
    accent: '#60a5fa',
    title: 'Coach upload',
    status: 'draft',
    desc: 'Coach compiles the PSA record, medical results, and transcript. A hash is computed for the file the moment it lands.',
    actor: 'Coach',
    meta: 'Trigger: submit()',
  },
  {
    step: 'State 02',
    accent: '#fbbf24',
    title: 'Pending review',
    status: 'pending_review',
    desc: "Locked against edits. Queued in the committee's dashboard for validation, birth-year checks, and academic unit audit.",
    actor: 'Committee',
    meta: 'Status: in review',
    highlight: true,
  },
  {
    step: 'State 03',
    accent: '#22d3ee',
    title: 'Decision gate',
    status: 'verified | rejected',
    desc: null,
    actor: 'Committee',
    meta: 'Enforced payload',
  },
  {
    step: 'State 04',
    accent: '#a78bfa',
    title: 'Automated expiry',
    status: 'expired',
    desc: 'Triggered automatically by a scheduled pg_cron job once a medical permit or academic window exceeds its validity window.',
    actor: 'pg_cron',
    meta: 'Schedule: 0 0 * * *',
  },
] as const;

export const TRANSITIONS = [
  { n: '1', label: 'Draft → Pending', color: '#60a5fa' },
  { n: '2', label: 'Pending → Verified',  color: '#34d399' },
  { n: '3', label: 'Pending → Rejected', color: '#fb7185' },
  { n: '4', label: 'Rejected → Pending',  color: '#fbbf24' },
  { n: '5', label: 'Verified → Expired', color: '#a78bfa' },
] as const;

export const SCHOOLS = [
  { code: 'CPU', name: 'Central Philippine University', mascot: 'Centralians' },
  { code: 'SAN AG', name: 'University of San Agustin', mascot: 'Agustinians' },
  { code: 'JOHN B', name: 'John B. Lacson Maritime', mascot: 'Lacsonians' },
  { code: 'WIT', name: 'Western Institute of Technology', mascot: 'Wittians' },
  { code: 'DOCTORS', name: "Iloilo Doctors' College", mascot: 'IDCians' },
  { code: 'ST. PAUL', name: 'St. Paul University Iloilo', mascot: 'Paulinians' },
  { code: 'UI', name: 'PHINMA University of Iloilo', mascot: 'PHINMANIANS' },
  { code: 'HUA SIONG', name: 'Hua Siong College', mascot: 'Red Phoenix' },
  { code: 'SAGRADO', name: 'Colegio del Sagrado Corazon', mascot: 'Sagradistas' },
  { code: 'SJI', name: 'Sun Yat Sen High School', mascot: 'Golden Dragons' },
] as const;


export const BG = '#0b1120';
export const SURFACE = '#0f172a';
export const SURFACE_ALT = '#131f37';
export const SURFACE_DEEP = '#070d1a';
export const BORDER = '#1e293b';
export const PRIMARY = '#3b82f6';

export const NAV_LINKS = [
  { id: 'home', label: 'Home' },
  { id: 'institutions', label: 'Schools' },
  { id: 'how-it-works', label: 'How it works' },
  { id: 'roles', label: 'Roles' },
  { id: 'state-machine', label: 'State machine' },
] as const;




export function smoothScrollTo(targetId: string, customOffset?: number) {
  const targetElement = document.getElementById(targetId);
  if (!targetElement) return;

  const sectionOffsets: Record<string, number> = {
    'institutions': 200, 
    'how-it-works': 80, 
    'home': 75,
  };


  const headerOffset = customOffset ?? sectionOffsets[targetId] ?? 0;

  const elementPosition = targetElement.getBoundingClientRect().top;
  const startingY = window.pageYOffset;
  const targetY = startingY + elementPosition - headerOffset;
  
  const duration = 400; 
  let startTime: number | null = null;

  const easeInOutCubic = (t: number) => 
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  const animationStep = (currentTime: number) => {
    if (startTime === null) startTime = currentTime;
    const timeElapsed = currentTime - startTime;
    const progress = Math.min(timeElapsed / duration, 1);
    
    const easeProgress = easeInOutCubic(progress);
    
    window.scrollTo(0, startingY + (targetY - startingY) * easeProgress);

    if (timeElapsed < duration) {
      requestAnimationFrame(animationStep);
    }
  };

  requestAnimationFrame(animationStep);
}
