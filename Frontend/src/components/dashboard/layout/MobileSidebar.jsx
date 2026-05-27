import { Menu, X, ChevronRight } from 'lucide-react';

export function MobileSidebarToggle({ isOpen, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className="fixed top-[72px] left-4 z-30 p-2 bg-white rounded-xl shadow border border-gray-200 md:hidden"
    >
      <Menu className="w-5 h-5 text-gray-700" />
    </button>
  );
}

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
      className={`relative fixed left-0 top-16 h-[calc(100vh-64px)] bg-white border-r border-gray-200 z-50 transition-transform duration-300 w-72 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      {children}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg md:hidden"
      >
        <X className="w-5 h-5" />
      </button>
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
      className={`fixed left-0 top-16 h-[calc(100vh-64px)] bg-white border-r border-gray-200 transition-all duration-300 ${
        sidebarCollapsed ? 'w-20' : 'w-72'
      }`}
    >
      {children}
      <button
        onClick={onToggleCollapse}
        className="absolute -right-3 top-20 w-7 h-7 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50 transition"
      >
        <ChevronRight
          className={`w-4 h-4 text-gray-500 transition-transform ${
            sidebarCollapsed ? 'rotate-180' : ''
          }`}
        />
      </button>
    </aside>
  );
}
