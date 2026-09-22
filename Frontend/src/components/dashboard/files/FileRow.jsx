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
  Pencil,
} from 'lucide-react';
import { useCrypto } from '../../../context/CryptoContext';
import { getFileType, formatFileSize } from '../../../utils/fileHelpers';

const FileRow = ({
  file,
  searchQuery,
  onDelete,
  onPreview,
  onToggleStar,
  onToggleArchive,
  onShare,
  onRename,
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
        grid grid-cols-[minmax(0,1fr)_auto] md:grid-cols-12 gap-3 md:gap-4 px-4 sm:px-6 py-3.5 border-b border-[#E2E8F0] dark:border-slate-800
        hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition items-center cursor-pointer group
        ${isDeleting || isRestoring ? 'opacity-50 pointer-events-none' : ''}
        ${isSelected ? 'bg-blue-50/80 dark:bg-blue-950/40 border-l-4 border-l-[#2563EB] pl-[12px] sm:pl-[20px]' : ''}
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
      <div className="col-span-1 md:col-span-6 flex items-center gap-3 min-w-0">
        {!isTrashView && onToggleSelect && (
          <div
            className={`mr-1 shrink-0 transition-opacity duration-200 ${
              isSelected || (selectedFileIds && selectedFileIds.size > 0)
                ? 'opacity-100'
                : 'opacity-100 md:opacity-0 md:group-hover:opacity-100'
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
              className={`w-4.5 h-4.5 rounded flex items-center justify-center cursor-pointer transition-all shadow-xs ${
                isSelected
                  ? 'bg-[#2563EB] text-white'
                  : 'bg-white dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-600 hover:border-[#2563EB]'
              }`}
            >
              {isSelected && (
                <svg className="w-3 h-3 stroke-current stroke-[3] fill-none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          </div>
        )}
        <div
          className="w-9 h-9 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center shrink-0 border border-slate-200/60 dark:border-slate-700/60 transition-colors"
        >
          <Icon className="w-4.5 h-4.5 text-slate-500 dark:text-slate-400 group-hover:text-[#2563EB] dark:group-hover:text-blue-400 transition-colors" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <p
              className={`text-sm truncate ${isLocked ? 'font-mono text-[11px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 px-1.5 py-0.5 rounded border border-amber-200/50 dark:border-amber-900/30' : 'font-medium text-[#0F172A] dark:text-[#F8FAFC]'}`}
              title={file.originalName}
            >
              {file.originalName}
            </p>
            {isStarred && !isTrashView && (
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
            )}
            {isEncrypted && (
              <Lock className="w-3 h-3 text-slate-500 shrink-0" />
            )}
            {isShared && <Users className="w-3 h-3 text-slate-500 shrink-0" />}
            {isArchived && (
              <span className="text-[10px] text-slate-500 shrink-0" title="Archived">
                📦
              </span>
            )}
            {(file.isTrash || isTrashView) && (
              <span className="text-[10px] text-red-500 shrink-0" title="Trash">
                🗑️
              </span>
            )}
            {searchQuery &&
              file.ocrText
                ?.toLowerCase()
                .includes(searchQuery.toLowerCase()) && (
                <span
                  className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-[#2563EB] dark:bg-blue-950/30 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30 shrink-0"
                  title="Found in file contents"
                >
                  🔍 Content Match
                </span>
              )}
          </div>
          <p className="md:hidden text-[11px] text-[#64748B] dark:text-slate-400 truncate">
            {isLocked ? '🔒 Locked' : formatFileSize(file.size)} •{' '}
            {new Date(file.createdAt).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
            })}
          </p>
        </div>
      </div>

      <div className="hidden md:block md:col-span-2 text-sm text-[#64748B] dark:text-[#94A3B8]">
        {isLocked ? '🔒 Locked' : formatFileSize(file.size)}
      </div>

      <div className="hidden md:block md:col-span-3 text-sm text-[#64748B] dark:text-slate-400">
        {new Date(file.createdAt).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })}
      </div>

      <div
        className="md:col-span-1 flex justify-end gap-1 shrink-0"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onMouseUp={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
      >
        {isDeleting ? (
          <Loader2 className="w-4 h-4 text-red-500 animate-spin" />
        ) : isRestoring ? (
          <Loader2 className="w-4 h-4 text-[#2563EB] animate-spin" />
        ) : (
          <>
            {!isTrashView && (
              <button
                onClick={() => onToggleStar(file.id)}
                disabled={isStarring}
                className={`p-1.5 rounded-lg transition ${
                  isStarred
                    ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-slate-800'
                    : 'text-[#64748B] hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title={isStarred ? 'Remove Star' : 'Add Star'}
              >
                <Star
                  className={`w-3.5 h-3.5 ${isStarred ? 'fill-amber-400' : ''}`}
                />
              </button>
            )}

            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1.5 text-[#64748B] hover:text-[#0F172A] dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </button>

              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute right-0 bottom-8 mt-1 w-40 bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-slate-800 rounded-lg shadow-lg py-1 z-50 animate-fade-in text-left">
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onPreview(file);
                      }}
                      className="w-full px-3 py-1.5 text-left text-xs font-medium text-[#0F172A] dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition flex items-center gap-2"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#2563EB]" /> Preview
                    </button>
                    {!isTrashView && (
                      <>
                        <button
                          onClick={() => {
                            setShowMenu(false);
                            onShare(file);
                          }}
                          className="w-full px-3 py-1.5 text-left text-xs font-medium text-[#0F172A] dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition flex items-center gap-2"
                        >
                          <Share2 className="w-3.5 h-3.5 text-emerald-600" /> Share
                        </button>
                        {onRename && (
                          <button
                            onClick={() => {
                              setShowMenu(false);
                              onRename(file);
                            }}
                            className="w-full px-3 py-1.5 text-left text-xs font-medium text-[#0F172A] dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition flex items-center gap-2"
                          >
                            <Pencil className="w-3.5 h-3.5 text-blue-600" /> Rename
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setShowMenu(false);
                            onToggleArchive(file.id);
                          }}
                          className="w-full px-3 py-1.5 text-left text-xs font-medium text-[#0F172A] dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition flex items-center gap-2"
                        >
                          <Archive className="w-3.5 h-3.5 text-slate-500" />{' '}
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
                              className="w-full px-3 py-1.5 text-left text-xs font-medium text-[#0F172A] dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition flex items-center gap-2"
                            >
                              <Archive className="w-3.5 h-3.5 text-slate-500" />{' '}
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
                        className="w-full px-3 py-1.5 text-left text-xs font-medium text-[#0F172A] dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition flex items-center gap-2"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />{' '}
                        Restore
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onDelete(file.id);
                      }}
                      className="w-full px-3 py-1.5 text-left text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition flex items-center gap-2"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-600" />{' '}
                      {isTrashView ? 'Delete Forever' : 'Delete'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default React.memo(FileRow);
