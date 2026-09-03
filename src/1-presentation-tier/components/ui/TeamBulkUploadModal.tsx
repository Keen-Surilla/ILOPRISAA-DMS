import { useRef, useState } from 'react';
import { X, Loader2, Sparkles, FolderUp, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { documentsApi, REQUIRED_DOCUMENTS } from '../../../3-data-tier/api/documentsApi';
import type { DocumentType } from '../../../3-data-tier/types/database.types.extras';
import { classifyDocumentType } from '../../../3-data-tier/api/aiVerificationApi';
import { finalizeAthleteDocumentUpload } from '../../../3-data-tier/api/documentUploadPipeline';
import { matchAthleteInDocumentText, type RosterAthlete } from '../../../3-data-tier/services/athleteNameMatcher';

interface TeamBulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  roster: RosterAthlete[];
  coachUserId?: string;
  eligibilityCheckDate?: string | null;
}

type EntryStatus = 'classifying' | 'needs_replacement' | 'uploading' | 'skipped' | 'error';

interface TeamBulkEntry {
  id: string;
  file: File;
  status: EntryStatus;
  guessedType: DocumentType | null;
  matchedAthleteId: string | null;
  matchedAthleteName: string | null;
  existingDocStatus?: string;
  reason?: string;
}

interface Toast {
  id: string;
  type: 'success' | 'error';
  message: string;
}

