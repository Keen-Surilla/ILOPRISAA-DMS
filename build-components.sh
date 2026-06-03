#!/usr/bin/env bash
set -euo pipefail

echo -e "\033[0;36m▸ Building ILOPRISAA Frontend Components & Logic...\033[0m"

# Ensure directories exist
mkdir -p src/1-presentation-tier/components
mkdir -p src/2-application-tier/stores
mkdir -p src/2-application-tier/hooks
mkdir -p src/2-application-tier/validators
mkdir -p src/2-application-tier/state-machines

# ---------------------------------------------------------
# 1. .env.example
# ---------------------------------------------------------
cat > ".env.example" << 'ILOPRISAA_EOF'
# ILOPRISAA DMS — Environment Variables
# Copy this file to .env and fill in your Supabase project values.
# NEVER commit .env to version control.
#
# Security Note:
# - VITE_ prefix exposes these to the browser bundle.
# - The anon key is safe to expose — access is enforced via RLS.
# - NEVER put the service_role key here. It bypasses RLS entirely.

VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# DO NOT ADD:
# VITE_SUPABASE_SERVICE_ROLE_KEY=...  ← This would be catastrophic
ILOPRISAA_EOF
echo -e "\033[0;32m  ✓ Created .env.example\033[0m"

# ---------------------------------------------------------
# 2. App.tsx
# ---------------------------------------------------------
cat > "src/App.tsx" << 'ILOPRISAA_EOF'
/**
 * Application Entry Point
 *
 * Wires the three tiers together:
 * - Tier 1 (Presentation): Route-guarded UI components
 * - Tier 2 (Application): Auth store initialization
 * - Tier 3 (Data): Supabase client (initialized via authStore)
 *
 * The SecureErrorBoundary wraps the entire app tree to ensure
 * no raw error information ever reaches the browser DOM.
 */

import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SecureErrorBoundary } from './1-presentation-tier/components/SecureErrorBoundary';
import { ProtectedRoute } from './1-presentation-tier/components/ProtectedRoute';
import { useAuthStore } from './2-application-tier/stores/authStore';

// Lazy-load dashboards to reduce initial bundle size
// (also prevents role-specific code from loading for wrong roles)
const AthleteDashboard = React.lazy(() =>
  import('./1-presentation-tier/pages/AthleteDashboard')
);
const CoachDashboard = React.lazy(() =>
  import('./1-presentation-tier/pages/CoachDashboard')
);
const AdminDashboard = React.lazy(() =>
  import('./1-presentation-tier/pages/AdminDashboard')
);
const LoginPage = React.lazy(() =>
  import('./1-presentation-tier/pages/LoginPage')
);

const AppLoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="w-10 h-10 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
      <p className="text-sm text-gray-500">Loading ILOPRISAA DMS…</p>
    </div>
  </div>
);

