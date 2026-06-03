/**
 * TIER 1 — PRESENTATION TIER: SecureFileUploadZone
 */

import React, { useCallback, useRef, useState } from 'react';

const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'] as const;
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_LABELS = '.pdf, .jpg, .png';

type AllowedType = typeof ALLOWED_TYPES[number];

function isAllowedType(t: string): t is AllowedType {
  return ALLOWED_TYPES.includes(t as AllowedType);
}

interface SecureFileUploadZoneProps {
  onFileAccepted: (file: File) => void;
  disabled?: boolean;
  label?: string;
}

export const SecureFileUploadZone: React.FC<SecureFileUploadZoneProps> = ({ onFileAccepted, disabled = false, label = 'Upload Document' }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const validateAndAccept = useCallback((file: File): void => {
    setValidationError(null);
    if (!isAllowedType(file.type)) {
      setValidationError(`Invalid file type "${file.type}". Accepted: ${ALLOWED_LABELS}`);
      return;
    }
    if (file.size > MAX_BYTES) {
      setValidationError(`File is ${(file.size / 1024 / 1024).toFixed(1)} MB. Maximum allowed is 5 MB.`);
      return;
    }
    if (file.size === 0) {
      setValidationError('File is empty.');
      return;
    }
    setSelectedFile(file);
    onFileAccepted(file);
  }, [onFileAccepted]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) validateAndAccept(file);
    e.target.value = '';
  }, [validateAndAccept]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) validateAndAccept(file);
  }, [validateAndAccept]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled) setDragOver(true);
  }, [disabled]);

  const handleDragLeave = useCallback(() => setDragOver(false), []);

  return (
    <div className="w-full">
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !disabled && inputRef.current?.click()}
        className={['relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 cursor-pointer transition-all duration-150', disabled ? 'opacity-50 cursor-not-allowed border-gray-200' : dragOver ? 'border-blue-500 bg-blue-50' : validationError ? 'border-red-400 bg-red-50' : selectedFile ? 'border-green-400 bg-green-50' : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'].join(' ')}
      >
        <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="sr-only" tabIndex={-1} disabled={disabled} onChange={handleChange} />
        <div className={['w-12 h-12 rounded-full flex items-center justify-center text-2xl', validationError ? 'bg-red-100' : selectedFile ? 'bg-green-100' : 'bg-white shadow-sm'].join(' ')}>
          {validationError ? '⚠️' : selectedFile ? '✅' : '📄'}
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-gray-700">{selectedFile ? 'File ready' : dragOver ? 'Drop to upload' : label}</p>
          {selectedFile && <p className="text-xs text-gray-500 mt-1 truncate max-w-xs">{selectedFile.name}</p>}
          {!selectedFile && <p className="text-xs text-gray-400 mt-1">Drag & drop or click · {ALLOWED_LABELS} · Max 5 MB</p>}
        </div>
      </div>
      {validationError && <p className="mt-2 text-xs text-red-600 flex items-center gap-1"><span aria-hidden>⚠</span>{validationError}</p>}
    </div>
  );
};
