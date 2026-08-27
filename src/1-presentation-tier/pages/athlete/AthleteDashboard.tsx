import React, { useState, Suspense, lazy } from 'react';
import { FileText, Calendar, Settings, Users, Bell } from 'lucide-react';
import { useAuthStore } from '../../../2-application-tier/stores/authStore';
import { PortalShell, type NavItem, type NavGroup } from '../../components/layout/PortalShell';
import SettingsView from '../../pages/coach-views/SettingsView';


const AthleteDocumentsView = lazy(() => import('./AthleteDocumentsView'));
const AthleteTeamView = lazy(() => import('./AthleteTeamView'));
const AthleteScheduleView = lazy(() => import('./AthleteScheduleView'));


export default function AthleteDashboard() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('documents');
  const profileName = user?.full_name || user?.email || 'Athlete Profile';
  const profileSport = (user as Record<string, any>)?.sport || 'Athlete';
  const athleteNavItems: NavItem[] = [
  { 
    id: 'team',
    label: 'My Team', 
    icon: <Users className="w-5 h-5" />, 
    active: activeTab === 'team',
    onClick: () => setActiveTab('team') 
  },
  { 
    id: 'documents', 
    label: 'My Documents', 
    icon: <FileText className="w-5 h-5" />, 
    active: activeTab === 'documents',
    onClick: () => setActiveTab('documents') 
  },
  { 
    id: 'schedule', 
    label: 'Schedule', 
    icon: <Calendar className="w-5 h-5" />, 
    active: activeTab === 'schedule',
    onClick: () => setActiveTab('schedule') 
  },
  { 
    id: 'settings', 
    label: 'Settings', 
    icon: <Settings className="w-5 h-5" />, 
    active: activeTab === 'settings',
    onClick: () => setActiveTab('settings') 
  },
];

const athleteNavGroups: NavGroup[] = [
  { label: null, items: athleteNavItems },
];

const renderContent = () => {
    switch (activeTab) {
      case 'team':
        return <AthleteTeamView />;
      case 'documents':
        return <AthleteDocumentsView />;
      case 'schedule':
        return <AthleteScheduleView />;  
      case 'settings':
        return <SettingsView onClose={() => setActiveTab('documents')} />;
      default:
        return <AthleteDocumentsView />;
    }
  };

  return (
    <PortalShell
      portalTitle="Athlete Portal"
      navGroups={athleteNavGroups}
    >
      <div className="font-sans text-slate-900 relative">

        {/* Shared Top Header (Search Bar & Profile Avatar) — sticky on scroll, spans the full width of the portal */}
        <div className="sticky top-0 z-20 w-full h-[76px] px-8 mb-10 bg-white/90 backdrop-blur-sm border-b border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="relative w-full max-w-md">
          </div>
          <div className="flex items-center gap-6">
            <button className="text-slate-400 hover:text-slate-800 transition-colors">
              <Bell className="w-5 h-5 " />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#0f172a] rounded-full flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                <span className="text-white font-bold text-sm uppercase">{profileName ? profileName.charAt(0) : 'A'}</span>
              </div>
              <div className="flex flex-col hidden sm:flex">
                <span className="text-sm font-bold text-slate-800 leading-tight">{profileName}</span>
                <span className="text-[10px] font-medium text-slate-500 capitalize">{profileSport}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-8 pb-8">
          <Suspense fallback={
            <div className="flex items-center justify-center h-full w-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          }>
            {renderContent()}
          </Suspense>
        </div>

      </div>
    </PortalShell>
  );
}