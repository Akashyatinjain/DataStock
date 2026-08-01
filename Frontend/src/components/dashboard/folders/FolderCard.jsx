import React, { useState, useEffect, useRef } from 'react';
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
  const menuRef = useRef(null);

  useEffect(() => {
    if (!showMenu) return;
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showMenu]);
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
      className="group relative bg-white dark:bg-[#1E293B] border border-gray-100/80 dark:border-slate-800/80 hover:border-[#3B82F6]/60 dark:hover:border-[#3B82F6]/60 rounded-2xl p-3.5 shadow-3xs hover:shadow-[0_4px_20px_rgba(59,130,246,0.08)] transition-all duration-200 cursor-pointer select-none flex flex-col justify-between h-[105px] animate-fade-up"
    >
      {/* Row 1: Icon + Name and Dropdown Action */}
      <div className="flex items-center justify-between min-w-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/15 dark:bg-cyan-400/20 border border-cyan-500/20 flex items-center justify-center shrink-0 shadow-xs">
            <Folder className="w-5 h-5 text-cyan-600 dark:text-cyan-300 stroke-[2.25]" />
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-gray-900 dark:text-[#F8FAFC] text-xs sm:text-sm truncate group-hover:text-[#3B82F6] transition-colors leading-tight">
              {folder.name}
            </h4>
            <p className="text-[11px] text-gray-400 font-medium mt-0.5 truncate">
              {getModifiedLabel()}
            </p>
          </div>
        </div>

        {/* Action Dropdown Menu */}
        <div ref={menuRef} className="relative shrink-0 pr-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu((prev) => !prev);
            }}
            className="p-1.5 hover:bg-gray-50 dark:hover:bg-[#334155] rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-1 w-36 bg-white dark:bg-[#1E293B] border border-gray-100 dark:border-[#334155] rounded-xl shadow-xl py-1.5 z-50 animate-fade-in text-left">
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
          )}
      </div>
    </div>

      {/* Row 2: Stats & Created By / Shared Badge */ }
  <div className="flex items-center justify-between text-[11px] font-medium text-gray-500 dark:text-slate-400 mt-2 pt-2 border-t border-gray-100/60 dark:border-slate-800/60">
    <span>{fileCount} {fileCount === 1 ? 'file' : 'files'} · {formatFolderSize(folderSize)}</span>
    {isShared ? (
      <div className="flex items-center gap-1.5">
        {folder.sharedWith && folder.sharedWith.length > 0 && (
          <div className="flex items-center -space-x-1.5">
            {folder.sharedWith.slice(0, 3).map((sw, idx) => (
              <div
                key={`sw-${idx}`}
                className="w-4.5 h-4.5 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 border border-white dark:border-[#1E293B] flex items-center justify-center text-[8px] font-bold text-white uppercase shadow-2xs"
                title={sw.sharedTo?.username || sw.sharedTo?.email}
              >
                {sw.sharedTo?.username?.charAt(0) || sw.sharedTo?.email?.charAt(0) || 'U'}
              </div>
            ))}
          </div>
        )}
        <span className="flex items-center gap-1 text-[#3B82F6] dark:text-blue-400 font-bold bg-blue-50/60 dark:bg-blue-950/30 px-1.5 py-0.5 rounded-md text-[10px]">
          <Users className="w-3 h-3" />
          <span>Shared</span>
        </span>
      </div>
    ) : (
      <span className="text-[10px] text-gray-400 font-medium">By {ownerName}</span>
    )}
  </div>

  {
    isDownloading && (
      <div className="absolute inset-0 bg-white/80 dark:bg-[#1E293B]/80 backdrop-blur-xs z-30 flex flex-col items-center justify-center rounded-2xl animate-fade-in pointer-events-auto cursor-wait">
        <Loader2 className="w-6 h-6 text-[#3B82F6] animate-spin mb-1" />
        <span className="text-[11px] font-bold text-gray-700 dark:text-[#D1D5DB]">Zipping Folder…</span>
      </div>
    )
  }
    </div >
  );
}
