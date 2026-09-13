import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Folder, Share2, Trash2, Users, MoreVertical, Download, Loader2 } from 'lucide-react';
import { getFolderId } from '../../../utils/fileHelpers';
import { authFetch, apiUrl } from '../../../utils/auth';

const formatFolderSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

function FolderCard({
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

  // Dynamic stats calculated from global Redux state with memoization
  const allFiles = useSelector((state) => state.files.allFiles);
  const { fileCount, folderSize } = useMemo(() => {
    if (!allFiles || allFiles.length === 0) return { fileCount: 0, folderSize: 0 };
    let count = 0;
    let size = 0;
    for (let i = 0; i < allFiles.length; i++) {
      const f = allFiles[i];
      if (f.folderId === id) {
        count++;
        size += Number(f.size) || 0;
      }
    }
    return { fileCount: count, folderSize: size };
  }, [allFiles, id]);

  const isOwner = folder.ownerId === currentUserId || folder._isOwner;
  const isShared = (folder.sharedWith && folder.sharedWith.length > 0) || folder._isDirectlyShared || folder._isSharedDescendant;
  const permission = folder._sharedPermission || (folder.sharedWith && folder.sharedWith.find(sw => sw.sharedToId === currentUserId)?.permission) || 'VIEW';

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

  const ownerName = isOwner ? 'You' : (folder.owner?.username || folder.owner?.email || 'Shared');

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
      if (!res.ok) throw new Error('Download failed');
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
      alert('Failed to download folder ZIP');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div
      onClick={handleOpen}
      className="group relative bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-slate-800 hover:border-[#2563EB] dark:hover:border-blue-500 rounded-xl p-4 shadow-3xs hover:shadow-md transition-all duration-200 cursor-pointer select-none flex flex-col justify-between min-h-[118px] animate-fade-up"
    >
      {/* Top Row: Icon, Title & Action Menu */}
      <div className="flex items-start justify-between gap-3 min-w-0">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-9 h-9 rounded-lg border border-blue-150 dark:border-blue-900/40 bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center shrink-0 transition-colors">
            <Folder className="w-5 h-5 text-[#2563EB] dark:text-blue-400" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-semibold text-[#0F172A] dark:text-slate-100 text-sm truncate group-hover:text-[#2563EB] dark:group-hover:text-blue-400 transition-colors leading-tight tracking-tight">
              {folder.name}
            </h4>
            <p className="text-xs text-[#64748B] dark:text-slate-400 font-normal mt-0.5 truncate">
              {getModifiedLabel()}
            </p>
          </div>
        </div>

        {/* Action Dropdown Menu */}
        <div ref={menuRef} className="relative shrink-0 -mr-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu((prev) => !prev);
            }}
            aria-label="Folder options"
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-1.5 z-50 animate-fade-in text-left">
              {isOwner && (
                <button
                  onClick={handleShareClick}
                  className="w-full px-3 py-2 text-left text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition flex items-center gap-2"
                >
                  <Share2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  Share Folder
                </button>
              )}
              <button
                onClick={handleDownloadZip}
                className="w-full px-3 py-2 text-left text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition flex items-center gap-2"
              >
                <Download className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                Download ZIP
              </button>
              {(isOwner || permission === 'EDIT') && (
                <button
                  onClick={handleDeleteClick}
                  className="w-full px-3 py-2 text-left text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition flex items-center gap-2"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-500" />
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row: Metadata & Sharing Status */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2.5 mt-2 border-t border-slate-100 dark:border-slate-800/80">
        <span>{fileCount} {fileCount === 1 ? 'file' : 'files'} · {formatFolderSize(folderSize)}</span>
        {isShared ? (
          <div className="flex items-center gap-1.5">
            {folder.sharedWith && folder.sharedWith.length > 0 && (
              <div className="flex items-center -space-x-1.5">
                {folder.sharedWith.slice(0, 3).map((sw, idx) => (
                  <div
                    key={`sw-${idx}`}
                    className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 border border-white dark:border-[#1E293B] flex items-center justify-center text-[8px] font-semibold text-slate-700 dark:text-slate-200 uppercase"
                    title={sw.sharedTo?.username || sw.sharedTo?.email}
                  >
                    {sw.sharedTo?.username?.charAt(0) || sw.sharedTo?.email?.charAt(0) || 'U'}
                  </div>
                ))}
              </div>
            )}
            <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md text-[11px] font-medium">
              <Users className="w-3 h-3 text-slate-500 dark:text-slate-400" />
              <span>Shared</span>
            </span>
          </div>
        ) : (
          <span className="text-xs text-slate-400 dark:text-slate-500">By {ownerName}</span>
        )}
      </div>

      {isDownloading && (
        <div className="absolute inset-0 bg-white/85 dark:bg-[#1E293B]/85 backdrop-blur-xs z-30 flex flex-col items-center justify-center rounded-xl animate-fade-in pointer-events-auto cursor-wait">
          <Loader2 className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-spin mb-1.5" />
          <span className="text-xs font-medium text-slate-700 dark:text-slate-200">Preparing ZIP…</span>
        </div>
      )}
    </div>
  );
}

export default React.memo(FolderCard);

