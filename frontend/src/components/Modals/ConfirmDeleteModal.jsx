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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div
        style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border }}
        className="rounded-2xl shadow-xl border max-w-sm w-full p-5 overflow-hidden"
      >
        <div className="flex items-center gap-3 mb-3">
          <div
            style={{ backgroundColor: COLORS.secondaryLight, color: COLORS.secondary }}
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          >
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className={TYPOGRAPHY.heading}>{title}</h3>
            <p className={TYPOGRAPHY.caption}>Irreversible action</p>
          </div>
        </div>

        <p className={`${TYPOGRAPHY.body} text-slate-600 mb-5`}>{message}</p>

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
