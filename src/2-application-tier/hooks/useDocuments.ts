/**
 * TIER 2 — APPLICATION TIER: useDocuments Hook
 */

import { useState, useCallback } from 'react';
import { uploadDocument, getMyDocuments, updateDocumentStatus, getSignedDownloadUrl, type UploadDocumentPayload } from '../../3-data-tier/services/documentService';
import { validateUploadPayload, validateStatusUpdatePayload, type UploadPayloadInput, type StatusUpdateInput } from '../validators/payloadValidators';
import { evaluateTransition, type TransitionContext } from '../state-machines/documentStateMachine';
import type { Document, UserRole } from '../../3-data-tier/types/database.types';

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
export function canReviewDocuments(role: UserRole): boolean {
  return role === 'coach' || role === 'admin' || role === 'committee';
}
export function canManageEvents(role: UserRole): boolean { return role === 'committee' || role === 'admin'; }
export function canAccessAdminPanel(role: UserRole): boolean { return role === 'admin'; }
