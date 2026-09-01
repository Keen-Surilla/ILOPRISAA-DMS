// src/1-presentation-tier/components/ui/SignaturePad.tsx
import { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Trash2, Upload, PenTool, Check } from 'lucide-react';
import { removeWhiteBackground } from '../../../2-application-tier/utils/imageProcessing';

interface SignaturePadProps {
  existingUrl?: string | null;
  onSave: (blob: Blob) => Promise<void>;
  isSaving?: boolean;
}

export function SignaturePad({ existingUrl, onSave, isSaving }: SignaturePadProps) {
  const [mode, setMode] = useState<'draw' | 'upload'>('draw');
  const sigCanvasRef = useRef<SignatureCanvas>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);

  const handleClearDraw = () => sigCanvasRef.current?.clear();

const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;
  setUploadedFile(file);
  setIsProcessing(true);
  try {
    const cleaned = await removeWhiteBackground(file);
    setUploadPreview(URL.createObjectURL(cleaned));
    setUploadedFile(new File([cleaned], file.name, { type: 'image/png' })); // replace with processed version
  } catch {
    setUploadPreview(URL.createObjectURL(file)); // fall back to original preview on failure
  } finally {
    setIsProcessing(false);
  }
};

  const handleSaveDrawn = async () => {
    if (!sigCanvasRef.current || sigCanvasRef.current.isEmpty()) return;
    const dataUrl = sigCanvasRef.current.getTrimmedCanvas().toDataURL('image/png');
    const blob = await (await fetch(dataUrl)).blob();
    await onSave(blob);
  };

const [isProcessing, setIsProcessing] = useState(false);

const handleSaveUploaded = async () => {
  if (!uploadedFile) return;
  setIsProcessing(true);
  try {
    const cleanedBlob = await removeWhiteBackground(uploadedFile);
    await onSave(cleanedBlob);
  } catch (err) {
    console.error('Background removal failed:', err);
    // Fall back to original file if processing fails
    await onSave(uploadedFile);
  } finally {
    setIsProcessing(false);
  }
};;

  return (
    <div className="border border-slate-200 rounded-xl p-4 bg-white">
      <div className="flex gap-2 mb-3">
        <button
          type="button"
          onClick={() => setMode('draw')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
            mode === 'draw' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          <PenTool className="w-3.5 h-3.5" /> Draw
        </button>
        <button
          type="button"
          onClick={() => setMode('upload')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
            mode === 'upload' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          <Upload className="w-3.5 h-3.5" /> Upload
        </button>
      </div>

      {existingUrl && !uploadPreview && (
        <div className="mb-3 p-2 border border-slate-100 rounded-lg bg-slate-50">
          <p className="text-[10px] text-slate-400 mb-1">Current saved signature:</p>
          <img src={existingUrl} alt="Saved signature" className="h-16 object-contain" />
        </div>
      )}

      {mode === 'draw' ? (
        <div>
          <div className="border border-slate-300 rounded-lg overflow-hidden bg-white">
            <SignatureCanvas
              ref={sigCanvasRef}
              canvasProps={{ className: 'w-full h-40' }}
              penColor="black"
            />
          </div>
          <div className="flex gap-2 mt-2">
            <button type="button" onClick={handleClearDraw} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-lg">
              <Trash2 className="w-3.5 h-3.5" /> Clear
            </button>
            <button
              type="button"
              onClick={handleSaveDrawn}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg"
            >
              <Check className="w-3.5 h-3.5" /> {isSaving ? 'Saving…' : 'Save Signature'}
            </button>
          </div>
        </div>
      ) : (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-8 border-2 border-dashed border-slate-200 rounded-lg text-sm text-slate-400 hover:border-blue-300 hover:text-blue-600 transition-colors"
          >
            {uploadPreview ? (
              <img src={uploadPreview} alt="Preview" className="h-16 mx-auto object-contain" />
            ) : (
              'Click to upload a signature image (PNG/JPG)'
            )}
          </button>
         {uploadedFile && (
            <button
                type="button"
                onClick={handleSaveUploaded}
                disabled={isSaving || isProcessing}
                className="mt-2 flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg"
            >
                <Check className="w-3.5 h-3.5" />
                {isProcessing ? 'Removing background…' : isSaving ? 'Saving…' : 'Save Signature'}
            </button>
            )}
        </div>
      )}
    </div>
  );
}