import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  CalendarClock,
  Search,
  Phone,
  Mail,
  AlertCircle,
  RefreshCw,
  X,
  Smartphone,
  CheckCircle2,
  Send,
  Calendar,
  Palette,
  Tag,
} from 'lucide-react';
import { reservationService } from '../services/reservationService';
import { userService } from '../services/userService';

// Unified subtle light status badges matching InquiriesPage exactly
const STATUS_CONFIG = {
  Pending: {
    label: 'Pending',
    dot: 'bg-amber-500 text-amber-500',
    badge: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-900',
    meaning: 'Request received; awaiting confirmation with customer.',
  },
  Confirmed: {
    label: 'Confirmed',
    dot: 'bg-sky-500 text-sky-500',
    badge: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400 border-sky-200 dark:border-sky-900',
    meaning: 'Shop staff confirmed reservation with customer.',
  },
  'Ready for Collection': {
    label: 'Ready for Collection',
    dot: 'bg-indigo-500 text-indigo-500',
    badge: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900',
    meaning: 'Phone prepared in store, ready for customer pickup.',
  },
  Collected: {
    label: 'Collected',
    dot: 'bg-emerald-500 text-emerald-500',
    badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900',
    meaning: 'Customer collected device in store.',
  },
  Cancelled: {
    label: 'Cancelled',
    dot: 'bg-rose-500 text-rose-500',
    badge: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-900',
    meaning: 'Reservation cancelled by shop or customer.',
  },
  Expired: {
    label: 'Expired',
    dot: 'bg-slate-400 text-slate-400',
    badge: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700',
    meaning: 'Pickup date passed without collection.',
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

/**
 * Robust date-time formatter that correctly interprets UTC timestamps from backend
 * and displays them in the user's local timezone (matching InquiriesPage)
 */
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
    hour: 'numeric',
    minute: '2-digit',
  });
}

// Format calendar date (YYYY-MM-DD) avoiding timezone shifts
function formatCollectionDate(dateStr) {
  if (!dateStr) return '-';
  const parts = String(dateStr).split('T')[0].split('-');
  if (parts.length === 3) {
    const [y, m, d] = parts;
    const date = new Date(Number(y), Number(m) - 1, Number(d));
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }
  return dateStr;
}

