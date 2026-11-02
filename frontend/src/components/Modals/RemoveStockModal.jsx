import React, { useState, useEffect, useMemo } from 'react';
import { X, Minus, AlertCircle, PackageMinus, ArrowRight, HardDrive } from 'lucide-react';

export default function RemoveStockModal({
  isOpen,
  onClose,
  phone,
  onSubmit,
  loading = false,
}) {
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState('SALE');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState(null);

  // Parse color options from phone
  const colors = useMemo(() => {
    let raw = phone?.colour_options;
    if (typeof raw === 'string') {
      try {
        raw = JSON.parse(raw);
      } catch (e) {
        raw = raw.split(',').map((c) => c.trim()).filter(Boolean);
      }
    }
    if (!Array.isArray(raw)) return [];
    return raw.map((c, i) => {
      if (typeof c === 'string') {
        return {
          name: c,
          color_name: c,
          color_code: '#4B5563',
          quantity: i === 0 ? Number(phone.current_stock ?? phone.stock_quantity ?? 0) : 0,
          storage_quantities: {},
        };
      }
      return {
        name: c.color_name || c.name || `Color #${i + 1}`,
        color_name: c.color_name || c.name || `Color #${i + 1}`,
        color_code: c.color_code || '#4B5563',
        quantity: typeof c.quantity === 'number' ? c.quantity : (i === 0 ? Number(phone.current_stock ?? phone.stock_quantity ?? 0) : 0),
        storage_quantities: c.storage_quantities || {},
        photos: c.photos || [],
      };
    });
  }, [phone]);

  // Parse storage options from phone
  const storages = useMemo(() => {
    if (Array.isArray(phone?.storage_options) && phone.storage_options.length > 0) {
      return phone.storage_options;
    }
    if (Array.isArray(phone?.storage_names) && phone.storage_names.length > 0) {
      return phone.storage_names.map((name, i) => ({
        storage_id: i + 1,
        storage_name: name,
      }));
    }
    if (Array.isArray(phone?.storage_ids) && phone.storage_ids.length > 0) {
      return phone.storage_ids.map((id) => ({
        storage_id: id,
        storage_name: typeof id === 'string' ? id : `${id}GB`,
      }));
    }
    return [{ storage_id: 'default', storage_name: 'Standard' }];
  }, [phone]);

  const [selectedColorName, setSelectedColorName] = useState('');
  const [selectedStorageName, setSelectedStorageName] = useState('');

  useEffect(() => {
    if (isOpen) {
      setQuantity(1);
      setReason('SALE');
      setNotes('');
      setError(null);
      if (colors.length > 0) {
        const firstWithStock = colors.find((c) => c.quantity > 0) || colors[0];
        setSelectedColorName(firstWithStock.name);
      } else {
        setSelectedColorName('');
      }
      if (storages.length > 0) {
        setSelectedStorageName(storages[0].storage_name);
      } else {
        setSelectedStorageName('');
      }
    }
  }, [isOpen, phone, colors, storages]);

  if (!isOpen || !phone) return null;

  const currentStock = Number(phone.current_stock ?? phone.stock_quantity ?? 0);
  const nextStock = Math.max(0, currentStock - (Number(quantity) || 0));

  const selectedColorObj = colors.find((c) => c.name === selectedColorName) || (colors.length > 0 ? colors[0] : null);

  // Variant stock calculation for selected color & storage
  const maxAllowedQty = selectedColorObj?.storage_quantities && typeof selectedColorObj.storage_quantities[selectedStorageName] === 'number'
    ? selectedColorObj.storage_quantities[selectedStorageName]
    : (storages.length <= 1 && selectedColorObj ? selectedColorObj.quantity : (selectedColorObj ? selectedColorObj.quantity : currentStock));

  const nextVariantStock = Math.max(0, maxAllowedQty - (Number(quantity) || 0));
  const quickAmounts = [1, 2, 5, 10].filter((amt) => amt <= maxAllowedQty);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const parsedQty = parseInt(quantity, 10);
    if (isNaN(parsedQty) || parsedQty <= 0) {
      setError('Please enter a valid quantity greater than 0.');
      return;
    }

    if (parsedQty > maxAllowedQty) {
      setError(
        selectedColorObj
          ? `Cannot deduct ${parsedQty} units. Available for '${selectedColorObj.name} (${selectedStorageName})' is only ${maxAllowedQty}.`
          : `Cannot deduct ${parsedQty} units. Current stock is only ${currentStock}.`
      );
      return;
    }

    const res = await onSubmit({
      quantity: parsedQty,
      color_name: selectedColorName || undefined,
      storage_name: selectedStorageName || undefined,
      reason,
      notes: notes.trim() || undefined,
    });

    if (!res?.success && res?.error) {
      setError(res.error);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[1px] transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over Right Panel */}
      <div className="fixed top-0 right-0 bottom-0 z-50 w-full sm:w-[460px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col transform transition-transform duration-200 ease-out animate-in slide-in-from-right">
        {/* Panel Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <PackageMinus className="w-4 h-4 text-rose-500" />
              <span>Deduct Stock Quantity</span>
            </h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              Reduce warehouse stock by color & storage (SRS ST-05)
            </p>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mx-5 mt-3 p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-300 rounded-lg flex items-center gap-2 text-xs shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {/* Phone Info Card */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3">
              {phone.image_url ? (
                <img
                  src={phone.image_url}
                  alt={phone.name}
                  className="w-12 h-12 rounded-lg object-contain bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-1 shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-rose-50 dark:bg-rose-950 text-rose-500 flex items-center justify-center font-bold text-xs shrink-0">
                  {phone.brand_name?.charAt(0) || 'P'}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                  {phone.name}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  ID: <span className="font-mono">SKLABA_Phone_{phone.phone_id}</span> · {phone.brand_name || 'Brand'}
                </div>
              </div>
            </div>

            {/* 1. Color Selector */}
            {colors.length > 0 && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>1. Select Color to Deduct <span className="text-red-500">*</span></span>
                  <span className="text-[10px] text-slate-400 font-normal">Active: {selectedColorObj?.name}</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {colors.map((c) => {
                    const isSelected = selectedColorName === c.name;
                    return (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => setSelectedColorName(c.name)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                          isSelected
                            ? 'bg-rose-50/80 dark:bg-rose-950/60 border-rose-500 ring-2 ring-rose-500/20 text-slate-900 dark:text-white'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                        }`}
                      >
                        <span
                          className="w-4 h-4 rounded-full border border-black/10 shrink-0 shadow-xs"
                          style={{ backgroundColor: c.color_code || '#64748b' }}
                        />
                        <div className="min-w-0 flex-1">
                          <span className="block text-xs font-bold truncate leading-tight">
                            {c.name}
                          </span>
                          <span className="block text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                            Total: <strong className="text-slate-700 dark:text-slate-200">{c.quantity}</strong> units
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2. Storage Option Selector */}
            {storages.length > 0 && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <HardDrive className="w-3.5 h-3.5 text-rose-500" />
                    <span>2. Select Storage Option <span className="text-red-500">*</span></span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">Capacity</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {storages.map((s) => {
                    const isSelected = selectedStorageName === s.storage_name;
                    const storageStock = selectedColorObj?.storage_quantities && typeof selectedColorObj.storage_quantities[s.storage_name] === 'number'
                      ? selectedColorObj.storage_quantities[s.storage_name]
                      : (storages.length === 1 ? (selectedColorObj?.quantity ?? currentStock) : 0);
                    return (
                      <button
                        key={s.storage_name || s.storage_id}
                        type="button"
                        onClick={() => setSelectedStorageName(s.storage_name)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-rose-50/80 dark:bg-rose-950/60 border-rose-500 ring-2 ring-rose-500/20 text-slate-900 dark:text-white'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold truncate">
                            {s.storage_name}
                          </span>
                          {isSelected && <span className="w-2 h-2 rounded-full bg-rose-500" />}
                        </div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                          Available: <strong className="text-slate-700 dark:text-slate-200">{storageStock}</strong> units
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Current vs Next Stock Calculator Banner */}
            <div className="p-3 rounded-xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <span className="block text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400 truncate">
                    {selectedColorObj ? `${selectedColorObj.name} · ${selectedStorageName}` : 'Current Stock'}
                  </span>
                  <span className="text-base font-bold text-slate-800 dark:text-slate-200">
                    {maxAllowedQty}
                  </span>
                </div>
                <div className="flex items-center justify-center text-rose-500">
                  <ArrowRight className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-semibold text-rose-600 dark:text-rose-400 truncate">
                    Remaining
                  </span>
                  <span className="text-base font-bold text-rose-600 dark:text-rose-400">
                    {nextVariantStock}
                  </span>
                </div>
              </div>
              <div className="text-[11px] text-center text-slate-500 dark:text-slate-400 mt-2 pt-2 border-t border-rose-100/60 dark:border-rose-900/40">
                Total warehouse stock will become <strong>{nextStock}</strong>.
              </div>
            </div>

            {/* Quick Deduction Chips */}
            {quickAmounts.length > 0 && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Quick Select Quantity
                </label>
                <div className="flex flex-wrap gap-2">
                  {quickAmounts.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setQuantity(amt)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                        Number(quantity) === amt
                          ? 'bg-rose-600 text-white border-rose-600'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                      }`}
                    >
                      -{amt}
                    </button>
                  ))}
                  {maxAllowedQty > 0 && (
                    <button
                      type="button"
                      onClick={() => setQuantity(maxAllowedQty)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 transition-colors cursor-pointer"
                    >
                      Deduct All ({maxAllowedQty})
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Exact Quantity Input */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Units to Deduct <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, (Number(q) || 1) - 1))}
                  className="w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold transition-colors cursor-pointer"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  max={maxAllowedQty}
                  step="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                  className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-center font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(maxAllowedQty, (Number(q) || 0) + 1))}
                  className="w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold transition-colors cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

            {/* Deduction Reason */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Deduction Reason
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 cursor-pointer"
              >
                <option value="SALE">Direct In-Store Sale / Walk-in Customer</option>
                <option value="DAMAGED">Damaged / Defective Stock Written Off</option>
                <option value="RESERVATION_HOLD">Held for Confirmed Customer Reservation</option>
                <option value="CORRECTION">Physical Stock Audit Correction</option>
                <option value="TRANSFER">Transfer to Another Branch</option>
                <option value="OTHER">Other Reason</option>
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Internal Note (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="e.g. Sold in cash counter / Defective screen RMA"
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
            </div>
          </div>

          {/* Panel Footer */}
          <div className="p-4 px-5 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="w-1/2 py-2.5 px-4 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || Number(quantity) <= 0 || Number(quantity) > maxAllowedQty}
              className="w-1/2 py-2.5 px-4 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50 text-center flex items-center justify-center gap-1.5"
            >
              <Minus className="w-3.5 h-3.5" />
              <span>
                {loading
                  ? 'Deducting...'
                  : selectedColorObj
                  ? `Deduct -${quantity} (${selectedColorObj.name} · ${selectedStorageName})`
                  : `Deduct -${quantity} Units`}
              </span>
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
