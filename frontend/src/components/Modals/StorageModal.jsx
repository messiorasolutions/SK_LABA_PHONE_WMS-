import React, { useState, useEffect } from 'react';
import { X, HardDrive, AlertCircle, Plus } from 'lucide-react';

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
      setSubmitError('Option Name and Capacity in GB are required.');
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
    <>
      {/* Semi-transparent Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-[1px] transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over Right Panel (Loads from side, not middle of page) */}
      <div className="fixed top-0 right-0 bottom-0 z-50 w-full sm:w-[410px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col transform transition-transform duration-200 ease-out animate-in slide-in-from-right">
        {/* Panel Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#2563EB] flex items-center justify-center font-bold shrink-0">
              <HardDrive className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                {initial ? 'Edit Storage Option' : 'Create Storage Option'}
              </h3>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">Configure GB capacity</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {submitError && (
          <div className="mx-5 mt-3 p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-300 rounded-lg flex items-center gap-2 text-xs shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        {/* Form Body with pinned footer (no scroll required) */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Storage Option Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={storageName}
                onChange={(e) => setStorageName(e.target.value)}
                placeholder="e.g. 256GB NVMe / UFS 4.0"
                required
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB] transition-colors"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Capacity in GB <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={capacityGb}
                onChange={(e) => setCapacityGb(e.target.value)}
                placeholder="e.g. 256"
                required
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB] transition-colors"
              />
            </div>
          </div>

          {/* Panel Footer (Pinned at Bottom) */}
          <div className="p-4 px-5 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 py-2.5 px-4 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer text-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-1/2 py-2.5 px-4 text-xs font-semibold text-white bg-[#2563EB] hover:bg-blue-700 rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {loading ? (
                <span>Saving...</span>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>{initial ? 'Save Changes' : 'Create Storage'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
