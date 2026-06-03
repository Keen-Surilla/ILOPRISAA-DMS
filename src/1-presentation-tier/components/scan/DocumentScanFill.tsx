import { useState } from 'react';
import { Camera, Loader2, ScanLine } from 'lucide-react';
import { scanDocumentFile } from '../../../2-application-tier/services/documentScanService';
import type { DocumentType } from '../../../3-data-tier/types/database.types';

interface DocumentScanFillProps {
  onFilled: (fields: { documentType: DocumentType; notes: string }) => void;
  disabled?: boolean;
}

export function DocumentScanFill({ onFilled, disabled }: DocumentScanFillProps) {
  const [scanning, setScanning] = useState(false);
  const [lastPreview, setLastPreview] = useState<string | null>(null);

  const runScan = async (file: File) => {
    setScanning(true);
    try {
      const result = await scanDocumentFile(file);
      setLastPreview(result.detectedText.slice(0, 120));
      onFilled({ documentType: result.documentType, notes: result.notes });
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="rounded-xl border border-dashed border-blue-300 bg-blue-50/50 p-4">
      <div className="flex items-center gap-2 text-blue-800 font-semibold text-sm mb-2">
        <ScanLine className="w-4 h-4" />
        Scan &amp; auto-fill
      </div>
      <p className="text-xs text-slate-600 mb-3">
        Take a photo or choose a file to detect document type and pre-fill notes.
      </p>
      <label className="flex items-center justify-center gap-2 w-full py-2.5 bg-slate-800 text-white rounded-lg text-sm font-medium cursor-pointer hover:bg-slate-900 transition disabled:opacity-50">
        {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
        {scanning ? 'Scanning…' : 'Scan document'}
        <input
          type="file"
          accept="image/*,application/pdf"
          capture="environment"
          className="hidden"
          disabled={disabled || scanning}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void runScan(file);
            e.target.value = '';
          }}
        />
      </label>
      {lastPreview && (
        <p className="text-[10px] text-slate-500 mt-2 line-clamp-2">Detected: {lastPreview}</p>
      )}
    </div>
  );
}
