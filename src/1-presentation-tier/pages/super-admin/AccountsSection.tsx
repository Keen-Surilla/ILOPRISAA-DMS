// src/1-presentation-tier/pages/super-admin/AccountsSection.tsx
import { useState, useMemo } from 'react';
import { Search, UserPlus } from 'lucide-react';
import { INITIAL_ACCOUNTS, type AccountStatus } from './constants';
import { SectionIntro, cx } from './sharedUi';

export function AccountsSection({ toast }: { toast: (msg: string) => void }) {
  const [accounts, setAccounts] = useState(INITIAL_ACCOUNTS);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [institutionFilter, setInstitutionFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return accounts.filter((a) => {
      const matchesSearch = !q || a.name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q);
      const matchesRole = roleFilter === 'ALL' || a.role === roleFilter;
      const matchesInstitution = institutionFilter === 'ALL' || a.institution === institutionFilter;
      const matchesStatus = statusFilter === 'ALL' || a.status === statusFilter;
      return matchesSearch && matchesRole && matchesInstitution && matchesStatus;
    });
  }, [accounts, search, roleFilter, institutionFilter, statusFilter]);

  function toggleStatus(id: string) {
    const account = accounts.find((a) => a.id === id);
    if (!account) return;
    const nextStatus: AccountStatus = account.status === 'Active' ? 'Suspended' : 'Active';
    const verb = nextStatus === 'Suspended' ? 'Suspend' : 'Reactivate';
    if (!window.confirm(`${verb} governance access for ${account.name}?`)) return;
    setAccounts((prev) => prev.map((a) => (a.id === id ? { ...a, status: nextStatus } : a)));
    toast(`${account.name} ${nextStatus === 'Suspended' ? 'suspended' : 'reactivated'}.`);
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <SectionIntro
        eyebrow="Access Control Directory"
        title="Manage Governance Accounts"
        description="Authority tier assignments, institutional scoping, and instant account suspension."
        action={
          <a href="#invitations" className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm shadow-blue-600/20 transition-all hover:bg-blue-500 active:scale-95">
            <UserPlus className="h-4 w-4" /> Invite New Officer
          </a>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white/50 backdrop-blur-sm p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800/40">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search officer or email..."
              className="w-full rounded-xl border border-slate-200 bg-white/80 py-2.5 pl-10 pr-4 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-100 sm:w-64 transition-colors"
            />
          </div>
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="cursor-pointer rounded-xl border border-slate-200 bg-white/80 px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/40 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-100 transition-colors">
            <option value="ALL">All Roles</option>
            <option value="Super Admin">Super Admin</option>
            <option value="School Admin">School Admin</option>
            <option value="Committee Chair">Committee Chair</option>
          </select>
          <select value={institutionFilter} onChange={(e) => setInstitutionFilter(e.target.value)} className="cursor-pointer rounded-xl border border-slate-200 bg-white/80 px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/40 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-100 transition-colors">
            <option value="ALL">All Institutions</option>
            {[...new Set(accounts.map((a) => a.institution))].map((inst) => (
              <option key={inst} value={inst}>{inst}</option>
            ))}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="cursor-pointer rounded-xl border border-slate-200 bg-white/80 px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/40 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-100 transition-colors">
            <option value="ALL">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Suspended">Suspended</option>
          </select>
        </div>
        <div className="text-xs font-medium text-slate-400">
          Showing <span className="font-bold text-slate-700 dark:text-slate-200">{filtered.length}</span> officers
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white/50 backdrop-blur-sm shadow-sm dark:border-slate-700 dark:bg-slate-800/40">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50/50 text-[10px] uppercase tracking-wider text-slate-500 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400">
              <tr>
                <th className="px-6 py-4 font-bold">Officer</th>
                <th className="px-6 py-4 font-bold">Role</th>
                <th className="px-6 py-4 font-bold">Institution</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold">Last Auth</th>
                <th className="px-6 py-4 text-right font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {filtered.map((a) => (
                <tr key={a.id} className={cx('transition-colors hover:bg-white dark:hover:bg-slate-700/30', a.status === 'Suspended' && 'bg-rose-50/20 dark:bg-rose-500/5')}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3.5">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-xs font-bold text-white shadow-sm">
                        {a.name.split(' ').map((p) => p[0]).slice(-2).join('')}
                      </div>
                      <div className="flex flex-col">
                        <span className={cx('text-sm font-bold text-slate-900 dark:text-white', a.status === 'Suspended' && 'opacity-70 line-through')}>{a.name}</span>
                        <span className="text-xs text-slate-400">{a.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className="rounded-full border border-blue-200 bg-blue-50/80 px-3 py-1 text-xs font-bold text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-400">{a.role}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{a.institution}</span>
                    <span className="block text-xs text-slate-400">{a.institutionSub}</span>
                  </td>
                  <td className="px-6 py-4">
                    {a.status === 'Active' ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50/80 px-3 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-500" /> Suspended
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 font-mono text-xs text-slate-400">{a.lastAuth}</td>
                  <td className="px-6 py-4 text-right">
                    {a.protected ? (
                      <span className="text-xs font-bold italic tracking-wide text-slate-400">ROOT PROTECTED</span>
                    ) : (
                      <button
                        onClick={() => toggleStatus(a.id)}
                        className={cx(
                          'rounded-lg border px-3 py-1.5 text-xs font-bold transition-all active:scale-95',
                          a.status === 'Active'
                            ? 'border-slate-200 bg-white text-slate-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-rose-500/30 dark:hover:bg-rose-500/10 dark:hover:text-rose-400'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-emerald-500/30 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-400',
                        )}
                      >
                        {a.status === 'Active' ? 'Deactivate' : 'Reactivate'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}