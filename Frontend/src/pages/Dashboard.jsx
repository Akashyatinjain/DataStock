import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  Plus,
  Folder,
  Upload,
  FileText,
  Image as ImageIcon,
  Video,
  Archive,
  MoreVertical,
  Trash2,
  HardDrive,
  Grid3X3,
  List,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  X,
  Download,
  Eye,
} from 'lucide-react';

import Header from '../components/dashboard/layout/Header';
import Sidebar from '../components/dashboard/layout/Sidebar';
import FilePreviewModal from '../components/ui/FilePreviewModal';

import { getFiles, uploadFile, deleteFile } from '../api/file.api';
import { getProfile } from '../api/auth.api';

// ─────────────────────────────────────────
// TOAST SYSTEM
// ─────────────────────────────────────────

const ToastIcon = ({ type }) => {
  if (type === 'success') return <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />;
  if (type === 'error')   return <XCircle      className="w-5 h-5 text-red-400    shrink-0" />;
  return                         <AlertCircle  className="w-5 h-5 text-amber-400  shrink-0" />;
};

const Toast = ({ toast, onRemove }) => (
  <div
    className={`
      flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl border backdrop-blur-md
      text-sm font-medium text-white min-w-[280px] max-w-sm
      animate-slide-in
      ${toast.type === 'success' ? 'bg-gray-900/95 border-emerald-500/30' : ''}
      ${toast.type === 'error'   ? 'bg-gray-900/95 border-red-500/30'     : ''}
      ${toast.type === 'info'    ? 'bg-gray-900/95 border-amber-500/30'   : ''}
    `}
  >
    <ToastIcon type={toast.type} />
    <span className="flex-1 text-gray-100">{toast.message}</span>
    <button onClick={() => onRemove(toast.id)} className="text-gray-500 hover:text-white transition ml-1">
      <X className="w-4 h-4" />
    </button>
  </div>
);

const ToastContainer = ({ toasts, onRemove }) => (
  <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3">
    {toasts.map(t => <Toast key={t.id} toast={t} onRemove={onRemove} />)}
  </div>
);

// ─────────────────────────────────────────
// FILE TYPE CONFIG
// ─────────────────────────────────────────

const FILE_TYPES = {
  image:   { icon: ImageIcon, color: 'text-sky-500',     bg: 'bg-sky-50',     label: 'Image'    },
  video:   { icon: Video,     color: 'text-violet-500',  bg: 'bg-violet-50',  label: 'Video'    },
  pdf:     { icon: FileText,  color: 'text-rose-500',    bg: 'bg-rose-50',    label: 'PDF'      },
  zip:     { icon: Archive,   color: 'text-amber-500',   bg: 'bg-amber-50',   label: 'Archive'  },
  default: { icon: FileText,  color: 'text-slate-500',   bg: 'bg-slate-50',   label: 'File'     },
};

const getFileType = (mimeType) => {
  if (mimeType?.includes('image')) return FILE_TYPES.image;
  if (mimeType?.includes('video')) return FILE_TYPES.video;
  if (mimeType?.includes('pdf'))   return FILE_TYPES.pdf;
  if (mimeType?.includes('zip'))   return FILE_TYPES.zip;
  return FILE_TYPES.default;
};

const formatFileSize = (bytes) => {
  if (bytes < 1024)             return bytes + ' B';
  if (bytes < 1024 * 1024)      return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
};

// ─────────────────────────────────────────
// FILE CARD — GRID
// ─────────────────────────────────────────

