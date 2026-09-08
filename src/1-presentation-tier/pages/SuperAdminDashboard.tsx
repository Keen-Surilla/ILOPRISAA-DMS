// src/1-presentation-tier/pages/super-admin/index.tsx
import { useState } from 'react';
import { Search, Bell, Users, Building2, History, Mail, AlertTriangle, LayoutDashboard, Sun, Moon } from 'lucide-react';
import { PortalShell } from '../components/layout/PortalShell';
import { useAuthStore } from '../../2-application-tier/stores/authStore';
import { useThemeStore } from '../../2-application-tier/stores/themeStore';

// Tabs
import { OverviewSection } from './super-admin/OverviewSection';
import { WatchlistSection } from './super-admin/WatchlistSection';
import { AccountsSection } from './super-admin/AccountsSection';
import { InstitutionsSection } from './super-admin/InstitutionsSection';
import { AuditLedgerSection } from './super-admin/AuditLedgerSection';
import { InvitationsSection } from './super-admin/InvitationsSection';

// Shared
import { type SectionId } from './super-admin/constants';
import { Toast } from './super-admin/sharedUi';

const NAV_ITEMS: Array<{ id: SectionId; label: string; icon: React.ReactNode }> = [
  { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-5 h-5" /> },
  { id: 'watchlist', label: 'Watchlist & Audit Feed', icon: <AlertTriangle className="w-5 h-5" /> },
  { id: 'accounts', label: 'Access Control', icon: <Users className="w-5 h-5" /> },
  { id: 'institutions', label: 'Member Institutions', icon: <Building2 className="w-5 h-5" /> },
  { id: 'audit', label: 'Audit Ledger', icon: <History className="w-5 h-5" /> },
  { id: 'invitations', label: 'Invitations', icon: <Mail className="w-5 h-5" /> },
];

export default function SuperAdminDashboard() {
  const { user } = useAuthStore();
  const { isDark, toggleTheme } = useThemeStore();
  const [activeSection, setActiveSection] = useState<SectionId>('overview');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const profileName = user?.full_name || user?.email || 'Super Admin';
  const profileRole = (user as Record<string, any>)?.role || 'Super Admin';

  function showToast(message: string) {
    setToastMessage(message);
    window.clearTimeout((showToast as any)._t);
    (showToast as any)._t = window.setTimeout(() => setToastMessage(null), 3000);
  }

  return (
    <PortalShell
      portalTitle="Super Admin Portal"
      navGroups={[
        {
          label: null,
          items: NAV_ITEMS.map((item) => ({
            id: item.id,
            label: item.label,
            icon: item.icon,
            active: activeSection === item.id,
            onClick: () => setActiveSection(item.id),
          })),
        },
      ]}
    >
      <div className="relative min-h-screen w-full font-sans dark:text-slate-100 text-slate-900 dark:bg-[#020617] dark:text-slate-100">
        
        {/* Clean, Theme-Agnostic Header */}
        <div className="sticky top-0 z-20 flex w-full flex-col gap-4 border-b border-slate-200 bg-white/80 px-8 py-4 backdrop-blur-md dark:border-slate-800/80 dark:bg-[#0b1220]/80 md:h-[76px] md:flex-row md:items-center md:justify-between md:py-0">
          <div className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              placeholder="Search athlete, school, token, hash..."
              className="w-full rounded-full border border-slate-200 bg-slate-50/50 py-2 pl-10 pr-4 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 dark:border-slate-700/50 dark:bg-slate-900/50 dark:text-slate-100 transition-colors"
            />
          </div>
          
          <div className="flex items-center gap-4 sm:gap-6">
            <button
              onClick={toggleTheme}
              className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition-all hover:bg-slate-50 hover:text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition-all hover:bg-slate-50 hover:text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700" aria-label="Notifications">
              <Bell className="h-4 w-4" />
              <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-800" />
            </button>
            <div className="flex items-center gap-3 border-l border-slate-200 pl-4 dark:border-slate-700">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-blue-600 to-blue-800 shadow-sm">
                <span className="text-sm font-bold uppercase text-white">{profileName ? profileName.charAt(0) : 'S'}</span>
              </div>
              <div className="hidden flex-col sm:flex">
                <span className="text-sm font-bold leading-tight text-slate-800 dark:text-slate-100">{profileName}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{profileRole}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Rendering Engine */}
        <div className="mx-auto max-w-7xl px-4 sm:px-8 py-8 pb-16">
          {activeSection === 'overview' && <OverviewSection onNavigate={setActiveSection} />}
          {activeSection === 'watchlist' && <WatchlistSection toast={showToast} />}
          {activeSection === 'accounts' && <AccountsSection toast={showToast} />}
          {activeSection === 'institutions' && <InstitutionsSection toast={showToast} />}
          {activeSection === 'audit' && <AuditLedgerSection toast={showToast} />}
          {activeSection === 'invitations' && <InvitationsSection toast={showToast} />}
        </div>
      </div>

      <Toast message={toastMessage} />
    </PortalShell>
  );
}