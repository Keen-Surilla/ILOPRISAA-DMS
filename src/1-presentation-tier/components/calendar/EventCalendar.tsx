import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';
import type { CalendarEvent, EventKind } from '../../../3-data-tier/types/database.types';
import { buildMonthGrid, clampCalendarYear, getCalendarYearBounds } from '../../../2-application-tier/utils/calendarBounds';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export interface NewEventInput {
  title: string;
  description: string;
  event_kind: EventKind;
  starts_at: string;
  ends_at: string;
}

interface EventCalendarProps {
  events: any[]; // Using any to bypass strict structural checks here
  isLoading?: boolean;
  canManage?: boolean;
  onMonthChange: (year: number, monthIndex: number) => void;
  onCreate?: (input: NewEventInput) => Promise<boolean>;
  onDelete?: (eventId: string) => Promise<boolean>;
  onEdit?: (event: any) => void;
}

export function EventCalendar({ events, isLoading, canManage, onMonthChange, onCreate, onDelete, onEdit }: EventCalendarProps) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [monthIndex, setMonthIndex] = useState(today.getMonth());
  
  const { minYear, maxYear } = getCalendarYearBounds();
  const weeks = useMemo(() => buildMonthGrid(year, monthIndex), [year, monthIndex]);

  useEffect(() => {
    onMonthChange(year, monthIndex);
  }, [year, monthIndex, onMonthChange]);

  const shiftMonth = (delta: number) => {
    let m = monthIndex + delta; let y = year;
    while (m < 0) { m += 12; y -= 1; }
    while (m > 11) { m -= 12; y += 1; }
    y = clampCalendarYear(y);
    if (y >= minYear && y <= maxYear) { setYear(y); setMonthIndex(m); }
  };

  const eventsByDay = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const ev of events) {
      const key = ev.starts_at?.slice(0, 10);
      if (key) map.set(key, [...(map.get(key) ?? []), ev]);
    }
    return map;
  }, [events]);

  // SMART COLOR LOGIC based on your rules!
  const getEventStyle = (ev: any) => {
    if (ev.status === 'Completed') return 'bg-green-100 text-green-800 border-green-200'; // Passed/Completed
    if (ev.type === 'meeting') return 'bg-yellow-100 text-yellow-800 border-yellow-300'; // Meetings
    if (ev.type === 'deadline') return 'bg-red-50 text-red-700 border-red-200'; // Deadlines
    return 'bg-blue-100 text-blue-800 border-blue-200'; // General Upcoming Events
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => shiftMonth(-1)} className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50"><ChevronLeft className="w-5 h-5" /></button>
          <h3 className="text-lg font-bold text-slate-800 min-w-[180px] text-center">{MONTH_NAMES[monthIndex]} {year}</h3>
          <button type="button" onClick={() => shiftMonth(1)} className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50"><ChevronRight className="w-5 h-5" /></button>
        </div>
      </div>

      {isLoading && <p className="px-6 py-3 text-sm text-slate-500 border-b border-slate-100">Loading events…</p>}

      <div className="grid grid-cols-7 gap-px bg-slate-200">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="bg-slate-50 py-2 text-center text-xs font-semibold text-slate-500 uppercase">{d}</div>
        ))}
        {weeks.flat().map((date, i) => {
          if (!date) return <div key={`empty-${i}`} className="bg-white min-h-[88px]" />;
          
          const y = date.getFullYear();
          const m = String(date.getMonth() + 1).padStart(2, '0');
          const d = String(date.getDate()).padStart(2, '0');
          const key = `${y}-${m}-${d}`;
          
          const dayEvents = eventsByDay.get(key) ?? [];
          const hasEvents = dayEvents.length > 0;
          const isToday = date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();

          return (
            <div key={key} className={`min-h-[88px] p-1.5 border-t border-slate-100 transition-colors ${isToday ? 'bg-blue-50/30 ring-2 ring-inset ring-blue-500' : hasEvents ? 'bg-blue-50/50' : 'bg-white'}`}>
              <span className={`text-xs font-semibold flex items-center justify-center w-6 h-6 rounded-md ${isToday ? 'bg-blue-600 text-white shadow-sm' : hasEvents ? 'bg-blue-100 text-blue-800' : 'text-slate-600'}`}>
                {date.getDate()}
              </span>
              
              <div className="mt-1.5 space-y-1">
                {dayEvents.map((ev) => (
                  <div
                    key={ev.id}
                    onClick={() => onEdit && onEdit(ev)}
                    className={`cursor-pointer text-[10px] font-medium leading-tight px-1.5 py-1 rounded border truncate flex items-center justify-between gap-1 shadow-sm transition-transform hover:scale-[1.02] ${getEventStyle(ev)}`}
                    title={ev.title}
                  >
                    <span className="truncate">{ev.title}</span>
                    {canManage && onDelete && (
                      <button type="button" onClick={(e) => { e.stopPropagation(); onDelete(ev.id); }} className="shrink-0 opacity-60 hover:opacity-100">
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