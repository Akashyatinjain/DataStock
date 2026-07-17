import React, { useState } from 'react';
import { Folder, Share2, Trash2, Users, MoreVertical, Eye, Edit3, Download, Loader2 } from 'lucide-react';
import { getFolderId } from '../../../utils/fileHelpers';
import { authFetch, apiUrl } from '../../../utils/auth';

export default function FolderCard({
  folder,
  activeTab,
  setActiveTab,
  onShare,
  onDelete,
  currentUserId,
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const id = getFolderId(folder);
  const tabId = `folder-${id}`;
  const isOwner = folder.ownerId === currentUserId || folder._isOwner;
  const isShared = folder.sharedWith && folder.sharedWith.length > 0 || folder._isDirectlyShared || folder._isSharedDescendant;
  const permission = folder._sharedPermission || (folder.sharedWith && folder.sharedWith.find(sw => sw.sharedToId === currentUserId)?.permission) || 'VIEW';

  const handleOpen = () => {
    setActiveTab(tabId);
  };

  const handleShareClick = (e) => {
    e.stopPropagation();
    setShowMenu(false);
    if (onShare) onShare(folder);
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    setShowMenu(false);
    if (onDelete) onDelete(e, id);
  };

  const handleDownloadZip = async (e) => {
    e.stopPropagation();
    setShowMenu(false);
    setIsDownloading(true);
    try {
      const res = await authFetch(apiUrl(`/folders/${id}/download`));
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${folder.name}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Failed to download folder ZIP");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div
      onClick={handleOpen}
      className="group relative bg-white dark:bg-[#1E293B] border border-gray-100 dark:border-[#334155] hover:border-[#3B82F6]/30 dark:hover:border-[#3B82F6]/30 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all duration-300 cursor-pointer select-none flex flex-col justify-between h-36 animate-fade-up"
    >
      <div className="flex items-start justify-between">
        <div className="relative">
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/20 flex items-center justify-center transition-transform group-hover:scale-110 duration-300">
            <Folder className="w-6 h-6 text-amber-500 fill-amber-500/20" />
          </div>
          {isShared && (
            <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-blue-100 dark:bg-green-950 flex items-center justify-center border border-white dark:border-[#334155]">
              <Users className="w-2.5 h-2.5 text-[#3B82F6] dark:text-[#3B82F6]" />
            </div>
          )}
        </div>

        {/* Action Dropdown Menu */}
        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 hover:bg-gray-50 dark:hover:bg-[#334155] rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 mt-1 w-36 bg-white dark:bg-[#334155] border border-gray-100 dark:border-[#334155] rounded-xl shadow-lg py-1 z-20 animate-fade-in">
                {isOwner && (
                  <button
                    onClick={handleShareClick}
                    className="w-full px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-250 hover:bg-gray-50 dark:hover:bg-[#334155] transition flex items-center gap-2"
                  >
                    <Share2 className="w-3.5 h-3.5 text-[#3B82F6]" />
                    Share Folder
                  </button>
                )}
                <button
                  onClick={handleDownloadZip}
                  className="w-full px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-250 hover:bg-gray-50 dark:hover:bg-[#334155] transition flex items-center gap-2"
                >
                  <Download className="w-3.5 h-3.5 text-amber-500" />
                  Download ZIP
                </button>
                {(isOwner || permission === 'EDIT') && (
                  <button
                    onClick={handleDeleteClick}
                    className="w-full px-3 py-2 text-left text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition flex items-center gap-2"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    Delete
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mt-4 min-w-0">
        <h4 className="font-bold text-gray-900 dark:text-[#F8FAFC] text-sm truncate group-hover:text-[#3B82F6] dark:group-hover:text-[#3B82F6] transition-colors">
          {folder.name}
        </h4>
        <div className="flex items-center gap-2 mt-1 min-w-0 text-[11px] text-gray-400">
          {isOwner ? (
            <span>Owner: You</span>
          ) : (
            <span className="truncate">
              Owner: {folder.owner?.username || folder.owner?.email || 'Shared User'}
            </span>
          )}
          {isShared && (
            <span className="flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-wider text-[#3B82F6] dark:text-[#3B82F6] bg-blue-50 dark:bg-[#3B82F6]/10 px-1.5 py-0.5 rounded-full shrink-0">
              {permission === 'EDIT' ? <Edit3 className="w-2 h-2" /> : <Eye className="w-2 h-2" />}
              {permission === 'EDIT' ? 'Edit' : 'View'}
            </span>
          )}
        </div>
      </div>
      {isDownloading && (
        <div className="absolute inset-0 bg-white/80 dark:bg-[#1E293B]/80 backdrop-blur-xs z-30 flex flex-col items-center justify-center rounded-2xl animate-fade-in pointer-events-auto cursor-wait">
          <Loader2 className="w-8 h-8 text-green-500 animate-spin mb-2" />
          <span className="text-xs font-bold text-gray-700 dark:text-gray-250">Zipping Folder…</span>
        </div>
      )}
    </div>
  );
}
