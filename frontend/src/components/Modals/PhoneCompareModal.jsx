import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  X,
  Scale,
  Plus,
  Trash2,
  AlertCircle,
  RefreshCw,
  Percent,
  CheckCircle2,
  Clock,
  Shield,
  Smartphone,
  ChevronDown,
  Check,
} from 'lucide-react';
import PhoneService from '../../services/phoneService';

export default function PhoneCompareModal({
  isOpen,
  onClose,
  phoneIds = [],
  onRemovePhone,
  onAddPhone,
  onClearAll,
  allPhones = [],
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [comparisonData, setComparisonData] = useState(null);

  useEffect(() => {
    if (isOpen && phoneIds.length >= 2) {
      loadComparison();
    } else if (isOpen && phoneIds.length < 2) {
      setComparisonData(null);
    }
  }, [isOpen, phoneIds]);

  const loadComparison = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await PhoneService.comparePhones(phoneIds);
      const data = res.data?.data || res.data;
      setComparisonData(data);
    } catch (err) {
      console.warn('Comparison error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load phone comparison');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const enrichedPhones = comparisonData?.phones || [];
  const availableToAdd = allPhones.filter(
    (p) => !phoneIds.includes(p.phone_id) && !p.is_archived && p.status !== 'ARCHIVED'
  );

  // Helper to find phone data from either enriched list or inventory list
  const getPhoneForSlot = (id) => {
    if (!id) return null;
    const fromEnriched = enrichedPhones.find((p) => p.phone_id === id);
    if (fromEnriched) return fromEnriched;
    const fromInventory = allPhones.find((p) => p.phone_id === id);
    return fromInventory || null;
  };

  return (
    <div className="fixed top-16 left-0 lg:left-64 right-0 bottom-0 z-30 bg-[#F8FAFC] dark:bg-slate-950 overflow-y-auto animate-in fade-in duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28">
        
        {/* Top Header / Breadcrumbs Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium transition-all shadow-2xs hover:scale-[1.01] active:scale-[0.99] cursor-pointer group"
              title="Back to Smartphones Inventory"
            >
              <ArrowLeft className="w-4 h-4 text-slate-500 dark:text-slate-400 group-hover:-translate-x-0.5 transition-transform" />
              <span>Back to Inventory</span>
            </button>

            <span className="text-slate-300 dark:text-slate-600 hidden sm:inline">/</span>

            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-sm text-slate-900 dark:text-white">
                Smartphone Comparison
              </span>
              <span className="text-slate-300 dark:text-slate-600 hidden md:inline">•</span>
              <span className="text-slate-500 dark:text-slate-400 hidden md:inline">
                Side-by-side technical specifications, stock & pricing (SRS C-05)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-medium px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/50 dark:border-rose-900/40">
              {phoneIds.length} / 3 Devices Selected
            </span>

            {phoneIds.length > 0 && (
              <button
                type="button"
                onClick={onClearAll}
                className="text-xs font-medium text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer px-2 py-1"
              >
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* 3 Interactive Device Selection Slots */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Selected Comparison Devices (Choose up to 3)
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[0, 1, 2].map((slotIdx) => {
              const currentId = phoneIds[slotIdx];
              const phone = getPhoneForSlot(currentId);

              if (phone) {
                const hasOffer = phone.active_offer?.has_active_offer;
                const isLowStock = phone.availability === 'LOW_STOCK';
                const isSoldOut = phone.availability === 'SOLD_OUT' || Number(phone.current_stock || 0) <= 0;
                const effectivePrice = Number(phone.effective_price || phone.price || phone.regular_price || 0);

                return (
                  <div
                    key={currentId}
                    className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs relative flex flex-col justify-between transition-all"
                  >
                    {/* Top Row: Device Slot Label + Remove Button */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        Device #{slotIdx + 1}
                      </span>

                      <button
                        type="button"
                        onClick={() => onRemovePhone(currentId)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                        title="Remove device"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Thumbnail & Basic Info */}
                    <div className="flex items-center gap-3.5 mb-3">
                      <div className="w-16 h-16 rounded-xl bg-slate-50 dark:bg-slate-800/60 p-1.5 flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-800">
                        {phone.main_photo || (phone.photos && phone.photos[0]) ? (
                          <img
                            src={phone.main_photo || phone.photos[0]}
                            alt={phone.name}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <Smartphone className="w-7 h-7 text-slate-300 dark:text-slate-600" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                          {phone.brand_name || 'Smartphone'}
                        </span>
                        <h3 className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                          {phone.name}
                        </h3>

                        {/* Price (Normal black color, not bold) */}
                        <div className="flex items-baseline gap-2 mt-1">
                          <span className="text-sm font-normal text-slate-900 dark:text-white">
                            ${effectivePrice.toFixed(2)}
                          </span>
                          {hasOffer && (
                            <span className="text-[11px] line-through text-slate-400 font-normal">
                              ${Number(phone.regular_price || 0).toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Status & Change Selector */}
                    <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          isSoldOut
                            ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400'
                            : isLowStock
                            ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400'
                            : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isSoldOut ? 'bg-rose-500' : isLowStock ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                        />
                        <span>{phone.availability_label || (isSoldOut ? 'Sold Out' : 'In Stock')}</span>
                      </span>

                      {/* Swap device selector */}
                      {availableToAdd.length > 0 && (
                        <select
                          onChange={(e) => {
                            if (e.target.value) {
                              onRemovePhone(currentId);
                              onAddPhone(Number(e.target.value));
                              e.target.value = '';
                            }
                          }}
                          className="text-[11px] font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 bg-transparent border-0 cursor-pointer focus:outline-none"
                        >
                          <option value="">Change device...</option>
                          {availableToAdd.map((p) => (
                            <option key={p.phone_id} value={p.phone_id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                );
              }

              // Empty Slot Card
              return (
                <div
                  key={`empty_${slotIdx}`}
                  className="p-5 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 flex flex-col items-center justify-center text-center min-h-[170px] transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-2.5">
                    <Scale className="w-5 h-5 stroke-[1.8]" />
                  </div>
                  <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    + Select Device #{slotIdx + 1}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 mb-3">
                    Choose from inventory to compare
                  </p>

                  <div className="w-full max-w-xs">
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          onAddPhone(Number(e.target.value));
                          e.target.value = '';
                        }
                      }}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 cursor-pointer shadow-2xs focus:ring-2 focus:ring-rose-500/10 focus:border-neutral-400"
                    >
                      <option value="">Choose a smartphone...</option>
                      {availableToAdd.map((p) => (
                        <option key={p.phone_id} value={p.phone_id}>
                          {p.name} (${Number(p.price || 0).toFixed(2)})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Informational Banner if fewer than 2 devices selected */}
        {phoneIds.length < 2 && (
          <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs text-center space-y-2">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Select at least 2 smartphones to compare
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              Use the selection slots above or return to the inventory table to pick devices. The full specification comparison will generate automatically side-by-side.
            </p>
          </div>
        )}

        {/* Loading Spinner */}
        {loading && (
          <div className="py-20 flex flex-col items-center justify-center gap-2 text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin text-rose-600 dark:text-rose-400" />
            <span className="text-xs font-medium">Comparing smartphone specifications...</span>
          </div>
        )}

        {/* Error Notification */}
        {error && !loading && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 text-red-600 dark:text-red-300 flex items-center gap-2.5 text-xs mb-6 shadow-2xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Detailed Side-by-Side Comparison Table */}
        {!loading && phoneIds.length >= 2 && enrichedPhones.length >= 2 && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-2xs overflow-hidden">
            <div className="p-4 sm:px-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850/60 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Detailed Technical Specifications Matrix
              </h3>
              <span className="text-xs text-slate-400">
                {enrichedPhones.length} smartphones side-by-side
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <tbody>
                  {/* Model & Header Row */}
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20">
                    <td className="px-5 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px] w-48">
                      Model & Brand
                    </td>
                    {enrichedPhones.map((p) => (
                      <td key={p.phone_id} className="px-5 py-3 font-semibold text-slate-900 dark:text-white">
                        <div>{p.name}</div>
                        <div className="text-[11px] font-normal text-slate-400">{p.brand_name}</div>
                      </td>
                    ))}
                    {phoneIds.length < 3 && <td className="px-5 py-3 text-slate-300">—</td>}
                  </tr>

                  {/* Pricing (Normal black/white, not bold) */}
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    <td className="px-5 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                      Price & Offers
                    </td>
                    {enrichedPhones.map((p) => {
                      const hasOffer = p.active_offer?.has_active_offer;
                      return (
                        <td key={p.phone_id} className="px-5 py-3">
                          <div className="flex items-baseline gap-2">
                            <span className="text-sm font-normal text-slate-900 dark:text-white">
                              ${Number(p.effective_price || p.price || 0).toFixed(2)}
                            </span>
                            {hasOffer && (
                              <>
                                <span className="text-xs line-through text-slate-400 font-normal">
                                  ${Number(p.regular_price || 0).toFixed(2)}
                                </span>
                                <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.5 rounded">
                                  {p.active_offer.discount_percentage}% OFF
                                </span>
                              </>
                            )}
                          </div>
                        </td>
                      );
                    })}
                    {phoneIds.length < 3 && <td className="px-5 py-3 text-slate-300">—</td>}
                  </tr>

                  {/* Condition */}
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20">
                    <td className="px-5 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                      Condition
                    </td>
                    {enrichedPhones.map((p) => (
                      <td key={p.phone_id} className="px-5 py-3 font-medium text-slate-800 dark:text-slate-200">
                        {p.phone_condition === 'NEW' ? 'Brand New' : 'Pre-Owned (Used)'}
                      </td>
                    ))}
                    {phoneIds.length < 3 && <td className="px-5 py-3 text-slate-300">—</td>}
                  </tr>

                  {/* Storage Options */}
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    <td className="px-5 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                      Storage Capacities
                    </td>
                    {enrichedPhones.map((p) => (
                      <td key={p.phone_id} className="px-5 py-3">
                        {p.storage_names && p.storage_names.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {p.storage_names.map((s, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-medium border border-slate-200 dark:border-slate-700"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400">Standard</span>
                        )}
                      </td>
                    ))}
                    {phoneIds.length < 3 && <td className="px-5 py-3 text-slate-300">—</td>}
                  </tr>

                  {/* Available Colors */}
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20">
                    <td className="px-5 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                      Available Colors
                    </td>
                    {enrichedPhones.map((p) => (
                      <td key={p.phone_id} className="px-5 py-3">
                        {p.colour_options && p.colour_options.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {p.colour_options.map((c, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] border border-slate-200 dark:border-slate-700"
                              >
                                {typeof c === 'object' && c.color_code && (
                                  <span
                                    className="w-2.5 h-2.5 rounded-full border border-black/20 shrink-0"
                                    style={{ backgroundColor: c.color_code }}
                                  />
                                )}
                                <span>{typeof c === 'object' ? c.color_name || c.name || `Color #${idx + 1}` : c}</span>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400">Default Color</span>
                        )}
                      </td>
                    ))}
                    {phoneIds.length < 3 && <td className="px-5 py-3 text-slate-300">—</td>}
                  </tr>

                  {/* Stock & Availability */}
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    <td className="px-5 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                      Stock Status
                    </td>
                    {enrichedPhones.map((p) => (
                      <td key={p.phone_id} className="px-5 py-3">
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {p.current_stock ?? p.stock_quantity ?? 0} units available
                        </span>
                        <span className="block text-[11px] text-slate-400 mt-0.5">
                          Threshold: {p.low_stock_level || 5} units
                        </span>
                      </td>
                    ))}
                    {phoneIds.length < 3 && <td className="px-5 py-3 text-slate-300">—</td>}
                  </tr>

                  {/* Warranty */}
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20">
                    <td className="px-5 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                      Warranty
                    </td>
                    {enrichedPhones.map((p) => (
                      <td key={p.phone_id} className="px-5 py-3 text-slate-700 dark:text-slate-300 font-medium">
                        {p.warranty || 'No warranty specified'}
                      </td>
                    ))}
                    {phoneIds.length < 3 && <td className="px-5 py-3 text-slate-300">—</td>}
                  </tr>

                  {/* Technical Specifications */}
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    <td className="px-5 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                      Technical Specs
                    </td>
                    {enrichedPhones.map((p) => (
                      <td key={p.phone_id} className="px-5 py-3">
                        {p.specifications && p.specifications.length > 0 ? (
                          <ul className="space-y-1 text-[11px] text-slate-700 dark:text-slate-300">
                            {p.specifications.map((s, idx) => (
                              <li key={idx} className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500 shrink-0" />
                                <span>
                                  <strong>{s.name}:</strong> {s.type}
                                </span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-slate-400">None specified</span>
                        )}
                      </td>
                    ))}
                    {phoneIds.length < 3 && <td className="px-5 py-3 text-slate-300">—</td>}
                  </tr>

                  {/* Installment Financing */}
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20">
                    <td className="px-5 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                      Monthly Installments
                    </td>
                    {enrichedPhones.map((p) => (
                      <td key={p.phone_id} className="px-5 py-3">
                        {p.installment?.installment_enabled ? (
                          <div>
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                              Enabled ({p.installment.plans_count} plans)
                            </span>
                            {p.installment.starting_monthly_payment && (
                              <span className="block text-[10px] text-slate-500 mt-0.5">
                                From ${Number(p.installment.starting_monthly_payment).toFixed(2)}/mo
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">Disabled</span>
                        )}
                      </td>
                    ))}
                    {phoneIds.length < 3 && <td className="px-5 py-3 text-slate-300">—</td>}
                  </tr>

                  {/* Included Accessories */}
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    <td className="px-5 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                      Accessories
                    </td>
                    {enrichedPhones.map((p) => (
                      <td key={p.phone_id} className="px-5 py-3">
                        {p.accessory_names && p.accessory_names.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {p.accessory_names.map((a, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px]"
                              >
                                {a}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400">Handset only</span>
                        )}
                      </td>
                    ))}
                    {phoneIds.length < 3 && <td className="px-5 py-3 text-slate-300">—</td>}
                  </tr>

                  {/* Description Overview */}
                  <tr>
                    <td className="px-5 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                      Overview
                    </td>
                    {enrichedPhones.map((p) => (
                      <td key={p.phone_id} className="px-5 py-3 text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                        {p.description || '—'}
                      </td>
                    ))}
                    {phoneIds.length < 3 && <td className="px-5 py-3 text-slate-300">—</td>}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
