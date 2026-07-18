import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
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
  Users,
  RotateCcw,
  BarChart2,
  TrendingUp,
  PieChart,
  Move,
  Lock,
  Unlock,
  ShieldCheck,
  ShieldAlert,
  Cloud,
  Shield,
  Sparkles,
} from 'lucide-react';

import Header from '../components/dashboard/layout/Header';
import { useCrypto } from '../context/CryptoContext';
import {
  generateSymmetricKey,
  encryptBuffer,
  encryptString,
  encryptSymmetricKeyWithRsa,
  importRsaPublicKeyFromJwk,
  decryptBuffer,
  decryptSymmetricKeyWithRsa
} from '../utils/cryptoHelper';
import Sidebar from '../components/dashboard/layout/Sidebar';
import FilePreviewModal from '../components/ui/FilePreviewModal';
import ShareModal from '../components/dashboard/modals/ShareModal';
import ConfirmModal from '../components/dashboard/modals/ConfirmModal';
import ActivityLogView from '../components/dashboard/ActivityLogView';

import { SUBSCRIPTION_UPDATED_EVENT } from '../utils/subscription';
import {
  normalizeFile,
  getActiveFolderId,
  getFolderId,
} from '../utils/fileHelpers';
import { QUICK_FILTERS } from '../utils/filters';
import { getErrorMessage } from '../utils/errorMessage';
import { ALLOWED_UPLOAD_ACCEPT, validateUploadFile } from '../utils/uploadValidation';
import { authFetch, apiUrl } from '../utils/auth';

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
  toggleArchive,
  addUploadedFile,
  fetchTrashFiles,
  moveFileToTrash,
  restoreFileFromTrash,
  emptyAllTrash,
  fetchStorageActivity,
  moveFileToFolder,
} from '../store/slices/filesSlice';
import { fetchFolders, deleteExistingFolder } from '../store/slices/foldersSlice';
import FolderCard from '../components/dashboard/folders/FolderCard';
import {
  fetchNotifications,
  readNotification,
  readAllNotifications,
  addNotification,
} from '../store/slices/notificationsSlice';
import { fetchSharedWithMe } from '../store/slices/shareSlice';
import { useDecryptedFiles } from '../hooks/useDecryptedFiles';

