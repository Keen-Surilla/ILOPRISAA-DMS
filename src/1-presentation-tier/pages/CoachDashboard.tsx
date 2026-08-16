import React, { useMemo, useState, useEffect, Suspense, lazy } from 'react';
import { Calendar, Users, LayoutDashboard, Settings, Clock, ClipboardCheck, Bell, CheckCircle2, UserCircle, AlertCircle, ArrowRight, Search, Download, FileText, CheckSquare, Archive } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../2-application-tier/stores/authStore';
import { teamApi } from '../../3-data-tier/api/teamApi';
import { documentsApi, TOTAL_REQUIRED_DOCUMENTS } from '../../3-data-tier/api/documentsApi';
import { listEvents } from '../../3-data-tier/services/eventService';
import { PortalShell } from '../components/layout/PortalShell';
import { DocumentChecklistModal } from '../components/ui/DocumentChecklistModal';
import { ChartSkeleton, PieChartSkeleton, ListRowSkeleton} from '../components/ui/SkeletonLoading';

// --- MUI X CHARTS ---
import { LineChart } from '@mui/x-charts/LineChart';
import { PieChart } from '@mui/x-charts/PieChart';

// Lazy Load other tabs
const TeamView = React.lazy(() => import('./coach-views/TeamView')); // Make sure this path matches your exact folder structure!
const ScheduleView = lazy(() => import('./coach-views/ScheduleView'));
const SettingsView = lazy(() => import('./coach-views/SettingsView'));
const ArchivedTeamView = lazy(() => import('./coach-views/ArchivedTeamView'));
const ResourceTabs = lazy(() => import('./coach-views/ResourceTabs'));
const CoachProfileForm = lazy(() => import('./coach-views/CoachProfileForm'));
const ScreeningSubmissions = lazy(() => import('./coach-views/ScreeningSubmissions'));


interface KpiCardProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
}


function KpiCard({ icon, label, value, trend, trendUp = true }: KpiCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 transition-all hover:shadow-md">
      <div className="flex justify-between items-start mb-4">
        <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
          {icon}
        </div>
        {trend && (
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${trendUp ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {trend}
          </span>
        )}
      </div>
      <h3 className="text-slate-500 text-sm font-medium">{label}</h3>
      <p className="text-3xl font-bold text-slate-800 mt-1">{value}</p>
    </div>
  );
}

interface TrendPoint { date: Date; percent: number; }