export default function ReservationsPage() {
  const [reservations, setReservations] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successToast, setSuccessToast] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [assignedStaffFilter, setAssignedStaffFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Manage Drawer State
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [modalSaving, setModalSaving] = useState(false);
  const [modalError, setModalError] = useState('');
  const [modalSuccess, setModalSuccess] = useState('');
  const [staffList, setStaffList] = useState([]);

  // Form Fields inside Slide-over
  const [editStatus, setEditStatus] = useState('Pending');
  const [editAssignedStaff, setEditAssignedStaff] = useState('');

  const drawerBodyRef = useRef(null);

  // Load reservations
  const fetchReservations = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: search.trim() || undefined,
        status: statusFilter || undefined,
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
      };

      if (assignedStaffFilter) {
        params.assigned_to_user_id = assignedStaffFilter;
      }

      const res = await reservationService.getReservations(params);

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
  }, [pagination.page, statusFilter, assignedStaffFilter, fromDate, toDate]);

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
        console.warn('Could not load staff list:', err);
      });
  }, []);

  // Reset scroll to top when drawer opens
  useEffect(() => {
    if (selectedReservation && drawerBodyRef.current) {
      drawerBodyRef.current.scrollTop = 0;
    }
  }, [selectedReservation?.reservation_id]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchReservations();
  };

  const handleClearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setAssignedStaffFilter('');
    setFromDate('');
    setToDate('');
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const openDetailModal = async (resItem) => {
    setSelectedReservation(resItem);
    setEditStatus(resItem.status || 'Pending');
    setEditAssignedStaff(resItem.assigned_to_user_id ? String(resItem.assigned_to_user_id) : '');
    setModalError('');
    setModalSuccess('');

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
    setModalSaving(true);
    setModalError('');
    setModalSuccess('');

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
        const assignedStaffObj =
          payload.assigned_to_user_id && staffList.length > 0
            ? staffList.find((s) => s.user_id === payload.assigned_to_user_id) || selectedReservation.assigned_staff
            : payload.assigned_to_user_id === null
            ? null
            : selectedReservation.assigned_staff;

        setSelectedReservation((prev) => ({
          ...prev,
          status: res.data?.status || payload.status,
          assigned_to_user_id: payload.assigned_to_user_id,
          assigned_staff: assignedStaffObj,
          updated_at: res.data?.updated_at || new Date().toISOString(),
        }));

        setReservations((prev) =>
          prev.map((item) =>
            item.reservation_id === selectedReservation.reservation_id
              ? {
                  ...item,
                  status: res.data?.status || payload.status,
                  assigned_to_user_id: payload.assigned_to_user_id,
                  assigned_staff: assignedStaffObj,
                  updated_at: res.data?.updated_at || new Date().toISOString(),
                }
              : item
          )
        );

        setModalSuccess('Reservation updated successfully!');
        setSuccessToast(`Reservation #${selectedReservation.reservation_id} updated successfully!`);
        setTimeout(() => setSuccessToast(''), 4000);
      }
    } catch (err) {
      setModalError(
        err.response?.data?.message || err.message || 'Failed to update reservation status.'
      );
    } finally {
      setModalSaving(false);
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

      {/* Page Title & Action Bar (Clean & Professional without redundant subtitle) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3.5 border-b border-slate-200/80 dark:border-slate-800">
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none flex items-center gap-2.5">
          <CalendarClock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          <span>Customer Reservations</span>
        </h1>

        <button
          onClick={fetchReservations}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200/90 dark:border-slate-800 rounded-full transition-all shadow-2xs hover:border-slate-300 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : 'text-slate-400'}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Tabs & Search Controls (Matching InquiriesPage unified single-card style) */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-2xs">
        {/* Status Segmented Control */}
        <div className="flex flex-wrap items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl sm:rounded-full">
          {['', ...ALL_STATUSES].map((st) => (
            <button
              key={st}
              onClick={() => {
                setStatusFilter(st);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-colors cursor-pointer ${
                statusFilter === st
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              {st === '' ? 'All Reservations' : st}
            </button>
          ))}
        </div>

        {/* Assigned Staff Filter, Date Picker & Search Input */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Staff Filter Dropdown */}
          <div className="relative">
            <select
              value={assignedStaffFilter}
              onChange={(e) => {
                setAssignedStaffFilter(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="w-full sm:w-44 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 rounded-full cursor-pointer focus:outline-none focus:border-blue-500"
            >
              <option value="">All Assigned Staff</option>
              {staffList.map((u) => (
                <option key={u.user_id} value={u.user_id}>
                  {u.display_name}
                </option>
              ))}
            </select>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1 sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search name, phone..."
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

          {(search || statusFilter || assignedStaffFilter || fromDate || toDate) && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="px-3 py-1.5 text-xs text-rose-600 hover:text-rose-700 dark:text-rose-400 rounded-full transition-colors cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2 rounded-xl">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Reservations Table (Matching InquiriesPage table structure) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4 w-12">#</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Phone Number</th>
                <th className="py-3 px-4">Target Phone</th>
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
                  const statusStyle = STATUS_CONFIG[resItem.status] || STATUS_CONFIG.Pending;
                  const collDate = formatCollectionDate(resItem.preferred_collection_date);

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
                            &ldquo;{resItem.customer_note}&rdquo;
                          </div>
                        )}
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {formatDateTime(resItem.created_at)}
                        </span>
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
                                <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[10px] font-medium">
                                  {resItem.selected_options.colour}
                                </span>
                              )}
                              {resItem.selected_phone.price && (
                                <span className="font-medium text-slate-600 dark:text-slate-300">
                                  ${Number(resItem.selected_phone.price).toLocaleString()}
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

                      {/* Unified Status Badge (Matching InquiriesPage exactly) */}
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${statusStyle.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
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

                      {/* Unified Action Button (Matching InquiriesPage exactly) */}
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => openDetailModal(resItem)}
                          className="px-3 py-1 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-full text-xs font-semibold shadow-2xs hover:border-slate-300 transition-colors cursor-pointer"
                        >
                          Manage
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

      {/* ── Slide-over Drawer: Manage Reservation (Matching InquiriesPage exactly) ── */}
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
                    <CalendarClock className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                      Reservation #{selectedReservation.reservation_id}
                    </h2>
                    <span className="text-[11px] text-slate-400">
                      Received {formatDateTime(selectedReservation.created_at)}
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
              <div
                ref={drawerBodyRef}
                className="p-4 sm:p-5 space-y-4 text-xs overflow-y-auto flex-1"
              >
                {modalError && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400 rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{modalError}</span>
                  </div>
                )}

                {modalSuccess && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-400 rounded-xl flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{modalSuccess}</span>
                  </div>
                )}

                {/* Customer Info Card (Matching InquiriesPage exactly) */}
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl space-y-2.5">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Customer</span>
                      <span className="font-bold text-slate-900 dark:text-white text-sm">
                        {selectedReservation.customer_name}
                      </span>
                    </div>

                    {/* Direct Contact Actions */}
                    <div className="flex items-center gap-2">
                      <a
                        href={`tel:${selectedReservation.phone_number}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-blue-600 dark:text-blue-400 rounded-full font-semibold hover:bg-blue-50 text-[11px]"
                        title="Call customer"
                      >
                        <Phone className="w-3 h-3" />
                        <span>Call</span>
                      </a>
                      <a
                        href={`https://wa.me/${selectedReservation.phone_number.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 rounded-full font-semibold hover:bg-emerald-500/20 text-[11px]"
                        title="Chat on WhatsApp"
                      >
                        <Send className="w-3 h-3" />
                        <span>WhatsApp</span>
                      </a>
                    </div>
                  </div>

                  <div className="font-mono text-slate-600 dark:text-slate-300">
                    {selectedReservation.phone_number}
                    {selectedReservation.email && (
                      <span className="font-sans text-slate-400 ml-2">({selectedReservation.email})</span>
                    )}
                  </div>

                  {selectedReservation.customer_note && (
                    <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-300">
                      <span className="font-semibold text-slate-700 dark:text-slate-200">Note: </span>
                      <span className="italic">&ldquo;{selectedReservation.customer_note}&rdquo;</span>
                    </div>
                  )}
                </div>

                {/* Target Phone Card (Matching InquiriesPage exactly) */}
                {selectedReservation.selected_phone ? (
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl space-y-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                      Reserved Phone
                    </span>
                    <div className="flex items-center gap-3">
                      {selectedReservation.selected_phone.photos?.[0] ? (
                        <img
                          src={selectedReservation.selected_phone.photos[0]}
                          alt={selectedReservation.selected_phone.name}
                          className="w-12 h-12 object-contain bg-white dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-500 flex items-center justify-center shrink-0">
                          <Smartphone className="w-5 h-5" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-slate-900 dark:text-white truncate">
                          {selectedReservation.selected_phone.name}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                          <span className="font-semibold text-blue-600 dark:text-blue-400">
                            ${Number(selectedReservation.selected_phone.price).toLocaleString()}
                          </span>
                          {selectedReservation.selected_options?.colour && (
                            <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[10px] font-medium">
                              {selectedReservation.selected_options.colour}
                            </span>
                          )}
                          {selectedReservation.selected_phone.phone_condition && (
                            <span className="text-slate-400 text-[10px]">
                              • {selectedReservation.selected_phone.phone_condition}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/20 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 italic text-[11px]">
                    Device ID: #{selectedReservation.phone_id}
                  </div>
                )}

                {/* Collection Date Card */}
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                      Preferred Collection Date
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white text-sm">
                      {formatCollectionDate(selectedReservation.preferred_collection_date)}
                    </span>
                  </div>
                  <Calendar className="w-4 h-4 text-slate-400" />
                </div>

                {/* Quick Status Select Pills (Strictly Single Line, Compact) */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    Quick Status
                  </label>
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl flex-nowrap overflow-x-auto">
                    {ALL_STATUSES.map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setEditStatus(st)}
                        className={`flex-1 py-1 px-1.5 text-[10px] sm:text-[11px] font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap text-center ${
                          editStatus === st
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Status & Staff Update Form (Matching InquiriesPage exactly) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Reservation Status
                    </label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2 text-xs text-slate-900 dark:text-white rounded-xl cursor-pointer focus:outline-none focus:border-blue-500"
                    >
                      {ALL_STATUSES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Assign Staff Member
                    </label>
                    <select
                      value={editAssignedStaff}
                      onChange={(e) => setEditAssignedStaff(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2 text-xs text-slate-900 dark:text-white rounded-xl cursor-pointer focus:outline-none focus:border-blue-500"
                    >
                      <option value="">Unassigned</option>
                      {staffList.map((u) => (
                        <option key={u.user_id} value={u.user_id}>
                          {u.display_name} ({u.role})
                        </option>
                      ))}
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
                </div>

                {/* Subtle Inventory Rule Note */}
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 dark:text-slate-400 text-[11px]">
                  Notice: Reservations do not deduct inventory. Stock is deducted when the item is physically collected in-store.
                </div>
              </div>

              {/* Pinned Footer (Matching InquiriesPage exactly) */}
              <div className="p-4 sm:p-5 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 flex justify-end gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedReservation(null)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-full font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-xs"
                >
                  Close
                </button>
                <button
                  type="button"
                  disabled={modalSaving}
                  onClick={handleUpdateStatusAndAssign}
                  className="px-5 py-2 bg-[#2563eb] hover:bg-blue-700 text-white rounded-full font-semibold disabled:opacity-50 cursor-pointer shadow-xs text-xs flex items-center gap-2"
                >
                  {modalSaving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{modalSaving ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </div>
          </>,
          document.body
        )}
    </div>
  );
}
