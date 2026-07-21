import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuthStore } from '../../../2-application-tier/stores/authStore';
import type { UserRole } from '../../../3-data-tier/types/database.types';
import Logo2 from "../../../assets/logo2.svg";

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

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800">
      {/* SIDEBAR: Now white with light borders and dark text */}
      <aside className="w-64 bg-white text-slate-800 flex flex-col border-r border-slate-200 shadow-sm shrink-0">
        <div className="p-6 border-b border-slate-200 flex flex-col items-start gap-3">
          {/* INJECTED LOGO */}
          <img 
            src={Logo2} 
            alt="ILOPRISAA Document Management System Logo" 
            className="h-9 w-auto object-contain object-left flex-none" 
          />
          <p className="ml-1 text-xs text-slate-500 font-bold uppercase tracking-widest">
            {role ? ROLE_LABELS[role] : portalTitle}
          </p>
        </div>
        
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={item.onClick}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${
                item.active
                  ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
        
        {/* BOTTOM PROFILE/LOGOUT: Adjusted for light theme */}
        <div className="p-4 border-t border-slate-200">
          <p className="text-sm font-bold text-slate-800 px-2 truncate">{user?.full_name ?? 'User'}</p>
          <p className="text-xs text-slate-500 px-2 truncate mb-3">{user?.email}</p>
          <button
            type="button"
            onClick={async () => {
              await signOut();
              navigate('/login', { replace: true });
            }}
            className="w-full flex items-center gap-2 px-4 py-2 rounded-lg text-red-600 hover:bg-red-50 transition text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>
      
      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}