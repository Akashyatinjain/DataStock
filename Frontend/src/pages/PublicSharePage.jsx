import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Cloud,
  Download,
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  FileSpreadsheet,
  FileCode,
  FileArchive,
  Loader2,
  AlertCircle,
  Clock,
  HardDrive,
  Lock,
} from 'lucide-react';
import { fetchPublicFile, clearPublicFile, verifyPublicFilePasswordThunk } from '../store/slices/shareSlice';
import ThemeToggle from '../components/ui/ThemeToggle';

/* ─── helpers ─── */
const formatSize = (bytes) => {
  if (!bytes) return '—';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
};

const getFileIcon = (mime) => {
  if (!mime) return <FileText className="w-16 h-16 text-slate-400 dark:text-[#94A3B8]" />;
  if (mime.includes('image')) return <FileImage className="w-16 h-16 text-sky-500" />;
  if (mime.includes('video')) return <FileVideo className="w-16 h-16 text-violet-500" />;
  if (mime.includes('audio')) return <FileAudio className="w-16 h-16 text-pink-500" />;
  if (mime.includes('pdf')) return <FileText className="w-16 h-16 text-rose-500" />;
  if (mime.includes('word') || mime.includes('excel') || mime.includes('spreadsheet')) {
    return <FileSpreadsheet className="w-16 h-16 text-emerald-500" />;
  }
  if (mime.includes('zip') || mime.includes('rar')) return <FileArchive className="w-16 h-16 text-amber-500" />;
  if (mime.includes('text') || mime.includes('json')) return <FileCode className="w-16 h-16 text-orange-500" />;
  return <FileText className="w-16 h-16 text-slate-400 dark:text-[#94A3B8]" />;
};

