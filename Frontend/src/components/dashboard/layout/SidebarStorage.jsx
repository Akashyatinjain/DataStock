import { Cloud } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getMimeType } from '../../../utils/filters';

export default function SidebarStorage({ storageData, files }) {
  const navigate = useNavigate();
  const plan = storageData.plan || 'BASIC';
  const isBasic = plan === 'BASIC';
  const usedPercent = Math.min(
    (storageData.used / storageData.total) * 100,
    100
  );

  return (
    <div className="pt-3 mt-3 border-t border-gray-100 dark:border-slate-800/80 px-1">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-bold tracking-wider uppercase text-gray-400 dark:text-slate-500">
          Storage
        </p>
        <Cloud className="w-3.5 h-3.5 text-[#3B82F6]" />
      </div>
      <div className="mb-1.5 flex justify-between text-xs font-medium">
        <span className="text-gray-700 dark:text-slate-300">{storageData.usedLabel || `${storageData.used} GB`} used</span>
        <span className="text-gray-400 dark:text-slate-500">{storageData.totalLabel || `${storageData.total} GB`}</span>
      </div>
      <div className="w-full h-1.5 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden mb-3">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500"
          style={{ width: `${usedPercent}%` }}
        />
      </div>

      <div 
        onClick={() => navigate('/pricing')}
        className="bg-gray-50/80 hover:bg-gray-100/80 dark:bg-slate-800/40 dark:hover:bg-slate-800/60 rounded-xl p-3.5 cursor-pointer transition-all duration-200 group border border-gray-100/50 dark:border-slate-800/50"
      >
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] font-bold text-gray-700 dark:text-slate-200">
            {isBasic ? 'Free Workspace' : `${plan} Plan`}
          </span>
          <span className="text-[11px] font-bold text-[#3B82F6] group-hover:translate-x-0.5 transition-transform">
            {isBasic ? 'Upgrade →' : 'Manage →'}
          </span>
        </div>
        <p className="text-xs text-gray-400 dark:text-slate-400">
          {isBasic ? 'Get 2 TB & E2EE Priority Support' : 'Manage your cloud subscription'}
        </p>
      </div>
    </div>
  );
}
