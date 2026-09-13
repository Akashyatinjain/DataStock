import { Cloud } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function SidebarStorage({ storageData, files }) {
  const navigate = useNavigate();
  const plan = storageData.plan || 'BASIC';
  const isBasic = plan === 'BASIC';
  const usedPercent = Math.min(
    (storageData.used / storageData.total) * 100,
    100
  );

  return (
    <div className="pt-3 mt-3 border-t border-slate-200 dark:border-slate-600 px-1">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] font-semibold tracking-wider uppercase text-[#64748B] dark:text-slate-400">
          Storage
        </p>
        <Cloud className="w-3.5 h-3.5 text-[#2563EB] dark:text-blue-400" />
      </div>
      <div className="mb-1.5 flex justify-between text-xs font-normal text-[#64748B] dark:text-slate-400">
        <span className="font-medium text-[#0F172A] dark:text-slate-200">{storageData.usedLabel || `${storageData.used} GB`} used</span>
        <span>{storageData.totalLabel || `${storageData.total} GB`}</span>
      </div>
      <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-3">
        <div
          className="h-full bg-[#2563EB] rounded-full transition-all duration-500"
          style={{ width: `${usedPercent}%` }}
        />
      </div>

      <div 
        onClick={() => navigate('/pricing')}
        className="bg-[#F8FAFC] hover:bg-slate-100 dark:bg-slate-900/60 dark:hover:bg-slate-800/80 rounded-lg p-3 cursor-pointer transition-all duration-200 group border border-slate-200 dark:border-slate-600"
      >
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-[#0F172A] dark:text-slate-200">
            {isBasic ? 'Free Workspace' : `${plan} Plan`}
          </span>
          <span className="text-xs font-medium text-[#2563EB] dark:text-blue-400 group-hover:translate-x-0.5 transition-transform">
            {isBasic ? 'Upgrade →' : 'Manage →'}
          </span>
        </div>
        <p className="text-[11px] text-[#64748B] dark:text-slate-400 leading-tight">
          {isBasic ? 'Expand to 2 TB with E2EE Priority' : 'Manage cloud capacity'}
        </p>
      </div>
    </div>
  );
}

