import { supabase } from '../config/SupabaseClient';
import type { Invite, InviteRole } from '../types/database.types.extras';

export type InviteRow = Invite;
export type { InviteRole };

// Authorization enforced at database level via RLS
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
    if (error.code === '23505') {
      throw new Error('This email already has a pending invite. Revoke it first if you want to send a new one.');
    }
    throw new Error('Could not create the invite. Please try again.');
  }

  return data as InviteRow;
}

// Separate from createInvite so email failures don't rollback the invite record
export async function sendInviteEmail(token: string): Promise<void> {
  try {
    const response = await supabase.functions.invoke('send-invite-email', {
      body: { token },
    });

    // Extract error details from response
    const { data, error } = response;

    if (error) {
      console.error('Error invoking send-invite-email function:', error);
      
      // Try to get more details from the error
      let errorDetails = error instanceof Error ? error.message : JSON.stringify(error);
      
      // If error has a context property with body, try to parse it
      if ((error as any)?.context?.body) {
        try {
          const bodyText = (error as any).context.body;
          const parsedBody = typeof bodyText === 'string' ? JSON.parse(bodyText) : bodyText;
          if (parsedBody?.error) {
            errorDetails = parsedBody.error;
          }
        } catch (parseErr) {
          // Fallback to original error
        }
      }
      
      throw new Error(`Email service error: ${errorDetails}`);
    }

    // supabase-js only auto-parses the body when the function response has
    // Content-Type: application/json. If that header is missing, `data`
    // arrives here as a raw string even though the function itself succeeded.
    let parsed = data;
    if (typeof parsed === 'string') {
      try {
        parsed = JSON.parse(parsed);
      } catch (parseErr) {
        console.error('send-invite-email returned a non-JSON string body:', parsed);
        throw new Error('Email service returned a malformed response');
      }
    }

    if (parsed?.error) {
      console.error('send-invite-email returned an error:', parsed.error);
      throw new Error(parsed.error);
    }

    if (!parsed?.success) {
      console.error('send-invite-email returned unexpected response:', parsed);
      throw new Error('Email service returned an unexpected response');
    }
  } catch (err) {
    console.error('Failed to send invite email:', err);
    throw new Error(
      err instanceof Error 
        ? `Invite was created, but the email could not be sent: ${err.message}`
        : 'Invite was created, but the email could not be sent.'
    );
  }
}

// Returns invites scoped by RLS policies
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

// Revokes pending invites; authorization enforced by RLS
export async function revokeInvite(inviteId: string): Promise<void> {
  const { error } = await supabase.rpc('revoke_invite', { p_invite_id: inviteId });

  if (error) {
    console.error('Error revoking invite:', error);
    throw new Error('Could not revoke the invite. Please try again.');
  }
}