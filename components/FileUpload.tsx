
import React, { useRef, useState } from 'react';

interface FileUploadProps {
  label: string;
  type: 'photo' | 'signature';
  onFileSelect: (file: File) => void;
  preview?: string;
  isLoading?: boolean;
  t: any;
}

export const FileUpload: React.FC<FileUploadProps> = ({ label, type, onFileSelect, preview, isLoading, t }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file && (file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/jpg')) {
      onFileSelect(file);
    }
  };

  return (
    <div 
      className={`group relative flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-[3rem] transition-all cursor-pointer overflow-hidden min-h-[300px]
        ${isDragging ? 'border-indigo-500 bg-indigo-500/10 scale-[1.02]' : preview ? 'border-slate-700 bg-slate-800/30' : 'border-slate-800 hover:border-indigo-500 hover:bg-slate-800/50'}`}
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleChange}
        accept="image/jpeg,image/png,image/jpg"
        className="hidden"
      />
      
      {isLoading ? (
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400"></div>
          <p className="text-xs font-black uppercase tracking-widest text-slate-500">{t.processing}</p>
        </div>
      ) : preview ? (
        <div className="w-full flex flex-col items-center relative z-10">
          <div className="relative mb-6">
             <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full opacity-50 group-hover:opacity-100 transition-opacity"></div>
             <img src={preview} alt={label} className="h-44 w-auto object-contain rounded-2xl shadow-2xl border-4 border-slate-800 relative z-10" />
          </div>
          <span className="text-xs font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-4 py-2 rounded-full border border-indigo-500/20 group-hover:bg-indigo-500/20 transition-all">{t.reEdit}</span>
        </div>
      ) : (
        <div className="flex flex-col items-center text-center relative z-10">
          <div className="w-16 h-16 bg-slate-800 rounded-3xl flex items-center justify-center mb-6 group-hover:bg-indigo-500 group-hover:scale-110 transition-all duration-300">
            {type === 'photo' ? (
              <svg className="w-8 h-8 text-slate-500 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            ) : (
              <svg className="w-8 h-8 text-slate-500 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            )}
          </div>
          <span className="text-xl font-black tracking-tight mb-2">{label}</span>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t.clickDrag}</p>
        </div>
      )}

      {/* Background Decor */}
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
         <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
      </div>
    </div>
  );
};
