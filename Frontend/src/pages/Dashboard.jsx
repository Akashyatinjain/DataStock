import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Bell,
  Check,
  Star,
  Share2,
  RotateCcw,
  BarChart2,
  TrendingUp,
  PieChart,
} from 'lucide-react';

import Header from '../components/dashboard/layout/Header';
import Sidebar from '../components/dashboard/layout/Sidebar';
import FilePreviewModal from '../components/ui/FilePreviewModal';
import ShareModal from '../components/dashboard/modals/ShareModal';
import ConfirmModal from '../components/dashboard/modals/ConfirmModal';

import { SUBSCRIPTION_UPDATED_EVENT } from '../utils/subscription';
import {
  normalizeList,
  normalizeFile,
  getActiveFolderId,
  getFolderId,
} from '../utils/fileHelpers';
import { QUICK_FILTERS } from '../utils/filters';
import { getErrorMessage } from '../utils/errorMessage';
import { ALLOWED_UPLOAD_ACCEPT, validateUploadFile } from '../utils/uploadValidation';

import { connectSocket, socket } from "../socket";

// Redux Integration
import { useDispatch, useSelector } from 'react-redux';
import { fetchProfile } from '../store/slices/authSlice';
import {
  fetchFiles,
  fetchAllFiles,
  uploadNewFile,
  deleteExistingFile,
  toggleStar,
  addUploadedFile,
  fetchTrashFiles,
  moveFileToTrash,
  restoreFileFromTrash,
  emptyAllTrash,
  fetchStorageAnalytics,
  fetchStorageActivity,
} from '../store/slices/filesSlice';
import {
  fetchFolders,
  deleteExistingFolder,
} from '../store/slices/foldersSlice';
import {
  fetchNotifications,
  readNotification,
  readAllNotifications,
  addNotification,
} from '../store/slices/notificationsSlice';
import { fetchSharedWithMe } from '../store/slices/shareSlice';

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
    <span className="flex-1 text-gray-100">{getErrorMessage(toast.message, '')}</span>
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

const ANALYTICS_CATEGORIES = [
  {
    key: 'images',
    label: 'Images',
    icon: ImageIcon,
    text: 'text-sky-600 dark:text-sky-400',
    bg: 'bg-sky-50 dark:bg-sky-950/30',
    bar: 'bg-sky-500',
  },
  {
    key: 'videos',
    label: 'Videos',
    icon: Video,
    text: 'text-violet-600 dark:text-violet-400',
    bg: 'bg-violet-50 dark:bg-violet-950/30',
    bar: 'bg-violet-500',
  },
  {
    key: 'documents',
    label: 'Documents',
    icon: FileText,
    text: 'text-rose-600 dark:text-rose-400',
    bg: 'bg-rose-50 dark:bg-rose-950/30',
    bar: 'bg-rose-500',
  },
  {
    key: 'archives',
    label: 'Archives',
    icon: Archive,
    text: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    bar: 'bg-amber-500',
  },
  {
    key: 'others',
    label: 'Others',
    icon: Folder,
    text: 'text-slate-600 dark:text-slate-400',
    bg: 'bg-slate-50 dark:bg-slate-900',
    bar: 'bg-slate-500',
  },
];

const getPercent = (value, total) => {
  const safeValue = Number(value) || 0;
  const safeTotal = Number(total) || 0;
  if (safeTotal <= 0) return 0;
  return Math.min((safeValue / safeTotal) * 100, 100);
};

