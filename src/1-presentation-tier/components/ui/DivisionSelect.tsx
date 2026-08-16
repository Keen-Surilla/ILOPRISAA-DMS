const DIVISIONS = [
  { id: 'elementary', label: 'Elementary' },
  { id: 'highschool', label: 'High School' },
  { id: 'tertiary', label: 'Tertiary' },
];

export function DivisionSelect({ value, onChange, required }: { value: string; onChange: (v: string) => void; required?: boolean }) {
  return (
    <div className="flex gap-2">
      {DIVISIONS.map((d) => (
        <button
          key={d.id}
          type="button"
          onClick={() => onChange(d.id)}
          className={`flex-1 px-3 py-2 text-xs font-bold rounded-lg border transition-colors ${
            value === d.id
              ? 'bg-blue-50 text-blue-700 border-blue-600'
              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
          }`}
        >
          {d.label}
        </button>
      ))}
    </div>
  );
}

export { DIVISIONS };