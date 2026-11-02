import React from 'react';
import useOffers from '../hooks/useOffers';
import OfferModal from '../components/Modals/OfferModal';
import OfferDetailModal from '../components/Modals/OfferDetailModal';
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

  return (
    <div className="space-y-5 pb-12">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-2.5 bg-slate-900 text-white text-xs font-semibold rounded-xl shadow-xl animate-in slide-in-from-top-2">
          {toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* ── 1. Page Header ─────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Offers Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure promotional campaigns, special discounts, and time-limited deals (SRS MG-03)
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRefresh}
            className="p-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 rounded-lg transition-colors cursor-pointer"
            title="Refresh offers"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#2563EB]' : ''}`} />
          </button>

          <button
            onClick={() => setIsAddOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Offer</span>
          </button>
        </div>
      </div>

      {/* ── 2. KPI Summary Cards ───────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Active Campaigns */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Active Deals
            </div>
            <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {metrics.activeCount} <span className="text-xs font-normal text-slate-400">running</span>
            </div>
          </div>
        </div>

        {/* Upcoming Campaigns */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#2563EB] dark:text-blue-400 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Upcoming
            </div>
            <div className="text-lg font-bold text-[#2563EB] dark:text-blue-400 mt-0.5">
              {metrics.upcomingCount} <span className="text-xs font-normal text-slate-400">scheduled</span>
            </div>
          </div>
        </div>

        {/* Ended Campaigns */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Ended Deals
            </div>
            <div className="text-lg font-bold text-slate-700 dark:text-slate-300 mt-0.5">
              {metrics.endedCount} <span className="text-xs font-normal text-slate-400">past</span>
            </div>
          </div>
        </div>

        {/* Draft Campaigns */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Tag className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Drafts
            </div>
            <div className="text-lg font-bold text-amber-600 dark:text-amber-400 mt-0.5">
              {metrics.draftCount} <span className="text-xs font-normal text-slate-400">in draft</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Search & Filter Bar ─────────────────────────────────── */}
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
              className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB] transition-colors"
            />
          </div>

          {/* Stage filter dropdown (SRS MG-03: Upcoming, Active, Ended, Draft) */}
          <div className="relative min-w-[160px]">
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="w-full pl-3 pr-8 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-200 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB] cursor-pointer transition-colors"
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

      {/* ── 4. Offers Table ────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
        {loading && offers.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center gap-2 text-slate-400">
            <RefreshCw className="w-5 h-5 animate-spin text-[#2563EB]" />
            <span className="text-xs font-semibold">Loading offer campaigns...</span>
          </div>
        ) : offers.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Tag className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
            <p className="font-semibold text-xs text-slate-700 dark:text-slate-300">No offer campaigns found</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Click "+ Create Offer" to launch your first promotional deal</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                  <th className="px-4 py-3 font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px] w-36">
                    ID
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">
                    Campaign Offer
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">
                    Phones Included
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">
                    Regular Price
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">
                    Offer Price
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">
                    Discount
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">
                    Campaign Period
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">
                    Stage / Status
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px] text-right">
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
                      <td className="px-4 py-3 font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">
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
                            <div className="w-8 h-8 rounded bg-blue-50 text-[#2563EB] flex items-center justify-center font-bold shrink-0">
                              <Tag className="w-3.5 h-3.5" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-900 dark:text-slate-100 leading-tight truncate max-w-xs">
                              {offer.title}
                            </div>
                            {offer.description && (
                              <div className="text-[11px] text-slate-400 truncate max-w-xs mt-0.5">
                                {offer.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Included Phones */}
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md text-[11px]">
                          <Smartphone className="w-3 h-3 text-slate-500" />
                          <span>{phoneCount} {phoneCount === 1 ? 'phone' : 'phones'}</span>
                        </span>
                      </td>

                      {/* Regular Price */}
                      <td className="px-4 py-3 text-slate-400 line-through">
                        ${Number(offer.regular_price || 0).toFixed(2)}
                      </td>

                      {/* Deal Price */}
                      <td className="px-4 py-3 font-bold text-slate-900 dark:text-slate-100 text-xs">
                        ${Number(offer.offer_price || 0).toFixed(2)}
                      </td>

                      {/* Discount % */}
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          <Percent className="w-2.5 h-2.5" />
                          <span>{offer.discount_percentage}% OFF</span>
                        </span>
                      </td>

                      {/* Campaign Period */}
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300 text-[11px]">
                        <div>{formatDate(offer.start_date_time)}</div>
                        <div className="text-slate-400 text-[10px]">until {formatDate(offer.end_date_time)}</div>
                      </td>

                      {/* Stage / Status */}
                      <td className="px-4 py-3">
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
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View details */}
                          <button
                            onClick={() => setDetailOffer(offer)}
                            className="p-1.5 border border-slate-100 dark:border-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            title="View offer details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => setEditingOffer(offer)}
                            className="p-1.5 border border-slate-100 dark:border-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            title="Edit offer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => setDeletingOffer(offer)}
                            className="p-1.5 border border-red-100 dark:border-red-950/60 text-red-500 bg-red-50 dark:bg-red-950/40 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors cursor-pointer"
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

      {/* ── MODALS: CREATE & EDIT ──────────────────────────────────── */}
      <OfferModal
        isOpen={isAddOpen || Boolean(editingOffer)}
        onClose={() => {
          setIsAddOpen(false);
          setEditingOffer(null);
        }}
        onSubmit={
          editingOffer
            ? (data) => handleUpdateOffer(editingOffer.offer_id, data)
            : handleCreateOffer
        }
        initial={editingOffer}
        loading={submitting}
        phones={phones}
      />

      {/* ── MODAL: VIEW DETAILS ────────────────────────────────────── */}
      <OfferDetailModal
        isOpen={Boolean(detailOffer)}
        onClose={() => setDetailOffer(null)}
        offer={detailOffer}
        phones={phones}
      />

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
