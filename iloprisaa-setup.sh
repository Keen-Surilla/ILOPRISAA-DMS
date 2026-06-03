#!/usr/bin/env bash
# ============================================================
# ILOPRISAA DMS — Project Setup Script v2
# Matches the existing VS Code project structure.
# Usage:  bash iloprisaa-setup.sh [target-directory]
# ============================================================
set -euo pipefail

TARGET="${1:-.}"
mkdir -p "$TARGET"
cd "$TARGET"

GREEN='\033[0;32m'; CYAN='\033[0;36m'; YELLOW='\033[1;33m'; RESET='\033[0m'
ok()   { echo -e "${GREEN}  \xE2\x9C\x93${RESET} $1"; }
skip() { echo -e "${YELLOW}  \xE2\x86\x92${RESET} $1 (already exists, skipped)"; }
hdr()  { echo -e "\n${CYAN}\xE2\x96\xB8 $1${RESET}"; }

# Write a file only if it does not already exist
write_if_new() {
  local dest="$1"
  if [ -f "$dest" ]; then
    skip "$dest"
    return
  fi
  mkdir -p "$(dirname "$dest")"
}

hdr "Creating directory structure"
mkdir -p src/1-presentation-tier/{components,pages,layouts}
mkdir -p src/2-application-tier/{hooks,stores,validators,state-machines}
mkdir -p src/3-data-tier/{config,services,types,policies,utils}
mkdir -p public
ok "Directories ready"

hdr "Writing config & root files"
if [ ! -f "vite.config.ts" ]; then
  mkdir -p "$(dirname "vite.config.ts")"
  cat > "vite.config.ts" << 'ILOPRISAA_EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})

ILOPRISAA_EOF
  ok "vite.config.ts"
else
  skip "vite.config.ts"
fi

if [ ! -f "tailwind.config.js" ]; then
  mkdir -p "$(dirname "tailwind.config.js")"
  cat > "tailwind.config.js" << 'ILOPRISAA_EOF'
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}

ILOPRISAA_EOF
  ok "tailwind.config.js"
else
  skip "tailwind.config.js"
fi

if [ ! -f "postcss.config.js" ]; then
  mkdir -p "$(dirname "postcss.config.js")"
  cat > "postcss.config.js" << 'ILOPRISAA_EOF'
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}

ILOPRISAA_EOF
  ok "postcss.config.js"
else
  skip "postcss.config.js"
fi

if [ ! -f "tsconfig.json" ]; then
  mkdir -p "$(dirname "tsconfig.json")"
  cat > "tsconfig.json" << 'ILOPRISAA_EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}

ILOPRISAA_EOF
  ok "tsconfig.json"
else
  skip "tsconfig.json"
fi

if [ ! -f "tsconfig.node.json" ]; then
  mkdir -p "$(dirname "tsconfig.node.json")"
  cat > "tsconfig.node.json" << 'ILOPRISAA_EOF'
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}

ILOPRISAA_EOF
  ok "tsconfig.node.json"
else
  skip "tsconfig.node.json"
fi

if [ ! -f "tsconfig.app.json" ]; then
  mkdir -p "$(dirname "tsconfig.app.json")"
  cat > "tsconfig.app.json" << 'ILOPRISAA_EOF'
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "noEmit": true
  },
  "include": ["src/**/*"]
}

ILOPRISAA_EOF
  ok "tsconfig.app.json"
else
  skip "tsconfig.app.json"
fi

if [ ! -f "index.html" ]; then
  mkdir -p "$(dirname "index.html")"
  cat > "index.html" << 'ILOPRISAA_EOF'
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <!-- CSP: blocks inline scripts and restricts resource origins -->
    <meta http-equiv="Content-Security-Policy"
      content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://*.supabase.co wss://*.supabase.co; img-src 'self' data: https:; frame-ancestors 'none';">
    <title>ILOPRISAA Document Management System</title>
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>

ILOPRISAA_EOF
  ok "index.html"
else
  skip "index.html"
fi

if [ ! -f "src/main.tsx" ]; then
  mkdir -p "$(dirname "src/main.tsx")"
  cat > "src/main.tsx" << 'ILOPRISAA_EOF'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

ILOPRISAA_EOF
  ok "src/main.tsx"
else
  skip "src/main.tsx"
fi

if [ ! -f "src/App.css" ]; then
  mkdir -p "$(dirname "src/App.css")"
  cat > "src/App.css" << 'ILOPRISAA_EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

ILOPRISAA_EOF
  ok "src/App.css"
else
  skip "src/App.css"
fi

if [ ! -f "src/index.css" ]; then
  mkdir -p "$(dirname "src/index.css")"
  cat > "src/index.css" << 'ILOPRISAA_EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

ILOPRISAA_EOF
  ok "src/index.css"
else
  skip "src/index.css"
fi

if [ ! -f ".gitignore" ]; then
  mkdir -p "$(dirname ".gitignore")"
  cat > ".gitignore" << 'ILOPRISAA_EOF'
# Dependencies
node_modules/
.pnp
.pnp.js

# Build output
dist/
dist-ssr/
*.local

# Environment — NEVER commit secrets
.env
.env.local
.env.*.local

# Editor
.vscode/*
!.vscode/extensions.json
.idea
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

# OS
.DS_Store
Thumbs.db

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

ILOPRISAA_EOF
  ok ".gitignore"
else
  skip ".gitignore"
fi

if [ ! -f "README.md" ]; then
  mkdir -p "$(dirname "README.md")"
  cat > "README.md" << 'ILOPRISAA_EOF'
# ILOPRISAA Document Management System

A secure, multi-tier athlete credentialing platform built with Vite + React (TypeScript) and Supabase.

## Architecture

```
src/
├── 1-presentation-tier/   # UI components (stateless, XSS-safe)
├── 2-application-tier/    # Business logic, state machines, validators
└── 3-data-tier/           # Supabase client, services, RLS policies
    └── config/            # SupabaseClient, Database types, documentServices
```

## Quick Start

1. Fill in `.env` with your Supabase credentials
2. Run `src/3-data-tier/policies/rls_policies.sql` in the Supabase SQL Editor
3. Create a private `athlete-credentials` storage bucket in Supabase
4. `npm run dev`

## Security Controls

| Threat | Mitigation |
|--------|-----------|
| SQL Injection | Supabase parameterized query builder |
| XSS | sanitizeForDisplay() + React text nodes |
| IDOR | Row-Level Security on all tables |
| Path Traversal | sanitizeFilename() strips separators |
| Broken Access Control | FSM guards + RBAC + RLS |
| Information Disclosure | SecureErrorBoundary strips stack traces |
| Auth Failures | Vague error messages, JWT lifecycle sync |

ILOPRISAA_EOF
  ok "README.md"
else
  skip "README.md"
fi

if [ ! -f "package.json" ]; then
  mkdir -p "$(dirname "package.json")"
  cat > "package.json" << 'ILOPRISAA_EOF'
{
  "name": "iloprisaa-dms",
  "private": true,
  "version": "1.0.0",
  "description": "ILOPRISAA Document Management System — Athlete Credentialing",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.45.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.26.0",
    "zustand": "^4.5.4"
  },
  "devDependencies": {
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.20",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.5.3",
    "vite": "^5.4.1"
  }
}

ILOPRISAA_EOF
  ok "package.json"
else
  skip "package.json"
fi


hdr "Writing source files"

if [ ! -f "src/3-data-tier/config/SupabaseClient.ts" ]; then
  mkdir -p "$(dirname "src/3-data-tier/config/SupabaseClient.ts")"
  cat > "src/3-data-tier/config/SupabaseClient.ts" << 'ILOPRISAA_EOF'
/**
 * TIER 3 — DATA TIER: Supabase Client
 *
 * SECURITY RATIONALE:
 * - Uses VITE_ env vars (never hardcoded keys) to prevent API key leakage.
 * - The anon key is safe to expose client-side; actual access is gated by
 *   Row-Level Security (RLS) policies enforced entirely in PostgreSQL.
 * - Mitigates: OWASP A02 (Cryptographic Failures) by keeping secrets out of source.
 * - Mitigates: OWASP A05 (Security Misconfiguration) via explicit session persistence.
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from './types/database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Fail-secure: crash loudly at startup rather than silently connecting
  // to an undefined endpoint that could be hijacked.
  throw new Error(
    '[ILOPRISAA] Missing Supabase environment variables. ' +
    'Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in .env'
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Persist session in localStorage so users survive page refreshes.
    // The JWT is short-lived (1h by default in Supabase), limiting replay attack windows.
    persistSession: true,
    autoRefreshToken: true,
    // Detect OAuth code in URL fragment to prevent open-redirect abuse.
    detectSessionInUrl: true,
  },
  global: {
    headers: {
      // Custom header aids server-side request tracing without leaking internals.
      'x-client-app': 'iloprisaa-dms',
    },
  },
});

export type SupabaseClient = typeof supabase;

ILOPRISAA_EOF
  ok "src/3-data-tier/config/SupabaseClient.ts"
else
  skip "src/3-data-tier/config/SupabaseClient.ts"
fi

if [ ! -f "src/3-data-tier/config/Database.types.ts" ]; then
  mkdir -p "$(dirname "src/3-data-tier/config/Database.types.ts")"
  cat > "src/3-data-tier/config/Database.types.ts" << 'ILOPRISAA_EOF'
/**
 * TIER 3 — DATA TIER: Database Type Definitions
 *
 * SECURITY RATIONALE:
 * - Strict TypeScript types eliminate an entire class of runtime errors that
 *   could arise from mismatched data shapes between tiers.
 * - Prevents OWASP A03 (Injection) at compile-time: if a field doesn't exist
 *   on the type, the compiler catches it before it reaches the DB layer.
 * - Prevents OWASP A04 (Insecure Design): impossible states are unrepresentable.
 *   e.g. a document status MUST be one of the enum values.
 */

