import { Cloud } from 'lucide-react';
import { getMimeType } from '../../../utils/filters';

export default function SidebarStorage({ storageData, files }) {
  const imageCount = files.filter((f) => getMimeType(f).startsWith('image')).length;
  const totalFiles = files.length;
  const usedPercent = Math.min(
    (storageData.used / storageData.total) * 100,
    100
  );

  return (
    <>
      <div className="my-5 border-t border-gray-200" />
      <div className="px-2">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold tracking-wider text-gray-400 uppercase">
            Storage
          </p>
          <Cloud className="w-4 h-4 text-green-600" />
        </div>
        <div className="mb-2 flex justify-between text-xs">
          <span className="text-gray-600">{storageData.used} GB used</span>
          <span className="text-gray-400">{storageData.total} GB</span>
        </div>
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-500 to-emerald-600 rounded-full transition-all duration-500"
            style={{ width: `${usedPercent}%` }}
          />
        </div>

        <div className="grid grid-cols-2 gap-2 mt-4">
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-500">Files</p>
            <h3 className="font-bold text-gray-900 mt-1">{totalFiles}</h3>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-500">Images</p>
            <h3 className="font-bold text-gray-900 mt-1">{imageCount}</h3>
          </div>
        </div>

        <div className="mt-5 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Cloud className="w-4 h-4 text-green-600" />
            <span className="text-sm font-semibold text-green-700">Free Plan</span>
          </div>
          <p className="text-xs text-gray-600 mb-4">Upgrade to Pro for 1TB storage</p>
          <button className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl py-2 text-sm font-medium transition">
            Upgrade Now
          </button>
        </div>
      </div>
    </>
  );
}
