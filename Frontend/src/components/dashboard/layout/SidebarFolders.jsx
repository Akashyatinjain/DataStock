import React, { useState } from 'react';
import { Plus, Folder, Trash2, Loader2, Share2 } from 'lucide-react';
import { getFolderId } from '../../../utils/fileHelpers';

export default function SidebarFolders({
  folders,
  loading,
  activeTab,
  setActiveTab,
  deletingFolderId,
  onDeleteFolder,
  onNewFolder,
  onMoveFile,
  onShareFolder,
  onNavigate,
}) {
  const [dragOverFolderId, setDragOverFolderId] = useState(null);

  const handleDragOver = (e, folderId) => {
    e.preventDefault();
    setDragOverFolderId(folderId);
  };

  const handleDragLeave = () => {
    setDragOverFolderId(null);
  };

  const handleDrop = (e, folderId) => {
    e.preventDefault();
    setDragOverFolderId(null);
    const rawData = e.dataTransfer.getData("text/plain");
    if (!rawData || !onMoveFile) return;

    try {
      if (rawData.startsWith("[") && rawData.endsWith("]")) {
        const fileIds = JSON.parse(rawData);
        if (Array.isArray(fileIds)) {
          fileIds.forEach((fileId) => onMoveFile(fileId, folderId));
        }
      } else {
        onMoveFile(rawData, folderId);
      }
    } catch (err) {
      onMoveFile(rawData, folderId);
    }
  };

  return (
    <>
      <div className="my-3.5" />
      <div>
        <div className="flex items-center justify-between mb-3 px-2">
          <p className="text-xs font-extrabold tracking-wide text-gray-400 dark:text-slate-500">
            Folders ({folders.length})
          </p>
          <button
            onClick={onNewFolder}
            className="text-[#3B82F6] hover:text-[#3B82F6]"
            title="New folder"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-1">
          {loading ? (
            <div className="flex items-center gap-2 px-3 py-2 text-xs text-gray-400">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading…
            </div>
          ) : folders.length === 0 ? (
            <p className="text-xs text-gray-400 px-3 py-2">No folders yet</p>
          ) : (
            folders.map((folder, index) => {
              const id = getFolderId(folder);
              const tabId = `folder-${id}`;
              const isDragOver = dragOverFolderId === id;

              const dotColors = [
                { bg: 'bg-yellow-400', border: 'border-yellow-400/30' },
                { bg: 'bg-blue-400', border: 'border-blue-400/30' },
                { bg: 'bg-emerald-400', border: 'border-emerald-400/30' },
                { bg: 'bg-red-400', border: 'border-red-400/30' },
                { bg: 'bg-purple-400', border: 'border-purple-400/30' },
                { bg: 'bg-orange-400', border: 'border-orange-400/30' },
              ];
              const scheme = dotColors[index % dotColors.length];

              return (
                <div
                  key={id}
                  onClick={() => {
                    setActiveTab(tabId);
                    onNavigate?.();
                  }}
                  onDragOver={(e) => handleDragOver(e, id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, id)}
                  className={`
                    group w-full flex items-center gap-2 px-3 py-2 rounded-xl transition-all text-sm cursor-pointer
                    ${activeTab === tabId
                      ? 'bg-blue-50 dark:bg-[#3B82F6]/10 text-[#3B82F6] dark:text-[#3B82F6] font-semibold shadow-2xs'
                      : 'text-gray-650 dark:text-[#94A3B8] hover:bg-gray-100 dark:hover:bg-[#334155]'}
                    ${isDragOver ? 'bg-blue-100 dark:bg-green-950/60 border border-[#3B82F6] scale-105 shadow-md font-bold' : ''}
                    hover:translate-x-0.5 duration-150
                  `}
                >
                  <span className={`w-2 h-2 rounded-full shrink-0 shadow-xs border ${scheme.bg} ${scheme.border}`} />
                  <Folder className={`w-3.5 h-3.5 shrink-0 opacity-75 ${activeTab === tabId ? 'text-[#3B82F6]' : 'text-gray-400'}`} />
                  <span className="flex-1 text-left truncate text-xs font-semibold">{folder.name}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onShareFolder?.(folder);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-[#3B82F6] transition rounded"
                    title="Share folder"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => onDeleteFolder(e, id)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition rounded"
                    title="Delete folder"
                  >
                    {deletingFolderId === id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
