import React from 'react';
import { X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  /** Text shown on the confirm button while isLoading is true. Defaults to "Please wait…". */
  confirmLoadingText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  /** When true, disables both buttons and the close (X) button so the modal
   *  can't be dismissed or double-submitted while the action is in flight. */
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText,
  confirmLoadingText,
  cancelText = "Cancel",
  isDestructive = true,
  isLoading = false,
  onConfirm,
  onCancel
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const handleCancel = () => {
    if (isLoading) return; // never let a click dismiss mid-request
    onCancel();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden transform transition-all scale-100">

        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-lg text-slate-800">{title}</h3>
          </div>
          <button
            onClick={handleCancel}
            disabled={isLoading}
            aria-label="Close"
            className="text-slate-400 hover:text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <X className="w-5 h-5"/>
          </button>
        </div>

        {/* Body */}
       <div className="p-5">
          <p className="text-sm text-slate-600 text-left">{message}</p>
        </div>

        {/* Footer Actions */}
        <div className="p-5 pt-0 flex gap-3 justify-end mt-2">
          <button
            onClick={handleCancel}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-sm font-bold text-white rounded-lg transition-colors shadow-md disabled:opacity-60 disabled:cursor-not-allowed ${
              isDestructive
                ? 'bg-red-600 hover:bg-red-700 shadow-red-600/20'
                : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'
            }`}
          >
            {isLoading ? (confirmLoadingText ?? 'Please wait…') : confirmText}
          </button>
        </div>

      </div>
    </div>
  );
}