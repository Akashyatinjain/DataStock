import { FolderPlus, Upload } from 'lucide-react';

export default function NewMenu({ onNewFolder, onUpload, onClose }) {
  return (
    <div className="absolute top-14 left-4 z-[100] bg-white border border-gray-100 rounded-2xl shadow-xl py-2 w-48">
      <button
        onClick={() => {
          onNewFolder();
          onClose();
        }}
        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
      >
        <FolderPlus className="w-4 h-4 text-yellow-500" />
        New Folder
      </button>
      <button
        onClick={() => {
          onUpload();
          onClose();
        }}
        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
      >
        <Upload className="w-4 h-4 text-green-500" />
        Upload File
      </button>
    </div>
  );
}
