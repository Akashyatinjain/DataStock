import { QUICK_FILTERS, countByFilter } from '../../../utils/filters';

export default function SidebarFilters({ files, activeTab, setActiveTab, onNavigate }) {
  return (
    <div className="pt-3 mt-3 border-t border-gray-100 dark:border-slate-800/80">
      <p className="text-xs font-bold tracking-wider uppercase text-gray-400 dark:text-slate-500 px-2 mb-2">
        Quick Filters
      </p>
      <div className="space-y-0.5">
        {QUICK_FILTERS.map((filter) => {
          const Icon = filter.icon;
          const tabId = `filter-${filter.name.toLowerCase()}`;
          const count = countByFilter(files, filter.filter);
          const isActive = activeTab === tabId;

          return (
            <button
              key={filter.name}
              onClick={() => {
                setActiveTab(tabId);
                onNavigate?.();
              }}
              className={`
                w-full flex items-center gap-3 px-3 py-1.5 rounded-xl transition-all text-xs sm:text-sm font-medium
                ${isActive
                  ? 'bg-blue-50 dark:bg-[#3B82F6]/10 text-[#3B82F6] dark:text-[#3B82F6] font-semibold'
                  : 'text-gray-600 dark:text-[#94A3B8] hover:bg-gray-100/80 dark:hover:bg-[#334155]/60'}
                hover:translate-x-0.5 duration-150
              `}
            >
              <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-[#3B82F6]' : filter.color || 'text-gray-400 dark:text-slate-400'}`} />
              <span className="flex-1 text-left truncate">{filter.name}</span>
              {count > 0 && (
                <span className="text-[10px] font-semibold bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 px-2 py-0.5 rounded-full">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
