import React, { useMemo, useState } from 'react';
import { Calendar, Users, LayoutDashboard, Settings, Clock, Bell, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../2-application-tier/stores/authStore';
import { teamApi } from '../../3-data-tier/api/teamApi';
import { documentsApi, TOTAL_REQUIRED_DOCUMENTS } from '../../3-data-tier/api/documentsApi';
import { listEvents } from '../../3-data-tier/services/eventService';
import { PortalShell } from '../components/layout/PortalShell';
import { DocumentChecklistModal } from '../components/ui/DocumentChecklistModal';

interface KpiCardProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  sub?: string;
}

function KpiCard({ icon, label, value, sub }: KpiCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
      <div className="flex items-center gap-2 text-slate-400 mb-2">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
      {sub && <p className="text-[11px] text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

// Hand-rolled SVG semi-circle gauge — no charting library dependency needed
// for a single value like this.
function CompletionGauge({ percent }: { percent: number }) {
  const clamped = Math.max(0, Math.min(100, percent));
  const radius = 80;
  const circumference = Math.PI * radius; // half circle arc length
  const offset = circumference - (clamped / 100) * circumference;
  const color = clamped >= 80 ? '#16a34a' : clamped >= 50 ? '#2563eb' : '#f59e0b';

  return (
    <div className="flex flex-col items-center">
      <svg width="200" height="110" viewBox="0 0 200 110">
        <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#e2e8f0" strokeWidth="16" strokeLinecap="round" />
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke={color}
          strokeWidth="16"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div className="-mt-11 text-center">
        <p className="text-3xl font-bold text-slate-800">{clamped.toFixed(0)}%</p>
        <p className="text-xs text-slate-500 mt-1">Team document completion</p>
      </div>
    </div>
  );
}

interface TrendPoint {
  date: Date;
  percent: number;
}

// Hand-rolled SVG line/area chart — same reasoning as the gauge above:
// avoids pulling in a charting library for a single, simple trend line.
function CompletionTrendChart({ data }: { data: TrendPoint[] }) {
  const width = 600;
  const height = 180;
  const padding = 20;

  if (data.length < 2) {
    return (
      <div className="h-[180px] flex items-center justify-center text-xs text-slate-400 text-center px-4">
        Not enough upload history yet to show a trend.
      </div>
    );
  }

  const maxIndex = data.length - 1;
  const xFor = (i: number) => padding + (i / maxIndex) * (width - padding * 2);
  const yFor = (p: number) => height - padding - (Math.max(0, Math.min(100, p)) / 100) * (height - padding * 2);

  const linePoints = data.map((d, i) => `${xFor(i)},${yFor(d.percent)}`).join(' ');
  const areaPoints = `${xFor(0)},${height - padding} ${linePoints} ${xFor(maxIndex)},${height - padding}`;

  const latest = data[maxIndex];
  const first = data[0];

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-[180px]">
        <defs>
          <linearGradient id="completionTrendGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2563eb" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 50, 100].map(p => (
          <line key={p} x1={padding} x2={width - padding} y1={yFor(p)} y2={yFor(p)} stroke="#e2e8f0" strokeWidth="1" />
        ))}
        <polygon points={areaPoints} fill="url(#completionTrendGradient)" />
        <polyline
          points={linePoints}
          fill="none"
          stroke="#2563eb"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx={xFor(maxIndex)} cy={yFor(latest.percent)} r="4" fill="#2563eb" />
      </svg>
      <div className="flex justify-between text-[10px] text-slate-400 mt-1">
        <span>{first.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
        <span className="font-bold text-blue-700">
          {latest.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} · {latest.percent.toFixed(0)}%
        </span>
      </div>
    </div>
  );
}

