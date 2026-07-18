import { Cloud } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getMimeType } from '../../../utils/filters';

export default function SidebarStorage({ storageData, files }) {
  const navigate = useNavigate();
  const imageCount = files.filter((f) => getMimeType(f).startsWith('image')).length;
  const totalFiles = files.length;
  const plan = storageData.plan || 'BASIC';
  const isBasic = plan === 'BASIC';
  const usedPercent = Math.min(
    (storageData.used / storageData.total) * 100,
    100
  );

  return (
    <>
      <div className="my-3.5" />
      <div className="px-2">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold tracking-wider text-gray-400 uppercase">
            Storage
          </p>
          <Cloud className="w-4 h-4 text-[#3B82F6]" />
        </div>
        <div className="mb-2 flex justify-between text-xs">
          <span className="text-gray-600 dark:text-[#94A3B8]">{storageData.usedLabel || `${storageData.used} GB`} used</span>
          <span className="text-gray-400 dark:text-[#94A3B8]">{storageData.totalLabel || `${storageData.total} GB`}</span>
        </div>
        <div className="w-full h-2 bg-gray-100 dark:bg-[#334155] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-500 to-emerald-600 rounded-full transition-all duration-500"
            style={{ width: `${usedPercent}%` }}
          />
        </div>

        <div className="grid grid-cols-2 gap-2 mt-4">
          <div className="bg-gray-50 dark:bg-[#334155] rounded-xl p-3">
            <p className="text-xs text-gray-500 dark:text-[#94A3B8]">Files</p>
            <h3 className="font-bold text-gray-900 dark:text-[#F8FAFC] mt-1">{totalFiles}</h3>
          </div>
          <div className="bg-gray-50 dark:bg-[#334155] rounded-xl p-3">
            <p className="text-xs text-gray-500 dark:text-[#94A3B8]">Images</p>
            <h3 className="font-bold text-gray-900 dark:text-[#F8FAFC] mt-1">{imageCount}</h3>
          </div>
        </div>

        <div 
          onClick={() => navigate('/pricing')}
          className="mt-5 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/40 dark:to-slate-900/40 border border-slate-200/50 dark:border-[#334155]/60 rounded-2xl p-5 cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 group shadow-xs hover:shadow-sm"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {isBasic ? 'Free Plan' : `${plan} Plan`}
            </span>
            <Cloud className="w-4 h-4 text-slate-400 dark:text-slate-400 group-hover:text-blue-500 transition-colors" />
          </div>
          <div className="mb-1 text-base font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
            {storageData.usedLabel || `${storageData.used} GB`} <span className="text-xs font-semibold text-slate-400">/ {storageData.totalLabel || `${storageData.total} GB`}</span>
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-none">
            {isBasic ? 'Get 2 TB & Priority Support' : 'Manage your cloud subscription'}
          </p>
          
          <div className="mt-4 pt-3 border-t border-slate-200/50 dark:border-[#334155]/40 flex items-center justify-between text-xs font-bold text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300">
            <span>{isBasic ? 'Upgrade Plan' : 'Manage Plan'}</span>
            <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
          </div>
        </div>
      </div>
    </>
  );
}
