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
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-md border transition-colors ${
            value === opt
              ? 'bg-blue-50 text-blue-700 border-blue-600'
              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}