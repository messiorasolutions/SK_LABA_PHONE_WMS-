import React, { useEffect, useState } from 'react';
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
  Calendar,
  Filter,
} from 'lucide-react';
import { reservationService } from '../services/reservationService';
import { userService } from '../services/userService';
import ReservationDetailView from '../components/Reservations/ReservationDetailView';

const STATUS_CONFIG = {
  Pending: {
    label: 'Pending',
    dot: 'bg-amber-500',
    meaning: 'Request received; awaiting confirmation with customer.',
  },
  Confirmed: {
    label: 'Confirmed',
    dot: 'bg-sky-500',
    meaning: 'Shop staff confirmed reservation with customer.',
  },
  'Ready for Collection': {
    label: 'Ready for Collection',
    dot: 'bg-indigo-500',
    meaning: 'Phone prepared in store, ready for customer pickup.',
  },
  Collected: {
    label: 'Collected',
    dot: 'bg-emerald-500',
    meaning: 'Customer collected device in store.',
  },
  Cancelled: {
    label: 'Cancelled',
    dot: 'bg-rose-500',
    meaning: 'Reservation cancelled by shop or customer.',
  },
  Expired: {
    label: 'Expired',
    dot: 'bg-slate-400',
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

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [assignedStaffFilter, setAssignedStaffFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [selectedReservation, setSelectedReservation] = useState(null);
  const [modalSaving, setModalSaving] = useState(false);
  const [modalError, setModalError] = useState('');
  const [modalSuccess, setModalSuccess] = useState('');
  const [staffList, setStaffList] = useState([]);

  const [editStatus, setEditStatus] = useState('Pending');
  const [editAssignedStaff, setEditAssignedStaff] = useState('');

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
      const statusRes = await reservationService.updateReservationStatus(
        selectedReservation.reservation_id,
        editStatus
      );

      let updatedData = statusRes?.data || { ...selectedReservation, status: editStatus };

      const currentAssignedId = selectedReservation.assigned_to_user_id
        ? String(selectedReservation.assigned_to_user_id)
        : '';
      const newAssignedId = editAssignedStaff ? String(editAssignedStaff) : '';

      if (currentAssignedId !== newAssignedId) {
        const assignRes = await reservationService.assignStaff(
          selectedReservation.reservation_id,
          newAssignedId ? Number(newAssignedId) : null
        );
        if (assignRes?.data) {
          updatedData = assignRes.data;
        }
      }

      setSelectedReservation(updatedData);
      setModalSuccess('Reservation updated successfully.');
      setSuccessToast('Reservation updated successfully.');
      setTimeout(() => setSuccessToast(''), 4000);

      setReservations((prev) =>
        prev.map((r) =>
          r.reservation_id === selectedReservation.reservation_id
            ? {
                ...r,
                status: editStatus,
                assigned_to_user_id: newAssignedId ? Number(newAssignedId) : null,
                assigned_staff: staffList.find((s) => s.user_id === Number(newAssignedId)) || null,
              }
            : r
        )
      );
    } catch (err) {
      setModalError(err.response?.data?.message || err.message || 'Failed to update reservation.');
    } finally {
      setModalSaving(false);
    }
  };

  // ── Render Full Page View: Manage Reservation ───────────────────────
  if (selectedReservation) {
    return (
      <div className="pb-12">
        <ReservationDetailView
          reservation={selectedReservation}
          onBack={() => setSelectedReservation(null)}
          editStatus={editStatus}
          setEditStatus={setEditStatus}
          editAssignedStaff={editAssignedStaff}
          setEditAssignedStaff={setEditAssignedStaff}
          staffList={staffList}
          onSave={handleUpdateStatusAndAssign}
          saving={modalSaving}
          error={modalError}
          success={modalSuccess}
        />
      </div>
    );
  }

  // ── Render Main Reservations Table View ─────────────────────────────
  return (
    <div className="space-y-5 pb-12">
      {/* Toast */}
      {successToast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-2.5 bg-slate-900 text-white text-xs font-normal rounded-full shadow-xl animate-in slide-in-from-top-2 border border-neutral-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* ── Page Header ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div>
          <h1 className="text-xl font-normal text-slate-900 dark:text-white tracking-tight">
            Customer Reservations
          </h1>
          <p className="text-xs font-normal text-slate-500 dark:text-slate-400 mt-0.5">
            Hold requests and preferred in-store pickup reservations
          </p>
        </div>

        <button
          onClick={fetchReservations}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-xs font-normal text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-2xs cursor-pointer"
          title="Refresh reservations"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-rose-600' : 'text-slate-500'}`} />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-xs font-normal text-rose-700 dark:text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Search & Filter Controls ─────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-2.5">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by customer name, phone, or email..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-normal text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-rose-500/30 focus:border-neutral-500"
            />
          </div>

          <div className="w-full sm:w-auto min-w-[140px]">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-normal text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="">All Statuses</option>
              {ALL_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full sm:w-auto min-w-[140px]">
            <select
              value={assignedStaffFilter}
              onChange={(e) => setAssignedStaffFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-normal text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="">All Staff</option>
              {staffList.map((st) => (
                <option key={st.user_id} value={st.user_id}>
                  {st.display_name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-gradient-to-r from-black via-neutral-900 to-rose-950 hover:to-rose-900 text-white rounded-full text-xs font-normal border border-neutral-800 transition-all cursor-pointer shadow-xs"
            >
              Search
            </button>
            <button
              type="button"
              onClick={handleClearFilters}
              className="px-3.5 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-xs font-normal transition-colors cursor-pointer"
            >
              Clear
            </button>
          </div>
        </form>
      </div>

      {/* ── Table View ──────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-normal">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                <th className="py-3 px-4 font-normal text-slate-400 uppercase tracking-wider text-[10px] w-20">
                  ID
                </th>
                <th className="py-3 px-4 font-normal text-slate-400 uppercase tracking-wider text-[10px]">
                  Customer
                </th>
                <th className="py-3 px-4 font-normal text-slate-400 uppercase tracking-wider text-[10px]">
                  Contact
                </th>
                <th className="py-3 px-4 font-normal text-slate-400 uppercase tracking-wider text-[10px]">
                  Reserved Smartphone
                </th>
                <th className="py-3 px-4 font-normal text-slate-400 uppercase tracking-wider text-[10px]">
                  Collection Date
                </th>
                <th className="py-3 px-4 font-normal text-slate-400 uppercase tracking-wider text-[10px]">
                  Status
                </th>
                <th className="py-3 px-4 font-normal text-slate-400 uppercase tracking-wider text-[10px]">
                  Assigned Staff
                </th>
                <th className="py-3 px-4 font-normal text-slate-400 uppercase tracking-wider text-[10px] text-right">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-rose-600" />
                    <span className="font-normal text-xs">Loading reservations...</span>
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
                      <td className="py-3 px-4 font-mono font-normal text-slate-500">
                        {resItem.reservation_id}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-normal text-slate-900 dark:text-slate-100">
                          {resItem.customer_name}
                        </div>
                        {resItem.customer_note && (
                          <div className="text-[11px] text-slate-400 truncate max-w-xs italic font-normal">
                            &ldquo;{resItem.customer_note}&rdquo;
                          </div>
                        )}
                        <span className="text-[10px] text-slate-400 block mt-0.5 font-normal">
                          {formatDateTime(resItem.created_at)}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-mono text-xs font-normal text-slate-900 dark:text-slate-100 block">
                          {resItem.phone_number}
                        </span>
                        {resItem.email && (
                          <span className="text-[11px] text-slate-400 truncate block font-normal">
                            {resItem.email}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        {resItem.selected_phone ? (
                          <div>
                            <span className="font-normal text-slate-900 dark:text-slate-100">
                              {resItem.selected_phone.name}
                            </span>
                            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 flex-wrap mt-0.5 font-normal">
                              {resItem.selected_options?.colour && (
                                <span>{resItem.selected_options.colour}</span>
                              )}
                              {resItem.selected_phone.price && (
                                <span>· ${Number(resItem.selected_phone.price).toLocaleString()}</span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic font-normal">Phone ID: {resItem.phone_id}</span>
                        )}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap font-normal text-slate-700 dark:text-slate-300">
                        {collDate}
                      </td>

                      <td className="py-3 px-4 font-normal">
                        <span className="inline-flex items-center gap-1.5 text-xs text-slate-900 dark:text-slate-100">
                          <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                          <span>{resItem.status}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-normal">
                        {resItem.assigned_staff?.display_name || 'Unassigned'}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => openDetailModal(resItem)}
                          className="px-3 py-1 text-xs font-normal rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer"
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400 font-normal">
                    No reservations found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200/80 dark:border-slate-800 text-xs text-slate-500 bg-slate-50/50 dark:bg-slate-950/30">
            <span>
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
            </span>
            <div className="flex gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                className="px-3.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full text-slate-700 dark:text-slate-300 disabled:opacity-40 font-normal cursor-pointer"
              >
                Previous
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                className="px-3.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full text-slate-700 dark:text-slate-300 disabled:opacity-40 font-normal cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
