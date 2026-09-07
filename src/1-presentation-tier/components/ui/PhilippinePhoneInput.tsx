// src/1-presentation-tier/components/ui/PhilippinePhoneInput.tsx
import { useId } from 'react';

interface PhilippinePhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

export function PhilippinePhoneInput({ value, onChange, required }: PhilippinePhoneInputProps) {
  const id = useId();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let digitsOnly = e.target.value.replace(/\D/g, '');
    if (digitsOnly.startsWith('0')) digitsOnly = digitsOnly.slice(1);
    onChange(digitsOnly.slice(0, 10));
  };

  const isValid = value.length === 0 || (value.length === 10 && value.startsWith('9'));

  return (
    <div>
      <div className={`flex items-center w-full bg-white dark:bg-white/[0.05] border rounded-xl shadow-sm transition-all ${
        !isValid && value.length > 0
          ? 'border-red-300 dark:border-red-500/40 focus-within:ring-2 focus-within:ring-red-500/10 dark:focus-within:ring-red-500/10'
          : 'border-slate-200 dark:border-white/[0.1] hover:border-blue-600 dark:hover:border-[#7dd3fc]/60 focus-within:border-blue-600 dark:focus-within:border-[#7dd3fc]/60 focus-within:ring-2 focus-within:ring-blue-600/15 dark:focus-within:ring-[#7dd3fc]/15'
      }`}>
        <span className="pl-3 pr-1 py-2.5 text-sm text-slate-500 dark:text-[#94a3b8] font-medium shrink-0">+63</span>
        <input
          id={id}
          type="tel"
          inputMode="numeric"
          required={required}
          value={value}
          onChange={handleChange}
          placeholder="917 418 4486"
          className="w-full py-2.5 pr-3 bg-transparent outline-none text-sm text-slate-800 dark:text-[#f8fafc] placeholder-slate-400 dark:placeholder-[#64748b]"
        />
      </div>
      {!isValid && value.length > 0 && (
        <p className="text-[11px] text-red-500 dark:text-red-400 mt-1">
          {value.length < 10 ? `${10 - value.length} more digit${10 - value.length === 1 ? '' : 's'} needed` : 'Must start with 9'}
        </p>
      )}
    </div>
  );
}