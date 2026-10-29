import React, { useState, useEffect } from 'react';
import { COLORS } from '../../constants/colors';
import { TYPOGRAPHY } from '../../constants/typography';
import Button from '../ui/Button';
import { X, Smartphone, AlertCircle } from 'lucide-react';

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
  const [stockQuantity, setStockQuantity] = useState('');
  const [availability, setAvailability] = useState('IN_STOCK');
  const [status, setStatus] = useState('DRAFT');
  const [warranty, setWarranty] = useState('');
  const [description, setDescription] = useState('');
  const [colourOptions, setColourOptions] = useState('');
  const [installmentEnabled, setInstallmentEnabled] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (initial) {
      setName(initial.name || '');
      setBrandId(initial.brand_id || '');
      setPhoneCondition(initial.phone_condition || 'NEW');
      setPrice(initial.price || '');
      setStockQuantity(initial.stock_quantity ?? '');
      setAvailability(initial.availability || 'IN_STOCK');
      setStatus(initial.status || 'DRAFT');
      setWarranty(initial.warranty || '');
      setDescription(initial.description || '');
      setColourOptions(
        Array.isArray(initial.colour_options)
          ? initial.colour_options.join(', ')
          : initial.colour_options || ''
      );
      setInstallmentEnabled(Boolean(initial.installment_enabled));
    } else {
      setName('');
      setBrandId(brands[0]?.brand_id || '');
      setPhoneCondition('NEW');
      setPrice('');
      setStockQuantity('');
      setAvailability('IN_STOCK');
      setStatus('PUBLISHED');
      setWarranty('');
      setDescription('');
      setColourOptions('');
      setInstallmentEnabled(false);
    }
    setSubmitError('');
  }, [initial, isOpen, brands]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !brandId || !price) {
      setSubmitError('Phone Name, Brand, and Price are required.');
      return;
    }

    const payload = {
      name: name.trim(),
      brand_id: Number(brandId),
      phone_condition: phoneCondition,
      price: Number(price),
      stock_quantity: Number(stockQuantity) || 0,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="shadow-xl border max-w-2xl w-full max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10">
          <div className="flex items-center gap-2.5">
            <div
              style={{ backgroundColor: COLORS.primaryLight, color: COLORS.primary }}
              className="w-8 h-8 flex items-center justify-center font-bold border border-red-200 dark:border-red-900 dark:bg-red-950/40"
            >
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h3 className={`${TYPOGRAPHY.heading} text-slate-900 dark:text-slate-100`}>
                {initial ? 'Edit Phone Inventory' : 'Add New Smartphone'}
              </h3>
              <p className={`${TYPOGRAPHY.caption} text-slate-500 dark:text-slate-400`}>Inventory & catalogue details</p>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className={`${TYPOGRAPHY.label} block mb-1.5`}>
                Phone Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. iPhone 15 Pro Max, Galaxy S24 Ultra"
                required
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] bg-slate-50 focus:bg-white"
              />
            </div>

            <div>
              <label className={`${TYPOGRAPHY.label} block mb-1.5`}>
                Brand <span className="text-red-500">*</span>
              </label>
              <select
                value={brandId}
                onChange={(e) => setBrandId(e.target.value)}
                required
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] bg-white"
              >
                <option value="">Select Brand...</option>
                {brands.map((b) => (
                  <option key={b.brand_id} value={b.brand_id}>
                    {b.brand_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={`${TYPOGRAPHY.label} block mb-1.5`}>
                Condition <span className="text-red-500">*</span>
              </label>
              <select
                value={phoneCondition}
                onChange={(e) => setPhoneCondition(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] bg-white"
              >
                <option value="NEW">NEW (Brand New Sealed)</option>
                <option value="USED">USED (Pre-Owned / Korea Import)</option>
              </select>
            </div>

            <div>
              <label className={`${TYPOGRAPHY.label} block mb-1.5`}>
                Price (USD) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="1099.99"
                required
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] bg-slate-50 focus:bg-white"
              />
            </div>

            <div>
              <label className={`${TYPOGRAPHY.label} block mb-1.5`}>
                Stock Quantity
              </label>
              <input
                type="number"
                min="0"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value)}
                placeholder="25"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] bg-slate-50 focus:bg-white"
              />
            </div>

            <div>
              <label className={`${TYPOGRAPHY.label} block mb-1.5`}>
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] bg-white"
              >
                <option value="PUBLISHED">PUBLISHED (Active on storefront)</option>
                <option value="DRAFT">DRAFT (Hidden / Warehouse only)</option>
                <option value="ARCHIVED">ARCHIVED (Discontinued)</option>
              </select>
            </div>

            <div>
              <label className={`${TYPOGRAPHY.label} block mb-1.5`}>
                Availability
              </label>
              <select
                value={availability}
                onChange={(e) => setAvailability(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] bg-white"
              >
                <option value="IN_STOCK">IN STOCK</option>
                <option value="LOW_STOCK">LOW STOCK</option>
                <option value="SOLD_OUT">SOLD OUT</option>
                <option value="COMING_SOON">COMING SOON</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className={`${TYPOGRAPHY.label} block mb-1.5`}>
                Warranty
              </label>
              <input
                type="text"
                value={warranty}
                onChange={(e) => setWarranty(e.target.value)}
                placeholder="e.g. 1 Year Official Apple / SK Laba Korea Warranty"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] bg-slate-50 focus:bg-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className={`${TYPOGRAPHY.label} block mb-1.5`}>
                Colour Options (comma separated)
              </label>
              <input
                type="text"
                value={colourOptions}
                onChange={(e) => setColourOptions(e.target.value)}
                placeholder="Natural Titanium, Blue Titanium, Black Titanium"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] bg-slate-50 focus:bg-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className={`${TYPOGRAPHY.label} block mb-1.5`}>
                Description & Specs Highlights
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A17 Pro chip, Titanium design, 48MP main camera..."
                rows={3}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] bg-slate-50 focus:bg-white resize-none"
              />
            </div>

            <div className="sm:col-span-2 flex items-center gap-3">
              <button
                type="button"
                role="switch"
                aria-checked={installmentEnabled}
                onClick={() => setInstallmentEnabled(!installmentEnabled)}
                className={`relative inline-flex h-5 w-10 items-center transition-colors cursor-pointer ${
                  installmentEnabled ? 'bg-[#DC2626]' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform bg-white transition-transform ${
                    installmentEnabled ? 'translate-x-5' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className={`${TYPOGRAPHY.subheading} text-slate-600 dark:text-slate-400`}>
                Installment Enabled:{' '}
                <strong className={installmentEnabled ? 'text-emerald-500' : 'text-slate-500'}>
                  {installmentEnabled ? 'Yes (Koko / MintPay / Bank)' : 'No'}
                </strong>
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" size="sm" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="gradient" size="sm" type="submit" loading={loading}>
              {initial ? 'Save Changes' : 'Create Phone'}
            </Button>
          </div>

        </form>
      </div>
    </div>
  );
}
