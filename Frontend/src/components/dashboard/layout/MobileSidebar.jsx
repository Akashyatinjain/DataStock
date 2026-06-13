import { X, ChevronRight } from 'lucide-react';

export function MobileSidebarOverlay({ isOpen, onClose }) {
  return (
    <div
      className={`fixed inset-0 bg-black/40 z-40 transition-opacity duration-300 ${
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      onClick={onClose}
    />
  );
}

export function MobileSidebarPanel({ isOpen, children, onClose }) {
  return (
    <aside
      className={`fixed left-0 top-14 z-50 h-[calc(100dvh-3.5rem)] w-[min(85vw,18rem)] border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      {children}
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
      className={`fixed left-0 top-16 z-40 h-[calc(100dvh-4rem)] border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 transition-all duration-300 ${
        sidebarCollapsed ? 'w-20' : 'w-72'
      }`}
    >
      {children}
      <button
        onClick={onToggleCollapse}
        className="absolute -right-3 top-20 w-7 h-7 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition"
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
