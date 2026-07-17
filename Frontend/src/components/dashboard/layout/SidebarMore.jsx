import { MORE_ITEMS } from '../../../utils/constants';

export default function SidebarMore({ activeTab, setActiveTab, onNavigate }) {
  return (
    <>
      <div className="my-5 border-t border-gray-200 dark:border-[#334155]" />
      <div>
        <p className="text-xs font-semibold tracking-wider text-gray-400 uppercase px-2 mb-3">
          More
        </p>
        <div className="space-y-1">
          {MORE_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  onNavigate?.();
                }}
                className={`
                  w-full flex items-center gap-3 px-3 py-2 rounded-xl transition text-sm
                  ${activeTab === item.id
                    ? 'bg-blue-50 dark:bg-[#3B82F6]/10 text-[#3B82F6] dark:text-[#3B82F6]'
                    : 'text-gray-700 dark:text-[#94A3B8] hover:bg-gray-100 dark:hover:bg-[#334155]'}
                `}
              >
                <Icon className="w-5 h-5" />
                <span className="flex-1 text-left">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
