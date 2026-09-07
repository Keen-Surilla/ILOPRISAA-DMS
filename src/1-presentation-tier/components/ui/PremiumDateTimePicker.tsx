// src/1-presentation-tier/pages/super-admin/PremiumDateTimePicker.tsx
import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Calendar, Clock, ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from 'lucide-react';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export interface PremiumDateTimePickerProps {
  label?: string;
  value: string | null;
  onChange: (isoLocal: string) => void;
  placeholder?: string;
  minYear?: number;
  maxYear?: number;
  disabled?: boolean;
  showTime?: boolean;
  className?: string;       // Customizes the outer wrapper
  buttonClassName?: string; // Customizes the button itself
  width?: string;           // e.g., 'w-full', 'w-64', 'w-[300px]'
  height?: string;          // e.g., 'h-12', 'h-14', 'py-3'
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function toLocalISO(y: number, m: number, d: number, h24: number, min: number): string {
  return `${y}-${pad(m + 1)}-${pad(d)}T${pad(h24)}:${pad(min)}:00`;
}

function parseValue(value: string | null): { y: number; m: number; d: number; h24: number; min: number } | null {
  if (!value) return null;
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return null;
  return { y: dt.getFullYear(), m: dt.getMonth(), d: dt.getDate(), h24: dt.getHours(), min: dt.getMinutes() };
}

function to12Hour(h24: number): { hour12: number; ampm: 'AM' | 'PM' } {
  const ampm: 'AM' | 'PM' = h24 >= 12 ? 'PM' : 'AM';
  let hour12 = h24 % 12;
  if (hour12 === 0) hour12 = 12;
  return { hour12, ampm };
}

function to24Hour(hour12: number, ampm: 'AM' | 'PM'): number {
  if (ampm === 'AM') return hour12 === 12 ? 0 : hour12;
  return hour12 === 12 ? 12 : hour12 + 12;
}

interface DayCell {
  day: number;
  current: boolean;
}

function buildGrid(year: number, month: number): DayCell[] {
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const cells: DayCell[] = [];
  for (let i = firstDow - 1; i >= 0; i--) cells.push({ day: daysInPrevMonth - i, current: false });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, current: true });
  let trailing = 1;
  while (cells.length < 42) cells.push({ day: trailing++, current: false });
  return cells;
}

