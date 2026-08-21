import { X, ChevronRight, Cloud } from 'lucide-react';

export function MobileSidebarOverlay({ isOpen, onClose }) {
  return (
    <div
      className={`fixed inset-0 bg-black/60 z-[65] backdrop-blur-xs transition-opacity duration-300 ${
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      onClick={onClose}
    />
  );
}

export function MobileSidebarPanel({ isOpen, onClose, children }) {
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-[70] h-full w-[min(85vw,20rem)] border-r border-gray-200 dark:border-[#334155] bg-white dark:bg-[#1E293B] shadow-2xl flex flex-col transition-transform duration-300 ease-out will-change-transform ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      {/* Mobile Drawer Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 dark:border-[#334155] shrink-0 bg-white dark:bg-[#1E293B]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm">
            <Cloud className="w-5 h-5" />
          </div>
          <span className="font-bold text-gray-900 dark:text-white text-base tracking-tight">DataStock</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-xl text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 transition"
          aria-label="Close sidebar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Drawer Content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {children}
      </div>
    </aside>
  );
}

export function DesktopSidebarPanel({
  sidebarCollapsed,
  onToggleCollapse,
  children,
}) {
  return (
    <aside
      className={`fixed left-0 top-16 z-40 h-[calc(100dvh-4rem)] border-r border-gray-200 dark:border-[#334155] bg-white dark:bg-[#1E293B] transition-all duration-300 will-change-[width] ${
        sidebarCollapsed ? 'w-20' : 'w-60 xl:w-72'
      }`}
    >
      {children}
      <button
        onClick={onToggleCollapse}
        className="absolute -right-3 top-20 w-7 h-7 bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-[#334155] rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50 dark:hover:bg-[#334155] transition"
      >
        <ChevronRight
          className={`w-4 h-4 text-gray-500 transition-transform ${
            sidebarCollapsed ? '' : 'rotate-180'
          }`}
        />
      </button>
    </aside>
  );
}
