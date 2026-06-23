import { useState, useRef } from 'react';
import { X, Upload, Loader2 } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { uploadNewFile } from '../../../store/slices/filesSlice';
import {
  ALLOWED_UPLOAD_ACCEPT,
  ALLOWED_UPLOAD_LABELS,
  formatUploadSize,
  validateUploadFile,
} from '../../../utils/uploadValidation';
import ErrorPopup from './ErrorPopup';

export default function UploadModal({ onClose, onUploaded, toast, folderId = null }) {
  const dispatch = useDispatch();
  const uploading = useSelector((state) => state.files.uploading);
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const inputRef = useRef(null);

  const handleFileSelect = (f) => {
    if (!f) return;

    // Clear previous errors
    setUploadError(null);

    // Validate before setting
    const validationError = validateUploadFile(f);
    if (validationError) {
      setUploadError(validationError);
      setFile(null);
      return;
    }

    setFile(f);
  };

  const handleUpload = async () => {
    if (!file) return;

    // Double-check validation
    const validationError = validateUploadFile(file);
    if (validationError) {
      setUploadError(validationError);
      return;
    }

    setUploadError(null);

    const form = new FormData();
    form.append('file', file);
    if (folderId) form.append('folderId', folderId);

    const result = await dispatch(uploadNewFile(form));
    if (uploadNewFile.fulfilled.match(result)) {
      toast('success', `"${file.name}" uploaded`);
      onUploaded?.(result.payload);
      onClose();
    } else {
      // Server returned a structured error
      const errorPayload = result.payload;
      if (errorPayload && typeof errorPayload === 'object' && errorPayload.code) {
        setUploadError(errorPayload);
      } else {
        setUploadError({
          code: 'UPLOAD_ERROR',
          message: typeof errorPayload === 'string' ? errorPayload : 'Upload failed. Please try again.',
        });
      }
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFileSelect(f);
  };

  return (
    <>
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div className="bg-white rounded-3xl shadow-2xl p-6 w-80 border border-gray-100">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-gray-900">Upload File</h3>
            <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg">
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className={`
              border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition mb-4
              ${dragging ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-400 hover:bg-gray-50'}
            `}
          >
            <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            {file ? (
              <div>
                <p className="text-sm font-medium text-gray-700 truncate">{file.name}</p>
                <p className="text-xs text-gray-400 mt-1">{formatUploadSize(file.size)}</p>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-500">
                  Drop a file or <span className="text-green-600 font-medium">browse</span>
                </p>
                <p className="text-xs text-gray-400 mt-1">Max {formatUploadSize()}</p>
              </div>
            )}
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              accept={ALLOWED_UPLOAD_ACCEPT}
              onChange={(e) => handleFileSelect(e.target.files[0])}
            />
          </div>

          {/* Accepted formats hint */}
          <p className="text-[11px] text-gray-400 text-center mb-4 leading-relaxed">
            {ALLOWED_UPLOAD_LABELS}
          </p>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-gray-200 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-green-600 hover:bg-green-700 text-white transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
              Upload
            </button>
          </div>
        </div>
      </div>

      {/* Error popup — rendered outside the modal overlay so it sits on top */}
      {uploadError && (
        <ErrorPopup
          error={uploadError}
          onDismiss={() => setUploadError(null)}
        />
      )}
    </>
  );
}