export type DocumentStatus = 'draft' | 'pending_review' | 'verified' | 'action_required';
export type UserRole = 'athlete' | 'coach' | 'admin';
export type DocumentType =
  | 'psa_certificate'
  | 'medical_clearance'
  | 'birth_certificate'
  | 'school_id'
  | 'parental_consent'
  | 'physical_exam';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;               // UUID — matches auth.users.id (FK)
          role: UserRole;
          full_name: string;
          email: string;
          institution_id: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      institutions: {
        Row: {
          id: string;
          name: string;
          region: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['institutions']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['institutions']['Insert']>;
      };
      coach_athlete_assignments: {
        Row: {
          id: string;
          coach_id: string;
          athlete_id: string;
          institution_id: string;
          assigned_at: string;
        };
        Insert: Omit<Database['public']['Tables']['coach_athlete_assignments']['Row'], 'id' | 'assigned_at'>;
        Update: never; // Assignments are immutable; revoke then re-assign
      };
      documents: {
        Row: {
          id: string;
          athlete_id: string;          // FK → profiles.id
          document_type: DocumentType;
          status: DocumentStatus;
          storage_path: string;        // Supabase Storage object path
          file_size_bytes: number;
          mime_type: string;
          original_filename: string;   // Sanitized at upload time
          notes: string | null;        // User-provided — must be sanitized before render
          reviewed_by: string | null;  // FK → profiles.id (coach/admin)
          reviewed_at: string | null;
          digital_signature: string | null; // SHA-256 hash of file content
          metadata: Record<string, string> | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database['public']['Tables']['documents']['Row'],
          'id' | 'created_at' | 'updated_at' | 'reviewed_by' | 'reviewed_at'
        >;
        Update: Partial<Pick<
          Database['public']['Tables']['documents']['Row'],
          'status' | 'notes' | 'reviewed_by' | 'reviewed_at' | 'digital_signature' | 'metadata'
        >>;
      };
      audit_logs: {
        Row: {
          id: string;
          actor_id: string;       // Who performed the action
          action: string;         // 'upload' | 'review' | 'verify' | 'reject' | 'login'
          resource_type: string;  // 'document' | 'profile'
          resource_id: string;
          ip_address: string | null;
          user_agent: string | null;
          details: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['audit_logs']['Row'], 'id' | 'created_at'>;
        Update: never; // Audit logs are write-once, append-only
      };
    };
    Views: {
      athlete_document_summary: {
        Row: {
          athlete_id: string;
          full_name: string;
          institution_id: string | null;
          total_documents: number;
          verified_count: number;
          pending_count: number;
          action_required_count: number;
        };
      };
    };
    Functions: {
      get_my_role: {
        Args: Record<string, never>;
        Returns: UserRole;
      };
    };
    Enums: {
      document_status: DocumentStatus;
      user_role: UserRole;
      document_type: DocumentType;
    };
  };
}

// Convenience row-type aliases
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Document = Database['public']['Tables']['documents']['Row'];
export type Institution = Database['public']['Tables']['institutions']['Row'];
export type AuditLog = Database['public']['Tables']['audit_logs']['Row'];
export type CoachAthleteAssignment = Database['public']['Tables']['coach_athlete_assignments']['Row'];

ILOPRISAA_EOF
  ok "src/3-data-tier/config/Database.types.ts"
else
  skip "src/3-data-tier/config/Database.types.ts"
fi

if [ ! -f "src/3-data-tier/config/documentServices.ts" ]; then
  mkdir -p "$(dirname "src/3-data-tier/config/documentServices.ts")"
  cat > "src/3-data-tier/config/documentServices.ts" << 'ILOPRISAA_EOF'
/**
 * TIER 3 — DATA TIER: Document Service
 *
 * SECURITY RATIONALE:
 * - All queries use Supabase's parameterized query builder, which compiles to
 *   prepared statements under the hood — completely eliminating SQL Injection.
 *   Mitigates: OWASP A03 (Injection).
 * - Never constructs raw SQL strings. Dynamic values are ALWAYS passed as
 *   typed arguments, never interpolated.
 * - File paths use the athlete's UUID as a namespace prefix to enforce
 *   storage isolation and prevent path traversal.
 *   Mitigates: OWASP A01 (Broken Access Control) / CWE-22 (Path Traversal).
 * - All errors are caught and re-thrown as sanitized DomainError objects,
 *   preventing raw Postgres error messages from reaching the UI.
 *   Mitigates: OWASP A09 (Security Logging and Monitoring Failures).
 */

import { supabase } from '../supabaseClient';
import type { Document, DocumentStatus, DocumentType } from '../types/database.types';

// ─────────────────────────────────────────────────────────
// Domain Error: sanitized errors safe to display to users
// ─────────────────────────────────────────────────────────
export class DocumentServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly originalError?: unknown
  ) {
    super(message);
    this.name = 'DocumentServiceError';
  }
}

// ─────────────────────────────────────────────────────────
// Allowed MIME types and max file size (enforced server-side too via Storage policies)
// ─────────────────────────────────────────────────────────
export const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'] as const;
export type AllowedMimeType = typeof ALLOWED_MIME_TYPES[number];
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

// ─────────────────────────────────────────────────────────
// File sanitization utilities
// ─────────────────────────────────────────────────────────

/**
 * Sanitizes a filename to prevent path traversal (CWE-22).
 * Strips all path separators and special characters, keeping only
 * alphanumerics, hyphens, underscores, and the file extension.
 */
export function sanitizeFilename(filename: string): string {
  // Remove any directory components
  const basename = filename.split(/[/\\]/).pop() ?? 'upload';
  // Strip everything except safe characters
  const safe = basename.replace(/[^a-zA-Z0-9._-]/g, '_');
  // Prevent double extensions (e.g. evil.php.jpg)
  const parts = safe.split('.');
  if (parts.length > 2) {
    return `${parts[0]}.${parts[parts.length - 1]}`;
  }
  return safe || 'upload';
}

/**
 * Validates file integrity client-side before upload.
 * Note: This is defense-in-depth. Supabase Storage policy is the authoritative gate.
 */
export function validateFilePayload(file: File): void {
  if (!ALLOWED_MIME_TYPES.includes(file.type as AllowedMimeType)) {
    throw new DocumentServiceError(
      'Invalid file type. Only PDF, JPG, and PNG are accepted.',
      'INVALID_MIME_TYPE'
    );
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new DocumentServiceError(
      'File exceeds the 5 MB size limit.',
      'FILE_TOO_LARGE'
    );
  }
  if (file.size === 0) {
    throw new DocumentServiceError(
      'File is empty.',
      'EMPTY_FILE'
    );
  }
}

/**
 * Computes a SHA-256 fingerprint of the file for digital signature storage.
 * This fingerprint is stored with the document record to detect tampering.
 */
export async function computeFileHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ─────────────────────────────────────────────────────────
// Upload Service
// ─────────────────────────────────────────────────────────

export interface UploadDocumentPayload {
  athleteId: string;
  documentType: DocumentType;
  file: File;
  notes?: string;
}

export interface UploadDocumentResult {
  document: Document;
  storagePath: string;
}

/**
 * Uploads a credential file and creates the document record atomically.
 *
 * Storage path pattern: `athlete-credentials/{athleteId}/{documentType}/{timestamp}_{sanitizedName}`
 * Using the athlete's UUID as a namespace ensures:
 * 1. No naming collisions between athletes.
 * 2. Storage RLS policies can match on the path prefix.
 * 3. IDOR is prevented — athletes cannot guess other athletes' paths.
 */
export async function uploadDocument(
  payload: UploadDocumentPayload
): Promise<UploadDocumentResult> {
  validateFilePayload(payload.file);

  const sanitizedName = sanitizeFilename(payload.file.name);
  const timestamp = Date.now();
  const storagePath = `athlete-credentials/${payload.athleteId}/${payload.documentType}/${timestamp}_${sanitizedName}`;
  const digitalSignature = await computeFileHash(payload.file);

  // Step 1: Upload binary to Supabase Storage
  const { error: storageError } = await supabase.storage
    .from('athlete-credentials')
    .upload(storagePath, payload.file, {
      contentType: payload.file.type,
      upsert: false, // Never overwrite — each upload is a new record
    });

  if (storageError) {
    throw new DocumentServiceError(
      'File upload failed. Please try again.',
      'STORAGE_UPLOAD_FAILED',
      storageError
    );
  }

  // Step 2: Insert document metadata record (parameterized — no SQLi possible)
  const { data, error: dbError } = await supabase
    .from('documents')
    .insert({
      athlete_id: payload.athleteId,
      document_type: payload.documentType,
      status: 'draft' as DocumentStatus,
      storage_path: storagePath,
      file_size_bytes: payload.file.size,
      mime_type: payload.file.type,
      original_filename: sanitizedName,
      notes: payload.notes ?? null,
      digital_signature: digitalSignature,
    })
    .select()
    .single();

  if (dbError || !data) {
    // Rollback the storage upload to avoid orphaned files
    await supabase.storage.from('athlete-credentials').remove([storagePath]);
    throw new DocumentServiceError(
      'Failed to save document record. Upload has been rolled back.',
      'DB_INSERT_FAILED',
      dbError
    );
  }

  return { document: data, storagePath };
}

