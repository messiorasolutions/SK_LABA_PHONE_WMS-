import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  PackageMinus,
  Layers,
  HardDrive,
  Plus,
  Minus,
  CheckCircle2,
  AlertCircle,
  TrendingDown,
} from 'lucide-react';

export default function DeductStockView({
  phone,
  onBack,
  onSubmit,
  submitting = false,
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
  }, [phone, colors, storages]);

  if (!phone) return null;

  const currentStock = Number(phone.current_stock ?? phone.stock_quantity ?? 0);
  const selectedColorObj = colors.find((c) => c.name === selectedColorName) || (colors.length > 0 ? colors[0] : null);

  const maxAllowedQty = selectedColorObj?.storage_quantities && typeof selectedColorObj.storage_quantities[selectedStorageName] === 'number'
    ? selectedColorObj.storage_quantities[selectedStorageName]
    : (storages.length <= 1 && selectedColorObj ? selectedColorObj.quantity : (selectedColorObj ? selectedColorObj.quantity : currentStock));

  const deductQty = Math.min(maxAllowedQty, Math.max(0, parseInt(quantity, 10) || 0));
  const nextStock = Math.max(0, currentStock - deductQty);
  const nextVariantStock = Math.max(0, maxAllowedQty - deductQty);

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
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ── Top Breadcrumb Navigation ─────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          type="button"
          className="inline-flex items-center gap-2 text-xs font-normal text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Stock Management</span>
        </button>
      </div>

      {/* ── Page Header ──────────────────────────────────────────────── */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 flex items-center justify-center text-rose-600 dark:text-rose-400">
            <PackageMinus className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-normal text-slate-900 dark:text-white tracking-tight">
              Deduct Stock Inventory
            </h1>
            <p className="text-xs font-normal text-slate-500 dark:text-slate-400 mt-0.5">
              Reduce warehouse units for sale, damaged inventory, or audit reconciliation
            </p>
          </div>
        </div>
      </div>

      {/* ── Device Overview Card ─────────────────────────────────────── */}
      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          {phone.image_url ? (
            <img
              src={phone.image_url}
              alt={phone.name}
              className="w-14 h-14 rounded-lg object-contain bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-1 shrink-0"
            />
          ) : (
            <div className="w-14 h-14 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-normal text-base shrink-0">
              {phone.brand_name?.charAt(0) || 'P'}
            </div>
          )}
          <div>
            <div className="text-base font-normal text-slate-900 dark:text-white">
              {phone.name}
            </div>
            <div className="text-xs font-normal text-slate-500 dark:text-slate-400 mt-0.5">
              SKLABA_Phone_{phone.phone_id} · {phone.brand_name || 'Brand'} · {phone.phone_condition === 'NEW' ? 'New Condition' : 'Used Condition'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6 text-right">
          <div>
            <div className="text-[11px] font-normal text-slate-400 uppercase tracking-wider">
              Current Total Stock
            </div>
            <div className="text-lg font-normal text-slate-900 dark:text-white mt-0.5">
              {currentStock} <span className="text-xs text-slate-500 font-normal">units</span>
            </div>
          </div>
          <div>
            <div className="text-[11px] font-normal text-slate-400 uppercase tracking-wider">
              Low Stock Level
            </div>
            <div className="text-lg font-normal text-slate-900 dark:text-white mt-0.5">
              {phone.low_stock_level ?? 5} <span className="text-xs text-slate-500 font-normal">threshold</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Form Layout ─────────────────────────────────────────── */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-xs font-normal text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Form Selectors */}
          <div className="lg:col-span-2 space-y-5">
            {/* 1. Color Variant Selection */}
            {colors.length > 0 && (
              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
                <label className="block text-xs font-normal text-slate-700 dark:text-slate-300">
                  Select Color Variant to Deduct From
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {colors.map((c) => {
                    const isSelected = selectedColorName === c.name;
                    const cQty = c.quantity ?? 0;
                    return (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => setSelectedColorName(c.name)}
                        className={`p-3 rounded-lg border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                          isSelected
                            ? 'border-slate-900 dark:border-rose-800 bg-rose-50/40 dark:bg-rose-950/20 ring-1 ring-rose-600/30'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                        } ${cQty <= 0 ? 'opacity-60' : ''}`}
                      >
                        <span
                          className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-600 shrink-0"
                          style={{ backgroundColor: c.color_code || '#4B5563' }}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-normal text-slate-900 dark:text-slate-100 truncate">
                            {c.name}
                          </div>
                          <div className="text-[10px] font-normal text-slate-500">
                            Available: {cQty} units
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2. Storage Variant Selection */}
            {storages.length > 0 && (
              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
                <label className="block text-xs font-normal text-slate-700 dark:text-slate-300">
                  Select Storage Capacity
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {storages.map((s) => {
                    const isSelected = selectedStorageName === s.storage_name;
                    return (
                      <button
                        key={s.storage_id || s.storage_name}
                        type="button"
                        onClick={() => setSelectedStorageName(s.storage_name)}
                        className={`px-4 py-2 rounded-lg border text-xs font-normal transition-all cursor-pointer flex items-center gap-2 ${
                          isSelected
                            ? 'border-slate-900 dark:border-rose-800 bg-slate-900 text-white dark:bg-rose-950/40 dark:text-rose-200'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <HardDrive className="w-3.5 h-3.5 opacity-70" />
                        <span>{s.storage_name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3. Quantity Stepper & Presets */}
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-normal text-slate-700 dark:text-slate-300">
                    Quantity to Deduct
                  </label>
                  <span className="text-[11px] font-normal text-slate-500">
                    Max Available: <span className="text-slate-900 dark:text-white font-normal">{maxAllowedQty} units</span>
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-800">
                    <button
                      type="button"
                      onClick={() => setQuantity((prev) => Math.max(1, (parseInt(prev, 10) || 1) - 1))}
                      className="p-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                      title="Decrease quantity"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      max={maxAllowedQty}
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="w-24 text-center py-2 bg-transparent text-sm font-normal text-slate-900 dark:text-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setQuantity((prev) => Math.min(maxAllowedQty, (parseInt(prev, 10) || 0) + 1))}
                      className="p-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                      title="Increase quantity"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <span className="text-xs font-normal text-slate-400">units to deduct</span>
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div>
                <div className="text-[11px] font-normal text-slate-500 mb-2">Quick Presets:</div>
                <div className="flex flex-wrap gap-2">
                  {quickAmounts.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setQuantity(amt)}
                      className="px-3 py-1 text-xs font-normal rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                    >
                      -{amt}
                    </button>
                  ))}
                  {maxAllowedQty > 0 && (
                    <button
                      type="button"
                      onClick={() => setQuantity(maxAllowedQty)}
                      className="px-3 py-1 text-xs font-normal rounded-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100 transition-colors cursor-pointer"
                    >
                      Max ({maxAllowedQty})
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* 4. Deduction Reason & Notes */}
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
              <div>
                <label className="block text-xs font-normal text-slate-700 dark:text-slate-300 mb-1.5">
                  Deduction Reason
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-normal text-slate-800 dark:text-slate-200 focus:outline-none focus:border-neutral-500"
                >
                  <option value="SALE">Direct Customer Sale</option>
                  <option value="DAMAGED">Damaged / Defective Stock</option>
                  <option value="AUDIT">Warehouse Audit Reduction</option>
                  <option value="INTERNAL_TRANSFER">Store / Display Model Transfer</option>
                  <option value="OTHER">Other Deduction</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-normal text-slate-700 dark:text-slate-300 mb-1.5">
                  Internal Warehouse Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Enter order reference, defect reason, or adjustment note..."
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-normal text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-neutral-500"
                />
              </div>
            </div>
          </div>

          {/* Right 1 Col: Live Stock Summary */}
          <div className="space-y-4">
            <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 text-xs font-normal">
                <TrendingDown className="w-4 h-4 text-rose-600" />
                <span>Live Stock</span>
              </div>

              {/* Variant Stock Projection */}
              <div className="space-y-1 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="text-[11px] font-normal text-slate-400 dark:text-slate-500">
                  Selected Variant ({selectedColorName || 'Standard'} · {selectedStorageName || 'Standard'})
                </div>
                <div className="flex items-baseline justify-between pt-1">
                  <span className="text-xs font-normal text-slate-600 dark:text-slate-400">
                    Current: {maxAllowedQty} units
                  </span>
                  <span className="text-sm font-normal text-rose-600 dark:text-rose-400">
                    → {nextVariantStock} units (-{deductQty})
                  </span>
                </div>
              </div>

              {/* Total Stock Projection */}
              <div className="space-y-1">
                <div className="text-[11px] font-normal text-slate-400 dark:text-slate-500">
                  Total Device Warehouse Stock
                </div>
                <div className="flex items-baseline justify-between pt-1">
                  <span className="text-xs font-normal text-slate-600 dark:text-slate-400">
                    Current: {currentStock} units
                  </span>
                  <span className="text-sm font-normal text-slate-900 dark:text-white">
                    → {nextStock} units (-{deductQty})
                  </span>
                </div>
              </div>

              {nextStock <= (phone.low_stock_level ?? 5) && nextStock > 0 && (
                <div className="pt-2 text-[11px] font-normal text-amber-600 dark:text-amber-400 border-t border-slate-100 dark:border-slate-800">
                  Note: Inventory will fall to or below low stock threshold ({phone.low_stock_level ?? 5} units).
                </div>
              )}

              {nextStock === 0 && (
                <div className="pt-2 text-[11px] font-normal text-rose-600 dark:text-rose-400 border-t border-slate-100 dark:border-slate-800">
                  Note: This phone will reach 0 units and become Sold Out.
                </div>
              )}
            </div>

            {/* Actions Card */}
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
              <button
                type="submit"
                disabled={submitting || deductQty <= 0 || maxAllowedQty <= 0}
                className="w-full py-2.5 px-4 text-xs font-normal rounded-full bg-gradient-to-r from-black via-neutral-900 to-rose-950 hover:to-rose-900 text-white border border-neutral-800 transition-all cursor-pointer disabled:opacity-50 shadow-xs flex items-center justify-center gap-2"
              >
                <Minus className="w-4 h-4" />
                <span>{submitting ? 'Deducting Inventory...' : 'Confirm & Deduct Stock'}</span>
              </button>

              <button
                type="button"
                onClick={onBack}
                disabled={submitting}
                className="w-full py-2 px-4 text-xs font-normal rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer text-center"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

