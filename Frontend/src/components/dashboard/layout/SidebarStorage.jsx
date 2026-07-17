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
      <div className="my-5 border-t border-gray-200 dark:border-[#334155]" />
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

        <div className="mt-5 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/20 border border-blue-100 dark:border-[#3B82F6]/20 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Cloud className="w-4 h-4 text-[#3B82F6]" />
            <span className="text-sm font-semibold text-[#3B82F6] dark:text-[#3B82F6]">{isBasic ? 'Free Plan' : `${plan} Plan`}</span>
          </div>
          <p className="text-xs text-gray-600 dark:text-[#94A3B8] mb-4">
            {isBasic ? 'Upgrade to Pro for 2 TB storage' : `${storageData.totalLabel || `${storageData.total} GB`} storage active`}
          </p>
          {isBasic && (
            <button
              onClick={() => navigate('/pricing')}
              className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-xl py-2 text-sm font-medium transition"
            >
              Upgrade Now
            </button>
          )}
        </div>
      </div>
    </>
  );
}
