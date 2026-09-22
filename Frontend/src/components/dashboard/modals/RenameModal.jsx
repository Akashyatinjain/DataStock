import React, { useState, useEffect, useRef } from 'react';
import { X, Edit3, Loader2 } from 'lucide-react';

export default function RenameModal({
  isOpen,
  onClose,
  onRename,
  initialName = '',
  itemType = 'item',
  loading = false,
}) {
  const [name, setName] = useState(initialName);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setName(initialName);
      setError('');
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          const dotIdx = initialName.lastIndexOf('.');
          if (itemType === 'file' && dotIdx > 0) {
            inputRef.current.setSelectionRange(0, dotIdx);
          } else {
            inputRef.current.select();
          }
        }
      }, 50);
    }
  }, [isOpen, initialName, itemType]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Name cannot be empty');
      return;
    }
    if (trimmed.length > 255) {
      setError('Name is too long');
      return;
    }
    if (/[/\\?%*:|"<>]/g.test(trimmed)) {
      setError('Name cannot contain / \\ ? % * : | " < >');
      return;
    }
    setError('');
    onRename(trimmed);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={loading ? undefined : onClose}
      />

      {/* Modal Card */}
      <div
        className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 w-full max-w-md flex flex-col gap-4 animate-fade-up z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 capitalize">
                Rename {itemType}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Enter a new name for this {itemType}
              </p>
            </div>
          </div>
          <button
            onClick={loading ? undefined : onClose}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="rename-input" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Name
            </label>
            <input
              id="rename-input"
              ref={inputRef}
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
              disabled={loading}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white transition text-slate-900 disabled:opacity-50"
              placeholder={`Enter new ${itemType} name...`}
            />
            {error && (
              <p className="text-xs text-red-500 mt-1.5 font-medium">{error}</p>
            )}
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
