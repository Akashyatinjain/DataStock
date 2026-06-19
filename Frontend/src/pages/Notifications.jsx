import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, ArrowLeft, CheckCircle2, Circle, Trash2, Filter } from 'lucide-react';
import { getNotifications, markAsRead, markAllAsRead } from '../api/notification.api';
import { connectSocket, socket } from '../socket';
import { authFetch, apiUrl } from '../utils/auth';
import ThemeToggle from '../components/ui/ThemeToggle';

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchUser();
    fetchNotifications();
  }, []);

  useEffect(() => {
    if (user?.id) {
      connectSocket();
      socket.emit('join', user.id);
      const handleNewNotification = (notification) => {
        setNotifications((prev) => [notification, ...prev]);
      };
      socket.on('notification', handleNewNotification);
      return () => {
        socket.off('notification', handleNewNotification);
      };
    }
  }, [user]);

  const fetchUser = async () => {
    try {
      const response = await authFetch(apiUrl('/user/me'));
      const data = await response.json();
      setUser(data.user);
    } catch (err) {
      console.error('Error fetching user:', err);
    }
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await getNotifications();
      if (res.success) {
        setNotifications(res.notifications || []);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === notificationId
            ? { ...notif, isRead: true }
            : notif
        )
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const handleDelete = (notificationId) => {
    setNotifications((prev) =>
      prev.filter((notif) => notif.id !== notificationId)
    );
  };

  const filteredNotifications = notifications.filter((notif) => {
    if (filter === 'unread') return !notif.isRead;
    if (filter === 'read') return notif.isRead;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-slate-900 transition-colors duration-200">
      {/* Header */}
      <div className="fixed top-0 w-full bg-white/95 dark:bg-gray-900/90 backdrop-blur-sm z-40 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
                aria-label="Back to dashboard"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-linear-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-lg shadow-green-500/20">
                  <Bell className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Notifications</h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="px-4 py-2 text-sm font-medium text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/40 rounded-lg transition"
                >
                  Mark all read
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        {/* Filters */}
        <div className="flex items-center space-x-2 mb-6">
          <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <div className="flex space-x-2">
            {['all', 'unread', 'read'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  filter === f
                    ? 'bg-green-600 text-white'
                    : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 bg-gray-200 dark:bg-gray-800 rounded-full animate-pulse mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Loading notifications...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-16">
              <Bell className="w-16 h-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-300 text-lg font-medium">
                {filter === 'unread'
                  ? "You're all caught up!"
                  : filter === 'read'
                  ? 'No read notifications'
                  : 'No notifications yet'}
              </p>
              <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
                {filter === 'all' && 'New activity will appear here'}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notif) => (
              <div
                key={notif.id}
                className={`rounded-xl border transition-all hover:shadow-md ${
                  !notif.isRead
                    ? 'border-green-200 dark:border-green-900/60 bg-green-50/70 dark:bg-green-950/20'
                    : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-700'
                }`}
              >
                <div className="p-4">
                  <div className="flex items-start space-x-4">
                    {/* Status Indicator */}
                    <button
                      onClick={() => handleMarkAsRead(notif.id)}
                      className="mt-1 focus:outline-none transition"
                      aria-label={notif.isRead ? 'Notification already read' : 'Mark notification as read'}
                    >
                      {notif.isRead ? (
                        <CheckCircle2 className="w-5 h-5 text-gray-400 dark:text-gray-500 hover:text-green-600 dark:hover:text-green-400" />
                      ) : (
                        <Circle className="w-5 h-5 text-green-600 dark:text-green-400 hover:text-gray-400 dark:hover:text-gray-500" />
                      )}
                    </button>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                            {notif.title || 'Notification'}
                          </p>
                          <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                            {notif.message}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDelete(notif.id)}
                          className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400"
                          aria-label="Delete notification"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          {formatDate(notif.createdAt)}
                        </p>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            !notif.isRead
                              ? 'bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-400'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                          }`}
                        >
                          {notif.isRead ? 'Read' : 'Unread'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
