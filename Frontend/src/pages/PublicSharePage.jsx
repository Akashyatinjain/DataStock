import React, { useEffect } from 'react';
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
} from 'lucide-react';
import { fetchPublicFile, clearPublicFile } from '../store/slices/shareSlice';
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
  if (!mime) return <FileText className="w-16 h-16 text-slate-400" />;
  if (mime.includes('image')) return <FileImage className="w-16 h-16 text-sky-500" />;
  if (mime.includes('video')) return <FileVideo className="w-16 h-16 text-violet-500" />;
  if (mime.includes('audio')) return <FileAudio className="w-16 h-16 text-pink-500" />;
  if (mime.includes('pdf')) return <FileText className="w-16 h-16 text-rose-500" />;
  if (mime.includes('word') || mime.includes('excel') || mime.includes('spreadsheet')) {
    return <FileSpreadsheet className="w-16 h-16 text-emerald-500" />;
  }
  if (mime.includes('zip') || mime.includes('rar')) return <FileArchive className="w-16 h-16 text-amber-500" />;
  if (mime.includes('text') || mime.includes('json')) return <FileCode className="w-16 h-16 text-orange-500" />;
  return <FileText className="w-16 h-16 text-slate-400" />;
};

/* ─── Preview renderer ─── */
const FilePreview = ({ file }) => {
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
      <div className="bg-white rounded-2xl p-8 shadow-lg text-center w-full max-w-md">
        <FileAudio className="w-20 h-20 mx-auto text-pink-500 mb-4" />
        <p className="font-semibold text-gray-700 mb-4">{file.originalName}</p>
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
    <div className="bg-white rounded-2xl p-10 shadow-lg text-center">
      {getFileIcon(mime)}
      <p className="text-lg font-semibold text-gray-700 mt-4">Preview not available</p>
      <p className="text-gray-400 mt-2 text-sm">Download the file to open it.</p>
    </div>
  );
};

/* ─── Main Page ─── */
const PublicSharePage = () => {
  const { token } = useParams();
  const dispatch = useDispatch();
  const file = useSelector((state) => state.share.publicFile);
  const loading = useSelector((state) => state.share.publicFileLoading);
  const error = useSelector((state) => state.share.error);

  useEffect(() => {
    if (token) {
      dispatch(fetchPublicFile(token));
    }
    return () => {
      dispatch(clearPublicFile());
    };
  }, [token, dispatch]);

  return (
    <div className="min-h-screen bg-linear-to-br from-[#f0fdf4] via-white to-[#f0f9ff] dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 flex flex-col transition-colors duration-200">
      {/* ── Nav bar ── */}
      <nav className="bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm border-b border-gray-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-linear-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-sm">
            <Cloud className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl text-gray-900 dark:text-white">DataStock</span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            to="/login"
            className="text-sm font-semibold text-green-700 dark:text-emerald-400 hover:text-green-800 dark:hover:text-emerald-300 bg-green-50 dark:bg-emerald-500/10 hover:bg-green-100 dark:hover:bg-emerald-500/20 px-4 py-2 rounded-xl transition"
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
            <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
            </div>
            <p className="text-gray-400 font-medium">Loading shared file…</p>
          </div>
        )}

        {/* ── Error ── */}
        {!loading && error && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-10 shadow-lg border border-red-100 dark:border-slate-800 text-center max-w-md w-full">
            <div className="w-16 h-16 bg-red-50 dark:bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Link Unavailable</h1>
            <p className="text-gray-400 dark:text-gray-400 text-sm mb-6">{error}</p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold text-sm transition"
            >
              Go to DataStock
            </Link>
          </div>
        )}

        {/* ── File view ── */}
        {!loading && file && (
          <div className="w-full max-w-4xl">
            {/* File header card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-800 mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <div className="w-16 h-16 bg-linear-to-br from-gray-50 to-gray-100 dark:from-slate-800 dark:to-slate-700 rounded-2xl flex items-center justify-center shrink-0 border border-gray-200 dark:border-slate-700">
                {getFileIcon(file.mimeType)}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white truncate">{file.originalName}</h1>
                <div className="flex items-center gap-4 mt-1.5">
                  <span className="flex items-center gap-1.5 text-sm text-gray-400 dark:text-gray-500">
                    <HardDrive className="w-3.5 h-3.5" />
                    {formatSize(file.size)}
                  </span>
                  <span className="flex items-center gap-1.5 text-sm text-gray-400 dark:text-gray-500">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(file.createdAt).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>
              <a
                href={file.url}
                target="_blank"
                rel="noreferrer"
                download
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold text-sm transition shadow-sm shrink-0"
              >
                <Download className="w-4 h-4" />
                Download
              </a>
            </div>

            {/* Preview area */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden p-6 flex items-center justify-center min-h-75">
              <FilePreview file={file} />
            </div>

            {/* Footer note */}
            <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-6">
              This file was shared via{' '}
              <Link to="/" className="text-green-600 font-semibold hover:underline">
                DataStock
              </Link>
              . Sign in to manage your own files.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default PublicSharePage;
