import { useEffect, useState, type FormEvent, type ReactElement } from 'react';
import { Ban, CheckCircle2, Clock, Loader2, Mail, XCircle } from 'lucide-react';
import { useAuthStore } from '../../../2-application-tier/stores/authStore';
import {
  createInvite,
  listInvites,
  revokeInvite,
  sendInviteEmail,
  type InviteRole,
  type InviteRow,
} from '../../../3-data-tier/api/invitesApi';

interface RoleOption {
  value: InviteRole;
  label: string;
}

interface InviteUsersPanelProps {
  roleOptions: RoleOption[];
  useOwnInstitution?: boolean;
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
  accepted: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
  expired: 'bg-slate-100 text-slate-500 dark:bg-[#151b2d] dark:text-[#94a3b8]',
  revoked: 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400',
};

const STATUS_ICONS: Record<string, ReactElement> = {
  pending: <Clock className="h-3 w-3" />,
  accepted: <CheckCircle2 className="h-3 w-3" />,
  expired: <XCircle className="h-3 w-3" />,
  revoked: <Ban className="h-3 w-3" />,
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
      setError('Your account has no school assigned. Contact a super admin.');
      return;
    }

    setIsSubmitting(true);
    try {
      const invite = await createInvite(email, selectedRole, user.id, institutionId);

      setIsSubmitting(false);
      setIsEmailPending(true);

      try {
        await sendInviteEmail(invite.token);
        setError(null);
        setSuccess(`Invite sent to ${invite.email}.`);
        setEmail('');
      } catch (emailErr: any) {
        console.error('Email send failed:', emailErr);
        await revokeInvite(invite.id);
        setSuccess(null);
        setError('Cannot send invite: This email is already registered to an existing account.');
      } finally {
        setIsEmailPending(false);
        await refreshInvites();
      }
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
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/[0.06] dark:bg-[#0f172a]">
        <h3 className="mb-4 flex items-center gap-2 text-[15px] font-semibold text-slate-900 dark:text-[#f8fafc]">
          <Mail className="h-4 w-4 text-blue-600 dark:text-[#adc6ff]" />
          Invite a New User
        </h3>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs font-medium text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            className="h-9 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 text-[13px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 dark:border-white/[0.06] dark:bg-[#151b2d] dark:text-[#f8fafc] dark:placeholder:text-[#64748b]"
          />

          {roleOptions.length > 1 ? (
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as InviteRole)}
              className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-[13px] text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 dark:border-white/[0.06] dark:bg-[#151b2d] dark:text-[#f8fafc]"
            >
              {roleOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ) : (
            <div className="flex h-9 items-center whitespace-nowrap rounded-lg border border-slate-200 bg-slate-50 px-3 text-[13px] text-slate-500 dark:border-white/[0.06] dark:bg-[#151b2d] dark:text-[#94a3b8]">
              {roleOptions[0]?.label}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-blue-600 px-5 text-[12px] font-bold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {(isSubmitting || isEmailPending) && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSubmitting ? 'Creating...' : isEmailPending ? 'Sending email...' : 'Send Invite'}
          </button>
        </form>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-white/[0.06] dark:bg-[#0f172a]">
        <div className="border-b border-slate-200 px-5 py-4 dark:border-white/[0.06]">
          <h3 className="text-[15px] font-semibold text-slate-900 dark:text-[#f8fafc]">Sent Invites</h3>
        </div>

        {isLoadingInvites ? (
          <div className="p-8 text-center text-[13px] text-slate-500 dark:text-[#94a3b8]">Loading...</div>
        ) : invites.length === 0 ? (
          <div className="p-8 text-center text-[13px] text-slate-500 dark:text-[#94a3b8]">No invites sent yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:border-white/[0.06] dark:text-[#64748b]">
                  <th className="px-5 py-3">Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Sent</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                {invites.map((invite) => (
                  <tr key={invite.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-[#151b2d]/70">
                    <td className="px-5 py-3 text-[13px] font-medium text-slate-900 dark:text-[#f8fafc]">{invite.email}</td>
                    <td className="px-4 py-3 text-[13px] text-slate-600 dark:text-[#94a3b8]">{ROLE_LABELS[invite.role] ?? invite.role}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-semibold capitalize ${STATUS_STYLES[invite.status]}`}>
                        {STATUS_ICONS[invite.status]}
                        {invite.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 dark:text-[#94a3b8]">
                      {new Date(invite.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {invite.status === 'pending' && (
                        <button
                          onClick={() => handleRevoke(invite.id)}
                          disabled={revokingId === invite.id}
                          className="text-xs font-medium text-red-500 transition-colors hover:text-red-700 disabled:opacity-50"
                        >
                          {revokingId === invite.id ? 'Revoking...' : 'Revoke'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
