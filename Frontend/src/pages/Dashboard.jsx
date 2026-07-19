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
  FILE_TYPES,
  getFileType,
  ANALYTICS_CATEGORIES,
  formatFileSize,
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

// Extracted Modular Components
import StorageAnalyticsView from '../components/dashboard/StorageAnalyticsView';
import NotificationsView from '../components/dashboard/NotificationsView';
import FileCard from '../components/dashboard/files/FileCard';
import FileRow from '../components/dashboard/files/FileRow';
import SuggestedFileCard from '../components/dashboard/files/SuggestedFileCard';
import UploadButton from '../components/dashboard/files/UploadButton';
import CommandPaletteModal from '../components/dashboard/modals/CommandPaletteModal';
import MoveItemsModal from '../components/dashboard/modals/MoveItemsModal';
import SystemStatusModal from '../components/dashboard/modals/SystemStatusModal';

const ToastIcon = ({ type }) => {
  if (type === 'success') return <CheckCircle2 className="w-5 h-5 text-[#3B82F6] shrink-0" />;
  if (type === 'error') return <XCircle className="w-5 h-5 text-red-400    shrink-0" />;
  return <AlertCircle className="w-5 h-5 text-amber-400  shrink-0" />;
};

const Toast = ({ toast, onRemove }) => (
  <div
    className={`
      flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl border backdrop-blur-md
      text-sm font-medium text-white min-w-[280px] max-w-sm
      animate-slide-in
      ${toast.type === 'success' ? 'bg-gray-900/95 border-emerald-500/30' : ''}
      ${toast.type === 'error' ? 'bg-gray-900/95 border-red-500/30' : ''}
      ${toast.type === 'info' ? 'bg-gray-900/95 border-amber-500/30' : ''}
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

const getPercent = (value, total) => total > 0 ? (value / total) * 100 : 0;

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
  const unreadCount = useMemo(() => notifications.filter(n => !n.isRead && !n.read).length, [notifications]);

  // Local UI States
  const [previewFile, setPreviewFile] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('my-drive');
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
        activeTab={activeTab}
        setActiveTab={setActiveTab}
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
        className={`w-full md:w-auto pt-14 md:pt-16 transition-all duration-300 ${sidebarCollapsed ? 'md:ml-20' : 'md:ml-72'
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
                            className={`w-7 h-7 rounded-full border-2 bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center text-white text-[10px] font-extrabold overflow-hidden shadow-xs hover:translate-y-[-2px] transition duration-200 ${collab.status === 'online'
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
                  className="mt-3.5 inline-flex items-center gap-2 px-4.5 py-2 rounded-full text-xs font-extrabold text-gray-600 hover:text-gray-900 dark:text-slate-300 dark:hover:text-white bg-gray-50 hover:bg-gray-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-gray-150 dark:border-slate-750 transition-all duration-300 hover:-translate-x-0.5 active:scale-95 shadow-3xs hover:shadow-2xs cursor-pointer"
                >
                  <span className="text-sm font-black">←</span> Back to My Drive
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
            <NotificationsView
              notifications={notifications}
              loading={notificationsLoading}
              unreadCount={unreadCount}
              onMarkAsRead={(id) => dispatch(readNotification(id))}
              onMarkAllAsRead={() => dispatch(readAllNotifications())}
            />
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
              isE2eeUnlocked={isE2eeUnlocked}
              isE2eeSetup={isE2eeSetup}
              allFiles={allFiles}
              folders={folders}
              onPreview={(file) => { setPreviewFile(file); setIsPreviewOpen(true); }}
              onDelete={handleDelete}
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
