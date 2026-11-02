import React from 'react';
import { Trash2, AlertTriangle, Archive, RotateCcw } from 'lucide-react';

export default function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Delete Item',
  subtitle,
  message = 'Are you sure you want to delete this record? This action cannot be undone.',
  loading = false,
  confirmText = 'Delete',
  variant = 'danger', // 'danger' | 'warning' | 'primary'
}) {
  if (!isOpen) return null;

  const isWarning = variant === 'warning';
  const isPrimary = variant === 'primary';

  const defaultSubtitle = isWarning
    ? 'Hide from customer website'
    : isPrimary
    ? 'Restore to catalogue'
    : 'Irreversible action';

  const iconBg = isWarning
    ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-500'
    : isPrimary
    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-500'
    : 'bg-red-50 dark:bg-red-950/60 text-red-500';

  const buttonBg = isWarning
    ? 'bg-amber-600 hover:bg-amber-700 text-white'
    : isPrimary
    ? 'bg-[#2563EB] hover:bg-blue-700 text-white'
    : 'bg-red-600 hover:bg-red-700 text-white';

  const ActionIcon = isWarning
    ? Archive
    : isPrimary
    ? RotateCcw
    : Trash2;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-[1px] p-4 animate-in fade-in duration-150">
      <div className="shadow-2xl border max-w-sm w-full p-5 overflow-hidden bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl">
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
            <ActionIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">{title}</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500">{subtitle || defaultSubtitle}</p>
          </div>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 mb-5 leading-relaxed">{message}</p>

        <div className="flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50 ${buttonBg}`}
          >
            <ActionIcon className="w-3.5 h-3.5" />
            <span>{loading ? 'Processing...' : confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
