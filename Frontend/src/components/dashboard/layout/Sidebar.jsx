
import React, { useState, useEffect, useRef } from 'react';
import {
  HardDrive, Users, Clock, Star, Plus, ChevronRight,
  Trash2, Archive, Cloud, X, Menu, Folder, Image,
  Video, FileText, FileArchive, Settings, LogOut,
  Check, AlertCircle, Loader2, Upload, FolderPlus,
} from 'lucide-react';

const API = 'http://localhost:5000/api';

// ─── helpers ────────────────────────────────────────────────────────────────
const apiFetch = async (
  path,
  opts = {}
) => {

  const res = await fetch(
    `${API}${path}`,
    {

      credentials: 'include',

      headers: {
        'Content-Type':
          'application/json',

        ...opts.headers
      },

      ...opts,
    }
  );

  if (!res.ok) {

    let errorMessage =
      `${res.status} ${res.statusText}`;

    try {

      const errorData =
        await res.json();

      errorMessage =
        errorData.message ||
        errorMessage;

    } catch {}

    throw new Error(errorMessage);
  }

  return res.json();
};

// ─── Toast ───────────────────────────────────────────────────────────────────
const Toast = ({ toasts, removeToast }) => (
  <div className="fixed bottom-6 right-6 z-[999] flex flex-col gap-2 pointer-events-none">
    {toasts.map((t) => (
      <div
        key={t.id}
        className={`
          flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl text-sm font-medium
          pointer-events-auto transition-all duration-300
          ${t.type === 'error'   ? 'bg-red-50 text-red-700 border border-red-200'   : ''}
          ${t.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : ''}
          ${t.type === 'info'    ? 'bg-blue-50 text-blue-700 border border-blue-200'  : ''}
        `}
      >
        {t.type === 'error'   && <AlertCircle className="w-4 h-4 shrink-0" />}
        {t.type === 'success' && <Check className="w-4 h-4 shrink-0" />}
        {t.type === 'info'    && <Loader2 className="w-4 h-4 shrink-0 animate-spin" />}
        <span>{t.msg}</span>
        <button onClick={() => removeToast(t.id)} className="ml-1 hover:opacity-60">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    ))}
  </div>
);

