import { useEffect, useState } from 'react';
import { supabase } from '../../../3-data-tier/config/SupabaseClient';
import { documentsApi, REQUIRED_DOCUMENTS, type DocumentRow } from '../../../3-data-tier/api/documentsApi';
import { Maximize2, X, FileText, Image as ImageIcon, Loader2 } from 'lucide-react';

const LABELS = new Map(REQUIRED_DOCUMENTS.map((d) => [d.type, d.label]));

function statusStyles(status?: string) {
  const s = status?.toLowerCase();
  if (s === 'verified') return 'bg-green-100 text-green-700';
  if (s === 'action_required') return 'bg-red-100 text-red-700';
  return 'bg-amber-100 text-amber-700';
}

function statusLabel(status?: string) {
  if (!status) return 'Pending';
  return status
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export default function AthleteDocumentsView() {
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [previewDoc, setPreviewDoc] = useState<DocumentRow | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const { data: myRow, error: rowError } = await supabase
          .from('team_members')
          .select('id')
          .eq('user_id', user.id)
          .limit(1)
          .maybeSingle();

        if (rowError) {
          console.error('Failed to look up team_members row:', rowError);
          setLoading(false);
          return;
        }
        if (!myRow) {
          console.warn('No team_members row found for this athlete (user_id match).');
          setLoading(false);
          return;
        }

        const data = await documentsApi.getDocumentsForAthlete(myRow.id);
        setDocuments(data);
      } catch (err) {
        console.error('Failed to load documents:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const openPreview = async (doc: DocumentRow) => {
    setPreviewDoc(doc);
    setPreviewLoading(true);
    setPreviewUrl(null);
    try {
      // Use signed URL for private bucket access
      const url = await documentsApi.getSignedUrl(doc.storage_path);
      setPreviewUrl(url);
    } catch (err) {
      console.error('Failed to get preview URL:', err);
    } finally {
      setPreviewLoading(false);
    }
  };

  const closePreview = () => {
    setPreviewDoc(null);
    setPreviewUrl(null);
  };

  // Lock background scroll while modal is open
  useEffect(() => {
    if (!previewDoc) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closePreview();
    };
    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [previewDoc]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin" aria-hidden="true" />
        <span className="sr-only">Loading your documents…</span>
      </div>
    );
  }

  const isPdf = previewDoc?.mime_type === 'application/pdf';
  const previewLabel = previewDoc
    ? LABELS.get(previewDoc.document_type as any) || previewDoc.document_type
    : '';

  return (
    <div className="px-6 sm:px-8 py-4 sm:py-6">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">My Documents</h2>

      {documents.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500 shadow-sm">
          No documents found.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {documents.map((doc) => {
            const label = LABELS.get(doc.document_type as any) || doc.document_type;
            const docIsPdf = doc.mime_type === 'application/pdf';
            return (
              <div
                key={doc.id}
                className="group relative bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-4 flex flex-col items-center text-center"
              >
                {/* Icon-only preview trigger, Drive-style, top-right of the file card */}
                <button
                  onClick={() => openPreview(doc)}
                  aria-label={`Preview ${label}`}
                  className="absolute top-2 right-2 w-9 h-9 flex items-center justify-center rounded-full text-slate-500 bg-white/90 border border-slate-200 shadow-sm hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors"
                >
                  <Maximize2 className="w-4 h-4" aria-hidden="true" />
                </button>

                <button
                  onClick={() => openPreview(doc)}
                  className="w-16 h-16 rounded-xl bg-slate-50 flex items-center justify-center mb-3 mt-2"
                  aria-label={`Preview ${label}`}
                >
                  {docIsPdf ? (
                    <FileText className="w-7 h-7 text-red-500" aria-hidden="true" />
                  ) : (
                    <ImageIcon className="w-7 h-7 text-blue-500" aria-hidden="true" />
                  )}
                </button>

                <p className="text-sm font-semibold text-slate-800 line-clamp-2 min-h-[2.5rem]">
                  {label}
                </p>

                <span
                  className={`mt-2 px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap ${statusStyles(
                    doc.status
                  )}`}
                >
                  {statusLabel(doc.status)}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Preview modal — stacks on top of the current view with a blurred backdrop, no navigation away */}
      {previewDoc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={previewLabel}
          onClick={closePreview}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-3xl sm:max-w-4xl lg:max-w-6xl h-[85vh] min-h-[420px] max-h-[90vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-100">
              <h2 className="text-base sm:text-lg font-bold text-slate-800 truncate">
                {previewLabel}
              </h2>
              <button
                onClick={closePreview}
                aria-label="Close preview"
                className="w-9 h-9 shrink-0 flex items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <div className="flex-1 overflow-auto bg-slate-50">
              {previewLoading ? (
                <div className="flex items-center justify-center h-[60vh] text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin" aria-hidden="true" />
                </div>
              ) : !previewUrl ? (
                <div className="flex items-center justify-center h-[60vh] text-slate-400 text-sm px-4 text-center">
                  No preview available for this document.
                </div>
              ) : isPdf ? (
                <iframe src={previewUrl} title={previewLabel} className="w-full h-full block" />
              ) : (
                <img src={previewUrl} alt={previewLabel} className="w-full h-auto block" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}