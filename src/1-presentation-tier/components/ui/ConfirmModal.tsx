import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
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
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);

  const handleCancel = () => {
    if (isLoading) return; // never let a click dismiss mid-request
    onCancel();
  };

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setIsClosing(false);
      return;
    }
    // Play exit animation before unmounting
    if (shouldRender) {
      setIsClosing(true);
      const timeout = setTimeout(() => {
        setShouldRender(false);
        setIsClosing(false);
      }, 150);
      return () => clearTimeout(timeout);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (!shouldRender) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleCancel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shouldRender, isLoading, onCancel]);

  if (!shouldRender) return null;

  if (typeof document === 'undefined') return null;

  const modal = (
    <div
      onClick={handleCancel}
      className={`fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-[1px] motion-reduce:animate-none ${
        isClosing ? 'animate-out fade-out duration-150' : 'animate-in fade-in duration-200'
      }`}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className={`w-full max-w-md overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900 motion-reduce:animate-none ${
          isClosing ? 'animate-out fade-out zoom-out-95 duration-150' : 'animate-in fade-in zoom-in-95 duration-200'
        }`}
      >

        {/* Header */}
        <div className="flex justify-between items-center gap-3 p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <h3 className="text-[15px] font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
          </div>
          <button
            onClick={handleCancel}
            disabled={isLoading}
            aria-label="Close"
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 active:scale-90 disabled:opacity-40 disabled:cursor-not-allowed dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-[color,background-color,transform]"
          >
            <X className="w-4 h-4"/>
          </button>
        </div>

        {/* Body */}
       <div className="p-5">
          <p className="text-sm text-slate-600 dark:text-slate-300 text-left">{message}</p>
        </div>

        {/* Footer Actions */}
        <div className="p-5 pt-4 flex gap-3 justify-end border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={handleCancel}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-[color,background-color,transform] dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-sm font-semibold text-white rounded-lg transition-[background-color,transform] shadow-md active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed ${
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

  return createPortal(modal, document.body);
}
