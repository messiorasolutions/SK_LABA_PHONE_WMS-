import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  MessageSquare,
  Search,
  Phone,
  AlertCircle,
  RefreshCw,
  X,
  Smartphone,
  CheckCircle2,
  Send,
} from 'lucide-react';
import { inquiryService } from '../services/inquiryService';
import { userService } from '../services/userService';

const STATUS_CONFIG = {
  New: { label: 'New', dot: 'bg-rose-500 text-rose-500', badge: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-900' },
  'In Progress': { label: 'In Progress', dot: 'bg-amber-500 text-amber-500', badge: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-900' },
  Contacted: { label: 'Contacted', dot: 'bg-sky-500 text-sky-500', badge: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400 border-sky-200 dark:border-sky-900' },
  Closed: { label: 'Closed', dot: 'bg-slate-400 text-slate-400', badge: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700' },
};

/**
 * Robust date-time formatter that correctly interprets UTC timestamps from backend
 * and displays them in the user's local timezone (e.g. Asia/Colombo, IST, etc.)
 */
function formatDateTime(dateInput) {
  if (!dateInput) return '-';
  let date;

  if (dateInput instanceof Date) {
    date = dateInput;
  } else {
    let str = String(dateInput).trim();
    // If string doesn't have a timezone specifier ('Z' or '+/-HH:MM'),
    // it was saved as UTC by MySQL. Treat it as UTC by appending 'Z'.
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
    hour12: true,
  });
}

export default function InquiriesPage() {
  const [inquiries, setInquiries] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [assignedStaffFilter, setAssignedStaffFilter] = useState('');

  // Detail / Manage Drawer State
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalSaving, setModalSaving] = useState(false);
  const [modalError, setModalError] = useState('');
  const [modalSuccess, setModalSuccess] = useState('');
  const [staffList, setStaffList] = useState([]);

  // Edit fields
  const [editStatus, setEditStatus] = useState('New');
  const [editAssignedStaff, setEditAssignedStaff] = useState('');

  // Load Inquiries matching PDF specs (GET /api/inquiries)
  const fetchInquiries = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await inquiryService.getInquiries({
        page: pagination.page,
        limit: pagination.limit,
        search: search.trim() || undefined,
        status: statusFilter || undefined,
        assigned_to_user_id: assignedStaffFilter ? Number(assignedStaffFilter) : undefined,
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
  }, [pagination.page, statusFilter, assignedStaffFilter]);

  // Load active staff members for assignment (PDF Section 4)
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

  // Open Manage Drawer & Fetch fresh details (PDF Endpoint 3: GET /api/inquiries/:id)
  const openDetailModal = async (inq) => {
    setSelectedInquiry(inq);
    setEditStatus(inq.status || 'New');
    setEditAssignedStaff(inq.assigned_to_user_id ? String(inq.assigned_to_user_id) : '');
    setModalError('');
    setModalSuccess('');
    setModalLoading(true);

    try {
      const detailRes = await inquiryService.getInquiryById(inq.inquiry_id);
      if (detailRes?.success && detailRes.data) {
        setSelectedInquiry(detailRes.data);
        setEditStatus(detailRes.data.status || 'New');
        setEditAssignedStaff(detailRes.data.assigned_to_user_id ? String(detailRes.data.assigned_to_user_id) : '');
      }
    } catch (err) {
      console.warn('Could not fetch latest details, displaying cached row:', err);
    } finally {
      setModalLoading(false);
    }
  };

  // Update Status & Staff Assignment (PDF Endpoint 4: PATCH /api/inquiries/:id/status)
  const handleUpdateStatus = async () => {
    if (!selectedInquiry) return;
    setModalSaving(true);
    setModalError('');
    setModalSuccess('');

    try {
      const payload = {
        status: editStatus,
        assigned_to_user_id: editAssignedStaff ? Number(editAssignedStaff) : null,
      };

      const res = await inquiryService.updateInquiryStatus(selectedInquiry.inquiry_id, payload);
      if (res?.success) {
        setModalSuccess('Inquiry updated successfully!');
        const updatedData = res.data;

        // Update local list
        setInquiries((prev) =>
          prev.map((item) =>
            item.inquiry_id === selectedInquiry.inquiry_id
              ? {
                  ...item,
                  ...updatedData,
                  status: updatedData.status,
                  assigned_to_user_id: updatedData.assigned_to_user_id,
                  assigned_staff: updatedData.assigned_staff || item.assigned_staff,
                  updated_by_staff: updatedData.updated_by_staff || item.updated_by_staff,
                  updated_at: updatedData.updated_at,
                }
              : item
          )
        );

        setSelectedInquiry((prev) => ({
          ...prev,
          ...updatedData,
          status: updatedData.status,
          assigned_to_user_id: updatedData.assigned_to_user_id,
          assigned_staff: updatedData.assigned_staff || prev?.assigned_staff,
          updated_by_staff: updatedData.updated_by_staff || prev?.updated_by_staff,
          updated_at: updatedData.updated_at,
        }));

        setTimeout(() => {
          setSelectedInquiry(null);
        }, 800);
      }
    } catch (err) {
      setModalError(err.message || 'Failed to update inquiry status.');
    } finally {
      setModalSaving(false);
    }
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Page Title & Action Bar (Clean & Professional) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3.5 border-b border-slate-200/80 dark:border-slate-800">
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none flex items-center gap-2.5">
          <MessageSquare className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          <span>Customer Inquiries & Leads</span>
        </h1>

        <button
          onClick={fetchInquiries}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200/90 dark:border-slate-800 rounded-full transition-all shadow-2xs hover:border-slate-300 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : 'text-slate-400'}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Tabs & Search Controls (PDF Query Parameters) */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-2xs">
        {/* Status Segmented Control */}
        <div className="flex flex-wrap items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl sm:rounded-full">
          {['', 'New', 'In Progress', 'Contacted', 'Closed'].map((st) => (
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
              {st === '' ? 'All Inquiries' : st}
            </button>
          ))}
        </div>

        {/* Assigned Staff Filter & Search Input */}
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
            <div className="relative flex-1 sm:w-60">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search name or phone..."
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
                <th className="py-3 px-4">Assigned Staff</th>
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

                  return (
                    <tr
                      key={inq.inquiry_id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono text-slate-400 font-semibold">#{inq.inquiry_id}</td>

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
                          <div className="flex items-center gap-1.5">
                            <Smartphone className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                            <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[150px]">
                              {inq.selected_phone.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">General Inquiry</span>
                        )}
                      </td>

                      <td className="py-3 px-4 max-w-xs truncate text-slate-500 dark:text-slate-400">
                        {inq.message}
                      </td>

                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${statusStyle.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                          <span>{inq.status}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400 text-[11px]">
                        {inq.assigned_staff?.display_name ? (
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {inq.assigned_staff.display_name}
                          </span>
                        ) : (
                          <span className="italic text-slate-400">Unassigned</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                        {formatDateTime(inq.created_at)}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => openDetailModal(inq)}
                          className="px-3 py-1 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 rounded-full text-xs font-semibold transition-colors cursor-pointer border border-blue-200 dark:border-blue-900"
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
                    No inquiries found matching criteria.
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
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} total inquiries)
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
          <div className="fixed top-0 right-0 bottom-0 z-[100] w-full sm:w-[480px] bg-white dark:bg-slate-900 border-l border-slate-200/80 dark:border-slate-800 shadow-2xl flex flex-col justify-between overflow-hidden animate-slideInRight">
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <MessageSquare className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                    Inquiry #{selectedInquiry.inquiry_id}
                  </h2>
                  <span className="text-[11px] text-slate-400">
                    Received {formatDateTime(selectedInquiry.created_at)}
                  </span>
                </div>
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

              {/* Customer info card */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl space-y-2.5">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Customer</span>
                    <span className="font-bold text-slate-900 dark:text-white text-sm">
                      {selectedInquiry.customer_name || selectedInquiry.name}
                    </span>
                  </div>

                  {/* Direct Contact Actions */}
                  <div className="flex items-center gap-2">
                    <a
                      href={`tel:${selectedInquiry.phone_number}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-blue-600 dark:text-blue-400 rounded-full font-semibold hover:bg-blue-50 text-[11px]"
                      title="Call customer"
                    >
                      <Phone className="w-3 h-3" />
                      <span>Call</span>
                    </a>
                    <a
                      href={`https://wa.me/${selectedInquiry.phone_number.replace(/\D/g, '')}`}
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
                  {selectedInquiry.phone_number}
                </div>
              </div>

              {/* Targeted Phone Card (if linked) */}
              {selectedInquiry.selected_phone ? (
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl space-y-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                    Product of Interest
                  </span>
                  <div className="flex items-center gap-3">
                    {selectedInquiry.selected_phone.photos?.[0] ? (
                      <img
                        src={selectedInquiry.selected_phone.photos[0]}
                        alt={selectedInquiry.selected_phone.name}
                        className="w-12 h-12 object-contain bg-white dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-500 flex items-center justify-center shrink-0">
                        <Smartphone className="w-5 h-5" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-slate-900 dark:text-white truncate">
                        {selectedInquiry.selected_phone.name}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                        <span className="font-semibold text-blue-600 dark:text-blue-400">
                          Rs. {Number(selectedInquiry.selected_phone.price).toLocaleString()}
                        </span>
                        {selectedInquiry.selected_phone.availability && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[10px] font-medium">
                            {selectedInquiry.selected_phone.availability}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/20 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 italic text-[11px]">
                  General Store Inquiry (No specific phone attached)
                </div>
              )}

              {/* Customer Message */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">
                  Customer Message
                </label>
                <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap select-text">
                  {selectedInquiry.message}
                </div>
              </div>

              {/* Status & Staff Update Form (PDF Endpoint 4) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Inquiry Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2 text-xs text-slate-900 dark:text-white rounded-xl cursor-pointer focus:outline-none focus:border-blue-500"
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
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2 text-xs text-slate-900 dark:text-white rounded-xl cursor-pointer focus:outline-none focus:border-blue-500"
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

              {/* Audit Information (PDF Note on updated_by_staff) */}
              {selectedInquiry.updated_by_staff && (
                <div className="pt-2 text-[10px] text-slate-400 border-t border-slate-200/60 dark:border-slate-800">
                  Last updated by{' '}
                  <span className="font-semibold text-slate-600 dark:text-slate-300">
                    {selectedInquiry.updated_by_staff.display_name}
                  </span>{' '}
                  ({selectedInquiry.updated_by_staff.email}) on{' '}
                  {formatDateTime(selectedInquiry.updated_at)}
                </div>
              )}
            </div>

            {/* Pinned Footer */}
            <div className="p-4 sm:p-5 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 flex justify-end gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedInquiry(null)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-full font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-xs"
              >
                Close
              </button>
              <button
                type="button"
                disabled={modalSaving}
                onClick={handleUpdateStatus}
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
