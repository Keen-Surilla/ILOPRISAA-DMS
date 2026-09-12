import { Link } from 'react-router-dom';
import Logo2 from '../../assets/Frame 100.svg';
import { LearnMoreHeader } from '../components/LearnMore/LearnMoreHeader';
import { LearnMoreFooter } from '../components/LearnMore/LearnMoreFooter';

const usageStandards = [
  ['Legitimate Accreditation Purposes', 'Utilize the Platform exclusively for official ILOPRISAA athlete credential submission, document inspection, roster clearance, and governance administration.'],
  ['Truthful and Authorized Submissions', 'Submit only genuine, verified, and officially sanctioned records. Falsification or willful misrepresentation of student-athlete eligibility metrics constitutes grounds for immediate institutional disqualification.'],
  ['Credential Safeguarding', 'Protect individualized authentication tokens, single sign-on credentials, and session keys. Never disclose passwords or share physical or digital access with unauthorized parties.'],
  ['Strict Confidentiality', 'Treat all athlete personal histories, civil registry documents, and medical evaluations as confidential records protected under Philippine Republic Act No. 10173 (Data Privacy Act of 2012).'],
  ['Procedural Adherence', 'Observe established tournament clearance schedules, division cutoff deadlines, and official screening board memoranda.'],
  ['Authorized Record Utility', 'Access and process institutional records solely to the extent necessary to perform designated coaching or screening duties.'],
] as const;

const prohibitedActivities = [
  ['Unauthorized Access', 'Attempting to access dossiers, audit logs, or school rosters outside one\u2019s designated institutional delegation or committee review assignment.'],
  ['Impersonation and Credential Sharing', 'Operating under another individual\u2019s user identity, sharing assigned login credentials, or permitting unauthorized administrative staff or student-athletes to access the portal.'],
  ['Document Falsification & Tampering', 'Uploading forged, altered, manipulated, expired, or counterfeit PSA birth certificates, medical certificates, or academic transcripts.'],
  ['State & Record Manipulation', 'Attempting to alter verification statuses, circumvent audit logs, or force database state transitions outside authorized evaluation protocols.'],
  ['Security Circumvention', 'Bypassing row-level security policies, multi-tenant isolation barriers, or authentication tokens.'],
  ['Bulk Extraction & Scraping', 'Exporting, harvesting, scraping, or indexing student-athlete records, contact numbers, or institutional roster data for non-PRISAA or commercial purposes.'],
  ['System Disruption', 'Introducing malicious software, denial-of-service scripts, automated bots, or excessive loads that impair system availability for other member schools.'],
  ['Secondary Disclosure', 'Distributing submitted medical examinations, parent waivers, or PSA documents to third parties, scouting entities, or media organizations without formal written authorization from the Board of Trustees.'],
] as const;

const documentIntegrity = [
  ['Authenticity', 'All Philippine Statistics Authority (PSA) birth records, medical clearances, and scholastic transcripts must reflect untampered, original documents issued by competent civil and academic authorities.'],
  ['Completeness', 'Dossiers must contain all requisite items prescribed for the athlete\u2019s division (Secondary or Tertiary) and sport before being submitted for review.'],
  ['Legibility & Clarity', 'Scanned files and digital uploads must be clear, properly oriented, and readable in their entirety, with visible official dry seals, registrar signatures, and professional license numbers. Incomplete or illegible submissions will be flagged for resubmission.'],
] as const;

const humanReviewPoints = [
  ['Human Committee Authority', 'Final clearance, provisional deferral, and disqualification decisions remain the exclusive prerogative of authorized human members of the ILOPRISAA Eligibility Screening Committee.'],
  ['System Status', 'System markers (e.g., "Pending Review", "Flagged", "Verified") represent procedural tracking states and do not supersede formal committee determinations or official written rulings by the Board of Trustees.'],
] as const;

const accountSecurityPoints = [
  'Users must ensure that devices used to access the Platform utilize secure network connections (avoiding unsecured public Wi-Fi) and maintain updated browser security patches.',
  'Users must immediately terminate active browser sessions when leaving work stations unattended.',
  'Any suspicion of account compromise, password leakage, or unauthorized system access must be reported immediately to the ILOPRISAA Technical Secretariat.',
] as const;

const reportingPoints = [
  'Discovery of forged, tampered, or mismatched eligibility records.',
  'Attempts by coaches, athletes, or external parties to solicit fraudulent clearances.',
  'System vulnerabilities, permission anomalies, or potential personal data disclosures.',
] as const;

