import React from 'react';
import {
  ArrowLeft,
  Tag,
  Calendar,
  Percent,
  Clock,
  Smartphone,
  Edit2,
  CheckCircle2,
} from 'lucide-react';

export default function OfferDetailView({
  offer,
  onBack,
  onEdit,
  phones = [],
}) {
  if (!offer) return null;

  const formatDate = (val) => {
    if (!val) return '—';
    try {
      const d = new Date(val);
      if (isNaN(d.getTime())) return String(val);
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return String(val);
    }
  };

  const stage = offer.stage || (offer.status === 'DRAFT' ? 'DRAFT' : 'ACTIVE');

  // Match phone IDs to phones list
  const includedPhones = phones.filter((p) => {
    const ids = Array.isArray(offer.phone_ids) ? offer.phone_ids : [];
    return ids.includes(p.phone_id) || ids.includes(String(p.phone_id));
  });

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
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 flex items-center justify-center text-rose-600 dark:text-rose-400">
            <Tag className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-normal text-slate-900 dark:text-white tracking-tight">
              {offer.title}
            </h1>
            <p className="text-xs font-normal text-slate-500 dark:text-slate-400 mt-0.5">
              SKLABA_Offer_{offer.offer_id} · Campaign Overview & Discount Details
            </p>
          </div>
        </div>

        <button
          onClick={() => onEdit(offer)}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-normal rounded-full bg-gradient-to-r from-black via-neutral-900 to-rose-950 hover:to-rose-900 text-white border border-neutral-800 transition-all cursor-pointer shadow-xs"
        >
          <Edit2 className="w-3.5 h-3.5" />
          <span>Edit This Offer</span>
        </button>
      </div>

      {/* ── Banner Image if available ─────────────────────────────────── */}
      {offer.banner_image && (
        <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 max-h-60">
          <img
            src={offer.banner_image}
            alt={offer.title}
            className="w-full h-60 object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      )}

      {/* ── Pricing & Summary Cards ──────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Deal Price Card */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="text-[11px] font-normal text-slate-400 uppercase tracking-wider">
            Deal Price
          </div>
          <div className="text-lg font-normal text-slate-900 dark:text-white mt-1">
            ${Number(offer.offer_price || 0).toFixed(2)}
          </div>
          <div className="text-[11px] font-normal text-slate-400 mt-0.5 line-through">
            Regular: ${Number(offer.regular_price || 0).toFixed(2)}
          </div>
        </div>

        {/* Discount Card (Normal text in black, no green bg) */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="text-[11px] font-normal text-slate-400 uppercase tracking-wider">
            Discount
          </div>
          <div className="text-lg font-normal text-slate-900 dark:text-white mt-1">
            {offer.discount_percentage}% OFF
          </div>
          <div className="text-[11px] font-normal text-slate-500 mt-0.5">
            Customer Saves ${Number(offer.discount_amount || (offer.regular_price - offer.offer_price) || 0).toFixed(2)}
          </div>
        </div>

        {/* Campaign Stage (Normal text in black, no green bg) */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="text-[11px] font-normal text-slate-400 uppercase tracking-wider">
            Campaign Stage
          </div>
          <div className="text-lg font-normal text-slate-900 dark:text-white mt-1">
            {stage}
          </div>
          <div className="text-[11px] font-normal text-slate-500 mt-0.5">
            Status: {offer.status || 'DRAFT'}
          </div>
        </div>

        {/* Eligible Phones Count */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="text-[11px] font-normal text-slate-400 uppercase tracking-wider">
            Phones Included
          </div>
          <div className="text-lg font-normal text-slate-900 dark:text-white mt-1">
            {Array.isArray(offer.phone_ids) ? offer.phone_ids.length : 0} devices
          </div>
          <div className="text-[11px] font-normal text-slate-500 mt-0.5">
            Eligible for discount
          </div>
        </div>
      </div>

      {/* ── Campaign Schedule & Description ──────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          {/* Included Smartphones */}
          <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-xs font-normal text-slate-700 dark:text-slate-300">
                Eligible Smartphones
              </div>
              <span className="text-[11px] font-normal text-slate-400">
                {includedPhones.length} devices configured
              </span>
            </div>

            {includedPhones.length === 0 ? (
              <div className="py-6 text-center text-slate-400 text-xs font-normal">
                No individual phone details available
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {includedPhones.map((phone) => (
                  <div
                    key={phone.phone_id}
                    className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center gap-3"
                  >
                    {phone.image_url ? (
                      <img
                        src={phone.image_url}
                        alt={phone.name}
                        className="w-10 h-10 rounded object-contain bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-0.5 shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center font-normal text-xs shrink-0">
                        {phone.brand_name?.charAt(0) || 'P'}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-normal text-slate-900 dark:text-slate-100 truncate">
                        {phone.name}
                      </div>
                      <div className="text-[11px] font-normal text-slate-400 mt-0.5">
                        SKLABA_Phone_{phone.phone_id} · Regular: ${Number(phone.price || 0).toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Description */}
          {offer.description && (
            <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
              <div className="text-xs font-normal text-slate-700 dark:text-slate-300">
                Campaign Description & Promotional Copy
              </div>
              <p className="text-xs font-normal text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {offer.description}
              </p>
            </div>
          )}
        </div>

        {/* Schedule & Metadata */}
        <div className="space-y-4">
          <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
            <div className="text-xs font-normal text-slate-700 dark:text-slate-300">
              Schedule & Metadata
            </div>

            <div className="space-y-3 text-xs font-normal">
              <div>
                <span className="text-slate-400 block text-[11px]">Campaign Starts</span>
                <span className="text-slate-800 dark:text-slate-200">
                  {formatDate(offer.start_date_time)}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">Campaign Ends</span>
                <span className="text-slate-800 dark:text-slate-200">
                  {formatDate(offer.end_date_time)}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 block text-[11px]">Offer Identifier</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">
                  SKLABA_Offer_{offer.offer_id}
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2.5">
            <button
              onClick={() => onEdit(offer)}
              className="w-full py-2.5 px-4 text-xs font-normal rounded-full bg-gradient-to-r from-black via-neutral-900 to-rose-950 hover:to-rose-900 text-white border border-neutral-800 transition-all cursor-pointer shadow-xs flex items-center justify-center gap-2"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Offer Campaign</span>
            </button>

            <button
              onClick={onBack}
              className="w-full py-2 px-4 text-xs font-normal rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer text-center"
            >
              Back to Offers
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

