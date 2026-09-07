import React, { useState, useMemo } from 'react';
import { Clock, FileText, AlertTriangle } from 'lucide-react';
import { useAuthStore } from '../../../2-application-tier/stores/authStore';
import { listEvents, type CalendarEventRow } from '../../../3-data-tier/services/eventService';
import { EventCalendar, VIEW_MODE_OPTIONS, type ViewMode } from '../../components/calendar/EventCalendar';
import { useQuery } from '@tanstack/react-query';

const SIDEBAR_LIST_LIMIT = 5;
const CRITICAL_DEADLINE_DAYS = 3;

function parseLocalDate(dateStr?: string | null): Date {
  if (!dateStr) return new Date();
  const [year, month, day] = dateStr.split('-').map(Number);
  if (!year || !month || !day) return new Date(dateStr);
  return new Date(year, month - 1, day);
}

function daysUntil(dateStr?: string | null): number {
  if (!dateStr) return Infinity;
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  return Math.round((parseLocalDate(dateStr).getTime() - startOfToday.getTime()) / 86_400_000);
}

// Coaches are view-only here: PRISAA/admin owns event creation. See the
// EventCalendar usage below — canManage is always false, and there is no
// add/edit modal in this file at all.
//
// NOTE: making admin-created events actually show up for a coach still
// needs a backend change. `listEvents({ userId })` currently filters by
// `user_id = eq.<coachId>` (events a coach owns), not by "events visible to
// this coach's school." Until that query (and its RLS policy) filters by
// school/target audience instead of literal ownership, this view will only
// ever show events the coach's own account created — which, once nobody
// can create from this screen, may end up empty. Flag for backend work.
export default function ScheduleView() {
  const authStore = useAuthStore();
  const user = authStore?.user;
  const userId = user?.id;

  const { data: events = [], isLoading, error: fetchError } = useQuery({
    queryKey: ['events', userId],
    queryFn: () => listEvents({ userId }),
    enabled: !!userId,
    staleTime: 30_000,
  });

  const [viewMode, setViewMode] = useState<ViewMode>('month');

  const [showAllEvents, setShowAllEvents] = useState(false);
  const [showAllDeadlines, setShowAllDeadlines] = useState(false);

  const { upcomingEvents, upcomingDeadlines } = useMemo(() => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const isUpcoming = (e: CalendarEventRow) => !!e?.event_date && parseLocalDate(e.event_date) >= startOfToday;
    const byDateAsc = (a: CalendarEventRow, b: CalendarEventRow) =>
      parseLocalDate(a?.event_date).getTime() - parseLocalDate(b?.event_date).getTime();

    return {
      upcomingEvents: events.filter((e: any) => e?.type === 'event').filter(isUpcoming).sort(byDateAsc),
      upcomingDeadlines: events.filter((e: any) => e?.type === 'deadline').filter(isUpcoming).sort(byDateAsc),
    };
  }, [events]);

  const visibleEvents = showAllEvents ? upcomingEvents : upcomingEvents.slice(0, SIDEBAR_LIST_LIMIT);
  const visibleDeadlines = showAllDeadlines ? upcomingDeadlines : upcomingDeadlines.slice(0, SIDEBAR_LIST_LIMIT);

  // The nearest upcoming deadline gets the "critical" progress-bar treatment
  // once it's within CRITICAL_DEADLINE_DAYS; the bar itself is a simple
  // days-remaining urgency indicator (no roster/profile-count data exists
  // on `events` to reproduce anything more specific).
  const criticalDeadline = upcomingDeadlines.find((d: any) => daysUntil(d?.event_date) <= CRITICAL_DEADLINE_DAYS) ?? null;
  const otherDeadlines = visibleDeadlines.filter((d: any) => d.id !== criticalDeadline?.id);

  // Assumes an Aug–May PRISAA school-year season; adjust if your actual
  // season boundary differs.
  const today = new Date();
  const seasonStartYear = today.getMonth() >= 7 ? today.getFullYear() : today.getFullYear() - 1;
  const seasonLabel = `Season ${seasonStartYear}-${seasonStartYear + 1}`;

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <header className="flex justify-between items-end">
          <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-md w-48"></div>
          <div className="h-10 w-56 bg-slate-200 dark:bg-slate-800 rounded-md"></div>
        </header>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white dark:bg-[#111827] rounded-xl h-[500px] border border-slate-200 dark:border-slate-800"></div>
          <div className="lg:col-span-1 bg-white dark:bg-[#111827] rounded-xl h-64 border border-slate-200 dark:border-slate-800"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">

      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100">Your Schedule &amp; Calendar</h2>
            <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold dark:bg-blue-500/10 dark:text-blue-300">
              {seasonLabel}
            </span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Matches, practices, and screening deadlines set by PRISAA for your team.
          </p>
        </div>

        {/* Coaches can't add events — this used to be the "Add Event" button's
            spot, now it holds the view-mode toggle instead. All four views
            are wired up: Month, Week, Day, and List. */}
        <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 gap-0.5 self-start md:self-auto">
          {VIEW_MODE_OPTIONS.map((opt) => {
            const isActive = viewMode === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setViewMode(opt.value)}
                className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </header>

      {!userId && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 text-amber-700 text-xs rounded-lg dark:bg-amber-500/10 dark:border-amber-500/30 dark:text-amber-300">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          Your session isn't fully loaded yet, so your schedule can't load right now. Try refreshing the page.
        </div>
      )}

      {fetchError && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 text-sm font-medium rounded-lg dark:bg-red-500/10 dark:border-red-500/30 dark:text-red-300">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          Failed to load calendar events: {fetchError instanceof Error ? fetchError.message : String(fetchError)}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        <div className="lg:col-span-2">
          <EventCalendar
            events={events}
            isLoading={isLoading}
            onMonthChange={(_y, _m) => {}}
            canManage={false}
            viewMode={viewMode}
          />
        </div>

        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-[#111827] rounded-xl shadow-sm dark:shadow-none border border-slate-200 dark:border-slate-800 p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Upcoming Events</h3>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">All ({upcomingEvents.length})</span>
            </div>
            <ul className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
              {upcomingEvents.length === 0 && <p className="text-xs text-slate-400 dark:text-slate-500">No upcoming matches.</p>}
              {visibleEvents.map((evt: any) => {
                const startDate = parseLocalDate(evt?.event_date);
                return (
                <li
                  key={evt.id}
                  className="flex gap-3 items-start p-2.5 rounded-lg border-l-2 border-blue-500 bg-slate-50 dark:bg-slate-900/40"
                >
                  <div className="bg-[#0f172a] dark:bg-slate-800 text-white rounded-md w-11 h-11 flex flex-col items-center justify-center shrink-0">
                    <span className="text-[9px] font-semibold uppercase text-slate-300">
                      {startDate.toLocaleString('en-US', { month: 'short' })}
                    </span>
                    <span className="text-sm font-bold leading-none mt-0.5">
                      {startDate.getDate()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{evt?.title}</h4>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                      <Clock className="w-3 h-3" /> {evt?.event_time}
                    </div>
                    <span className="inline-block mt-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
                      {evt?.status === 'Completed' ? 'Completed' : 'Official Match'}
                    </span>
                  </div>
                </li>
              )})}
            </ul>
            {upcomingEvents.length > SIDEBAR_LIST_LIMIT && (
              <button
                type="button"
                onClick={() => setShowAllEvents(v => !v)}
                className="mt-3 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                {showAllEvents ? 'Show less' : `See all (${upcomingEvents.length})`}
              </button>
            )}
          </div>

          <div className="bg-white dark:bg-[#111827] rounded-xl shadow-sm dark:shadow-none border border-slate-200 dark:border-slate-800 p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Screening Deadlines</h3>
              {criticalDeadline && (
                <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300 text-[10px] font-bold">
                  CRITICAL
                </span>
              )}
            </div>

            {upcomingDeadlines.length === 0 && <p className="text-xs text-slate-400 dark:text-slate-500">No deadlines coming up.</p>}

            {criticalDeadline && (() => {
              const remaining = Math.max(daysUntil(criticalDeadline.event_date), 0);
              const dueDate = parseLocalDate(criticalDeadline.event_date);
              const pct = Math.min(100, Math.max(6, Math.round((1 - remaining / CRITICAL_DEADLINE_DAYS) * 100)));
              return (
                <div className="mb-4 p-3 rounded-lg border border-red-200 bg-red-50 dark:border-red-500/30 dark:bg-red-500/10">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-xs font-bold text-red-800 dark:text-red-300 truncate">{criticalDeadline.title}</h4>
                        <span className="shrink-0 text-[10px] font-bold text-red-700 dark:text-red-300">
                          {remaining <= 0 ? 'Due today' : `In ${remaining} day${remaining === 1 ? '' : 's'}`}
                        </span>
                      </div>
                      <p className="text-[10px] text-red-700/80 dark:text-red-300/80 mt-1">
                        Due {dueDate.toLocaleDateString()} at {criticalDeadline.event_time}.
                      </p>
                      <div className="mt-2 h-1.5 w-full rounded-full bg-red-200 dark:bg-red-900/50 overflow-hidden">
                        <div className="h-full rounded-full bg-red-600 dark:bg-red-400" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            <ul className="space-y-1">
              {otherDeadlines.map((deadline: any) => (
                <li
                  key={deadline.id}
                  className="flex items-center gap-3 p-2 rounded-lg"
                >
                  <FileText className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="block text-xs font-medium text-slate-700 dark:text-slate-200 truncate">{deadline?.title}</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-500">
                      Due: {parseLocalDate(deadline?.event_date).toLocaleDateString()}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
            {upcomingDeadlines.length > SIDEBAR_LIST_LIMIT && (
              <button
                type="button"
                onClick={() => setShowAllDeadlines(v => !v)}
                className="mt-3 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                {showAllDeadlines ? 'Show less' : `See all (${upcomingDeadlines.length})`}
              </button>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}