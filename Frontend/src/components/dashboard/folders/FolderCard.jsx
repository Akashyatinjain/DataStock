import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Folder, Share2, Trash2, Users, MoreVertical, Eye, Edit3, Download, Loader2 } from 'lucide-react';
import { getFolderId } from '../../../utils/fileHelpers';
import { authFetch, apiUrl } from '../../../utils/auth';

const formatFolderSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

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
  
  // Dynamic stats calculated from global Redux state (allFiles contains every file across all folders)
  const folderFiles = useSelector((state) => (state.files.allFiles || []).filter(f => f.folderId === id));
  const fileCount = folderFiles.length;
  const folderSize = folderFiles.reduce((acc, f) => acc + (Number(f.size) || 0), 0);

  const isOwner = folder.ownerId === currentUserId || folder._isOwner;
  const isShared = folder.sharedWith && folder.sharedWith.length > 0 || folder._isDirectlyShared || folder._isSharedDescendant;
  const permission = folder._sharedPermission || (folder.sharedWith && folder.sharedWith.find(sw => sw.sharedToId === currentUserId)?.permission) || 'VIEW';

  const colorSchemes = [
    { bg: 'bg-blue-50 dark:bg-blue-950/30', text: 'text-blue-500 fill-blue-500/10' },
    { bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-500 fill-emerald-500/10' },
    { bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-500 fill-amber-500/10' },
    { bg: 'bg-purple-50 dark:bg-purple-950/30', text: 'text-purple-500 fill-purple-500/10' },
    { bg: 'bg-rose-50 dark:bg-rose-950/30', text: 'text-rose-500 fill-rose-500/10' },
    { bg: 'bg-cyan-50 dark:bg-cyan-950/30', text: 'text-cyan-500 fill-cyan-500/10' }
  ];
  const charCodeSum = (folder.name || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const scheme = colorSchemes[charCodeSum % colorSchemes.length];

  const getModifiedLabel = () => {
    const targetDate = folder.updatedAt || folder.createdAt;
    if (!targetDate) return 'Updated recently';
    const date = new Date(targetDate);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      const diffHrs = Math.max(1, Math.floor((today - date) / (1000 * 60 * 60)));
      if (diffHrs < 24) return `Updated ${diffHrs} ${diffHrs === 1 ? 'hr' : 'hrs'} ago`;
      return 'Updated today';
    }
    if (date.toDateString() === yesterday.toDateString()) return 'Updated yesterday';
    return `Updated ${date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}`;
  };

  const ownerInitial = folder.owner?.username?.charAt(0).toUpperCase() || folder.owner?.email?.charAt(0).toUpperCase() || 'U';
  const ownerName = isOwner ? 'You' : (folder.owner?.username || folder.owner?.email || 'Shared User');

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
      className="group relative bg-white dark:bg-[#1E293B] border border-gray-100 dark:border-[#334155]/60 hover:border-blue-200 dark:hover:border-blue-500/40 rounded-2xl p-4.5 shadow-xs hover:shadow-lg transition-all duration-300 cursor-pointer select-none flex flex-col justify-between h-[185px] animate-fade-up hover:scale-[1.02] hover:-translate-y-0.5"
    >
      {/* Row 1: Icon + Name and Dropdown Action */}
      <div className="flex items-center justify-between min-w-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${scheme.bg}`}>
            <Folder className={`w-6 h-6 ${scheme.text}`} />
          </div>
          <h4 className="font-extrabold text-gray-900 dark:text-[#F8FAFC] text-sm truncate group-hover:text-[#3B82F6] transition-colors leading-tight">
            {folder.name}
          </h4>
        </div>

        {/* Action Dropdown Menu */}
        <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 hover:bg-gray-50 dark:hover:bg-[#334155] rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 mt-1 w-36 bg-white dark:bg-[#334155] border border-gray-100 dark:border-[#334155] rounded-xl shadow-lg py-1.5 z-20 animate-fade-in text-left">
                {isOwner && (
                  <button
                    onClick={handleShareClick}
                    className="w-full px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-[#D1D5DB] hover:bg-gray-50 dark:hover:bg-[#334155] transition flex items-center gap-2"
                  >
                    <Share2 className="w-3.5 h-3.5 text-[#3B82F6]" />
                    Share Folder
                  </button>
                )}
                <button
                  onClick={handleDownloadZip}
                  className="w-full px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-[#D1D5DB] hover:bg-gray-50 dark:hover:bg-[#334155] transition flex items-center gap-2"
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

      {/* Row 2: File Count & Size */}
      <div className="flex items-center gap-3 text-xs font-bold text-gray-500 dark:text-[#94A3B8] mt-2.5">
        <span>{fileCount} {fileCount === 1 ? 'File' : 'Files'}</span>
        <span className="text-gray-300 dark:text-gray-700">•</span>
        <span>{formatFolderSize(folderSize)}</span>
      </div>

      {/* Row 3: Modified Time */}
      <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mt-1">
        {getModifiedLabel()}
      </div>

      {/* Row 4: Shared Badge */}
      <div className="flex items-center gap-1 mt-2 text-xs font-semibold text-gray-500 dark:text-[#94A3B8]">
        {isShared ? (
          <span className="flex items-center gap-1 text-[#3B82F6] dark:text-blue-400 font-bold">
            <Users className="w-3.5 h-3.5" />
            <span>Shared with {folder.sharedWith?.length || 1}</span>
          </span>
        ) : (
          <span className="flex items-center gap-1 text-gray-400">
            <Users className="w-3.5 h-3.5 opacity-40" />
            <span>Only You</span>
          </span>
        )}
      </div>

      {/* Open Folder Button */}
      <div className="mt-3 pt-2.5 border-t border-gray-100/70 dark:border-[#334155]/40">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-[#334155] text-[11px] font-bold text-gray-500 dark:text-[#94A3B8] group-hover:text-[#3B82F6] group-hover:border-blue-300 dark:group-hover:border-blue-500/40 transition-all duration-200">
          Open Folder <span className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
        </span>
      </div>

      {isDownloading && (
        <div className="absolute inset-0 bg-white/80 dark:bg-[#1E293B]/80 backdrop-blur-xs z-30 flex flex-col items-center justify-center rounded-2xl animate-fade-in pointer-events-auto cursor-wait">
          <Loader2 className="w-8 h-8 text-green-500 animate-spin mb-2" />
          <span className="text-xs font-bold text-gray-700 dark:text-[#D1D5DB]">Zipping Folder…</span>
        </div>
      )}
    </div>
  );
}