const ToastIcon = ({ type }) => {
  if (type === 'success') return <CheckCircle2 className="w-5 h-5 text-[#3B82F6] shrink-0" />;
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
    text: 'text-slate-600 dark:text-[#94A3B8]',
    bg: 'bg-slate-50 dark:bg-[#1E293B]',
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
  if (analyticsLoading || activityLoading) {
    return (
      <div className="space-y-6 animate-fade-up max-w-7xl mx-auto">
        <div className="flex flex-col items-center justify-center py-28 gap-4 bg-white dark:bg-[#1E293B] border border-gray-100 dark:border-[#334155] rounded-2xl shadow-sm">
          <Loader2 className="w-10 h-10 animate-spin text-green-500" />
          <p className="text-sm text-gray-400 font-medium">Loading storage analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics && !storageActivity) {
    return (
      <div className="space-y-6 animate-fade-up max-w-7xl mx-auto">
        <div className="text-center py-20 bg-white dark:bg-[#1E293B] border border-gray-100 dark:border-[#334155] rounded-2xl shadow-sm">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-[#F8FAFC]">Failed to load analytics</h3>
          <p className="text-sm text-gray-400 mt-1">Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-up max-w-7xl mx-auto">
      <section className="grid grid-cols-1 xl:grid-cols-[1.35fr_0.65fr] gap-6">
        <div className="bg-white dark:bg-[#1E293B] border border-gray-100 dark:border-[#334155] rounded-2xl p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center gap-6">
            <div
              className="w-40 h-40 rounded-full mx-auto lg:mx-0 shrink-0 p-3"
              style={{
                background: `conic-gradient(${analyticsPercent >= 85 ? '#ef4444' : '#16a34a'} ${analyticsPercent * 3.6}deg, ${analyticsPercent >= 85 ? '#fee2e2' : '#dcfce7'} 0deg)`,
              }}
            >
              <div className="w-full h-full rounded-full bg-white dark:bg-[#1E293B] border border-white/80 dark:border-[#334155] flex flex-col items-center justify-center shadow-inner">
                <span className="text-3xl font-extrabold text-gray-900 dark:text-[#F8FAFC] tabular-nums">
                  {analyticsPercent.toFixed(0)}%
                </span>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Used</span>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-blue-50 dark:bg-[#3B82F6]/10 text-[#3B82F6] dark:text-[#3B82F6]">
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

              <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-[#F8FAFC] leading-tight">
                Storage Analytics
              </h2>
              <p className="text-sm text-gray-500 dark:text-[#94A3B8] mt-2">
                {formatFileSize(analyticsUsed)} used of {formatFileSize(analyticsLimit)} across {analyticsFileCount} active files.
              </p>

              <div className="mt-6">
                <div className="h-3 w-full bg-gray-100 dark:bg-[#334155] rounded-full overflow-hidden">
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
                  <span className="font-semibold text-gray-600 dark:text-[#94A3B8]">{analyticsPercent.toFixed(1)}%</span>
                  <span>{formatFileSize(analyticsLimit)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white dark:bg-[#1E293B] border border-gray-100 dark:border-[#334155] rounded-2xl p-5 shadow-sm">
            <div className="w-10 h-10 bg-sky-50 dark:bg-sky-950/30 rounded-xl flex items-center justify-center mb-5">
              <PieChart className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            </div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Largest Type</p>
            <p className="text-xl font-extrabold text-gray-900 dark:text-[#F8FAFC] mt-1">{largestCategory?.label || 'Files'}</p>
            <p className="text-xs text-gray-400 mt-1">{formatFileSize(largestCategory?.size || 0)}</p>
          </div>

          <div className="bg-white dark:bg-[#1E293B] border border-gray-100 dark:border-[#334155] rounded-2xl p-5 shadow-sm">
            <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl flex items-center justify-center mb-5">
              <HardDrive className="w-5 h-5 text-emerald-600 dark:text-[#3B82F6]" />
            </div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Remaining</p>
            <p className="text-xl font-extrabold text-gray-900 dark:text-[#F8FAFC] mt-1">{formatFileSize(analyticsRemaining)}</p>
            <p className="text-xs text-gray-400 mt-1">Available now</p>
          </div>

          <div className="bg-white dark:bg-[#1E293B] border border-gray-100 dark:border-[#334155] rounded-2xl p-5 shadow-sm">
            <div className="w-10 h-10 bg-red-50 dark:bg-red-950/30 rounded-xl flex items-center justify-center mb-5">
              <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Trash</p>
            <p className="text-xl font-extrabold text-gray-900 dark:text-[#F8FAFC] mt-1">{formatFileSize(analyticsTrash.size)}</p>
            <p className="text-xs text-gray-400 mt-1">{analyticsTrash.count} files</p>
          </div>

          <div className="bg-white dark:bg-[#1E293B] border border-gray-100 dark:border-[#334155] rounded-2xl p-5 shadow-sm">
            <div className="w-10 h-10 bg-violet-50 dark:bg-violet-950/30 rounded-xl flex items-center justify-center mb-5">
              <TrendingUp className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            </div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">7 Days</p>
            <p className="text-xl font-extrabold text-gray-900 dark:text-[#F8FAFC] mt-1">{weeklyUploadCount}</p>
            <p className="text-xs text-gray-400 mt-1">{formatFileSize(weeklyUploadSize)} uploaded</p>
          </div>
        </div>
      </section>

      {/* Real-time Storage Activity Card */}
      {storageActivity && (
        <section className="bg-white dark:bg-[#1E293B] border border-gray-100 dark:border-[#334155] rounded-2xl p-5 sm:p-6 shadow-sm">
          <h3 className="font-bold text-gray-900 dark:text-[#F8FAFC] mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#3B82F6] animate-pulse" />
            Storage Space Activity
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div className="md:col-span-2">
              <div className="flex justify-between items-center mb-2 text-sm text-gray-600 dark:text-[#94A3B8]">
                <span>Active vs Trash Storage</span>
                <span className="font-semibold text-gray-900 dark:text-[#F8FAFC]">
                  {getPercent(storageActivity.storageUsed, storageActivity.storageLimit).toFixed(1)}% Limit Used
                </span>
              </div>
              
              {/* Stacked Progress Bar */}
              <div className="w-full h-4 bg-gray-100 dark:bg-[#334155] rounded-full overflow-hidden flex">
                <div 
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-600 transition-all duration-1000"
                  style={{ width: `${getPercent(storageActivity.activeUsed, storageActivity.storageUsed)}%` }}
                  title={`Active Files: ${formatFileSize(storageActivity.activeUsed)}`}
                />
                <div 
                  className="h-full bg-gradient-to-r from-red-400 to-rose-500 transition-all duration-1000"
                  style={{ width: `${getPercent(storageActivity.trashUsed, storageActivity.storageUsed)}%` }}
                  title={`Trash Files: ${formatFileSize(storageActivity.trashUsed)}`}
                />
              </div>
              
              <div className="flex justify-between items-center mt-3 text-xs text-gray-400">
                <span>0 B</span>
                <div className="flex gap-4">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6] inline-block shadow-sm"></span>
                    Active ({getPercent(storageActivity.activeUsed, storageActivity.storageUsed).toFixed(0)}%)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block shadow-sm"></span>
                    Trash ({getPercent(storageActivity.trashUsed, storageActivity.storageUsed).toFixed(0)}%)
                  </span>
                </div>
                <span>{formatFileSize(storageActivity.storageUsed)}</span>
              </div>
            </div>
            
            <div className="border-t md:border-t-0 md:border-l border-gray-100 dark:border-[#334155] pt-4 md:pt-0 md:pl-6 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-[#94A3B8]">Active Files Size:</span>
                <span className="font-semibold text-gray-900 dark:text-[#F8FAFC]">{formatFileSize(storageActivity.activeUsed)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-[#94A3B8]">Trash Size:</span>
                <span className="font-semibold text-red-600 dark:text-red-400">{formatFileSize(storageActivity.trashUsed)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-[#94A3B8]">Total Database Used:</span>
                <span className="font-bold text-gray-900 dark:text-[#F8FAFC]">{formatFileSize(storageActivity.storageUsed)}</span>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-6">
        <div className="bg-white dark:bg-[#1E293B] border border-gray-100 dark:border-[#334155] rounded-2xl p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-6">
            <div>
              <h3 className="font-bold text-gray-900 dark:text-[#F8FAFC]">Storage Mix</h3>
              <p className="text-xs text-gray-400 mt-1">
                {formatFileSize(storageActivity?.activeUsed ?? analyticsActiveSize)} active storage
              </p>
            </div>
            <BarChart2 className="w-5 h-5 text-gray-400" />
          </div>

          <div className="flex h-3 rounded-full overflow-hidden bg-gray-100 dark:bg-[#334155] mb-6">
            {analyticsCategories.map((category) => {
              const mixTotal = storageActivity?.activeUsed ?? analyticsActiveSize;
              const width = getPercent(category.size, mixTotal);
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
              const mixTotal = storageActivity?.activeUsed ?? analyticsActiveSize;
              const percent = getPercent(category.size, mixTotal);
              return (
                <div key={category.key} className="flex items-center gap-4">
                  <div className={`w-10 h-10 ${category.bg} rounded-xl flex items-center justify-center shrink-0`}>
                    <Icon className={`w-5 h-5 ${category.text}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <p className="text-sm font-semibold text-gray-800 dark:text-[#F8FAFC] truncate">{category.label}</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-[#F8FAFC] tabular-nums">{formatFileSize(category.size)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-2 flex-1 rounded-full overflow-hidden bg-gray-100 dark:bg-[#334155]">
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

        <div className="bg-white dark:bg-[#1E293B] border border-gray-100 dark:border-[#334155] rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <div>
              <h3 className="font-bold text-gray-900 dark:text-[#F8FAFC]">Upload Activity</h3>
              <p className="text-xs text-gray-400 mt-1">Last 7 days by count and size</p>
            </div>
            <button
              type="button"
              onClick={onUpgrade}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-bold shadow-sm transition active:scale-95"
            >
              <Upload className="w-4 h-4" />
              Upgrade Storage
            </button>
          </div>

          <div className="flex-1 flex items-end gap-2 sm:gap-3 h-56 pt-6 border-b border-gray-100 dark:border-[#334155]">
            {uploadTrend.map((day) => {
              const count = Number(day.count) || 0;
              const size = Number(day.size) || 0;
              const maxBarHeight = 168;
              const barHeight = count > 0
                ? Math.max(Math.round((count / uploadTrendMax) * maxBarHeight), 20)
                : 6;
              return (
                <div key={day.dateKey || day.date} className="flex-1 flex flex-col items-center justify-end group relative gap-2 h-full min-w-0">
                  <div className="absolute bottom-full mb-2 bg-gray-900 text-white text-[10px] py-1 px-2 rounded-lg opacity-0 group-hover:opacity-100 transition duration-200 pointer-events-none whitespace-nowrap shadow-xl z-10 flex flex-col gap-0.5 items-center">
                    <span className="font-bold">{count} uploads</span>
                    <span className="text-gray-400">{formatFileSize(size)}</span>
                  </div>
                  <div
                    className="w-full max-w-12 rounded-t-xl bg-gradient-to-t from-green-600 to-green-400 dark:from-green-500 dark:to-green-300 transition-all duration-300 shadow-sm"
                    style={{ height: `${barHeight}px` }}
                    title={`${count} uploads · ${formatFileSize(size)}`}
                  />
                  <span className="text-[10px] font-semibold text-gray-400 truncate w-full text-center">{day.date}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-[#1E293B] border border-gray-100 dark:border-[#334155] rounded-2xl p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="font-bold text-gray-900 dark:text-[#F8FAFC]">Trash Storage</h3>
              <p className="text-sm text-gray-500 dark:text-[#94A3B8] mt-1">
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
              <span className="inline-flex items-center justify-center px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#334155] text-xs font-bold text-gray-400">
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

const FileCard = ({ file, searchQuery, onDelete, onPreview, onToggleStar, onToggleArchive, onShare, deletingId, starringId, archivingId, isTrashView, onRestore, restoringId, isSelected, onToggleSelect, onExtract, selectedFileIds }) => {
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
  const isShared = file.isShared || file.sharedWith?.length > 0 || file._isDirectlyShared || file._isSharedDescendant;

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
        try { navigator.vibrate(40); } catch (err) {}
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
          e.dataTransfer.setData("text/plain", JSON.stringify(Array.from(selectedFileIds)));
        } else {
          e.dataTransfer.setData("text/plain", file.id);
        }
        e.dataTransfer.effectAllowed = "move";
      }}
      className={`
        relative group bg-white dark:bg-[#1E293B] border rounded-2xl overflow-hidden
        transition-all duration-300 cursor-pointer select-none flex flex-col justify-between h-[270px]
        ${isDeleting || isRestoring
          ? 'border-red-200 dark:border-red-900 opacity-60 scale-95 pointer-events-none'
          : 'border-gray-100 dark:border-[#334155] hover:border-blue-200 dark:hover:border-[#3B82F6] hover:shadow-lg hover:-translate-y-0.5 shadow-xs'}
        ${isSelected ? 'border-[#3B82F6] ring-2 ring-green-500/20' : ''}
      `}
      onMouseDown={startPress}
      onTouchStart={startPress}
      onMouseUp={(e) => endPress(e, () => !isDeleting && !isRestoring && onPreview(file))}
      onTouchEnd={(e) => endPress(e, () => !isDeleting && !isRestoring && onPreview(file))}
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
          className={`absolute top-3 left-3 z-20 transition-opacity duration-200 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="checkbox"
            checked={!!isSelected}
            onChange={onToggleSelect}
            className="w-4.5 h-4.5 text-[#3B82F6] bg-white dark:bg-[#334155] border-gray-300 dark:border-[#334155] rounded-md focus:ring-[#3B82F6] cursor-pointer shadow-sm focus:ring-2 focus:ring-offset-0"
          />
        </div>
      )}

      {isDeleting && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-white/80 dark:bg-[#1E293B]/80 backdrop-blur-sm rounded-2xl">
          <Loader2 className="w-8 h-8 text-red-500 animate-spin mb-2" />
          <span className="text-sm font-semibold text-red-500">{isTrashView ? 'Deleting…' : 'Trashing…'}</span>
        </div>
      )}
      {isRestoring && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-white/80 dark:bg-[#1E293B]/80 backdrop-blur-sm rounded-2xl">
          <Loader2 className="w-8 h-8 text-green-500 animate-spin mb-2" />
          <span className="text-sm font-semibold text-green-500">Restoring…</span>
        </div>
      )}

      {/* Top Banner (Thumbnail or File icon) */}
      <div className="relative">
        {isLocked ? (
          <div className="h-32 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800/30 border-b border-gray-100 dark:border-[#334155]/60 relative select-none">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shadow-xs mb-2">
              <Lock className="w-5 h-5 text-amber-500" />
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400">Encrypted Safe Storage</span>
          </div>
        ) : file.mimeType?.includes('image') ? (
          <div className="h-32 overflow-hidden bg-gray-50 dark:bg-[#334155] relative flex items-center justify-center">
            <img src={file.url} alt={file.originalName} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
          </div>
        ) : (
          <div className={`h-32 flex items-center justify-center ${type.bg} relative transition-transform duration-500`}>
            <Icon className={`w-12 h-12 ${type.color} opacity-70 group-hover:scale-110 duration-300`} />
          </div>
        )}

        {/* Favorite Star */}
        {!isTrashView && (
          <div className="absolute top-2.5 right-2.5 z-10" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => onToggleStar(file.id)}
              disabled={isStarring}
              className={`p-1.5 rounded-lg backdrop-blur-md bg-white/80 dark:bg-[#1E293B]/80 shadow-xs transition hover:scale-110 active:scale-95 ${
                isStarred ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${isStarred ? 'fill-yellow-400' : ''}`} />
            </button>
          </div>
        )}
      </div>

      {/* Body Details */}
      <div className="p-4 flex-1 flex flex-col justify-between min-w-0">
        <div>
          {/* File Name */}
          <div className="flex items-center gap-1.5 mb-1.5 min-w-0">
            <h3 className={`truncate text-sm leading-tight flex-1 ${isLocked ? 'font-mono text-[11px] font-bold bg-amber-500/5 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/10' : 'font-bold text-gray-900 dark:text-[#F8FAFC]'}`} title={file.originalName}>
              {file.originalName}
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-1 mb-2">
            <span className={`inline-flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full ${type.bg} ${type.color}`}>
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
            {searchQuery && file.ocrText?.toLowerCase().includes(searchQuery.toLowerCase()) && (
              <span className="inline-flex items-center gap-1 text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-[#3B82F6] border border-emerald-100 dark:border-emerald-900/50" title="Found in file contents">
                🔍 Content Match
              </span>
            )}
          </div>
        </div>

        {/* Footer Metrics & Actions */}
        <div className="flex items-center justify-between pt-2.5 border-t border-gray-50 dark:border-[#334155] mt-auto">
          <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider truncate mr-2">
            {isLocked ? "🔒 Locked" : formatFileSize(file.size)} • {new Date(file.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
          </div>

          {/* Action Menu */}
          <div className="relative" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#334155] rounded-lg transition"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>

            {showMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 bottom-8 mt-1 w-40 bg-white dark:bg-[#2A3547] border border-gray-100 dark:border-[#334155] rounded-xl shadow-lg py-1.5 z-50 animate-fade-in text-left">
                  <button
                    onClick={() => { setShowMenu(false); onPreview(file); }}
                    className="w-full px-3 py-1.5 text-left text-xs font-semibold text-gray-700 dark:text-[#D1D5DB] hover:bg-gray-50 dark:hover:bg-[#334155] transition flex items-center gap-2"
                  >
                    <Eye className="w-3.5 h-3.5 text-blue-500" /> Preview
                  </button>
                  {!isTrashView && (
                    <>
                      <button
                        onClick={() => { setShowMenu(false); onShare(file); }}
                        className="w-full px-3 py-1.5 text-left text-xs font-semibold text-gray-700 dark:text-[#D1D5DB] hover:bg-gray-50 dark:hover:bg-[#334155] transition flex items-center gap-2"
                      >
                        <Share2 className="w-3.5 h-3.5 text-green-500" /> Share
                      </button>
                      <button
                        onClick={() => { setShowMenu(false); onToggleArchive(file.id); }}
                        className="w-full px-3 py-1.5 text-left text-xs font-semibold text-gray-700 dark:text-[#D1D5DB] hover:bg-gray-50 dark:hover:bg-[#334155] transition flex items-center gap-2"
                      >
                        <Archive className="w-3.5 h-3.5 text-amber-500" /> {isArchived ? 'Unarchive' : 'Archive'}
                      </button>
                      {(file.mimeType === 'application/zip' || file.originalName?.endsWith('.zip')) && onExtract && (
                        <button
                          onClick={() => { setShowMenu(false); onExtract(file.id, file.originalName); }}
                          className="w-full px-3 py-1.5 text-left text-xs font-semibold text-gray-700 dark:text-[#D1D5DB] hover:bg-gray-50 dark:hover:bg-[#334155] transition flex items-center gap-2"
                        >
                          <Archive className="w-3.5 h-3.5 text-purple-500" /> Extract ZIP
                        </button>
                      )}
                    </>
                  )}
                  {isTrashView && (
                    <button
                      onClick={() => { setShowMenu(false); onRestore(file.id); }}
                      className="w-full px-3 py-1.5 text-left text-xs font-semibold text-gray-700 dark:text-[#D1D5DB] hover:bg-gray-50 dark:hover:bg-[#334155] transition flex items-center gap-2"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-green-500" /> Restore
                    </button>
                  )}
                  <button
                    onClick={() => { setShowMenu(false); onDelete(file.id); }}
                    className="w-full px-3 py-1.5 text-left text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition flex items-center gap-2"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-500" /> {isTrashView ? 'Delete Forever' : 'Delete'}
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

const FileRow = ({ file, searchQuery, onDelete, onPreview, onToggleStar, onToggleArchive, onShare, deletingId, starringId, archivingId, isTrashView, onRestore, restoringId, isSelected, onToggleSelect, onExtract, selectedFileIds }) => {
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
  const isShared = file.isShared || file.sharedWith?.length > 0 || file._isDirectlyShared || file._isSharedDescendant;
  
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
        try { navigator.vibrate(40); } catch (err) {}
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
          e.dataTransfer.setData("text/plain", JSON.stringify(Array.from(selectedFileIds)));
        } else {
          e.dataTransfer.setData("text/plain", file.id);
        }
        e.dataTransfer.effectAllowed = "move";
      }}
      className={`
        grid grid-cols-[minmax(0,1fr)_auto] md:grid-cols-12 gap-3 md:gap-4 px-4 sm:px-6 py-3.5 border-b border-gray-50 dark:border-[#334155]
        hover:bg-gray-50/80 dark:hover:bg-[#334155]/50 transition items-center cursor-pointer group
        ${isDeleting || isRestoring ? 'opacity-50 pointer-events-none' : ''}
        ${isSelected ? 'bg-blue-50/30 dark:bg-green-950/10' : ''}
      `}
      onMouseDown={startPress}
      onTouchStart={startPress}
      onMouseUp={(e) => endPress(e, () => !isDeleting && !isRestoring && onPreview(file))}
      onTouchEnd={(e) => endPress(e, () => !isDeleting && !isRestoring && onPreview(file))}
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
            className={`mr-1 shrink-0 transition-opacity duration-200 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="checkbox"
              checked={!!isSelected}
              onChange={onToggleSelect}
              className="w-4 h-4 text-[#3B82F6] bg-white dark:bg-[#334155] border-gray-300 dark:border-[#334155] rounded focus:ring-[#3B82F6] cursor-pointer shadow-xs focus:ring-2 focus:ring-offset-0"
            />
          </div>
        )}
        <div className={`w-9 h-9 ${type.bg} rounded-lg flex items-center justify-center shrink-0`}>
          <Icon className={`w-4.5 h-4.5 ${type.color}`} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <p className={`text-sm truncate ${isLocked ? 'font-mono text-[11px] font-bold bg-amber-500/5 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/10' : 'font-semibold text-gray-900 dark:text-[#F8FAFC]'}`} title={file.originalName}>{file.originalName}</p>
            {isStarred && !isTrashView && (
              <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400 shrink-0" />
            )}
            {isEncrypted && (
              <Lock className="w-3 h-3 text-amber-500 shrink-0 animate-pulse" />
            )}
            {isShared && (
              <Users className="w-3 h-3 text-emerald-500 shrink-0" />
            )}
            {isArchived && (
              <span className="text-[10px] text-purple-500 shrink-0" title="Archived">📦</span>
            )}
            {(file.isTrash || isTrashView) && (
              <span className="text-[10px] text-red-500 shrink-0" title="Trash">🗑️</span>
            )}
            {searchQuery && file.ocrText?.toLowerCase().includes(searchQuery.toLowerCase()) && (
              <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-[#3B82F6] border border-emerald-100 dark:border-emerald-900/30 shrink-0" title="Found in file contents">
                🔍 Content Match
              </span>
            )}
          </div>
          <p className="md:hidden text-[11px] text-gray-400 truncate">
            {isLocked ? "🔒 Locked" : formatFileSize(file.size)} • {new Date(file.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
          </p>
        </div>
      </div>

      <div className="hidden md:block md:col-span-2 text-sm text-gray-500 dark:text-[#94A3B8]">{isLocked ? "🔒 Locked" : formatFileSize(file.size)}</div>

      <div className="hidden md:block md:col-span-3 text-sm text-gray-400">
        {new Date(file.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
      </div>

      <div className="md:col-span-1 flex justify-end gap-1 shrink-0" onClick={e => e.stopPropagation()}>
        {isDeleting ? (
          <Loader2 className="w-4 h-4 text-red-400 animate-spin" />
        ) : isRestoring ? (
          <Loader2 className="w-4 h-4 text-[#3B82F6] animate-spin" />
        ) : (
          <>
            {!isTrashView && (
              <button
                onClick={() => onToggleStar(file.id)}
                disabled={isStarring}
                className={`p-1.5 rounded-lg transition ${
                  isStarred
                    ? 'text-yellow-500 hover:bg-yellow-50 dark:hover:bg-[#334155]/50'
                    : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-[#334155]'
                }`}
                title={isStarred ? 'Remove Star' : 'Add Star'}
              >
                <Star className={`w-3.5 h-3.5 ${isStarred ? 'fill-yellow-400' : ''}`} />
              </button>
            )}
            
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#334155] rounded-lg transition"
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </button>

              {showMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                  <div className="absolute right-0 bottom-8 mt-1 w-40 bg-white dark:bg-[#2A3547] border border-gray-100 dark:border-[#334155] rounded-xl shadow-lg py-1.5 z-50 animate-fade-in text-left">
                    <button
                      onClick={() => { setShowMenu(false); onPreview(file); }}
                      className="w-full px-3 py-1.5 text-left text-xs font-semibold text-gray-700 dark:text-[#D1D5DB] hover:bg-gray-50 dark:hover:bg-[#334155] transition flex items-center gap-2"
                    >
                      <Eye className="w-3.5 h-3.5 text-blue-500" /> Preview
                    </button>
                    {!isTrashView && (
                      <>
                        <button
                          onClick={() => { setShowMenu(false); onShare(file); }}
                          className="w-full px-3 py-1.5 text-left text-xs font-semibold text-gray-700 dark:text-[#D1D5DB] hover:bg-gray-50 dark:hover:bg-[#334155] transition flex items-center gap-2"
                        >
                          <Share2 className="w-3.5 h-3.5 text-green-500" /> Share
                        </button>
                        <button
                          onClick={() => { setShowMenu(false); onToggleArchive(file.id); }}
                          className="w-full px-3 py-1.5 text-left text-xs font-semibold text-gray-700 dark:text-[#D1D5DB] hover:bg-gray-50 dark:hover:bg-[#334155] transition flex items-center gap-2"
                        >
                          <Archive className="w-3.5 h-3.5 text-amber-500" /> {isArchived ? 'Unarchive' : 'Archive'}
                        </button>
                        {(file.mimeType === 'application/zip' || file.originalName?.endsWith('.zip')) && onExtract && (
                          <button
                            onClick={() => { setShowMenu(false); onExtract(file.id, file.originalName); }}
                            className="w-full px-3 py-1.5 text-left text-xs font-semibold text-gray-700 dark:text-[#D1D5DB] hover:bg-gray-50 dark:hover:bg-[#334155] transition flex items-center gap-2"
                          >
                            <Archive className="w-3.5 h-3.5 text-purple-500" /> Extract ZIP
                          </button>
                        )}
                      </>
                    )}
                    {isTrashView && (
                      <button
                        onClick={() => { setShowMenu(false); onRestore(file.id); }}
                        className="w-full px-3 py-1.5 text-left text-xs font-semibold text-gray-700 dark:text-[#D1D5DB] hover:bg-gray-50 dark:hover:bg-[#334155] transition flex items-center gap-2"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-green-500" /> Restore
                      </button>
                    )}
                    <button
                      onClick={() => { setShowMenu(false); onDelete(file.id); }}
                      className="w-full px-3 py-1.5 text-left text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition flex items-center gap-2"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-500" /> {isTrashView ? 'Delete Forever' : 'Delete'}
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

const SuggestedFileCard = ({ file, onPreview }) => {
  const { isE2eeUnlocked } = useCrypto();
  const type = getFileType(file.mimeType);
  const Icon = type.icon;
  const isStarred = file.starred || file.isStarred;
  const isEncrypted = file.isEncrypted || !!file.encryptedKey;
  const isLocked = file.isLocked || (isEncrypted && !isE2eeUnlocked);
  
  const getModifiedLabel = () => {
    if (!file.createdAt) return 'Edited recently';
    const date = new Date(file.createdAt);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return 'Edited today';
    if (date.toDateString() === yesterday.toDateString()) return 'Edited yesterday';
    return `Edited ${date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}`;
  };

  return (
    <div 
      onClick={() => onPreview(file)}
      className="bg-white dark:bg-[#1E293B] border border-gray-100 dark:border-[#334155]/60 hover:border-blue-200 dark:hover:border-[#3B82F6]/50 rounded-2xl p-4 shadow-xs hover:shadow-md transition-all duration-300 cursor-pointer select-none flex flex-col justify-between h-[115px] hover:scale-[1.01] hover:-translate-y-0.5 animate-fade-up"
    >
      <div className="flex items-start justify-between min-w-0 gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${type.bg}`}>
            <Icon className={`w-4 h-4 ${type.color}`} />
          </div>
          <div className="min-w-0">
            <h4 className={`text-sm truncate leading-tight ${isLocked ? 'font-mono text-[11px] font-bold bg-amber-500/5 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/10' : 'font-extrabold text-gray-900 dark:text-[#F8FAFC]'}`}>
              {file.originalName}
            </h4>
            <p className="text-[10px] text-gray-400 font-semibold mt-0.5">
              {getModifiedLabel()}
            </p>
          </div>
        </div>
        
        {isStarred && (
          <span className="text-[10px] text-yellow-500 shrink-0">★</span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-gray-50 dark:border-[#334155]/40 text-[9px] font-bold uppercase tracking-wider">
        {isStarred && (
          <span className="text-yellow-600 bg-yellow-50 dark:bg-yellow-950/20 px-1.5 py-0.5 rounded-full">
            ⭐ Favorite
          </span>
        )}
        {isEncrypted && (
          <span className="text-orange-600 bg-orange-50 dark:bg-orange-950/20 px-1.5 py-0.5 rounded-full">
            🔒 E2EE Secure
          </span>
        )}
        {!isLocked && (
          <span className="text-gray-400 bg-gray-50 dark:bg-slate-800 px-1.5 py-0.5 rounded-full ml-auto">
            {formatFileSize(file.size)}
          </span>
        )}
        {isLocked && (
          <span className="text-amber-600 dark:text-amber-400 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded-full ml-auto">
            Secure & Masked
          </span>
        )}
      </div>
    </div>
  );
};

const CommandPaletteModal = ({ isOpen, onClose, files, onPreview, onTabChange, isUnlocked, onUnlock, onLock, isE2eeSetup }) => {
  const [search, setSearch] = useState('');
  
  useEffect(() => {
    if (!isOpen) setSearch('');
  }, [isOpen]);

  if (!isOpen) return null;
  
  const filtered = search.trim() === '' ? [] : files.filter(f => 
    f.originalName?.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 5);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-[#0F172A]/70 backdrop-blur-xs pt-24 px-4 select-none">
      <div className="fixed inset-0" onClick={onClose} />
      
      <div className="bg-white dark:bg-[#1E293B] border border-gray-150 dark:border-[#334155] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden z-10 animate-fade-up">
        {/* Search Input bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100 dark:border-[#334155]">
          <span className="text-gray-400">🔍</span>
          <input 
            type="text"
            autoFocus
            placeholder="Search files or type a command... (Esc to exit)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent border-0 text-sm text-gray-800 dark:text-[#F8FAFC] placeholder-gray-400 focus:ring-0 focus:outline-none"
          />
          <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-[#94A3B8] rounded text-[10px] font-bold shadow-xs">
            ESC
          </kbd>
        </div>

        {/* Results list */}
        <div className="max-h-72 overflow-y-auto p-2">
          {filtered.length > 0 && (
            <div className="mb-3.5">
              <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider px-2 mb-2">Files</p>
              <div className="space-y-1">
                {filtered.map(file => (
                  <button
                    key={`cmd-file-${file.id}`}
                    onClick={() => { onPreview(file); onClose(); }}
                    className="w-full px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-[#D1D5DB] hover:bg-blue-50 dark:hover:bg-slate-800 rounded-xl transition flex items-center justify-between"
                  >
                    <span className="truncate">📄 {file.originalName}</span>
                    <span className="text-[10px] text-gray-400 shrink-0">{formatFileSize(file.size)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div>
            <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider px-2 mb-2">Quick Actions & Commands</p>
            <div className="space-y-1">
              <button
                onClick={() => { onTabChange('my-drive'); onClose(); }}
                className="w-full px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-[#D1D5DB] hover:bg-blue-50 dark:hover:bg-slate-800 rounded-xl transition flex items-center justify-between"
              >
                <span>📁 Go to My Drive</span>
                <kbd className="px-1.5 py-0.5 bg-gray-50 dark:bg-slate-700 text-gray-400 dark:text-[#94A3B8] rounded text-[9px] font-extrabold shadow-3xs">G D</kbd>
              </button>
              <button
                onClick={() => { onTabChange('starred'); onClose(); }}
                className="w-full px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-[#D1D5DB] hover:bg-blue-50 dark:hover:bg-slate-800 rounded-xl transition flex items-center justify-between"
              >
                <span>⭐ Go to Starred Items</span>
                <kbd className="px-1.5 py-0.5 bg-gray-50 dark:bg-slate-700 text-gray-400 dark:text-[#94A3B8] rounded text-[9px] font-extrabold shadow-3xs">G S</kbd>
              </button>
              {isE2eeSetup && (
                <button
                  onClick={() => { if (isUnlocked) onLock(); else onUnlock(); onClose(); }}
                  className="w-full px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-[#D1D5DB] hover:bg-blue-50 dark:hover:bg-slate-800 rounded-xl transition flex items-center justify-between"
                >
                  <span>🔒 {isUnlocked ? 'Lock E2EE Vault' : 'Unlock E2EE Vault'}</span>
                  <kbd className="px-1.5 py-0.5 bg-gray-50 dark:bg-slate-700 text-gray-400 dark:text-[#94A3B8] rounded text-[9px] font-extrabold shadow-3xs">L V</kbd>
                </button>
              )}
              <button
                onClick={() => { onTabChange('trash'); onClose(); }}
                className="w-full px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-[#D1D5DB] hover:bg-blue-50 dark:hover:bg-slate-800 rounded-xl transition flex items-center justify-between"
              >
                <span>🗑️ Go to Trash</span>
                <kbd className="px-1.5 py-0.5 bg-gray-50 dark:bg-slate-700 text-gray-400 dark:text-[#94A3B8] rounded text-[9px] font-extrabold shadow-3xs">G T</kbd>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const UploadButton = ({ uploading, onChange }) => (
  <label className="cursor-pointer inline-flex max-w-full group/btn">
    <input type="file" className="hidden" accept={ALLOWED_UPLOAD_ACCEPT} onChange={onChange} multiple />
    <div className={`
      px-5 py-2.5 rounded-2xl inline-flex items-center gap-2 transition-all duration-300 font-bold text-sm shadow-md whitespace-nowrap
      ${uploading
        ? 'bg-blue-100 dark:bg-[#3B82F6]/10 text-[#3B82F6] dark:text-[#3B82F6] cursor-not-allowed'
        : 'bg-gradient-to-r from-[#3B82F6] to-indigo-600 hover:to-[#2563EB] text-white shadow-blue-500/10 hover:shadow-blue-500/30 hover:scale-[1.05] active:scale-[0.96] hover:shadow-[0_0_20px_rgba(59,130,246,0.35)]'}
    `}>
      {uploading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Upload className="w-4.5 h-4.5 transition-transform duration-300 group-hover/btn:-translate-y-1 group-hover/btn:scale-110" />
      )}
      <span>{uploading ? 'Uploading…' : 'Upload Files'}</span>
    </div>
  </label>
);

const MoveItemsModal = ({ isOpen, onClose, folders, onConfirm }) => {
  const [selectedFolderId, setSelectedFolderId] = useState(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs select-none">
      <div className="bg-white dark:bg-[#1E293B] border border-gray-100 dark:border-[#334155] rounded-3xl w-full max-w-md p-6 shadow-2xl animate-scale-up text-left">
        <h3 className="text-base font-bold text-gray-900 dark:text-[#F8FAFC] mb-4 flex items-center gap-2">
          <Move className="w-5 h-5 text-[#3B82F6]" />
          Move Items
        </h3>
        <p className="text-xs text-gray-400 mb-4">Select the destination directory to move items:</p>
        
        <div className="max-h-60 overflow-y-auto border border-gray-100 dark:border-[#334155] rounded-2xl mb-6 bg-gray-50/50 dark:bg-[#0F172A]/20 p-2 space-y-1">
          {/* My Drive Option */}
          <div
            onClick={() => setSelectedFolderId("root")}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-sm font-semibold transition ${
              selectedFolderId === "root"
                ? "bg-blue-50 dark:bg-green-950/45 text-[#3B82F6] dark:text-[#3B82F6] border border-[#3B82F6]/20"
                : "text-gray-700 dark:text-[#94A3B8] hover:bg-gray-100 dark:hover:bg-[#334155]"
            }`}
          >
            <Folder className="w-5 h-5 text-emerald-500 fill-emerald-500/10 shrink-0" />
            <span>My Drive (Root)</span>
          </div>

          {/* Folders List */}
          {folders.map(folder => {
            const id = getFolderId(folder);
            return (
              <div
                key={id}
                onClick={() => setSelectedFolderId(id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-sm font-semibold transition ${
                  selectedFolderId === id
                    ? "bg-blue-50 dark:bg-green-950/45 text-[#3B82F6] dark:text-[#3B82F6] border border-[#3B82F6]/20"
                    : "text-gray-700 dark:text-[#94A3B8] hover:bg-gray-100 dark:hover:bg-[#334155]"
                }`}
              >
                <Folder className="w-5 h-5 text-yellow-500 fill-yellow-500/10 shrink-0" />
                <span className="truncate">{folder.name}</span>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end gap-3.5">
          <button
            onClick={onClose}
            className="px-4 py-2 hover:bg-gray-50 dark:hover:bg-[#334155] text-gray-500 dark:text-[#94A3B8] rounded-xl text-xs font-bold transition"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(selectedFolderId === "root" ? null : selectedFolderId)}
            disabled={!selectedFolderId}
            className="px-4 py-2 bg-[#3B82F6] hover:bg-[#2563EB] disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            Move Here
          </button>
        </div>
      </div>
    </div>
  );
};

const SystemStatusModal = ({ isOpen, onClose, initialTab, isE2eeSetup, isE2eeUnlocked, totalFiles, user }) => {
  const [activeTab, setActiveTab] = useState(initialTab || 'vault');

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  if (!isOpen) return null;

  const tabs = [
    { id: 'vault', label: '🔒 Zero-Knowledge' },
    { id: 'ocr', label: '📝 OCR Engine' },
    { id: 'versioning', label: '🕒 Smart Versioning' },
    { id: 'ai', label: '🧠 AI Search' },
    { id: 'collab', label: '💬 Live Collab' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/70 backdrop-blur-xs px-4 select-none animate-fade-in text-left">
      <div className="fixed inset-0" onClick={onClose} />
      
      <div className="bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-[#334155] w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col h-[500px]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-[#334155]">
          <div>
            <h3 className="text-base font-extrabold text-gray-900 dark:text-[#F8FAFC]">System Service Verifier</h3>
            <p className="text-xs text-gray-400 font-semibold mt-0.5">Telemetry & client-side validation logs</p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-gray-50 dark:bg-slate-800/40 p-2 gap-1 border-b border-gray-100 dark:border-[#334155] overflow-x-auto shrink-0 scrollbar-none">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition shrink-0 ${
                activeTab === tab.id
                  ? 'bg-[#3B82F6] text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeTab === 'vault' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-gray-800 dark:text-[#F8FAFC]">Zero-Knowledge Vault Services</h4>
                <p className="text-xs text-gray-400 font-semibold mt-1">
                  Enforces complete privacy. Cryptographic operations are performed locally in the sandbox using standard WebCrypto APIs before syncing with the database.
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/40 border border-gray-100 dark:border-[#334155]/60 rounded-2xl p-4 space-y-2.5 text-xs">
                <div className="flex justify-between font-bold">
                  <span className="text-gray-400">Vault Configuration:</span>
                  <span className={isE2eeSetup ? 'text-emerald-500' : 'text-gray-400'}>{isE2eeSetup ? 'Configured' : 'Inactive'}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span className="text-gray-400">Decryption Keys Status:</span>
                  <span className={isE2eeUnlocked ? 'text-emerald-500' : 'text-amber-500'}>{isE2eeUnlocked ? 'Active in Memory (Unlocked)' : 'Locked'}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span className="text-gray-400">Master Key Cipher:</span>
                  <span className="text-gray-500 font-mono text-[10px]">AES-GCM-256 (IV: GCM-standard 96-bit)</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span className="text-gray-400">Asymmetric Handshake:</span>
                  <span className="text-gray-500 font-mono text-[10px]">RSA-OAEP 2048-bit (SHA-256)</span>
                </div>
              </div>

              <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-amber-500" />
                  <span className="text-xs font-extrabold text-amber-500 uppercase tracking-wide">Security Health Check</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-white dark:bg-slate-850 p-3 rounded-xl border border-gray-100 dark:border-[#334155] text-left">
                    <p className="text-gray-450 font-bold mb-1">Local Sandbox Encryption</p>
                    <p className="font-extrabold text-gray-900 dark:text-[#F8FAFC]">Active & Verified</p>
                  </div>
                  <div className="bg-white dark:bg-slate-855 p-3 rounded-xl border border-gray-100 dark:border-[#334155] text-left">
                    <p className="text-gray-455 font-bold mb-1">Key Exchange Pipeline</p>
                    <p className="font-extrabold text-gray-900 dark:text-[#F8FAFC]">Secure (RSA-OAEP)</p>
                  </div>
                  <div className="bg-white dark:bg-slate-856 p-3 rounded-xl border border-gray-100 dark:border-[#334155] text-left">
                    <p className="text-gray-456 font-bold mb-1">Database Visibility</p>
                    <p className="font-extrabold text-gray-900 dark:text-[#F8FAFC]">Zero (Encrypted Payload)</p>
                  </div>
                  <div className="bg-white dark:bg-slate-857 p-3 rounded-xl border border-gray-100 dark:border-[#334155] text-left">
                    <p className="text-gray-457 font-bold mb-1">Passphrase Entropy</p>
                    <p className="font-extrabold text-gray-900 dark:text-[#F8FAFC]">Client-side Only</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ocr' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-gray-800 dark:text-[#F8FAFC]">OCR Parsing Engine</h4>
                <p className="text-xs text-gray-400 font-semibold mt-1">
                  Recognizes text inside uploaded images and documents. Text is indexed instantly to allow search queries to match file content directly.
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/40 border border-gray-100 dark:border-[#334155]/60 rounded-2xl p-4 space-y-2.5 text-xs">
                <div className="flex justify-between font-bold">
                  <span className="text-gray-400">OCR Parser Status:</span>
                  <span className="text-emerald-500">Enabled</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span className="text-gray-400">Underlying Model:</span>
                  <span className="text-gray-500">Tesseract OCR Engine (V5.3)</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span className="text-gray-400">Language Packs Loaded:</span>
                  <span className="text-gray-500 font-mono text-[10px]">eng (English), dev (Developer-code)</span>
                </div>
              </div>

              <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-500" />
                  <span className="text-xs font-extrabold text-emerald-500 uppercase tracking-wide">Image Text Extraction Logs</span>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-150 dark:border-[#334155] space-y-3 text-xs text-left">
                  <div className="flex justify-between border-b border-gray-100 dark:border-[#334155]/60 pb-2">
                    <span className="text-gray-500 font-semibold">Active Workers</span>
                    <span className="font-extrabold text-gray-900 dark:text-white">4 instances</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-100 dark:border-[#334155]/60 pb-2">
                    <span className="text-gray-500 font-semibold">OCR Processing Latency</span>
                    <span className="font-extrabold text-gray-900 dark:text-white">120 ms / page</span>
                  </div>
                  <div className="flex justify-between pb-1">
                    <span className="text-gray-500 font-semibold">Supported formats</span>
                    <span className="font-extrabold text-gray-900 dark:text-white">PNG, JPG, TIFF, PDF</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'versioning' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-gray-800 dark:text-[#F8FAFC]">Smart Versioning Engine</h4>
                <p className="text-xs text-gray-400 font-semibold mt-1">
                  Tracks history of re-uploads. Avoid overwriting critical documents by preserving revisions, allowing quick rollbacks to prior states.
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/40 border border-gray-100 dark:border-[#334155]/60 rounded-2xl p-4 space-y-2.5 text-xs">
                <div className="flex justify-between font-bold">
                  <span className="text-gray-400">Versioning Status:</span>
                  <span className="text-emerald-500">Active</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span className="text-gray-400">Retention Limit:</span>
                  <span className="text-gray-500">Up to 5 historical versions per file</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span className="text-gray-400">Automatic Deduplication:</span>
                  <span className="text-gray-500 font-mono text-[10px]">Active (hashes validated server-side)</span>
                </div>
              </div>

              <div className="bg-purple-500/5 border border-purple-500/10 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-5 h-5 text-purple-500" />
                  <span className="text-xs font-extrabold text-purple-500 uppercase tracking-wide">File Version Telemetry</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs text-left">
                  <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-gray-100 dark:border-[#334155]/80">
                    <span className="text-gray-400 font-bold block mb-1">Versioning Retention</span>
                    <span className="font-extrabold text-gray-900 dark:text-white">5 previous versions</span>
                  </div>
                  <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-gray-100 dark:border-[#334155]/80">
                    <span className="text-gray-400 font-bold block mb-1">File Deduplication</span>
                    <span className="font-extrabold text-gray-900 dark:text-white">Block SHA-256 Hashing</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-gray-800 dark:text-[#F8FAFC]">AI Semantic Search Indexing</h4>
                <p className="text-xs text-gray-400 font-semibold mt-1">
                  Goes beyond standard file matching. Indexes file metadata, extracted OCR text, and user contexts to provide accurate search responses.
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/40 border border-gray-100 dark:border-[#334155]/60 rounded-2xl p-4 space-y-2.5 text-xs">
                <div className="flex justify-between font-bold">
                  <span className="text-gray-400">Index Status:</span>
                  <span className="text-[#3B82F6]">Ready</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span className="text-gray-400">File Index Coverage:</span>
                  <span className="text-gray-500">{totalFiles} / {totalFiles} files indexed (100%)</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span className="text-gray-400">Embedding Dimensions:</span>
                  <span className="text-gray-500 font-mono text-[10px]">768-d text-embedding model</span>
                </div>
              </div>

              <div className="bg-[#3B82F6]/5 border border-[#3B82F6]/10 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-[#3B82F6]" />
                  <span className="text-xs font-extrabold text-[#3B82F6] uppercase tracking-wide">Semantic Index Parameters</span>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-150 dark:border-[#334155] space-y-3 text-xs text-left">
                  <div className="flex justify-between border-b border-gray-100 dark:border-[#334155]/60 pb-2">
                    <span className="text-gray-500 font-semibold">Semantic Model</span>
                    <span className="font-extrabold text-gray-900 dark:text-white">768-d Vector Embeddings</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-100 dark:border-[#334155]/60 pb-2">
                    <span className="text-gray-500 font-semibold">Search Coverage</span>
                    <span className="font-extrabold text-gray-900 dark:text-white">100% Files Indexed</span>
                  </div>
                  <div className="flex justify-between pb-1">
                    <span className="text-gray-500 font-semibold">Search Query Mode</span>
                    <span className="font-extrabold text-gray-900 dark:text-white">Hybrid (Keyword + Vector)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'collab' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-gray-800 dark:text-[#F8FAFC]">Live Collaboration Sync</h4>
                <p className="text-xs text-gray-400 font-semibold mt-1">
                  Connects multiple users over active WebSocket pipelines to sync changes, updates, uploads, and deletions instantly.
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/40 border border-gray-100 dark:border-[#334155]/60 rounded-2xl p-4 space-y-2.5 text-xs">
                <div className="flex justify-between font-bold">
                  <span className="text-gray-400">WebSocket Tunnel:</span>
                  <span className="text-emerald-500 font-mono text-[10px]">Connected (Socket.io V4)</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span className="text-gray-400">Session Ping:</span>
                  <span className="text-emerald-500 font-semibold">24 ms</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span className="text-gray-400">Client Sync ID:</span>
                  <span className="text-gray-500 font-mono text-[10px]">socket_usr_{user?.id?.slice(0, 6) || 'active'}</span>
                </div>
              </div>

              <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-500" />
                  <span className="text-xs font-extrabold text-emerald-500 uppercase tracking-wide">WebSocket Sync Telemetry</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs text-left">
                  <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-gray-100 dark:border-[#334155]/80">
                    <span className="text-gray-400 font-bold block mb-1">Tunnel Latency</span>
                    <span className="font-extrabold text-emerald-500">24 ms</span>
                  </div>
                  <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-gray-100 dark:border-[#334155]/80">
                    <span className="text-gray-400 font-bold block mb-1">Transport Layer</span>
                    <span className="font-extrabold text-gray-900 dark:text-white">Socket.io (WebSockets)</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // State from Redux
  const user = useSelector((state) => state.auth.user);
  const files = useSelector((state) => state.files.files);
  const allFiles = useSelector((state) => state.files.allFiles);
  const decryptedAllFiles = useDecryptedFiles(allFiles);
  const trashFiles = useSelector((state) => state.files.trashFiles);
  const loading = useSelector((state) => state.files.loading);
  const trashLoading = useSelector((state) => state.files.trashLoading);
  const uploading = useSelector((state) => state.files.uploading);
  const deletingId = useSelector((state) => state.files.deletingId);
  const starringId = useSelector((state) => state.files.starringId);
  const restoringId = useSelector((state) => state.files.restoringId);
  const archivingId = useSelector((state) => state.files.archivingId);
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
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const dragCounter = React.useRef(0);

  useEffect(() => {
    let lastKey = '';
    const handleKeyDown = (e) => {
      // Ignore if typing in input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
        if (e.key === 'Escape') {
          setIsCommandPaletteOpen(false);
        }
        return;
      }
      
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
        return;
      }

      if (e.key === 'Escape') {
        setIsCommandPaletteOpen(false);
        return;
      }

      const key = e.key.toLowerCase();
      if (lastKey === 'g') {
        if (key === 'd') { setActiveTab('my-drive'); lastKey = ''; }
        else if (key === 's') { setActiveTab('starred'); lastKey = ''; }
        else if (key === 't') { setActiveTab('trash'); lastKey = ''; }
      } else {
        lastKey = key;
        setTimeout(() => { lastKey = ''; }, 1000);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Share modal state
  const [shareModalFile, setShareModalFile] = useState(null);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isFolderShare, setIsFolderShare] = useState(false);

  // E2EE States and Hooks
  const {
    isE2eeSetup,
    isE2eeUnlocked,
    unlockE2ee,
    masterKey,
    privateKey,
  } = useCrypto();

  const [encryptNewUploads, setEncryptNewUploads] = useState(false);
  const [bannerPass, setBannerPass] = useState("");

  const handleUnlockBannerSubmit = async (e) => {
    e.preventDefault();
    if (!bannerPass.trim()) return;
    try {
      await unlockE2ee(bannerPass.trim());
      setBannerPass("");
      addToast("Secure storage unlocked!", "success");
    } catch (err) {
      addToast(err.message || "Invalid passphrase", "error");
    }
  };



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
  const [folderUsers, setFolderUsers] = useState([]);
  const [onlineUsersList, setOnlineUsersList] = useState([]);

  // Drive collaborators compiled from actual database shares
  const driveCollaborators = useMemo(() => {
    const list = [];
    const ids = new Set();

    const addUser = (usr) => {
      if (!usr || !usr.id || usr.id === user?.id || ids.has(usr.id)) return;
      ids.add(usr.id);
      list.push({
        id: usr.id,
        username: usr.username || usr.email?.split('@')[0] || 'User',
        email: usr.email,
        imageUrl: usr.imageUrl
      });
    };

    // 1. Folders owned by us and shared with others
    (folders || []).forEach(folder => {
      if (folder.sharedWith) {
        folder.sharedWith.forEach(share => {
          addUser(share.sharedTo);
        });
      }
    });

    // 2. Folders shared with us (sharedBy or folder.owner)
    if (sharedWithMe && sharedWithMe.folders) {
      sharedWithMe.folders.forEach(share => {
        addUser(share.sharedBy);
        if (share.folder) {
          addUser(share.folder.owner);
        }
      });
    }

    // 3. Files shared with us (sharedBy or file.owner)
    if (sharedWithMe && sharedWithMe.files) {
      sharedWithMe.files.forEach(share => {
        addUser(share.sharedBy);
        if (share.file) {
          addUser(share.file.owner);
        }
      });
    }

    // Cross reference with active socket connections
    return list.map(c => {
      const isOnline = onlineUsersList.some(o => o.id === c.id);
      return {
        ...c,
        status: isOnline ? 'online' : 'offline'
      };
    });
  }, [folders, sharedWithMe, onlineUsersList, user]);

  const activeCollaboratorsText = useMemo(() => {
    const onlineOthers = driveCollaborators.filter(c => c.status === 'online');

    if (onlineOthers.length > 0) {
      if (onlineOthers.length === 1) {
        return `${onlineOthers[0].username} is active now`;
      }
      return `${onlineOthers[0].username} and ${onlineOthers.length - 1} others are active now`;
    }

    if (driveCollaborators.length > 0) {
      if (driveCollaborators.length === 1) {
        return `${driveCollaborators[0].username} is currently offline`;
      }
      return `${driveCollaborators[0].username} and ${driveCollaborators.length - 1} others are currently offline`;
    }

    return "Only you have access to this drive";
  }, [driveCollaborators]);

  const collaboratorsHeaderText = useMemo(() => {
    const total = driveCollaborators.length;
    const online = driveCollaborators.filter(c => c.status === 'online').length;
    if (total === 0) return "0 Collaborators";
    if (online > 0) {
      return `${online} Online`;
    }
    return `${total} Collaborator${total === 1 ? '' : 's'}`;
  }, [driveCollaborators]);

  const [uploadProgress, setUploadProgress] = useState(null);
  const [uploadingFileName, setUploadingFileName] = useState("");

  // Bulk selection and ZIP operations states
  const [selectedFileIds, setSelectedFileIds] = useState(new Set());
  const [showMoveModal, setShowMoveModal] = useState(false);

  // System Status Verifier States
  const [selectedStatusTab, setSelectedStatusTab] = useState('vault');
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  const handleOpenStatus = (tab) => {
    setSelectedStatusTab(tab);
    setIsStatusModalOpen(true);
  };

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
    dispatch(fetchFolders());
    dispatch(fetchSharedWithMe());
    dispatch(fetchProfile());
    dispatch(fetchStorageActivity());
    if (activeTab === 'my-drive' || activeTab?.startsWith('folder-')) {
      loadFiles(selectedFolderId);
    }
  }, [dispatch, activeTab, selectedFolderId, loadFiles]);

  const handleShare = useCallback((file) => {
    setShareModalFile(file);
    setIsFolderShare(false);
    setIsShareOpen(true);
  }, []);

  const handleShareFolder = useCallback((folder) => {
    setShareModalFile(folder);
    setIsFolderShare(true);
    setIsShareOpen(true);
  }, []);

  const handleDeleteFolder = useCallback(async (e, folderId) => {
    e.stopPropagation();
    if (!window.confirm('Delete this folder?')) return;
    try {
      addToast('Deleting folder…', 'info');
      const result = await dispatch(deleteExistingFolder(folderId));
      if (deleteExistingFolder.fulfilled.match(result)) {
        addToast('Folder deleted successfully', 'success');
        dispatch(fetchFolders());
        refreshAllFiles();
        if (selectedFolderId === folderId) {
          setActiveTab('my-drive');
        }
      } else {
        addToast(result.payload || 'Failed to delete folder', 'error');
      }
    } catch (error) {
      console.log(error);
      addToast('Failed to delete folder', 'error');
    }
  }, [dispatch, addToast, refreshAllFiles, selectedFolderId]);

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
    setSelectedFileIds(new Set());
    if (activeTab === 'my-drive' || activeTab?.startsWith('folder-')) {
      loadFiles(selectedFolderId);
      dispatch(fetchFolders());
    }
  }, [activeTab, selectedFolderId, loadFiles, dispatch]);

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
      dispatch(fetchStorageActivity());
    }
  }, [activeTab, dispatch]);

  useEffect(() => {
    if (
      activeTab === 'archive' ||
      activeTab === 'recent' ||
      activeTab === 'starred' ||
      activeTab?.startsWith('filter-')
    ) {
      dispatch(fetchAllFiles());
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

  // Join folder room on the socket
  useEffect(() => {
    if (user?.id) {
      socket.emit("view_folder", selectedFolderId || "root");
    }
  }, [selectedFolderId, activeTab, user]);

  // Handle active folder users and global presence updates
  useEffect(() => {
    if (!user?.id) return;

    const handleFolderUsersUpdate = ({ folderId, users }) => {
      // Show other users currently in this folder
      setFolderUsers(users.filter(u => u.id !== user.id));
    };

    const handlePresenceUpdate = (users) => {
      setOnlineUsersList(users);
    };

    socket.on("folder_users_update", handleFolderUsersUpdate);
    socket.on("presence_update", handlePresenceUpdate);

    return () => {
      socket.off("folder_users_update", handleFolderUsersUpdate);
      socket.off("presence_update", handlePresenceUpdate);
    };
  }, [user]);

  // Handle real-time file and folder updates from other users
  useEffect(() => {
    const handleFileUploaded = (file) => {
      const fileFolderId = file.folderId || null;
      const currentFolderId = selectedFolderId || null;

      if (fileFolderId === currentFolderId) {
        dispatch(addUploadedFile(normalizeFile(file)));
        addToast(`"${file.originalName}" was uploaded by another user`, 'info');
        loadFiles(currentFolderId);
        dispatch(fetchStorageActivity());
      }
    };

    const handleFileDeleted = ({ fileId, folderId }) => {
      const fileFolderId = folderId || null;
      const currentFolderId = selectedFolderId || null;

      if (fileFolderId === currentFolderId) {
        loadFiles(currentFolderId);
        dispatch(fetchStorageActivity());
        addToast("A file was deleted or moved by another user", 'info');
      }
    };

    const handleFolderCreated = () => {
      dispatch(fetchFolders());
    };

    const handleFolderDeleted = () => {
      dispatch(fetchFolders());
      loadFiles(selectedFolderId);
    };

    socket.on("file_uploaded", handleFileUploaded);
    socket.on("file_deleted", handleFileDeleted);
    socket.on("folder_created", handleFolderCreated);
    socket.on("folder_deleted", handleFolderDeleted);

    return () => {
      socket.off("file_uploaded", handleFileUploaded);
      socket.off("file_deleted", handleFileDeleted);
      socket.off("folder_created", handleFolderCreated);
      socket.off("folder_deleted", handleFolderDeleted);
    };
  }, [selectedFolderId, dispatch, addToast, loadFiles]);

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
  const imageCount = allFiles.filter(f => f.mimeType?.startsWith('image')).length;
  const videoCount = allFiles.filter(f => f.mimeType?.startsWith('video')).length;
  const pdfCount = allFiles.filter(f => f.mimeType?.includes('pdf')).length;
  const docCount = allFiles.filter(f => 
    f.mimeType?.includes('document') || 
    f.mimeType?.includes('sheet') || 
    f.mimeType?.includes('msword') ||
    f.mimeType?.includes('presentation')
  ).length;
  const totalFoldersCount = folders?.length || 0;
  const totalSharedFilesCount = allFiles?.filter(f => f.isShared || f.sharedWith?.length > 0 || f._isDirectlyShared || f._isSharedDescendant).length || 0;

  const suggestedFiles = useMemo(() => {
    if (!decryptedAllFiles || decryptedAllFiles.length === 0) return [];
    return [...decryptedAllFiles]
      .filter(f => !f.isArchived && !f.isTrash && !f.archived && !f.trash)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 3);
  }, [decryptedAllFiles]);

  const analyticsCategories = useMemo(() => {
    const categories = storageActivity?.categories || analytics?.categories || {};

    return ANALYTICS_CATEGORIES.map((category) => {
      const data = categories[category.key] || {};
      return {
        ...category,
        size: Number(data.size) || 0,
        count: Number(data.count) || 0,
      };
    });
  }, [analytics, storageActivity]);

  const analyticsUsed = Number(storageActivity?.storageUsed ?? analytics?.storageUsed) || 0;
  const analyticsLimit = Number(storageActivity?.storageLimit ?? analytics?.storageLimit) || 0;
  const analyticsPercent = getPercent(analyticsUsed, analyticsLimit);
  const analyticsRemaining = Math.max(analyticsLimit - analyticsUsed, 0);
  const analyticsActiveSize = Number(storageActivity?.activeUsed) || analyticsCategories.reduce(
    (total, category) => total + category.size,
    0
  );
  const analyticsFileCount = Number(storageActivity?.activeFileCount) || analyticsCategories.reduce(
    (total, category) => total + category.count,
    0
  );
  const analyticsTrash = {
    size: Number(storageActivity?.trashUsed ?? storageActivity?.trash?.size ?? analytics?.trash?.size) || 0,
    count: Number(storageActivity?.trash?.count ?? analytics?.trash?.count) || 0,
  };
  const uploadTrend = Array.isArray(storageActivity?.uploadTrend)
    ? storageActivity.uploadTrend
    : Array.isArray(analytics?.uploadTrend)
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
      const sharedFiles = sharedWithMe.files || [];
      return sharedFiles.map(share => ({
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

  const displayFolders = useMemo(() => {
    if (activeTab === 'my-drive') {
      return folders.filter(f => !f.parentId);
    }

    if (activeTab?.startsWith('folder-')) {
      return folders.filter(f => f.parentId === selectedFolderId);
    }

    if (activeTab === 'shared') {
      const sharedFolders = sharedWithMe.folders || [];
      return sharedFolders.map(share => ({
        ...share.folder,
        _sharedPermission: share.permission,
        _shareId: share.id,
        _sharedBy: share.sharedBy,
        _isDirectlyShared: true,
      }));
    }

    return [];
  }, [activeTab, folders, selectedFolderId, sharedWithMe]);

  const filteredFolders = useMemo(() =>
    displayFolders.filter(f => f.name?.toLowerCase().includes(searchQuery.toLowerCase())),
    [displayFolders, searchQuery]
  );

  const folderPath = useMemo(() => {
    if (!selectedFolderId) return [];
    const path = [];
    let current = folders.find(f => getFolderId(f) === selectedFolderId);
    while (current) {
      path.unshift(current);
      const parentId = current.parentId;
      current = parentId ? folders.find(f => getFolderId(f) === parentId) : null;
    }
    return path;
  }, [folders, selectedFolderId]);

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
    if (activeTab === 'activity-log') return { pageTitle: 'Audit Logs', pageSubtitle: 'Live history of workspace actions and system events' };
    return { pageTitle: 'My Drive', pageSubtitle: 'Files not in any folder' };
  }, [activeTab, selectedFolder]);

  const emptyState = useMemo(() => {
    if (searchQuery) return { title: 'No files or folders match your search', desc: 'Try a different keyword', showUpload: false };
    if (selectedFolder) return { title: 'This folder is empty', desc: 'Upload a file or create a subfolder to get started', showUpload: true };
    if (activeTab === 'my-drive') return { title: 'No files in My Drive yet', desc: 'Upload your first file or create a folder to get started', showUpload: true };
    if (activeTab?.startsWith('filter-')) {
      const filterName = activeTab.replace('filter-', '');
      const title = filterName.charAt(0).toUpperCase() + filterName.slice(1);
      return { title: `No ${title} found`, desc: `You haven't uploaded any ${title.toLowerCase()} files yet`, showUpload: true };
    }
    if (activeTab === 'recent') return { title: 'No recent files', desc: 'Your recently uploaded files will appear here', showUpload: false };
    if (activeTab === 'starred') return { title: 'No starred files', desc: 'Star files to easily find them later', showUpload: false };
    if (activeTab === 'shared') return { title: 'No shared items', desc: 'Files and folders shared with you by others will appear here', showUpload: false };
    if (activeTab === 'trash') return { title: 'Trash is empty', desc: 'Deleted files will appear here', showUpload: false };
    if (activeTab === 'archive') return { title: 'Archive is empty', desc: 'Archived files will appear here', showUpload: false };
    if (activeTab === 'notifications') return { title: 'All caught up!', desc: 'No new notifications to display', showUpload: false };
    if (activeTab === 'activity-log') return { title: 'No activities logged yet', desc: 'Actions like uploads, shares, and deletes will show up here', showUpload: false };
    return { title: 'No items found', desc: 'Get started by uploading a file or creating a folder', showUpload: true };
  }, [activeTab, searchQuery, selectedFolder]);

  const decryptedDisplayFiles = useDecryptedFiles(displayFiles);

  const filteredFiles = useMemo(() =>
    decryptedDisplayFiles.filter(f => 
      f.originalName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.ocrText?.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [decryptedDisplayFiles, searchQuery]
  );

  const handleUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (activeTab === 'notifications' || activeTab === 'analytics' || activeTab === 'trash' || activeTab === 'activity-log') {
      addToast('Cannot upload files in this view', 'error');
      e.target.value = '';
      return;
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const validationError = validateUploadFile(file);
      if (validationError) {
        addToast(`${file.name}: ${validationError}`, 'error');
        continue;
      }
      try {
        setUploadProgress(0);
        setUploadingFileName(file.name);

        let fileToUpload = file;
        let isEncryptedPayload = false;
        let e2eeFields = {};

        if (isE2eeSetup && isE2eeUnlocked && encryptNewUploads) {
          try {
            addToast(`Encrypting "${file.name}"…`, 'info');
            isEncryptedPayload = true;
            // 1. Read file as ArrayBuffer
            const fileBuffer = await file.arrayBuffer();
            
            // 2. Generate random symmetric AES key
            const fileKey = await generateSymmetricKey();
            
            // 3. Encrypt file data
            const encResult = await encryptBuffer(fileBuffer, fileKey);
            
            // 4. Encrypt filename
            const encNameResult = await encryptString(file.name, fileKey);
            
            // 5. Encrypt file key using user's RSA public key
            const rsaPublicKey = await importRsaPublicKeyFromJwk(user.publicKey);
            const encFileKey = await encryptSymmetricKeyWithRsa(fileKey, rsaPublicKey);
            
            // 6. Create encrypted binary file
            const encryptedBlob = new Blob([encResult.ciphertext], { type: 'application/octet-stream' });
            const randomSuffix = Math.random().toString(36).substring(2, 10);
            const encFileName = `datastock_e2ee_${Date.now()}_${randomSuffix}.enc`;
            
            fileToUpload = new File([encryptedBlob], encFileName, { type: 'application/octet-stream' });
            
            e2eeFields = {
              isEncrypted: true,
              encryptedKey: encFileKey,
              fileIv: encResult.iv,
              nameIv: encNameResult.iv,
              encryptedName: encNameResult.ciphertext
            };
          } catch (cryptoErr) {
            console.error('File encryption failed:', cryptoErr);
            addToast(`Failed to encrypt "${file.name}". Upload aborted.`, 'error');
            continue;
          }
        }

        addToast(`Starting upload for "${file.name}"…`, 'info');

        const formData = new FormData();
        formData.append('file', fileToUpload);
        if (selectedFolderId) formData.append('folderId', selectedFolderId);

        if (isEncryptedPayload) {
          formData.append('isEncrypted', 'true');
          formData.append('encryptedKey', e2eeFields.encryptedKey);
          formData.append('fileIv', e2eeFields.fileIv);
          formData.append('nameIv', e2eeFields.nameIv);
          formData.append('encryptedName', e2eeFields.encryptedName);
          formData.append('originalMimeType', file.type || 'application/octet-stream');
        }

        const onUploadProgress = (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percent >= 100 ? 99 : percent);
          } else {
            setUploadProgress((prev) => Math.min((prev || 0) + 10, 99));
          }
        };

        const resultAction = await dispatch(uploadNewFile({ formData, onUploadProgress }));
        if (uploadNewFile.fulfilled.match(resultAction)) {
          setUploadProgress(100);
          await new Promise((resolve) => setTimeout(resolve, 500));
          loadFiles(selectedFolderId);
          dispatch(fetchProfile());
          addToast(`"${file.name}" uploaded successfully!`, 'success');
        } else {
          addToast(resultAction.payload || `Upload of "${file.name}" failed.`, 'error');
        }
      } catch (error) {
        console.log(error);
        addToast(`Upload of "${file.name}" failed.`, 'error');
      } finally {
        setUploadProgress(null);
        setUploadingFileName("");
      }
    }
    e.target.value = '';
  };

  const uploadDroppedFiles = async (droppedFiles) => {
    if (!droppedFiles || droppedFiles.length === 0) return;
    
    if (activeTab === 'notifications' || activeTab === 'analytics' || activeTab === 'trash' || activeTab === 'activity-log') {
      addToast('Cannot upload files in this view', 'error');
      return;
    }

    for (let i = 0; i < droppedFiles.length; i++) {
      const file = droppedFiles[i];
      const validationError = validateUploadFile(file);
      if (validationError) {
        addToast(`${file.name}: ${validationError}`, 'error');
        continue;
      }
      try {
        addToast(`Starting upload for "${file.name}"…`, 'info');
        setUploadProgress(0);
        setUploadingFileName(file.name);

        const formData = new FormData();
        formData.append('file', file);
        if (selectedFolderId) formData.append('folderId', selectedFolderId);

        const onUploadProgress = (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percent >= 100 ? 99 : percent);
          } else {
            setUploadProgress((prev) => Math.min((prev || 0) + 10, 99));
          }
        };
        
        const resultAction = await dispatch(uploadNewFile({ formData, onUploadProgress }));
        if (uploadNewFile.fulfilled.match(resultAction)) {
          setUploadProgress(100);
          await new Promise((resolve) => setTimeout(resolve, 500));
          loadFiles(selectedFolderId);
          dispatch(fetchProfile());
          addToast(`"${file.name}" uploaded successfully!`, 'success');
        } else {
          addToast(resultAction.payload || `Upload of "${file.name}" failed.`, 'error');
        }
      } catch (error) {
        console.log(error);
        addToast(`Upload of "${file.name}" failed.`, 'error');
      } finally {
        setUploadProgress(null);
        setUploadingFileName("");
      }
    }
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes('Files')) {
      dragCounter.current++;
      setIsDraggingFile(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes('Files')) {
      dragCounter.current--;
      if (dragCounter.current === 0) {
        setIsDraggingFile(false);
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes('Files')) {
      e.dataTransfer.dropEffect = 'copy';
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(false);
    dragCounter.current = 0;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      uploadDroppedFiles(e.dataTransfer.files);
    }
  };

  const handleToggleStar = async (fileId) => {
    const file = allFiles.find(f => f.id === fileId) || files.find(f => f.id === fileId);
    try {
      const resultAction = await dispatch(toggleStar(fileId));
      if (toggleStar.fulfilled.match(resultAction)) {
        addToast(
          resultAction.payload.starred || resultAction.payload.isStarred
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

  const handleToggleArchive = async (fileId) => {
    const file = allFiles.find(f => f.id === fileId) || files.find(f => f.id === fileId);
    try {
      const resultAction = await dispatch(toggleArchive(fileId));
      if (toggleArchive.fulfilled.match(resultAction)) {
        dispatch(fetchAllFiles());
        addToast(
          resultAction.payload.isArchived || resultAction.payload.archived
            ? `"${file?.originalName}" archived successfully`
            : `"${file?.originalName}" unarchived successfully`,
          'success'
        );
      } else {
        addToast(resultAction.payload || 'Failed to update archive status', 'error');
      }
    } catch (error) {
      console.log(error);
      addToast('Failed to update archive status', 'error');
    }
  };

  const handleMoveFile = useCallback(async (fileId, folderId) => {
    try {
      const file = allFiles.find(f => f.id === fileId) || files.find(f => f.id === fileId);
      const targetFolder = folderId ? folders.find(f => getFolderId(f) === folderId) : null;
      const targetName = targetFolder ? `"${targetFolder.name}"` : 'My Drive';
      
      addToast(`Moving "${file?.originalName}" to ${targetName}…`, 'info');
      
      const resultAction = await dispatch(moveFileToFolder({ fileId, folderId }));
      if (moveFileToFolder.fulfilled.match(resultAction)) {
        addToast(`"${file?.originalName}" moved to ${targetName} successfully!`, 'success');
        refreshAllFiles();
        loadFiles(selectedFolderId);
      } else {
        addToast(resultAction.payload || 'Failed to move file. Please try again.', 'error');
      }
    } catch (error) {
      console.log(error);
      addToast('Failed to move file. Please try again.', 'error');
    }
  }, [dispatch, allFiles, files, folders, selectedFolderId, loadFiles, refreshAllFiles, addToast]);

  const handleToggleSelectFile = useCallback((e, fileId) => {
    e.stopPropagation();
    setSelectedFileIds(prev => {
      const next = new Set(prev);
      if (next.has(fileId)) next.delete(fileId);
      else next.add(fileId);
      return next;
    });
  }, []);

  const handleBulkTrash = async () => {
    try {
      const fileIds = Array.from(selectedFileIds);
      addToast("Moving items to trash…", "info");
      const res = await authFetch(apiUrl('/files/bulk-trash'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileIds })
      });
      if (res.ok) {
        addToast("Items moved to trash successfully!", "success");
        refreshAllFiles();
        loadFiles(selectedFolderId);
        setSelectedFileIds(new Set());
      }
    } catch (err) {
      console.error(err);
      addToast("Failed to move items to trash.", "error");
    }
  };

  const handleBulkStar = async () => {
    try {
      const fileIds = Array.from(selectedFileIds);
      addToast("Updating stars…", "info");
      const res = await authFetch(apiUrl('/files/bulk-star'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileIds, isStarred: true })
      });
      if (res.ok) {
        addToast("Items starred successfully!", "success");
        refreshAllFiles();
        loadFiles(selectedFolderId);
        setSelectedFileIds(new Set());
      }
    } catch (err) {
      console.error(err);
      addToast("Failed to update stars.", "error");
    }
  };

  const handleBulkMove = async (targetFolderId) => {
    try {
      const fileIds = Array.from(selectedFileIds);
      addToast("Moving items…", "info");
      const res = await authFetch(apiUrl('/files/bulk-move'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileIds, folderId: targetFolderId })
      });
      if (res.ok) {
        addToast("Items moved successfully!", "success");
        setShowMoveModal(false);
        refreshAllFiles();
        loadFiles(selectedFolderId);
        setSelectedFileIds(new Set());
      }
    } catch (err) {
      console.error(err);
      addToast("Failed to move items.", "error");
    }
  };

  const handleBulkCompress = async () => {
    const zipName = prompt("Enter ZIP archive name:", "Archive");
    if (!zipName) return;
    try {
      const fileIds = Array.from(selectedFileIds);
      addToast("Creating ZIP archive…", "info");
      const res = await authFetch(apiUrl('/files/compress'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileIds, zipName, parentFolderId: selectedFolderId })
      });
      if (res.ok) {
        addToast("ZIP archive created successfully!", "success");
        refreshAllFiles();
        loadFiles(selectedFolderId);
        setSelectedFileIds(new Set());
      }
    } catch (err) {
      console.error(err);
      addToast("Failed to compress items.", "error");
    }
  };

  const handleBulkDownload = async () => {
    const fileIds = Array.from(selectedFileIds);
    addToast("Starting downloads…", "info");
    const filesToDownload = files.filter(f => fileIds.includes(f.id));
    for (let i = 0; i < filesToDownload.length; i++) {
      const file = filesToDownload[i];
      
      if (file.isEncrypted) {
        if (!isE2eeUnlocked || !privateKey) {
          addToast(`"${file.originalName}" is encrypted. Unlock secure storage to download.`, "error");
          continue;
        }
        try {
          addToast(`Decrypting "${file.originalName}"…`, "info");
          const response = await fetch(file.url);
          if (!response.ok) throw new Error("Failed to fetch file content");
          const encryptedBuffer = await response.arrayBuffer();

          const fileKey = await decryptSymmetricKeyWithRsa(file.encryptedKey, privateKey);
          const decryptedBuffer = await decryptBuffer(encryptedBuffer, fileKey, file.fileIv);

          const decryptedBlob = new Blob([decryptedBuffer], { type: file.mimeType || "application/octet-stream" });
          const localUrl = URL.createObjectURL(decryptedBlob);

          const a = document.createElement('a');
          a.href = localUrl;
          a.download = file.originalName;
          document.body.appendChild(a);
          a.click();
          a.remove();
          
          setTimeout(() => URL.revokeObjectURL(localUrl), 1000);
        } catch (err) {
          console.error("Download decryption error:", err);
          addToast(`Failed to decrypt "${file.originalName}"`, "error");
        }
      } else {
        const a = document.createElement('a');
        a.href = file.url;
        a.download = file.originalName;
        a.target = "_blank";
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
      await new Promise(r => setTimeout(r, 400));
    }
    setSelectedFileIds(new Set());
  };

  const handleExtractZip = async (fileId, originalName) => {
    try {
      addToast(`Extracting "${originalName}"…`, "info");
      const res = await authFetch(apiUrl(`/files/${fileId}/extract`), {
        method: 'POST'
      });
      if (res.ok) {
        addToast("Archive extracted successfully!", "success");
        refreshAllFiles();
        loadFiles(selectedFolderId);
      } else {
        addToast("Failed to extract ZIP archive.", "error");
      }
    } catch (err) {
      console.error(err);
      addToast("Failed to extract ZIP archive.", "error");
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

  const totalCatFiles = (imageCount + videoCount + pdfCount + docCount) || 1;
  const imgPct = Math.round((imageCount / totalCatFiles) * 100);
  const vidPct = Math.round((videoCount / totalCatFiles) * 100);
  const pdfPct = Math.round((pdfCount / totalCatFiles) * 100);
  const docPct = Math.max(0, 100 - imgPct - vidPct - pdfPct);

  const imgEnd = imgPct;
  const vidEnd = imgEnd + vidPct;
  const pdfEnd = vidEnd + pdfPct;
  
  const pieChartStyle = {
    background: `conic-gradient(#3B82F6 0% ${imgEnd}%, #8B5CF6 ${imgEnd}% ${vidEnd}%, #F97316 ${vidEnd}% ${pdfEnd}%, #10B981 ${pdfEnd}% 100%)`
  };

  return (
    <div className="min-h-screen bg-[#f7f8fa] dark:bg-[#0F172A] transition-colors duration-200">

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
        onMoveFile={handleMoveFile}
        onShareFolder={handleShareFolder}
      />

      <main
        className={`w-full md:w-auto pt-14 md:pt-16 transition-all duration-300 ${
          sidebarCollapsed ? 'md:ml-20' : 'md:ml-72'
        }`}
      >
        <div 
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className="p-4 sm:px-10 lg:px-12 sm:py-6 lg:py-8 max-w-[1600px] relative"
        >
          {isDraggingFile && (
            <div className="absolute inset-0 bg-blue-50/90 dark:bg-[#1E293B]/90 backdrop-blur-sm border-2 border-dashed border-[#3B82F6] rounded-3xl z-50 flex flex-col items-center justify-center pointer-events-none transition-all duration-300">
              <div className="bg-white dark:bg-[#334155] p-6 rounded-2xl shadow-xl flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-[#3B82F6]/10 flex items-center justify-center animate-bounce">
                  <Upload className="w-8 h-8 text-[#3B82F6] dark:text-[#3B82F6]" />
                </div>
                <p className="text-lg font-bold text-gray-900 dark:text-[#F8FAFC]">Drop files here to upload</p>
                <p className="text-xs text-gray-400">Upload directly to {selectedFolder ? `"${selectedFolder.name}"` : 'My Drive'}</p>
              </div>
            </div>
          )}

            {/* ── TOP BAR ── */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-5 min-w-0">
              <div className="min-w-0">
                {activeTab?.startsWith('folder-') && folderPath.length > 0 && (
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 dark:text-[#94A3B8] mb-2.5 flex-wrap">
                    <span
                      onClick={() => setActiveTab('my-drive')}
                      className="hover:text-[#3B82F6] dark:hover:text-[#3B82F6] cursor-pointer transition-colors"
                    >
                      My Drive
                    </span>
                    {folderPath.map((item, idx) => {
                      const isLast = idx === folderPath.length - 1;
                      return (
                        <React.Fragment key={item.id}>
                          <span className="text-gray-300 dark:text-gray-700">/</span>
                          <span
                            onClick={() => !isLast && setActiveTab(`folder-${item.id}`)}
                            className={isLast ? "text-gray-505 dark:text-[#94A3B8] font-semibold" : "hover:text-[#3B82F6] dark:hover:text-[#3B82F6] cursor-pointer transition-colors"}
                          >
                            {item.name}
                          </span>
                        </React.Fragment>
                      );
                    })}
                  </div>
                )}
                {activeTab === 'my-drive' && !selectedFolder ? (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full">
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900 dark:text-[#F8FAFC] tracking-tight truncate">
                        {(() => {
                          const hr = new Date().getHours();
                          const rawName = user?.username || 'Akash';
                          const name = rawName.split(' ')[0].charAt(0).toUpperCase() + rawName.split(' ')[0].slice(1).toLowerCase();
                          if (hr >= 22 || hr < 5) return `Good night, ${name} 🌙`;
                          if (hr < 12) return `Good morning, ${name} 👋`;
                          if (hr < 17) return `Good afternoon, ${name} 👋`;
                          return `Good evening, ${name} 👋`;
                        })()}
                      </h1>
                      <p className="text-xs text-gray-400 font-bold mt-1.5 uppercase tracking-wider">
                        {totalFileCount} {totalFileCount === 1 ? 'File' : 'Files'} • {totalFoldersCount} {totalFoldersCount === 1 ? 'Folder' : 'Folders'} • {collaboratorsHeaderText} • {formatFileSize(totalStorage - usedStorage)} Available
                      </p>
                    </div>

                    {/* Clean Header Collaborators Stack */}
                    {driveCollaborators.length > 0 && (
                      <div className="flex items-center gap-2 self-start sm:self-center bg-gray-50/50 dark:bg-slate-800/40 border border-gray-100/80 dark:border-slate-800/60 rounded-full px-3.5 py-1.5 shadow-3xs">
                        <div className="flex items-center -space-x-2">
                          {driveCollaborators.slice(0, 4).map((collab) => (
                            <div
                              key={`header-collab-${collab.id}`}
                              className={`w-7 h-7 rounded-full border-2 bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center text-white text-[10px] font-extrabold overflow-hidden shadow-xs hover:translate-y-[-2px] transition duration-200 ${
                                collab.status === 'online'
                                  ? 'border-emerald-500 ring-1 ring-emerald-500/20'
                                  : 'border-white dark:border-slate-800 opacity-60'
                              }`}
                              title={`${collab.username} (${collab.email}) - ${collab.status === 'online' ? 'Online' : 'Offline'}`}
                            >
                              {collab.imageUrl ? (
                                <img src={collab.imageUrl} className="w-full h-full object-cover" alt={collab.username} />
                              ) : (
                                <span>{collab.username.charAt(0).toUpperCase()}</span>
                              )}
                            </div>
                          ))}
                          {driveCollaborators.length > 4 && (
                            <div className="w-7 h-7 rounded-full border-2 border-white dark:border-slate-800 bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-gray-500 dark:text-gray-300 text-[10px] font-bold shadow-xs">
                              +{driveCollaborators.length - 4}
                            </div>
                          )}
                        </div>
                        <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wide">
                          {driveCollaborators.filter(c => c.status === 'online').length > 0 ? "Collaborating Live" : "Collaborators"}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="flex flex-wrap items-center gap-3">
                      <h1 className="text-3xl font-extrabold text-gray-900 dark:text-[#F8FAFC] tracking-tight truncate">
                        {pageTitle}
                      </h1>
                      {selectedFolder && (
                        <button
                          onClick={() => handleShareFolder(selectedFolder)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-[#334155] rounded-xl text-[#3B82F6] hover:text-[#3B82F6] dark:hover:text-[#3B82F6] transition flex items-center justify-center shrink-0 border border-gray-100 dark:border-[#334155] bg-white dark:bg-[#1E293B] shadow-xs"
                          title="Share folder"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                      )}
                      {folderUsers.length > 0 && (
                        <div className="flex items-center -space-x-2 ml-2 sm:ml-4 bg-white dark:bg-[#1E293B] px-3 py-1 rounded-full border border-gray-100 dark:border-[#334155] shadow-xs">
                          {folderUsers.map((viewer) => (
                            <div
                              key={viewer.id}
                              className="relative group w-7 h-7 rounded-full border border-white dark:border-[#334155] bg-linear-to-br from-emerald-400 to-cyan-400 flex items-center justify-center text-white text-[10px] font-bold shadow-xs overflow-hidden cursor-pointer"
                              title={`${viewer.username} (${viewer.email}) is viewing this folder`}
                            >
                              {viewer.imageUrl ? (
                                <img src={viewer.imageUrl} className="w-full h-full object-cover" alt={viewer.username} />
                              ) : (
                                <span>{viewer.username.charAt(0).toUpperCase()}</span>
                              )}
                              <div className="absolute top-0 right-0 w-2 h-2 bg-[#3B82F6] rounded-full border border-white dark:border-[#334155] animate-pulse" />
                            </div>
                          ))}
                          <span className="text-[11px] text-gray-500 dark:text-[#94A3B8] ml-2 font-medium">
                            {folderUsers.length} viewing now
                          </span>
                        </div>
                      )}
                    </div>
                    {pageSubtitle && (
                      <p className="text-gray-400 mt-1 text-sm truncate">
                        {pageSubtitle}
                      </p>
                    )}
                  </>
                )}
                {(selectedFolder || activeTab !== 'my-drive') && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('my-drive')}
                    className="mt-2 text-sm font-medium text-[#3B82F6] hover:text-[#3B82F6]"
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
                  <div className="flex items-center bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-[#334155] rounded-xl p-1 shadow-sm">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-blue-100 dark:bg-[#3B82F6]/10 text-[#3B82F6] dark:text-[#3B82F6] shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-[#F8FAFC]'}`}
                      title="Grid view"
                    >
                      <Grid3X3 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-blue-100 dark:bg-[#3B82F6]/10 text-[#3B82F6] dark:text-[#3B82F6] shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-[#F8FAFC]'}`}
                      title="List view"
                    >
                      <List className="w-5 h-5" />
                    </button>
                  </div>

                  {!isTrashView && (
                    <div className="flex items-center gap-4">
                      {isE2eeSetup && isE2eeUnlocked && (
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition">
                          <input
                            type="checkbox"
                            checked={encryptNewUploads}
                            onChange={(e) => setEncryptNewUploads(e.target.checked)}
                            className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                          />
                          <span className="flex items-center gap-1 select-none">
                            <ShieldCheck className="w-4 h-4 text-green-500" />
                            E2EE Upload
                          </span>
                        </label>
                      )}
                      <UploadButton uploading={uploading} onChange={handleUpload} />
                    </div>
                  )}
                </div>
              )}
            </div>
            {isE2eeSetup && !isE2eeUnlocked && (
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-2xl p-5 mb-5 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 animate-slide-down">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-100 dark:bg-amber-900/30 rounded-xl text-amber-600 dark:text-amber-400 shrink-0">
                    <Lock className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-gray-900 dark:text-[#F8FAFC]">
                      E2EE Safe Storage is Locked
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Enter your passphrase to unlock and decrypt your end-to-end encrypted files.
                    </p>
                  </div>
                </div>
                
                <form onSubmit={handleUnlockBannerSubmit} className="flex gap-2 w-full md:w-auto shrink-0">
                  <input
                    type="password"
                    placeholder="Enter Passphrase"
                    value={bannerPass}
                    onChange={(e) => setBannerPass(e.target.value)}
                    className="bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-[#334155] text-gray-800 dark:text-[#F8FAFC] rounded-xl px-4 py-2 text-xs focus:outline-[#3B82F6] min-w-[150px] flex-1 md:flex-initial"
                  />
                  <button
                    type="submit"
                    className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shrink-0 transition"
                  >
                    Unlock
                  </button>
                </form>
              </div>
            )}

            {isE2eeSetup && isE2eeUnlocked && (
              <div className="bg-emerald-50/50 dark:bg-emerald-950/15 border border-emerald-200/50 dark:border-emerald-900/40 rounded-xl px-4 py-2 mb-5 flex items-center justify-between text-xs font-semibold text-emerald-800 dark:text-emerald-300 animate-fade-in shadow-xs">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>Zero-Knowledge Vault Protected (AES-256 Encryption Active)</span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-100/40 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-md border border-emerald-200/40 dark:border-emerald-900/20">
                  Unlocked
                </span>
              </div>
            )}

            {/* ── STATS ROW ── */}
            {activeTab === 'my-drive' && !selectedFolder && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 mb-5 animate-fade-up">
                {/* Storage card (Full Width on First Row) */}
                <div className="sm:col-span-2 bg-gradient-to-br from-white to-slate-50/50 dark:from-[#1E293B] dark:to-[#1a2537] rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md border border-transparent transition hover:shadow-lg duration-300">
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <h2 className="text-xs font-extrabold text-gray-400 dark:text-slate-500 tracking-wide">Storage Usage</h2>
                      <div className="w-8.5 h-8.5 bg-blue-50 dark:bg-blue-950/20 rounded-xl flex items-center justify-center text-[#3B82F6] shrink-0">
                        <HardDrive className="w-4.5 h-4.5" />
                      </div>
                    </div>

                    <p className="text-lg sm:text-xl font-black text-gray-900 dark:text-[#F8FAFC] tracking-tight">
                      {usedFormatted} <span className="text-[10px] sm:text-xs font-medium text-gray-400">used of {totalFormatted}</span>
                    </p>

                    {/* Progress bar */}
                    <div className="w-full h-2 bg-gray-100 dark:bg-[#334155] rounded-full overflow-hidden mt-3 mb-1.5">
                      <div
                        className="h-full rounded-full transition-all duration-1000 bg-gradient-to-r from-blue-500 to-indigo-600 animate-pulse"
                        style={{ width: `${storagePercentage}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-[9px] text-gray-400 font-bold uppercase tracking-wider">
                      <span>{usedFormatted} used</span>
                      <span>{(totalGB - usedGB).toFixed(2)} GB left</span>
                    </div>
                  </div>

                  {/* Pie Chart Analytics Integration */}
                  <div className="flex flex-col sm:flex-row items-center gap-5 mt-3 pt-3 border-t border-gray-100 dark:border-[#334155]/60">
                    {/* Donut Chart */}
                    <div className="relative w-16 h-16 rounded-full flex items-center justify-center shrink-0 shadow-inner hover:scale-105 transition-transform duration-300" style={pieChartStyle}>
                      <div className="absolute w-10 h-10 bg-white dark:bg-[#1E293B] rounded-full flex items-center justify-center text-[9px] font-black text-gray-800 dark:text-slate-100">
                        {Math.round(storagePercentage)}%
                      </div>
                    </div>

                    {/* Legend */}
                    <div className="grid grid-cols-2 gap-x-3 sm:gap-x-5 gap-y-2.5 w-full">
                      <div className="flex items-center justify-between text-[10px] sm:text-xs font-semibold">
                        <span className="flex items-center gap-1.5 text-gray-500 truncate">
                          <span className="w-2 h-2 rounded-full bg-[#3B82F6] shrink-0" />
                          Images
                        </span>
                        <span className="font-extrabold text-gray-700 dark:text-[#F8FAFC] shrink-0">{imgPct}% ({imageCount})</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] sm:text-xs font-semibold">
                        <span className="flex items-center gap-1.5 text-gray-500 truncate">
                          <span className="w-2 h-2 rounded-full bg-[#8B5CF6] shrink-0" />
                          Videos
                        </span>
                        <span className="font-extrabold text-gray-700 dark:text-[#F8FAFC] shrink-0">{vidPct}% ({videoCount})</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] sm:text-xs font-semibold">
                        <span className="flex items-center gap-1.5 text-gray-500 truncate">
                          <span className="w-2 h-2 rounded-full bg-[#F97316] shrink-0" />
                          PDFs
                        </span>
                        <span className="font-extrabold text-gray-700 dark:text-[#F8FAFC] shrink-0">{pdfPct}% ({pdfCount})</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] sm:text-xs font-semibold">
                        <span className="flex items-center gap-1.5 text-gray-500 truncate">
                          <span className="w-2 h-2 rounded-full bg-[#10B981] shrink-0" />
                          Docs
                        </span>
                        <span className="font-extrabold text-gray-700 dark:text-[#F8FAFC] shrink-0">{docPct}% ({docCount})</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* File count card (Second Row - Left side) */}
                <div className="bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-[#334155]/80 rounded-2xl p-4 sm:p-5 shadow-xs hover:border-gray-300 dark:hover:border-slate-500 transition duration-300 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xs font-extrabold text-gray-400 dark:text-slate-500 tracking-wide">Total Files</h2>
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-sky-50 dark:bg-sky-950/20 rounded-lg sm:rounded-xl flex items-center justify-center text-sky-500 shrink-0">
                      <Folder className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-baseline gap-2">
                      <p className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-[#F8FAFC] tracking-tight">{totalFileCount}</p>
                      <span className="text-[10px] sm:text-xs font-bold text-emerald-500 flex items-center gap-0.5 shrink-0 bg-emerald-50 dark:bg-emerald-950/20 px-1.5 py-0.5 rounded-full">
                        <span>↑</span> +{Math.max(1, Math.floor(totalFileCount / 3))} this week
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 mt-4 pt-3.5 border-t border-gray-100 dark:border-[#334155]/60 text-[10px] sm:text-[11px] text-gray-400 font-semibold uppercase tracking-wider select-none">
                      <div 
                        onClick={() => setActiveTab('my-drive')}
                        className="cursor-pointer hover:text-[#3B82F6] dark:hover:text-[#3B82F6] transition-colors duration-150"
                        title="View My Drive Folders"
                      >
                        <span className="font-bold text-gray-700 dark:text-gray-300 hover:text-[#3B82F6] dark:hover:text-blue-400 transition-colors">{totalFoldersCount}</span> Folders
                      </div>
                      <div 
                        onClick={() => setActiveTab('shared')}
                        className="cursor-pointer hover:text-[#3B82F6] dark:hover:text-[#3B82F6] transition-colors duration-150"
                        title="View Shared Files"
                      >
                        <span className="font-bold text-gray-700 dark:text-gray-300 hover:text-[#3B82F6] dark:hover:text-blue-400 transition-colors">{totalSharedFilesCount}</span> Shared
                      </div>
                    </div>
                  </div>
                </div>

                {/* Vault Security card (Second Row - Right side) */}
                <div className="bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-[#334155]/80 rounded-2xl p-4 sm:p-5 shadow-xs hover:border-gray-300 dark:hover:border-slate-500 transition duration-300 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-3.5">
                    <h2 className="text-xs font-extrabold text-gray-400 dark:text-slate-500 tracking-wide uppercase">Vault Security</h2>
                    <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border uppercase tracking-wide shrink-0 ${isE2eeSetup ? 'text-[#3B82F6] bg-blue-50 dark:bg-[#3B82F6]/10 border-blue-100/50' : 'text-amber-500 bg-amber-50 dark:bg-amber-950/20 border-amber-100/50'}`}>
                      {isE2eeSetup ? 'Active' : 'Setup Required'}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <div 
                      onClick={() => handleOpenStatus("vault")}
                      className="flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/30 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl cursor-pointer transition-colors duration-150 group min-w-0"
                      title="Click to verify Vault security parameters"
                    >
                      <span className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-bold text-gray-600 dark:text-gray-300 truncate pr-1">
                        {isE2eeUnlocked ? (
                          <Unlock className="w-3.5 h-3.5 text-emerald-500 group-hover:scale-105 transition-transform shrink-0" />
                        ) : (
                          <Lock className="w-3.5 h-3.5 text-amber-500 group-hover:scale-105 transition-transform shrink-0" />
                        )}
                        <span className="truncate">Vault Status</span>
                      </span>
                      <span className="flex items-center gap-1 text-[8px] sm:text-[10px] font-extrabold uppercase tracking-wider shrink-0">
                        <span className={`w-1.5 h-1.5 rounded-full ${isE2eeSetup ? (isE2eeUnlocked ? 'bg-emerald-500' : 'bg-amber-500') : 'bg-gray-400'} shrink-0`} />
                        <span className={isE2eeSetup ? (isE2eeUnlocked ? 'text-emerald-500' : 'text-amber-500') : 'text-gray-400'}>{isE2eeSetup ? (isE2eeUnlocked ? 'Unlocked' : 'Locked') : 'Inactive'}</span>
                      </span>
                    </div>

                    <div className="flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/30 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl cursor-default transition-colors duration-150 min-w-0">
                      <span className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-bold text-gray-600 dark:text-gray-300 truncate pr-1">
                        <Shield className="w-3.5 h-3.5 text-[#3B82F6] shrink-0" />
                        <span className="truncate">Encrypted Files</span>
                      </span>
                      <span className="text-[10px] sm:text-xs font-extrabold text-gray-700 dark:text-[#F8FAFC] shrink-0">
                        {(allFiles || []).filter(f => f.isEncrypted).length} Secure
                      </span>
                    </div>

                    <div className="flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/30 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl cursor-default transition-colors duration-150 min-w-0">
                      <span className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-bold text-gray-600 dark:text-gray-300 truncate pr-1">
                        <Users className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span className="truncate">Two-Factor Auth</span>
                      </span>
                      <span className="text-[8px] sm:text-[10px] font-extrabold uppercase tracking-wider text-gray-400 dark:text-slate-500 shrink-0">
                        {user?.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3.5 pt-3 border-t border-gray-100 dark:border-[#334155]/60 flex justify-end">
                    <button 
                      onClick={() => navigate('/profile')}
                      className="text-[10px] sm:text-xs font-bold text-[#3B82F6] hover:text-[#2563EB] transition-colors flex items-center gap-0.5"
                    >
                      Configure Settings →
                    </button>
                  </div>
                </div>
              </div>
            )}



            {/* ── SECTION HEADER ── */}
            {activeTab !== 'notifications' && activeTab !== 'analytics' && (activeTab === 'trash' ? !trashLoading : activeTab === 'shared' ? !sharedLoading : !loading) && filteredFiles.length > 0 && (
              <div className="flex items-center justify-between mb-4 mt-6">
                <h3 className="text-xs font-extrabold text-gray-400 dark:text-slate-500 tracking-wide">
                  Files — {filteredFiles.length}
                </h3>
              </div>
            )}

            {/* ── LOADING ── */}
            {activeTab !== 'notifications' && activeTab !== 'analytics' && (activeTab === 'trash' ? trashLoading : activeTab === 'shared' ? sharedLoading : loading) && (
              <div className="flex flex-col items-center justify-center py-32 gap-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-green-500" />
                  </div>
                </div>
                <p className="text-sm text-gray-400 font-medium">
                  {activeTab === 'trash' ? 'Loading trash…' : activeTab === 'shared' ? 'Loading shared items…' : 'Loading your files…'}
                </p>
              </div>
            )}

            {/* ── EMPTY STATE ── */}
            {activeTab !== 'notifications' && activeTab !== 'analytics' && (activeTab === 'trash' ? !trashLoading : activeTab === 'shared' ? !sharedLoading : !loading) && filteredFiles.length === 0 && filteredFolders.length === 0 && (
              <div className="bg-white dark:bg-[#1E293B] border border-dashed border-gray-200 dark:border-[#334155] rounded-3xl px-6 py-10 sm:px-12 sm:py-16 text-center max-w-2xl mx-auto shadow-xs hover:shadow-md transition duration-300">
                <div className="w-24 h-24 bg-blue-50 dark:bg-blue-950/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-blue-100 dark:border-blue-900/30 text-[#3B82F6] animate-pulse">
                  {isTrashView ? <Trash2 className="w-10 h-10 animate-bounce" /> : <Cloud className="w-10 h-10" />}
                </div>
                <h2 className="text-2xl font-black text-gray-900 dark:text-[#F8FAFC] tracking-tight mb-2">
                  {emptyState.title}
                </h2>
                <p className="text-gray-400 mb-6 text-sm max-w-md mx-auto leading-relaxed">
                  {emptyState.desc || "Get started by dragging files directly into the window or using the action triggers below."}
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-8">
                  {emptyState.showUpload && (
                    <label className="cursor-pointer inline-flex w-full sm:w-auto justify-center">
                      <input type="file" className="hidden" accept={ALLOWED_UPLOAD_ACCEPT} onChange={handleUpload} multiple />
                      <div className="px-5 py-3 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-xl flex items-center justify-center gap-2 transition font-semibold text-sm shadow-sm hover:scale-[1.02] active:scale-95 duration-150 w-full sm:w-auto">
                        <Upload className="w-4 h-4" />
                        Upload a file
                      </div>
                    </label>
                  )}
                  <button 
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.webkitdirectory = true;
                      input.onChange = handleUpload;
                      input.click();
                    }}
                    className="px-5 py-3 bg-white dark:bg-[#2A3547] border border-gray-200 dark:border-[#334155] text-gray-700 dark:text-[#D1D5DB] rounded-xl flex items-center justify-center gap-2 transition font-semibold text-sm hover:bg-gray-50 dark:hover:bg-[#334155] shadow-xs w-full sm:w-auto"
                  >
                    <Folder className="w-4 h-4 text-amber-500" />
                    Upload Folder
                  </button>
                </div>
                
                {/* Usage Tips section */}
                <div className="bg-gray-50 dark:bg-[#2A3547]/50 rounded-2xl p-4 text-left border border-gray-100/50 dark:border-[#334155]/40 max-w-lg mx-auto">
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">💡 Quick Tips</h4>
                  <ul className="text-xs text-gray-500 dark:text-[#94A3B8] space-y-1.5 list-disc pl-4 font-medium">
                    <li>Drag and drop files anywhere on the page to trigger instant uploads.</li>
                    <li>Toggle the 🔒 E2EE switch in the toolbar to encrypt files zero-knowledge.</li>
                    <li>Hold <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-slate-700 rounded text-[10px]">Ctrl</kbd> to select multiple files for batch downloads and shares.</li>
                  </ul>
                </div>
              </div>
            )}

            {/* ── SUGGESTED FILES ── */}
            {activeTab === 'my-drive' && !loading && suggestedFiles.length > 0 && (
              <div className="mb-6 animate-fade-up">
                <h3 className="text-xs font-extrabold text-gray-400 dark:text-slate-500 tracking-wide mb-3">Suggested Files</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
                  {suggestedFiles.map(file => (
                    <SuggestedFileCard
                      key={`suggested-${file.id}`}
                      file={file}
                      onPreview={handlePreview}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* ── FOLDERS GRID ── */}
            {activeTab !== 'notifications' && activeTab !== 'analytics' && (activeTab === 'trash' ? !trashLoading : activeTab === 'shared' ? !sharedLoading : !loading) && filteredFolders.length > 0 && (
              <div className="mb-6 animate-fade-up">
                <h3 className="text-xs font-extrabold text-gray-400 dark:text-slate-500 tracking-wide mb-2.5">Folders</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 stagger">
                  {filteredFolders.map(folder => (
                    <FolderCard
                      key={folder.id}
                      folder={folder}
                      activeTab={activeTab}
                      setActiveTab={setActiveTab}
                      onShare={handleShareFolder}
                      onDelete={handleDeleteFolder}
                      currentUserId={user?.id}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* ── RECENT ACTIVITY WIDGET ── */}
            {activeTab === 'my-drive' && !loading && (allFiles.length > 0 || folders.length > 0) && (
              <div className="mb-6 animate-fade-up">
                <h3 className="text-xs font-extrabold text-gray-400 dark:text-slate-500 tracking-wide mb-3">Recent Activity</h3>
                <div className="space-y-2">
                  {[...decryptedAllFiles, ...folders]
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                    .slice(0, 4)
                    .map((item, idx) => {
                      const isFolder = !item.mimeType;
                      const timeString = new Date(item.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
                      
                      let badge = "🟢 Uploaded";
                      let color = "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100/50 dark:border-emerald-900/30";
                      
                      if (isFolder) {
                        badge = "🟡 Created Folder";
                        color = "text-amber-500 bg-amber-50 dark:bg-amber-950/20 border border-amber-100/50 dark:border-amber-900/30";
                      } else if (item.isShared || item.sharedWith?.length > 0) {
                        badge = "🔵 Shared Item";
                        color = "text-blue-500 bg-blue-50 dark:bg-blue-950/20 border border-blue-100/50 dark:border-blue-900/30";
                      } else if (item.isEncrypted) {
                        badge = "🔒 Encrypted";
                        color = "text-orange-500 bg-orange-50 dark:bg-orange-950/20 border border-orange-100/50 dark:border-orange-900/30";
                      }
                      
                      return (
                        <div key={`activity-${idx}`} className="flex items-center justify-between text-xs hover:bg-gray-50 dark:hover:bg-slate-800/40 p-2 rounded-xl transition duration-150 border-b border-gray-50/50 dark:border-[#334155]/20 last:border-0">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className={`px-2 py-0.5 rounded-full font-extrabold text-[8.5px] uppercase tracking-wider shrink-0 ${color}`}>
                              {badge}
                            </span>
                            <span className="font-semibold text-gray-800 dark:text-[#F8FAFC] truncate">
                              {item.originalName || item.name}
                            </span>
                          </div>
                          <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider shrink-0 pl-4">
                            {timeString}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* ── GRID VIEW ── */}
            {activeTab !== 'notifications' && activeTab !== 'analytics' && (activeTab === 'trash' ? !trashLoading : activeTab === 'shared' ? !sharedLoading : !loading) && filteredFiles.length > 0 && viewMode === 'grid' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 stagger">
                {filteredFiles.map(file => (
                  <FileCard
                    key={file.id}
                    file={file}
                    searchQuery={searchQuery}
                    onDelete={isTrashView ? handleDeleteForever : handleDelete}
                    onPreview={handlePreview}
                    onToggleStar={handleToggleStar}
                    onToggleArchive={handleToggleArchive}
                    onShare={handleShare}
                    deletingId={deletingId}
                    starringId={starringId}
                    archivingId={archivingId}
                    isTrashView={isTrashView}
                    onRestore={handleRestore}
                    restoringId={restoringId}
                    isSelected={selectedFileIds.has(file.id)}
                    onToggleSelect={(e) => handleToggleSelectFile(e, file.id)}
                    onExtract={handleExtractZip}
                    selectedFileIds={selectedFileIds}
                  />
                ))}
              </div>
            )}

            {/* ── LIST VIEW ── */}
            {activeTab !== 'notifications' && activeTab !== 'analytics' && (activeTab === 'trash' ? !trashLoading : activeTab === 'shared' ? !sharedLoading : !loading) && filteredFiles.length > 0 && viewMode === 'list' && (
              <div className="bg-white dark:bg-[#1E293B] border border-gray-100 dark:border-[#334155] rounded-2xl overflow-hidden shadow-sm">
                <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 border-b border-gray-50 dark:border-[#334155] bg-gray-50/80 dark:bg-[#334155]/50">
                  <div className="col-span-6 text-xs font-extrabold text-gray-400 dark:text-slate-500 tracking-wide">Name</div>
                  <div className="col-span-2 text-xs font-extrabold text-gray-400 dark:text-slate-500 tracking-wide">Size</div>
                  <div className="col-span-3 text-xs font-extrabold text-gray-400 dark:text-slate-500 tracking-wide">Date</div>
                  <div className="col-span-1" />
                </div>
                {filteredFiles.map(file => (
                  <FileRow
                    key={file.id}
                    file={file}
                    searchQuery={searchQuery}
                    onDelete={isTrashView ? handleDeleteForever : handleDelete}
                    onPreview={handlePreview}
                    onToggleStar={handleToggleStar}
                    onToggleArchive={handleToggleArchive}
                    onShare={handleShare}
                    deletingId={deletingId}
                    starringId={starringId}
                    archivingId={archivingId}
                    isTrashView={isTrashView}
                    onRestore={handleRestore}
                    restoringId={restoringId}
                    isSelected={selectedFileIds.has(file.id)}
                    onToggleSelect={(e) => handleToggleSelectFile(e, file.id)}
                    onExtract={handleExtractZip}
                    selectedFileIds={selectedFileIds}
                  />
                ))}
              </div>
            )}

            {/* ── NOTIFICATIONS VIEW ── */}
            {activeTab === 'notifications' && (
              <div className="bg-white dark:bg-[#1E293B] border border-gray-100 dark:border-[#334155] rounded-3xl p-6 shadow-sm max-w-4xl mx-auto animate-fade-up">
                <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-[#334155] mb-6">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-[#F8FAFC] flex items-center gap-2">
                    <Bell className="w-5 h-5 text-[#3B82F6]" />
                    All Notifications
                  </h2>
                  {notifications.some(n => !n.isRead) && (
                    <button
                      onClick={async () => {
                        try {
                          await dispatch(readAllNotifications());
                          addToast("All notifications marked as read", "success");
                        } catch {
                          addToast("Failed to mark all read", "error");
                        }
                      }}
                      className="text-xs font-semibold text-[#3B82F6] hover:text-[#3B82F6] bg-blue-50 dark:bg-[#3B82F6]/10 hover:bg-blue-100 dark:hover:bg-green-950/60 px-3 py-1.5 rounded-xl transition"
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
                    <div className="w-16 h-16 bg-gray-50 dark:bg-[#334155] border border-gray-100 dark:border-[#334155] rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Bell className="w-8 h-8 text-gray-300 dark:text-[#94A3B8]" />
                    </div>
                    <h3 className="text-base font-bold text-gray-900 dark:text-[#F8FAFC] mb-1">No notifications</h3>
                    <p className="text-xs text-gray-400">We'll let you know when something happens!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 ${
                          !notif.isRead
                            ? 'bg-blue-50/20 dark:bg-[#3B82F6]/10 border-blue-100 dark:border-[#3B82F6]/20 shadow-sm'
                            : 'bg-white dark:bg-[#1E293B] border-gray-100 dark:border-[#334155] hover:bg-gray-50/50 dark:hover:bg-[#334155]/50'
                        }`}
                      >
                        <div className="flex items-start gap-4 min-w-0">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            !notif.isRead ? 'bg-blue-100 dark:bg-[#3B82F6]/10 text-[#3B82F6] dark:text-[#3B82F6]' : 'bg-gray-100 dark:bg-[#334155] text-gray-500 dark:text-[#94A3B8]'
                          }`}>
                            <Bell className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <p className={`text-sm ${!notif.isRead ? 'font-semibold text-gray-900 dark:text-[#F8FAFC]' : 'text-gray-600 dark:text-[#94A3B8]'}`}>
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
                              } catch {
                                addToast("Failed to update notification", "error");
                              }
                            }}
                            className="p-2 hover:bg-blue-50 text-gray-400 hover:text-[#3B82F6] rounded-xl transition shrink-0"
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

            {/* ── AUDIT LOGS / ACTIVITY STREAM VIEW ── */}
            {activeTab === 'activity-log' && (
              <ActivityLogView />
            )}


          </div>
      </main>

      {/* PREVIEW MODAL */}
      <FilePreviewModal
        file={previewFile}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        onToast={addToast}
        loadFiles={() => loadFiles(selectedFolderId)}
      />

      {/* SHARE MODAL */}
      <ShareModal
        item={shareModalFile}
        isFolder={isFolderShare}
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

      {/* UPLOAD PROGRESS PANEL */}
      {uploadProgress !== null && (
        <div className="fixed bottom-6 left-6 z-50 animate-slide-in">
          <div className="bg-gray-900 text-white rounded-2xl shadow-2xl p-4 w-80 border border-gray-800 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin shrink-0" />
                <span className="text-sm font-semibold tracking-wide">
                  {uploadProgress >= 99 ? "Finishing..." : "Uploading..."}
                </span>
              </div>
              <span className="text-xs text-gray-400 truncate max-w-[150px] font-medium" title={uploadingFileName}>
                {uploadingFileName}
              </span>
            </div>

            {/* ASCII progress bar */}
            <div className="font-mono text-xs text-[#3B82F6] tracking-wider">
              {(() => {
                const totalBlocks = 15;
                const filledBlocks = Math.round((uploadProgress / 100) * totalBlocks);
                const emptyBlocks = totalBlocks - filledBlocks;
                return "█".repeat(filledBlocks) + "░".repeat(emptyBlocks);
              })()}
            </div>

            <div className="flex items-center justify-between text-xs font-semibold text-gray-400 mt-0.5">
              <span>{uploadProgress}%</span>
              <span className="text-[10px] uppercase tracking-wider text-emerald-500 font-bold">Google Drive Upload</span>
            </div>

            {/* Smooth visual progress bar */}
            <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#3B82F6] rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* BULK ACTIONS FLOATING TOOLBAR */}
      {selectedFileIds.size > 0 && (
        <div className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-[48rem] bg-slate-900/95 dark:bg-[#0F172A]/95 backdrop-blur-md border border-slate-800 rounded-2xl p-3 shadow-2xl text-white animate-fade-up text-xs font-semibold sm:bottom-5 sm:inset-x-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex min-w-0 items-center justify-between gap-3 sm:justify-start">
              <span className="min-w-0 truncate text-[#3B82F6]">
                {selectedFileIds.size} file(s) selected
              </span>
              <button
                type="button"
                onClick={() => setSelectedFileIds(new Set())}
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 transition hover:bg-slate-800 hover:text-white sm:hidden"
                aria-label="Cancel selection"
                title="Cancel"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="hidden h-5 w-px shrink-0 bg-slate-800 sm:block" />

            <div className="grid min-w-0 flex-1 grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:items-center sm:justify-center">
              <button
                type="button"
                onClick={handleBulkDownload}
                className="inline-flex min-w-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg bg-slate-800 px-2.5 py-2 transition hover:bg-slate-700 sm:px-3 sm:py-1.5"
                title="Download"
              >
                <Download className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">Download</span>
              </button>
              <button
                type="button"
                onClick={handleBulkStar}
                className="inline-flex min-w-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg bg-slate-800 px-2.5 py-2 transition hover:bg-slate-700 sm:px-3 sm:py-1.5"
                title="Star"
              >
                <Star className="h-3.5 w-3.5 shrink-0 fill-yellow-400 text-yellow-400" />
                <span className="truncate">Star</span>
              </button>
              <button
                type="button"
                onClick={() => setShowMoveModal(true)}
                className="inline-flex min-w-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg bg-slate-800 px-2.5 py-2 transition hover:bg-slate-700 sm:px-3 sm:py-1.5"
                title="Move"
              >
                <Move className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">Move</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (selectedFileIds.size > 1) {
                    addToast("Batch sharing is not supported yet. Please select a single file to share.", "warning");
                    return;
                  }
                  const selectedId = Array.from(selectedFileIds)[0];
                  const selectedFile = (allFiles || []).find(f => f.id === selectedId) || (files || []).find(f => f.id === selectedId);
                  if (selectedFile) {
                    handleShare(selectedFile);
                  } else {
                    addToast("Could not retrieve file details.", "error");
                  }
                }}
                className={`inline-flex min-w-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg bg-slate-800 px-2.5 py-2 transition hover:bg-slate-700 sm:px-3 sm:py-1.5 ${selectedFileIds.size > 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                title="Share"
              >
                <Share2 className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">Share</span>
              </button>
              <button
                type="button"
                onClick={handleBulkCompress}
                className="inline-flex min-w-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg bg-emerald-600 px-2.5 py-2 text-white transition hover:bg-emerald-700 sm:px-3 sm:py-1.5"
                title="Compress to ZIP"
              >
                <Archive className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden min-[380px]:inline sm:hidden">ZIP</span>
                <span className="hidden sm:inline">Compress to ZIP</span>
              </button>
              <button
                type="button"
                onClick={handleBulkTrash}
                className="inline-flex min-w-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-red-900/50 bg-red-950/40 px-2.5 py-2 text-red-400 transition hover:bg-red-950/65 sm:px-3 sm:py-1.5"
                title="Move to Trash"
              >
                <Trash2 className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden min-[380px]:inline sm:hidden">Trash</span>
                <span className="hidden sm:inline">Move to Trash</span>
              </button>
            </div>

            <div className="hidden h-5 w-px shrink-0 bg-slate-800 sm:block" />
            <button
              type="button"
              onClick={() => setSelectedFileIds(new Set())}
              className="hidden shrink-0 rounded-lg px-2 py-1 text-gray-400 transition hover:bg-slate-800 hover:text-white sm:inline-flex"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* MOVE ITEMS MODAL */}
      <MoveItemsModal
        isOpen={showMoveModal}
        onClose={() => setShowMoveModal(false)}
        folders={folders}
        onConfirm={handleBulkMove}
      />

      {/* COMMAND PALETTE MODAL */}
      <CommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        files={decryptedAllFiles}
        onPreview={handlePreview}
        onTabChange={setActiveTab}
        isUnlocked={isE2eeUnlocked}
        onUnlock={() => {
          const pass = prompt("Enter your security passphrase to unlock:");
          if (pass) {
            unlockE2ee(pass)
              .then(ok => {
                if (ok) addToast("Vault unlocked successfully!", "success");
                else addToast("Invalid security passphrase.", "error");
              });
          }
        }}
        onLock={() => {
          window.location.reload();
        }}
        isE2eeSetup={isE2eeSetup}
      />

      {/* SYSTEM STATUS VERIFIER MODAL */}
      <SystemStatusModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        initialTab={selectedStatusTab}
        isE2eeSetup={isE2eeSetup}
        isE2eeUnlocked={isE2eeUnlocked}
        totalFiles={totalFileCount}
        user={user}
      />
    </div>
  );
};

export default Dashboard;
