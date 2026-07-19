import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Bell,
  ArrowLeft,
  CheckCircle2,
  Circle,
  Trash2,
  Filter,
  Upload,
  Users,
  Folder,
  Activity,
  Lock,
  Download,
  Star,
  Search,
  User,
  PlusCircle,
  Check,
  Loader2
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
  .notification-card {
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .notification-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 25px -10px rgba(59, 130, 246, 0.12);
    border-color: rgba(59, 130, 246, 0.35);
  }
  .notification-card-unread:hover {
    box-shadow: 0 10px 25px -10px rgba(16, 185, 129, 0.15);
    border-color: rgba(16, 185, 129, 0.35);
  }
`;

export default function Notifications() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const notifications = useSelector((state) => state.notifications.notifications);
  const loading = useSelector((state) => state.notifications.loading);
  const user = useSelector((state) => state.auth.user);
  
  // Category tabs & Search filters
  const [activeCategory, setActiveCategory] = useState('all'); // all, unread, upload, security, share, delete, folder, system
  const [searchQuery, setSearchQuery] = useState('');
  const [deletedIds, setDeletedIds] = useState([]);

  useEffect(() => {
    dispatch(fetchProfile());
    dispatch(fetchNotifications());
  }, [dispatch]);

  useEffect(() => {
    if (user?.id) {
      connectSocket();
      socket.emit('join', user.id);
      const handleNewNotification = (notification) => {
        dispatch(addNotification(notification));
      };
      socket.on('notification', handleNewNotification);
      return () => {
        socket.off('notification', handleNewNotification);
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

  // Helper: Client-side classification based on text content
  const getNotificationType = (notif) => {
    const msg = (notif.message || '').toLowerCase();
    const title = (notif.title || '').toLowerCase();
    
    if (msg.includes('upload') || title.includes('upload')) return 'upload';
    if (msg.includes('delete') || msg.includes('trash') || title.includes('delete') || title.includes('trash')) return 'delete';
    if (msg.includes('share') || msg.includes('shared') || title.includes('share') || title.includes('shared')) return 'share';
    if (msg.includes('folder') || title.includes('folder')) return 'folder';
    if (msg.includes('login') || msg.includes('authorized') || title.includes('login')) return 'login';
    if (msg.includes('security') || msg.includes('password') || msg.includes('encryption') || title.includes('security')) return 'security';
    return 'system';
  };

  // Helper: Get color themes & icons matching each classification type
  const getTypeConfig = (type) => {
    const configs = {
      upload: {
        icon: Upload,
        color: 'text-emerald-600 dark:text-emerald-400',
        bg: 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30'
      },
      delete: {
        icon: Trash2,
        color: 'text-rose-600 dark:text-rose-400',
        bg: 'bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30'
      },
      share: {
        icon: Users,
        color: 'text-amber-600 dark:text-amber-400',
        bg: 'bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30'
      },
      folder: {
        icon: Folder,
        color: 'text-blue-600 dark:text-blue-400',
        bg: 'bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/30'
      },
      login: {
        icon: Activity,
        color: 'text-purple-600 dark:text-purple-400',
        bg: 'bg-purple-50 dark:bg-purple-950/20 border-purple-100 dark:border-purple-900/30'
      },
      security: {
        icon: Lock,
        color: 'text-slate-600 dark:text-slate-400',
        bg: 'bg-slate-100 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800/40'
      },
      system: {
        icon: Bell,
        color: 'text-indigo-600 dark:text-indigo-400',
        bg: 'bg-indigo-50 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900/30'
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

  const visibleNotifications = useMemo(() => {
    return notifications.filter((notif) => !deletedIds.includes(notif.id));
  }, [notifications, deletedIds]);

  const unreadCount = useMemo(() => {
    return visibleNotifications.filter((n) => !n.isRead && !n.read).length;
  }, [visibleNotifications]);

  // Combined Search and Tab filter execution
  const filteredNotifications = useMemo(() => {
    return visibleNotifications.filter((notif) => {
      const type = getNotificationType(notif);
      const isRead = notif.isRead || notif.read;
      
      // 1. Tab selection logic
      if (activeCategory === 'unread' && isRead) return false;
      if (activeCategory !== 'all' && activeCategory !== 'unread' && activeCategory !== type) {
        // Special mapping for trash vs delete
        if (activeCategory === 'trash' && type === 'delete') { /* pass */ }
        else return false;
      }

      // 2. Search query matches message/title
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const titleMatch = (notif.title || '').toLowerCase().includes(query);
        const msgMatch = (notif.message || '').toLowerCase().includes(query);
        return titleMatch || msgMatch;
      }

      return true;
    });
  }, [visibleNotifications, activeCategory, searchQuery]);

  // Chronological buckets organizer
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
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-slate-900 pb-16 transition-colors duration-200">
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />
      
      {/* ── HEADER PANEL: BALANCED, PREMIUM HEADER CONSOLE ── */}
      <div className="bg-white dark:bg-[#1E293B] border-b border-gray-100 dark:border-[#334155] shadow-xs pt-4 pb-5 sticky top-0 z-40 backdrop-blur-md bg-white/95 dark:bg-[#1E293B]/95">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Back button pill & Title details */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="inline-flex items-center justify-center p-2 bg-gray-50 hover:bg-gray-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-gray-500 hover:text-gray-900 dark:text-[#94A3B8] dark:hover:text-white rounded-full transition-all duration-300 hover:-translate-x-0.5 active:scale-95 border border-gray-150 dark:border-slate-700 shadow-3xs cursor-pointer"
                aria-label="Back to dashboard"
              >
                <ArrowLeft className="w-4.5 h-4.5 stroke-[2]" />
              </button>

              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-md shadow-indigo-500/20">
                  <Bell className="w-5 h-5 text-white stroke-[2]" />
                </div>
                <div>
                  <h1 className="text-lg font-black text-gray-900 dark:text-[#F8FAFC] tracking-tight">Notifications</h1>
                  <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">
                    Telemetry Logs
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Console action controls (Search, Mark read, theme toggle) */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1 md:w-60 min-w-0">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search notifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9.5 pr-3 py-2 text-xs font-semibold bg-gray-50 dark:bg-slate-800 text-gray-950 dark:text-[#F8FAFC] rounded-xl border border-gray-150 dark:border-slate-750 focus:outline-hidden focus:border-blue-500/80 transition-all duration-300 placeholder-gray-400"
                />
              </div>

              <ThemeToggle />

              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-extrabold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20 hover:bg-blue-100 dark:hover:bg-blue-950/30 rounded-xl transition cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  Mark Read ({unreadCount})
                </button>
              )}
            </div>
          </div>

          {/* Filtering Categories Bar */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pt-4.5 scrollbar-thin">
            {categoriesList.map((cat) => {
              const isActive = activeCategory === cat.key;
              return (
                <button
                  key={cat.key}
                  onClick={() => setActiveCategory(cat.key)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs shadow-blue-500/20'
                      : 'bg-gray-50 hover:bg-gray-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-gray-600 dark:text-[#94A3B8] border border-gray-100 dark:border-slate-750'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── NOTIFICATIONS LOG FEED ── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6">
        <div className="space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 bg-white dark:bg-[#1E293B] border border-gray-100 dark:border-[#334155] rounded-2xl">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" strokeWidth={2} />
              <p className="text-xs text-gray-400 font-semibold">Parsing system events...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-[#1E293B] border border-gray-100 dark:border-[#334155] rounded-2xl">
              <Bell className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" strokeWidth={1.5} />
              <p className="text-gray-700 dark:text-[#94A3B8] text-base font-bold">
                {searchQuery.trim()
                  ? 'No notifications match search'
                  : activeCategory === 'unread'
                  ? "You're all caught up!"
                  : 'No notifications recorded'}
              </p>
              <p className="text-gray-400 dark:text-[#64748B] text-xs mt-1 font-semibold">
                New network transactions will log here automatically
              </p>
            </div>
          ) : (
            groupedNotifications.map((group) => (
              <div key={group.id} className="space-y-2.5">
                {/* Time section header */}
                <h3 className="text-[10px] font-black text-gray-400 dark:text-slate-500 tracking-widest pl-2">
                  {group.title}
                </h3>
                
                <div className="space-y-3">
                  {group.items.map((notif) => {
                    const isRead = notif.isRead || notif.read;
                    const type = getNotificationType(notif);
                    const config = getTypeConfig(type);
                    const TypeIcon = config.icon;
                    
                    // Parse sharing details to show avatar initials
                    const shareUserName = type === 'share' ? getSharingAvatar(notif.message) : null;

                    return (
                      <div
                        key={notif.id}
                        className={`notification-card rounded-2xl border transition-all duration-300 bg-white dark:bg-[#1E293B] ${
                          !isRead
                            ? 'notification-card-unread border-emerald-200 dark:border-emerald-950/40 bg-emerald-50/20 dark:bg-emerald-950/5 shadow-3xs'
                            : 'border-gray-100 dark:border-slate-800'
                        }`}
                      >
                        <div className="p-4.5">
                          <div className="flex items-start space-x-4">
                            
                            {/* Actions check triggers (Read vs Unread circle checks) */}
                            <button
                              onClick={() => handleMarkAsRead(notif.id)}
                              className="mt-1 focus:outline-hidden transition cursor-pointer"
                              aria-label={isRead ? 'Read notification' : 'Mark as read'}
                            >
                              {isRead ? (
                                <CheckCircle2 className="w-5 h-5 text-gray-400 dark:text-[#64748B] hover:text-blue-500" strokeWidth={1.75} />
                              ) : (
                                <Circle className="w-5 h-5 text-emerald-500 hover:text-emerald-600 animate-pulse" strokeWidth={2.25} />
                              )}
                            </button>

                            {/* Color-Coordinated Outline Icon / User Avatar */}
                            <div className="shrink-0 mt-0.5">
                              {shareUserName ? (
                                <div className="w-8.5 h-8.5 rounded-full bg-linear-to-br from-indigo-500 to-purple-500 text-white flex items-center justify-center font-black text-xs uppercase shadow-sm border border-indigo-400/20">
                                  {shareUserName.charAt(0)}
                                </div>
                              ) : (
                                <div className={`w-8.5 h-8.5 rounded-xl border flex items-center justify-center shrink-0 ${config.bg}`}>
                                  <TypeIcon className={`w-4 h-4 ${config.color} stroke-[1.75]`} />
                                </div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2.5">
                                <div>
                                  <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">
                                    {type} log
                                  </span>
                                  <h4 className="text-sm font-extrabold text-gray-900 dark:text-[#F8FAFC] mt-0.5 leading-snug">
                                    {notif.title || 'System Notification'}
                                  </h4>
                                  <p 
                                    className="text-xs text-gray-600 dark:text-[#94A3B8] mt-1 font-semibold leading-relaxed"
                                    title={notif.message}
                                  >
                                    {formatNotificationMessage(notif.message)}
                                  </p>
                                </div>

                                {/* Clean deletion trigger */}
                                <button
                                  onClick={() => handleDelete(notif.id)}
                                  className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition text-gray-400 hover:text-red-500 cursor-pointer shrink-0"
                                  aria-label="Delete notification"
                                >
                                  <Trash2 className="w-4 h-4 stroke-[1.75]" />
                                </button>
                              </div>

                              <div className="flex items-center justify-between mt-3.5 pt-2 border-t border-gray-50 dark:border-slate-800/40">
                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                  {new Date(notif.createdAt).toLocaleTimeString('en-IN', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                                <span
                                  className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                                    !isRead
                                      ? 'bg-emerald-100 dark:bg-emerald-950/35 text-emerald-600 dark:text-emerald-400 border border-emerald-200/20'
                                      : 'bg-gray-100 dark:bg-slate-800 text-gray-500'
                                  }`}
                                >
                                  {isRead ? 'Read' : 'New'}
                                </span>
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
