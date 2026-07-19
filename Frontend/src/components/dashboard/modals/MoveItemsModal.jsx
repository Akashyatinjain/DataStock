import React, { useState } from 'react';
import { Folder, Move } from 'lucide-react';
import { getFolderId } from '../../../utils/fileHelpers';

const MoveItemsModal = ({ isOpen, onClose, folders, onConfirm }) => {
  const [selectedFolderId, setSelectedFolderId] = useState(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs select-none">
      <div className="bg-white dark:bg-[#1E293B] border border-gray-100 dark:border-[#334155] rounded-3xl w-full max-w-md p-6 shadow-2xl animate-scale-up text-left">
        <h3 className="text-base font-bold text-gray-900 dark:text-[#F8FAFC] mb-4 flex items-center gap-2">
          <Move className="w-5 h-5 text-[#3B82F6]" />
          Move Items
        </h3>
        <p className="text-xs text-gray-400 mb-4">
          Select the destination directory to move items:
        </p>

        <div className="max-h-60 overflow-y-auto border border-gray-100 dark:border-[#334155] rounded-2xl mb-6 bg-gray-50/50 dark:bg-[#0F172A]/20 p-2 space-y-1">
          {/* My Drive Option */}
          <div
            onClick={() => setSelectedFolderId('root')}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-sm font-semibold transition ${
              selectedFolderId === 'root'
                ? 'bg-blue-50 dark:bg-green-950/45 text-[#3B82F6] dark:text-[#3B82F6] border border-[#3B82F6]/20'
                : 'text-gray-700 dark:text-[#94A3B8] hover:bg-gray-100 dark:hover:bg-[#334155]'
            }`}
          >
            <Folder className="w-5 h-5 text-emerald-500 fill-emerald-500/10 shrink-0" />
            <span>My Drive (Root)</span>
          </div>

          {/* Folders List */}
          {folders.map((folder) => {
            const id = getFolderId(folder);
            return (
              <div
                key={id}
                onClick={() => setSelectedFolderId(id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-sm font-semibold transition ${
                  selectedFolderId === id
                    ? 'bg-blue-50 dark:bg-green-950/45 text-[#3B82F6] dark:text-[#3B82F6] border border-[#3B82F6]/20'
                    : 'text-gray-700 dark:text-[#94A3B8] hover:bg-gray-100 dark:hover:bg-[#334155]'
                }`}
              >
                <Folder className="w-5 h-5 text-yellow-500 fill-yellow-500/10 shrink-0" />
                <span className="truncate">{folder.name}</span>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end gap-3.5">
          <button
            onClick={onClose}
            className="px-4 py-2 hover:bg-gray-50 dark:hover:bg-[#334155] text-gray-500 dark:text-[#94A3B8] rounded-xl text-xs font-bold transition"
          >
            Cancel
          </button>
          <button
            onClick={() =>
              onConfirm(selectedFolderId === 'root' ? null : selectedFolderId)
            }
            disabled={!selectedFolderId}
            className="px-4 py-2 bg-[#3B82F6] hover:bg-[#2563EB] disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            Move Here
          </button>
        </div>
      </div>
    </div>
  );
};

export default MoveItemsModal;
