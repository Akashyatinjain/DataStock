export const MAX_UPLOAD_SIZE = 10 * 1024 * 1024;

export const ALLOWED_UPLOAD_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'application/pdf',
  'video/mp4',
  'application/zip',
  'text/plain',
  'application/msword',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
];

export const ALLOWED_UPLOAD_LABELS = 'PNG, JPG, PDF, TXT, DOC, DOCX, XLS, XLSX, PPT, PPTX, MP4, ZIP';
export const ALLOWED_UPLOAD_ACCEPT = ALLOWED_UPLOAD_MIME_TYPES.join(',');

export const formatUploadSize = (bytes = MAX_UPLOAD_SIZE) => {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${parseFloat((bytes / (1024 ** index)).toFixed(1))} ${units[index]}`;
};

export const validateUploadFile = (file) => {
  if (!file) return null;

  if (file.size > MAX_UPLOAD_SIZE) {
    return {
      code: 'FILE_TOO_LARGE',
      message: `"${file.name}" is ${formatUploadSize(file.size)}, which exceeds the maximum upload size of ${formatUploadSize(MAX_UPLOAD_SIZE)}.`,
      suggestion: 'Compress your file or split it into smaller parts before uploading.',
    };
  }

  if (!ALLOWED_UPLOAD_MIME_TYPES.includes(file.type)) {
    return {
      code: 'INVALID_FILE_TYPE',
      message: `"${file.name}" has type "${file.type || 'unknown'}" which is not supported.`,
      suggestion: `Accepted formats: ${ALLOWED_UPLOAD_LABELS}.`,
    };
  }

  return null;
};
