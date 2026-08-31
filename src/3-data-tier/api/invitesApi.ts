import { supabase } from '../config/SupabaseClient';
import type { Invite, InviteRole } from '../types/database.types.extras';

export type InviteRow = Invite;
export type { InviteRole };

// Authorization (which role may invite which target role) is enforced at
// the database level via RLS on `invites` — this function does not
// duplicate that check client-side. If the inviting user isn't allowed to
// grant the target role, the insert below will fail and the error from
// Supabase is surfaced as-is.
export async function createInvite(
  email: string,
  role: InviteRole,
  invitedBy: string,
  institutionId?: string | null
): Promise<InviteRow> {
  const { data, error } = await supabase
    .from('invites')
    .insert({
      email: email.trim().toLowerCase(),
      role,
      invited_by: invitedBy,
      institution_id: institutionId ?? null,
    })
    .select('id, email, role, token, status, invited_by, institution_id, expires_at, created_at, accepted_at')
    .single();

  if (error) {
    console.error('Error creating invite:', error);
    throw new Error('Could not create the invite. Please try again.');
  }

  return data as InviteRow;
}

// Triggers the actual invite email via the send-invite-email Edge Function.
// Call this after createInvite() succeeds, passing the returned row's token.
// Kept as a separate call (rather than folded into createInvite) so a failed
// email send doesn't roll back the invite record itself — the invite still
// exists and can be resent.
export async function sendInviteEmail(token: string): Promise<void> {
  const { data, error } = await supabase.functions.invoke('send-invite-email', {
    body: { token },
  });

  if (error) {
    console.error('Error sending invite email:', error);
    throw new Error('Invite was created, but the email could not be sent. Please try resending it.');
  }

  if (data?.error) {
    console.error('send-invite-email returned an error:', data.error);
    throw new Error(data.error);
  }
}