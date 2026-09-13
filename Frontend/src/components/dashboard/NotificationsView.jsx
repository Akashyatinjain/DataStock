import React, { useState, useMemo } from 'react';
import {
  Bell,
  Trash2,
  Upload,
  Users,
  Folder,
  Activity,
  Lock,
  Search,
  Check,
  CheckCircle2,
  Circle,
  Loader2,
  RotateCcw,
  AlertCircle
} from 'lucide-react';
import { formatFileSize, getFileType } from '../../utils/fileHelpers';

// Premium styling for timeline cards, compact spaces, and lifts
const customStyles = `
  .notif-timeline-card {
    transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .notif-timeline-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px -8px rgba(59, 130, 246, 0.08);
    border-color: rgba(59, 130, 246, 0.3);
  }
  .notif-timeline-card-unread:hover {
    box-shadow: 0 8px 20px -8px rgba(16, 185, 129, 0.1);
    border-color: rgba(16, 185, 129, 0.35);
  }
`;

export default function NotificationsView({
  notifications = [],
  loading = false,
  unreadCount = 0,
  onMarkAsRead,
  onMarkAllAsRead
}) {
  const [activeCategory, setActiveCategory] = useState('all'); // all, unread, upload, security, share, delete, folder, system
  const [searchQuery, setSearchQuery] = useState('');
  const [deletedIds, setDeletedIds] = useState([]);

  const handleLocalDelete = (id) => {
    setDeletedIds((prev) => [...prev, id]);
  };

  // Helper: Client-side classification based on text content (including restored & warning logs)
  const getNotificationType = (notif) => {
    const msg = (notif.message || '').toLowerCase();
    const title = (notif.title || '').toLowerCase();
    
    if (msg.includes('restore') || title.includes('restore')) return 'restore';
    if (msg.includes('warning') || msg.includes('limit') || title.includes('warning') || title.includes('limit')) return 'warning';
    if (msg.includes('encrypt') || msg.includes('e2ee') || title.includes('encrypt') || title.includes('e2ee')) return 'encryption';
    if (msg.includes('upload') || title.includes('upload')) return 'upload';
    if (msg.includes('delete') || msg.includes('trash') || title.includes('delete') || title.includes('trash')) return 'delete';
    if (msg.includes('share') || msg.includes('shared') || title.includes('share') || title.includes('shared')) return 'share';
    if (msg.includes('folder') || title.includes('folder')) return 'folder';
    if (msg.includes('login') || msg.includes('authorized') || title.includes('login')) return 'login';
    if (msg.includes('security') || msg.includes('password') || title.includes('security')) return 'security';
    return 'system';
  };

  // Helper: Get color themes & icons matching each classification type
  const getTypeConfig = (type) => {
    const configs = {
      upload: {
        icon: Upload,
        label: 'Upload Log',
        color: 'text-[#2563EB] dark:text-blue-400',
        bg: 'bg-blue-50 dark:bg-blue-950/30 border-blue-150 dark:border-blue-900/40'
      },
      delete: {
        icon: Trash2,
        label: 'Delete Log',
        color: 'text-red-600 dark:text-red-400',
        bg: 'bg-red-50 dark:bg-red-950/20 border-red-150 dark:border-red-900/30'
      },
      share: {
        icon: Users,
        label: 'Share Log',
        color: 'text-slate-700 dark:text-slate-300',
        bg: 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
      },
      folder: {
        icon: Folder,
        label: 'Folder Created',
        color: 'text-[#2563EB] dark:text-blue-400',
        bg: 'bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/30'
      },
      login: {
        icon: Activity,
        label: 'Login Alert',
        color: 'text-slate-700 dark:text-slate-300',
        bg: 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
      },
      security: {
        icon: Lock,
        label: 'Security Alert',
        color: 'text-slate-700 dark:text-slate-300',
        bg: 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
      },
      restore: {
        icon: RotateCcw,
        label: 'File Restored',
        color: 'text-emerald-600 dark:text-emerald-400',
        bg: 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-150 dark:border-emerald-900/30'
      },
      warning: {
        icon: AlertCircle,
        label: 'Storage Warning',
        color: 'text-amber-600 dark:text-amber-400',
        bg: 'bg-amber-50 dark:bg-amber-950/20 border-amber-150 dark:border-amber-900/30'
      },
      encryption: {
        icon: Lock,
        label: 'Encryption Log',
        color: 'text-[#2563EB] dark:text-blue-400',
        bg: 'bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/30'
      },
      system: {
        icon: Bell,
        label: 'System Notification',
        color: 'text-[#2563EB] dark:text-blue-400',
        bg: 'bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/30'
      }
    };
    return configs[type] || configs.system;
  };

  // Helper: Extract user names for shared items
  const getSharingAvatar = (msg) => {
    const words = msg.split(' ');
    const sharedIdx = words.findIndex(w => w.toLowerCase().includes('shared'));
    if (sharedIdx > 0) {
      return words.slice(0, sharedIdx).join(' ');
    }
    return null;
  };

  // Helper: File names shortener
  const formatNotificationMessage = (msg) => {
    return msg.replace(/"([^"]+)"/g, (match, p1) => {
      if (p1.length > 22) {
        const extIdx = p1.lastIndexOf('.');
        if (extIdx !== -1) {
          const ext = p1.slice(extIdx);
          const base = p1.slice(0, extIdx);
          if (base.length > 15) {
            return `"${base.slice(0, 10)}...${base.slice(-6)}${ext}"`;
          }
        }
        return `"${p1.slice(0, 18)}..."`;
      }
      return match;
    });
  };

  // Helper: Shorthand relative date calculation for feed items
  const formatTimeLabel = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 hour should map to 12
    const minutesStr = minutes < 10 ? '0' + minutes : minutes;
    return `${hours}:${minutesStr} ${ampm}`;
  };

  const visibleNotifications = useMemo(() => {
    return notifications.filter((notif) => !deletedIds.includes(notif.id));
  }, [notifications, deletedIds]);

  // Telemetry metrics counter
  const stats = useMemo(() => {
    const counts = { unread: 0, today: 0, security: 0, uploads: 0 };
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    visibleNotifications.forEach(n => {
      const type = getNotificationType(n);
      const isRead = n.isRead || n.read;
      const date = new Date(n.createdAt);
      
      if (!isRead) counts.unread++;
      if (date >= startOfToday) counts.today++;
      if (type === 'security' || type === 'login' || type === 'encryption') counts.security++;
      if (type === 'upload') counts.uploads++;
    });
    
    return counts;
  }, [visibleNotifications]);

  const filteredNotifications = useMemo(() => {
    return visibleNotifications.filter((notif) => {
      const type = getNotificationType(notif);
      const isRead = notif.isRead || notif.read;
      
      if (activeCategory === 'unread' && isRead) return false;
      if (activeCategory !== 'all' && activeCategory !== 'unread' && activeCategory !== type) {
        if (activeCategory === 'delete' && type === 'delete') { /* pass */ }
        else return false;
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const titleMatch = (notif.title || '').toLowerCase().includes(query);
        const msgMatch = (notif.message || '').toLowerCase().includes(query);
        return titleMatch || msgMatch;
      }

      return true;
    });
  }, [visibleNotifications, activeCategory, searchQuery]);

  const groupedNotifications = useMemo(() => {
    const today = [];
    const yesterday = [];
    const lastWeek = [];
    const older = [];

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);
    const startOfLastWeek = new Date(startOfToday.getTime() - 7 * 24 * 60 * 60 * 1000);

    filteredNotifications.forEach((notif) => {
      const date = new Date(notif.createdAt);
      if (date >= startOfToday) {
        today.push(notif);
      } else if (date >= startOfYesterday) {
        yesterday.push(notif);
      } else if (date >= startOfLastWeek) {
        lastWeek.push(notif);
      } else {
        older.push(notif);
      }
    });

    return [
      { id: 'today', title: 'TODAY', items: today },
      { id: 'yesterday', title: 'YESTERDAY', items: yesterday },
      { id: 'lastWeek', title: 'LAST WEEK', items: lastWeek },
      { id: 'older', title: 'OLDER NOTIFICATIONS', items: older }
    ].filter(g => g.items.length > 0);
  }, [filteredNotifications]);

  const categoriesList = [
    { key: 'all', label: 'All' },
    { key: 'unread', label: 'Unread' },
    { key: 'upload', label: 'Uploads' },
    { key: 'security', label: 'Security' },
    { key: 'share', label: 'Sharing' },
    { key: 'delete', label: 'Trash' },
    { key: 'folder', label: 'Folders' },
    { key: 'system', label: 'System' }
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />
      
      {/* ── 1. HEADER FILTERS AND DYNAMIC STATS PANEL ── */}
      <div className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-slate-800 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-[#2563EB] rounded-lg flex items-center justify-center shadow-xs text-white">
              <Bell className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#0F172A] dark:text-[#F8FAFC] tracking-tight">Notifications</h2>
              <p className="text-[11px] text-[#64748B] dark:text-slate-400 font-medium">
                Workspace Activity & Audit Logs
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex-1 md:w-60 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#64748B]" />
              <input
                type="text"
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8.5 pr-3 py-1.5 text-xs font-medium bg-[#F8FAFC] dark:bg-slate-800 text-[#0F172A] dark:text-[#F8FAFC] rounded-lg border border-[#E2E8F0] dark:border-slate-700 focus:outline-hidden focus:border-[#2563EB] transition-colors placeholder-[#64748B]"
              />
            </div>

            {unreadCount > 0 && (
              <button
                onClick={onMarkAllAsRead}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#2563EB] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20 hover:bg-blue-100 dark:hover:bg-blue-950/30 rounded-lg transition cursor-pointer active:scale-95 border border-blue-200/40"
              >
                <Check className="w-3.5 h-3.5" />
                Mark All Read
              </button>
            )}
          </div>
        </div>

        {/* Category filters */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pt-4 scrollbar-thin">
          {categoriesList.map((cat) => {
            const isActive = activeCategory === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-[#2563EB] text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-[#64748B] dark:text-slate-300 border border-transparent'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Dynamic Telemetry Stats Row */}
        <div className="flex flex-wrap gap-x-5 gap-y-2 mt-4 pt-3.5 border-t border-[#E2E8F0] dark:border-slate-800 text-[11px] font-medium text-[#64748B] dark:text-slate-400">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Unread: <span className="font-semibold text-[#0F172A] dark:text-white">{stats.unread}</span></span>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#2563EB]" /> Today: <span className="font-semibold text-[#0F172A] dark:text-white">{stats.today}</span></span>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-500" /> Security: <span className="font-semibold text-[#0F172A] dark:text-white">{stats.security}</span></span>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-400" /> Uploads: <span className="font-semibold text-[#0F172A] dark:text-white">{stats.uploads}</span></span>
        </div>
      </div>

      {/* ── 2. COMPACT CHRONOLOGICAL LOG FEED ── */}
      <div className="space-y-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 bg-white dark:bg-[#1E293B] border border-gray-100 dark:border-[#334155] rounded-3xl shadow-sm">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" strokeWidth={2} />
            <p className="text-xs text-gray-400 font-semibold">Parsing system events...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-[#1E293B] border border-gray-100 dark:border-[#334155] rounded-3xl shadow-sm">
            <Bell className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" strokeWidth={1.5} />
            <p className="text-gray-700 dark:text-[#94A3B8] text-base font-bold">
              {searchQuery.trim()
                ? 'No notifications match search'
                : activeCategory === 'unread'
                ? "You're all caught up!"
                : 'No notifications recorded'}
            </p>
            <p className="text-gray-400 dark:text-[#64748B] text-xs mt-1 font-semibold">
              New events will show here dynamically
            </p>
          </div>
        ) : (
          groupedNotifications.map((group) => (
            <div key={group.id} className="space-y-2.5">
              <h3 className="text-[11px] font-semibold text-[#64748B] dark:text-slate-400 tracking-wider uppercase pl-1">
                {group.title}
              </h3>
              
              <div className="space-y-2">
                {group.items.map((notif) => {
                  const isRead = notif.isRead || notif.read;
                  const type = getNotificationType(notif);
                  const config = getTypeConfig(type);
                  const TypeIcon = config.icon;
                  const shareUserName = type === 'share' ? getSharingAvatar(notif.message) : null;

                  return (
                    <div
                      key={notif.id}
                      className={`notif-timeline-card group relative rounded-xl border bg-white dark:bg-[#1E293B] cursor-pointer ${
                        !isRead
                          ? 'border-[#2563EB]/40 dark:border-blue-500/40 bg-blue-50/10 dark:bg-blue-950/10 shadow-3xs'
                          : 'border-[#E2E8F0] dark:border-slate-800'
                      }`}
                      onClick={() => !isRead && onMarkAsRead(notif.id)}
                    >
                      <div className="py-2.5 px-3.5">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center space-x-3 min-w-0">
                            
                            {/* Icon / Avatar */}
                            <div className="relative shrink-0 select-none">
                              {shareUserName ? (
                                <div className="w-8 h-8 rounded-full bg-slate-700 text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs">
                                  {shareUserName.charAt(0)}
                                </div>
                              ) : (
                                <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${config.bg}`}>
                                  <TypeIcon className={`w-4 h-4 ${config.color}`} />
                                </div>
                              )}
                              {!isRead && (
                                <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#2563EB] rounded-full ring-2 ring-white dark:ring-[#1E293B]" />
                              )}
                            </div>

                            {/* Core text section */}
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                <h4 className="text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC] leading-snug truncate">
                                  {formatNotificationMessage(notif.message)}
                                </h4>
                                {!isRead && (
                                  <span className="inline-flex px-1.5 py-0.25 rounded text-[8px] font-bold uppercase bg-blue-50 dark:bg-blue-950/40 text-[#2563EB] dark:text-blue-400 tracking-wider">
                                    New
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 text-[10px] font-medium text-[#64748B] dark:text-slate-400 mt-0.5">
                                <span>{config.label}</span>
                                <span>•</span>
                                <span>{formatTimeLabel(notif.createdAt)}</span>
                              </div>
                            </div>

                          </div>

                          {/* Hover action delete icon */}
                          <div className="shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleLocalDelete(notif.id);
                              }}
                              className="p-1 text-[#64748B] hover:text-red-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition opacity-0 group-hover:opacity-100 cursor-pointer"
                              title="Dismiss Event"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
