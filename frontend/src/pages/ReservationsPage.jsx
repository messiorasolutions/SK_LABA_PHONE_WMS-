import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  CalendarClock,
  Search,
  Phone,
  Mail,
  User,
  AlertCircle,
  RefreshCw,
  X,
  CheckCircle2,
  Calendar,
  Tag,
  Clock,
  ShieldAlert,
  Info,
  Smartphone,
  ChevronRight,
} from 'lucide-react';
import { reservationService } from '../services/reservationService';
import { userService } from '../services/userService';

// Status Badges & Styling strictly adhering to PDF Section 4 & SRS ST-07:
// Pending: Amber/Warning
// Confirmed: Blue/Info
// Ready for Collection: Purple/Primary
// Collected: Emerald/Success
// Cancelled: Red/Destructive
// Expired: Gray/Neutral
const STATUS_CONFIG = {
  Pending: {
    label: 'Pending',
    badge: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/60',
    dot: 'text-amber-500',
    meaning: 'Request received; shop has not confirmed yet.',
  },
  Confirmed: {
    label: 'Confirmed',
    badge: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800/60',
    dot: 'text-blue-500',
    meaning: 'Staff confirmed the reservation with customer.',
  },
  'Ready for Collection': {
    label: 'Ready for Collection',
    badge: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800/60',
    dot: 'text-purple-500',
    meaning: 'Phone prepped in shop, ready for pickup.',
  },
  Collected: {
    label: 'Collected',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60',
    dot: 'text-emerald-500',
    meaning: 'Customer picked up the phone.',
  },
  Cancelled: {
    label: 'Cancelled',
    badge: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800/60',
    dot: 'text-rose-500',
    meaning: 'Customer or shop cancelled request.',
  },
  Expired: {
    label: 'Expired',
    badge: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    dot: 'text-slate-400',
    meaning: 'Pickup window passed without collection.',
  },
};

const ALL_STATUSES = [
  'Pending',
  'Confirmed',
  'Ready for Collection',
  'Collected',
  'Cancelled',
  'Expired',
];

