import React from 'react';
import { Link } from 'react-router-dom';
import useStock from '../hooks/useStock';
import AddStockModal from '../components/Modals/AddStockModal';
import RemoveStockModal from '../components/Modals/RemoveStockModal';
import MarkSoldOutModal from '../components/Modals/MarkSoldOutModal';

import {
  Package,
  Layers,
  AlertTriangle,
  Ban,
  Search,
  RefreshCw,
  Plus,
  Minus,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  Bell,
  X,
  TrendingUp,
  ChevronRight,
} from 'lucide-react';

// Price formatter
function formatPrice(val) {
  if (val === null || val === undefined || val === '') return '—';
  const num = Number(val);
  if (isNaN(num)) return String(val);
  return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Brand display helper
function BrandDisplay({ brandName }) {
  const brand = brandName || 'Unknown';
  const initial = brand.charAt(0).toUpperCase();

  const brandStyles = {
    Apple: { bg: 'bg-zinc-100 dark:bg-zinc-800', text: 'text-zinc-900 dark:text-zinc-100', dot: 'bg-zinc-700' },
    Samsung: { bg: 'bg-blue-50 dark:bg-blue-950/60', text: 'text-[#2563EB] dark:text-blue-400', dot: 'bg-[#2563EB]' },
    Xiaomi: { bg: 'bg-orange-50 dark:bg-orange-950/60', text: 'text-orange-600 dark:text-orange-400', dot: 'bg-orange-500' },
    Google: { bg: 'bg-emerald-50 dark:bg-emerald-950/60', text: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500' },
    OnePlus: { bg: 'bg-red-50 dark:bg-red-950/60', text: 'text-red-600 dark:text-red-400', dot: 'bg-red-500' },
  };

  const style = brandStyles[brand] || {
    bg: 'bg-slate-100 dark:bg-slate-800',
    text: 'text-slate-700 dark:text-slate-300',
    dot: 'bg-slate-400',
  };

  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-5 h-5 rounded flex items-center justify-center font-bold text-[10px] shrink-0 ${style.bg} ${style.text}`}
      >
        {initial}
      </div>
      <span className="font-medium text-xs text-slate-800 dark:text-slate-200">{brand}</span>
    </div>
  );
}

export default function StockManagementPage() {
  const {
    stockList,
    brands,
    loading,
    submitting,
    error,
    metrics,
    searchTerm,
    setSearchTerm,
    brandFilter,
    setBrandFilter,
    availabilityFilter,
    setAvailabilityFilter,
    addStockPhone,
    setAddStockPhone,
    removeStockPhone,
    setRemoveStockPhone,
    soldOutPhone,
    setSoldOutPhone,
    restorationAlert,
    setRestorationAlert,
    toast,
    handleRefresh,
    handleAddStock,
    handleRemoveStock,
    handleMarkSoldOut,
  } = useStock();

  return (
    <div className="space-y-5 pb-12">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-2.5 bg-slate-900 text-white text-xs font-semibold rounded-xl shadow-xl animate-in slide-in-from-top-2">
          {toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* ── 1. Page Header ─────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Stock Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time warehouse inventory, stock adjustments, and availability (SRS ST-05)
          </p>
        </div>

        <button
          onClick={handleRefresh}
          className="inline-flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-2xs cursor-pointer"
          title="Refresh stock levels"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#2563EB]' : 'text-slate-500'}`} />
          <span>Refresh Stock</span>
        </button>
      </div>

      {/* ── ST-09: Back in Stock Restoration Notification Banner ────── */}
      {restorationAlert && (
        <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/60 flex items-center justify-between gap-3 shadow-xs animate-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-blue-950 dark:text-blue-100">
                Back in Stock Alert (SRS ST-09)
              </div>
              <div className="text-xs text-blue-800 dark:text-blue-300 mt-0.5">
                <strong>{restorationAlert.phone_name}</strong> is back in stock. <strong>{restorationAlert.message}</strong>.
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <Link
              to={`/back-in-stock?phone_id=${restorationAlert.phone_id}`}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>View Waiting Customers</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
            <button
              onClick={() => setRestorationAlert(null)}
              className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded-lg transition-colors cursor-pointer"
              title="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── 2. KPI Summary Cards ───────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Stock Units */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#2563EB] dark:text-blue-400 flex items-center justify-center shrink-0">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Units
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
              {metrics.totalUnits} <span className="text-xs font-normal text-slate-400">units</span>
            </div>
          </div>
        </div>

        {/* In Stock Models */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              In Stock Models
            </div>
            <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {metrics.inStockCount} <span className="text-xs font-normal text-slate-400">models</span>
            </div>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Low Stock Alert
            </div>
            <div className="text-lg font-bold text-amber-600 dark:text-amber-400 mt-0.5">
              {metrics.lowStockCount} <span className="text-xs font-normal text-slate-400">models</span>
            </div>
          </div>
        </div>

        {/* Sold Out Models */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <Ban className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Sold Out
            </div>
            <div className="text-lg font-bold text-rose-600 dark:text-rose-400 mt-0.5">
              {metrics.soldOutCount} <span className="text-xs font-normal text-slate-400">models</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Search & Filter Bar ─────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Search box */}
          <div className="relative w-full sm:w-80">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search phone model, brand or ID..."
              className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB] transition-colors"
            />
          </div>

          {/* All Brands Dropdown */}
          <div className="relative min-w-[140px]">
            <select
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              className="w-full pl-3 pr-8 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-200 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB] cursor-pointer transition-colors"
            >
              <option value="">All Brands</option>
              {brands.map((b) => (
                <option key={b.brand_id} value={b.brand_id}>
                  {b.brand_name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>

          {/* Availability Filter Dropdown */}
          <div className="relative min-w-[150px]">
            <select
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value)}
              className="w-full pl-3 pr-8 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-200 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB] cursor-pointer transition-colors"
            >
              <option value="">All Availability</option>
              <option value="IN_STOCK">In Stock</option>
              <option value="LOW_STOCK">Low Stock Alert</option>
              <option value="SOLD_OUT">Sold Out</option>
              <option value="COMING_SOON">Coming Soon</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* ── 4. Stock Table ─────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
        {loading && stockList.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center gap-2 text-slate-400">
            <RefreshCw className="w-5 h-5 animate-spin text-[#2563EB]" />
            <span className="text-xs font-semibold">Loading stock inventory...</span>
          </div>
        ) : stockList.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Package className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
            <p className="font-semibold text-xs text-slate-700 dark:text-slate-300">No phones match current stock filter</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Try clearing the search or filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                  <th className="px-4 py-3 font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px] w-36">
                    ID
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">
                    Phone Model
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">
                    Brand
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">
                    Current Stock
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">
                    Low Stock Threshold
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">
                    Availability Status
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">
                    Price
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px] text-right">
                    Stock Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {stockList.map((phone) => {
                  const qty = Number(phone.current_stock ?? phone.stock_quantity ?? 0);
                  const threshold = Number(phone.low_stock_level ?? 5);
                  const isSoldOut = phone.availability === 'SOLD_OUT' || qty <= 0;
                  const isLowStock = !isSoldOut && (phone.availability === 'LOW_STOCK' || qty <= threshold);

                  let phoneColors = [];
                  if (phone.colour_options) {
                    let raw = phone.colour_options;
                    if (typeof raw === 'string') {
                      try {
                        raw = JSON.parse(raw);
                      } catch (e) {
                        raw = [];
                      }
                    }
                    if (Array.isArray(raw)) {
                      phoneColors = raw.map((c, i) => {
                        if (typeof c === 'string') {
                          return { name: c, color_code: '#64748b', quantity: i === 0 ? qty : 0 };
                        }
                        return {
                          name: c.color_name || c.name || `Color #${i + 1}`,
                          color_code: c.color_code || '#64748b',
                          quantity: typeof c.quantity === 'number' ? c.quantity : (i === 0 ? qty : 0),
                        };
                      });
                    }
                  }

                  return (
                    <tr
                      key={phone.phone_id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* ID */}
                      <td className="px-4 py-3 font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        SKLABA_Phone_{phone.phone_id}
                      </td>

                      {/* Phone Model */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {phone.image_url ? (
                            <img
                              src={phone.image_url}
                              alt={phone.name}
                              className="w-10 h-10 rounded-lg object-contain bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-0.5 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950 text-[#2563EB] flex items-center justify-center font-bold text-xs shrink-0">
                              {phone.brand_name?.charAt(0) || 'P'}
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-xs text-slate-900 dark:text-slate-100 leading-tight">
                              {phone.name}
                            </div>
                            <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                              {phone.phone_condition === 'NEW' ? 'New' : 'Used'} · {Array.isArray(phone.storage_names) && phone.storage_names.length > 0 ? phone.storage_names.join(', ') : (phone.storage_capacity || 'Standard')}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Brand */}
                      <td className="px-4 py-3">
                        <BrandDisplay brandName={phone.brand_name} />
                      </td>

                      {/* Current Stock */}
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1 items-start">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold ${
                              isSoldOut
                                ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60'
                                : isLowStock
                                ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/60'
                                : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isSoldOut ? 'bg-rose-500' : isLowStock ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                            />
                            <span>{qty} units</span>
                          </span>

                          {phoneColors.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-0.5 max-w-[220px]">
                              {phoneColors.map((c, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700/70"
                                >
                                  <span
                                    className="w-1.5 h-1.5 rounded-full shrink-0"
                                    style={{ backgroundColor: c.color_code || '#64748b' }}
                                  />
                                  <span>
                                    {c.name}:{' '}
                                    <strong
                                      className={
                                        c.quantity > 0
                                          ? 'text-slate-900 dark:text-slate-100'
                                          : 'text-rose-500'
                                      }
                                    >
                                      {c.quantity}
                                    </strong>
                                  </span>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Low Stock Threshold */}
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {threshold} units
                      </td>

                      {/* Availability Status */}
                      <td className="px-4 py-3">
                        {isSoldOut ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                            <span>Sold Out</span>
                          </span>
                        ) : isLowStock ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                            <span>Low Stock (Only {qty} left)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                            <span>In Stock</span>
                          </span>
                        )}
                      </td>

                      {/* Price */}
                      <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">
                        {formatPrice(phone.price)}
                      </td>

                      {/* Stock Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Add Stock Button */}
                          <button
                            onClick={() => setAddStockPhone(phone)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-50 dark:bg-blue-950/60 text-[#2563EB] dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200/80 dark:border-blue-900/80 transition-colors cursor-pointer"
                            title="Add inventory quantity"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add</span>
                          </button>

                          {/* Deduct Stock Button */}
                          <button
                            onClick={() => setRemoveStockPhone(phone)}
                            disabled={qty <= 0}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer disabled:opacity-40"
                            title="Deduct inventory quantity"
                          >
                            <Minus className="w-3 h-3" />
                            <span>Deduct</span>
                          </button>

                          {/* Mark Sold Out Button */}
                          {!isSoldOut && (
                            <button
                              onClick={() => setSoldOutPhone(phone)}
                              className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg border border-slate-200 dark:border-slate-800 transition-colors cursor-pointer"
                              title="Mark Sold Out"
                            >
                              <Ban className="w-3.5 h-3.5" />
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
        )}
      </div>

      {/* ── MODALS: STOCK ADJUSTMENTS ──────────────────────────────── */}
      <AddStockModal
        isOpen={Boolean(addStockPhone)}
        onClose={() => setAddStockPhone(null)}
        phone={addStockPhone}
        onSubmit={handleAddStock}
        loading={submitting}
      />

      <RemoveStockModal
        isOpen={Boolean(removeStockPhone)}
        onClose={() => setRemoveStockPhone(null)}
        phone={removeStockPhone}
        onSubmit={handleRemoveStock}
        loading={submitting}
      />

      <MarkSoldOutModal
        isOpen={Boolean(soldOutPhone)}
        onClose={() => setSoldOutPhone(null)}
        phone={soldOutPhone}
        onConfirm={handleMarkSoldOut}
        loading={submitting}
      />
    </div>
  );
}

