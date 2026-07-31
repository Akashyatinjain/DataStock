import React, { useState, useRef } from 'react';
import {
  Loader2,
  Lock,
  Star,
  Users,
  Archive,
  Eye,
  Share2,
  RotateCcw,
  Trash2,
  MoreVertical,
} from 'lucide-react';
import { useCrypto } from '../../../context/CryptoContext';
import { getFileType, formatFileSize } from '../../../utils/fileHelpers';

const FileCard = ({
  file,
  searchQuery,
  onDelete,
  onPreview,
  onToggleStar,
  onToggleArchive,
  onShare,
  deletingId,
  starringId,
  archivingId,
  isTrashView,
  onRestore,
  restoringId,
  isSelected,
  onToggleSelect,
  onExtract,
  selectedFileIds,
}) => {
  const { isE2eeUnlocked } = useCrypto();
  const type = getFileType(file.mimeType);
  const Icon = type.icon;
  const isDeleting = deletingId === file.id;
  const isRestoring = restoringId === file.id;
  const isStarring = starringId === file.id;
  const isArchiving = archivingId === file.id;
  const isStarred = file.starred || file.isStarred;
  const isArchived = file.archived || file.isArchived;

  const isEncrypted = file.isEncrypted || !!file.encryptedKey;
  const isLocked = isEncrypted && !isE2eeUnlocked;
  const isShared =
    file.isShared ||
    file.sharedWith?.length > 0 ||
    file._isDirectlyShared ||
    file._isSharedDescendant;

  const [showMenu, setShowMenu] = useState(false);

  const longPressTimer = useRef(null);
  const isLongPressActive = useRef(false);
  const touchStartPos = useRef({ x: 0, y: 0 });

  const startPress = (e) => {
    isLongPressActive.current = false;
    if (e.type === 'mousedown') {
      if (e.button !== 0) return;
    } else if (e.type === 'touchstart') {
      const touch = e.touches[0];
      touchStartPos.current = { x: touch.clientX, y: touch.clientY };
    }
    longPressTimer.current = setTimeout(() => {
      isLongPressActive.current = true;
      if (navigator.vibrate) {
        try {
          navigator.vibrate(40);
        } catch (err) {}
      }
      if (onToggleSelect) {
        onToggleSelect({ stopPropagation: () => {} });
      }
    }, 600);
  };

  const endPress = (e, callback) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    if (isLongPressActive.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    if (e.type === 'touchend') {
      const touch = e.changedTouches[0];
      const dx = Math.abs(touch.clientX - touchStartPos.current.x);
      const dy = Math.abs(touch.clientY - touchStartPos.current.y);
      if (dx > 8 || dy > 8) {
        return; // Swiped/scrolled, ignore preview
      }
    }
    if (callback) callback();
  };

  return (
    <div
      draggable={!isDeleting && !isRestoring && !isTrashView}
      onDragStart={(e) => {
        if (selectedFileIds && selectedFileIds.has(file.id)) {
          e.dataTransfer.setData(
            'text/plain',
            JSON.stringify(Array.from(selectedFileIds))
          );
        } else {
          e.dataTransfer.setData('text/plain', file.id);
        }
        e.dataTransfer.effectAllowed = 'move';
      }}
      className={`
        relative group bg-white dark:bg-[#1E293B] border rounded-2xl overflow-hidden
        transition-all duration-200 cursor-pointer select-none flex flex-col justify-between
        ${file.mimeType?.includes('image') ? 'h-[185px]' : 'h-[145px]'}
        ${isDeleting || isRestoring
          ? 'border-red-200 dark:border-red-900 opacity-60 scale-95 pointer-events-none'
          : 'border-gray-100/80 dark:border-slate-800/80 hover:border-[#3B82F6]/60 dark:hover:border-[#3B82F6]/60 hover:shadow-[0_4px_20px_rgba(59,130,246,0.08)] shadow-3xs'}
        ${isSelected ? 'border-[#3B82F6] ring-2 ring-[#3B82F6]/20' : ''}
      `}
      onMouseDown={startPress}
      onTouchStart={startPress}
      onMouseUp={(e) =>
        endPress(e, () => !isDeleting && !isRestoring && onPreview(file))
      }
      onTouchEnd={(e) =>
        endPress(e, () => !isDeleting && !isRestoring && onPreview(file))
      }
      onMouseLeave={() => {
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
        }
      }}
      onTouchMove={() => {
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
        }
      }}
    >
      {/* Checkbox Overlay */}
      {!isTrashView && onToggleSelect && (
        <div
          className={`absolute top-2.5 left-2.5 z-20 transition-opacity duration-200 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
        >
          <input
            type="checkbox"
            checked={!!isSelected}
            onChange={onToggleSelect}
            className="w-4 h-4 text-[#3B82F6] rounded border-gray-300 focus:ring-[#3B82F6] cursor-pointer shadow-xs"
          />
        </div>
      )}

      {isDeleting && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-white/80 dark:bg-[#1E293B]/80 backdrop-blur-sm rounded-2xl">
          <Loader2 className="w-8 h-8 text-red-500 animate-spin mb-2" />
          <span className="text-sm font-semibold text-red-500">
            {isTrashView ? 'Deleting…' : 'Trashing…'}
          </span>
        </div>
      )}
      {isRestoring && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-white/80 dark:bg-[#1E293B]/80 backdrop-blur-sm rounded-2xl">
          <Loader2 className="w-8 h-8 text-green-500 animate-spin mb-2" />
          <span className="text-sm font-semibold text-green-500">
            Restoring…
          </span>
        </div>
      )}

      {/* Top Banner (Thumbnail or File icon) */}
      <div className="relative">
        {isLocked ? (
          <div className="h-14 flex items-center justify-center gap-2 bg-amber-500/5 dark:bg-amber-950/20 border-b border-gray-100 dark:border-slate-800 relative select-none">
            <Lock className="w-4 h-4 text-amber-500" />
            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
              Encrypted File
            </span>
          </div>
        ) : file.mimeType?.includes('image') ? (
          <div className="h-24 overflow-hidden bg-gray-50 dark:bg-slate-800 relative flex items-center justify-center">
            <img
              src={file.url}
              alt={file.originalName}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        ) : (
          <div
            className={`h-14 flex items-center justify-center ${type.bg} relative transition-transform duration-300`}
          >
            <Icon
              className={`w-7 h-7 ${type.color} opacity-80 group-hover:scale-110 duration-200`}
            />
          </div>
        )}

        {/* Favorite Star */}
        {!isTrashView && (
          <div
            className="absolute top-2 right-2 z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => onToggleStar(file.id)}
              disabled={isStarring}
              className={`p-1 rounded-lg backdrop-blur-md bg-white/80 dark:bg-[#1E293B]/80 shadow-xs transition hover:scale-110 active:scale-95 ${
                isStarred
                  ? 'text-yellow-500'
                  : 'text-gray-400 hover:text-yellow-500'
              }`}
            >
              <Star
                className={`w-3.5 h-3.5 ${isStarred ? 'fill-yellow-400' : ''}`}
              />
            </button>
          </div>
        )}
      </div>

      {/* Body Details */}
      <div className="p-3 flex-1 flex flex-col justify-between min-w-0">
        <div>
          {/* File Name */}
          <div className="flex items-center gap-1.5 mb-1.5 min-w-0">
            <h3
              className={`truncate text-sm leading-tight flex-1 ${isLocked ? 'font-mono text-[11px] font-bold bg-amber-500/5 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/10' : 'font-bold text-gray-900 dark:text-[#F8FAFC]'}`}
              title={file.originalName}
            >
              {file.originalName}
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-1 mb-2">
            <span
              className={`inline-flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full ${type.bg} ${type.color}`}
            >
              {type.label}
            </span>
            {isEncrypted && (
              <span className="inline-flex items-center gap-0.5 text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 dark:bg-orange-950/20 dark:text-orange-400 border border-orange-100/50 dark:border-orange-900/30">
                <Lock className="w-2.5 h-2.5" /> Secure
              </span>
            )}
            {isShared && (
              <span className="inline-flex items-center gap-0.5 text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-100/50 dark:border-emerald-900/30">
                <Users className="w-2.5 h-2.5" /> Shared
              </span>
            )}
            {isArchived && (
              <span className="inline-flex items-center gap-0.5 text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 dark:bg-purple-950/20 dark:text-purple-400 border border-purple-100/50 dark:border-purple-900/30">
                Archived
              </span>
            )}
            {(file.isTrash || isTrashView) && (
              <span className="inline-flex items-center gap-0.5 text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400 border border-red-100/50 dark:border-red-900/30">
                Trash
              </span>
            )}
            {searchQuery &&
              file.ocrText
                ?.toLowerCase()
                .includes(searchQuery.toLowerCase()) && (
                <span
                  className="inline-flex items-center gap-1 text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-[#3B82F6] border border-emerald-100 dark:border-emerald-900/50"
                  title="Found in file contents"
                >
                  🔍 Content Match
                </span>
              )}
          </div>
        </div>

        {/* Footer Metrics & Actions */}
        <div className="flex items-center justify-between pt-2.5 border-t border-gray-50 dark:border-[#334155] mt-auto">
          <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider truncate mr-2">
            {isLocked ? '🔒 Locked' : formatFileSize(file.size)} •{' '}
            {new Date(file.createdAt).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
            })}
          </div>

          {/* Action Menu */}
          <div
            className="relative"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onMouseUp={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#334155] rounded-lg transition"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 bottom-8 mt-1 w-40 bg-white dark:bg-[#2A3547] border border-gray-100 dark:border-[#334155] rounded-xl shadow-lg py-1.5 z-50 animate-fade-in text-left">
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onPreview(file);
                    }}
                    className="w-full px-3 py-1.5 text-left text-xs font-semibold text-gray-700 dark:text-[#D1D5DB] hover:bg-gray-50 dark:hover:bg-[#334155] transition flex items-center gap-2"
                  >
                    <Eye className="w-3.5 h-3.5 text-blue-500" /> Preview
                  </button>
                  {!isTrashView && (
                    <>
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          onShare(file);
                        }}
                        className="w-full px-3 py-1.5 text-left text-xs font-semibold text-gray-700 dark:text-[#D1D5DB] hover:bg-gray-50 dark:hover:bg-[#334155] transition flex items-center gap-2"
                      >
                        <Share2 className="w-3.5 h-3.5 text-green-500" /> Share
                      </button>
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          onToggleArchive(file.id);
                        }}
                        className="w-full px-3 py-1.5 text-left text-xs font-semibold text-gray-700 dark:text-[#D1D5DB] hover:bg-gray-50 dark:hover:bg-[#334155] transition flex items-center gap-2"
                      >
                        <Archive className="w-3.5 h-3.5 text-amber-500" />{' '}
                        {isArchived ? 'Unarchive' : 'Archive'}
                      </button>
                      {(file.mimeType === 'application/zip' ||
                        file.originalName?.endsWith('.zip')) &&
                        onExtract && (
                          <button
                            onClick={() => {
                              setShowMenu(false);
                              onExtract(file.id, file.originalName);
                            }}
                            className="w-full px-3 py-1.5 text-left text-xs font-semibold text-gray-700 dark:text-[#D1D5DB] hover:bg-gray-50 dark:hover:bg-[#334155] transition flex items-center gap-2"
                          >
                            <Archive className="w-3.5 h-3.5 text-purple-500" />{' '}
                            Extract ZIP
                          </button>
                        )}
                    </>
                  )}
                  {isTrashView && (
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onRestore(file.id);
                      }}
                      className="w-full px-3 py-1.5 text-left text-xs font-semibold text-gray-700 dark:text-[#D1D5DB] hover:bg-gray-50 dark:hover:bg-[#334155] transition flex items-center gap-2"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-green-500" />{' '}
                      Restore
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onDelete(file.id);
                    }}
                    className="w-full px-3 py-1.5 text-left text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition flex items-center gap-2"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-500" />{' '}
                    {isTrashView ? 'Delete Forever' : 'Delete'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileCard;
