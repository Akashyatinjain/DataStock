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
    const fileId = e.dataTransfer.getData("text/plain");
    if (fileId && onMoveFile) {
      onMoveFile(fileId, folderId);
    }
  };

  return (
    <>
      <div className="my-5 border-t border-gray-200 dark:border-gray-800" />
      <div>
        <div className="flex items-center justify-between mb-3 px-2">
          <p className="text-xs font-semibold tracking-wider text-gray-400 uppercase">
            Folders
          </p>
          <button
            onClick={onNewFolder}
            className="text-green-600 hover:text-green-700"
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
            folders.map((folder) => {
              const id = getFolderId(folder);
              const tabId = `folder-${id}`;
              const isDragOver = dragOverFolderId === id;

              return (
                <div
                  key={id}
                  onClick={() => setActiveTab(tabId)}
                  onDragOver={(e) => handleDragOver(e, id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, id)}
                  className={`
                    group w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-sm cursor-pointer
                    ${activeTab === tabId
                      ? 'bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 font-medium'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}
                    ${isDragOver ? 'bg-green-100 dark:bg-green-950/60 border border-green-500 scale-105 shadow-md font-bold' : ''}
                  `}
                >
                  <Folder className="w-5 h-5 text-yellow-500 shrink-0" />
                  <span className="flex-1 text-left truncate">{folder.name}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onShareFolder?.(folder);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-green-600 transition rounded"
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