function AppRoutes() {
  const { initialize, isAuthenticated, role } = useAuthStore();

  useEffect(() => {
    // Initialize auth session on mount — bootstraps from persisted JWT
    initialize();
  }, [initialize]);

  return (
    <BrowserRouter>
      <React.Suspense fallback={<AppLoadingSpinner />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          {/* Athlete-only routes */}
          <Route
            path="/athlete/*"
            element={
              <ProtectedRoute allowedRoles={['athlete']}>
                <AthleteDashboard />
              </ProtectedRoute>
            }
          />

          {/* Coach-only routes */}
          <Route
            path="/coach/*"
            element={
              <ProtectedRoute allowedRoles={['coach']}>
                <CoachDashboard />
              </ProtectedRoute>
            }
          />

          {/* Admin-only routes */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Smart redirect after login based on role */}
          <Route
            path="/"
            element={
              isAuthenticated && role ? (
                <Navigate to={`/${role}`} replace />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          {/* 404 — no raw error info */}
          <Route
            path="*"
            element={
              <div className="min-h-screen flex items-center justify-center text-gray-500">
                <p className="text-sm">Page not found.</p>
              </div>
            }
          />
        </Routes>
      </React.Suspense>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <SecureErrorBoundary fallbackTitle="Application Error">
      <AppRoutes />
    </SecureErrorBoundary>
  );
}
ILOPRISAA_EOF
echo -e "\033[0;32m  ✓ Created src/App.tsx\033[0m"

# ---------------------------------------------------------
# 3. ProtectedRoute.tsx
# ---------------------------------------------------------
cat > "src/1-presentation-tier/components/ProtectedRoute.tsx" << 'ILOPRISAA_EOF'
/**
 * TIER 1 — PRESENTATION TIER: Protected Route Guard
 *
 * SECURITY RATIONALE:
 * This component provides UI-level access control. It is NOT the security
 * boundary — the real enforcement is in Supabase RLS and the Application Tier.
 * Its purpose is to prevent authorized users from seeing UI that's meaningless
 * to their role, and to catch accidental misrouting.
 *
 * IMPORTANT: Never remove server-side checks because this guard exists.
 * Client-side routing can be bypassed by any user with browser dev tools.
 *
 * Mitigates: OWASP A01 (Broken Access Control — defense-in-depth layer)
 */

import React, { type ReactNode } from 'react';
import { useAuthStore } from '../../2-application-tier/stores/authStore';
import type { UserRole } from '../../3-data-tier/types/database.types';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles: UserRole[];
  /** Redirect path when unauthorized (defaults to login) */
  fallback?: ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  fallback,
}) => {
  const { isAuthenticated, isLoading, role } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" aria-busy="true" aria-label="Loading...">
        <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !role || !allowedRoles.includes(role)) {
    return fallback ? (
      <>{fallback}</>
    ) : (
      <div
        role="alert"
        className="min-h-screen flex flex-col items-center justify-center gap-4 text-center p-8"
      >
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-3xl" aria-hidden="true">
          🔒
        </div>
        <h1 className="text-lg font-semibold text-gray-800">Access Denied</h1>
        <p className="text-sm text-gray-500 max-w-xs">
          You do not have permission to view this page.
        </p>
        <a
          href="/login"
          className="text-sm text-blue-600 font-medium hover:underline"
        >
          Return to login
        </a>
      </div>
    );
  }

  return <>{children}</>;
};

export const RoleGate: React.FC<{
  children: ReactNode;
  allowedRoles: UserRole[];
}> = ({ children, allowedRoles }) => {
  const role = useAuthStore(s => s.role);

  if (!role || !allowedRoles.includes(role)) return null;
  return <>{children}</>;
};
ILOPRISAA_EOF
echo -e "\033[0;32m  ✓ Created src/1-presentation-tier/components/ProtectedRoute.tsx\033[0m"

# ---------------------------------------------------------
# 4. SecureErrorBoundary.tsx
# ---------------------------------------------------------
cat > "src/1-presentation-tier/components/SecureErrorBoundary.tsx" << 'ILOPRISAA_EOF'
/**
 * TIER 1 — PRESENTATION TIER: Secure Error Boundary
 *
 * SECURITY RATIONALE:
 * React's default error behavior renders the raw JavaScript Error object,
 * which can expose stack traces, internal file paths, and database error
 * messages to the browser — a significant information disclosure risk.
 *
 * This boundary intercepts all unhandled errors and:
 * 1. Displays a safe, generic fallback UI to the user.
 * 2. Logs the full technical error to the console (dev only) or a
 * monitoring service (prod) — never to the rendered DOM.
 * 3. Sanitizes the error message to strip any paths or DB details.
 *
 * Mitigates: OWASP A09 (Security Logging and Monitoring Failures)
 * Mitigates: OWASP A05 (Security Misconfiguration — verbose error pages)
 */

import React, { Component, type ReactNode } from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  sanitizedMessage: string | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
}

