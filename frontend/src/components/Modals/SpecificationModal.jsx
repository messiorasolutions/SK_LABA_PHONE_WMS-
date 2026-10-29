import React, { useState, useEffect } from 'react';
import { COLORS } from '../../constants/colors';
import { TYPOGRAPHY } from '../../constants/typography';
import Button from '../ui/Button';
import { X, Cpu, AlertCircle } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="shadow-xl border max-w-md w-full overflow-hidden bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850">
          <div className="flex items-center gap-2.5">
            <div
              style={{ backgroundColor: COLORS.primaryLight, color: COLORS.primary }}
              className="w-8 h-8 flex items-center justify-center font-bold border border-red-200 dark:border-red-900 dark:bg-red-950/40"
            >
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h3 className={`${TYPOGRAPHY.heading} text-slate-900 dark:text-slate-100`}>
                {initial ? 'Edit Specification' : 'Create Specification'}
              </h3>
              <p className={`${TYPOGRAPHY.caption} text-slate-500 dark:text-slate-400`}>Technical or accessory specification</p>
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
              Specification Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={specName}
              onChange={(e) => setSpecName(e.target.value)}
              placeholder="e.g. Super AMOLED Display 120Hz, 25W Fast Charger"
              required
              className="w-full px-3.5 py-2 text-xs border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-[#DC2626] bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 transition-all"
            />
          </div>

          <div>
            <label className={`${TYPOGRAPHY.label} text-slate-700 dark:text-slate-300 block mb-1.5`}>
              Type <span className="text-red-500">*</span>
            </label>
            <select
              value={specType}
              onChange={(e) => setSpecType(e.target.value)}
              className="w-full px-3.5 py-2 text-xs border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-[#DC2626] bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 transition-all"
            >
              <option value="TECHNICAL">TECHNICAL (Screen, CPU, Camera)</option>
              <option value="ACCESSORY">ACCESSORY (Charger, Cable, Case)</option>
            </select>
          </div>

          <div>
            <label className={`${TYPOGRAPHY.label} text-slate-700 dark:text-slate-300 block mb-1.5`}>
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed specs or features..."
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

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" size="sm" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="gradient" size="sm" type="submit" loading={loading}>
              {initial ? 'Save Changes' : 'Create Specification'}
            </Button>
          </div>
        </form>
      </div>
    </div>

  );
}
