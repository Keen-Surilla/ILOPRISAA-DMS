import type { SupabaseClient } from '@supabase/supabase-js';

export type DocumentStatus = 'draft' | 'pending_review' | 'verified' | 'action_required' | 'expired';

const ALLOWED_TRANSITIONS: Record<DocumentStatus, DocumentStatus[]> = {
  draft: ['pending_review'],
  pending_review: ['verified', 'action_required'],
  action_required: ['pending_review'],
  verified: ['expired'],
  expired: [],
};

export function isTransitionAllowed(from: DocumentStatus, to: DocumentStatus): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

export class IllegalTransitionError extends Error {
  constructor(from: DocumentStatus, to: DocumentStatus) {
    super(`Illegal document status transition: ${from} -> ${to}`);
    this.name = 'IllegalTransitionError';
  }
}

interface TransitionParams {
  documentId: string;
  from: DocumentStatus;
  to: DocumentStatus;
  rejectionReason?: string;
  reviewerId?: string;
}

/**
 * Applies a document status transition through the same rules enforced by the
 * `trg_enforce_document_status_transition` trigger in Postgres. This client-side
 * check exists purely to fail fast with a friendly error before a round trip —
 * the trigger is the real guarantee and cannot be bypassed by a client bug.
 */
export async function transitionDocumentStatus(
  supabase: SupabaseClient,
  { documentId, from, to, rejectionReason, reviewerId }: TransitionParams
) {
  if (!isTransitionAllowed(from, to)) {
    throw new IllegalTransitionError(from, to);
  }

  if (to === 'action_required' && !rejectionReason?.trim()) {
    throw new Error('A rejection reason is required to mark a document action_required.');
  }

  const payload: Record<string, unknown> = {
    status: to,
    updated_at: new Date().toISOString(),
  };

  if (to === 'action_required') {
    payload.rejection_reason = rejectionReason;
  } else if (from === 'action_required' && to === 'pending_review') {
    payload.rejection_reason = null; // clear stale reason on resubmission
  }

  if (to === 'verified' || to === 'action_required') {
    payload.reviewed_by = reviewerId ?? null;
    payload.reviewed_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('documents')
    .update(payload)
    .eq('id', documentId)
    .eq('status', from) // optimistic guard: only apply if still in the expected state
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to transition document status: ${error.message}`);
  }

  return data;
}