import React from 'react';
import {
  X,
  FileText,
  Download,
  FileImage,
  FileVideo,
  FileSpreadsheet,
  FileArchive,
  FileCode,
  FileAudio
} from 'lucide-react';

const FilePreviewModal = ({
  file,
  isOpen,
  onClose
}) => {

  if (!isOpen || !file) return null;

  const mime = file.mimeType || '';
  const url = file.url;

  // FILE TYPES
  const isImage = mime.includes('image');
  const isVideo = mime.includes('video');
  const isAudio = mime.includes('audio');
  const isPdf = mime.includes('pdf');

  const isText =
    mime.includes('text') ||
    mime.includes('json') ||
    mime.includes('javascript') ||
    mime.includes('html') ||
    mime.includes('css') ||
    mime.includes('xml');

  const isOffice =
    mime.includes('word') ||
    mime.includes('excel') ||
    mime.includes('spreadsheet') ||
    mime.includes('presentation') ||
    mime.includes('powerpoint');

  const isArchive =
    mime.includes('zip') ||
    mime.includes('rar') ||
    mime.includes('7z');

  // FILE ICON
  const getFileIcon = () => {
    if (isImage) return <FileImage className="w-20 h-20 text-blue-500" />;
    if (isVideo) return <FileVideo className="w-20 h-20 text-purple-500" />;
    if (isAudio) return <FileAudio className="w-20 h-20 text-pink-500" />;
    if (isOffice) return <FileSpreadsheet className="w-20 h-20 text-green-500" />;
    if (isArchive) return <FileArchive className="w-20 h-20 text-yellow-500" />;
    if (isText) return <FileCode className="w-20 h-20 text-orange-500" />;

    return <FileText className="w-20 h-20 text-gray-400" />;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">

      <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[92vh] overflow-hidden shadow-2xl">

        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">

          <div className="min-w-0">
            <h2 className="font-semibold text-gray-900 truncate">
              {file.originalName}
            </h2>

            <p className="text-sm text-gray-500">
              {mime}
            </p>
          </div>

          <div className="flex items-center gap-2">

            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              download
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <Download className="w-5 h-5 text-gray-600" />
            </a>

            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>

          </div>
        </div>

        {/* CONTENT */}
        <div className="bg-gray-100 h-[78vh] flex items-center justify-center overflow-auto">

          {/* IMAGE */}
          {
            isImage && (
              <img
                src={url}
                alt={file.originalName}
                className="max-h-full max-w-full object-contain"
              />
            )
          }

          {/* VIDEO */}
          {
            isVideo && (
              <video
                controls
                className="max-h-full max-w-full rounded-xl"
              >
                <source src={url} type={mime} />
              </video>
            )
          }

          {/* AUDIO */}
          {
            isAudio && (
              <div className="bg-white p-10 rounded-2xl shadow-lg text-center">
                <FileAudio className="w-24 h-24 mx-auto text-pink-500 mb-4" />

                <p className="text-lg font-semibold mb-5">
                  Audio Preview
                </p>

                <audio controls className="w-full">
                  <source src={url} type={mime} />
                </audio>
              </div>
            )
          }

          {/* PDF */}
          {
            isPdf && (
              <div className="w-full h-[78vh] flex flex-col">
                <div className="bg-emerald-50 border-b border-emerald-100 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 text-sm">
                  <div className="text-gray-700">
                    <span className="font-semibold text-emerald-800">💡 Tip:</span> If the preview below says "No preview available", your Cloudinary account is blocking PDF delivery. You can enable it in your <strong className="text-emerald-950">Cloudinary Console &gt; Settings &gt; Security &gt; Allow delivery of PDF and ZIP files</strong>.
                  </div>
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs transition inline-flex items-center gap-1 shrink-0 justify-center whitespace-nowrap"
                  >
                    Open PDF in New Tab
                  </a>
                </div>
                <iframe
                  src={`https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`}
                  title={file.originalName}
                  className="w-full flex-1 border-0 bg-white"
                />
              </div>
            )
          }

          {/* TEXT / CODE FILES */}
          {
            isText && (
              <iframe
                src={url}
                title={file.originalName}
                className="w-full h-[78vh] bg-white border-0"
              />
            )
          }

          {/* OFFICE FILES */}
          {
            isOffice && (
              <iframe
                src={`https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`}
                title={file.originalName}
                className="w-full h-[78vh] border-0"
              />
            )
          }

          {/* OTHER FILES */}
          {
            !isImage &&
            !isVideo &&
            !isAudio &&
            !isPdf &&
            !isText &&
            !isOffice && (
              <div className="text-center p-10">

                {getFileIcon()}

                <p className="text-xl font-semibold text-gray-700 mt-4">
                  Preview not available
                </p>

                <p className="text-gray-500 mt-2">
                  This file type cannot be previewed directly.
                </p>

                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-6 inline-block px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition"
                >
                  Open / Download File
                </a>
              </div>
            )
          }

        </div>
      </div>
    </div>
  );
};

export default FilePreviewModal;