import React from 'react';
import { X, Tag, Calendar, Percent, Clock, Smartphone } from 'lucide-react';

export default function OfferDetailModal({
  isOpen,
  onClose,
  offer = null,
  phones = [],
}) {
  if (!isOpen || !offer) return null;

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
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[1px] transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over Right Panel */}
      <div className="fixed top-0 right-0 bottom-0 z-50 w-full sm:w-[480px] md:w-[520px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col transform transition-transform duration-200 ease-out animate-in slide-in-from-right">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Tag className="w-4 h-4 text-[#2563EB]" />
              <span>SKLABA_Offer_{offer.offer_id}: {offer.title}</span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Offer Campaign Details (SRS MG-03)
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {/* Banner Image Preview if present */}
          {offer.banner_image && (
            <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <img
                src={offer.banner_image}
                alt={offer.title}
                className="w-full h-36 object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}

          {/* Pricing Highlight Card */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/30 border border-blue-100 dark:border-blue-900/50">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Regular Price</span>
                <div className="text-sm line-through text-slate-400">
                  ${Number(offer.regular_price || 0).toFixed(2)}
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-[#2563EB] tracking-wider">Deal Price</span>
                <div className="text-xl font-black text-[#2563EB] dark:text-blue-400">
                  ${Number(offer.offer_price || 0).toFixed(2)}
                </div>
              </div>
            </div>

            <div className="mt-2.5 pt-2 border-t border-blue-200/50 dark:border-blue-900/40 flex items-center justify-between text-xs">
              <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                Customer Savings: ${Number(offer.discount_amount || 0).toFixed(2)}
              </span>
              <span className="px-2.5 py-0.5 rounded-full font-bold bg-emerald-600 text-white text-[11px]">
                {offer.discount_percentage}% OFF
              </span>
            </div>
          </div>

          {/* Specifications Table */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900">
            <div className="px-3.5 py-2 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Offer Overview
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              <div className="grid grid-cols-3 px-3.5 py-2.5">
                <span className="text-slate-500 dark:text-slate-400">Offer ID</span>
                <span className="col-span-2 text-slate-900 dark:text-slate-100 font-mono font-medium">
                  SKLABA_Offer_{offer.offer_id}
                </span>
              </div>
              <div className="grid grid-cols-3 px-3.5 py-2.5">
                <span className="text-slate-500 dark:text-slate-400">Campaign Status</span>
                <span className="col-span-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      stage === 'ACTIVE'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200'
                        : stage === 'UPCOMING'
                        ? 'bg-blue-50 text-[#2563EB] dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200'
                        : stage === 'DRAFT'
                        ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border border-slate-200'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        stage === 'ACTIVE'
                          ? 'bg-emerald-500 animate-pulse'
                          : stage === 'UPCOMING'
                          ? 'bg-blue-500'
                          : stage === 'DRAFT'
                          ? 'bg-amber-500'
                          : 'bg-slate-400'
                      }`}
                    />
                    <span>{stage}</span>
                  </span>
                </span>
              </div>
              <div className="grid grid-cols-3 px-3.5 py-2.5">
                <span className="text-slate-500 dark:text-slate-400">Schedule</span>
                <span className="col-span-2 text-slate-800 dark:text-slate-200 leading-relaxed">
                  <div>From: {formatDate(offer.start_date_time)}</div>
                  <div>To: {formatDate(offer.end_date_time)}</div>
                </span>
              </div>
            </div>
          </div>

          {/* Included Phones List */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900">
            <div className="px-3.5 py-2 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>Included Smartphones</span>
              </span>
              <span>{includedPhones.length} devices</span>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {includedPhones.length === 0 ? (
                <div className="p-3 text-slate-400 text-xs">
                  IDs: {JSON.stringify(offer.phone_ids || [])}
                </div>
              ) : (
                includedPhones.map((p) => (
                  <div key={p.phone_id} className="p-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {p.image_url ? (
                        <img
                          src={p.image_url}
                          alt={p.name}
                          className="w-8 h-8 rounded object-contain bg-slate-50 dark:bg-slate-800 border p-0.5"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded bg-blue-50 text-[#2563EB] flex items-center justify-center font-bold text-[10px]">
                          P
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {p.name}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          SKLABA_Phone_{p.phone_id} · {p.brand_name}
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        ${Number(p.price || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Description */}
          {offer.description && (
            <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-3 bg-white dark:bg-slate-900">
              <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Description & Terms
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {offer.description}
              </p>
            </div>
          )}

          {/* Timestamps */}
          <div className="text-[11px] text-slate-400 dark:text-slate-500 pt-1 flex items-center justify-between">
            <span>Created: {formatDate(offer.created_at)}</span>
            <span>Updated: {formatDate(offer.updated_at)}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
}
