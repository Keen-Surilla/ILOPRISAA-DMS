import { Link } from 'react-router-dom';
import Logo2 from '../../assets/Frame 100.svg';
import { Check } from 'lucide-react';
import { LearnMoreHeader } from '../components/LearnMore/LearnMoreHeader';
import { LearnMoreFooter } from '../components/LearnMore/LearnMoreFooter';

const workflow = [
  {
    number: '01',
    title: 'INGESTION',
    description:
      'School coaches collect and digitize required credentials (PSA certificates, transcripts, enrollment forms, medical waivers) and submit complete rosters.',
  },
  {
    number: '02',
    title: 'REVIEW QUEUE',
    description:
      'Submissions route automatically to the Eligibility Committee workspace, organized chronologically by division, institution, and competitive discipline.',
  },
  {
    number: '03',
    title: 'COMMITTEE DECISION',
    description:
      'Screening officers perform deliberate manual checks of each proof, certifying validity or lodging specific notes requiring targeted remedy.',
  },
  {
    number: '04',
    title: 'ROSTER CLEARANCE',
    description:
      'Upon full verification, dossiers lock permanently to ensure compliance. Official tournament rosters are generated with verified certification markers.',
  },
];

const principles = [
  {
    title: 'Centralized Records',
    description:
      'A single authoritative record per athlete, preventing conflicting documents or lost submissions across teams.',
  },
  {
    title: 'Controlled Access',
    description:
      'Institutional partition keeps dossiers visible only to authorized school representatives and designated screening officers.',
  },
  {
    title: 'Transparent Status Tracking',
    description:
      'Real-time pipeline monitoring indicates clear review status and documented remedies for any pending items.',
  },
  {
    title: 'Human Verification',
    description:
      'Mandatory human-in-the-loop review protects student fairness and institutional governance integrity.',
  },
  {
    title: 'Institutional Accountability',
    description:
      'Every submission, annotation, and verification outcome generates an unalterable chronological audit record.',
  },
  {
    title: 'Secure Document Handling',
    description:
      'End-to-end encrypted storage strictly structured around the Philippine Data Privacy Act of 2012.',
  },
];

const roles = [
  {
    title: 'Coach',
    description:
      'Uploads certified athlete files, monitors review outcomes, and resolves flagged requirements directly with the committee.',
  },
  {
    title: 'School Admin',
    description:
      'Oversees delegation-wide compliance across all sport divisions, ensuring participating rosters meet institution standards.',
  },
  {
    title: 'Eligibility Committee',
    description:
      'Inspects original document scans individually, marks official approvals or remedies, and issues authoritative clearances.',
    highlighted: true,
  },
  {
    title: 'Super Admin',
    description:
      'Maintains institutional directory, configures tournament bylaws, and monitors overall security and system audit logs.',
  },
];

