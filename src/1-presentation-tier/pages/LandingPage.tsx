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
import Logo2 from '../../assets/Logo2.svg'; // Using your brand assets
import HeroAthletes from '../../assets/hero-athletes.png';

// Brand colors as explicit hex values (not Tailwind theme keys).
// Your package.json is on Tailwind v4, which does not read the legacy
// tailwind.config.js theme.extend block used here, so bg-brand-blue /
// text-brand-navy etc. were silently generating no CSS -> invisible
// button text. Using bracket-value classes sidesteps that entirely.
const NAVY = '#1E3A8A';
const BLUE = '#2563EB';
const SUCCESS = '#10B981';

const NAV_LINKS = [
  { id: 'home', label: 'Home' },
  { id: 'how-it-works', label: 'How it works' },
  { id: 'features', label: 'Features' },
  { id: 'security', label: 'Security' },
] as const;

// ─────────────────────────────────────────────────────────
// Signature element: a live snapshot of the document pipeline,
// using the same status colors as DocumentComponents in the app.
// Sits docked to the bottom edge of the hero photo.
// ─────────────────────────────────────────────────────────
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
    <div className="w-120 bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-900/15 p-4 absolute bottom-10 -left-115 md:right-0">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[10px] tracking-wider text-slate-400 uppercase">Credential #A-2291</p>
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
  },
  {
    icon: Users,
    title: 'For coaches',
    desc: 'Upload and manage documents for your own roster only. Nothing from another team is visible in your account.',
  },
  {
    icon: ShieldCheck,
    title: 'For league admins',
    desc: 'Full visibility across every college, with an immutable audit trail of who uploaded and verified what, and when.',
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<string>('home');
  const sectionsRef = useRef<Record<string, HTMLElement | null>>({});

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

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Archivo+Black&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500&display=swap');
        .font-display { font-family: 'Archivo Black', 'Inter', sans-serif; }
        .font-mono { font-family: 'IBM Plex Mono', monospace; }
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
          className="text-white text-sm px-5 py-2.5 rounded-xl font-bold transition-colors"
          style={{ backgroundColor: NAVY }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = BLUE)}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = NAVY)}
        >
          Sign in
        </button>
      </header>

     {/* HERO */}
      <main>
        <section id="home" className="relative overflow-hidden pt-14 pb-24 md:pt-0 md:pb-0 scroll-mt-24">
          
          {/* Full-bleed athlete photo as a right-side background — not a card */}
          <div className="hidden md:flex absolute inset-y-0 right-0 w-1/2 items-center justify-center">
            <img
              src={HeroAthletes}
              alt="ILOPRISAA student-athletes competing in track, basketball, volleyball, and swimming"
              className="w-full h-full object-contain object-top"
              // ADDED: CSS Mask to fade out the bottom 30% of the image
              style={{
                WebkitMaskImage: 'linear-gradient(to bottom, black 70%, transparent 85%)',
                maskImage: 'linear-gradient(to bottom, black 70%, transparent 85%)'
              }}
            />
            
            <div className="absolute bottom-18 right-20">
              <CredentialBadge />
            </div>
          </div>

          <div className="relative max-w-7xl mx-auto px-6 md:px-10 grid md:grid-cols-2 gap-14 items-center">
            <div className="py-16 md:py-28">
              <span
                className="inline-flex items-center gap-2 text-xs font-mono font-semibold rounded-full px-3 py-1"
                style={{ color: BLUE, backgroundColor: '#EFF6FF', border: '1px solid #DBEAFE' }}
              >
                <Lock className="h-3 w-3" aria-hidden="true" />
                The digital standard for Iloilo college athletics.
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
                  className="text-white px-7 py-3.5 rounded-xl font-bold transition-colors shadow-lg inline-flex items-center gap-2"
                  style={{ backgroundColor: BLUE, boxShadow: '0 10px 25px -5px rgba(37,99,235,0.3)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = NAVY)}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = BLUE)}
                >
                  Get started
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
                <a href="#how-it-works" className="text-sm font-semibold text-slate-600 border border-slate-300 rounded-xl px-6 py-3 hover:border-slate-400 hover:text-slate-900 transition-colors">
                  See how it works
                </a>
              </div>

              <div className="mt-10 flex items-center gap-6 text-xs text-slate-400 font-mono">
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

            {/* Spacer column — reserves space so text doesn't sit over the background photo */}
            <div aria-hidden="true" className="hidden md:block" />
          </div>

          {/* Mobile-only: image still shows below the text, as a normal (non-card) full-width image */}
          <div className="md:hidden mt-10 relative">
            <img
              src={HeroAthletes}
              alt="ILOPRISAA student-athletes competing in track, basketball, volleyball, and swimming"
              className="w-full h-auto"
            />
          <div className="absolute bottom-20 right-20">             
            <CredentialBadge />
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
                    <span className="font-mono text-2xl text-slate-200 font-bold">{step.n}</span>
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

            <div className="grid md:grid-cols-3 gap-6">
              {ROLE_FEATURES.map((f) => (
                <div key={f.title} className="p-7 rounded-2xl border-2 border-slate-100 hover:border-blue-100 transition-colors">
                  <f.icon className="h-7 w-7" style={{ color: BLUE }} aria-hidden="true" />
                  <h3 className="text-base font-bold mt-4 text-slate-900">{f.title}</h3>
                  <p className="text-slate-500 text-sm mt-2 leading-relaxed">{f.desc}</p>
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
              {[
                { icon: Lock, text: 'Storage paths are namespaced per athlete UUID — no guessable file links.' },
                { icon: FileCheck2, text: 'Every upload is fingerprinted with SHA-256 to detect tampering.' },
                { icon: ShieldCheck, text: 'Download links expire after 60 seconds.' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4 bg-white/5 border border-white/10 rounded-xl p-4">
                  <item.icon className="h-5 w-5 text-blue-300 shrink-0 mt-0.5" aria-hidden="true" />
                  <p className="text-sm text-slate-200 leading-relaxed">{item.text}</p>
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
              className="mt-8 text-white px-8 py-3.5 rounded-xl font-bold transition-colors shadow-lg inline-flex items-center gap-2"
              style={{ backgroundColor: BLUE, boxShadow: '0 10px 25px -5px rgba(37,99,235,0.3)' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = NAVY)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = BLUE)}
            >
              Sign in to your account
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-slate-950 text-slate-400 py-10 px-6 md:px-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <img src={Logo2} alt="ILOPRISAA" className="h-7 w-auto opacity-80" />
          <p className="text-xs font-mono">support@iloprisaa.org</p>
        </div>
      </footer>
    </div>
  );
}
