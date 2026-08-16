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
      <div className={`flex items-center w-full bg-slate-50 border rounded-md focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/20 transition-colors ${
        !isValid && value.length > 0 ? 'border-red-300' : 'border-slate-200 focus-within:border-slate-400'
      }`}>
        <span className="pl-3 pr-1 py-2 text-sm text-slate-500 font-medium shrink-0">+63</span>
        <input
          id={id}
          type="tel"
          inputMode="numeric"
          required={required}
          value={value}
          onChange={handleChange}
          placeholder="917 418 4486"
          className="w-full py-2 pr-3 bg-transparent outline-none text-sm text-slate-800 placeholder-slate-400"
        />
      </div>
      {!isValid && value.length > 0 && (
        <p className="text-[11px] text-red-500 mt-1">
          {value.length < 10 ? `${10 - value.length} more digit${10 - value.length === 1 ? '' : 's'} needed` : 'Must start with 9'}
        </p>
      )}
    </div>
  );
}