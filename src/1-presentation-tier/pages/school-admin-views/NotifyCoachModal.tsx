import React, { useEffect, useId, useRef, useState } from 'react';
import { AlertCircle, Bell, Loader2, Send, X } from 'lucide-react';
import type { AthleteRecord } from './MasterRoster';

export interface NotifyCoachModalProps {
  isOpen: boolean;
  athlete: AthleteRecord | null;
  /** Initial message for each opening or newly selected athlete. */
  defaultMessage?: string;
  isSending?: boolean;
  errorMessage?: string | null;
  onClose: () => void;
  /** The parent owns delivery, sending state, and closing after success. */
  onSend: (athlete: AthleteRecord, message: string) => void;
}

type OpenModalProps = Omit<NotifyCoachModalProps, 'isOpen' | 'athlete'> & {
  athlete: AthleteRecord;
};

const OpenNotifyCoachModal: React.FC<OpenModalProps> = ({
  athlete,
  defaultMessage = '',
  isSending = false,
  errorMessage,
  onClose,
  onSend,
}) => {
  const [message, setMessage] = useState(defaultMessage);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const messageId = useId();
  const hintId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previousFocus = document.activeElement;
    dialog.showModal();

    return () => {
      dialog.close();
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) {
        previousFocus.focus();
      }
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-modal="true"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-hidden overscroll-contain rounded-2xl border border-transparent bg-white p-0 text-sm text-slate-900 shadow-xl backdrop:bg-slate-900/40 backdrop:backdrop-blur-sm dark:border-slate-800 dark:bg-[#0b1120] dark:text-slate-100"
    >
      <form
        aria-busy={isSending}
        onSubmit={(event) => {
          event.preventDefault();
          const trimmedMessage = message.trim();
          if (!isSending && trimmedMessage) onSend(athlete, trimmedMessage);
        }}
      >
        <header className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <h2 id={titleId} className="flex items-center gap-2 font-bold text-base text-slate-900 dark:text-slate-100">
            <Bell aria-hidden="true" className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            Notify coach
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close notification modal"
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        </header>

        <div className="max-h-[70vh] space-y-4 overflow-y-auto p-5">
          <section aria-label="Athlete details" className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
            <h3 className="break-words text-sm font-semibold text-slate-900 dark:text-slate-100">{athlete.name}</h3>
            <dl className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <dt className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Division</dt>
                <dd className="mt-1 break-words text-sm font-medium text-slate-900 dark:text-slate-100">{athlete.division}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Sport</dt>
                <dd className="mt-1 break-words text-sm font-medium text-slate-900 dark:text-slate-100">{athlete.sport || 'Not set'}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Documents submitted</dt>
                <dd className="mt-1 text-sm font-medium tabular-nums text-slate-900 dark:text-slate-100">{athlete.documentsSubmitted} / {athlete.documentsTotal}</dd>
              </div>
            </dl>
          </section>

          <section aria-label="Recipient">
            <h3 className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">To coach</h3>
            <p className="mt-1 break-words text-sm font-medium text-slate-900 dark:text-slate-100">{athlete.coachName || 'Not set'}</p>
            <p className="mt-1 break-words text-xs text-slate-400 dark:text-slate-500">{athlete.coachEmail}</p>
          </section>

          <div>
            <label htmlFor={messageId} className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Message</label>
            <textarea
              id={messageId}
              autoFocus
              required
              rows={5}
              value={message}
              disabled={isSending}
              onChange={(event) => setMessage(event.target.value)}
              aria-describedby={hintId}
              placeholder="Write a message to the coach..."
              className="block w-full resize-y rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm leading-relaxed text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
            <p id={hintId} className="mt-2 text-xs text-slate-400 dark:text-slate-500">Enter a message before sending.</p>
          </div>

          {errorMessage && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400"
            >
              <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        <footer className="flex flex-wrap justify-end gap-3 border-t border-slate-100 px-5 pb-5 pt-3 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-bold text-slate-600 transition-[color,background-color,transform] hover:bg-slate-100 active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSending || !message.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-md shadow-blue-600/20 transition-[background-color,transform] hover:bg-blue-700 active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSending ? (
              <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin motion-reduce:animate-none" />
            ) : (
              <Send aria-hidden="true" className="h-4 w-4" />
            )}
            {isSending ? 'Sending...' : 'Send Notification'}
          </button>
        </footer>
      </form>
    </dialog>
  );
};

export const NotifyCoachModal: React.FC<NotifyCoachModalProps> = ({ isOpen, athlete, ...props }) => {
  if (!isOpen || !athlete) return null;
  // Remount to reset the draft on reopening or switching athletes.
  return <OpenNotifyCoachModal key={athlete.teamMemberId} athlete={athlete} {...props} />;
};

export default NotifyCoachModal;