export default function OverviewView() {
  const authStore = useAuthStore();
  const user = authStore?.user;
  const coachId = user?.id;

  const profileName = user?.full_name || user?.email || 'Coach Profile';
  const profileSport = (user as Record<string, any>)?.sport || 'Unassigned';

  // Same query keys used in TeamView.tsx / ScheduleView.tsx — this SHARES
  // their cache instead of re-fetching identical data again on this page.
  const { data: athletes = [], isLoading: isLoadingAthletes } = useQuery({
    queryKey: ['teamMembers', coachId],
    queryFn: () => teamApi.getTeamMembers(coachId as string),
    enabled: !!coachId,
  });

  const athleteIds = useMemo(() => athletes.map(a => a.id), [athletes]);

  const { data: documentCounts = {}, isLoading: isLoadingDocCounts } = useQuery({
    queryKey: ['documentCounts', coachId, athleteIds],
    queryFn: () => documentsApi.getDocumentCountsForAthletes(athleteIds),
    enabled: athleteIds.length > 0,
  });

  const { data: statusCounts = {}, isLoading: isLoadingStatusCounts } = useQuery({
    queryKey: ['documentStatusCounts', coachId, athleteIds],
    queryFn: () => documentsApi.getDocumentStatusCounts(athleteIds),
    enabled: athleteIds.length > 0,
  });

  const { data: events = [], isLoading: isLoadingEvents } = useQuery({
    queryKey: ['events', coachId],
    queryFn: () => listEvents({ userId: coachId }),
    enabled: !!coachId,
    staleTime: 30_000,
  });

  const { data: uploadTimestamps = [], isLoading: isLoadingTimestamps } = useQuery({
    queryKey: ['uploadTimestamps', coachId, athleteIds],
    queryFn: () => documentsApi.getUploadTimestamps(athleteIds),
    enabled: athleteIds.length > 0,
  });

  const [docsAthlete, setDocsAthlete] = useState<{ id: string; name: string } | null>(null);

  const isLoading = isLoadingAthletes || isLoadingDocCounts || isLoadingStatusCounts || isLoadingEvents;

  // --- Derived KPIs ---
  const totalAthletes = athletes.length;

  const totalRequiredSlots = totalAthletes * TOTAL_REQUIRED_DOCUMENTS;
  const totalCompletedSlots = Object.values(documentCounts).reduce(
    (sum, n) => sum + Math.min(n, TOTAL_REQUIRED_DOCUMENTS),
    0
  );
  const completionPercent = totalRequiredSlots > 0 ? (totalCompletedSlots / totalRequiredSlots) * 100 : 0;

  const athletesFullyComplete = athletes.filter(
    a => (documentCounts[a.id] ?? 0) === TOTAL_REQUIRED_DOCUMENTS
  ).length;

  const pendingReviews = statusCounts['pending_review'] ?? 0;

  const upcomingEventsList = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return events
      .filter(e => e?.event_date && new Date(e.event_date) >= today)
      .slice(0, 5);
  }, [events]);

  const upcomingEventsCount = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekFromNow = new Date(today);
    weekFromNow.setDate(weekFromNow.getDate() + 7);

    return events.filter(e => {
      if (!e?.event_date) return false;
      const d = new Date(e.event_date);
      return d >= today && d <= weekFromNow;
    }).length;
  }, [events]);

  // Reconstructs cumulative completion % day-by-day over the last 30 days
  // from raw upload timestamps — no separate history table required.
  const trendData: TrendPoint[] = useMemo(() => {
    if (totalRequiredSlots === 0) return [];

    const parsed = uploadTimestamps
      .map(ts => new Date(ts))
      .filter(d => !Number.isNaN(d.getTime()))
      .sort((a, b) => a.getTime() - b.getTime());

    const days = 30;
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const points: TrendPoint[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const dayEnd = new Date(today);
      dayEnd.setDate(dayEnd.getDate() - i);
      const cumulativeCount = parsed.filter(d => d <= dayEnd).length;
      points.push({
        date: new Date(dayEnd),
        percent: (Math.min(cumulativeCount, totalRequiredSlots) / totalRequiredSlots) * 100,
      });
    }
    return points;
  }, [uploadTimestamps, totalRequiredSlots]);

  const athletesNeedingAttention = useMemo(() => {
    return athletes
      .map(a => ({ ...a, completed: documentCounts[a.id] ?? 0 }))
      .filter(a => a.completed < TOTAL_REQUIRED_DOCUMENTS)
      .sort((a, b) => a.completed - b.completed)
      .slice(0, 5);
  }, [athletes, documentCounts]);

  return (
    <PortalShell
      portalTitle="Coach Portal"
      navItems={[
        { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" />, active: true, onClick: () => {} },
        { id: 'schedule', label: 'Schedule', icon: <Calendar className="w-5 h-5" />, active: false, onClick: () => {} },
        { id: 'team', label: 'Team', icon: <Users className="w-5 h-5" />, active: false, onClick: () => {} },
        { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" />, active: false, onClick: () => {} },
      ]}
    >
      <div className="p-8 max-w-7xl mx-auto font-sans text-slate-900 relative">

        {/* TOP RIGHT PROFILE HEADER */}
        <div className="flex justify-end items-center gap-6 mb-8">
          <button className="text-slate-800 hover:text-blue-600 transition-colors">
            <Bell className="w-5 h-5 fill-current" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-300 rounded-full flex items-center justify-center overflow-hidden">
              <span className="text-slate-600 font-bold text-sm uppercase">
                {profileName ? profileName.charAt(0) : 'C'}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-800 leading-tight">{profileName}</span>
              <span className="text-[10px] font-medium text-slate-500 capitalize">{profileSport}</span>
            </div>
          </div>
        </div>

        <header className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight text-slate-800">Dashboard</h2>
          <p className="text-slate-500 text-sm mt-1">An at-a-glance view of your team's progress.</p>
        </header>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <KpiCard
            icon={<Users className="w-4 h-4" />}
            label="Total Athletes"
            value={isLoading ? '—' : totalAthletes}
          />
          <KpiCard
            icon={<CheckCircle2 className="w-4 h-4" />}
            label="Fully Complete"
            value={isLoading ? '—' : `${athletesFullyComplete}/${totalAthletes}`}
            sub="athletes with all documents"
          />
          <KpiCard
            icon={<AlertCircle className="w-4 h-4" />}
            label="Pending Reviews"
            value={isLoading ? '—' : pendingReviews}
            sub="documents awaiting review"
          />
          <KpiCard
            icon={<Clock className="w-4 h-4" />}
            label="Upcoming (7 days)"
            value={isLoading ? '—' : upcomingEventsCount}
            sub="events & deadlines"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Completion Gauge */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col items-center justify-center">
            <h3 className="font-bold text-slate-800 text-sm mb-4 self-start">Team Completion Rate</h3>
            {isLoading ? (
              <div className="h-[140px] flex items-center justify-center text-xs text-slate-400">Loading…</div>
            ) : totalAthletes === 0 ? (
              <div className="h-[140px] flex items-center justify-center text-xs text-slate-400 text-center px-4">
                Add athletes to your roster to see completion stats.
              </div>
            ) : (
              <CompletionGauge percent={completionPercent} />
            )}
          </div>

          {/* Completion Trend */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-bold text-slate-800 text-sm mb-4">Completion Trend — Last 30 Days</h3>
            {isLoading || isLoadingTimestamps ? (
              <div className="h-[180px] flex items-center justify-center text-xs text-slate-400">Loading…</div>
            ) : (
              <CompletionTrendChart data={trendData} />
            )}
          </div>
        </div>

        {/* Athletes Needing Attention */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="font-bold text-slate-800 text-sm mb-5">Athletes Needing Attention</h3>
          {isLoading ? (
            <p className="text-xs text-slate-400">Loading…</p>
          ) : athletesNeedingAttention.length === 0 ? (
            <p className="text-xs text-slate-400">Everyone's fully up to date — nice work.</p>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] uppercase text-slate-400 border-b border-slate-100">
                  <th className="pb-2 font-medium">Athlete</th>
                  <th className="pb-2 font-medium">Progress</th>
                  <th className="pb-2 font-medium">Missing</th>
                  <th className="pb-2 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {athletesNeedingAttention.map(a => (
                  <tr key={a.id} className="border-b border-slate-50 last:border-0">
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-slate-500 text-xs font-bold uppercase shrink-0">
                          {a.name.charAt(0)}
                        </div>
                        <span className="text-sm font-medium text-slate-700">{a.name}</span>
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-500 rounded-full"
                            style={{ width: `${(a.completed / TOTAL_REQUIRED_DOCUMENTS) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-500">{a.completed}/{TOTAL_REQUIRED_DOCUMENTS}</span>
                      </div>
                    </td>
                    <td className="py-3 text-xs text-slate-500">
                      {TOTAL_REQUIRED_DOCUMENTS - a.completed} document{TOTAL_REQUIRED_DOCUMENTS - a.completed !== 1 ? 's' : ''}
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => setDocsAthlete({ id: a.id, name: a.name })}
                        className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-800"
                      >
                        Open <ArrowRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Upcoming events/deadlines list */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="font-bold text-slate-800 text-sm mb-5">Upcoming Events & Deadlines</h3>
          <ul className="space-y-4">
            {isLoading && <p className="text-xs text-slate-400">Loading…</p>}
            {!isLoading && upcomingEventsList.length === 0 && (
              <p className="text-xs text-slate-400">Nothing coming up.</p>
            )}
            {upcomingEventsList.map(evt => (
              <li key={evt.id} className="flex gap-4 items-start">
                <div className="bg-[#0f172a] text-white rounded-md w-10 h-10 flex flex-col items-center justify-center shrink-0">
                  <span className="text-sm font-bold">{new Date(evt.event_date).getDate()}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-slate-700">{evt.title}</h4>
                    <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500">
                      {evt.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1">
                    <Clock className="w-3 h-3" /> {evt.event_time}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <DocumentChecklistModal
        isOpen={docsAthlete !== null}
        athleteId={docsAthlete?.id ?? null}
        athleteName={docsAthlete?.name ?? ''}
        coachUserId={coachId ?? ''}
        onClose={() => setDocsAthlete(null)}
      />
    </PortalShell>
  );
}