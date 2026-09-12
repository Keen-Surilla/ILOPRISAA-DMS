import React from 'react';
import { Lock, Download, ClipboardList, FolderOpen, Trash2, UserCheck, Mail, Share2, LogOut, Camera } from 'lucide-react';
import { ExpandableItem, ActionRow, ToggleSwitch, type SettingsFormData } from './sharedui';

interface PrivacyTabProps {
  formData: SettingsFormData;
  setFormData: React.Dispatch<React.SetStateAction<SettingsFormData>>;
  handleExportRoster: () => void;
  handleViewAuditLogs: () => void;
  handleManageCredentials: () => void;
  handleRequestDeletion: () => void;
  handleManageConsentWaivers: () => void;
  handleEmailDpo: () => void;
  handleLogoutAllDevices: () => void;
}

export default function PrivacyTab({
  formData,
  setFormData,
  handleExportRoster,
  handleViewAuditLogs,
  handleManageCredentials,
  handleRequestDeletion,
  handleManageConsentWaivers,
  handleEmailDpo,
  handleLogoutAllDevices,
}: PrivacyTabProps) {
  return (
    <div className="animate-in fade-in duration-200 mb-8">
      <h2 className="text-xl font-bold text-slate-900 dark:text-[#f8fafc] mb-2">Security &amp; Privacy</h2>
      <p className="text-[13px] leading-relaxed text-slate-500 dark:text-[#94a3b8] mb-8">
        ILOPRISAA is committed to transparent and secure data practices. Learn how student-athlete credentials and
        academic records are protected in compliance with the Data Privacy Act of 2012, and visit our{' '}
        <a href="/privacy-policy" className="font-semibold text-blue-600 dark:text-[#7dd3fc] hover:underline">
          Privacy Policy
        </a>{' '}
        for more details.
      </p>

      {/* Data Security & Usage */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-[13px] font-bold uppercase tracking-wide text-sky-600 dark:text-[#7dd3fc]">
            Data Security &amp; Usage
          </h3>
          <Lock className="w-4 h-4 text-sky-500 dark:text-[#7dd3fc]" />
        </div>
        <p className="text-[12px] text-slate-500 dark:text-[#94a3b8] mb-2">
          How your team's documents are secured and how long they're kept.
        </p>
        <div>
          <ExpandableItem title="How we protect athlete data">
            Documents are secured using Row-Level Security (RLS) and are only accessible to assigned coaches and
            the screening committee. Athletes access documents strictly through secure, expiring view-links.
          </ExpandableItem>
          <ExpandableItem title="Data retention and automated cleanup">
            To minimize risk, our automated systems purge stale annual documents every day at 01:00. Master
            records are retained only as long as the athlete remains eligible.
          </ExpandableItem>
        </div>
      </div>

      {/* Preferences */}
      <div className="mb-8 pt-6 border-t border-slate-200 dark:border-white/[0.06]">
        <h3 className="text-[13px] font-bold uppercase tracking-wide text-sky-600 dark:text-[#7dd3fc] mb-1">
          Preferences
        </h3>
        <p className="text-[12px] text-slate-500 dark:text-[#94a3b8] mb-4">
          Control optional alerts and how your team's data may be used in aggregate.
        </p>
        <div className="divide-y divide-slate-100 dark:divide-white/[0.06]">
          <div className="flex items-center justify-between gap-4 py-4">
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-sky-700 dark:text-[#93c5fd]">Security Incident Alerts</p>
              <p className="text-[11px] text-slate-500 dark:text-[#94a3b8] mt-0.5">
                Allow the system to send email notifications to this account if multiple failed login attempts
                trigger our IP-blocking security protocols.
              </p>
            </div>
            <ToggleSwitch
              checked={formData.security_incident_alerts}
              onChange={(v) => setFormData({ ...formData, security_incident_alerts: v })}
              label="Security Incident Alerts"
            />
          </div>
          <div className="flex items-center justify-between gap-4 py-4">
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-sky-700 dark:text-[#93c5fd]">Aggregated Analytics</p>
              <p className="text-[11px] text-slate-500 dark:text-[#94a3b8] mt-0.5">
                Allow the ILOPRISAA committee to view anonymized, aggregated demographic data (e.g., total athletes
                by course or municipality) to improve future sporting events.
              </p>
            </div>
            <ToggleSwitch
              checked={formData.aggregated_analytics}
              onChange={(v) => setFormData({ ...formData, aggregated_analytics: v })}
              label="Aggregated Analytics"
            />
          </div>
        </div>
      </div>

      {/* Your Data */}
      <div className="mb-8 pt-6 border-t border-slate-200 dark:border-white/[0.06]">
        <h3 className="text-[13px] font-bold uppercase tracking-wide text-sky-600 dark:text-[#7dd3fc] mb-1">
          Your Data
        </h3>
        <p className="text-[12px] text-slate-500 dark:text-[#94a3b8] mb-2">
          Export your roster, review access history, or manage what's on file.
        </p>
        <div className="divide-y divide-slate-100 dark:divide-white/[0.06]">
          <ActionRow
            icon={Download}
            title="Export roster data"
            description="Download your team's roster as Form 01B."
            buttonLabel="Export Form 01B"
            onClick={handleExportRoster}
          />
          <ActionRow
            icon={ClipboardList}
            title="View audit logs"
            description="See exactly who viewed or verified this team's documents."
            buttonLabel="View Logs"
            onClick={handleViewAuditLogs}
          />
          <ActionRow
            icon={FolderOpen}
            title="Uploaded credentials"
            description="Review and manage your athletes' uploaded documents."
            buttonLabel="Manage"
            onClick={handleManageCredentials}
          />
          <ActionRow
            icon={Trash2}
            title="Request data deletion"
            description="Flags the school admin to wipe your roster and associated buckets upon leaving the institution."
            buttonLabel="Request Deletion"
            onClick={handleRequestDeletion}
            variant="danger"
          />
        </div>
      </div>

      {/* Consent & Compliance */}
      <div className="mb-8 pt-6 border-t border-slate-200 dark:border-white/[0.06]">
        <h3 className="text-[13px] font-bold uppercase tracking-wide text-sky-600 dark:text-[#7dd3fc] mb-1">
          Consent &amp; Compliance
        </h3>
        <p className="text-[12px] text-slate-500 dark:text-[#94a3b8] mb-2">
          Track signed consent forms and reach the Data Protection Officer.
        </p>
        <div className="divide-y divide-slate-100 dark:divide-white/[0.06]">
          <ActionRow
            icon={UserCheck}
            title="Athlete Consent Waivers"
            description="Track which athletes have submitted their signed Data Privacy Consent forms — required before processing their credentials."
            buttonLabel="Manage"
            onClick={handleManageConsentWaivers}
          />
          <ActionRow
            icon={Mail}
            title="Contact Data Protection Officer (DPO)"
            description="For inquiries about data privacy rights, document handling, or to report a breach."
            buttonLabel="Email DPO"
            onClick={handleEmailDpo}
          />
        </div>
      </div>

      {/* Data Sharing & Endorsements */}
      <div className="mb-8 pt-6 border-t border-slate-200 dark:border-white/[0.06]">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-[13px] font-bold uppercase tracking-wide text-sky-600 dark:text-[#7dd3fc]">
            Data Sharing &amp; Endorsements
          </h3>
          <Share2 className="w-4 h-4 text-sky-500 dark:text-[#7dd3fc]" />
        </div>
        <div>
          <ExpandableItem title="Third-party forwarding (CHED & National PRISAA)">
            Verified rosters and credentials may be securely forwarded to Regional and National PRISAA committees.
            ILOPRISAA does not sell or share data with unauthorized third parties.
          </ExpandableItem>
        </div>
      </div>

      {/* Security & Access */}
      <div className="pt-6 border-t border-slate-200 dark:border-white/[0.06]">
        <h3 className="text-[13px] font-bold uppercase tracking-wide text-sky-600 dark:text-[#7dd3fc] mb-1">
          Security &amp; Access
        </h3>
        <p className="text-[12px] text-slate-500 dark:text-[#94a3b8] mb-2">
          Manage where your account is signed in and how credential images get processed.
        </p>
        <div className="divide-y divide-slate-100 dark:divide-white/[0.06]">
          <ActionRow
            icon={LogOut}
            title="Active Sessions"
            description="If you left your account open on a public school computer, this protects your athletes' data."
            buttonLabel="Log out all devices"
            onClick={handleLogoutAllDevices}
            variant="danger"
          />
          <div className="flex items-center justify-between gap-4 py-4">
            <div className="flex items-start gap-3 min-w-0">
              <Camera className="w-4 h-4 text-slate-400 dark:text-[#64748b] mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-slate-700 dark:text-[#cbd5e1]">OCR Data Processing</p>
                <p className="text-[11px] text-slate-500 dark:text-[#94a3b8] mt-0.5">
                  Allow Google Cloud Vision to process uploaded birth certificates for automated text extraction.
                  Disabling this requires manual data entry by the committee.
                </p>
              </div>
            </div>
            <ToggleSwitch
              checked={formData.ocr_data_processing}
              onChange={(v) => setFormData({ ...formData, ocr_data_processing: v })}
              label="OCR Data Processing"
            />
          </div>
        </div>
      </div>
    </div>
  );
}