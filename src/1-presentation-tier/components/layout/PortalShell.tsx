import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuthStore } from '../../../2-application-tier/stores/authStore';
import type { UserRole } from '../../../3-data-tier/types/database.types';

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
      <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-xl shrink-0">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-bold text-blue-400 tracking-wide">ILOPRISAA</h1>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest">
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
                  ? 'bg-blue-600/25 text-blue-300 border border-blue-500/30'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white border border-transparent'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-800">
          <p className="text-sm font-medium px-2 truncate">{user?.full_name ?? 'User'}</p>
          <p className="text-xs text-slate-500 px-2 truncate mb-3">{user?.email}</p>
          <button
            type="button"
            onClick={async () => {
              await signOut();
              navigate('/login', { replace: true });
            }}
            className="w-full flex items-center gap-2 px-4 py-2 rounded-lg text-red-400 hover:bg-red-500/10 transition text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
