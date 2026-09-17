import { supabase } from '../config/SupabaseClient';
import { canonicalizeInstitutionName } from '../constant/schools';
import type { Invite, InviteRole } from '../types/database.types.extras';

export type InviteRow = Invite;
export type { InviteRole };

// Authorization enforced at database level via RLS
export async function createInvite(
  email: string,
  role: InviteRole,
  invitedBy: string,
  institutionId?: string | null,
  fullName?: string | null,
  ttlHours?: number
): Promise<InviteRow> {
  const expiresAt = ttlHours
    ? new Date(Date.now() + ttlHours * 60 * 60 * 1000).toISOString()
    : undefined; // falls back to the DB column default (7 days) if not provided

  const { data, error } = await supabase
    .from('invites')
    .insert({
      email: email.trim().toLowerCase(),
      role,
      invited_by: invitedBy,
      institution_id: canonicalizeInstitutionName(institutionId),
      full_name: fullName?.trim() || null,
      ...(expiresAt ? { expires_at: expiresAt } : {}),
    })
    .select('id, email, full_name, role, token, status, invited_by, institution_id, expires_at, created_at, accepted_at')
    .single();

  if (error) {
    console.error('Error creating invite:', error);
    if (error.code === '23505') {
      throw new Error('This email already has a pending invite. Revoke it first if you want to send a new one.');
    }
    throw new Error('Could not create the invite. Please try again.');
  }

  return data as InviteRow;
}

// Separate from createInvite so email failures don't rollback the invite record
export async function sendInviteEmail(token: string): Promise<void> {
  const { data, error } = await supabase.functions.invoke('send-invite-email', {
    body: { token },
  });

  if (error) {
    console.error('Error sending invite email:', error);
    throw new Error('Invite was created, but the email could not be sent.');
  }

  if (data?.error) {
    console.error('send-invite-email returned an error:', data.error);
    throw new Error(data.error);
  }
}

// Returns invites scoped by RLS policies
export async function listInvites(): Promise<InviteRow[]> {
  const { data, error } = await supabase
    .from('invites')
    .select('id, email, full_name, role, token, status, invited_by, institution_id, expires_at, created_at, accepted_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching invites:', error);
    throw new Error('Could not load invites. Please try again.');
  }

  return (data ?? []) as InviteRow[];
}

// Revokes pending invites; authorization enforced by RLS
export async function revokeInvite(inviteId: string): Promise<void> {
  const { error } = await supabase.rpc('revoke_invite', { p_invite_id: inviteId });

  if (error) {
    console.error('Error revoking invite:', error);
    throw new Error('Could not revoke the invite. Please try again.');
  }
}
