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
import type { DocumentType } from '../../../3-data-tier/types/database.types';

interface DocumentChecklistModalProps {
  isOpen: boolean;
  athleteId: string | null;
  athleteName: string;
  coachUserId: string; // used to invalidate the roster's progress badge cache
  onClose: () => void;
}

export function DocumentChecklistModal({
  isOpen,
  athleteId,
  athleteName,
  coachUserId,
  onClose,
}: DocumentChecklistModalProps) {
  const queryClient = useQueryClient();
  const [openCategoryId, setOpenCategoryId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingType, setPendingType] = useState<DocumentType | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  
  // State for the In-App Previewer
  const [previewData, setPreviewData] = useState<{ url: string; type: string } | null>(null);

  const { data: documents = [], isLoading, isError } = useQuery({
    queryKey: ['documents', athleteId],
    queryFn: () => documentsApi.getDocumentsForAthlete(athleteId as string),
    enabled: isOpen && !!athleteId,
    staleTime: 1000 * 60 * 5, 
    refetchOnWindowFocus: false, // Cache stays fresh for 5 minutes (stops spamming the DB)
  });

  const byType = useMemo(() => {
    const map = new Map<DocumentType, DocumentRow>();
    for (const doc of documents) map.set(doc.document_type as DocumentType, doc);
    return map;
  }, [documents]);

  const completedCount = REQUIRED_DOCUMENTS.filter(req => byType.has(req.type)).length;
  const isComplete = completedCount === TOTAL_REQUIRED_DOCUMENTS;

  // Open whichever category has the first incomplete item whenever the modal opens
  useEffect(() => {
    if (!isOpen || isLoading) return;
    const firstIncomplete = DOCUMENT_CATEGORIES.find(cat =>
      cat.items.some(item => !byType.has(item.type))
    );
    setOpenCategoryId(firstIncomplete?.id ?? DOCUMENT_CATEGORIES[0]?.id ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, athleteId, isLoading]);

  const invalidateRelatedQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['documents', athleteId] });
    queryClient.invalidateQueries({ queryKey: ['documentCounts', coachUserId] });
  };

