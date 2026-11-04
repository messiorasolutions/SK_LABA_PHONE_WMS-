import React, { useState } from 'react';
import {
  ArrowLeft,
  BellRing,
  Phone as PhoneIcon,
  Mail,
  User,
  Clock,
  MessageCircle,
  Check,
  RotateCcw,
  RefreshCw,
  Search,
  Filter,
} from 'lucide-react';

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

export default function BackInStockDetailView({
  phoneData,
  onBack,
  staffList = [],
  onUpdateStatus,
  onAssignStaff,
  updatingId,
  loading = false,
}) {
  const [customerFilter, setCustomerFilter] = useState(''); // '' | 'Pending' | 'Contacted'
  const [searchQuery, setSearchQuery] = useState('');

  const phone = phoneData?.phone || {};
  const allCustomers = phoneData?.waiting_customers || phoneData?.requests || [];

  const filteredCustomers = allCustomers.filter((item) => {
    if (customerFilter && item.status !== customerFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const name = (item.customer_name || '').toLowerCase();
      const phoneNum = (item.phone_number || '').toLowerCase();
      const email = (item.email || '').toLowerCase();
      return name.includes(q) || phoneNum.includes(q) || email.includes(q);
    }
    return true;
  });

  const pendingCount = allCustomers.filter((c) => c.status === 'Pending').length;
  const contactedCount = allCustomers.filter((c) => c.status === 'Contacted').length;

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
          <span>Back to Back-in-Stock Requests</span>
        </button>
      </div>

      {/* ── Page Header ──────────────────────────────────────────────── */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 flex items-center justify-center text-rose-600 dark:text-rose-400">
            <BellRing className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-normal text-slate-900 dark:text-white tracking-tight">
              Manage Back-in-Stock: {phone.name || phone.model || 'Device'}
            </h1>
            <p className="text-xs font-normal text-slate-500 dark:text-slate-400 mt-0.5">
              {allCustomers.length} total customer notification requests ({pendingCount} pending, {contactedCount} contacted)
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
        </div>
      </div>

      {/* ── Device Overview Card ─────────────────────────────────────── */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {phone.image_url ? (
              <img
                src={phone.image_url}
                alt={phone.name || 'Phone'}
                className="w-14 h-14 object-contain rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-1"
              />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400">
                <BellRing className="w-6 h-6" />
              </div>
            )}
            <div>
              <div className="text-xs font-normal text-slate-400 uppercase tracking-wider">
                {phone.brand_name || phone.brand || 'Device'}
              </div>
              <h2 className="text-base font-normal text-slate-900 dark:text-white">
                {phone.name || phone.model || 'Smartphone Model'}
              </h2>
              {phone.base_price && (
                <div className="text-xs font-normal text-slate-500 dark:text-slate-400 mt-0.5">
                  Base Price: ${Number(phone.base_price).toFixed(2)}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 text-left min-w-[120px]">
              <span className="text-[11px] font-normal text-slate-400 block">Warehouse Stock</span>
              <span className="text-sm font-normal text-slate-900 dark:text-white mt-0.5 block">
                {phone.current_stock !== undefined
                  ? `${phone.current_stock} units`
                  : 'N/A'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 text-left min-w-[120px]">
              <span className="text-[11px] font-normal text-slate-400 block">Low Stock Limit</span>
              <span className="text-sm font-normal text-slate-900 dark:text-white mt-0.5 block">
                {phone.low_stock_threshold !== undefined
                  ? `${phone.low_stock_threshold} units`
                  : 'N/A'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 text-left min-w-[120px]">
              <span className="text-[11px] font-normal text-slate-400 block">Availability</span>
              <span className="text-sm font-normal text-slate-900 dark:text-white mt-0.5 block">
                {phone.current_stock > 0 ? 'In Stock' : 'Sold Out'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Customer Details Section ─────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-normal text-slate-900 dark:text-white">
              Customer Notification Details ({filteredCustomers.length})
            </h3>
            <p className="text-xs font-normal text-slate-500 dark:text-slate-400">
              Review customer contact information, assign staff, and update contact status.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Status tabs */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-full">
              {[
                { label: 'All', value: '' },
                { label: `Pending (${pendingCount})`, value: 'Pending' },
                { label: `Contacted (${contactedCount})`, value: 'Contacted' },
              ].map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setCustomerFilter(tab.value)}
                  className={`px-3 py-1 text-xs font-normal rounded-full transition-colors cursor-pointer ${
                    customerFilter === tab.value
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative w-48 sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search customer, phone, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white rounded-full transition-colors font-normal"
              />
            </div>
          </div>
        </div>

        {/* Customer list table */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 text-[11px] font-normal text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Customer Name</th>
                  <th className="py-3 px-4">Contact Info</th>
                  <th className="py-3 px-4">Requested Date</th>
                  <th className="py-3 px-4">Customer Notes</th>
                  <th className="py-3 px-4">Assigned Staff</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-slate-400">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-rose-600" />
                      <span>Loading customer list...</span>
                    </td>
                  </tr>
                ) : filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-slate-400 font-normal">
                      No customer requests match the selected criteria.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((cust) => {
                    const reqId = cust.request_id || cust.id;
                    const cleanPhone = (cust.phone_number || '').replace(/\D/g, '');
                    const isUpdating = updatingId === reqId;
                    const isPending = cust.status === 'Pending';

                    return (
                      <tr
                        key={reqId}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div className="font-normal text-slate-900 dark:text-white">
                            {cust.customer_name || 'Customer'}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            ID: #{reqId}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-slate-800 dark:text-slate-200">
                                {cust.phone_number || '-'}
                              </span>
                              {cleanPhone && (
                                <div className="flex items-center gap-1">
                                  <a
                                    href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                                      `Hi ${cust.customer_name || 'Customer'}, good news from SK LABA PHONE! The ${
                                        phone.name || phone.model || 'device'
                                      } you requested is now back in stock.`
                                    )}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="WhatsApp Message"
                                    className="p-1 rounded-md text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-colors cursor-pointer"
                                  >
                                    <MessageCircle className="w-3.5 h-3.5" />
                                  </a>
                                  <a
                                    href={`tel:${cust.phone_number}`}
                                    title="Call Customer"
                                    className="p-1 rounded-md text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                  >
                                    <PhoneIcon className="w-3.5 h-3.5" />
                                  </a>
                                </div>
                              )}
                            </div>
                            {cust.email && (
                              <div className="flex items-center gap-1 text-[11px] text-slate-400">
                                <Mail className="w-3 h-3" />
                                <span>{cust.email}</span>
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap font-normal">
                          {formatDateTime(cust.created_at)}
                        </td>

                        <td className="py-3 px-4 max-w-[200px]">
                          {cust.notes ? (
                            <span className="text-slate-600 dark:text-slate-300 font-normal line-clamp-2">
                              {cust.notes}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">None</span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <select
                            value={cust.assigned_to_user_id || ''}
                            disabled={isUpdating}
                            onChange={(e) => onAssignStaff(reqId, e.target.value)}
                            className="text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer font-normal"
                          >
                            <option value="">Unassigned</option>
                            {staffList.map((st) => (
                              <option key={st.user_id} value={st.user_id}>
                                {st.display_name || st.name || st.email || `Staff #${st.user_id}`}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td className="py-3 px-4">
                          <select
                            value={cust.status || 'Pending'}
                            disabled={isUpdating}
                            onChange={(e) => onUpdateStatus(reqId, e.target.value)}
                            className="text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer font-normal"
                          >
                            <option value="Pending">Pending</option>
                            <option value="Contacted">Contacted</option>
                          </select>
                        </td>

                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          {isPending ? (
                            <button
                              type="button"
                              disabled={isUpdating}
                              onClick={() => onUpdateStatus(reqId, 'Contacted')}
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
                              onClick={() => onUpdateStatus(reqId, 'Pending')}
                              className="px-3 py-1 text-xs font-normal rounded-full bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer inline-flex items-center gap-1.5"
                            >
                              {isUpdating ? (
                                <RefreshCw className="w-3 h-3 animate-spin" />
                              ) : (
                                <RotateCcw className="w-3 h-3 text-slate-400" />
                              )}
                              <span>Reset to Pending</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

