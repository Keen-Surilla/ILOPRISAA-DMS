// src/1-presentation-tier/pages/SuperAdminDashboard.tsx
import { useState } from 'react';
import { Bell, UserPlus, Users } from 'lucide-react';
import { useAuthStore } from '../../2-application-tier/stores/authStore';
import { PortalShell } from '../components/layout/PortalShell';
import { InviteUsersPanel } from '../components/invites/InviteUsersPanel';

export default function SuperAdminDashboard() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'invite' | 'manage'>('invite');
  const profileName = user?.full_name || user?.email || 'Super Admin';
  const profileRole = (user as Record<string, any>)?.role || 'Super Admin';

  return (
    <PortalShell
      portalTitle="Super Admin Portal"
      navGroups={[
        {
          label: null,
          items: [
            {
              id: 'invite',
              label: 'Invite Users',
              icon: <UserPlus className="w-5 h-5" />,
              active: activeTab === 'invite',
              onClick: () => setActiveTab('invite'),
            },
            {
              id: 'manage',
              label: 'Manage Accounts',
              icon: <Users className="w-5 h-5" />,
              active: activeTab === 'manage',
              onClick: () => setActiveTab('manage'),
            },
          ],
        },
      ]}
    >
      <div className="font-sans text-slate-900 relative">
        <div className="sticky top-0 z-20 w-full h-[76px] px-8 mb-10 bg-white/90 backdrop-blur-sm border-b border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="relative w-full max-w-md" />
          <div className="flex items-center gap-6">
            <button
              className="text-slate-400 hover:text-slate-800 active:scale-90 rounded-lg transition-[color,transform] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 motion-reduce:active:scale-100"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#0f172a] rounded-full flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                <span className="text-white font-bold text-sm uppercase">{profileName ? profileName.charAt(0) : 'S'}</span>
              </div>
              <div className="flex flex-col hidden sm:flex">
                <span className="text-sm font-bold text-slate-800 leading-tight">{profileName}</span>
                <span className="text-[10px] font-medium text-slate-500 capitalize">{profileRole}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-8 pb-8">
          {activeTab === 'invite' ? (
            <div key="invite" className="animate-in fade-in duration-300 motion-reduce:animate-none">
              <header className="mb-6">
                <h2 className="text-3xl font-bold tracking-tight text-slate-800">Invite Users</h2>
                <p className="text-slate-500 text-sm mt-1">
                  Send an invitation to add a school admin or committee member.
                </p>
              </header>

              <InviteUsersPanel
                roleOptions={[
                  { value: 'school_admin', label: 'School Admin' },
                  { value: 'committee', label: 'Eligibility Committee' },
                ]}
              />
            </div>
          ) : (
            <div key="manage" className="animate-in fade-in duration-300 motion-reduce:animate-none">
              <header className="mb-6">
                <h2 className="text-3xl font-bold tracking-tight text-slate-800">Manage Accounts</h2>
                <p className="text-slate-500 text-sm mt-1">
                  View and manage admin and committee accounts across ILOPRISAA.
                </p>
              </header>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-3">
                  <Users className="w-5 h-5 text-slate-300" />
                </div>
                <p className="text-sm font-semibold text-slate-600">Coming soon</p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                  Account management is on the roadmap — check back soon.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </PortalShell>
  );
}