export default function ReservationsPage() {
  const [reservations, setReservations] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successToast, setSuccessToast] = useState('');

  // Filters (SRS ST-07)
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Modal / Slide-over State
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [staffList, setStaffList] = useState([]);

  // Form Fields inside Slide-over
  const [editStatus, setEditStatus] = useState('Pending');
  const [editAssignedStaff, setEditAssignedStaff] = useState('');

  // Load reservations
  const fetchReservations = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await reservationService.getReservations({
        page: pagination.page,
        limit: pagination.limit,
        search: search.trim() || undefined,
        status: statusFilter || undefined,
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
      });

      if (res?.success) {
        setReservations(res.data || []);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load reservations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, [pagination.page, statusFilter, fromDate, toDate]);

  // Load active staff members for assignment
  useEffect(() => {
    userService
      .getUsers({ limit: 100, is_active: true })
      .then((res) => {
        if (res?.success && Array.isArray(res.data)) {
          setStaffList(res.data);
        }
      })
      .catch((err) => {
        console.warn('Could not load staff list (requires ADMIN role):', err);
      });
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchReservations();
  };

  const handleClearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setFromDate('');
    setToDate('');
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const openDetailModal = async (resItem) => {
    setSelectedReservation(resItem);
    setEditStatus(resItem.status || 'Pending');
    setEditAssignedStaff(resItem.assigned_to_user_id ? String(resItem.assigned_to_user_id) : '');
    setModalError('');

    // Fetch freshest single detail with full phone and staff info (ST-07)
    try {
      const fullRes = await reservationService.getReservationById(resItem.reservation_id);
      if (fullRes?.success && fullRes.data) {
        setSelectedReservation(fullRes.data);
        setEditStatus(fullRes.data.status || 'Pending');
        setEditAssignedStaff(
          fullRes.data.assigned_to_user_id ? String(fullRes.data.assigned_to_user_id) : ''
        );
      }
    } catch (err) {
      console.warn('Failed to fetch full reservation detail:', err);
    }
  };

  const handleUpdateStatusAndAssign = async () => {
    if (!selectedReservation) return;
    setModalLoading(true);
    setModalError('');

    try {
      const payload = {
        status: editStatus,
        assigned_to_user_id: editAssignedStaff ? Number(editAssignedStaff) : null,
      };

      const res = await reservationService.updateReservationStatus(
        selectedReservation.reservation_id,
        payload
      );

      if (res?.success) {
        // Update local list
        setReservations((prev) =>
          prev.map((item) =>
            item.reservation_id === selectedReservation.reservation_id
              ? {
                  ...item,
                  status: res.data.status || payload.status,
                  assigned_to_user_id: payload.assigned_to_user_id,
                  assigned_staff:
                    payload.assigned_to_user_id && staffList.length > 0
                      ? staffList.find((s) => s.user_id === payload.assigned_to_user_id) || item.assigned_staff
                      : payload.assigned_to_user_id === null
                      ? null
                      : item.assigned_staff,
                  updated_at: res.data.updated_at || new Date().toISOString(),
                }
              : item
          )
        );

        setSuccessToast(`Reservation #${selectedReservation.reservation_id} updated successfully!`);
        setTimeout(() => setSuccessToast(''), 4000);
        setSelectedReservation(null);
      }
    } catch (err) {
      setModalError(
        err.response?.data?.message || err.message || 'Failed to update reservation status.'
      );
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-6 right-6 z-[120] bg-emerald-600 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Page Title & Action Bar (Unified Standard) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3.5 border-b border-slate-200/80 dark:border-slate-800">
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
          Customer Reservations
        </h1>

        <button
          onClick={fetchReservations}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200/90 dark:border-slate-800 rounded-full transition-all shadow-2xs hover:border-slate-300 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : 'text-slate-400'}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Tabs, Search & Date Range */}
      <div className="bg-white dark:bg-slate-900 p-3.5 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-2xs space-y-3">
        {/* Status Pills */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-950 p-1 rounded-2xl">
          {['', ...ALL_STATUSES].map((st) => (
            <button
              key={st}
              onClick={() => {
                setStatusFilter(st);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              {st === '' ? 'All Statuses' : st}
            </button>
          ))}
        </div>

        {/* Search & Date Controls */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pt-1">
          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="flex gap-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search customer name, phone, or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-blue-500 focus:outline-none pl-8 pr-4 py-1.5 text-xs text-slate-900 dark:text-white rounded-full transition-colors"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-full border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            >
              Search
            </button>
          </form>

          {/* Collection Date Range Picker */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-400 font-medium flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Collection:
            </span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              title="From Collection Date"
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-xl text-xs focus:border-blue-500 focus:outline-none"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              title="To Collection Date"
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-xl text-xs focus:border-blue-500 focus:outline-none"
            />

            {(search || statusFilter || fromDate || toDate) && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="px-2.5 py-1 text-xs text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2 rounded-xl">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Reservations Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4 w-12">#</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Phone / Email</th>
                <th className="py-3 px-4">Reserved Phone</th>
                <th className="py-3 px-4">Collection Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Assigned Staff</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-600" />
                    <span>Loading reservations...</span>
                  </td>
                </tr>
              ) : reservations.length > 0 ? (
                reservations.map((resItem) => {
                  const statusInfo = STATUS_CONFIG[resItem.status] || STATUS_CONFIG.Pending;
                  const collDate = resItem.preferred_collection_date
                    ? new Date(resItem.preferred_collection_date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })
                    : 'N/A';

                  return (
                    <tr
                      key={resItem.reservation_id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-slate-400">
                        #{resItem.reservation_id}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          {resItem.customer_name}
                        </div>
                        {resItem.customer_note && (
                          <div className="text-[11px] text-slate-400 truncate max-w-xs italic" title={resItem.customer_note}>
                            "{resItem.customer_note}"
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <a
                          href={`tel:${resItem.phone_number}`}
                          className="font-mono text-blue-600 dark:text-blue-400 hover:underline block"
                        >
                          {resItem.phone_number}
                        </a>
                        {resItem.email && (
                          <span className="text-[11px] text-slate-400 truncate block">
                            {resItem.email}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        {resItem.selected_phone ? (
                          <div>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {resItem.selected_phone.name}
                            </span>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 flex-wrap mt-0.5">
                              {resItem.selected_options?.colour && (
                                <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[10px]">
                                  {resItem.selected_options.colour}
                                </span>
                              )}
                              {resItem.selected_phone.price && (
                                <span className="font-medium text-slate-600 dark:text-slate-300">
                                  LKR {Number(resItem.selected_phone.price).toLocaleString()}
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Phone ID: {resItem.phone_id}</span>
                        )}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{collDate}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusInfo.badge}`}
                          title={statusInfo.meaning}
                        >
                          <svg className={`w-1.5 h-1.5 shrink-0 ${statusInfo.dot}`} viewBox="0 0 10 10" fill="currentColor">
                            <circle cx="5" cy="5" r="4.5" />
                          </svg>
                          <span>{resItem.status}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        {resItem.assigned_staff?.display_name ? (
                          <span className="inline-flex items-center gap-1.5 font-medium">
                            <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-[10px] flex items-center justify-center font-bold">
                              {resItem.assigned_staff.display_name.charAt(0).toUpperCase()}
                            </span>
                            <span>{resItem.assigned_staff.display_name}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Unassigned</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => openDetailModal(resItem)}
                          className="px-3.5 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 dark:bg-slate-800 dark:hover:bg-blue-950/60 dark:hover:text-blue-400 text-slate-700 dark:text-slate-300 rounded-full text-xs font-semibold transition-all cursor-pointer border border-slate-200/80 dark:border-slate-700 inline-flex items-center gap-1"
                        >
                          <span>Manage</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    No reservations found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200/80 dark:border-slate-800 text-xs text-slate-500 bg-slate-50/50 dark:bg-slate-950/30">
            <span>
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
            </span>
            <div className="flex gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-300 disabled:opacity-40 font-semibold cursor-pointer"
              >
                Previous
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-300 disabled:opacity-40 font-semibold cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Slide-over Panel: Manage Reservation Details & Status (ST-07) ── */}
      {selectedReservation &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-[90] bg-slate-900/40 backdrop-blur-xs transition-opacity animate-fadeIn"
              onClick={() => setSelectedReservation(null)}
            />
            <div className="fixed top-0 right-0 bottom-0 z-[100] w-full sm:w-[480px] bg-white dark:bg-slate-900 border-l border-slate-200/80 dark:border-slate-800 shadow-2xl flex flex-col justify-between overflow-hidden animate-slideInRight">
              {/* Header */}
              <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <CalendarClock className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                      Reservation #{selectedReservation.reservation_id}
                    </h2>
                    <span className="text-[11px] text-slate-400">
                      Created:{' '}
                      {new Date(selectedReservation.created_at).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedReservation(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="p-4 sm:p-5 space-y-4 text-xs overflow-y-auto flex-1">
                {modalError && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400 rounded-2xl flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{modalError}</span>
                  </div>
                )}

                {/* Customer Details Card */}
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Customer Details
                  </span>
                  <div className="flex justify-between items-baseline">
                    <span className="font-bold text-slate-900 dark:text-white text-sm">
                      {selectedReservation.customer_name}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 dark:text-slate-300 pt-1">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <a
                        href={`tel:${selectedReservation.phone_number}`}
                        className="font-mono text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {selectedReservation.phone_number}
                      </a>
                    </div>
                    {selectedReservation.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <a
                          href={`mailto:${selectedReservation.email}`}
                          className="text-slate-600 dark:text-slate-300 hover:underline truncate"
                        >
                          {selectedReservation.email}
                        </a>
                      </div>
                    )}
                  </div>
                  {selectedReservation.customer_note && (
                    <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-300">
                      <span className="font-semibold text-slate-700 dark:text-slate-200">Note: </span>
                      <span className="italic">"{selectedReservation.customer_note}"</span>
                    </div>
                  )}
                </div>

                {/* Phone Specification & Options Card */}
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl space-y-2.5">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Reserved Phone Details
                  </span>
                  {selectedReservation.selected_phone ? (
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                            {selectedReservation.selected_phone.name}
                          </h4>
                          <span className="text-slate-500 dark:text-slate-400 text-xs">
                            {selectedReservation.selected_phone.brand_name}
                          </span>
                        </div>
                        {selectedReservation.selected_phone.price && (
                          <span className="font-extrabold text-blue-600 dark:text-blue-400 text-sm">
                            LKR {Number(selectedReservation.selected_phone.price).toLocaleString()}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-200 dark:border-slate-700/60 text-[11px]">
                        <div>
                          <span className="text-slate-400 block">Selected Colour:</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {selectedReservation.selected_options?.colour || 'Standard'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Phone Condition:</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {selectedReservation.selected_phone.phone_condition || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <span className="text-slate-400 italic">
                      Referenced Phone ID: #{selectedReservation.phone_id}
                    </span>
                  )}
                </div>

                {/* Collection Schedule Card */}
                <div className="p-3.5 bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/50 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 block">
                        Preferred Collection Date
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white text-sm">
                        {selectedReservation.preferred_collection_date
                          ? new Date(selectedReservation.preferred_collection_date).toLocaleDateString(
                              'en-US',
                              {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              }
                            )
                          : 'Not specified'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status Update & Staff Assignment Section */}
                <div className="space-y-3 pt-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Manage Status & Assignment (ST-07)
                  </span>

                  {/* Status Selector */}
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Reservation Status
                    </label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                    >
                      {ALL_STATUSES.map((st) => (
                        <option key={st} value={st}>
                          {st} - {STATUS_CONFIG[st]?.meaning}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Staff Assignment Selector */}
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Assign to Staff Member
                    </label>
                    <select
                      value={editAssignedStaff}
                      onChange={(e) => setEditAssignedStaff(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="">-- Unassigned --</option>
                      {staffList.map((st) => (
                        <option key={st.user_id} value={st.user_id}>
                          {st.display_name} ({st.role}) - {st.email}
                        </option>
                      ))}
                      {/* If the current staff is not in staffList, retain them */}
                      {selectedReservation.assigned_staff &&
                        !staffList.some(
                          (s) => s.user_id === selectedReservation.assigned_staff.user_id
                        ) && (
                          <option value={selectedReservation.assigned_staff.user_id}>
                            {selectedReservation.assigned_staff.display_name} (Current)
                          </option>
                        )}
                    </select>
                  </div>

                  {/* SRS ST-07 Inventory Rule Reminder */}
                  <div className="p-3 bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 rounded-xl text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
                    <Info className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                    <span>
                      <strong>Inventory Notice (SRS ST-07):</strong> Creating or updating a reservation
                      never deducts or increments phone stock inventory. Staff must manage physical inventory manually.
                    </span>
                  </div>

                  {/* Audit Trail */}
                  {selectedReservation.updated_by_staff && (
                    <div className="text-[11px] text-slate-400 pt-1">
                      Last updated by{' '}
                      <span className="font-semibold text-slate-600 dark:text-slate-300">
                        {selectedReservation.updated_by_staff.display_name}
                      </span>{' '}
                      on {new Date(selectedReservation.updated_at).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="p-4 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedReservation(null)}
                  disabled={modalLoading}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full font-semibold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUpdateStatusAndAssign}
                  disabled={modalLoading}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-semibold text-xs transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {modalLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </div>
          </>
        )}
    </div>
  );
}
