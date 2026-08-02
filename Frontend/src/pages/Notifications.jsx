import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Bell,
  ArrowLeft,
  CheckCircle2,
  Circle,
  Trash2,
  Upload,
  Users,
  Folder,
  Activity,
  Lock,
  Download,
  Search,
  Check,
  Loader2,
  Database,
  ChevronRight,
  ShieldCheck,
  CreditCard,
  AlertTriangle,
  RotateCcw,
  Eye,
  ExternalLink
} from 'lucide-react';
import {
  fetchNotifications,
  readNotification,
  readAllNotifications,
  addNotification,
} from '../store/slices/notificationsSlice';
import { fetchProfile } from '../store/slices/authSlice';
import { connectSocket, socket } from '../socket';
import ThemeToggle from '../components/ui/ThemeToggle';

// Custom CSS for card hovering, glows, and outline animations
const customStyles = `
  .notif-card {
    transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease, border-color 0.2s ease;
  }
  .notif-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px -5px rgba(59, 130, 246, 0.12);
  }
`;

export default function Notifications() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const notifications = useSelector((state) => state.notifications.notifications);
  const loading = useSelector((state) => state.notifications.loading);
  const user = useSelector((state) => state.auth.user);

  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [deletedIds, setDeletedIds] = useState([]);

  useEffect(() => {
    dispatch(fetchProfile());
    dispatch(fetchNotifications());
  }, [dispatch]);

  useEffect(() => {
    if (user?.id) {
      const activeSocket = connectSocket();

      const joinUserRoom = () => {
        if (activeSocket.connected && user?.id) {
          activeSocket.emit("join", user.id);
        }
      };

      joinUserRoom();
      activeSocket.on("connect", joinUserRoom);

      const handleNewNotification = (notification) => {
        dispatch(addNotification(notification));
      };

      activeSocket.on('notification', handleNewNotification);

      return () => {
        activeSocket.off('connect', joinUserRoom);
        activeSocket.off('notification', handleNewNotification);
      };
    }
  }, [user, dispatch]);

  const handleMarkAsRead = (notificationId) => {
    dispatch(readNotification(notificationId));
  };

  const handleMarkAllAsRead = () => {
    dispatch(readAllNotifications());
  };

  const handleDelete = (notificationId) => {
    setDeletedIds((prev) => [...prev, notificationId]);
  };

  // Expanded classification logic for richer notification types
  const getNotificationType = (notif) => {
    const msg = (notif.message || '').toLowerCase();
    const title = (notif.title || '').toLowerCase();

    if (msg.includes('upload') || title.includes('upload')) return 'upload';
    if (msg.includes('delete') || msg.includes('trash') || title.includes('delete') || title.includes('trash')) return 'delete';
    if (msg.includes('share') || msg.includes('shared') || title.includes('share') || title.includes('shared')) return 'share';
    if (msg.includes('folder') || title.includes('folder')) return 'folder';
    if (msg.includes('payment') || msg.includes('pro') || msg.includes('subscription') || title.includes('payment')) return 'payment';
    if (msg.includes('storage') || msg.includes('quota') || title.includes('storage')) return 'storage';
    if (msg.includes('login') || msg.includes('authorized') || title.includes('login')) return 'login';
    if (msg.includes('security') || msg.includes('password') || msg.includes('encryption') || title.includes('security')) return 'security';
    return 'system';
  };

  const getTypeConfig = (type) => {
    const configs = {
      upload: {
        icon: Upload,
        label: 'UPLOAD',
        color: 'text-emerald-500',
        bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/60 dark:border-emerald-800/40',
        badgeBg: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
      },
      delete: {
        icon: Trash2,
        label: 'TRASHED',
        color: 'text-rose-500',
        bg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200/60 dark:border-rose-800/40',
        badgeBg: 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
      },
      share: {
        icon: Users,
        label: 'SHARED',
        color: 'text-amber-500',
        bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200/60 dark:border-amber-800/40',
        badgeBg: 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
      },
      folder: {
        icon: Folder,
        label: 'FOLDER',
        color: 'text-blue-500',
        bg: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200/60 dark:border-blue-800/40',
        badgeBg: 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
      },
      payment: {
        icon: CreditCard,
        label: 'PAYMENT',
        color: 'text-purple-500',
        bg: 'bg-purple-50 dark:bg-purple-950/40 border-purple-200/60 dark:border-purple-800/40',
        badgeBg: 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300'
      },
      storage: {
        icon: AlertTriangle,
        label: 'STORAGE',
        color: 'text-orange-500',
        bg: 'bg-orange-50 dark:bg-orange-950/40 border-orange-200/60 dark:border-orange-800/40',
        badgeBg: 'bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300'
      },
      login: {
        icon: Activity,
        label: 'ACTIVITY',
        color: 'text-indigo-500',
        bg: 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200/60 dark:border-indigo-800/40',
        badgeBg: 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
      },
      security: {
        icon: Lock,
        label: 'SECURITY',
        color: 'text-slate-600 dark:text-slate-400',
        bg: 'bg-slate-100 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/40',
        badgeBg: 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
      },
      system: {
        icon: Bell,
        label: 'SYSTEM',
        color: 'text-sky-500',
        bg: 'bg-sky-50 dark:bg-sky-950/40 border-sky-200/60 dark:border-sky-800/40',
        badgeBg: 'bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300'
      }
    };
    return configs[type] || configs.system;
  };

  // Clean filename title formatter with extension trimming
  const formatCleanTitle = (title, msg) => {
    let t = title || 'Notification';
    t = t.replace(/^File "([^"]+)" uploaded$/i, '$1 uploaded');
    t = t.replace(/"/g, '');

    // Trim long filenames like IMG-202603-WA0028.jpg
    const match = t.match(/([a-zA-Z0-9_-]+\.(jpg|jpeg|png|gif|pdf|doc|docx|mp4|zip))/i);
    if (match) {
      const full = match[1];
      if (full.length > 20) {
        const base = full.split('.')[0];
        const trimmed = base.slice(0, 16) + '...';
        return t.replace(full, trimmed);
      }
    }
    return t;
  };

  const formatCleanMessage = (msg) => {
    if (!msg) return '';
    return msg.replace(/"/g, '');
  };

  const visibleNotifications = useMemo(() => {
    return notifications.filter((notif) => !deletedIds.includes(notif.id));
  }, [notifications, deletedIds]);

  const unreadCount = useMemo(() => {
    return visibleNotifications.filter((n) => !n.isRead && !n.read).length;
  }, [visibleNotifications]);

  const todayCount = useMemo(() => {
    const today = new Date().toDateString();
    return visibleNotifications.filter((n) => new Date(n.createdAt).toDateString() === today).length;
  }, [visibleNotifications]);

  const uploadCount = useMemo(() => {
    return visibleNotifications.filter((n) => getNotificationType(n) === 'upload').length;
  }, [visibleNotifications]);

  // Storage metrics
  const storageUsed = Math.max(0, Number(user?.storageUsed) || 0);
  const storageLimit = Number(user?.storageLimit) && !isNaN(user.storageLimit) && user.storageLimit > 0
    ? Number(user.storageLimit)
    : 10 * 1024 * 1024 * 1024;
  const storagePercentage = Math.max(0, Math.min(Math.round((storageUsed / storageLimit) * 100), 100));

  const formatStorage = (bytes) => {
    if (!bytes || isNaN(bytes) || bytes <= 0) return "0 MB";
    const gb = bytes / (1024 * 1024 * 1024);
    if (gb < 0.01) {
      const mb = bytes / (1024 * 1024);
      return `${mb.toFixed(1)} MB`;
    }
    return `${gb.toFixed(1)} GB`;
  };

  const filteredNotifications = useMemo(() => {
    return visibleNotifications.filter((notif) => {
      const type = getNotificationType(notif);
      const isRead = notif.isRead || notif.read;

      if (activeCategory === 'unread' && isRead) return false;
      if (activeCategory !== 'all' && activeCategory !== 'unread' && activeCategory !== type) {
        if (activeCategory === 'trash' && type === 'delete') { /* pass */ }
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
    { key: 'payment', label: 'Payment' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0F172A] pb-16 transition-colors duration-200 font-['Inter']">
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />
      
      {/* ── HEADER PANEL: COMPACT & BALANCED ── */}
      <div className="bg-white/90 dark:bg-[#1E293B]/90 backdrop-blur-xl border-b border-gray-200 dark:border-[#334155] py-3.5 sticky top-0 z-40 shadow-xs">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          
          {/* Row 1: Breadcrumb + Search + Controls */}
          <div className="flex items-center justify-between gap-3 mb-3">
            {/* Breadcrumb Navigation */}
            <div className="flex items-center space-x-1.5 text-xs font-bold text-gray-500 dark:text-[#94A3B8]">
              <span onClick={() => navigate('/dashboard')} className="hover:text-[#3B82F6] cursor-pointer transition">
                Home
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-gray-900 dark:text-white font-extrabold">Notifications</span>
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-extrabold text-[#3B82F6] bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 rounded-xl transition cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Mark all read</span>
                </button>
              )}
              <ThemeToggle />
            </div>
          </div>

          {/* Row 2: Search Input */}
          <div className="relative mb-3">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9.5 pr-4 py-2 text-xs font-semibold bg-gray-50 dark:bg-[#0F172A] text-gray-900 dark:text-white rounded-xl border border-gray-200 dark:border-[#334155] focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Row 3: Mini Category Chips */}
          <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-0.5">
            {categoriesList.map((cat) => {
              const isActive = activeCategory === cat.key;
              return (
                <button
                  key={cat.key}
                  onClick={() => setActiveCategory(cat.key)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-[#3B82F6] text-white shadow-xs'
                      : 'bg-gray-100 hover:bg-gray-200 dark:bg-[#0F172A] dark:hover:bg-[#334155] text-gray-600 dark:text-[#94A3B8]'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT CONTAINER (CENTERED & PROPORTIONATE) ── */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-6">

        {/* ── STATS MINI CARDS & STORAGE WIDGET ── */}
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-white dark:bg-[#1E293B] p-3.5 rounded-2xl border border-gray-200/80 dark:border-[#334155] shadow-xs text-center">
            <span className="text-xl font-extrabold text-[#3B82F6]">{unreadCount}</span>
            <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mt-0.5">Unread</p>
          </div>

          <div className="bg-white dark:bg-[#1E293B] p-3.5 rounded-2xl border border-gray-200/80 dark:border-[#334155] shadow-xs text-center">
            <span className="text-xl font-extrabold text-emerald-500">{todayCount}</span>
            <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mt-0.5">Today</p>
          </div>

          <div className="bg-white dark:bg-[#1E293B] p-3.5 rounded-2xl border border-gray-200/80 dark:border-[#334155] shadow-xs text-center">
            <span className="text-xl font-extrabold text-purple-500">{uploadCount}</span>
            <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mt-0.5">Uploads</p>
          </div>

          {/* Storage Mini Bar */}
          <div className="col-span-3 sm:col-span-1 bg-white dark:bg-[#1E293B] p-3.5 rounded-2xl border border-gray-200/80 dark:border-[#334155] shadow-xs flex flex-col justify-center">
            <div className="flex justify-between items-center text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-1">
              <span>Storage</span>
              <span className="text-[#3B82F6]">{storagePercentage}%</span>
            </div>
            <div className="w-full h-2 bg-gray-100 dark:bg-[#0F172A] rounded-full overflow-hidden">
              <div
                className="h-full bg-linear-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                style={{ width: `${storagePercentage}%` }}
              />
            </div>
            <p className="text-[9px] text-gray-400 font-medium truncate mt-1 text-center">
              {formatStorage(storageUsed)} / {formatStorage(storageLimit)}
            </p>
          </div>
        </div>

        {/* ── NOTIFICATIONS LOG FEED ── */}
        <div className="space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-[#334155] rounded-2xl">
              <Loader2 className="w-7 h-7 animate-spin text-[#3B82F6]" strokeWidth={2} />
              <p className="text-xs text-gray-400 font-semibold">Loading notifications...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            /* ── DELIGHTFUL EMPTY STATE ── */
            <div className="text-center py-16 bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-[#334155] rounded-3xl shadow-sm">
              <div className="text-4xl mb-3 animate-bounce">🎉</div>
              <h3 className="text-base font-extrabold text-gray-900 dark:text-white mb-1">
                {searchQuery.trim() ? 'No matching notifications' : "You're all caught up!"}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                {searchQuery.trim()
                  ? 'Try clearing your search query to see all activity logs.'
                  : 'No new notifications right now. Check back later for activity updates.'}
              </p>
            </div>
          ) : (
            groupedNotifications.map((group) => (
              <div key={group.id} className="space-y-2.5">
                {/* Section Header */}
                <h3 className="text-[10px] font-black text-gray-400 dark:text-gray-500 tracking-widest pl-1">
                  {group.title}
                </h3>
                
                <div className="space-y-2.5">
                  {group.items.map((notif) => {
                    const isRead = notif.isRead || notif.read;
                    const type = getNotificationType(notif);
                    const config = getTypeConfig(type);
                    const TypeIcon = config.icon;
                    
                    const cleanTitleText = formatCleanTitle(notif.title, notif.message);
                    const cleanMsgText = formatCleanMessage(notif.message);

                    return (
                      <div
                        key={notif.id}
                        className={`notif-card rounded-2xl border transition-all duration-200 bg-white dark:bg-[#1E293B] ${
                          !isRead
                            ? 'border-l-4 border-l-[#3B82F6] bg-blue-50/30 dark:bg-blue-950/20 border-gray-200 dark:border-[#334155] shadow-xs'
                            : 'border-l-2 border-l-gray-300 dark:border-l-slate-700 border-gray-200/70 dark:border-[#334155]/60 opacity-80 hover:opacity-100'
                        }`}
                      >
                        <div className="p-3 sm:p-3.5">
                          <div className="flex items-start gap-3">
                            
                            {/* Read / Unread Circle Action */}
                            <button
                              onClick={() => handleMarkAsRead(notif.id)}
                              className="mt-0.5 focus:outline-none transition cursor-pointer shrink-0"
                              aria-label={isRead ? 'Read' : 'Mark as read'}
                            >
                              {isRead ? (
                                <CheckCircle2 className="w-4.5 h-4.5 text-gray-300 dark:text-gray-600 hover:text-blue-500" strokeWidth={1.75} />
                              ) : (
                                <Circle className="w-4.5 h-4.5 text-[#3B82F6] hover:text-blue-600 animate-pulse" strokeWidth={2.25} />
                              )}
                            </button>

                            {/* Reduced 10% Compact Icon Box */}
                            <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${config.bg}`}>
                              <TypeIcon className={`w-4 h-4 ${config.color}`} />
                            </div>

                            {/* Content Body */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5 mb-0.5">
                                    <span className={`text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md ${config.badgeBg}`}>
                                      {config.label}
                                    </span>

                                    {!isRead && (
                                      <span className="bg-emerald-500 text-white text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-xs animate-pulse">
                                        NEW
                                      </span>
                                    )}
                                  </div>

                                  <h4 
                                    className={`text-xs sm:text-sm leading-snug truncate ${!isRead ? 'font-black text-gray-900 dark:text-white' : 'font-semibold text-gray-800 dark:text-gray-200'}`}
                                    title={notif.title || notif.message}
                                  >
                                    {cleanTitleText}
                                  </h4>

                                  <p className="text-xs text-gray-600 dark:text-[#94A3B8] mt-0.5 leading-relaxed truncate">
                                    {cleanMsgText}
                                  </p>
                                </div>

                                {/* Delete Action */}
                                <button
                                  onClick={() => handleDelete(notif.id)}
                                  className="p-1 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition text-gray-400 hover:text-red-500 cursor-pointer shrink-0"
                                  aria-label="Delete notification"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {/* Footer Metadata & Quick Actions */}
                              <div className="mt-2 pt-1.5 border-t border-gray-100 dark:border-[#334155]/50 flex justify-between items-center text-[10px]">
                                <span className="text-gray-600 dark:text-gray-300 font-extrabold uppercase tracking-wider">
                                  {config.label} LOG • {new Date(notif.createdAt).toLocaleTimeString('en-IN', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>

                                {/* Quick Action Button */}
                                <div className="flex items-center space-x-2">
                                  {type === 'upload' && (
                                    <button
                                      onClick={() => navigate('/dashboard')}
                                      className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/50 text-[#3B82F6] font-bold rounded-md hover:bg-blue-100 transition text-[10px] flex items-center gap-1"
                                    >
                                      <Eye className="w-3 h-3" /> View File
                                    </button>
                                  )}
                                  {type === 'delete' && (
                                    <button
                                      onClick={() => navigate('/trash')}
                                      className="px-2 py-0.5 bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 font-bold rounded-md hover:bg-rose-100 transition text-[10px] flex items-center gap-1"
                                    >
                                      <RotateCcw className="w-3 h-3" /> Restore
                                    </button>
                                  )}
                                  {type === 'share' && (
                                    <button
                                      onClick={() => navigate('/dashboard')}
                                      className="px-2 py-0.5 bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 font-bold rounded-md hover:bg-amber-100 transition text-[10px] flex items-center gap-1"
                                    >
                                      <ExternalLink className="w-3 h-3" /> View Shared
                                    </button>
                                  )}
                                  {type === 'folder' && (
                                    <button
                                      onClick={() => navigate('/dashboard')}
                                      className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/50 text-blue-600 font-bold rounded-md hover:bg-blue-100 transition text-[10px] flex items-center gap-1"
                                    >
                                      <Folder className="w-3 h-3" /> Open Folder
                                    </button>
                                  )}
                                </div>
                              </div>
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
    </div>
  );
}
