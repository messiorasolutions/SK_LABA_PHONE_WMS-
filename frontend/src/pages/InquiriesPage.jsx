import React, { useEffect, useState } from 'react';
import {
  MessageSquare,
  Search,
  Phone,
  AlertCircle,
  RefreshCw,
  X,
  Smartphone,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { inquiryService } from '../services/inquiryService';
import { userService } from '../services/userService';
import InquiryDetailView from '../components/Inquiries/InquiryDetailView';

const STATUS_CONFIG = {
  New: { label: 'New', dot: 'bg-rose-500' },
  'In Progress': { label: 'In Progress', dot: 'bg-amber-500' },
  Contacted: { label: 'Contacted', dot: 'bg-sky-500' },
  Closed: { label: 'Closed', dot: 'bg-slate-400' },
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

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [assignedStaffFilter, setAssignedStaffFilter] = useState('');

  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalSaving, setModalSaving] = useState(false);
  const [modalError, setModalError] = useState('');
  const [modalSuccess, setModalSuccess] = useState('');
  const [staffList, setStaffList] = useState([]);

  const [editStatus, setEditStatus] = useState('New');
  const [editAssignedStaff, setEditAssignedStaff] = useState('');

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

  const handleUpdateStatus = async () => {
    if (!selectedInquiry) return;
    setModalSaving(true);
    setModalError('');
    setModalSuccess('');

    try {
      const statusRes = await inquiryService.updateInquiryStatus(selectedInquiry.inquiry_id, editStatus);
      let updatedData = statusRes?.data || { ...selectedInquiry, status: editStatus };

      const currentAssignedId = selectedInquiry.assigned_to_user_id ? String(selectedInquiry.assigned_to_user_id) : '';
      const newAssignedId = editAssignedStaff ? String(editAssignedStaff) : '';

      if (currentAssignedId !== newAssignedId) {
        const assignRes = await inquiryService.assignStaff(selectedInquiry.inquiry_id, newAssignedId ? Number(newAssignedId) : null);
        if (assignRes?.data) {
          updatedData = assignRes.data;
        }
      }

      setSelectedInquiry(updatedData);
      setModalSuccess('Inquiry updated successfully.');

      setInquiries((prev) =>
        prev.map((item) =>
          item.inquiry_id === selectedInquiry.inquiry_id
            ? {
                ...item,
                status: editStatus,
                assigned_to_user_id: newAssignedId ? Number(newAssignedId) : null,
                assigned_staff: staffList.find((s) => s.user_id === Number(newAssignedId)) || null,
              }
            : item
        )
      );
    } catch (err) {
      setModalError(err.response?.data?.message || err.message || 'Failed to update inquiry.');
    } finally {
      setModalSaving(false);
    }
  };

  // ── Render Full Page View: Manage Inquiry ───────────────────────────
  if (selectedInquiry) {
    return (
      <div className="pb-12">
        <InquiryDetailView
          inquiry={selectedInquiry}
          onBack={() => setSelectedInquiry(null)}
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
      </div>
    );
  }

  // ── Main Inquiries Table View ───────────────────────────────────────
  return (
    <div className="space-y-5 pb-12">
      {/* ── Page Header ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div>
          <h1 className="text-xl font-normal text-slate-900 dark:text-white tracking-tight">
            Customer Inquiries
          </h1>
          <p className="text-xs font-normal text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time customer questions, general inquiries, and phone support requests (SRS MG-07)
          </p>
        </div>

        <button
          onClick={fetchInquiries}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-xs font-normal text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-2xs cursor-pointer"
          title="Refresh inquiries"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-rose-600' : 'text-slate-500'}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* ── Filters & Search ────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-2xs">
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-full">
          {['', 'New', 'In Progress', 'Contacted', 'Closed'].map((st) => (
            <button
              key={st}
              onClick={() => {
                setStatusFilter(st);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className={`px-3 py-1 text-xs font-normal rounded-full transition-colors cursor-pointer ${
                statusFilter === st
                  ? 'bg-slate-900 text-white dark:bg-rose-950/60 dark:text-rose-200 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              {st === '' ? 'All Inquiries' : st}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <select
            value={assignedStaffFilter}
            onChange={(e) => {
              setAssignedStaffFilter(e.target.value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            className="w-full sm:w-44 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-normal text-slate-700 dark:text-slate-300 rounded-full cursor-pointer focus:outline-none focus:ring-1 focus:ring-rose-500/30"
          >
            <option value="">All Assigned Staff</option>
            {staffList.map((u) => (
              <option key={u.user_id} value={u.user_id}>
                {u.display_name}
              </option>
            ))}
          </select>

          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1 sm:w-60">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search name or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-rose-500/30 pl-8 pr-3 py-1.5 text-xs font-normal text-slate-900 dark:text-white rounded-full transition-colors"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-1.5 bg-gradient-to-r from-black via-neutral-900 to-rose-950 hover:to-rose-900 text-white text-xs font-normal rounded-full border border-neutral-800 transition-all cursor-pointer shadow-xs"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400 text-xs font-normal flex items-center gap-2 rounded-xl">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Table View ──────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-normal">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 text-[10px] font-normal text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4 w-12">ID</th>
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
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-400 font-normal">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-rose-600" />
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
                      <td className="py-3 px-4 font-mono text-slate-500 font-normal">#{inq.inquiry_id}</td>

                      <td className="py-3 px-4 font-normal text-slate-900 dark:text-slate-100">
                        {inq.customer_name || inq.name}
                      </td>

                      <td className="py-3 px-4 font-mono font-normal text-slate-900 dark:text-slate-100">
                        {inq.phone_number}
                      </td>

                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-normal">
                        {inq.selected_phone ? (
                          <span className="truncate max-w-[150px] block font-normal">
                            {inq.selected_phone.name}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">General Inquiry</span>
                        )}
                      </td>

                      <td className="py-3 px-4 max-w-xs truncate text-slate-500 dark:text-slate-400 font-normal">
                        {inq.message}
                      </td>

                      <td className="py-3 px-4 font-normal">
                        <span className="inline-flex items-center gap-1.5 text-xs text-slate-900 dark:text-slate-100">
                          <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                          <span>{inq.status}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300 text-[11px] font-normal">
                        {inq.assigned_staff?.display_name || 'Unassigned'}
                      </td>

                      <td className="py-3 px-4 text-slate-400 text-[11px] whitespace-nowrap font-normal">
                        {formatDateTime(inq.created_at)}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => openDetailModal(inq)}
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
                  <td colSpan="9" className="py-12 text-center text-slate-400 font-normal">
                    No inquiries found matching criteria.
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
