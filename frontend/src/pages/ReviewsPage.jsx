import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Star,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  X,
  User,
  Calendar,
  MessageSquare,
  Clock,
  ShieldCheck,
  ChevronRight,
  Filter,
  Check,
  Ban,
  ArrowUpDown
} from 'lucide-react';
import { reviewService } from '../services/reviewService';

const STATUS_CONFIG = {
  Pending: {
    label: 'Pending',
    dot: 'bg-amber-500',
    badge: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-900',
    text: 'text-amber-600 dark:text-amber-400',
  },
  Approved: {
    label: 'Approved',
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900',
    text: 'text-emerald-600 dark:text-emerald-400',
  },
  Rejected: {
    label: 'Rejected',
    dot: 'bg-rose-500',
    badge: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-900',
    text: 'text-rose-600 dark:text-rose-400',
  },
};

function formatDateTime(dateInput) {
  if (!dateInput) return '-';
  let date;

  if (dateInput instanceof Date) {
    date = dateInput;
  } else {
    let str = String(dateInput).trim();
    if (!str.endsWith('Z') && !/[+-]\d{2}(:\d{2})?$/.test(str)) {
      str = str.replace(' ', 'T') + 'Z';
    }
    date = new Date(str);
  }

  if (isNaN(date.getTime())) return String(dateInput);

  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function StarRating({ rating, size = 'w-4 h-4' }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${size} ${
            star <= rating
              ? 'text-amber-400 fill-amber-400'
              : 'text-slate-300 dark:text-slate-700'
          }`}
        />
      ))}
    </div>
  );
}

export default function ReviewsPage() {
  const drawerPanelRef = useRef(null);
  const [reviews, setReviews] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, totalRecords: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [error, setError] = useState('');
  const [successBanner, setSuccessBanner] = useState('');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');

  const [selectedReview, setSelectedReview] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);


  const fetchReviews = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError('');

    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (statusFilter) params.status = statusFilter;
      if (ratingFilter) params.rating = ratingFilter;
      if (search.trim()) params.search = search.trim();

      const res = await reviewService.getAdminReviews(params);
      const list = res.data || [];
      setReviews(list);

      if (res.pagination) {
        setPagination((prev) => ({
          ...prev,
          totalRecords: res.pagination.totalRecords,
          totalPages: res.pagination.totalPages,
        }));
      }

      if (selectedReview) {
        const fresh = list.find((r) => r.review_id === selectedReview.review_id);
        if (fresh) setSelectedReview(fresh);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch reviews.');
    } finally {
      if (showLoading) setLoading(false);
    }
  };


  useEffect(() => {
    fetchReviews();
  }, [pagination.page, statusFilter, ratingFilter]);


  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPagination((p) => ({ ...p, page: 1 }));
    fetchReviews();
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('');
    setRatingFilter('');
    setPagination((p) => ({ ...p, page: 1 }));
  };

  const handleModerate = async (reviewId, newStatus) => {
    setActionLoadingId(reviewId);
    setError('');

    try {
      const res = await reviewService.moderateReview(reviewId, newStatus);
      const updated = res.data;

      setReviews((prev) =>
        prev.map((r) => (r.review_id === reviewId ? { ...r, ...updated, status: newStatus } : r))
      );

      if (selectedReview && selectedReview.review_id === reviewId) {
        setSelectedReview((prev) => ({ ...prev, ...updated, status: newStatus }));
      }

      const msg = res.message || `Review #${reviewId} marked as ${newStatus}.`;
      setSuccessBanner(msg);
      setTimeout(() => setSuccessBanner(''), 4000);

    } catch (err) {
      setError(err.message || `Failed to update status to ${newStatus}.`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const openDrawer = (review) => {
    setSelectedReview(review);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Star className="w-5 h-5 fill-blue-500/20 text-blue-600 dark:text-blue-400" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Customer Reviews
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Moderate and approve customer ratings and testimonials before publishing on the website storefront.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              fetchReviews(true);
                    }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            title="Refresh list"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 rounded-full cursor-pointer focus:outline-none focus:border-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>

          <select
            value={ratingFilter}
            onChange={(e) => {
              setRatingFilter(e.target.value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 rounded-full cursor-pointer focus:outline-none focus:border-blue-500"
          >
            <option value="">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>

          {(statusFilter || ratingFilter || search) && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline px-2 py-1 cursor-pointer font-medium"
            >
              Reset Filters
            </button>
          )}
        </div>

        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search customer, comment..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-blue-500 focus:outline-none pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white rounded-full transition-colors"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-full border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
          >
            Search
          </button>
        </form>
      </div>

      {successBanner && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-400 text-xs flex items-center justify-between rounded-xl animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successBanner}</span>
          </div>
          <button
            onClick={() => setSuccessBanner('')}
            className="text-emerald-700 dark:text-emerald-400 hover:opacity-75"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2 rounded-xl">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4 w-16">ID</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Rating</th>
                <th className="py-3 px-4 max-w-xs">Customer Comment</th>
                <th className="py-3 px-4">Submitted Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Moderated By</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-600" />
                    <span>Loading customer reviews...</span>
                  </td>
                </tr>
              ) : reviews.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    <Star className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-400" />
                    <p className="font-semibold text-slate-600 dark:text-slate-300">No customer reviews found</p>
                    <p className="text-[11px] mt-0.5 text-slate-400">
                      {search || statusFilter || ratingFilter
                        ? 'Try adjusting your search criteria or status filter.'
                        : 'Customer reviews will appear here once submitted.'}
                    </p>
                    {(search || statusFilter || ratingFilter) && (
                      <button
                        onClick={handleResetFilters}
                        className="mt-3 px-3 py-1 text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                      >
                        Clear Filters
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                reviews.map((item) => {
                  const revId = item.review_id;
                  const st = STATUS_CONFIG[item.status] || STATUS_CONFIG.Pending;
                  const isActing = actionLoadingId === revId;
                  const modName = item.moderator?.display_name || (item.moderated_by_user_id ? `Admin #${item.moderated_by_user_id}` : '-');

                  return (
                    <tr
                      key={revId}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-500 dark:text-slate-400">
                        #{revId}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-blue-600/10 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center shrink-0">
                            {(item.customer_name || 'C').charAt(0).toUpperCase()}
                          </div>
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {item.customer_name}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <StarRating rating={item.rating} size="w-3.5 h-3.5" />
                          <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                            {item.rating}.0
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 max-w-xs sm:max-w-md">
                        <p
                          className="line-clamp-2 text-slate-600 dark:text-slate-300 leading-relaxed cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                          onClick={() => openDrawer(item)}
                          title="Click to view full review"
                        >
                          &ldquo;{item.comment}&rdquo;
                        </p>
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap text-[11px]">
                        {formatDateTime(item.created_at)}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${st.badge}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                          <span>{st.label}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap text-[11px]">
                        {modName !== '-' ? (
                          <div className="leading-tight">
                            <span className="font-medium text-slate-700 dark:text-slate-300">{modName}</span>
                            {item.moderated_at && (
                              <div className="text-[10px] text-slate-400">{formatDateTime(item.moderated_at)}</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {item.status !== 'Approved' && (
                            <button
                              type="button"
                              disabled={isActing}
                              onClick={() => handleModerate(revId, 'Approved')}
                              className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-semibold border border-emerald-200 dark:border-emerald-800 transition-colors cursor-pointer flex items-center gap-1 disabled:opacity-50"
                              title="Approve and publish to website"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>
                          )}

                          {item.status !== 'Rejected' && (
                            <button
                              type="button"
                              disabled={isActing}
                              onClick={() => handleModerate(revId, 'Rejected')}
                              className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 text-xs font-semibold border border-rose-200 dark:border-rose-800 transition-colors cursor-pointer flex items-center gap-1 disabled:opacity-50"
                              title="Reject and hide from website"
                            >
                              <Ban className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => openDrawer(item)}
                            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                            title="View review details"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {pagination.totalPages > 1 && (
          <div className="p-3 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing {reviews.length} of {pagination.totalRecords} reviews
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={pagination.page <= 1}
                onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                className="px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                Previous
              </button>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                type="button"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                className="px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {drawerOpen && selectedReview &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-[90] bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
              onClick={closeDrawer}
            />

            <div
              ref={drawerPanelRef}
              className="fixed top-0 right-0 bottom-0 z-[100] w-full sm:w-[480px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-200"
            >
              <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div>
                <span className="text-[11px] font-mono text-slate-400">Review #{selectedReview.review_id}</span>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Review Details</h2>
              </div>
              <button
                type="button"
                onClick={closeDrawer}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 flex-1 overflow-y-auto space-y-6 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Customer Info
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                      STATUS_CONFIG[selectedReview.status]?.badge || STATUS_CONFIG.Pending.badge
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        STATUS_CONFIG[selectedReview.status]?.dot || STATUS_CONFIG.Pending.dot
                      }`}
                    />
                    <span>{selectedReview.status}</span>
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-600/10 text-blue-600 dark:text-blue-400 font-bold text-sm flex items-center justify-center">
                    {(selectedReview.customer_name || 'C').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">
                      {selectedReview.customer_name}
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      <span>{formatDateTime(selectedReview.created_at)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                  Customer Rating
                </span>
                <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <StarRating rating={selectedReview.rating} size="w-5 h-5" />
                  <span className="text-sm font-black text-amber-600 dark:text-amber-400 ml-1">
                    {selectedReview.rating} out of 5 Stars
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                  Review Comment
                </span>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 leading-relaxed italic text-xs whitespace-pre-wrap">
                  &ldquo;{selectedReview.comment}&rdquo;
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Moderation Audit
                </span>
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Moderator:</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {selectedReview.moderator?.display_name || (selectedReview.moderated_by_user_id ? `Admin #${selectedReview.moderated_by_user_id}` : 'None (Pending)')}
                    </span>
                  </div>
                  {selectedReview.moderated_at && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Moderated At:</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {formatDateTime(selectedReview.moderated_at)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-400">Last Updated:</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {formatDateTime(selectedReview.updated_at || selectedReview.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/50 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={closeDrawer}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                {selectedReview.status !== 'Rejected' && (
                  <button
                    type="button"
                    disabled={actionLoadingId === selectedReview.review_id}
                    onClick={() => handleModerate(selectedReview.review_id, 'Rejected')}
                    className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 text-xs font-bold border border-rose-200 dark:border-rose-800 transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                )}

                {selectedReview.status !== 'Approved' && (
                  <button
                    type="button"
                    disabled={actionLoadingId === selectedReview.review_id}
                    onClick={() => handleModerate(selectedReview.review_id, 'Approved')}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve & Publish</span>
                  </button>
                )}
              </div>
              </div>
            </div>
          </>,
          document.body
        )}
    </div>
  );
}
