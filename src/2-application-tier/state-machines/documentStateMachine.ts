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
  ['pending_review→verified', { requiredRole: ['coach', 'admin', 'committee'], conditions: [{ name: 'has_reviewer', description: 'A reviewer must be assigned', validate: (ctx) => typeof ctx.reviewerId === 'string' && ctx.reviewerId.length > 0 }, { name: 'has_file_integrity', description: 'File digital signature must be present', validate: (ctx) => typeof ctx.digitalSignature === 'string' && ctx.digitalSignature.length === 64 }] }],
  ['pending_review→action_required', { requiredRole: ['coach', 'admin', 'committee'], conditions: [{ name: 'has_reviewer', description: 'A reviewer must be assigned', validate: (ctx) => typeof ctx.reviewerId === 'string' && ctx.reviewerId.length > 0 }] }],
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
