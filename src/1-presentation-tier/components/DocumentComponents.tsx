/**
 * TIER 1 — PRESENTATION TIER: Document UI Components
 */

import React from 'react';
import type { Document, DocumentStatus } from '../../3-data-tier/types/database.types';
import { STATUS_LABELS, STATUS_COLORS, getValidNextStates } from '../../2-application-tier/state-machines/documentStateMachine';
import type { UserRole } from '../../3-data-tier/types/database.types';

function sanitizeForDisplay(raw: string | null | undefined, maxLength = 500): string {
  if (!raw) return '';
  return raw
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .slice(0, maxLength)
    .trim();
}

interface DocumentStatusBadgeProps {
  status: DocumentStatus;
  size?: 'sm' | 'md';
}

const STATUS_STYLE_MAP: Record<string, string> = {
  gray: 'bg-gray-100 text-gray-700 border border-gray-200',
  amber: 'bg-amber-100 text-amber-800 border border-amber-200',
  green: 'bg-green-100 text-green-800 border border-green-200',
  red: 'bg-red-100 text-red-700 border border-red-200',
};

export const DocumentStatusBadge: React.FC<DocumentStatusBadgeProps> = ({ status, size = 'md' }) => {
  const colorKey = STATUS_COLORS[status] ?? 'gray';
  const styles = STATUS_STYLE_MAP[colorKey];
  const label = STATUS_LABELS[status] ?? status;

  return (
    <span
      className={['inline-flex items-center font-medium rounded-full', size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm', styles].join(' ')}
      aria-label={`Document status: ${label}`}
    >
      {label}
    </span>
  );
};

interface DocumentCardProps {
  document: Document;
  actorRole: UserRole;
  onDownload?: (storagePath: string) => void;
  onStatusChange?: (documentId: string, newStatus: DocumentStatus) => void;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({ document, actorRole, onDownload, onStatusChange }) => {
  const validNextStates = getValidNextStates(document.status, actorRole);
  const safeFilename = sanitizeForDisplay(document.original_filename, 120);
  const safeNotes = sanitizeForDisplay(document.notes, 500);
  const safeDocType = sanitizeForDisplay(document.document_type.replace(/_/g, ' '), 60);

  const formattedDate = new Date(document.created_at).toLocaleDateString('en-PH', {
    year: 'numeric', month: 'short', day: 'numeric',
  });

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 capitalize truncate">{safeDocType}</p>
          <p className="text-xs text-gray-400 mt-0.5 truncate">{safeFilename}</p>
        </div>
        <DocumentStatusBadge status={document.status} size="sm" />
      </div>

      {safeNotes && (
        <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-2 border border-gray-100 line-clamp-3">
          {safeNotes}
        </p>
      )}

      <div className="flex items-center gap-4 text-xs text-gray-400">
        <span>{formattedDate}</span>
        <span>{(document.file_size_bytes / 1024).toFixed(0)} KB</span>
        <span className="uppercase">{document.mime_type.split('/')[1]}</span>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {onDownload && (
          <button type="button" onClick={() => onDownload(document.storage_path)} className="text-xs text-blue-600 hover:text-blue-800 font-medium py-1 px-2 rounded-md hover:bg-blue-50 transition-colors">
            Download
          </button>
        )}
        {onStatusChange && validNextStates.map((nextState) => (
          <button
            key={nextState}
            type="button"
            onClick={() => onStatusChange(document.id, nextState)}
            className={[
              'text-xs font-medium py-1 px-2 rounded-md transition-colors',
              nextState === 'verified' ? 'text-green-700 hover:bg-green-50 hover:text-green-800' : nextState === 'action_required' ? 'text-red-600 hover:bg-red-50 hover:text-red-700' : 'text-amber-700 hover:bg-amber-50 hover:text-amber-800',
            ].join(' ')}
          >
            {STATUS_LABELS[nextState]}
          </button>
        ))}
      </div>
    </div>
  );
};

interface DocumentListProps {
  documents: Document[];
  actorRole: UserRole;
  isLoading: boolean;
  onDownload?: (storagePath: string) => void;
  onStatusChange?: (documentId: string, newStatus: DocumentStatus) => void;
}

export const DocumentList: React.FC<DocumentListProps> = ({ documents, actorRole, isLoading, onDownload, onStatusChange }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => <div key={i} className="bg-gray-100 rounded-xl h-40 animate-pulse" />)}
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-4xl mb-3" aria-hidden>📂</p>
        <p className="text-sm">No documents found.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" role="list">
      {documents.map(doc => (
        <div key={doc.id} role="listitem">
          <DocumentCard document={doc} actorRole={actorRole} onDownload={onDownload} onStatusChange={onStatusChange} />
        </div>
      ))}
    </div>
  );
};
