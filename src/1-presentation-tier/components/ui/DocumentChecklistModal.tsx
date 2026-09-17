import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Upload, Check, ExternalLink, Trash2, Loader2, ChevronDown, Sparkles, AlertTriangle, FolderUp } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  documentsApi,
  DOCUMENT_CATEGORIES,
  REQUIRED_DOCUMENTS,
  TOTAL_REQUIRED_DOCUMENTS,
  type DocumentRow,
} from '../../../3-data-tier/api/documentsApi';
import type { DocumentType } from '../../../3-data-tier/types/database.types.extras';
import { classifyDocumentType } from '../../../3-data-tier/api/aiVerificationApi';
import { uploadAthleteDocument } from '../../../3-data-tier/api/documentUploadPipeline';

const MAX_FILE_SIZE_MB = 15;

interface DocumentChecklistModalProps {
  isOpen: boolean;
  athleteId: string | null;
  athleteName: string;
  coachUserId?: string;
  eligibilityCheckDate?: string | null;
  onClose: () => void;
  readOnly?: boolean;
}

interface BulkFileEntry {
  id: string;
  file: File;
  guessedType: DocumentType | null;
  confidence: 'high' | 'medium' | 'low';
  selectedType: DocumentType | '';
  status: 'classifying' | 'uploading' | 'error' | 'skipped' | 'needs_replacement';
  error?: string;
  existingDoc?: DocumentRow;
}

function DocumentRowItem({
  item,
  doc,
  isBusy,
  readOnly,
  onView,
  onUpload,
  onRemove,
  onReplace,
}: {
  item: typeof DOCUMENT_CATEGORIES[0]['items'][0];
  doc: DocumentRow | undefined;
  isBusy: boolean;
  readOnly: boolean;
  onView: (doc: DocumentRow) => void;
  onUpload: (type: DocumentType, file: File) => void;
  onRemove: (doc: DocumentRow) => void;
  onReplace: (type: DocumentType, file: File, doc: DocumentRow) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isRejected = doc?.status === 'action_required';
  const isExpired = doc?.status === 'expired';
  const needsAction = isRejected || isExpired;
  const isPending = doc?.status === 'pending_review';
  const isVerified = doc?.status === 'verified';

  return (
    <div
      className={`flex items-center justify-between gap-3 p-3 rounded-lg border ${
        needsAction
          ? 'border-red-200 bg-red-50/60'
          : doc
          ? 'border-green-200 bg-green-50/50'
          : 'border-slate-200'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        {needsAction ? (
          <X className="w-4 h-4 text-red-600 shrink-0" />
        ) : doc ? (
          <Check className="w-4 h-4 text-green-600 shrink-0" />
        ) : (
          <div className="w-4 h-4 rounded-full border-2 border-slate-300 shrink-0" />
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium text-slate-700">{item.label}</p>
            <span
              className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                item.category === 'permanent'
                  ? 'bg-blue-100 text-blue-600'
                  : 'bg-amber-100 text-amber-600'
              }`}
            >
              {item.category === 'permanent' ? 'On File' : 'Renew Yearly'}
            </span>
            {isRejected && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700">
                Rejected — Needs Resubmission
              </span>
            )}
            {isExpired && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700">
                Expired — Needs Renewal
              </span>
            )}
            {isPending && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                Pending Review
              </span>
            )}
            {isVerified && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">
                Verified
              </span>
            )}
          </div>
          {doc && (
            <p className="text-[11px] text-slate-400 truncate max-w-[260px]">
              {doc.original_filename}
            </p>
          )}
          {isRejected && doc?.rejection_reason && (
            <p className="text-[11px] text-red-600 mt-0.5 max-w-[280px]">
              Reason: {doc.rejection_reason}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {isBusy ? (
          <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
        ) : doc ? (
          <>
            <button
              type="button"
              onClick={() => onView(doc)}
              title="View file"
              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 active:scale-90 rounded transition-[color,background-color,transform]"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
            {!readOnly && (
              <>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title={needsAction ? 'Resubmit file' : 'Replace file'}
                  className={
                    needsAction
                      ? 'flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-700 bg-red-100 hover:bg-red-200 active:scale-[0.97] rounded-lg transition-[background-color,transform]'
                      : 'p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 active:scale-90 rounded transition-[color,background-color,transform]'
                  }
                >
                  <Upload className="w-4 h-4" />
                  {needsAction && <span>Resubmit</span>}
                </button>
                <button
                  type="button"
                  onClick={() => onRemove(doc)}
                  title="Remove file"
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 active:scale-90 rounded transition-[color,background-color,transform]"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </>
        ) : readOnly ? (
          <span className="text-[10px] text-slate-400 italic">Not uploaded yet</span>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 active:scale-[0.97] rounded-lg transition-[background-color,transform]"
          >
            <Upload className="w-3.5 h-3.5" /> Upload
          </button>
        )}
        {!readOnly && (
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                if (doc) {
                  onReplace(item.type, file, doc);
                } else {
                  onUpload(item.type, file);
                }
              }
              e.target.value = '';
            }}
          />
        )}
      </div>
    </div>
  );
}

