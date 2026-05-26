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
  Menu,
  Folder,
  Image,
  Video,
  FileText,
  FileArchive,
  Settings,
  LogOut,
  Pin,
} from 'lucide-react';

const Sidebar = ({
  sidebarCollapsed,
  setSidebarCollapsed,
  activeTab,
  setActiveTab,
  storageData,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
}) => {

  const [isMobile, setIsMobile] = useState(false);

  // =========================================
  // MOBILE CHECK
  // =========================================

  useEffect(() => {

    const checkMobile = () => {

      setIsMobile(window.innerWidth < 768);

      if (window.innerWidth < 768) {
        setSidebarCollapsed(true);
      } else {
        setSidebarCollapsed(false);
      }
    };

    checkMobile();

    window.addEventListener(
      'resize',
      checkMobile
    );

    return () =>
      window.removeEventListener(
        'resize',
        checkMobile
      );

  }, []);

  // =========================================
  // NAVIGATION
  // =========================================

  const navItems = [
    {
      id: 'my-drive',
      label: 'My Drive',
      icon: HardDrive,
    },
    {
      id: 'shared',
      label: 'Shared',
      icon: Users,
    },
    {
      id: 'recent',
      label: 'Recent',
      icon: Clock,
    },
    {
      id: 'starred',
      label: 'Starred',
      icon: Star,
    },
  ];

  const folders = [
    'Personal',
    'Work',
    'Images',
    'Documents',
  ];

  const quickFilters = [
    {
      name: 'Images',
      icon: Image,
      color: 'text-blue-500',
    },
    {
      name: 'Videos',
      icon: Video,
      color: 'text-purple-500',
    },
    {
      name: 'PDFs',
      icon: FileText,
      color: 'text-red-500',
    },
    {
      name: 'ZIP Files',
      icon: FileArchive,
      color: 'text-yellow-500',
    },
  ];

  const pinnedFiles = [
    'Resume.pdf',
    'Portfolio.zip',
  ];

  const moreItems = [
    {
      id: 'trash',
      label: 'Trash',
      icon: Trash2,
      count: 2,
    },
    {
      id: 'archive',
      label: 'Archive',
      icon: Archive,
    },
  ];

  // =========================================
  // SIDEBAR CONTENT
  // =========================================

  const sidebarContent = (
    <div className="flex flex-col h-full">

      {/* TOP */}
      <div className="flex-1 overflow-y-auto p-4">

        {/* MOBILE CLOSE */}
        {
          isMobile && (
            <button
              onClick={() =>
                setIsMobileMenuOpen(false)
              }
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg md:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          )
        }

        {/* NEW BUTTON */}
        <button
          className={`
            w-full bg-green-600 hover:bg-green-700
            text-white rounded-2xl py-3 flex
            items-center justify-center gap-2
            transition font-medium shadow-sm
          `}
        >
          <Plus className="w-5 h-5" />
          {
            (!sidebarCollapsed || isMobile) &&
            <span>New</span>
          }
        </button>

        {/* MAIN NAV */}
        <nav className="mt-6 space-y-1">

          {
            navItems.map((item) => {

              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  onClick={() =>
                    setActiveTab(item.id)
                  }
                  className={`
                    w-full flex items-center
                    gap-3 px-3 py-2.5 rounded-xl
                    transition text-sm font-medium

                    ${
                      activeTab === item.id
                        ? 'bg-green-50 text-green-600'
                        : 'text-gray-600 hover:bg-gray-100'
                    }
                  `}
                >

                  <Icon className="w-5 h-5" />

                  {
                    (!sidebarCollapsed || isMobile) && (
                      <>
                        <span className="flex-1 text-left">
                          {item.label}
                        </span>

                        {
                          activeTab === item.id && (
                            <div className="w-2 h-2 bg-green-500 rounded-full" />
                          )
                        }
                      </>
                    )
                  }
                </button>
              );
            })
          }
        </nav>

        {/* FOLDERS */}
        {
          (!sidebarCollapsed || isMobile) && (
            <>
              <div className="my-5 border-t border-gray-200" />

              <div>

                <div className="flex items-center justify-between mb-3 px-2">
                  <p className="text-xs font-semibold tracking-wider text-gray-400 uppercase">
                    Folders
                  </p>

                  <button className="text-green-600 hover:text-green-700">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-1">

                  {
                    folders.map((folder) => (
                      <button
                        key={folder}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-100 transition text-sm text-gray-700"
                      >
                        <Folder className="w-5 h-5 text-yellow-500" />

                        <span>{folder}</span>
                      </button>
                    ))
                  }
                </div>
              </div>
            </>
          )
        }

        {/* QUICK FILTERS */}
        {
          (!sidebarCollapsed || isMobile) && (
            <>
              <div className="my-5 border-t border-gray-200" />

              <div>

                <p className="text-xs font-semibold tracking-wider text-gray-400 uppercase px-2 mb-3">
                  Quick Filters
                </p>

                <div className="space-y-1">

                  {
                    quickFilters.map((filter) => {

                      const Icon = filter.icon;

                      return (
                        <button
                          key={filter.name}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-100 transition text-sm text-gray-700"
                        >
                          <Icon className={`w-5 h-5 ${filter.color}`} />

                          <span>{filter.name}</span>
                        </button>
                      );
                    })
                  }
                </div>
              </div>
            </>
          )
        }

        {/* STORAGE */}
        {
          (!sidebarCollapsed || isMobile) && (
            <>
              <div className="my-5 border-t border-gray-200" />

              <div className="px-2">

                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold tracking-wider text-gray-400 uppercase">
                    Storage
                  </p>

                  <Cloud className="w-4 h-4 text-green-600" />
                </div>

                <div className="mb-2 flex justify-between text-xs">
                  <span className="text-gray-600">
                    {storageData.used} GB used
                  </span>

                  <span className="text-gray-400">
                    {storageData.total} GB
                  </span>
                </div>

                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">

                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-600 rounded-full"
                    style={{
                      width: `${(storageData.used / storageData.total) * 100}%`,
                    }}
                  />
                </div>

                {/* STATS */}
                <div className="grid grid-cols-2 gap-2 mt-4">

                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500">
                      Files
                    </p>

                    <h3 className="font-bold text-gray-900 mt-1">
                      128
                    </h3>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500">
                      Images
                    </p>

                    <h3 className="font-bold text-gray-900 mt-1">
                      34
                    </h3>
                  </div>
                </div>

                {/* UPGRADE */}
                <div className="mt-5 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 rounded-2xl p-4">

                  <div className="flex items-center gap-2 mb-2">
                    <Cloud className="w-4 h-4 text-green-600" />

                    <span className="text-sm font-semibold text-green-700">
                      Free Plan
                    </span>
                  </div>

                  <p className="text-xs text-gray-600 mb-4">
                    Upgrade to Pro for 1TB storage
                  </p>

                  <button className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl py-2 text-sm font-medium transition">
                    Upgrade Now
                  </button>
                </div>
              </div>
            </>
          )
        }

        {/* PINNED */}
        {
          (!sidebarCollapsed || isMobile) && (
            <>
              <div className="my-5 border-t border-gray-200" />

              <div>

                <p className="text-xs font-semibold tracking-wider text-gray-400 uppercase px-2 mb-3">
                  Pinned
                </p>

                <div className="space-y-1">

                  {
                    pinnedFiles.map((file) => (
                      <button
                        key={file}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-100 transition text-sm text-gray-700"
                      >
                        <Pin className="w-4 h-4 text-orange-500" />

                        <span className="truncate">
                          {file}
                        </span>
                      </button>
                    ))
                  }
                </div>
              </div>
            </>
          )
        }

        {/* MORE */}
        {
          (!sidebarCollapsed || isMobile) && (
            <>
              <div className="my-5 border-t border-gray-200" />

              <div>

                <p className="text-xs font-semibold tracking-wider text-gray-400 uppercase px-2 mb-3">
                  More
                </p>

                <div className="space-y-1">

                  {
                    moreItems.map((item) => {

                      const Icon = item.icon;

                      return (
                        <button
                          key={item.id}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-100 transition text-sm text-gray-700"
                        >
                          <Icon className="w-5 h-5" />

                          <span className="flex-1 text-left">
                            {item.label}
                          </span>

                          {
                            item.count && (
                              <span className="text-xs bg-gray-200 px-2 py-0.5 rounded-full">
                                {item.count}
                              </span>
                            )
                          }
                        </button>
                      );
                    })
                  }
                </div>
              </div>
            </>
          )
        }
      </div>

      {/* PROFILE SECTION */}
      {
        (!sidebarCollapsed || isMobile) && (
          <div className="border-t border-gray-200 p-4">

            <div className="flex items-center gap-3">

              <img
                src="https://ui-avatars.com/api/?name=User"
                alt="profile"
                className="w-11 h-11 rounded-full object-cover"
              />

              <div className="flex-1 min-w-0">

                <h3 className="font-semibold text-sm text-gray-900 truncate">
                  Hydar Gaming
                </h3>

                <p className="text-xs text-gray-500 truncate">
                  datastock@drive.com
                </p>
              </div>

              <button className="p-2 hover:bg-gray-100 rounded-lg transition">
                <Settings className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <button className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gray-100 hover:bg-red-50 text-gray-700 hover:text-red-600 transition text-sm font-medium">
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        )
      }
    </div>
  );

  // =========================================
  // MOBILE
  // =========================================

  if (isMobile) {

    return (
      <>
        <div
          className={`
            fixed inset-0 bg-black/40 z-40
            transition-opacity duration-300
            ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
          `}
          onClick={() =>
            setIsMobileMenuOpen(false)
          }
        />

        <button
          onClick={() =>
            setIsMobileMenuOpen(!isMobileMenuOpen)
          }
          className="fixed top-[72px] left-4 z-30 p-2 bg-white rounded-xl shadow border border-gray-200 md:hidden"
        >
          <Menu className="w-5 h-5 text-gray-700" />
        </button>

        <aside
          className={`
            fixed left-0 top-16 h-[calc(100vh-64px)]
            bg-white border-r border-gray-200 z-50
            transition-transform duration-300
            w-72
            ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
        >
          {sidebarContent}
        </aside>
      </>
    );
  }

  // =========================================
  // DESKTOP
  // =========================================

  return (
    <aside
      className={`
        fixed left-0 h-[calc(100vh-64px)]
        bg-white border-r border-gray-200
        transition-all duration-300
        ${sidebarCollapsed ? 'w-20' : 'w-72'}
      `}
    >

      {sidebarContent}

      {/* COLLAPSE BUTTON */}
      <button
        onClick={() =>
          setSidebarCollapsed(!sidebarCollapsed)
        }
        className="absolute -right-3 top-20 w-7 h-7 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50 transition"
      >
        <ChevronRight
          className={`
            w-4 h-4 text-gray-500 transition-transform
            ${sidebarCollapsed ? 'rotate-180' : ''}
          `}
        />
      </button>
    </aside>
  );
};

export default Sidebar;