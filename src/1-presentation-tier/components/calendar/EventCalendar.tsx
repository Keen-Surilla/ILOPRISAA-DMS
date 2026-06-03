import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';
import type { CalendarEvent, EventKind } from '../../../3-data-tier/types/database.types';
import {
  buildMonthGrid,
  clampCalendarYear,
  getCalendarYearBounds,
} from '../../../2-application-tier/utils/calendarBounds';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const KIND_LABELS: Record<EventKind, string> = {
  game_start: 'Game',
  document_deadline: 'Documents',
  waiver_deadline: 'Waiver',
  form_deadline: 'Forms',
  other: 'Other',
};

const KIND_STYLES: Record<EventKind, string> = {
  game_start: 'bg-green-100 text-green-800 border-green-200',
  document_deadline: 'bg-amber-100 text-amber-800 border-amber-200',
  waiver_deadline: 'bg-purple-100 text-purple-800 border-purple-200',
  form_deadline: 'bg-blue-100 text-blue-800 border-blue-200',
  other: 'bg-slate-100 text-slate-700 border-slate-200',
};

export interface NewEventInput {
  title: string;
  description: string;
  event_kind: EventKind;
  starts_at: string;
  ends_at: string;
}

interface EventCalendarProps {
  events: CalendarEvent[];
  isLoading?: boolean;
  canManage?: boolean;
  onMonthChange: (year: number, monthIndex: number) => void;
  onCreate?: (input: NewEventInput) => Promise<boolean>;
  onDelete?: (eventId: string) => Promise<boolean>;
}

export function EventCalendar({
  events,
  isLoading,
  canManage,
  onMonthChange,
  onCreate,
  onDelete,
}: EventCalendarProps) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [monthIndex, setMonthIndex] = useState(today.getMonth());
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<NewEventInput>({
    title: '',
    description: '',
    event_kind: 'document_deadline',
    starts_at: '',
    ends_at: '',
  });

  const { minYear, maxYear } = getCalendarYearBounds();
  const weeks = useMemo(() => buildMonthGrid(year, monthIndex), [year, monthIndex]);

  useEffect(() => {
    onMonthChange(year, monthIndex);
  }, [year, monthIndex, onMonthChange]);

  const shiftMonth = (delta: number) => {
    let m = monthIndex + delta;
    let y = year;
    while (m < 0) {
      m += 12;
      y -= 1;
    }
    while (m > 11) {
      m -= 12;
      y += 1;
    }
    y = clampCalendarYear(y);
    if (y < minYear || y > maxYear) return;
    setYear(y);
    setMonthIndex(m);
  };

  const atMin = year === minYear && monthIndex === 0;
  const atMax = year === maxYear && monthIndex === 11;

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const ev of events) {
      const key = ev.starts_at.slice(0, 10);
      map.set(key, [...(map.get(key) ?? []), ev]);
    }
    return map;
  }, [events]);

  const handleCreate = async () => {
    if (!onCreate || !form.title || !form.starts_at) return;
    const ok = await onCreate(form);
    if (ok) {
      setShowForm(false);
      setForm({
        title: '',
        description: '',
        event_kind: 'document_deadline',
        starts_at: '',
        ends_at: '',
      });
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={atMin}
            onClick={() => shiftMonth(-1)}
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h3 className="text-lg font-bold text-slate-800 min-w-[180px] text-center">
            {MONTH_NAMES[monthIndex]} {year}
          </h3>
          <button
            type="button"
            disabled={atMax}
            onClick={() => shiftMonth(1)}
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
            aria-label="Next month"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-slate-500">
          Viewing {minYear}–{maxYear} ({maxYear - minYear + 1} years)
        </p>
        {canManage && onCreate && (
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            <Plus className="w-4 h-4" />
            Add deadline / event
          </button>
        )}
      </div>

      {showForm && canManage && (
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            placeholder="Event title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <select
            value={form.event_kind}
            onChange={(e) => setForm({ ...form, event_kind: e.target.value as EventKind })}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            {Object.entries(KIND_LABELS).map(([k, label]) => (
              <option key={k} value={k}>{label}</option>
            ))}
          </select>
          <input
            type="datetime-local"
            value={form.starts_at}
            onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            type="datetime-local"
            value={form.ends_at}
            onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="End (optional)"
          />
          <textarea
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="md:col-span-2 rounded-lg border border-slate-300 px-3 py-2 text-sm min-h-[60px]"
          />
          <button
            type="button"
            onClick={handleCreate}
            className="md:col-span-2 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700"
          >
            Save event
          </button>
        </div>
      )}

      {isLoading && (
        <p className="px-6 py-3 text-sm text-slate-500">Loading events…</p>
      )}

      <div className="grid grid-cols-7 gap-px bg-slate-200">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="bg-slate-50 py-2 text-center text-xs font-semibold text-slate-500 uppercase">
            {d}
          </div>
        ))}
        {weeks.flat().map((date, i) => {
          if (!date) {
            return <div key={`empty-${i}`} className="bg-white min-h-[88px]" />;
          }
          const key = date.toISOString().slice(0, 10);
          const dayEvents = eventsByDay.get(key) ?? [];
          const isToday =
            date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();

          return (
            <div
              key={key}
              className={`bg-white min-h-[88px] p-1.5 border-t border-slate-100 ${isToday ? 'ring-2 ring-inset ring-blue-400' : ''}`}
            >
              <span className={`text-xs font-semibold ${isToday ? 'text-blue-600' : 'text-slate-600'}`}>
                {date.getDate()}
              </span>
              <div className="mt-1 space-y-0.5">
                {dayEvents.map((ev) => (
                  <div
                    key={ev.id}
                    className={`text-[10px] leading-tight px-1 py-0.5 rounded border truncate flex items-center justify-between gap-0.5 ${KIND_STYLES[ev.event_kind]}`}
                    title={ev.title}
                  >
                    <span className="truncate">{ev.title}</span>
                    {canManage && onDelete && (
                      <button
                        type="button"
                        onClick={() => onDelete(ev.id)}
                        className="shrink-0 hover:text-red-700"
                        aria-label="Delete event"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
