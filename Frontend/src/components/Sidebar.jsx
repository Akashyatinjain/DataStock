// components/Sidebar.jsx
import React, { useState, useEffect } from 'react';
import {
  HardDrive,
  Users,
  Clock,
  Star,
  Plus,
  ChevronRight,
  Trash2,
  Archive,
  Cloud,
  X,
  Menu
} from 'lucide-react';

const Sidebar = ({ 
  sidebarCollapsed, 
  setSidebarCollapsed, 
  activeTab, 
  setActiveTab,
  storageData,
  isMobileMenuOpen,
  setIsMobileMenuOpen 
}) => {
  const [isMobile, setIsMobile] = useState(false);

  // Check if screen is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      // Auto-collapse sidebar on mobile
      if (window.innerWidth < 768) {
        setSidebarCollapsed(true);
        setIsMobileMenuOpen(false);
      } else {
        setSidebarCollapsed(false);
        setIsMobileMenuOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [setSidebarCollapsed, setIsMobileMenuOpen]);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMobile && isMobileMenuOpen) {
        const sidebar = document.getElementById('mobile-sidebar');
        const menuButton = document.getElementById('mobile-menu-button');
        if (sidebar && !sidebar.contains(event.target) && 
            menuButton && !menuButton.contains(event.target)) {
          setIsMobileMenuOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobile, isMobileMenuOpen, setIsMobileMenuOpen]);

  const navItems = [
    { id: 'my-drive', label: 'My Drive', icon: HardDrive },
    { id: 'shared', label: 'Shared with me', icon: Users },
    { id: 'recent', label: 'Recent', icon: Clock },
    { id: 'starred', label: 'Starred', icon: Star },
  ];

  const moreItems = [
    { id: 'trash', label: 'Trash', icon: Trash2 },
    { id: 'archive', label: 'Archive', icon: Archive },
  ];

  const handleNavClick = (tabId) => {
    setActiveTab(tabId);
    // Close mobile menu after navigation
    if (isMobile) {
      setIsMobileMenuOpen(false);
    }
  };

  const sidebarContent = (
    <>
      <div className="p-4">
        {/* Mobile Close Button */}
        {isMobile && (
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition md:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* New Button */}
        <button className={`w-full bg-green-600 text-white rounded-xl hover:bg-green-700 transition flex items-center justify-center space-x-2 py-3 ${
          sidebarCollapsed && !isMobile ? 'px-0' : 'px-4'
        }`}>
          <Plus className="w-5 h-5" />
          {(!sidebarCollapsed || isMobile) && <span className="font-medium">New</span>}
        </button>

        {/* Main Navigation */}
        <nav className="mt-6 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition ${
                  activeTab === item.id
                    ? 'bg-green-50 text-green-600'
                    : 'text-gray-600 hover:bg-gray-100'
                } ${sidebarCollapsed && !isMobile ? 'justify-center' : ''}`}
              >
                <Icon className="w-5 h-5" />
                {(!sidebarCollapsed || isMobile) && (
                  <>
                    <span className="text-sm font-medium flex-1 text-left">{item.label}</span>
                    {activeTab === item.id && (
                      <span className="w-1.5 h-1.5 bg-green-600 rounded-full"></span>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </nav>

        {/* Divider */}
        <div className="my-4 border-t border-gray-200"></div>

        {/* Storage Info */}
        {(!sidebarCollapsed || isMobile) && (
          <div className="px-3">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Storage</p>
            <div className="mb-2">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-600">{storageData.used} GB used</span>
                <span className="text-gray-400">{storageData.total} GB</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all duration-500"
                  style={{ width: `${(storageData.used / storageData.total) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Storage Categories */}
            <div className="space-y-2 mt-4">
              {storageData.categories.map((cat, i) => (
                <div key={i} className="flex items-center justify-between text-xs group hover:bg-gray-50 p-1 rounded transition">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${cat.color} group-hover:scale-110 transition`}></div>
                    <span className="text-gray-600">{cat.name}</span>
                  </div>
                  <span className="text-gray-900 font-medium">{cat.size} GB</span>
                </div>
              ))}
            </div>

            {/* Upgrade Banner */}
            <div className="mt-6 p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100">
              <div className="flex items-center space-x-2 mb-1">
                <Cloud className="w-4 h-4 text-green-600" />
                <span className="text-xs font-semibold text-green-700">Need more space?</span>
              </div>
              <p className="text-xs text-gray-600 mb-2">Upgrade to Pro for 1TB storage</p>
              <button className="w-full py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition">
                Upgrade Now
              </button>
            </div>
          </div>
        )}

        {/* More Section */}
        {(!sidebarCollapsed || isMobile) && (
          <>
            <div className="my-4 border-t border-gray-200"></div>
            <div className="px-3">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">More</p>
              <nav className="space-y-1">
                {moreItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition"
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </>
        )}
      </div>
    </>
  );

  // Mobile Menu Overlay
  const MobileOverlay = () => (
    <div 
      className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 md:hidden ${
        isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      onClick={() => setIsMobileMenuOpen(false)}
    />
  );

  // Mobile Sidebar (Slide-out)
  if (isMobile) {
    return (
      <>
        <MobileOverlay />
        
        {/* Mobile Menu Button */}
        <button
          id="mobile-menu-button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="fixed top-[72px] left-4 z-30 p-2 bg-white rounded-lg shadow-md border border-gray-200 hover:bg-gray-50 transition md:hidden"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5 text-gray-600" />
        </button>

        {/* Slide-out Sidebar */}
        <aside
          id="mobile-sidebar"
          className={`fixed left-0 top-16 h-[calc(100vh-64px)] bg-white border-r border-gray-200 z-50 transition-transform duration-300 ease-in-out w-72 ${
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          style={{ overflowY: 'auto' }}
        >
          {sidebarContent}
        </aside>
      </>
    );
  }

  // Desktop Sidebar
  return (
    <aside className={`fixed left-0 h-[calc(100vh-64px)] bg-white border-r border-gray-200 transition-all duration-300 ${
      sidebarCollapsed ? 'w-20' : 'w-64'
    }`}>
      {sidebarContent}

      {/* Collapse Button - Desktop Only */}
      <button
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        className="absolute -right-3 top-20 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 hover:border-green-300 transition shadow-sm"
      >
        <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${
          sidebarCollapsed ? 'rotate-180' : ''
        }`} />
      </button>
    </aside>
  );
};

export default Sidebar;