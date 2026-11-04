import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import useStock from '../hooks/useStock';
import AddStockView from '../components/Stock/AddStockView';
import DeductStockView from '../components/Stock/DeductStockView';
import StockDetailView from '../components/Stock/StockDetailView';
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
  ChevronRight,
  Eye,
} from 'lucide-react';

// Price formatter
function formatPrice(val) {
  if (val === null || val === undefined || val === '') return '—';
  const num = Number(val);
  if (isNaN(num)) return String(val);
  return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Brand display helper with normal font and theme colors
function BrandDisplay({ brandName }) {
  const brand = brandName || 'Unknown';
  const initial = brand.charAt(0).toUpperCase();

  return (
    <div className="flex items-center gap-2">
      <div className="w-5 h-5 rounded-full flex items-center justify-center font-normal text-[10px] shrink-0 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
        {initial}
      </div>
      <span className="font-normal text-xs text-slate-800 dark:text-slate-200">{brand}</span>
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

  const [viewStockPhone, setViewStockPhone] = useState(null);

  // ── Render Full Page: Stock Details & Audit Reports ─────────────────
  if (viewStockPhone) {
    return (
      <div className="pb-12">
        <StockDetailView
          phone={viewStockPhone}
          onBack={() => setViewStockPhone(null)}
          onAddStock={(p) => {
            setViewStockPhone(null);
            setAddStockPhone(p);
          }}
          onDeductStock={(p) => {
            setViewStockPhone(null);
            setRemoveStockPhone(p);
          }}
        />
      </div>
    );
  }

  // ── Render Full Page: Add Stock ─────────────────────────────────────
  if (addStockPhone) {
    return (
      <div className="pb-12">
        {toast && (
          <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-2.5 bg-slate-900 text-white text-xs font-normal rounded-xl shadow-xl animate-in slide-in-from-top-2 border border-neutral-800">
            {toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        )}
        <AddStockView
          phone={addStockPhone}
          onBack={() => setAddStockPhone(null)}
          onSubmit={handleAddStock}
          submitting={submitting}
        />
      </div>
    );
  }

  // ── Render Full Page: Deduct Stock ──────────────────────────────────
  if (removeStockPhone) {
    return (
      <div className="pb-12">
        {toast && (
          <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-2.5 bg-slate-900 text-white text-xs font-normal rounded-xl shadow-xl animate-in slide-in-from-top-2 border border-neutral-800">
            {toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        )}
        <DeductStockView
          phone={removeStockPhone}
          onBack={() => setRemoveStockPhone(null)}
          onSubmit={handleRemoveStock}
          submitting={submitting}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-12">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-2.5 bg-slate-900 text-white text-xs font-normal rounded-xl shadow-xl animate-in slide-in-from-top-2 border border-neutral-800">
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
          <h1 className="text-xl font-normal text-slate-900 dark:text-white tracking-tight">
            Stock Management
          </h1>
          <p className="text-xs font-normal text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time warehouse inventory, stock adjustments, and availability (SRS ST-05)
          </p>
        </div>

        <button
          onClick={handleRefresh}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-xs font-normal text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-2xs cursor-pointer"
          title="Refresh stock levels"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-rose-600' : 'text-slate-500'}`} />
          <span>Refresh Stock</span>
        </button>
      </div>

      {/* ── ST-09: Back in Stock Restoration Notification Banner ────── */}
      {restorationAlert && (
        <div className="p-3.5 rounded-xl bg-slate-900 text-white border border-rose-900/50 flex items-center justify-between gap-3 shadow-xs animate-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-rose-600/20 border border-rose-600/40 text-rose-400 flex items-center justify-center shrink-0">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-normal text-white">
                Back in Stock Alert (SRS ST-09)
              </div>
              <div className="text-xs font-normal text-slate-300 mt-0.5">
                {restorationAlert.phone_name} is back in stock. {restorationAlert.message}.
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <Link
              to={`/back-in-stock?phone_id=${restorationAlert.phone_id}`}
              className="px-3 py-1.5 rounded-full bg-gradient-to-r from-black via-neutral-900 to-rose-950 hover:to-rose-900 text-white text-xs font-normal border border-neutral-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>View Waiting Customers</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
            <button
              onClick={() => setRestorationAlert(null)}
              className="p-1.5 text-slate-400 hover:text-white rounded-full transition-colors cursor-pointer"
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
          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-normal text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Units
            </div>
            <div className="text-lg font-normal text-slate-900 dark:text-white mt-0.5">
              {metrics.totalUnits} <span className="text-xs font-normal text-slate-400">units</span>
            </div>
          </div>
        </div>

        {/* In Stock Models */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-normal text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              In Stock Models
            </div>
            <div className="text-lg font-normal text-slate-900 dark:text-white mt-0.5">
              {metrics.inStockCount} <span className="text-xs font-normal text-slate-400">models</span>
            </div>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-normal text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Low Stock Alert
            </div>
            <div className="text-lg font-normal text-rose-600 dark:text-rose-400 mt-0.5">
              {metrics.lowStockCount} <span className="text-xs font-normal text-slate-400">models</span>
            </div>
          </div>
        </div>

        {/* Sold Out Models */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center shrink-0">
            <Ban className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-normal text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Sold Out
            </div>
            <div className="text-lg font-normal text-neutral-800 dark:text-neutral-200 mt-0.5">
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
              className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-normal text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-rose-500/30 focus:border-neutral-500 transition-colors"
            />
          </div>

          {/* All Brands Dropdown */}
          <div className="relative min-w-[140px]">
            <select
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              className="w-full pl-3 pr-8 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-normal text-slate-700 dark:text-slate-200 appearance-none focus:outline-none focus:ring-1 focus:ring-rose-500/30 focus:border-neutral-500 cursor-pointer transition-colors"
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
              className="w-full pl-3 pr-8 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-normal text-slate-700 dark:text-slate-200 appearance-none focus:outline-none focus:ring-1 focus:ring-rose-500/30 focus:border-neutral-500 cursor-pointer transition-colors"
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
            <RefreshCw className="w-5 h-5 animate-spin text-rose-600" />
            <span className="text-xs font-normal">Loading stock inventory...</span>
          </div>
        ) : stockList.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Package className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
            <p className="font-normal text-xs text-slate-700 dark:text-slate-300">No phones match current stock filter</p>
            <p className="text-[11px] font-normal text-slate-400 mt-0.5">Try clearing the search or filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                  <th className="px-4 py-3 font-normal text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px] w-36">
                    ID
                  </th>
                  <th className="px-4 py-3 font-normal text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">
                    Phone Model
                  </th>
                  <th className="px-4 py-3 font-normal text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">
                    Brand
                  </th>
                  <th className="px-4 py-3 font-normal text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">
                    Current Stock
                  </th>
                  <th className="px-4 py-3 font-normal text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">
                    Low Stock Threshold
                  </th>
                  <th className="px-4 py-3 font-normal text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">
                    Availability Status
                  </th>
                  <th className="px-4 py-3 font-normal text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">
                    Price
                  </th>
                  <th className="px-4 py-3 font-normal text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px] text-right">
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
                          return { name: c, quantity: i === 0 ? qty : 0 };
                        }
                        return {
                          name: c.color_name || c.name || `Color #${i + 1}`,
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
                      <td className="px-4 py-3 font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap font-normal">
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
                            <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center font-normal text-xs shrink-0 border border-slate-200 dark:border-slate-700">
                              {phone.brand_name?.charAt(0) || 'P'}
                            </div>
                          )}
                          <div>
                            <div className="font-normal text-xs text-slate-900 dark:text-slate-100 leading-tight">
                              {phone.name}
                            </div>
                            <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 font-normal">
                              {phone.phone_condition === 'NEW' ? 'New' : 'Used'} · {Array.isArray(phone.storage_names) && phone.storage_names.length > 0 ? phone.storage_names.join(', ') : (phone.storage_capacity || 'Standard')}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Brand */}
                      <td className="px-4 py-3 font-normal">
                        <BrandDisplay brandName={phone.brand_name} />
                      </td>

                      {/* Current Stock (Normal black/neutral texts without colored pill badges) */}
                      <td className="px-4 py-3 font-normal">
                        <div>
                          <div className="text-xs font-normal text-slate-900 dark:text-slate-100">
                            {qty} units
                          </div>

                          {phoneColors.length > 0 && (
                            <div className="text-[11px] font-normal text-slate-500 dark:text-slate-400 mt-0.5">
                              {phoneColors.map((c) => `${c.name}: ${c.quantity}`).join('  ·  ')}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Low Stock Threshold */}
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300 font-normal">
                        {threshold} units
                      </td>

                      {/* Availability Status */}
                      <td className="px-4 py-3 font-normal">
                        {isSoldOut ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-normal text-rose-600 dark:text-rose-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                            <span>Sold Out</span>
                          </span>
                        ) : isLowStock ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-normal text-amber-600 dark:text-amber-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                            <span>Low Stock (Only {qty} left)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-normal text-slate-700 dark:text-slate-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500 shrink-0" />
                            <span>In Stock</span>
                          </span>
                        )}
                      </td>

                      {/* Price */}
                      <td className="px-4 py-3 font-normal text-slate-900 dark:text-slate-100">
                        {formatPrice(phone.price)}
                      </td>

                      {/* Stock Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Details & Reports Button */}
                          <button
                            onClick={() => setViewStockPhone(phone)}
                            className="inline-flex items-center gap-1 px-3 py-1 text-xs font-normal rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 transition-all cursor-pointer"
                            title="View phone stock details & reports"
                          >
                            <Eye className="w-3 h-3 text-slate-500" />
                            <span>View</span>
                          </button>

                          {/* Add Stock Button */}
                          <button
                            onClick={() => setAddStockPhone(phone)}
                            className="inline-flex items-center gap-1 px-3 py-1 text-xs font-normal rounded-full bg-gradient-to-r from-black via-neutral-900 to-rose-950 hover:to-rose-900 text-white border border-neutral-800 transition-all cursor-pointer shadow-xs"
                            title="Add inventory quantity"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add</span>
                          </button>

                          {/* Deduct Stock Button */}
                          <button
                            onClick={() => setRemoveStockPhone(phone)}
                            disabled={qty <= 0}
                            className="inline-flex items-center gap-1 px-3 py-1 text-xs font-normal rounded-full bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 transition-all cursor-pointer disabled:opacity-40"
                            title="Deduct inventory quantity"
                          >
                            <Minus className="w-3 h-3" />
                            <span>Deduct</span>
                          </button>

                          {/* Mark Sold Out Button */}
                          {!isSoldOut && (
                            <button
                              onClick={() => setSoldOutPhone(phone)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-full border border-slate-200 dark:border-slate-800 transition-colors cursor-pointer"
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

      {/* ── MODALS: MARK SOLD OUT (No blur, theme border, normal fonts) ── */}
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
