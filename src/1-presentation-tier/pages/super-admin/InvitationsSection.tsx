import { useState, useEffect, useMemo } from 'react';
import { UserPlus, Clock3, Mail, Lock, Send, ChevronDown, Check, Search, Loader2, Calendar, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuthStore } from '../../../2-application-tier/stores/authStore';
import {
  createInvite,
  sendInviteEmail,
  listInvites,
  revokeInvite,
  type InviteRow,
  type InviteRole,
} from '../../../3-data-tier/api/invitesApi';
import { cx } from './sharedUi';
import { ILOPRISAA_SCHOOLS } from '../../../3-data-tier/constant/schools';
import { PremiumDateTimePicker } from '../../components/ui/PremiumDateTimePicker';

const ROLE_LABELS: Record<string, string> = {
  school_admin: 'School Admin',
  admin: 'Admin',
  committee: 'Eligibility Committee',
  coach: 'Coach',
};

/* ============================================================================
 * SEARCHABLE SELECT COMPONENT (For Institutions)
 * ========================================================================== */
function SearchableSelect({
  label,
  value,
  options,
  onChange,
  placeholder = "Type to search..."
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (val: string) => void;
  placeholder?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!isOpen) {
      const selected = options.find((o) => o.value === value);
      setSearchTerm(selected ? selected.label : "");
    }
  }, [value, options, isOpen]);

  const filteredOptions = options.filter((o) =>
    o.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative flex flex-col gap-2">
      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {label}
      </label>
      
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          onFocus={(e) => {
            setIsOpen(true);
            e.target.select(); 
          }}
          onClick={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full cursor-text rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-10 text-sm font-medium text-slate-950 transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700/80 dark:bg-[#0b1220]/50 dark:text-white dark:placeholder:text-slate-500"
        />
        <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
          <ChevronDown className={cx("h-4 w-4 transition-transform duration-200", isOpen && "rotate-180")} />
        </div>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-[60]" onClick={() => setIsOpen(false)} />
      )}

      {isOpen && (
        <div className="absolute left-0 top-[calc(100%+8px)] z-[70] w-full animate-in fade-in zoom-in-95 duration-100">
          <div className="settings-scrollbar max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-700 dark:bg-[#0f172a]">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={cx(
                    "flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                    value === option.value
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 font-bold"
                      : "text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/50"
                  )}
                >
                  <span className="truncate pr-2">{option.label}</span>
                  {value === option.value && <Check className="h-4 w-4 shrink-0" />}
                </button>
              ))
            ) : (
              <div className="px-3 py-4 text-center text-sm text-slate-500 dark:text-slate-400">
                No institutions found.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================================
 * STANDARD SELECT COMPONENT (For Roles & TTL)
 * ========================================================================== */
function PremiumSelect({
  label,
  value,
  options,
  onChange,
  placeholder = 'Select...',
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (val: string) => void;
  placeholder?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedLabel = options.find((o) => o.value === value)?.label || placeholder;

  return (
    <div className="relative flex flex-col gap-2">
      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {label}
      </label>
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-950 transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700/80 dark:bg-[#0b1220]/50 dark:text-white"
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown className={cx("h-4 w-4 text-slate-400 transition-transform duration-200", isOpen && "rotate-180")} />
      </button>

      {isOpen && <div className="fixed inset-0 z-[60]" onClick={() => setIsOpen(false)} />}

      {isOpen && (
        <div className="absolute left-0 top-[calc(100%+8px)] z-[70] w-full animate-in fade-in zoom-in-95 duration-100">
          <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-700 dark:bg-[#0f172a] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300 dark:[&::-webkit-scrollbar-thumb]:bg-slate-600">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={cx(
                  "flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                  value === option.value
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 font-bold"
                    : "text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/50"
                )}
              >
                <span className="truncate pr-2">{option.label}</span>
                {value === option.value && <Check className="h-4 w-4 shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================================
 * MAIN INVITATIONS COMPONENT
 * ========================================================================== */
// Same neutral grey scrollbar used in SettingsView.tsx, applied here to the
// Target Institution dropdown only, per request.
const scrollbarStyles = `
  .settings-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: #cbd5e1 transparent;
  }
  .settings-scrollbar::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  .settings-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .settings-scrollbar::-webkit-scrollbar-thumb {
    background-color: #cbd5e1;
    border-radius: 9999px;
    border: 2px solid transparent;
    background-clip: padding-box;
  }
  .settings-scrollbar::-webkit-scrollbar-thumb:hover {
    background-color: #94a3b8;
  }
  .dark .settings-scrollbar {
    scrollbar-color: #475569 transparent;
  }
  .dark .settings-scrollbar::-webkit-scrollbar-thumb {
    background-color: #475569;
  }
  .dark .settings-scrollbar::-webkit-scrollbar-thumb:hover {
    background-color: #64748b;
  }
`;

export function InvitationsSection({ toast }: { toast: (msg: string) => void }) {
  const { user } = useAuthStore();
  const [invites, setInvites] = useState<InviteRow[]>([]);
  const [isLoadingInvites, setIsLoadingInvites] = useState(true);
  const [now, setNow] = useState(Date.now());

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<InviteRole | ''>('');
  const [institution, setInstitution] = useState('');
  const [ttl, setTtl] = useState('72');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEmailPending, setIsEmailPending] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  // Filters & Pagination State
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const schoolOptions = ILOPRISAA_SCHOOLS.map(school => ({
    value: school.name,
    label: school.name
  }));

  const refreshInvites = async () => {
    setIsLoadingInvites(true);
    try {
      const rows = await listInvites();
      setInvites(rows);
    } catch (err: any) {
      console.error(err);
      toast('Failed to load active invitations.');
    } finally {
      setIsLoadingInvites(false);
    }
  };

  useEffect(() => {
    refreshInvites();
    const id = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(id);
  }, []);

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id) {
      toast('You must be logged in to send invites.');
      return;
    }

    if (!role) {
      toast('Please select a role before sending the invite.');
      return;
    }

    if (!institution) {
      toast('Please select a target institution before sending the invite.');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const invite = await createInvite(email, role, user.id, institution, fullName, Number(ttl));

      setFullName('');
      setEmail('');
      setRole('');
      setInstitution('');
      await refreshInvites();
      setIsSubmitting(false);
      setIsEmailPending(true);

      sendInviteEmail(invite.token)
        .then(() => {
          toast(`Invitation dispatched to ${invite.email} via Gmail SMTP.`);
        })
        .catch((emailErr: any) => {
          console.error("Email send failed:", emailErr);
          toast(emailErr?.message || `Invite for ${invite.email} was created, but the email failed to send.`);
        })
        .finally(() => {
          setIsEmailPending(false);
          refreshInvites();
        });

    } catch (err: any) {
      toast(err?.message || 'Could not create the invite. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleRevoke = async (inviteId: string) => {
    if (!window.confirm('Revoke this invitation? The recipient link will stop working immediately.')) return;
    setRevokingId(inviteId);
    try {
      await revokeInvite(inviteId);
      toast('Invitation successfully revoked. Token burned.');
      await refreshInvites();
    } catch (err: any) {
      toast(err?.message || 'Could not revoke the invite.');
    } finally {
      setRevokingId(null);
    }
  };

  function handleCopyUrl(token: string) {
    const url = `${window.location.origin}/auth/claim?token=${token}`;
    navigator.clipboard.writeText(url).then(() => toast('Secure claim nonce copied to clipboard.'));
  }

  // Clear date handler with explicit confirmation prompt
  const handleClearDateFilter = () => {
    if (!selectedDate) return;
    if (window.confirm('Are you sure you want to clear the selected date filter?')) {
      setSelectedDate('');
      setCurrentPage(1);
      toast('Date filter cleared.');
    }
  };

  // Filter and Pagination computation
  const filteredInvites = useMemo(() => {
    if (!selectedDate) return invites;
    // selectedDate comes back as a full local ISO string (e.g. "2026-09-05T00:00:00")
    // from the picker — take just the date part, and compare against each invite's
    // created_at using local calendar date (not UTC) to avoid timezone off-by-one.
    const selectedDateOnly = selectedDate.split('T')[0];
    return invites.filter((inv) => {
      const d = new Date(inv.created_at);
      const invDateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      return invDateStr === selectedDateOnly;
    });
  }, [invites, selectedDate]);

  const totalPages = Math.ceil(filteredInvites.length / itemsPerPage) || 1;
  const paginatedInvites = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredInvites.slice(start, start + itemsPerPage);
  }, [filteredInvites, currentPage]);

  const pendingCount = invites.filter(i => i.status === 'pending').length;

  // Local countdown calc — sharedUi.tsx wasn't available to confirm formatCountdown's
  // signature, so this is self-contained rather than guessing at an import that might
  // not match. Swap this for formatCountdown if you want the shared version instead.
  function getExpiryCountdown(expiresAt: string) {
    const diffMs = new Date(expiresAt).getTime() - now;
    if (diffMs <= 0) {
      return { text: 'Expired', urgent: true };
    }
    const totalSeconds = Math.floor(diffMs / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return {
      text: `${h}h ${m}m ${s}s`,
      urgent: h < 6,
    };
  }

  return (
    <div id="invitations" className="flex flex-col gap-8 scroll-mt-24 animate-in fade-in duration-500">
      <style>{scrollbarStyles}</style>
      
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
          <Mail className="h-3.5 w-3.5" />
           Google Workspace SMTP Dispatch
        </div>
        <h2 className="font-sora text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Account Invitations & Expiry Countdowns
        </h2>
        <p className="max-w-3xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          Issue single-use activation nonces to institutional mailboxes with real-time TTL expiration monitors.
        </p>
      </div>

      {/* Dispatch Console */}
      <div className="relative z-[15] rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700/60 dark:bg-[#0f172a]/80 dark:shadow-xl dark:backdrop-blur-sm">
        
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-6 sm:flex-row sm:items-start sm:p-8 dark:border-slate-700/60">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-slate-100 bg-slate-50 text-blue-600 shadow-inner dark:border-slate-700 dark:bg-slate-800/50 dark:text-blue-400">
              <UserPlus className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-sora text-lg font-bold text-slate-900 dark:text-white truncate">Account Invitation</h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 truncate">Strict zero-public signups.</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleDispatch} className="flex flex-col gap-6 p-6 sm:p-8">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Recipient Full Name</label>
              <input 
                type="text" 
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Atty. Ma. Victoria Chavez" 
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 placeholder:text-slate-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700/80 dark:bg-[#0b1220]/50 dark:text-white dark:placeholder:text-slate-600"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Institutional Google Workspace Email</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vchavez.law@cpu.edu.ph" 
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 placeholder:text-slate-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700/80 dark:bg-[#0b1220]/50 dark:text-white dark:placeholder:text-slate-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <PremiumSelect 
              label="Authority Role"
              value={role}
              onChange={(val) => setRole(val as InviteRole)}
              placeholder="Select role"
              options={[
                { value: 'school_admin', label: 'School Admin' },
                { value: 'committee', label: 'Committee Eligibility' },
              ]}
            />
            <SearchableSelect 
              label="Target Institution"
              value={institution}
              onChange={setInstitution}
              options={schoolOptions}
              placeholder="Type school name..."
            />

                 <PremiumSelect 
              label="Cryptographic Token TTL"
              value={ttl}
              onChange={setTtl}
              options={[
                { value: '72', label: '72 Hours (Standard Regional)' },
                { value: '48', label: '48 Hours (Expedited)' },
                { value: '24', label: '24 Hours (Urgent)' },
              ]}
            />

          </div>

          <div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <Lock className="h-4 w-4 text-emerald-600 dark:text-emerald-500" />
              Nonce auto-invalidates on first OAuth handshake or TTL expiry
            </div>
            <button 
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-8 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-blue-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70 dark:shadow-[0_0_20px_rgba(37,99,235,0.4)]"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSubmitting ? 'Creating…' : 'Send Gmail Invitation'}
              {!isSubmitting && <Send className="h-4 w-4" />}
            </button>
          </div>
        </form>
      </div>

      {/* Active Invitations Table */}
      <div className="relative z-10 flex flex-col gap-6 rounded-2xl border border-slate-200 bg-white/50 p-6 shadow-sm backdrop-blur-sm sm:p-8 dark:border-slate-700/60 dark:bg-[#0f172a]/40">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h3 className="font-sora text-lg font-bold text-slate-900 dark:text-white">Active Dispatch Logs</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Expired or revoked nonces are permanently purged from the auth gate.</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            {/* Premium Date Picker & Always-Visible Grey-to-Red Clear Button */}
<PremiumDateTimePicker
  label="Filter Date"
  value={selectedDate}
  onChange={(iso) => {
    setSelectedDate(iso);
    setCurrentPage(1);
  }}
  placeholder="MM/DD/YY"
  showTime={false} 
/>
 <button
    type="button"
    onClick={() => {
      if (!selectedDate) return;
      if (window.confirm('Are you sure you want to clear the selected date filter?')) {
        setSelectedDate('');
        setCurrentPage(1);
        toast('Date filter cleared.');
      }
    }}
    disabled={!selectedDate}
    className={cx(
      "flex items-center gap-1 rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all",
      !selectedDate
        ? "text-slate-400 cursor-not-allowed dark:text-slate-600"
        : "text-slate-600 hover:text-rose-600 dark:text-slate-300 dark:hover:text-rose-400 active:scale-95"
    )}
    title={selectedDate ? "Clear Date Filter" : "No date selected to clear"}
  >
    <X className="h-3.5 w-3.5" /> Clear
  </button>

    {pendingCount > 0 && (
      <span className="w-fit rounded-full border border-amber-200 bg-amber-50 px-3.5 py-1.5 text-xs font-bold text-amber-700 shadow-sm dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400">
        {pendingCount} Pending Claims
      </span>
    )}
</div>

          
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white/80 dark:border-slate-700/80 dark:bg-[#0b1220]/50">
          {isLoadingInvites ? (
             <div className="p-8 text-center text-sm text-slate-400">Syncing with database…</div>
          ) : paginatedInvites.length === 0 ? (
             <div className="p-8 text-center text-sm text-slate-400">No active dispatch logs found matching this date.</div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-[10px] uppercase tracking-wider text-slate-500 dark:border-slate-700/80 dark:bg-slate-900/60 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-4 font-bold">Recipient</th>
                  <th className="px-6 py-4 font-bold">Role</th>
                  <th className="px-6 py-4 font-bold">Status</th>
                  <th className="px-6 py-4 font-bold">Expires In</th>
                  <th className="px-6 py-4 font-bold">Sent On</th>
                  <th className="px-6 py-4 text-right font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {paginatedInvites.map((inv) => (
                  <tr key={inv.id} className={cx('transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-700/30', inv.status === 'revoked' && 'bg-rose-50/20 dark:bg-rose-500/5', inv.status === 'pending' && 'bg-amber-50/20 dark:bg-amber-500/5')}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3.5">
                         <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                            {(inv.full_name || inv.email).charAt(0).toUpperCase()}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-900 dark:text-white">{inv.full_name || inv.email}</span>
                            {inv.full_name && (
                              <span className="text-xs text-slate-400">{inv.email}</span>
                            )}
                          </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className="rounded-lg bg-blue-50/80 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
                        {ROLE_LABELS[inv.role] ?? inv.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium">
                        {inv.status === 'revoked' ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 font-mono text-[10px] font-bold tracking-wider text-rose-600 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" /> TOKEN BURNED
                          </span>
                        ) : inv.status === 'accepted' ? (
                          <span className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                             Accepted
                          </span>
                        ) : (
                          <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-amber-600 dark:text-amber-400">
                            <Clock3 className="h-3.5 w-3.5" />
                            Pending
                          </div>
                        )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 font-mono text-xs font-bold">
                      {inv.status === 'pending' ? (
                        (() => {
                          const { text, urgent } = getExpiryCountdown(inv.expires_at);
                          return (
                            <span className={urgent ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'}>
                              {text}
                            </span>
                          );
                        })()
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-xs text-slate-400">
                      {new Date(inv.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {inv.status === 'pending' && (
                        <div className="inline-flex items-center gap-1.5">
                          <button 
                            onClick={() => handleRevoke(inv.id)} 
                            disabled={revokingId === inv.id}
                            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-400 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 dark:border-slate-600 dark:bg-[#0b1220] dark:hover:border-rose-500/30 dark:hover:bg-rose-500/10 dark:hover:text-rose-400 disabled:opacity-50"
                          >
                            {revokingId === inv.id ? 'Revoking...' : 'Revoke'}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Numeric Pagination Controls */}
        {!isLoadingInvites && totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 pt-4 dark:border-slate-700/80">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Showing page <span className="font-bold text-slate-700 dark:text-slate-200">{currentPage}</span> of <span className="font-bold text-slate-700 dark:text-slate-200">{totalPages}</span> ({filteredInvites.length} total entries)
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 transition-all hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setCurrentPage(pageNum)}
                  className={cx(
                    'h-8 w-8 rounded-lg text-xs font-bold transition-all',
                    currentPage === pageNum
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                  )}
                >
                  {pageNum}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 transition-all hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

      </div>
  );
}