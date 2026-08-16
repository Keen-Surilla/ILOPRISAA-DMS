import React, { useState, Suspense, lazy } from 'react';
import { FileText, Calendar, Settings, Users } from 'lucide-react';
import { PortalShell, type NavItem } from '../../components/layout/PortalShell';
import SettingsView from '../../pages/coach-views/SettingsView';


const AthleteDocumentsView = lazy(() => import('./AthleteDocumentsView'));
const AthleteTeamView = lazy(() => import('./AthleteTeamView'));
const AthleteScheduleView = lazy(() => import('./AthleteScheduleView'));


export default function AthleteDashboard() {
  const [activeTab, setActiveTab] = useState('documents');
  const athleteNavItems: NavItem[] = [
    { 
      id: 'team', // <-- NEW
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
      navItems={athleteNavItems}
    >
      <Suspense fallback={
        <div className="flex items-center justify-center h-full w-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      }>
        {renderContent()}
      </Suspense>
    </PortalShell>
  );
}