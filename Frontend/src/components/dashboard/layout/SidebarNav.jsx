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

  return (
    <nav className="mt-3 space-y-0.5">
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
              w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-colors text-xs sm:text-sm font-medium select-none
              ${isActive
                ? 'bg-blue-50 dark:bg-blue-900/20 text-[#2563EB] dark:text-blue-400 font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'}
              ${isDragOver ? 'bg-blue-100 dark:bg-blue-900/40 border border-[#2563EB] shadow-xs' : ''}
            `}
          >
            <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-[#2563EB] dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`} />
            {showLabels && (
              <>
                <span className="flex-1 text-left truncate">{item.label}</span>
                {isActive && (
                  <div className="w-1.5 h-1.5 bg-[#2563EB] dark:bg-blue-400 rounded-full shrink-0" />
                )}
              </>
            )}
          </button>
        );
      })}
    </nav>
  );
}