export class SecureErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, sanitizedMessage: null };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return {
      hasError: true,
      sanitizedMessage: 'An unexpected error occurred. Please refresh the page.',
    };
  }

  componentDidCatch(error: Error): void {
    if (import.meta.env.DEV) {
      console.error('[ILOPRISAA ErrorBoundary]', error);
    } else {
      console.error('[ILOPRISAA] Unhandled error in render tree. Code:', error.name ?? 'UNKNOWN');
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, sanitizedMessage: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          aria-live="assertive"
          className="min-h-[200px] flex flex-col items-center justify-center gap-4 p-8 text-center rounded-xl border border-red-200 bg-red-50"
        >
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-2xl" aria-hidden="true">
            ⚠️
          </div>
          <div>
            <h2 className="text-base font-semibold text-red-800">
              {this.props.fallbackTitle ?? 'Something went wrong'}
            </h2>
            <p className="text-sm text-red-600 mt-1">
              {this.state.sanitizedMessage}
            </p>
          </div>
          <button
            type="button"
            onClick={this.handleReset}
            className="text-sm text-red-700 font-medium py-1.5 px-4 rounded-lg border border-red-300 hover:bg-red-100 transition-colors"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
ILOPRISAA_EOF
echo -e "\033[0;32m  ✓ Created src/1-presentation-tier/components/SecureErrorBoundary.tsx\033[0m"

# ---------------------------------------------------------
# 5. DocumentComponents.tsx
# ---------------------------------------------------------
cat > "src/1-presentation-tier/components/DocumentComponents.tsx" << 'ILOPRISAA_EOF'
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
ILOPRISAA_EOF
echo -e "\033[0;32m  ✓ Created src/1-presentation-tier/components/DocumentComponents.tsx\033[0m"

# ---------------------------------------------------------
# 6. SecureFileUploadZone.tsx
# ---------------------------------------------------------
cat > "src/1-presentation-tier/components/SecureFileUploadZone.tsx" << 'ILOPRISAA_EOF'
/**
 * TIER 1 — PRESENTATION TIER: SecureFileUploadZone
 */

import React, { useCallback, useRef, useState } from 'react';

const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'] as const;
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_LABELS = '.pdf, .jpg, .png';

type AllowedType = typeof ALLOWED_TYPES[number];

function isAllowedType(t: string): t is AllowedType {
  return ALLOWED_TYPES.includes(t as AllowedType);
}

interface SecureFileUploadZoneProps {
  onFileAccepted: (file: File) => void;
  disabled?: boolean;
  label?: string;
}

export const SecureFileUploadZone: React.FC<SecureFileUploadZoneProps> = ({ onFileAccepted, disabled = false, label = 'Upload Document' }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const validateAndAccept = useCallback((file: File): void => {
    setValidationError(null);
    if (!isAllowedType(file.type)) {
      setValidationError(`Invalid file type "${file.type}". Accepted: ${ALLOWED_LABELS}`);
      return;
    }
    if (file.size > MAX_BYTES) {
      setValidationError(`File is ${(file.size / 1024 / 1024).toFixed(1)} MB. Maximum allowed is 5 MB.`);
      return;
    }
    if (file.size === 0) {
      setValidationError('File is empty.');
      return;
    }
    setSelectedFile(file);
    onFileAccepted(file);
  }, [onFileAccepted]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) validateAndAccept(file);
    e.target.value = '';
  }, [validateAndAccept]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) validateAndAccept(file);
  }, [validateAndAccept]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled) setDragOver(true);
  }, [disabled]);

  const handleDragLeave = useCallback(() => setDragOver(false), []);

  return (
    <div className="w-full">
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !disabled && inputRef.current?.click()}
        className={['relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 cursor-pointer transition-all duration-150', disabled ? 'opacity-50 cursor-not-allowed border-gray-200' : dragOver ? 'border-blue-500 bg-blue-50' : validationError ? 'border-red-400 bg-red-50' : selectedFile ? 'border-green-400 bg-green-50' : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'].join(' ')}
      >
        <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="sr-only" tabIndex={-1} disabled={disabled} onChange={handleChange} />
        <div className={['w-12 h-12 rounded-full flex items-center justify-center text-2xl', validationError ? 'bg-red-100' : selectedFile ? 'bg-green-100' : 'bg-white shadow-sm'].join(' ')}>
          {validationError ? '⚠️' : selectedFile ? '✅' : '📄'}
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-gray-700">{selectedFile ? 'File ready' : dragOver ? 'Drop to upload' : label}</p>
          {selectedFile && <p className="text-xs text-gray-500 mt-1 truncate max-w-xs">{selectedFile.name}</p>}
          {!selectedFile && <p className="text-xs text-gray-400 mt-1">Drag & drop or click · {ALLOWED_LABELS} · Max 5 MB</p>}
        </div>
      </div>
      {validationError && <p className="mt-2 text-xs text-red-600 flex items-center gap-1"><span aria-hidden>⚠</span>{validationError}</p>}
    </div>
  );
};
ILOPRISAA_EOF
echo -e "\033[0;32m  ✓ Created src/1-presentation-tier/components/SecureFileUploadZone.tsx\033[0m"

# ---------------------------------------------------------
# 7. authStore.ts
# ---------------------------------------------------------
cat > "src/2-application-tier/stores/authStore.ts" << 'ILOPRISAA_EOF'
/**
 * TIER 2 — APPLICATION TIER: Auth Store (Zustand)
 */

