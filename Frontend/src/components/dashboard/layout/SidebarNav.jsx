import React, { useState } from 'react';
import { NAV_ITEMS } from '../../../utils/constants';

export default function SidebarNav({
  activeTab,
  setActiveTab,
  sidebarCollapsed,
  isMobile,
  onNavigate,
  onMoveFile,
}) {
  const [dragOverMyDrive, setDragOverMyDrive] = useState(false);

  const handleClick = (id) => {
    setActiveTab(id);
    onNavigate?.();
  };

  const showLabels = !sidebarCollapsed || isMobile;

  return (
    <nav className="mt-6 space-y-1">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isMyDrive = item.id === 'my-drive';
        const isDragOver = isMyDrive && dragOverMyDrive;

        return (
          <button
            key={item.id}
            onClick={() => handleClick(item.id)}
            onDragOver={isMyDrive ? (e) => { e.preventDefault(); setDragOverMyDrive(true); } : undefined}
            onDragLeave={isMyDrive ? () => setDragOverMyDrive(false) : undefined}
            onDrop={isMyDrive ? (e) => {
              e.preventDefault();
              setDragOverMyDrive(false);
              const fileId = e.dataTransfer.getData("text/plain");
              if (fileId && onMoveFile) {
                onMoveFile(fileId, null);
              }
            } : undefined}
            className={`
              w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium
              ${activeTab === item.id
                ? 'bg-blue-50 dark:bg-[#3B82F6]/10 text-[#3B82F6] dark:text-[#3B82F6] font-bold'
                : 'text-gray-600 dark:text-[#94A3B8] hover:bg-gray-100 dark:hover:bg-[#334155]'}
              ${isDragOver ? 'bg-blue-100 dark:bg-green-950/60 border border-[#3B82F6] scale-105 shadow-md' : ''}
            `}
          >
            <Icon className="w-5 h-5" />
            {showLabels && (
              <>
                <span className="flex-1 text-left">{item.label}</span>
                {activeTab === item.id && (
                  <div className="w-2 h-2 bg-[#3B82F6] rounded-full" />
                )}
              </>
            )}
          </button>
        );
      })}
    </nav>
  );
}
