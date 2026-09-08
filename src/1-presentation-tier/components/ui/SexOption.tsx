// src/1-presentation-tier/components/ui/SexOption.tsx
export function SexOption({
  value,
  onChange,
  options = ['Male', 'Female'],
}: {
  value: string;
  onChange: (v: string) => void;
  options?: string[];
}) {
  return (
    <div className="flex gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-xl border shadow-sm transition-all outline-none ${
            value === opt
              ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-[#7dd3fc] border-blue-600 ring-1 ring-blue-600/15 dark:border-[#7dd3fc]/60 dark:ring-[#7dd3fc]/15'
              : 'bg-white dark:bg-white/[0.05] text-slate-600 dark:text-[#94a3b8] border-slate-200 dark:border-white/[0.1] hover:border-blue-600 dark:hover:border-[#7dd3fc]/60 focus:border-blue-600 dark:focus:border-[#7dd3fc]/60'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}