import { create } from 'zustand';
import { supabase } from '../../3-data-tier/config/SupabaseClient';
import type { Profile, UserRole } from '../../3-data-tier/types/database.types';

interface AuthState {
  user: Profile | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  role: null,
  isAuthenticated: false,
  isLoading: true,

  initialize: async () => {
    set({ isLoading: true });
    const { data: { session } } = await supabase.auth.getSession();

    if (session?.user) {
      const profile = await fetchProfile(session.user.id);
      set({ user: profile, role: profile?.role ?? null, isAuthenticated: true });
    } else {
      set({ user: null, role: null, isAuthenticated: false });
    }

    set({ isLoading: false });

    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        set({ user: null, role: null, isAuthenticated: false });
        return;
      }
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        const profile = await fetchProfile(session.user.id);
        set({ user: profile, role: profile?.role ?? null, isAuthenticated: !!profile });
      }
    });
  },

  signIn: async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: 'Invalid email or password.' };
    return { error: null };
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, role: null, isAuthenticated: false });
  },
}));

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
  if (error || !data) return null;
  return data;
}
ILOPRISAA_EOF
echo -e "\033[0;32m  ✓ Created src/2-application-tier/stores/authStore.ts\033[0m"

# ---------------------------------------------------------
# 8. useDocuments.ts
# ---------------------------------------------------------
cat > "src/2-application-tier/hooks/useDocuments.ts" << 'ILOPRISAA_EOF'
/**
 * TIER 2 — APPLICATION TIER: useDocuments Hook
 */

import { useState, useCallback } from 'react';
import { uploadDocument, getMyDocuments, updateDocumentStatus, getSignedDownloadUrl, type UploadDocumentPayload } from '../../3-data-tier/services/documentService';
import { validateUploadPayload, validateStatusUpdatePayload, type UploadPayloadInput, type StatusUpdateInput } from '../validators/payloadValidators';
import { evaluateTransition, type TransitionContext } from '../state-machines/documentStateMachine';
import type { Document, DocumentStatus, UserRole } from '../../3-data-tier/types/database.types';

export interface UseDocumentsReturn {
  documents: Document[];
  isLoading: boolean;
  error: string | null;
  loadDocuments: () => Promise<void>;
  submitUpload: (payload: UploadPayloadInput) => Promise<boolean>;
  reviewDocument: (payload: StatusUpdateInput, transitionContext: TransitionContext) => Promise<boolean>;
  downloadDocument: (storagePath: string) => Promise<string | null>;
  clearError: () => void;
}

