import { QUICK_FILTERS, countByFilter } from '../../../utils/filters';

export default function SidebarFilters({ files, activeTab, setActiveTab }) {
  return (
    <>
      <div className="my-5 border-t border-gray-200" />
      <div>
        <p className="text-xs font-semibold tracking-wider text-gray-400 uppercase px-2 mb-3">
          Quick Filters
        </p>
        <div className="space-y-1">
          {QUICK_FILTERS.map((filter) => {
            const Icon = filter.icon;
            const tabId = `filter-${filter.name.toLowerCase()}`;
            const count = countByFilter(files, filter.filter);
            return (
              <button
                key={filter.name}
                onClick={() => setActiveTab(tabId)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2 rounded-xl transition text-sm
                  ${activeTab === tabId ? 'bg-green-50 text-green-700' : 'text-gray-700 hover:bg-gray-100'}
                `}
              >
                <Icon className={`w-5 h-5 ${filter.color}`} />
                <span className="flex-1 text-left">{filter.name}</span>
                {count > 0 && (
                  <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