export function PremiumDateTimePicker({
  label = 'Filter Date',
  value,
  onChange,
  placeholder = 'Select date...',
  minYear = 2000,
  maxYear = 2100,
  disabled,
  showTime = true,
  className = '',
  buttonClassName = '',
  width = 'w-full sm:w-auto',
  height = 'py-2',
}: PremiumDateTimePickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  const parsed = parseValue(value);
  const now = useMemo(() => new Date(), []);

  const initial = parsed ?? {
    y: now.getFullYear(),
    m: now.getMonth(),
    d: now.getDate(),
    h24: now.getHours(),
    min: 0,
  };

  const [viewYear, setViewYear] = useState(initial.y);
  const [viewMonth, setViewMonth] = useState(initial.m);
  const [selDay, setSelDay] = useState<number | null>(parsed ? parsed.d : null);
  const [selYear, setSelYear] = useState(initial.y);
  const [selMonth, setSelMonth] = useState(initial.m);

  const { hour12: initHour12, ampm: initAmpm } = to12Hour(initial.h24);
  const [hour12, setHour12] = useState(initHour12);
  const [minute, setMinute] = useState(initial.min);
  const [ampm, setAmpm] = useState<'AM' | 'PM'>(initAmpm);

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  const grid = useMemo(() => buildGrid(viewYear, viewMonth), [viewYear, viewMonth]);

  const shiftMonth = useCallback((delta: number) => {
    let m = viewMonth + delta;
    let y = viewYear;
    while (m < 0) { m += 12; y -= 1; }
    while (m > 11) { m -= 12; y += 1; }
    if (y >= minYear && y <= maxYear) { setViewYear(y); setViewMonth(m); }
  }, [viewMonth, viewYear, minYear, maxYear]);

  const years = useMemo(() => {
    const list: number[] = [];
    for (let y = minYear; y <= maxYear; y++) list.push(y);
    return list;
  }, [minYear, maxYear]);

  const pickDay = useCallback((day: number) => {
    setSelDay(day);
    setSelYear(viewYear);
    setSelMonth(viewMonth);
  }, [viewYear, viewMonth]);

  const bumpHour = useCallback((dir: 1 | -1) => {
    setHour12((h) => {
      let next = h + dir;
      if (next > 12) next = 1;
      if (next < 1) next = 12;
      return next;
    });
  }, []);

  const bumpMinute = useCallback((dir: 1 | -1) => {
    setMinute((m) => {
      let next = m + dir;
      if (next > 59) next = 0;
      if (next < 0) next = 59;
      return next;
    });
  }, []);

  const toggleAmpm = useCallback(() => {
    setAmpm((a) => (a === 'AM' ? 'PM' : 'AM'));
  }, []);

  const goToday = useCallback(() => {
    const t = new Date();
    setViewYear(t.getFullYear());
    setViewMonth(t.getMonth());
    setSelYear(t.getFullYear());
    setSelMonth(t.getMonth());
    setSelDay(t.getDate());
  }, []);

  const goNow = useCallback(() => {
    const t = new Date();
    const { hour12: h12, ampm: ap } = to12Hour(t.getHours());
    setHour12(h12);
    setMinute(t.getMinutes());
    setAmpm(ap);
  }, []);

  const handleDone = useCallback(() => {
    const day = selDay ?? 1;
    const h24 = showTime ? to24Hour(hour12, ampm) : 0;
    const min = showTime ? minute : 0;
    onChange(toLocalISO(selYear, selMonth, day, h24, min));
    setIsOpen(false);
  }, [selYear, selMonth, selDay, hour12, ampm, minute, showTime, onChange]);

  const displayText = parsed && selDay !== null
    ? showTime
      ? `${MONTH_NAMES[selMonth].slice(0, 3)} ${pad(selDay)}, ${selYear} | ${pad(hour12)}:${pad(minute)} ${ampm}`
      : `${pad(selMonth + 1)}/${pad(selDay)}/${selYear}`
    : null;

  return (
    <div ref={containerRef} className={`relative ${width} ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((o) => !o)}
        className={`flex items-center justify-between gap-2.5 rounded-xl border px-3.5 text-left transition-all shadow-sm bg-white border-slate-200 text-slate-800 dark:bg-[#0b1120] dark:border-slate-700 dark:text-slate-100 w-full ${height} ${
          isOpen ? 'border-blue-400 ring-2 ring-blue-500/20 dark:border-blue-500/50' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
        } ${disabled ? 'bg-slate-100 dark:bg-slate-800 cursor-not-allowed opacity-60' : ''} ${buttonClassName}`}
      >
        <div className="flex items-center gap-2.5 overflow-hidden">
          <span className="shrink-0 flex items-center gap-1 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 text-[10px] font-bold px-2.5 py-0.5">
            <Calendar className="w-3 h-3" />
            {label}
          </span>
          <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">
            {displayText ? (
              <span className="truncate">{displayText}</span>
            ) : (
              <span className="text-slate-400 dark:text-slate-500">{placeholder}</span>
            )}
          </span>
        </div>
        <Calendar className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0 ml-1" />
      </button>

      {/* Dropdown Popup Card */}
      {isOpen && (
        <div className={`settings-scrollbar absolute left-0 sm:left-auto sm:right-0 z-[80] mt-2 rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-[#0b1120] shadow-2xl p-4 text-slate-900 dark:text-slate-100 ${showTime ? 'w-[380px]' : 'w-[320px]'} max-w-[92vw]`}>
          <div className={`flex ${showTime ? 'gap-4' : 'flex-col gap-3'}`}>
            <div className="flex-1">
              <div className="flex items-center justify-between gap-1 mb-3">
                <button
                  type="button"
                  onClick={() => shiftMonth(-1)}
                  className="p-1.5 rounded-full bg-blue-600 text-white hover:bg-blue-500 transition-colors"
                  aria-label="Previous month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <select
                  value={viewMonth}
                  onChange={(e) => setViewMonth(Number(e.target.value))}
                  className="settings-scrollbar text-xs font-medium text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 bg-slate-50 dark:bg-slate-800 focus:outline-none"
                >
                  {MONTH_NAMES.map((mn, i) => (
                    <option key={mn} value={i}>{mn}</option>
                  ))}
                </select>

                <select
                  value={viewYear}
                  onChange={(e) => setViewYear(Number(e.target.value))}
                  className="settings-scrollbar text-xs font-medium text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 bg-slate-50 dark:bg-slate-800 focus:outline-none"
                >
                  {years.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => shiftMonth(1)}
                  className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  aria-label="Next month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-y-1 text-center">
                {WEEKDAYS.map((w) => (
                  <div key={w} className="text-[10px] font-bold text-slate-400 uppercase pb-1">{w}</div>
                ))}
                {grid.map((cell, i) => {
                  const isSelected = cell.current && selDay === cell.day && selMonth === viewMonth && selYear === viewYear;
                  const isToday = cell.current && viewYear === now.getFullYear() && viewMonth === now.getMonth() && cell.day === now.getDate();
                  return (
                    <button
                      type="button"
                      key={i}
                      disabled={!cell.current}
                      onClick={() => cell.current && pickDay(cell.day)}
                      className={`text-xs h-8 w-8 mx-auto rounded-xl flex items-center justify-center transition-colors font-medium ${
                        !cell.current
                          ? 'text-slate-300 dark:text-slate-600 cursor-default'
                          : isSelected
                          ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/30'
                          : isToday
                          ? 'bg-blue-50 dark:bg-blue-500/25 text-blue-600 dark:text-blue-400 font-bold border border-blue-300 dark:border-blue-500/40'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {cell.day}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Optional Time Column */}
            {showTime && (
              <div className="w-28 shrink-0 border-l border-slate-200 dark:border-slate-800 pl-3 flex flex-col">
                <p className="text-[10px] font-semibold text-slate-400 mb-2">TIME</p>
                <div className="grid grid-cols-3 gap-1 text-center mb-1">
                  <span className="text-[9px] text-slate-400">Hr</span>
                  <span className="text-[9px] text-slate-400">Min</span>
                  <span className="text-[9px] text-slate-400">A/P</span>
                </div>
                <div className="grid grid-cols-3 gap-1 items-center">
                  <SpinButton value={pad(hour12)} onUp={() => bumpHour(1)} onDown={() => bumpHour(-1)} />
                  <SpinButton value={pad(minute)} onUp={() => bumpMinute(1)} onDown={() => bumpMinute(-1)} />
                  <SpinButton value={ampm} onUp={toggleAmpm} onDown={toggleAmpm} />
                </div>
                <div className="mt-4 flex flex-col gap-1.5">
                  <button type="button" onClick={goToday} className="text-[11px] font-medium border border-slate-200 dark:border-slate-700 rounded-lg py-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors">Today</button>
                  <button type="button" onClick={goNow} className="text-[11px] font-medium border border-slate-200 dark:border-slate-700 rounded-lg py-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors">Now</button>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleDone}
            className="mt-4 w-full rounded-xl bg-blue-600 text-white text-xs font-bold py-2.5 hover:bg-blue-500 transition-colors shadow-sm"
          >
            Apply Filter
          </button>
        </div>
      )}
    </div>
  );
}

function SpinButton({ value, onUp, onDown }: { value: string; onUp: () => void; onDown: () => void }) {
  return (
    <div className="flex flex-col items-center">
      <button type="button" onClick={onUp} className="text-slate-400 hover:text-blue-600" aria-label="Increase">
        <ChevronUp className="w-3 h-3" />
      </button>
      <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-md w-full text-center py-0.5 bg-slate-50 dark:bg-slate-800">
        {value}
      </div>
      <button type="button" onClick={onDown} className="text-slate-400 hover:text-blue-600" aria-label="Decrease">
        <ChevronDown className="w-3 h-3" />
      </button>
    </div>
  );
}