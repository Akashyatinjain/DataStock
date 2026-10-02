// components/Header.jsx
import React, { useState } from 'react';
import {
  Search,
  Bell,
  Settings,
  User,
  LogOut,
  ChevronDown,
  HelpCircle,
  Menu,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '../../../store/slices/authSlice';

const Header = ({
  searchQuery,
  setSearchQuery,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  activeTab,
  setActiveTab,
}) => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const authLoading = useSelector((state) => state.auth.loading);
  const notifications = useSelector((state) => state.notifications.notifications);

  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);

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

  const navClass =
    'fixed top-0 w-full bg-white backdrop-blur-md z-50 border-b border-slate-200 transition-colors duration-200';

  const iconBtnClass =
    'p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors duration-200 cursor-pointer outline-none focus:outline-none';

  const inputClass =
    'w-72 sm:w-80 md:w-96 lg:w-[380px] xl:w-[420px] pl-9 pr-16 py-2 bg-slate-50 text-slate-900 placeholder-slate-400 border border-slate-200 rounded-lg outline-none focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] focus:bg-white transition-all shadow-3xs text-xs sm:text-sm font-normal';

  const dropdownClass =
    'absolute right-0 mt-2 w-60 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-slideDown';

  if (authLoading && !user) {
    return (
      <nav className={navClass}>
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-slate-200 rounded-lg animate-pulse" />
              <div className="w-24 h-4 bg-slate-200 rounded animate-pulse hidden sm:block" />
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-slate-200 rounded-full animate-pulse" />
              <div className="w-20 h-3 bg-slate-200 rounded animate-pulse hidden lg:block" />
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
      <nav className={navClass}>
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16 gap-4">

            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={`${iconBtnClass} lg:hidden`}
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              <div className="flex items-center space-x-2.5 cursor-pointer group" onClick={() => navigate('/')}>
                <img 
                  src="/datastock-logo.svg" 
                  alt="DataStock Logo" 
                  className="w-8 h-8 rounded-lg shadow-xs group-hover:scale-105 transition-transform duration-200" 
                />
                <div className="hidden sm:flex flex-col">
                  <span className="font-bold text-base leading-none tracking-tight text-slate-900">
                    Data<span className="text-[#2563EB]">Stock</span>
                  </span>
                  <span className="text-[10px] font-normal tracking-tight text-slate-500 mt-0.5">
                    Enterprise Cloud Storage
                  </span>
                </div>
              </div>

              <div className="hidden lg:flex items-center flex-1 max-w-2xl">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search files, folders..."
                    aria-label="Search files, folders"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={inputClass}
                  />
                  {!searchQuery && (
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5 pointer-events-none select-none text-[10px] font-medium text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded shadow-2xs">
                      <span>Ctrl</span>
                      <span className="font-semibold">K</span>
                    </div>
                  )}
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-lg leading-none cursor-pointer"
                      aria-label="Clear search"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4">
              <button
                onClick={() => navigate('/help')}
                className={`${iconBtnClass} hidden sm:block`}
                aria-label="Help"
              >
                <HelpCircle className="w-5 h-5" />
              </button>

              <button
                onClick={() => {
                  if (setActiveTab) {
                    setActiveTab('notifications');
                  } else {
                    navigate('/notifications');
                  }
                }}
                className={`${iconBtnClass} relative hidden sm:block`}
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-[#2563EB] rounded-full ring-2 ring-white" />
                )}
              </button>

              <button
                onClick={() => navigate('/profile')}
                className={`${iconBtnClass} hidden sm:block`}
                aria-label="Settings"
              >
                <Settings className="w-5 h-5" />
              </button>

              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 p-1.5 hover:bg-slate-100 rounded-lg transition-colors duration-200 cursor-pointer outline-none focus:outline-none"
                  aria-label="User menu"
                >
                  <div className="w-8 h-8 bg-[#2563EB] rounded-full flex items-center justify-center shadow-xs overflow-hidden text-white font-semibold text-xs">
                    {user?.imageUrl ? (
                      <img src={user.imageUrl} className="w-8 h-8 rounded-full object-cover" alt="Profile" />
                    ) : (
                      <span className="text-white">{getUserInitial()}</span>
                    )}
                  </div>
                  <div className="hidden lg:block text-left">
                    <span className="block text-xs font-semibold text-slate-900 leading-tight">
                      {user?.username || user?.name || 'User'}
                    </span>
                    <span className="block text-[11px] text-slate-500 leading-tight">
                      {user?.email}
                    </span>
                  </div>
                  <ChevronDown className="hidden sm:block w-3.5 h-3.5 text-slate-400" />
                </button>

                {showUserMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                    <div className={dropdownClass}>
                      <div className="px-4 py-3 border-b border-slate-200">
                        <p className="text-xs font-semibold text-slate-900">{user?.username || user?.name}</p>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">{user?.email}</p>
                      </div>
                      <div className="py-1">
                        <button
                          onClick={() => { navigate('/profile'); setShowUserMenu(false); }}
                          className="flex items-center w-full px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                        >
                          <User className="w-4 h-4 mr-3 text-slate-400" />
                          Your Profile
                        </button>
                        <button
                          onClick={() => { navigate('/profile'); setShowUserMenu(false); }}
                          className="flex items-center w-full px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                        >
                          <Settings className="w-4 h-4 mr-3 text-slate-400" />
                          Account Settings
                        </button>
                      </div>
                      <div className="border-t border-slate-200 my-1" />
                      <div className="py-1">
                        <button
                          onClick={handleLogout}
                          className="flex items-center w-full px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition cursor-pointer"
                        >
                          <LogOut className="w-4 h-4 mr-3 text-red-500" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <button
                onClick={() => setShowMobileSearch(!showMobileSearch)}
                className={`${iconBtnClass} lg:hidden`}
                aria-label="Toggle search"
              >
                <Search className="w-5 h-5" />
              </button>
            </div>
          </div>

          {showMobileSearch && (
            <div className="py-2 pb-3 lg:hidden animate-slideDown">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search files..."
                  aria-label="Search files"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm bg-slate-100 text-slate-900 placeholder-slate-400 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#2563EB]/25 focus:border-[#2563EB] outline-none focus:outline-none"
                  autoFocus
                />
              </div>
            </div>
          )}
        </div>
    </nav>
  );
};

export default React.memo(Header);
