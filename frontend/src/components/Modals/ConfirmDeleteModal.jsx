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
    ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/50'
    : isPrimary
    ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200/50 dark:border-rose-900/50'
    : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200/50 dark:border-rose-900/50';

  const buttonBg = isWarning
    ? 'bg-gradient-to-r from-black via-neutral-900 to-amber-950 hover:to-amber-900 text-white border border-neutral-800'
    : isPrimary
    ? 'bg-gradient-to-r from-black via-neutral-900 to-rose-950 hover:to-rose-900 text-white border border-neutral-800'
    : 'bg-gradient-to-r from-neutral-900 via-rose-950 to-red-900 hover:to-red-800 text-white border border-neutral-800';

  const ActionIcon = isWarning
    ? Archive
    : isPrimary
    ? RotateCcw
    : Trash2;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-150">
      <div className="shadow-2xl border-2 max-w-sm w-full p-5 overflow-hidden bg-white dark:bg-slate-900 rounded-2xl border-slate-900 dark:border-rose-900/60 ring-1 ring-rose-600/30 dark:ring-rose-500/20 shadow-slate-950/20">
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${iconBg}`}>
            <ActionIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-normal text-sm text-slate-800 dark:text-slate-100">{title}</h3>
            <p className="text-xs font-normal text-slate-400 dark:text-slate-500">{subtitle || defaultSubtitle}</p>
          </div>
        </div>

        <p className="text-xs font-normal text-slate-600 dark:text-slate-300 mb-5 leading-relaxed">{message}</p>

        <div className="flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-xs font-normal text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-normal rounded-full transition-all cursor-pointer disabled:opacity-50 ${buttonBg}`}
          >
            <ActionIcon className="w-3.5 h-3.5" />
            <span>{loading ? 'Processing...' : confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
