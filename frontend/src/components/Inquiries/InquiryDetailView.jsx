import React from 'react';
import {
  ArrowLeft,
  MessageSquare,
  Phone,
  Mail,
  Smartphone,
  Calendar,
  Send,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  User,
} from 'lucide-react';

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
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export default function InquiryDetailView({
  inquiry,
  onBack,
  editStatus,
  setEditStatus,
  editAssignedStaff,
  setEditAssignedStaff,
  staffList = [],
  onSave,
  saving = false,
  error = '',
  success = '',
}) {
  if (!inquiry) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ── Top Breadcrumb Navigation ─────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          type="button"
          className="inline-flex items-center gap-2 text-xs font-normal text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Customer Inquiries</span>
        </button>
        <span className="text-xs font-normal text-slate-400">
          Inquiry Management (SRS MG-07)
        </span>
      </div>

      {/* ── Page Header ──────────────────────────────────────────────── */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 flex items-center justify-center text-rose-600 dark:text-rose-400">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-normal text-slate-900 dark:text-white tracking-tight">
              Inquiry #{inquiry.inquiry_id}
            </h1>
            <p className="text-xs font-normal text-slate-500 dark:text-slate-400 mt-0.5">
              From {inquiry.customer_name || inquiry.name} · Received on {formatDateTime(inquiry.created_at)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onBack}
            className="px-4 py-2 text-xs font-normal rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Back to List
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-normal rounded-full bg-gradient-to-r from-black via-neutral-900 to-rose-950 hover:to-rose-900 text-white border border-neutral-800 transition-all cursor-pointer shadow-xs disabled:opacity-50"
          >
            {saving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-xs font-normal text-rose-700 dark:text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs font-normal text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* ── Main Details Layout ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Customer & Message details */}
        <div className="lg:col-span-2 space-y-5">
          {/* Customer Card */}
          <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
            <div className="text-xs font-normal text-slate-700 dark:text-slate-300">
              Customer Information
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="text-[11px] font-normal text-slate-400 block">Full Name</span>
                <span className="text-sm font-normal text-slate-900 dark:text-white">
                  {inquiry.customer_name || inquiry.name}
                </span>
              </div>

              <div>
                <span className="text-[11px] font-normal text-slate-400 block">Phone Number</span>
                <div className="flex items-center gap-3 mt-1">
                  <span className="font-mono text-xs font-normal text-slate-900 dark:text-white">
                    {inquiry.phone_number}
                  </span>
                  <a
                    href={`tel:${inquiry.phone_number}`}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-normal hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <Phone className="w-3 h-3" />
                    <span>Call</span>
                  </a>
                  <a
                    href={`https://wa.me/${inquiry.phone_number.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-normal hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <Send className="w-3 h-3" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>

              <div>
                <span className="text-[11px] font-normal text-slate-400 block">Email Address</span>
                <span className="text-xs font-normal text-slate-800 dark:text-slate-200">
                  {inquiry.email || '—'}
                </span>
              </div>

              <div>
                <span className="text-[11px] font-normal text-slate-400 block">Received At</span>
                <span className="text-xs font-normal text-slate-800 dark:text-slate-200">
                  {formatDateTime(inquiry.created_at)}
                </span>
              </div>
            </div>
          </div>

          {/* Customer Message Card */}
          <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
            <div className="text-xs font-normal text-slate-700 dark:text-slate-300">
              Inquiry Message & Questions
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs font-normal text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line">
              {inquiry.message || 'No written message provided.'}
            </div>
          </div>

          {/* Target Phone Card (if linked) */}
          {inquiry.selected_phone && (
            <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
              <div className="text-xs font-normal text-slate-700 dark:text-slate-300">
                Smartphone of Interest
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center font-normal shrink-0 border border-slate-200 dark:border-slate-700">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-normal text-slate-900 dark:text-white">
                    {inquiry.selected_phone.name}
                  </div>
                  <div className="text-xs font-normal text-slate-400 mt-0.5">
                    ${Number(inquiry.selected_phone.price || 0).toLocaleString()} · {inquiry.selected_phone.brand_name || 'Brand'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right 1 Col: Status & Assignment */}
        <div className="space-y-5">
          <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
            <div className="text-xs font-normal text-slate-700 dark:text-slate-300">
              Inquiry Status & Response
            </div>

            <div>
              <label className="block text-xs font-normal text-slate-700 dark:text-slate-300 mb-1.5">
                Current Status
              </label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-normal text-slate-900 dark:text-white focus:outline-none focus:border-neutral-500 cursor-pointer"
              >
                <option value="New">New</option>
                <option value="In Progress">In Progress</option>
                <option value="Contacted">Contacted</option>
                <option value="Closed">Closed</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-normal text-slate-700 dark:text-slate-300 mb-1.5">
                Assigned Staff Member
              </label>
              <select
                value={editAssignedStaff}
                onChange={(e) => setEditAssignedStaff(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-normal text-slate-900 dark:text-white focus:outline-none focus:border-neutral-500 cursor-pointer"
              >
                <option value="">Unassigned</option>
                {staffList.map((u) => (
                  <option key={u.user_id} value={u.user_id}>
                    {u.display_name} ({u.role})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={onSave}
              disabled={saving}
              className="w-full py-2.5 px-4 text-xs font-normal rounded-full bg-gradient-to-r from-black via-neutral-900 to-rose-950 hover:to-rose-900 text-white border border-neutral-800 transition-all cursor-pointer disabled:opacity-50 shadow-xs flex items-center justify-center gap-2"
            >
              {saving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>{saving ? 'Saving...' : 'Update Inquiry'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