export function DocumentChecklistModal({
  isOpen,
  athleteId,
  athleteName,
  coachUserId,
  eligibilityCheckDate,
  onClose,
  readOnly = false,
}: DocumentChecklistModalProps) {
  const queryClient = useQueryClient();
  const [openCategoryId, setOpenCategoryId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [pendingType, setPendingType] = useState<DocumentType | null>(null);
  const [ageWarning, setAgeWarning] = useState<{ age: number; asOfDate: string } | null>(null);
  const [docPendingDelete, setDocPendingDelete] = useState<DocumentRow | null>(null);
  const [bulkFiles, setBulkFiles] = useState<BulkFileEntry[]>([]);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const bulkInputRef = useRef<HTMLInputElement | null>(null);

  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);
  const processingChainRef = useRef<Promise<void>>(Promise.resolve());
  const [docPendingReplace, setDocPendingReplace] = useState<{ type: DocumentType, file: File, existingDoc: DocumentRow } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setIsClosing(false);
      return;
    }
    if (shouldRender) {
      setIsClosing(true);
      const timeout = setTimeout(() => {
        setShouldRender(false);
        setIsClosing(false);
        setBulkFiles([]);
        setDocPendingDelete(null);
        setSuccessMessage(null);
      }, 150);
      return () => clearTimeout(timeout);
    }
  }, [isOpen, shouldRender]);

  useEffect(() => {
    setBulkFiles([]);
  }, [athleteId]);

  useEffect(() => {
    if (!shouldRender || docPendingDelete || docPendingReplace) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shouldRender, docPendingDelete, docPendingReplace, onClose]);

  const { data: documents = [], isLoading, isError } = useQuery({
    queryKey: ['documents', athleteId],
    queryFn: () => documentsApi.getDocumentsForAthlete(athleteId as string),
    enabled: isOpen && !!athleteId,
  });

  const byType = useMemo(() => {
    const map = new Map<DocumentType, DocumentRow>();
    for (const doc of documents) map.set(doc.document_type as DocumentType, doc);
    return map;
  }, [documents]);

  const isSlotFilled = (doc: DocumentRow | undefined) =>
    doc?.status === 'verified' || doc?.status === 'pending_review';

  const completedCount = REQUIRED_DOCUMENTS.filter((req) => isSlotFilled(byType.get(req.type))).length;
  const isComplete = completedCount === TOTAL_REQUIRED_DOCUMENTS;

  useEffect(() => {
    if (!isOpen || isLoading) return;
    const firstIncomplete = DOCUMENT_CATEGORIES.find((cat) =>
      cat.items.some((item) => !isSlotFilled(byType.get(item.type)))
    );
    setOpenCategoryId(firstIncomplete?.id ?? DOCUMENT_CATEGORIES[0]?.id ?? null);
  }, [isOpen, athleteId, isLoading]);

  const invalidateRelatedQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['documents', athleteId] });
    if (coachUserId) {
      queryClient.invalidateQueries({ queryKey: ['documentCounts', coachUserId] });
    }
  };

  const uploadMutation = useMutation({
    mutationFn: async ({ type, file }: { type: DocumentType; file: File }) => {
      const result = await uploadAthleteDocument(athleteId as string, type, file, eligibilityCheckDate);

      if (result.ageWarning) setAgeWarning(result.ageWarning);

      if (!result.success) {
        throw new Error(result.error ?? 'Upload failed. Please try again.');
      }

      return result.data;
    },
    onMutate: ({ type }) => {
      setErrorMessage(null);
      setSuccessMessage(null);
      setPendingType(type);
    },
    onSuccess: () => {
      invalidateRelatedQueries();
      setSuccessMessage('Document successfully uploaded and saved.');
      setTimeout(() => setSuccessMessage(null), 4000);
    },
    onError: (error: any) => setErrorMessage(error?.message || 'Upload failed. Please try again.'),
    onSettled: () => setPendingType(null),
  });

  const removeMutation = useMutation({
    mutationFn: (doc: DocumentRow) => documentsApi.removeDocument(doc.id, doc.storage_path),
    onMutate: (doc) => {
      setErrorMessage(null);
      setSuccessMessage(null);
      setPendingType(doc.document_type as DocumentType);
    },
    onSuccess: () => invalidateRelatedQueries(),
    onError: (error: any) => setErrorMessage(error?.message || 'Could not remove file.'),
    onSettled: () => setPendingType(null),
  });

  const handleView = async (doc: DocumentRow) => {
    try {
      const url = await documentsApi.getSignedUrl(doc.storage_path);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Could not open this file.');
    }
  };

  const labelFor = (type: DocumentType) => REQUIRED_DOCUMENTS.find((r) => r.type === type)?.label ?? type;

  const updateBulkEntry = (id: string, patch: Partial<BulkFileEntry>) => {
    setBulkFiles((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  };

  const processBulkEntry = async (entry: BulkFileEntry) => {
    let guessedType: DocumentType | null = null;
    let confidence: 'high' | 'medium' | 'low' = 'low';

    try {
      const result = await classifyDocumentType(entry.file);
      if (result.success) {
        guessedType = result.documentType ?? null;
        confidence = result.confidence ?? 'low';
      }
    } catch {
      // fall through
    }

    if (!guessedType || confidence === 'low') {
      updateBulkEntry(entry.id, {
        status: 'skipped',
        guessedType,
        confidence,
        error: "Couldn't confidently identify this document — upload it manually below.",
      });
      return;
    }

    await queryClient.invalidateQueries({ queryKey: ['documents', athleteId] });
    const latestDocs = queryClient.getQueryData<DocumentRow[]>(['documents', athleteId]) ?? documents;
    const existing = latestDocs.find((d) => d.document_type === guessedType);

    if (existing) {
      if (existing.status === 'verified') {
        updateBulkEntry(entry.id, {
          status: 'skipped',
          guessedType,
          confidence,
          selectedType: guessedType,
          error: `Detected as "${labelFor(guessedType)}", but that slot is already VERIFIED.`,
        });
      } else {
        updateBulkEntry(entry.id, {
          status: 'needs_replacement',
          guessedType,
          confidence,
          selectedType: guessedType,
          existingDoc: existing,
          error: `Detected as "${labelFor(guessedType)}". An unverified file already exists here.`,
        });
      }
      return;
    }

    updateBulkEntry(entry.id, { status: 'uploading', guessedType, confidence, selectedType: guessedType });

    try {
      await uploadMutation.mutateAsync({ type: guessedType, file: entry.file });
      setBulkFiles((prev) => prev.filter((e) => e.id !== entry.id));
    } catch (err: any) {
      updateBulkEntry(entry.id, { status: 'error', error: err?.message ?? 'Upload failed.' });
    }
  };

  const addFilesToBulkBatch = (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    if (files.length === 0) return;

    const validFiles = files.filter((file) => {
      if (file.size / (1024 * 1024) > MAX_FILE_SIZE_MB) {
        setErrorMessage(`"${file.name}" exceeds the ${MAX_FILE_SIZE_MB}MB limit and was skipped.`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    const newEntries: BulkFileEntry[] = validFiles.map((file) => ({
      id: `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file,
      guessedType: null,
      confidence: 'low',
      selectedType: '',
      status: 'classifying',
    }));

    setBulkFiles((prev) => [...prev, ...newEntries]);

    newEntries.forEach((entry) => {
      processingChainRef.current = processingChainRef.current.then(() => processBulkEntry(entry));
    });
  };

  if (!shouldRender) return null;
  if (typeof document === 'undefined') return null;

  const modal = (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      onDragOver={(e) => {
        e.preventDefault();
        if (!readOnly) setIsDraggingOver(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        if (e.currentTarget.contains(e.relatedTarget as Node)) return;
        setIsDraggingOver(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setIsDraggingOver(false);
        if (!readOnly && e.dataTransfer.files?.length) addFilesToBulkBatch(e.dataTransfer.files);
      }}
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-colors motion-reduce:animate-none ${
        isDraggingOver ? 'bg-blue-900/40 backdrop-blur-md' : 'bg-slate-950/50 backdrop-blur-[1px]'
      } ${isClosing ? 'animate-out fade-out duration-150' : 'animate-in fade-in duration-200'}`}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl w-full max-w-3xl overflow-hidden max-h-[90vh] flex flex-col pointer-events-auto motion-reduce:animate-none ${
          isClosing
            ? 'animate-out fade-out zoom-out-95 duration-150'
            : 'animate-in fade-in zoom-in-95 duration-200'
        }`}
      >
        {isDraggingOver && (
          <div className="absolute inset-0 z-50 bg-blue-50/90 border-4 border-blue-400 border-dashed rounded-xl flex flex-col items-center justify-center pointer-events-none">
            <FolderUp className="w-16 h-16 text-blue-500 mb-4 animate-bounce" />
            <h2 className="text-2xl font-bold text-blue-700">Drop files to upload</h2>
            <p className="text-blue-600 mt-2">AI will automatically sort them</p>
          </div>
        )}

        <div className="flex justify-between items-start p-6 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">Documents — {athleteName}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {readOnly
                ? 'View-only, your coach manages uploads for these documents.'
                : "Exit anytime, every upload saves immediately, so you'll pick up right where you left off."}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 active:scale-90 shrink-0 transition-[color,transform]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 pt-4">
          <div className="flex items-center justify-between text-xs font-bold mb-1.5">
            <span className={isComplete ? 'text-green-700' : 'text-slate-600'}>
              {isComplete ? 'All documents complete' : 'Overall progress'}
            </span>
            <span className={isComplete ? 'text-green-700' : 'text-slate-500'}>
              {completedCount} / {TOTAL_REQUIRED_DOCUMENTS}
            </span>
          </div>
          <div
            className="w-full h-2 bg-slate-100 rounded-full overflow-hidden"
            role="progressbar"
            aria-valuenow={(completedCount / TOTAL_REQUIRED_DOCUMENTS) * 100}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className={`h-full rounded-full transition-[width] motion-reduce:transition-none ${
                isComplete ? 'bg-green-500' : 'bg-blue-600'
              }`}
              style={{ width: `${(completedCount / TOTAL_REQUIRED_DOCUMENTS) * 100}%` }}
            />
          </div>
        </div>

        {errorMessage && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg flex justify-between items-center animate-in fade-in duration-300">
            <div className="flex items-center gap-2 font-medium">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button onClick={() => setErrorMessage(null)} className="text-red-500 hover:text-red-700 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {successMessage && (
          <div className="mx-6 mt-4 p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg flex justify-between items-center animate-in fade-in duration-300">
            <div className="flex items-center gap-2 font-medium">
              <Check className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
            <button onClick={() => setSuccessMessage(null)} className="text-green-500 hover:text-green-700 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {ageWarning && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-300 rounded-lg">
            <p className="text-xs text-red-700 font-medium">
              This athlete would be {ageWarning.age} years old as of {ageWarning.asOfDate} — over
              the age limit (25 and under) for ILOPRISAA eligibility. This date of birth was NOT saved.
            </p>
            <button
              type="button"
              onClick={() => setAgeWarning(null)}
              className="mt-2 px-3 py-1 text-xs font-bold text-red-700 bg-red-100 hover:bg-red-200 active:scale-[0.97] rounded-lg transition-[background-color,transform]"
            >
              Dismiss
            </button>
          </div>
        )}

        {!readOnly && (
          <div className="px-6 pt-4">
            <div className="border border-slate-200 bg-slate-50/50 rounded-xl p-4 text-center">
              <FolderUp className="w-5 h-5 text-slate-400 mx-auto mb-1.5" />
              <p className="text-xs text-slate-500">
                Drag multiple files anywhere on screen, or{' '}
                <button
                  type="button"
                  onClick={() => bulkInputRef.current?.click()}
                  className="text-blue-600 font-bold hover:underline"
                >
                  browse files
                </button>{' '}
                — Max {MAX_FILE_SIZE_MB}MB per file.
              </p>
              <input
                ref={bulkInputRef}
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.length) addFilesToBulkBatch(e.target.files);
                  e.target.value = '';
                }}
              />
            </div>

            {bulkFiles.length > 0 && (
              <div className="mt-3 space-y-2 border border-slate-200 rounded-xl p-3 max-h-40 overflow-y-auto">
                {bulkFiles.map((entry) => (
                  <div
                    key={entry.id}
                    className={`flex items-center gap-2 p-2 rounded-lg border text-xs ${
                      entry.status === 'error' || entry.status === 'skipped' || entry.status === 'needs_replacement'
                        ? 'border-amber-200 bg-amber-50/60'
                        : 'border-slate-100 bg-white'
                    }`}
                  >
                    <span className="truncate max-w-[140px] font-medium text-slate-600 shrink-0" title={entry.file.name}>
                      {entry.file.name}
                    </span>

                    {entry.status === 'classifying' && (
                      <span className="flex items-center gap-1 text-slate-400">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Detecting…
                      </span>
                    )}

                    {entry.status === 'uploading' && entry.guessedType && (
                      <span className="flex items-center gap-1.5 text-slate-500 min-w-0">
                        <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                        <span className="truncate">Uploading to {labelFor(entry.guessedType)}…</span>
                        <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-600 shrink-0">
                          <Sparkles className="w-3 h-3" /> AI
                        </span>
                      </span>
                    )}

                    {(entry.status === 'skipped' || entry.status === 'error') && (
                      <span className="flex-1 min-w-0 text-amber-700">{entry.error}</span>
                    )}

                    {entry.status === 'needs_replacement' && entry.guessedType && entry.existingDoc && (
                      <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                        <span className="text-amber-700 truncate">{entry.error}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setDocPendingReplace({
                              type: entry.guessedType as DocumentType,
                              file: entry.file,
                              existingDoc: entry.existingDoc as DocumentRow,
                            });
                            setBulkFiles((prev) => prev.filter((e) => e.id !== entry.id));
                          }}
                          className="px-2.5 py-1 text-[10px] font-bold text-white bg-amber-500 hover:bg-amber-600 active:scale-95 rounded shadow-sm transition-all shrink-0"
                        >
                          Confirm Replacement
                        </button>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => setBulkFiles((prev) => prev.filter((e) => e.id !== entry.id))}
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
        )}

        <div className="p-6 space-y-3 overflow-y-auto">
          {isLoading ? (
            <p className="text-sm text-slate-500 py-8 text-center">Loading documents…</p>
          ) : isError ? (
            <p className="text-sm text-red-600 py-8 text-center">
              Couldn't load this athlete's documents. Please close and try again.
            </p>
          ) : (
            DOCUMENT_CATEGORIES.map((category) => {
              const doneInCategory = category.items.filter((item) => isSlotFilled(byType.get(item.type))).length;
              const categoryComplete = doneInCategory === category.items.length;
              const isOpenCat = openCategoryId === category.id;

              return (
                <div key={category.id} className="border border-slate-200 rounded-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpenCategoryId(isOpenCat ? null : category.id)}
                    className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-slate-50 hover:bg-slate-100 active:scale-[0.99] transition-[background-color,transform] text-left"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        {categoryComplete && <Check className="w-4 h-4 text-green-600 shrink-0" />}
                        <p className="text-sm font-bold text-slate-800">{category.title}</p>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                            categoryComplete
                              ? 'bg-green-100 text-green-700'
                              : 'bg-slate-200 text-slate-500'
                          }`}
                        >
                          {doneInCategory}/{category.items.length}
                        </span>
                      </div>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 shrink-0 transition-transform motion-reduce:transition-none ${
                        isOpenCat ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  <div
                    className={`grid transition-[grid-template-rows] duration-300 ease-in-out motion-reduce:transition-none ${
                      isOpenCat ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                    }`}
                  >
                    <div className="overflow-hidden" inert={!isOpenCat}>
                      <div className="p-3 space-y-2 bg-white">
                        {category.items.map((item) => (
                          <DocumentRowItem
                            key={item.type}
                            item={item}
                            doc={byType.get(item.type)}
                            isBusy={pendingType === item.type}
                            readOnly={readOnly}
                            onView={handleView}
                            onUpload={(type, file) => uploadMutation.mutate({ type, file })}
                            onRemove={(doc) => setDocPendingDelete(doc)}
                            onReplace={(type, file, doc) =>
                              setDocPendingReplace({ type, file, existingDoc: doc })
                            }
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="p-6 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="w-full px-4 py-2 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 active:scale-[0.98] rounded-lg transition-[background-color,transform]"
          >
            Close
          </button>
        </div>
      </div>

      {docPendingDelete && (
        <div
          className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-[60] p-4"
          onClick={(e) => {
            e.stopPropagation();
            setDocPendingDelete(null);
          }}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-sm p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4.5 h-4.5 text-red-600" />
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-sm text-slate-800">Remove this file?</h4>
                <p className="text-xs text-slate-500 mt-1 break-words">
                  "{docPendingDelete.original_filename}" will be permanently deleted. This can't be undone.
                </p>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                type="button"
                onClick={() => setDocPendingDelete(null)}
                className="flex-1 px-3 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 active:scale-[0.98] rounded-lg transition-[background-color,transform]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  removeMutation.mutate(docPendingDelete);
                  setDocPendingDelete(null);
                }}
                className="flex-1 px-3 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 active:scale-[0.98] rounded-lg transition-[background-color,transform]"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {docPendingReplace && (
        <div
          className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-[60] p-4"
          onClick={(e) => {
            e.stopPropagation();
            setDocPendingReplace(null);
          }}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-sm p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4.5 h-4.5 text-amber-600" />
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-sm text-slate-800">Replace Existing Document?</h4>
                <p className="text-xs text-slate-500 mt-1 break-words leading-relaxed">
                  {docPendingReplace.existingDoc.status === 'verified'
                    ? "This document has already been verified by the screening committee. Replacing it will permanently delete the current file and reset its status to 'Pending Review'. Do you wish to continue?"
                    : 'A file already exists in this slot. Uploading a new file will permanently overwrite the current one. Do you wish to continue?'}
                </p>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button
                type="button"
                onClick={() => setDocPendingReplace(null)}
                className="flex-1 px-3 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 active:scale-[0.98] rounded-lg transition-[background-color,transform]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  uploadMutation.mutate({
                    type: docPendingReplace.type,
                    file: docPendingReplace.file,
                  });
                  setDocPendingReplace(null);
                }}
                className="flex-1 px-3 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 active:scale-[0.98] rounded-lg transition-[background-color,transform]"
              >
                Yes, Replace Document
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return createPortal(modal, document.body);
}
