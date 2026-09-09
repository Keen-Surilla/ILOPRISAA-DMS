import { useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../2-application-tier/stores/authStore';
import type { UserRole } from '../../../3-data-tier/types/database.types.extras';
import Logo2 from "../../../assets/Frame 100.svg";
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { PanelLeft, LogOut, Settings, Info, ChevronRight, ChevronDown } from 'lucide-react';

export interface NavItem {
  id: string;
  label: string;
  icon: ReactNode;
  active?: boolean;
  onClick: () => void;
}

export interface NavGroup {
  label: string | null; 
  items: NavItem[];
}

interface PortalShellProps {
  portalTitle: string;
  user?: any;
  navGroups: NavGroup[]; 
  children: ReactNode;
  onSettingsClick?: () => void;
  avatarUrl?: string;
  userSubtitle?: string; // Added to accept the Sport (or any sub-label)
}

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Admin Portal',
  school_admin: 'School Admin Portal',
  coach: 'Coach Portal',
  committee: 'Committee Portal',
  athlete: 'Athlete Portal',
};

export function PortalShell({ portalTitle, navGroups = [], onSettingsClick, avatarUrl, userSubtitle, children }: PortalShellProps) {
  const navigate = useNavigate();
  const { user, role, signOut } = useAuthStore();

  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);

  const handleLogout = async () => {
    setIsLogoutModalOpen(false);
    await signOut();
    navigate('/');
  };

  return (
    <div className="relative flex flex-row h-screen w-full overflow-hidden">
      
      {/* MOBILE BACKDROP: Only visible on small screens when sidebar is open */}
      {isSidebarOpen && (
        <div 
          className="absolute inset-0 z-40 bg-slate-900/60 backdrop-blur-sm md:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* SIDEBAR: Absolute floating drawer on mobile, relative structural column on desktop */}
      <aside
        className={`flex shrink-0 flex-col h-full border-r border-slate-800 bg-[#0b1120] text-slate-100 shadow-2xl md:shadow-sm transition-all duration-300 ease-in-out motion-reduce:transition-none z-50 ${
          isSidebarOpen 
            ? 'absolute md:relative w-[260px] lg:w-[280px]' 
            : 'relative w-16'
        }`}
      >
        {/* HEADER AREA */}
        <div className={`p-3.5 border-b border-slate-800 flex items-center ${isSidebarOpen ? 'justify-between' : 'justify-center'}`}>
          <div
            className={`flex flex-col items-start gap-2 overflow-hidden whitespace-nowrap transition-[opacity,max-width] duration-150 ${
              isSidebarOpen ? 'opacity-100 max-w-[200px]' : 'opacity-0 max-w-0'
            }`}
          >
            <img
              src={Logo2}
              alt="ILOPRISAA Document Management System Logo"
              className="h-6 w-auto object-contain object-left flex-none"
            />
            <p className="ml-1 text-[10px] text-slate-400 font-bold uppercase tracking-widest whitespace-nowrap">
              {role ? ROLE_LABELS[role as UserRole] || portalTitle : portalTitle}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 active:scale-95 rounded-lg transition-[color,background-color,transform] duration-150"
            title="Toggle Menu"
          >
            <PanelLeft className="w-5 h-5" />
          </button>
        </div>

        {/* NAVIGATION LINKS */}
        <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto overflow-x-hidden">
          {navGroups.map((group, groupIndex) => (
            <div key={group.label ?? `ungrouped-${groupIndex}`}>
              {group.label && (
                <p
                  className={`px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider overflow-hidden whitespace-nowrap transition-[opacity,max-width] duration-150 ${
                    isSidebarOpen ? 'opacity-100 max-w-[220px] mb-1.5' : 'opacity-0 max-w-0 mb-0'
                  }`}
                >
                  {group.label}
                </p>
              )}
              <div className="space-y-1">
                {group.items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      item.onClick();
                      // Auto-close sidebar on mobile after clicking a link
                      if (window.innerWidth < 768) setIsSidebarOpen(false);
                    }}
                    title={!isSidebarOpen ? item.label : undefined}
                    className={`w-full flex items-center rounded-lg text-sm font-medium transition-[color,background-color,border-color,transform] duration-150 active:scale-[0.98] ${
                      isSidebarOpen ? 'px-3 py-2.5 gap-3 justify-start' : 'p-2.5 justify-center'
                    } ${
                      item.active
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-100 border border-transparent'
                    }`}
                  >
                    <div className="shrink-0">{item.icon}</div>
                    <span
                      className={`overflow-hidden whitespace-nowrap transition-[opacity,max-width] duration-150 ${
                        isSidebarOpen ? 'opacity-100 max-w-[200px]' : 'opacity-0 max-w-0'
                      }`}
                    >
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* BOTTOM PROFILE / ACCOUNT MENU */}
        <div className="relative p-3.5 border-t border-slate-800">
          {/* Popup account menu: only appears after clicking the profile row */}
          {isAccountMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsAccountMenuOpen(false)} aria-hidden="true" />
              <div className="absolute bottom-full left-3.5 right-3.5 mb-2 z-50 rounded-xl border border-slate-800 bg-[#0f172a] shadow-2xl overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-800">
                  <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                </div>

                <div className="py-1">
                  {/* Conditionally render the Settings button ONLY if the dashboard provided a settings modal */}
                  {onSettingsClick && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsAccountMenuOpen(false);
                        onSettingsClick(); 
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800/80 hover:text-slate-100 transition-colors duration-150"
                    >
                      <Settings className="w-4 h-4 shrink-0" />
                      Settings
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setIsAccountMenuOpen(false);
                      navigate('/learn-more');
                    }}
                    className="w-full flex items-center justify-between gap-3 px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800/80 hover:text-slate-100 transition-colors duration-150"
                  >
                    <span className="flex items-center gap-3">
                      <Info className="w-4 h-4 shrink-0" />
                      Learn more
                    </span>
                    <ChevronRight className="w-4 h-4 shrink-0 text-slate-500" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsAccountMenuOpen(false);
                    setIsLogoutModalOpen(true);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-300 hover:bg-rose-500/10 hover:text-rose-400 transition-colors duration-150 border-t border-slate-800"
                >
                  <LogOut className="w-4 h-4 shrink-0" />
                  Log out
                </button>
              </div>
            </>
          )}

          {/* Profile row: click to reveal the account menu above */}
          <button
            type="button"
            onClick={() => setIsAccountMenuOpen((prev) => !prev)}
            title={!isSidebarOpen ? (user?.full_name ?? 'Account') : undefined}
            className={`w-full flex items-center rounded-lg transition-[background-color,transform] duration-150 active:scale-[0.98] hover:bg-slate-800/80 ${
              isSidebarOpen ? 'gap-3 px-2 py-2 justify-start' : 'justify-center p-2'
            }`}
          >
            {/* AVATAR DISPLAY */}
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-700 text-slate-200 text-xs font-bold shrink-0 uppercase overflow-hidden">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                user?.full_name?.[0] ?? user?.email?.[0] ?? 'U'
              )}
            </div>

            <div
              className={`flex flex-1 items-center justify-between min-w-0 overflow-hidden whitespace-nowrap transition-[opacity,max-width] duration-150 ${
                isSidebarOpen ? 'opacity-100 max-w-[220px]' : 'opacity-0 max-w-0'
              }`}
            >
              <div className="flex flex-col items-start min-w-0 pr-2">
                <p className="text-sm font-bold text-slate-200 truncate w-full text-left">{user?.full_name ?? 'User'}</p>
                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide truncate w-full text-left">
                  {userSubtitle || (role ? ROLE_LABELS[role as UserRole] : 'User')}
                </p>
              </div>
              <ChevronDown className="w-4 h-4 shrink-0 text-slate-500" />
            </div>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 h-full overflow-y-auto relative w-full">
        {children}
      </main>

      <ConfirmModal
        isOpen={isLogoutModalOpen}
        title="Sign out"
        message="Are you sure you want to sign out of the ILOPRISAA DMS?"
        confirmText="Sign Out"
        isDestructive={true}
        onConfirm={handleLogout}
        onCancel={() => setIsLogoutModalOpen(false)}
      />
    </div>
  );
}