import { 
  Image as ImageIcon, 
  Video, 
  FileText, 
  Archive, 
  Folder 
} from 'lucide-react';
import { decryptSymmetricKeyWithRsa, decryptBuffer } from './cryptoHelper';

export const normalizeList = (data, key) =>
  Array.isArray(data) ? data : data?.[key] || [];

export const computeUsedGB = (files) => {
  const usedBytes = files.reduce((acc, f) => acc + (f.size || 0), 0);
  return +(usedBytes / (1024 ** 3)).toFixed(2);
};

export const getFolderId = (folder) => folder._id || folder.id;

export const normalizeFile = (file) => {
  if (!file) return file;
  const isStarred = file.isStarred ?? file.starred ?? false;
  const isArchived = file.isArchived ?? file.archived ?? false;
  return {
    ...file,
    id: file.id || file._id,
    isStarred,
    starred: isStarred,
    isArchived,
    archived: isArchived,
  };
};

export const getActiveFolderId = (activeTab) =>
  activeTab?.startsWith('folder-') ? activeTab.replace('folder-', '') : null;

export const getAvatarUrl = (profile) => {
  const name = profile?.name || 'User';
  return (
    profile?.imageUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=2563EB&color=fff`
  );
};

export const FILE_TYPES = {
  image:      { icon: ImageIcon, color: 'text-slate-500 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-800', label: 'Image' },
  video:      { icon: Video,     color: 'text-slate-500 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-800', label: 'Video' },
  pdf:        { icon: FileText,  color: 'text-slate-500 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-800', label: 'PDF' },
  zip:        { icon: Archive,   color: 'text-slate-500 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-800', label: 'ZIP' },
  audio:      { icon: FileText,  color: 'text-slate-500 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-800', label: 'Audio' },
  default:    { icon: FileText,  color: 'text-slate-500 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-800', label: 'FILE' },
};

export const getFileType = (mimeType, originalName = '') => {
  const ext = originalName ? originalName.split('.').pop().toLowerCase() : '';
  const neutralStyle = { icon: FileText, color: 'text-slate-500 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-800' };
  
  if (['docx', 'doc'].includes(ext) || mimeType?.includes('word')) {
    return { ...neutralStyle, icon: FileText, label: 'DOCX' };
  }
  if (['xlsx', 'xls', 'csv'].includes(ext) || mimeType?.includes('sheet') || mimeType?.includes('excel')) {
    return { ...neutralStyle, icon: FileText, label: 'XLSX' };
  }
  if (['pptx', 'ppt'].includes(ext) || mimeType?.includes('presentation') || mimeType?.includes('powerpoint')) {
    return { ...neutralStyle, icon: FileText, label: 'PPTX' };
  }
  if (['png'].includes(ext)) {
    return { ...neutralStyle, icon: ImageIcon, label: 'PNG' };
  }
  if (['jpg', 'jpeg'].includes(ext)) {
    return { ...neutralStyle, icon: ImageIcon, label: 'JPG' };
  }
  if (['webp', 'gif', 'svg'].includes(ext)) {
    return { ...neutralStyle, icon: ImageIcon, label: ext.toUpperCase() };
  }
  if (['zip', 'rar', 'tar', '7z', 'gz'].includes(ext) || mimeType?.includes('zip') || mimeType?.includes('compressed')) {
    return { ...neutralStyle, icon: Archive, label: 'ZIP' };
  }
  if (ext === 'pdf' || mimeType?.includes('pdf')) {
    return { ...neutralStyle, icon: FileText, label: 'PDF' };
  }
  if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext) || mimeType?.includes('video')) {
    return { ...neutralStyle, icon: Video, label: 'MP4' };
  }
  if (['mp3', 'wav', 'ogg', 'm4a'].includes(ext) || mimeType?.includes('audio')) {
    return { ...neutralStyle, icon: FileText, label: 'MP3' };
  }
  if (ext && ext.length <= 5) {
    return { ...neutralStyle, icon: FileText, label: ext.toUpperCase() };
  }

  if (mimeType?.includes('image')) return FILE_TYPES.image;
  if (mimeType?.includes('video')) return FILE_TYPES.video;
  if (mimeType?.includes('pdf'))   return FILE_TYPES.pdf;
  if (mimeType?.includes('zip'))   return FILE_TYPES.zip;
  return FILE_TYPES.default;
};

export const formatFileSize = (bytes) => {
  if (bytes === undefined || bytes === null || isNaN(bytes)) return '0 B';
  if (bytes < 1024)             return bytes + ' B';
  if (bytes < 1024 * 1024)      return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  if (bytes < 1024 * 1024 * 1024 * 1024) return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  return (bytes / (1024 * 1024 * 1024 * 1024)).toFixed(1) + ' TB';
};

export const ANALYTICS_CATEGORIES = [
  {
    key: 'images',
    label: 'Images',
    icon: ImageIcon,
    text: 'text-slate-900 dark:text-slate-100',
    bg: 'bg-slate-100 dark:bg-slate-800',
    bar: 'bg-[#2563EB]',
  },
  {
    key: 'documents',
    label: 'Documents',
    icon: FileText,
    text: 'text-slate-900 dark:text-slate-100',
    bg: 'bg-slate-100 dark:bg-slate-800',
    bar: 'bg-slate-600 dark:bg-slate-400',
  },
  {
    key: 'videos',
    label: 'Videos',
    icon: Video,
    text: 'text-slate-900 dark:text-slate-100',
    bg: 'bg-slate-100 dark:bg-slate-800',
    bar: 'bg-slate-500 dark:bg-slate-500',
  },
  {
    key: 'archives',
    label: 'Archives',
    icon: Archive,
    text: 'text-slate-900 dark:text-slate-100',
    bg: 'bg-slate-100 dark:bg-slate-800',
    bar: 'bg-slate-400 dark:bg-slate-600',
  },
  {
    key: 'others',
    label: 'Others',
    icon: Folder,
    text: 'text-slate-900 dark:text-slate-100',
    bg: 'bg-slate-100 dark:bg-slate-800',
    bar: 'bg-slate-300 dark:bg-slate-700',
  },
];

/**
 * Converts Cloudinary URL to direct attachment download URL using fl_attachment header
 */
export const getCloudinaryDownloadUrl = (url, fileName = '') => {
  if (!url || typeof url !== 'string' || !url.includes('res.cloudinary.com')) {
    return url;
  }
  if (url.includes('/fl_attachment')) {
    return url;
  }

  let flag = 'fl_attachment';
  if (fileName) {
    const sanitized = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    if (sanitized) {
      flag = `fl_attachment:${encodeURIComponent(sanitized)}`;
    }
  }

  if (url.includes('/upload/')) {
    return url.replace('/upload/', `/upload/${flag}/`);
  }
  return url;
};

/**
 * Downloads a file with its exact original name and extension.
 * Handles encrypted (E2EE), unencrypted, blob URLs, and cross-origin mobile file downloads.
 */
export const downloadSingleFile = async ({
  fileUrl,
  fileName,
  isEncrypted = false,
  encryptedKey = null,
  fileIv = null,
  mimeType = 'application/octet-stream',
  cryptoContext = {},
  addToast = () => {},
}) => {
  const nameToSave = fileName || 'download';

  // 1. Encrypted file download (E2EE)
  if (isEncrypted) {
    const { isE2eeUnlocked, privateKey } = cryptoContext;
    if (!isE2eeUnlocked || !privateKey) {
      addToast('Vault is locked. Unlock your E2EE key/password to download and decrypt this file.', 'error');
      return false;
    }

    try {
      addToast(`Decrypting "${nameToSave}"…`, 'info');
      const response = await fetch(fileUrl);
      if (!response.ok) throw new Error('Failed to fetch encrypted file');
      const encryptedBuffer = await response.arrayBuffer();

      const fileKey = await decryptSymmetricKeyWithRsa(encryptedKey, privateKey);
      const decryptedBuffer = await decryptBuffer(encryptedBuffer, fileKey, fileIv);

      const decryptedBlob = new Blob([decryptedBuffer], { type: mimeType || 'application/octet-stream' });
      const blobUrl = URL.createObjectURL(decryptedBlob);

      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = nameToSave;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 30000);
      return true;
    } catch (err) {
      console.error('E2EE download error:', err);
      addToast(`Failed to decrypt "${nameToSave}"`, 'error');
      return false;
    }
  }

  // 2. Unencrypted file download (or pre-decrypted blob URL)
  try {
    if (!fileUrl) return false;

    // Synchronous Blob URL download
    if (fileUrl.startsWith('blob:')) {
      const a = document.createElement('a');
      a.href = fileUrl;
      a.download = nameToSave;
      document.body.appendChild(a);
      a.click();
      a.remove();
      return true;
    }

    // Cloudinary direct attachment download (works 100% natively on iOS Safari, Android Chrome, mobile webviews)
    if (fileUrl.includes('res.cloudinary.com')) {
      const downloadUrl = getCloudinaryDownloadUrl(fileUrl, nameToSave);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = nameToSave;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      a.remove();
      return true;
    }

    // Fetch binary blob for cross-origin URLs
    const res = await fetch(fileUrl);
    if (!res.ok) throw new Error('Fetch failed');
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = nameToSave;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(blobUrl), 30000);
    return true;
  } catch (err) {
    console.error('Blob download fallback:', err);
    const safeUrl = getCloudinaryDownloadUrl(fileUrl, nameToSave);
    const a = document.createElement('a');
    a.href = safeUrl;
    a.download = nameToSave;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    a.remove();
    return true;
  }
};



