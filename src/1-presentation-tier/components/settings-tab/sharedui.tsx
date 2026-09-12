import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, CheckCircle2 } from 'lucide-react';

export const cn = (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(' ');

// DiceBear — free, MIT-licensed, no API key.
export const buildAvatarUrl = (seed: string) =>
  `https://api.dicebear.com/9.x/shapes/svg?seed=${encodeURIComponent(seed)}&backgroundType=gradientLinear&backgroundColor=0f766e,0891b2,0e7490`;

export const generateRandomSeed = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

// Neutral grey scrollbar (matches the rest of the site) instead of the browser's default dark thumb
export const scrollbarStyles = `
  .settings-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: #cbd5e1 transparent;
  }
  .settings-scrollbar::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  .settings-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .settings-scrollbar::-webkit-scrollbar-thumb {
    background-color: #cbd5e1;
    border-radius: 9999px;
    border: 2px solid transparent;
    background-clip: padding-box;
  }
  .settings-scrollbar::-webkit-scrollbar-thumb:hover {
    background-color: #94a3b8;
  }
  .dark .settings-scrollbar {
    scrollbar-color: #475569 transparent;
  }
  .dark .settings-scrollbar::-webkit-scrollbar-thumb {
    background-color: #475569;
  }
  .dark .settings-scrollbar::-webkit-scrollbar-thumb:hover {
    background-color: #64748b;
  }
`;

// Consistent Input Focus/Hover Styles across all fields
export const sharedInputBase =
  'w-full pr-3 py-2.5 bg-white dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.1] rounded-xl text-sm text-slate-900 dark:text-[#f8fafc] shadow-sm outline-none transition-all hover:border-blue-600 dark:hover:border-[#7dd3fc]/60 focus:border-blue-600 dark:focus:border-[#7dd3fc]/60 focus:ring-2 focus:ring-blue-600/15 dark:focus:ring-[#7dd3fc]/15';

// Shape of the Settings form state, shared across the Profile and Privacy tabs.
export interface SettingsFormData {
  full_name: string;
  phone: string;
  dob: string;
  gender: string;
  sport: string;
  institution_id: string;
  team_motto: string;
  avatar_seed: string;
  secondary_disciplines: string[];
  notify_sms_missing_document: boolean;
  notify_committee_status: boolean;
  notify_roster_freeze: boolean;
  security_incident_alerts: boolean;
  aggregated_analytics: boolean;
  ocr_data_processing: boolean;
}

// Small inline toggle switch
export function ToggleSwitch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/40',
        checked ? 'bg-emerald-500 dark:bg-[#10b981]' : 'bg-slate-200 dark:bg-white/[0.12]'
      )}
    >
      <span
        className={cn(
          'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
          checked ? 'translate-x-6' : 'translate-x-1'
        )}
      />
    </button>
  );
}

export interface SportOption {
  id: string;
  name: string;
}

// Custom dropdown for sport selection
export function SportDropdown({
  value,
  onChange,
  groups,
  placeholder,
}: {
  value: string;
  onChange: (id: string) => void;
  groups: { label?: string; items: SportOption[] }[];
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selected = groups.flatMap((g) => g.items).find((s) => s.id === value);

  return (
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'w-full flex items-center justify-between gap-2 pl-3 pr-3 py-2.5 bg-white dark:bg-white/[0.05] border rounded-xl text-sm text-slate-900 dark:text-[#f8fafc] shadow-sm outline-none transition-all',
          open
            ? 'border-blue-600 ring-2 ring-blue-600/15 dark:border-[#7dd3fc]/60 dark:ring-[#7dd3fc]/15'
            : 'border-slate-200 dark:border-white/[0.1] hover:border-blue-600 dark:hover:border-[#7dd3fc]/60 focus:border-blue-600 dark:focus:border-[#7dd3fc]/60 focus:ring-2 focus:ring-blue-600/15 dark:focus:ring-[#7dd3fc]/15'
        )}
      >
        <span className={selected ? 'font-medium' : 'text-slate-400 dark:text-[#64748b]'}>
          {selected ? selected.name : placeholder || 'Select…'}
        </span>
        <ChevronDown className={cn('h-4 w-4 text-slate-400 dark:text-[#7dd3fc] transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="settings-scrollbar absolute z-30 mt-2 w-full max-h-64 overflow-auto rounded-xl border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-[#0f172a] shadow-xl shadow-black/10 dark:shadow-black/50 p-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
          {groups.map((group, gi) => (
            <div key={gi}>
              {group.label && (
                <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-[#64748b]">
                  {group.label}
                </div>
              )}
              {group.items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onChange(item.id);
                    setOpen(false);
                  }}
                  className={cn(
                    'w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-sm transition-colors text-left',
                    value === item.id
                      ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold'
                      : 'text-slate-700 dark:text-[#cbd5e1] hover:bg-slate-50 dark:hover:bg-white/[0.06]'
                  )}
                >
                  {item.name}
                  {value === item.id && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                </button>
              ))}
            </div>
          ))}
          {groups.every((g) => g.items.length === 0) && (
            <div className="px-2.5 py-3 text-sm text-slate-400 dark:text-[#64748b] text-center">No options left</div>
          )}
        </div>
      )}
    </div>
  );
}

