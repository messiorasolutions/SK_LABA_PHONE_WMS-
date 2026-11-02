import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import {
  BellRing,
  Search,
  Phone as PhoneIcon,
  Mail,
  User,
  Users,
  AlertCircle,
  RefreshCw,
  X,
  Smartphone,
  CheckCircle2,
  Clock,
  MessageCircle,
  ExternalLink,
  ChevronRight,
  Filter,
  Check,
  Send,
  UserCheck,
} from 'lucide-react';
import { backInStockService } from '../services/backInStockService';
import { userService } from '../services/userService';

const STATUS_CONFIG = {
  Pending: {
    label: 'Pending',
    badge: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-900',
    dot: 'bg-amber-500',
  },
  Contacted: {
    label: 'Contacted',
    badge: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400 border-sky-200 dark:border-sky-900',
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

  // Drawer for Phone Waiting Customers (PDF API 3)
  const [phoneDrawerOpen, setPhoneDrawerOpen] = useState(false);
  const [selectedPhoneData, setSelectedPhoneData] = useState(null);
  const [phoneDrawerLoading, setPhoneDrawerLoading] = useState(false);
  const [phoneDrawerStatusFilter, setPhoneDrawerStatusFilter] = useState(''); // '' for all, or 'Pending'/'Contacted'

  // Action status message
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  // Load Staff List
  useEffect(() => {
    userService
      .getUsers({ limit: 100, is_active: true })
      .then((res) => {
        if (res?.success && Array.isArray(res.data)) {
          setStaffList(res.data);
        }
      })
      .catch((err) => console.warn('Could not load staff list:', err));
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

      const phonesList = res?.data?.phones || (Array.isArray(res?.data) ? res.data : []);
      setGroupedPhones(phonesList);

      const pag = res?.pagination || res?.data?.pagination;
      if (pag) {
        setGroupedPagination({
          page: Number(pag.page) || page,
          limit: Number(pag.limit) || 12,
          total: Number(pag.total) || phonesList.length,
          totalPages: Number(pag.totalPages) || 1,
        });
      }
    } catch (err) {
      console.error('Error fetching grouped back-in-stock requests:', err);
      setActionError(err.message || 'Failed to load grouped requests.');
    } finally {
      setGroupedLoading(false);
    }
  };

  // Fetch All Flat Requests
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

  // Open waiting customer drawer for a specific phone
  const openPhoneWaitingDrawer = async (phoneId) => {
    setPhoneDrawerOpen(true);
    setPhoneDrawerLoading(true);
    try {
      const res = await backInStockService.getWaitingCustomersForPhone(phoneId, {
        status: phoneDrawerStatusFilter || undefined,
      });
      setSelectedPhoneData(res?.data || null);
    } catch (err) {
      console.error('Error fetching phone waiting customers:', err);
      setActionError(err.message || 'Failed to load waiting customers for this phone.');
    } finally {
      setPhoneDrawerLoading(false);
    }
  };

  // Check URL parameter `?phone_id=...`
  useEffect(() => {
    if (phoneIdParam) {
      openPhoneWaitingDrawer(phoneIdParam);
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

  // Mark Request as Contacted
  const handleMarkContacted = async (requestId) => {
    setUpdatingId(requestId);
    setActionError('');
    try {
      await backInStockService.markAsContacted(requestId, 'Contacted');
      setActionSuccess('Marked customer as Contacted successfully!');
      setTimeout(() => setActionSuccess(''), 3500);

      // Refresh in-drawer phone data if open
      if (selectedPhoneData?.phone?.phone_id) {
        const res = await backInStockService.getWaitingCustomersForPhone(
          selectedPhoneData.phone.phone_id,
          { status: phoneDrawerStatusFilter || undefined }
        );
        setSelectedPhoneData(res?.data || null);
      }

      // Refresh active view
      if (activeTab === 'grouped') {
        fetchGroupedPhones(groupedPagination.page);
      } else {
        fetchAllRequests(allPagination.page);
      }
    } catch (err) {
      console.error('Error marking contacted:', err);
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

      // Refresh in-drawer phone data if open
      if (selectedPhoneData?.phone?.phone_id) {
        const res = await backInStockService.getWaitingCustomersForPhone(
          selectedPhoneData.phone.phone_id,
          { status: phoneDrawerStatusFilter || undefined }
        );
        setSelectedPhoneData(res?.data || null);
      }

      // Refresh active view
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


  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3.5 border-b border-slate-200/80 dark:border-slate-800">
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
          Back-in-Stock Requests
        </h1>

        <button
          type="button"
          onClick={() => (activeTab === 'grouped' ? fetchGroupedPhones(groupedPagination.page) : fetchAllRequests(allPagination.page))}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200/90 dark:border-slate-800 rounded-full transition-all shadow-2xs hover:border-slate-300 cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${groupedLoading || allLoading ? 'animate-spin text-blue-600' : 'text-slate-400'}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Notifications */}
      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {actionError && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
          <span>{actionError}</span>
        </div>
      )}


      {/* Tabs and Controls Bar (Customer Inquiries Style) */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-2xs">
        {/* Tab Switcher */}
        <div className="flex flex-wrap items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl sm:rounded-full">
          <button
            type="button"
            onClick={() => setActiveTab('grouped')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-colors cursor-pointer ${
              activeTab === 'grouped'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-bold'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            Grouped by Phone ({groupedPagination.total || groupedPhones.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-colors cursor-pointer ${
              activeTab === 'all'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-bold'
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
                onChange={(e) => {
                  setAssignedStaffFilter(e.target.value);
                  setAllPagination((p) => ({ ...p, page: 1 }));
                }}
                className="w-full sm:w-44 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 rounded-full cursor-pointer focus:outline-none focus:border-blue-500"
              >
                <option value="">All Assigned Staff</option>
                {staffList.map((st) => (
                  <option key={st.user_id} value={st.user_id}>
                    {st.display_name || st.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                if (activeTab === 'grouped') {
                  setGroupedPagination((p) => ({ ...p, page: 1 }));
                } else {
                  setAllPagination((p) => ({ ...p, page: 1 }));
                }
              }}
              className="w-full sm:w-36 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 rounded-full cursor-pointer focus:outline-none focus:border-blue-500"
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
      </div>

      {/* Main Tab Content */}
      {activeTab === 'grouped' ? (
        /* ================= TAB 1: GROUPED BY PHONE ================= */
        groupedLoading ? (
          <div className="py-20 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#2563EB]" />
            <p className="text-xs font-medium">Loading grouped phone requests...</p>
          </div>
        ) : groupedPhones.length === 0 ? (
          <div className="py-20 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <BellRing className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">No Back-in-Stock Requests Found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              There are currently no sold-out phones with customers waiting on alerts.
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
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
                              <span className="font-semibold text-slate-900 dark:text-white block truncate max-w-[220px]">
                                {phone.phone_name}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-medium">
                          {isSoldOut ? '0 units' : `${phone.current_stock} units`}
                        </td>

                        <td className="py-3 px-4 text-center font-semibold text-slate-900 dark:text-white">
                          {waitingCount}
                        </td>

                        <td className="py-3 px-4 text-center text-slate-600 dark:text-slate-400 font-medium">
                          {phone.pending_requests_count ?? 0}
                        </td>

                        <td className="py-3 px-4 text-center text-slate-600 dark:text-slate-400 font-medium">
                          {phone.contacted_requests_count ?? 0}
                        </td>

                        <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
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
                            onClick={() => openPhoneWaitingDrawer(phone.phone_id)}
                            className="px-3 py-1 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 rounded-full text-xs font-semibold transition-colors cursor-pointer border border-blue-200 dark:border-blue-900"
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
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200/80 dark:border-slate-800 text-xs text-slate-500 bg-slate-50/50 dark:bg-slate-950/30">
                <span>
                  Page {groupedPagination.page} of {groupedPagination.totalPages} ({groupedPagination.total} total phone models)
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={groupedPagination.page <= 1}
                    onClick={() => fetchGroupedPhones(groupedPagination.page - 1)}
                    className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-300 disabled:opacity-40 font-semibold cursor-pointer"
                  >
                    Previous
                  </button>
                  <button
                    disabled={groupedPagination.page >= groupedPagination.totalPages}
                    onClick={() => fetchGroupedPhones(groupedPagination.page + 1)}
                    className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-300 disabled:opacity-40 font-semibold cursor-pointer"
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
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#2563EB]" />
            <p className="text-xs font-medium">Loading requests list...</p>
          </div>
        ) : allRequests.length === 0 ? (
          <div className="py-20 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <BellRing className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">No Requests Matching Filter</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Try adjusting your search keywords or status filter.
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
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
                    const cleanPhone = (req.phone_number || '').replace(/\D/g, '');
                    return (
                      <tr key={req.request_id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-4 py-3.5">
                          <span className="font-semibold text-slate-900 dark:text-white block">
                            {req.customer_name}
                          </span>
                        </td>

                        <td className="px-4 py-3.5">
                          <a
                            href={`tel:${req.phone_number}`}
                            className="font-mono text-blue-600 dark:text-blue-400 hover:underline font-medium"
                            title="Call customer"
                          >
                            {req.phone_number}
                          </a>
                        </td>

                        <td className="px-4 py-3.5">
                          <span className="font-semibold text-slate-900 dark:text-white block">
                            {req.phone?.name || req.phone_name || (req.phone_id ? `Phone ${req.phone_id}` : 'Phone')}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 max-w-[200px]">
                          {req.notes ? (
                            <span className="text-slate-600 dark:text-slate-300 line-clamp-2" title={req.notes}>
                              {req.notes}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">No notes</span>
                          )}
                        </td>

                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${statusObj.badge}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${statusObj.dot}`} />
                            <span>{statusObj.label}</span>
                          </span>
                          {req.contacted_at && (
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              {formatDateTime(req.contacted_at)}
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3.5">
                          <select
                            value={req.assigned_to_user_id || ''}
                            disabled={updatingId === req.request_id}
                            onChange={(e) => handleAssignStaff(req.request_id, e.target.value)}
                            className="text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
                          >
                            <option value="" className="text-slate-500 bg-white dark:bg-slate-800">Unassigned</option>
                            {staffList.map((st) => (
                              <option key={st.user_id} value={st.user_id} className="text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800">
                                {st.display_name || st.name || st.email || `Staff ${st.user_id}`} {st.role ? `(${st.role})` : ''}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap">
                          {formatDateTime(req.created_at)}
                        </td>

                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          {req.status === 'Pending' ? (
                            <button
                              type="button"
                              disabled={updatingId === req.request_id}
                              onClick={() => handleMarkContacted(req.request_id)}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800 transition-colors cursor-pointer inline-flex items-center gap-1.5"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Mark Contacted</span>
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400 font-medium">Completed</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {allPagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200/80 dark:border-slate-800 text-xs text-slate-500 bg-slate-50/50 dark:bg-slate-950/30">
                <span>
                  Page {allPagination.page} of {allPagination.totalPages} ({allPagination.total} total requests)
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={allPagination.page <= 1}
                    onClick={() => fetchAllRequests(allPagination.page - 1)}
                    className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-300 disabled:opacity-40 font-semibold cursor-pointer"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={allPagination.page >= allPagination.totalPages}
                    onClick={() => fetchAllRequests(allPagination.page + 1)}
                    className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-300 disabled:opacity-40 font-semibold cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      )}

      {/* ================= SLIDE-OVER DRAWER: WAITING CUSTOMERS FOR A PHONE (PDF API 3) ================= */}
      {phoneDrawerOpen &&
        createPortal(
          <div className="fixed inset-0 z-[100] overflow-hidden bg-slate-950/60 backdrop-blur-sm transition-opacity duration-300 flex justify-end">
            {/* Click outside to close */}
            <div
              className="absolute inset-0 cursor-pointer"
              onClick={() => {
                setPhoneDrawerOpen(false);
                if (phoneIdParam) setSearchParams({});
              }}
            />

            {/* Slide Drawer Panel */}
            <div className="relative w-full sm:w-[540px] md:w-[600px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl h-full flex flex-col z-10 animate-in slide-in-from-right duration-300">
              {/* Header: Phone Details & Close Button */}
              <div className="p-4 sm:p-5 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 flex items-center justify-between shrink-0">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight">
                    {selectedPhoneData?.phone?.name || 'Waiting Customers'}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      Total Waiting:{' '}
                      <strong className="text-slate-900 dark:text-white font-bold">
                        {selectedPhoneData?.waiting_customers_count ?? (selectedPhoneData?.waiting_customers || selectedPhoneData?.requests)?.length ?? 0}
                      </strong>
                    </span>
                    {selectedPhoneData?.phone && (
                      <span className="text-xs text-slate-400">
                        • {selectedPhoneData.phone.current_stock > 0 ? `Stock: ${selectedPhoneData.phone.current_stock}` : 'Sold Out'}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setPhoneDrawerOpen(false);
                    if (phoneIdParam) setSearchParams({});
                  }}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="overflow-y-auto p-5 sm:p-6 flex-1 space-y-4">
                {(() => {
                  const customerList = selectedPhoneData?.waiting_customers || selectedPhoneData?.requests || [];
                  if (phoneDrawerLoading) {
                    return (
                      <div className="py-20 text-center text-slate-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#2563EB]" />
                        <p className="text-xs">Loading customer list...</p>
                      </div>
                    );
                  }
                  if (customerList.length === 0) {
                    return (
                      <div className="py-12 text-center text-slate-400">
                        <p className="text-xs">No waiting customers found.</p>
                      </div>
                    );
                  }
                  return (
                    <div className="space-y-3.5">
                      {customerList.map((item) => {
                        const cleanPhone = (item.phone_number || '').replace(/\D/g, '');
                        const isPending = item.status === 'Pending';
                        return (
                        <div
                          key={item.request_id}
                          className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3"
                        >
                          {/* Row 1: Customer Name and Status */}
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-slate-900 dark:text-white">
                                  {item.customer_name}
                                </span>
                              </div>
                              <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                                <Clock className="w-3 h-3" />
                                {formatDateTime(item.created_at)}
                              </span>
                            </div>

                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                                isPending
                                  ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-900'
                                  : 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400 border-sky-200 dark:border-sky-900'
                              }`}
                            >
                              {item.status}
                            </span>
                          </div>

                          {/* Row 2: Contact Links */}
                          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                            <a
                              href={`tel:${item.phone_number}`}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-blue-600 font-medium font-mono"
                            >
                              <PhoneIcon className="w-3.5 h-3.5 text-blue-500" />
                              <span>{item.phone_number}</span>
                            </a>

                            {cleanPhone && (
                              <a
                                href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                                  `Hi ${item.customer_name}, good news from SK LABA PHONE! The ${selectedPhoneData?.phone?.name || 'phone'} you requested is now back in stock.`
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 font-medium"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                                <span>WhatsApp Message</span>
                              </a>
                            )}

                            {item.email && (
                              <a
                                href={`mailto:${item.email}`}
                                className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                              >
                                <Mail className="w-3.5 h-3.5" />
                                <span>{item.email}</span>
                              </a>
                            )}
                          </div>

                          {/* Customer note / variant preference */}
                          {item.notes && (
                            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-300">
                              <span className="font-semibold text-slate-500 dark:text-slate-400 mr-1.5">Note:</span>
                              <span>{item.notes}</span>
                            </div>
                          )}

                          {/* Bottom Action: Assignment and Mark as Contacted */}
                          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 gap-2">
                            <div className="flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-slate-400" />
                              <select
                                value={item.assigned_to_user_id || ''}
                                disabled={updatingId === item.request_id}
                                onChange={(e) => handleAssignStaff(item.request_id, e.target.value)}
                                className="text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
                              >
                                <option value="" className="text-slate-500 bg-white dark:bg-slate-800">Assign Staff</option>
                                {staffList.map((st) => (
                                  <option key={st.user_id} value={st.user_id} className="text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800">
                                    {st.display_name || st.name || st.email || `Staff ${st.user_id}`} {st.role ? `(${st.role})` : ''}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {isPending && (
                              <button
                                type="button"
                                disabled={updatingId === item.request_id}
                                onClick={() => handleMarkContacted(item.request_id)}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-50"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Mark as Contacted</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
