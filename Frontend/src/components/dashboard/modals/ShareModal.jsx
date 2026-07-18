import React, { useState, useEffect } from 'react';
import {
  X,
  Share2,
  Link2,
  Users,
  Copy,
  Check,
  Trash2,
  Loader2,
  Mail,
  Shield,
  Eye,
  Edit3,
  Globe,
  UserX,
  AlertCircle,
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchFileShares,
  shareFileWithUser,
  removeFileShare,
  createPublicLink,
  deletePublicLink,
  clearShareModalState,
  fetchPublicLinkInfo,
  fetchFolderShares,
  shareFolderWithUser,
  removeFolderShareThunk,
} from '../../../store/slices/shareSlice';

const PermBadge = ({ permission }) => (
  <span
    className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
      permission === 'EDIT'
        ? 'bg-violet-50 text-violet-600'
        : 'bg-sky-50 text-sky-600'
    }`}
  >
    {permission === 'EDIT' ? (
      <Edit3 className="w-2.5 h-2.5" />
    ) : (
      <Eye className="w-2.5 h-2.5" />
    )}
    {permission === 'EDIT' ? 'Can Edit' : 'Can View'}
  </span>
);

const Avatar = ({ user, size = 8 }) => (
  <div
    className={`w-${size} h-${size} rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shrink-0 overflow-hidden`}
  >
    {user?.imageUrl ? (
      <img src={user.imageUrl} alt={user.username} className="w-full h-full object-cover" />
    ) : (
      <span className="text-white text-xs font-bold">
        {(user?.username || user?.email || '?').charAt(0).toUpperCase()}
      </span>
    )}
  </div>
);

const ShareModalContent = ({ item, isFolder, onClose, onToast }) => {
  const dispatch = useDispatch();
  const {
    fileShares: shares,
    fileSharesLoading: sharesLoading,
    sharing,
    removingId,
    publicLink,
    linkLoading,
    revoking,
    error: shareError,
  } = useSelector((state) => state.share);

  const [tab, setTab] = useState('people');
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState('VIEW');
  const [copied, setCopied] = useState(false);

  // Customizable Public Link Settings
  const [expirationEnabled, setExpirationEnabled] = useState(false);
  const [expiresAt, setExpiresAt] = useState('');
  const [passwordEnabled, setPasswordEnabled] = useState(false);
  const [password, setPassword] = useState('');
  const [allowDownload, setAllowDownload] = useState(true);

  const itemId = item.id;
  const linkSettings = useSelector((state) => state.share.publicLinkSettings);

  useEffect(() => {
    dispatch(clearShareModalState());
    if (isFolder) {
      dispatch(fetchFolderShares(itemId));
    } else {
      dispatch(fetchFileShares(itemId));
      dispatch(fetchPublicLinkInfo(itemId));
    }
  }, [dispatch, itemId, isFolder]);

  useEffect(() => {
    if (linkSettings && !isFolder) {
      setExpirationEnabled(!!linkSettings.expiresAt);
      if (linkSettings.expiresAt) {
        const date = new Date(linkSettings.expiresAt);
        // format to YYYY-MM-DDTHH:MM local format
        const offset = date.getTimezoneOffset();
        const localDate = new Date(date.getTime() - (offset*60*1050)); // close timezone adjustment
        const formatted = localDate.toISOString().slice(0, 16);
        setExpiresAt(formatted);
      } else {
        setExpiresAt('');
      }
      setPasswordEnabled(linkSettings.hasPassword);
      setPassword(linkSettings.hasPassword ? '••••••••' : '');
      setAllowDownload(linkSettings.allowDownload ?? true);
    } else {
      setExpirationEnabled(false);
      setExpiresAt('');
      setPasswordEnabled(false);
      setPassword('');
      setAllowDownload(true);
    }
  }, [linkSettings, isFolder]);

  const handleShare = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    let result;
    if (isFolder) {
      result = await dispatch(
        shareFolderWithUser({ folderId: itemId, email: email.trim(), permission })
      );
      if (shareFolderWithUser.fulfilled.match(result)) {
        setEmail('');
        onToast?.(`Shared with ${email.trim()}`, 'success');
      }
    } else {
      result = await dispatch(
        shareFileWithUser({ fileId: itemId, email: email.trim(), permission })
      );
      if (shareFileWithUser.fulfilled.match(result)) {
        setEmail('');
        onToast?.(`Shared with ${email.trim()}`, 'success');
      }
    }
  };

  const handleRemove = async (shareId, username) => {
    let result;
    if (isFolder) {
      result = await dispatch(removeFolderShareThunk(shareId));
    } else {
      result = await dispatch(removeFileShare(shareId));
    }
    if (result.meta.requestStatus === 'fulfilled') {
      onToast?.(`Removed access for ${username}`, 'success');
    } else {
      onToast?.('Failed to remove access', 'error');
    }
  };

  const handleGenerateOrUpdateLink = async () => {
    const options = {
      allowDownload,
      expiresAt: expirationEnabled && expiresAt ? new Date(expiresAt).toISOString() : null,
    };
    
    if (passwordEnabled) {
      if (password && password !== '••••••••') {
        options.password = password;
      }
    } else {
      options.password = null;
    }

    const result = await dispatch(createPublicLink({ fileId: itemId, options }));
    if (createPublicLink.fulfilled.match(result)) {
      onToast?.(publicLink ? 'Link settings updated!' : 'Public link generated!', 'success');
    } else {
      onToast?.(result.payload || 'Failed to save settings', 'error');
    }
  };

  const handleRevoke = async () => {
    if (!publicLink) return;
    const token = publicLink.split('/share/')[1];
    if (!token) return;
    const result = await dispatch(deletePublicLink(token));
    if (deletePublicLink.fulfilled.match(result)) {
      onToast?.('Public link revoked', 'success');
    } else {
      onToast?.('Failed to revoke link', 'error');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(publicLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-xs" onClick={onClose} />

      <div className="relative bg-white dark:bg-[#1E293B] rounded-2xl w-full max-w-lg shadow-2xl border border-gray-100 dark:border-[#334155] overflow-hidden animate-fade-in">
        <div className="flex items-start justify-between p-6 pb-4 border-b border-gray-100 dark:border-[#334155]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-blue-50 dark:bg-[#3B82F6]/10 rounded-xl flex items-center justify-center shrink-0">
              <Share2 className="w-5 h-5 text-[#3B82F6] dark:text-[#3B82F6]" />
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-gray-900 dark:text-[#F8FAFC] text-base leading-tight">{isFolder ? 'Share Folder' : 'Share File'}</h2>
              <p className="text-sm text-gray-400 dark:text-[#94A3B8] truncate mt-0.5">{isFolder ? item.name : item.originalName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-[#334155] rounded-xl transition text-gray-400 dark:text-[#94A3B8] hover:text-gray-600 dark:hover:text-[#F8FAFC] shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex border-b border-gray-100 dark:border-[#334155] px-6">
          <button
            onClick={() => setTab('people')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition -mb-px ${
              tab === 'people'
                ? 'border-[#3B82F6] text-[#3B82F6] dark:text-[#3B82F6]'
                : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-350'
            }`}
          >
            <Users className="w-4 h-4" />
            People
          </button>
          {!isFolder && (
            <button
              onClick={() => setTab('link')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition -mb-px ${
                tab === 'link'
                  ? 'border-[#3B82F6] text-[#3B82F6] dark:text-[#3B82F6]'
                  : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-350'
              }`}
            >
              <Link2 className="w-4 h-4" />
              Public Link
            </button>
          )}
        </div>

        <div className="p-6">
          {tab === 'people' && (
            <div className="space-y-5">
              <form onSubmit={handleShare}>
                <label className="block text-xs font-semibold text-gray-500 dark:text-[#94A3B8] tracking-wide mb-2">
                  Share with Someone
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter email address…"
                      className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-[#334155] border border-gray-200 dark:border-[#334155] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:bg-white dark:focus:bg-gray-900 text-gray-900 dark:text-[#F8FAFC] transition"
                      disabled={sharing}
                    />
                  </div>
                  <select
                    value={permission}
                    onChange={(e) => setPermission(e.target.value)}
                    className="px-3 py-2.5 bg-gray-50 dark:bg-[#334155] border border-gray-200 dark:border-[#334155] rounded-xl text-sm font-medium text-gray-700 dark:text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] transition"
                    disabled={sharing}
                  >
                    <option value="VIEW">Can View</option>
                    <option value="EDIT">Can Edit</option>
                  </select>
                  <button
                    type="submit"
                    disabled={sharing || !email.trim()}
                    className="px-4 py-2.5 bg-[#3B82F6] hover:bg-[#2563EB] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition flex items-center gap-1.5 whitespace-nowrap"
                  >
                    {sharing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Share2 className="w-4 h-4" />
                    )}
                    Share
                  </button>
                </div>

                {shareError && (
                  <div className="mt-2 flex items-center gap-2 text-red-600 text-sm bg-red-50 dark:bg-red-950/20 rounded-xl px-3 py-2 border border-red-100 dark:border-red-900/30">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {shareError}
                  </div>
                )}
              </form>

              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-[#94A3B8] tracking-wide mb-3">
                  People with Access
                </label>

                {sharesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-green-500" />
                  </div>
                ) : shares.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-gray-50 dark:bg-[#334155] rounded-2xl flex items-center justify-center mx-auto mb-3 border border-gray-100 dark:border-[#334155]">
                      <Shield className="w-6 h-6 text-gray-300 dark:text-[#94A3B8]" />
                    </div>
                    <p className="text-sm text-gray-400 dark:text-[#94A3B8]">Only you have access</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {shares.map((share) => (
                      <div
                        key={share.id}
                        className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-[#334155]/40 rounded-xl border border-gray-100 dark:border-[#334155]"
                      >
                        <Avatar user={share.sharedTo} size={8} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 dark:text-[#F8FAFC] truncate">
                            {share.sharedTo?.username || share.sharedTo?.email}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-[#94A3B8] truncate">{share.sharedTo?.email}</p>
                        </div>
                        <PermBadge permission={share.permission} />
                        <button
                          onClick={() => handleRemove(share.id, share.sharedTo?.username)}
                          disabled={removingId === share.id}
                          className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg text-gray-300 dark:text-[#94A3B8] hover:text-red-500 transition ml-1"
                          title="Remove access"
                        >
                          {removingId === share.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-red-400" />
                          ) : (
                            <UserX className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === 'link' && (
            <div className="space-y-5">
              <div className="bg-gray-50 dark:bg-[#334155]/40 border border-gray-200 dark:border-[#334155] rounded-2xl p-5 text-center">
                <div className="w-14 h-14 bg-gradient-to-br from-sky-100 to-blue-50 dark:from-sky-950/20 dark:to-blue-950/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Globe className="w-7 h-7 text-sky-500 animate-pulse" />
                </div>
                <h3 className="font-bold text-gray-900 dark:text-gray-105 mb-1">Public Link</h3>
                <p className="text-sm text-gray-400 dark:text-[#94A3B8] mb-4 leading-relaxed">
                  Anyone with this link can view the file — no login required.
                </p>

                {publicLink && (
                  <div className="mb-5 space-y-3">
                    <div className="flex items-center gap-2 bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-[#334155] rounded-xl p-2">
                      <input
                        type="text"
                        readOnly
                        value={publicLink}
                        className="flex-1 text-sm text-gray-705 dark:text-[#94A3B8] bg-transparent outline-none px-2 truncate"
                      />
                      <button
                        onClick={handleCopy}
                        className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition flex items-center gap-1.5 shrink-0 ${
                          copied
                            ? 'bg-blue-100 text-[#3B82F6] dark:bg-[#3B82F6]/10 dark:text-[#3B82F6]'
                            : 'bg-gray-100 hover:bg-gray-200 dark:bg-[#334155] dark:hover:bg-gray-750 text-gray-700 dark:text-[#94A3B8]'
                        }`}
                      >
                        {copied ? (
                          <><Check className="w-3.5 h-3.5" /> Copied!</>
                        ) : (
                          <><Copy className="w-3.5 h-3.5" /> Copy</>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Configuration Settings */}
                <div className="text-left bg-white dark:bg-[#1E293B] border border-gray-100 dark:border-[#334155] rounded-xl p-4 mb-4 space-y-4 shadow-xs">
                  <h4 className="text-xs font-bold text-gray-400 dark:text-[#94A3B8] tracking-wide">Custom Sharing Options</h4>
                  
                  {/* Expiration Date */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm text-gray-755 dark:text-[#94A3B8] font-medium select-none cursor-pointer">
                      <input
                        type="checkbox"
                        checked={expirationEnabled}
                        onChange={(e) => setExpirationEnabled(e.target.checked)}
                        className="rounded text-[#3B82F6] focus:ring-[#3B82F6] border-gray-300 dark:border-[#334155] w-4 h-4 dark:bg-[#0F172A]"
                      />
                      <span>Set expiration date</span>
                    </label>
                    {expirationEnabled && (
                      <input
                        type="datetime-local"
                        value={expiresAt}
                        onChange={(e) => setExpiresAt(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0F172A] border border-gray-300 dark:border-[#334155] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6] text-gray-700 dark:text-[#94A3B8]"
                      />
                    )}
                  </div>

                  {/* Password Protection */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-[#94A3B8] font-medium select-none cursor-pointer">
                      <input
                        type="checkbox"
                        checked={passwordEnabled}
                        onChange={(e) => {
                          setPasswordEnabled(e.target.checked);
                          if (!e.target.checked) setPassword('');
                        }}
                        className="rounded text-[#3B82F6] focus:ring-[#3B82F6] border-gray-300 dark:border-[#334155] w-4 h-4 dark:bg-[#0F172A]"
                      />
                      <span>Password protection</span>
                    </label>
                    {passwordEnabled && (
                      <input
                        type={password === '••••••••' ? 'text' : 'password'}
                        placeholder={password === '••••••••' ? 'Link is password protected' : 'Enter password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onFocus={() => {
                          if (password === '••••••••') setPassword('');
                        }}
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0F172A] border border-gray-300 dark:border-[#334155] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6] text-gray-700 dark:text-[#94A3B8]"
                      />
                    )}
                  </div>

                  {/* Allow Download Toggle */}
                  <div className="flex items-center justify-between py-1">
                    <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-[#94A3B8] font-medium select-none cursor-pointer">
                      <input
                        type="checkbox"
                        checked={allowDownload}
                        onChange={(e) => setAllowDownload(e.target.checked)}
                        className="rounded text-[#3B82F6] focus:ring-[#3B82F6] border-gray-300 dark:border-[#334155] w-4 h-4 dark:bg-[#0F172A]"
                      />
                      <span>Allow downloads for visitors</span>
                    </label>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex flex-col sm:flex-row items-center gap-2 justify-center">
                  <button
                    onClick={handleGenerateOrUpdateLink}
                    disabled={linkLoading}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#3B82F6] hover:bg-[#2563EB] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition"
                  >
                    {linkLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Link2 className="w-4 h-4" />
                    )}
                    {publicLink ? 'Update settings' : 'Generate link'}
                  </button>

                  {publicLink && (
                    <button
                      onClick={handleRevoke}
                      disabled={revoking}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 rounded-xl text-sm font-semibold transition border border-red-100 dark:border-red-950/30"
                    >
                      {revoking ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                      Revoke Link
                    </button>
                  )}
                </div>

              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-8px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-fade-in { animation: fade-in 0.2s ease-out; }
      `}</style>
    </div>
  );
};

const ShareModal = ({ item, isFolder, isOpen, onClose, onToast }) => {
  if (!isOpen || !item) return null;

  return (
    <ShareModalContent
      key={item.id}
      item={item}
      isFolder={isFolder}
      onClose={onClose}
      onToast={onToast}
    />
  );
};

export default ShareModal;
