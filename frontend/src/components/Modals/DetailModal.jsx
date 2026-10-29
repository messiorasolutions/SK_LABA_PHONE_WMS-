import React from 'react';
import { COLORS } from '../../constants/colors';
import { TYPOGRAPHY } from '../../constants/typography';
import Button from '../ui/Button';
import { X, Eye, Info } from 'lucide-react';

export default function DetailModal({ isOpen, onClose, title = 'Details', data = null }) {
  if (!isOpen || !data) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="shadow-xl border max-w-lg w-full overflow-hidden bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850">
          <div className="flex items-center gap-2.5">
            <div
              style={{ backgroundColor: COLORS.primaryLight, color: COLORS.primary }}
              className="w-8 h-8 flex items-center justify-center font-bold border border-red-200 dark:border-red-900 dark:bg-red-950/40"
            >
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <h3 className={`${TYPOGRAPHY.heading} text-slate-900 dark:text-slate-100`}>{title}</h3>
              <p className={`${TYPOGRAPHY.caption} text-slate-500 dark:text-slate-400`}>Raw API Record details</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 max-h-[70vh] overflow-y-auto space-y-3">
          <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 p-4 font-mono text-xs overflow-x-auto text-slate-800 dark:text-slate-200">
            <pre>{JSON.stringify(data, null, 2)}</pre>
          </div>
        </div>

        <div className="flex justify-end p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>

  );
}
