import React, { useEffect, useId, useRef } from 'react';
import { AlertCircle, Bell, CheckCircle2, Clock, FileText, X } from 'lucide-react';
import type { AthleteRecord } from './MasterRoster';

export interface AthleteDocumentDetail {
  id: string;
  name: string;
  status?: AthleteRecord['eligibility'];
  issueReason?: string;
}

export interface AthleteDetailsDrawerProps {
  isOpen: boolean;
  athlete: AthleteRecord | null;
  /** Supply actual document details; roster counts do not imply document statuses. */
  documents?: readonly AthleteDocumentDetail[];
  onClose: () => void;
  onNotifyCoach: (athlete: AthleteRecord) => void;
}

const STATUS_STYLES = {
  VERIFIED: {
    label: 'Verified',
    icon: CheckCircle2,
    className: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400',
  },
  PENDING: {
    label: 'Under Review',
    icon: Clock,
    className: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-400',
  },
  FLAGGED: {
    label: 'Action Required',
    icon: AlertCircle,
    className: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400',
  },
} satisfies Record<AthleteRecord['eligibility'], unknown>;

const StatusBadge = ({ status }: { status: AthleteRecord['eligibility'] }) => {
  const { label, icon: Icon, className } = STATUS_STYLES[status];
  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium ${className}`}>
      <Icon aria-hidden="true" className="h-3.5 w-3.5" />
      {label}
    </span>
  );
};

export const AthleteDetailsDrawer: React.FC<AthleteDetailsDrawerProps> = ({
  isOpen,
  athlete,
  documents,
  onClose,
  onNotifyCoach,
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const visible = isOpen && athlete !== null;

  useEffect(() => {
    if (!visible) return;
    const dialog = dialogRef.current;
    if (!dialog) return;

    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';

    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) {
        previousFocus.focus();
      }
    };
  }, [visible]);

  if (!visible || !athlete) return null;

  const initials = athlete.name.split(' ').filter(Boolean).slice(0, 2)
    .map((part) => part[0]).join('').toUpperCase();

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-modal="true"
      className="fixed inset-0 m-0 h-[100dvh] max-h-none w-full max-w-none overflow-hidden border-0 bg-transparent p-0 text-slate-900 backdrop:bg-slate-900/40 backdrop:backdrop-blur-sm dark:text-slate-100"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="ml-auto flex h-full w-full max-w-md flex-col border-l border-slate-200 bg-white text-sm shadow-xl dark:border-slate-800 dark:bg-[#0b1120]">
        <header className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <h2 id={titleId} className="font-bold text-base text-slate-900 dark:text-slate-100">Athlete details</h2>
          <button
            type="button"
            autoFocus
            onClick={onClose}
            aria-label="Close athlete details"
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        </header>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain p-5">
          <section aria-label="Athlete profile" className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-50 text-xs font-bold text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
              {athlete.avatarUrl ? (
                <img src={athlete.avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : initials}
            </div>
            <div className="min-w-0">
              <h3 className="break-words text-sm font-semibold leading-snug text-slate-900 dark:text-slate-100">{athlete.name}</h3>
            </div>
          </section>

          <section aria-label="Registration details" className="rounded-xl border border-slate-200 dark:border-slate-700">
            <dl className="grid grid-cols-2 gap-4 p-4">
              {[
                ['Division', athlete.division],
                ['Category', athlete.gender],
                ['Sport', athlete.sport],
              ].map(([label, value]) => (
                <div key={label} className={label === 'Sport' ? 'col-span-2' : ''}>
                  <dt className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</dt>
                  <dd className="mt-1 break-words text-sm font-medium text-slate-900 dark:text-slate-100">{value}</dd>
                </div>
              ))}
            </dl>
            <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 dark:border-slate-800">
              <span className="text-xs text-slate-500 dark:text-slate-400">Eligibility</span>
              <StatusBadge status={athlete.eligibility} />
            </div>
          </section>

          <section aria-label="Documents">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                <FileText aria-hidden="true" className="h-4 w-4 text-slate-400 dark:text-slate-500" /> Documents
              </h3>
              <span className="text-xs tabular-nums text-slate-500 dark:text-slate-400">
                {athlete.documentsSubmitted}/{athlete.documentsTotal} submitted
              </span>
            </div>
            {documents && documents.length > 0 ? (
              <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 dark:divide-slate-800 dark:border-slate-700">
                {documents.map((document) => (
                  <li key={document.id} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <p className="min-w-0 break-words text-sm font-medium text-slate-900 dark:text-slate-100">{document.name}</p>
                      {document.status && <StatusBadge status={document.status} />}
                    </div>
                    {document.issueReason && (
                      <p className="mt-2 whitespace-pre-wrap break-words text-xs text-slate-500 dark:text-slate-400">{document.issueReason}</p>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-lg border border-dashed border-slate-200 px-4 py-3 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
                Detailed document information has not been provided.
              </p>
            )}
          </section>

          <section aria-label="Head coach" className="border-t border-slate-100 pt-4 dark:border-slate-800">
            <h3 className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Head coach</h3>
            <p className="mt-2 break-words text-sm font-medium text-slate-900 dark:text-slate-100">{athlete.coachName || 'Not set'}</p>
            <p className="mt-1 break-words text-xs text-slate-400 dark:text-slate-500">{athlete.coachEmail}</p>
          </section>
        </div>

        <footer className="shrink-0 border-t border-slate-100 p-4 dark:border-slate-800">
          <button
            type="button"
            onClick={() => onNotifyCoach(athlete)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
          >
            <Bell aria-hidden="true" className="h-4 w-4" /> Notify coach
          </button>
        </footer>
      </div>
    </dialog>
  );
};

export default AthleteDetailsDrawer;
