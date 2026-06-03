import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Archive, Calendar, FileText, FolderOpen, LogOut, Upload, Download } from 'lucide-react';
import { useAuthStore } from '../../../2-application-tier/stores/authStore';
import { useDocuments } from '../../../2-application-tier/hooks/useDocuments';
import { useEvents } from '../../../2-application-tier/hooks/useEvents';
import { SecureFileUploadZone } from '../../components/SecureFileUploadZone';
import { EventCalendar } from '../../components/calendar/EventCalendar';
import { DocumentScanFill } from '../../components/scan/DocumentScanFill';
import type { Document, DocumentType } from '../../../3-data-tier/types/database.types';

export default function AthleteDashboard() {
  const navigate = useNavigate();
  const { user, signOut } = useAuthStore();
  const calendar = useEvents();
  const { 
    documents, 
    isLoading, 
    error, 
    loadDocuments, 
    submitUpload, 
    downloadDocument,
    clearError
  } = useDocuments();

  const [activeMenu, setActiveMenu] = useState<'dashboard' | 'upload' | 'archive' | 'calendar'>('dashboard');
  const loadCalendarMonth = useCallback(
    (y: number, m: number) => void calendar.loadMonth(y, m),
    [calendar.loadMonth],
  );
  const [isUploading, setIsUploading] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState<DocumentType>('psa_certificate');
  const [uploadNotes, setUploadNotes] = useState('');

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handleFileAccepted = async (file: File) => {
    if (!user) return;
    setIsUploading(true);
    const success = await submitUpload({
      athleteId: user.id,
      documentType: selectedDocType,
      file: file,
      notes: uploadNotes,
    });

    if (success) {
      setActiveMenu('dashboard');
      setUploadNotes('');
      setSelectedDocType('psa_certificate');
    }
    setIsUploading(false);
  };

  const handleDownload = async (storagePath: string) => {
    const url = await downloadDocument(storagePath);
    if (url) window.open(url, '_blank');
  };

  // UI Helpers
  const formatDocType = (type: string) => type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  // Filter logic for Archive (Mocking archive as anything older than a certain date or verified, 
  // but for now, we'll just show all documents in Dashboard and a placeholder for Archive)
  const activeDocuments = documents; 
  const archivedDocuments = documents.filter(doc => doc.status === 'verified'); // Example filter for archive

  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans text-slate-800">
      
      {/* =========================================
          SIDEBAR NAVIGATION
      ========================================= */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-2xl z-10">
        <div className="p-6">
          <h1 className="text-2xl font-bold tracking-wider text-blue-400">ILOPRISAA</h1>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest">Athlete Portal</p>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2">
          <MenuButton 
            active={activeMenu === 'dashboard'} 
            onClick={() => { setActiveMenu('dashboard'); clearError(); }}
            icon={<FolderOpen className="w-5 h-5" />} 
            label="My Documents" 
          />
          <MenuButton 
            active={activeMenu === 'upload'} 
            onClick={() => { setActiveMenu('upload'); clearError(); }}
            icon={<Upload className="w-5 h-5" />} 
            label="Upload Document" 
          />
          <MenuButton 
            active={activeMenu === 'archive'} 
            onClick={() => { setActiveMenu('archive'); clearError(); }}
            icon={<Archive className="w-5 h-5" />} 
            label="Archive" 
          />
          <MenuButton 
            active={activeMenu === 'calendar'} 
            onClick={() => { setActiveMenu('calendar'); clearError(); }}
            icon={<Calendar className="w-5 h-5" />} 
            label="Event Calendar" 
          />
        </nav>
        
        <div className="p-4 border-t border-slate-800 bg-slate-950/30">
          <div className="mb-4 px-2">
            <p className="text-sm font-medium text-white">{user?.full_name || 'Athlete'}</p>
            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
          </div>
          <button 
            type="button"
            onClick={async () => {
              await signOut();
              navigate('/login', { replace: true });
            }}
            className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="font-medium text-sm">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* =========================================
          MAIN CONTENT AREA
      ========================================= */}
      <main className="flex-1 overflow-y-auto p-8 lg:p-10 relative">
        
        {/* Global Error Banner */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl shadow-sm flex justify-between items-center animate-in fade-in">
            <div className="flex items-center gap-3">
              <span className="text-xl font-bold">!</span>
              <p className="text-sm font-medium">{error}</p>
            </div>
            <button onClick={clearError} className="text-red-500 hover:text-red-800 text-lg font-bold">&times;</button>
          </div>
        )}

        {/* ── VIEW: DASHBOARD (Active Documents) ── */}
        {activeMenu === 'dashboard' && (
          <div className="animate-in fade-in duration-300">
            <header className="mb-8 flex justify-between items-end">
              <div>
                <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Active Documents</h2>
                <p className="text-slate-500 mt-1">Manage your current submissions for the upcoming event.</p>
              </div>
              <button 
                onClick={() => setActiveMenu('upload')}
                className="bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 transition shadow-sm font-medium flex items-center gap-2"
              >
                <span>+</span> New Upload
              </button>
            </header>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => <div key={i} className="h-64 bg-slate-200 rounded-2xl animate-pulse" />)}
              </div>
            ) : activeDocuments.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
                <FolderOpen className="w-12 h-12 mx-auto text-slate-300" />
                <p className="text-slate-500 mt-4 font-medium">No active documents found.</p>
                <button onClick={() => setActiveMenu('upload')} className="mt-4 text-blue-600 font-medium hover:underline">
                  Upload your first document
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeDocuments.map(doc => (
                  <ClassroomCard 
                    key={doc.id} 
                    doc={doc} 
                    formatDocType={formatDocType} 
                    formatDate={formatDate}
                    onDownload={() => handleDownload(doc.storage_path)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── VIEW: ARCHIVE ── */}
        {activeMenu === 'archive' && (
          <div className="animate-in fade-in duration-300">
            <header className="mb-8">
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Document Archive</h2>
              <p className="text-slate-500 mt-1">Access your verified records from previous seasons.</p>
            </header>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-80 hover:opacity-100 transition-opacity">
              {archivedDocuments.length > 0 ? (
                archivedDocuments.map(doc => (
                  <ClassroomCard 
                    key={doc.id} 
                    doc={doc} 
                    formatDocType={formatDocType} 
                    formatDate={formatDate}
                    onDownload={() => handleDownload(doc.storage_path)}
                    isArchived={true}
                  />
                ))
              ) : (
                <div className="col-span-full text-center py-16 text-slate-400">
                  No archived documents available.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── VIEW: UPLOAD FORM ── */}
        {activeMenu === 'upload' && (
          <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
            <header className="mb-8">
              <button 
                onClick={() => setActiveMenu('dashboard')}
                className="text-slate-500 hover:text-slate-800 font-medium flex items-center gap-2 mb-4"
              >
                &larr; Back to Dashboard
              </button>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Submit Credential</h2>
              <p className="text-slate-500 mt-1">Upload or scan a new document for verification.</p>
            </header>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <DocumentScanFill
                    disabled={isUploading}
                    onFilled={({ documentType, notes }) => {
                      setSelectedDocType(documentType);
                      setUploadNotes(notes);
                    }}
                  />
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Requirement Type</label>
                    <select 
                      value={selectedDocType}
                      onChange={(e) => setSelectedDocType(e.target.value as DocumentType)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 block p-3.5 transition-all outline-none"
                    >
                      <option value="psa_certificate">PSA Birth Certificate</option>
                      <option value="school_id">Valid School ID</option>
                      <option value="medical_clearance">Medical Clearance</option>
                      <option value="parental_consent">Parental Consent</option>
                      <option value="physical_exam">Physical Examination</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Submission Notes</label>
                    <textarea 
                      value={uploadNotes}
                      onChange={(e) => setUploadNotes(e.target.value)}
                      placeholder="Add any additional context for the reviewer..."
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 block p-3.5 min-h-[140px] resize-none transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="flex flex-col h-full">
                  <label className="block text-sm font-bold text-slate-700 mb-2">File Upload</label>
                  <div className="flex-1 bg-slate-50 rounded-2xl border border-slate-100 p-2">
                    <SecureFileUploadZone 
                      label={`Drop ${selectedDocType.replace('_', ' ').toUpperCase()} Here`}
                      onFileAccepted={handleFileAccepted}
                      disabled={isUploading}
                    />
                  </div>
                  {isUploading && (
                    <div className="mt-4 flex flex-col items-center">
                      <div className="w-full bg-slate-200 rounded-full h-2 mb-2 overflow-hidden">
                        <div className="bg-blue-600 h-2 rounded-full animate-[pulse_1s_ease-in-out_infinite] w-full origin-left scale-x-100 transition-transform"></div>
                      </div>
                      <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">
                        Encrypting & Uploading...
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeMenu === 'calendar' && (
          <div className="animate-in fade-in duration-300 max-w-5xl">
            <header className="mb-8">
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Event Calendar</h2>
              <p className="text-slate-500 mt-1">Games, document deadlines, waivers, and forms.</p>
            </header>
            <EventCalendar
              events={calendar.events}
              isLoading={calendar.isLoading}
              onMonthChange={loadCalendarMonth}
            />
          </div>
        )}

      </main>
    </div>
  );
}

/* =========================================
   SUB-COMPONENTS
========================================= */

// Sidebar Menu Button
function MenuButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: ReactNode; label: string }) {
  return (
    <button 
      type="button"
      onClick={onClick}
      className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all duration-200 flex items-center gap-3 ${
        active 
          ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20' 
          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

// Google Classroom Style Card
function ClassroomCard({
  doc,
  formatDocType,
  formatDate,
  onDownload,
  isArchived = false,
}: {
  doc: Document;
  formatDocType: (t: string) => string;
  formatDate: (d: string) => string;
  onDownload: () => void;
  isArchived?: boolean;
}) {
  // Determine header color based on status
  const headerStyles = {
    verified: "bg-gradient-to-r from-emerald-500 to-emerald-600",
    pending_review: "bg-gradient-to-r from-amber-500 to-amber-600",
    action_required: "bg-gradient-to-r from-red-500 to-red-600",
    draft: "bg-gradient-to-r from-slate-500 to-slate-600"
  }[doc.status as string] || "bg-slate-600";

  const statusLabel = {
    verified: "Approved",
    pending_review: "Pending",
    action_required: "Rejected",
    draft: "Draft"
  }[doc.status as string] || doc.status;

  return (
    <div className={`flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow duration-300 ${isArchived ? 'grayscale-[30%]' : ''}`}>
      
      {/* Card Header (Colored) */}
      <div className={`h-28 p-5 text-white flex flex-col justify-between relative overflow-hidden ${headerStyles}`}>
        {/* Subtle background pattern for texture */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
        
        <div className="relative z-10 flex justify-between items-start">
          <h3 className="font-bold text-lg leading-tight truncate pr-4 drop-shadow-sm">
            {formatDocType(doc.document_type)}
          </h3>
          <span className="px-2.5 py-1 bg-white/20 backdrop-blur-sm rounded-lg text-xs font-bold tracking-wide uppercase border border-white/30 shadow-sm">
            {statusLabel}
          </span>
        </div>
        <p className="relative z-10 text-sm font-medium opacity-90 truncate">
          {formatDate(doc.created_at)}
        </p>
      </div>

      {/* Card Body (White) */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 bg-slate-100 rounded-lg text-slate-500 shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-800 truncate" title={doc.original_filename}>
              {doc.original_filename}
            </p>
            <p className="text-xs text-slate-500 mt-0.5 uppercase tracking-wide font-medium">
              {(doc.file_size_bytes / 1024).toFixed(0)} KB • {doc.mime_type.split('/')[1]}
            </p>
          </div>
        </div>

        {/* Action Footer */}
        <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
          <button 
            onClick={onDownload}
            className="px-4 py-2 text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" /> Download
          </button>
        </div>
      </div>
    </div>
  );
}