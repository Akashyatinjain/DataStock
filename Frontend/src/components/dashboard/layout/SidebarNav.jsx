import { NAV_ITEMS } from '../../../utils/constants';

export default function SidebarNav({
  activeTab,
  setActiveTab,
  sidebarCollapsed,
  isMobile,
  onNavigate,
}) {
  const handleClick = (id) => {
    setActiveTab(id);
    onNavigate?.();
  };

  const showLabels = !sidebarCollapsed || isMobile;

  return (
    <nav className="mt-6 space-y-1">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            onClick={() => handleClick(item.id)}
          className={`
              w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition text-sm font-medium
              ${activeTab === item.id
                ? 'bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}
            `}
          >
            <Icon className="w-5 h-5" />
            {showLabels && (
              <>
                <span className="flex-1 text-left">{item.label}</span>
                {activeTab === item.id && (
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                )}
              </>
            )}
          </button>
        );
      })}
    </nav>
  );
}