const FileCard = ({ file, onDelete, onPreview, deletingId }) => {
  const type = getFileType(file.mimeType);
  const Icon = type.icon;
  const isDeleting = deletingId === file.id;

  return (
    <div
      className={`
        relative group bg-white border rounded-2xl overflow-hidden
        transition-all duration-300 cursor-pointer select-none
        ${isDeleting
          ? 'border-red-200 opacity-60 scale-95 pointer-events-none'
          : 'border-gray-100 hover:border-green-200 hover:shadow-xl hover:-translate-y-1 shadow-sm'}
      `}
      onClick={() => !isDeleting && onPreview(file)}
    >
      {/* Deleting overlay */}
      {isDeleting && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm rounded-2xl">
          <Loader2 className="w-8 h-8 text-red-500 animate-spin mb-2" />
          <span className="text-sm font-semibold text-red-500">Deleting…</span>
        </div>
      )}

      {/* Image preview strip */}
      {file.mimeType?.includes('image') ? (
        <div className="h-40 overflow-hidden bg-gray-50">
          <img src={file.url} alt={file.originalName} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        </div>
      ) : (
        <div className={`h-28 flex items-center justify-center ${type.bg}`}>
          <Icon className={`w-12 h-12 ${type.color} opacity-60`} />
        </div>
      )}

      <div className="p-4">
        {/* Type badge */}
        <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full mb-2 ${type.bg} ${type.color}`}>
          {type.label}
        </span>

        <h3 className="font-semibold text-gray-900 truncate text-sm leading-snug mb-1">
          {file.originalName}
        </h3>
        <p className="text-xs text-gray-400 mb-4">{formatFileSize(file.size)}</p>

        <div className="flex items-center justify-between pt-3 border-t border-gray-50">
          <span className="text-[11px] text-gray-400">
            {new Date(file.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
            <button
              onClick={e => { e.stopPropagation(); onPreview(file); }}
              className="p-1.5 hover:bg-green-50 rounded-lg text-gray-400 hover:text-green-600 transition"
              title="Preview"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={e => { e.stopPropagation(); onDelete(file.id); }}
              className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition"
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────
// FILE ROW — LIST
// ─────────────────────────────────────────

const FileRow = ({ file, onDelete, onPreview, deletingId }) => {
  const type = getFileType(file.mimeType);
  const Icon = type.icon;
  const isDeleting = deletingId === file.id;

  return (
    <div
      className={`
        grid grid-cols-12 gap-4 px-6 py-4 border-b border-gray-50
        hover:bg-gray-50/80 transition items-center cursor-pointer group
        ${isDeleting ? 'opacity-50 pointer-events-none' : ''}
      `}
      onClick={() => !isDeleting && onPreview(file)}
    >
      <div className="col-span-6 flex items-center gap-3 min-w-0">
        <div className={`w-10 h-10 ${type.bg} rounded-xl flex items-center justify-center shrink-0`}>
          <Icon className={`w-5 h-5 ${type.color}`} />
        </div>
        <div className="min-w-0">
          <p className="font-medium text-gray-900 text-sm truncate">{file.originalName}</p>
          <p className="text-[11px] text-gray-400 truncate">{file.url}</p>
        </div>
      </div>

      <div className="col-span-2 text-sm text-gray-500">{formatFileSize(file.size)}</div>

      <div className="col-span-3 text-sm text-gray-400">
        {new Date(file.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
      </div>

      <div className="col-span-1 flex justify-end gap-1">
        {isDeleting ? (
          <Loader2 className="w-4 h-4 text-red-400 animate-spin" />
        ) : (
          <>
            <button
              onClick={e => { e.stopPropagation(); onPreview(file); }}
              className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-green-50 rounded-lg text-gray-400 hover:text-green-600 transition"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={e => { e.stopPropagation(); onDelete(file.id); }}
              className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────
// UPLOAD DROP ZONE (drag & drop bonus)
// ─────────────────────────────────────────

const UploadButton = ({ uploading, onChange }) => (
  <label className="cursor-pointer">
    <input type="file" className="hidden" onChange={onChange} />
    <div className={`
      px-5 py-3 rounded-xl flex items-center gap-2 transition font-semibold text-sm shadow-sm
      ${uploading
        ? 'bg-green-100 text-green-700 cursor-not-allowed'
        : 'bg-green-600 hover:bg-green-700 text-white hover:shadow-md active:scale-95'}
    `}>
      {uploading
        ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</>
        : <><Upload className="w-4 h-4" /> Upload File</>
      }
    </div>
  </label>
);

// ─────────────────────────────────────────
// MAIN DASHBOARD
// ─────────────────────────────────────────

const Dashboard = () => {
  const [previewFile, setPreviewFile]       = useState(null);
  const [isPreviewOpen, setIsPreviewOpen]   = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery]       = useState('');
  const [activeTab, setActiveTab]           = useState('my-drive');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [files, setFiles]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState(null); // tracks which file is being deleted

  const [viewMode, setViewMode] = useState('grid');
  const [user, setUser] = useState(null);

  // Toast state
  const [toasts, setToasts] = useState([]);
  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);
  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  const handlePreview = (file) => {
    setPreviewFile(file);
    setIsPreviewOpen(true);
  };

  // ── FETCH ──────────────────────────────
  useEffect(() => { fetchDashboardData(); }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [fileRes, profileRes] = await Promise.all([getFiles(), getProfile()]);
      setFiles(fileRes.files || []);
      setUser(profileRes.user);
    } catch (error) {
      console.log(error);
      addToast('Failed to load files', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ── STORAGE ────────────────────────────
  const totalStorage = 10 * 1024 * 1024 * 1024;
  const usedStorage = useMemo(() => files.reduce((acc, f) => acc + f.size, 0), [files]);
  const usedGB = (usedStorage / (1024 * 1024 * 1024)).toFixed(3);
  const storagePercentage = Math.min((usedStorage / totalStorage) * 100, 100);

  // ── FILTER ─────────────────────────────
  const filteredFiles = useMemo(() =>
    files.filter(f => f.originalName?.toLowerCase().includes(searchQuery.toLowerCase())),
    [files, searchQuery]
  );

  // ── UPLOAD ─────────────────────────────
  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setUploading(true);
      addToast(`Uploading "${file.name}"…`, 'info');
      const formData = new FormData();
      formData.append('file', file);
      const response = await uploadFile(formData);
      const uploaded = response.file || response;
      setFiles((prev) => [{ ...uploaded, id: uploaded.id || uploaded._id }, ...prev]);
      addToast(`"${file.name}" uploaded successfully!`, 'success');
    } catch (error) {
      console.log(error);
      addToast('Upload failed. Please try again.', 'error');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  // ── DELETE ─────────────────────────────
  const handleDelete = async (fileId) => {
    const file = files.find(f => f.id === fileId);
    try {
      setDeletingId(fileId);
      addToast(`Deleting "${file?.originalName}"…`, 'info');
      await deleteFile(fileId);
      // short delay so user sees the "deleting" animation
      await new Promise(r => setTimeout(r, 600));
      setFiles(prev => prev.filter(f => f.id !== fileId));
      addToast(`"${file?.originalName}" was deleted.`, 'success');
    } catch (error) {
      console.log(error);
      addToast('Delete failed. Please try again.', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  // ─────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#f7f8fa]">

      {/* Inline keyframes */}
      <style>{`
        @keyframes slide-in {
          from { opacity: 0; transform: translateX(2rem); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .animate-slide-in { animation: slide-in 0.25s ease forwards; }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-up { animation: fade-up 0.4s ease forwards; }
        .stagger > *:nth-child(1)  { animation-delay: 0.05s; opacity: 0; }
        .stagger > *:nth-child(2)  { animation-delay: 0.10s; opacity: 0; }
        .stagger > *:nth-child(3)  { animation-delay: 0.15s; opacity: 0; }
        .stagger > *:nth-child(4)  { animation-delay: 0.20s; opacity: 0; }
        .stagger > *:nth-child(5)  { animation-delay: 0.25s; opacity: 0; }
        .stagger > *:nth-child(6)  { animation-delay: 0.30s; opacity: 0; }
        .stagger > *:nth-child(7)  { animation-delay: 0.35s; opacity: 0; }
        .stagger > *:nth-child(8)  { animation-delay: 0.40s; opacity: 0; }
        .stagger > * { animation: fade-up 0.4s ease forwards; }
      `}</style>

      {/* HEADER */}
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      <div className="flex pt-16">

        {/* SIDEBAR */}
        <Sidebar
          sidebarCollapsed={sidebarCollapsed}
          setSidebarCollapsed={setSidebarCollapsed}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          storageData={{ used: usedGB, total: 10, categories: [] }}
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
          syncFiles
          files={files}
          onFileUploaded={(file) => setFiles((prev) => [file, ...prev])}
        />

        {/* MAIN */}
        <main className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'md:ml-20' : 'md:ml-64'}`}>
          <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px]">

            {/* ── TOP BAR ── */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
              <div>
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">My Drive</h1>
                <p className="text-gray-400 mt-1 text-sm">Manage and organize your cloud files</p>
              </div>

              <div className="flex items-center gap-3">
                {/* View toggle */}
                <div className="flex items-center bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-green-100 text-green-700 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                    title="Grid view"
                  >
                    <Grid3X3 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-green-100 text-green-700 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                    title="List view"
                  >
                    <List className="w-5 h-5" />
                  </button>
                </div>

                <UploadButton uploading={uploading} onChange={handleUpload} />
              </div>
            </div>

            {/* ── STATS ROW ── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">

              {/* Storage card */}
              <div className="sm:col-span-2 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="text-base font-semibold text-gray-900">Storage Usage</h2>
                    <p className="text-gray-400 text-sm mt-0.5">{usedGB} GB used of 10 GB</p>
                  </div>
                  <div className="w-11 h-11 bg-green-50 rounded-xl flex items-center justify-center">
                    <HardDrive className="w-5 h-5 text-green-600" />
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{
                      width: `${storagePercentage}%`,
                      background: storagePercentage > 80
                        ? 'linear-gradient(90deg, #f59e0b, #ef4444)'
                        : 'linear-gradient(90deg, #22c55e, #10b981)',
                    }}
                  />
                </div>

                <div className="flex justify-between mt-2">
                  <span className="text-xs text-gray-400">0 GB</span>
                  <span className="text-xs font-semibold text-gray-500">{storagePercentage.toFixed(1)}%</span>
                  <span className="text-xs text-gray-400">10 GB</span>
                </div>
              </div>

              {/* File count card */}
              <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold text-gray-900">Total Files</h2>
                  <div className="w-11 h-11 bg-sky-50 rounded-xl flex items-center justify-center">
                    <Folder className="w-5 h-5 text-sky-500" />
                  </div>
                </div>
                <div>
                  <p className="text-4xl font-extrabold text-gray-900 mt-4 tabular-nums">{files.length}</p>
                  <p className="text-sm text-gray-400 mt-1">files stored</p>
                </div>
              </div>
            </div>

            {/* ── SECTION HEADER ── */}
            {!loading && filteredFiles.length > 0 && (
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                  {searchQuery ? `Results for "${searchQuery}"` : 'All Files'} — {filteredFiles.length}
                </h3>
              </div>
            )}

            {/* ── LOADING ── */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-32 gap-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-green-500" />
                  </div>
                </div>
                <p className="text-sm text-gray-400 font-medium">Loading your files…</p>
              </div>
            )}

            {/* ── EMPTY STATE ── */}
            {!loading && filteredFiles.length === 0 && (
              <div className="bg-white border border-dashed border-gray-200 rounded-3xl p-16 text-center">
                <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-gray-100">
                  <Folder className="w-10 h-10 text-gray-300" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  {searchQuery ? 'No files match your search' : 'No files uploaded yet'}
                </h2>
                <p className="text-gray-400 mb-8 text-sm">
                  {searchQuery ? 'Try a different keyword' : 'Upload your first file to get started with DataStock'}
                </p>
                {!searchQuery && (
                  <label className="cursor-pointer inline-flex">
                    <input type="file" className="hidden" onChange={handleUpload} />
                    <div className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl flex items-center gap-2 transition font-semibold text-sm shadow-sm">
                      <Plus className="w-4 h-4" />
                      Upload your first file
                    </div>
                  </label>
                )}
              </div>
            )}

            {/* ── GRID VIEW ── */}
            {!loading && filteredFiles.length > 0 && viewMode === 'grid' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 stagger">
                {filteredFiles.map(file => (
                  <FileCard
                    key={file.id}
                    file={file}
                    onDelete={handleDelete}
                    onPreview={handlePreview}
                    deletingId={deletingId}
                  />
                ))}
              </div>
            )}

            {/* ── LIST VIEW ── */}
            {!loading && filteredFiles.length > 0 && viewMode === 'list' && (
              <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-gray-50 bg-gray-50/80">
                  <div className="col-span-6 text-xs font-bold text-gray-400 uppercase tracking-widest">Name</div>
                  <div className="col-span-2 text-xs font-bold text-gray-400 uppercase tracking-widest">Size</div>
                  <div className="col-span-3 text-xs font-bold text-gray-400 uppercase tracking-widest">Date</div>
                  <div className="col-span-1" />
                </div>
                {filteredFiles.map(file => (
                  <FileRow
                    key={file.id}
                    file={file}
                    onDelete={handleDelete}
                    onPreview={handlePreview}
                    deletingId={deletingId}
                  />
                ))}
              </div>
            )}

          </div>
        </main>
      </div>

      {/* PREVIEW MODAL */}
      <FilePreviewModal
        file={previewFile}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
      />

      {/* TOAST CONTAINER */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
};

export default Dashboard;