import { 
  Image as ImageIcon, 
  Video, 
  FileText, 
  Archive, 
  Folder 
} from 'lucide-react';

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
  image:   { icon: ImageIcon, color: 'text-sky-500',     bg: 'bg-sky-50',     label: 'Image'    },
  video:   { icon: Video,     color: 'text-violet-500',  bg: 'bg-violet-50',  label: 'Video'    },
  pdf:     { icon: FileText,  color: 'text-rose-500',    bg: 'bg-rose-50',    label: 'PDF'      },
  zip:     { icon: Archive,   color: 'text-amber-500',   bg: 'bg-amber-50',   label: 'Archive'  },
  default: { icon: FileText,  color: 'text-slate-500',   bg: 'bg-slate-50',   label: 'File'     },
};

export const getFileType = (mimeType) => {
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

