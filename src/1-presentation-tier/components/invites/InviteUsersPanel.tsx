import { useEffect, useState, type FormEvent, type ReactElement } from 'react';
import { Mail, XCircle, Clock, CheckCircle2, Ban, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../../2-application-tier/stores/authStore';
import {
  createInvite,
  sendInviteEmail,
  listInvites,
  revokeInvite,
  type InviteRow,
  type InviteRole,
} from '../../../3-data-tier/api/invitesApi';

interface RoleOption {
  value: InviteRole;
  label: string;
}

interface InviteUsersPanelProps {
  // Single option hides role select; multiple options show dropdown
  roleOptions: RoleOption[];
  // Forces invite to use current user's institution (enforced at RLS)
  useOwnInstitution?: boolean;
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700',
  accepted: 'bg-emerald-50 text-emerald-700',
  expired: 'bg-slate-100 text-slate-500',
  revoked: 'bg-red-50 text-red-600',
};

const STATUS_ICONS: Record<string, ReactElement> = {
  pending: <Clock className="w-3 h-3" />,
  accepted: <CheckCircle2 className="w-3 h-3" />,
  expired: <XCircle className="w-3 h-3" />,
  revoked: <Ban className="w-3 h-3" />,
};

const ROLE_LABELS: Record<string, string> = {
  school_admin: 'School Admin',
  admin: 'Admin',
  committee: 'Eligibility Committee',
  coach: 'Coach',
};

export function InviteUsersPanel({ roleOptions, useOwnInstitution }: InviteUsersPanelProps) {
  const { user } = useAuthStore();
  const [email, setEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<InviteRole>(roleOptions[0]?.value);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEmailPending, setIsEmailPending] = useState(false);
  const [invites, setInvites] = useState<InviteRow[]>([]);
  const [isLoadingInvites, setIsLoadingInvites] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const refreshInvites = async () => {
    setIsLoadingInvites(true);
    try {
      const rows = await listInvites();
      setInvites(rows);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoadingInvites(false);
    }
  };

  useEffect(() => {
    refreshInvites();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!user?.id) {
      setError('You must be logged in to send invites.');
      return;
    }

    const institutionId = useOwnInstitution ? (user as any)?.institution_id ?? null : null;

    if (useOwnInstitution && !institutionId) {
      setError('Your account has no school assigned, so a coach invite cannot be scoped correctly. Contact a super admin.');
      return;
    }

    setIsSubmitting(true);
    try {
      // DB insert only — this is the part worth waiting on.
      const invite = await createInvite(email, selectedRole, user.id, institutionId);
      setEmail('');
      await refreshInvites();
      setIsSubmitting(false); // unblock the form now; email send happens in the background

      // Email send is in flight; the button spinner reflects this now.
      setIsEmailPending(true);

      // Fire-and-forget: don't make the user wait on the SMTP round trip.
      sendInviteEmail(invite.token)
        .then(() => {
          setError(null);
          setSuccess(`Invite sent to ${invite.email}.`);
        })
        .catch((err: any) => {
          console.error(err);
          setSuccess(null);
          setError(`Invite for ${invite.email} was created, but the confirmation email failed to send.`);
        })
        .finally(() => {
          setIsEmailPending(false);
          refreshInvites();
        });
    } catch (err: any) {
      setError(err?.message || 'Could not create the invite. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleRevoke = async (inviteId: string) => {
    setRevokingId(inviteId);
    setError(null);
    try {
      await revokeInvite(inviteId);
      await refreshInvites();
    } catch (err: any) {
      setError(err?.message || 'Could not revoke the invite.');
    } finally {
      setRevokingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Mail className="w-4 h-4 text-blue-600" />
          Invite a New User
        </h3>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-xs font-medium">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-medium">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            className="flex-1 px-4 py-2 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition-all text-sm text-slate-800 placeholder-slate-400"
          />

          {roleOptions.length > 1 ? (
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as InviteRole)}
              className="px-4 py-2 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition-all text-sm text-slate-800"
            >
              {roleOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          ) : (
            <div className="px-4 py-2 rounded-xl bg-slate-50 text-sm text-slate-500 border border-slate-100 flex items-center whitespace-nowrap">
              {roleOptions[0]?.label}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-xl disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-md shadow-blue-600/10 active:scale-[0.99] whitespace-nowrap flex items-center justify-center gap-2"
          >
            {(isSubmitting || isEmailPending) && <Loader2 className="w-4 h-4 animate-spin" />}
            {isSubmitting ? 'Creating…' : isEmailPending ? 'Sending email…' : 'Send Invite'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-800">Sent Invites</h3>
        </div>

        {isLoadingInvites ? (
          <div className="p-8 text-center text-sm text-slate-400">Loading…</div>
        ) : invites.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400">No invites sent yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Role</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Sent</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {invites.map((invite) => (
                <tr key={invite.id} className="border-b border-slate-50 last:border-0">
                  <td className="px-6 py-3 text-slate-800">{invite.email}</td>
                  <td className="px-6 py-3 text-slate-600">{ROLE_LABELS[invite.role] ?? invite.role}</td>
                  <td className="px-6 py-3">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${STATUS_STYLES[invite.status]}`}>
                      {STATUS_ICONS[invite.status]}
                      {invite.status}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-slate-400 text-xs">
                    {new Date(invite.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-3 text-right">
                    {invite.status === 'pending' && (
                      <button
                        onClick={() => handleRevoke(invite.id)}
                        disabled={revokingId === invite.id}
                        className="text-xs font-medium text-red-500 hover:text-red-700 disabled:opacity-50 transition-colors"
                      >
                        {revokingId === invite.id ? 'Revoking…' : 'Revoke'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}