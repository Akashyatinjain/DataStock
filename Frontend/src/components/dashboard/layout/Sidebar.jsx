import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '../../../store/slices/authSlice';
import { fetchFiles } from '../../../store/slices/filesSlice';
import { fetchFolders, deleteExistingFolder } from '../../../store/slices/foldersSlice';
import { DEFAULT_STORAGE } from '../../../utils/constants';
import {
  computeUsedGB,
  normalizeFile,
  getActiveFolderId,
} from '../../../utils/fileHelpers';

import useToast from '../toast/useToast';
import Toast from '../toast/Toast';
import NewFolderModal from '../modals/NewFolderModal';
import UploadModal from '../modals/UploadModal';
import ProfileModal from '../modals/ProfileModal';

import NewMenu from './NewMenu';
import SidebarNav from './SidebarNav';
import SidebarFolders from './SidebarFolders';
import SidebarFilters from './SidebarFilters';
import SidebarStorage from './SidebarStorage';
import SidebarMore from './SidebarMore';
import {
  MobileSidebarOverlay,
  MobileSidebarPanel,
  DesktopSidebarPanel,
} from './MobileSidebar';

const Sidebar = ({
  sidebarCollapsed,
  setSidebarCollapsed,
  activeTab,
  setActiveTab,
  storageData: storageDataProp,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  files: filesFromParent,
  allFiles: allFilesFromParent,
  syncFiles = false,
  onFilesChanged,
  folders: foldersFromParent,
  syncFolders = false,
  foldersLoading: foldersLoadingFromParent = false,
  onFileUploaded,
  onFolderCreated,
  onFolderDeleted,
}) => {
  const dispatch = useDispatch();
  const profile = useSelector((state) => state.auth.user);
  const reduxFolders = useSelector((state) => state.folders.folders);
  const reduxFiles = useSelector((state) => state.files.files);
  const reduxFoldersLoading = useSelector((state) => state.folders.loading);

  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < 768
  );
  const folders = syncFolders ? (foldersFromParent ?? []) : reduxFolders;
  const selectedFolderId = getActiveFolderId(activeTab);
  const files = syncFiles ? filesFromParent : reduxFiles;
  const statsFiles = allFilesFromParent ?? files;
  const [storageData, setStorageData] = useState(storageDataProp || DEFAULT_STORAGE);

  const showFoldersLoading = syncFolders ? foldersLoadingFromParent : reduxFoldersLoading;
  const [showNewMenu, setShowNewMenu] = useState(false);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [deletingFolderId, setDeletingFolderId] = useState(null);

  const { toasts, toast, removeToast } = useToast();

  const expanded = !sidebarCollapsed || isMobile;
  const closeMobile = () => isMobile && setIsMobileMenuOpen(false);

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsMobileMenuOpen(false);
      }
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [setIsMobileMenuOpen]);

  useEffect(() => {
    if (storageDataProp) setStorageData(storageDataProp);
  }, [storageDataProp]);

  useEffect(() => {
    if (!syncFolders) {
      dispatch(fetchFolders());
    }
    if (!syncFiles) {
      dispatch(fetchFiles()).then((result) => {
        if (fetchFiles.fulfilled.match(result)) {
          const usedGB = computeUsedGB(result.payload);
          if (usedGB > 0) setStorageData((p) => ({ ...p, used: usedGB }));
        }
      });
    }
  }, [dispatch, syncFiles, syncFolders]);

  useEffect(() => {
    if (!showNewMenu) return;
    const handler = (e) => {
      if (!e.target.closest('[data-newmenu]')) setShowNewMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showNewMenu]);

  const handleDeleteFolder = async (e, folderId) => {
    e.stopPropagation();
    if (!window.confirm('Delete this folder?')) return;
    setDeletingFolderId(folderId);
    const result = await dispatch(deleteExistingFolder(folderId));
    if (deleteExistingFolder.fulfilled.match(result)) {
      onFolderDeleted?.(folderId);
      if (activeTab === `folder-${folderId}`) setActiveTab('my-drive');
      toast('success', 'Folder deleted');
    } else {
      toast('error', result.payload || 'Failed to delete folder');
    }
    setDeletingFolderId(null);
  };

  const handleLogout = async () => {
    await dispatch(logoutUser());
    window.location.href = '/login';
  };

  const sidebarBody = (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4">
        <div className="relative" data-newmenu>
          <button
            onClick={() => setShowNewMenu((p) => !p)}
            className="w-full bg-green-600 hover:bg-green-700 text-white rounded-2xl py-3 flex items-center justify-center gap-2 transition font-medium shadow-sm"
          >
            <Plus className="w-5 h-5" />
            {expanded && <span>New</span>}
          </button>
          {showNewMenu && (
            <NewMenu
              onNewFolder={() => setShowNewFolder(true)}
              onUpload={() => setShowUpload(true)}
              onClose={() => setShowNewMenu(false)}
            />
          )}
        </div>

        <SidebarNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          sidebarCollapsed={sidebarCollapsed}
          isMobile={isMobile}
          onNavigate={closeMobile}
        />

        {expanded && (
          <SidebarFolders
            folders={folders}
            loading={showFoldersLoading}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            deletingFolderId={deletingFolderId}
            onDeleteFolder={handleDeleteFolder}
            onNewFolder={() => setShowNewFolder(true)}
          />
        )}

        {expanded && (
          <SidebarFilters files={statsFiles} activeTab={activeTab} setActiveTab={setActiveTab} />
        )}

        {expanded && <SidebarStorage storageData={storageData} files={statsFiles} />}

        {expanded && (
          <SidebarMore activeTab={activeTab} setActiveTab={setActiveTab} />
        )}
      </div>
    </div>
  );

  const modals = (
    <>
      {showNewFolder && (
        <NewFolderModal
          onClose={() => setShowNewFolder(false)}
          onCreated={(f) => {
            onFolderCreated?.(f);
          }}
          toast={toast}
        />
      )}
      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          folderId={selectedFolderId}
          onUploaded={(f) => {
            const file = normalizeFile(f);
            if (onFileUploaded) {
              onFileUploaded(file);
              onFilesChanged?.();
            }
          }}
          toast={toast}
        />
      )}
      {showProfile && (
        <ProfileModal
          profile={profile}
          onClose={() => setShowProfile(false)}
          onUpdated={() => {}}
          toast={toast}
        />
      )}
      <Toast toasts={toasts} removeToast={removeToast} />
    </>
  );

  return (
    <>
      <div className="md:hidden">
        <MobileSidebarOverlay
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
        />
        <MobileSidebarPanel
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
        >
          {sidebarBody}
        </MobileSidebarPanel>
      </div>

      <div className="hidden md:block">
        <DesktopSidebarPanel
          sidebarCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        >
          {sidebarBody}
        </DesktopSidebarPanel>
      </div>

      {modals}
    </>
  );
};

export default Sidebar;
