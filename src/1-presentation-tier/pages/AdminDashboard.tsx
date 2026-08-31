// src/1-presentation-tier/pages/AdminDashboard.tsx
import { Bell } from 'lucide-react';
import { useAuthStore } from '../../2-application-tier/stores/authStore';
import { PortalShell } from '../components/layout/PortalShell';
import { InviteUsersPanel } from '../components/invites/InviteUsersPanel';

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const profileName = user?.full_name || user?.email || 'School Admin';
  const profileRole = (user as Record<string, any>)?.role || 'Admin';

  return (
    <PortalShell
      portalTitle="School Admin Portal"
      navGroups={[
        {
          label: null,
          items: [],
        },
      ]}
    >
      <div className="font-sans text-slate-900 relative">
        <div className="sticky top-0 z-20 w-full h-[76px] px-8 mb-10 bg-white/90 backdrop-blur-sm border-b border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="relative w-full max-w-md" />
          <div className="flex items-center gap-6">
            <button className="text-slate-400 hover:text-slate-800 transition-colors">
              <Bell className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#0f172a] rounded-full flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                <span className="text-white font-bold text-sm uppercase">{profileName ? profileName.charAt(0) : 'A'}</span>
              </div>
              <div className="flex flex-col hidden sm:flex">
                <span className="text-sm font-bold text-slate-800 leading-tight">{profileName}</span>
                <span className="text-[10px] font-medium text-slate-500 capitalize">{profileRole}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-8 pb-8">
          <InviteUsersPanel
  roleOptions={[{ value: 'coach', label: 'Coach' }]}
  useOwnInstitution
/>
       
        </div>
      </div>
    </PortalShell>
  );
}