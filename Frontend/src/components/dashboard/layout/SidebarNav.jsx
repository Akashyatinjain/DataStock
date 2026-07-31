import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NAV_ITEMS } from '../../../utils/constants';

export default function SidebarNav({
  activeTab,
  setActiveTab,
  sidebarCollapsed,
  isMobile,
  onNavigate,
  onMoveFile,
}) {
  const navigate = useNavigate();
  const [dragOverMyDrive, setDragOverMyDrive] = useState(false);

  const handleClick = (id) => {
    setActiveTab(id);
    onNavigate?.();
  };

  const showLabels = !sidebarCollapsed || isMobile;

  const getIconColorClass = (itemId, isActive) => {
    if (isActive) return 'text-[#3B82F6] dark:text-[#3B82F6]';
    if (itemId === 'my-drive') return 'text-blue-500 dark:text-blue-400';
    if (itemId === 'shared') return 'text-emerald-500 dark:text-emerald-400';
    if (itemId === 'starred') return 'text-amber-500 dark:text-amber-400';
    if (itemId === 'recent') return 'text-indigo-500 dark:text-indigo-400';
    return 'text-gray-400';
  };

  return (
    <nav className="mt-4 space-y-1">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isMyDrive = item.id === 'my-drive';
        const isDragOver = isMyDrive && dragOverMyDrive;
        const isActive = activeTab === item.id;

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
              w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-xs sm:text-sm font-medium
              ${isActive
                ? 'bg-blue-50 dark:bg-[#3B82F6]/10 text-[#3B82F6] dark:text-[#3B82F6] font-semibold'
                : 'text-gray-600 dark:text-[#94A3B8] hover:bg-gray-100/80 dark:hover:bg-[#334155]/60'}
              ${isDragOver ? 'bg-blue-100 dark:bg-blue-950/60 border border-[#3B82F6] scale-102 shadow-sm' : ''}
              hover:translate-x-0.5 duration-150
            `}
          >
            <Icon className={`w-4.5 h-4.5 shrink-0 transition-colors duration-200 ${isActive ? 'text-[#3B82F6]' : 'text-gray-400 dark:text-slate-400'}`} />
            {showLabels && (
              <>
                <span className="flex-1 text-left truncate">{item.label}</span>
                {isActive && (
                  <div className="w-1.5 h-1.5 bg-[#3B82F6] rounded-full shrink-0" />
                )}
              </>
            )}
          </button>
        );
      })}
    </nav>
  );
}
