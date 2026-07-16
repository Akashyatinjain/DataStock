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
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-6 w-80 border border-gray-100 dark:border-gray-800 animate-fade-in">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-gray-900 dark:text-gray-100">New Folder</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-500 dark:text-gray-400 transition">
            <X className="w-4 h-4" />
          </button>
        </div>
        <input
          ref={inputRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          placeholder="Folder name"
          className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 mb-4"
        />
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim() || creating}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-green-600 hover:bg-green-700 text-white transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {creating && <Loader2 className="w-4 h-4 animate-spin" />}
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
