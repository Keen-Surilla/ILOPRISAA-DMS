import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Calendar, Clock, ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from 'lucide-react';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export interface PremiumDateTimePickerProps {
  /** Small pill label shown above the trigger, e.g. "Date & Time" */
  label?: string;
  /** Local datetime string, e.g. "2026-05-01T18:00:00". Pass null/'' for empty. */
  value: string | null;
  onChange: (isoLocal: string) => void;
  placeholder?: string;
  minYear?: number;
  maxYear?: number;
  disabled?: boolean;
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

function formatDisplay(y: number, m: number, d: number, h24: number, min: number): string {
  const { hour12, ampm } = to12Hour(h24);
  return `${MONTH_NAMES[m].slice(0, 3)} ${pad(d)}, ${y}  |  ${pad(hour12)}:${pad(min)} ${ampm}`;
}

export function PremiumDateTimePicker({
  label = 'Date & Time',
  value,
  onChange,
  placeholder = 'Select date & time',
  minYear = 2000,
  maxYear = 2100,
  disabled,
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
    const h24 = to24Hour(hour12, ampm);
    onChange(toLocalISO(selYear, selMonth, day, h24, minute));
    setIsOpen(false);
  }, [selYear, selMonth, selDay, hour12, ampm, minute, onChange]);

  const displayText = parsed
    ? formatDisplay(selYear, selMonth, selDay ?? parsed.d, to24Hour(hour12, ampm), minute)
    : null;

  return (
    <div ref={containerRef} className="relative w-full max-w-sm">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((o) => !o)}
        className={`w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
          isOpen ? 'border-indigo-500 ring-2 ring-indigo-100' : 'border-slate-200 hover:border-slate-300'
        } ${disabled ? 'bg-slate-50 cursor-not-allowed opacity-60' : 'bg-white'}`}
      >
        <span className="shrink-0 flex items-center gap-1 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-semibold px-2.5 py-1">
          <Calendar className="w-3 h-3" />
          {label}
        </span>
        <span className="flex-1 flex items-center gap-2 text-sm font-medium text-slate-700 truncate">
          {displayText ? (
            <>
              <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="truncate">{MONTH_NAMES[selMonth].slice(0, 3)} {pad(selDay ?? 1)}, {selYear}</span>
              <span className="text-slate-300">|</span>
              <Clock className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{pad(hour12)}:{pad(minute)} {ampm}</span>
            </>
          ) : (
            <span className="text-slate-400">{placeholder}</span>
          )}
        </span>
        <Calendar className="w-5 h-5 text-slate-400 shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute z-20 mt-2 w-[420px] max-w-[92vw] rounded-2xl border border-slate-200 bg-white shadow-xl p-4">
          <div className="flex gap-4">
            {/* Calendar column */}
            <div className="flex-1">
              <div className="flex items-center justify-between gap-1 mb-3">
                <button
                  type="button"
                  onClick={() => shiftMonth(-1)}
                  className="p-1.5 rounded-full bg-indigo-600 text-white hover:bg-indigo-700"
                  aria-label="Previous month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <select
                  value={viewMonth}
                  onChange={(e) => setViewMonth(Number(e.target.value))}
                  className="text-sm font-medium text-slate-700 border border-slate-200 rounded-lg px-2 py-1 bg-white"
                >
                  {MONTH_NAMES.map((mn, i) => (
                    <option key={mn} value={i}>{mn}</option>
                  ))}
                </select>

                <select
                  value={viewYear}
                  onChange={(e) => setViewYear(Number(e.target.value))}
                  className="text-sm font-medium text-slate-700 border border-slate-200 rounded-lg px-2 py-1 bg-white"
                >
                  {years.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => shiftMonth(1)}
                  className="p-1.5 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
                  aria-label="Next month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-y-1 text-center">
                {WEEKDAYS.map((w) => (
                  <div key={w} className="text-[10px] font-semibold text-slate-400 uppercase pb-1">{w}</div>
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
                      className={`text-xs h-7 w-7 mx-auto rounded-lg flex items-center justify-center transition-colors ${
                        !cell.current
                          ? 'text-slate-300 cursor-default'
                          : isSelected
                          ? 'bg-indigo-600 text-white font-semibold'
                          : isToday
                          ? 'bg-indigo-50 text-indigo-700 font-semibold'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {cell.day}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time column */}
            <div className="w-32 shrink-0 border-l border-slate-100 pl-4 flex flex-col">
              <p className="text-xs font-semibold text-slate-500 mb-2">Time</p>
              <div className="grid grid-cols-3 gap-1 text-center mb-1">
                <span className="text-[10px] text-slate-400">Hour</span>
                <span className="text-[10px] text-slate-400">Min</span>
                <span className="text-[10px] text-slate-400">AM/PM</span>
              </div>

              <div className="grid grid-cols-3 gap-1 items-center">
                <SpinButton value={pad(hour12)} onUp={() => bumpHour(1)} onDown={() => bumpHour(-1)} />
                <SpinButton value={pad(minute)} onUp={() => bumpMinute(1)} onDown={() => bumpMinute(-1)} />
                <SpinButton value={ampm} onUp={toggleAmpm} onDown={toggleAmpm} />
              </div>

              <div className="mt-4 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={goToday}
                  className="text-xs font-medium border border-slate-200 rounded-lg py-1.5 hover:bg-slate-50"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={goNow}
                  className="text-xs font-medium border border-slate-200 rounded-lg py-1.5 hover:bg-slate-50"
                >
                  Now
                </button>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDone}
            className="mt-4 w-full rounded-xl bg-indigo-600 text-white text-sm font-semibold py-2.5 hover:bg-indigo-700 transition-colors"
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
}

function SpinButton({ value, onUp, onDown }: { value: string; onUp: () => void; onDown: () => void }) {
  return (
    <div className="flex flex-col items-center">
      <button type="button" onClick={onUp} className="text-slate-400 hover:text-indigo-600" aria-label="Increase">
        <ChevronUp className="w-3.5 h-3.5" />
      </button>
      <div className="text-sm font-semibold text-slate-700 border border-slate-200 rounded-md w-full text-center py-1">
        {value}
      </div>
      <button type="button" onClick={onDown} className="text-slate-400 hover:text-indigo-600" aria-label="Decrease">
        <ChevronDown className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}