function DashboardUI() {
  const { user } = useAuthStore();
  const coachId = user?.id;
  const [docsAthlete, setDocsAthlete] = useState<{ id: string; name: string } | null>(null);

  // Data Fetching
const { data: athletes = [], isLoading: isLoadingAthletes } = useQuery({
  queryKey: ['teamMembers', coachId],
  queryFn: () => teamApi.getTeamMembers(coachId as string),
  enabled: !!coachId,
  select: (data) => data.filter((m) => m.status === 'active'),
});
  const athleteIds = useMemo(() => athletes.map(a => a.id), [athletes]);
  const { data: documentCounts = {}, isLoading: isLoadingDocCounts } = useQuery({ queryKey: ['documentCounts', coachId, athleteIds], queryFn: () => documentsApi.getDocumentCountsForAthletes(athleteIds), enabled: athleteIds.length > 0 });
  const { data: statusCounts = {}, isLoading: isLoadingStatusCounts } = useQuery({ queryKey: ['documentStatusCounts', coachId, athleteIds], queryFn: () => documentsApi.getDocumentStatusCounts(athleteIds), enabled: athleteIds.length > 0 });
  const { data: events = [], isLoading: isLoadingEvents } = useQuery({ queryKey: ['events', coachId], queryFn: () => listEvents({ userId: coachId }), enabled: !!coachId, staleTime: 30_000 });
  const { data: uploadTimestamps = [], isLoading: isLoadingTimestamps } = useQuery({ queryKey: ['uploadTimestamps', coachId, athleteIds], queryFn: () => documentsApi.getUploadTimestamps(athleteIds), enabled: athleteIds.length > 0 });

  const isLoading = isLoadingAthletes || isLoadingDocCounts || isLoadingStatusCounts || isLoadingEvents;
  

  const totalAthletes = athletes.length;
  const totalRequiredSlots = totalAthletes * TOTAL_REQUIRED_DOCUMENTS;
  const totalCompletedSlots = Object.values(documentCounts).reduce((sum, n) => sum + Math.min(n, TOTAL_REQUIRED_DOCUMENTS), 0);
  const athletesFullyComplete = athletes.filter(a => (documentCounts[a.id] ?? 0) === TOTAL_REQUIRED_DOCUMENTS).length;
  const pendingReviews = statusCounts['pending_review'] ?? 0;
  const missingDocs = Math.max(0, totalRequiredSlots - totalCompletedSlots - pendingReviews);

  const upcomingEventsList = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return events.filter(e => e?.event_date && new Date(e.event_date) >= today).slice(0, 5);
  }, [events]);

 const upcomingEventsCount = upcomingEventsList.length;

  const trendData: TrendPoint[] = useMemo(() => {
    if (totalRequiredSlots === 0) return [];
    const parsed = uploadTimestamps.map(ts => new Date(ts)).filter(d => !Number.isNaN(d.getTime())).sort((a, b) => a.getTime() - b.getTime());
    const days = 30; const today = new Date(); today.setHours(23, 59, 59, 999);
    const points: TrendPoint[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const dayEnd = new Date(today); dayEnd.setDate(dayEnd.getDate() - i);
      const cumulativeCount = parsed.filter(d => d <= dayEnd).length;
      points.push({ date: new Date(dayEnd), percent: (Math.min(cumulativeCount, totalRequiredSlots) / totalRequiredSlots) * 100 });
    }
    return points;
  }, [uploadTimestamps, totalRequiredSlots]);

  const athletesNeedingAttention = useMemo(() => {
    return athletes.map(a => ({ ...a, completed: documentCounts[a.id] ?? 0 }))
      .filter(a => a.completed < TOTAL_REQUIRED_DOCUMENTS).sort((a, b) => a.completed - b.completed).slice(0, 5);
  }, [athletes, documentCounts]);

  const newAthletesThisWeek = useMemo(() => {
  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
  return athletes.filter(a => a.created_at && new Date(a.created_at) >= weekAgo).length;
}, [athletes]);

  return (
    <div className="animate-in fade-in duration-300">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-800">Overview</h2>
          <p className="text-slate-500 text-sm mt-1">An at-a-glance view of your team's progress.</p>
        </div>
      </header>

      {/* MATCHING THE SCREENSHOT: Top KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
<KpiCard
  icon={<Users className="w-5 h-5" />}
  label="Total Athletes"
  value={isLoading ? '—' : totalAthletes}
  trend={newAthletesThisWeek > 0 ? `+${newAthletesThisWeek} this week` : undefined}
  trendUp={true}
/>
<KpiCard
  icon={<CheckCircle2 className="w-5 h-5" />}
  label="Fully Complete"
  value={isLoading ? '—' : athletesFullyComplete}
  trend={totalAthletes > 0 ? `${Math.round((athletesFullyComplete / totalAthletes) * 100)}% of roster` : undefined}
  trendUp={true}
/>
<KpiCard
  icon={<AlertCircle className="w-5 h-5" />}
  label="Pending Reviews"
  value={isLoading ? '—' : pendingReviews}
/>
        <KpiCard icon={<Clock className="w-5 h-5" />} label="Upcoming Events" value={isLoading ? '—' : upcomingEventsCount} />
      </div>

      {/* MATCHING THE SCREENSHOT: Middle Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        
        {/* Activity Overview (Line Chart) */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h3 className="font-bold text-slate-800 text-base mb-6">Activity Overview</h3>
          {isLoading || isLoadingTimestamps ? (  <ChartSkeleton height={250} /> ) : (
            <div className="h-[250px] w-full -ml-4">
              <LineChart
                xAxis={[{ 
                  data: trendData.map(d => d.date), 
                  scaleType: 'time',
                  valueFormatter: (date: Date) => date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                  tickMinStep: 3600 * 1000 * 24 * 5
                }]}
                series={[{ 
                  data: trendData.map(d => d.percent), 
                  area: true, color: '#3b82f6', showMark: false,
                  valueFormatter: (v) => `${v?.toFixed(1)}% Completed`
                }]}
                margin={{ top: 10, bottom: 20, left: 40, right: 10 }}
              />
            </div>
          )}
        </div>

        {/* MATCHING THE SCREENSHOT: Document Status (Donut Chart) */}
        <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col">
          <h3 className="font-bold text-slate-800 text-base mb-6">Document Status</h3>
          <div className="flex-1 flex items-center justify-center">
            {isLoading ? (  <PieChartSkeleton />  ) : totalAthletes === 0 ? (
              <p className="text-sm text-slate-400 text-center">No documents found.</p>
            ) : (
              <PieChart
                series={[{
                  data: [
                    { id: 0, value: totalCompletedSlots, label: 'Verified', color: '#10b981' }, // Green
                    { id: 1, value: pendingReviews, label: 'Pending', color: '#f59e0b' },      // Yellow
                    { id: 2, value: missingDocs, label: 'Missing', color: '#f1f5f9' },         // Gray
                  ],
                  innerRadius: 60,
                  outerRadius: 100,
                  paddingAngle: 2,
                  cornerRadius: 4,
                }]}
                height={220}
                margin={{ right: 5 }}
                slotProps={{ legend: { direction: 'horizontal', position: { vertical: 'bottom', horizontal: 'center' }, } }}
              />
            )}
          </div>
        </div>
      </div>

      {/* MATCHING THE SCREENSHOT: Bottom Lists (50/50 Split) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Recent Uploads / Needs Attention */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-800 text-base">Athletes Needing Attention</h3>
            <button className="text-sm text-blue-600 font-medium hover:text-blue-700">View All</button>
          </div>
          
          {isLoading ? (  <ListRowSkeleton count={3} variant="avatar" /> ) : athletesNeedingAttention.length === 0 ? ( <p className="text-xs text-slate-400 py-4">Everyone is fully up to date!</p> ) : (
            <div className="space-y-4">
              {athletesNeedingAttention.map(a => (
                <div key={a.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-slate-600 font-bold uppercase shrink-0">
                      {a.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{a.name}</p>
                      <p className="text-xs text-slate-500">{a.completed}/{TOTAL_REQUIRED_DOCUMENTS} Documents</p>
                    </div>
                  </div>
                  <button onClick={() => setDocsAthlete({ id: a.id, name: a.name })} className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">
                    Review <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Events */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-800 text-base">Upcoming Events</h3>
            <button className="text-sm text-blue-600 font-medium hover:text-blue-700">Calendar</button>
          </div>
          
          <div className="space-y-4">
            {isLoading && <ListRowSkeleton count={3} variant="date" /> }
            {!isLoading && upcomingEventsList.length === 0 && ( <p className="text-xs text-slate-400 py-4">Nothing scheduled.</p> )}
            {upcomingEventsList.map(evt => (
              <div key={evt.id} className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100">
                <div className="bg-[#0f172a] text-white rounded-xl w-12 h-12 flex flex-col items-center justify-center shrink-0 shadow-sm">
                  <span className="text-[10px] font-medium text-slate-300 uppercase">{new Date(evt.event_date).toLocaleString('default', { month: 'short' })}</span>
                  <span className="text-lg font-bold leading-none">{new Date(evt.event_date).getDate()}</span>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-slate-800">{evt.title}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">{evt.type}</span>
                    <span className="flex items-center gap-1 text-[11px] text-slate-400"><Clock className="w-3 h-3" /> {evt.event_time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <DocumentChecklistModal isOpen={docsAthlete !== null} athleteId={docsAthlete?.id ?? null} athleteName={docsAthlete?.name ?? ''} coachUserId={coachId ?? ''} onClose={() => setDocsAthlete(null)} />
    </div>
  );
}


export default function CoachDashboard() {
  const { role, user, signOut } = useAuthStore();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('coachDashboardTab') || 'dashboard');
  

  useEffect(() => {
    localStorage.setItem('coachDashboardTab', activeTab);
  }, [activeTab]);

  const profileName = user?.full_name || user?.email || 'Coach Profile';
  const profileSport = (user as Record<string, any>)?.sport || 'Coach';

 // Router Switcher
  const renderActiveView = () => {
    // 1. Figure out which component to show based on the tab
    let TabContent;
    switch (activeTab) {
      case 'dashboard': 
        TabContent = <DashboardUI />; 
        break;
      case 'schedule': 
        TabContent = <ScheduleView />; 
        break;
      case 'team': 
        TabContent = <TeamView />; 
        break;
      case 'archives':
        TabContent = <ArchivedTeamView />;
        break;
      case 'resources':
        TabContent = <ResourceTabs />;
        break;
      case 'coach-profile':
        TabContent = <CoachProfileForm />;
        break;
      case 'screening':
        TabContent = <ScreeningSubmissions />;
        break;
      default: 
        TabContent = <DashboardUI />; 
        break;
    }

    // 2. Return it wrapped in the Suspense fallback
    return (
      <Suspense>
        {TabContent}
      </Suspense>
    );
  };


  const allNavItems = [
    {
      label: 'Team Roster',
      path: '/coach/team',
      icon: Users,
      allowedRoles: ['coach', 'athlete'], // Guest can view
    },
    {
      label: 'My Documents',
      path: '/coach/my-documents',
      icon: FileText,
      allowedRoles: ['coach', 'athlete'], // Guest can view
    },
    {
      label: 'Document Verification',
      path: '/coach/verification',
      icon: CheckSquare,
      allowedRoles: ['coach'], // 🚫 HIDDEN from guest/athlete
    },
    {
      label: 'Team Settings',
      path: '/coach/settings',
      icon: Settings,
      allowedRoles: ['coach'], // 🚫 HIDDEN from guest/athlete
    },
  ];

  // Filter items down to only what this specific role is allowed to see
  const visibleNavItems = allNavItems.filter((item) =>
    item.allowedRoles.includes(role || 'guest')
  );
  

                return (
                  <>
                    <PortalShell
                        portalTitle="Coach Portal"
                        navGroups={[
                          {
                            label: null,
                            items: [
                              { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" />, active: activeTab === 'dashboard', onClick: () => setActiveTab('dashboard') },
                            ],
                          },
                          {
                            label: 'Roster',
                            items: [
                              { id: 'schedule', label: 'Schedule', icon: <Calendar className="w-5 h-5" />, active: activeTab === 'schedule', onClick: () => setActiveTab('schedule') },
                              { id: 'team', label: 'Team', icon: <Users className="w-5 h-5" />, active: activeTab === 'team', onClick: () => setActiveTab('team') },
                            ],
                          },
                          {
                            label: 'Eligibility',
                            items: [
                              { id: 'resources', label: 'Resources', icon: <FileText className="w-5 h-5" />, active: activeTab === 'resources', onClick: () => setActiveTab('resources') },
                              { id: 'screening', label: 'Screening', icon: <ClipboardCheck className="w-5 h-5" />, active: activeTab === 'screening', onClick: () => setActiveTab('screening') },
                              { id: 'archives', label: 'Archives', icon: <Archive className="w-5 h-5" />, active: activeTab === 'archives', onClick: () => setActiveTab('archives') },
                            ],
                          },
                          {
                            label: 'Account',
                            items: [
                              { id: 'coach-profile', label: 'My Profile', icon: <UserCircle className="w-5 h-5" />, active: activeTab === 'coach-profile', onClick: () => setActiveTab('coach-profile') },
                              { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" />, active: false, onClick: () => setIsSettingsOpen(true) },
                            ],
                          },
                        ]}
                      >
              
        <div className="p-8 max-w-7xl mx-auto font-sans text-slate-900 relative">
          
          {/* Shared Top Header (Search Bar & Profile Avatar) */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
            <div className="relative w-full max-w-md">
            </div>
            <div className="flex items-center gap-6">
              <button className="text-slate-400 hover:text-slate-800 transition-colors">
                <Bell className="w-5 h-5 " />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#0f172a] rounded-full flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                  <span className="text-white font-bold text-sm uppercase">{profileName ? profileName.charAt(0) : 'C'}</span>
                </div>
                <div className="flex flex-col hidden sm:flex">
                  <span className="text-sm font-bold text-slate-800 leading-tight">{profileName}</span>
                  <span className="text-[10px] font-medium text-slate-500 capitalize">{profileSport}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Inject the selected tab content */}
          <Suspense fallback={<div className="flex items-center justify-center h-64 text-slate-400 font-medium animate-pulse">Loading...</div>}>
            {renderActiveView()}
          </Suspense>

        </div>
      </PortalShell>

      {/* Settings Modal */}
      {isSettingsOpen && <SettingsView onClose={() => setIsSettingsOpen(false)} />}
    </>
  );
}