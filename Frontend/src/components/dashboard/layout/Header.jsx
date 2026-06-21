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
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '../../../store/slices/authSlice';
import { addNotification } from '../../../store/slices/notificationsSlice';
import { connectSocket, socket } from "../../../socket";
import ThemeToggle from '../../ui/ThemeToggle';

const Header = ({
  searchQuery,
  setSearchQuery,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
}) => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const authLoading = useSelector((state) => state.auth.loading);
  const notifications = useSelector((state) => state.notifications.notifications);
  const currentPlan = useSelector((state) => state.payment.currentPlan);

  const [isDark, setIsDark] = useState(false);
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  useEffect(() => {
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    checkTheme();

    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (user?.id) {
      connectSocket();
      socket.emit("join", user.id);

      const handleNewNotification = (notification) => {
        dispatch(addNotification(notification));
      };

      socket.on("notification", handleNewNotification);

      return () => {
        socket.off("notification", handleNewNotification);
      };
    }
  }, [user, dispatch]);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    window.location.href = '/login';
  };

  const getUserInitial = () => {
    if (user?.username && user.username.trim().length > 0) {
      return user.username.trim().charAt(0).toUpperCase();
    }
    if (user?.name && user.name.trim().length > 0) {
      return user.name.trim().charAt(0).toUpperCase();
    }
    return 'U';
  };

  const unreadCount = notifications.filter((n) => !n.isRead && !n.read).length;
  const subscriptionPlan = user?.subscriptionPlan || currentPlan || 'BASIC';

  const navClass = isDark
    ? 'fixed top-0 w-full bg-[#0f172a]/80 backdrop-blur-md z-50 border-b border-slate-800/60'
    : 'fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-200/60';

  const iconBtnClass = isDark
    ? 'p-2 text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-lg transition-colors duration-200'
    : 'p-2 text-gray-600 hover:text-emerald-600 hover:bg-gray-100 rounded-lg transition-colors duration-200';

  const inputClass = isDark
    ? 'w-80 lg:w-96 pl-10 pr-8 py-2 bg-slate-800/60 text-slate-100 placeholder-slate-400 border border-slate-700/50 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent focus:bg-slate-800/80 transition-all'
    : 'w-80 lg:w-96 pl-10 pr-8 py-2 bg-gray-100 text-gray-800 placeholder-gray-500 border border-transparent rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:border-gray-300 transition-all';

  const upgradeBtnClass = isDark
    ? 'h-10 items-center gap-2 rounded-lg border border-slate-700/60 bg-slate-800/50 px-2.5 text-left transition-colors duration-200 hover:border-emerald-500/40 hover:bg-slate-800 lg:gap-2.5 lg:px-3'
    : 'h-10 items-center gap-2 rounded-lg border border-gray-200 bg-gray-50/80 px-2.5 text-left transition-colors duration-200 hover:border-emerald-200 hover:bg-emerald-50/70 lg:gap-2.5 lg:px-3';

  const upgradeIconClass = isDark
    ? 'flex h-7 w-7 items-center justify-center rounded-md bg-emerald-500/15 text-emerald-400 transition-colors duration-200 group-hover:bg-emerald-500/25 group-hover:text-emerald-300'
    : 'flex h-7 w-7 items-center justify-center rounded-md bg-emerald-100 text-emerald-600 transition-colors duration-200 group-hover:bg-emerald-200 group-hover:text-emerald-700';

  const upgradeTitleClass = isDark
    ? 'text-sm font-semibold leading-none text-slate-100 transition-colors duration-200 group-hover:text-emerald-300'
    : 'text-sm font-semibold leading-none text-gray-900 transition-colors duration-200 group-hover:text-emerald-700';

  const upgradeMetaClass = isDark
    ? 'mt-1 text-[10px] font-medium leading-none text-slate-400'
    : 'mt-1 text-[10px] font-medium leading-none text-gray-500';

  const dropdownClass = isDark
    ? 'absolute right-0 mt-2 w-64 bg-[#0f172a]/95 backdrop-blur-md rounded-xl shadow-2xl border border-slate-700/50 py-2 z-50 animate-slideDown'
    : 'absolute right-0 mt-2 w-64 bg-white/95 backdrop-blur-md rounded-xl shadow-2xl border border-gray-200/50 py-2 z-50 animate-slideDown';

  if (authLoading && !user) {
    const skeletonBg = isDark ? 'bg-slate-700' : 'bg-gray-200';
    return (
      <nav className={navClass}>
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center space-x-4">
              <div className={`w-8 h-8 ${skeletonBg} rounded-lg animate-pulse`} />
              <div className={`w-24 h-4 ${skeletonBg} rounded animate-pulse hidden sm:block`} />
            </div>
            <div className="flex items-center space-x-3">
              <div className={`w-8 h-8 ${skeletonBg} rounded-full animate-pulse`} />
              <div className={`w-20 h-3 ${skeletonBg} rounded animate-pulse hidden lg:block`} />
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

              <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate('/')}>
                <div className="w-8 h-8 bg-linear-to-br bg-green-600 hover:bg-green-700 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <Cloud className="w-5 h-5 text-white" />
                </div>
                <span className={`font-bold text-xl ${isDark ? 'text-white' : 'text-gray-900'} hidden sm:block`}>
                  DataStock
                </span>
              </div>

              <div className="hidden md:flex items-center">
                <div className="relative">
                  <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-slate-400' : 'text-gray-400'}`} />
                  <input
                    type="text"
                    placeholder="Search files and folders..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={inputClass}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className={`absolute right-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-400 hover:text-white' : 'text-gray-400 hover:text-gray-600'} text-lg leading-none`}
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
                className={`${upgradeBtnClass} group hidden md:flex max-w-44 lg:max-w-none`}
              >
                <div className={upgradeIconClass}>
                  <Star size={15} />
                </div>
                <div className="min-w-0 text-left">
                  <p className={`${upgradeTitleClass} truncate`}>
                    <span className="lg:hidden">
                      {subscriptionPlan === 'BASIC' ? 'Upgrade' : 'Plan'}
                    </span>
                    <span className="hidden lg:inline">
                      {subscriptionPlan === 'BASIC' ? 'Upgrade to Pro' : 'Manage Plan'}
                    </span>
                  </p>
                  <p className={`${upgradeMetaClass} hidden lg:block`}>
                    {subscriptionPlan === 'BASIC' ? 'Get 2TB & premium support' : `Current: ${subscriptionPlan}`}
                  </p>
                </div>
                <ArrowLeft size={14} className={`ml-0.5 rotate-180 transition-colors duration-200 ${isDark ? 'text-slate-500 group-hover:text-emerald-300' : 'text-gray-400 group-hover:text-emerald-700'}`} />
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
                  <span className={`absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ${isDark ? 'ring-[#0f172a]' : 'ring-white'}`} />
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
                  className={`flex items-center space-x-2 p-1.5 ${isDark ? 'hover:bg-slate-800/60' : 'hover:bg-gray-100'} rounded-lg transition-colors duration-200`}
                  aria-label="User menu"
                >
                  <div className="w-8 h-8 bg-linear-to-br from-emerald-400 to-cyan-400 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/20 overflow-hidden">
                    {user?.imageUrl ? (
                      <img src={user.imageUrl} className="w-8 h-8 rounded-full object-cover" alt="Profile" />
                    ) : (
                      <span className="text-white text-sm font-medium">{getUserInitial()}</span>
                    )}
                  </div>
                  <div className="hidden lg:block text-left">
                    <span className={`block text-sm font-medium ${isDark ? 'text-white' : 'text-gray-800'} leading-tight`}>
                      {user?.username}
                    </span>
                    <span className={`block text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'} leading-tight`}>
                      {user?.email}
                    </span>
                  </div>
                  <ChevronDown className={`hidden sm:block w-4 h-4 ${isDark ? 'text-slate-400' : 'text-gray-400'}`} />
                </button>

                {showUserMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                    <div className={dropdownClass}>
                      <div className={`px-4 py-3 border-b ${isDark ? 'border-slate-700/50' : 'border-gray-200/50'}`}>
                        <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>{user?.username || user?.name}</p>
                        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'} truncate`}>{user?.email}</p>
                      </div>
                      <div className="py-1">
                        <button
                          onClick={() => { navigate('/profile'); setShowUserMenu(false); }}
                          className={`flex items-center w-full px-4 py-2 text-sm ${isDark ? 'text-slate-300 hover:text-white hover:bg-slate-800/60' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'} transition`}
                        >
                          <User className={`w-4 h-4 mr-3 ${isDark ? 'text-slate-400' : 'text-gray-400'}`} />
                          Your Profile
                        </button>
                        <button
                          onClick={() => { navigate('/settings'); setShowUserMenu(false); }}
                          className={`flex items-center w-full px-4 py-2 text-sm ${isDark ? 'text-slate-300 hover:text-white hover:bg-slate-800/60' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'} transition`}
                        >
                          <Settings className={`w-4 h-4 mr-3 ${isDark ? 'text-slate-400' : 'text-gray-400'}`} />
                          Account Settings
                        </button>
                      </div>
                      <div className={`border-t ${isDark ? 'border-slate-700/50' : 'border-gray-200/50'} my-1`} />
                      <div className="py-1">
                        <button
                          onClick={handleLogout}
                          className={`flex items-center w-full px-4 py-2 text-sm ${isDark ? 'text-red-400 hover:text-red-300 hover:bg-red-500/10' : 'text-red-600 hover:text-red-700 hover:bg-red-50'} transition`}
                        >
                          <LogOut className="w-4 h-4 mr-3" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <button
                onClick={() => setShowMobileSearch(!showMobileSearch)}
                className={`${iconBtnClass} md:hidden`}
                aria-label="Toggle search"
              >
                <Search className="w-5 h-5" />
              </button>
            </div>
          </div>

          {showMobileSearch && (
            <div className="py-2 pb-3 md:hidden animate-slideDown">
              <div className="relative">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-slate-400' : 'text-gray-400'}`} />
                <input
                  type="text"
                  placeholder="Search files..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 ${isDark ? 'bg-slate-800/60 text-slate-100 placeholder-slate-400 border-slate-700/50' : 'bg-gray-100 text-gray-800 placeholder-gray-500 border-gray-200'} border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent`}
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
