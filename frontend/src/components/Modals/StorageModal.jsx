import React, { useState, useEffect } from 'react';
import { COLORS } from '../../constants/colors';
import { TYPOGRAPHY } from '../../constants/typography';
import Button from '../ui/Button';
import { X, HardDrive, AlertCircle } from 'lucide-react';

export default function StorageModal({ isOpen, onClose, onSubmit, initial = null, loading = false }) {
  const [storageName, setStorageName] = useState('');
  const [capacityGb, setCapacityGb] = useState('');
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (initial) {
      setStorageName(initial.storage_name || '');
      setCapacityGb(initial.capacity_gb || '');
    } else {
      setStorageName('');
      setCapacityGb('');
    }
    setSubmitError('');
  }, [initial, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!storageName.trim() || !capacityGb) {
      setSubmitError('Storage Name and Capacity are required.');
      return;
    }

    const payload = {
      storage_name: storageName.trim(),
      capacity_gb: Number(capacityGb),
    };

    const res = await onSubmit(payload);
    if (!res?.success && res?.error) {
      setSubmitError(res.error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="shadow-xl border max-w-md w-full overflow-hidden bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850">
          <div className="flex items-center gap-2.5">
            <div
              style={{ backgroundColor: COLORS.primaryLight, color: COLORS.primary }}
              className="w-8 h-8 flex items-center justify-center font-bold border border-red-200 dark:border-red-900 dark:bg-red-950/40"
            >
              <HardDrive className="w-4 h-4" />
            </div>
            <div>
              <h3 className={`${TYPOGRAPHY.heading} text-slate-900 dark:text-slate-100`}>
                {initial ? 'Edit Storage Option' : 'Create Storage Option'}
              </h3>
              <p className={`${TYPOGRAPHY.caption} text-slate-500 dark:text-slate-400`}>Configure GB capacity</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {submitError && (
          <div
            style={{
              backgroundColor: COLORS.dangerLight,
              borderColor: COLORS.secondaryBorder,
              color: COLORS.danger,
            }}
            className="m-5 mb-0 p-3 border flex items-center gap-2 text-xs"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className={`${TYPOGRAPHY.label} text-slate-700 dark:text-slate-300 block mb-1.5`}>
              Storage Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={storageName}
              onChange={(e) => setStorageName(e.target.value)}
              placeholder="e.g. 128GB, 256GB, 512GB, 1TB"
              required
              className="w-full px-3.5 py-2 text-xs border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-[#DC2626] bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 transition-all"
            />
          </div>

          <div>
            <label className={`${TYPOGRAPHY.label} text-slate-700 dark:text-slate-300 block mb-1.5`}>
              Capacity in GB <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              value={capacityGb}
              onChange={(e) => setCapacityGb(e.target.value)}
              placeholder="e.g. 128"
              required
              className="w-full px-3.5 py-2 text-xs border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-[#DC2626] bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 transition-all"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" size="sm" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="gradient" size="sm" type="submit" loading={loading}>
              {initial ? 'Save Changes' : 'Create Option'}
            </Button>
          </div>
        </form>
      </div>
    </div>

  );
}
