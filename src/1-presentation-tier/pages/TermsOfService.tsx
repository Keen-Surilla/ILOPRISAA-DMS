import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import Logo2 from '../../assets/Frame 100.svg';
import { LearnMoreHeader } from '../components/LearnMore/LearnMoreHeader';
import { LearnMoreFooter } from '../components/LearnMore/LearnMoreFooter';

const EFFECTIVE_DATE = 'September 1, 2026';
const LAST_UPDATED = 'September 1, 2026';

const platformCapabilities = [
  'Digital dossier compilation and direct electronic credential submission by authorized coaches.',
  'Document queue routing and structured verification workflows for the Eligibility Screening Committee.',
  'Systematic flagging, notification, and remediation tracking for incomplete or deficient athlete dossiers.',
  'Structured roster management and certification workflows supporting tournament clearance processes.',
  'Audit logging to support transparency and accountability across member academic delegations.',
] as const;

const roles = [
  ['Coaches', 'Appointed team personnel responsible for receiving physical eligibility records from student-athletes, digitizing documents, uploading electronic dossiers for their assigned sports rosters, and remediating flagged submissions.'],
  ['School Administrators', 'Institutional athletic directors, deans, and school heads granted overarching oversight to monitor their school\'s roster clearance progress and certify institutional completeness prior to tournament deadlines.'],
  ['Eligibility Committee Members', 'Accredited screening officers mandated to inspect uploaded proofs, audit academic and medical requirements, record formal findings, and verify or flag individual athlete records.'],
  ['Super Administrators', 'System custodians responsible for maintaining platform infrastructure, managing participating school registrations, enforcing security parameters, and supporting system administration.'],
] as const;

const accountResponsibilities = [
  'Maintain the confidentiality and security of their platform credentials and authentication tokens.',
  'Prevent unauthorized third parties from accessing or operating under their assigned account.',
  'Provide truthful, current, and verified personal and professional contact details during account onboarding.',
  'Immediately inform the ILOPRISAA Eligibility Secretariat and technical administration of any suspected unauthorized access or credential compromise.',
  'Accept full institutional responsibility for all uploads, status determinations, comments, and audit events logged under their user identity.',
] as const;

const institutionalResponsibilities = [
  'All coaches and representatives registered under the institution hold legitimate, active appointments.',
  'Student-athletes included on tournament rosters meet all prerequisite academic enrollment, residency, and unit load standards established by ILOPRISAA bylaws and Commission on Higher Education (CHED) / Department of Education (DepEd) directives.',
  'Physical original files have been inspected for legitimacy prior to electronic dossier digitization.',
  'The institution maintains custodial oversight in strict compliance with the Philippine Data Privacy Act of 2012 (RA 10173).',
] as const;

const documentStandards = [
  ['Authenticity', 'All Philippine Statistics Authority (PSA) birth certificates, official transcripts, enrollment certificates, and medical clearances must represent genuine, unmodified institutional records.'],
  ['Completeness', 'Dossiers must include all prerequisite documentation mandated for the specific competition tier and sports category. Incomplete submissions will not receive official clearance.'],
  ['Legibility', 'Uploaded scans or digital images must be sharp, uncropped, properly oriented, and completely legible, including all official dry seals, registrar signatures, and municipal registry annotations.'],
  ['Timeliness', 'All files must be submitted within the designated accreditation window established by the ILOPRISAA Board. Submissions past stated deadlines are subject to formal rejection.'],
] as const;

const decisionPrinciples = [
  ['No Automated Clearance', 'The system does not utilize automated AI algorithms or automated verification routines to clear or reject student-athletes.'],
  ['Discretionary Inspection', 'Authorized screening committee members independently inspect uploaded proofs against institutional criteria, league bylaws, and sports category standards.'],
  ['Deficiency Notices', 'When an eligibility deficiency is identified, committee personnel record specific, actionable rejection reasons directly in the platform to allow formal school remediation.'],
  ['Official Roster Lock', 'Roster certification becomes final and locked only upon explicit manual clearance approval by authorized committee personnel.'],
] as const;

const prohibitedActivities = [
  ['Document Falsification', 'Uploading forged, altered, tampered, or misattributed birth certificates, medical tests, academic certifications, or official government credentials.'],
  ['Impersonation & Credential Sharing', 'Allowing another individual to access or operate under one\'s assigned account, or misrepresenting one\'s institutional affiliation or role.'],
  ['Unauthorized Access & Infiltration', 'Attempting to probe, scan, breach, or bypass access control boundaries or authentication controls.'],
  ['Data Scraping & Misuse', 'Exporting, scraping, harvesting, or repurposing athlete personal records, medical information, or institutional files for commercial or unauthorized personal uses.'],
  ['System Disruption', 'Introducing malicious code, automated bots, denial-of-service scripts, or engaging in activities that degrade the platform\'s security, integrity, or availability.'],
] as const;

