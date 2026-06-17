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
  Star,
  ArrowLeft
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

  // Fixed nav classes – now always dark glassmorphism
  const navClass =
    'fixed top-0 w-full bg-[#0f172a]/80 backdrop-blur-md z-50 border-b border-slate-800/60';

  if (isLoading) {
    return (
      <nav className={navClass}>
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-slate-700 rounded-lg animate-pulse" />
              <div className="w-24 h-4 bg-slate-700 rounded animate-pulse hidden sm:block" />
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-slate-700 rounded-full animate-pulse" />
              <div className="w-20 h-3 bg-slate-700 rounded animate-pulse hidden lg:block" />
            </div>
          </div>
        </div>
      </nav>
    );
  }

  const iconBtnClass =
    'p-2 text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-lg transition-colors duration-200';

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

            {/* Left section */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={`${iconBtnClass} lg:hidden`}
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate('/')}>
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-cyan-400 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <Cloud className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-xl text-white hidden sm:block">DataStock</span>
              </div>

              {/* Desktop search */}
              <div className="hidden md:flex items-center">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search files and folders..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-80 lg:w-96 pl-10 pr-8 py-2 bg-slate-800/60 text-slate-100 placeholder-slate-400 border border-slate-700/50 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent focus:bg-slate-800/80 transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-lg leading-none"
                      aria-label="Clear search"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Right section */}
            <div className="flex items-center space-x-1 sm:space-x-2">
              {/* Upgrade / Manage Plan button – enhanced styling */}
              <button 
                onClick={() => navigate('/pricing')}
                className="hidden sm:flex items-center gap-3 bg-slate-800/60 backdrop-blur-sm rounded-xl px-4 py-2 border border-slate-700/50 hover:bg-slate-700/60 transition-all duration-200 group shadow-lg shadow-slate-900/30"
              >
                <div className="p-1.5 bg-emerald-500/20 rounded-lg group-hover:bg-emerald-500/30 transition">
                  <Star size={16} className="text-emerald-400" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-white group-hover:text-emerald-400 transition">
                    {user?.subscriptionPlan === 'BASIC' ? 'Upgrade to Pro' : 'Manage Plan'}
                  </p>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    {user?.subscriptionPlan === 'BASIC' ? 'Get 2TB & premium support' : `Current: ${user?.subscriptionPlan || 'BASIC'}`}
                  </p>
                </div>
                <ArrowLeft size={14} className="ml-1 rotate-180 text-slate-400 group-hover:text-white transition" />
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
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-[#0f172a]" />
                )}
              </button>

              <button
                onClick={() => navigate('/settings')}
                className={`${iconBtnClass} hidden sm:block`}
                aria-label="Settings"
              >
                <Settings className="w-5 h-5" />
              </button>

              {/* User menu */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 p-1.5 hover:bg-slate-800/60 rounded-lg transition-colors duration-200"
                  aria-label="User menu"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-cyan-400 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/20 overflow-hidden">
                    {user?.imageUrl ? (
                      <img src={user.imageUrl} className="w-8 h-8 rounded-full object-cover" alt="Profile" />
                    ) : (
                      <span className="text-white text-sm font-medium">{getUserInitial()}</span>
                    )}
                  </div>
                  <div className="hidden lg:block text-left">
                    <span className="block text-sm font-medium text-white leading-tight">{user?.username}</span>
                    <span className="block text-xs text-slate-400 leading-tight">{user?.email}</span>
                  </div>
                  <ChevronDown className="hidden sm:block w-4 h-4 text-slate-400" />
                </button>

                {showUserMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                    <div className="absolute right-0 mt-2 w-64 bg-[#0f172a]/95 backdrop-blur-md rounded-xl shadow-2xl border border-slate-700/50 py-2 z-50 animate-slideDown">
                      <div className="px-4 py-3 border-b border-slate-700/50">
                        <p className="text-sm font-medium text-white">{user?.name}</p>
                        <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                      </div>
                      <div className="py-1">
                        <button
                          onClick={() => { navigate('/profile'); setShowUserMenu(false); }}
                          className="flex items-center w-full px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800/60 transition"
                        >
                          <User className="w-4 h-4 mr-3 text-slate-400" />
                          Your Profile
                        </button>
                        <button
                          onClick={() => { navigate('/settings'); setShowUserMenu(false); }}
                          className="flex items-center w-full px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800/60 transition"
                        >
                          <Settings className="w-4 h-4 mr-3 text-slate-400" />
                          Account Settings
                        </button>
                      </div>
                      <div className="border-t border-slate-700/50 my-1" />
                      <div className="py-1">
                        <button
                          onClick={handleLogout}
                          className="flex items-center w-full px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition"
                        >
                          <LogOut className="w-4 h-4 mr-3" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Mobile search toggle */}
              <button
                onClick={() => setShowMobileSearch(!showMobileSearch)}
                className={`${iconBtnClass} md:hidden`}
                aria-label="Toggle search"
              >
                <Search className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Mobile search bar */}
          {showMobileSearch && (
            <div className="py-2 pb-3 md:hidden animate-slideDown">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search files..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-800/60 text-slate-100 placeholder-slate-400 border border-slate-700/50 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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