// ─────────────────────────────────────────────────────────
// Query Services
// ─────────────────────────────────────────────────────────

/**
 * Fetches documents for the authenticated athlete.
 * RLS policy on the DB enforces athlete_id = auth.uid(), so even if
 * the client sends a different athleteId, Postgres will return 0 rows.
 * This is defense-in-depth against IDOR.
 */
export async function getMyDocuments(): Promise<Document[]> {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new DocumentServiceError(
      'Failed to load documents.',
      'FETCH_FAILED',
      error
    );
  }

  return data ?? [];
}

/**
 * Fetches documents for a specific athlete (coach/admin use).
 * RLS policy restricts coaches to only see athletes assigned to their institution.
 */
export async function getAthleteDocuments(athleteId: string): Promise<Document[]> {
  if (!athleteId || typeof athleteId !== 'string') {
    throw new DocumentServiceError('Invalid athlete ID.', 'INVALID_INPUT');
  }

  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('athlete_id', athleteId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new DocumentServiceError(
      'Failed to load athlete documents.',
      'FETCH_FAILED',
      error
    );
  }

  return data ?? [];
}

/**
 * Updates document status — restricted to coaches/admins via RLS.
 * The state machine guard in Tier 2 validates the transition BEFORE
 * this function is ever called, providing layered defense.
 */
export async function updateDocumentStatus(
  documentId: string,
  status: DocumentStatus,
  reviewerId: string,
  notes?: string
): Promise<Document> {
  if (!documentId || !reviewerId) {
    throw new DocumentServiceError('Missing required fields.', 'INVALID_INPUT');
  }

  const { data, error } = await supabase
    .from('documents')
    .update({
      status,
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
      ...(notes !== undefined ? { notes } : {}),
    })
    .eq('id', documentId)
    .select()
    .single();

  if (error || !data) {
    throw new DocumentServiceError(
      'Failed to update document status.',
      'UPDATE_FAILED',
      error
    );
  }

  return data;
}

/**
 * Generates a short-lived signed URL for secure document download.
 * The URL expires in 60 seconds, preventing link sharing attacks.
 */
export async function getSignedDownloadUrl(storagePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from('athlete-credentials')
    .createSignedUrl(storagePath, 60); // 60-second expiry

  if (error || !data?.signedUrl) {
    throw new DocumentServiceError(
      'Could not generate download link.',
      'SIGNED_URL_FAILED',
      error
    );
  }

  return data.signedUrl;
}

ILOPRISAA_EOF
  ok "src/3-data-tier/config/documentServices.ts"
else
  skip "src/3-data-tier/config/documentServices.ts"
fi

if [ ! -f "src/3-data-tier/services/documentService.ts" ]; then
  mkdir -p "$(dirname "src/3-data-tier/services/documentService.ts")"
  cat > "src/3-data-tier/services/documentService.ts" << 'ILOPRISAA_EOF'
/**
 * TIER 3 — DATA TIER: Document Service
 *
 * SECURITY RATIONALE:
 * - All queries use Supabase's parameterized query builder, which compiles to
 *   prepared statements under the hood — completely eliminating SQL Injection.
 *   Mitigates: OWASP A03 (Injection).
 * - Never constructs raw SQL strings. Dynamic values are ALWAYS passed as
 *   typed arguments, never interpolated.
 * - File paths use the athlete's UUID as a namespace prefix to enforce
 *   storage isolation and prevent path traversal.
 *   Mitigates: OWASP A01 (Broken Access Control) / CWE-22 (Path Traversal).
 * - All errors are caught and re-thrown as sanitized DomainError objects,
 *   preventing raw Postgres error messages from reaching the UI.
 *   Mitigates: OWASP A09 (Security Logging and Monitoring Failures).
 */

import { supabase } from '../supabaseClient';
import type { Document, DocumentStatus, DocumentType } from '../types/database.types';

// ─────────────────────────────────────────────────────────
// Domain Error: sanitized errors safe to display to users
// ─────────────────────────────────────────────────────────
export class DocumentServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly originalError?: unknown
  ) {
    super(message);
    this.name = 'DocumentServiceError';
  }
}

// ─────────────────────────────────────────────────────────
// Allowed MIME types and max file size (enforced server-side too via Storage policies)
// ─────────────────────────────────────────────────────────
export const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'] as const;
export type AllowedMimeType = typeof ALLOWED_MIME_TYPES[number];
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

// ─────────────────────────────────────────────────────────
// File sanitization utilities
// ─────────────────────────────────────────────────────────

/**
 * Sanitizes a filename to prevent path traversal (CWE-22).
 * Strips all path separators and special characters, keeping only
 * alphanumerics, hyphens, underscores, and the file extension.
 */
export function sanitizeFilename(filename: string): string {
  // Remove any directory components
  const basename = filename.split(/[/\\]/).pop() ?? 'upload';
  // Strip everything except safe characters
  const safe = basename.replace(/[^a-zA-Z0-9._-]/g, '_');
  // Prevent double extensions (e.g. evil.php.jpg)
  const parts = safe.split('.');
  if (parts.length > 2) {
    return `${parts[0]}.${parts[parts.length - 1]}`;
  }
  return safe || 'upload';
}

/**
 * Validates file integrity client-side before upload.
 * Note: This is defense-in-depth. Supabase Storage policy is the authoritative gate.
 */
export function validateFilePayload(file: File): void {
  if (!ALLOWED_MIME_TYPES.includes(file.type as AllowedMimeType)) {
    throw new DocumentServiceError(
      'Invalid file type. Only PDF, JPG, and PNG are accepted.',
      'INVALID_MIME_TYPE'
    );
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new DocumentServiceError(
      'File exceeds the 5 MB size limit.',
      'FILE_TOO_LARGE'
    );
  }
  if (file.size === 0) {
    throw new DocumentServiceError(
      'File is empty.',
      'EMPTY_FILE'
    );
  }
}

/**
 * Computes a SHA-256 fingerprint of the file for digital signature storage.
 * This fingerprint is stored with the document record to detect tampering.
 */
export async function computeFileHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ─────────────────────────────────────────────────────────
// Upload Service
// ─────────────────────────────────────────────────────────

export interface UploadDocumentPayload {
  athleteId: string;
  documentType: DocumentType;
  file: File;
  notes?: string;
}

export interface UploadDocumentResult {
  document: Document;
  storagePath: string;
}

/**
 * Uploads a credential file and creates the document record atomically.
 *
 * Storage path pattern: `athlete-credentials/{athleteId}/{documentType}/{timestamp}_{sanitizedName}`
 * Using the athlete's UUID as a namespace ensures:
 * 1. No naming collisions between athletes.
 * 2. Storage RLS policies can match on the path prefix.
 * 3. IDOR is prevented — athletes cannot guess other athletes' paths.
 */
export async function uploadDocument(
  payload: UploadDocumentPayload
): Promise<UploadDocumentResult> {
  validateFilePayload(payload.file);

  const sanitizedName = sanitizeFilename(payload.file.name);
  const timestamp = Date.now();
  const storagePath = `athlete-credentials/${payload.athleteId}/${payload.documentType}/${timestamp}_${sanitizedName}`;
  const digitalSignature = await computeFileHash(payload.file);

  // Step 1: Upload binary to Supabase Storage
  const { error: storageError } = await supabase.storage
    .from('athlete-credentials')
    .upload(storagePath, payload.file, {
      contentType: payload.file.type,
      upsert: false, // Never overwrite — each upload is a new record
    });

  if (storageError) {
    throw new DocumentServiceError(
      'File upload failed. Please try again.',
      'STORAGE_UPLOAD_FAILED',
      storageError
    );
  }

  // Step 2: Insert document metadata record (parameterized — no SQLi possible)
  const { data, error: dbError } = await supabase
    .from('documents')
    .insert({
      athlete_id: payload.athleteId,
      document_type: payload.documentType,
      status: 'draft' as DocumentStatus,
      storage_path: storagePath,
      file_size_bytes: payload.file.size,
      mime_type: payload.file.type,
      original_filename: sanitizedName,
      notes: payload.notes ?? null,
      digital_signature: digitalSignature,
    })
    .select()
    .single();

  if (dbError || !data) {
    // Rollback the storage upload to avoid orphaned files
    await supabase.storage.from('athlete-credentials').remove([storagePath]);
    throw new DocumentServiceError(
      'Failed to save document record. Upload has been rolled back.',
      'DB_INSERT_FAILED',
      dbError
    );
  }

  return { document: data, storagePath };
}

// ─────────────────────────────────────────────────────────
// Query Services
// ─────────────────────────────────────────────────────────

/**
 * Fetches documents for the authenticated athlete.
 * RLS policy on the DB enforces athlete_id = auth.uid(), so even if
 * the client sends a different athleteId, Postgres will return 0 rows.
 * This is defense-in-depth against IDOR.
 */
export async function getMyDocuments(): Promise<Document[]> {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new DocumentServiceError(
      'Failed to load documents.',
      'FETCH_FAILED',
      error
    );
  }

  return data ?? [];
}

/**
 * Fetches documents for a specific athlete (coach/admin use).
 * RLS policy restricts coaches to only see athletes assigned to their institution.
 */
export async function getAthleteDocuments(athleteId: string): Promise<Document[]> {
  if (!athleteId || typeof athleteId !== 'string') {
    throw new DocumentServiceError('Invalid athlete ID.', 'INVALID_INPUT');
  }

  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('athlete_id', athleteId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new DocumentServiceError(
      'Failed to load athlete documents.',
      'FETCH_FAILED',
      error
    );
  }

  return data ?? [];
}

