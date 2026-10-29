import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  MessageSquare,
  Search,
  Phone,
  AlertCircle,
  RefreshCw,
  X,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';
import { inquiryService } from '../services/inquiryService';
import { userService } from '../services/userService';

const STATUS_CONFIG = {
  New: { label: 'New', dot: 'text-rose-500' },
  'In Progress': { label: 'In Progress', dot: 'text-amber-500' },
  Contacted: { label: 'Contacted', dot: 'text-sky-500' },
  Closed: { label: 'Closed', dot: 'text-slate-400' },
};

export default function InquiriesPage() {
  const [inquiries, setInquiries] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal State
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [staffList, setStaffList] = useState([]);

  // Edit fields
  const [editStatus, setEditStatus] = useState('New');
  const [editAssignedStaff, setEditAssignedStaff] = useState('');

  // Load Inquiries
  const fetchInquiries = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await inquiryService.getInquiries({
        page: pagination.page,
        limit: pagination.limit,
        search: search.trim() || undefined,
        status: statusFilter || undefined,
      });

      if (res?.success) {
        setInquiries(res.data || []);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load inquiries.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, [pagination.page, statusFilter]);

  // Load staff list for assignment
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

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchInquiries();
  };

  const openDetailModal = (inq) => {
    setSelectedInquiry(inq);
    setEditStatus(inq.status || 'New');
    setEditAssignedStaff(inq.assigned_to_user_id ? String(inq.assigned_to_user_id) : '');
    setModalError('');
  };

  const handleUpdateStatus = async () => {
    if (!selectedInquiry) return;
    setModalLoading(true);
    setModalError('');

    try {
      const payload = {
        status: editStatus,
        assigned_to_user_id: editAssignedStaff ? Number(editAssignedStaff) : null,
      };

      const res = await inquiryService.updateInquiryStatus(selectedInquiry.inquiry_id, payload);
      if (res?.success) {
        setInquiries((prev) =>
          prev.map((item) =>
            item.inquiry_id === selectedInquiry.inquiry_id
              ? {
                  ...item,
                  ...res.data,
                  status: res.data.status,
                  assigned_staff: res.data.assigned_staff || item.assigned_staff,
                }
              : item
          )
        );
        setSelectedInquiry(null);
      }
    } catch (err) {
      setModalError(err.message || 'Failed to update inquiry status.');
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Page Title & Action Bar (Unified Standard) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3.5 border-b border-slate-200/80 dark:border-slate-800">
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
          Customer Inquiries & Leads
        </h1>

        <button
          onClick={fetchInquiries}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200/90 dark:border-slate-800 rounded-full transition-all shadow-2xs hover:border-slate-300 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : 'text-slate-400'}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-2xs">
        {/* Status Segmented Control */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-full">
          {['', 'New', 'In Progress', 'Contacted', 'Closed'].map((st) => (
            <button
              key={st}
              onClick={() => {
                setStatusFilter(st);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition-colors cursor-pointer ${
                statusFilter === st
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              {st === '' ? 'All' : st}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search customer / phone..."
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
      </div>

      {/* Error state */}
      {error && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2 rounded-xl">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Inquiries Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4 w-12">#</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Phone Number</th>
                <th className="py-3 px-4">Target Phone</th>
                <th className="py-3 px-4">Message</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Assigned</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-600" />
                    <span>Loading inquiries...</span>
                  </td>
                </tr>
              ) : inquiries.length > 0 ? (
                inquiries.map((inq) => {
                  const statusStyle = STATUS_CONFIG[inq.status] || STATUS_CONFIG.New;
                  const dateStr = new Date(inq.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <tr
                      key={inq.inquiry_id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono text-slate-400">#{inq.inquiry_id}</td>

                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                        {inq.customer_name || inq.name}
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                        <a href={`tel:${inq.phone_number}`} className="hover:underline text-blue-600 dark:text-blue-400">
                          {inq.phone_number}
                        </a>
                      </td>

                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                        {inq.selected_phone ? (
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {inq.selected_phone.name}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">General</span>
                        )}
                      </td>

                      <td className="py-3 px-4 max-w-xs truncate text-slate-500 dark:text-slate-400">
                        {inq.message}
                      </td>

                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                          <svg className={`w-2 h-2 shrink-0 ${statusStyle.dot}`} viewBox="0 0 10 10" fill="currentColor">
                            <circle cx="5" cy="5" r="4.5" />
                          </svg>
                          <span className="text-slate-700 dark:text-slate-300">{inq.status}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400 text-[11px]">
                        {inq.assigned_staff?.display_name || <span className="italic text-slate-400">Unassigned</span>}
                      </td>

                      <td className="py-3 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                        {dateStr}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => openDetailModal(inq)}
                          className="px-3 py-1 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-xs font-semibold transition-colors cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-400">
                    No inquiries found.
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

      {/* ── Slide-over Panel: Manage Inquiry (Opens from right side) ── */}
      {selectedInquiry && createPortal(
        <>
          <div
            className="fixed inset-0 z-[90] bg-slate-900/40 backdrop-blur-xs transition-opacity animate-fadeIn"
            onClick={() => setSelectedInquiry(null)}
          />
          <div className="fixed top-0 right-0 bottom-0 z-[100] w-full sm:w-[440px] bg-white dark:bg-slate-900 border-l border-slate-200/80 dark:border-slate-800 shadow-2xl flex flex-col justify-between overflow-hidden animate-slideInRight">
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                  Inquiry Details (#{selectedInquiry.inquiry_id})
                </h2>
              </div>
              <button
                onClick={() => setSelectedInquiry(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-4 sm:p-5 space-y-4 text-xs overflow-y-auto flex-1">
              {modalError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400 rounded-2xl">
                  {modalError}
                </div>
              )}

              {/* Customer info card */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl space-y-2">
                <div className="flex justify-between items-baseline">
                  <span className="font-bold text-slate-900 dark:text-white text-xs">
                    {selectedInquiry.customer_name || selectedInquiry.name}
                  </span>
                  <a
                    href={`tel:${selectedInquiry.phone_number}`}
                    className="text-blue-600 dark:text-blue-400 font-mono hover:underline font-semibold"
                  >
                    {selectedInquiry.phone_number}
                  </a>
                </div>

                {selectedInquiry.selected_phone && (
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                    Product Interest:{' '}
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {selectedInquiry.selected_phone.name} (Rs.{' '}
                      {Number(selectedInquiry.selected_phone.price).toLocaleString()})
                    </span>
                  </div>
                )}
              </div>

              {/* Message */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Customer Message:
                </label>
                <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {selectedInquiry.message}
                </div>
              </div>

              {/* Status & Staff update form */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2 text-xs text-slate-900 dark:text-white rounded-full cursor-pointer"
                  >
                    <option value="New">New</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Assign Staff Member
                  </label>
                  <select
                    value={editAssignedStaff}
                    onChange={(e) => setEditAssignedStaff(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2 text-xs text-slate-900 dark:text-white rounded-full cursor-pointer"
                  >
                    <option value="">Unassigned</option>
                    {staffList.map((u) => (
                      <option key={u.user_id} value={u.user_id}>
                        {u.display_name} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Pinned Footer */}
            <div className="p-4 sm:p-5 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 flex justify-end gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedInquiry(null)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-full font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={modalLoading}
                onClick={handleUpdateStatus}
                className="px-5 py-2 bg-[#2563eb] hover:bg-blue-700 text-white rounded-full font-semibold disabled:opacity-50 cursor-pointer shadow-xs text-xs"
              >
                {modalLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}