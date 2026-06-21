// components/FileView.jsx
import React, { useState, useCallback, useRef } from 'react';
import {
  Folder,
  File,
  Image as ImageIcon,
  FileText,
  Video,
  Music,
  Archive,
  MoreVertical,
  CheckCircle2,
  Star,
  Users,
  Grid,
  List,
  Download,
  Share2,
  Trash2,
  Move,
  Upload,
  X,
  Eye,
  Loader2,
  Search,
  SlidersHorizontal,
  ChevronDown,
  Check,
  AlertTriangle,
} from 'lucide-react';

// ─── FILE TYPE HELPERS ───────────────────────────────────────────────────────

const FILE_TYPE_MAP = {
  image:   { icon: ImageIcon, color: 'text-sky-500',    bg: 'bg-sky-50 dark:bg-sky-950/40',    label: 'Image'   },
  video:   { icon: Video,     color: 'text-violet-500', bg: 'bg-violet-50 dark:bg-violet-950/40', label: 'Video' },
  pdf:     { icon: FileText,  color: 'text-rose-500',   bg: 'bg-rose-50 dark:bg-rose-950/40',  label: 'PDF'     },
  zip:     { icon: Archive,   color: 'text-amber-500',  bg: 'bg-amber-50 dark:bg-amber-950/40', label: 'Archive' },
  audio:   { icon: Music,     color: 'text-pink-500',   bg: 'bg-pink-50 dark:bg-pink-950/40',  label: 'Audio'   },
  folder:  { icon: Folder,    color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-950/40', label: 'Folder' },
  default: { icon: File,      color: 'text-slate-500',  bg: 'bg-slate-50 dark:bg-slate-950/40', label: 'File'   },
};

const getFileType = (file) => {
  if (file.isFolder) return FILE_TYPE_MAP.folder;
  const mime = file.mimeType || '';
  const ext  = (file.name || file.originalName || '').split('.').pop().toLowerCase();
  if (mime.includes('image') || ['jpg','jpeg','png','gif','svg','webp'].includes(ext)) return FILE_TYPE_MAP.image;
  if (mime.includes('video') || ['mp4','mov','avi','mkv'].includes(ext))               return FILE_TYPE_MAP.video;
  if (mime.includes('pdf')   || ext === 'pdf')                                          return FILE_TYPE_MAP.pdf;
  if (mime.includes('zip')   || ['zip','rar','7z','tar','gz'].includes(ext))           return FILE_TYPE_MAP.zip;
  if (mime.includes('audio') || ['mp3','wav','flac','ogg'].includes(ext))              return FILE_TYPE_MAP.audio;
  return FILE_TYPE_MAP.default;
};

const formatFileSize = (bytes) => {
  if (!bytes) return '—';
  if (bytes < 1024)              return bytes + ' B';
  if (bytes < 1024 * 1024)      return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 ** 3)        return (bytes / 1024 ** 2).toFixed(1) + ' MB';
  return (bytes / 1024 ** 3).toFixed(1) + ' GB';
};

const fileName = (f) => f.originalName || f.name || 'Untitled';
const isStarred = (f) => f.starred || f.isStarred;

// ─── CONFIRM DIALOG ──────────────────────────────────────────────────────────

