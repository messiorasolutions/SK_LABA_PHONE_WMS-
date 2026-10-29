import React, { useState, useEffect } from 'react';
import {
  X,
  Smartphone,
  Shield,
  Tag,
  Layers,
  FileText,
  Plus,
  ChevronDown,
  AlertCircle,
} from 'lucide-react';

export default function PhoneModal({
  isOpen,
  onClose,
  onSubmit,
  initial = null,
  loading = false,
  brands = [],
  storageOptions = [],
  specifications = [],
}) {
  const [name, setName] = useState('');
  const [brandId, setBrandId] = useState('');
  const [phoneCondition, setPhoneCondition] = useState('NEW');
  const [price, setPrice] = useState('');
  const [lowStockLevel, setLowStockLevel] = useState('');
  const [availability, setAvailability] = useState('IN_STOCK');
  const [status, setStatus] = useState('PUBLISHED');
  const [warranty, setWarranty] = useState('');
  const [description, setDescription] = useState('');
  const [colourOptions, setColourOptions] = useState('');
  const [installmentEnabled, setInstallmentEnabled] = useState(false);
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (initial) {
      setName(initial.name || '');
      setBrandId(initial.brand_id || '');
      setPhoneCondition(initial.phone_condition || 'NEW');
      setPrice(initial.price || '');
      setLowStockLevel(initial.low_stock_level ?? initial.stock_quantity ?? '');
      setAvailability(initial.availability || 'IN_STOCK');
      setStatus(initial.status || 'PUBLISHED');
      setWarranty(initial.warranty || '');
      setDescription(initial.description || '');
      setColourOptions(
        Array.isArray(initial.colour_options)
          ? initial.colour_options.join(', ')
          : initial.colour_options || ''
      );
      setInstallmentEnabled(Boolean(initial.installment_enabled));
      setShowMoreDetails(Boolean(initial.warranty || initial.colour_options));
    } else {
      setName('');
      setBrandId(brands[0]?.brand_id || '');
      setPhoneCondition('NEW');
      setPrice('');
      setLowStockLevel('');
      setAvailability('IN_STOCK');
      setStatus('PUBLISHED');
      setWarranty('');
      setDescription('');
      setColourOptions('');
      setInstallmentEnabled(false);
      setShowMoreDetails(false);
    }
    setSubmitError('');
  }, [initial, isOpen, brands]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !brandId || !price) {
      setSubmitError('Phone Model, Brand, and Price are required.');
      return;
    }

    const payload = {
      name: name.trim(),
      brand_id: Number(brandId),
      phone_condition: phoneCondition,
      price: Number(price),
      low_stock_level: Number(lowStockLevel) || 0,
      stock_quantity: Number(lowStockLevel) || 0,
      availability,
      status,
      warranty: warranty.trim(),
      description: description.trim(),
      installment_enabled: installmentEnabled,
      colour_options: colourOptions
        ? colourOptions.split(',').map((c) => c.trim()).filter(Boolean)
        : [],
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

      {/* Slide-over Right Panel (Opens smoothly from right side) */}
      <div className="fixed top-0 right-0 bottom-0 z-50 w-full sm:w-[410px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col transform transition-transform duration-200 ease-out animate-in slide-in-from-right">
        {/* Panel Header (Fixed at top) */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#2563EB] flex items-center justify-center shrink-0">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight">
                {initial ? 'Edit Phone' : 'Create Phone'}
              </h2>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                {initial ? 'Update phone specifications' : 'Add a new phone to your inventory'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error Notification */}
        {submitError && (
          <div className="mx-5 mt-3 p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-300 rounded-lg flex items-center gap-2 text-xs shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        {/* Form Container with pinned footer */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          {/* Scrollable Form Body (Compact layout so fields fit normally) */}
          <div className="flex-1 overflow-y-auto px-5 py-3.5 space-y-3 [scrollbar-width:thin] scrollbar-thin">
            {/* 1. Phone Model * */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Phone Model <span className="text-red-500">*</span>
              </label>
              <div className="relative flex items-center">
                <Smartphone className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Select or enter model"
                  required
                  className="w-full pl-8 pr-8 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB] transition-colors"
                />
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 pointer-events-none" />
              </div>
            </div>

            {/* 2. Brand * */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Brand <span className="text-red-500">*</span>
              </label>
              <div className="relative flex items-center">
                <Shield className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
                <select
                  value={brandId}
                  onChange={(e) => setBrandId(e.target.value)}
                  required
                  className="w-full pl-8 pr-8 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-200 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB] cursor-pointer transition-colors"
                >
                  <option value="" disabled>Select brand</option>
                  {brands.map((b) => (
                    <option key={b.brand_id} value={b.brand_id}>
                      {b.brand_name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 pointer-events-none" />
              </div>
            </div>

            {/* 3. Condition * */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Condition <span className="text-red-500">*</span>
              </label>
              <div className="relative flex items-center">
                <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
                <select
                  value={phoneCondition}
                  onChange={(e) => setPhoneCondition(e.target.value)}
                  required
                  className="w-full pl-8 pr-8 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-200 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB] cursor-pointer transition-colors"
                >
                  <option value="NEW">New (Brand New Sealed)</option>
                  <option value="USED">Used (Pre-Owned / Korea Import)</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 pointer-events-none" />
              </div>
            </div>

            {/* 4. Price * */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Price <span className="text-red-500">*</span>
              </label>
              <div className="relative flex items-center">
                <span className="text-xs text-slate-400 font-semibold absolute left-3 pointer-events-none">
                  $
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  required
                  className="w-full pl-7 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB] transition-colors"
                />
              </div>
            </div>

            {/* 5. Low Stock Level */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Low Stock Level
              </label>
              <div className="relative flex items-center">
                <Layers className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
                <input
                  type="number"
                  min="0"
                  value={lowStockLevel}
                  onChange={(e) => setLowStockLevel(e.target.value)}
                  placeholder="0"
                  className="w-full pl-8 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB] transition-colors"
                />
              </div>
            </div>

            {/* 6. Status */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Status
              </label>
              <div className="relative flex items-center">
                <div className="w-2 h-2 rounded-full bg-emerald-500 absolute left-3 pointer-events-none" />
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full pl-8 pr-8 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-200 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB] cursor-pointer transition-colors"
                >
                  <option value="PUBLISHED">Published</option>
                  <option value="DRAFT">Draft</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 pointer-events-none" />
              </div>
            </div>

            {/* 7. Description (Optional) */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Description (Optional)
              </label>
              <div className="relative">
                <FileText className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter additional details..."
                  rows={2}
                  className="w-full pl-8 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB] resize-none transition-colors min-h-[64px]"
                />
              </div>
            </div>

            {/* Toggle for Advanced Details (Warranty, Colors, Installments) */}
            <div className="pt-0.5">
              <button
                type="button"
                onClick={() => setShowMoreDetails(!showMoreDetails)}
                className="text-[11px] font-medium text-[#2563EB] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>{showMoreDetails ? '▲ Hide Extra Fields' : '+ Add Warranty, Colors & Installments'}</span>
              </button>
            </div>

            {showMoreDetails && (
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800 animate-fadeIn">
                {/* Warranty */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Warranty
                  </label>
                  <input
                    type="text"
                    value={warranty}
                    onChange={(e) => setWarranty(e.target.value)}
                    placeholder="e.g. 1 Year Official SK Laba Warranty"
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB]"
                  />
                </div>

                {/* Colour Options */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Colour Options (comma separated)
                  </label>
                  <input
                    type="text"
                    value={colourOptions}
                    onChange={(e) => setColourOptions(e.target.value)}
                    placeholder="Natural Titanium, Blue Titanium, Black Titanium"
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB]"
                  />
                </div>

                {/* Installment Toggle */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                    Enable Installment Plans (Koko / MintPay)
                  </span>
                  <input
                    type="checkbox"
                    checked={installmentEnabled}
                    onChange={(e) => setInstallmentEnabled(e.target.checked)}
                    className="w-4 h-4 rounded text-[#2563EB] focus:ring-blue-500 cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Panel Footer (Pinned at Bottom - Always Visible) */}
          <div className="p-4 px-5 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 py-2.5 px-4 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-center cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-1/2 py-2.5 px-4 text-xs font-semibold text-white bg-[#2563EB] hover:bg-blue-700 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span>Saving...</span>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>{initial ? 'Save Changes' : 'Create Phone'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
