import { useEffect, useMemo, useRef, useState } from 'react';
import { X, Upload, Check, ExternalLink, Trash2, Loader2, ChevronDown } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  documentsApi,
  DOCUMENT_CATEGORIES,
  REQUIRED_DOCUMENTS,
  TOTAL_REQUIRED_DOCUMENTS,
  type DocumentRow,
} from '../../../3-data-tier/api/documentsApi';
import type { DocumentType } from '../../../3-data-tier/types/database.types.extras';
import { supabase } from '../../../3-data-tier/config/SupabaseClient';
import { verifyDocumentAI, updateAthleteDOB } from '../../../3-data-tier/api/aiVerificationApi';

interface DocumentChecklistModalProps {
  isOpen: boolean;
  athleteId: string | null;
  athleteName: string;
  coachUserId?: string;
  eligibilityCheckDate?: string | null;
  onClose: () => void;
  readOnly?: boolean;
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
  const [pendingType, setPendingType] = useState<DocumentType | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [ageWarning, setAgeWarning] = useState<{ age: number; asOfDate: string } | null>(null);

  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);

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
      }, 150);
      return () => clearTimeout(timeout);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

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

  const completedCount = REQUIRED_DOCUMENTS.filter((req) => byType.has(req.type)).length;
  const isComplete = completedCount === TOTAL_REQUIRED_DOCUMENTS;

  useEffect(() => {
    if (!isOpen || isLoading) return;
    const firstIncomplete = DOCUMENT_CATEGORIES.find((cat) =>
      cat.items.some((item) => !byType.has(item.type))
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
      // Step 1: AI verification (only runs for mapped types, skips PDFs)
      const aiResult = await verifyDocumentAI(file, type);

      if (!aiResult.success) {
        throw new Error(aiResult.error ?? 'Document verification failed.');
      }

      // Step 2: If a DOB was extracted, check eligibility BEFORE saving it.
      if (aiResult.data?.dateOfBirth) {
        const eventYear = eligibilityCheckDate
          ? new Date(eligibilityCheckDate).getFullYear()
          : new Date().getFullYear();

        const { data: age, error: ageError } = (await supabase.rpc('calculate_prisaa_age', {
          dob: aiResult.data.dateOfBirth,
          event_year: eventYear,
        })) as { data: number | null; error: any };

        if (!ageError && age !== null) {
          if (age >= 26) {
            setAgeWarning({ age, asOfDate: `${eventYear}` });
          } else {
            await updateAthleteDOB(athleteId as string, aiResult.data.dateOfBirth);
          }
        }
      }

      // Step 3: Proceed with the existing upload, unchanged
      return documentsApi.uploadDocument(athleteId as string, type, file);
    },
    onMutate: ({ type }) => {
      setErrorMessage(null);
      setPendingType(type);
    },
    onSuccess: () => invalidateRelatedQueries(),
    onError: (error: any) => setErrorMessage(error?.message || 'Upload failed. Please try again.'),
    onSettled: () => setPendingType(null),
  });

  const removeMutation = useMutation({
    mutationFn: (doc: DocumentRow) => documentsApi.removeDocument(doc.id, doc.storage_path),
    onMutate: (doc) => {
      setErrorMessage(null);
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

  if (!shouldRender) return null;

  return (
    <div
      className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 motion-reduce:animate-none ${
        isClosing ? 'animate-out fade-out duration-150' : 'animate-in fade-in duration-200'
      }`}
    >
      <div
        className={`bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden max-h-[90vh] flex flex-col motion-reduce:animate-none ${
          isClosing
            ? 'animate-out fade-out zoom-out-95 duration-150'
            : 'animate-in fade-in zoom-in-95 duration-200'
        }`}
      >
        <div className="flex justify-between items-start p-6 pb-4 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-lg text-slate-800">Documents — {athleteName}</h3>
            <p className="text-xs text-slate-500 mt-1">
              {readOnly
                ? 'View-only, your coach manages uploads for these documents.'
                : "Exit anytime, every upload saves immediately, so you'll pick up right where you left off."}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 active:scale-90 shrink-0 transition-[color,transform]"
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
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-[width] motion-reduce:transition-none ${
                isComplete ? 'bg-green-500' : 'bg-blue-600'
              }`}
              style={{ width: `${(completedCount / TOTAL_REQUIRED_DOCUMENTS) * 100}%` }}
            />
          </div>
        </div>

        {errorMessage && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg">
            {errorMessage}
          </div>
        )}

        {ageWarning && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-300 rounded-lg">
            <p className="text-xs text-red-700 font-medium">
              This athlete would be {ageWarning.age} years old as of {ageWarning.asOfDate} — over
              the age limit (25 and under) for ILOPRISAA eligibility. This date of birth was NOT
              saved.
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

        <div className="p-6 space-y-3 overflow-y-auto">
          {isLoading ? (
            <p className="text-sm text-slate-500 py-8 text-center">Loading documents…</p>
          ) : isError ? (
            <p className="text-sm text-red-600 py-8 text-center">
              Couldn't load this athlete's documents. Please close and try again.
            </p>
          ) : (
            DOCUMENT_CATEGORIES.map((category) => {
              const doneInCategory = category.items.filter((item) => byType.has(item.type)).length;
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
                        {category.items.map((item) => {
                          const doc = byType.get(item.type);
                          const isBusy = pendingType === item.type;

                          return (
                            <div
                              key={item.type}
                              className={`flex items-center justify-between gap-3 p-3 rounded-lg border ${
                                doc ? 'border-green-200 bg-green-50/50' : 'border-slate-200'
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                {doc ? (
                                  <Check className="w-4 h-4 text-green-600 shrink-0" />
                                ) : (
                                  <div className="w-4 h-4 rounded-full border-2 border-slate-300 shrink-0" />
                                )}
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
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
                                  </div>
                                  {doc && (
                                    <p className="text-[11px] text-slate-400 truncate max-w-[260px]">
                                      {doc.original_filename}
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
                                      onClick={() => handleView(doc)}
                                      title="View file"
                                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 active:scale-90 rounded transition-[color,background-color,transform]"
                                    >
                                      <ExternalLink className="w-4 h-4" />
                                    </button>
                                    {!readOnly && (
                                      <>
                                        <button
                                          type="button"
                                          onClick={() => fileInputRefs.current[item.type]?.click()}
                                          title="Replace file"
                                          className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 active:scale-90 rounded transition-[color,background-color,transform]"
                                        >
                                          <Upload className="w-4 h-4" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => removeMutation.mutate(doc)}
                                          title="Remove file"
                                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 active:scale-90 rounded transition-[color,background-color,transform]"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </>
                                    )}
                                  </>
                                ) : readOnly ? (
                                  <span className="text-[10px] text-slate-400 italic">
                                    Not uploaded yet
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => fileInputRefs.current[item.type]?.click()}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 active:scale-[0.97] rounded-lg transition-[background-color,transform]"
                                  >
                                    <Upload className="w-3.5 h-3.5" /> Upload
                                  </button>
                                )}
                                {!readOnly && (
                                  <input
                                    ref={(el) => {
                                      fileInputRefs.current[item.type] = el;
                                    }}
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    className="hidden"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) uploadMutation.mutate({ type: item.type, file });
                                      e.target.value = '';
                                    }}
                                  />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
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
    </div>
  );
}