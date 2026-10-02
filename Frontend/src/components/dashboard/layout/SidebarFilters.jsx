import { QUICK_FILTERS, countByFilter } from '../../../utils/filters';

export default function SidebarFilters({ files, activeTab, setActiveTab, onNavigate }) {
  return (
    <div className="pt-3 mt-3 border-t border-slate-200">
      <p className="text-[11px] font-semibold tracking-wider uppercase text-[#64748B] px-2.5 mb-2">
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
                  ? 'bg-blue-50 text-[#2563EB] font-semibold'
                  : 'text-[#64748B] hover:bg-slate-50 hover:text-[#0F172A]'}
              `}
            >
              <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-[#2563EB]' : 'text-slate-400'}`} />
              <span className="flex-1 text-left truncate">{filter.name}</span>
              {count > 0 && (
                <span className="text-[10px] font-medium bg-slate-100 text-slate-500 border border-slate-200 px-1.5 py-0.5 rounded">
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

