import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';

export default function StorageModal({ isOpen, onClose, onSubmit, initial = null, loading = false }) {
  const [storageName, setStorageName] = useState('');
  const [capacityGb, setCapacityGb] = useState('');
  const [storageType, setStorageType] = useState('Internal UFS');
  const [isActive, setIsActive] = useState(true);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (initial) {
      setStorageName(initial.storage_name || '');
      setCapacityGb(initial.capacity_gb || '');
      setStorageType(initial.storage_type || 'Internal UFS');
      setIsActive(initial.is_active === 1 || initial.is_active === true);
    } else {
      setStorageName('');
      setCapacityGb('');
      setStorageType('Internal UFS');
      setIsActive(true);
    }
    setSubmitError('');
  }, [initial, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!storageName.trim()) {
      setSubmitError('Storage Name is required.');
      return;
    }
    if (!capacityGb || Number(capacityGb) <= 0) {
      setSubmitError('Valid Capacity (GB) is required.');
      return;
    }

    const payload = {
      storage_name: storageName.trim(),
      capacity_gb: Number(capacityGb),
      storage_type: storageType.trim(),
      is_active: isActive,
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

      {/* Slide-over Right Panel */}
      <div className="fixed top-0 right-0 bottom-0 z-50 w-full sm:w-[410px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col transform transition-transform duration-200 ease-out animate-in slide-in-from-right">
        {/* Panel Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              {initial ? 'Edit Storage Option' : 'Create Storage Option'}
            </h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">Configure GB capacity</p>
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

        {/* Form Body with pinned footer */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Storage Label <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={storageName}
                onChange={(e) => setStorageName(e.target.value)}
                placeholder="e.g. 128GB, 256GB NVMe"
                required
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB] transition-colors"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Capacity (GB) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={capacityGb}
                onChange={(e) => setCapacityGb(e.target.value)}
                placeholder="e.g. 128"
                min="1"
                required
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB] transition-colors"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Storage Technology / Type
              </label>
              <input
                type="text"
                value={storageType}
                onChange={(e) => setStorageType(e.target.value)}
                placeholder="e.g. UFS 3.1, NVMe"
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB] transition-colors"
              />
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                role="switch"
                aria-checked={isActive}
                onClick={() => setIsActive(!isActive)}
                className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors cursor-pointer ${
                  isActive ? 'bg-[#2563EB]' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
                    isActive ? 'translate-x-5' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                Status: <strong className={isActive ? 'text-emerald-600' : 'text-slate-400'}>{isActive ? 'Active' : 'Inactive'}</strong>
              </span>
            </div>
          </div>

          {/* Panel Footer */}
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
              className="w-1/2 py-2.5 px-4 text-xs font-semibold text-white bg-[#2563EB] hover:bg-blue-700 rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50 text-center"
            >
              {loading ? 'Saving...' : initial ? 'Save Changes' : 'Create Option'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
