import React, { useState, useEffect } from 'react';
import { COLORS } from '../../constants/colors';
import { TYPOGRAPHY } from '../../constants/typography';
import Button from '../ui/Button';
import { X, Tag, AlertCircle, Info } from 'lucide-react';

export default function BrandModal({ isOpen, onClose, onSubmit, initial = null, loading = false }) {
  const [brandName, setBrandName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (initial) {
      setBrandName(initial.brand_name || '');
      setDescription(initial.description || '');
      setIsActive(initial.is_active === 1 || initial.is_active === true);
    } else {
      setBrandName('');
      setDescription('');
      setIsActive(true);
    }
    setSubmitError('');
  }, [initial, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!brandName.trim()) {
      setSubmitError('Brand Name is required.');
      return;
    }

    const payload = {
      brand_name: brandName.trim(),
      description: description.trim(),
      is_active: isActive,
    };

    const res = await onSubmit(payload);
    if (!res?.success && res?.error) {
      setSubmitError(res.error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="shadow-xl border max-w-md w-full overflow-hidden bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850">
          <div className="flex items-center gap-2.5">
            <div
              style={{ backgroundColor: COLORS.primaryLight, color: COLORS.primary }}
              className="w-8 h-8 flex items-center justify-center font-bold border border-red-200 dark:border-red-900 dark:bg-red-950/40"
            >
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h3 className={`${TYPOGRAPHY.heading} text-slate-900 dark:text-slate-100`}>
                {initial ? 'Edit Brand' : 'Create New Brand'}
              </h3>
              <p className={`${TYPOGRAPHY.caption} text-slate-500 dark:text-slate-400`}>
                {initial ? `Update #${initial.brand_id} brand details` : 'Add brand to catalogue'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error alert */}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className={`${TYPOGRAPHY.label} text-slate-700 dark:text-slate-300 block mb-1.5`}>
              Brand Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder="e.g. Apple, Samsung, Xiaomi"
              required
              className="w-full px-3.5 py-2 text-xs border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-[#DC2626] bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 transition-all"
            />
          </div>

          <div>
            <label className={`${TYPOGRAPHY.label} text-slate-700 dark:text-slate-300 block mb-1.5`}>
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Flagship smartphones and devices..."
              rows={3}
              className="w-full px-3.5 py-2 text-xs border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-[#DC2626] bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 transition-all resize-none"
            />
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              role="switch"
              aria-checked={isActive}
              onClick={() => setIsActive(!isActive)}
              className={`relative inline-flex h-5 w-10 items-center transition-colors cursor-pointer ${
                isActive ? 'bg-[#DC2626]' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform bg-white transition-transform ${
                  isActive ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`${TYPOGRAPHY.subheading} text-slate-600 dark:text-slate-400`}>
              Status: <strong className={isActive ? 'text-emerald-500' : 'text-slate-400'}>{isActive ? 'Active' : 'Inactive'}</strong>
            </span>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" size="sm" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="gradient" size="sm" type="submit" loading={loading}>
              {initial ? 'Save Changes' : 'Create Brand'}
            </Button>
          </div>
        </form>
      </div>
    </div>

  );
}
