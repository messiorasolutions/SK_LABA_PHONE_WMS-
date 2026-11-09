import React from 'react';
import {
  ArrowLeft,
  Mail,
  Smartphone,
  Calendar,
  CalendarClock,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  User,
  Truck,
  MapPin,
  Building,
  Phone,
} from 'lucide-react';

const ALL_STATUSES = [
  'Pending',
  'Confirmed',
  'Payment Received',
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
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
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

export default function ReservationDetailView({
  reservation,
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
  if (!reservation) return null;

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
          <span>Back to Customer Reservations</span>
        </button>
        <span className="text-xs font-normal text-slate-400">
          Reservation Management
        </span>
      </div>

      {/* ── Page Header ──────────────────────────────────────────────── */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 flex items-center justify-center text-rose-600 dark:text-rose-400">
            <CalendarClock className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-normal text-slate-900 dark:text-white tracking-tight">
              Reservation
            </h1>
            <p className="text-xs font-normal text-slate-500 dark:text-slate-400 mt-0.5">
              Received on {formatDateTime(reservation.created_at)} · Customer: {reservation.customer_name}
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
        {/* Left 2 Cols: Customer & Device Overview */}
        <div className="lg:col-span-2 space-y-5">
          {/* Customer Information Card */}
          <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
            <div className="text-xs font-normal text-slate-700 dark:text-slate-300">
              Customer Information
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="text-[11px] font-normal text-slate-400 block">Full Name</span>
                <span className="text-sm font-normal text-slate-900 dark:text-white">
                  {reservation.customer_name}
                </span>
              </div>

              <div>
                <span className="text-[11px] font-normal text-slate-400 block">Phone Number</span>
                <span className="font-mono text-xs font-normal text-slate-900 dark:text-white block mt-0.5">
                  {reservation.phone_number}
                </span>
              </div>

              <div>
                <span className="text-[11px] font-normal text-slate-400 block">Email Address</span>
                <span className="text-xs font-normal text-slate-800 dark:text-slate-200">
                  {reservation.email || '—'}
                </span>
              </div>

              <div>
                <span className="text-[11px] font-normal text-slate-400 block">Preferred Collection Date</span>
                <div className="flex items-center gap-1.5 mt-0.5 text-xs font-normal text-slate-800 dark:text-slate-200">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{formatCollectionDate(reservation.preferred_collection_date)}</span>
                </div>
              </div>
            </div>

            {reservation.customer_note && (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[11px] font-normal text-slate-400 block mb-1">Customer Note</span>
                <p className="text-xs font-normal text-slate-600 dark:text-slate-300 italic bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                  &ldquo;{reservation.customer_note}&rdquo;
                </p>
              </div>
            )}
          </div>

          {/* Reserved Smartphone Card */}
          <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
            <div className="text-xs font-normal text-slate-700 dark:text-slate-300">
              Reserved Smartphone Details
            </div>

            {reservation.selected_phone ? (
              <div className="flex items-center gap-4">
                {reservation.selected_phone.photos?.[0] ? (
                  <img
                    src={reservation.selected_phone.photos[0]}
                    alt={reservation.selected_phone.name}
                    className="w-16 h-16 rounded-xl object-contain bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1 shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center font-normal shrink-0 border border-slate-200 dark:border-slate-700">
                    <Smartphone className="w-6 h-6" />
                  </div>
                )}
                <div>
                  <div className="text-base font-normal text-slate-900 dark:text-white">
                    {reservation.selected_phone.name}
                  </div>
                  <div className="text-xs font-normal text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap items-center gap-2">
                    <span>${Number(reservation.selected_phone.price || 0).toLocaleString()}</span>
                    {reservation.selected_options?.colour && (
                      <span>· Color: {reservation.selected_options.colour}</span>
                    )}
                    {reservation.selected_phone.phone_condition && (
                      <span>· Condition: {reservation.selected_phone.phone_condition}</span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-xs font-normal text-slate-400">
                Phone ID: {reservation.phone_id}
              </div>
            )}
          </div>

          {/* Delivery Details Card */}
          <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-xs font-normal text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Delivery Details</span>
              </div>
              {reservation.delivery_details?.address ? (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-normal bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  Islandwide Delivery
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-normal bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
                  Store Pickup
                </span>
              )}
            </div>

            {reservation.delivery_details?.address ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="sm:col-span-2">
                  <span className="text-[11px] font-normal text-slate-400 block">Delivery Address</span>
                  <div className="flex items-start gap-1.5 mt-0.5 text-xs font-normal text-slate-900 dark:text-white">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>{reservation.delivery_details.address}</span>
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-normal text-slate-400 block">City / Town</span>
                  <span className="text-xs font-normal text-slate-800 dark:text-slate-200 block mt-0.5">
                    {reservation.delivery_details.city || '—'}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] font-normal text-slate-400 block">Postal Code</span>
                  <span className="text-xs font-mono font-normal text-slate-800 dark:text-slate-200 block mt-0.5">
                    {reservation.delivery_details.postal_code || '—'}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] font-normal text-slate-400 block">Alternate / Delivery Phone</span>
                  <span className="text-xs font-mono font-normal text-slate-800 dark:text-slate-200 block mt-0.5">
                    {reservation.delivery_details.delivery_phone || '—'}
                  </span>
                </div>

                {reservation.delivery_details.delivery_notes && (
                  <div className="sm:col-span-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-[11px] font-normal text-slate-400 block mb-1">Delivery Instructions / Landmark</span>
                    <p className="text-xs font-normal text-slate-600 dark:text-slate-300 italic bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                      &ldquo;{reservation.delivery_details.delivery_notes}&rdquo;
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs font-normal text-slate-400 italic py-1">
                Customer did not specify a separate delivery address. This reservation is for in-store collection on the preferred date.
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Status & Assignment */}
        <div className="space-y-5">
          <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
            <div className="text-xs font-normal text-slate-700 dark:text-slate-300">
              Management & Status
            </div>

            <div>
              <label className="block text-xs font-normal text-slate-700 dark:text-slate-300 mb-1.5">
                Reservation Status
              </label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-normal text-slate-900 dark:text-white focus:outline-none focus:border-neutral-500 cursor-pointer"
              >
                {ALL_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-normal text-slate-700 dark:text-slate-300 mb-1.5">
                Assign Staff Member
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

            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-normal text-slate-500">
              Notice: Reservations do not deduct inventory until collection occurs physically in-store.
            </div>

            <button
              onClick={onSave}
              disabled={saving}
              className="w-full py-2.5 px-4 text-xs font-normal rounded-full bg-gradient-to-r from-black via-neutral-900 to-rose-950 hover:to-rose-900 text-white border border-neutral-800 transition-all cursor-pointer disabled:opacity-50 shadow-xs flex items-center justify-center gap-2"
            >
              {saving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>{saving ? 'Saving...' : 'Update Status & Assignment'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

