// Dashboard.jsx
import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import StorageStats from '../components/StorageStats';
import QuickAccess from '../components/QuickAccess';
import FileView from '../components/FileView';
import RecentActivity from '../components/RecentActivity';

const Dashboard = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('my-drive');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Mock data
  const storageData = {
    used: 45.2,
    total: 100,
    categories: [
      { name: 'Documents', size: 12.4, color: 'bg-blue-500' },
      { name: 'Images', size: 18.7, color: 'bg-green-500' },
      { name: 'Videos', size: 8.2, color: 'bg-purple-500' },
      { name: 'Others', size: 5.9, color: 'bg-orange-500' }
    ]
  };

  const recentFiles = [
    { id: 1, name: 'Project Proposal.pdf', type: 'pdf', size: '2.4 MB', modified: '2 hours ago', starred: true, shared: true },
    { id: 2, name: 'Team Photo.jpg', type: 'image', size: '4.2 MB', modified: 'Yesterday', starred: false, shared: false },
    { id: 3, name: 'Q4 Report.xlsx', type: 'spreadsheet', size: '1.8 MB', modified: 'Dec 12', starred: true, shared: true },
    { id: 4, name: 'Product Demo.mp4', type: 'video', size: '45.6 MB', modified: 'Dec 10', starred: false, shared: false },
  ];

  const folders = [
    { id: 5, name: 'Project Documents', isFolder: true, files: 24, size: '2.3 GB', modified: 'Dec 14' },
    { id: 6, name: 'Design Assets', isFolder: true, files: 156, size: '4.1 GB', modified: 'Dec 13' },
    { id: 7, name: 'Marketing Materials', isFolder: true, files: 43, size: '1.2 GB', modified: 'Dec 11' },
    { id: 8, name: 'Personal', isFolder: true, files: 12, size: '856 MB', modified: 'Dec 8' },
  ];

  const allFiles = [...folders, ...recentFiles];

  const getHeaderTitle = () => {
    const titles = {
      'my-drive': 'My Drive',
      'shared': 'Shared with me',
      'recent': 'Recent Files',
      'starred': 'Starred'
    };
    return titles[activeTab] || 'My Drive';
  };

  return (
    <div className="min-h-screen bg-gray-50 font-['Inter']">
      <Header 
        searchQuery={searchQuery} 
        setSearchQuery={setSearchQuery}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />
      
      <div className="flex pt-16">
        <Sidebar 
          sidebarCollapsed={sidebarCollapsed}
          setSidebarCollapsed={setSidebarCollapsed}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          storageData={storageData}
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
        />

        <main className={`flex-1 transition-all duration-300 ${
          sidebarCollapsed ? 'md:ml-20' : 'md:ml-64'
        } ml-0`}>
          <div className="p-4 sm:p-6 lg:p-8">
            {/* Page Header */}
            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                {getHeaderTitle()}
              </h1>
              {searchQuery && (
                <p className="text-sm text-gray-500 mt-1">
                  Search results for "{searchQuery}"
                </p>
              )}
            </div>

            {/* Storage Stats */}
            <StorageStats storageData={storageData} />

            {/* Quick Access */}
            <QuickAccess />

            {/* File View */}
            <FileView 
              viewMode={viewMode}
              setViewMode={setViewMode}
              files={allFiles}
              selectedFiles={selectedFiles}
              setSelectedFiles={setSelectedFiles}
            />

            {/* Recent Activity */}
            <RecentActivity />
          </div>
        </main>
      </div>

      {/* Mobile FAB */}
      <button className="fixed bottom-6 right-6 md:hidden w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center z-30">
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
};

export default Dashboard;