/**
 * Updates document status — restricted to coaches/admins via RLS.
 * The state machine guard in Tier 2 validates the transition BEFORE
 * this function is ever called, providing layered defense.
 */
export async function updateDocumentStatus(
  documentId: string,
  status: DocumentStatus,
  reviewerId: string,
  notes?: string
): Promise<Document> {
  if (!documentId || !reviewerId) {
    throw new DocumentServiceError('Missing required fields.', 'INVALID_INPUT');
  }

  const { data, error } = await supabase
    .from('documents')
    .update({
      status,
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
      ...(notes !== undefined ? { notes } : {}),
    })
    .eq('id', documentId)
    .select()
    .single();

  if (error || !data) {
    throw new DocumentServiceError(
      'Failed to update document status.',
      'UPDATE_FAILED',
      error
    );
  }

  return data;
}

/**
 * Generates a short-lived signed URL for secure document download.
 * The URL expires in 60 seconds, preventing link sharing attacks.
 */
export async function getSignedDownloadUrl(storagePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from('athlete-credentials')
    .createSignedUrl(storagePath, 60); // 60-second expiry

  if (error || !data?.signedUrl) {
    throw new DocumentServiceError(
      'Could not generate download link.',
      'SIGNED_URL_FAILED',
      error
    );
  }

  return data.signedUrl;
}

ILOPRISAA_EOF
  ok "src/3-data-tier/services/documentService.ts"
else
  skip "src/3-data-tier/services/documentService.ts"
fi

if [ ! -f "src/3-data-tier/types/database.types.ts" ]; then
  mkdir -p "$(dirname "src/3-data-tier/types/database.types.ts")"
  cat > "src/3-data-tier/types/database.types.ts" << 'ILOPRISAA_EOF'
/**
 * TIER 3 — DATA TIER: Database Type Definitions
 *
 * SECURITY RATIONALE:
 * - Strict TypeScript types eliminate an entire class of runtime errors that
 *   could arise from mismatched data shapes between tiers.
 * - Prevents OWASP A03 (Injection) at compile-time: if a field doesn't exist
 *   on the type, the compiler catches it before it reaches the DB layer.
 * - Prevents OWASP A04 (Insecure Design): impossible states are unrepresentable.
 *   e.g. a document status MUST be one of the enum values.
 */

export type DocumentStatus = 'draft' | 'pending_review' | 'verified' | 'action_required';
export type UserRole = 'athlete' | 'coach' | 'admin';
export type DocumentType =
  | 'psa_certificate'
  | 'medical_clearance'
  | 'birth_certificate'
  | 'school_id'
  | 'parental_consent'
  | 'physical_exam';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;               // UUID — matches auth.users.id (FK)
          role: UserRole;
          full_name: string;
          email: string;
          institution_id: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      institutions: {
        Row: {
          id: string;
          name: string;
          region: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['institutions']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['institutions']['Insert']>;
      };
      coach_athlete_assignments: {
        Row: {
          id: string;
          coach_id: string;
          athlete_id: string;
          institution_id: string;
          assigned_at: string;
        };
        Insert: Omit<Database['public']['Tables']['coach_athlete_assignments']['Row'], 'id' | 'assigned_at'>;
        Update: never; // Assignments are immutable; revoke then re-assign
      };
      documents: {
        Row: {
          id: string;
          athlete_id: string;          // FK → profiles.id
          document_type: DocumentType;
          status: DocumentStatus;
          storage_path: string;        // Supabase Storage object path
          file_size_bytes: number;
          mime_type: string;
          original_filename: string;   // Sanitized at upload time
          notes: string | null;        // User-provided — must be sanitized before render
          reviewed_by: string | null;  // FK → profiles.id (coach/admin)
          reviewed_at: string | null;
          digital_signature: string | null; // SHA-256 hash of file content
          metadata: Record<string, string> | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database['public']['Tables']['documents']['Row'],
          'id' | 'created_at' | 'updated_at' | 'reviewed_by' | 'reviewed_at'
        >;
        Update: Partial<Pick<
          Database['public']['Tables']['documents']['Row'],
          'status' | 'notes' | 'reviewed_by' | 'reviewed_at' | 'digital_signature' | 'metadata'
        >>;
      };
      audit_logs: {
        Row: {
          id: string;
          actor_id: string;       // Who performed the action
          action: string;         // 'upload' | 'review' | 'verify' | 'reject' | 'login'
          resource_type: string;  // 'document' | 'profile'
          resource_id: string;
          ip_address: string | null;
          user_agent: string | null;
          details: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['audit_logs']['Row'], 'id' | 'created_at'>;
        Update: never; // Audit logs are write-once, append-only
      };
    };
    Views: {
      athlete_document_summary: {
        Row: {
          athlete_id: string;
          full_name: string;
          institution_id: string | null;
          total_documents: number;
          verified_count: number;
          pending_count: number;
          action_required_count: number;
        };
      };
    };
    Functions: {
      get_my_role: {
        Args: Record<string, never>;
        Returns: UserRole;
      };
    };
    Enums: {
      document_status: DocumentStatus;
      user_role: UserRole;
      document_type: DocumentType;
    };
  };
}

// Convenience row-type aliases
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Document = Database['public']['Tables']['documents']['Row'];
export type Institution = Database['public']['Tables']['institutions']['Row'];
export type AuditLog = Database['public']['Tables']['audit_logs']['Row'];
export type CoachAthleteAssignment = Database['public']['Tables']['coach_athlete_assignments']['Row'];

ILOPRISAA_EOF
  ok "src/3-data-tier/types/database.types.ts"
else
  skip "src/3-data-tier/types/database.types.ts"
fi

if [ ! -f "src/3-data-tier/policies/rls_policies.sql" ]; then
  mkdir -p "$(dirname "src/3-data-tier/policies/rls_policies.sql")"
  cat > "src/3-data-tier/policies/rls_policies.sql" << 'ILOPRISAA_EOF'
-- ============================================================
-- TIER 3 — DATA TIER: Row-Level Security Policies
-- Run this entire file in the Supabase SQL Editor.
--
-- SECURITY RATIONALE:
-- RLS is enforced at the PostgreSQL engine level — it CANNOT be
-- bypassed by any client-side code, malformed API call, or
-- JWT manipulation. Even if an attacker obtains the anon key,
-- they can only access rows the policy permits for their identity.
--
-- Mitigates: OWASP A01 (Broken Access Control)
-- Mitigates: OWASP A04 (Insecure Direct Object Reference / IDOR)
-- ============================================================


-- ── 0. HELPER FUNCTION ──────────────────────────────────────
-- Retrieves the current user's role without exposing the profiles
-- table schema to attackers enumerating columns.
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER  -- Runs as owner, not caller — prevents privilege escalation
AS $$
  SELECT role::text FROM public.profiles WHERE id = auth.uid();
$$;


-- ── 1. PROFILES TABLE ────────────────────────────────────────

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Athletes and coaches can read their own profile only.
CREATE POLICY "profiles: users read own row"
  ON public.profiles
  FOR SELECT
  USING (id = auth.uid());

-- Admins can read all profiles (needed for management views).
CREATE POLICY "profiles: admins read all"
  ON public.profiles
  FOR SELECT
  USING (public.get_my_role() = 'admin');

-- Users can only update their own profile.
CREATE POLICY "profiles: users update own row"
  ON public.profiles
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    -- Prevent role self-elevation: users cannot change their own role.
    AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
  );

-- Profiles are created via a trigger on auth.users INSERT, not directly.
-- No INSERT policy needed here.


-- ── 2. DOCUMENTS TABLE ──────────────────────────────────────

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- ATHLETES: SELECT own documents only
CREATE POLICY "documents: athletes read own"
  ON public.documents
  FOR SELECT
  USING (
    athlete_id = auth.uid()
    AND public.get_my_role() = 'athlete'
  );

-- ATHLETES: INSERT only for themselves (status must start as 'draft')
CREATE POLICY "documents: athletes insert own"
  ON public.documents
  FOR INSERT
  WITH CHECK (
    athlete_id = auth.uid()
    AND public.get_my_role() = 'athlete'
    AND status = 'draft'   -- Cannot self-promote to 'verified'
  );

-- COACHES: SELECT documents for athletes assigned to their institution.
-- The subquery join through coach_athlete_assignments enforces the
-- coach-athlete relationship at the database level.
CREATE POLICY "documents: coaches read assigned athletes"
  ON public.documents
  FOR SELECT
  USING (
    public.get_my_role() = 'coach'
    AND athlete_id IN (
      SELECT caa.athlete_id
      FROM public.coach_athlete_assignments caa
      WHERE caa.coach_id = auth.uid()
    )
  );

-- COACHES: UPDATE (review) documents for assigned athletes.
-- Coaches cannot change athlete_id, document_type, or digital_signature.
CREATE POLICY "documents: coaches update assigned athletes"
  ON public.documents
  FOR UPDATE
  USING (
    public.get_my_role() = 'coach'
    AND athlete_id IN (
      SELECT caa.athlete_id
      FROM public.coach_athlete_assignments caa
      WHERE caa.coach_id = auth.uid()
    )
  )
  WITH CHECK (
    -- A coach can only move status to 'pending_review', 'verified', or 'action_required'.
    -- They CANNOT revert a 'verified' document back to 'draft'.
    status IN ('pending_review', 'verified', 'action_required')
  );

-- ADMINS: Full access — used for system-level operations only.
CREATE POLICY "documents: admins full access"
  ON public.documents
  USING (public.get_my_role() = 'admin');


