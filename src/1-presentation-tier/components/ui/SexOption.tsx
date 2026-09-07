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
          className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-xl border shadow-sm transition-colors ${
            value === opt
              ? 'bg-sky-50 dark:bg-[#7dd3fc]/10 text-sky-700 dark:text-[#7dd3fc] border-sky-400 dark:border-[#7dd3fc]/40'
              : 'bg-white dark:bg-white/[0.05] text-slate-600 dark:text-[#94a3b8] border-slate-200 dark:border-white/[0.1] hover:bg-slate-50 dark:hover:bg-white/[0.08]'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}