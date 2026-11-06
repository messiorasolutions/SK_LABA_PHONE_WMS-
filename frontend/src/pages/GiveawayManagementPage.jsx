import React, { useState, useEffect } from 'react';
import {
  Gift,
  Plus,
  Search,
  Calendar,
  Clock,
  Trophy,
  AlertCircle,
  CheckCircle2,
  Eye,
  Edit2,
  Trash2,
  RefreshCw,
  Sparkles,
  ChevronDown,
  CalendarPlus,
} from 'lucide-react';
import GiveawayService from '../services/giveawayService';
import GiveawayFormView from '../components/Giveaways/GiveawayFormView';
import GiveawayDetailView from '../components/Giveaways/GiveawayDetailView';
import ExtendGiveawayDateView from '../components/Giveaways/ExtendGiveawayDateView';
import ConfirmDeleteModal from '../components/Modals/ConfirmDeleteModal';

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

export default function GiveawayManagementPage() {
  const [giveaways, setGiveaways] = useState([]);
  const [overview, setOverview] = useState({
    total_giveaways: 0,
    ongoing_giveaways: 0,
    completed_giveaways: 0,
    total_winners_announced: 0,
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [toast, setToast] = useState(null);

  // Full Page View States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingGiveaway, setEditingGiveaway] = useState(null);
  const [detailGiveaway, setDetailGiveaway] = useState(null);
  const [extendingGiveaway, setExtendingGiveaway] = useState(null);
  const [deletingGiveaway, setDeletingGiveaway] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchGiveaways = async () => {
    setLoading(true);
    try {
      const [listRes, overviewRes] = await Promise.all([
        GiveawayService.getGiveaways({ status: statusFilter || undefined, search }),
        GiveawayService.getDashboardOverview(),
      ]);
      setGiveaways(listRes.data?.data || []);
      setOverview(overviewRes.data?.data || {
        total_giveaways: 0,
        ongoing_giveaways: 0,
        completed_giveaways: 0,
        total_winners_announced: 0,
      });
    } catch (err) {
      console.error('Failed to load giveaways:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGiveaways();
  }, [statusFilter]);

  const handleCreateGiveaway = async (payload) => {
    setSubmitting(true);
    try {
      await GiveawayService.createGiveaway(payload);
      showToast('Giveaway created successfully!');
      await fetchGiveaways();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || err.message || 'Failed to create giveaway' };
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateGiveaway = async (id, payload) => {
    setSubmitting(true);
    try {
      await GiveawayService.updateGiveaway(id, payload);
      showToast('Giveaway updated successfully!');
      await fetchGiveaways();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || err.message || 'Failed to update giveaway' };
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingGiveaway) return;
    setDeleteLoading(true);
    try {
      await GiveawayService.deleteGiveaway(deletingGiveaway.giveaway_id);
      showToast('Giveaway deleted successfully!');
      setDeletingGiveaway(null);
      await fetchGiveaways();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete giveaway', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleExtendEndDate = async (id, newEndDate) => {
    try {
      const res = await GiveawayService.extendEndDate(id, newEndDate);
      showToast('Giveaway closing date extended successfully!');
      await fetchGiveaways();
      if (detailGiveaway?.giveaway_id === id) {
        setDetailGiveaway(res.data?.data || null);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to extend date', 'error');
    }
  };

  const handleManuallyClose = async (id) => {
    try {
      const res = await GiveawayService.manuallyClose(id);
      showToast('Giveaway closed successfully!');
      await fetchGiveaways();
      if (detailGiveaway?.giveaway_id === id) {
        setDetailGiveaway(res.data?.data || null);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to close giveaway', 'error');
    }
  };

  const handlePublishWinners = async (id, winners) => {
    try {
      const res = await GiveawayService.publishWinners(id, winners);
      showToast(res.data?.message || 'Winners published and emails sent!');
      await fetchGiveaways();
      if (detailGiveaway?.giveaway_id === id) {
        setDetailGiveaway(res.data?.data || null);
      }
      return { success: true, message: res.data?.message };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || err.message || 'Failed to publish winners' };
    }
  };

  // ── 1. Full Page View: Create Giveaway ──────────────────────────────
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
        <GiveawayFormView
          onBack={() => setIsAddOpen(false)}
          onSubmit={async (data) => {
            const res = await handleCreateGiveaway(data);
            if (res?.success) {
              setIsAddOpen(false);
            }
            return res;
          }}
          submitting={submitting}
        />
      </div>
    );
  }

  // ── 2. Full Page View: Edit Existing Giveaway ───────────────────────
  if (editingGiveaway) {
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
        <GiveawayFormView
          initial={editingGiveaway}
          onBack={() => setEditingGiveaway(null)}
          onSubmit={async (data) => {
            const res = await handleUpdateGiveaway(editingGiveaway.giveaway_id, data);
            if (res?.success) {
              setEditingGiveaway(null);
            }
            return res;
          }}
          submitting={submitting}
        />
      </div>
    );
  }

  // ── 3. Full Page View: Detailed Giveaway View ───────────────────────
  if (detailGiveaway) {
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
        <GiveawayDetailView
          giveaway={detailGiveaway}
          onBack={() => setDetailGiveaway(null)}
          onEdit={(g) => {
            setDetailGiveaway(null);
            setEditingGiveaway(g);
          }}
          onOpenExtendPage={(g) => {
            setDetailGiveaway(null);
            setExtendingGiveaway(g);
          }}
          onExtendEndDate={handleExtendEndDate}
          onManuallyClose={handleManuallyClose}
          onPublishWinners={handlePublishWinners}
        />
      </div>
    );
  }

  // ── 4. Full Page View: Extend Closing Date ──────────────────────────
  if (extendingGiveaway) {
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
        <ExtendGiveawayDateView
          giveaway={extendingGiveaway}
          onBack={() => setExtendingGiveaway(null)}
          onExtend={handleExtendEndDate}
        />
      </div>
    );
  }

  // ── 4. Main Dashboard List Page ─────────────────────────────────────
  return (
    <div className="space-y-6">
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

      {/* ── Page Header ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-normal text-slate-900 dark:text-white tracking-tight">
              Giveaway Management
            </h1>
          </div>
          <p className="text-xs font-normal text-slate-500 dark:text-slate-400 mt-0.5">
            Create promotional giveaways, set schedules, extend closing dates, and publish winners with automated email dispatch
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchGiveaways}
            disabled={loading}
            className="p-1.5 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-rose-600' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-black via-neutral-900 to-rose-950 hover:to-rose-900 text-white text-xs font-normal rounded-full shadow-sm border border-neutral-800 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Giveaway</span>
          </button>
        </div>
      </div>

      {/* ── KPI Summary Cards (Theme matching other admin pages) ──────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Giveaways */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
            <Gift className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-normal text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Giveaways
            </div>
            <div className="text-lg font-normal text-slate-900 dark:text-white mt-0.5">
              {overview.total_giveaways} <span className="text-xs font-normal text-slate-400">total</span>
            </div>
          </div>
        </div>

        {/* Ongoing Active */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-normal text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Ongoing Active
            </div>
            <div className="text-lg font-normal text-slate-900 dark:text-white mt-0.5">
              {overview.ongoing_giveaways} <span className="text-xs font-normal text-slate-400">running</span>
            </div>
          </div>
        </div>

        {/* Completed */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-normal text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Completed
            </div>
            <div className="text-lg font-normal text-slate-700 dark:text-slate-300 mt-0.5">
              {overview.completed_giveaways} <span className="text-xs font-normal text-slate-400">concluded</span>
            </div>
          </div>
        </div>

        {/* Total Winners Announced */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40 flex items-center justify-center shrink-0">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-normal text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Winners Announced
            </div>
            <div className="text-lg font-normal text-rose-600 dark:text-rose-400 mt-0.5">
              {overview.total_winners_announced} <span className="text-xs font-normal text-slate-400">announced</span>
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
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search giveaway title, description..."
              className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-normal text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-rose-500/30 focus:border-neutral-500 transition-colors"
            />
          </div>

          {/* Stage filter dropdown */}
          <div className="relative min-w-[170px]">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-3 pr-8 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-normal text-slate-700 dark:text-slate-200 appearance-none focus:outline-none focus:ring-1 focus:ring-rose-500/30 focus:border-neutral-500 cursor-pointer transition-colors"
            >
              <option value="">All Giveaway Statuses</option>
              <option value="ONGOING">Ongoing Active</option>
              <option value="COMPLETED">Completed</option>
              <option value="DRAFT">Drafts (Unpublished)</option>
              <option value="CLOSED">Closed Manually</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* ── Giveaways Table ─────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
        {loading && giveaways.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center gap-2 text-slate-400">
            <RefreshCw className="w-5 h-5 animate-spin text-rose-600" />
            <span className="text-xs font-normal">Loading giveaways...</span>
          </div>
        ) : giveaways.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Gift className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
            <p className="font-normal text-xs text-slate-700 dark:text-slate-300">No giveaways found</p>
            <p className="text-[11px] font-normal text-slate-400 mt-0.5">Click &quot;+ Create Giveaway&quot; to launch your promotional campaign</p>
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
                    Giveaway Campaign
                  </th>
                  <th className="px-4 py-3 font-normal text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">
                    Campaign Period
                  </th>
                  <th className="px-4 py-3 font-normal text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">
                    Winner Selection
                  </th>
                  <th className="px-4 py-3 font-normal text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">
                    Status
                  </th>
                  <th className="px-4 py-3 font-normal text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">
                    Winners
                  </th>
                  <th className="px-4 py-3 font-normal text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px] text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {giveaways.map((giveaway) => {
                  const status = giveaway.calculated_status || giveaway.status;

                  return (
                    <tr
                      key={giveaway.giveaway_id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* ID */}
                      <td className="px-4 py-3 font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap font-normal">
                        SKLABA_Giveaway_{giveaway.giveaway_id}
                      </td>

                      {/* Giveaway Details & Image */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          {giveaway.thumbnail_url ? (
                            <img
                              src={giveaway.thumbnail_url}
                              alt={giveaway.title}
                              className="w-10 h-8 rounded object-cover bg-slate-50 dark:bg-slate-800 border shrink-0"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-normal shrink-0">
                              <Gift className="w-3.5 h-3.5" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="font-normal text-slate-900 dark:text-slate-100 leading-tight truncate max-w-xs">
                              {giveaway.title}
                            </div>
                            {giveaway.short_description && (
                              <div className="text-[11px] font-normal text-slate-400 truncate max-w-xs mt-0.5">
                                {giveaway.short_description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Campaign Period */}
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300 text-[11px] font-normal whitespace-nowrap">
                        <div>{formatDate(giveaway.start_date)}</div>
                        <div className="text-slate-400 text-[10px]">until {formatDate(giveaway.end_date)}</div>
                      </td>

                      {/* Winner Selection Date */}
                      <td className="px-4 py-3 font-normal text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {formatDate(giveaway.winner_selection_date)}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 font-normal text-slate-900 dark:text-slate-100 whitespace-nowrap">
                        {status}
                      </td>

                      {/* Winners */}
                      <td className="px-4 py-3 font-normal text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {giveaway.winners_announced && Array.isArray(giveaway.winners) && giveaway.winners.length > 0 ? (
                          <span className="font-normal text-slate-900 dark:text-white">
                            {giveaway.winners.length} {giveaway.winners.length === 1 ? 'Winner' : 'Winners'}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Pending</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View details full page */}
                          <button
                            type="button"
                            onClick={() => setDetailGiveaway(giveaway)}
                            className="p-1.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
                            title="View giveaway details, schedule & winners"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit full page */}
                          <button
                            type="button"
                            onClick={() => setEditingGiveaway(giveaway)}
                            className="p-1.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
                            title="Edit giveaway"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Extend closing date full page */}
                          <button
                            type="button"
                            onClick={() => setExtendingGiveaway(giveaway)}
                            className="p-1.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
                            title="Extend closing date"
                          >
                            <CalendarPlus className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete matching ConfirmDeleteModal */}
                          <button
                            type="button"
                            onClick={() => setDeletingGiveaway(giveaway)}
                            className="p-1.5 border border-rose-200/80 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-full transition-colors cursor-pointer"
                            title="Delete giveaway"
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

      {/* Delete Confirmation Modal (Theme matching other admin pages) */}
      <ConfirmDeleteModal
        isOpen={Boolean(deletingGiveaway)}
        onClose={() => setDeletingGiveaway(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Giveaway"
        subtitle="Irreversible action"
        message={`Are you sure you want to permanently delete giveaway "${deletingGiveaway?.title}"? This action cannot be undone.`}
        loading={deleteLoading}
        confirmText="Delete Giveaway"
        variant="danger"
      />
    </div>
  );
}
