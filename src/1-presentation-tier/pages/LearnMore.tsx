import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ClipboardCheck,
  CloudUpload,
  FileCheck2,
  FileSearch,
  FolderOpen,
  LockKeyhole,
  Search,
  Settings2,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { Footer } from '../components/landing/Footer';
import Logo2 from '../../assets/Logo2.svg';
import { smoothScrollTo } from '../components/landing/functions';

const workflow = [
  {
    num: '01',
    tag: 'SUBMIT',
    icon: CloudUpload,
    title: 'Physical Intake & Coach Upload',
    text: 'Athletes submit the required physical records. Designated coaches digitize and upload the eligibility documents into ILOPRISAA.',
    actor: 'School Coach',
    output: 'Sealed Digital Dossier',
  },
  {
    num: '02',
    tag: 'REVIEW',
    icon: FileSearch,
    title: 'Committee Inspection',
    text: 'The Eligibility Committee accesses submitted credentials through the dedicated review workspace and examines each file individually.',
    actor: 'Eligibility Committee',
    output: 'Scrutiny Ledger',
  },
  {
    num: '03',
    tag: 'DECISION',
    icon: ClipboardCheck,
    title: 'Official Determination',
    text: 'The authorized reviewer records the document result—verifying valid records or flagging documents requiring correction.',
    actor: 'Reviewing Board',
    output: 'Stamped Verification',
  },
  {
    num: '04',
    tag: 'TRACK',
    icon: CheckCircle2,
    title: 'Real-Time Clearance',
    text: 'Coaches and school administrators can track clearance status online and respond to flagged items without repeated paperwork.',
    actor: 'League Secretariat',
    output: 'Official Master Roster',
  },
] as const;

const roles = [
  {
    icon: Users,
    code: 'ROLE TYPE 01',
    title: 'Coach',
    description: 'Manages athlete document submissions',
    items: [
      'Submit required athlete eligibility documents',
      'Upload and manage document files',
      'Monitor document submission status',
      'View documents requiring action & respond to reviews',
      'Track athlete eligibility progress',
    ],
    focus: 'Dossier digitization & roster compliance',
  },
  {
    icon: FolderOpen,
    code: 'ROLE TYPE 02',
    title: 'School Admin',
    description: 'Oversees institution-level records and submissions',
    items: [
      "Monitor school’s athlete eligibility records",
      'Review status of submitted documents',
      'Oversee coach submissions & flagged files',
      'Access school-level eligibility information',
      'Ensure institutional submission completeness',
    ],
    focus: 'Institutional accountability & oversight',
  },
  {
    icon: ShieldCheck,
    code: 'ROLE TYPE 03',
    title: 'Eligibility Committee',
    description: 'Manually reviews submitted documents',
    highlighted: true,
    notice: 'Performs actual document checking manually. ILOPRISAA does NOT automatically verify documents.',
    items: [
      'Access submitted eligibility documents',
      'Review documents individually, one at a time',
      'Check submitted information & supporting documents',
      'Mark documents as verified or requiring action with recorded reasons',
      'Monitor pending & flagged queues',
    ],
    focus: 'Rigorous accreditation inspection & governance',
  },
  {
    icon: Settings2,
    code: 'ROLE TYPE 04',
    title: 'Super Admin',
    description: 'Manages the overall platform',
    items: [
      'Manage system-wide users and roles',
      'Manage participating institutions',
      'Oversee system-wide records',
      'Manage platform configuration & security',
      'Monitor overall system activity & audit logs',
    ],
    focus: 'System configuration, security & integrity',
  },
] as const;

const features = [
  [FolderOpen, 'Centralized Document Storage', 'Encrypted, organized cloud storage for birth certificates, waivers, parent consents, and physician-signed medical forms.'],
  [CloudUpload, 'Online Submission', 'Secure school portal uploads that reduce lost envelopes, physical transit costs, and accidental paper misplacement.'],
  [FileSearch, 'Individual Document Review', 'A dedicated inspection interface allowing committee members to verify every credential with full-resolution document previews.'],
  [Search, 'Search & Retrieval', 'Multi-filter lookup by member institution, athlete category, division, and sport for faster record retrieval.'],
  [CheckCircle2, 'Status Tracking', 'Transparent lifecycle monitoring across Pending Review, Verified, Flagged (Action Required), and Resubmitted states.'],
  [LockKeyhole, 'Controlled Access', 'Role-level security and strict institutional controls limit records to authorized users and delegated responsibilities.'],
] as const;

