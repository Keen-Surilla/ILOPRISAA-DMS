import { useEffect, useState } from 'react';
import { LayoutDashboard, Users } from 'lucide-react';
import { listAllAthleteProfiles } from '../../3-data-tier/services/rosterService';
import type { Profile } from '../../3-data-tier/types/database.types';
import { PortalShell } from '../components/layout/PortalShell';
import { EventCalendar } from '../components/calendar/EventCalendar';
import { useEvents } from '../../2-application-tier/hooks/useEvents';

export default function AdminDashboard() {
  const [athletes, setAthletes] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const events = useEvents();

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setAthletes(await listAllAthleteProfiles());
      setLoading(false);
    })();
  }, []);

  return (
    <PortalShell
      portalTitle="Admin Portal"
      navItems={[
        { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-5 h-5" />, active: true, onClick: () => {} },
        { id: 'users', label: 'Athletes', icon: <Users className="w-5 h-5" />, active: false, onClick: () => {} },
      ]}
    >
      <div className="p-8 space-y-8 max-w-6xl">
        <header>
          <h2 className="text-2xl font-bold text-slate-900">Administration</h2>
          <p className="text-slate-500 text-sm mt-1">
            Overview of registered athletes. Assign roles in Supabase Table Editor → profiles.
          </p>
        </header>

        <div className="grid md:grid-cols-3 gap-4">
          <Stat label="Athletes" value={loading ? '…' : String(athletes.length)} />
          <Stat label="Events this month" value={String(events.events.length)} />
          <Stat label="System" value="Active" />
        </div>

        <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 font-semibold">Registered athletes</div>
          <ul className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
            {athletes.map((a) => (
              <li key={a.id} className="px-6 py-3 text-sm flex justify-between">
                <span className="font-medium">{a.full_name}</span>
                <span className="text-slate-500">{a.email}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </PortalShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <p className="text-xs text-slate-500 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
    </div>
  );
}
