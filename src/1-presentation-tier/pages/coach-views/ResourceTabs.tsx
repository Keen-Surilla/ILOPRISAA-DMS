import { useState } from 'react';
import { Folder, FileText, File, FileSpreadsheet, Download, ChevronRight, AlertTriangle, X, MoreVertical } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../3-data-tier/config/SupabaseClient';
import { CardSkeleton

 } from '../../components/ui/SkeletonLoading';
const BUCKET = 'committee_templates';

interface FolderDef {
  id: string;
  name: string;
  files: { matchName: string; label: string; type: 'pdf' | 'doc' }[];
}

const FOLDER_STRUCTURE: FolderDef[] = [
  {
    id: 'guidelines',
    name: 'Official Guidelines',
    files: [
      { matchName: 'DRAFT of PRISAA RULE BOOK', label: 'ILOPRISAA Rulebook', type: 'pdf' },
    ],
  },
  {
    id: 'forms',
    name: 'PRISAA Forms',
    files: [
      { matchName: 'MEDICAL-CERT', label: 'Medical Certificate', type: 'doc' },
      { matchName: 'DATA', label: 'Data Privacy Consent', type: 'doc' },
      { matchName: 'PRISAA-FORM-05', label: 'Coach Profile (Blank)', type: 'doc' },
    ],
  },
];

interface TemplateFile {
  name: string;
  publicUrl: string;
  sizeLabel: string;
}

function formatFileSize(bytes: number | undefined): string {
  if (!bytes) return '';
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
}

async function fetchTemplates(): Promise<TemplateFile[]> {
  const { data, error } = await supabase.storage.from(BUCKET).list('', {
    sortBy: { column: 'name', order: 'asc' },
  });
  if (error) throw new Error('Could not load templates. Please try again.');

  const files = (data ?? []).filter((f) => f.id !== null);
  return files.map((f) => {
    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(f.name);
    return { name: f.name, publicUrl: urlData.publicUrl, sizeLabel: formatFileSize(f.metadata?.size) };
  });
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
  const [currentFolder, setCurrentFolder] = useState('root');

  const { data: templates = [], isLoading, isError } = useQuery({
    queryKey: ['committeeTemplates'],
    queryFn: fetchTemplates,
    staleTime: 1000 * 60 * 10,
  });

  const activeFolder = FOLDER_STRUCTURE.find((f) => f.id === currentFolder);
  // Add near the top of ResourceTabs.tsx
  const [previewFile, setPreviewFile] = useState<{ name: string; url: string; type: 'pdf' | 'doc' } | null>(null);

  function getFileIcon(type: 'pdf' | 'doc' | 'xlsx') {
  if (type === 'pdf') return <File className="text-red-500 w-5 h-5" />;
  if (type === 'xlsx') return <FileSpreadsheet className="text-green-600 w-5 h-5" />;
  return <FileText className="text-blue-500 w-5 h-5" />;
}

function getPreviewUrl(file: { publicUrl: string; type: 'pdf' | 'doc' }): string {
  if (file.type === 'pdf') return file.publicUrl; // browsers render PDFs natively
  return `https://docs.google.com/viewer?url=${encodeURIComponent(file.publicUrl)}&embedded=true`;
}


  const resolvedFiles = activeFolder
    ? activeFolder.files.map((def) => {
        const match = templates.find((t) => t.name.toLowerCase().includes(def.matchName.toLowerCase()));
        return { ...def, file: match ?? null };
      })
    : [];

  return (
    <div className="animate-in fade-in duration-300">
      <header className="mb-6">
        <h2 className="text-3xl font-bold tracking-tight text-slate-800">Resources & Templates</h2>
        <p className="text-slate-500 text-sm mt-1">
          Download blank forms and guidelines provided by the committee.
        </p>
      </header>

      {/* Breadcrumbs */}
      <div className="flex items-center gap-1.5 text-sm mb-4 border-b border-gray-200 pb-3">
        <button
          onClick={() => setCurrentFolder('root')}
          className={`font-medium ${currentFolder === 'root' ? 'text-slate-800' : 'text-blue-600 hover:underline'}`}
        >
          Home
        </button>
        {activeFolder && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-medium text-slate-800">{activeFolder.name}</span>
          </>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <CardSkeleton count={4} />
        </div>
      ) : isError ? (
        <div className="p-6 flex items-center gap-2 text-red-600 text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          Could not load templates. Please refresh and try again.
        </div>
      ) : currentFolder === 'root' ? (
        // --- Folder grid view ---
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {FOLDER_STRUCTURE.map((folder) => (
            <button
              key={folder.id}
              onClick={() => setCurrentFolder(folder.id)}
              className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors text-left flex flex-col items-start gap-2"
            >
              <Folder className="text-gray-600 fill-current w-6 h-6" />
              <span className="text-sm font-medium text-slate-800">{folder.name}</span>
              <span className="text-[11px] text-slate-400">{folder.files.length} item{folder.files.length === 1 ? '' : 's'}</span>
            </button>
          ))}
        </div>
     ) : (
  // --- File grid view (inside a folder), Google-Drive card style ---
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
    {resolvedFiles.map((item) => (
      <div
        key={item.matchName}
        onClick={() => item.file && setPreviewFile({ name: item.label, url: item.file.publicUrl, type: item.type })}
        className={`border border-gray-200 rounded-lg overflow-hidden transition-colors relative group ${
          item.file ? 'hover:border-blue-300 hover:shadow-sm cursor-pointer' : 'opacity-40 cursor-not-allowed'
        }`}
      >
        {/* Header strip with file icon + name */}
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-100">
          {getFileIcon(item.type)}
          <p className="text-xs font-medium text-slate-700 truncate flex-1">{item.label}</p>
          {item.file && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                downloadFile(item.file!.publicUrl, item.file!.name);
              }}
              className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-700 transition-opacity shrink-0"
              title="Download"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Preview thumbnail placeholder */}
        <div className="h-32 bg-slate-50 flex items-center justify-center">
          {item.file ? (
            <div className="scale-75 opacity-60">{getFileIcon(item.type)}</div>
          ) : (
            <p className="text-[10px] text-red-400 px-3 text-center">Not yet uploaded</p>
          )}
        </div>
      </div>
    ))}
  </div>
)}

                     
    </div>
  );
}