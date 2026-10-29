import React, { useState, useEffect } from 'react';
import { X, Cpu, AlertCircle, Plus } from 'lucide-react';

export default function SpecificationModal({ isOpen, onClose, onSubmit, initial = null, loading = false }) {
  const [specName, setSpecName] = useState('');
  const [specType, setSpecType] = useState('TECHNICAL');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (initial) {
      setSpecName(initial.specification_name || '');
      setSpecType(initial.specification_type || 'TECHNICAL');
      setDescription(initial.description || '');
      setIsActive(initial.is_active === 1 || initial.is_active === true);
    } else {
      setSpecName('');
      setSpecType('TECHNICAL');
      setDescription('');
      setIsActive(true);
    }
    setSubmitError('');
  }, [initial, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!specName.trim()) {
      setSubmitError('Specification Name is required.');
      return;
    }

    const payload = {
      specification_name: specName.trim(),
      specification_type: specType,
      description: description.trim(),
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

      {/* Slide-over Right Panel (Loads from side, not middle of page) */}
      <div className="fixed top-0 right-0 bottom-0 z-50 w-full sm:w-[410px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col transform transition-transform duration-200 ease-out animate-in slide-in-from-right">
        {/* Panel Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#2563EB] flex items-center justify-center font-bold shrink-0">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                {initial ? 'Edit Specification' : 'Create Specification'}
              </h3>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">Technical or accessory specification</p>
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
                Specification Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={specName}
                onChange={(e) => setSpecName(e.target.value)}
                placeholder="e.g. 5G Ultra Wideband, OLED 120Hz"
                required
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB] transition-colors"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Specification Category <span className="text-red-500">*</span>
              </label>
              <select
                value={specType}
                onChange={(e) => setSpecType(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB] cursor-pointer transition-colors"
              >
                <option value="TECHNICAL">TECHNICAL (Processor, Display, Camera)</option>
                <option value="ACCESSORY">ACCESSORY (Charger, Case, Earphones)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Hardware details or bundled item descriptions..."
                rows={3}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB] transition-colors resize-none"
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
                  <span>{initial ? 'Save Changes' : 'Create Specification'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
