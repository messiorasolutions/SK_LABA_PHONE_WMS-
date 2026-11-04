import React, { useState } from 'react';
import { Ban } from 'lucide-react';

export default function MarkSoldOutModal({
  isOpen,
  onClose,
  phone,
  onConfirm,
  loading = false,
}) {
  const [resetQuantity, setResetQuantity] = useState(true);

  if (!isOpen || !phone) return null;

  const currentStock = Number(phone.current_stock ?? phone.stock_quantity ?? 0);

  const handleConfirm = () => {
    onConfirm(resetQuantity);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-150">
      <div className="shadow-2xl border-2 border-slate-900 dark:border-rose-900/60 ring-1 ring-rose-600/30 max-w-sm w-full p-5 overflow-hidden bg-white dark:bg-slate-900 rounded-2xl">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-200 dark:border-rose-900/40">
            <Ban className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-normal text-sm text-slate-900 dark:text-white">
              Mark as Sold Out
            </h3>
            <p className="text-xs font-normal text-slate-400 dark:text-slate-500">
              Update phone availability (SRS ST-05)
            </p>
          </div>
        </div>

        <p className="text-xs font-normal text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
          Are you sure you want to mark <span className="font-normal text-slate-900 dark:text-white">"{phone.name}"</span> as <span className="font-normal text-rose-600">Sold Out</span>?
        </p>

        {currentStock > 0 && (
          <div className="mb-5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={resetQuantity}
                onChange={(e) => setResetQuantity(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
              />
              <span className="text-xs font-normal text-slate-700 dark:text-slate-300 leading-tight">
                Reset current inventory stock from <span className="font-normal text-slate-900 dark:text-white">{currentStock}</span> to <span className="font-normal text-rose-500">0 units</span>
              </span>
            </label>
          </div>
        )}

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
            onClick={handleConfirm}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-normal rounded-full transition-all cursor-pointer disabled:opacity-50 text-white bg-gradient-to-r from-black via-neutral-900 to-rose-950 hover:to-rose-900 border border-neutral-800 shadow-sm"
          >
            <Ban className="w-3.5 h-3.5" />
            <span>{loading ? 'Updating...' : 'Mark Sold Out'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
