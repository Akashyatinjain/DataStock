// components/Header.jsx
import React, { useState, useEffect } from 'react';
import {
  Cloud,
  Search,
  Bell,
  Settings,
  User,
  LogOut,
  ChevronDown,
  HelpCircle,
  Menu,
  X,
  Star
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../../../api/auth.api';
import { apiUrl, authFetch, clearAuth } from '../../../utils/auth';
import { connectSocket, socket } from "../../../socket";
import { getNotifications } from '../../../api/notification.api';
import ThemeToggle from '../../ui/ThemeToggle';

const Header = ({
  searchQuery,
  setSearchQuery,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
}) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (user?.id) {
      connectSocket();
      socket.emit("join", user.id);

      const fetchNotifications = async () => {
        try {
          const res = await getNotifications();
          if (res.success) {
            setNotifications(res.notifications || []);
          }
        } catch (err) {
          console.error("Failed to fetch notifications:", err);
        }
      };
      fetchNotifications();

      const handleNewNotification = (notification) => {
        setNotifications((prev) => [notification, ...prev]);
      };

      socket.on("notification", handleNewNotification);

      return () => {
        socket.off("notification", handleNewNotification);
      };
    }
  }, [user]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await authFetch(apiUrl('/user/me'));
        const data = await res.json();
        setUser(data.user);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    await clearAuth();
  };

  const getUserInitial = () => {
    if (user?.name && user.name.trim().length > 0) return user.name.trim().charAt(0).toUpperCase();
    return 'U';
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const navClass =
    'fixed top-0 w-full bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm z-50 border-b border-gray-200 dark:border-gray-800';

  if (isLoading) {
    return (
      <nav className={navClass}>
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
              <div className="w-24 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse hidden sm:block" />
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
              <div className="w-20 h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse hidden lg:block" />
            </div>
          </div>
        </div>
      </nav>
    );
  }

  const iconBtnClass =
    'p-2 text-gray-600 hover:text-green-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-green-400 dark:hover:bg-gray-800 rounded-lg transition';

  return (
    <>
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-slideDown { animation: slideDown 0.2s ease-out; }
      `}</style>

      <nav className={navClass}>
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">

            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={`${iconBtnClass} lg:hidden`}
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-sm">
                  <Cloud className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-xl text-gray-900 dark:text-white hidden sm:block">DataStock</span>
              </div>

              <div className="hidden md:flex items-center">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search files and folders..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-80 lg:w-96 pl-10 pr-8 py-2 bg-gray-100 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500 border-0 rounded-lg focus:ring-2 focus:ring-green-500 focus:bg-white dark:focus:bg-gray-800 transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-lg leading-none"
                      aria-label="Clear search"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-1 sm:space-x-2">
              <button 
            onClick={() => navigate('/pricing')}
            className="bg-white/80 backdrop-blur-md rounded-2xl p-4 border border-gray-100 shadow-xl hover:shadow-2xl transition flex items-center gap-3 group">
            <div className="p-2 bg-purple-100 rounded-xl">
              <Star size={20} className="text-purple-600" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-gray-800 group-hover:text-green-600 transition">
                {user?.subscriptionPlan === 'BASIC' ? 'Upgrade to Pro' : 'Manage Plan'}
              </p>
              <p className="text-xs text-gray-500">
                {user?.subscriptionPlan === 'BASIC' ? 'Get 2TB & premium support' : `Current: ${user?.subscriptionPlan || 'BASIC'} plan`}
              </p>
            </div>
            <ArrowLeft size={16} className="ml-auto rotate-180 text-gray-400" />
          </button>
              <button
                onClick={() => setShowMobileSearch(!showMobileSearch)}
                className={`${iconBtnClass} md:hidden`}
                aria-label="Toggle search"
              >
                <Search className="w-5 h-5" />
              </button>

              <ThemeToggle />

              <button
                onClick={() => navigate('/help')}
                className={`${iconBtnClass} hidden sm:block`}
                aria-label="Help"
              >
                <HelpCircle className="w-5 h-5" />
              </button>

              <button
                onClick={() => navigate('/notifications')}
                className={`${iconBtnClass} relative hidden sm:block`}
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </button>

              <button
                onClick={() => navigate('/settings')}
                className={`${iconBtnClass} hidden sm:block`}
                aria-label="Settings"
              >
                <Settings className="w-5 h-5" />
              </button>

              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
                  aria-label="User menu"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-sm overflow-hidden">
                    {user?.imageUrl ? (
                      <img src={user.imageUrl} className="w-8 h-8 rounded-full object-cover" alt="Profile" />
                    ) : (
                      <span className="text-white text-sm font-medium">{getUserInitial()}</span>
                    )}
                  </div>
                  <div className="hidden lg:block text-left">
                    <span className="block text-sm font-medium text-gray-900 dark:text-gray-100 leading-tight">{user?.username}</span>
                    <span className="block text-xs text-gray-500 dark:text-gray-400 leading-tight">{user?.email}</span>
                  </div>
                  <ChevronDown className="hidden sm:block w-4 h-4 text-gray-400" />
                </button>

                {showUserMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                    <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50 animate-slideDown">
                      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user?.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                      </div>
                      <div className="py-1">
                        <button
                          onClick={() => { navigate('/profile'); setShowUserMenu(false); }}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                        >
                          <User className="w-4 h-4 mr-3 text-gray-400" />
                          Your Profile
                        </button>
                        <button
                          onClick={() => { navigate('/settings'); setShowUserMenu(false); }}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                        >
                          <Settings className="w-4 h-4 mr-3 text-gray-400" />
                          Account Settings
                        </button>
                      </div>
                      <div className="border-t border-gray-100 dark:border-gray-800 my-1" />
                      <div className="py-1">
                        <button
                          onClick={handleLogout}
                          className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition"
                        >
                          <LogOut className="w-4 h-4 mr-3" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {showMobileSearch && (
            <div className="py-2 pb-3 md:hidden animate-slideDown">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search files..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 dark:text-gray-100 border-0 rounded-lg focus:ring-2 focus:ring-green-500 focus:bg-white dark:focus:bg-gray-800"
                  autoFocus
                />
              </div>
            </div>
          )}
        </div>
      </nav>
    </>
  );
};

export default Header;
