import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  BellRing,
  Search,
  Phone as PhoneIcon,
  Mail,
  User,
  AlertCircle,
  RefreshCw,
  Smartphone,
  CheckCircle2,
  Clock,
  Check,
  RotateCcw,
} from 'lucide-react';
import { backInStockService } from '../services/backInStockService';
import { userService } from '../services/userService';
import BackInStockDetailView from '../components/BackInStock/BackInStockDetailView';

const STATUS_CONFIG = {
  Pending: {
    label: 'Pending',
    dot: 'bg-amber-500',
  },
  Contacted: {
    label: 'Contacted',
    dot: 'bg-sky-500',
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

export default function BackInStockPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const phoneIdParam = searchParams.get('phone_id');

  const [activeTab, setActiveTab] = useState('grouped'); // 'grouped' | 'all'

  // Grouped View State
  const [groupedPhones, setGroupedPhones] = useState([]);
  const [groupedPagination, setGroupedPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });
  const [groupedLoading, setGroupedLoading] = useState(true);

  // Flat Requests View State
  const [allRequests, setAllRequests] = useState([]);
  const [allPagination, setAllPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [allLoading, setAllLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(''); // '' | 'Pending' | 'Contacted'
  const [assignedStaffFilter, setAssignedStaffFilter] = useState('');

  // Staff list for assignments
  const [staffList, setStaffList] = useState([]);

  // Full Page Detail View for Phone Waiting Customers
  const [selectedPhoneData, setSelectedPhoneData] = useState(null);
  const [phoneDetailLoading, setPhoneDetailLoading] = useState(false);

  // Action status message
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  // Load Staff List
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

  // Fetch Grouped Phones
  const fetchGroupedPhones = async (page = 1) => {
    setGroupedLoading(true);
    setActionError('');
    try {
      const res = await backInStockService.getGroupedRequests({
        page,
        limit: groupedPagination.limit,
        search: search.trim() || undefined,
        status: statusFilter || undefined,
      });

      const phoneList = res?.data?.phones || (Array.isArray(res?.data) ? res.data : []);
      setGroupedPhones(phoneList);

      const pag = res?.pagination || res?.data?.pagination;
      if (pag) {
        setGroupedPagination({
          page: Number(pag.page) || page,
          limit: Number(pag.limit) || 12,
          total: Number(pag.total) || phoneList.length,
          totalPages: Number(pag.totalPages) || 1,
        });
      }
    } catch (err) {
      console.error('Error fetching grouped requests:', err);
      setActionError(err.message || 'Failed to load back-in-stock grouped phones.');
    } finally {
      setGroupedLoading(false);
    }
  };

  // Fetch Flat Requests
  const fetchAllRequests = async (page = 1) => {
    setAllLoading(true);
    setActionError('');
    try {
      const res = await backInStockService.getAllRequests({
        page,
        limit: allPagination.limit,
        search: search.trim() || undefined,
        status: statusFilter || undefined,
        assigned_to_user_id: assignedStaffFilter || undefined,
      });

      const requestsList = res?.data?.requests || (Array.isArray(res?.data) ? res.data : []);
      setAllRequests(requestsList);

      const pag = res?.pagination || res?.data?.pagination;
      if (pag) {
        setAllPagination({
          page: Number(pag.page) || page,
          limit: Number(pag.limit) || 15,
          total: Number(pag.total) || requestsList.length,
          totalPages: Number(pag.totalPages) || 1,
        });
      }
    } catch (err) {
      console.error('Error fetching flat requests:', err);
      setActionError(err.message || 'Failed to load requests list.');
    } finally {
      setAllLoading(false);
    }
  };

  // Initial and reactive trigger
  useEffect(() => {
    if (activeTab === 'grouped') {
      fetchGroupedPhones(1);
    } else {
      fetchAllRequests(1);
    }
  }, [activeTab, statusFilter, assignedStaffFilter]);

  // Open Full-Page Waiting Customers for a specific phone
  const openPhoneDetailView = async (phoneId) => {
    setPhoneDetailLoading(true);
    setActionError('');
    try {
      const res = await backInStockService.getWaitingCustomersForPhone(phoneId);
      setSelectedPhoneData(res?.data || null);
    } catch (err) {
      console.error('Error fetching phone waiting customers:', err);
      setActionError(err.message || 'Failed to load waiting customers for this phone.');
    } finally {
      setPhoneDetailLoading(false);
    }
  };

  // Check URL parameter `?phone_id=...`
  useEffect(() => {
    if (phoneIdParam) {
      openPhoneDetailView(phoneIdParam);
    }
  }, [phoneIdParam]);

  // Handle Search submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (activeTab === 'grouped') {
      fetchGroupedPhones(1);
    } else {
      fetchAllRequests(1);
    }
  };

  // Update Request Status (Pending / Contacted)
  const handleUpdateStatus = async (requestId, newStatus = 'Contacted') => {
    setUpdatingId(requestId);
    setActionError('');
    try {
      await backInStockService.markAsContacted(requestId, newStatus);
      setActionSuccess(`Status updated to ${newStatus} successfully!`);
      setTimeout(() => setActionSuccess(''), 3000);

      // Refresh in-detail phone data if open
      if (selectedPhoneData?.phone?.phone_id || selectedPhoneData?.phone?.id) {
        const currentPhoneId = selectedPhoneData.phone?.phone_id || selectedPhoneData.phone?.id;
        const res = await backInStockService.getWaitingCustomersForPhone(currentPhoneId);
        setSelectedPhoneData(res?.data || null);
      }

      // Refresh background tables
      if (activeTab === 'grouped') {
        fetchGroupedPhones(groupedPagination.page);
      } else {
        fetchAllRequests(allPagination.page);
      }
    } catch (err) {
      console.error('Error updating status:', err);
      setActionError(err.response?.data?.message || err.message || 'Failed to update request.');
    } finally {
      setUpdatingId(null);
    }
  };

  // Assign Request to Staff
  const handleAssignStaff = async (requestId, staffId) => {
    setUpdatingId(requestId);
    setActionError('');
    try {
      await backInStockService.assignRequest(requestId, staffId ? Number(staffId) : null);
      setActionSuccess('Staff assigned successfully!');
      setTimeout(() => setActionSuccess(''), 3000);

      // Refresh in-detail phone data if open
      if (selectedPhoneData?.phone?.phone_id || selectedPhoneData?.phone?.id) {
        const currentPhoneId = selectedPhoneData.phone?.phone_id || selectedPhoneData.phone?.id;
        const res = await backInStockService.getWaitingCustomersForPhone(currentPhoneId);
        setSelectedPhoneData(res?.data || null);
      }

      // Refresh background tables
      if (activeTab === 'grouped') {
        fetchGroupedPhones(groupedPagination.page);
      } else {
        fetchAllRequests(allPagination.page);
      }
    } catch (err) {
      console.error('Error assigning staff:', err);
      setActionError(err.response?.data?.message || err.message || 'Failed to assign staff.');
    } finally {
      setUpdatingId(null);
    }
  };

  // ── Render Full Page Detail View when a Phone is selected ──────────
  if (selectedPhoneData) {
    return (
      <div className="max-w-7xl mx-auto">
        {actionSuccess && (
          <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-normal flex items-center gap-2.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>{actionSuccess}</span>
          </div>
        )}
        {actionError && (
          <div className="mb-4 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs font-normal flex items-center gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
            <span>{actionError}</span>
          </div>
        )}
        <BackInStockDetailView
          phoneData={selectedPhoneData}
          onBack={() => {
            setSelectedPhoneData(null);
            if (phoneIdParam) setSearchParams({});
            if (activeTab === 'grouped') {
              fetchGroupedPhones(groupedPagination.page);
            } else {
              fetchAllRequests(allPagination.page);
            }
          }}
          staffList={staffList}
          onUpdateStatus={handleUpdateStatus}
          onAssignStaff={handleAssignStaff}
          updatingId={updatingId}
          loading={phoneDetailLoading}
        />
      </div>
    );
  }

  // ── Main List Page ──────────────────────────────────────────────────
  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3.5 border-b border-slate-200/80 dark:border-slate-800">
        <h1 className="text-xl sm:text-2xl font-normal text-slate-900 dark:text-white tracking-tight leading-none">
          Back-in-Stock Requests
        </h1>

        <button
          type="button"
          onClick={() => (activeTab === 'grouped' ? fetchGroupedPhones(groupedPagination.page) : fetchAllRequests(allPagination.page))}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-normal border border-slate-200/90 dark:border-slate-800 rounded-full transition-all shadow-2xs hover:border-slate-300 cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${groupedLoading || allLoading ? 'animate-spin text-rose-600' : 'text-slate-400'}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Notifications */}
      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-normal flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {actionError && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs font-normal flex items-center gap-2.5 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Tabs and Controls Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-2xs">
        {/* Tab Switcher */}
        <div className="flex flex-wrap items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-full">
          <button
            type="button"
            onClick={() => setActiveTab('grouped')}
            className={`px-3 py-1.5 text-xs font-normal rounded-full transition-colors cursor-pointer ${
              activeTab === 'grouped'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            Grouped by Phone ({groupedPagination.total || groupedPhones.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 text-xs font-normal rounded-full transition-colors cursor-pointer ${
              activeTab === 'all'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            All Requests Flat List ({allPagination.total || allRequests.length})
          </button>
        </div>

        {/* Right Filters & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {activeTab === 'all' && staffList.length > 0 && (
            <div className="relative">
              <select
                value={assignedStaffFilter}
                onChange={(e) => setAssignedStaffFilter(e.target.value)}
                className="w-full sm:w-auto text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-full px-3 py-1.5 text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer font-normal"
              >
                <option value="">All Assigned Staff</option>
                {staffList.map((st) => (
                  <option key={st.user_id} value={st.user_id}>
                    {st.display_name || st.name || st.email || `Staff ${st.user_id}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-auto text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-full px-3 py-1.5 text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer font-normal"
            >
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Contacted">Contacted</option>
            </select>
          </div>

          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1 sm:w-60">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder={activeTab === 'grouped' ? 'Search phone or brand...' : 'Search customer, phone, device...'}
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

      {/* Main Tab Content */}
      {activeTab === 'grouped' ? (
        /* ================= TAB 1: GROUPED BY PHONE ================= */
        groupedLoading ? (
          <div className="py-20 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-rose-600" />
            <p className="text-xs font-normal">Loading grouped phone requests...</p>
          </div>
        ) : groupedPhones.length === 0 ? (
          <div className="py-20 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <BellRing className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
            <h3 className="text-sm font-normal text-slate-700 dark:text-slate-300">No Back-in-Stock Requests Found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto font-normal">
              There are currently no sold-out phones with customers waiting on alerts.
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 text-[11px] font-normal text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Phone Model</th>
                    <th className="py-3 px-4">Stock</th>
                    <th className="py-3 px-4 text-center">Waiting Customers</th>
                    <th className="py-3 px-4 text-center">Pending</th>
                    <th className="py-3 px-4 text-center">Contacted</th>
                    <th className="py-3 px-4">Latest Request</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {groupedPhones.map((phone) => {
                    const photoUrl = Array.isArray(phone.photos) ? phone.photos[0] : phone.photos || phone.main_photo;
                    const waitingCount = phone.waiting_customers_count ?? phone.total_requests_count ?? 0;
                    const isSoldOut = !phone.current_stock || phone.current_stock <= 0;

                    return (
                      <tr
                        key={phone.phone_id}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 p-1 flex items-center justify-center shrink-0 border border-slate-200/60 dark:border-slate-700/60">
                              {photoUrl ? (
                                <img
                                  src={photoUrl}
                                  alt={phone.phone_name}
                                  className="max-h-full max-w-full object-contain"
                                />
                              ) : (
                                <Smartphone className="w-5 h-5 text-slate-400" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <span className="font-normal text-slate-900 dark:text-white block truncate max-w-[220px]">
                                {phone.phone_name}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-normal">
                          {isSoldOut ? '0 units' : `${phone.current_stock} units`}
                        </td>

                        <td className="py-3 px-4 text-center font-normal text-slate-900 dark:text-white">
                          {waitingCount}
                        </td>

                        <td className="py-3 px-4 text-center text-slate-600 dark:text-slate-400 font-normal">
                          {phone.pending_requests_count ?? 0}
                        </td>

                        <td className="py-3 px-4 text-center text-slate-600 dark:text-slate-400 font-normal">
                          {phone.contacted_requests_count ?? 0}
                        </td>

                        <td className="py-3 px-4 text-slate-500 whitespace-nowrap font-normal">
                          {phone.latest_request_at ? (
                            <span className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{formatDateTime(phone.latest_request_at)}</span>
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => openPhoneDetailView(phone.phone_id)}
                            className="px-3 py-1 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-xs font-normal transition-colors cursor-pointer border border-slate-300 dark:border-slate-700"
                          >
                            Manage
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Grouped Pagination */}
            {groupedPagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200/80 dark:border-slate-800 text-xs text-slate-500 bg-slate-50/50 dark:bg-slate-950/30 font-normal">
                <span>
                  Page {groupedPagination.page} of {groupedPagination.totalPages} ({groupedPagination.total} total phone models)
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={groupedPagination.page <= 1}
                    onClick={() => fetchGroupedPhones(groupedPagination.page - 1)}
                    className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-300 disabled:opacity-40 font-normal cursor-pointer"
                  >
                    Previous
                  </button>
                  <button
                    disabled={groupedPagination.page >= groupedPagination.totalPages}
                    onClick={() => fetchGroupedPhones(groupedPagination.page + 1)}
                    className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-300 disabled:opacity-40 font-normal cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      ) : (
        /* ================= TAB 2: ALL REQUESTS FLAT LIST ================= */
        allLoading ? (
          <div className="py-20 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-rose-600" />
            <p className="text-xs font-normal">Loading requests list...</p>
          </div>
        ) : allRequests.length === 0 ? (
          <div className="py-20 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <BellRing className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
            <h3 className="text-sm font-normal text-slate-700 dark:text-slate-300">No Requests Matching Filter</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto font-normal">
              Try adjusting your search keywords or status filter.
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 text-[11px] font-normal text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Contact</th>
                    <th className="py-3 px-4">Requested Phone</th>
                    <th className="py-3 px-4">Notes / Variant</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Assigned Staff</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {allRequests.map((req) => {
                    const statusObj = STATUS_CONFIG[req.status] || STATUS_CONFIG.Pending;
                    const isPending = req.status === 'Pending';
                    const isUpdating = updatingId === req.request_id;

                    return (
                      <tr key={req.request_id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-4 py-3.5">
                          <span className="font-normal text-slate-900 dark:text-white block">
                            {req.customer_name}
                          </span>
                        </td>

                        <td className="px-4 py-3.5">
                          <span className="font-mono font-normal text-slate-800 dark:text-slate-200">
                            {req.phone_number}
                          </span>
                        </td>

                        <td className="px-4 py-3.5">
                          <button
                            type="button"
                            onClick={() => req.phone_id && openPhoneDetailView(req.phone_id)}
                            className="font-normal text-slate-900 dark:text-white block hover:text-rose-600 dark:hover:text-rose-400 text-left transition-colors cursor-pointer"
                          >
                            {req.phone?.name || req.phone_name || (req.phone_id ? `Phone ${req.phone_id}` : 'Phone')}
                          </button>
                        </td>

                        <td className="px-4 py-3.5 max-w-[200px]">
                          {req.notes ? (
                            <span className="text-slate-600 dark:text-slate-300 line-clamp-2 font-normal" title={req.notes}>
                              {req.notes}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">No notes</span>
                          )}
                        </td>

                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center gap-1.5 text-xs font-normal text-slate-900 dark:text-slate-100">
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusObj.dot || 'bg-slate-400'}`} />
                            <span>{statusObj.label}</span>
                          </span>
                        </td>

                        <td className="px-4 py-3.5">
                          <select
                            value={req.assigned_to_user_id || ''}
                            disabled={isUpdating}
                            onChange={(e) => handleAssignStaff(req.request_id, e.target.value)}
                            className="text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer font-normal"
                          >
                            <option value="">Unassigned</option>
                            {staffList.map((st) => (
                              <option key={st.user_id} value={st.user_id}>
                                {st.display_name || st.name || st.email || `Staff ${st.user_id}`}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap font-normal">
                          {formatDateTime(req.created_at)}
                        </td>

                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {isPending ? (
                              <button
                                type="button"
                                disabled={isUpdating}
                                onClick={() => handleUpdateStatus(req.request_id, 'Contacted')}
                                className="px-3 py-1 text-xs font-normal rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer inline-flex items-center gap-1.5"
                              >
                                {isUpdating ? (
                                  <RefreshCw className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Check className="w-3 h-3 text-slate-600 dark:text-slate-400" />
                                )}
                                <span>Mark Contacted</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={isUpdating}
                                onClick={() => handleUpdateStatus(req.request_id, 'Pending')}
                                className="px-3 py-1 text-xs font-normal rounded-full bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer inline-flex items-center gap-1.5"
                              >
                                {isUpdating ? (
                                  <RefreshCw className="w-3 h-3 animate-spin" />
                                ) : (
                                  <RotateCcw className="w-3 h-3 text-slate-400" />
                                )}
                                <span>Reset Pending</span>
                              </button>
                            )}

                            {req.phone_id && (
                              <button
                                type="button"
                                onClick={() => openPhoneDetailView(req.phone_id)}
                                className="px-3 py-1 text-xs font-normal rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer"
                              >
                                Manage Phone
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {allPagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200/80 dark:border-slate-800 text-xs text-slate-500 bg-slate-50/50 dark:bg-slate-950/30 font-normal">
                <span>
                  Page {allPagination.page} of {allPagination.totalPages} ({allPagination.total} total requests)
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={allPagination.page <= 1}
                    onClick={() => fetchAllRequests(allPagination.page - 1)}
                    className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-300 disabled:opacity-40 font-normal cursor-pointer"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={allPagination.page >= allPagination.totalPages}
                    onClick={() => fetchAllRequests(allPagination.page + 1)}
                    className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-300 disabled:opacity-40 font-normal cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      )}
    </div>
  );
}
