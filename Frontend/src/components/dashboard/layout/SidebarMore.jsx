import { MORE_ITEMS } from '../../../utils/constants';

export default function SidebarMore({ activeTab, setActiveTab, onNavigate }) {
  return (
    <div className="pt-3 mt-3 border-t border-slate-200 dark:border-slate-600">
      <p className="text-[11px] font-semibold tracking-wider uppercase text-[#64748B] dark:text-slate-400 px-2 mb-2">
        Utilities
      </p>
      <div className="space-y-0.5">
        {MORE_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                onNavigate?.();
              }}
              className={`
                w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-xs sm:text-sm font-medium
                ${isActive
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-[#2563EB] dark:text-blue-400 font-semibold'
                  : 'text-[#64748B] dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#334155] hover:text-[#0F172A] dark:hover:text-white'}
                duration-150
              `}
            >
              <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-[#2563EB] dark:text-blue-400' : 'text-[#64748B] dark:text-slate-400'}`} />
              <span className="flex-1 text-left truncate">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