// ─── New Folder Modal ────────────────────────────────────────────────────────
const NewFolderModal = ({ onClose, onCreated, toast }) => {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const data = await apiFetch('/folders', {
        method: 'POST',
        body: JSON.stringify({ name: name.trim() }),
      });
      toast('success', `Folder "${name.trim()}" created`);
      onCreated(
  data.folder || data
);
      onClose();
    } catch (e) {
      toast('error', 'Failed to create folder');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl p-6 w-80 border border-gray-100">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-gray-900">New Folder</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <input
          ref={inputRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          placeholder="Folder name"
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 mb-4"
        />
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-gray-200 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim() || loading}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-green-600 hover:bg-green-700 text-white transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Create
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Upload Modal ────────────────────────────────────────────────────────────
const UploadModal = ({ onClose, onUploaded, toast }) => {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch(

  `${API}/files/upload`,

  {
    method: 'POST',

    body: form,

    credentials: 'include'
  }
);
      if (!res.ok) throw new Error();
      const data = await res.json();
      toast('success', `"${file.name}" uploaded`);
      onUploaded?.(
  data.file || data
);
      onClose();
    } catch {
      toast('error', 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl p-6 w-80 border border-gray-100">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-gray-900">Upload File</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`
            border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition mb-4
            ${dragging ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-400 hover:bg-gray-50'}
          `}
        >
          <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          {file
            ? <p className="text-sm font-medium text-gray-700 truncate">{file.name}</p>
            : <p className="text-sm text-gray-500">Drop a file or <span className="text-green-600 font-medium">browse</span></p>
          }
          <input ref={inputRef} type="file" className="hidden" onChange={(e) => setFile(e.target.files[0])} />
        </div>

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-gray-200 hover:bg-gray-50 transition">
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || loading}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-green-600 hover:bg-green-700 text-white transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Upload
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Profile Settings Modal ──────────────────────────────────────────────────
const ProfileModal = ({ profile, onClose, onUpdated, toast }) => {
  const [form, setForm] = useState({ name: profile?.name || '', email: profile?.email || '' });
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/user/profile', {
        method: 'PUT',
        body: JSON.stringify(form),
      });
      toast('success', 'Profile updated');
      onUpdated(data);
      onClose();
    } catch {
      toast('error', 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl p-6 w-80 border border-gray-100">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-gray-900">Edit Profile</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="space-y-3 mb-5">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Email</label>
            <input
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-gray-200 hover:bg-gray-50 transition">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-green-600 hover:bg-green-700 text-white transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── New Action Menu ─────────────────────────────────────────────────────────
const NewMenu = ({ onNewFolder, onUpload, onClose }) => (
  <div className="absolute top-14 left-4 z-[100] bg-white border border-gray-100 rounded-2xl shadow-xl py-2 w-48">
    <button
      onClick={() => { onNewFolder(); onClose(); }}
      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
    >
      <FolderPlus className="w-4 h-4 text-yellow-500" />
      New Folder
    </button>
    <button
      onClick={() => { onUpload(); onClose(); }}
      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
    >
      <Upload className="w-4 h-4 text-green-500" />
      Upload File
    </button>
  </div>
);

// ─── Main Sidebar ────────────────────────────────────────────────────────────
const Sidebar = ({
  sidebarCollapsed,
  setSidebarCollapsed,
  activeTab,
  setActiveTab,
  storageData: storageDataProp,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
}) => {
  const [isMobile, setIsMobile] = useState(false);

  // — API state —
  const [folders, setFolders]     = useState([]);
  const [files, setFiles]         = useState([]);
  const [profile, setProfile]     = useState(null);
  const [storageData, setStorageData] = useState(storageDataProp || { used: 0, total: 15 });

  // — UI state —
  const [loadingFolders, setLoadingFolders] = useState(true);
  const [showNewMenu, setShowNewMenu]       = useState(false);
  const [showNewFolder, setShowNewFolder]   = useState(false);
  const [showUpload, setShowUpload]         = useState(false);
  const [showProfile, setShowProfile]       = useState(false);
  const [deletingFolderId, setDeletingFolderId] = useState(null);

  // — Toasts —
  const [toasts, setToasts] = useState([]);
  const toastId = useRef(0);
  const addToast = (type, msg) => {
    const id = ++toastId.current;
    setToasts((p) => [...p, { id, type, msg }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4000);
  };
  const removeToast = (id) => setToasts((p) => p.filter((t) => t.id !== id));

  // — Mobile detection —
  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setSidebarCollapsed(mobile ? true : false);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [setSidebarCollapsed]);

  // — Sync storageDataProp with local state —
  useEffect(() => {
    if (storageDataProp) {
      setStorageData(storageDataProp);
    }
  }, [storageDataProp]);

  // — Fetch on mount —
  useEffect(() => {
    fetchFolders();
    fetchFiles();
    fetchProfile();
  }, []);

  const fetchFolders = async () => {
    setLoadingFolders(true);
    try {
      const data = await apiFetch('/folders');
      setFolders(Array.isArray(data) ? data : data.folders || []);
    } catch {
      addToast('error', 'Could not load folders');
    } finally {
      setLoadingFolders(false);
    }
  };
const handleLogout = async () => {

  try {

    await apiFetch(
      '/auth/logout',
      {
        method: 'POST'
      }
    );

    window.location.href =
      '/login';

  } catch (e) {

    addToast(
      'error',
      e.message
    );
  }
};
  const fetchFiles = async () => {
    try {
      const data = await apiFetch('/files');
      const list = Array.isArray(data) ? data : data.files || [];
      setFiles(list);
      // Compute used storage from files if API doesn't return it
      const usedBytes = list.reduce((acc, f) => acc + (f.size || 0), 0);
      const usedGB =
  +(
    usedBytes /
    (1024 * 1024 * 1024)
  ).toFixed(2);
      if (usedGB > 0) setStorageData((p) => ({ ...p, used: usedGB }));
    } catch {
      // silently fail for files; not critical for sidebar
    }
  };

  const fetchProfile = async () => {
    try {
      const data = await apiFetch('/user/profile');
setProfile(
  data.user || data
);    } catch {
      // silently fail
    }
  };

  const handleDeleteFolder = async (e, folderId) => {
    e.stopPropagation();
    if (!window.confirm('Delete this folder?')) return;
    setDeletingFolderId(folderId);
    try {
      await apiFetch(`/folders/${folderId}`, { method: 'DELETE' });
      setFolders((p) => p.filter((f) => f._id !== folderId && f.id !== folderId));
      
      // Fix: Reset active tab if we deleted the current active folder
      if (activeTab === `folder-${folderId}`) {
        setActiveTab('my-drive');
      }

      addToast('success', 'Folder deleted');
    } catch {
      addToast('error', 'Failed to delete folder');
    } finally {
      setDeletingFolderId(null);
    }
  };

  // Close new-menu on outside click
  useEffect(() => {
    if (!showNewMenu) return;
    const handler = (e) => {
      if (!e.target.closest('[data-newmenu]')) setShowNewMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showNewMenu]);

  // ── counts ──
  const imageCount = files.filter((f) => f.type?.startsWith('image') || f.mimetype?.startsWith('image')).length;
  const totalFiles = files.length;

  const navItems = [
    { id: 'my-drive', label: 'My Drive',  icon: HardDrive },
    { id: 'shared',   label: 'Shared',    icon: Users },
    { id: 'recent',   label: 'Recent',    icon: Clock },
    { id: 'starred',  label: 'Starred',   icon: Star },
  ];

 const quickFilters = [

  {
    name: 'Images',

    icon: Image,

    color: 'text-blue-500',

    filter: (f) =>

      (
        f.type ||
        f.mimeType ||
        f.mimetype ||
        ''
      )

      .startsWith('image')
  },

  {
    name: 'Videos',

    icon: Video,

    color: 'text-purple-500',

    filter: (f) =>

      (
        f.type ||
        f.mimeType ||
        f.mimetype ||
        ''
      )

      .startsWith('video')
  },

  {
    name: 'PDFs',

    icon: FileText,

    color: 'text-red-500',

    filter: (f) =>

      (
        f.type ||
        f.mimeType ||
        f.mimetype ||
        ''
      )

      .includes('pdf')
  },

  {
    name: 'ZIP Files',

    icon: FileArchive,

    color: 'text-yellow-500',

    filter: (f) =>

      (
        f.originalName ||
        f.name ||
        f.filename ||
        ''
      )

      .toLowerCase()

      .includes('.zip')
  }
];

  const moreItems = [
    { id: 'trash',   label: 'Trash',   icon: Trash2 },
    { id: 'archive', label: 'Archive', icon: Archive },
  ];

  const displayName  = profile?.name  || 'User';
  const displayEmail = profile?.email || '';
  const avatarUrl    = profile?.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=16a34a&color=fff`;

  // ── Sidebar body ──────────────────────────────────────────────────────────
  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4">

        {/* Mobile close */}
        {isMobile && (
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg md:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* NEW button */}
        <div className="relative" data-newmenu>
          <button
            onClick={() => setShowNewMenu((p) => !p)}
            className="w-full bg-green-600 hover:bg-green-700 text-white rounded-2xl py-3 flex items-center justify-center gap-2 transition font-medium shadow-sm"
          >
            <Plus className="w-5 h-5" />
            {(!sidebarCollapsed || isMobile) && <span>New</span>}
          </button>

          {showNewMenu && (
            <NewMenu
              onNewFolder={() => setShowNewFolder(true)}
              onUpload={() => setShowUpload(true)}
              onClose={() => setShowNewMenu(false)}
            />
          )}
        </div>

        {/* Main nav */}
        <nav className="mt-6 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  if (isMobile) setIsMobileMenuOpen(false);
                }}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition text-sm font-medium
                  ${activeTab === item.id ? 'bg-green-50 text-green-600' : 'text-gray-600 hover:bg-gray-100'}
                `}
              >
                <Icon className="w-5 h-5" />
                {(!sidebarCollapsed || isMobile) && (
                  <>
                    <span className="flex-1 text-left">{item.label}</span>
                    {activeTab === item.id && <div className="w-2 h-2 bg-green-500 rounded-full" />}
                  </>
                )}
              </button>
            );
          })}
        </nav>

        {/* Folders */}
        {(!sidebarCollapsed || isMobile) && (
          <>
            <div className="my-5 border-t border-gray-200" />
            <div>
              <div className="flex items-center justify-between mb-3 px-2">
                <p className="text-xs font-semibold tracking-wider text-gray-400 uppercase">Folders</p>
                <button
                  onClick={() => setShowNewFolder(true)}
                  className="text-green-600 hover:text-green-700"
                  title="New folder"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1">
                {loadingFolders ? (
                  <div className="flex items-center gap-2 px-3 py-2 text-xs text-gray-400">
                    <Loader2 className="w-4 h-4 animate-spin" /> Loading…
                  </div>
                ) : folders.length === 0 ? (
                  <p className="text-xs text-gray-400 px-3 py-2">No folders yet</p>
                ) : (
                  folders.map((folder) => {
                    const id = folder._id || folder.id;
                    const name = folder.name;
                    return (
                      // Fix: Changed outer interactive tag from button to div to solve nested button syntax error
                      <div
                        key={id}
                        onClick={() => setActiveTab(`folder-${id}`)}
                        className={`
                          group w-full flex items-center gap-3 px-3 py-2 rounded-xl transition text-sm cursor-pointer
                          ${activeTab === `folder-${id}` ? 'bg-green-50 text-green-700 font-medium' : 'text-gray-700 hover:bg-gray-100'}
                        `}
                      >
                        <Folder className="w-5 h-5 text-yellow-500 shrink-0" />
                        <span className="flex-1 text-left truncate">{name}</span>
                        <button
                          onClick={(e) => handleDeleteFolder(e, id)}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition rounded"
                          title="Delete folder"
                        >
                          {deletingFolderId === id
                            ? <Loader2 className="w-3 h-3 animate-spin" />
                            : <Trash2 className="w-3 h-3" />
                          }
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </>
        )}

        {/* Quick Filters */}
        {(!sidebarCollapsed || isMobile) && (
          <>
            <div className="my-5 border-t border-gray-200" />
            <div>
              <p className="text-xs font-semibold tracking-wider text-gray-400 uppercase px-2 mb-3">Quick Filters</p>
              <div className="space-y-1">
                {quickFilters.map((filter) => {
                  const Icon = filter.icon;
                  const count = files.filter(filter.filter).length;
                  return (
                    <button
                      key={filter.name}
                      onClick={() => setActiveTab(`filter-${filter.name.toLowerCase()}`)}
                      className={`
                        w-full flex items-center gap-3 px-3 py-2 rounded-xl transition text-sm
                        ${activeTab === `filter-${filter.name.toLowerCase()}` ? 'bg-green-50 text-green-700' : 'text-gray-700 hover:bg-gray-100'}
                      `}
                    >
                      <Icon className={`w-5 h-5 ${filter.color}`} />
                      <span className="flex-1 text-left">{filter.name}</span>
                      {count > 0 && (
                        <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">{count}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* Storage */}
        {(!sidebarCollapsed || isMobile) && (
          <>
            <div className="my-5 border-t border-gray-200" />
            <div className="px-2">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold tracking-wider text-gray-400 uppercase">Storage</p>
                <Cloud className="w-4 h-4 text-green-600" />
              </div>
              <div className="mb-2 flex justify-between text-xs">
                <span className="text-gray-600">{storageData.used} GB used</span>
                <span className="text-gray-400">{storageData.total} GB</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-600 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((storageData.used / storageData.total) * 100, 100)}%` }}
                />
              </div>

              <div className="grid grid-cols-2 gap-2 mt-4">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500">Files</p>
                  <h3 className="font-bold text-gray-900 mt-1">{totalFiles}</h3>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500">Images</p>
                  <h3 className="font-bold text-gray-900 mt-1">{imageCount}</h3>
                </div>
              </div>

              <div className="mt-5 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Cloud className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-semibold text-green-700">Free Plan</span>
                </div>
                <p className="text-xs text-gray-600 mb-4">Upgrade to Pro for 1TB storage</p>
                <button className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl py-2 text-sm font-medium transition">
                  Upgrade Now
                </button>
              </div>
            </div>
          </>
        )}

        {/* More */}
        {(!sidebarCollapsed || isMobile) && (
          <>
            <div className="my-5 border-t border-gray-200" />
            <div>
              <p className="text-xs font-semibold tracking-wider text-gray-400 uppercase px-2 mb-3">More</p>
              <div className="space-y-1">
                {moreItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`
                        w-full flex items-center gap-3 px-3 py-2 rounded-xl transition text-sm
                        ${activeTab === item.id ? 'bg-green-50 text-green-700' : 'text-gray-700 hover:bg-gray-100'}
                      `}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="flex-1 text-left">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Profile */}
      {(!sidebarCollapsed || isMobile) && (
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <img
              src={avatarUrl}
              alt="profile"
              className="w-11 h-11 rounded-full object-cover"
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm text-gray-900 truncate">{displayName}</h3>
              <p className="text-xs text-gray-500 truncate">{displayEmail}</p>
            </div>
            <button
              onClick={() => setShowProfile(true)}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
              title="Edit profile"
            >
              <Settings className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          <button
  onClick={handleLogout}
  className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gray-100 hover:bg-red-50 text-gray-700 hover:text-red-600 transition text-sm font-medium">
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      )}
    </div>
  );

  // ─── Modals + Toasts ───────────────────────────────────────────────────────
  const modals = (
    <>
      {showNewFolder && (
        <NewFolderModal
          onClose={() => setShowNewFolder(false)}
          onCreated={(f) => setFolders((p) => [...p, f])}
          toast={addToast}
        />
      )}
      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onUploaded={(f) => { setFiles((p) => [...p, f]); fetchFiles(); }}
          toast={addToast}
        />
      )}
      {showProfile && (
        <ProfileModal
          profile={profile}
          onClose={() => setShowProfile(false)}
          onUpdated={(p) => setProfile(p)}
          toast={addToast}
        />
      )}
      <Toast toasts={toasts} removeToast={removeToast} />
    </>
  );

  // ─── Mobile layout ─────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <>
        <div
          className={`fixed inset-0 bg-black/40 z-40 transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          onClick={() => setIsMobileMenuOpen(false)}
        />
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="fixed top-[72px] left-4 z-30 p-2 bg-white rounded-xl shadow border border-gray-200 md:hidden"
        >
          <Menu className="w-5 h-5 text-gray-700" />
        </button>
        <aside className={`fixed left-0 top-16 h-[calc(100vh-64px)] bg-white border-r border-gray-200 z-50 transition-transform duration-300 w-72 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          {sidebarContent}
        </aside>
        {modals}
      </>
    );
  }

  // ─── Desktop layout ────────────────────────────────────────────────────────
  return (
    <>
      {/* Fix: Added top-16 class to aside layout for perfect placement under headers */}
      <aside className={`fixed left-0 top-16 h-[calc(100vh-64px)] bg-white border-r border-gray-200 transition-all duration-300 ${sidebarCollapsed ? 'w-20' : 'w-72'}`}>
        {sidebarContent}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="absolute -right-3 top-20 w-7 h-7 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50 transition"
        >
          <ChevronRight className={`w-4 h-4 text-gray-500 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`} />
        </button>
      </aside>
      {modals}
    </>
  );
};

export default Sidebar;