const enforcementActions = [
  ['Administrative Review', 'Immediate flagging and temporary withholding of disputed athlete rosters or school delegations.'],
  ['Access Suspension', 'Immediate revocation or suspension of portal user credentials for offending personnel.'],
  ['Athletic Penalties', 'Forfeiture of affected game matches, revocation of team tournament accreditation, or multi-year suspension from PRISAA-sanctioned events.'],
  ['Statutory Referral', 'Submission of formal reports to school administration boards, the Department of Education (DepEd), the Commission on Higher Education (CHED), the National Privacy Commission (NPC), or competent law enforcement authorities in cases involving criminal document forgery.'],
] as const;

function Brandmark({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2L9.5 7.5H14.5L12 2Z" />
      <path d="M12 9C9.79 9 8 10.79 8 13C8 14.86 9.27 16.43 11 16.87V21H13V16.87C14.73 16.43 16 14.86 16 13C16 10.79 14.21 9 12 9Z" />
    </svg>
  );
}

function SectionBlock({ number, title, subtitle, children }: {
  number: string; title: string; subtitle?: string; children: React.ReactNode;
}) {
  return (
    // CHANGED: Added mb-10 and increased pt-4 to pt-8 for proper legal document spacing
    <section className="mb-10 space-y-4 border-t border-slate-200 pt-8">
      <div>
        <h2 className="text-lg font-bold text-slate-900">{number}. {title}</h2>
        {subtitle && <p className="pt-1 text-xs font-medium text-slate-500">{subtitle}</p>}
      </div>
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

export default function UsagePolicy() {
  return (
    <div className="flex min-h-screen flex-col justify-between bg-[#F8FAFC] text-slate-800">
      
      {/* 1. REUSABLE HEADER */}
      <LearnMoreHeader />

      {/* MAIN DOCUMENT */}
      <main className="w-full flex-grow px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[760px] px-1 sm:px-2">
          
          <header className="mb-10">
            <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-blue-700">
              Platform Governance &amp; Compliance
            </div>
            <h1 className="mb-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Usage Policy
            </h1>
            <div className="text-sm font-normal leading-relaxed text-slate-500">
              Effective Date: September 1, 2026 &nbsp;&middot;&nbsp; Last Updated: September 1, 2026 &nbsp;&middot;&nbsp; Governing Body: ILOPRISAA Board &amp; Screening Committee
            </div>
          </header>

          <div className="pb-10 text-base leading-relaxed text-slate-700">
            <p>
              This Usage Policy establishes acceptable use standards, security obligations, and procedural rules for authorized personnel interacting with the Iloilo Private Schools Athletic Association (ILOPRISAA) digital document management and athlete accreditation platform (&ldquo;the Platform&rdquo;). By accessing the Platform, member academic institutions, coaches, screening officers, and institutional administrators agree to adhere strictly to these standards.
            </p>
          </div>

          <SectionBlock number="01" title="Purpose and Scope" subtitle="Institutional mandate and application across member delegations">
            <p className="text-base leading-relaxed text-slate-700">
              The purpose of this Usage Policy is to maintain the operational fidelity, evidentiary integrity, and legal confidentiality of all student-athlete dossiers and tournament clearance workflows across Iloilo City and Province. This policy applies uniformly to all authorized coaches, school athletic directors, campus registrars, screening officers, eligibility committee evaluators, and system administrators. Access to the Platform is a custodial privilege granted solely to facilitate tournament governance under applicable ILOPRISAA bylaws and statutory data protection regulations.
            </p>
          </SectionBlock>

          <SectionBlock number="02" title="Universal Usage Standards" subtitle="Core operating tenets for accredited institutional representatives">
            <p className="text-base leading-relaxed text-slate-700">
              All accredited users accessing the Platform must strictly adhere to the following professional and operational standards:
            </p>
            <BulletList items={usageStandards} />
          </SectionBlock>

          <SectionBlock number="03" title="Prohibited Activities" subtitle="Violations of institutional trust, platform security, and data protection">
            <p className="text-base leading-relaxed text-slate-700">
              Authorized users are expressly forbidden from engaging in the following actions on or through the Platform:
            </p>
            <BulletList items={prohibitedActivities} />
          </SectionBlock>

          <SectionBlock number="04" title="Athlete and Institutional Information" subtitle="Custodial handling of sensitive educational and medical records">
            <p className="text-base leading-relaxed text-slate-700">
              Student-athletes do not maintain self-registered accounts on the Platform. Coaches act as custodial stewards, receiving original hard copies directly from athletes and digitizing them on behalf of the member institution. All personal data, including biological sex, birth date, civil registry certifications, academic units, electrocardiogram (ECG) readouts, and parental consents, constitute sensitive institutional information. Users may access and process these records solely within the narrow scope of qualifying athletes for active PRISAA competitions.
            </p>
          </SectionBlock>

          <SectionBlock number="05" title="Document Integrity" subtitle="Standards for authenticity, completeness, and legibility">
            <p className="text-base leading-relaxed text-slate-700">
              Member institutions bear primary responsibility for the validity and clarity of all digital uploads queued for screening:
            </p>
            <BulletList items={documentIntegrity} />
          </SectionBlock>

          <SectionBlock number="06" title="Human Review and Institutional Authority" subtitle="Non-automated verification and committee discretion">
            <p className="text-base leading-relaxed text-slate-700">
              The ILOPRISAA Platform operates as an administrative digitization and workflow queue system; it does not deploy automated algorithms, AI classification, or automated clearance bots to evaluate or approve student-athletes.
            </p>
            <BulletList items={humanReviewPoints} />
          </SectionBlock>

          <SectionBlock number="07" title="Account Security" subtitle="Credential protection and immediate reporting obligations">
            <p className="text-base leading-relaxed text-slate-700">
              Every authorized account is individualized and tied to an authenticated institutional representative:
            </p>
            <ul className="list-disc space-y-2 pl-5 pt-1 text-base leading-relaxed text-slate-700">
              {accountSecurityPoints.map(item => <li key={item}>{item}</li>)}
            </ul>
          </SectionBlock>

          <SectionBlock number="08" title="Reporting Misuse" subtitle="Institutional reporting channels for security and eligibility infractions">
            <p className="text-base leading-relaxed text-slate-700">
              Users have a mandatory institutional duty to report suspected policy violations, including:
            </p>
            <ul className="list-disc space-y-2 pl-5 pt-1 text-base leading-relaxed text-slate-700">
              {reportingPoints.map(item => <li key={item}>{item}</li>)}
            </ul>
            <p className="pt-2 text-base leading-relaxed text-slate-700">
              Reports must be directed immediately to the Eligibility Secretariat via{' '}
              <a className="text-blue-600 underline hover:text-blue-700" href="mailto:eligibility@iloprisaa.edu.ph">eligibility@iloprisaa.edu.ph</a>{' '}
              or the Platform Technical Desk via{' '}
              <a className="text-blue-600 underline hover:text-blue-700" href="mailto:support@iloprisaa.edu.ph">support@iloprisaa.edu.ph</a>.
              Confidentiality of reporting parties is strictly maintained in accordance with institutional whistleblower protections.
            </p>
          </SectionBlock>

          <SectionBlock number="09" title="Enforcement and Sanctions" subtitle="Administrative review and progressive disciplinary measures">
            <p className="text-base leading-relaxed text-slate-700">
              Violations of this Usage Policy compromise the fairness of inter-school athletics and the security of member records. Infractions will be promptly referred to the ILOPRISAA Board of Trustees and Screening Committee for investigation. Depending on severity, enforcement actions include:
            </p>
            <BulletList items={enforcementActions} />
          </SectionBlock>

          <SectionBlock number="10" title="Policy Updates and Amendments" subtitle="Revision protocols and seasonal notifications">
            <p className="text-base leading-relaxed text-slate-700">
              ILOPRISAA reserves the right to amend or update this Usage Policy periodically to reflect changes in athletic association bylaws, Regional and National PRISAA directives, or Philippine statutory regulations. Revised policies will be published on the Platform with an updated &ldquo;Last Updated&rdquo; timestamp, and written circulars will be transmitted to member school athletic directors prior to each athletic season. Continued access to the Platform following updates constitutes acknowledgment and binding acceptance of the revised terms.
            </p>
          </SectionBlock>

          <SectionBlock number="11" title="Contact Information" subtitle="Official governance desks and administrative inquiries">
            <p className="mb-4 text-base leading-relaxed text-slate-700">
              For questions regarding acceptable use, institutional compliance, or reporting potential infractions, please contact:
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
