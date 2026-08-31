import { supabase } from '../config/SupabaseClient';
import type { Invite, InviteRole } from '../types/database.types.extras';

export type InviteRow = Invite;
export type { InviteRole };

// Generate a random UUID v4 token for the invite
function generateInviteToken(): string {
  // Generate 16 random bytes (128 bits) for a UUID
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  
  // Set version 4 (random) - set the version bits
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  
  // Set variant bits
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  
  // Format as UUID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export async function createInvite(
  email: string,
  role: InviteRole,
  invitedBy: string,
  institutionId?: string | null
): Promise<InviteRow> {
  const token = generateInviteToken();

  const { data, error } = await supabase
    .from('invites')
    .insert({
      email: email.trim().toLowerCase(),
      role,
      invited_by: invitedBy,
      institution_id: institutionId ?? null,
      token,
    })
    .select('id, email, role, token, status, invited_by, institution_id, expires_at, created_at, accepted_at')
    .single();

  if (error) {
    console.error('Error creating invite:', error);
    throw new Error('Could not create the invite. Please try again.');
  }

  return data as InviteRow;
}

export async function sendInviteEmail(token: string): Promise<void> {
  try {
    const { data, error } = await supabase.functions.invoke('send-invite-email', {
      body: { token },
    });

    if (error) {
      console.error('Error sending invite email:', error);
      // Extract error message from the edge function response if available
      const errorMessage = error.message || 'Invite was created, but the email could not be sent. Please try resending it.';
      throw new Error(errorMessage);
    }

    if (data?.error) {
      console.error('send-invite-email returned an error:', data.error);
      throw new Error(data.error);
    }

    console.log('Invite email sent successfully');
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error('Invite was created, but the email could not be sent. Please try resending it.');
  }
}

// Returns the caller's own sent invites (or all invites, if the caller is
// super_admin) — scoping is enforced by the invites_select_own_or_super_admin
// RLS policy, not by this function, so no filtering happens here.
export async function listInvites(): Promise<InviteRow[]> {
  const { data, error } = await supabase
    .from('invites')
    .select('id, email, role, token, status, invited_by, institution_id, expires_at, created_at, accepted_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching invites:', error);
    throw new Error('Could not load invites. Please try again.');
  }

  return (data ?? []) as InviteRow[];
}

// Revokes a still-pending invite. Authorization (must be the inviter, or
// super_admin) and the pending-only guard are enforced inside the
// revoke_invite RPC, not here.
export async function revokeInvite(inviteId: string): Promise<void> {
  const { error } = await supabase.rpc('revoke_invite', { p_invite_id: inviteId });

  if (error) {
    console.error('Error revoking invite:', error);
    throw new Error('Could not revoke the invite. Please try again.');
  }
}