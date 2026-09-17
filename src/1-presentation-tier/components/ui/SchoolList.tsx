// src/1-presentation-tier/components/ui/SchoolList.tsx
import { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ILOPRISAA_SCHOOLS } from '../../../3-data-tier/constant/schools';

interface SchoolAutocompleteProps {
  value: string;
  onChange: (name: string, id: string) => void;
  required?: boolean;
  placeholder?: string;
  inputClassName?: string;
}

export function SchoolList({ value, onChange, required, placeholder = 'Enter your school',   inputClassName, }: SchoolAutocompleteProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);


  const filteredSchools = useMemo(() => {
    if (!value) return ILOPRISAA_SCHOOLS;
    return ILOPRISAA_SCHOOLS.filter((s) =>
      s.name.toLowerCase().includes(value.toLowerCase())
    );
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      const clickedInsideInput = containerRef.current?.contains(target);
      const clickedInsideDropdown = document.getElementById('school-list-portal')?.contains(target);
      if (!clickedInsideInput && !clickedInsideDropdown) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const updatePosition = () => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <input
        ref={inputRef}
        type="text"
        required={required}
        value={value}
        onChange={(e) => {
          onChange(e.target.value, e.target.value);
          setShowSuggestions(true);
          updatePosition();
        }}
        onFocus={() => {
          setShowSuggestions(true);
          updatePosition();
        }}
        placeholder={placeholder}
        className={inputClassName ?? "w-full px-4 py-2 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition-all text-sm text-slate-800 placeholder-slate-400"}      />

      {showSuggestions && value && position &&
        createPortal(
          <ul
            id="school-list-portal"
            style={{ position: 'absolute', top: position.top, left: position.left, width: position.width }}
            className="z-[200] bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
          >
            {filteredSchools.length > 0 ? (
              filteredSchools.map((school) => (
                <li
                  key={school.id}
                  onClick={() => {
                    onChange(school.name, school.name);
                    setShowSuggestions(false);
                  }}
                  className="px-4 py-2.5 hover:bg-slate-50 cursor-pointer flex items-center justify-between text-sm text-slate-700 border-b border-slate-50 last:border-0"
                >
                  <span className="font-medium">{school.name}</span>
                </li>
              ))
            ) : (
              <li className="px-4 py-3 text-xs text-slate-400 italic text-center">
                No ILOPRISAA schools found matching "{value}"
              </li>
            )}
          </ul>,
          document.body
        )}
    </div>
  );
}
