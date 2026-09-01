import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload,
  ShieldCheck,
  ClipboardCheck,
  Lock,
  FileCheck2,
  Users,
  ArrowRight,
  CheckCircle2,
  Eye,
} from 'lucide-react';
import Logo2 from '../../assets/Logo2.svg';
import HeroAthletes from '../../assets/hero-athletes.png';

// Using bracket-value Tailwind classes for Tailwind v4 compatibility
const NAVY = '#1E3A8A';
const BLUE = '#2563EB';
const SUCCESS = '#10B981';

const NAV_LINKS = [
  { id: 'home', label: 'Home' },
  { id: 'how-it-works', label: 'How it works' },
  { id: 'features', label: 'Features' },
  { id: 'security', label: 'Security' },
] as const;

// Live document status animation showing credential pipeline
const CREDENTIAL_STATES = [
  { label: 'Draft', sub: 'Awaiting submission', color: '#6B7280', bg: '#F3F4F6', ring: '#E5E7EB' },
  { label: 'Pending review', sub: 'With your coach', color: '#B45309', bg: '#FEF3C7', ring: '#FDE68A' },
  { label: 'Verified', sub: 'Cleared to play', color: '#047857', bg: '#D1FAE5', ring: '#A7F3D0' },
] as const;

function CredentialBadge() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setStep((s) => (s + 1) % CREDENTIAL_STATES.length), 2200);
    return () => clearInterval(id);
  }, []);

  const state = CREDENTIAL_STATES[step];

  return (
    <div className="w-[min(300px,calc(100vw_-_2rem))] sm:w-80 lg:w-96 bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-900/15 p-4">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[10px] tracking-wider text-slate-500 uppercase">Credential #A-2291</p>
        <FileCheck2 className="h-3.5 w-3.5 text-slate-300" aria-hidden="true" />
      </div>

      <div
        className="mt-3 rounded-xl px-3 py-2.5 flex items-center justify-between transition-colors duration-500"
        style={{ backgroundColor: state.bg, boxShadow: `inset 0 0 0 1px ${state.ring}` }}
      >
        <div>
          <p className="text-sm font-bold transition-colors duration-500" style={{ color: state.color }}>
            {state.label}
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">{state.sub}</p>
        </div>
        {step === 2 ? (
          <CheckCircle2 className="h-5 w-5 transition-colors duration-500" style={{ color: state.color }} />
        ) : (
          <div className="flex gap-1" aria-hidden="true">
            {CREDENTIAL_STATES.map((_, i) => (
              <span
                key={i}
                className="h-1.5 w-1.5 rounded-full transition-colors duration-500"
                style={{ backgroundColor: i === step ? state.color : '#E5E7EB' }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const PROCESS_STEPS = [
  {
    n: '01',
    icon: Upload,
    title: 'Athlete submits to coach',
    desc: 'Hand your PSA certificate, medical clearance, or school ID to your coach — in person or however your team already collects them.',
  },
  {
    n: '02',
    icon: ClipboardCheck,
    title: 'Coach uploads the record',
    desc: 'Your coach scans or photographs the document and uploads it into your file, so nothing sits in a folder or gets lost.',
  },
  {
    n: '03',
    icon: Eye,
    title: 'You view, the league verifies',
    desc: 'You can see your own documents and their status at any time. Once the league office signs off, the record is locked as verified.',
  },
];

const ROLE_FEATURES = [
  {
    icon: Eye,
    title: 'For athletes',
    desc: 'View every document your coach has submitted on your behalf, and see exactly where each one stands — draft, pending, or verified.',
    preview: 'athlete',
  },
  {
    icon: Users,
    title: 'For coaches',
    desc: 'Upload and manage documents for your own roster only. Nothing from another team is visible in your account.',
    preview: 'coach',
  },
  {
    icon: ShieldCheck,
    title: 'For league admins',
    desc: 'Full visibility across every college, with an immutable audit trail of who uploaded and verified what, and when.',
    preview: 'admin',
  },
] as const;

// Feature cards showing product UI samples
function FeaturePreview({ kind }: { kind: 'athlete' | 'coach' | 'admin' }) {
  if (kind === 'athlete') {
    return (
      <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5 flex items-center justify-between">
        <span className="text-xs font-medium text-slate-600">PSA Certificate</span>
        <span className="inline-flex items-center gap-1 text-[10px] font-bold" style={{ color: '#047857' }}>
          <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
          Verified
        </span>
      </div>
    );
  }

  if (kind === 'coach') {
    const rows = [
      { name: 'J. Santos', color: SUCCESS },
      { name: 'M. Cruz', color: '#B45309' },
      { name: 'R. Dela Peña', color: '#6B7280' },
    ];
    return (
      <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5 space-y-1.5">
        {rows.map((r) => (
          <div key={r.name} className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: r.color }} aria-hidden="true" />
            <span className="text-xs text-slate-600">{r.name}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5">
      <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wide">Audit log</p>
      <p className="text-xs text-slate-600 mt-1.5">
        Coach Reyes verified 1 document <span className="text-slate-500">· 2m ago</span>
      </p>
    </div>
  );
}

// Security claims reframed as a real lifecycle — ingest, store, access —
// rather than a flat unordered list.
const SECURITY_STEPS = [
  {
    icon: FileCheck2,
    stage: 'Ingest',
    text: 'Every upload is fingerprinted with SHA-256 the moment it lands, so tampering after the fact is detectable.',
    showRing: false,
  },
  {
    icon: Lock,
    stage: 'Store',
    text: 'Storage paths are namespaced per athlete UUID — there is no guessable file link to begin with.',
    showRing: false,
  },
  {
    icon: ShieldCheck,
    stage: 'Access',
    text: 'Even a valid link expires 60 seconds after it is issued.',
    showRing: true,
  },
] as const;

function ExpiryRing() {
  return (
    <svg width="32" height="32" viewBox="0 0 36 36" className="shrink-0" aria-hidden="true">
      <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="3" />
      <circle
        cx="18"
        cy="18"
        r="14"
        fill="none"
        stroke="#93C5FD"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="88"
        className="ring-drain-circle"
        style={{ animation: 'ring-drain 60s linear infinite' }}
        transform="rotate(-90 18 18)"
      />
    </svg>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<string>('home');
  const sectionsRef = useRef<Record<string, HTMLElement | null>>({});
  const [featuresVisible, setFeaturesVisible] = useState(false);
  const featuresRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: '-45% 0px -50% 0px', threshold: 0 }
    );

    NAV_LINKS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) {
        sectionsRef.current[id] = el;
        observer.observe(el);
      }
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const el = featuresRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setFeaturesVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Archivo+Black&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500&display=swap');
        .font-display { font-family: 'Archivo Black', 'Inter', sans-serif; }
        .font-mono { font-family: 'IBM Plex Mono', monospace; }

        @keyframes ring-drain {
          from { stroke-dashoffset: 0; }
          to { stroke-dashoffset: 88; }
        }

        @media (prefers-reduced-motion: reduce) {
          .ring-drain-circle {
            animation: none !important;
          }
        }
      `}</style>

      {/* NAVBAR */}
      <header className="px-6 md:px-15 py-5 flex justify-between items-center border-b border-slate-100 sticky top-0 bg-white/90 backdrop-blur z-20">
        <img src={Logo2} alt="ILOPRISAA" className="h-7 w-auto" />
        <nav className="hidden md:flex gap-8 text-sm font-semibold text-slate-600">
          {NAV_LINKS.map((link) => {
            const isActive = activeSection === link.id;
            return (
              <a
                key={link.id}
                href={`#${link.id}`}
                className="pb-1 border-b-2 transition-colors"
                style={{
                  color: isActive ? BLUE : undefined,
                  borderColor: isActive ? BLUE : 'transparent',
                }}
              >
                {link.label}
              </a>
            );
          })}
        </nav>
        <button
          onClick={() => navigate('/login')}
          className="text-white text-sm px-5 py-3 rounded-xl font-bold bg-[#1E3A8A] hover:bg-[#2563EB] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#2563EB]"
        >
          Sign in
        </button>
      </header>

     {/* HERO */}
      <main>
        <section id="home" className="relative -mt-2 overflow-hidden pt-0 pb-0 scroll-mt-24">
          
          {/* Full-bleed athlete photo as a right-side background — not a card.
              Only kicks in at lg+, where the larger heading size gives the
              section enough height for this full-bleed technique to read
              correctly. Below that, the grid-column image block below does
              the job at a size that matches its own container instead. */}
          <div className="hidden lg:flex absolute inset-y-0 right-0 w-1/2 items-start justify-end">
            <div className="relative">
              <img
                src={HeroAthletes}
                alt="ILOPRISAA student-athletes competing in track, basketball, volleyball, and swimming"
                className="max-w-full max-h-full w-auto h-auto object-contain"
                style={{
                  WebkitMaskImage: 'linear-gradient(to bottom, black 70%, transparent 85%)',
                  maskImage: 'linear-gradient(to bottom, black 70%, transparent 85%)'
                }}
              />

              {/* Image itself stays flush at the container's right edge
                  (no margin). Only the badge's own right-15 reaches past
                  the image's edge back to the header's 60px inset (px-15),
                  so it lines up with Sign In without moving the photo. */}
              <div className="absolute bottom-4 right-15">
                <CredentialBadge />
              </div>
            </div>
          </div>

          <div className="relative max-w-7xl mx-auto px-6 md:px-10 grid md:grid-cols-2 gap-14 items-center">
            <div className="py-16 md:py-28 -translate-y-15">
              <span
                className="inline-flex items-center gap-2 text-xs font-mono font-semibold rounded-full px-3 py-1"
                style={{ color: BLUE, backgroundColor: '#EFF6FF', border: '1px solid #DBEAFE' }}
              >
                <Lock className="h-3 w-3" aria-hidden="true" />
                The digital standard for Iloilo Prisaa.
              </span>

              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl text-slate-900 leading-[1.05] mt-5 tracking-tight">
                Eligibility documents,
                <br />
                <span style={{ color: BLUE }}>verified</span> not chased.
              </h1>

              <p className="mt-6 text-slate-500 text-lg max-w-md leading-relaxed">
                Ditch the folders. ILOPRISAA DMS centralizes athlete credentials into a single, secured digital record. Coaches upload, leagues verify, and athletes stay ready to play.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <button
                  onClick={() => navigate('/login')}
                  className="text-white px-7 py-3.5 rounded-xl font-bold shadow-lg inline-flex items-center gap-2 bg-[#2563EB] hover:bg-[#1E3A8A] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#2563EB]"
                  style={{ boxShadow: '0 10px 25px -5px rgba(37,99,235,0.3)' }}
                >
                  Get started
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
                <a href="#how-it-works" className="text-sm font-semibold text-slate-600 border border-slate-300 rounded-xl px-6 py-3 hover:border-slate-400 hover:text-slate-900 transition-colors">
                  See how it works
                </a>
              </div>

              <div className="mt-10 flex items-center gap-6 text-xs text-slate-500 font-mono">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5" style={{ color: SUCCESS }} aria-hidden="true" />
                  Row-level secured
                </span>
                <span className="flex items-center gap-1.5">
                  <FileCheck2 className="h-3.5 w-3.5" style={{ color: SUCCESS }} aria-hidden="true" />
                  SHA-256 signed
                </span>
              </div>
            </div>

            {/* Image participates in normal grid flow from mobile through
                tablet: stacks below the text at a single column, sits
                beside it once md:grid-cols-2 kicks in. Badge is anchored to
                THIS wrapper (sized to the image itself), not to the
                section's height, so it can't end up floating disconnected
                from the photo the way a height-mismatched absolute overlay
                can. Hidden at lg+, where the full-bleed background photo
                above takes over instead. */}
            <div className="relative mt-10 md:mt-0 lg:hidden">
              <img
                src={HeroAthletes}
                alt="ILOPRISAA student-athletes competing in track, basketball, volleyball, and swimming"
                className="w-full h-auto"
                style={{
                  WebkitMaskImage: 'linear-gradient(to bottom, black 70%, transparent 85%)',
                  maskImage: 'linear-gradient(to bottom, black 70%, transparent 85%)'
                }}
              />
              <div className="absolute bottom-4 right-4">
                <CredentialBadge />
              </div>
            </div>
          </div>
        </section>


        {/* HOW IT WORKS */}
        <section id="how-it-works" className="px-6 md:px-10 pt-27 pb-20 bg-slate-50 border-y border-slate-100 scroll-mt-24">
          <div className="max-w-6xl mx-auto">
            <div className="max-w-xl mb-14">
              <p className="text-xs font-mono font-semibold uppercase tracking-wider" style={{ color: BLUE }}>The pipeline</p>
              <h2 className="font-display text-3xl md:text-4xl text-slate-900 mt-3 tracking-tight">Three steps, one record</h2>
              <p className="mt-4 text-slate-500">
                Your coach handles the upload — you always keep visibility into your own file.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {PROCESS_STEPS.map((step) => (
                <div key={step.n} className="bg-white rounded-2xl border border-slate-200 p-7">
                  <div className="flex items-start justify-between">
                    <div className="h-11 w-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#EFF6FF' }}>
                      <step.icon className="h-5 w-5" style={{ color: BLUE }} aria-hidden="true" />
                    </div>
                    <span className="font-mono text-2xl text-slate-200 font-bold" aria-hidden="true">{step.n}</span>
                  </div>
                  <h3 className="text-base font-bold mt-5 text-slate-900">{step.title}</h3>
                  <p className="text-slate-500 text-sm mt-2 leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ROLE-BASED FEATURES */}
        <section id="features" className="px-6 md:px-10 py-20 scroll-mt-24">
          <div className="max-w-6xl mx-auto">
            <div className="max-w-xl mb-14">
              <p className="text-xs font-mono font-semibold uppercase tracking-wider" style={{ color: BLUE }}>Built for the whole league</p>
              <h2 className="font-display text-3xl md:text-4xl text-slate-900 mt-3 tracking-tight">One system, three vantage points</h2>
            </div>

            <div
              ref={featuresRef}
              className={`grid md:grid-cols-3 gap-6 transition-[opacity,transform] duration-700 ease-out motion-reduce:transition-none ${
                featuresVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
            >
              {ROLE_FEATURES.map((f) => (
                <div key={f.title} className="p-7 rounded-2xl border-2 border-slate-100 hover:border-blue-100 transition-colors">
                  <f.icon className="h-7 w-7" style={{ color: BLUE }} aria-hidden="true" />
                  <h3 className="text-base font-bold mt-4 text-slate-900">{f.title}</h3>
                  <p className="text-slate-500 text-sm mt-2 leading-relaxed">{f.desc}</p>
                  <div className="mt-5">
                    <FeaturePreview kind={f.preview} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECURITY */}
        <section id="security" className="px-6 md:px-10 py-20 scroll-mt-24" style={{ backgroundColor: NAVY }}>
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs font-mono font-semibold uppercase tracking-wider text-blue-300">Under the hood</p>
              <h2 className="font-display text-3xl md:text-4xl text-white mt-3 tracking-tight">
                Access control that lives in the database, not the UI
              </h2>
              <p className="mt-4 text-slate-300 leading-relaxed max-w-md">
                Every table is protected by row-level security policies enforced by Postgres itself —
                a coach can only ever manage their own assigned athletes, and an athlete can only ever
                view their own file. That rule can't be bypassed from the browser.
              </p>
            </div>

            <div className="grid gap-4">
              {SECURITY_STEPS.map((item, i) => (
                <div key={i} className="flex items-start gap-4 bg-white/5 border border-white/10 rounded-xl p-4">
                  <item.icon className="h-5 w-5 text-blue-300 shrink-0 mt-0.5" aria-hidden="true" />
                  <div className="flex-1">
                    <p className="text-[10px] font-mono uppercase tracking-wider" style={{ color: '#93C5FD' }}>{item.stage}</p>
                    <p className="text-sm text-slate-200 leading-relaxed mt-1">{item.text}</p>
                  </div>
                  {item.showRing && <ExpiryRing />}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-6 md:px-10 py-20 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="font-display text-3xl md:text-4xl text-slate-900 tracking-tight">
              Ready to clear your roster?
            </h2>
            <p className="mt-4 text-slate-500">
              Ask your college coordinator for an ILOPRISAA DMS account to get started.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="mt-8 text-white px-8 py-3.5 rounded-xl font-bold shadow-lg inline-flex items-center gap-2 bg-[#2563EB] hover:bg-[#1E3A8A] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#2563EB]"
              style={{ boxShadow: '0 10px 25px -5px rgba(37,99,235,0.3)' }}
            >
              Sign in to your account
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-slate-950 text-slate-400 py-14 px-6 md:px-10">
        <div className="max-w-6xl mx-auto grid md:grid-cols-[1.4fr_1fr_1fr] gap-10">
          <div>
            <img src={Logo2} alt="ILOPRISAA" className="h-7 w-auto opacity-90" />
            <p className="mt-4 text-sm text-slate-500 max-w-xs leading-relaxed">
              Centralized eligibility documentation for Iloilo college athletics.
            </p>
          </div>

          <div>
            <p className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-500">Product</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              {NAV_LINKS.map((link) => (
                <li key={link.id}>
                  <a href={`#${link.id}`} className="inline-block py-1 hover:text-white transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-500">Support</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <a href="mailto:support@iloprisaa.org" className="inline-block py-1 hover:text-white transition-colors font-mono">
                  support@iloprisaa.org
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-6xl mx-auto mt-12 pt-6 border-t border-white/10 text-xs font-mono text-slate-600">
          <p>© {new Date().getFullYear()} ILOPRISAA · Iloilo</p>
        </div>
      </footer>
    </div>
  );
}