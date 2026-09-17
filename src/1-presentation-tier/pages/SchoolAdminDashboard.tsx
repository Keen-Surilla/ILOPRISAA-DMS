import { useState } from 'react';
import { Bell, Settings, School, UserPlus, Users } from 'lucide-react';
import { useAuthStore } from '../../2-application-tier/stores/authStore';
import { PortalShell } from '../components/layout/PortalShell';
import { InviteUsersPanel } from '../components/invites/InviteUsersPanel';
import SchoolAdminSettingsView from '../pages/school-admin-views/SettingsView';
import SchoolOverview from '../pages/school-admin-views/SchoolOverview';
import MasterRoster from '../pages/school-admin-views/MasterRoster';

type SchoolAdminTab = 'overview' | 'invite' | 'manage' | 'roster';

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<SchoolAdminTab>('overview');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const profileName = user?.full_name || user?.email || 'School Admin';
  const profileRole = (user as Record<string, any>)?.role || 'Admin';

  return (
    <PortalShell
      portalTitle="School Admin Portal"
      navGroups={[
        {
          label: null,
          items: [
            {
              id: 'overview',
              label: 'School Overview',
              icon: <School className="h-5 w-5" />,
              active: activeTab === 'overview',
              onClick: () => setActiveTab('overview'),
            },
            {
              id: 'invite',
              label: 'Invite Users',
              icon: <UserPlus className="h-5 w-5" />,
              active: activeTab === 'invite',
              onClick: () => setActiveTab('invite'),
            },
            {
              id: 'roster',
              label: 'Master Roster',
              icon: <Users className="h-5 w-5" />,
              active: activeTab === 'roster',
              onClick: () => setActiveTab('roster'),
            },
            {
              id: 'manage',
              label: 'Manage Accounts',
              icon: <Users className="h-5 w-5" />,
              active: activeTab === 'manage',
              onClick: () => setActiveTab('manage'),
            },
            {
              id: 'settings',
              label: 'Settings',
              icon: <Settings className="h-5 w-5" />,
              active: false,
              onClick: () => setIsSettingsOpen(true),
            },
          ],
        },
      ]}
    >
      <div className="relative min-h-screen bg-slate-100 font-sans text-slate-900 dark:bg-[#020617]">
        <div className="sticky top-0 z-20 flex h-16 w-full items-center justify-between gap-6 border-b border-slate-200 bg-white/90 px-8 backdrop-blur-xl dark:border-white/[0.06] dark:bg-[#0c1324]/90">
          <div className="flex items-center gap-3"></div>

          <div className="ml-auto flex items-center gap-5">
            <button
              className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:bg-[#0f172a] dark:text-[#94a3b8] dark:hover:bg-[#191f31] dark:hover:text-[#f8fafc]"
              aria-label="Notifications"
            >
              <Bell className="h-[18px] w-[18px]" />
            </button>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#0f172a] shadow-sm dark:bg-[#1e293b]">
                <span className="text-sm font-bold uppercase text-white">{profileName.charAt(0)}</span>
              </div>
              <div className="hidden flex-col sm:flex">
                <span className="text-sm font-bold leading-tight text-slate-900 dark:text-[#f8fafc]">
                  {profileName}
                </span>
                <span className="text-[10px] font-medium capitalize text-slate-500 dark:text-[#94a3b8]">
                  {profileRole}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-[1600px] px-8 py-8">
          {activeTab === 'overview' ? (
            <div key="overview" className="animate-in fade-in duration-300 motion-reduce:animate-none">
              <SchoolOverview />
            </div>
          ) : activeTab === 'invite' ? (
            <div key="invite" className="animate-in fade-in duration-300 motion-reduce:animate-none">
              <header className="mb-6">
                <h1 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-200">
                  Invite Users
                </h1>
                <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
                  Send an invitation to add a coach to your school.
                </p>
              </header>

              <InviteUsersPanel roleOptions={[{ value: 'coach', label: 'Coach' }]} useOwnInstitution />
            </div>
          ) : activeTab === 'roster' ? (
            <div key="roster" className="animate-in fade-in duration-300 motion-reduce:animate-none">
              <MasterRoster />
            </div>
          ) : (
            <div key="manage" className="animate-in fade-in duration-300 motion-reduce:animate-none">
              <header className="mb-6">
                <h1 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-200">
                  Manage Accounts
                </h1>
                <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
                  View and manage accounts linked to your school.
                </p>
              </header>

              <div className="flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-white p-12 text-center shadow-sm dark:border-white/[0.06] dark:bg-[#0f172a]">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 text-slate-400 dark:bg-[#151b2d] dark:text-[#64748b]">
                  <Users className="h-5 w-5" />
                </div>
                <p className="text-sm font-semibold text-slate-900 dark:text-[#f8fafc]">Coming soon</p>
                <p className="mt-1 max-w-xs text-xs text-slate-500 dark:text-[#94a3b8]">
                  Account management is on the roadmap. Check back soon.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {isSettingsOpen && <SchoolAdminSettingsView onClose={() => setIsSettingsOpen(false)} />}
    </PortalShell>
  );
}
