import { 
  Image, 
  Video, 
  FileText, 
  FileArchive, 
  FileSpreadsheet, 
  Presentation,
  FileCheck
} from 'lucide-react';

export const getMimeType = (file) =>
  file.type || file.mimeType || file.mimetype || '';

export const getFileName = (file) =>
  (file.originalName || file.name || file.filename || '').toLowerCase();

export const QUICK_FILTERS = [
  {
    name: 'Images',
    icon: Image,
    color: 'text-[#3B82F6]',
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
    color: 'text-rose-500',
    filter: (f) => getMimeType(f).includes('pdf') || getFileName(f).endsWith('.pdf'),
  },
  {
    name: 'Word Docs',
    icon: FileCheck,
    color: 'text-blue-500',
    filter: (f) =>
      getMimeType(f).includes('word') ||
      getMimeType(f).includes('wordprocessingml') ||
      ['.docx', '.doc', '.dotx'].some((ext) => getFileName(f).endsWith(ext)),
  },
  {
    name: 'Spreadsheets',
    icon: FileSpreadsheet,
    color: 'text-emerald-500',
    filter: (f) =>
      getMimeType(f).includes('excel') ||
      getMimeType(f).includes('spreadsheetml') ||
      getMimeType(f).includes('csv') ||
      ['.xlsx', '.xls', '.csv', '.ods'].some((ext) => getFileName(f).endsWith(ext)),
  },
  {
    name: 'Presentations',
    icon: Presentation,
    color: 'text-orange-500',
    filter: (f) =>
      getMimeType(f).includes('powerpoint') ||
      getMimeType(f).includes('presentationml') ||
      ['.pptx', '.ppt', '.odp'].some((ext) => getFileName(f).endsWith(ext)),
  },
  {
    name: 'ZIP Files',
    icon: FileArchive,
    color: 'text-amber-500',
    filter: (f) =>
      ['.zip', '.rar', '.7z', '.tar', '.gz'].some((ext) => getFileName(f).endsWith(ext)) ||
      getMimeType(f).includes('zip') ||
      getMimeType(f).includes('compressed'),
  },
];

export const countByFilter = (files, filterFn) =>
  files.filter(filterFn).length;
