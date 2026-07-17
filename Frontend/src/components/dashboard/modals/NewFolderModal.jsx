import { useState, useEffect, useRef } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { createNewFolder } from '../../../store/slices/foldersSlice';

export default function NewFolderModal({ onClose, onCreated, toast }) {
  const dispatch = useDispatch();
  const creating = useSelector((state) => state.folders.creating);
  const [name, setName] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleCreate = async () => {
    if (!name.trim()) return;
    const result = await dispatch(createNewFolder({ name: name.trim() }));
    if (createNewFolder.fulfilled.match(result)) {
      toast('success', `Folder "${name.trim()}" created`);
      onCreated(result.payload);
      onClose();
    } else {
      toast('error', result.payload || 'Failed to create folder');
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 dark:bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-[#1E293B] rounded-3xl shadow-2xl p-6 w-80 border border-gray-100 dark:border-[#334155] animate-fade-in">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-gray-900 dark:text-[#F8FAFC]">New Folder</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-[#334155] rounded-lg text-gray-500 dark:text-[#94A3B8] transition">
            <X className="w-4 h-4" />
          </button>
        </div>
        <input
          ref={inputRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          placeholder="Folder name"
          className="w-full bg-white dark:bg-[#334155] text-gray-900 dark:text-[#F8FAFC] border border-gray-200 dark:border-[#334155] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 mb-4"
        />
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-gray-200 dark:border-[#334155] text-gray-700 dark:text-[#94A3B8] hover:bg-gray-50 dark:hover:bg-[#334155] transition"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim() || creating}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-[#3B82F6] hover:bg-[#2563EB] text-white transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {creating && <Loader2 className="w-4 h-4 animate-spin" />}
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
