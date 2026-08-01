import React, { useState, useEffect, useRef } from 'react';
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
  const type = getFileType(file.mimeType, file.originalName);
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
      const dx = touch.clientX - touchStartPos.current.x;
      const dy = touch.clientY - touchStartPos.current.y;

      // Mobile Swipe Gestures
      if (Math.abs(dx) > 70 && Math.abs(dy) < 50) {
        if (dx > 0 && !isTrashView) {
          onToggleStar(file.id);
          return;
        } else if (dx < 0 && !isTrashView) {
          onDelete(file.id);
          return;
        }
      }

      if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
        return;
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
        relative group bg-white dark:bg-[#1E293B] border rounded-2xl
        transition-all duration-200 cursor-pointer select-none flex flex-col justify-between
        ${showMenu ? 'z-40 overflow-visible' : 'z-0 overflow-hidden'}
        ${file.mimeType?.includes('image') ? 'sm:h-[195px] h-[168px]' : 'sm:h-[155px] h-[138px]'}
        ${isDeleting || isRestoring
          ? 'border-red-200 dark:border-red-900 opacity-60 scale-95 pointer-events-none'
          : 'border-gray-200/80 dark:border-slate-800 hover:border-[#3B82F6] dark:hover:border-[#3B82F6] shadow-sm hover:shadow-xl dark:shadow-slate-900/40'}
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
      <div className="relative rounded-t-2xl overflow-hidden">
        {isLocked ? (
          <div className="h-10 sm:h-12 flex items-center justify-center gap-2 bg-amber-500/10 dark:bg-amber-950/30 border-b border-gray-100 dark:border-slate-800 relative select-none">
            <Lock className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
              Encrypted File
            </span>
          </div>
        ) : file.mimeType?.includes('image') ? (
          <div className="h-20 sm:h-24 overflow-hidden bg-gray-50 dark:bg-slate-800 relative flex items-center justify-center">
            <img
              src={file.url}
              alt={file.originalName}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {/* File type badge overlay directly on image */}
            <span className="absolute top-2 left-2 z-10 text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white border border-white/20">
              {type.label}
            </span>
          </div>
        ) : (
          <div
            className={`h-10 sm:h-12 flex items-center justify-center ${type.bg} relative transition-transform duration-300`}
          >
            <Icon
              className={`w-5 h-5 sm:w-6 sm:h-6 ${type.color} opacity-80 group-hover:scale-110 duration-200`}
            />
            <span className="absolute bottom-1 right-2 text-[8px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-black/25 dark:bg-black/50 text-white backdrop-blur-xs">
              {type.label}
            </span>
          </div>
        )}
      </div>

      {/* Favorite Star (Top-right of card, outside banner overflow-hidden) */}
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
            title="Favorite"
          >
            <Star
              className={`w-3.5 h-3.5 ${isStarred ? 'fill-yellow-400' : ''}`}
            />
          </button>
        </div>
      )}

      {/* Card Content */}
      <div className="p-3 flex-1 flex flex-col justify-between min-w-0">
        <div>
          {/* File Name */}
          <div className="flex items-center gap-1.5 mb-1.5 min-w-0">
            <h3
              className={`truncate text-xs sm:text-sm leading-tight flex-1 ${isLocked ? 'font-mono text-amber-600 dark:text-amber-400 font-bold' : 'font-extrabold text-gray-900 dark:text-[#F8FAFC]'}`}
              title={file.originalName}
            >
              {file.originalName}
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-1 mb-1.5">
            {!file.mimeType?.includes('image') && (
              <span
                className={`inline-flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full ${type.bg} ${type.color}`}
              >
                {type.label}
              </span>
            )}
            {isEncrypted && (
              <span className="inline-flex items-center gap-0.5 text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 dark:bg-orange-950/30 dark:text-orange-400 border border-orange-200/50 dark:border-orange-900/30">
                <Lock className="w-2.5 h-2.5" /> {isLocked ? 'Locked' : 'Secure'}
              </span>
            )}
            {isShared && (
              <span className="inline-flex items-center gap-0.5 text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/30">
                <Users className="w-2.5 h-2.5" /> Shared
              </span>
            )}
            {isArchived && (
              <span className="inline-flex items-center gap-0.5 text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 dark:bg-purple-950/30 dark:text-purple-400 border border-purple-200/50 dark:border-purple-900/30">
                Archived
              </span>
            )}
            {(file.isTrash || isTrashView) && (
              <span className="inline-flex items-center gap-0.5 text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400 border border-red-200/50 dark:border-red-900/30">
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
        <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-[#334155]/60 mt-auto">
          <div className="text-[10px] text-gray-500 dark:text-slate-400 font-semibold tracking-wide truncate mr-1 flex-1">
            {isLocked ? '🔒 Locked' : formatFileSize(file.size)} •{' '}
            {new Date(file.createdAt).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
            })}
          </div>

          {/* Action Menu (3 Dots) */}
          <div
            ref={menuRef}
            className="relative pr-1"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onMouseUp={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu((prev) => !prev);
              }}
              className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#334155] rounded-lg transition cursor-pointer"
              title="Options"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>

            {showMenu && (
              <div className="absolute right-0 bottom-full mb-1.5 w-44 bg-white dark:bg-[#2A3547] border border-gray-200 dark:border-[#334155] rounded-xl shadow-2xl py-1.5 z-50 animate-fade-in text-left">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    onPreview(file);
                  }}
                  className="w-full px-3 py-1.5 text-left text-xs font-semibold text-gray-700 dark:text-[#D1D5DB] hover:bg-gray-50 dark:hover:bg-[#334155] transition flex items-center gap-2 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-blue-500" /> Preview
                </button>
                {!isTrashView && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMenu(false);
                        onShare(file);
                      }}
                      className="w-full px-3 py-1.5 text-left text-xs font-semibold text-gray-700 dark:text-[#D1D5DB] hover:bg-gray-50 dark:hover:bg-[#334155] transition flex items-center gap-2 cursor-pointer"
                    >
                      <Share2 className="w-3.5 h-3.5 text-green-500" /> Share
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMenu(false);
                        onToggleArchive(file.id);
                      }}
                      className="w-full px-3 py-1.5 text-left text-xs font-semibold text-gray-700 dark:text-[#D1D5DB] hover:bg-gray-50 dark:hover:bg-[#334155] transition flex items-center gap-2 cursor-pointer"
                    >
                      <Archive className="w-3.5 h-3.5 text-amber-500" />{' '}
                      {isArchived ? 'Unarchive' : 'Archive'}
                    </button>
                    {(file.mimeType === 'application/zip' ||
                      file.originalName?.endsWith('.zip')) &&
                      onExtract && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowMenu(false);
                            onExtract(file.id, file.originalName);
                          }}
                          className="w-full px-3 py-1.5 text-left text-xs font-semibold text-gray-700 dark:text-[#D1D5DB] hover:bg-gray-50 dark:hover:bg-[#334155] transition flex items-center gap-2 cursor-pointer"
                        >
                          <Archive className="w-3.5 h-3.5 text-purple-500" />{' '}
                          Extract ZIP
                        </button>
                      )}
                  </>
                )}
                {isTrashView ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                      onRestore(file.id);
                    }}
                    className="w-full px-3 py-1.5 text-left text-xs font-semibold text-gray-700 dark:text-[#D1D5DB] hover:bg-gray-50 dark:hover:bg-[#334155] transition flex items-center gap-2 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-green-500" />{' '}
                    Restore
                  </button>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                      onDelete(file.id);
                    }}
                    className="w-full px-3 py-1.5 text-left text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition flex items-center gap-2 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-500" />{' '}
                    {isTrashView ? 'Delete Forever' : 'Delete'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileCard;
