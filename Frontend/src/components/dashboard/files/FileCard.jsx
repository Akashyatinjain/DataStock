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
  Pencil,
} from 'lucide-react';
import { useCrypto } from '../../../context/CryptoContext';
import { getFileType, formatFileSize } from '../../../utils/fileHelpers';
import SecurityBadge from './SecurityBadge';

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
  onRename,
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
  const isLocked = file.isLocked || (isEncrypted && !isE2eeUnlocked);
  const isShared =
    file.isShared ||
    file.sharedWith?.length > 0 ||
    file._isDirectlyShared ||
    file._isSharedDescendant;

  const [imgError, setImgError] = useState(false);
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
  const mouseStartPos = useRef({ x: 0, y: 0 });

  const startPress = (e) => {
    isLongPressActive.current = false;
    if (e.type === 'mousedown') {
      if (e.button !== 0) return;
      mouseStartPos.current = { x: e.clientX, y: e.clientY };
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
        onToggleSelect({ stopPropagation: () => {} }, file.id);
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
    if (e.type === 'mouseup') {
      const dx = Math.abs(e.clientX - mouseStartPos.current.x);
      const dy = Math.abs(e.clientY - mouseStartPos.current.y);
      if (dx > 5 || dy > 5 || window.__isMarqueeDragging) {
        return; // Dragging/marquee occurred, do not open preview
      }
    } else if (e.type === 'touchend') {
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
      data-file-id={file.id}
      draggable={isSelected && !isDeleting && !isRestoring && !isTrashView}
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
        relative group bg-white dark:bg-[#1E293B] border rounded-xl
        transition-all duration-200 cursor-pointer select-none flex flex-col justify-between
        ${showMenu ? 'z-40 overflow-visible' : 'z-0 overflow-hidden'}
        ${file.mimeType?.includes('image') ? 'sm:h-[195px] h-[168px]' : 'sm:h-[155px] h-[138px]'}
        ${isDeleting || isRestoring
          ? 'border-red-200 dark:border-red-900 opacity-60 scale-95 pointer-events-none'
          : 'border-[#E2E8F0] dark:border-slate-800 hover:border-[#2563EB] dark:hover:border-blue-500 shadow-xs hover:shadow-md'}
        ${isSelected ? 'border-[#2563EB] ring-2 ring-[#2563EB]/30 shadow-md bg-blue-50/20 dark:bg-blue-950/20' : ''}
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
          className={`absolute top-2.5 left-2.5 z-20 transition-all duration-150 ${
            isSelected || (selectedFileIds && selectedFileIds.size > 0)
              ? 'opacity-100 scale-100'
              : 'opacity-100 sm:opacity-0 sm:group-hover:opacity-100'
          }`}
          onClick={(e) => {
            e.stopPropagation();
            if (onToggleSelect) onToggleSelect(e, file.id);
          }}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
          title={isSelected ? 'Deselect file' : 'Select file'}
        >
          <div
            className={`w-5 h-5 rounded flex items-center justify-center cursor-pointer transition-all shadow-xs ${
              isSelected
                ? 'bg-[#2563EB] text-white ring-2 ring-white dark:ring-[#1E293B]'
                : 'bg-white/95 dark:bg-slate-800/95 border border-[#E2E8F0] dark:border-slate-600 hover:border-[#2563EB]'
            }`}
          >
            {isSelected && (
              <svg className="w-3.5 h-3.5 stroke-current stroke-[3] fill-none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
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
      <div className="relative rounded-t-xl overflow-hidden">
        {file.mimeType?.includes('image') ? (
          isLocked || imgError || (isEncrypted && !file.url) ? (
            <div className="h-20 sm:h-24 overflow-hidden bg-slate-900 dark:bg-slate-950 relative flex flex-col items-center justify-center border-b border-slate-800 select-none group">
              <span className="absolute bottom-2 left-2 z-10 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-black/75 backdrop-blur-md text-slate-200 border border-slate-700 flex items-center gap-1 shadow-xs">
                <Lock className="w-2.5 h-2.5 text-amber-400" /> {type.label}
              </span>
              <div className="flex flex-col items-center justify-center gap-1 transition-transform duration-200 group-hover:scale-105">
                <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
                  <Lock className={`w-4 h-4 ${isLocked ? 'text-amber-400' : 'text-[#2563EB]'}`} />
                </div>
                <span className="text-[10px] font-semibold tracking-wide text-slate-300">
                  {isLocked ? 'Encrypted (Locked)' : 'E2EE Image'}
                </span>
              </div>
            </div>
          ) : (
            <div className="h-20 sm:h-24 overflow-hidden bg-slate-50 dark:bg-slate-800 relative flex items-center justify-center">
              <img
                src={file.url}
                alt=""
                loading="lazy"
                decoding="async"
                onError={() => setImgError(true)}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <span className="absolute bottom-2 left-2 z-10 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-md text-white border border-white/20">
                {type.label}
              </span>
            </div>
          )
        ) : isLocked ? (
          <div className="h-10 sm:h-12 flex items-center justify-center gap-2 bg-amber-500/10 dark:bg-amber-950/30 border-b border-[#E2E8F0] dark:border-slate-800 relative select-none">
            <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">
              Encrypted (Locked)
            </span>
          </div>
        ) : (
          <div
            className="h-10 sm:h-12 flex items-center justify-center bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800/80 relative transition-colors duration-200"
          >
            <Icon
              className="w-5 h-5 sm:w-6 sm:h-6 text-slate-500 dark:text-slate-400 group-hover:text-[#2563EB] dark:group-hover:text-blue-400 transition-colors duration-200"
            />
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
                ? 'text-amber-500'
                : 'text-slate-400 hover:text-amber-500'
            }`}
            title="Favorite"
          >
            <Star
              className={`w-3.5 h-3.5 ${isStarred ? 'fill-amber-400' : ''}`}
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
              className={`truncate text-xs sm:text-sm leading-tight flex-1 ${isLocked ? 'font-mono text-amber-600 dark:text-amber-400 font-bold' : 'font-semibold text-slate-900 dark:text-slate-100'}`}
              title={file.originalName}
            >
              {file.originalName}
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-1 mb-1.5">
            {!file.mimeType?.includes('image') && (
              <span
                className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60"
              >
                {type.label}
              </span>
            )}
            {isEncrypted && (
              <SecurityBadge isEncrypted={isEncrypted} isLocked={isLocked} />
            )}
            {isShared && (
              <span className="inline-flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
                <Users className="w-2.5 h-2.5 text-slate-500" /> Shared
              </span>
            )}
            {isArchived && (
              <span className="inline-flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60">
                Archived
              </span>
            )}
            {(file.isTrash || isTrashView) && (
              <span className="inline-flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border border-red-200/60 dark:border-red-900/40">
                Trash
              </span>
            )}
            {searchQuery &&
              file.ocrText
                ?.toLowerCase()
                .includes(searchQuery.toLowerCase()) && (
                <span
                  className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-[#2563EB] dark:bg-blue-950/30 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50"
                  title="Found in file contents"
                >
                  🔍 Content Match
                </span>
              )}
          </div>
        </div>

        {/* Footer Metrics & Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-[#E2E8F0] dark:border-slate-800 mt-auto">
          <div className="text-[10px] text-[#64748B] dark:text-slate-400 font-medium tracking-wide truncate mr-1 flex-1">
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
              className="p-1.5 text-[#64748B] hover:text-[#0F172A] dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
              title="Options"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>

            {showMenu && (
              <div className="absolute right-0 bottom-full mb-1.5 w-44 bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-slate-800 rounded-lg shadow-lg py-1 z-50 animate-fade-in text-left">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    onPreview(file);
                  }}
                  className="w-full px-3 py-1.5 text-left text-xs font-medium text-[#0F172A] dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition flex items-center gap-2 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-[#2563EB]" /> Preview
                </button>
                {!isTrashView && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMenu(false);
                        onShare(file);
                      }}
                      className="w-full px-3 py-1.5 text-left text-xs font-medium text-[#0F172A] dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition flex items-center gap-2 cursor-pointer"
                    >
                      <Share2 className="w-3.5 h-3.5 text-emerald-600" /> Share
                    </button>
                    {onRename && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowMenu(false);
                          onRename(file);
                        }}
                        className="w-full px-3 py-1.5 text-left text-xs font-medium text-[#0F172A] dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition flex items-center gap-2 cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5 text-indigo-600" /> Rename
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMenu(false);
                        onToggleArchive(file.id);
                      }}
                      className="w-full px-3 py-1.5 text-left text-xs font-medium text-[#0F172A] dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition flex items-center gap-2 cursor-pointer"
                    >
                      <Archive className="w-3.5 h-3.5 text-slate-500" />{' '}
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
                          className="w-full px-3 py-1.5 text-left text-xs font-medium text-[#0F172A] dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition flex items-center gap-2 cursor-pointer"
                        >
                          <Archive className="w-3.5 h-3.5 text-slate-500" />{' '}
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
                    className="w-full px-3 py-1.5 text-left text-xs font-medium text-[#0F172A] dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition flex items-center gap-2 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />{' '}
                    Restore
                  </button>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                      onDelete(file.id);
                    }}
                    className="w-full px-3 py-1.5 text-left text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition flex items-center gap-2 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-600" />{' '}
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

export default React.memo(FileCard);
