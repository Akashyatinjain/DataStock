import {
  HardDrive,
  Users,
  Clock,
  Star,
  Trash2,
  Archive,
  Bell,
  BarChart2,
} from 'lucide-react';

export const NAV_ITEMS = [
  { id: 'my-drive', label: 'My Drive', icon: HardDrive },
  { id: 'shared', label: 'Shared', icon: Users },
  { id: 'recent', label: 'Recent', icon: Clock },
  { id: 'starred', label: 'Starred', icon: Star },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'analytics', label: 'Storage Activity', icon: BarChart2 },
];

export const MORE_ITEMS = [
  { id: 'trash', label: 'Trash', icon: Trash2 },
  { id: 'archive', label: 'Archive', icon: Archive },
];

export const DEFAULT_STORAGE = { used: 0, total: 15 };
