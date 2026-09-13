import { FolderPlus, Upload } from 'lucide-react';

export default function NewMenu({ onNewFolder, onUpload, onClose }) {
  return (
    <div className="absolute top-14 left-4 z-[100] bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-600 rounded-xl shadow-xl py-1.5 w-48 animate-fade-in">
      <button
        onClick={() => {
          onNewFolder();
          onClose();
        }}
        className="w-full flex items-center gap-3 px-4 py-2.5 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#334155] transition cursor-pointer"
      >
        <FolderPlus className="w-4 h-4 text-[#2563EB]" />
        New Folder
      </button>
      <button
        onClick={() => {
          onUpload();
          onClose();
        }}
        className="w-full flex items-center gap-3 px-4 py-2.5 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#334155] transition cursor-pointer"
      >
        <Upload className="w-4 h-4 text-[#2563EB]" />
        Upload File
      </button>
    </div>
  );
}
