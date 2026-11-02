import React, { useState, useEffect } from 'react';
import { X, Tag, AlertCircle, Percent, Calendar, Sparkles } from 'lucide-react';

export default function OfferModal({
  isOpen,
  onClose,
  onSubmit,
  initial = null,
  loading = false,
  phones = [],
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [bannerImage, setBannerImage] = useState('');
  const [selectedPhoneIds, setSelectedPhoneIds] = useState([]);
  const [regularPrice, setRegularPrice] = useState('');
  const [offerPrice, setOfferPrice] = useState('');
  const [startDateTime, setStartDateTime] = useState('');
  const [endDateTime, setEndDateTime] = useState('');
  const [status, setStatus] = useState('DRAFT');
  const [phoneSearch, setPhoneSearch] = useState('');
  const [error, setError] = useState(null);

  const toDatetimeLocal = (val) => {
    if (!val) return '';
    const d = new Date(val);
    if (isNaN(d.getTime())) return '';
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  useEffect(() => {
    if (initial) {
      setTitle(initial.title || '');
      setDescription(initial.description || '');
      setBannerImage(initial.banner_image || '');
      setSelectedPhoneIds(Array.isArray(initial.phone_ids) ? initial.phone_ids : []);
      setRegularPrice(initial.regular_price !== undefined ? String(initial.regular_price) : '');
      setOfferPrice(initial.offer_price !== undefined ? String(initial.offer_price) : '');
      setStartDateTime(toDatetimeLocal(initial.start_date_time));
      setEndDateTime(toDatetimeLocal(initial.end_date_time));
      setStatus(initial.status || 'DRAFT');
    } else {
      const now = new Date();
      const inOneWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      setTitle('');
      setDescription('');
      setBannerImage('');
      setSelectedPhoneIds([]);
      setRegularPrice('');
      setOfferPrice('');
      setStartDateTime(toDatetimeLocal(now));
      setEndDateTime(toDatetimeLocal(inOneWeek));
      setStatus('DRAFT');
    }
    setPhoneSearch('');
    setError(null);
  }, [initial, isOpen]);

  if (!isOpen) return null;

  const numRegular = parseFloat(regularPrice) || 0;
  const numOffer = parseFloat(offerPrice) || 0;
  const discountAmount = Math.max(0, numRegular - numOffer);
  const discountPercent = numRegular > 0 ? ((discountAmount / numRegular) * 100).toFixed(1) : '0';

  const handlePhoneToggle = (phoneId, phonePrice) => {
    setSelectedPhoneIds((prev) => {
      const exists = prev.includes(phoneId);
      const next = exists ? prev.filter((id) => id !== phoneId) : [...prev, phoneId];

      // Auto-populate regular price if not set yet and phone has price
      if (!exists && (!regularPrice || Number(regularPrice) === 0) && phonePrice) {
        setRegularPrice(String(phonePrice));
      }
      return next;
    });
  };

  const filteredPhones = phones.filter((p) => {
    if (!phoneSearch.trim()) return true;
    const q = phoneSearch.toLowerCase();
    return (
      p.name?.toLowerCase().includes(q) ||
      p.brand_name?.toLowerCase().includes(q) ||
      String(p.phone_id).includes(q)
    );
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Offer title is required.');
      return;
    }

    if (selectedPhoneIds.length === 0) {
      setError('Please select at least one phone to include in this offer (SRS MG-03).');
      return;
    }

    if (isNaN(numRegular) || numRegular <= 0) {
      setError('Regular price must be greater than $0.');
      return;
    }

    if (isNaN(numOffer) || numOffer < 0) {
      setError('Offer price must be a valid non-negative number.');
      return;
    }

    if (numOffer >= numRegular) {
      setError('Offer price must be less than regular price to represent a discount.');
      return;
    }

    if (!startDateTime) {
      setError('Start date and time is required.');
      return;
    }

    if (!endDateTime) {
      setError('End date and time is required.');
      return;
    }

    const startObj = new Date(startDateTime);
    const endObj = new Date(endDateTime);

    if (endObj <= startObj) {
      setError('End date and time must be later than start date and time.');
      return;
    }

    const payload = {
      title: title.trim(),
      description: description.trim() || undefined,
      banner_image: bannerImage.trim() || undefined,
      phone_ids: selectedPhoneIds.map((id) => Number(id)),
      regular_price: numRegular,
      offer_price: numOffer,
      start_date_time: startObj.toISOString(),
      end_date_time: endObj.toISOString(),
      status: status || 'DRAFT',
    };

    const res = await onSubmit(payload);
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
      <div className="fixed top-0 right-0 bottom-0 z-50 w-full sm:w-[480px] md:w-[500px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col transform transition-transform duration-200 ease-out animate-in slide-in-from-right">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Tag className="w-4 h-4 text-[#2563EB]" />
              <span>{initial ? 'Edit Offer Campaign' : 'Create Offer Campaign'}</span>
            </h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              {initial ? `Update SKLABA_Offer_${initial.offer_id}` : 'Configure special deal and discount period (SRS MG-03)'}
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
            {/* 1. Title */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Offer Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Flash Deal: Galaxy S24 Ultra & iPhone 15 Pro"
                maxLength={200}
                required
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB]"
              />
            </div>

            {/* 2. Select Phones Included */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Included Phones <span className="text-red-500">*</span> ({selectedPhoneIds.length} selected)
                </label>
                {selectedPhoneIds.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedPhoneIds([])}
                    className="text-[10px] text-slate-400 hover:text-red-500"
                  >
                    Clear selection
                  </button>
                )}
              </div>

              {/* Phone filter search box */}
              <input
                type="text"
                value={phoneSearch}
                onChange={(e) => setPhoneSearch(e.target.value)}
                placeholder="Search phone catalogue..."
                className="w-full px-3 py-1.5 mb-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB]"
              />

              {/* Phone checklist */}
              <div className="max-h-36 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg p-1 divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                {filteredPhones.length === 0 ? (
                  <div className="py-4 text-center text-xs text-slate-400">No phones match search</div>
                ) : (
                  filteredPhones.map((p) => {
                    const isChecked = selectedPhoneIds.includes(p.phone_id);
                    return (
                      <label
                        key={p.phone_id}
                        className={`flex items-center justify-between p-2 rounded-md text-xs cursor-pointer transition-colors ${
                          isChecked
                            ? 'bg-blue-50/70 dark:bg-blue-950/40 text-[#2563EB]'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handlePhoneToggle(p.phone_id, p.price)}
                            className="w-3.5 h-3.5 rounded text-[#2563EB] focus:ring-blue-500 cursor-pointer"
                          />
                          <span className="font-mono text-[10px] text-slate-400 shrink-0">
                            SKLABA_Phone_{p.phone_id}
                          </span>
                          <span className="truncate font-medium">{p.name}</span>
                        </div>
                        <span className="font-semibold text-slate-900 dark:text-white shrink-0">
                          ${Number(p.price || 0).toFixed(2)}
                        </span>
                      </label>
                    );
                  })
                )}
              </div>
            </div>

            {/* 3. Pricing: Regular vs Offer Price */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Regular Price ($) <span className="text-red-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-slate-400 text-xs pointer-events-none">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={regularPrice}
                    onChange={(e) => setRegularPrice(e.target.value)}
                    placeholder="1299.99"
                    required
                    className="w-full pl-7 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Special Offer Price ($) <span className="text-red-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-slate-400 text-xs pointer-events-none">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={offerPrice}
                    onChange={(e) => setOfferPrice(e.target.value)}
                    placeholder="1099.99"
                    required
                    className="w-full pl-7 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB]"
                  />
                </div>
              </div>
            </div>

            {/* Live Discount Calculator Card */}
            {numRegular > 0 && numOffer > 0 && numOffer < numRegular && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 flex items-center justify-between animate-in fade-in duration-150">
                <div className="flex items-center gap-2">
                  <Percent className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                    Customer Savings: <strong>${discountAmount.toFixed(2)}</strong>
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-600 text-white">
                  {discountPercent}% OFF
                </span>
              </div>
            )}

            {/* 4. Campaign Period: Start & End DateTime */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Start Date & Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={startDateTime}
                  onChange={(e) => setStartDateTime(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  End Date & Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={endDateTime}
                  onChange={(e) => setEndDateTime(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB]"
                />
              </div>
            </div>

            {/* 5. Campaign Status: Save as Draft or Publish */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Campaign Status (SRS MG-03)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setStatus('PUBLISHED')}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-colors cursor-pointer text-center ${
                    status === 'PUBLISHED'
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-[#2563EB] border-[#2563EB]'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Publish Campaign
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('DRAFT')}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-colors cursor-pointer text-center ${
                    status === 'DRAFT'
                      ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 border-amber-500'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Save as Draft
                </button>
              </div>
            </div>

            {/* 6. Description */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Description / Promo Copy
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Highlight discount conditions, warranty inclusions, or bonus gifts..."
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB]"
              />
            </div>

            {/* 7. Banner Image URL */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Banner Image URL (Optional)
              </label>
              <input
                type="text"
                value={bannerImage}
                onChange={(e) => setBannerImage(e.target.value)}
                placeholder="https://... or /banners/offer.jpg"
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB]"
              />
            </div>
          </div>

          {/* Panel Footer */}
          <div className="p-4 px-5 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="w-1/2 py-2.5 px-4 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-center cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim() || selectedPhoneIds.length === 0}
              className="w-1/2 py-2.5 px-4 text-xs font-semibold text-white bg-[#2563EB] hover:bg-blue-700 rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50 text-center"
            >
              {loading ? 'Saving...' : initial ? 'Save Changes' : status === 'DRAFT' ? 'Save Draft' : 'Launch Offer'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
