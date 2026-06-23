import multer from "multer";

// ── Helper: format bytes to human-readable ──
const formatBytes = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

export const errorHandler = (err, req, res, next) => {
  // Default values
  let status = err.statusCode || 500;
  let code = err.code || "INTERNAL_ERROR";
  let message = err.message || "Internal server error";
  let suggestion = null;

  // ── Multer errors ──
  if (err instanceof multer.MulterError) {
    switch (err.code) {
      case "LIMIT_FILE_SIZE":
        status = 413;
        code = "FILE_TOO_LARGE";
        // Use configured max size from multer options if available, fallback to 10 MB
        const maxSize = (err?.limits?.fileSize) || 10 * 1024 * 1024;
        message = `File is too large. Maximum allowed size is ${formatBytes(maxSize)}.`;
        suggestion = "Compress your file or split it into smaller parts before uploading.";
        break;
      case "LIMIT_FILE_COUNT":
        status = 400;
        code = "TOO_MANY_FILES";
        message = "Only one file can be uploaded at a time.";
        break;
      case "LIMIT_UNEXPECTED_FILE":
        status = 400;
        code = "UNEXPECTED_FIELD";
        message = "Unexpected file field. Use the 'file' field name for uploads.";
        break;
      default:
        status = 400;
        code = "UPLOAD_ERROR";
        message = err.message || "An error occurred during file upload.";
    }
  }

  // ── Custom file type error from fileFilter ──
  else if (err.code === "INVALID_FILE_TYPE") {
    status = 415;
    code = "INVALID_FILE_TYPE";
    message = err.message || "File type not allowed. Please upload a supported format.";
    suggestion = "Please upload a file in one of the accepted formats.";
  }

  // ── Storage quota exceeded ──
  else if (err.code === "STORAGE_QUOTA_EXCEEDED") {
    status = 403;
    code = "STORAGE_QUOTA_EXCEEDED";
    message = err.message || "You have exceeded your storage quota.";
    suggestion = "Delete some files or upgrade your plan to get more storage.";
  }

  // ── Cloudinary upload failures ──
  else if (err.code === "CLOUD_UPLOAD_FAILED") {
    status = 502;
    code = "CLOUD_UPLOAD_FAILED";
    message = err.message || "Failed to upload to Cloudinary. Please try again later.";
    suggestion = "This is a temporary issue. Please try again in a moment.";
  }

  // ── No file provided ──
  else if (err.code === "NO_FILE_PROVIDED") {
    status = 400;
    code = "NO_FILE_PROVIDED";
    message = err.message || "No file was provided for upload.";
    suggestion = "Select a file before clicking Upload.";
  }

  // ── Validation errors (express-validator) ──
  else if (err.code === "VALIDATION_ERROR") {
    status = 422;
    code = "VALIDATION_ERROR";
    message = err.message || "Invalid request data.";
  }

  // ── Generic application errors with statusCode ──
  else if (err.statusCode) {
    status = err.statusCode;
  }

  // Log server-side errors for debugging
  if (status >= 500) {
    console.error(`[ERROR ${status}]`, err);
  }

  const response = {
    success: false,
    code,
    message,
  };

  if (suggestion) {
    response.suggestion = suggestion;
  }

  res.status(status).json(response);
};