import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, X, Lightbulb } from 'lucide-react';
import { getErrorMessage } from '../../../utils/errorMessage';
import '../../../styles/ErrorPopup.css';

// ── Error-code → friendly title mapping ──
const ERROR_TITLES = {
  FILE_TOO_LARGE: 'File Too Large',
  INVALID_FILE_TYPE: 'Unsupported File Type',
  STORAGE_QUOTA_EXCEEDED: 'Storage Full',
  CLOUD_UPLOAD_FAILED: 'Upload Failed',
  NO_FILE_PROVIDED: 'No File Selected',
  TOO_MANY_FILES: 'Too Many Files',
  UNEXPECTED_FIELD: 'Upload Error',
  UPLOAD_ERROR: 'Upload Error',
  VALIDATION_ERROR: 'Invalid Input',
  UNAUTHORIZED: 'Access Denied',
  INTERNAL_ERROR: 'Something Went Wrong',
};

// ── Fallback suggestions when server doesn't provide one ──
const FALLBACK_SUGGESTIONS = {
  FILE_TOO_LARGE: 'Try compressing or resizing your file to be under 10 MB.',
  INVALID_FILE_TYPE: 'Accepted formats: PNG, JPG, PDF, TXT, DOC, DOCX, XLS, XLSX, PPT, PPTX, MP4, ZIP.',
  STORAGE_QUOTA_EXCEEDED: 'Delete some files or empty your trash to free up space.',
  CLOUD_UPLOAD_FAILED: 'This is usually temporary. Wait a moment and try again.',
  NO_FILE_PROVIDED: 'Click the upload area or drag a file to select it.',
  UNAUTHORIZED: 'Please log in again and retry.',
};

const AUTO_DISMISS_MS = 8000;

export default function ErrorPopup({ error, onDismiss }) {
  const [exiting, setExiting] = useState(false);

  const handleDismiss = useCallback(() => {
    setExiting(true);
    setTimeout(() => {
      onDismiss?.();
    }, 350); // matches slideOut animation
  }, [onDismiss]);

  // Auto-dismiss timer
  useEffect(() => {
    const timer = setTimeout(handleDismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [handleDismiss]);

  if (!error) return null;

  const code = typeof error?.code === 'string' ? error.code : 'INTERNAL_ERROR';
  const title = ERROR_TITLES[code] || 'Error';
  const message = getErrorMessage(error, 'An unexpected error occurred. Please try again.');
  const suggestion = typeof error?.suggestion === 'string' ? error.suggestion : FALLBACK_SUGGESTIONS[code] || null;

  return (
    <div className="error-popup-backdrop">
      <div className={`error-popup ${exiting ? 'exiting' : ''}`}>
        {/* Auto-dismiss progress bar */}
        <div
          className="error-popup-progress"
          style={{ '--dismiss-duration': `${AUTO_DISMISS_MS}ms` }}
        />

        <div className="error-popup-content">
          {/* Header: icon + title + close */}
          <div className="error-popup-header">
            <div className="error-popup-icon">
              <AlertTriangle />
            </div>
            <div className="error-popup-title-row">
              <h3 className="error-popup-title">{title}</h3>
              <button
                className="error-popup-close"
                onClick={handleDismiss}
                aria-label="Dismiss error"
              >
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>
          </div>

          {/* Error message */}
          <p className="error-popup-message">{message}</p>

          {/* Suggestion box */}
          {suggestion && (
            <div className="error-popup-suggestion">
              <Lightbulb />
              <span>{suggestion}</span>
            </div>
          )}

          {/* Error code badge */}
          <div className="error-popup-code">{code}</div>

          {/* Dismiss button */}
          <button className="error-popup-dismiss" onClick={handleDismiss}>
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
