import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import Logo2 from '../../assets/Frame 100.svg';
import { LearnMoreHeader } from '../components/LearnMore/LearnMoreHeader';
import { LearnMoreFooter } from '../components/LearnMore/LearnMoreFooter';

const EFFECTIVE_DATE = 'September 1, 2026';
const LAST_UPDATED = 'September 1, 2026';

const infoCategories = [
  ['Account and Identity Information', 'Full name, institutional email address, assigned organizational role, and login credentials for authorized platform users.'],
  ['School and Institutional Information', 'Participating school or institution name, campus/division level (Elementary, Secondary, or Tertiary), and designated athletic delegation records.'],
  ['Student-Athlete Information', 'Name, birth date, sport or team assignment, and roster status, as submitted by the athlete\u2019s school on the athlete\u2019s behalf.'],
  ['Accreditation and Eligibility Documentation', 'Digitized copies of required eligibility records, including birth certificates, data privacy consent forms, waivers, transcript of records (TOR), and medical clearance documents.'],
  ['Review and Status Records', 'Document review status (such as pending review, verified, or flagged for action), reviewer comments, and associated submission timestamps.'],
  ['Basic System Information', 'Limited account and session information necessary to authenticate users and operate the Platform securely.'],
] as const;

const usePurposes = [
  'Facilitating athlete accreditation and eligibility review',
  'Verifying submitted documents against ILOPRISAA requirements',
  'Managing school and athlete rosters',
  'Supporting Eligibility Committee screening',
  'Monitoring compliance with accreditation requirements',
  'Maintaining institutional recordkeeping',
  'Resolving document deficiencies through correction or resubmission',
  'Maintaining institutional accountability and preventing unauthorized record changes',
] as const;

const roles = [
  ['School Coaches', 'Submit and manage eligibility documents on behalf of their institution\u2019s student-athletes.'],
  ['School Administrators', 'Oversee their institution\u2019s submissions and roster records.'],
  ['Eligibility Committee', 'Review submitted documents and record the outcome of each review.'],
  ['Super Admin', 'Administers platform configuration and user access; does not alter substantive review outcomes.'],
] as const;

const dataRights = [
  ['Right to Be Informed', 'You have the right to be informed of whether personal data pertaining to you is being or has been processed, and the purpose of such processing.'],
  ['Right to Access', 'Authorized institutional representatives may request access to records submitted through the Platform on their behalf.'],
  ['Right to Rectification', 'You may request correction of inaccurate or outdated information through the appropriate institutional channel.'],
  ['Right to Object', 'You may object to certain processing of personal data, subject to applicable legal conditions and the requirements of the accreditation process.'],
  ['Right to Erasure or Blocking', 'You may request the suspension, withdrawal, or removal of personal data where legally applicable, subject to institutional recordkeeping obligations.'],
  ['Right to Data Portability', 'Where applicable under law, you may request a copy of certain personal data in a commonly used format.'],
  ['Right to Lodge a Complaint', 'You have the right to file a complaint before the National Privacy Commission (NPC) if you believe your statutory data privacy rights have been infringed.'],
] as const;

function SectionBlock({ number, title, subtitle, children }: {
  number: string; title: string; subtitle?: string; children: ReactNode;
}) {
  return (
    <section className="mb-8 space-y-3 border-b border-slate-200 pb-8">
      <h2 className="text-lg font-bold text-slate-900">{number}. {title}</h2>
      {subtitle && <p className="pb-1 text-xs font-medium text-slate-500">{subtitle}</p>}
      {children}
    </section>
  );
}

function BulletList({ items }: { items: readonly (readonly [string, string])[] }) {
  return (
    <ul className="list-disc space-y-2 pl-5 pt-1 text-base leading-relaxed text-slate-700">
      {items.map(([term, text]) => (
        <li key={term}>
          <strong className="font-semibold text-slate-900">{term}:</strong> {text}
        </li>
      ))}
    </ul>
  );
}