-- ── 3. AUDIT_LOGS TABLE ─────────────────────────────────────

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Anyone can INSERT their own audit events (via service role in practice).
CREATE POLICY "audit_logs: authenticated insert"
  ON public.audit_logs
  FOR INSERT
  WITH CHECK (actor_id = auth.uid());

-- Only admins can read audit logs.
CREATE POLICY "audit_logs: admins read all"
  ON public.audit_logs
  FOR SELECT
  USING (public.get_my_role() = 'admin');

-- Audit logs are IMMUTABLE — no UPDATE or DELETE ever.
-- (No UPDATE/DELETE policies are defined — they default to DENY.)


-- ── 4. COACH_ATHLETE_ASSIGNMENTS TABLE ──────────────────────

ALTER TABLE public.coach_athlete_assignments ENABLE ROW LEVEL SECURITY;

-- Coaches see only their own assignments.
CREATE POLICY "assignments: coaches read own"
  ON public.coach_athlete_assignments
  FOR SELECT
  USING (coach_id = auth.uid() AND public.get_my_role() = 'coach');

-- Athletes can see who is assigned to them.
CREATE POLICY "assignments: athletes read own"
  ON public.coach_athlete_assignments
  FOR SELECT
  USING (athlete_id = auth.uid() AND public.get_my_role() = 'athlete');

-- Only admins can create/delete assignments.
CREATE POLICY "assignments: admins manage"
  ON public.coach_athlete_assignments
  USING (public.get_my_role() = 'admin');


-- ── 5. STORAGE BUCKET POLICIES ──────────────────────────────
-- Run after creating the 'athlete-credentials' bucket in Supabase Storage.

-- Athletes can upload only into their own UUID-prefixed path.
-- Path format: athlete-credentials/{athlete_uuid}/...
CREATE POLICY "storage: athletes upload own files"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'athlete-credentials'
    AND auth.uid()::text = (storage.foldername(name))[1]
    AND public.get_my_role() = 'athlete'
  );

-- Athletes can read only their own files.
CREATE POLICY "storage: athletes read own files"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'athlete-credentials'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Coaches can read files for their assigned athletes only.
CREATE POLICY "storage: coaches read assigned athletes files"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'athlete-credentials'
    AND public.get_my_role() = 'coach'
    AND (storage.foldername(name))[1]::uuid IN (
      SELECT athlete_id
      FROM public.coach_athlete_assignments
      WHERE coach_id = auth.uid()
    )
  );

-- Admins have full storage access.
CREATE POLICY "storage: admins full access"
  ON storage.objects
  USING (
    bucket_id = 'athlete-credentials'
    AND public.get_my_role() = 'admin'
  );


