import { useEffect, useMemo, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Trash2, Lock } from 'lucide-react';
import type { EventKind } from '../../../3-data-tier/types/database.types.extras';
import type { CalendarEventRow } from '../../../3-data-tier/services/eventService';
import { buildMonthGrid, clampCalendarYear, getCalendarYearBounds } from '../../../2-application-tier/utils/calendarBounds';
import { ConfirmModal } from '../../components/ui/ConfirmModal';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Category mapping: our 3 stored `type` values map onto the 4-color legend
// in the design — deadlines flip from amber ("Screening Cutoff") to red
// ("Strict Freeze") once they're within CRITICAL_DEADLINE_DAYS of due.
const CRITICAL_DEADLINE_DAYS = 3;

export type ViewMode = 'month' | 'week' | 'day' | 'list';
type TypeFilter = 'all' | 'event' | 'meeting' | 'deadline';

export const VIEW_MODE_OPTIONS: { value: ViewMode; label: string }[] = [
  { value: 'month', label: 'Month' },
  { value: 'week', label: 'Week' },
  { value: 'day', label: 'Day' },
  { value: 'list', label: 'List' },
];

const FILTER_OPTIONS: { value: TypeFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'event', label: 'Matches' },
  { value: 'deadline', label: 'Deadlines' },
];

export interface NewEventInput {
  title: string;
  description: string;
  event_kind: EventKind;
  starts_at: string;
  ends_at: string;
}

interface EventCalendarProps {
  events: CalendarEventRow[];
  isLoading?: boolean;
  canManage?: boolean;
  onMonthChange: (year: number, monthIndex: number) => void;
  onCreate?: (input: NewEventInput) => Promise<boolean>;
  onDelete?: (eventId: string) => Promise<boolean>;
  onEdit?: (event: CalendarEventRow) => void;
  /** Controlled from the parent (rendered in the page header) — defaults to internal state if omitted. */
  viewMode?: ViewMode;
}

interface CategoryVisual {
  label: string;
  chipClass: string;
  dotClass: string;
}

function daysUntil(dateStr?: string | null): number {
  if (!dateStr) return Infinity;
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return Infinity;
  const target = new Date(y, m - 1, d);
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - startOfToday.getTime()) / 86_400_000);
}

function isCriticalDeadline(ev: CalendarEventRow): boolean {
  return ev.type === 'deadline' && daysUntil(ev.event_date) <= CRITICAL_DEADLINE_DAYS;
}

// Maps our stored `type` (+ urgency, for deadlines) onto the 4-color
// legend: Official Match / Scrimmage & Training / Screening Cutoff / Strict Freeze
function getCategoryVisual(ev: CalendarEventRow): CategoryVisual {
  if (ev.type === 'meeting') {
    return {
      label: 'Scrimmage & Training',
      chipClass: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-500/10 dark:text-teal-300 dark:border-teal-500/30',
      dotClass: 'bg-teal-500 dark:bg-teal-400',
    };
  }
  if (ev.type === 'deadline') {
    if (isCriticalDeadline(ev)) {
      return {
        label: 'Strict Freeze',
        chipClass: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/30',
        dotClass: 'bg-red-500 dark:bg-red-400',
      };
    }
    return {
      label: 'Screening Cutoff',
      chipClass: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30',
      dotClass: 'bg-amber-500 dark:bg-amber-400',
    };
  }
  return {
    label: 'Official Match',
    chipClass: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/30',
    dotClass: 'bg-blue-500 dark:bg-blue-400',
  };
}

function dateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseDateStr(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

function isSameDate(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function EventCalendar({ events, isLoading, canManage, onMonthChange, onDelete, onEdit, viewMode: viewModeProp }: EventCalendarProps) {
  const today = useMemo(() => new Date(), []);
  const [year, setYear] = useState(today.getFullYear());
  const [monthIndex, setMonthIndex] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(today);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [internalViewMode] = useState<ViewMode>('month');
  const viewMode = viewModeProp ?? internalViewMode;
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');

  const { minYear, maxYear } = getCalendarYearBounds();

  const flatDays = useMemo(() => buildMonthGrid(year, monthIndex).flat(), [year, monthIndex]);

  useEffect(() => {
    onMonthChange(year, monthIndex);
  }, [year, monthIndex, onMonthChange]);

  // Prev/next behave differently depending on the active view: whole months
  // in Month/List, 7 days at a time in Week, a single day in Day. Whichever
  // way you navigate, year/monthIndex and selectedDate stay in sync so
  // switching views mid-navigation lands somewhere sensible.
  const shiftPeriod = useCallback((delta: number) => {
    if (viewMode === 'week' || viewMode === 'day') {
      const days = viewMode === 'week' ? 7 * delta : delta;
      const next = addDays(selectedDate, days);
      const y = clampCalendarYear(next.getFullYear());
      if (y < minYear || y > maxYear) return;
      setSelectedDate(next);
      setYear(next.getFullYear());
      setMonthIndex(next.getMonth());
      return;
    }
    let m = monthIndex + delta;
    let y = year;
    while (m < 0) { m += 12; y -= 1; }
    while (m > 11) { m -= 12; y += 1; }
    y = clampCalendarYear(y);
    if (y >= minYear && y <= maxYear) {
      setYear(y);
      setMonthIndex(m);
      setSelectedDate(new Date(y, m, 1));
    }
  }, [viewMode, selectedDate, monthIndex, year, minYear, maxYear]);

  const goToday = useCallback(() => {
    setYear(today.getFullYear());
    setMonthIndex(today.getMonth());
    setSelectedDate(today);
  }, [today]);

  const weekDays = useMemo(() => {
    const start = startOfWeek(selectedDate);
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [selectedDate]);

  // Events that fall within the currently displayed month, regardless of
  // the active filter chip — used for the Month grid, List view, and (as a
  // fallback) the "All (N)" style counts.
  const monthEvents = useMemo(() => {
    return events.filter((ev) => {
      if (!ev.event_date) return false;
      const [y, m] = ev.event_date.split('-').map(Number);
      return y === year && m === monthIndex + 1;
    });
  }, [events, year, monthIndex]);

  const weekRangeEvents = useMemo(() => {
    if (weekDays.length === 0) return [];
    const startKey = dateKey(weekDays[0]);
    const endKey = dateKey(weekDays[6]);
    return events.filter((ev) => {
      const key = ev.event_date?.slice(0, 10);
      return !!key && key >= startKey && key <= endKey;
    });
  }, [events, weekDays]);

  const dayRangeEvents = useMemo(() => {
    const key = dateKey(selectedDate);
    return events
      .filter((ev) => ev.event_date?.slice(0, 10) === key)
      .sort((a, b) => (a.event_time ?? '').localeCompare(b.event_time ?? ''));
  }, [events, selectedDate]);

  // Filter chip counts reflect whichever range is currently on screen.
  const activeScopeEvents = viewMode === 'week' ? weekRangeEvents : viewMode === 'day' ? dayRangeEvents : monthEvents;

  const filterCounts = useMemo(() => ({
    all: activeScopeEvents.length,
    event: activeScopeEvents.filter((e) => e.type === 'event').length,
    deadline: activeScopeEvents.filter((e) => e.type === 'deadline').length,
    meeting: activeScopeEvents.filter((e) => e.type === 'meeting').length,
  }), [activeScopeEvents]);

  const applyTypeFilter = useCallback((list: CalendarEventRow[]) => {
    if (typeFilter === 'all') return list;
    return list.filter((e) => e.type === typeFilter);
  }, [typeFilter]);

  const visibleMonthEvents = useMemo(() => applyTypeFilter(monthEvents), [monthEvents, applyTypeFilter]);
  const visibleWeekRangeEvents = useMemo(() => applyTypeFilter(weekRangeEvents), [weekRangeEvents, applyTypeFilter]);
  const visibleDayRangeEvents = useMemo(() => applyTypeFilter(dayRangeEvents), [dayRangeEvents, applyTypeFilter]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEventRow[]>();
    for (const ev of visibleMonthEvents) {
      const key = ev.event_date?.slice(0, 10);
      if (key) map.set(key, [...(map.get(key) ?? []), ev]);
    }
    return map;
  }, [visibleMonthEvents]);

  const eventsByWeekDay = useMemo(() => {
    const map = new Map<string, CalendarEventRow[]>();
    for (const ev of visibleWeekRangeEvents) {
      const key = ev.event_date?.slice(0, 10);
      if (key) map.set(key, [...(map.get(key) ?? []), ev]);
    }
    return map;
  }, [visibleWeekRangeEvents]);

  // For List view: same month + type-filter scope as the grid, just grouped
  // by date and flattened into an agenda instead of laid out on a calendar.
  const listGroups = useMemo(() => {
    const sorted = [...visibleMonthEvents].sort((a, b) => {
      const dateCompare = (a.event_date ?? '').localeCompare(b.event_date ?? '');
      if (dateCompare !== 0) return dateCompare;
      return (a.event_time ?? '').localeCompare(b.event_time ?? '');
    });
    const groups = new Map<string, CalendarEventRow[]>();
    for (const ev of sorted) {
      const key = ev.event_date?.slice(0, 10);
      if (!key) continue;
      groups.set(key, [...(groups.get(key) ?? []), ev]);
    }
    return Array.from(groups.entries()).map(([dateStr, evs]) => ({ dateStr, events: evs }));
  }, [visibleMonthEvents]);

  const periodLabel = useMemo(() => {
    if (viewMode === 'week') {
      const start = weekDays[0];
      const end = weekDays[6];
      const sameMonth = start.getMonth() === end.getMonth();
      const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const endStr = end.toLocaleDateString('en-US', sameMonth ? { day: 'numeric', year: 'numeric' } : { month: 'short', day: 'numeric', year: 'numeric' });
      return `${startStr} – ${endStr}`;
    }
    if (viewMode === 'day') {
      return selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    }
    return `${MONTH_NAMES[monthIndex]} ${year}`;
  }, [viewMode, weekDays, selectedDate, monthIndex, year]);

  const handleEditClick = useCallback((ev: CalendarEventRow) => {
    if (!canManage || !onEdit) return;
    onEdit(ev);
  }, [canManage, onEdit]);

  const handleDeleteClick = useCallback((e: React.MouseEvent, eventId: string, title: string) => {
    e.stopPropagation();
    if (!onDelete) return;
    // Open a styled in-app confirmation instead of the browser's window.confirm()
    setDeleteTarget({ id: eventId, title });
  }, [onDelete]);

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget || !onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete(deleteTarget.id);
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  }, [deleteTarget, onDelete]);

  const cancelDelete = useCallback(() => {
    if (isDeleting) return; // don't let a stray click dismiss mid-request
    setDeleteTarget(null);
  }, [isDeleting]);

  // Small, compact chip used inside Month/Week grid day-cells.
  const renderCompactChip = (ev: CalendarEventRow, keyBase: string) => {
    const visual = getCategoryVisual(ev);
    const critical = isCriticalDeadline(ev);
    return (
      <div
        key={ev.id ?? keyBase}
        role={canManage ? 'button' : undefined}
        tabIndex={canManage ? 0 : undefined}
        onClick={() => handleEditClick(ev)}
        className={`text-[10px] font-medium leading-tight px-1.5 py-1 rounded border truncate flex items-center justify-between gap-1 shadow-sm transition-transform ${
          canManage ? 'cursor-pointer hover:scale-[1.02]' : 'cursor-default'
        } ${visual.chipClass} ${ev.status === 'Completed' ? 'opacity-60 line-through decoration-1' : ''}`}
        title={ev.title}
      >
        <span className="truncate flex items-center gap-1">
          {critical && <Lock className="w-2.5 h-2.5 shrink-0" />}
          {ev.title}
        </span>
        {canManage && onDelete && (
          <button
            type="button"
            onClick={(e) => handleDeleteClick(e, ev.id, ev.title)}
            className="shrink-0 opacity-60 hover:opacity-100"
            aria-label={`Delete ${ev.title}`}
          >
            <Trash2 className="w-3 h-3" />
          </button>
        )}
      </div>
    );
  };

  // Wider agenda-style row used by List view and Day view.
  const renderAgendaRow = (ev: CalendarEventRow, keyBase: string) => {
    const visual = getCategoryVisual(ev);
    const critical = isCriticalDeadline(ev);
    return (
      <div
        key={ev.id ?? keyBase}
        role={canManage ? 'button' : undefined}
        tabIndex={canManage ? 0 : undefined}
        onClick={() => handleEditClick(ev)}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border text-sm transition-transform ${
          canManage ? 'cursor-pointer hover:scale-[1.005]' : 'cursor-default'
        } ${visual.chipClass} ${ev.status === 'Completed' ? 'opacity-60' : ''}`}
      >
        <span className={`w-2 h-2 rounded-full shrink-0 ${visual.dotClass}`} />
        <span className="text-xs font-semibold w-16 shrink-0">{ev.event_time || '—'}</span>
        <span className={`flex-1 min-w-0 truncate font-medium ${ev.status === 'Completed' ? 'line-through decoration-1' : ''}`}>
          {ev.title}
        </span>
        <span className="text-[10px] font-bold uppercase tracking-wide shrink-0 flex items-center gap-1">
          {critical && <Lock className="w-3 h-3" />}
          {visual.label}
        </span>
        {canManage && onDelete && (
          <button
            type="button"
            onClick={(e) => handleDeleteClick(e, ev.id, ev.title)}
            className="shrink-0 opacity-60 hover:opacity-100"
            aria-label={`Delete ${ev.title}`}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm dark:shadow-none overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => shiftPeriod(-1)}
            aria-label="Previous"
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 min-w-[160px] text-center">{periodLabel}</h3>
          <button
            type="button"
            onClick={() => shiftPeriod(1)}
            aria-label="Next"
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={goToday}
            className="ml-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            Today
          </button>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            {FILTER_OPTIONS.map((opt) => {
              const isActive = typeFilter === opt.value;
              const count = filterCounts[opt.value];
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setTypeFilter(opt.value)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-colors ${
                    isActive
                      ? 'bg-blue-50 border-blue-600 text-blue-700 dark:bg-blue-500/10 dark:border-blue-500 dark:text-blue-300'
                      : 'bg-white dark:bg-transparent border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {opt.label} {count}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {isLoading && <p className="px-6 py-3 text-sm text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">Loading events…</p>}

      {viewMode === 'list' && (
        <div className="p-4 sm:p-6">
          {listGroups.length === 0 && (
            <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-10">No events match this filter for {MONTH_NAMES[monthIndex]} {year}.</p>
          )}
          <div className="space-y-5">
            {listGroups.map(({ dateStr, events: dayEvents }) => {
              const date = parseDateStr(dateStr);
              const isToday = isSameDate(date, today);
              return (
                <div key={dateStr}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                      isToday ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                    }`}>
                      {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                    {isToday && <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">Today</span>}
                  </div>
                  <div className="space-y-1.5">
                    {dayEvents.map((ev, idx) => renderAgendaRow(ev, `${dateStr}-${idx}`))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {viewMode === 'week' && (
        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {weekDays.map((date) => {
              const key = dateKey(date);
              const dayEvents = eventsByWeekDay.get(key) ?? [];
              const hasEvents = dayEvents.length > 0;
              const isToday = isSameDate(date, today);
              return (
                <div key={key} className="flex flex-col">
                  <div className="text-center mb-1.5">
                    <div className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase">
                      {date.toLocaleDateString('en-US', { weekday: 'short' })}
                    </div>
                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-md text-sm font-bold mt-0.5 ${
                      isToday
                        ? 'bg-blue-600 text-white'
                        : hasEvents
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}>
                      {date.getDate()}
                    </span>
                  </div>
                  <div className={`flex-1 min-h-[220px] p-1.5 rounded-lg border space-y-1 ${
                    isToday
                      ? 'bg-blue-50/40 dark:bg-blue-500/10 border-blue-500 ring-1 ring-blue-500'
                      : hasEvents
                      ? 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800'
                      : 'bg-white dark:bg-[#0d1420] border-slate-100 dark:border-slate-800/60'
                  }`}>
                    {dayEvents.map((ev, idx) => renderCompactChip(ev, `${key}-${idx}`))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {viewMode === 'day' && (
        <div className="p-4 sm:p-6">
          {visibleDayRangeEvents.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-10">
              No events on {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}.
            </p>
          ) : (
            <div className="space-y-1.5">
              {visibleDayRangeEvents.map((ev, idx) => renderAgendaRow(ev, `day-${idx}`))}
            </div>
          )}
        </div>
      )}

      {viewMode === 'month' && (
        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mb-2">
            {WEEKDAY_NAMES.map((d) => (
              <div key={d} className="text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {flatDays.map((date, i) => {
              if (!date) return <div key={`empty-${i}`} className="min-h-[90px]" />;

              const key = dateKey(date);
              const dayEvents = eventsByDay.get(key) ?? [];
              const hasEvents = dayEvents.length > 0;
              const isToday = isSameDate(date, today);

              return (
                <div
                  key={key}
                  className={`min-h-[90px] p-1.5 rounded-lg border transition-colors ${
                    isToday
                      ? 'bg-blue-50/40 dark:bg-blue-500/10 border-blue-500 ring-1 ring-blue-500'
                      : hasEvents
                      ? 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800'
                      : 'bg-white dark:bg-[#0d1420] border-slate-100 dark:border-slate-800/60'
                  }`}
                >
                  <span className={`text-xs font-semibold flex items-center justify-center w-6 h-6 rounded-md ${
                    isToday
                      ? 'bg-blue-600 text-white shadow-sm'
                      : hasEvents
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}>
                    {date.getDate()}
                  </span>

                  <div className="mt-1.5 space-y-1">
                    {dayEvents.map((ev, idx) => renderCompactChip(ev, `${key}-${idx}`))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-4 flex-wrap text-[11px] text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500 dark:bg-blue-400" /> Official Match</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-teal-500 dark:bg-teal-400" /> Scrimmage &amp; Training</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500 dark:bg-amber-400" /> Screening Cutoff</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500 dark:bg-red-400" /> Strict Freeze</span>
      </div>

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete event?"
        message={deleteTarget ? `This will permanently delete "${deleteTarget.title}". This can't be undone.` : ''}
        confirmText="Delete"
        confirmLoadingText="Deleting…"
        isDestructive
        isLoading={isDeleting}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </div>
  );
}