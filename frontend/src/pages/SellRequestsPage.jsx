import React, { useEffect, useState } from 'react';
import {
  ArrowLeftRight,
  Search,
  Phone,
  AlertCircle,
  RefreshCw,
  Smartphone,
  CheckCircle2,
  Calendar,
  HardDrive,
  BatteryCharging,
  User,
  FileText,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { sellRequestService } from '../services/sellRequestService';
import { userService } from '../services/userService';
import SellRequestDetailView from '../components/SellRequests/SellRequestDetailView';

const STATUS_CONFIG = {
  New: {
    label: 'New',
    text: 'text-rose-600 dark:text-rose-400',
    dot: 'bg-rose-500',
  },
  'Quote Given': {
    label: 'Quote Given',
    text: 'text-sky-600 dark:text-sky-400',
    dot: 'bg-sky-500',
  },
  Accepted: {
    label: 'Accepted',
    text: 'text-emerald-600 dark:text-emerald-400',
    dot: 'bg-emerald-500',
  },
  Declined: {
    label: 'Declined',
    text: 'text-amber-600 dark:text-amber-400',
    dot: 'bg-amber-500',
  },
  Closed: {
    label: 'Closed',
    text: 'text-slate-500 dark:text-slate-400',
    dot: 'bg-slate-400',
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

export default function SellRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters & Pagination State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [assignedStaffFilter, setAssignedStaffFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1, totalRecords: 0 });

  // Staff members for assignment dropdown
  const [staffList, setStaffList] = useState([]);

  // Selected Request for Full-Page View
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [modalSaving, setModalSaving] = useState(false);
  const [modalError, setModalError] = useState('');
  const [modalSuccess, setModalSuccess] = useState('');
  const [editStatus, setEditStatus] = useState('New');
  const [editAssignedStaff, setEditAssignedStaff] = useState('');

  // Load Staff List on Mount
  useEffect(() => {
    async function loadStaff() {
      try {
        const res = await userService.getAllUsers({ limit: 100 });
        if (res?.success && Array.isArray(res.data)) {
          setStaffList(res.data);
        } else if (Array.isArray(res)) {
          setStaffList(res);
        }
      } catch (err) {
        console.warn('Could not load staff list:', err.message);
      }
    }
    loadStaff();
  }, []);

  // Fetch Sell Requests with filters
  const fetchSellRequests = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (search.trim()) params.search = search.trim();
      if (statusFilter) params.status = statusFilter;
      if (assignedStaffFilter) params.assigned_to_user_id = assignedStaffFilter;
      if (fromDate) params.from_date = fromDate;
      if (toDate) params.to_date = toDate;

      const res = await sellRequestService.getSellRequests(params);
      if (res?.success) {
        setRequests(res.data || []);
        if (res.pagination) {
          setPagination({
            page: Number(res.pagination.page) || 1,
            limit: Number(res.pagination.limit) || 10,
            totalPages: Number(res.pagination.totalPages) || 1,
            totalRecords: Number(res.pagination.totalRecords) || (res.data ? res.data.length : 0),
          });
        }
      } else {
        setError(res?.message || 'Failed to fetch sell requests.');
      }
    } catch (err) {
      setError(err.message || 'Error communicating with server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSellRequests();
  }, [pagination.page, statusFilter, assignedStaffFilter, fromDate, toDate]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchSellRequests();
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('');
    setAssignedStaffFilter('');
    setFromDate('');
    setToDate('');
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const openDetailModal = async (reqItem) => {
    const reqId = reqItem.request_id || reqItem.id;
    setSelectedRequest(reqItem);
    setEditStatus(reqItem.status || 'New');
    setEditAssignedStaff(reqItem.assigned_to_user_id ? String(reqItem.assigned_to_user_id) : '');
    setModalError('');
    setModalSuccess('');
    setDetailLoading(true);

    try {
      const detailRes = await sellRequestService.getSellRequestById(reqId);
      if (detailRes?.success && detailRes.data) {
        setSelectedRequest(detailRes.data);
        setEditStatus(detailRes.data.status || 'New');
        setEditAssignedStaff(
          detailRes.data.assigned_to_user_id ? String(detailRes.data.assigned_to_user_id) : ''
        );
      }
    } catch (err) {
      console.warn('Could not fetch latest details, displaying cached row:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleUpdateStatus = async (extraPayload = {}) => {
    if (!selectedRequest) return;
    const reqId = selectedRequest.request_id || selectedRequest.id;
    setModalSaving(true);
    setModalError('');
    setModalSuccess('');

    try {
      const payload = {
        status: editStatus,
        assigned_to_user_id: editAssignedStaff ? Number(editAssignedStaff) : null,
        ...extraPayload,
      };

      const res = await sellRequestService.updateSellRequestStatus(reqId, payload);
      if (res?.success) {
        setModalSuccess('Sell request updated successfully!');
        const updatedData = res.data;

        setRequests((prev) =>
          prev.map((item) => {
            const currentId = item.request_id || item.id;
            if (currentId === reqId) {
              return {
                ...item,
                ...updatedData,
                status: updatedData.status,
                assigned_to_user_id: updatedData.assigned_to_user_id,
                assigned_staff: updatedData.assigned_staff || item.assigned_staff,
                updated_by_staff: updatedData.updated_by_staff || item.updated_by_staff,
                updated_at: updatedData.updated_at,
              };
            }
            return item;
          })
        );

        setSelectedRequest((prev) => ({
          ...prev,
          ...updatedData,
          status: updatedData.status,
          assigned_to_user_id: updatedData.assigned_to_user_id,
          assigned_staff: updatedData.assigned_staff || prev?.assigned_staff,
          updated_by_staff: updatedData.updated_by_staff || prev?.updated_by_staff,
          updated_at: updatedData.updated_at,
        }));
      }
    } catch (err) {
      setModalError(err.message || 'Failed to update sell request status.');
    } finally {
      setModalSaving(false);
    }
  };

  // ── Render Full Page View when selected ─────────────────────────────
  if (selectedRequest) {
    return (
      <SellRequestDetailView
        request={selectedRequest}
        onBack={() => {
          setSelectedRequest(null);
          fetchSellRequests();
        }}
        editStatus={editStatus}
        setEditStatus={setEditStatus}
        editAssignedStaff={editAssignedStaff}
        setEditAssignedStaff={setEditAssignedStaff}
        staffList={staffList}
        onSave={handleUpdateStatus}
        saving={modalSaving}
        error={modalError}
        success={modalSuccess}
      />
    );
  }

  // ── Render Main List View ───────────────────────────────────────────
  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3.5 border-b border-slate-200/80 dark:border-slate-800">
        <h1 className="text-xl sm:text-2xl font-normal text-slate-900 dark:text-white tracking-tight leading-none">
          Sell & Trade-In Requests
        </h1>

        <button
          onClick={fetchSellRequests}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-normal border border-slate-200/90 dark:border-slate-800 rounded-full transition-all shadow-2xs hover:border-slate-300 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-rose-600' : 'text-slate-400'}`} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-2xs">
        <div className="flex flex-wrap items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-full">
          {['', 'New', 'Quote Given', 'Accepted', 'Declined', 'Closed'].map((st) => (
            <button
              key={st}
              onClick={() => {
                setStatusFilter(st);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className={`px-3 py-1 text-xs font-normal rounded-full transition-colors cursor-pointer ${
                statusFilter === st
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              {st === '' ? 'All Statuses' : st}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {staffList.length > 0 && (
            <select
              value={assignedStaffFilter}
              onChange={(e) => {
                setAssignedStaffFilter(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 rounded-full px-3 py-1.5 focus:outline-none font-normal"
            >
              <option value="">All Staff</option>
              {staffList.map((st) => (
                <option key={st.user_id} value={st.user_id}>
                  {st.display_name || st.name || st.email || `Staff #${st.user_id}`}
                </option>
              ))}
            </select>
          )}

          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-full px-3 py-1 text-xs">
            <span className="text-slate-400 font-normal">From</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="bg-transparent border-none text-xs text-slate-700 dark:text-slate-300 focus:outline-none font-normal"
              title="From date"
            />
            <span className="text-slate-400 font-normal">To</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="bg-transparent border-none text-xs text-slate-700 dark:text-slate-300 focus:outline-none font-normal"
              title="To date"
            />
          </div>

          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative w-48 sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search name, phone, device..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white rounded-full transition-colors font-normal"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-normal rounded-full border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2 rounded-xl font-normal">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 text-[11px] font-normal text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4 w-12">ID</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Offered Device</th>
                <th className="py-3 px-4">Condition & Battery</th>
                <th className="py-3 px-4">Trade-In Target</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Assigned Staff</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-rose-600" />
                    <span className="font-normal">Loading sell requests...</span>
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-400">
                    <ArrowLeftRight className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="font-normal text-slate-600 dark:text-slate-300">No sell requests found</p>
                    <p className="text-[11px] mt-0.5 text-slate-400 font-normal">
                      {search || statusFilter || assignedStaffFilter
                        ? 'Try adjusting your search criteria.'
                        : 'Customer trade-in requests will appear here.'}
                    </p>
                    {(search || statusFilter || assignedStaffFilter || fromDate || toDate) && (
                      <button
                        onClick={handleResetFilters}
                        className="mt-3 px-3 py-1 text-xs text-rose-600 dark:text-rose-400 hover:underline cursor-pointer font-normal"
                      >
                        Clear Filters
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                requests.map((item) => {
                  const reqId = item.request_id || item.id;
                  const st = STATUS_CONFIG[item.status] || STATUS_CONFIG.New;
                  const staffName =
                    item.assigned_staff?.display_name ||
                    item.assigned_staff_name ||
                    item.assigned_to_user_name ||
                    (item.assigned_to_user_id ? `Staff ${item.assigned_to_user_id}` : 'Unassigned');

                  return (
                    <tr
                      key={reqId}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-normal text-slate-400">
                        {reqId}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-normal text-slate-800 dark:text-slate-200">
                          {item.customer_name}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 font-normal">
                          {formatDateTime(item.created_at)}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-mono font-normal text-slate-800 dark:text-slate-200">
                          {item.phone_number}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-normal text-slate-900 dark:text-slate-100">
                          <span className="truncate max-w-[170px] block">{item.brand_and_model}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-normal">
                          <span>{item.storage_capacity}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-normal text-slate-700 dark:text-slate-300">
                          {item.phone_condition}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                          <BatteryCharging className="w-3 h-3 text-slate-400" />
                          <span>{item.battery_health}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {item.desired_phone ? (
                          <div className="font-normal text-slate-900 dark:text-slate-100 text-xs">
                            <span
                              className="truncate max-w-[170px] block"
                              title={item.desired_phone.name || item.desired_phone.model || 'Target Device'}
                            >
                              {item.desired_phone.name || item.desired_phone.model || 'Target Device'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px] font-normal">Direct Sale</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1.5 text-xs font-normal text-slate-900 dark:text-slate-100">
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${st.dot || 'bg-slate-400'}`} />
                          <span>{st.label}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`text-xs font-normal ${
                            staffName === 'Unassigned'
                              ? 'text-slate-400 italic'
                              : 'text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {staffName}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => openDetailModal(item)}
                          className="px-3 py-1 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-xs font-normal transition-colors cursor-pointer border border-slate-300 dark:border-slate-700"
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 text-xs text-slate-500 font-normal">
            <div>
              Showing page <span className="font-normal text-slate-800 dark:text-slate-200">{pagination.page}</span> of{' '}
              <span className="font-normal text-slate-800 dark:text-slate-200">{pagination.totalPages}</span> ({pagination.totalRecords || requests.length} total)
            </div>
            <div className="flex items-center gap-1.5">
              <button
                disabled={pagination.page <= 1}
                onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                className="px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 text-slate-700 dark:text-slate-300 font-normal"
              >
                Previous
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                className="px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 text-slate-700 dark:text-slate-300 font-normal"
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