const StorageAnalyticsView = ({
  analytics,
  analyticsLoading,
  analyticsCategories,
  analyticsUsed,
  analyticsLimit,
  analyticsPercent,
  analyticsRemaining,
  analyticsActiveSize,
  analyticsFileCount,
  analyticsTrash,
  uploadTrend,
  uploadTrendMax,
  weeklyUploadCount,
  weeklyUploadSize,
  largestCategory,
  storageStatus,
  onEmptyTrash,
  onUpgrade,
  storageActivity,
  activityLoading,
}) => {
  if (analyticsLoading) {
    return (
      <div className="space-y-6 animate-fade-up max-w-7xl mx-auto">
        <div className="flex flex-col items-center justify-center py-28 gap-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm">
          <Loader2 className="w-10 h-10 animate-spin text-green-500" />
          <p className="text-sm text-gray-400 font-medium">Loading storage analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="space-y-6 animate-fade-up max-w-7xl mx-auto">
        <div className="text-center py-20 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Failed to load analytics</h3>
          <p className="text-sm text-gray-400 mt-1">Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-up max-w-7xl mx-auto">
      <section className="grid grid-cols-1 xl:grid-cols-[1.35fr_0.65fr] gap-6">
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center gap-6">
            <div
              className="w-40 h-40 rounded-full mx-auto lg:mx-0 shrink-0 p-3"
              style={{
                background: `conic-gradient(${analyticsPercent >= 85 ? '#ef4444' : '#16a34a'} ${analyticsPercent * 3.6}deg, ${analyticsPercent >= 85 ? '#fee2e2' : '#dcfce7'} 0deg)`,
              }}
            >
              <div className="w-full h-full rounded-full bg-white dark:bg-gray-900 border border-white/80 dark:border-gray-800 flex flex-col items-center justify-center shadow-inner">
                <span className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 tabular-nums">
                  {analyticsPercent.toFixed(0)}%
                </span>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Used</span>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400">
                  <HardDrive className="w-3.5 h-3.5" />
                  {analytics.subscriptionPlan || 'BASIC'} Plan
                </span>
                <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-bold ${
                  analyticsPercent >= 90
                    ? 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400'
                    : analyticsPercent >= 75
                      ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400'
                      : 'bg-sky-50 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400'
                }`}>
                  {storageStatus}
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-gray-100 leading-tight">
                Storage Analytics
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                {formatFileSize(analyticsUsed)} used of {formatFileSize(analyticsLimit)} across {analyticsFileCount} active files.
              </p>

              <div className="mt-6">
                <div className="h-3 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${analyticsPercent}%`,
                      background: analyticsPercent >= 85
                        ? 'linear-gradient(90deg, #f59e0b, #ef4444)'
                        : 'linear-gradient(90deg, #0ea5e9, #22c55e)',
                    }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-xs text-gray-400">
                  <span>{formatFileSize(analyticsUsed)}</span>
                  <span className="font-semibold text-gray-600 dark:text-gray-300">{analyticsPercent.toFixed(1)}%</span>
                  <span>{formatFileSize(analyticsLimit)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-sm">
            <div className="w-10 h-10 bg-sky-50 dark:bg-sky-950/30 rounded-xl flex items-center justify-center mb-5">
              <PieChart className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            </div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Largest Type</p>
            <p className="text-xl font-extrabold text-gray-900 dark:text-gray-100 mt-1">{largestCategory?.label || 'Files'}</p>
            <p className="text-xs text-gray-400 mt-1">{formatFileSize(largestCategory?.size || 0)}</p>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-sm">
            <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl flex items-center justify-center mb-5">
              <HardDrive className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Remaining</p>
            <p className="text-xl font-extrabold text-gray-900 dark:text-gray-100 mt-1">{formatFileSize(analyticsRemaining)}</p>
            <p className="text-xs text-gray-400 mt-1">Available now</p>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-sm">
            <div className="w-10 h-10 bg-red-50 dark:bg-red-950/30 rounded-xl flex items-center justify-center mb-5">
              <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Trash</p>
            <p className="text-xl font-extrabold text-gray-900 dark:text-gray-100 mt-1">{formatFileSize(analyticsTrash.size)}</p>
            <p className="text-xs text-gray-400 mt-1">{analyticsTrash.count} files</p>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-sm">
            <div className="w-10 h-10 bg-violet-50 dark:bg-violet-950/30 rounded-xl flex items-center justify-center mb-5">
              <TrendingUp className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            </div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">7 Days</p>
            <p className="text-xl font-extrabold text-gray-900 dark:text-gray-100 mt-1">{weeklyUploadCount}</p>
            <p className="text-xs text-gray-400 mt-1">{formatFileSize(weeklyUploadSize)} uploaded</p>
          </div>
        </div>
      </section>

      {/* Real-time Storage Activity Card */}
      {storageActivity && (
        <section className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 sm:p-6 shadow-sm">
          <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600 animate-pulse" />
            Storage Space Activity
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div className="md:col-span-2">
              <div className="flex justify-between items-center mb-2 text-sm text-gray-600 dark:text-gray-400">
                <span>Active vs Trash Storage</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {((storageActivity.storageUsed / storageActivity.storageLimit) * 100).toFixed(1)}% Limit Used
                </span>
              </div>
              
              {/* Stacked Progress Bar */}
              <div className="w-full h-4 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden flex">
                <div 
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-600 transition-all duration-1000"
                  style={{ width: `${(storageActivity.activeUsed / (storageActivity.storageUsed || 1)) * 100}%` }}
                  title={`Active Files: ${formatFileSize(storageActivity.activeUsed)}`}
                />
                <div 
                  className="h-full bg-gradient-to-r from-red-400 to-rose-500 transition-all duration-1000"
                  style={{ width: `${(storageActivity.trashUsed / (storageActivity.storageUsed || 1)) * 100}%` }}
                  title={`Trash Files: ${formatFileSize(storageActivity.trashUsed)}`}
                />
              </div>
              
              <div className="flex justify-between items-center mt-3 text-xs text-gray-400">
                <span>0 B</span>
                <div className="flex gap-4">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block shadow-sm"></span>
                    Active ({((storageActivity.activeUsed / (storageActivity.storageUsed || 1)) * 100).toFixed(0)}%)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block shadow-sm"></span>
                    Trash ({((storageActivity.trashUsed / (storageActivity.storageUsed || 1)) * 100).toFixed(0)}%)
                  </span>
                </div>
                <span>{formatFileSize(storageActivity.storageUsed)}</span>
              </div>
            </div>
            
            <div className="border-t md:border-t-0 md:border-l border-gray-100 dark:border-gray-800 pt-4 md:pt-0 md:pl-6 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">Active Files Size:</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">{formatFileSize(storageActivity.activeUsed)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">Trash Size:</span>
                <span className="font-semibold text-red-600 dark:text-red-400">{formatFileSize(storageActivity.trashUsed)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">Total Database Used:</span>
                <span className="font-bold text-gray-900 dark:text-gray-100">{formatFileSize(storageActivity.storageUsed)}</span>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-6">
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-6">
            <div>
              <h3 className="font-bold text-gray-900 dark:text-gray-100">Storage Mix</h3>
              <p className="text-xs text-gray-400 mt-1">{formatFileSize(analyticsActiveSize)} active storage</p>
            </div>
            <BarChart2 className="w-5 h-5 text-gray-400" />
          </div>

          <div className="flex h-3 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 mb-6">
            {analyticsCategories.map((category) => {
              const width = getPercent(category.size, analyticsActiveSize);
              return (
                <div
                  key={category.key}
                  className={`${category.bar} transition-all duration-700`}
                  style={{ width: `${width}%` }}
                  title={`${category.label}: ${formatFileSize(category.size)}`}
                />
              );
            })}
          </div>

          <div className="space-y-4">
            {analyticsCategories.map((category) => {
              const Icon = category.icon;
              const percent = getPercent(category.size, analyticsActiveSize);
              return (
                <div key={category.key} className="flex items-center gap-4">
                  <div className={`w-10 h-10 ${category.bg} rounded-xl flex items-center justify-center shrink-0`}>
                    <Icon className={`w-5 h-5 ${category.text}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{category.label}</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-gray-100 tabular-nums">{formatFileSize(category.size)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-2 flex-1 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800">
                        <div className={`h-full rounded-full ${category.bar}`} style={{ width: `${percent}%` }} />
                      </div>
                      <span className="w-12 text-right text-xs text-gray-400 tabular-nums">{percent.toFixed(0)}%</span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 w-14 text-right">{category.count} files</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <div>
              <h3 className="font-bold text-gray-900 dark:text-gray-100">Upload Activity</h3>
              <p className="text-xs text-gray-400 mt-1">Last 7 days by count and size</p>
            </div>
            <button
              type="button"
              onClick={onUpgrade}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-bold shadow-sm transition active:scale-95"
            >
              <Upload className="w-4 h-4" />
              Upgrade Storage
            </button>
          </div>

          <div className="flex-1 flex items-end gap-3 min-h-56 pt-6 border-b border-gray-100 dark:border-gray-800">
            {uploadTrend.map((day) => {
              const count = Number(day.count) || 0;
              const size = Number(day.size) || 0;
              const heightPct = Math.min((count / uploadTrendMax) * 100, 100);
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center group relative gap-2">
                  <div className="absolute bottom-full mb-2 bg-gray-900 text-white text-[10px] py-1 px-2 rounded-lg opacity-0 group-hover:opacity-100 transition duration-200 pointer-events-none whitespace-nowrap shadow-xl z-10 flex flex-col gap-0.5 items-center">
                    <span className="font-bold">{count} uploads</span>
                    <span className="text-gray-400">{formatFileSize(size)}</span>
                  </div>
                  <div
                    className="w-full max-w-12 rounded-t-xl bg-green-100 dark:bg-green-950/40 group-hover:bg-green-500 transition-all duration-300 relative overflow-hidden flex items-end"
                    style={{ height: `${Math.max(heightPct, count > 0 ? 12 : 4)}%` }}
                  >
                    {count > 0 && <div className="w-full h-1.5 bg-green-600 rounded-t-xl" />}
                  </div>
                  <span className="text-[10px] font-semibold text-gray-400 truncate w-full text-center">{day.date}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="font-bold text-gray-900 dark:text-gray-100">Trash Storage</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {formatFileSize(analyticsTrash.size)} in {analyticsTrash.count} trashed files.
              </p>
            </div>
            {analyticsTrash.count > 0 ? (
              <button
                type="button"
                onClick={onEmptyTrash}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-950/50 text-red-600 dark:text-red-400 text-xs font-bold transition"
              >
                <Trash2 className="w-4 h-4" />
                Empty Trash
              </button>
            ) : (
              <span className="inline-flex items-center justify-center px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 text-xs font-bold text-gray-400">
                Trash Empty
              </span>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

const formatFileSize = (bytes) => {
  if (bytes < 1024)             return bytes + ' B';
  if (bytes < 1024 * 1024)      return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  if (bytes < 1024 * 1024 * 1024 * 1024) return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  return (bytes / (1024 * 1024 * 1024 * 1024)).toFixed(1) + ' TB';
};

const FileCard = ({ file, onDelete, onPreview, onToggleStar, onShare, deletingId, starringId, isTrashView, onRestore, restoringId }) => {
  const type = getFileType(file.mimeType);
  const Icon = type.icon;
  const isDeleting = deletingId === file.id;
  const isRestoring = restoringId === file.id;
  const isStarring = starringId === file.id;
  const isStarred = file.starred || file.isStarred;

  return (
    <div
      className={`
        relative group bg-white dark:bg-gray-900 border rounded-2xl overflow-hidden
        transition-all duration-300 cursor-pointer select-none
        ${isDeleting || isRestoring
          ? 'border-red-200 dark:border-red-900 opacity-60 scale-95 pointer-events-none'
          : 'border-gray-100 dark:border-gray-800 hover:border-green-200 dark:hover:border-green-800 hover:shadow-xl hover:-translate-y-1 shadow-sm'}
      `}
      onClick={() => !isDeleting && !isRestoring && onPreview(file)}
    >
      {isDeleting && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl">
          <Loader2 className="w-8 h-8 text-red-500 animate-spin mb-2" />
          <span className="text-sm font-semibold text-red-500">{isTrashView ? 'Deleting…' : 'Trashing…'}</span>
        </div>
      )}
      {isRestoring && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl">
          <Loader2 className="w-8 h-8 text-green-500 animate-spin mb-2" />
          <span className="text-sm font-semibold text-green-500">Restoring…</span>
        </div>
      )}

      {file.mimeType?.includes('image') ? (
        <div className="h-40 overflow-hidden bg-gray-50 dark:bg-gray-800">
          <img src={file.url} alt={file.originalName} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        </div>
      ) : (
        <div className={`h-28 flex items-center justify-center ${type.bg}`}>
          <Icon className={`w-12 h-12 ${type.color} opacity-60`} />
        </div>
      )}

      <div className="p-4">
        <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full mb-2 ${type.bg} ${type.color}`}>
          {type.label}
        </span>

        <div className="flex items-center gap-1.5 mb-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate text-sm leading-snug flex-1">
            {file.originalName}
          </h3>
          {isStarred && !isTrashView && (
            <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400 shrink-0" />
          )}
        </div>
        <p className="text-xs text-gray-400 mb-4">{formatFileSize(file.size)}</p>

        <div className="flex items-center justify-between pt-3 border-t border-gray-50 dark:border-gray-800">
          <span className="text-[11px] text-gray-400">
            {new Date(file.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
          <div className="flex gap-1 shrink-0">
            {isTrashView ? (
              <>
                <button
                  onClick={e => { e.stopPropagation(); onRestore(file.id); }}
                  disabled={isRestoring}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-green-50 hover:text-green-600 transition"
                  title="Restore"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={e => { e.stopPropagation(); onDelete(file.id); }}
                  disabled={isDeleting}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition"
                  title="Delete Forever"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={e => { e.stopPropagation(); onToggleStar(file.id); }}
                  disabled={isStarring}
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition ${
                    isStarred
                      ? 'text-yellow-500 hover:bg-yellow-50'
                      : 'text-gray-400 hover:bg-yellow-50 hover:text-yellow-500'
                  }`}
                  title={isStarred ? 'Remove from starred' : 'Add to starred'}
                >
                  {isStarring ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Star className={`w-4 h-4 ${isStarred ? 'fill-yellow-400' : ''}`} />
                  )}
                </button>
                <button
                  onClick={e => { e.stopPropagation(); onShare(file); }}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-sky-50 hover:text-sky-600 transition"
                  title="Share"
                >
                  <Share2 className="w-4 h-4" />
                </button>
                <button
                  onClick={e => { e.stopPropagation(); onPreview(file); }}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-green-50 hover:text-green-600 transition"
                  title="Preview"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={e => { e.stopPropagation(); onDelete(file.id); }}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const FileRow = ({ file, onDelete, onPreview, onToggleStar, onShare, deletingId, starringId, isTrashView, onRestore, restoringId }) => {
  const type = getFileType(file.mimeType);
  const Icon = type.icon;
  const isDeleting = deletingId === file.id;
  const isRestoring = restoringId === file.id;
  const isStarring = starringId === file.id;
  const isStarred = file.starred || file.isStarred;

  return (
    <div
      className={`
        grid grid-cols-[minmax(0,1fr)_auto] md:grid-cols-12 gap-3 md:gap-4 px-4 sm:px-6 py-4 border-b border-gray-50 dark:border-gray-800
        hover:bg-gray-50/80 dark:hover:bg-gray-800/50 transition items-center cursor-pointer group
        ${isDeleting || isRestoring ? 'opacity-50 pointer-events-none' : ''}
      `}
      onClick={() => !isDeleting && !isRestoring && onPreview(file)}
    >
      <div className="md:col-span-6 flex items-center gap-3 min-w-0">
        <div className={`w-10 h-10 ${type.bg} rounded-xl flex items-center justify-center shrink-0`}>
          <Icon className={`w-5 h-5 ${type.color}`} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <p className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">{file.originalName}</p>
            {isStarred && !isTrashView && (
              <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400 shrink-0" />
            )}
          </div>
          <p className="text-[11px] text-gray-400 truncate">{file.url}</p>
          <p className="md:hidden text-[11px] text-gray-400 truncate">
            {formatFileSize(file.size)} - {new Date(file.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
          </p>
        </div>
      </div>

      <div className="hidden md:block md:col-span-2 text-sm text-gray-500 dark:text-gray-400">{formatFileSize(file.size)}</div>

      <div className="hidden md:block md:col-span-3 text-sm text-gray-400">
        {new Date(file.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
      </div>

      <div className="md:col-span-1 flex justify-end gap-1 shrink-0">
        {isDeleting ? (
          <Loader2 className="w-4 h-4 text-red-400 animate-spin" />
        ) : isRestoring ? (
          <Loader2 className="w-4 h-4 text-green-400 animate-spin" />
        ) : (
          <>
            {isTrashView ? (
              <>
                <button
                  onClick={e => { e.stopPropagation(); onRestore(file.id); }}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-green-50 hover:text-green-600 transition"
                  title="Restore"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={e => { e.stopPropagation(); onDelete(file.id); }}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition"
                  title="Delete Forever"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={e => { e.stopPropagation(); onToggleStar(file.id); }}
                  disabled={isStarring}
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition ${
                    isStarred
                      ? 'text-yellow-500 hover:bg-yellow-50'
                      : 'text-gray-400 hover:bg-yellow-50 hover:text-yellow-500'
                  }`}
                  title={isStarred ? 'Remove from starred' : 'Add to starred'}
                >
                  {isStarring ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Star className={`w-4 h-4 ${isStarred ? 'fill-yellow-400' : ''}`} />
                  )}
                </button>
                <button
                  onClick={e => { e.stopPropagation(); onShare(file); }}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-sky-50 hover:text-sky-600 transition"
                  title="Share"
                >
                  <Share2 className="w-4 h-4" />
                </button>
                <button
                  onClick={e => { e.stopPropagation(); onPreview(file); }}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-green-50 hover:text-green-600 transition"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={e => { e.stopPropagation(); onDelete(file.id); }}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const UploadButton = ({ uploading, onChange }) => (
  <label className="cursor-pointer inline-flex max-w-full">
    <input type="file" className="hidden" accept={ALLOWED_UPLOAD_ACCEPT} onChange={onChange} />
    <div className={`
      px-5 py-3 rounded-xl inline-flex items-center gap-2 transition font-semibold text-sm shadow-sm whitespace-nowrap
      ${uploading
        ? 'bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400 cursor-not-allowed'
        : 'bg-green-600 hover:bg-green-700 text-white hover:shadow-md active:scale-95'}
    `}>
      {uploading
        ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</>
        : <><Upload className="w-4 h-4" /> Upload File</>
      }
    </div>
  </label>
);

const Dashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // State from Redux
  const user = useSelector((state) => state.auth.user);
  const files = useSelector((state) => state.files.files);
  const allFiles = useSelector((state) => state.files.allFiles);
  const trashFiles = useSelector((state) => state.files.trashFiles);
  const loading = useSelector((state) => state.files.loading);
  const trashLoading = useSelector((state) => state.files.trashLoading);
  const uploading = useSelector((state) => state.files.uploading);
  const deletingId = useSelector((state) => state.files.deletingId);
  const starringId = useSelector((state) => state.files.starringId);
  const restoringId = useSelector((state) => state.files.restoringId);
  const emptyingTrash = useSelector((state) => state.files.emptyingTrash);
  const analytics = useSelector((state) => state.files.analytics);
  const analyticsLoading = useSelector((state) => state.files.analyticsLoading);
  const storageActivity = useSelector((state) => state.files.storageActivity);
  const activityLoading = useSelector((state) => state.files.activityLoading);

  const folders = useSelector((state) => state.folders.folders);
  const foldersLoading = useSelector((state) => state.folders.loading);

  const sharedWithMe = useSelector((state) => state.share.sharedWithMe);
  const sharedLoading = useSelector((state) => state.share.loading);

  const notifications = useSelector((state) => state.notifications.notifications);
  const notificationsLoading = useSelector((state) => state.notifications.loading);

  // Local UI States
  const [previewFile, setPreviewFile]       = useState(null);
  const [isPreviewOpen, setIsPreviewOpen]   = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery]       = useState('');
  const [activeTab, setActiveTab]           = useState('my-drive');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Share modal state
  const [shareModalFile, setShareModalFile] = useState(null);
  const [isShareOpen, setIsShareOpen] = useState(false);

  const handleShare = useCallback((file) => {
    setShareModalFile(file);
    setIsShareOpen(true);
  }, []);

  // Confirm modal state
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    type: 'danger',
    onConfirm: null,
    loading: false,
  });

  const [viewMode, setViewMode] = useState('grid');

  // Toast state
  const [toasts, setToasts] = useState([]);
  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message: getErrorMessage(message), type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);
  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  const handlePreview = (file) => {
    setPreviewFile(file);
    setIsPreviewOpen(true);
  };

  const selectedFolderId = useMemo(
    () => getActiveFolderId(activeTab),
    [activeTab]
  );

  const selectedFolder = useMemo(
    () => folders.find((f) => getFolderId(f) === selectedFolderId),
    [folders, selectedFolderId]
  );

  const loadFiles = useCallback((folderId = null) => {
    dispatch(fetchFiles(folderId));
  }, [dispatch]);

  const refreshAllFiles = useCallback(() => {
    dispatch(fetchAllFiles());
    dispatch(fetchProfile());
    dispatch(fetchStorageActivity());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchFolders());
    dispatch(fetchProfile());
    dispatch(fetchAllFiles());
    dispatch(fetchStorageActivity());
  }, [dispatch]);

  const reloadProfile = useCallback(() => {
    dispatch(fetchProfile());
  }, [dispatch]);

  useEffect(() => {
    const handleSubscriptionUpdated = () => {
      reloadProfile();
    };

    const handleFocus = () => {
      reloadProfile();
    };

    window.addEventListener(SUBSCRIPTION_UPDATED_EVENT, handleSubscriptionUpdated);
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener(SUBSCRIPTION_UPDATED_EVENT, handleSubscriptionUpdated);
      window.removeEventListener('focus', handleFocus);
    };
  }, [reloadProfile]);

  useEffect(() => {
    if (activeTab === 'my-drive' || activeTab?.startsWith('folder-')) {
      loadFiles(selectedFolderId);
    }
  }, [activeTab, selectedFolderId, loadFiles]);

  useEffect(() => {
    if (activeTab === 'notifications' && user?.id) {
      dispatch(fetchNotifications());
    }
  }, [activeTab, user, dispatch]);

  useEffect(() => {
    if (activeTab === 'shared') {
      dispatch(fetchSharedWithMe());
    }
  }, [activeTab, dispatch]);

  useEffect(() => {
    if (activeTab === 'trash') {
      dispatch(fetchTrashFiles());
    }
  }, [activeTab, dispatch]);

  useEffect(() => {
    if (activeTab === 'analytics') {
      dispatch(fetchStorageAnalytics());
      dispatch(fetchStorageActivity());
    }
  }, [activeTab, dispatch]);

  // Live notifications listener for real-time toasts and page updates
  useEffect(() => {
    if (user?.id) {
      connectSocket();
      socket.emit("join", user.id);

      const handleNewNotification = (notification) => {
        addToast(notification.message, 'success');
        dispatch(addNotification(notification));
      };

      socket.on('notification', handleNewNotification);

      return () => {
        socket.off('notification', handleNewNotification);
      };
    }
  }, [user, addToast, dispatch]);

  // ── STORAGE (all files: My Drive + every folder) ──
  const totalStorage = Number(user?.storageLimit || 10 * 1024 * 1024 * 1024);
  const usedStorage = useMemo(
    () => allFiles.reduce((acc, f) => acc + (f.size || 0), 0),
    [allFiles]
  );
  const usedFormatted = formatFileSize(usedStorage);
  const totalFormatted = formatFileSize(totalStorage);
  const usedGB = usedStorage / (1024 * 1024 * 1024);
  const totalGB = totalStorage / (1024 * 1024 * 1024);
  const storagePercentage = Math.min((usedStorage / totalStorage) * 100, 100);
  const totalFileCount = allFiles.length;

  const analyticsCategories = useMemo(() => {
    const categories = analytics?.categories || {};

    return ANALYTICS_CATEGORIES.map((category) => {
      const data = categories[category.key] || {};
      return {
        ...category,
        size: Number(data.size) || 0,
        count: Number(data.count) || 0,
      };
    });
  }, [analytics]);

  const analyticsUsed = Number(analytics?.storageUsed) || 0;
  const analyticsLimit = Number(analytics?.storageLimit) || 0;
  const analyticsPercent = getPercent(analyticsUsed, analyticsLimit);
  const analyticsRemaining = Math.max(analyticsLimit - analyticsUsed, 0);
  const analyticsActiveSize = analyticsCategories.reduce(
    (total, category) => total + category.size,
    0
  );
  const analyticsFileCount = analyticsCategories.reduce(
    (total, category) => total + category.count,
    0
  );
  const analyticsTrash = {
    size: Number(analytics?.trash?.size) || 0,
    count: Number(analytics?.trash?.count) || 0,
  };
  const uploadTrend = Array.isArray(analytics?.uploadTrend)
    ? analytics.uploadTrend
    : [];
  const uploadTrendMax = Math.max(...uploadTrend.map((day) => Number(day.count) || 0), 1);
  const weeklyUploadCount = uploadTrend.reduce(
    (total, day) => total + (Number(day.count) || 0),
    0
  );
  const weeklyUploadSize = uploadTrend.reduce(
    (total, day) => total + (Number(day.size) || 0),
    0
  );
  const largestCategory = analyticsCategories.reduce(
    (largest, category) => (category.size > largest.size ? category : largest),
    analyticsCategories[0]
  );
  const storageStatus =
    analyticsPercent >= 90
      ? 'Critical'
      : analyticsPercent >= 75
        ? 'Needs attention'
        : 'Healthy';

  // ── CURRENT VIEW SELECTION ──
  const displayFiles = useMemo(() => {
    if (activeTab === 'my-drive' || activeTab?.startsWith('folder-')) {
      return files;
    }

    if (activeTab?.startsWith('filter-')) {
      const filterName = activeTab.replace('filter-', '').toLowerCase();
      const activeFilter = QUICK_FILTERS.find(q => q.name.toLowerCase() === filterName);
      if (activeFilter) {
        return allFiles.filter(activeFilter.filter);
      }
    }

    if (activeTab === 'recent') {
      return [...allFiles].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    if (activeTab === 'starred') {
      return allFiles.filter(f => f.starred || f.isStarred);
    }

    if (activeTab === 'shared') {
      return sharedWithMe.map(share => ({
        ...share.file,
        _sharedBy: share.sharedBy,
        _permission: share.permission,
        _shareId: share.id,
      }));
    }

    if (activeTab === 'trash') {
      return trashFiles;
    }

    if (activeTab === 'archive') {
      return allFiles.filter(f => f.archived || f.isArchived);
    }

    return files;
  }, [activeTab, files, allFiles, sharedWithMe, trashFiles]);

  const { pageTitle, pageSubtitle } = useMemo(() => {
    if (selectedFolder) {
      return {
        pageTitle: selectedFolder.name,
        pageSubtitle: `Files inside "${selectedFolder.name}"`,
      };
    }
    if (activeTab === 'my-drive') return { pageTitle: 'My Drive', pageSubtitle: 'Files not in any folder' };
    if (activeTab?.startsWith('filter-')) {
      const filterName = activeTab.replace('filter-', '');
      const title = filterName.charAt(0).toUpperCase() + filterName.slice(1);
      return { pageTitle: title, pageSubtitle: `All ${title.toLowerCase()} files` };
    }
    if (activeTab === 'recent') return { pageTitle: 'Recent', pageSubtitle: 'Recently accessed and uploaded files' };
    if (activeTab === 'starred') return { pageTitle: 'Starred', pageSubtitle: 'Files you have starred' };
    if (activeTab === 'shared') return { pageTitle: 'Shared', pageSubtitle: 'Files shared with you' };
    if (activeTab === 'trash') return { pageTitle: 'Trash', pageSubtitle: 'Files you\'ve deleted — restore or permanently remove them' };
    if (activeTab === 'archive') return { pageTitle: 'Archive', pageSubtitle: 'Archived files' };
    if (activeTab === 'notifications') return { pageTitle: 'Notifications', pageSubtitle: 'Latest system and file activities' };
    if (activeTab === 'analytics') return { pageTitle: 'Storage Analytics', pageSubtitle: 'Visualize and inspect your workspace storage' };
    return { pageTitle: 'My Drive', pageSubtitle: 'Files not in any folder' };
  }, [activeTab, selectedFolder]);

  const emptyState = useMemo(() => {
    if (searchQuery) return { title: 'No files match your search', desc: 'Try a different keyword', showUpload: false };
    if (selectedFolder) return { title: 'This folder is empty', desc: 'Upload a file to add it to this folder', showUpload: true };
    if (activeTab === 'my-drive') return { title: 'No files in My Drive yet', desc: 'Upload your first file to get started with DataStock', showUpload: true };
    if (activeTab?.startsWith('filter-')) {
      const filterName = activeTab.replace('filter-', '');
      const title = filterName.charAt(0).toUpperCase() + filterName.slice(1);
      return { title: `No ${title} found`, desc: `You haven't uploaded any ${title.toLowerCase()} files yet`, showUpload: true };
    }
    if (activeTab === 'recent') return { title: 'No recent files', desc: 'Your recently uploaded files will appear here', showUpload: false };
    if (activeTab === 'starred') return { title: 'No starred files', desc: 'Star files to easily find them later', showUpload: false };
    if (activeTab === 'shared') return { title: 'No shared files', desc: 'Files shared with you by others will appear here', showUpload: false };
    if (activeTab === 'trash') return { title: 'Trash is empty', desc: 'Deleted files will appear here', showUpload: false };
    if (activeTab === 'archive') return { title: 'Archive is empty', desc: 'Archived files will appear here', showUpload: false };
    if (activeTab === 'notifications') return { title: 'All caught up!', desc: 'No new notifications to display', showUpload: false };
    return { title: 'No files found', desc: 'Get started by uploading a file', showUpload: true };
  }, [activeTab, searchQuery, selectedFolder]);

  const filteredFiles = useMemo(() =>
    displayFiles.filter(f => f.originalName?.toLowerCase().includes(searchQuery.toLowerCase())),
    [displayFiles, searchQuery]
  );

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const validationError = validateUploadFile(file);
    if (validationError) {
      addToast(validationError, 'error');
      e.target.value = '';
      return;
    }
    try {
      addToast(`Uploading "${file.name}"…`, 'info');
      const formData = new FormData();
      formData.append('file', file);
      if (selectedFolderId) formData.append('folderId', selectedFolderId);
      const resultAction = await dispatch(uploadNewFile(formData));
      if (uploadNewFile.fulfilled.match(resultAction)) {
        loadFiles(selectedFolderId);
        dispatch(fetchProfile());
        addToast(`"${file.name}" uploaded successfully!`, 'success');
      } else {
        addToast(resultAction.payload || 'Upload failed. Please try again.', 'error');
      }
    } catch (error) {
      console.log(error);
      addToast('Upload failed. Please try again.', 'error');
    } finally {
      e.target.value = '';
    }
  };

  const handleToggleStar = async (fileId) => {
    const file = allFiles.find(f => f.id === fileId) || files.find(f => f.id === fileId);
    try {
      const resultAction = await dispatch(toggleStar(fileId));
      if (toggleStar.fulfilled.match(resultAction)) {
        addToast(
          resultAction.payload.starred
            ? `"${file?.originalName}" added to starred`
            : `"${file?.originalName}" removed from starred`,
          'success'
        );
      } else {
        addToast(resultAction.payload || 'Failed to update starred status', 'error');
      }
    } catch (error) {
      console.log(error);
      addToast('Failed to update starred status', 'error');
    }
  };

  const handleDelete = async (fileId) => {
    const file = allFiles.find(f => f.id === fileId) || files.find(f => f.id === fileId);
    try {
      addToast(`Moving "${file?.originalName}" to trash…`, 'info');
      const resultAction = await dispatch(moveFileToTrash(fileId));
      if (moveFileToTrash.fulfilled.match(resultAction)) {
        addToast(`"${file?.originalName}" moved to trash.`, 'success');
        refreshAllFiles();
      } else {
        addToast(resultAction.payload || 'Failed to move to trash.', 'error');
      }
    } catch (error) {
      console.log(error);
      addToast('Failed to move to trash. Please try again.', 'error');
    }
  };

  const handleRestore = async (fileId) => {
    const file = trashFiles.find(f => f.id === fileId);
    try {
      addToast(`Restoring "${file?.originalName}"…`, 'info');
      const resultAction = await dispatch(restoreFileFromTrash(fileId));
      if (restoreFileFromTrash.fulfilled.match(resultAction)) {
        addToast(`"${file?.originalName}" restored successfully!`, 'success');
        refreshAllFiles();
      } else {
        addToast(resultAction.payload || 'Restore failed.', 'error');
      }
    } catch (error) {
      console.log(error);
      addToast('Restore failed. Please try again.', 'error');
    }
  };

  const handleDeleteForever = (fileId) => {
    const file = trashFiles.find(f => f.id === fileId);
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Permanently?',
      message: `Confirm delete karna hai na? Do you really want to permanently delete "${file?.originalName}"? This action cannot be undone.`,
      confirmText: 'Delete Forever',
      type: 'danger',
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, loading: true }));
        try {
          addToast(`Permanently deleting "${file?.originalName}"…`, 'info');
          const resultAction = await dispatch(deleteExistingFile(fileId));
          if (deleteExistingFile.fulfilled.match(resultAction)) {
            addToast(`"${file?.originalName}" permanently deleted.`, 'success');
            dispatch(fetchProfile());
          } else {
            addToast(resultAction.payload || 'Delete failed.', 'error');
          }
        } catch (error) {
          console.log(error);
          addToast('Delete failed. Please try again.', 'error');
        } finally {
          setConfirmConfig(prev => ({ ...prev, isOpen: false, loading: false }));
        }
      }
    });
  };

  const handleEmptyTrash = () => {
    setConfirmConfig({
      isOpen: true,
      title: 'Empty Trash?',
      message: 'Confirm empty trash karna hai na? Do you really want to permanently delete all files in trash? This action cannot be undone.',
      confirmText: 'Empty Trash',
      type: 'danger',
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, loading: true }));
        try {
          addToast('Emptying trash…', 'info');
          const resultAction = await dispatch(emptyAllTrash());
          if (emptyAllTrash.fulfilled.match(resultAction)) {
            addToast('Trash emptied successfully!', 'success');
            dispatch(fetchProfile());
            refreshAllFiles();
          } else {
            addToast(resultAction.payload || 'Failed to empty trash.', 'error');
          }
        } catch (error) {
          console.log(error);
          addToast('Failed to empty trash. Please try again.', 'error');
        } finally {
          setConfirmConfig(prev => ({ ...prev, isOpen: false, loading: false }));
        }
      }
    });
  };

  const isTrashView = activeTab === 'trash';

  return (
    <div className="min-h-screen bg-[#f7f8fa] dark:bg-gray-950 transition-colors duration-200">

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

      {/* Sidebar is fixed/overlay — not in document flow */}
      <Sidebar
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        storageData={{
          used: usedGB,
          total: totalGB,
          usedLabel: usedFormatted,
          totalLabel: totalFormatted,
          plan: user?.subscriptionPlan || 'BASIC',
          categories: [],
        }}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        syncFiles
        files={files}
        allFiles={allFiles}
        onFileUploaded={(file) => {
          dispatch(addUploadedFile(normalizeFile(file)));
          refreshAllFiles();
        }}
        onFilesChanged={refreshAllFiles}
        syncFolders
        folders={folders}
        foldersLoading={foldersLoading}
        onFolderCreated={() => dispatch(fetchFolders())}
        onFolderDeleted={(folderId) => {
          dispatch(fetchFolders());
          refreshAllFiles();
          if (selectedFolderId === folderId) loadFiles(null);
        }}
      />

      <main
        className={`w-full md:w-auto pt-14 md:pt-16 transition-all duration-300 ${
          sidebarCollapsed ? 'md:ml-20' : 'md:ml-72'
        }`}
      >
          <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px]">

            {/* ── TOP BAR ── */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8 min-w-0">
              <div className="min-w-0">
                <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight truncate">
                  {pageTitle}
                </h1>
                <p className="text-gray-400 mt-1 text-sm truncate">
                  {pageSubtitle}
                </p>
                {(selectedFolder || activeTab !== 'my-drive') && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('my-drive')}
                    className="mt-2 text-sm font-medium text-green-600 hover:text-green-700"
                  >
                    ← Back to My Drive
                  </button>
                )}
              </div>

              {activeTab !== 'notifications' && activeTab !== 'analytics' && (
                <div className="flex flex-wrap items-center justify-end gap-3 min-w-0 w-full lg:w-auto">
                  {/* Empty Trash button */}
                  {isTrashView && trashFiles.length > 0 && (
                    <button
                      onClick={handleEmptyTrash}
                      disabled={emptyingTrash}
                      className="px-4 py-2.5 rounded-xl inline-flex items-center gap-2 transition font-semibold text-sm shadow-sm bg-red-600 hover:bg-red-700 text-white hover:shadow-md active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {emptyingTrash
                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Emptying…</>
                        : <><Trash2 className="w-4 h-4" /> Empty Trash</>
                      }
                    </button>
                  )}

                  {/* View toggle */}
                  <div className="flex items-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-1 shadow-sm">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-400 shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                      title="Grid view"
                    >
                      <Grid3X3 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-400 shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                      title="List view"
                    >
                      <List className="w-5 h-5" />
                    </button>
                  </div>

                  {!isTrashView && <UploadButton uploading={uploading} onChange={handleUpload} />}
                </div>
              )}
            </div>

            {/* ── STATS ROW ── */}
            {activeTab !== 'notifications' && activeTab !== 'analytics' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">

                {/* Storage card */}
                <div className="sm:col-span-2 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Storage Usage</h2>
                      <p className="text-gray-400 text-sm mt-0.5">{usedFormatted} used of {totalFormatted}</p>
                    </div>
                    <div className="w-11 h-11 bg-green-50 rounded-xl flex items-center justify-center">
                      <HardDrive className="w-5 h-5 text-green-600" />
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
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
                    <span className="text-xs text-gray-400">{totalFormatted}</span>
                  </div>
                </div>

                {/* File count card */}
                <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Total Files</h2>
                    <div className="w-11 h-11 bg-sky-50 rounded-xl flex items-center justify-center">
                      <Folder className="w-5 h-5 text-sky-500" />
                    </div>
                  </div>
                  <div>
                    <p className="text-4xl font-extrabold text-gray-900 dark:text-gray-100 mt-4 tabular-nums">{totalFileCount}</p>
                    <p className="text-sm text-gray-400 mt-1">files stored (all folders)</p>
                  </div>
                </div>
              </div>
            )}

            {/* ── SECTION HEADER ── */}
            {activeTab !== 'notifications' && activeTab !== 'analytics' && (activeTab === 'trash' ? !trashLoading : activeTab === 'shared' ? !sharedLoading : !loading) && filteredFiles.length > 0 && (
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                  {searchQuery
                    ? `Results for "${searchQuery}"`
                    : pageTitle}{' '}
                  — {filteredFiles.length}
                </h3>
              </div>
            )}

            {/* ── LOADING ── */}
            {activeTab !== 'notifications' && activeTab !== 'analytics' && (activeTab === 'trash' ? trashLoading : activeTab === 'shared' ? sharedLoading : loading) && (
              <div className="flex flex-col items-center justify-center py-32 gap-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-green-500" />
                  </div>
                </div>
                <p className="text-sm text-gray-400 font-medium">
                  {activeTab === 'trash' ? 'Loading trash…' : activeTab === 'shared' ? 'Loading shared files…' : 'Loading your files…'}
                </p>
              </div>
            )}

            {/* ── EMPTY STATE ── */}
            {activeTab !== 'notifications' && activeTab !== 'analytics' && (activeTab === 'trash' ? !trashLoading : activeTab === 'shared' ? !sharedLoading : !loading) && filteredFiles.length === 0 && (
              <div className="bg-white dark:bg-gray-900 border border-dashed border-gray-200 dark:border-gray-700 rounded-3xl px-6 py-10 sm:px-10 sm:py-12 text-center max-w-2xl mx-auto">
                <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-gray-100 dark:border-gray-700">
                  {isTrashView ? <Trash2 className="w-10 h-10 text-gray-300 dark:text-gray-600" /> : <Folder className="w-10 h-10 text-gray-300 dark:text-gray-600" />}
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  {emptyState.title}
                </h2>
                <p className="text-gray-400 mb-6 text-sm">
                  {emptyState.desc}
                </p>
                {emptyState.showUpload && (
                  <label className="cursor-pointer inline-flex">
                    <input type="file" className="hidden" accept={ALLOWED_UPLOAD_ACCEPT} onChange={handleUpload} />
                    <div className="px-5 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl flex items-center gap-2 transition font-semibold text-sm shadow-sm">
                      <Plus className="w-4 h-4" />
                      Upload a file
                    </div>
                  </label>
                )}
              </div>
            )}

            {/* ── GRID VIEW ── */}
            {activeTab !== 'notifications' && activeTab !== 'analytics' && (activeTab === 'trash' ? !trashLoading : activeTab === 'shared' ? !sharedLoading : !loading) && filteredFiles.length > 0 && viewMode === 'grid' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 stagger">
                {filteredFiles.map(file => (
                  <FileCard
                    key={file.id}
                    file={file}
                    onDelete={isTrashView ? handleDeleteForever : handleDelete}
                    onPreview={handlePreview}
                    onToggleStar={handleToggleStar}
                    onShare={handleShare}
                    deletingId={deletingId}
                    starringId={starringId}
                    isTrashView={isTrashView}
                    onRestore={handleRestore}
                    restoringId={restoringId}
                  />
                ))}
              </div>
            )}

            {/* ── LIST VIEW ── */}
            {activeTab !== 'notifications' && activeTab !== 'analytics' && (activeTab === 'trash' ? !trashLoading : activeTab === 'shared' ? !sharedLoading : !loading) && filteredFiles.length > 0 && viewMode === 'list' && (
              <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 border-b border-gray-50 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-800/50">
                  <div className="col-span-6 text-xs font-bold text-gray-400 uppercase tracking-widest">Name</div>
                  <div className="col-span-2 text-xs font-bold text-gray-400 uppercase tracking-widest">Size</div>
                  <div className="col-span-3 text-xs font-bold text-gray-400 uppercase tracking-widest">Date</div>
                  <div className="col-span-1" />
                </div>
                {filteredFiles.map(file => (
                  <FileRow
                    key={file.id}
                    file={file}
                    onDelete={isTrashView ? handleDeleteForever : handleDelete}
                    onPreview={handlePreview}
                    onToggleStar={handleToggleStar}
                    onShare={handleShare}
                    deletingId={deletingId}
                    starringId={starringId}
                    isTrashView={isTrashView}
                    onRestore={handleRestore}
                    restoringId={restoringId}
                  />
                ))}
              </div>
            )}

            {/* ── NOTIFICATIONS VIEW ── */}
            {activeTab === 'notifications' && (
              <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 shadow-sm max-w-4xl mx-auto animate-fade-up">
                <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800 mb-6">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <Bell className="w-5 h-5 text-green-600" />
                    All Notifications
                  </h2>
                  {notifications.some(n => !n.isRead) && (
                    <button
                      onClick={async () => {
                        try {
                          await dispatch(readAllNotifications());
                          addToast("All notifications marked as read", "success");
                        } catch (err) {
                          addToast("Failed to mark all read", "error");
                        }
                      }}
                      className="text-xs font-semibold text-green-600 hover:text-green-700 bg-green-50 dark:bg-green-950/40 hover:bg-green-100 dark:hover:bg-green-950/60 px-3 py-1.5 rounded-xl transition"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                {notificationsLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-green-500" />
                    <p className="text-sm text-gray-400">Loading notifications…</p>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="text-center py-20">
                    <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Bell className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                    </div>
                    <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-1">No notifications</h3>
                    <p className="text-xs text-gray-400">We'll let you know when something happens!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 ${
                          !notif.isRead
                            ? 'bg-green-50/20 dark:bg-green-950/20 border-green-100 dark:border-green-900/50 shadow-sm'
                            : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/50'
                        }`}
                      >
                        <div className="flex items-start gap-4 min-w-0">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            !notif.isRead ? 'bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                          }`}>
                            <Bell className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <p className={`text-sm ${!notif.isRead ? 'font-semibold text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-400'}`}>
                              {notif.message}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(notif.createdAt).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>

                        {!notif.isRead && (
                          <button
                            onClick={async () => {
                              try {
                                await dispatch(readNotification(notif.id));
                                addToast("Notification marked as read", "success");
                              } catch (err) {
                                addToast("Failed to update notification", "error");
                              }
                            }}
                            className="p-2 hover:bg-green-50 text-gray-400 hover:text-green-600 rounded-xl transition shrink-0"
                            title="Mark as read"
                          >
                            <Check className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── STORAGE ANALYTICS VIEW ── */}
            {activeTab === 'analytics' && (
              <StorageAnalyticsView
                analytics={analytics}
                analyticsLoading={analyticsLoading}
                analyticsCategories={analyticsCategories}
                analyticsUsed={analyticsUsed}
                analyticsLimit={analyticsLimit}
                analyticsPercent={analyticsPercent}
                analyticsRemaining={analyticsRemaining}
                analyticsActiveSize={analyticsActiveSize}
                analyticsFileCount={analyticsFileCount}
                analyticsTrash={analyticsTrash}
                uploadTrend={uploadTrend}
                uploadTrendMax={uploadTrendMax}
                weeklyUploadCount={weeklyUploadCount}
                weeklyUploadSize={weeklyUploadSize}
                largestCategory={largestCategory}
                storageStatus={storageStatus}
                onEmptyTrash={handleEmptyTrash}
                onUpgrade={() => navigate('/pricing')}
                storageActivity={storageActivity}
                activityLoading={activityLoading}
              />
            )}


          </div>
      </main>

      {/* PREVIEW MODAL */}
      <FilePreviewModal
        file={previewFile}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
      />

      {/* SHARE MODAL */}
      <ShareModal
        file={shareModalFile}
        isOpen={isShareOpen}
        onClose={() => { setIsShareOpen(false); setShareModalFile(null); }}
        onToast={addToast}
      />

      {/* TOAST CONTAINER */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* CONFIRM MODAL */}
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        type={confirmConfig.type}
        loading={confirmConfig.loading}
      />
    </div>
  );
};

export default Dashboard;