const ConfirmDialog = ({ open, title, description, onConfirm, onCancel }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 p-6 w-full max-w-sm animate-fade-up">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-red-50 dark:bg-red-950/40 rounded-xl flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <h3 className="font-bold text-gray-900 dark:text-gray-100">{title}</h3>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">{description}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition shadow-sm"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── CONTEXT MENU ────────────────────────────────────────────────────────────

const ContextMenu = ({ x, y, file, onClose, onPreview, onShare, onToggleStar, onDelete, starringId }) => {
  const starred = isStarred(file);
  const isStarring = starringId === file.id;

  const actions = [
    { icon: Eye,    label: 'Preview',              onClick: () => { onPreview(file); onClose(); } },
    { icon: Share2, label: 'Share',                onClick: () => { onShare(file);   onClose(); } },
    {
      icon: Star,
      label: starred ? 'Remove star' : 'Add star',
      onClick: () => { onToggleStar(file.id); onClose(); },
      disabled: isStarring,
    },
    { icon: Download, label: 'Download',           onClick: () => { window.open(file.url, '_blank'); onClose(); } },
    { divider: true },
    { icon: Trash2,   label: 'Delete', danger: true, onClick: () => { onDelete(file.id); onClose(); } },
  ];

  return (
    <>
      <div className="fixed inset-0 z-[90]" onClick={onClose} />
      <div
        className="fixed z-[100] bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-2xl overflow-hidden min-w-[180px] py-1"
        style={{ top: y, left: x }}
      >
        {actions.map((a, i) =>
          a.divider ? (
            <div key={i} className="my-1 border-t border-gray-100 dark:border-gray-800" />
          ) : (
            <button
              key={i}
              disabled={a.disabled}
              onClick={a.onClick}
              className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium transition
                ${a.danger
                  ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}
                ${a.disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <a.icon className="w-4 h-4" />
              {a.label}
            </button>
          )
        )}
      </div>
    </>
  );
};

// ─── SORT / FILTER BAR ───────────────────────────────────────────────────────

const SORT_OPTIONS = [
  { value: 'name-asc',   label: 'Name (A–Z)'   },
  { value: 'name-desc',  label: 'Name (Z–A)'   },
  { value: 'size-asc',   label: 'Size (small)'  },
  { value: 'size-desc',  label: 'Size (large)'  },
  { value: 'date-desc',  label: 'Newest first'  },
  { value: 'date-asc',   label: 'Oldest first'  },
];

const TYPE_FILTERS = ['All', 'Image', 'Video', 'PDF', 'Archive', 'Audio', 'File'];

// ─── GRID CARD ───────────────────────────────────────────────────────────────

const FileCard = ({
  file, selected, onSelect, onPreview, onShare, onToggleStar, onDelete,
  onContextMenu, deletingId, starringId,
}) => {
  const type     = getFileType(file);
  const Icon     = type.icon;
  const deleting = deletingId === file.id;
  const starring = starringId === file.id;
  const starred  = isStarred(file);

  return (
    <div
      onContextMenu={(e) => { e.preventDefault(); onContextMenu(e, file); }}
      onClick={() => !deleting && onPreview(file)}
      className={`
        relative group rounded-2xl border overflow-hidden transition-all duration-200 cursor-pointer select-none
        ${deleting ? 'opacity-50 scale-95 pointer-events-none border-red-200 dark:border-red-900' : ''}
        ${selected && !deleting
          ? 'border-green-400 dark:border-green-600 ring-2 ring-green-200 dark:ring-green-900 shadow-md'
          : 'border-gray-100 dark:border-gray-800 hover:border-green-200 dark:hover:border-green-800 hover:shadow-xl hover:-translate-y-0.5 shadow-sm bg-white dark:bg-gray-900'}
      `}
    >
      {/* Deleting overlay */}
      {deleting && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl">
          <Loader2 className="w-8 h-8 text-red-500 animate-spin mb-1" />
          <span className="text-xs font-semibold text-red-500">Deleting…</span>
        </div>
      )}

      {/* Selection checkbox */}
      <div
        onClick={(e) => { e.stopPropagation(); onSelect(file.id); }}
        className={`absolute top-2.5 left-2.5 z-10 w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all
          ${selected
            ? 'bg-green-600 border-green-600 opacity-100'
            : 'bg-white/90 border-gray-300 opacity-0 group-hover:opacity-100'}
        `}
      >
        {selected && <Check className="w-3 h-3 text-white" />}
      </div>

      {/* Star badge */}
      {starred && (
        <div className="absolute top-2.5 right-2.5 z-10">
          <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
        </div>
      )}

      {/* Thumbnail / icon */}
      {file.mimeType?.includes('image') && file.url ? (
        <div className="h-36 overflow-hidden bg-gray-50 dark:bg-gray-800">
          <img
            src={file.url}
            alt={fileName(file)}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      ) : (
        <div className={`h-24 flex items-center justify-center ${type.bg}`}>
          <Icon className={`w-10 h-10 ${type.color} opacity-70`} />
        </div>
      )}

      {/* Meta */}
      <div className="p-3.5">
        <span className={`inline-flex items-center text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full mb-2 ${type.bg} ${type.color}`}>
          {type.label}
        </span>
        <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate leading-snug mb-0.5">
          {fileName(file)}
        </p>
        <p className="text-xs text-gray-400 mb-3">{formatFileSize(file.size)}</p>

        {/* Actions row */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-50 dark:border-gray-800">
          <span className="text-[11px] text-gray-400">
            {file.createdAt
              ? new Date(file.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
              : file.modified || '—'}
          </span>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => { e.stopPropagation(); onToggleStar(file.id); }}
              disabled={starring}
              title={starred ? 'Remove star' : 'Star'}
              className={`p-1.5 rounded-lg transition ${starred ? 'text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-950/30' : 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-950/30'}`}
            >
              {starring ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Star className={`w-3.5 h-3.5 ${starred ? 'fill-yellow-400' : ''}`} />}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onShare(file); }}
              title="Share"
              className="p-1.5 rounded-lg text-gray-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/30 transition"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onPreview(file); }}
              title="Preview"
              className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-950/30 transition"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(file.id); }}
              title="Delete"
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── LIST ROW ────────────────────────────────────────────────────────────────

