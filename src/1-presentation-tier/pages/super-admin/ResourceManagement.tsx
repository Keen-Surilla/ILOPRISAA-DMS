// src/1-presentation-tier/pages/super-admin/ResourceManagement.tsx
import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { UploadCloud, FileText, File, FileSpreadsheet, Pencil, Trash2, X, Loader2 } from 'lucide-react';
import {
  fetchResourceDocuments,
  uploadResourceDocuments,
  updateResourceDocument,
  deleteResourceDocument,
  type ResourceCategory,
  type ResourceDocumentWithUrl,
  type ResourceFileType,
} from '../../../3-data-tier/api/resourceDocumentApi';

function getFileIcon(type: ResourceFileType) {
  if (type === 'pdf') return <File className="w-4 h-4 text-rose-400" />;
  if (type === 'xlsx') return <FileSpreadsheet className="w-4 h-4 text-emerald-400" />;
  return <FileText className="w-4 h-4 text-blue-400" />;
}

const CATEGORY_LABEL: Record<ResourceCategory, string> = {
  guideline: 'Guideline',
  form: 'Form',
};

export function ResourceManagement() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editCategory, setEditCategory] = useState<ResourceCategory>('form');
  const [pendingDelete, setPendingDelete] = useState<ResourceDocumentWithUrl | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['resourceDocuments'],
    queryFn: fetchResourceDocuments,
    staleTime: 1000 * 60 * 5,
  });

  const uploadMutation = useMutation({
    mutationFn: (files: File[]) => uploadResourceDocuments(files),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resourceDocuments'] });
      setUploadError(null);
    },
    onError: (err: Error) => setUploadError(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: (vars: { id: string; label: string; category: ResourceCategory }) =>
      updateResourceDocument(vars.id, { label: vars.label, category: vars.category }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resourceDocuments'] });
      setEditingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (doc: ResourceDocumentWithUrl) => deleteResourceDocument(doc),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resourceDocuments'] });
      setPendingDelete(null);
    },
  });

  function handleFilesSelected(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setUploadError(null);
    uploadMutation.mutate(Array.from(fileList));
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function startEdit(doc: ResourceDocumentWithUrl) {
    setEditingId(doc.id);
    setEditLabel(doc.label);
    setEditCategory(doc.category);
  }

  return (
    <div className="flex flex-col gap-6 rounded-2xl border border-slate-800 bg-[#0b1220] p-6 sm:p-8 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-sora text-lg font-bold text-white">Resources & Templates</h3>
          <p className="mt-1 text-sm text-slate-400">
            Upload guidelines and blank forms in one go — the system sorts each file into
            Guidelines or Forms automatically, and coaches see the update immediately.
          </p>
        </div>
        <label className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm shadow-blue-600/20 transition-all hover:bg-blue-500 cursor-pointer active:scale-95 w-fit">
          {uploadMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
          {uploadMutation.isPending ? 'Uploading...' : 'Upload Files'}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.xlsx,.xls"
            className="hidden"
            disabled={uploadMutation.isPending}
            onChange={(e) => handleFilesSelected(e.target.files)}
          />
        </label>
      </div>

      {uploadError && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-xs text-rose-300">
          {uploadError}
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-slate-500">Loading resources...</p>
      ) : documents.length === 0 ? (
        <p className="text-sm text-slate-500">No files uploaded yet.</p>
      ) : (
        <div className="flex flex-col divide-y divide-slate-800 rounded-xl border border-slate-800 overflow-hidden">
          {documents.map((doc) => (
            <div key={doc.id} className="flex items-center gap-3 bg-slate-900/40 px-4 py-3">
              {getFileIcon(doc.file_type)}

              {editingId === doc.id ? (
                <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    value={editLabel}
                    onChange={(e) => setEditLabel(e.target.value)}
                    className="flex-1 rounded-lg bg-slate-950 border border-slate-700 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value as ResourceCategory)}
                    className="rounded-lg bg-slate-950 border border-slate-700 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="guideline">Guideline</option>
                    <option value="form">Form</option>
                  </select>
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateMutation.mutate({ id: doc.id, label: editLabel, category: editCategory })}
                      disabled={updateMutation.isPending || !editLabel.trim()}
                      className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-500 disabled:opacity-50"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-bold text-slate-300 hover:bg-slate-800"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white truncate">{doc.label}</p>
                    <p className="text-[11px] text-slate-500 truncate">{doc.file_name}</p>
                  </div>
                  <span
                    className={
                      doc.category === 'guideline'
                        ? 'text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-2.5 py-1'
                        : 'text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-full px-2.5 py-1'
                    }
                  >
                    {CATEGORY_LABEL[doc.category]}
                  </span>
                  <button onClick={() => startEdit(doc)} className="p-1.5 text-slate-400 hover:text-white transition-colors" title="Edit">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setPendingDelete(doc)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Delete confirmation */}
      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-[#0b1220] p-6 shadow-xl">
            <h4 className="text-sm font-bold text-white">Delete this file?</h4>
            <p className="mt-2 text-xs text-slate-400">
              "{pendingDelete.label}" will be removed for every coach immediately. This can't be undone.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setPendingDelete(null)}
                className="rounded-lg border border-slate-700 px-3.5 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate(pendingDelete)}
                disabled={deleteMutation.isPending}
                className="rounded-lg bg-rose-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-rose-500 disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}