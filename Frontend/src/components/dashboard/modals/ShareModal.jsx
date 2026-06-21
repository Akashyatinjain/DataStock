import React, { useState, useEffect, useCallback } from 'react';
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

const ShareModal = ({ file, isOpen, onClose, onToast }) => {
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

  const loadShares = useCallback(() => {
    if (file?.id) {
      dispatch(fetchFileShares(file.id));
    }
  }, [dispatch, file?.id]);

  useEffect(() => {
    if (isOpen && file?.id) {
      setTab('people');
      setEmail('');
      setPermission('VIEW');
      dispatch(clearShareModalState());
      loadShares();
    }
  }, [isOpen, file?.id, loadShares, dispatch]);

  if (!isOpen || !file) return null;

  const handleShare = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    const result = await dispatch(
      shareFileWithUser({ fileId: file.id, email: email.trim(), permission })
    );
    if (shareFileWithUser.fulfilled.match(result)) {
      setEmail('');
      onToast?.(`Shared with ${email.trim()}`, 'success');
    }
  };

  const handleRemove = async (shareId, username) => {
    const result = await dispatch(removeFileShare(shareId));
    if (removeFileShare.fulfilled.match(result)) {
      onToast?.(`Removed access for ${username}`, 'success');
    } else {
      onToast?.('Failed to remove access', 'error');
    }
  };

  const handleGenerateLink = async () => {
    const result = await dispatch(createPublicLink(file.id));
    if (createPublicLink.fulfilled.match(result)) {
      onToast?.('Public link generated!', 'success');
    } else {
      onToast?.(result.payload || 'Failed to generate link', 'error');
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
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-gray-100 overflow-hidden animate-fade-in">
        <div className="flex items-start justify-between p-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center shrink-0">
              <Share2 className="w-5 h-5 text-green-600" />
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-gray-900 text-base leading-tight">Share File</h2>
              <p className="text-sm text-gray-400 truncate mt-0.5">{file.originalName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition text-gray-400 hover:text-gray-600 shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex border-b border-gray-100 px-6">
          <button
            onClick={() => setTab('people')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition -mb-px ${
              tab === 'people'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            <Users className="w-4 h-4" />
            People
          </button>
          <button
            onClick={() => setTab('link')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition -mb-px ${
              tab === 'link'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            <Link2 className="w-4 h-4" />
            Public Link
          </button>
        </div>

        <div className="p-6">
          {tab === 'people' && (
            <div className="space-y-5">
              <form onSubmit={handleShare}>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Share with someone
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter email address…"
                      className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition"
                      disabled={sharing}
                    />
                  </div>
                  <select
                    value={permission}
                    onChange={(e) => setPermission(e.target.value)}
                    className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition"
                    disabled={sharing}
                  >
                    <option value="VIEW">Can View</option>
                    <option value="EDIT">Can Edit</option>
                  </select>
                  <button
                    type="submit"
                    disabled={sharing || !email.trim()}
                    className="px-4 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-green-200 text-white rounded-xl text-sm font-semibold transition flex items-center gap-1.5 whitespace-nowrap"
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
                  <div className="mt-2 flex items-center gap-2 text-red-600 text-sm bg-red-50 rounded-xl px-3 py-2 border border-red-100">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {shareError}
                  </div>
                )}
              </form>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  People with access
                </label>

                {sharesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-green-500" />
                  </div>
                ) : shares.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-gray-100">
                      <Shield className="w-6 h-6 text-gray-300" />
                    </div>
                    <p className="text-sm text-gray-400">Only you have access</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {shares.map((share) => (
                      <div
                        key={share.id}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100"
                      >
                        <Avatar user={share.sharedTo} size={8} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {share.sharedTo?.username || share.sharedTo?.email}
                          </p>
                          <p className="text-xs text-gray-400 truncate">{share.sharedTo?.email}</p>
                        </div>
                        <PermBadge permission={share.permission} />
                        <button
                          onClick={() => handleRemove(share.id, share.sharedTo?.username)}
                          disabled={removingId === share.id}
                          className="p-1.5 hover:bg-red-50 rounded-lg text-gray-300 hover:text-red-500 transition ml-1"
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
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 text-center">
                <div className="w-14 h-14 bg-gradient-to-br from-sky-100 to-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Globe className="w-7 h-7 text-sky-500" />
                </div>
                <h3 className="font-bold text-gray-900 mb-1">Public Link</h3>
                <p className="text-sm text-gray-400 mb-4 leading-relaxed">
                  Anyone with this link can view the file — no login required.
                </p>

                {!publicLink ? (
                  <button
                    onClick={handleGenerateLink}
                    disabled={linkLoading}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-green-200 text-white rounded-xl text-sm font-semibold transition"
                  >
                    {linkLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Link2 className="w-4 h-4" />
                    )}
                    Generate Link
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl p-2">
                      <input
                        type="text"
                        readOnly
                        value={publicLink}
                        className="flex-1 text-sm text-gray-700 bg-transparent outline-none px-2 truncate"
                      />
                      <button
                        onClick={handleCopy}
                        className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition flex items-center gap-1.5 shrink-0 ${
                          copied
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        }`}
                      >
                        {copied ? (
                          <><Check className="w-3.5 h-3.5" /> Copied!</>
                        ) : (
                          <><Copy className="w-3.5 h-3.5" /> Copy</>
                        )}
                      </button>
                    </div>

                    <button
                      onClick={handleRevoke}
                      disabled={revoking}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-sm font-semibold transition border border-red-100"
                    >
                      {revoking ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                      Revoke Link
                    </button>
                  </div>
                )}
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

export default ShareModal;
