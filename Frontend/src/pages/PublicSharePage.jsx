import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
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
  Search,
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
  const mime = file?.mimeType || '';
  const url = file?.url;
  const ext = file?.originalName ? file.originalName.split('.').pop().toLowerCase() : '';

  const isImage = mime.includes('image') || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp'].includes(ext);
  const isVideo = mime.includes('video') || ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv'].includes(ext);
  const isAudio = mime.includes('audio') || ['mp3', 'wav', 'm4a', 'aac', 'flac', 'ogg'].includes(ext);
  const isPdf = mime.includes('pdf') || ext === 'pdf';
  const isDocx = ['docx', 'doc'].includes(ext) || mime.includes('word');
  const isExcel = ['xlsx', 'xls', 'csv'].includes(ext) || mime.includes('excel') || mime.includes('spreadsheet') || mime.includes('csv');
  const isArchive = ['zip', 'rar', '7z'].includes(ext) || mime.includes('zip');
  const isText = mime.includes('text') || mime.includes('json') || ['txt', 'md', 'json', 'js', 'py', 'html', 'css'].includes(ext);

  const [docxHtml, setDocxHtml] = useState('');
  const [docxLoading, setDocxLoading] = useState(false);

  const [xlsxSheets, setXlsxSheets] = useState({});
  const [xlsxSheetNames, setXlsxSheetNames] = useState([]);
  const [xlsxActiveSheet, setXlsxActiveSheet] = useState('');
  const [xlsxLoading, setXlsxLoading] = useState(false);

  const [textContent, setTextContent] = useState('');
  const [textLoading, setTextLoading] = useState(false);

  const [zipEntries, setZipEntries] = useState([]);
  const [zipLoading, setZipLoading] = useState(false);

  const [pdfViewMode, setPdfViewMode] = useState('gview');

  useEffect(() => {
    if (isDocx && url) {
      setDocxLoading(true);
      fetch(url)
        .then(res => res.arrayBuffer())
        .then(buffer => mammoth.convertToHtml({ arrayBuffer: buffer }))
        .then(result => {
          setDocxHtml(result.value || '<p>Empty document</p>');
          setDocxLoading(false);
        })
        .catch(() => setDocxLoading(false));
    }
  }, [isDocx, url]);

  useEffect(() => {
    if (isExcel && url) {
      setXlsxLoading(true);
      fetch(url)
        .then(res => res.arrayBuffer())
        .then(buffer => {
          const wb = XLSX.read(buffer, { type: 'array' });
          const map = {};
          wb.SheetNames.forEach(n => {
            map[n] = XLSX.utils.sheet_to_json(wb.Sheets[n], { header: 1, defval: '' });
          });
          setXlsxSheets(map);
          setXlsxSheetNames(wb.SheetNames);
          setXlsxActiveSheet(wb.SheetNames[0] || '');
          setXlsxLoading(false);
        })
        .catch(() => setXlsxLoading(false));
    }
  }, [isExcel, url]);

  useEffect(() => {
    if (isArchive && url) {
      setZipLoading(true);
      fetch(url)
        .then(res => res.arrayBuffer())
        .then(buffer => JSZip.loadAsync(buffer))
        .then(zip => {
          const entries = [];
          zip.forEach((relativePath, entry) => {
            entries.push({
              name: relativePath,
              isDir: entry.dir,
              size: entry._data ? entry._data.uncompressedSize || 0 : 0,
            });
          });
          setZipEntries(entries);
          setZipLoading(false);
        })
        .catch(() => setZipLoading(false));
    }
  }, [isArchive, url]);

  useEffect(() => {
    if (isText && url) {
      setTextLoading(true);
      fetch(url)
        .then(res => res.text())
        .then(txt => {
          setTextContent(txt);
          setTextLoading(false);
        })
        .catch(() => setTextLoading(false));
    }
  }, [isText, url]);

  if (isImage) {
    return (
      <img
        src={url}
        alt={file.originalName}
        className="max-w-full max-h-[75vh] object-contain rounded-2xl shadow-xl"
      />
    );
  }
  if (isVideo) {
    return (
      <video controls className="w-full max-h-[75vh] rounded-2xl shadow-xl">
        <source src={url} type={mime} />
      </video>
    );
  }
  if (isAudio) {
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
  if (isDocx) {
    return (
      <div
        className="w-full h-[700px] min-h-[600px] bg-white dark:bg-[#1E293B] rounded-2xl shadow-xl border border-gray-200 dark:border-[#334155] overflow-auto p-8 text-left text-slate-900 dark:text-slate-100"
        style={{ width: '100%', height: '700px', minHeight: '600px' }}
      >
        {docxLoading ? (
          <div className="flex items-center justify-center h-full gap-2 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            <span>Loading Word document...</span>
          </div>
        ) : (
          <div dangerouslySetInnerHTML={{ __html: docxHtml }} className="prose dark:prose-invert max-w-none leading-relaxed" />
        )}
      </div>
    );
  }
  if (isExcel) {
    return (
      <div
        className="w-full h-[700px] min-h-[600px] bg-slate-950 rounded-2xl shadow-xl border border-slate-800 flex flex-col overflow-hidden text-left"
        style={{ width: '100%', height: '700px', minHeight: '600px' }}
      >
        <div className="bg-slate-900 p-2 flex gap-2 border-b border-slate-800 overflow-x-auto">
          {xlsxSheetNames.map(n => (
            <button
              key={n}
              onClick={() => setXlsxActiveSheet(n)}
              className={`px-3 py-1 rounded text-xs font-semibold ${xlsxActiveSheet === n ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'}`}
            >
              {n}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-auto p-2">
          {xlsxLoading ? (
            <div className="flex items-center justify-center h-full gap-2 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
              <span>Loading sheet...</span>
            </div>
          ) : (
            <table className="w-full text-xs font-mono text-slate-200 border-collapse">
              <tbody>
                {(xlsxSheets[xlsxActiveSheet] || []).map((row, r) => (
                  <tr key={r} className="border-b border-slate-800">
                    {row.map((c, col) => (
                      <td key={col} className="p-2 border-r border-slate-800 whitespace-nowrap">{String(c ?? '')}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
  }
  if (isArchive) {
    return (
      <div
        className="w-full h-[700px] min-h-[600px] bg-white dark:bg-[#1E293B] rounded-2xl shadow-xl border border-gray-200 dark:border-[#334155] flex flex-col overflow-hidden text-left"
        style={{ width: '100%', height: '700px', minHeight: '600px' }}
      >
        <div className="bg-gray-50 dark:bg-slate-900 border-b border-gray-200 dark:border-[#334155] px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider">ZIP Archive</span>
            <span className="text-xs text-gray-500 dark:text-[#94A3B8]">{zipEntries.length} items inside</span>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-4 space-y-2">
          {zipLoading ? (
            <div className="flex items-center justify-center h-full gap-2 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
              <span>Reading archive contents...</span>
            </div>
          ) : (
            zipEntries.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-[#334155]/40 border border-gray-100 dark:border-[#334155] text-xs">
                <div className="flex items-center gap-2.5 truncate font-mono text-gray-800 dark:text-gray-200">
                  {item.isDir ? <FileArchive className="w-4 h-4 text-amber-500 shrink-0" /> : <FileText className="w-4 h-4 text-gray-400 shrink-0" />}
                  <span className="truncate">{item.name}</span>
                </div>
                <span className="text-gray-400 dark:text-[#94A3B8] font-mono shrink-0 ml-4">{item.isDir ? 'Folder' : formatSize(item.size)}</span>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }
  if (isPdf) {
    const embedUrl = pdfViewMode === 'gview'
      ? `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`
      : url;

    return (
      <div
        className="w-full h-[520px] sm:h-[700px] min-h-[480px] sm:min-h-[600px] bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl shadow-xl border border-gray-200 dark:border-[#334155] flex flex-col overflow-hidden text-left"
        style={{ width: '100%', minHeight: '480px' }}
      >
        {/* Responsive Mobile/Desktop Top Control Toolbar */}
        <div className="bg-gray-100 dark:bg-slate-900 border-b border-gray-200 dark:border-[#334155] p-2.5 sm:px-4 sm:py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs shrink-0 select-none">
          <div className="flex items-center gap-2 min-w-0 overflow-hidden">
            <span className="bg-rose-500/10 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider text-[9px] sm:text-[10px] shrink-0">
              PDF
            </span>
            <span className="font-medium text-gray-700 dark:text-slate-300 truncate text-xs sm:text-sm">
              {file.originalName}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0 justify-end w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setPdfViewMode(pdfViewMode === 'gview' ? 'direct' : 'gview')}
              className="flex-1 sm:flex-none px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700 rounded-lg font-semibold text-gray-700 dark:text-slate-200 transition text-[11px] sm:text-xs text-center"
              title="Toggle Viewer Engine"
            >
              {pdfViewMode === 'gview' ? '🌐 Google Viewer' : '📄 Direct PDF'}
            </button>

            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="flex-1 sm:flex-none px-2.5 py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-lg font-semibold transition text-[11px] sm:text-xs text-center whitespace-nowrap"
            >
              Open ↗
            </a>
          </div>
        </div>

        <div className="flex-1 w-full h-full bg-white relative">
          <iframe
            src={embedUrl}
            title={file.originalName}
            className="w-full h-full border-0 bg-white"
            style={{ width: '100%', height: '100%', minHeight: '440px' }}
          />
        </div>
      </div>
    );
  }
  if (isText) {
    return (
      <div
        className="w-full h-[75vh] min-h-[600px] bg-slate-950 rounded-2xl shadow-xl border border-slate-800 p-6 overflow-auto text-left font-mono text-xs text-slate-200 whitespace-pre"
        style={{ width: '100%', height: '75vh', minHeight: '600px' }}
      >
        {textLoading ? 'Loading text file...' : textContent}
      </div>
    );
  }

  // Fallback
  return (
    <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-10 shadow-lg border border-gray-100 dark:border-[#334155] text-center max-w-md">
      {getFileIcon(mime)}
      <h3 className="text-base font-bold text-gray-800 dark:text-gray-200 mt-4">{file.originalName}</h3>
      <p className="text-xs text-gray-400 dark:text-[#94A3B8] mt-1 font-mono">{mime || 'Binary file'}</p>
      {allowDownload ? (
        <a
          href={url}
          download
          className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
        >
          <Download className="w-4 h-4" />
          Download File
        </a>
      ) : (
        <p className="text-red-500 dark:text-red-400 mt-4 text-xs font-medium">Downloads restricted for this link.</p>
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
      <main className="flex-1 flex flex-col items-center justify-center px-2.5 sm:px-6 py-3 sm:py-8">

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
          <div className="w-full max-w-5xl animate-fade-in">
            {/* File header card */}
            <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-[#334155] mb-4 sm:mb-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:gap-5">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-linear-to-br from-gray-50 to-gray-100 dark:from-slate-800 dark:to-slate-700 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 border border-gray-200 dark:border-[#334155]">
                  {getFileIcon(file.mimeType)}
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-base sm:text-xl font-bold text-gray-900 dark:text-[#F8FAFC] truncate leading-snug">{file.originalName}</h1>
                  <div className="flex items-center gap-3 sm:gap-4 mt-1 flex-wrap">
                    <span className="flex items-center gap-1 text-xs sm:text-sm text-gray-400 dark:text-[#94A3B8]">
                      <HardDrive className="w-3.5 h-3.5" />
                      {formatSize(file.size)}
                    </span>
                    <span className="flex items-center gap-1 text-xs sm:text-sm text-gray-400 dark:text-[#94A3B8]">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(file.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
              </div>
              {allowDownload && (
                <a
                  href={file.url}
                  target="_blank"
                  rel="noreferrer"
                  download
                  className="inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-xl font-semibold text-xs sm:text-sm transition shadow-sm w-full sm:w-auto shrink-0"
                >
                  <Download className="w-4 h-4" />
                  Download
                </a>
              )}
            </div>

            {/* Preview area */}
            <div
              className="w-full bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-100 dark:border-[#334155] shadow-sm overflow-hidden p-1.5 sm:p-6 flex flex-col items-center justify-center"
              style={{ width: '100%', minHeight: '500px' }}
            >
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
