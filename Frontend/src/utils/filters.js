import { Image, Video, FileText, FileArchive } from 'lucide-react';

export const getMimeType = (file) =>
  file.type || file.mimeType || file.mimetype || '';

export const QUICK_FILTERS = [
  {
    name: 'Images',
    icon: Image,
    color: 'text-blue-500',
    filter: (f) => getMimeType(f).startsWith('image'),
  },
  {
    name: 'Videos',
    icon: Video,
    color: 'text-purple-500',
    filter: (f) => getMimeType(f).startsWith('video'),
  },
  {
    name: 'PDFs',
    icon: FileText,
    color: 'text-red-500',
    filter: (f) => getMimeType(f).includes('pdf'),
  },
  {
    name: 'ZIP Files',
    icon: FileArchive,
    color: 'text-yellow-500',
    filter: (f) =>
      (f.originalName || f.name || f.filename || '')
        .toLowerCase()
        .includes('.zip'),
  },
];

export const countByFilter = (files, filterFn) =>
  files.filter(filterFn).length;
