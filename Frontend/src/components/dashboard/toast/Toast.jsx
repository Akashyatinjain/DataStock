import { X, Check, AlertCircle, Loader2 } from 'lucide-react';
import { getErrorMessage } from '../../../utils/errorMessage';

export default function Toast({ toasts, removeToast }) {
  return (
    <div className="fixed bottom-6 right-6 z-[999] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`
            flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl text-sm font-medium
            pointer-events-auto transition-all duration-300
            ${t.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : ''}
            ${t.type === 'success' ? 'bg-blue-50 text-[#3B82F6] border border-blue-200' : ''}
            ${t.type === 'info' ? 'bg-blue-50 text-blue-700 border border-blue-200' : ''}
          `}
        >
          {t.type === 'error' && <AlertCircle className="w-4 h-4 shrink-0" />}
          {t.type === 'success' && <Check className="w-4 h-4 shrink-0" />}
          {t.type === 'info' && <Loader2 className="w-4 h-4 shrink-0 animate-spin" />}
          <span>{getErrorMessage(t.msg, '')}</span>
          <button onClick={() => removeToast(t.id)} className="ml-1 hover:opacity-60">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