const uploadMutation = useMutation({
    mutationFn: ({ type, file }: { type: DocumentType; file: File }) =>
      documentsApi.uploadDocument(athleteId as string, type, file),
    onMutate: ({ type }) => { setErrorMessage(null); setPendingType(type); },
    onSuccess: (newDocument) => {
      // instantly update the list without a network request!
      queryClient.setQueryData(['documents', athleteId], (oldDocs: DocumentRow[] = []) => {
        // Remove the old version (if overwriting) and append the new one
        return [...oldDocs.filter(d => d.document_type !== newDocument.document_type), newDocument];
      });
      // Only invalidate the coach's notification count in the background
      queryClient.invalidateQueries({ queryKey: ['documentCounts', coachUserId] });
    },
    onError: (error: any) => setErrorMessage(error?.message || 'Upload failed. Please try again.'),
    onSettled: () => setPendingType(null),
  });

 const removeMutation = useMutation({
    mutationFn: (doc: DocumentRow) => documentsApi.removeDocument(doc.id, doc.storage_path),
    onMutate: (doc) => { setErrorMessage(null); setPendingType(doc.document_type as DocumentType); },
    onSuccess: (_, deletedDoc) => {
      // Instantly remove it from the screen without a network request!
      queryClient.setQueryData(['documents', athleteId], (oldDocs: DocumentRow[] = []) => {
        return oldDocs.filter(d => d.id !== deletedDoc.id);
      });
      queryClient.invalidateQueries({ queryKey: ['documentCounts', coachUserId] });
    },
    onError: (error: any) => setErrorMessage(error?.message || 'Could not remove file.'),
    onSettled: () => setPendingType(null),
  });

  const handleView = async (doc: DocumentRow) => {
    try {
      setErrorMessage(null); 
      const url = await documentsApi.getSignedUrl(doc.storage_path);
      setPreviewData({ url, type: doc.mime_type });
    } catch (err: any) {
      setErrorMessage(err?.message || 'Could not load the preview.');
    }
  };

  // FIX: Prevents the modal from rendering permanently on the screen
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      
      {/* Notice the 'relative' class added here for the preview overlay */}
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden max-h-[90vh] flex flex-col relative">

        <div className="flex justify-between items-start p-6 pb-4 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-lg text-slate-800">Documents — {athleteName}</h3>
            <p className="text-xs text-slate-500 mt-1">
              Exit anytime — every upload saves immediately, so you'll pick up right where you left off.
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 shrink-0">
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
              className={`h-full rounded-full transition-all duration-500 ${isComplete ? 'bg-green-500' : 'bg-blue-600'}`}
              style={{ width: `${(completedCount / TOTAL_REQUIRED_DOCUMENTS) * 100}%` }}
            />
          </div>
        </div>

        {errorMessage && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg">
            {errorMessage}
          </div>
        )}

        <div className="p-6 space-y-3 overflow-y-auto">
          {isLoading ? (
            /* --- BEAUTIFUL SKELETON LOADING UI --- */
            <div className="space-y-3">
              {[1, 2, 3, 4].map((skeleton) => (
                <div key={skeleton} className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="w-full flex items-center justify-between gap-3 px-4 py-4 bg-slate-50">
                    <div className="min-w-0 flex-1">
                      <div className="h-4 bg-slate-200/70 rounded-full w-1/3 mb-2 animate-pulse" />
                      <div className="h-3 bg-slate-200/70 rounded-full w-2/3 animate-pulse" />
                    </div>
                    <div className="w-4 h-4 bg-slate-200/70 rounded shrink-0 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : isError ? (
            <p className="text-sm text-red-600 py-8 text-center">
              Couldn't load this athlete's documents. Please close and try again.
            </p>
          ) : (
            DOCUMENT_CATEGORIES.map((category) => {
              const doneInCategory = category.items.filter(item => byType.has(item.type)).length;
              const categoryComplete = doneInCategory === category.items.length;
              const isOpenCat = openCategoryId === category.id;

              return (
                <div key={category.id} className="border border-slate-200 rounded-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpenCategoryId(isOpenCat ? null : category.id)}
                    className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        {categoryComplete && <Check className="w-4 h-4 text-green-600 shrink-0" />}
                        <p className="text-sm font-bold text-slate-800">{category.title}</p>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                          categoryComplete ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-500'
                        }`}>
                          {doneInCategory}/{category.items.length}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">{category.description}</p>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isOpenCat ? 'rotate-180' : ''}`} />
                  </button>

                  {isOpenCat && (
                    <div className="p-3 space-y-2 bg-white animate-in slide-in-from-top-1 fade-in duration-200">
                      {category.items.map((item) => {
                        const doc = byType.get(item.type);
                        const isBusy = pendingType === item.type;

                        return (
                          <div
                            key={item.type}
                            className={`flex items-center justify-between gap-3 p-3 rounded-lg border transition-colors ${
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
                                <p className="text-sm font-medium text-slate-700">{item.label}</p>
                                {doc && (
                                  <p className="text-[11px] text-slate-400 truncate max-w-[260px]">{doc.original_filename}</p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {isBusy ? (
                                <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                              ) : doc ? (
                                <>
                                  <button type="button" onClick={() => handleView(doc)} title="View file"
                                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors">
                                    <ExternalLink className="w-4 h-4" />
                                  </button>
                                  <button type="button" onClick={() => fileInputRefs.current[item.type]?.click()} title="Replace file"
                                    className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors">
                                    <Upload className="w-4 h-4" />
                                  </button>
                                  <button type="button" onClick={() => removeMutation.mutate(doc)} title="Remove file"
                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => fileInputRefs.current[item.type]?.click()}
                                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                                >
                                  <Upload className="w-3.5 h-3.5" /> Upload
                                </button>
                              )}
                              <input
                                ref={(el) => { fileInputRefs.current[item.type] = el; }}
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) uploadMutation.mutate({ type: item.type, file });
                                  e.target.value = '';
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="p-6 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="w-full px-4 py-2 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>

        {/* --- IN-APP PREVIEW OVERLAY --- */}
        {previewData && (
          <div className="absolute inset-0 z-50 bg-slate-900/95 flex flex-col p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-medium text-sm">Document Preview</h3>
              <button
                type="button"
                onClick={() => setPreviewData(null)}
                className="text-slate-300 hover:text-white p-2 bg-slate-800 hover:bg-slate-700 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 w-full overflow-hidden flex items-center justify-center bg-black/50 rounded-xl border border-slate-700">
              {previewData.type.includes('pdf') ? (
                <iframe src={previewData.url} className="w-full h-full bg-white rounded-xl" title="PDF Preview" />
              ) : (
                <img src={previewData.url} alt="Preview" className="max-w-full max-h-full object-contain rounded-xl" />
              )}
            </div>
          </div>
        )}

      </div> 
    </div>
  );
}