export function TeamBulkUploadModal({
  isOpen,
  onClose,
  roster,
  coachUserId,
  eligibilityCheckDate,
}: TeamBulkUploadModalProps) {
  const queryClient = useQueryClient();
  const [entries, setEntries] = useState<TeamBulkEntry[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isReplacingAll, setIsReplacingAll] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const processingChainRef = useRef<Promise<void>>(Promise.resolve());

  const labelFor = (type: DocumentType) => REQUIRED_DOCUMENTS.find((r) => r.type === type)?.label ?? type;

  const updateEntry = (id: string, patch: Partial<TeamBulkEntry>) => {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  };

  const showToast = (type: 'success' | 'error', message: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4500);
  };

  const invalidateAfterUpload = (athleteId: string) => {
    queryClient.invalidateQueries({ queryKey: ['documents', athleteId] });
    if (coachUserId) {
      queryClient.invalidateQueries({ queryKey: ['documentCounts', coachUserId] });
    }
  };

  /** Shared by the auto-upload path (new empty slot) and the manual confirm-replace path. */
  const performUpload = async (entry: TeamBulkEntry) => {
    if (!entry.guessedType || !entry.matchedAthleteId) return;

    updateEntry(entry.id, { status: 'uploading' });

    const result = await finalizeAthleteDocumentUpload(
      entry.matchedAthleteId,
      entry.guessedType,
      entry.file,
      eligibilityCheckDate,
      { success: true }
    );

    if (!result.success) {
      updateEntry(entry.id, { status: 'error', reason: result.error ?? 'Upload failed.' });
      showToast('error', `${entry.file.name}: ${result.error ?? 'Upload failed.'}`);
      return;
    }

    invalidateAfterUpload(entry.matchedAthleteId);
    setEntries((prev) => prev.filter((e) => e.id !== entry.id));
    showToast(
      'success',
      `${labelFor(entry.guessedType)} uploaded for ${entry.matchedAthleteName ?? 'athlete'}.`
    );
  };

  const processEntry = async (entry: TeamBulkEntry) => {
    // Step 1: which slot does this file belong to? This single call also
    // returns the full OCR text, which doubles as the input for athlete
    // matching below — no second Vision API call needed.
    let guessedType: DocumentType | null = null;
    let fullText = '';
    try {
      const classification = await classifyDocumentType(entry.file);
      if (classification.success && classification.confidence !== 'low') {
        guessedType = classification.documentType ?? null;
      }
      fullText = classification.fullText ?? '';
    } catch {
      // treated as unclassified below
    }

    if (!guessedType) {
      updateEntry(entry.id, {
        status: 'skipped',
        reason: "Couldn't confidently identify the document type — upload it manually from that athlete's checklist.",
      });
      return;
    }

    if (!fullText.trim()) {
      updateEntry(entry.id, {
        status: 'skipped',
        guessedType,
        reason: "Couldn't read any text from this document to identify the athlete — upload it manually.",
      });
      return;
    }

    // Step 2: deterministic (non-AI) search of that same OCR text against the
    // roster. Refuses to guess on ambiguous or absent matches — see
    // athleteNameMatcher.ts.
    const match = matchAthleteInDocumentText(fullText, roster);

    if (!match.athleteId) {
      updateEntry(entry.id, {
        status: 'skipped',
        guessedType,
        reason: match.isAmbiguous
          ? 'This document matches more than one athlete on your roster too closely to auto-assign — please upload this manually.'
          : "Couldn't confidently match this document to anyone on your roster — please upload this manually.",
      });
      return;
    }

    // Step 3: ANY existing document in that slot — verified or not — now
    // requires the coach to confirm before it's overwritten, matching the
    // safer pattern already used in the single-athlete checklist modal.
    // Only a genuinely empty slot uploads automatically.
    const existingDocs = await documentsApi.getDocumentsForAthlete(match.athleteId);
    const existing = existingDocs.find((d) => d.document_type === guessedType);

    if (existing) {
      updateEntry(entry.id, {
        status: 'needs_replacement',
        guessedType,
        matchedAthleteId: match.athleteId,
        matchedAthleteName: match.athleteName,
        existingDocStatus: existing.status,
        reason:
          existing.status === 'verified'
            ? `Matched to ${match.athleteName} — ${labelFor(guessedType)}, but that slot is already VERIFIED.`
            : `Matched to ${match.athleteName} — ${labelFor(guessedType)}. A file already exists in this slot.`,
      });
      return;
    }

    // No separate identity-verification call needed here — the athlete is
    // already determined by the name match above. Birth certificates (the
    // only slot type that carries a DOB worth extracting) never reach this
    // point, since classify-document always forces them to a low-confidence,
    // manual-only result — so there's no DOB-eligibility check to run here.
    await performUpload({ ...entry, matchedAthleteId: match.athleteId, matchedAthleteName: match.athleteName, guessedType });
  };

  const addFiles = (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    if (files.length === 0) return;

    const newEntries: TeamBulkEntry[] = files.map((file) => ({
      id: `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file,
      status: 'classifying',
      guessedType: null,
      matchedAthleteId: null,
      matchedAthleteName: null,
    }));

    setEntries((prev) => [...prev, ...newEntries]);

    // Sequential, not parallel — this matters here even more than in the
    // single-athlete flow, since two files matched to the same athlete +
    // slot need to see each other's result, not just race on stale reads.
    newEntries.forEach((entry) => {
      processingChainRef.current = processingChainRef.current.then(() => processEntry(entry));
    });
  };

  const dismissEntry = (id: string) => setEntries((prev) => prev.filter((e) => e.id !== id));

  const replacementQueue = entries.filter((e) => e.status === 'needs_replacement');

  const confirmReplaceAll = async () => {
    setIsReplacingAll(true);
    // Sequential here too, for the same race-avoidance reason as addFiles.
    for (const entry of replacementQueue) {
      await performUpload(entry);
    }
    setIsReplacingAll(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[85vh] flex flex-col">
        <div className="flex justify-between items-start p-6 pb-4 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-lg text-slate-800">Upload for the Whole Team</h3>
            <p className="text-xs text-slate-500 mt-1">
              Drop files for multiple athletes at once — each file is matched to its athlete and
              document slot automatically. Anything the system can't confidently match, or that
              would overwrite an existing file, stays here for you to confirm or upload manually.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 active:scale-90 shrink-0 transition-[color,transform]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-3">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDraggingOver(true);
            }}
            onDragLeave={() => setIsDraggingOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDraggingOver(false);
              if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
            }}
            className={`border-2 border-dashed rounded-xl p-5 text-center transition-colors ${
              isDraggingOver ? 'border-blue-400 bg-blue-50' : 'border-slate-200 bg-slate-50/50'
            }`}
          >
            <FolderUp className="w-5 h-5 text-slate-400 mx-auto mb-1.5" />
            <p className="text-xs text-slate-500">
              Drag files for any athletes here, or{' '}
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="text-blue-600 font-bold hover:underline"
              >
                browse files
              </button>
            </p>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept=".jpg,.jpeg,.png"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.length) addFiles(e.target.files);
                e.target.value = '';
              }}
            />
          </div>

          {replacementQueue.length > 1 && (
            <div className="flex items-center justify-between gap-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs text-amber-800">
                {replacementQueue.length} files are waiting to replace an existing document.
              </p>
              <button
                type="button"
                onClick={confirmReplaceAll}
                disabled={isReplacingAll}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 active:scale-[0.97] rounded-lg transition-[background-color,transform] shrink-0"
              >
                {isReplacingAll ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5" />
                )}
                Replace All
              </button>
            </div>
          )}

          {entries.length > 0 && (
            <div className="space-y-2 border border-slate-200 rounded-xl p-3">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className={`flex items-start gap-2 p-2 rounded-lg border text-xs ${
                    entry.status === 'error' || entry.status === 'skipped' || entry.status === 'needs_replacement'
                      ? 'border-amber-200 bg-amber-50/60'
                      : 'border-slate-100 bg-white'
                  }`}
                >
                  <span
                    className="truncate max-w-[130px] font-medium text-slate-600 shrink-0 pt-0.5"
                    title={entry.file.name}
                  >
                    {entry.file.name}
                  </span>

                  {entry.status === 'classifying' && (
                    <span className="flex items-center gap-1 text-slate-400 pt-0.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Detecting document &amp; matching athlete…
                    </span>
                  )}

                  {entry.status === 'uploading' && (
                    <span className="flex items-center gap-1.5 text-slate-500 min-w-0 pt-0.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                      <span className="truncate">
                        {entry.matchedAthleteName}
                        {entry.guessedType ? ` — ${labelFor(entry.guessedType)}` : ''}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-600 shrink-0">
                        <Sparkles className="w-3 h-3" /> AI
                      </span>
                    </span>
                  )}

                  {(entry.status === 'skipped' || entry.status === 'error') && (
                    <span className="flex-1 min-w-0 text-amber-700">{entry.reason}</span>
                  )}

                  {entry.status === 'needs_replacement' && (
                    <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                      <span className="text-amber-700 truncate">{entry.reason}</span>
                      <button
                        type="button"
                        onClick={() => performUpload(entry)}
                        className="px-2.5 py-1 text-[10px] font-bold text-white bg-amber-500 hover:bg-amber-600 active:scale-95 rounded shadow-sm transition-all shrink-0"
                      >
                        Replace
                      </button>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => dismissEntry(entry.id)}
                    title="Dismiss"
                    className="text-slate-300 hover:text-red-500 shrink-0 ml-auto"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="w-full px-4 py-2 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 active:scale-[0.98] rounded-lg transition-[background-color,transform]"
          >
            Close
          </button>
        </div>
      </div>

      <div className="fixed bottom-4 right-4 z-[70] flex flex-col gap-2 max-w-xs">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-start gap-2 px-4 py-3 rounded-lg shadow-lg text-xs font-medium animate-in fade-in slide-in-from-bottom-2 duration-200 ${
              toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            )}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}