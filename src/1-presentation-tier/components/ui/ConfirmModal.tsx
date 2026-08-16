import { useEffect, useState } from 'react';
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

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setIsClosing(false);
      return;
    }
    // isOpen just went false — if we were showing, play the exit
    // animation before actually unmounting instead of vanishing instantly.
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

  if (!shouldRender) return null;

  const handleCancel = () => {
    if (isLoading) return; // never let a click dismiss mid-request
    onCancel();
  };

  return (
    <div
      className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4 motion-reduce:animate-none ${
        isClosing ? 'animate-out fade-out duration-150' : 'animate-in fade-in duration-200'
      }`}
    >
      <div
        className={`bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden motion-reduce:animate-none ${
          isClosing ? 'animate-out fade-out zoom-out-95 duration-150' : 'animate-in fade-in zoom-in-95 duration-200'
        }`}
      >

        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-lg text-slate-800">{title}</h3>
          </div>
          <button
            onClick={handleCancel}
            disabled={isLoading}
            aria-label="Close"
            className="text-slate-400 hover:text-slate-600 active:scale-90 disabled:opacity-40 disabled:cursor-not-allowed transition-[color,transform]"
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
            className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-[color,background-color,transform]"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-sm font-bold text-white rounded-lg transition-[background-color,transform] shadow-md active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed ${
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