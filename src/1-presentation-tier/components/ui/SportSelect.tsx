import { ChevronDown } from 'lucide-react';
import { ILOPRISAA_SPORTS } from '../../../3-data-tier/constant/sports';

interface SportSelectProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

export function SportSelect({ value, onChange, required }: SportSelectProps) {
  const teamSports = ILOPRISAA_SPORTS.filter((s) => s.category === 'team');
  const individualSports = ILOPRISAA_SPORTS.filter((s) => s.category === 'individual');

  return (
    <div className="relative">
      <select
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-4 pr-10 py-2 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition-all text-sm text-slate-800 appearance-none"
      >
        <option value="" disabled>Select your sport</option>
        <optgroup label="Team Sports">
          {teamSports.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </optgroup>
        <optgroup label="Individual Sports">
          {individualSports.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </optgroup>
      </select>
      <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
    </div>
  );
}