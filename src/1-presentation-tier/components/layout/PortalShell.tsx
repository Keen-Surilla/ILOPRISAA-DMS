import React, { useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../2-application-tier/stores/authStore';
import type { UserRole } from '../../../3-data-tier/types/database.types';
import Logo2 from "../../../assets/logo2.svg";
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { PanelLeft, LogOut } from 'lucide-react';

export interface NavItem {
  id: string;
  label: string;
  icon: ReactNode;
  active?: boolean;
  onClick: () => void;
}

interface PortalShellProps {
  portalTitle: string;
  navItems: NavItem[];
  children: ReactNode;
}

const ROLE_LABELS: Record<UserRole, string> = {
  athlete: 'Athlete Portal',
  coach: 'Coach Portal',
  admin: 'Admin Portal',
  committee: 'Committee Portal',
};

export function PortalShell({ portalTitle, navItems, children }: PortalShellProps) {
  const navigate = useNavigate();
  const { user, role, signOut } = useAuthStore();
  
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // NEW: Sidebar toggle state

  const handleLogout = async () => {
    setIsLogoutModalOpen(false);
    await signOut();
    navigate('/');
  };

  return (
    <div className="flex flex-row h-screen w-full bg-slate-50 overflow-hidden">
      
      {/* SIDEBAR: Width transitions smoothly between w-64 (open) and w-20 (closed) */}
      <aside 
        className={`bg-white text-slate-800 flex flex-col border-r border-slate-200 shadow-sm shrink-0 transition-all duration-300 ease-in-out ${
          isSidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        {/* HEADER AREA */}
        <div className={`p-4 border-b border-slate-200 flex items-center ${isSidebarOpen ? 'justify-between' : 'justify-center'}`}>
          
          {/* Only show logo and title if sidebar is OPEN */}
          {isSidebarOpen && (
            <div className="flex flex-col items-start gap-2 overflow-hidden">
              <img 
                src={Logo2} 
                alt="ILOPRISAA Document Management System Logo" 
                className="h-6 w-auto object-contain object-left flex-none" 
              />
              <p className="ml-1 text-[10px] text-slate-500 font-bold uppercase tracking-widest whitespace-nowrap">
                {role ? ROLE_LABELS[role] : portalTitle}
              </p>
            </div>
          )}

          {/* Hamburger Toggle Button */}
        <button
  type="button"
  onClick={() => setIsSidebarOpen(!isSidebarOpen)} /* <-- Flips the state from true to false */
  className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
  title="Toggle Menu"
>
  <PanelLeft className="w-5 h-5" />
</button>
        </div>
        
        {/* NAVIGATION LINKS */}
        <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto overflow-x-hidden">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={item.onClick}
              title={!isSidebarOpen ? item.label : undefined} // Shows tooltip when closed
              className={`w-full flex items-center rounded-lg text-sm font-medium transition-all duration-200 ${
                isSidebarOpen ? 'px-4 py-3 gap-3 justify-start' : 'p-3 justify-center'
              } ${
                item.active
                  ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent'
              }`}
            >
              <div className="shrink-0">{item.icon}</div>
              
              {/* Only show text if sidebar is OPEN */}
              {isSidebarOpen && <span className="whitespace-nowrap">{item.label}</span>}
            </button>
          ))}
        </nav>
        
        {/* BOTTOM PROFILE/LOGOUT */}
        <div className="p-4 border-t border-slate-200 flex flex-col items-center">
          
          {/* Only show User Profile if sidebar is OPEN */}
          {isSidebarOpen && (
            <div className="w-full mb-4">
              <p className="text-sm font-bold text-slate-800 px-2 truncate">{user?.full_name ?? 'User'}</p>
              <p className="text-xs text-slate-500 px-2 truncate">{user?.email}</p>
            </div>
          )}
          
          {/* Sign Out Button */}
 <button
  type="button"
  onClick={() => setIsLogoutModalOpen(true)} 
  className="w-full flex items-center justify-start gap-3 p-3 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors overflow-hidden"
  title="Sign Out"
>
  <LogOut className="w-5 h-5 shrink-0" />
  {isSidebarOpen && (
    <span className="text-sm font-medium whitespace-nowrap">Sign Out</span>
  )}
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