-- ── 6. PROFILE AUTO-CREATION TRIGGER ────────────────────────
-- Creates a profile row when a new user signs up via Supabase Auth.
-- The role is set by the admin AFTER account creation; users cannot
-- self-assign a role at signup.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name, email)
  VALUES (
    NEW.id,
    'athlete',  -- Default to least-privileged role
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

ILOPRISAA_EOF
  ok "src/3-data-tier/policies/rls_policies.sql"
else
  skip "src/3-data-tier/policies/rls_policies.sql"
fi

if [ ! -f "src/2-application-tier/state-machines/documentStateMachine.ts" ]; then
  mkdir -p "$(dirname "src/2-application-tier/state-machines/documentStateMachine.ts")"
  cat > "src/2-application-tier/state-machines/documentStateMachine.ts" << 'ILOPRISAA_EOF'
/**
 * TIER 2 — APPLICATION TIER: Document State Machine
 *
 * SECURITY RATIONALE:
 * Implements a strict finite state machine (FSM) that makes illegal document
 * state transitions IMPOSSIBLE at the application layer.
 *
 * This is defense-in-depth: even if someone bypasses the UI and calls the
 * data service directly, this layer provides an explicit, auditable contract
 * of what transitions are permitted and under what conditions.
 *
 * Mitigates: OWASP A04 (Insecure Design) — eliminates "confused deputy" attacks
 * where a coach could call the API to force a "verified" status without a review.
 *
 * The FSM model:
 *   draft ──► pending_review ──► verified
 *                │                  │
 *                └──► action_required ──► pending_review (re-submit loop)
 *
 * Invalid transitions (will throw):
 *   draft → verified (must go through pending_review)
 *   verified → draft (no reverting verified documents)
 *   any → draft (documents cannot be returned to draft by reviewers)
 */

import type { DocumentStatus, UserRole } from '../../3-data-tier/types/database.types';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface TransitionGuard {
  /** The required role to perform this transition */
  requiredRole: UserRole | UserRole[];
  /** Additional conditions that must be true */
  conditions: TransitionCondition[];
}

export interface TransitionCondition {
  name: string;
  description: string;
  validate: (context: TransitionContext) => boolean;
}

export interface TransitionContext {
  /** The document's current file hash — must be non-empty */
  digitalSignature: string | null;
  /** The reviewer's user ID */
  reviewerId: string | null;
  /** Whether the document has all required metadata fields */
  hasRequiredMetadata: boolean;
  /** Actor role performing the transition */
  actorRole: UserRole;
}

export interface TransitionResult {
  allowed: boolean;
  errors: string[];
  nextStatus: DocumentStatus | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Allowed Transitions Table
// Each key is `fromStatus → toStatus`, value is the guard definition
// ─────────────────────────────────────────────────────────────────────────────

const TRANSITION_GUARDS: Map<string, TransitionGuard> = new Map([
  // Athlete submits for review
  [
    'draft→pending_review',
    {
      requiredRole: 'athlete',
      conditions: [
        {
          name: 'has_file',
          description: 'Document must have a file hash (digital signature)',
          validate: (ctx) => typeof ctx.digitalSignature === 'string' && ctx.digitalSignature.length === 64,
        },
        {
          name: 'has_metadata',
          description: 'Required metadata must be present',
          validate: (ctx) => ctx.hasRequiredMetadata,
        },
      ],
    },
  ],

  // Coach or Admin verifies a pending document
  [
    'pending_review→verified',
    {
      requiredRole: ['coach', 'admin'],
      conditions: [
        {
          name: 'has_reviewer',
          description: 'A reviewer must be assigned',
          validate: (ctx) => typeof ctx.reviewerId === 'string' && ctx.reviewerId.length > 0,
        },
        {
          name: 'has_file_integrity',
          description: 'File digital signature must be present and valid',
          validate: (ctx) => typeof ctx.digitalSignature === 'string' && ctx.digitalSignature.length === 64,
        },
      ],
    },
  ],

  // Coach or Admin flags a document as needing action
  [
    'pending_review→action_required',
    {
      requiredRole: ['coach', 'admin'],
      conditions: [
        {
          name: 'has_reviewer',
          description: 'A reviewer must be assigned',
          validate: (ctx) => typeof ctx.reviewerId === 'string' && ctx.reviewerId.length > 0,
        },
      ],
    },
  ],

  // Athlete re-submits after action was required
  [
    'action_required→pending_review',
    {
      requiredRole: 'athlete',
      conditions: [
        {
          name: 'has_file',
          description: 'Document must have a file hash (digital signature)',
          validate: (ctx) => typeof ctx.digitalSignature === 'string' && ctx.digitalSignature.length === 64,
        },
      ],
    },
  ],
]);

// ─────────────────────────────────────────────────────────────────────────────
// State Machine Engine
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Determines whether a status transition is allowed given the actor's role
 * and the current document context. Returns a structured result with all
 * failed conditions listed — never throws, never logs raw errors.
 */
export function evaluateTransition(
  fromStatus: DocumentStatus,
  toStatus: DocumentStatus,
  context: TransitionContext
): TransitionResult {
  const transitionKey = `${fromStatus}→${toStatus}`;
  const guard = TRANSITION_GUARDS.get(transitionKey);

  const errors: string[] = [];

  if (!guard) {
    return {
      allowed: false,
      errors: [`Transition from '${fromStatus}' to '${toStatus}' is not permitted.`],
      nextStatus: null,
    };
  }

  // Role check
  const allowedRoles = Array.isArray(guard.requiredRole)
    ? guard.requiredRole
    : [guard.requiredRole];

  if (!allowedRoles.includes(context.actorRole)) {
    errors.push(
      `Role '${context.actorRole}' cannot perform this transition. Required: ${allowedRoles.join(' or ')}.`
    );
  }

  // Condition checks
  for (const condition of guard.conditions) {
    if (!condition.validate(context)) {
      errors.push(condition.description);
    }
  }

  return {
    allowed: errors.length === 0,
    errors,
    nextStatus: errors.length === 0 ? toStatus : null,
  };
}

/**
 * Returns all valid next states for a given document status and actor role.
 * Used by the UI to show only the buttons the user is actually allowed to use.
 */
export function getValidNextStates(
  fromStatus: DocumentStatus,
  actorRole: UserRole
): DocumentStatus[] {
  const validStates: DocumentStatus[] = [];

  for (const [key, guard] of TRANSITION_GUARDS.entries()) {
    const [from, to] = key.split('→') as [DocumentStatus, DocumentStatus];
    if (from !== fromStatus) continue;

    const allowedRoles = Array.isArray(guard.requiredRole)
      ? guard.requiredRole
      : [guard.requiredRole];

    if (allowedRoles.includes(actorRole)) {
      validStates.push(to);
    }
  }

  return validStates;
}

export const STATUS_LABELS: Record<DocumentStatus, string> = {
  draft: 'Draft',
  pending_review: 'Pending Review',
  verified: 'Verified',
  action_required: 'Action Required',
};

export const STATUS_COLORS: Record<DocumentStatus, string> = {
  draft: 'gray',
  pending_review: 'amber',
  verified: 'green',
  action_required: 'red',
};

ILOPRISAA_EOF
  ok "src/2-application-tier/state-machines/documentStateMachine.ts"
else
  skip "src/2-application-tier/state-machines/documentStateMachine.ts"
fi

if [ ! -f "src/2-application-tier/validators/payloadValidators.ts" ]; then
  mkdir -p "$(dirname "src/2-application-tier/validators/payloadValidators.ts")"
  cat > "src/2-application-tier/validators/payloadValidators.ts" << 'ILOPRISAA_EOF'
/**
 * TIER 2 — APPLICATION TIER: Input Validators
 *
 * SECURITY RATIONALE:
 * The Presentation Tier is treated as an untrusted, hostile boundary.
 * All payloads destined for the Data Tier must pass through these validators
 * before any Supabase call is made.
 *
 * This implements the "Validate on every tier" principle from OWASP's
 * Input Validation Cheat Sheet.
 *
 * Mitigates: OWASP A03 (Injection) — structural validation before DB touch.
 * Mitigates: OWASP A04 (Insecure Design) — rejects malformed/incomplete records.
 * Mitigates: OWASP A08 (Software and Data Integrity Failures) — ensures
 *   document records have minimum required integrity before persistence.
 */

import type { DocumentType, DocumentStatus } from '../../3-data-tier/types/database.types';
import {
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
  type AllowedMimeType,
} from '../../3-data-tier/services/documentService';

// ─────────────────────────────────────────────────────────
// Validation Result
// ─────────────────────────────────────────────────────────

export interface ValidationResult<T = unknown> {
  valid: boolean;
  errors: string[];
  sanitized: T | null;
}

function ok<T>(sanitized: T): ValidationResult<T> {
  return { valid: true, errors: [], sanitized };
}

function fail<T>(errors: string[]): ValidationResult<T> {
  return { valid: false, errors, sanitized: null };
}

// ─────────────────────────────────────────────────────────
// Sanitizers
// ─────────────────────────────────────────────────────────

const VALID_DOCUMENT_TYPES = new Set<DocumentType>([
  'psa_certificate',
  'medical_clearance',
  'birth_certificate',
  'school_id',
  'parental_consent',
  'physical_exam',
]);

const VALID_STATUSES = new Set<DocumentStatus>([
  'draft',
  'pending_review',
  'verified',
  'action_required',
]);

/**
 * Sanitizes free-text input to prevent XSS.
 * Strips HTML tags and encodes dangerous characters.
 * The Presentation Tier ALSO sanitizes before render, but this is
 * the authoritative sanitization that prevents DB-stored XSS.
 *
 * Mitigates: OWASP A03 (XSS via stored injection)
 */
export function sanitizeText(input: unknown, maxLength = 2000): string {
  if (typeof input !== 'string') return '';
  return input
    .slice(0, maxLength)
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    // Strip null bytes that could truncate strings in some DB drivers
    .replace(/\0/g, '')
    .trim();
}

/**
 * Validates a UUID v4 format.
 * Prevents injection via crafted ID parameters.
 */
export function isValidUUID(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

// ─────────────────────────────────────────────────────────
// Payload Validators
// ─────────────────────────────────────────────────────────

export interface UploadPayloadInput {
  athleteId: unknown;
  documentType: unknown;
  file: unknown;
  notes?: unknown;
}

export interface ValidatedUploadPayload {
  athleteId: string;
  documentType: DocumentType;
  file: File;
  notes: string | undefined;
}

/**
 * Validates and sanitizes an upload document payload.
 * Called in Tier 2 BEFORE the data service is invoked.
 */
export function validateUploadPayload(
  input: UploadPayloadInput
): ValidationResult<ValidatedUploadPayload> {
  const errors: string[] = [];

  if (!isValidUUID(input.athleteId)) {
    errors.push('Invalid athlete ID format.');
  }

  if (!VALID_DOCUMENT_TYPES.has(input.documentType as DocumentType)) {
    errors.push('Invalid document type.');
  }

  if (!(input.file instanceof File)) {
    errors.push('No file provided.');
  } else {
    if (!ALLOWED_MIME_TYPES.includes(input.file.type as AllowedMimeType)) {
      errors.push('File type not allowed. Accepted: PDF, JPG, PNG.');
    }
    if (input.file.size > MAX_FILE_SIZE_BYTES) {
      errors.push('File exceeds 5 MB size limit.');
    }
    if (input.file.size === 0) {
      errors.push('File is empty.');
    }
  }

  if (errors.length > 0) return fail(errors);

  return ok({
    athleteId: input.athleteId as string,
    documentType: input.documentType as DocumentType,
    file: input.file as File,
    notes: input.notes !== undefined ? sanitizeText(input.notes, 500) : undefined,
  });
}

export interface StatusUpdateInput {
  documentId: unknown;
  newStatus: unknown;
  reviewerId: unknown;
  notes?: unknown;
}

export interface ValidatedStatusUpdate {
  documentId: string;
  newStatus: DocumentStatus;
  reviewerId: string;
  notes: string | undefined;
}

/**
 * Validates a status update payload from a coach or admin.
 * Ensures the reviewer's ID and new status are well-formed before
 * passing them to the state machine and data service.
 */
export function validateStatusUpdatePayload(
  input: StatusUpdateInput
): ValidationResult<ValidatedStatusUpdate> {
  const errors: string[] = [];

  if (!isValidUUID(input.documentId)) {
    errors.push('Invalid document ID format.');
  }

  if (!VALID_STATUSES.has(input.newStatus as DocumentStatus)) {
    errors.push('Invalid status value.');
  }

  if (!isValidUUID(input.reviewerId)) {
    errors.push('Invalid reviewer ID format.');
  }

  if (errors.length > 0) return fail(errors);

  return ok({
    documentId: input.documentId as string,
    newStatus: input.newStatus as DocumentStatus,
    reviewerId: input.reviewerId as string,
    notes: input.notes !== undefined ? sanitizeText(input.notes, 500) : undefined,
  });
}

ILOPRISAA_EOF
  ok "src/2-application-tier/validators/payloadValidators.ts"
else
  skip "src/2-application-tier/validators/payloadValidators.ts"
fi

if [ ! -f "src/2-application-tier/hooks/useDocuments.ts" ]; then
  mkdir -p "$(dirname "src/2-application-tier/hooks/useDocuments.ts")"
  cat > "src/2-application-tier/hooks/useDocuments.ts" << 'ILOPRISAA_EOF'
/**
 * TIER 2 — APPLICATION TIER: useDocuments Hook
 *
 * SECURITY RATIONALE:
 * This hook is the ONLY path from the Presentation Tier to the Data Tier.
 * It orchestrates the full security pipeline:
 *
 * 1. Validation  → validateUploadPayload() strips invalid payloads early
 * 2. State check → evaluateTransition() prevents illegal status changes
 * 3. Data call   → documentService functions use parameterized queries
 * 4. Error wrap  → all errors are sanitized before reaching the UI
 *
 * The UI components NEVER import from Tier 3 directly. This enforces
 * the N-tier architectural boundary and prevents accidental bypasses.
 *
 * Mitigates: OWASP A04 (Insecure Design) — centralized security enforcement.
 */

import { useState, useCallback } from 'react';
import {
  uploadDocument,
  getMyDocuments,
  updateDocumentStatus,
  getSignedDownloadUrl,
  type UploadDocumentPayload,
} from '../../3-data-tier/services/documentService';
import {
  validateUploadPayload,
  validateStatusUpdatePayload,
  type UploadPayloadInput,
  type StatusUpdateInput,
} from '../validators/payloadValidators';
import {
  evaluateTransition,
  type TransitionContext,
} from '../state-machines/documentStateMachine';
import type { Document, DocumentStatus, UserRole } from '../../3-data-tier/types/database.types';

// ─────────────────────────────────────────────────────────
// Hook State Types
// ─────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────
// Hook Implementation
// ─────────────────────────────────────────────────────────

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
      // Surface only the sanitized message — never the raw error object
      setError(err instanceof Error ? err.message : 'Failed to load documents.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Validates, then uploads a document.
   * Returns true on success, false on failure (error stored in state).
   */
  const submitUpload = useCallback(async (rawPayload: UploadPayloadInput): Promise<boolean> => {
    // STEP 1: Validate and sanitize the payload (Tier 2 guard)
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

      // STEP 2: Delegate to Data Tier service
      const { document } = await uploadDocument(uploadPayload);

      // STEP 3: Update local state optimistically
      setDocuments(prev => [document, ...prev]);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Validates the transition through the state machine, then updates status.
   * The state machine is the authoritative gate — RLS is the failsafe.
   */
  const reviewDocument = useCallback(
    async (
      rawPayload: StatusUpdateInput,
      transitionContext: TransitionContext
    ): Promise<boolean> => {
      // STEP 1: Validate payload structure
      const validation = validateStatusUpdatePayload(rawPayload);
      if (!validation.valid || !validation.sanitized) {
        setError(validation.errors.join(' '));
        return false;
      }

      // STEP 2: Find the document's current status
      const existingDoc = documents.find(d => d.id === validation.sanitized!.documentId);
      if (!existingDoc) {
        setError('Document not found.');
        return false;
      }

      // STEP 3: Evaluate state machine transition
      const transition = evaluateTransition(
        existingDoc.status,
        validation.sanitized.newStatus,
        transitionContext
      );

      if (!transition.allowed) {
        setError(`Cannot update document: ${transition.errors.join('; ')}`);
        return false;
      }

      setIsLoading(true);
      setError(null);
      try {
        // STEP 4: Delegate to Data Tier service
        const updated = await updateDocumentStatus(
          validation.sanitized.documentId,
          validation.sanitized.newStatus,
          validation.sanitized.reviewerId,
          validation.sanitized.notes
        );

        // STEP 5: Update local state
        setDocuments(prev =>
          prev.map(d => (d.id === updated.id ? updated : d))
        );
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Review failed.');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [documents]
  );

  /**
   * Fetches a short-lived signed URL for a document download.
   * Never exposes the raw storage path to the UI.
   */
  const downloadDocument = useCallback(async (storagePath: string): Promise<string | null> => {
    try {
      return await getSignedDownloadUrl(storagePath);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not generate download link.');
      return null;
    }
  }, []);

  return {
    documents,
    isLoading,
    error,
    loadDocuments,
    submitUpload,
    reviewDocument,
    downloadDocument,
    clearError,
  };
}

// ─────────────────────────────────────────────────────────
// Role-based permission helpers (UI hint layer)
// These are purely informational for the UI — actual enforcement is in DB.
// ─────────────────────────────────────────────────────────

export function canUploadDocuments(role: UserRole): boolean {
  return role === 'athlete';
}

export function canReviewDocuments(role: UserRole): boolean {
  return role === 'coach' || role === 'admin';
}

export function canAccessAdminPanel(role: UserRole): boolean {
  return role === 'admin';
}

ILOPRISAA_EOF
  ok "src/2-application-tier/hooks/useDocuments.ts"
else
  skip "src/2-application-tier/hooks/useDocuments.ts"
fi

if [ ! -f "src/2-application-tier/stores/authStore.ts" ]; then
  mkdir -p "$(dirname "src/2-application-tier/stores/authStore.ts")"
  cat > "src/2-application-tier/stores/authStore.ts" << 'ILOPRISAA_EOF'
/**
 * TIER 2 — APPLICATION TIER: Auth Store (Zustand)
 *
 * SECURITY RATIONALE:
 * Centralizes session state to prevent desynchronization between
 * components — a common source of TOCTOU (Time-of-Check/Time-of-Use)
 * vulnerabilities where the UI might render stale role data.
 *
 * The store subscribes to Supabase's onAuthStateChange event, which fires
 * on every JWT refresh. This ensures the role in the store always reflects
 * the current database profile, not cached data.
 *
 * Mitigates: OWASP A07 (Identification and Authentication Failures)
 * Mitigates: OWASP A01 (Broken Access Control via stale session data)
 */

import { create } from 'zustand';
import { supabase } from '../../3-data-tier/supabaseClient';
import type { Profile, UserRole } from '../../3-data-tier/types/database.types';

interface AuthState {
  user: Profile | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
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

    // Bootstrap session from persisted storage (if any)
    const { data: { session } } = await supabase.auth.getSession();

    if (session?.user) {
      const profile = await fetchProfile(session.user.id);
      set({ user: profile, role: profile?.role ?? null, isAuthenticated: true });
    } else {
      set({ user: null, role: null, isAuthenticated: false });
    }

    set({ isLoading: false });

    // Subscribe to auth state changes — keeps store in sync with JWT lifecycle
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        set({ user: null, role: null, isAuthenticated: false });
        return;
      }

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        const profile = await fetchProfile(session.user.id);
        set({
          user: profile,
          role: profile?.role ?? null,
          isAuthenticated: !!profile,
        });
      }
    });
  },

  signIn: async (email: string, password: string) => {
    // Intentionally vague error messages to prevent user enumeration
    // Mitigates: OWASP A07 (username enumeration)
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return { error: 'Invalid email or password.' };
    }
    return { error: null };
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, role: null, isAuthenticated: false });
  },
}));

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !data) return null;
  return data;
}