export default function PrivacyPolicy() {
  return (
    <div className="flex min-h-screen flex-col justify-between bg-[#F8FAFC] text-slate-800">
      {/* 1. NEW REUSABLE HEADER INJECTED HERE */}
      <LearnMoreHeader />


      {/* MAIN DOCUMENT */}
      <main className="w-full flex-grow px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[760px] px-1 sm:px-2">
          <header className="mb-8">
            <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-blue-700">
              Privacy &amp; Data Protection
            </div>
            <h1 className="mb-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Privacy Policy
            </h1>
            <div className="text-sm font-normal leading-relaxed text-slate-500">
              Effective Date: {EFFECTIVE_DATE} &nbsp;&middot;&nbsp; Last Updated: {LAST_UPDATED} &nbsp;&middot;&nbsp; Governing Law: Republic Act No. 10173 (Data Privacy Act of 2012)
            </div>
          </header>

          <div className="mb-8 border-b border-slate-200 pb-8 text-base leading-relaxed text-slate-700">
            <p>
              ILOPRISAA operates a digital document management system supporting athletic accreditation and eligibility workflows for member schools. The system processes information relating to student-athletes and to the authorized institutional users who act on their schools&rsquo; behalf. This Privacy Policy explains how that information is collected, used, accessed, protected, and retained, informed by the framework established under the Philippine Data Privacy Act of 2012 (Republic Act No. 10173).
            </p>
          </div>

          <SectionBlock number="01" title="Scope of This Policy" subtitle="Applicability across member schools and platform participants">
            <p className="text-base leading-relaxed text-slate-700">
              This policy applies to participating member schools, authorized coaches, school administrators, authorized Eligibility Committee personnel, and designated system administrators who use the Platform.
            </p>
            <p className="text-base leading-relaxed text-slate-700">
              <strong className="font-semibold text-slate-900">Custodial Athlete Representation:</strong> Student-athletes do not maintain individual self-registered accounts on the Platform. Their records are submitted and managed through their school&rsquo;s authorized coaches and administrators, acting on the institution&rsquo;s behalf.
            </p>
          </SectionBlock>

          <SectionBlock number="02" title="Information We Collect" subtitle="Categories of personal and institutional data processed">
            <p className="text-base leading-relaxed text-slate-700">
              To support athlete accreditation, ILOPRISAA processes the following categories of information:
            </p>
            <BulletList items={infoCategories} />
          </SectionBlock>

          <SectionBlock number="03" title="How We Use Information" subtitle="Legitimate purposes supporting accreditation and eligibility">
            <p className="text-base leading-relaxed text-slate-700">
              Information collected through the Platform is used for legitimate ILOPRISAA administrative purposes, including:
            </p>
            <ul className="list-disc space-y-2 pl-5 pt-1 text-base leading-relaxed text-slate-700">
              {usePurposes.map(item => <li key={item}>{item}</li>)}
            </ul>
          </SectionBlock>

          <SectionBlock number="04" title="Document Custody and Athlete Records" subtitle="Custodial handling of sensitive educational and medical files">
            <p className="text-base leading-relaxed text-slate-700">
              Student-athlete source documents originate with the athlete and are submitted through the athlete&rsquo;s school. The institutional workflow follows this path: the student-athlete provides source documents to their coach, the coach or school administrator submits digitized copies through the Platform, and the Eligibility Committee reviews the submission.
            </p>
            <div className="rounded-md border border-slate-200 bg-slate-100 px-4 py-3 text-sm leading-relaxed text-slate-700">
              Student-athlete source documents are submitted through the authorized school or institutional workflow before digital review.
            </div>
          </SectionBlock>

          <SectionBlock number="05" title="Human Review and Institutional Decisions" subtitle="Human-in-the-loop screening authority">
            <p className="text-base leading-relaxed text-slate-700">
              ILOPRISAA digitizes the accreditation workflow without replacing institutional judgment. Documents submitted through the Platform are inspected by authorized reviewers, who determine the status of each submission. Where a document requires correction, it may be flagged and returned for resubmission. Final clearance, deferral, or disqualification determinations remain the responsibility of authorized institutional personnel.
            </p>
          </SectionBlock>

          <SectionBlock number="06" title="Role-Based Access and Authorized Disclosures" subtitle="Enforced boundaries and confidential data sharing">
            <p className="text-base leading-relaxed text-slate-700">
              Access to records on the Platform is governed by role-based access control and row-level security policies, so that users can access only the records relevant to their institutional responsibilities:
            </p>
            <BulletList items={roles} />
            <p className="text-base leading-relaxed text-slate-700">
              ILOPRISAA does not sell personal data. Information may be accessed or disclosed where necessary for legitimate ILOPRISAA administration, eligibility review, institutional governance, or applicable legal obligations.
            </p>
          </SectionBlock>

          <SectionBlock number="07" title="Data Retention and Archival" subtitle="Lifecycle governance and recordkeeping">
            <p className="text-base leading-relaxed text-slate-700">
              Personal information and submitted records may be retained for as long as reasonably necessary to fulfill legitimate accreditation, administrative, archival, compliance, and dispute-resolution purposes, subject to applicable institutional policies and legal requirements.
            </p>
          </SectionBlock>

          <SectionBlock number="08" title="Technical and Organizational Security Safeguards" subtitle="Security measures protecting institutional data">
            <p className="text-base leading-relaxed text-slate-700">
              ILOPRISAA applies appropriate technical and organizational safeguards intended to protect institutional data, including authenticated access, role-based permissions, controlled document access, secure transmission of data, and administrative safeguards, with auditability supported where implemented.
            </p>
          </SectionBlock>

          <SectionBlock number="09" title="Data Subject Rights Under Philippine Law" subtitle="Statutory protections under RA 10173">
            <p className="text-base leading-relaxed text-slate-700">
              In accordance with Republic Act No. 10173, data subjects may exercise the following rights, subject to applicable legal conditions, limitations, and institutional requirements:
            </p>
            <BulletList items={dataRights} />
          </SectionBlock>

          <SectionBlock number="10" title="Technical Telemetry & Session Data" subtitle="Operational session handling without unnecessary tracking">
            <p className="text-base leading-relaxed text-slate-700">
              The Platform may process limited technical information, such as authentication and session data, that is necessary to maintain secure user sessions and operate the system. ILOPRISAA does not use the Platform to serve advertising or to engage in behavioral tracking unrelated to platform operation.
            </p>
          </SectionBlock>

          <SectionBlock number="11" title="Third-Party Infrastructure Services" subtitle="Technical infrastructure and cloud hosting partners">
            <p className="text-base leading-relaxed text-slate-700">
              ILOPRISAA relies on established cloud infrastructure and data storage services, including Supabase, to operate the Platform. Where a third-party service provider processes personal information on ILOPRISAA&rsquo;s behalf, appropriate contractual and organizational safeguards are expected to govern such processing.
            </p>
          </SectionBlock>

          <SectionBlock number="12" title="Revisions to This Privacy Policy" subtitle="Policy update procedures and notifications">
            <p className="text-base leading-relaxed text-slate-700">
              ILOPRISAA may update this Privacy Policy when system functionality changes, institutional procedures change, applicable laws or regulations change, or ILOPRISAA governance requirements change. Revisions will be reflected on this page with an updated &ldquo;Last Updated&rdquo; date.
            </p>
          </SectionBlock>

          <SectionBlock number="13" title="Contact Information" subtitle="Designated communication channels for privacy inquiries">
            <p className="mb-4 text-base leading-relaxed text-slate-700">
              For inquiries regarding this Privacy Policy or the processing of athletic accreditation records, please contact the ILOPRISAA Secretariat through official institutional channels.
            </p>
            <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-700 shadow-sm">
              <div>
                <div className="text-base font-bold text-slate-900">Iloilo Private Schools Athletic Association (ILOPRISAA)</div>
                <div className="text-slate-600">Committee on Eligibility and Accreditation &mdash; Data Protection / Privacy Inquiries</div>
                <div className="text-slate-600">Iloilo City, Iloilo, Western Visayas (Region VI), Philippines</div>
              </div>
              <div className="grid grid-cols-1 gap-x-4 gap-y-2 border-t border-slate-200/75 pt-4 text-xs sm:grid-cols-2">
                <div>
                  <span className="font-medium text-slate-500">Secretariat:</span>
                  <a className="ml-1 text-blue-600 hover:underline" href="mailto:secretariat@iloprisaa.edu.ph">secretariat@iloprisaa.edu.ph</a>
                </div>
                <div>
                  <span className="font-medium text-slate-500">Eligibility Inquiries:</span>
                  <a className="ml-1 text-blue-600 hover:underline" href="mailto:eligibility@iloprisaa.edu.ph">eligibility@iloprisaa.edu.ph</a>
                </div>
                <div>
                  <span className="font-medium text-slate-500">Technical Desk:</span>
                  <a className="ml-1 text-blue-600 hover:underline" href="mailto:support@iloprisaa.edu.ph">support@iloprisaa.edu.ph</a>
                </div>
                <div>
                  <span className="font-medium text-slate-500">Compliance Registry:</span>
                  <span className="ml-1 text-slate-700">Republic Act No. 10173 &middot; NPC</span>
                </div>
              </div>
            </div>
          </SectionBlock>

        </div>
      </main>

      {/* FOOTER */}
      <LearnMoreFooter />
    </div>
  );
}