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
      className="bg-white dark:bg-[#1E293B] border border-gray-100/80 dark:border-[#334155]/80 hover:border-[#3B82F6]/60 rounded-2xl p-3.5 shadow-3xs hover:shadow-md transition-all duration-200 cursor-pointer select-none flex flex-col justify-between h-[120px] overflow-hidden hover:scale-[1.01] hover:-translate-y-0.5 animate-fade-up"
    >
      <div className="flex items-start justify-between min-w-0 gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${type.bg}`}
          >
            <Icon className={`w-4.5 h-4.5 ${type.color}`} />
          </div>
          <div className="min-w-0">
            <h4
              className={`text-xs sm:text-sm truncate leading-tight ${isLocked ? 'font-mono text-amber-600 dark:text-amber-400 font-bold' : 'font-extrabold text-gray-900 dark:text-[#F8FAFC]'}`}
              title={file.originalName}
            >
              {file.originalName}
            </h4>
            <p className="text-[10px] text-gray-400 font-medium mt-0.5">
              {getModifiedLabel()}
            </p>
          </div>
        </div>

        {isStarred && <span className="text-xs text-yellow-500 shrink-0">★</span>}
      </div>

      <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-gray-100 dark:border-[#334155]/60 text-[10px]">
        {isStarred && (
          <span className="text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/30 px-1.5 py-0.5 rounded-full text-[9px] font-extrabold shrink-0">
            ⭐ Favorite
          </span>
        )}
        {isLocked ? (
          <span className="text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full text-[9px] font-extrabold shrink-0">
            🔒 Encrypted
          </span>
        ) : isEncrypted ? (
          <span className="text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30 px-1.5 py-0.5 rounded-full text-[9px] font-extrabold shrink-0">
            🔒 E2EE
          </span>
        ) : null}
        <span className="text-gray-400 font-medium ml-auto shrink-0 text-[10px]">
          {isLocked ? 'Locked' : formatFileSize(file.size)}
        </span>
      </div>
    </div>
  );
};

export default SuggestedFileCard;
