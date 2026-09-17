import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Plus } from 'lucide-react';

import useToast from '../toast/useToast';
import Toast from '../toast/Toast';

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
import NewFolderModal from '../modals/NewFolderModal';
import NewDocumentModal from '../modals/NewDocumentModal';
import UploadModal from '../modals/UploadModal';
import ProfileModal from '../modals/ProfileModal';
import { DEFAULT_STORAGE } from '../../../utils/constants';
import { computeUsedGB, getActiveFolderId, normalizeFile } from '../../../utils/fileHelpers';
import { fetchFiles } from '../../../store/slices/filesSlice';
import { fetchFolders, deleteExistingFolder } from '../../../store/slices/foldersSlice';


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
  onMoveFile,
  onShareFolder,
  onOpenWorkspace,
}) => {
  const dispatch = useDispatch();
  const profile = useSelector((state) => state.auth.user);
  const reduxFolders = useSelector((state) => state.folders.folders);
  const reduxFiles = useSelector((state) => state.files.files);
  const reduxFoldersLoading = useSelector((state) => state.folders.loading);

  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < 1024
  );
  const folders = syncFolders ? (foldersFromParent ?? []) : reduxFolders;
  const selectedFolderId = getActiveFolderId(activeTab);
  const files = syncFiles ? filesFromParent : reduxFiles;
  const statsFiles = allFilesFromParent ?? files;
  const [fallbackStorageData, setFallbackStorageData] = useState(DEFAULT_STORAGE);
  const storageData = storageDataProp || fallbackStorageData;

  const showFoldersLoading = syncFolders ? foldersLoadingFromParent : reduxFoldersLoading;
  const [showNewMenu, setShowNewMenu] = useState(false);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [showNewDocument, setShowNewDocument] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [deletingFolderId, setDeletingFolderId] = useState(null);

  const { toasts, toast, removeToast } = useToast();

  const expanded = !sidebarCollapsed || isMobile;
  const closeMobile = () => isMobile && setIsMobileMenuOpen(false);

  useEffect(() => {
    let timeoutId = null;
    const check = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const mobile = window.innerWidth < 1024;
        setIsMobile(mobile);
        if (mobile) {
          setIsMobileMenuOpen(false);
        }
      }, 150);
    };
    window.addEventListener('resize', check, { passive: true });
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', check);
    };
  }, [setIsMobileMenuOpen]);

  useEffect(() => {
    if (!syncFolders) {
      dispatch(fetchFolders());
    }
    if (!syncFiles) {
      dispatch(fetchFiles()).then((result) => {
        if (fetchFiles.fulfilled.match(result)) {
          const usedGB = computeUsedGB(result.payload);
          if (usedGB > 0) setFallbackStorageData((p) => ({ ...p, used: usedGB }));
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

  const sidebarBody = (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 pb-28 md:pb-4">
        <div className="relative" data-newmenu>
          <button
            onClick={() => setShowNewMenu((p) => !p)}
            className="w-full h-11 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-lg flex items-center justify-center gap-2 transition font-medium shadow-xs active:scale-[0.99] cursor-pointer"
          >
            <Plus className="w-5 h-5 text-white" />
            {expanded && <span className="text-white font-medium">New</span>}
          </button>
          {showNewMenu && (
            <NewMenu
              onNewDocument={() => setShowNewDocument(true)}
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
          onMoveFile={onMoveFile}
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
            onMoveFile={onMoveFile}
            onShareFolder={onShareFolder}
            onNavigate={closeMobile}
          />
        )}

        {expanded && (
          <SidebarFilters
            files={statsFiles}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onNavigate={closeMobile}
          />
        )}

        {expanded && <SidebarStorage storageData={storageData} files={statsFiles} />}

        {expanded && (
          <SidebarMore
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onNavigate={closeMobile}
          />
        )}
      </div>
    </div>
  );

  const modals = (
    <>
      {showNewDocument && (
        <NewDocumentModal
          isOpen={showNewDocument}
          onClose={() => setShowNewDocument(false)}
          folderId={selectedFolderId}
          onCreated={(f) => {
            const file = normalizeFile(f);
            if (onFileUploaded) {
              onFileUploaded(file);
              onFilesChanged?.();
            }
            onOpenWorkspace?.(file);
          }}
          toast={toast}
        />
      )}
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
      <div className="lg:hidden">
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

      <div className="hidden lg:block">
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

export default React.memo(Sidebar);