const FileRow = ({
  file, selected, onSelect, onPreview, onShare, onToggleStar, onDelete,
  onContextMenu, deletingId, starringId,
}) => {
  const type     = getFileType(file);
  const Icon     = type.icon;
  const deleting = deletingId === file.id;
  const starring = starringId === file.id;
  const starred  = isStarred(file);

  return (
    <div
      onContextMenu={(e) => { e.preventDefault(); onContextMenu(e, file); }}
      onClick={() => !deleting && onPreview(file)}
      className={`
        grid grid-cols-12 gap-4 px-5 py-3.5 border-b border-gray-50 dark:border-gray-800
        items-center transition cursor-pointer group select-none
        ${deleting   ? 'opacity-50 pointer-events-none' : ''}
        ${selected   ? 'bg-green-50/60 dark:bg-green-950/20' : 'hover:bg-gray-50/80 dark:hover:bg-gray-800/40'}
      `}
    >
      {/* Checkbox + icon + name */}
      <div className="col-span-6 flex items-center gap-3 min-w-0">
        <div
          onClick={(e) => { e.stopPropagation(); onSelect(file.id); }}
          className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all cursor-pointer
            ${selected ? 'bg-green-600 border-green-600' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 opacity-0 group-hover:opacity-100'}
          `}
        >
          {selected && <Check className="w-2.5 h-2.5 text-white" />}
        </div>
        <div className={`w-9 h-9 ${type.bg} rounded-xl flex items-center justify-center shrink-0`}>
          <Icon className={`w-4 h-4 ${type.color}`} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">{fileName(file)}</span>
            {starred && <Star className="w-3 h-3 fill-yellow-400 text-yellow-400 shrink-0" />}
            {(file.shared || file._sharedBy) && <Users className="w-3 h-3 text-gray-400 shrink-0" />}
          </div>
          <span className={`text-[10px] font-bold uppercase tracking-widest ${type.color}`}>{type.label}</span>
        </div>
      </div>

      {/* Size */}
      <div className="col-span-2 text-sm text-gray-500 dark:text-gray-400 tabular-nums">{formatFileSize(file.size)}</div>

      {/* Date */}
      <div className="col-span-3 text-sm text-gray-400">
        {file.createdAt
          ? new Date(file.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
          : file.modified || '—'}
      </div>

      {/* Actions */}
      <div className="col-span-1 flex justify-end gap-0.5">
        {deleting ? (
          <Loader2 className="w-4 h-4 text-red-400 animate-spin" />
        ) : (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); onToggleStar(file.id); }}
              disabled={starring}
              title={starred ? 'Remove star' : 'Star'}
              className={`p-1.5 opacity-0 group-hover:opacity-100 rounded-lg transition
                ${starred ? 'text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-950/30 !opacity-100' : 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-950/30'}`}
            >
              {starring ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Star className={`w-3.5 h-3.5 ${starred ? 'fill-yellow-400' : ''}`} />}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onShare(file); }}
              title="Share"
              className="p-1.5 opacity-0 group-hover:opacity-100 rounded-lg text-gray-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/30 transition"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onPreview(file); }}
              title="Preview"
              className="p-1.5 opacity-0 group-hover:opacity-100 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-950/30 transition"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(file.id); }}
              title="Delete"
              className="p-1.5 opacity-0 group-hover:opacity-100 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