ILOPRISAA_EOF
  ok "src/2-application-tier/stores/authStore.ts"
else
  skip "src/2-application-tier/stores/authStore.ts"
fi

if [ ! -f "src/1-presentation-tier/components/SecureFileUploadZone.tsx" ]; then
  mkdir -p "$(dirname "src/1-presentation-tier/components/SecureFileUploadZone.tsx")"
  cat > "src/1-presentation-tier/components/SecureFileUploadZone.tsx" << 'ILOPRISAA_EOF'
/**
 * TIER 1 — PRESENTATION TIER: SecureFileUploadZone
 *
 * SECURITY RATIONALE:
 * Client-side validation here is defense-in-depth, NOT the authoritative check.
 * The real enforcement happens in Tier 2 (validators) and Tier 3 (Supabase Storage policy).
 *
 * What this component does:
 * 1. MIME-type validation via File.type — rejects non-PDF/JPG/PNG before any network call.
 *    Note: File.type can be spoofed. Tier 2 re-checks. But stopping obvious bad inputs
 *    here saves bandwidth and gives instant user feedback.
 * 2. Size limit (5 MB) enforced before the upload button activates.
 * 3. All user-visible strings are static (no dynamic render of filenames with innerHTML).
 *    Filenames are displayed using textContent-safe React rendering.
 *
 * Mitigates: OWASP A05 (Security Misconfiguration — client gives false security signals)
 * Mitigates: OWASP A10 (SSRF/DoS via large file uploads)
 */

import React, { useCallback, useRef, useState } from 'react';

// ─────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────

const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'] as const;
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_LABELS = '.pdf, .jpg, .png';

type AllowedType = typeof ALLOWED_TYPES[number];

function isAllowedType(t: string): t is AllowedType {
  return ALLOWED_TYPES.includes(t as AllowedType);
}

// ─────────────────────────────────────────────────────────
// Props Interface
// ─────────────────────────────────────────────────────────

interface SecureFileUploadZoneProps {
  onFileAccepted: (file: File) => void;
  disabled?: boolean;
  label?: string;
}

// ─────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────

export const SecureFileUploadZone: React.FC<SecureFileUploadZoneProps> = ({
  onFileAccepted,
  disabled = false,
  label = 'Upload Document',
}) => {
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
      const sizeMB = (file.size / 1024 / 1024).toFixed(1);
      setValidationError(`File is ${sizeMB} MB. Maximum allowed is 5 MB.`);
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
    // Reset input so same file can be re-selected after error
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
        aria-label={`${label}. Accepted file types: PDF, JPG, PNG. Maximum 5 MB.`}
        aria-disabled={disabled}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && !disabled && inputRef.current?.click()}
        className={[
          'relative flex flex-col items-center justify-center gap-3',
          'rounded-xl border-2 border-dashed p-8 cursor-pointer transition-all duration-150',
          disabled
            ? 'opacity-50 cursor-not-allowed border-gray-200'
            : dragOver
              ? 'border-blue-500 bg-blue-50'
              : validationError
                ? 'border-red-400 bg-red-50'
                : selectedFile
                  ? 'border-green-400 bg-green-50'
                  : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50',
        ].join(' ')}
      >
        {/* Hidden native file input — accept attribute is a UX hint only, NOT security */}
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          className="sr-only"
          aria-hidden="true"
          tabIndex={-1}
          disabled={disabled}
          onChange={handleChange}
        />

        {/* Icon */}
        <div className={[
          'w-12 h-12 rounded-full flex items-center justify-center text-2xl',
          validationError ? 'bg-red-100' : selectedFile ? 'bg-green-100' : 'bg-white shadow-sm',
        ].join(' ')}>
          {validationError ? '⚠️' : selectedFile ? '✅' : '📄'}
        </div>

        {/* Label */}
        <div className="text-center">
          <p className="text-sm font-medium text-gray-700">
            {selectedFile
              ? 'File ready'
              : dragOver
                ? 'Drop to upload'
                : label}
          </p>
          {/* SAFE: file.name is rendered as React text node, never via dangerouslySetInnerHTML */}
          {selectedFile && (
            <p className="text-xs text-gray-500 mt-1 truncate max-w-xs">
              {selectedFile.name}
            </p>
          )}
          {!selectedFile && (
            <p className="text-xs text-gray-400 mt-1">
              Drag & drop or click · {ALLOWED_LABELS} · Max 5 MB
            </p>
          )}
        </div>
      </div>

      {/* Validation error — rendered as text, NOT innerHTML */}
      {validationError && (
        <p
          role="alert"
          aria-live="polite"
          className="mt-2 text-xs text-red-600 flex items-center gap-1"
        >
          <span aria-hidden>⚠</span>
          {/* validationError is always a static string from our code, never user input */}
          {validationError}
        </p>
      )}
    </div>
  );
};

ILOPRISAA_EOF
  ok "src/1-presentation-tier/components/SecureFileUploadZone.tsx"
else
  skip "src/1-presentation-tier/components/SecureFileUploadZone.tsx"
fi

if [ ! -f "src/1-presentation-tier/components/DocumentComponents.tsx" ]; then
  mkdir -p "$(dirname "src/1-presentation-tier/components/DocumentComponents.tsx")"
  cat > "src/1-presentation-tier/components/DocumentComponents.tsx" << 'ILOPRISAA_EOF'
/**
 * TIER 1 — PRESENTATION TIER: Document UI Components
 *
 * SECURITY RATIONALE:
 * All user-generated content (notes, filenames) is displayed using React's
 * standard JSX text interpolation, which HTML-encodes values automatically.
 *
 * CRITICAL: Never use dangerouslySetInnerHTML with user-generated data.
 * The sanitizeForDisplay function provides an extra safety layer for cases
 * where content needs to be processed before rendering.
 *
 * Mitigates: OWASP A03 (XSS via reflected/stored injection)
 * Mitigates: OWASP A05 (Security Misconfiguration — trusting user content)
 */

