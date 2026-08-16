// src/1-presentation-tier/pages/committee-views/PendingReviews.tsx
import { useState } from 'react';
import { CheckCircle2, XCircle, ExternalLink } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../../2-application-tier/stores/authStore';
import { getPendingDocuments, verifyDocument, rejectDocument, getSignedUrl } from '../../../3-data-tier/api/committeeApi';

function prettifyDocType(type: string): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function PendingReviews() {
  const { user } = useAuthStore();
  const reviewerId = user?.id || '';
  const queryClient = useQueryClient();
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectNotes, setRejectNotes] = useState('');

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['pendingDocuments'],
    queryFn: getPendingDocuments,
  });

  const verifyMutation = useMutation({
    mutationFn: (documentId: string) => verifyDocument(documentId, reviewerId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pendingDocuments'] }),
  });

  const rejectMutation = useMutation({
    mutationFn: () => rejectDocument(rejectingId as string, reviewerId, rejectNotes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingDocuments'] });
      setRejectingId(null);
      setRejectNotes('');
    },
  });

  const handleView = async (storagePath: string) => {
    const url = await getSignedUrl(storagePath);
    window.open(url, '_blank', 'noopener,noreferrer');
  };


  return (
    <div className="animate-in fade-in duration-300">
      <header className="mb-6">
        <h2 className="text-3xl font-bold tracking-tight text-slate-800">Pending Reviews</h2>
        <p className="text-slate-500 text-sm mt-1">{documents.length} documents awaiting verification</p>
      </header>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-slate-400">Loading…</div>
        ) : documents.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400">Nothing pending review.</div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {documents.map((doc) => (
              <li key={doc.id} className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-800">{doc.athlete_name}</p>
                    <p className="text-xs text-slate-500">{prettifyDocType(doc.document_type)} — Coach {doc.coach_name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{doc.original_filename}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => handleView(doc.storage_path)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                      <ExternalLink className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => verifyMutation.mutate(doc.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-green-700 bg-green-50 hover:bg-green-100 rounded-lg"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Verify
                    </button>
                    <button
                      onClick={() => setRejectingId(doc.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 rounded-lg"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Reject
                    </button>
                  </div>
                </div>

                {rejectingId === doc.id && (
                  <div className="mt-3 flex gap-2">
                    <input
                      value={rejectNotes}
                      onChange={(e) => setRejectNotes(e.target.value)}
                      placeholder="Reason for rejection…"
                      className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-600"
                    />
                    <button onClick={() => rejectMutation.mutate()} className="px-3 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg">
                      Confirm
                    </button>
                    <button onClick={() => setRejectingId(null)} className="px-3 py-1.5 text-xs font-bold text-slate-500">
                      Cancel
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}