export function useDocuments(): UseDocumentsReturn {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const loadDocuments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const docs = await getMyDocuments();
      setDocuments(docs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load documents.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const submitUpload = useCallback(async (rawPayload: UploadPayloadInput): Promise<boolean> => {
    const validation = validateUploadPayload(rawPayload);
    if (!validation.valid || !validation.sanitized) {
      setError(validation.errors.join(' '));
      return false;
    }

    setIsLoading(true);
    setError(null);
    try {
      const uploadPayload: UploadDocumentPayload = {
        athleteId: validation.sanitized.athleteId,
        documentType: validation.sanitized.documentType,
        file: validation.sanitized.file,
        notes: validation.sanitized.notes,
      };
      const { document } = await uploadDocument(uploadPayload);
      setDocuments(prev => [document, ...prev]);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reviewDocument = useCallback(async (rawPayload: StatusUpdateInput, transitionContext: TransitionContext): Promise<boolean> => {
    const validation = validateStatusUpdatePayload(rawPayload);
    if (!validation.valid || !validation.sanitized) {
      setError(validation.errors.join(' '));
      return false;
    }

    const existingDoc = documents.find(d => d.id === validation.sanitized!.documentId);
    if (!existingDoc) {
      setError('Document not found.');
      return false;
    }

    const transition = evaluateTransition(existingDoc.status, validation.sanitized.newStatus, transitionContext);
    if (!transition.allowed) {
      setError(`Cannot update document: ${transition.errors.join('; ')}`);
      return false;
    }

    setIsLoading(true);
    setError(null);
    try {
      const updated = await updateDocumentStatus(validation.sanitized.documentId, validation.sanitized.newStatus, validation.sanitized.reviewerId, validation.sanitized.notes);
      setDocuments(prev => prev.map(d => (d.id === updated.id ? updated : d)));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Review failed.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [documents]);

  const downloadDocument = useCallback(async (storagePath: string): Promise<string | null> => {
    try {
      return await getSignedDownloadUrl(storagePath);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not generate download link.');
      return null;
    }
  }, []);

  return { documents, isLoading, error, loadDocuments, submitUpload, reviewDocument, downloadDocument, clearError };
}

export function canUploadDocuments(role: UserRole): boolean { return role === 'athlete'; }
export function canReviewDocuments(role: UserRole): boolean { return role === 'coach' || role === 'admin'; }
export function canAccessAdminPanel(role: UserRole): boolean { return role === 'admin'; }
ILOPRISAA_EOF
echo -e "\033[0;32m  ✓ Created src/2-application-tier/hooks/useDocuments.ts\033[0m"

# ---------------------------------------------------------
# 9. payloadValidators.ts
# ---------------------------------------------------------
cat > "src/2-application-tier/validators/payloadValidators.ts" << 'ILOPRISAA_EOF'
/**
 * TIER 2 — APPLICATION TIER: Input Validators
 */

import type { DocumentType, DocumentStatus } from '../../3-data-tier/types/database.types';
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES, type AllowedMimeType } from '../../3-data-tier/services/documentService';

export interface ValidationResult<T = unknown> { valid: boolean; errors: string[]; sanitized: T | null; }
function ok<T>(sanitized: T): ValidationResult<T> { return { valid: true, errors: [], sanitized }; }
function fail<T>(errors: string[]): ValidationResult<T> { return { valid: false, errors, sanitized: null }; }

const VALID_DOCUMENT_TYPES = new Set<DocumentType>(['psa_certificate', 'medical_clearance', 'birth_certificate', 'school_id', 'parental_consent', 'physical_exam']);
const VALID_STATUSES = new Set<DocumentStatus>(['draft', 'pending_review', 'verified', 'action_required']);

export function sanitizeText(input: unknown, maxLength = 2000): string {
  if (typeof input !== 'string') return '';
  return input.slice(0, maxLength).replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;').replace(/\//g, '&#x2F;').replace(/\0/g, '').trim();
}

export function isValidUUID(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export interface UploadPayloadInput { athleteId: unknown; documentType: unknown; file: unknown; notes?: unknown; }
export interface ValidatedUploadPayload { athleteId: string; documentType: DocumentType; file: File; notes: string | undefined; }

export function validateUploadPayload(input: UploadPayloadInput): ValidationResult<ValidatedUploadPayload> {
  const errors: string[] = [];
  if (!isValidUUID(input.athleteId)) errors.push('Invalid athlete ID format.');
  if (!VALID_DOCUMENT_TYPES.has(input.documentType as DocumentType)) errors.push('Invalid document type.');
  if (!(input.file instanceof File)) {
    errors.push('No file provided.');
  } else {
    if (!ALLOWED_MIME_TYPES.includes(input.file.type as AllowedMimeType)) errors.push('File type not allowed. Accepted: PDF, JPG, PNG.');
    if (input.file.size > MAX_FILE_SIZE_BYTES) errors.push('File exceeds 5 MB size limit.');
    if (input.file.size === 0) errors.push('File is empty.');
  }
  if (errors.length > 0) return fail(errors);
  return ok({
    athleteId: input.athleteId as string,
    documentType: input.documentType as DocumentType,
    file: input.file as File,
    notes: input.notes !== undefined ? sanitizeText(input.notes, 500) : undefined,
  });
}

export interface StatusUpdateInput { documentId: unknown; newStatus: unknown; reviewerId: unknown; notes?: unknown; }
export interface ValidatedStatusUpdate { documentId: string; newStatus: DocumentStatus; reviewerId: string; notes: string | undefined; }

export function validateStatusUpdatePayload(input: StatusUpdateInput): ValidationResult<ValidatedStatusUpdate> {
  const errors: string[] = [];
  if (!isValidUUID(input.documentId)) errors.push('Invalid document ID format.');
  if (!VALID_STATUSES.has(input.newStatus as DocumentStatus)) errors.push('Invalid status value.');
  if (!isValidUUID(input.reviewerId)) errors.push('Invalid reviewer ID format.');
  if (errors.length > 0) return fail(errors);
  return ok({
    documentId: input.documentId as string,
    newStatus: input.newStatus as DocumentStatus,
    reviewerId: input.reviewerId as string,
    notes: input.notes !== undefined ? sanitizeText(input.notes, 500) : undefined,
  });
}
ILOPRISAA_EOF
echo -e "\033[0;32m  ✓ Created src/2-application-tier/validators/payloadValidators.ts\033[0m"

# ---------------------------------------------------------
# 10. documentStateMachine.ts
# ---------------------------------------------------------
cat > "src/2-application-tier/state-machines/documentStateMachine.ts" << 'ILOPRISAA_EOF'
/**
 * TIER 2 — APPLICATION TIER: Document State Machine
 */

import type { DocumentStatus, UserRole } from '../../3-data-tier/types/database.types';

export interface TransitionGuard { requiredRole: UserRole | UserRole[]; conditions: TransitionCondition[]; }
export interface TransitionCondition { name: string; description: string; validate: (context: TransitionContext) => boolean; }
export interface TransitionContext { digitalSignature: string | null; reviewerId: string | null; hasRequiredMetadata: boolean; actorRole: UserRole; }
export interface TransitionResult { allowed: boolean; errors: string[]; nextStatus: DocumentStatus | null; }

const TRANSITION_GUARDS: Map<string, TransitionGuard> = new Map([
  ['draft→pending_review', { requiredRole: 'athlete', conditions: [{ name: 'has_file', description: 'Document must have a file hash', validate: (ctx) => typeof ctx.digitalSignature === 'string' && ctx.digitalSignature.length === 64 }, { name: 'has_metadata', description: 'Required metadata must be present', validate: (ctx) => ctx.hasRequiredMetadata }] }],
  ['pending_review→verified', { requiredRole: ['coach', 'admin'], conditions: [{ name: 'has_reviewer', description: 'A reviewer must be assigned', validate: (ctx) => typeof ctx.reviewerId === 'string' && ctx.reviewerId.length > 0 }, { name: 'has_file_integrity', description: 'File digital signature must be present', validate: (ctx) => typeof ctx.digitalSignature === 'string' && ctx.digitalSignature.length === 64 }] }],
  ['pending_review→action_required', { requiredRole: ['coach', 'admin'], conditions: [{ name: 'has_reviewer', description: 'A reviewer must be assigned', validate: (ctx) => typeof ctx.reviewerId === 'string' && ctx.reviewerId.length > 0 }] }],
  ['action_required→pending_review', { requiredRole: 'athlete', conditions: [{ name: 'has_file', description: 'Document must have a file hash', validate: (ctx) => typeof ctx.digitalSignature === 'string' && ctx.digitalSignature.length === 64 }] }],
]);

export function evaluateTransition(fromStatus: DocumentStatus, toStatus: DocumentStatus, context: TransitionContext): TransitionResult {
  const guard = TRANSITION_GUARDS.get(`${fromStatus}→${toStatus}`);
  const errors: string[] = [];
  if (!guard) return { allowed: false, errors: [`Transition from '${fromStatus}' to '${toStatus}' is not permitted.`], nextStatus: null };
  const allowedRoles = Array.isArray(guard.requiredRole) ? guard.requiredRole : [guard.requiredRole];
  if (!allowedRoles.includes(context.actorRole)) errors.push(`Role '${context.actorRole}' cannot perform this transition.`);
  for (const condition of guard.conditions) if (!condition.validate(context)) errors.push(condition.description);
  return { allowed: errors.length === 0, errors, nextStatus: errors.length === 0 ? toStatus : null };
}

export function getValidNextStates(fromStatus: DocumentStatus, actorRole: UserRole): DocumentStatus[] {
  const validStates: DocumentStatus[] = [];
  for (const [key, guard] of TRANSITION_GUARDS.entries()) {
    const [from, to] = key.split('→') as [DocumentStatus, DocumentStatus];
    if (from !== fromStatus) continue;
    const allowedRoles = Array.isArray(guard.requiredRole) ? guard.requiredRole : [guard.requiredRole];
    if (allowedRoles.includes(actorRole)) validStates.push(to);
  }
  return validStates;
}

export const STATUS_LABELS: Record<DocumentStatus, string> = { draft: 'Draft', pending_review: 'Pending Review', verified: 'Verified', action_required: 'Action Required' };
export const STATUS_COLORS: Record<DocumentStatus, string> = { draft: 'gray', pending_review: 'amber', verified: 'green', action_required: 'red' };
ILOPRISAA_EOF
echo -e "\033[0;32m  ✓ Created src/2-application-tier/state-machines/documentStateMachine.ts\033[0m"

echo -e "\033[0;36m▸ All files generated successfully!\033[0m"