const benefits = [
  {
    label: 'STAKEHOLDER GROUP 1',
    badge: 'COACHES',
    title: 'For Coaches',
    items: [
      'Drastically less administrative friction during high-stress pre-competition workflows',
      'Transparent live status without repeated follow-up calls to organizers',
      'Zero campus commute trips simply to replace a missing or blurred document',
    ],
    focus: 'Athlete preparation over paperwork',
  },
  {
    label: 'STAKEHOLDER GROUP 2',
    badge: 'ELIGIBILITY',
    title: 'For Eligibility Committee',
    highlighted: true,
    items: [
      'Faster, structured review queues that separate complete entries from flagged files',
      'Direct audit trail logging that protects the committee from disputed rulings',
      'Standardized rejection notes that give coaches precise, actionable feedback',
    ],
    focus: 'Integrity, speed & governance',
  },
  {
    label: 'STAKEHOLDER GROUP 3',
    badge: 'SCHOOLS',
    title: 'For Member Institutions',
    items: [
      'Total institutional visibility into athletic delegation compliance across all sports',
      'Significant reduction in paper printing, courier expenses, and clerical errors',
      'Permanent digital compliance readiness aligned with national sports federation standards',
    ],
    focus: 'Institutional accountability & efficiency',
  },
] as const;

const faqs = [
  ['What is ILOPRISAA?', 'ILOPRISAA is the official centralized digital document management and verification system for the Iloilo Private Schools Athletic Association. It provides a secure platform for schools to compile athlete dossiers and for the Eligibility Committee to inspect submitted credentials.'],
  ['Who reviews the submitted documents?', 'Only appointed members of the official ILOPRISAA Eligibility Committee have the mandate to review, audit, verify, or flag credentials. School coaches upload documents and monitor progress, while the committee holds evaluation access.'],
  ['Does ILOPRISAA automatically determine athlete eligibility?', 'No. The system does not use automated scripts or AI models to approve or reject athletes. ILOPRISAA organizes, secures, and presents credentials, while the Eligibility Committee performs the actual evaluation and final clearance decision manually.'],
  ['How are documents tracked in the portal?', 'Every document is assigned a live status badge such as Draft, Pending Review (queued for audit), Verified (approved by committee), or Action Required (flagged with specific notes for coach correction).'],
  ['Who can access athlete eligibility records?', 'Access is governed by institutional role-based permissions. Student-athletes do not have direct committee access; coaches manage uploads for their delegation, while the committee holds evaluation access.'],
] as const;

function SectionHeading({
  eyebrow,
  title,
  description,
  centered = false,
}: {
  eyebrow: string;
  title: string;
  description: string;
  centered?: boolean;
}) {
  return (
    <div className={centered ? 'mx-auto max-w-3xl text-center' : 'max-w-3xl'}>
      <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-blue-700">
        {eyebrow}
      </div>
      <h2 className="font-sora text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
        {title}
      </h2>
      <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-[15px]">
        {description}
      </p>
    </div>
  );
}

function CheckList({ items }: { items: readonly string[] }) {
  return (
    <div className="space-y-3 border-t border-slate-100 pt-5">
      {items.map((item) => (
        <div key={item} className="flex items-start gap-2.5">
          <Check size={13} className="mt-0.5 shrink-0 text-blue-600" strokeWidth={2.5} />
          <span className="text-[11px] leading-4.5 text-slate-600">{item}</span>
        </div>
      ))}
    </div>
  );
}

