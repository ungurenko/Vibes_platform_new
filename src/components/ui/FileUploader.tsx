import React, { useState } from 'react';
import { X, Loader2, FileText, Image as ImageIcon } from 'lucide-react';
import { uploadFile } from '../../lib/supabase';

interface FileUploaderProps {
  onUpload: (url: string) => void;
  path?: string;
  label?: string;
  accept?: string;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onUpload, path = 'uploads', label = "Загрузить файл", accept = "image/*" }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      const url = await uploadFile(file, path);
      onUpload(url);
    } catch (err: any) {
      setError(err.message || "Ошибка при загрузке");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full">
      <label className="relative flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-zinc-200 dark:border-white/10 rounded-2xl cursor-pointer hover:bg-zinc-50 dark:hover:bg-white/5 transition-all group overflow-hidden">
        <input 
          type="file" 
          className="hidden" 
          accept={accept}
          onChange={handleFileChange}
          disabled={isUploading}
        />
        
        {isUploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
            <span className="text-xs font-bold text-zinc-500">Загрузка...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-white/10 flex items-center justify-center text-zinc-400 group-hover:text-violet-500 transition-colors">
              {accept.includes('image') ? <ImageIcon size={20} /> : <FileText size={20} />}
            </div>
            <span className="text-xs font-bold text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">{label}</span>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 bg-red-50 dark:bg-red-900/20 flex items-center justify-center p-4">
             <span className="text-[10px] font-bold text-red-600 dark:text-red-400 text-center">{error}</span>
             <button onClick={(e) => { e.preventDefault(); setError(null); }} className="absolute top-1 right-1 p-1"><X size={12} /></button>
          </div>
        )}
      </label>
    </div>
  );
};