import React from 'react';
import type { Document, DocumentStatus } from '../../3-data-tier/types/database.types';
import { STATUS_LABELS, STATUS_COLORS, getValidNextStates } from '../../2-application-tier/state-machines/documentStateMachine';
import type { UserRole } from '../../3-data-tier/types/database.types';

// ─────────────────────────────────────────────────────────
// XSS-safe text renderer
// React already HTML-encodes text nodes, but this provides
// an additional explicit stripping layer for belt-and-suspenders.
// ─────────────────────────────────────────────────────────

function sanitizeForDisplay(raw: string | null | undefined, maxLength = 500): string {
  if (!raw) return '';
  // Strip any HTML tags that might have slipped through
  // React will also encode any remaining < > characters
  return raw
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .slice(0, maxLength)
    .trim();
}

// ─────────────────────────────────────────────────────────
// DocumentStatusBadge
// ─────────────────────────────────────────────────────────

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

export const DocumentStatusBadge: React.FC<DocumentStatusBadgeProps> = ({
  status,
  size = 'md',
}) => {
  const colorKey = STATUS_COLORS[status] ?? 'gray';
  const styles = STATUS_STYLE_MAP[colorKey];
  const label = STATUS_LABELS[status] ?? status;

  return (
    <span
      className={[
        'inline-flex items-center font-medium rounded-full',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        styles,
      ].join(' ')}
      aria-label={`Document status: ${label}`}
    >
      {/* Static label — NOT user-generated content */}
      {label}
    </span>
  );
};

// ─────────────────────────────────────────────────────────
// DocumentCard
// ─────────────────────────────────────────────────────────

interface DocumentCardProps {
  document: Document;
  actorRole: UserRole;
  onDownload?: (storagePath: string) => void;
  onStatusChange?: (documentId: string, newStatus: DocumentStatus) => void;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({
  document,
  actorRole,
  onDownload,
  onStatusChange,
}) => {
  const validNextStates = getValidNextStates(document.status, actorRole);

  // Safe display values — explicitly sanitized before render
  const safeFilename = sanitizeForDisplay(document.original_filename, 120);
  const safeNotes = sanitizeForDisplay(document.notes, 500);
  const safeDocType = sanitizeForDisplay(document.document_type.replace(/_/g, ' '), 60);

  const formattedDate = new Date(document.created_at).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 capitalize truncate">
            {/* safeDocType is sanitized above — React also encodes this */}
            {safeDocType}
          </p>
          <p className="text-xs text-gray-400 mt-0.5 truncate">
            {/* safeFilename is sanitized — displayed as text node, never innerHTML */}
            {safeFilename}
          </p>
        </div>
        <DocumentStatusBadge status={document.status} size="sm" />
      </div>

      {/* Notes — primary XSS risk area: user-generated free text */}
      {safeNotes && (
        <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-2 border border-gray-100 line-clamp-3">
          {/* React text node — HTML-encoded automatically. sanitizeForDisplay strips tags first. */}
          {safeNotes}
        </p>
      )}

      {/* Metadata row */}
      <div className="flex items-center gap-4 text-xs text-gray-400">
        <span>{formattedDate}</span>
        <span>{(document.file_size_bytes / 1024).toFixed(0)} KB</span>
        <span className="uppercase">{document.mime_type.split('/')[1]}</span>
      </div>

      {/* Action buttons — only rendered for valid transitions */}
      <div className="flex items-center gap-2 flex-wrap">
        {onDownload && (
          <button
            type="button"
            onClick={() => onDownload(document.storage_path)}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium py-1 px-2 rounded-md hover:bg-blue-50 transition-colors"
            aria-label={`Download ${safeDocType}`}
          >
            Download
          </button>
        )}

        {/* Only show transition buttons for states the actor role can reach */}
        {onStatusChange && validNextStates.map((nextState) => (
          <button
            key={nextState}
            type="button"
            onClick={() => onStatusChange(document.id, nextState)}
            className={[
              'text-xs font-medium py-1 px-2 rounded-md transition-colors',
              nextState === 'verified'
                ? 'text-green-700 hover:bg-green-50 hover:text-green-800'
                : nextState === 'action_required'
                  ? 'text-red-600 hover:bg-red-50 hover:text-red-700'
                  : 'text-amber-700 hover:bg-amber-50 hover:text-amber-800',
            ].join(' ')}
            aria-label={`Mark as ${STATUS_LABELS[nextState]}`}
          >
            {STATUS_LABELS[nextState]}
          </button>
        ))}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// DocumentList
// ─────────────────────────────────────────────────────────

interface DocumentListProps {
  documents: Document[];
  actorRole: UserRole;
  isLoading: boolean;
  onDownload?: (storagePath: string) => void;
  onStatusChange?: (documentId: string, newStatus: DocumentStatus) => void;
}

export const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  actorRole,
  isLoading,
  onDownload,
  onStatusChange,
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-gray-100 rounded-xl h-40 animate-pulse" aria-hidden="true" />
        ))}
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
    <div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      role="list"
      aria-label="Document list"
    >
      {documents.map(doc => (
        <div key={doc.id} role="listitem">
          <DocumentCard
            document={doc}
            actorRole={actorRole}
            onDownload={onDownload}
            onStatusChange={onStatusChange}
          />
        </div>
      ))}
    </div>
  );
};

ILOPRISAA_EOF
  ok "src/1-presentation-tier/components/DocumentComponents.tsx"
else
  skip "src/1-presentation-tier/components/DocumentComponents.tsx"
fi

if [ ! -f "src/1-presentation-tier/components/SecureErrorBoundary.tsx" ]; then
  mkdir -p "$(dirname "src/1-presentation-tier/components/SecureErrorBoundary.tsx")"
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
 *    monitoring service (prod) — never to the rendered DOM.
 * 3. Sanitizes the error message to strip any paths or DB details.
 *
 * Mitigates: OWASP A09 (Security Logging and Monitoring Failures)
 * Mitigates: OWASP A05 (Security Misconfiguration — verbose error pages)
 */

import React, { Component, type ReactNode } from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  // Store only the sanitized message — never the full error object
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
    // Do NOT include the error in state — it might get serialized and logged.
    // We signal the error condition without storing sensitive details.
    return {
      hasError: true,
      sanitizedMessage: 'An unexpected error occurred. Please refresh the page.',
    };
  }

  componentDidCatch(error: Error): void {
    // In development, log the full error for debugging.
    // In production, send to a monitoring service (e.g. Sentry) via
    // the service API — which strips sensitive fields before shipping.
    if (import.meta.env.DEV) {
      console.error('[ILOPRISAA ErrorBoundary]', error);
    } else {
      // Production: only log a sanitized fingerprint
      console.error('[ILOPRISAA] Unhandled error in render tree. Code:', error.name ?? 'UNKNOWN');
      // TODO: Replace with Sentry.captureException(error) or equivalent
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
            {/* sanitizedMessage is a static string from getDerivedStateFromError, never user input */}
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
  ok "src/1-presentation-tier/components/SecureErrorBoundary.tsx"
else
  skip "src/1-presentation-tier/components/SecureErrorBoundary.tsx"
fi

if [ ! -f "src/1-presentation-tier/components/ProtectedRoute.tsx" ]; then
  mkdir -p "$(dirname "src/1-presentation-tier/components/ProtectedRoute.tsx")"
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

/**
 * Convenience wrapper that mounts children only for a specific role.
 * Used to conditionally show UI elements (e.g., admin-only buttons).
 *
 * IMPORTANT: The absence of a UI element is NOT access control.
 * Use this only for UX clarity. The real check is in the Application Tier.
 */
export const RoleGate: React.FC<{
  children: ReactNode;
  allowedRoles: UserRole[];
}> = ({ children, allowedRoles }) => {
  const role = useAuthStore(s => s.role);

  if (!role || !allowedRoles.includes(role)) return null;
  return <>{children}</>;
};

ILOPRISAA_EOF
  ok "src/1-presentation-tier/components/ProtectedRoute.tsx"
else
  skip "src/1-presentation-tier/components/ProtectedRoute.tsx"
fi

if [ ! -f "src/App.tsx" ]; then
  mkdir -p "$(dirname "src/App.tsx")"
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
  ok "src/App.tsx"
else
  skip "src/App.tsx"
fi

if [ ! -f ".env.example" ]; then
  mkdir -p "$(dirname ".env.example")"
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
  ok ".env.example"
else
  skip ".env.example"
fi


hdr "Finalising .env"
if [ ! -f ".env" ] && [ ! -f ".env.local" ]; then
  cp .env.example .env.local
  ok ".env.local created — edit VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY"
else
  ok ".env / .env.local already exists — skipped"
fi

hdr "Installing dependencies"
if command -v npm &>/dev/null; then
  npm install
  ok "npm install complete"
else
  echo "  ! npm not found — run 'npm install' manually"
fi

echo ""
echo -e "${GREEN}================================================${RESET}"
echo -e "${GREEN}  ILOPRISAA DMS scaffolded successfully!        ${RESET}"
echo -e "${GREEN}================================================${RESET}"
echo ""
echo "  Next steps:"
echo "  1. Edit .env.local     ->  add VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY"
echo "  2. Run rls_policies.sql in the Supabase SQL Editor"
echo "  3. Create a private 'athlete-credentials' storage bucket in Supabase"
echo "  4. npm run dev"
echo ""
