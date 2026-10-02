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
    <div className="pt-3 mt-3 border-t border-slate-200">
      <div className="flex items-center justify-between mb-2 px-2">
        <p className="text-[11px] font-semibold tracking-wider uppercase text-[#64748B]">
          Folders ({folders.length})
        </p>
        <button
          onClick={onNewFolder}
          className="text-[#2563EB] hover:text-[#1D4ED8] transition cursor-pointer"
          title="New folder"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-0.5">
        {loading && folders.length === 0 ? (
          <div className="flex items-center gap-2 px-3 py-2 text-xs text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin text-[#2563EB]" /> Loading…
          </div>
        ) : folders.length === 0 ? (
          <p className="text-xs text-slate-500 px-3 py-2">No folders yet</p>
        ) : (
          folders.map((folder) => {
            const id = getFolderId(folder);
            const tabId = `folder-${id}`;
            const isDragOver = dragOverFolderId === id;
            const isActive = activeTab === tabId;

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
                  group w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all text-xs sm:text-sm cursor-pointer
                  ${isActive
                    ? 'bg-blue-50 text-[#2563EB] font-semibold'
                    : 'text-[#64748B] hover:bg-slate-50 hover:text-[#0F172A] font-medium'}
                  ${isDragOver ? 'bg-blue-100 border border-[#2563EB]' : ''}
                  duration-150
                `}
              >
                <Folder className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-[#2563EB]' : 'text-slate-400'}`} />
                <span className="flex-1 text-left truncate">{folder.name}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onShareFolder?.(folder);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-[#2563EB] hover:bg-blue-50 transition rounded-md"
                  title="Share folder"
                >
                  <Share2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => onDeleteFolder(e, id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 transition rounded-md"
                  title="Delete folder"
                >
                  {deletingFolderId === id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-red-500" />
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
  );
}

