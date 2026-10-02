import { FolderPlus, Upload, FileText } from 'lucide-react';

export default function NewMenu({ onNewFolder, onUpload, onNewDocument, onClose }) {
  return (
    <div className="absolute top-14 left-4 z-[100] bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 w-52 animate-fade-in">
      <button
        onClick={() => {
          onNewDocument?.();
          onClose();
        }}
        className="w-full flex items-center gap-3 px-4 py-2.5 text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
      >
        <FileText className="w-4 h-4 text-indigo-500" />
        New Document
      </button>
      <button
        onClick={() => {
          onNewFolder();
          onClose();
        }}
        className="w-full flex items-center gap-3 px-4 py-2.5 text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
      >
        <FolderPlus className="w-4 h-4 text-[#2563EB]" />
        New Folder
      </button>
      <button
        onClick={() => {
          onUpload();
          onClose();
        }}
        className="w-full flex items-center gap-3 px-4 py-2.5 text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
      >
        <Upload className="w-4 h-4 text-[#2563EB]" />
        Upload File
      </button>
    </div>
  );
}