const FileView = ({
  viewMode,
  setViewMode,
  files = [],
  selectedFiles = [],
  setSelectedFiles,
  // Actions wired from Dashboard.jsx
  onDelete,
  onPreview,
  onShare,
  onToggleStar,
  onUpload,
  uploading,
  deletingId,
  starringId,
  // Upload state
  isUploading,
}) => {
  // ── local UI state ─────────────────────────────────────────────────
  const [localSearch, setLocalSearch]     = useState('');
  const [sortBy, setSortBy]               = useState('date-desc');
  const [typeFilter, setTypeFilter]       = useState('All');
  const [showSortMenu, setShowSortMenu]   = useState(false);
  const [showTypeMenu, setShowTypeMenu]   = useState(false);
  const [contextMenu, setContextMenu]     = useState(null); // { x, y, file }
  const [confirmDelete, setConfirmDelete] = useState(null); // fileId
  const [dragOver, setDragOver]           = useState(false);
  const fileInputRef = useRef(null);

  // ── selection helpers ──────────────────────────────────────────────
  const toggleSelect = useCallback((id) => {
    setSelectedFiles(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }, [setSelectedFiles]);

  const selectAll = useCallback(() => {
    setSelectedFiles(prev =>
      prev.length === files.length ? [] : files.map(f => f.id)
    );
  }, [files, setSelectedFiles]);

  const clearSelection = () => setSelectedFiles([]);

  // ── context menu ───────────────────────────────────────────────────
  const handleContextMenu = useCallback((e, file) => {
    const padding = 8;
    const menuW = 180, menuH = 220;
    let x = e.clientX, y = e.clientY;
    if (x + menuW > window.innerWidth)  x = window.innerWidth  - menuW - padding;
    if (y + menuH > window.innerHeight) y = window.innerHeight - menuH - padding;
    setContextMenu({ x, y, file });
  }, []);

  // ── delete with confirm ────────────────────────────────────────────
  const requestDelete = useCallback((fileId) => {
    setConfirmDelete(fileId);
  }, []);

  const confirmDeleteAction = useCallback(() => {
    if (confirmDelete && onDelete) onDelete(confirmDelete);
    setConfirmDelete(null);
  }, [confirmDelete, onDelete]);

  // ── bulk delete ────────────────────────────────────────────────────
  const handleBulkDelete = useCallback(() => {
    if (!onDelete) return;
    selectedFiles.forEach(id => onDelete(id));
    clearSelection();
  }, [selectedFiles, onDelete]);

  // ── drag-and-drop upload ───────────────────────────────────────────
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (!file || !onUpload) return;
    const syntheticEvent = { target: { files: [file], value: '' } };
    onUpload(syntheticEvent);
  }, [onUpload]);

  // ── filter + sort pipeline ─────────────────────────────────────────
  const processedFiles = React.useMemo(() => {
    let result = [...files];

    // local keyword search
    if (localSearch.trim()) {
      const q = localSearch.toLowerCase();
      result = result.filter(f => fileName(f).toLowerCase().includes(q));
    }

    // type filter
    if (typeFilter !== 'All') {
      result = result.filter(f => getFileType(f).label === typeFilter);
    }

    // sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':   return fileName(a).localeCompare(fileName(b));
        case 'name-desc':  return fileName(b).localeCompare(fileName(a));
        case 'size-asc':   return (a.size || 0) - (b.size || 0);
        case 'size-desc':  return (b.size || 0) - (a.size || 0);
        case 'date-asc':   return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
        case 'date-desc':  return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        default:           return 0;
      }
    });

    return result;
  }, [files, localSearch, typeFilter, sortBy]);

  const allSelected   = processedFiles.length > 0 && selectedFiles.length === processedFiles.length;
  const someSelected  = selectedFiles.length > 0;
  const currentSort   = SORT_OPTIONS.find(o => o.value === sortBy);

  return (
    <>
      <style>{`
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-up { animation: fade-up 0.3s ease forwards; }

        @keyframes slide-in {
          from { opacity: 0; transform: translateX(12px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .animate-slide-in { animation: slide-in 0.2s ease forwards; }

        .stagger-grid > *:nth-child(1)  { animation-delay: 0.02s; opacity: 0; }
        .stagger-grid > *:nth-child(2)  { animation-delay: 0.05s; opacity: 0; }
        .stagger-grid > *:nth-child(3)  { animation-delay: 0.08s; opacity: 0; }
        .stagger-grid > *:nth-child(4)  { animation-delay: 0.11s; opacity: 0; }
        .stagger-grid > *:nth-child(5)  { animation-delay: 0.14s; opacity: 0; }
        .stagger-grid > *:nth-child(6)  { animation-delay: 0.17s; opacity: 0; }
        .stagger-grid > *:nth-child(7)  { animation-delay: 0.20s; opacity: 0; }
        .stagger-grid > *:nth-child(8)  { animation-delay: 0.22s; opacity: 0; }
        .stagger-grid > * { animation: fade-up 0.35s ease forwards; }
      `}</style>

      <div
        className={`bg-white dark:bg-gray-900 rounded-2xl border overflow-hidden transition-all duration-200
          ${dragOver
            ? 'border-green-400 dark:border-green-600 ring-2 ring-green-200 dark:ring-green-900 shadow-xl'
            : 'border-gray-100 dark:border-gray-800 shadow-sm'}
        `}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >

        {/* ── TOOLBAR ─────────────────────────────────────────────────── */}
        <div className="px-5 py-4 border-b border-gray-50 dark:border-gray-800 space-y-3">

          {/* Row 1: search + view toggle + upload */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">

            {/* Search */}
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                placeholder="Filter files…"
                className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-300 dark:focus:ring-green-700 transition"
              />
              {localSearch && (
                <button
                  onClick={() => setLocalSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* View toggle */}
            <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-xl p-1 shrink-0">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition ${viewMode === 'grid' ? 'bg-white dark:bg-gray-700 text-green-600 shadow-sm' : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                title="Grid view"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition ${viewMode === 'list' ? 'bg-white dark:bg-gray-700 text-green-600 shadow-sm' : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                title="List view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Upload button */}
            <label className="shrink-0 cursor-pointer">
              <input
                ref={fileInputRef}
                type="file"
                onChange={onUpload}
                className="hidden"
                disabled={isUploading || uploading}
              />
              <div className={`
                inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition shadow-sm whitespace-nowrap
                ${(isUploading || uploading)
                  ? 'bg-green-100 dark:bg-green-950/40 text-green-700 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 text-white hover:shadow-md active:scale-95'}
              `}>
                {(isUploading || uploading)
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</>
                  : <><Upload className="w-4 h-4" /> Upload</>
                }
              </div>
            </label>
          </div>

          {/* Row 2: select-all + filters + batch actions */}
          <div className="flex flex-wrap items-center gap-2">

            {/* Select all */}
            {processedFiles.length > 0 && (
              <label
                onClick={selectAll}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition select-none"
              >
                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition
                  ${allSelected ? 'bg-green-600 border-green-600' : 'border-gray-300 dark:border-gray-600'}`}
                >
                  {allSelected && <Check className="w-2.5 h-2.5 text-white" />}
                  {!allSelected && someSelected && <div className="w-1.5 h-0.5 bg-gray-400 rounded" />}
                </div>
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  {someSelected ? `${selectedFiles.length} selected` : 'Select all'}
                </span>
              </label>
            )}

            {/* Type filter */}
            <div className="relative">
              <button
                onClick={() => { setShowTypeMenu(v => !v); setShowSortMenu(false); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                {typeFilter}
                <ChevronDown className="w-3 h-3" />
              </button>
              {showTypeMenu && (
                <div className="absolute top-full left-0 mt-1 z-50 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-xl py-1 min-w-[120px] animate-fade-up">
                  {TYPE_FILTERS.map(t => (
                    <button
                      key={t}
                      onClick={() => { setTypeFilter(t); setShowTypeMenu(false); }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition
                        ${typeFilter === t ? 'text-green-600' : 'text-gray-700 dark:text-gray-300'}
                      `}
                    >
                      {t}
                      {typeFilter === t && <Check className="w-3 h-3" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Sort */}
            <div className="relative">
              <button
                onClick={() => { setShowSortMenu(v => !v); setShowTypeMenu(false); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                {currentSort?.label}
                <ChevronDown className="w-3 h-3" />
              </button>
              {showSortMenu && (
                <div className="absolute top-full left-0 mt-1 z-50 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-xl py-1 min-w-[160px] animate-fade-up">
                  {SORT_OPTIONS.map(o => (
                    <button
                      key={o.value}
                      onClick={() => { setSortBy(o.value); setShowSortMenu(false); }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition
                        ${sortBy === o.value ? 'text-green-600' : 'text-gray-700 dark:text-gray-300'}
                      `}
                    >
                      {o.label}
                      {sortBy === o.value && <Check className="w-3 h-3" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Batch actions — appear when files are selected */}
            {someSelected && (
              <div className="flex items-center gap-1 ml-auto animate-slide-in">
                <span className="text-xs text-gray-400 mr-1">{selectedFiles.length} selected</span>
                <button
                  onClick={() => setConfirmDelete('__bulk__')}
                  title="Delete selected"
                  className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={clearSelection}
                  title="Clear selection"
                  className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── DROP HINT ────────────────────────────────────────────────── */}
        {dragOver && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm pointer-events-none rounded-2xl">
            <div className="w-20 h-20 bg-green-50 dark:bg-green-950/40 rounded-2xl flex items-center justify-center mb-3">
              <Upload className="w-10 h-10 text-green-500" />
            </div>
            <p className="text-lg font-bold text-green-600">Drop to upload</p>
            <p className="text-sm text-gray-400 mt-1">Release to start uploading</p>
          </div>
        )}

        {/* ── FILE LIST ─────────────────────────────────────────────────── */}
        <div className="p-4">

          {/* Grid view */}
          {viewMode === 'grid' && processedFiles.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 stagger-grid">
              {processedFiles.map(file => (
                <FileCard
                  key={file.id}
                  file={file}
                  selected={selectedFiles.includes(file.id)}
                  onSelect={toggleSelect}
                  onPreview={onPreview}
                  onShare={onShare}
                  onToggleStar={onToggleStar}
                  onDelete={requestDelete}
                  onContextMenu={handleContextMenu}
                  deletingId={deletingId}
                  starringId={starringId}
                />
              ))}
            </div>
          )}

          {/* List view */}
          {viewMode === 'list' && processedFiles.length > 0 && (
            <div className="rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800">
              {/* Header */}
              <div className="grid grid-cols-12 gap-4 px-5 py-3 bg-gray-50 dark:bg-gray-800/60 border-b border-gray-100 dark:border-gray-800">
                <div className="col-span-6 text-xs font-bold text-gray-400 uppercase tracking-widest">Name</div>
                <div className="col-span-2 text-xs font-bold text-gray-400 uppercase tracking-widest">Size</div>
                <div className="col-span-3 text-xs font-bold text-gray-400 uppercase tracking-widest">Date</div>
                <div className="col-span-1" />
              </div>
              {processedFiles.map(file => (
                <FileRow
                  key={file.id}
                  file={file}
                  selected={selectedFiles.includes(file.id)}
                  onSelect={toggleSelect}
                  onPreview={onPreview}
                  onShare={onShare}
                  onToggleStar={onToggleStar}
                  onDelete={requestDelete}
                  onContextMenu={handleContextMenu}
                  deletingId={deletingId}
                  starringId={starringId}
                />
              ))}
            </div>
          )}

          {/* Empty state */}
          {processedFiles.length === 0 && (
            <div className="text-center py-20 animate-fade-up">
              <div
                className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-dashed border-gray-200 dark:border-gray-700 cursor-pointer hover:border-green-300 dark:hover:border-green-700 transition"
                onClick={() => fileInputRef.current?.click()}
              >
                {localSearch || typeFilter !== 'All'
                  ? <Search className="w-9 h-9 text-gray-300 dark:text-gray-600" />
                  : <Upload className="w-9 h-9 text-gray-300 dark:text-gray-600" />
                }
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">
                {localSearch ? `No results for "${localSearch}"` : typeFilter !== 'All' ? `No ${typeFilter} files` : 'Nothing here yet'}
              </h3>
              <p className="text-sm text-gray-400 mb-5">
                {localSearch || typeFilter !== 'All'
                  ? 'Try adjusting your filter or search term'
                  : 'Upload files or drag & drop them here'}
              </p>
              {!localSearch && typeFilter === 'All' && (
                <label className="cursor-pointer inline-flex">
                  <input type="file" className="hidden" onChange={onUpload} />
                  <div className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl flex items-center gap-2 text-sm font-semibold transition shadow-sm">
                    <Upload className="w-4 h-4" />
                    Upload a file
                  </div>
                </label>
              )}
            </div>
          )}
        </div>

        {/* File count footer */}
        {processedFiles.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-50 dark:border-gray-800 flex items-center justify-between">
            <span className="text-xs text-gray-400">
              {processedFiles.length} {processedFiles.length === 1 ? 'file' : 'files'}
              {localSearch || typeFilter !== 'All' ? ' (filtered)' : ''}
            </span>
            {someSelected && (
              <span className="text-xs text-green-600 font-semibold">{selectedFiles.length} selected</span>
            )}
          </div>
        )}
      </div>

      {/* ── CONTEXT MENU ──────────────────────────────────────────────── */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          file={contextMenu.file}
          onClose={() => setContextMenu(null)}
          onPreview={onPreview}
          onShare={onShare}
          onToggleStar={onToggleStar}
          onDelete={requestDelete}
          starringId={starringId}
        />
      )}

      {/* ── CONFIRM DELETE DIALOG ─────────────────────────────────────── */}
      <ConfirmDialog
        open={!!confirmDelete}
        title={confirmDelete === '__bulk__'
          ? `Delete ${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''}?`
          : 'Delete file?'}
        description={confirmDelete === '__bulk__'
          ? `This will permanently delete ${selectedFiles.length} selected file${selectedFiles.length > 1 ? 's' : ''}. This action cannot be undone.`
          : 'This file will be permanently deleted and cannot be recovered.'}
        onConfirm={() => {
          if (confirmDelete === '__bulk__') {
            handleBulkDelete();
          } else {
            confirmDeleteAction();
          }
        }}
        onCancel={() => setConfirmDelete(null)}
      />
    </>
  );
};

export default FileView;