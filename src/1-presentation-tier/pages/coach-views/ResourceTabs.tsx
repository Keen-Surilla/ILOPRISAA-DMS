import { useState } from 'react';
import { Folder, FileText, File, FileSpreadsheet, Download, ChevronRight, AlertTriangle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import {
  fetchResourceDocuments,
  type ResourceCategory,
  type ResourceDocumentWithUrl,
  type ResourceFileType,
} from '../../../3-data-tier/api/resourceDocumentApi';
import { CardSkeleton } from '../../components/ui/SkeletonLoading';

const FOLDERS: { id: ResourceCategory; name: string }[] = [
  { id: 'guideline', name: 'Official Guidelines' },
  { id: 'form', name: 'PRISAA Forms' },
];

function formatFileSize(bytes: number | null): string {
  if (!bytes) return '';
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
}

function getFileIcon(type: ResourceFileType) {
  if (type === 'pdf') return <File className="text-red-500 w-5 h-5" />;
  if (type === 'xlsx') return <FileSpreadsheet className="text-emerald-600 dark:text-emerald-500 w-5 h-5" />;
  return <FileText className="text-blue-500 dark:text-blue-400 w-5 h-5" />;
}

async function downloadFile(url: string, filename: string) {
  const response = await fetch(url);
  const blob = await response.blob();
  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(blobUrl);
}

export default function ResourceTabs() {
  const [currentFolder, setCurrentFolder] = useState<ResourceCategory | 'root'>('root');

  const { data: documents = [], isLoading, isError } = useQuery({
    queryKey: ['resourceDocuments'],
    queryFn: fetchResourceDocuments,
    staleTime: 1000 * 60 * 5,
  });

  const activeFolder = FOLDERS.find((f) => f.id === currentFolder);
  const filesInFolder = activeFolder ? documents.filter((d) => d.category === activeFolder.id) : [];
  const countFor = (id: ResourceCategory) => documents.filter((d) => d.category === id).length;

  return (
    <div className="animate-in fade-in duration-300">
      <header className="mb-6">
        <h2 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100">Resources & Templates</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Download blank forms and guidelines provided by the committee.
        </p>
      </header>

      {/* Breadcrumbs */}
      <div className="flex items-center gap-1.5 text-sm mb-4 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setCurrentFolder('root')}
          className={`font-medium transition-colors ${currentFolder === 'root' ? 'text-slate-800 dark:text-slate-200' : 'text-blue-600 dark:text-blue-400 hover:underline'}`}
        >
          Home
        </button>
        {activeFolder && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            <span className="font-medium text-slate-800 dark:text-slate-200">{activeFolder.name}</span>
          </>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <CardSkeleton count={4} />
        </div>
      ) : isError ? (
        <div className="p-6 flex items-center gap-2 text-rose-600 dark:text-rose-400 text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          Could not load resources. Please refresh and try again.
        </div>
      ) : currentFolder === 'root' ? (
        // --- Folder grid view ---
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {FOLDERS.map((folder) => (
            <button
              key={folder.id}
              onClick={() => setCurrentFolder(folder.id)}
              className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left flex flex-col items-start gap-2 shadow-sm"
            >
              <Folder className="text-slate-500 dark:text-slate-400 fill-slate-200 dark:fill-slate-800 w-8 h-8" />
              <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{folder.name}</span>
              <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                {countFor(folder.id)} item{countFor(folder.id) === 1 ? '' : 's'}
              </span>
            </button>
          ))}
        </div>
      ) : (
        // --- File grid view (inside a folder) ---
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {filesInFolder.length === 0 ? (
            <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
               <FileText className="w-8 h-8 opacity-20 mb-3" />
               <p className="text-sm">Nothing uploaded here yet.</p>
            </div>
          ) : (
            filesInFolder.map((doc) => <ResourceCard key={doc.id} doc={doc} />)
          )}
        </div>
      )}
    </div>
  );
}

function ResourceCard({ doc }: { doc: ResourceDocumentWithUrl }) {
  return (
    <a
      href={doc.publicUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 transition-all relative group hover:border-blue-300 dark:hover:border-blue-500/50 hover:shadow-md cursor-pointer block"
    >
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-slate-100 dark:border-slate-800">
        {getFileIcon(doc.file_type)}
        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate flex-1">{doc.label}</p>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            downloadFile(doc.publicUrl, doc.file_name);
          }}
          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 dark:hover:text-blue-400 transition-all shrink-0"
          title="Download"
        >
          <Download className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="h-32 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col items-center justify-center gap-1.5">
        <div className="scale-75 opacity-70 transition-transform group-hover:scale-90 duration-300">
          {getFileIcon(doc.file_type)}
        </div>
        {doc.size_bytes ? <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">{formatFileSize(doc.size_bytes)}</span> : null}
      </div>
    </a>
  );
}