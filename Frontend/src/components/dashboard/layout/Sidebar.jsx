import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';

import { getFolders, deleteFolder } from '../../../api/folder.api';
import { getFiles } from '../../../api/file.api';
import { getProfile } from '../../../api/auth.api';
import { clearAuth } from '../../../utils/auth';
import { DEFAULT_STORAGE } from '../../../utils/constants';
import {
  normalizeList,
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
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < 768
  );
  const [localFolders, setLocalFolders] = useState([]);
  const folders = syncFolders ? (foldersFromParent ?? []) : localFolders;
  const selectedFolderId = getActiveFolderId(activeTab);
  const [localFiles, setLocalFiles] = useState([]);
  const files = syncFiles ? filesFromParent : localFiles;
  const statsFiles = allFilesFromParent ?? files;
  const [profile, setProfile] = useState(null);
  const [storageData, setStorageData] = useState(storageDataProp || DEFAULT_STORAGE);

  const [loadingFolders, setLoadingFolders] = useState(!syncFolders);
  const showFoldersLoading = syncFolders ? foldersLoadingFromParent : loadingFolders;
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
    if (syncFolders) {
      setLoadingFolders(false);
    } else {
      fetchFolders();
    }
    fetchProfile();
    if (!syncFiles) fetchFiles();
  }, [syncFiles, syncFolders]);

  useEffect(() => {
    if (!showNewMenu) return;
    const handler = (e) => {
      if (!e.target.closest('[data-newmenu]')) setShowNewMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showNewMenu]);

  const fetchFolders = async () => {
    setLoadingFolders(true);
    try {
      const data = await getFolders();
      setLocalFolders(normalizeList(data, 'folders'));
    } catch {
      toast('error', 'Could not load folders');
    } finally {
      setLoadingFolders(false);
    }
  };

  const fetchFiles = async () => {
    try {
      const data = await getFiles();
      const list = normalizeList(data, 'files').map(normalizeFile);
      setLocalFiles(list);
      const usedGB = computeUsedGB(list);
      if (usedGB > 0) setStorageData((p) => ({ ...p, used: usedGB }));
    } catch {
      // non-critical for sidebar
    }
  };

  const fetchProfile = async () => {
    try {
      const { data } = await getProfile();
      setProfile(data.user || data);
    } catch {
      // non-critical for sidebar
    }
  };

  const handleDeleteFolder = async (e, folderId) => {
    e.stopPropagation();
    if (!window.confirm('Delete this folder?')) return;
    setDeletingFolderId(folderId);
    try {
      await deleteFolder(folderId);
      if (!syncFolders) {
        setLocalFolders((p) => p.filter((f) => (f._id || f.id) !== folderId));
      }
      onFolderDeleted?.(folderId);
      if (activeTab === `folder-${folderId}`) setActiveTab('my-drive');
      toast('success', 'Folder deleted');
    } catch {
      toast('error', 'Failed to delete folder');
    } finally {
      setDeletingFolderId(null);
    }
  };

  const handleLogout = async () => {
    await clearAuth();
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

      {/* {expanded && (
        <SidebarProfile
          profile={profile}
          onEditProfile={() => setShowProfile(true)}
          onLogout={handleLogout}
        />
      )} */}
    </div>
  );

  const modals = (
    <>
      {showNewFolder && (
        <NewFolderModal
          onClose={() => setShowNewFolder(false)}
          onCreated={(f) => {
            if (!syncFolders) setLocalFolders((p) => [...p, f]);
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
            } else {
              setLocalFiles((p) => [file, ...p]);
            }
          }}
          toast={toast}
        />
      )}
      {showProfile && (
        <ProfileModal
          profile={profile}
          onClose={() => setShowProfile(false)}
          onUpdated={(p) => setProfile(p)}
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