// Collapsible text block — used for the plain-language privacy explainers
export function ExpandableItem({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-slate-100 dark:border-white/[0.06] last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-3 py-4 text-left group"
      >
        <span className="text-[13px] font-semibold text-slate-700 dark:text-[#cbd5e1] group-hover:text-blue-600 dark:group-hover:text-[#7dd3fc] transition-colors">
          {title}
        </span>
        <ChevronDown
          className={cn(
            'w-4 h-4 text-slate-400 dark:text-[#64748b] transition-transform shrink-0',
            open && 'rotate-180'
          )}
        />
      </button>
      {open && (
        <div className="pb-4 -mt-1 pr-6 animate-in fade-in slide-in-from-top-1 duration-150">
          <p className="text-[12px] leading-relaxed text-slate-500 dark:text-[#94a3b8]">{children}</p>
        </div>
      )}
    </div>
  );
}

// A labelled row with an icon, optional description, and an action button —
// used throughout the Privacy tab for exports, requests, and links out to
// other views (audit log, consent tracker, etc.)
export function ActionRow({
  icon: Icon,
  title,
  description,
  buttonLabel,
  onClick,
  variant = 'default',
}: {
  icon: React.ElementType;
  title: string;
  description?: string;
  buttonLabel: string;
  onClick?: () => void;
  variant?: 'default' | 'danger';
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div className="flex items-start gap-3 min-w-0">
        <Icon className="w-4 h-4 text-slate-400 dark:text-[#64748b] mt-0.5 shrink-0" />
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-slate-700 dark:text-[#cbd5e1]">{title}</p>
          {description && (
            <p className="text-[11px] text-slate-500 dark:text-[#94a3b8] mt-0.5">{description}</p>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'shrink-0 rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-colors whitespace-nowrap',
          variant === 'danger'
            ? 'text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20 hover:bg-red-50 dark:hover:bg-red-500/10'
            : 'text-blue-600 dark:text-[#7dd3fc] border border-blue-200 dark:border-[#7dd3fc]/20 hover:bg-blue-50 dark:hover:bg-[#7dd3fc]/10'
        )}
      >
        {buttonLabel}
      </button>
    </div>
  );
}

// Row layout used throughout
export function FieldRow({
  label,
  hint,
  tag,
  children,
  align = 'center',
  border = true,
}: {
  label: string;
  hint?: string;
  tag?: React.ReactNode;
  children: React.ReactNode;
  align?: 'center' | 'start';
  border?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex flex-col md:flex-row gap-3 md:gap-4 py-5',
        align === 'start' ? 'md:items-start' : 'md:items-center',
        border && 'border-b border-slate-100 dark:border-white/[0.06]'
      )}
    >
      <div className="md:w-1/3 shrink-0">
        <label className="text-sm font-medium text-slate-700 dark:text-[#cbd5e1]">{label}</label>
        {hint && <p className="text-[11px] text-slate-500 dark:text-[#94a3b8] mt-1">{hint}</p>}
      </div>
      <div className="w-full md:w-2/3 flex justify-end">
        <div className="w-full">
          {tag && <div className="flex justify-end mb-1.5">{tag}</div>}
          {children}
        </div>
      </div>
    </div>
  );
}