/* ─── Preview renderer ─── */
const FilePreview = ({ file, allowDownload }) => {
  const mime = file.mimeType || '';
  const url = file.url;

  if (mime.includes('image')) {
    return (
      <img
        src={url}
        alt={file.originalName}
        className="max-w-full max-h-[60vh] object-contain rounded-2xl shadow-xl"
      />
    );
  }
  if (mime.includes('video')) {
    return (
      <video controls className="max-w-full max-h-[60vh] rounded-2xl shadow-xl">
        <source src={url} type={mime} />
      </video>
    );
  }
  if (mime.includes('audio')) {
    return (
      <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-8 shadow-lg text-center w-full max-w-md border border-gray-100 dark:border-[#334155]">
        <FileAudio className="w-20 h-20 mx-auto text-pink-500 mb-4" />
        <p className="font-semibold text-gray-700 dark:text-[#94A3B8] mb-4">{file.originalName}</p>
        <audio controls className="w-full">
          <source src={url} type={mime} />
        </audio>
      </div>
    );
  }
  if (mime.includes('pdf')) {
    return (
      <iframe
        src={`https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`}
        title={file.originalName}
        className="w-full h-[60vh] rounded-2xl shadow-xl border-0 bg-white"
      />
    );
  }
  if (mime.includes('word') || mime.includes('excel') || mime.includes('spreadsheet') || mime.includes('presentation')) {
    return (
      <iframe
        src={`https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`}
        title={file.originalName}
        className="w-full h-[60vh] rounded-2xl shadow-xl border-0 bg-white"
      />
    );
  }

  // Fallback
  return (
    <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-10 shadow-lg border border-gray-100 dark:border-[#334155] text-center">
      {getFileIcon(mime)}
      <p className="text-lg font-semibold text-gray-700 dark:text-[#94A3B8] mt-4">Preview not available</p>
      {allowDownload ? (
        <p className="text-gray-400 dark:text-[#94A3B8] mt-2 text-sm">Download the file to open it.</p>
      ) : (
        <p className="text-red-500 dark:text-red-400 mt-2 text-sm font-medium">Downloads are restricted for this link.</p>
      )}
    </div>
  );
};

/* ─── Main Page ─── */
const PublicSharePage = () => {
  const { token } = useParams();
  const dispatch = useDispatch();
  const publicFileData = useSelector((state) => state.share.publicFile);
  const loading = useSelector((state) => state.share.publicFileLoading);
  const error = useSelector((state) => state.share.error);

  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (token) {
      dispatch(fetchPublicFile(token));
    }
    return () => {
      dispatch(clearPublicFile());
    };
  }, [token, dispatch]);

  const handleVerifyPassword = async (e) => {
    e.preventDefault();
    if (!password.trim()) return;
    setVerifying(true);
    setPasswordError('');
    const result = await dispatch(verifyPublicFilePasswordThunk({ token, password: password.trim() }));
    setVerifying(false);
    if (verifyPublicFilePasswordThunk.rejected.match(result)) {
      setPasswordError(result.payload || 'Incorrect password');
    }
  };

  const isPasswordProtected = publicFileData?.isPasswordProtected;
  const file = publicFileData?.file;
  const allowDownload = publicFileData?.allowDownload ?? true;

  return (
    <div className="min-h-screen bg-linear-to-br from-[#f0fdf4] via-white to-[#f0f9ff] dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 flex flex-col transition-colors duration-200">
      {/* ── Nav bar ── */}
      <nav className="bg-white/80 dark:bg-[#0F172A]/80 backdrop-blur-sm border-b border-gray-200 dark:border-[#334155] px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-linear-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-sm">
            <Cloud className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl text-gray-900 dark:text-[#F8FAFC]">DataStock</span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            to="/login"
            className="text-sm font-semibold text-[#3B82F6] dark:text-[#3B82F6] hover:text-[#3B82F6] dark:hover:text-[#3B82F6] bg-blue-50 dark:bg-[#3B82F6]/10 hover:bg-blue-100 dark:hover:bg-[#3B82F6]/20 px-4 py-2 rounded-xl transition"
          >
            Sign In
          </Link>
        </div>
      </nav>

      {/* ── Content ── */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">

        {/* ── Loading ── */}
        {loading && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-blue-50 dark:bg-[#3B82F6]/10 rounded-2xl flex items-center justify-center border border-blue-100 dark:border-emerald-500/20">
              <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
            </div>
            <p className="text-gray-400 dark:text-[#94A3B8] font-medium">Loading shared file…</p>
          </div>
        )}

        {/* ── Error ── */}
        {!loading && error && (
          <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-10 shadow-lg border border-red-100 dark:border-[#334155] text-center max-w-md w-full">
            <div className="w-16 h-16 bg-red-50 dark:bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-100 dark:border-red-500/20">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-[#F8FAFC] mb-2">Link Unavailable</h1>
            <p className="text-gray-400 dark:text-[#94A3B8] text-sm mb-6">{error}</p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-xl font-semibold text-sm transition"
            >
              Go to DataStock
            </Link>
          </div>
        )}

        {/* ── Password Protection ── */}
        {!loading && isPasswordProtected && (
          <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-8 shadow-xl border border-gray-150 dark:border-[#334155] text-center max-w-md w-full animate-fade-in">
            <div className="w-14 h-14 bg-blue-50 dark:bg-[#3B82F6]/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100 dark:border-emerald-500/20">
              <Lock className="w-7 h-7 text-[#3B82F6] dark:text-[#3B82F6]" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-[#F8FAFC] mb-2">Password Protected</h1>
            <p className="text-gray-400 dark:text-[#94A3B8] text-sm mb-5">
              Enter the password to access this shared file.
            </p>

            {publicFileData && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-[#334155]/40 rounded-xl border border-gray-100 dark:border-[#334155]/50 text-left mb-6">
                <div className="w-10 h-10 bg-white dark:bg-[#334155] rounded-lg flex items-center justify-center shrink-0 border border-gray-200 dark:border-[#334155]">
                  {getFileIcon(publicFileData.mimeType)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900 dark:text-[#F8FAFC] truncate">{publicFileData.fileName}</p>
                  <p className="text-xs text-gray-400 dark:text-[#94A3B8]">{formatSize(publicFileData.size)}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleVerifyPassword} className="space-y-4">
              <input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-[#334155] border border-gray-200 dark:border-[#334155] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:bg-white text-gray-700 dark:text-[#94A3B8] transition"
                disabled={verifying}
              />
              {passwordError && (
                <p className="text-red-500 dark:text-red-400 text-xs text-left font-semibold">{passwordError}</p>
              )}
              <button
                type="submit"
                disabled={verifying || !password}
                className="w-full py-3 bg-[#3B82F6] hover:bg-[#2563EB] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-sm transition flex items-center justify-center gap-1.5"
              >
                {verifying ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Unlock File'
                )}
              </button>
            </form>
          </div>
        )}

        {/* ── File view ── */}
        {!loading && !isPasswordProtected && file && (
          <div className="w-full max-w-4xl animate-fade-in">
            {/* File header card */}
            <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-[#334155] mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <div className="w-16 h-16 bg-linear-to-br from-gray-50 to-gray-100 dark:from-slate-800 dark:to-slate-700 rounded-2xl flex items-center justify-center shrink-0 border border-gray-200 dark:border-[#334155]">
                {getFileIcon(file.mimeType)}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold text-gray-900 dark:text-[#F8FAFC] truncate">{file.originalName}</h1>
                <div className="flex items-center gap-4 mt-1.5">
                  <span className="flex items-center gap-1.5 text-sm text-gray-400 dark:text-[#94A3B8]">
                    <HardDrive className="w-3.5 h-3.5" />
                    {formatSize(file.size)}
                  </span>
                  <span className="flex items-center gap-1.5 text-sm text-gray-400 dark:text-[#94A3B8]">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(file.createdAt).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>
              {allowDownload && (
                <a
                  href={file.url}
                  target="_blank"
                  rel="noreferrer"
                  download
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-xl font-semibold text-sm transition shadow-sm shrink-0"
                >
                  <Download className="w-4 h-4" />
                  Download
                </a>
              )}
            </div>

            {/* Preview area */}
            <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-100 dark:border-[#334155] shadow-sm overflow-hidden p-6 flex items-center justify-center min-h-75">
              <FilePreview file={file} allowDownload={allowDownload} />
            </div>

            {/* Footer note */}
            <p className="text-center text-xs text-gray-400 dark:text-[#94A3B8] mt-6">
              This file was shared via{' '}
              <Link to="/" className="text-[#3B82F6] font-semibold hover:underline">
                DataStock
              </Link>
              . Sign in to manage your own files.
            </p>
          </div>
        )}
      </main>

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

export default PublicSharePage;