export default function AboutILOPRISAA() {
  return (
    <div className="flex min-h-screen flex-col justify-between bg-[#F8FAFC] text-slate-800"> 
      {/* 1. NEW REUSABLE HEADER INJECTED HERE */}
      <LearnMoreHeader />
      <main className="w-full flex-grow px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[760px] px-1 sm:px-2">
          {/* INTRO */}
          <header className="mb-8">
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-blue-700">
              Charter &amp; Operational Overview
            </p>

            <h1 className="mb-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              About ILOPRISAA
            </h1>

            <p className="mt-2 text-[16px] leading-6 text-slate-500 sm:text-[16px]">
              Building a Digital Standard for Athletic Accreditation — Iloilo
              Private Schools Athletic Association.
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-slate-200 pb-4 font-mono text-[11px] font-medium uppercase tracking-wide text-slate-500">
              <span>
                <b className="text-slate-400">JURISDICTION:</b> ILOILO CITY
              </span>
              <span className="text-slate-300">•</span>
              <span>
                <b className="text-slate-400">AFFILIATION:</b> REGION VI PRISAA
              </span>
              <span className="text-slate-300">•</span>
              <span>
                <b className="text-slate-400">RA 10173:</b> COMPLIANT
              </span>
            </div>
          </header>

          {/* WHO WE ARE */}
          <section className="mb-8 max-w-[740px] border-b border-slate-200 pb-8">
            <h2 className="text-[22px] font-bold tracking-[-0.015em] text-slate-900">
              Who We Are
            </h2>
            <p className="mt-1 text-[15px] text-slate-700">
              Governance charter &amp; scope
            </p>

            <div className="mt-4 space-y-3 text-[16px] leading-[1.8] text-slate-700">
              <p>
                The{' '}
                <strong className="font-semibold text-slate-800">
                  Iloilo Private Schools Athletic Association (ILOPRISAA)
                </strong>{' '}
                serves as the premier coordinating and governing authority for
                secondary and tertiary athletic programs across private academic
                institutions within Iloilo City and Province. Built on
                principles of fair play and athlete safety, the association
                establishes unified eligibility regulations and runs annual
                inter-school tournament meets.
              </p>

              <p>
                To ensure strict procedural integrity across all competitive
                divisions, ILOPRISAA operates this dedicated accreditation
                framework. The system provides secure digital submission,
                centralized dossier management, and standardized clearance
                workflows aligned with regional and national PRISAA bylaws.
              </p>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                ['Governance', 'Private School Board'],
                ['Screening', 'Dual-Tier Committee'],
                ['Auditing', 'Immutable Trail'],
                ['Data Privacy', 'RA 10173 Registered'],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex w-full flex-col items-center justify-center rounded-lg border border-slate-200 bg-white px-2 py-2 text-center "
                >
                  <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-blue-500">
                    {label}
                  </p>
                  <p className="mt-1 text-[14px] font-semibold text-slate-700">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* OPERATIONAL TRANSITION */}
          <section className="mb-8 max-w-[740px] border-b border-slate-200 pb-8">
            <h2 className="text-[22px] font-bold tracking-[-0.015em] text-slate-900">
              The Operational Transition
            </h2>
            <p className="mt-1 text-[15px] text-slate-700">
              From physical files to verified audit trails
            </p>

            <p className="mt-4 text-[16px] leading-[1.8] text-slate-700">
              Athletic screening historically depended on transporting paper
              dossiers across districts, creating high risks of lost
              documentation, delayed clearances, and fragmented verification.
              The digital pipeline replaces physical friction with authenticated
              custody.
            </p>

            <div className="mt-4 grid overflow-hidden rounded-md border border-slate-200 bg-white sm:grid-cols-2">
              <div className="p-4 sm:border-r sm:border-slate-200">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h3 className="text-[15px] font-semibold text-slate-700">
                    Legacy Manual Process
                  </h3>
                  <span className="rounded-md bg-slate-200 px-3 py-1.5 font-mono text-[11px] font-medium uppercase tracking-wide text-slate-600">
                    Deprecated
                  </span>
                </div>

                <ul className="mt-3 space-y-2.5 text-[14px] leading-[1.7] text-slate-600">
                  {[
                    'Fragile physical certificates and medical releases subject to damage.',
                    'In-person courier trips across municipalities under tight roster deadlines.',
                    'Opaque clearance status without real-time notices for missing proofs.',
                    'Unlogged manual inspection of private student records.',
                  ].map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="mt-0.5 text-slate-300">—</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h3 className="text-[15px] font-semibold text-slate-700">
                    Digital Accreditation System
                  </h3>
                  <span className="rounded-md bg-blue-100 px-3 py-1.5 font-mono text-[11px] font-medium uppercase tracking-wide text-blue-700">
                    Standard
                  </span>
                </div>

                <ul className="mt-3 space-y-2.5 text-[14px] leading-[1.7] text-slate-600">
                  {[
                    'Centralized encrypted repository partitioned by school and sport.',
                    'Immediate remote submission with instant delivery receipt.',
                    'Granular live statuses: Submitted, Under Review, Verified, or Flagged.',
                    'Complete, timestamped audit log of all document evaluations.',
                  ].map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="mt-0.5 text-blue-500">
                        <Check className="mt-1 h-4 w-4 shrink-0 text-blue-500" />
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* WORKFLOW */}
          <section className="mb-8 max-w-[740px] border-b border-slate-200 pb-8">
            <h2 className="text-[22px] font-bold tracking-[-0.015em] text-slate-900">
              Workflow Architecture
            </h2>
            <p className="mt-1 text-[15px] text-slate-600">
              Four structured clearance phases
            </p>

            <div className="mt-4 space-y-2">
              {workflow.map((item) => (
                <div
                  key={item.number}
                  className="grid grid-cols-[170px_1fr] gap-4 rounded-md border border-slate-200 bg-white px-3 py-3"
                >
                  <div className="font-mono text-[12px] font-bold uppercase text-blue-700">
                    {item.number}&nbsp;&nbsp;{item.title}
                  </div>
                  <p className="text-[14px] leading-[1.7] text-slate-600">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* ROLES */}
          <section className="mb-8 max-w-[740px] border-b border-slate-200 pb-8">
            <h2 className="text-[22px] font-bold tracking-[-0.015em] text-slate-900 ">
              Platform Roles &amp; Access
            </h2>
            <p className="mt-1 text-[15px] text-slate-600">
              Defined organizational boundaries
            </p>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {roles.map((role) => (
                <div
                  key={role.title}
                  className={`rounded-md border border-slate-200 p-3 bg-white ${
                    role.highlighted ? 'text-slate-200' : ''
                  }`}
                >
                  <h3 className="font-mono text-[15px] font-bold text-blue-700">
                    {role.title}
                  </h3>
                  <p className="mt-1 text-[14px] leading-[1.7] text-slate-600">
                    {role.description}
                  </p>
                </div>
              ))}
            </div>

            <p className="mt-3 rounded-md border border-slate-200 bg-slate-100 px-4 py-3 text-[13px] leading-[1.65] text-slate-600">
              <strong className="font-mono text-blue-600">Privacy Note:</strong> Student-athletes
              submit physical documentation directly to their school coaches;
              students do not possess individual system accounts, ensuring
              tight data containment under RA 10173.
            </p>
          </section>

          {/* INSTITUTIONAL MANDATE */}
          <section className="mb-8 max-w-[740px] border-b border-slate-200 pb-8">
            <h2 className="text-[22px] font-bold tracking-[-0.015em] text-slate-900">
              Institutional Mandate
            </h2>
            <p className="mt-1 text-[15px] text-slate-600">
              Human authority over algorithms
            </p>

            <blockquote className="text-[14px] mt-4 border-l-4 border-blue-500 bg-slate-100 px-5 py-4 text-[12px] font-semibold leading-[2.0] tracking-[-0.01em] text-slate-900">
              “ILOPRISAA digitizes the accreditation workflow without replacing
              institutional judgment.”
            </blockquote>

            <p className="mt-3 text-[16px] leading-[1.8] text-slate-600">
              The system executes no automated algorithmic clearing or automated
              exemptions. Technology acts strictly as an organizational custody
              framework; certified committee members conduct every verification,
              maintaining personal accountability for tournament integrity.
            </p>
          </section>

          {/* PRINCIPLES */}
          <section className="max-w-[740px] pb-8">
            <h2 className="text-[22px] font-bold tracking-[-0.015em] text-slate-900">
              Core Principles
            </h2>
            <p className="mt-1 text-[15px] text-slate-600">
              Architectural foundations
            </p>

            <div className="mt-4 grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
              {principles.map((principle) => {
                return (
                  <div key={principle.title} className="flex gap-2.5">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 bg-blue-600" aria-hidden="true" />
                    <div>
                      <h3 className="text-[15px] font-bold text-slate-800">
                        {principle.title}
                      </h3>
                      <p className="mt-1 text-[14px] leading-[1.7] text-slate-600">
                        {principle.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </main>

      {/* FOOTER */}
      <LearnMoreFooter />
    </div>
  );
}