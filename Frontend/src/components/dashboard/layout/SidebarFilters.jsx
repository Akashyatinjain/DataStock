import { QUICK_FILTERS, countByFilter } from '../../../utils/filters';

export default function SidebarFilters({ files, activeTab, setActiveTab, onNavigate }) {
  return (
    <div className="pt-3 mt-3 border-t border-slate-200 dark:border-slate-600">
      <p className="text-[11px] font-semibold tracking-wider uppercase text-[#64748B] dark:text-slate-400 px-2.5 mb-2">
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
                w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg transition-colors text-xs sm:text-sm font-medium
                ${isActive
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-[#2563EB] dark:text-blue-400 font-semibold'
                  : 'text-[#64748B] dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#334155] hover:text-[#0F172A] dark:hover:text-white'}
              `}
            >
              <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-[#2563EB] dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`} />
              <span className="flex-1 text-left truncate">{filter.name}</span>
              {count > 0 && (
                <span className="text-[10px] font-medium bg-slate-100 dark:bg-[#0F172A] text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600 px-1.5 py-0.5 rounded">
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

