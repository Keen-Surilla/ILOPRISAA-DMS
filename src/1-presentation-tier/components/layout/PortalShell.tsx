import React, { useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../2-application-tier/stores/authStore';
import type { UserRole } from '../../../3-data-tier/types/database.types.extras';
import Logo2 from "../../../assets/logo2.svg";
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { PanelLeft, LogOut } from 'lucide-react';

// PortalShell.tsx
export interface NavItem {
  id: string;
  label: string;
  icon: ReactNode;
  active?: boolean;
  onClick: () => void;
}

export interface NavGroup {
  label: string | null; // null = ungrouped, renders with no header (e.g. Dashboard)
  items: NavItem[];
}

interface PortalShellProps {
  portalTitle: string;
  user?: any;
  navGroups: NavGroup[]; // replaces the old flat `navItems` prop
  children: ReactNode;
}

const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Admin Portal',
  admin: 'School Admin Portal',
  coach: 'Coach Portal',
  committee: 'Committee Portal',
  athlete: 'Athlete Portal',
};

export function PortalShell({ portalTitle, navGroups = [], children }: PortalShellProps) {
  const navigate = useNavigate();
  const { user, role, signOut } = useAuthStore();

  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleLogout = async () => {
    setIsLogoutModalOpen(false);
    await signOut();
    navigate('/');
  };

  return (
    <div className="flex flex-row h-screen w-full bg-slate-50 overflow-hidden">
      <aside
        className={`bg-white text-slate-800 flex flex-col border-r border-slate-200 shadow-sm shrink-0 transition-[width] duration-300 ease-in-out motion-reduce:transition-none ${
          isSidebarOpen ? 'w-56' : 'w-16'
        }`}
      >
        {/* HEADER AREA */}
        <div className={`p-3.5 border-b border-slate-200 flex items-center ${isSidebarOpen ? 'justify-between' : 'justify-center'}`}>
          <div
            className={`flex flex-col items-start gap-2 overflow-hidden whitespace-nowrap transition-[opacity,max-width] duration-150 ${
              isSidebarOpen ? 'opacity-100 max-w-[180px]' : 'opacity-0 max-w-0'
            }`}
          >
            <img
              src={Logo2}
              alt="ILOPRISAA Document Management System Logo"
              className="h-6 w-auto object-contain object-left flex-none"
            />
            <p className="ml-1 text-[10px] text-slate-500 font-bold uppercase tracking-widest whitespace-nowrap">
              {role ? ROLE_LABELS[role as UserRole] || portalTitle : portalTitle}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 active:scale-95 rounded-lg transition-[color,background-color,transform] duration-150"
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
                  className={`px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider overflow-hidden whitespace-nowrap transition-[opacity,max-width] duration-150 ${
                    isSidebarOpen ? 'opacity-100 max-w-[200px] mb-1.5' : 'opacity-0 max-w-0 mb-0'
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
                    onClick={item.onClick}
                    title={!isSidebarOpen ? item.label : undefined}
                    className={`w-full flex items-center rounded-lg text-sm font-medium transition-[color,background-color,border-color,transform] duration-150 active:scale-[0.98] ${
                      isSidebarOpen ? 'px-3 py-2.5 gap-3 justify-start' : 'p-2.5 justify-center'
                    } ${
                      item.active
                        ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent'
                    }`}
                  >
                    <div className="shrink-0">{item.icon}</div>
                    <span
                      className={`overflow-hidden whitespace-nowrap transition-[opacity,max-width] duration-150 ${
                        isSidebarOpen ? 'opacity-100 max-w-[160px]' : 'opacity-0 max-w-0'
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

        {/* BOTTOM PROFILE/LOGOUT */}
        <div className="p-3.5 border-t border-slate-200 flex flex-col items-center">
          <div
            className={`w-full overflow-hidden transition-[opacity,max-height,margin] duration-150 ${
              isSidebarOpen ? 'opacity-100 max-h-16 mb-4' : 'opacity-0 max-h-0 mb-0'
            }`}
          >
            <p className="text-sm font-bold text-slate-800 px-2 truncate">{user?.full_name ?? 'User'}</p>
            <p className="text-xs text-slate-500 px-2 truncate">{user?.email}</p>
          </div>

          <button
            type="button"
            onClick={() => setIsLogoutModalOpen(true)}
            className="w-full flex items-center justify-start gap-3 p-2.5 text-slate-500 hover:text-red-600 hover:bg-red-50 active:scale-[0.98] rounded-lg transition-[color,background-color,transform] duration-150 overflow-hidden"
            title="Sign Out"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <span
              className={`text-sm font-medium overflow-hidden whitespace-nowrap transition-[opacity,max-width] duration-150 ${
                isSidebarOpen ? 'opacity-100 max-w-[100px]' : 'opacity-0 max-w-0'
              }`}
            >
              Sign Out
            </span>
          </button>
        </div>
      </aside>

      <main className="flex-1 h-full overflow-y-auto relative">
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