const suspensionReasons = [
  'Violates any provision of these Terms or the ILOPRISAA athletic code of conduct.',
  'Submits deliberately falsified, altered, or fraudulent athlete credentials.',
  'Attempts to circumvent system access controls or compromise platform isolation boundaries.',
  'Ceases to hold an active, accredited affiliation with a member educational institution.',
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

export default function TermsOfService() {
  return (
    <div className="flex min-h-screen flex-col justify-between bg-[#F8FAFC] text-slate-800">
        {/* 1. NEW REUSABLE HEADER INJECTED HERE */}
         <LearnMoreHeader />

      {/* MAIN DOCUMENT */}
      <main className="w-full flex-grow px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[760px] px-1 sm:px-2">
          <header className="mb-8">
            <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-blue-700">
              Governance &amp; Platform Terms
            </div>
            <h1 className="mb-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Terms of Service
            </h1>
            <div className="text-sm font-normal leading-relaxed text-slate-500">
              Effective Date: {EFFECTIVE_DATE} &nbsp;&middot;&nbsp; Last Updated: {LAST_UPDATED} &nbsp;&middot;&nbsp; Governing Body: ILOPRISAA Board &amp; Screening Committee
            </div>
          </header>

          <div className="mb-8 border-b border-slate-200 pb-8 text-base leading-relaxed text-slate-700">
            <p>
              These Terms of Service (&ldquo;Terms&rdquo;) govern authorized access to and use of the Iloilo Private Schools Athletic Association (ILOPRISAA) digital document management and athlete accreditation platform (&ldquo;the Platform&rdquo;). By accessing, signing into, or uploading materials to the Platform, participating member schools, coaches, athletic directors, and designated committee members acknowledge that they have read, understood, and agreed to adhere strictly to these operational and governance terms.
            </p>
          </div>

          <SectionBlock number="01" title="Acceptance of These Terms" subtitle="Binding operational agreement for institutional participants">
            <p className="text-base leading-relaxed text-slate-700">
              Access to the ILOPRISAA Platform is granted strictly on an institutional basis to accredited member academic institutions, their authorized team coaches, school athletic directors, and appointed screening committee officials. Use of the Platform constitutes an explicit agreement to comply with these Terms, regional PRISAA governance regulations, and all applicable national statutory standards. If an authorized user does not agree to these Terms, they must not access or utilize the Platform.
            </p>
          </SectionBlock>

          <SectionBlock number="02" title="About the ILOPRISAA Platform" subtitle="Institutional scope and technical functionality">
            <p className="text-base leading-relaxed text-slate-700">
              The ILOPRISAA Platform provides a secure, centralized digital repository and verification framework designed to facilitate athletic tournament governance across Iloilo City and Province. Specifically, the Platform supports:
            </p>
            <ul className="list-disc space-y-2 pl-5 pt-1 text-base leading-relaxed text-slate-700">
              {platformCapabilities.map(item => <li key={item}>{item}</li>)}
            </ul>
          </SectionBlock>

          <SectionBlock number="03" title="Authorized Users" subtitle="Defined administrative roles and operational boundaries">
            <p className="text-base leading-relaxed text-slate-700">
              The Platform operates under strict role-based access control. Access is granted exclusively to specific organizational roles:
            </p>
            <BulletList items={roles} />
            <div className="mt-4 rounded-r border-l-4 border-blue-600 bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">
              <strong className="font-semibold text-slate-900">Student-Athlete Exclusion Notice:</strong> Student-athletes do not possess individual user accounts or direct system access. All athlete credentials and supporting certifications are submitted to and processed through authorized institutional coaches acting as direct custodial stewards.
            </div>
          </SectionBlock>

          <SectionBlock number="04" title="Account Responsibilities" subtitle="Safeguarding credentials and individual accountability">
            <p className="text-base leading-relaxed text-slate-700">
              Every authorized account is strictly individualized and tied to an authenticated institutional representative. Account holders agree to:
            </p>
            <ul className="list-disc space-y-2 pl-5 pt-1 text-base leading-relaxed text-slate-700">
              {accountResponsibilities.map(item => <li key={item}>{item}</li>)}
            </ul>
          </SectionBlock>

          <SectionBlock number="05" title="Institutional Responsibilities" subtitle="School accountability and certification fidelity">
            <p className="text-base leading-relaxed text-slate-700">
              Participating educational institutions bear primary legal and administrative responsibility for all data submitted under their delegation banner. Member institutions covenant that:
            </p>
            <ul className="list-disc space-y-2 pl-5 pt-1 text-base leading-relaxed text-slate-700">
              {institutionalResponsibilities.map(item => <li key={item}>{item}</li>)}
            </ul>
          </SectionBlock>

          <SectionBlock number="06" title="Document Submission" subtitle="Integrity, completeness, and legibility standards">
            <p className="text-base leading-relaxed text-slate-700">
              All documents submitted through the Platform must satisfy rigorous institutional standards before being queued for verification:
            </p>
            <BulletList items={documentStandards} />
          </SectionBlock>

          <SectionBlock number="07" title="Review and Eligibility Decisions" subtitle="Human adjudication and committee discretion">
            <p className="text-base leading-relaxed text-slate-700">
              The Platform functions strictly as an administrative and organizational utility. Final clearance decisions, flags, and disqualifications remain the exclusive constitutional mandate of human committee officers:
            </p>
            <BulletList items={decisionPrinciples} />
          </SectionBlock>

          <SectionBlock number="08" title="Acceptable Use" subtitle="Lawful and authorized operational utilization">
            <p className="text-base leading-relaxed text-slate-700">
              Authorized users may utilize the Platform solely for lawful, authorized purposes connected directly to ILOPRISAA tournament qualification, athlete dossier digitization, committee verification, and legitimate athletic governance. Users must act in good faith, maintain professional communication within document remediation notes, and respect the privacy and data security rights of all registered participants.
            </p>
          </SectionBlock>

          <SectionBlock number="09" title="Prohibited Use" subtitle="Violations, document fraud, and platform abuse">
            <p className="text-base leading-relaxed text-slate-700">
              The following actions are strictly prohibited and constitute grounds for immediate account termination, institutional sanction, and potential legal referral:
            </p>
            <BulletList items={prohibitedActivities} />
          </SectionBlock>

          <SectionBlock number="10" title="Intellectual Property" subtitle="Platform software, branding, and institutional documentation">
            <p className="text-base leading-relaxed text-slate-700">
              All software architecture, interface designs, codebases, workflows, database logic, and branding assets associated with the ILOPRISAA Document Management System are the exclusive intellectual property of ILOPRISAA and its licensed technology partners. Member schools retain institutional ownership over their official emblems, academic logos, and submitted records, granting ILOPRISAA a non-exclusive, royalty-free administrative license to process, display, and archive submitted materials strictly for tournament accreditation and league governance.
            </p>
          </SectionBlock>

          <SectionBlock number="11" title="Privacy" subtitle="Cross-reference to statutory data protection policy">
            <p className="text-base leading-relaxed text-slate-700">
              All personal information, athlete demographics, academic histories, and medical records collected and processed on the Platform are governed by the{' '}
              <Link to="/privacy-policy" className="font-semibold text-blue-700 hover:underline">ILOPRISAA Privacy Policy</Link>
              {' '}and the Philippine Data Privacy Act of 2012 (Republic Act No. 10173). Authorized users must adhere to all data handling, confidentiality, and institutional custodial requirements set forth in the Privacy Policy.
            </p>
          </SectionBlock>

          <SectionBlock number="12" title="Platform Availability" subtitle="Operational continuity and planned maintenance">
            <p className="text-base leading-relaxed text-slate-700">
              ILOPRISAA strives to maintain reliable, continuous availability of the Platform during active tournament accreditation periods. However, access may be temporarily interrupted, delayed, or limited due to necessary scheduled system maintenance, server upgrades, telecom connectivity issues, or unforeseen circumstances outside the reasonable control of the association. Member schools are strongly advised to complete document uploads well in advance of final screening deadlines to avoid technical bottlenecks.
            </p>
          </SectionBlock>

          <SectionBlock number="13" title="Suspension or Termination" subtitle="Sanctions for misconduct and credential revocation">
            <p className="text-base leading-relaxed text-slate-700">
              ILOPRISAA reserves the formal right to immediately suspend, restrict, or revoke account access for any user or institution that:
            </p>
            <ul className="list-disc space-y-2 pl-5 pt-1 text-base leading-relaxed text-slate-700">
              {suspensionReasons.map(reason => <li key={reason}>{reason}</li>)}
            </ul>
            <p className="pt-3 text-base leading-relaxed text-slate-700">
              Suspension or termination of platform access does not preclude formal athletic disqualification, championship forfeiture, or disciplinary referral before the ILOPRISAA Board of Trustees.
            </p>
          </SectionBlock>

          <SectionBlock number="14" title="Changes to These Terms" subtitle="Amendments and institutional notifications">
            <p className="text-base leading-relaxed text-slate-700">
              ILOPRISAA reserves the right to amend, update, or modify these Terms to align with new athletic association bylaws, regional PRISAA circulars, or statutory regulatory enactments. Updated terms will be published directly to this page with a revised &ldquo;Last Updated&rdquo; timestamp, and notice will be transmitted to member academic institutions prior to the opening of each competitive season. Continued use of the Platform after such revisions constitutes binding acceptance of the amended Terms.
            </p>
          </SectionBlock>

          <SectionBlock number="15" title="Contact Information" subtitle="Official inquiries and governance secretariat">
            <p className="mb-4 text-base leading-relaxed text-slate-700">
              For inquiries regarding these Terms of Service, institutional onboarding, credential permissions, or tournament screening guidelines, please direct official communications to:
            </p>
            <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-700 shadow-sm">
              <div>
                <div className="text-base font-bold text-slate-900">Iloilo Private Schools Athletic Association (ILOPRISAA)</div>
                <div className="text-slate-600">Board of Trustees &amp; Screening Committee</div>
                <div className="text-slate-600">Iloilo City, Iloilo, Western Visayas (Region VI), Philippines</div>
              </div>
              <div className="grid grid-cols-1 gap-x-4 gap-y-2 border-t border-slate-200/75 pt-2 text-xs sm:grid-cols-2">
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