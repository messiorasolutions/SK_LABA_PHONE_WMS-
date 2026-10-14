import React from 'react';
import { COLORS } from '../../constants/colors';
import { TYPOGRAPHY } from '../../constants/typography';
import Button from '../ui/Button';
import { Trash2, AlertTriangle, X } from 'lucide-react';

export default function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Delete Item',
  message = 'Are you sure you want to delete this record? This action cannot be undone.',
  loading = false,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="shadow-xl border max-w-sm w-full p-5 overflow-hidden bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3 mb-3">
          <div
            style={{ backgroundColor: COLORS.secondaryLight, color: COLORS.secondary }}
            className="w-10 h-10 flex items-center justify-center shrink-0 border border-red-200 dark:border-red-900 dark:bg-red-950/40"
          >
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className={`${TYPOGRAPHY.heading} text-slate-900 dark:text-slate-100`}>{title}</h3>
            <p className={`${TYPOGRAPHY.caption} text-slate-500 dark:text-slate-400`}>Irreversible action</p>
          </div>
        </div>

        <p className={`${TYPOGRAPHY.body} text-slate-600 dark:text-slate-300 mb-5`}>{message}</p>

        <div className="flex justify-end gap-2.5">
          <Button variant="outline" size="sm" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="danger" size="sm" icon={Trash2} onClick={onConfirm} loading={loading}>
            Delete
          </Button>
        </div>
      </div>
    </div>

  );
}
