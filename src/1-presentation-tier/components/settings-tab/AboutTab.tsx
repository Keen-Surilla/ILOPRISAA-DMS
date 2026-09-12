import React from 'react';
import { Info, Layers, BarChart3, ScanLine, Timer, ServerCog, GraduationCap } from 'lucide-react';

const CAPABILITIES = [
  {
    icon: Layers,
    title: 'Automated State Tracking',
    body: (
      <>
        Documents follow a strict, auditable lifecycle (<code className="font-mono text-[11px] px-1 py-0.5 rounded bg-slate-100 dark:bg-white/[0.06]">Draft</code>
        {' → '}
        <code className="font-mono text-[11px] px-1 py-0.5 rounded bg-slate-100 dark:bg-white/[0.06]">Pending Review</code>
        {' → '}
        <code className="font-mono text-[11px] px-1 py-0.5 rounded bg-slate-100 dark:bg-white/[0.06]">Verified</code>
        {' → '}
        <code className="font-mono text-[11px] px-1 py-0.5 rounded bg-slate-100 dark:bg-white/[0.06]">Action Required</code>
        ), ensuring no credential slips through the cracks.
      </>
    ),
  },
  {
    icon: BarChart3,
    title: 'Secure Roster Management',
    body: 'Coaches can monitor compliance through real-time dashboards, top missing document trackers, and instant PRISAA Form 01B (Tertiary) Excel generation.',
  },
  {
    icon: ScanLine,
    title: 'Intelligent Processing',
    body: 'Integration with Google Cloud Vision OCR allows for automated text extraction from uploaded credentials to assist committee reviews.',
  },
  {
    icon: Timer,
    title: 'Automated Lifecycle Management',
    body: 'To maintain data hygiene and security, the system automatically expires and purges annual documents 10 months after verification.',
  },
];

export default function AboutTab() {
  return (
    <div className="animate-in fade-in duration-200 mb-8">
      <div className="flex items-center gap-2 flex-wrap mb-1">
        <h2 className="text-xl font-bold text-slate-900 dark:text-[#f8fafc]">About ILOPRISAA DMS</h2>
      </div>
      <p className="text-[13px] leading-relaxed text-slate-500 dark:text-[#94a3b8] mb-8">
        The ILOPRISAA Digital Athlete Document Management System (DMS) is a centralized, secure platform designed
        to modernize the submission, verification, and compliance tracking of athlete credentials for member
        schools in Region VI.
      </p>

      {/* System Purpose */}
      <div className="mb-8 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.03] p-5">
        <div className="flex items-center gap-2 mb-2">
          <Info className="w-4 h-4 text-sky-500 dark:text-[#7dd3fc]" />
          <h3 className="text-[13px] font-bold uppercase tracking-wide text-sky-600 dark:text-[#7dd3fc]">
            System Purpose
          </h3>
        </div>
        <p className="text-[13px] leading-relaxed text-slate-600 dark:text-[#cbd5e1]">
          Built specifically for the unique workflow of the Iloilo Private Schools Athletic Association, this
          system eliminates the inefficiencies of physical paperwork. It provides a strict, transparent pipeline
          for document screening—ensuring athletes meet all academic and demographic requirements before
          competition while minimizing administrative bottlenecks.
        </p>
      </div>

      {/* Core Capabilities */}
      <div className="mb-8 pt-6 border-t border-slate-200 dark:border-white/[0.06]">
        <h3 className="text-[13px] font-bold uppercase tracking-wide text-sky-600 dark:text-[#7dd3fc] mb-4">
          Core Capabilities
        </h3>
        <div className="space-y-4">
          {CAPABILITIES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="flex items-start gap-3">
              <div className="mt-0.5 shrink-0 w-7 h-7 rounded-lg bg-sky-50 dark:bg-[#7dd3fc]/10 flex items-center justify-center">
                <Icon className="w-3.5 h-3.5 text-sky-600 dark:text-[#7dd3fc]" />
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-slate-700 dark:text-[#cbd5e1]">{title}</p>
                <p className="text-[12px] leading-relaxed text-slate-500 dark:text-[#94a3b8] mt-0.5">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Technology & Security */}
      <div className="mb-8 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.03] p-5">
        <div className="flex items-center gap-2 mb-2">
          <ServerCog className="w-4 h-4 text-sky-500 dark:text-[#7dd3fc]" />
          <h3 className="text-[13px] font-bold uppercase tracking-wide text-sky-600 dark:text-[#7dd3fc]">
            Technology &amp; Security
          </h3>
        </div>
        <p className="text-[13px] leading-relaxed text-slate-600 dark:text-[#cbd5e1]">
          The platform is built on a modern, strictly layered three-tier architecture (React/TypeScript frontend,
          Supabase PostgreSQL backend). It enforces rigorous security protocols, including Row-Level Security
          (RLS), multi-layer flood protection, and expiring zero-account view-links for athletes, ensuring full
          compliance with the Data Privacy Act of 2012.
        </p>
      </div>

      {/* Project Background */}
      <div className="pt-6 border-t border-slate-200 dark:border-white/[0.06]">
        <div className="flex items-start gap-2 text-[11px] leading-relaxed text-slate-400 dark:text-[#64748b]">
          <GraduationCap className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <p>
            Developed in Iloilo City, Philippines. This system was engineered as a capstone project to formally
            evaluate software quality and efficiency in local sports administration using the ISO/IEC 25010
            framework.
            <br />
            System Version: 1.0.0 (Release Candidate)
          </p>
        </div>
      </div>
    </div>
  );
}