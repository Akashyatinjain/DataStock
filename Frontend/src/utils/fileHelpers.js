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
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=16a34a&color=fff`
  );
};

export const FILE_TYPES = {
  image:   { icon: ImageIcon, color: 'text-sky-500',     bg: 'bg-sky-50 dark:bg-sky-950/40',     label: 'Image'    },
  video:   { icon: Video,     color: 'text-violet-500',  bg: 'bg-violet-50 dark:bg-violet-950/40',  label: 'Video'    },
  pdf:     { icon: FileText,  color: 'text-rose-500',    bg: 'bg-rose-50 dark:bg-rose-950/40',    label: 'PDF'      },
  zip:     { icon: Archive,   color: 'text-amber-500',   bg: 'bg-amber-50 dark:bg-amber-950/40',   label: 'ZIP'      },
  default: { icon: FileText,  color: 'text-slate-500',   bg: 'bg-slate-100 dark:bg-slate-800',   label: 'FILE'     },
};

export const getFileType = (mimeType, originalName = '') => {
  const ext = originalName ? originalName.split('.').pop().toLowerCase() : '';
  
  if (['docx', 'doc'].includes(ext) || mimeType?.includes('word')) {
    return { icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/40', label: 'DOCX' };
  }
  if (['xlsx', 'xls', 'csv'].includes(ext) || mimeType?.includes('sheet') || mimeType?.includes('excel')) {
    return { icon: FileText, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/40', label: 'XLSX' };
  }
  if (['pptx', 'ppt'].includes(ext) || mimeType?.includes('presentation') || mimeType?.includes('powerpoint')) {
    return { icon: FileText, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-950/40', label: 'PPTX' };
  }
  if (['png'].includes(ext)) {
    return { icon: ImageIcon, color: 'text-sky-500', bg: 'bg-sky-50 dark:bg-sky-950/40', label: 'PNG' };
  }
  if (['jpg', 'jpeg'].includes(ext)) {
    return { icon: ImageIcon, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/40', label: 'JPG' };
  }
  if (['webp', 'gif', 'svg'].includes(ext)) {
    return { icon: ImageIcon, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-950/40', label: ext.toUpperCase() };
  }
  if (['zip', 'rar', 'tar', '7z', 'gz'].includes(ext) || mimeType?.includes('zip') || mimeType?.includes('compressed')) {
    return { icon: Archive, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/40', label: 'ZIP' };
  }
  if (ext === 'pdf' || mimeType?.includes('pdf')) {
    return { icon: FileText, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-950/40', label: 'PDF' };
  }
  if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext) || mimeType?.includes('video')) {
    return { icon: Video, color: 'text-violet-500', bg: 'bg-violet-50 dark:bg-violet-950/40', label: 'MP4' };
  }
  if (['mp3', 'wav', 'ogg', 'm4a'].includes(ext) || mimeType?.includes('audio')) {
    return { icon: FileText, color: 'text-teal-500', bg: 'bg-teal-50 dark:bg-teal-950/40', label: 'MP3' };
  }
  if (ext && ext.length <= 5) {
    return { icon: FileText, color: 'text-slate-500', bg: 'bg-slate-100 dark:bg-slate-800', label: ext.toUpperCase() };
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
    text: 'text-sky-600 dark:text-sky-400',
    bg: 'bg-sky-50 dark:bg-sky-950/30',
    bar: 'bg-sky-500',
  },
  {
    key: 'videos',
    label: 'Videos',
    icon: Video,
    text: 'text-violet-600 dark:text-violet-400',
    bg: 'bg-violet-50 dark:bg-violet-950/30',
    bar: 'bg-violet-500',
  },
  {
    key: 'documents',
    label: 'Documents',
    icon: FileText,
    text: 'text-rose-600 dark:text-rose-400',
    bg: 'bg-rose-50 dark:bg-rose-950/30',
    bar: 'bg-rose-500',
  },
  {
    key: 'archives',
    label: 'Archives',
    icon: Archive,
    text: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    bar: 'bg-amber-500',
  },
  {
    key: 'others',
    label: 'Others',
    icon: Folder,
    text: 'text-slate-600 dark:text-[#94A3B8]',
    bg: 'bg-slate-50 dark:bg-[#1E293B]',
    bar: 'bg-slate-500',
  },
];

/**
 * Downloads a file with its exact original name and extension.
 * Handles encrypted (E2EE), unencrypted, and cross-origin file downloads.
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
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
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

    if (fileUrl.startsWith('blob:')) {
      const a = document.createElement('a');
      a.href = fileUrl;
      a.download = nameToSave;
      document.body.appendChild(a);
      a.click();
      a.remove();
      return true;
    }

    // Fetch binary blob to bypass browser cross-origin download attribute restrictions
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
    setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
    return true;
  } catch (err) {
    console.error('Blob download fallback:', err);
    const a = document.createElement('a');
    a.href = fileUrl;
    a.download = nameToSave;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    a.remove();
    return true;
  }
};


