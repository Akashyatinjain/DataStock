import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Trash2,
  ArrowLeft,
  RotateCcw,
  Search,
  Loader2,
  AlertCircle,
  HardDrive,
  FileText,
  FileCode,
  Image as ImageIcon,
  Video,
  FileDown
} from 'lucide-react';
import {
  fetchTrashFiles,
  restoreFileFromTrash,
  deleteExistingFile,
  emptyAllTrash,
} from '../store/slices/filesSlice';
import { fetchProfile } from '../store/slices/authSlice';
import ThemeToggle from '../components/ui/ThemeToggle';
import { formatFileSize, getFileType } from '../utils/fileHelpers';
import { getErrorMessage } from '../utils/errorMessage';
import ConfirmModal from '../components/dashboard/modals/ConfirmModal';

export default function TrashPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const trashFiles = useSelector((state) => state.files.trashFiles);
  const trashLoading = useSelector((state) => state.files.trashLoading);
  const emptyingTrash = useSelector((state) => state.files.emptyingTrash);
  const user = useSelector((state) => state.auth.user);

  const [searchQuery, setSearchQuery] = useState('');
  const [toasts, setToasts] = useState([]);
  
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    type: 'danger',
    onConfirm: null,
    loading: false,
  });

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message: getErrorMessage(message), type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  };

  useEffect(() => {
    dispatch(fetchProfile());
    dispatch(fetchTrashFiles());
  }, [dispatch]);

  const filteredFiles = useMemo(() => {
    return (trashFiles || []).filter((f) =>
      f.originalName?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [trashFiles, searchQuery]);

  const handleRestore = async (fileId, name) => {
    try {
      addToast(`Restoring "${name}"…`, 'info');
      const result = await dispatch(restoreFileFromTrash(fileId));
      if (restoreFileFromTrash.fulfilled.match(result)) {
        addToast(`"${name}" restored successfully!`, 'success');
        dispatch(fetchTrashFiles());
      } else {
        addToast(result.payload || 'Failed to restore file.', 'error');
      }
    } catch (err) {
      addToast('Failed to restore file.', 'error');
    }
  };

  const handleDeleteForever = (fileId, name) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Permanently?',
      message: `Are you sure you want to permanently delete "${name}"? This action cannot be undone.`,
      confirmText: 'Delete Forever',
      type: 'danger',
      onConfirm: async () => {
        setConfirmConfig((prev) => ({ ...prev, loading: true }));
        try {
          addToast(`Permanently deleting "${name}"…`, 'info');
          const result = await dispatch(deleteExistingFile(fileId));
          if (deleteExistingFile.fulfilled.match(result)) {
            addToast(`"${name}" permanently deleted.`, 'success');
            dispatch(fetchTrashFiles());
            dispatch(fetchProfile());
          } else {
            addToast(result.payload || 'Failed to delete file.', 'error');
          }
        } catch (err) {
          addToast('Failed to delete file.', 'error');
        } finally {
          setConfirmConfig((prev) => ({ ...prev, isOpen: false, loading: false }));
        }
      },
    });
  };

  const handleEmptyTrash = () => {
    setConfirmConfig({
      isOpen: true,
      title: 'Empty Trash?',
      message: 'Are you sure you want to permanently delete all files in your trash? This action is irreversible.',
      confirmText: 'Empty Trash',
      type: 'danger',
      onConfirm: async () => {
        setConfirmConfig((prev) => ({ ...prev, loading: true }));
        try {
          addToast('Emptying trash…', 'info');
          const result = await dispatch(emptyAllTrash());
          if (emptyAllTrash.fulfilled.match(result)) {
            addToast('Trash emptied successfully!', 'success');
            dispatch(fetchTrashFiles());
            dispatch(fetchProfile());
          } else {
            addToast(result.payload || 'Failed to empty trash.', 'error');
          }
        } catch (err) {
          addToast('Failed to empty trash.', 'error');
        } finally {
          setConfirmConfig((prev) => ({ ...prev, isOpen: false, loading: false }));
        }
      },
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0F172A] text-slate-900 dark:text-[#F8FAFC] transition-colors duration-200">
      {/* Top Header */}
      <header className="sticky top-0 bg-white/80 dark:bg-[#1E293B]/80 backdrop-blur-md z-40 border-b border-slate-200 dark:border-[#334155]">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 hover:bg-slate-100 dark:hover:bg-[#334155] rounded-xl transition duration-150 cursor-pointer"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-5 h-5 text-slate-500 dark:text-[#94A3B8]" />
            </button>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-red-500/10 text-red-500 rounded-xl">
                <Trash2 className="w-5 h-5" />
              </div>
              <h1 className="font-bold text-lg hidden sm:block">Trash</h1>
            </div>
          </div>

          {/* Search bar */}
          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search deleted files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-[#334155] rounded-xl bg-slate-50 dark:bg-[#0F172A] focus:outline-none focus:border-red-500 dark:focus:border-red-500 text-sm transition"
            />
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main container */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold">Trash Files</h2>
            <p className="text-xs text-slate-500 dark:text-[#94A3B8]">
              {filteredFiles.length} file{filteredFiles.length === 1 ? '' : 's'} in your trash. Permanent deletion will free up storage space.
            </p>
          </div>
          {filteredFiles.length > 0 && (
            <button
              onClick={handleEmptyTrash}
              disabled={emptyingTrash || trashLoading}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold shadow-sm hover:shadow-md transition active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              Empty Trash
            </button>
          )}
        </div>

        {/* Trashed items lists */}
        {trashLoading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-red-500" />
            <span className="text-sm text-slate-400 font-medium">Loading trash...</span>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="bg-white dark:bg-[#1E293B] border border-dashed border-slate-200 dark:border-[#334155] rounded-3xl p-16 text-center max-w-md mx-auto mt-12">
            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800/40 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100 dark:border-slate-800">
              <Trash2 className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="font-bold text-lg mb-1">Your trash is empty</h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
              Files you delete will remain here until you empty the trash or restore them.
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-[#334155] rounded-2xl overflow-hidden shadow-xs">
            <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3.5 border-b border-slate-100 dark:border-[#334155] bg-slate-50/50 dark:bg-[#334155]/20 text-xs font-extrabold text-slate-400 uppercase tracking-wider">
              <div className="col-span-6">File Name</div>
              <div className="col-span-2">Size</div>
              <div className="col-span-2">Deleted Date</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>

            <div className="divide-y divide-slate-150 dark:divide-[#334155]">
              {filteredFiles.map((file) => {
                const fileType = getFileType(file.mimeType);
                const Icon = fileType.icon;
                return (
                  <div
                    key={file.id}
                    className="grid grid-cols-[1fr_auto] md:grid-cols-12 gap-3 md:gap-4 px-6 py-4 items-center hover:bg-slate-50/80 dark:hover:bg-[#334155]/30 transition"
                  >
                    {/* Name column */}
                    <div className="col-span-1 md:col-span-6 flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 ${fileType.bg || 'bg-slate-100'} rounded-lg flex items-center justify-center shrink-0`}>
                        <Icon className={`w-4.5 h-4.5 ${fileType.color || 'text-slate-500'}`} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate text-slate-800 dark:text-[#F8FAFC]" title={file.originalName}>
                          {file.originalName}
                        </p>
                        <p className="md:hidden text-[10px] text-slate-400 mt-0.5">
                          {formatFileSize(file.size)} • {new Date(file.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Size column */}
                    <div className="hidden md:block col-span-2 text-sm text-slate-500 dark:text-[#94A3B8]">
                      {formatFileSize(file.size)}
                    </div>

                    {/* Deleted date */}
                    <div className="hidden md:block col-span-2 text-sm text-slate-400">
                      {new Date(file.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </div>

                    {/* Action buttons */}
                    <div className="col-span-1 md:col-span-2 flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleRestore(file.id, file.originalName)}
                        className="p-2 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-emerald-600 rounded-lg transition cursor-pointer"
                        title="Restore File"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteForever(file.id, file.originalName)}
                        className="p-2 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 rounded-lg transition cursor-pointer"
                        title="Delete Forever"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        type={confirmConfig.type}
        loading={confirmConfig.loading}
      />

      {/* Simple Custom Toast Container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl text-sm font-semibold text-white bg-slate-900/95 border backdrop-blur-md ${
              t.type === 'success' ? 'border-emerald-500/30' : t.type === 'error' ? 'border-red-500/30' : 'border-amber-500/30'
            }`}
          >
            <span>{t.message}</span>
            <button
              onClick={() => setToasts((prev) => prev.filter((toast) => toast.id !== t.id))}
              className="text-slate-500 hover:text-white transition ml-1 text-xs cursor-pointer"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
