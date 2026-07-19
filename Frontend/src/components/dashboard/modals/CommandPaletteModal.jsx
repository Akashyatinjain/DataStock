import React, { useState, useEffect } from 'react';
import { formatFileSize } from '../../../utils/fileHelpers';

const CommandPaletteModal = ({
  isOpen,
  onClose,
  files,
  onPreview,
  onTabChange,
  isUnlocked,
  onUnlock,
  onLock,
  isE2eeSetup,
}) => {
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!isOpen) setSearch('');
  }, [isOpen]);

  if (!isOpen) return null;

  const filtered =
    search.trim() === ''
      ? []
      : files
          .filter((f) =>
            f.originalName?.toLowerCase().includes(search.toLowerCase())
          )
          .slice(0, 5);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-[#0F172A]/70 backdrop-blur-xs pt-24 px-4 select-none">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="bg-white dark:bg-[#1E293B] border border-gray-150 dark:border-[#334155] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden z-10 animate-fade-up">
        {/* Search Input bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100 dark:border-[#334155]">
          <span className="text-gray-400">🔍</span>
          <input
            type="text"
            autoFocus
            placeholder="Search files or type a command... (Esc to exit)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent border-0 text-sm text-gray-800 dark:text-[#F8FAFC] placeholder-gray-400 focus:ring-0 focus:outline-none"
          />
          <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-[#94A3B8] rounded text-[10px] font-bold shadow-xs">
            ESC
          </kbd>
        </div>

        {/* Results list */}
        <div className="max-h-72 overflow-y-auto p-2">
          {filtered.length > 0 && (
            <div className="mb-3.5">
              <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider px-2 mb-2">
                Files
              </p>
              <div className="space-y-1">
                {filtered.map((file) => (
                  <button
                    key={`cmd-file-${file.id}`}
                    onClick={() => {
                      onPreview(file);
                      onClose();
                    }}
                    className="w-full px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-[#D1D5DB] hover:bg-blue-50 dark:hover:bg-slate-800 rounded-xl transition flex items-center justify-between"
                  >
                    <span className="truncate">📄 {file.originalName}</span>
                    <span className="text-[10px] text-gray-400 shrink-0">
                      {formatFileSize(file.size)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div>
            <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider px-2 mb-2">
              Quick Actions & Commands
            </p>
            <div className="space-y-1">
              <button
                onClick={() => {
                  onTabChange('my-drive');
                  onClose();
                }}
                className="w-full px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-[#D1D5DB] hover:bg-blue-50 dark:hover:bg-slate-800 rounded-xl transition flex items-center justify-between"
              >
                <span>📁 Go to My Drive</span>
                <kbd className="px-1.5 py-0.5 bg-gray-50 dark:bg-slate-700 text-gray-400 dark:text-[#94A3B8] rounded text-[9px] font-extrabold shadow-3xs">
                  G D
                </kbd>
              </button>
              <button
                onClick={() => {
                  onTabChange('starred');
                  onClose();
                }}
                className="w-full px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-[#D1D5DB] hover:bg-blue-50 dark:hover:bg-slate-800 rounded-xl transition flex items-center justify-between"
              >
                <span>⭐ Go to Starred Items</span>
                <kbd className="px-1.5 py-0.5 bg-gray-50 dark:bg-slate-700 text-gray-400 dark:text-[#94A3B8] rounded text-[9px] font-extrabold shadow-3xs">
                  G S
                </kbd>
              </button>
              {isE2eeSetup && (
                <button
                  onClick={() => {
                    if (isUnlocked) onLock();
                    else onUnlock();
                    onClose();
                  }}
                  className="w-full px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-[#D1D5DB] hover:bg-blue-50 dark:hover:bg-slate-800 rounded-xl transition flex items-center justify-between"
                >
                  <span>
                    🔒 {isUnlocked ? 'Lock E2EE Vault' : 'Unlock E2EE Vault'}
                  </span>
                  <kbd className="px-1.5 py-0.5 bg-gray-50 dark:bg-slate-700 text-gray-400 dark:text-[#94A3B8] rounded text-[9px] font-extrabold shadow-3xs">
                    L V
                  </kbd>
                </button>
              )}
              <button
                onClick={() => {
                  onTabChange('trash');
                  onClose();
                }}
                className="w-full px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-[#D1D5DB] hover:bg-blue-50 dark:hover:bg-slate-800 rounded-xl transition flex items-center justify-between"
              >
                <span>🗑️ Go to Trash</span>
                <kbd className="px-1.5 py-0.5 bg-gray-50 dark:bg-slate-700 text-gray-400 dark:text-[#94A3B8] rounded text-[9px] font-extrabold shadow-3xs">
                  G T
                </kbd>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandPaletteModal;
