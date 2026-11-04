import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Tag,
  AlertCircle,
  Percent,
  Calendar,
  Sparkles,
  Search,
  Check,
  Smartphone,
  CheckCircle2,
} from 'lucide-react';

export default function OfferFormView({
  initial = null,
  onBack,
  onSubmit,
  submitting = false,
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
  }, [initial]);

  const numRegular = parseFloat(regularPrice) || 0;
  const numOffer = parseFloat(offerPrice) || 0;
  const discountAmount = Math.max(0, numRegular - numOffer);
  const discountPercent = numRegular > 0 ? ((discountAmount / numRegular) * 100).toFixed(1) : '0';

  const handlePhoneToggle = (phoneId, phonePrice) => {
    setSelectedPhoneIds((prev) => {
      const exists = prev.includes(phoneId);
      const next = exists ? prev.filter((id) => id !== phoneId) : [...prev, phoneId];

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
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ── Top Breadcrumb Navigation ─────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          type="button"
          className="inline-flex items-center gap-2 text-xs font-normal text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Offers Management</span>
        </button>
      </div>

      {/* ── Page Header ──────────────────────────────────────────────── */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 flex items-center justify-center text-rose-600 dark:text-rose-400">
            <Tag className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-normal text-slate-900 dark:text-white tracking-tight">
              {initial ? 'Edit Offer Campaign' : 'Create Offer Campaign'}
            </h1>
            <p className="text-xs font-normal text-slate-500 dark:text-slate-400 mt-0.5">
              Configure promotional deals, participating smartphones, and campaign schedules
            </p>
          </div>
        </div>
      </div>

      {/* ── Main Form ────────────────────────────────────────────────── */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-xs font-normal text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Offer Information & Phones */}
          <div className="lg:col-span-2 space-y-5">
            {/* 1. General Campaign Details */}
            <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
              <div className="text-xs font-normal text-slate-700 dark:text-slate-300">
                Campaign Information
              </div>

              <div>
                <label className="block text-xs font-normal text-slate-700 dark:text-slate-300 mb-1.5">
                  Offer Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Summer Mega Deal - Samsung Galaxy A54 Discount"
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-normal text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-neutral-500"
                />
              </div>

              <div>
                <label className="block text-xs font-normal text-slate-700 dark:text-slate-300 mb-1.5">
                  Description & Campaign Subtitle
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Describe the promotional campaign highlights or customer benefits..."
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-normal text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-neutral-500"
                />
              </div>

              <div>
                <label className="block text-xs font-normal text-slate-700 dark:text-slate-300 mb-1.5">
                  Banner Image URL (Optional)
                </label>
                <input
                  type="url"
                  value={bannerImage}
                  onChange={(e) => setBannerImage(e.target.value)}
                  placeholder="https://example.com/images/summer-sale-banner.jpg"
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-normal text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-neutral-500"
                />
                {bannerImage && (
                  <div className="mt-3 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 max-h-40 bg-slate-50 dark:bg-slate-800">
                    <img
                      src={bannerImage}
                      alt="Banner Preview"
                      className="w-full h-40 object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* 2. Eligible Phones Selection */}
            <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-normal text-slate-700 dark:text-slate-300">
                    Participating Smartphones <span className="text-rose-500">*</span>
                  </div>
                  <div className="text-[11px] font-normal text-slate-400 mt-0.5">
                    Select phones eligible for this promotional discount ({selectedPhoneIds.length} selected)
                  </div>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                  <input
                    type="text"
                    value={phoneSearch}
                    onChange={(e) => setPhoneSearch(e.target.value)}
                    placeholder="Filter phones..."
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-normal text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
                  />
                </div>
              </div>

              {filteredPhones.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs font-normal">
                  No phones match search filter
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
                  {filteredPhones.map((phone) => {
                    const isSelected = selectedPhoneIds.includes(phone.phone_id);
                    return (
                      <div
                        key={phone.phone_id}
                        onClick={() => handlePhoneToggle(phone.phone_id, phone.price)}
                        className={`p-3 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'border-slate-900 dark:border-rose-800 bg-rose-50/30 dark:bg-rose-950/20 ring-1 ring-rose-600/30'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {phone.image_url ? (
                            <img
                              src={phone.image_url}
                              alt={phone.name}
                              className="w-8 h-8 rounded object-contain bg-slate-50 dark:bg-slate-800 border shrink-0 p-0.5"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center font-normal text-xs shrink-0">
                              {phone.brand_name?.charAt(0) || 'P'}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="text-xs font-normal text-slate-900 dark:text-slate-100 truncate">
                              {phone.name}
                            </div>
                            <div className="text-[11px] font-normal text-slate-400 truncate">
                              ${Number(phone.price || 0).toFixed(2)} · {phone.brand_name || 'Brand'}
                            </div>
                          </div>
                        </div>

                        <div
                          className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                            isSelected
                              ? 'bg-slate-900 text-white border-slate-900 dark:bg-rose-600 dark:border-rose-600'
                              : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[2.5]" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right 1 Col: Pricing, Schedule & Status */}
          <div className="space-y-5">
            {/* 3. Pricing Card (White background, theme accents) */}
            <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
              <div className="text-xs font-normal text-slate-700 dark:text-slate-300">
                Campaign Pricing & Discount
              </div>

              <div>
                <label className="block text-xs font-normal text-slate-700 dark:text-slate-300 mb-1.5">
                  Regular Price ($) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={regularPrice}
                  onChange={(e) => setRegularPrice(e.target.value)}
                  placeholder="e.g. 449.99"
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-normal text-slate-900 dark:text-white focus:outline-none focus:border-neutral-500"
                />
              </div>

              <div>
                <label className="block text-xs font-normal text-slate-700 dark:text-slate-300 mb-1.5">
                  Offer Deal Price ($) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={offerPrice}
                  onChange={(e) => setOfferPrice(e.target.value)}
                  placeholder="e.g. 399.99"
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-normal text-slate-900 dark:text-white focus:outline-none focus:border-neutral-500"
                />
              </div>

              {/* Live Calculation Box */}
              <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between text-xs font-normal">
                  <span className="text-slate-500">Calculated Discount:</span>
                  <span className="text-slate-900 dark:text-white font-normal">
                    {discountPercent}% OFF
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs font-normal">
                  <span className="text-slate-500">Customer Savings:</span>
                  <span className="text-slate-900 dark:text-white font-normal">
                    ${discountAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* 4. Schedule & Status */}
            <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
              <div className="text-xs font-normal text-slate-700 dark:text-slate-300">
                Campaign Schedule
              </div>

              <div>
                <label className="block text-xs font-normal text-slate-700 dark:text-slate-300 mb-1.5">
                  Start Date & Time <span className="text-rose-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={startDateTime}
                  onChange={(e) => setStartDateTime(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-normal text-slate-900 dark:text-white focus:outline-none focus:border-neutral-500 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-normal text-slate-700 dark:text-slate-300 mb-1.5">
                  End Date & Time <span className="text-rose-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={endDateTime}
                  onChange={(e) => setEndDateTime(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-normal text-slate-900 dark:text-white focus:outline-none focus:border-neutral-500 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-normal text-slate-700 dark:text-slate-300 mb-1.5">
                  Publication Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-normal text-slate-900 dark:text-white focus:outline-none focus:border-neutral-500 cursor-pointer"
                >
                  <option value="DRAFT">Draft (Unpublished)</option>
                  <option value="ACTIVE">Active (Live Deal)</option>
                  <option value="PUBLISHED">Published</option>
                </select>
              </div>
            </div>

            {/* Actions Card */}
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 px-4 text-xs font-normal rounded-full bg-gradient-to-r from-black via-neutral-900 to-rose-950 hover:to-rose-900 text-white border border-neutral-800 transition-all cursor-pointer disabled:opacity-50 shadow-xs flex items-center justify-center gap-2"
              >
                <Tag className="w-4 h-4" />
                <span>{submitting ? 'Saving Campaign...' : (initial ? 'Update Offer Campaign' : 'Create Offer Campaign')}</span>
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

