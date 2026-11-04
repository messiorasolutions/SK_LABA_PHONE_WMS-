import React from 'react';
import useOffers from '../hooks/useOffers';
import OfferFormView from '../components/Offers/OfferFormView';
import OfferDetailView from '../components/Offers/OfferDetailView';
import ConfirmDeleteModal from '../components/Modals/ConfirmDeleteModal';

import {
  Tag,
  Plus,
  Search,
  RefreshCw,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  Percent,
  Calendar,
  Clock,
  Smartphone,
  Sparkles,
} from 'lucide-react';

function formatDate(val) {
  if (!val) return '—';
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return String(val);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return String(val);
  }
}

export default function OffersPage() {
  const {
    offers,
    phones,
    loading,
    submitting,
    metrics,
    searchTerm,
    setSearchTerm,
    stageFilter,
    setStageFilter,
    isAddOpen,
    setIsAddOpen,
    editingOffer,
    setEditingOffer,
    detailOffer,
    setDetailOffer,
    deletingOffer,
    setDeletingOffer,
    toast,
    handleRefresh,
    handleCreateOffer,
    handleUpdateOffer,
    handleDeleteOffer,
  } = useOffers();

  // ── 1. Full Page View: Create New Offer ─────────────────────────────
  if (isAddOpen) {
    return (
      <div className="pb-12">
        {toast && (
          <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-2.5 bg-slate-900 text-white text-xs font-normal rounded-full shadow-xl animate-in slide-in-from-top-2 border border-neutral-800">
            {toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        )}
        <OfferFormView
          onBack={() => setIsAddOpen(false)}
          onSubmit={async (data) => {
            const res = await handleCreateOffer(data);
            if (res?.success) {
              setIsAddOpen(false);
            }
            return res;
          }}
          submitting={submitting}
          phones={phones}
        />
      </div>
    );
  }

  // ── 2. Full Page View: Edit Existing Offer ──────────────────────────
  if (editingOffer) {
    return (
      <div className="pb-12">
        {toast && (
          <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-2.5 bg-slate-900 text-white text-xs font-normal rounded-full shadow-xl animate-in slide-in-from-top-2 border border-neutral-800">
            {toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        )}
        <OfferFormView
          initial={editingOffer}
          onBack={() => setEditingOffer(null)}
          onSubmit={async (data) => {
            const res = await handleUpdateOffer(editingOffer.offer_id, data);
            if (res?.success) {
              setEditingOffer(null);
            }
            return res;
          }}
          submitting={submitting}
          phones={phones}
        />
      </div>
    );
  }

  // ── 3. Full Page View: Offer Details ────────────────────────────────
  if (detailOffer) {
    return (
      <div className="pb-12">
        <OfferDetailView
          offer={detailOffer}
          onBack={() => setDetailOffer(null)}
          onEdit={(o) => {
            setDetailOffer(null);
            setEditingOffer(o);
          }}
          phones={phones}
        />
      </div>
    );
  }

  // ── 4. Main Offers Management Table View ────────────────────────────
  return (
    <div className="space-y-5 pb-12">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-2.5 bg-slate-900 text-white text-xs font-normal rounded-full shadow-xl animate-in slide-in-from-top-2 border border-neutral-800">
          {toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* ── Page Header ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div>
          <h1 className="text-xl font-normal text-slate-900 dark:text-white tracking-tight">
            Offers Management
          </h1>
          <p className="text-xs font-normal text-slate-500 dark:text-slate-400 mt-0.5">
            Configure promotional campaigns, special discounts, and time-limited deals (SRS MG-03)
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRefresh}
            className="p-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 rounded-full transition-colors cursor-pointer"
            title="Refresh offers"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-rose-600' : ''}`} />
          </button>

          <button
            onClick={() => setIsAddOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-black via-neutral-900 to-rose-950 hover:to-rose-900 text-white text-xs font-normal rounded-full shadow-sm border border-neutral-800 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Offer</span>
          </button>
        </div>
      </div>

      {/* ── KPI Summary Cards (Clean Theme & Normal Font) ───────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Active Campaigns */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-normal text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Active Deals
            </div>
            <div className="text-lg font-normal text-slate-900 dark:text-white mt-0.5">
              {metrics.activeCount} <span className="text-xs font-normal text-slate-400">running</span>
            </div>
          </div>
        </div>

        {/* Upcoming Campaigns */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-normal text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Upcoming
            </div>
            <div className="text-lg font-normal text-slate-900 dark:text-white mt-0.5">
              {metrics.upcomingCount} <span className="text-xs font-normal text-slate-400">scheduled</span>
            </div>
          </div>
        </div>

        {/* Ended Campaigns */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-normal text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Ended Deals
            </div>
            <div className="text-lg font-normal text-slate-700 dark:text-slate-300 mt-0.5">
              {metrics.endedCount} <span className="text-xs font-normal text-slate-400">past</span>
            </div>
          </div>
        </div>

        {/* Draft Campaigns */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40 flex items-center justify-center shrink-0">
            <Tag className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-normal text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Drafts
            </div>
            <div className="text-lg font-normal text-rose-600 dark:text-rose-400 mt-0.5">
              {metrics.draftCount} <span className="text-xs font-normal text-slate-400">in draft</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Search & Filter Bar ─────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Search box */}
          <div className="relative w-full sm:w-80">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search offer title, description..."
              className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-normal text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-rose-500/30 focus:border-neutral-500 transition-colors"
            />
          </div>

          {/* Stage filter dropdown (SRS MG-03: Upcoming, Active, Ended, Draft) */}
          <div className="relative min-w-[160px]">
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="w-full pl-3 pr-8 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-normal text-slate-700 dark:text-slate-200 appearance-none focus:outline-none focus:ring-1 focus:ring-rose-500/30 focus:border-neutral-500 cursor-pointer transition-colors"
            >
              <option value="">All Campaign Stages</option>
              <option value="ACTIVE">Active Deals (Running)</option>
              <option value="UPCOMING">Upcoming Deals</option>
              <option value="ENDED">Ended Deals</option>
              <option value="DRAFT">Drafts (Unpublished)</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* ── Offers Table ───────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
        {loading && offers.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center gap-2 text-slate-400">
            <RefreshCw className="w-5 h-5 animate-spin text-rose-600" />
            <span className="text-xs font-normal">Loading offer campaigns...</span>
          </div>
        ) : offers.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Tag className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
            <p className="font-normal text-xs text-slate-700 dark:text-slate-300">No offer campaigns found</p>
            <p className="text-[11px] font-normal text-slate-400 mt-0.5">Click "+ Create Offer" to launch your first promotional deal</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                  <th className="px-4 py-3 font-normal text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px] w-36">
                    ID
                  </th>
                  <th className="px-4 py-3 font-normal text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">
                    Campaign Offer
                  </th>
                  <th className="px-4 py-3 font-normal text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">
                    Phones Included
                  </th>
                  <th className="px-4 py-3 font-normal text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">
                    Regular Price
                  </th>
                  <th className="px-4 py-3 font-normal text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">
                    Offer Price
                  </th>
                  <th className="px-4 py-3 font-normal text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">
                    Discount
                  </th>
                  <th className="px-4 py-3 font-normal text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">
                    Campaign Period
                  </th>
                  <th className="px-4 py-3 font-normal text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">
                    Stage / Status
                  </th>
                  <th className="px-4 py-3 font-normal text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px] text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {offers.map((offer) => {
                  const stage = offer.stage || (offer.status === 'DRAFT' ? 'DRAFT' : 'ACTIVE');
                  const phoneCount = Array.isArray(offer.phone_ids) ? offer.phone_ids.length : 0;

                  return (
                    <tr
                      key={offer.offer_id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* ID */}
                      <td className="px-4 py-3 font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap font-normal">
                        SKLABA_Offer_{offer.offer_id}
                      </td>

                      {/* Campaign Offer */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          {offer.banner_image ? (
                            <img
                              src={offer.banner_image}
                              alt={offer.title}
                              className="w-10 h-8 rounded object-cover bg-slate-50 dark:bg-slate-800 border shrink-0"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-normal shrink-0">
                              <Tag className="w-3.5 h-3.5" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="font-normal text-slate-900 dark:text-slate-100 leading-tight truncate max-w-xs">
                              {offer.title}
                            </div>
                            {offer.description && (
                              <div className="text-[11px] font-normal text-slate-400 truncate max-w-xs mt-0.5">
                                {offer.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Included Phones */}
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 font-normal text-slate-700 dark:text-slate-300 text-[11px]">
                          <Smartphone className="w-3 h-3 text-slate-400" />
                          <span>{phoneCount} {phoneCount === 1 ? 'phone' : 'phones'}</span>
                        </span>
                      </td>

                      {/* Regular Price */}
                      <td className="px-4 py-3 text-slate-400 line-through font-normal">
                        ${Number(offer.regular_price || 0).toFixed(2)}
                      </td>

                      {/* Deal Price */}
                      <td className="px-4 py-3 font-normal text-slate-900 dark:text-slate-100 text-xs">
                        ${Number(offer.offer_price || 0).toFixed(2)}
                      </td>

                      {/* Discount % (Simple text in black, no green bg) */}
                      <td className="px-4 py-3 font-normal text-slate-900 dark:text-slate-100">
                        {offer.discount_percentage}% OFF
                      </td>

                      {/* Campaign Period */}
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300 text-[11px] font-normal">
                        <div>{formatDate(offer.start_date_time)}</div>
                        <div className="text-slate-400 text-[10px]">until {formatDate(offer.end_date_time)}</div>
                      </td>

                      {/* Stage / Status (Simple text in black, no green bg) */}
                      <td className="px-4 py-3 font-normal text-slate-900 dark:text-slate-100">
                        {stage}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View details */}
                          <button
                            onClick={() => setDetailOffer(offer)}
                            className="p-1.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
                            title="View offer details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => setEditingOffer(offer)}
                            className="p-1.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
                            title="Edit offer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => setDeletingOffer(offer)}
                            className="p-1.5 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-full transition-colors cursor-pointer"
                            title="Delete offer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── MODAL: DELETE CONFIRMATION ─────────────────────────────── */}
      <ConfirmDeleteModal
        isOpen={Boolean(deletingOffer)}
        onClose={() => setDeletingOffer(null)}
        onConfirm={() => handleDeleteOffer(deletingOffer?.offer_id)}
        title="Delete Offer Campaign"
        subtitle="Remove promotional deal"
        message={`Delete offer campaign "${deletingOffer?.title}"? Customer storefront will no longer show this offer price.`}
        confirmText="Delete Offer"
        loading={submitting}
      />
    </div>
  );
}
