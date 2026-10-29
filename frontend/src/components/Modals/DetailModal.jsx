import React from 'react';
import { X, Eye } from 'lucide-react';

export default function DetailModal({ isOpen, onClose, title = 'Details', data = null }) {
  if (!isOpen || !data) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-[1px] p-4 animate-in fade-in duration-150">
      <div className="shadow-2xl border max-w-lg w-full overflow-hidden bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#2563EB] flex items-center justify-center font-bold shrink-0">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">{title}</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500">Record overview</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 max-h-[70vh] overflow-y-auto space-y-3">
          <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 p-4 font-mono text-xs overflow-x-auto text-slate-800 dark:text-slate-200 rounded-lg">
            <pre>{JSON.stringify(data, null, 2)}</pre>
          </div>
        </div>

        <div className="flex justify-end p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