export default function LearnMore() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white font-inter antialiased text-slate-900">

      {/* SCREENSHOT-MATCHED NAVBAR */}
      <header className="fixed inset-x-0 top-0 z-50 h-[54px] border-b border-slate-200/80 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-full max-w-[1500px] items-center justify-between px-4 md:px-8 xl:px-12">
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex shrink-0 items-center"
            aria-label="ILOPRISAA home"
          >
            <img src={Logo2} alt="ILOPRISAA" className="h-7 w-auto" />
          </button>

          <nav
            aria-label="Learn More navigation"
            className="hidden items-center gap-0.5 rounded-full border border-slate-200 bg-slate-50/90 p-1 shadow-sm md:flex"
          >
            {[
              ['Home', null],
              ['Why ILOPRISAA', 'why'],
              ['Roles', 'roles'],
              ['Capabilities', 'features'],
              ['Governance', 'security'],
              ['Benefits', 'benefits'],
              ['FAQ', 'faq'],
            ].map(([label, id]) => {
              const active = label === 'Home';
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() =>
                    id
                      ? smoothScrollTo(id)
                      : window.scrollTo({ top: 0, behavior: 'smooth' })
                  }
                  className={[
                    'rounded-full px-3 py-1.5 text-[10px] font-medium transition',
                    active
                      ? 'bg-blue-50 text-blue-700 shadow-sm'
                      : 'text-slate-600 hover:bg-white hover:text-slate-900',
                  ].join(' ')}
                >
                  {label}
                </button>
              );
            })}
          </nav>

          <button
            type="button"
            onClick={() => navigate('/login')}
            className="rounded-full bg-blue-600 px-5 py-2 text-[10px] font-semibold text-white shadow-[0_5px_14px_-6px_rgba(37,99,235,0.65)] transition hover:bg-blue-700 active:scale-[0.98]"
          >
            Sign in
          </button>
        </div>
          <nav
            aria-label="Mobile Learn More navigation"
            className="absolute left-0 right-0 top-[54px] flex h-9 items-center gap-1 overflow-x-auto border-b border-slate-100 bg-white px-3 md:hidden"
          >
            {[
              ['Home', null],
              ['Why', 'why'],
              ['Roles', 'roles'],
              ['Capabilities', 'features'],
              ['Governance', 'security'],
              ['Benefits', 'benefits'],
              ['FAQ', 'faq'],
            ].map(([label, id]) => (
              <button
                key={label}
                type="button"
                onClick={() =>
                  id
                    ? smoothScrollTo(id)
                    : window.scrollTo({ top: 0, behavior: 'smooth' })
                }
                className="shrink-0 rounded-full px-2.5 py-1 text-[9px] font-medium text-slate-600 hover:bg-blue-50 hover:text-blue-700"
              >
                {label}
              </button>
            ))}
          </nav>

      </header>

      <main className="w-full pt-14 md:pt-14">
        {/* HERO */}
        <section className="relative overflow-hidden border-b border-slate-200 bg-[#f7f9ff]">
          <div className="pointer-events-none absolute inset-0 opacity-70 [background-image:linear-gradient(rgba(37,99,235,0.055)_1px,transparent_1px),linear-gradient(90deg,rgba(37,99,235,0.055)_1px,transparent_1px)] [background-size:28px_28px]" />
          <div className="pointer-events-none absolute -left-40 top-0 h-[520px] w-[720px] rounded-full bg-blue-200/25 blur-[110px]" />
          <div className="pointer-events-none absolute right-0 top-20 h-[420px] w-[500px] rounded-full bg-indigo-200/20 blur-[110px]" />

          <div className="relative mx-auto max-w-[1500px] px-4 py-16 md:px-8 lg:py-20 xl:px-12">
            <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-blue-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                  The Digital Standard for ILOPRISAA
                </div>

                <h1 className="mt-6 max-w-3xl font-sora text-4xl font-extrabold leading-[1.02] tracking-[-0.035em] text-slate-950 sm:text-5xl lg:text-[52px]">
                  Understanding <span className="text-blue-600">ILOPRISAA:</span>
                  <br />
                  The Digital Accreditation Standard
                </h1>

                <p className="mt-5 max-w-2xl text-sm leading-6 text-slate-600 sm:text-[15px]">
                  ILOPRISAA DMS centralizes athlete credentials into a single, tamper-evident digital architecture. Student-athletes submit their physical records directly to their designated school coaches, who digitize and upload the dossiers. Committee officials audit and stamp each file.
                </p>

                <div className="mt-7 flex flex-wrap gap-2">
                  {['Centralized Records', 'Verified by Committee', 'Strict Institutional Privacy'].map((item) => (
                    <span key={item} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-medium text-slate-600 shadow-sm">
                      <CheckCircle2 size={12} className="text-blue-600" />
                      {item}
                    </span>
                  ))}
                </div>

                <div className="mt-7 flex flex-col gap-2.5 sm:flex-row">
                  <button
                    onClick={() => navigate('/login')}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-xs font-semibold text-white shadow-md transition hover:bg-blue-700 active:scale-[0.98]"
                  >
                    Get started <ArrowRight size={14} />
                  </button>
                  <button
                    onClick={() => smoothScrollTo('workflow')}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:text-blue-700"
                  >
                    See how it works
                  </button>
                </div>

                <div className="mt-7 flex flex-wrap gap-5 font-mono text-[9px] text-slate-500">
                  <span><b className="text-emerald-500">●</b> PostgreSQL State Transition Machine</span>
                  <span><b className="text-blue-500">●</b> SHA-256 Record Signed</span>
                </div>
              </div>

              {/* Hero workflow card */}
              <div className="relative mx-auto w-full max-w-[520px] rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_18px_45px_-20px_rgba(15,23,42,0.28)]">
                <div className="rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                    <div>
                      <p className="font-mono text-[8px] font-semibold uppercase tracking-[0.16em] text-slate-500">State Transition Machine</p>
                      <p className="mt-1 text-[11px] font-semibold text-slate-800">Digital accreditation workflow</p>
                    </div>
                    <span className="rounded border border-blue-100 bg-blue-50 px-2 py-1 font-mono text-[8px] font-semibold text-blue-600">v2.4 ENFORCED</span>
                  </div>

                  <div className="space-y-2 p-4">
                    {[
                      ['01', 'DRAFT DOSSIER', 'PSA record, ECG permit, and academic transcript compiled.', 'coach:upload', 'slate'],
                      ['02', 'PENDING REVIEW', 'Locked against edits. Queued in committee dashboard.', 'Active Queue', 'amber'],
                      ['03', 'COMMITTEE AUDIT', 'Manual inspection of birth-year, unit loads, and physical seal.', 'manual_eval', 'blue'],
                      ['04', 'CLEARED & STAMPED', 'Official digital verification stamp appended to delegation roster.', 'Eligible', 'green'],
                    ].map(([num, title, text, badge, tone]) => (
                      <div
                        key={num}
                        className={[
                          'rounded-xl border p-3',
                          tone === 'amber' ? 'border-amber-200 bg-amber-50/70' :
                          tone === 'blue' ? 'border-blue-200 bg-blue-50/60' :
                          tone === 'green' ? 'border-emerald-200 bg-emerald-50/70' :
                          'border-slate-200 bg-slate-50',
                        ].join(' ')}
                      >
                        <div className="flex gap-3">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white font-mono text-[9px] font-bold text-slate-500 shadow-sm">{num}</div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="text-[10px] font-bold tracking-wide text-slate-800">{title}</p>
                              <span className="rounded bg-white/80 px-1.5 py-0.5 font-mono text-[7px] font-semibold text-slate-500">{badge}</span>
                            </div>
                            <p className="mt-1 text-[9px] leading-4 text-slate-500">{text}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-4 py-3 font-mono text-[8px] text-slate-500">
                    <span>trg_enforce_document_status_transition</span>
                    <span className="font-semibold text-emerald-600">5 valid pairs</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* WHY */}
        <section id="why" className="scroll-mt-20 border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-[1500px] px-4 py-16 md:px-8 lg:py-20 xl:px-12">
            <SectionHeading
              eyebrow="Institutional Rationale"
              title="Why ILOPRISAA?"
              description="Addressing the recurring challenges of traditional, paper-based eligibility workflows."
            />

            <div className="mt-10 rounded-2xl border border-blue-100 bg-[#f8fbff] p-6 md:p-7">
              <div className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
                  <ClipboardCheck size={19} />
                </div>
                <div>
                  <p className="font-mono text-[8px] font-semibold uppercase tracking-[0.16em] text-blue-600">The traditional accreditation bottleneck</p>
                  <h3 className="mt-1 text-sm font-bold text-slate-900">Overcoming Decades of Paper Overhead</h3>
                  <p className="mt-3 max-w-5xl text-[12px] leading-5 text-slate-600">
                    For years, coordinating athletic accreditation across dozens of educational institutions relied on bulky physical folders, courier runs, and endless physical queues. Lost transcripts, damaged certificates, duplicate submissions, and lack of real-time status visibility created immense administrative stress for member schools and review committees alike. ILOPRISAA solves this by establishing a disciplined, digital-first foundation.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-7 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[
                ['Centralized Records', 'Keep athlete eligibility documents organized in one unified, auditable repository.'],
                ['Faster Retrieval', 'Instantly locate and inspect student-athlete records during high-volume accreditation periods.'],
                ['Clear Status Tracking', 'See whether credentials are pending review, verified, or flagged for action.'],
                ['Less Physical Handling', 'Reduce repeated transport, loss, and manual degradation of sensitive physical records.'],
              ].map(([title, text]) => (
                <div key={title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <FolderOpen size={15} />
                  </div>
                  <h3 className="mt-4 text-[12px] font-bold text-slate-900">{title}</h3>
                  <p className="mt-2 text-[10px] leading-4.5 text-slate-500">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* WORKFLOW */}
        <section id="workflow" className="scroll-mt-20 border-b border-slate-200 bg-[#f6f8ff]">
          <div className="mx-auto max-w-[1500px] px-4 py-16 md:px-8 lg:py-20 xl:px-12">
            <SectionHeading
              eyebrow="Institutional Verification Pipeline"
              title="How the Digital Process Works"
              description="A linear four-stage compliance sequence built around committee oversight."
              centered
            />

            <div className="relative mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="absolute left-[12%] right-[12%] top-[31px] hidden h-px bg-blue-300 lg:block" />

              {workflow.map(({ num, tag, icon: Icon, title, text, actor, output }) => (
                <div key={num} className="relative z-10 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm font-bold text-blue-600">{num}</span>
                    <span className="rounded bg-slate-100 px-2 py-1 font-mono text-[7px] font-bold tracking-wider text-slate-500">{tag}</span>
                  </div>
                  <div className="mt-3 flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-blue-600 shadow-sm">
                    <Icon size={17} />
                  </div>
                  <h3 className="mt-4 text-[13px] font-bold leading-5 text-slate-900">{title}</h3>
                  <p className="mt-2 min-h-[76px] text-[10px] leading-4.5 text-slate-500">{text}</p>

                  <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-3">
                    <div>
                      <p className="font-mono text-[7px] font-semibold uppercase text-slate-400">Actor</p>
                      <p className="mt-1 text-[9px] font-semibold leading-3.5 text-slate-700">{actor}</p>
                    </div>
                    <div>
                      <p className="font-mono text-[7px] font-semibold uppercase text-slate-400">Output</p>
                      <p className="mt-1 text-[9px] font-semibold leading-3.5 text-blue-600">{output}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ROLES */}
        <section id="roles" className="scroll-mt-20 border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-[1500px] px-4 py-16 md:px-8 lg:py-20 xl:px-12">
            <SectionHeading
              eyebrow="Role-Based Access"
              title="Who Uses the System"
              description="Purpose-built workspaces aligned with institutional responsibilities."
            />

            <div className="mt-10 grid gap-4 lg:grid-cols-4">
              {roles.map(({ icon: Icon, code, title, description, items, focus, highlighted, notice }) => (
                <div
                  key={title}
                  className={[
                    'flex min-h-[430px] flex-col rounded-2xl border p-5 shadow-sm',
                    highlighted
                      ? 'border-blue-500 bg-white ring-1 ring-blue-500'
                      : 'border-slate-200 bg-white',
                  ].join(' ')}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                      <Icon size={15} />
                    </div>
                    {highlighted && (
                      <span className="rounded bg-blue-700 px-2 py-1 font-mono text-[7px] font-bold uppercase tracking-wide text-white">
                        Audit Mandate
                      </span>
                    )}
                  </div>

                  <p className="mt-5 font-mono text-[8px] font-semibold uppercase tracking-[0.12em] text-blue-600">{code}</p>
                  <h3 className="mt-1 text-[15px] font-bold text-slate-900">{title}</h3>
                  <p className="mt-1 text-[10px] leading-4 text-slate-500">{description}</p>

                  {notice && (
                    <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
                      <p className="text-[9px] leading-4 text-amber-800">{notice}</p>
                    </div>
                  )}

                  <div className={notice ? 'mt-4' : 'mt-5'}>
                    <CheckList items={items} />
                  </div>

                  <div className="mt-auto border-t border-slate-100 pt-4">
                    <p className="text-[9px] font-medium leading-4 text-slate-500">
                      <span className="font-mono uppercase text-[7px] text-slate-400">Focus: </span>
                      {focus}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section id="features" className="scroll-mt-20 border-b border-slate-200 bg-[#f6f8ff]">
          <div className="mx-auto max-w-[1500px] px-4 py-16 md:px-8 lg:py-20 xl:px-12">
            <SectionHeading
              eyebrow="System Features"
              title="Core Platform Capabilities"
              description="Engineered specifically for inter-school sports governance, accreditation, and data integrity."
              centered
            />

            <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {features.map(([Icon, title, description], index) => (
                <div key={title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                      <Icon size={16} />
                    </div>
                    <span className="rounded-full bg-blue-50 px-2 py-1 font-mono text-[7px] font-semibold text-blue-600">
                      MODULE {String(index + 1).padStart(2, '0')}
                    </span>
                  </div>
                  <h3 className="mt-4 text-[12px] font-bold text-slate-900">{title}</h3>
                  <p className="mt-2 text-[10px] leading-4.5 text-slate-500">{description}</p>
                  <div className="mt-5 border-t border-slate-100 pt-3">
                    <p className="font-mono text-[7px] uppercase tracking-[0.1em] text-slate-400">
                      Spec: {index === 0 ? 'HT-REST-AES-256' : index === 1 ? 'MULTI-FILE BULK INGEST' : index === 2 ? 'HI-RES AUDIT VIEWER' : index === 3 ? 'MULTI-FACETED QUERY' : index === 4 ? '4-STATE DETERMINISTIC FSM' : 'POSTGRES RLS POLICIES'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECURITY */}
        <section id="security" className="scroll-mt-20 border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-[1500px] px-4 py-16 md:px-8 lg:py-20 xl:px-12">
            <div className="grid items-center gap-10 lg:grid-cols-[0.8fr_1.2fr]">
              <SectionHeading
                eyebrow="Governance"
                title="Controlled access by design."
                description="Eligibility records contain sensitive personal information. The platform separates responsibilities through role-based permissions and database-level controls."
              />

              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  [ShieldCheck, 'Role-Based Access', 'Permissions follow the user’s institutional responsibility.'],
                  [LockKeyhole, 'Row-Level Security', 'Database-level controls help restrict records to authorized users.'],
                  [FolderOpen, 'Structured Storage', 'Documents remain organized within a centralized repository.'],
                  [Search, 'Traceable Records', 'Structured records support retrieval, review, and accountability.'],
                ].map(([Icon, title, text]) => (
                  <div key={title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <Icon size={17} className="text-blue-600" />
                    <h3 className="mt-3 text-[12px] font-bold text-slate-900">{title}</h3>
                    <p className="mt-2 text-[10px] leading-4.5 text-slate-500">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* BENEFITS */}
        <section id="benefits" className="scroll-mt-20 border-b border-slate-200 bg-[#f6f8ff]">
          <div className="mx-auto max-w-[1500px] px-4 py-16 md:px-8 lg:py-20 xl:px-12">
            <SectionHeading
              eyebrow="Positive Institutional Impact"
              title="Expected Institutional Benefits"
              description="How ILOPRISAA transforms the accreditation experience for all athletic stakeholders."
              centered
            />

            <div className="mt-10 grid gap-4 lg:grid-cols-3">
              {benefits.map(({ label, badge, title, items, focus, highlighted }) => (
                <div
                  key={title}
                  className={[
                    'flex min-h-[270px] flex-col rounded-2xl border p-5 shadow-sm',
                    highlighted ? 'border-blue-200 bg-white ring-1 ring-blue-100' : 'border-slate-200 bg-white',
                  ].join(' ')}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[8px] font-semibold uppercase tracking-[0.12em] text-blue-600">{label}</span>
                    <span className="rounded-full bg-blue-50 px-2 py-1 font-mono text-[7px] font-semibold text-blue-600">{badge}</span>
                  </div>
                  <h3 className="mt-5 text-[14px] font-bold text-slate-900">{title}</h3>
                  <div className="mt-4 space-y-3">
                    {items.map((item) => (
                      <div key={item} className="flex items-start gap-2.5">
                        <Check size={13} className="mt-0.5 shrink-0 text-blue-600" />
                        <span className="text-[10px] leading-4 text-slate-600">{item}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-auto border-t border-slate-100 pt-4">
                    <p className="font-mono text-[7px] uppercase tracking-[0.12em] text-slate-400">Focus: {focus}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="scroll-mt-20 border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-[1200px] px-4 py-16 md:px-8 lg:py-20 xl:px-12">
            <SectionHeading
              eyebrow="Got Questions?"
              title="Frequently Asked Questions"
              description="Clear answers regarding system usage, verification authority, and document handling."
              centered
            />

            <div className="mt-10 grid gap-4 md:grid-cols-2">
              {faqs.map(([question, answer], index) => {
                const highlighted = index === 2;

                return (
                  <div
                    key={question}
                    className={[
                      'rounded-2xl border px-5 py-4',
                      highlighted
                        ? 'border-amber-200 bg-amber-50 md:col-span-2'
                        : 'border-slate-200 bg-[#f8f9ff]',
                    ].join(' ')}
                  >
                    <div className="flex items-start gap-2.5">
                      {highlighted ? (
                        <ShieldCheck size={14} className="mt-0.5 shrink-0 text-amber-700" />
                      ) : (
                        <span className="mt-0.5 shrink-0 text-[12px] font-semibold leading-none text-blue-600">?</span>
                      )}

                      <div className="min-w-0">
                        <h3 className="text-[12px] font-bold text-slate-900">
                          {question}
                        </h3>
                        <p
                          className={[
                            'mt-3 text-[10px] leading-4.5',
                            highlighted ? 'font-medium text-amber-900' : 'text-slate-500',
                          ].join(' ')}
                        >
                          {answer}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-[#f6f8ff] px-4 py-10 md:px-8 xl:px-12">
          <div className="mx-auto max-w-[1450px] overflow-hidden rounded-2xl bg-gradient-to-br from-blue-700 via-blue-600 to-slate-800 px-6 py-12 shadow-[0_20px_50px_-20px_rgba(30,64,175,0.45)] md:px-10">
            <div className="max-w-2xl">
              <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 font-mono text-[8px] font-semibold uppercase tracking-[0.14em] text-white">
                Official Tournament Accreditation
              </span>
              <h2 className="mt-5 font-sora text-3xl font-extrabold leading-[1.02] tracking-tight text-white sm:text-4xl">
                Ready to access the ILOPRISAA Portal?
              </h2>
              <p className="mt-3 max-w-2xl text-[11px] leading-5 text-blue-100 sm:text-[12px]">
                Empower your school coaching staff and athletic directors with centralized, auditable document management and real-time accreditation tracking.
              </p>
              <div className="mt-6 flex flex-wrap gap-2.5">
                <button
                  onClick={() => navigate('/login')}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-[10px] font-bold text-blue-700 shadow-sm transition hover:bg-blue-50"
                >
                  Sign in to Portal <ArrowRight size={13} />
                </button>
                <button
                  onClick={() => smoothScrollTo('faq')}
                  className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-5 py-2.5 text-[10px] font-semibold text-white transition hover:bg-white/15"
                >
                  Review Guidelines <FileCheck2 size={13} />
                </button>
              </div>
              <div className="mt-7 flex flex-wrap gap-5 border-t border-white/15 pt-5 font-mono text-[8px] text-blue-100">
                <span>⌕ Row-Level Secured Access</span>
                <span>♢ Human Committee Validated</span>
                <span>◊ RA 10173 Compliant</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
