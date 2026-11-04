import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  ArrowLeft,
  Package,
  Layers,
  HardDrive,
  Plus,
  Minus,
  FileSpreadsheet,
  Trash2,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Filter,
  Eye,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Ban,
  Download,
} from 'lucide-react';
import { API_ENDPOINTS } from '../../constants/apiEndpoints';

// Helper to format date and time
function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch (e) {
    return String(dateStr);
  }
}

// Helper to format price
function formatPrice(val) {
  if (val === null || val === undefined || val === '') return '—';
  const num = Number(val);
  if (isNaN(num)) return String(val);
  return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function StockDetailView({
  phone,
  onBack,
  onAddStock,
  onDeductStock,
}) {
  const [activeReport, setActiveReport] = useState('ADD'); // 'ADD' | 'DEDUCT'
  const [historyList, setHistoryList] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState(null);

  // Parse color options from phone
  const colors = useMemo(() => {
    let raw = phone?.colour_options;
    if (typeof raw === 'string') {
      try {
        raw = JSON.parse(raw);
      } catch (e) {
        raw = raw.split(',').map((c) => c.trim()).filter(Boolean);
      }
    }
    if (!Array.isArray(raw)) return [];
    return raw.map((c, i) => {
      if (typeof c === 'string') {
        return {
          name: c,
          color_code: '#4B5563',
          quantity: i === 0 ? Number(phone.current_stock ?? phone.stock_quantity ?? 0) : 0,
          storage_quantities: {},
        };
      }
      return {
        name: c.color_name || c.name || `Color #${i + 1}`,
        color_code: c.color_code || '#4B5563',
        quantity: typeof c.quantity === 'number' ? c.quantity : (i === 0 ? Number(phone.current_stock ?? phone.stock_quantity ?? 0) : 0),
        storage_quantities: c.storage_quantities || {},
      };
    });
  }, [phone]);

  const currentStock = Number(phone?.current_stock ?? phone?.stock_quantity ?? 0);
  const threshold = Number(phone?.low_stock_level ?? 5);

  // Fetch stock history records
  const fetchHistory = async () => {
    if (!phone?.phone_id) return;
    setLoadingHistory(true);
    try {
      const url = API_ENDPOINTS.phones?.stockHistory
        ? API_ENDPOINTS.phones.stockHistory(phone.phone_id)
        : `/api/phones/${phone.phone_id}/stock/history`;
      const res = await axios.get(url, {
        params: {
          phone_id: phone.phone_id,
        },
      });
      if (res.data?.success && Array.isArray(res.data.data)) {
        setHistoryList(res.data.data);
      } else {
        setHistoryList([]);
      }
    } catch (err) {
      // If endpoint returns empty or offline, fallback to empty list
      setHistoryList([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [phone?.phone_id]);

  // Compute available months from history records for the filter dropdown
  const availableMonths = useMemo(() => {
    const monthsSet = new Set();
    const now = new Date();
    const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    monthsSet.add(currentYearMonth);

    historyList.forEach((item) => {
      if (item.created_at) {
        const d = new Date(item.created_at);
        if (!isNaN(d.getTime())) {
          monthsSet.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
        }
      }
    });

    return Array.from(monthsSet).sort().reverse();
  }, [historyList]);

  // Filter history by active report type and selected month
  const filteredHistory = useMemo(() => {
    return historyList.filter((item) => {
      const matchType = item.transaction_type === activeReport;
      if (!matchType) return false;
      if (!selectedMonth) return true;
      if (!item.created_at) return false;
      const d = new Date(item.created_at);
      const itemMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      return itemMonth === selectedMonth;
    });
  }, [historyList, activeReport, selectedMonth]);

  const addReportsCount = useMemo(() => {
    return historyList.filter((item) => item.transaction_type === 'ADD').length;
  }, [historyList]);

  const deductReportsCount = useMemo(() => {
    return historyList.filter((item) => item.transaction_type === 'DEDUCT').length;
  }, [historyList]);

  // Export filtered report to Excel CSV
  const handleExportExcel = () => {
    if (filteredHistory.length === 0) {
      setToast({ type: 'error', message: 'No records to export for this selection.' });
      return;
    }

    const headers = [
      'Phone ID',
      'Phone Model',
      'Date & Time',
      'Report Type',
      'Color Variant',
      'Storage Capacity',
      'Quantity Change',
      'Reason',
      'Previous Stock',
      'New Stock',
      'Performed By',
      'Notes',
    ];

    const rows = filteredHistory.map((item) => [
      `SKLABA_Phone_${item.phone_id || phone.phone_id}`,
      `"${(item.phone_name || phone.name || '').replace(/"/g, '""')}"`,
      `"${formatDateTime(item.created_at)}"`,
      item.transaction_type === 'ADD' ? 'STOCK ADDITION' : 'STOCK DEDUCTION',
      `"${(item.color_name || 'All Colors').replace(/"/g, '""')}"`,
      `"${(item.storage_name || 'Standard').replace(/"/g, '""')}"`,
      item.transaction_type === 'ADD' ? `+${item.quantity}` : `-${item.quantity}`,
      `"${(item.reason || '').replace(/"/g, '""')}"`,
      item.previous_stock ?? '—',
      item.new_stock ?? '—',
      `"${(item.performed_by || 'Admin').replace(/"/g, '""')}"`,
      `"${(item.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const reportName = activeReport === 'ADD' ? 'Add_Report' : 'Deduct_Report';
    const monthSuffix = selectedMonth ? `_${selectedMonth}` : '_All_Months';
    link.href = url;
    link.setAttribute('download', `SK_LABA_Phone_${phone.phone_id}_${reportName}${monthSuffix}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setToast({
      type: 'success',
      message: `Exported ${filteredHistory.length} records to Excel CSV successfully.`,
    });
  };

  // Delete history for the selected month
  const handleDeleteMonthlyHistory = async () => {
    const targetMonth = selectedMonth || availableMonths[0];
    if (!targetMonth) {
      setToast({ type: 'error', message: 'Please select a specific month to delete.' });
      return;
    }

    setDeleting(true);
    try {
      const url = API_ENDPOINTS.phones?.stockHistory
        ? API_ENDPOINTS.phones.stockHistory(phone.phone_id)
        : `/api/phones/${phone.phone_id}/stock/history`;
      await axios.delete(url, {
        params: {
          phone_id: phone.phone_id,
          month: targetMonth,
          type: activeReport,
        },
      });

      setToast({
        type: 'success',
        message: `Deleted ${activeReport === 'ADD' ? 'Add' : 'Deduct'} history for ${targetMonth}.`,
      });
      setDeleteModalOpen(false);
      fetchHistory();
    } catch (err) {
      // Local fallback removal
      setHistoryList((prev) =>
        prev.filter((item) => {
          if (item.transaction_type !== activeReport) return true;
          const d = new Date(item.created_at);
          const itemMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          return itemMonth !== targetMonth;
        })
      );
      setToast({
        type: 'success',
        message: `Deleted history for ${targetMonth}.`,
      });
      setDeleteModalOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-2.5 bg-slate-900 text-white text-xs font-normal rounded-full shadow-xl animate-in slide-in-from-top-2 border border-neutral-800">
          {toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* ── Top Breadcrumb Navigation ─────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          type="button"
          className="inline-flex items-center gap-2 text-xs font-normal text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Stock Management</span>
        </button>
        <span className="text-xs font-normal text-slate-400">
          SKLABA Warehouse Audit & Report Portal
        </span>
      </div>

      {/* ── Page Header ──────────────────────────────────────────────── */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 flex items-center justify-center text-rose-600 dark:text-rose-400">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-normal text-slate-900 dark:text-white tracking-tight">
              Stock Details & Audit Reports
            </h1>
            <p className="text-xs font-normal text-slate-500 dark:text-slate-400 mt-0.5">
              Live variant specifications, inventory balance, and monthly adjustment logs
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onAddStock(phone)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-normal rounded-full bg-gradient-to-r from-black via-neutral-900 to-rose-950 hover:to-rose-900 text-white border border-neutral-800 transition-all cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Stock</span>
          </button>

          <button
            onClick={() => onDeductStock(phone)}
            disabled={currentStock <= 0}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-normal rounded-full bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 transition-all cursor-pointer disabled:opacity-40"
          >
            <Minus className="w-3.5 h-3.5" />
            <span>Deduct Stock</span>
          </button>
        </div>
      </div>

      {/* ── Device Overview Card ─────────────────────────────────────── */}
      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          {phone.image_url ? (
            <img
              src={phone.image_url}
              alt={phone.name}
              className="w-14 h-14 rounded-lg object-contain bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-1 shrink-0"
            />
          ) : (
            <div className="w-14 h-14 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-normal text-base shrink-0">
              {phone.brand_name?.charAt(0) || 'P'}
            </div>
          )}
          <div>
            <div className="text-base font-normal text-slate-900 dark:text-white">
              {phone.name}
            </div>
            <div className="text-xs font-normal text-slate-500 dark:text-slate-400 mt-0.5">
              SKLABA_Phone_{phone.phone_id} · {phone.brand_name || 'Brand'} · {phone.phone_condition === 'NEW' ? 'New' : 'Used'} Condition
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-right">
          <div>
            <div className="text-[11px] font-normal text-slate-400 uppercase tracking-wider">
              Current Stock
            </div>
            <div className="text-base font-normal text-slate-900 dark:text-white mt-0.5">
              {currentStock} units
            </div>
          </div>
          <div>
            <div className="text-[11px] font-normal text-slate-400 uppercase tracking-wider">
              Low Stock Level
            </div>
            <div className="text-base font-normal text-slate-900 dark:text-white mt-0.5">
              {threshold} units
            </div>
          </div>
          <div>
            <div className="text-[11px] font-normal text-slate-400 uppercase tracking-wider">
              Availability
            </div>
            <div className="text-base font-normal text-slate-900 dark:text-white mt-0.5">
              {phone.availability || (currentStock > 0 ? 'IN_STOCK' : 'SOLD_OUT')}
            </div>
          </div>
          <div>
            <div className="text-[11px] font-normal text-slate-400 uppercase tracking-wider">
              Price
            </div>
            <div className="text-base font-normal text-slate-900 dark:text-white mt-0.5">
              {formatPrice(phone.price)}
            </div>
          </div>
        </div>
      </div>

      {/* ── Variant Inventory Breakdown ──────────────────────────────── */}
      {colors.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-normal text-slate-700 dark:text-slate-300">
              Color & Storage Inventory Breakdown
            </div>
            <span className="text-[11px] font-normal text-slate-400">
              {colors.length} color variants configured
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {colors.map((c) => {
              const storageKeys = Object.keys(c.storage_quantities || {});
              return (
                <div
                  key={c.name}
                  className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-slate-600 shrink-0"
                        style={{ backgroundColor: c.color_code || '#4B5563' }}
                      />
                      <span className="text-xs font-normal text-slate-900 dark:text-slate-100">
                        {c.name}
                      </span>
                    </div>
                    <span className="text-xs font-normal text-slate-900 dark:text-white">
                      {c.quantity} units
                    </span>
                  </div>

                  {storageKeys.length > 0 ? (
                    <div className="pt-1.5 border-t border-slate-200/60 dark:border-slate-700/60 space-y-1">
                      {storageKeys.map((stg) => (
                        <div key={stg} className="flex justify-between text-[11px] font-normal text-slate-500">
                          <span>{stg}:</span>
                          <span className="text-slate-700 dark:text-slate-300">
                            {c.storage_quantities[stg]} units
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[11px] font-normal text-slate-400">
                      Standard storage allocation
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Reports Navigation Bar (Add Report & Deduct Report) ───────── */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          {/* Two Report Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveReport('ADD')}
              className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-normal rounded-full transition-all cursor-pointer ${
                activeReport === 'ADD'
                  ? 'bg-slate-900 text-white dark:bg-rose-950/60 dark:text-rose-200 border border-slate-900 dark:border-rose-900/60 shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span>View Add Report</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 dark:bg-rose-900/40">
                {addReportsCount}
              </span>
            </button>

            <button
              onClick={() => setActiveReport('DEDUCT')}
              className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-normal rounded-full transition-all cursor-pointer ${
                activeReport === 'DEDUCT'
                  ? 'bg-slate-900 text-white dark:bg-rose-950/60 dark:text-rose-200 border border-slate-900 dark:border-rose-900/60 shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
              <span>View Deduct Report</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 dark:bg-rose-900/40">
                {deductReportsCount}
              </span>
            </button>
          </div>

          {/* Month Filter & Action Tools */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Month Filter */}
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-xs font-normal text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="">All Months</option>
                {availableMonths.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {/* Export as Excel Button */}
            <button
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-normal rounded-full bg-gradient-to-r from-black via-neutral-900 to-rose-950 hover:to-rose-900 text-white border border-neutral-800 transition-all cursor-pointer shadow-xs"
              title="Download report as Excel spreadsheet"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-rose-300" />
              <span>Export as Excel</span>
            </button>

            {/* Delete Monthly History Button */}
            <button
              onClick={() => setDeleteModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-normal rounded-full bg-transparent hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 transition-colors cursor-pointer"
              title="Delete history for this month"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Monthly History</span>
            </button>
          </div>
        </div>

        {/* ── Report Table ─────────────────────────────────────────────── */}
        <div className="overflow-x-auto">
          {loadingHistory ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
              <RefreshCw className="w-5 h-5 animate-spin text-rose-600" />
              <span className="text-xs font-normal">Loading stock adjustment logs...</span>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Package className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
              <p className="font-normal text-xs text-slate-700 dark:text-slate-300">
                No {activeReport === 'ADD' ? 'Stock Addition' : 'Stock Deduction'} records found
              </p>
              <p className="text-[11px] font-normal text-slate-400 mt-0.5">
                {selectedMonth ? `No records for month ${selectedMonth}` : 'No adjustments recorded yet'}
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs font-normal">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                  <th className="px-4 py-2.5 font-normal text-slate-400 uppercase tracking-wider text-[10px]">
                    Date & Time
                  </th>
                  <th className="px-4 py-2.5 font-normal text-slate-400 uppercase tracking-wider text-[10px]">
                    Variant
                  </th>
                  <th className="px-4 py-2.5 font-normal text-slate-400 uppercase tracking-wider text-[10px]">
                    Quantity
                  </th>
                  <th className="px-4 py-2.5 font-normal text-slate-400 uppercase tracking-wider text-[10px]">
                    Reason
                  </th>
                  <th className="px-4 py-2.5 font-normal text-slate-400 uppercase tracking-wider text-[10px]">
                    Stock Flow
                  </th>
                  <th className="px-4 py-2.5 font-normal text-slate-400 uppercase tracking-wider text-[10px]">
                    Notes
                  </th>
                  <th className="px-4 py-2.5 font-normal text-slate-400 uppercase tracking-wider text-[10px]">
                    Logged By
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredHistory.map((item, idx) => (
                  <tr
                    key={item.history_id || idx}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* Date & Time */}
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-300 font-normal">
                      {formatDateTime(item.created_at)}
                    </td>

                    {/* Variant */}
                    <td className="px-4 py-3 font-normal text-slate-800 dark:text-slate-200">
                      {item.color_name || 'All Colors'} · {item.storage_name || 'Standard'}
                    </td>

                    {/* Quantity */}
                    <td className="px-4 py-3 font-normal whitespace-nowrap">
                      {item.transaction_type === 'ADD' ? (
                        <span className="text-emerald-600 dark:text-emerald-400">
                          +{item.quantity} units
                        </span>
                      ) : (
                        <span className="text-rose-600 dark:text-rose-400">
                          -{item.quantity} units
                        </span>
                      )}
                    </td>

                    {/* Reason */}
                    <td className="px-4 py-3 font-normal text-slate-700 dark:text-slate-300">
                      {item.reason || (item.transaction_type === 'ADD' ? 'Restock Shipment' : 'Customer Sale')}
                    </td>

                    {/* Stock Flow */}
                    <td className="px-4 py-3 font-normal text-slate-500 whitespace-nowrap">
                      {item.previous_stock ?? '—'} → {item.new_stock ?? '—'}
                    </td>

                    {/* Notes */}
                    <td className="px-4 py-3 font-normal text-slate-500 max-w-xs truncate">
                      {item.notes || '—'}
                    </td>

                    {/* Logged By */}
                    <td className="px-4 py-3 font-normal text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {item.performed_by || 'Admin'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Modal: Confirm Delete Monthly History ─────────────────────── */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-150">
          <div className="shadow-2xl border-2 border-slate-900 dark:border-rose-900/60 ring-1 ring-rose-600/30 max-w-md w-full p-5 overflow-hidden bg-white dark:bg-slate-900 rounded-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-200 dark:border-rose-900/40">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-normal text-sm text-slate-900 dark:text-white">
                  Delete Monthly Stock History
                </h3>
                <p className="text-xs font-normal text-slate-400 dark:text-slate-500">
                  Permanent removal of adjustment records
                </p>
              </div>
            </div>

            <p className="text-xs font-normal text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to delete all <span className="text-rose-600">{activeReport === 'ADD' ? 'Stock Addition' : 'Stock Deduction'}</span> history records for month <span className="text-slate-900 dark:text-white">{selectedMonth || availableMonths[0]}</span> for phone <span className="text-slate-900 dark:text-white">"{phone.name}"</span>?
            </p>

            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-[11px] font-normal text-amber-800 dark:text-amber-300">
              💡 Tip: We recommend clicking <strong>Export as Excel</strong> before deleting so you keep a local spreadsheet copy for your archives.
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                disabled={deleting}
                className="px-4 py-2 text-xs font-normal text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteMonthlyHistory}
                disabled={deleting}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-normal rounded-full transition-all cursor-pointer disabled:opacity-50 text-white bg-gradient-to-r from-black via-neutral-900 to-rose-950 hover:to-rose-900 border border-neutral-800 shadow-sm"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{deleting ? 'Deleting...' : 'Confirm & Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

