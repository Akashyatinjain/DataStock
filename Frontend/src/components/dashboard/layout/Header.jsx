// components/Header.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  Cloud,
  Search,
  Bell,
  Settings,
  User,
  LogOut,
  ChevronDown,
  HelpCircle,
  Moon,
  Sun,
  Menu,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../../../api/auth.api';

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
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  const notificationsRef = useRef(null);

  // Fetch current user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/user/me', { credentials: 'include' });
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

  // Apply/remove dark mode class on <html>
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Close notifications dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notificationsRef.current && !notificationsRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications]);

  const handleLogout = async () => {
    try {
      await API.post('/auth/logout');
      navigate('/login');
    } catch (err) {
      console.error(err);
    }
  };

  const getUserInitial = () => {
    if (user?.name && user.name.trim().length > 0) return user.name.trim().charAt(0).toUpperCase();
    return 'U';
  };

  const notifications = [
    { id: 1, title: 'New file shared with you', message: 'Sarah shared "Project Proposal.pdf"', time: '5 min ago', unread: true },
    { id: 2, title: 'Storage almost full', message: 'You have used 45.2 GB of 100 GB', time: '2 hours ago', unread: true },
    { id: 3, title: 'File downloaded', message: 'team-photo.jpg was downloaded', time: 'Yesterday', unread: false },
  ];

  const unreadCount = notifications.filter((n) => n.unread).length;

  // Skeleton loader — avoids full layout shift while user data loads
  if (isLoading) {
    return (
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-sm z-50 border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse" />
              <div className="w-24 h-4 bg-gray-200 rounded animate-pulse hidden sm:block" />
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
              <div className="w-20 h-3 bg-gray-200 rounded animate-pulse hidden lg:block" />
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <>
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-slideDown { animation: slideDown 0.2s ease-out; }
      `}</style>

      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-sm z-50 border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">

            {/* ── Left ── */}
            <div className="flex items-center space-x-4">
              {/* Hamburger (mobile sidebar toggle) */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-gray-600 hover:text-green-600 hover:bg-gray-100 rounded-lg transition lg:hidden"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              {/* Logo */}
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-sm">
                  <Cloud className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-xl text-gray-900 hidden sm:block">DataStock</span>
              </div>

              {/* Search — Desktop */}
              <div className="hidden md:flex items-center">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search files and folders..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-80 lg:w-96 pl-10 pr-8 py-2 bg-gray-100 border-0 rounded-lg focus:ring-2 focus:ring-green-500 focus:bg-white transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none"
                      aria-label="Clear search"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* ── Right ── */}
            <div className="flex items-center space-x-1 sm:space-x-2">
              {/* Mobile search toggle */}
              <button
                onClick={() => setShowMobileSearch(!showMobileSearch)}
                className="p-2 text-gray-600 hover:text-green-600 hover:bg-gray-100 rounded-lg transition md:hidden"
                aria-label="Toggle search"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Dark mode toggle */}
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2 text-gray-600 hover:text-green-600 hover:bg-gray-100 rounded-lg transition hidden sm:block"
                title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              {/* Help */}
              <button
                onClick={() => navigate('/help')}
                className="p-2 text-gray-600 hover:text-green-600 hover:bg-gray-100 rounded-lg transition hidden sm:block"
                aria-label="Help"
              >
                <HelpCircle className="w-5 h-5" />
              </button>

              {/* Notifications */}
              <div className="relative hidden sm:block" ref={notificationsRef}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 text-gray-600 hover:text-green-600 hover:bg-gray-100 rounded-lg transition relative"
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 py-2 animate-slideDown">
                    <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
                      <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                      <button className="text-xs text-green-600 hover:text-green-700">Mark all read</button>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className={`px-4 py-3 hover:bg-gray-50 transition border-b border-gray-50 last:border-0 ${
                            notif.unread ? 'bg-green-50/30' : ''
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            <div
                              className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${
                                notif.unread ? 'bg-green-600' : 'bg-gray-300'
                              }`}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{notif.title}</p>
                              <p className="text-xs text-gray-600 mt-0.5">{notif.message}</p>
                              <p className="text-xs text-gray-400 mt-1">{notif.time}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Settings */}
              <button
                onClick={() => navigate('/settings')}
                className="p-2 text-gray-600 hover:text-green-600 hover:bg-gray-100 rounded-lg transition hidden sm:block"
                aria-label="Settings"
              >
                <Settings className="w-5 h-5" />
              </button>

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 p-1.5 hover:bg-gray-100 rounded-lg transition"
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
                    <span className="block text-sm font-medium text-gray-900 leading-tight">{user?.username}</span>
                    <span className="block text-xs text-gray-500 leading-tight">{user?.email}</span>
                  </div>
                  <ChevronDown className="hidden sm:block w-4 h-4 text-gray-400" />
                </button>

                {showUserMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50 animate-slideDown">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                      </div>
                      <div className="py-1">
                        <button
                          onClick={() => { navigate('/profile'); setShowUserMenu(false); }}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
                        >
                          <User className="w-4 h-4 mr-3 text-gray-400" />
                          Your Profile
                        </button>
                        <button
                          onClick={() => { navigate('/settings'); setShowUserMenu(false); }}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
                        >
                          <Settings className="w-4 h-4 mr-3 text-gray-400" />
                          Account Settings
                        </button>
                      </div>
                      <div className="border-t border-gray-100 my-1" />
                      <div className="py-1">
                        <button
                          onClick={handleLogout}
                          className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
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

          {/* Mobile Search — Expandable */}
          {showMobileSearch && (
            <div className="py-2 pb-3 md:hidden animate-slideDown">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search files..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-100 border-0 rounded-lg focus:ring-2 focus:ring-green-500 focus:bg-white"
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
