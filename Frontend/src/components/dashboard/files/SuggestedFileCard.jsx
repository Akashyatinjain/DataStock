import React from 'react';
import { useCrypto } from '../../../context/CryptoContext';
import { getFileType, formatFileSize } from '../../../utils/fileHelpers';

const SuggestedFileCard = ({ file, onPreview }) => {
  const { isE2eeUnlocked } = useCrypto();
  const type = getFileType(file.mimeType);
  const Icon = type.icon;
  const isStarred = file.starred || file.isStarred;
  const isEncrypted = file.isEncrypted || !!file.encryptedKey;
  const isLocked = file.isLocked || (isEncrypted && !isE2eeUnlocked);

  const getModifiedLabel = () => {
    if (!file.createdAt) return 'Edited recently';
    const date = new Date(file.createdAt);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return 'Edited today';
    if (date.toDateString() === yesterday.toDateString())
      return 'Edited yesterday';
    return `Edited ${date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}`;
  };

  return (
    <div
      onClick={() => onPreview(file)}
      className="bg-white dark:bg-[#1E293B] border border-gray-100 dark:border-[#334155]/60 hover:border-blue-200 dark:hover:border-[#3B82F6]/50 rounded-2xl p-4 shadow-xs hover:shadow-md transition-all duration-300 cursor-pointer select-none flex flex-col justify-between h-[115px] hover:scale-[1.01] hover:-translate-y-0.5 animate-fade-up"
    >
      <div className="flex items-start justify-between min-w-0 gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${type.bg}`}
          >
            <Icon className={`w-4 h-4 ${type.color}`} />
          </div>
          <div className="min-w-0">
            <h4
              className={`text-sm truncate leading-tight ${isLocked ? 'font-mono text-[11px] font-bold bg-amber-500/5 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/10' : 'font-extrabold text-gray-900 dark:text-[#F8FAFC]'}`}
            >
              {file.originalName}
            </h4>
            <p className="text-[10px] text-gray-400 font-semibold mt-0.5">
              {getModifiedLabel()}
            </p>
          </div>
        </div>

        {isStarred && <span className="text-[10px] text-yellow-500 shrink-0">★</span>}
      </div>

      <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-gray-50 dark:border-[#334155]/40 text-[9px] font-bold uppercase tracking-wider">
        {isStarred && (
          <span className="text-yellow-600 bg-yellow-50 dark:bg-yellow-950/20 px-1.5 py-0.5 rounded-full">
            ⭐ Favorite
          </span>
        )}
        {isEncrypted && (
          <span className="text-orange-600 bg-orange-50 dark:bg-orange-950/20 px-1.5 py-0.5 rounded-full">
            🔒 E2EE Secure
          </span>
        )}
        {!isLocked && (
          <span className="text-gray-400 bg-gray-50 dark:bg-slate-800 px-1.5 py-0.5 rounded-full ml-auto">
            {formatFileSize(file.size)}
          </span>
        )}
        {isLocked && (
          <span className="text-amber-600 dark:text-amber-400 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded-full ml-auto">
            Secure & Masked
          </span>
        )}
      </div>
    </div>
  );
};

export default SuggestedFileCard;
