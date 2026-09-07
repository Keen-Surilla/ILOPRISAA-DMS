// src/1-presentation-tier/pages/super-admin/InstitutionsSection.tsx
import { useState, useEffect } from 'react';
import { Plus, Building2, X } from 'lucide-react';
import { INITIAL_SCHOOLS, type School } from './constants';
import { SectionIntro, cx } from './sharedUi';

function SchoolModal({ open, initial, onClose, onSave }: { open: boolean; initial: Partial<School> | null; onClose: () => void; onSave: (s: Pick<School, 'code' | 'name' | 'division' | 'admin' | 'quotaMax'>) => void }) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [division, setDivision] = useState<School['division']>('Tertiary & Secondary');
  const [admin, setAdmin] = useState('');
  const [quotaMax, setQuotaMax] = useState(100);

  useEffect(() => {
    if (open) {
      setCode(initial?.code ?? '');
      setName(initial?.name ?? '');
      setDivision(initial?.division ?? 'Tertiary & Secondary');
      setAdmin(initial?.admin ?? '');
      setQuotaMax(initial?.quotaMax ?? 100);
    }
  }, [open, initial]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-6 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="flex w-full max-w-lg flex-col gap-6 rounded-2xl border border-slate-200 bg-white/95 p-8 shadow-2xl backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/95 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
              <Building2 className="h-5 w-5" />
            </div>
            <h3 className="font-sora text-lg font-bold text-slate-900 dark:text-white">{initial?.code ? `Edit ${initial.code}` : 'Add New Member School'}</h3>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); onSave({ code: code.toUpperCase(), name, division, admin: admin || 'Seat Vacant', quotaMax }); }}>
          <div className="grid grid-cols-3 gap-4">
          
        
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Institutional Legal Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Iloilo Science and Technology University" className="rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white transition-colors" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Athletic Division Scope</label>
            <select value={division} onChange={(e) => setDivision(e.target.value as School['division'])} className="cursor-pointer rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white transition-colors">
              <option value="Tertiary & Secondary">Tertiary & Secondary Combined</option>
              <option value="Tertiary">Tertiary Varsity Only</option>
              <option value="Secondary">Secondary (High School) Only</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Designated School Admin</label>
            <input value={admin} onChange={(e) => setAdmin(e.target.value)} placeholder="Full name (Leave blank to flag vacant)" className="rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white transition-colors" />
          </div>
          <div className="mt-2 flex items-center justify-end gap-3 border-t border-slate-100 pt-5 dark:border-slate-800">
            <button type="button" onClick={onClose} className="rounded-xl px-5 py-2.5 text-xs font-bold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200">
              Cancel
            </button>
            <button type="submit" className="rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-blue-500 active:scale-95">
              Save Institution
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function InstitutionsSection({ toast }: { toast: (msg: string) => void }) {
  const [schools, setSchools] = useState(INITIAL_SCHOOLS);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<School | null>(null);

  function openAdd() { setEditing(null); setModalOpen(true); }
  function openEdit(school: School) { setEditing(school); setModalOpen(true); }
  function handleSave(payload: Pick<School, 'code' | 'name' | 'division' | 'admin' | 'quotaMax'>) {
    setSchools((prev) => {
      const exists = prev.some((s) => s.code === payload.code);
      if (exists) {
        return prev.map((s) => (s.code === payload.code ? { ...s, ...payload, adminVacant: payload.admin === 'Seat Vacant', adminPending: false } : s));
      }
      return [...prev, { ...payload, location: 'Iloilo City', quotaUsed: 0, clearance: 0, adminVacant: payload.admin === 'Seat Vacant' }];
    });
    toast(`Institution record for ${payload.code} saved.`);
    setModalOpen(false);
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <SectionIntro
        eyebrow="Accredited Roster Control"
        title="Institution Management"
        description="Configure all member institutions, quota thresholds, and verify School Administrators."
        action={
          <button onClick={openAdd} className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-blue-500 active:scale-95">
            <Plus className="h-4 w-4" /> Add New Member School
          </button>
        }
      />

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white/50 backdrop-blur-sm shadow-sm dark:border-slate-700 dark:bg-slate-800/40">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50/50 text-[10px] uppercase tracking-wider text-slate-500 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400">
              <tr>
                <th className="px-6 py-4 font-bold">Code</th>
                <th className="px-6 py-4 font-bold">Institution</th>
                <th className="px-6 py-4 font-bold">School Admin</th>
                <th className="px-6 py-4 font-bold">Roster Quota</th>
                <th className="px-6 py-4 font-bold">Clearance</th>
                <th className="px-6 py-4 text-right font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {schools.map((s) => (
                <tr key={s.code} className={cx('transition-colors hover:bg-white dark:hover:bg-slate-700/30', s.adminVacant && 'bg-rose-50/20 dark:bg-rose-500/5')}>
                  <td className="px-6 py-4 font-mono text-sm font-bold text-blue-600 dark:text-blue-400">{s.code}</td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">{s.name}</span>
                    <span className="block text-xs text-slate-400">{s.location} • {s.division}</span>
                  </td>
                  <td className="px-6 py-4">
                    {s.adminVacant ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400">Seat Vacant</span>
                    ) : (
                      <span className={cx('text-sm font-medium', s.adminPending ? 'text-amber-600 dark:text-amber-400' : 'text-slate-700 dark:text-slate-300')}>
                        {s.admin}
                        {s.adminPending && <span className="ml-1 text-xs opacity-70">(Pending)</span>}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-slate-900 dark:text-white">{s.quotaUsed}</span> <span className="text-xs text-slate-400">/ {s.quotaMax}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-2.5 w-24 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800 shadow-inner">
                        <div className={cx('h-full rounded-full transition-all', s.clearance >= 85 ? 'bg-emerald-500' : s.clearance >= 70 ? 'bg-amber-500' : 'bg-rose-500')} style={{ width: `${s.clearance}%` }} />
                      </div>
                      <span className={cx('font-mono text-xs font-bold', s.clearance >= 85 ? 'text-emerald-600 dark:text-emerald-400' : s.clearance >= 70 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400')}>
                        {s.clearance}%
                      </span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right">
                    <button onClick={() => openEdit(s)} className="mr-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-50 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-blue-500/30 dark:hover:bg-blue-500/10 dark:hover:text-blue-400">
                      Edit
                    </button>
                    {s.adminVacant ? (
                      <a href="#invitations" className="inline-block rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-blue-500 active:scale-95">
                        Dispatch Admin
                      </a>
                    ) : (
                      <button onClick={() => toast(`Reassignment invite prepared for ${s.code}.`)} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">
                        Reassign
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <SchoolModal open={modalOpen} initial={editing} onClose={() => setModalOpen(false)} onSave={handleSave} />
    </div>
  );
}