import React, { useState, useEffect } from 'react';
import {
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
  const [addDropdownOpen, setAddDropdownOpen] = useState(false);
  const [searchAdd, setSearchAdd] = useState('');

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
  const availableToAdd = allPhones.filter((p) => !phoneIds.includes(p.phone_id) && !p.is_archived);
  const filteredAvailable = availableToAdd.filter((p) => {
    if (!searchAdd.trim()) return true;
    const q = searchAdd.toLowerCase();
    return p.name?.toLowerCase().includes(q) || p.brand_name?.toLowerCase().includes(q);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-5 animate-in fade-in duration-150">
      <div className="shadow-2xl border max-w-5xl w-full h-[90vh] flex flex-col overflow-hidden bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#2563EB] flex items-center justify-center shrink-0">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Side-by-Side Smartphone Comparison</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-[#2563EB] dark:text-blue-400">
                  {phoneIds.length} / 3 Devices
                </span>
              </h2>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Compare technical specifications, live stock, pricing, and active discounts (SRS C-05)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {phoneIds.length > 0 && (
              <button
                type="button"
                onClick={onClearAll}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
              >
                Clear All
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 [scrollbar-width:thin]">
          {/* Minimum selection warning */}
          {phoneIds.length < 2 && (
            <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
              <Scale className="w-10 h-10 mx-auto mb-3 text-slate-400" />
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                Select At Least 2 Phones to Compare
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                Select 2 or 3 smartphones from the inventory table using the "Compare" button, or select from the list below.
              </p>

              {/* Quick selector inside modal */}
              {availableToAdd.length > 0 && (
                <div className="mt-4 max-w-sm mx-auto">
                  <div className="relative">
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          onAddPhone(Number(e.target.value));
                          e.target.value = '';
                        }
                      }}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer shadow-xs focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="">+ Add a phone to comparison...</option>
                      {availableToAdd.map((p) => (
                        <option key={p.phone_id} value={p.phone_id}>
                          {p.name} (${Number(p.price || 0).toFixed(2)})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Loading spinner */}
          {loading && (
            <div className="py-20 flex flex-col items-center justify-center gap-2 text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin text-[#2563EB]" />
              <span className="text-xs font-semibold">Comparing smartphone specifications...</span>
            </div>
          )}

          {/* Error notification */}
          {error && !loading && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 text-red-600 dark:text-red-300 flex items-center gap-2.5 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Comparison Cards & Grid */}
          {!loading && phoneIds.length >= 2 && enrichedPhones.length >= 2 && (
            <div className="space-y-6">
              {/* Top Overview Cards (Side-by-Side) */}
              <div
                className="grid gap-4"
                style={{
                  gridTemplateColumns: `repeat(${phoneIds.length < 3 ? phoneIds.length + 1 : 3}, minmax(0, 1fr))`,
                }}
              >
                {enrichedPhones.map((phone) => {
                  const hasOffer = phone.active_offer?.has_active_offer;
                  const isLowStock = phone.availability === 'LOW_STOCK';
                  const isSoldOut = phone.availability === 'SOLD_OUT' || phone.current_stock <= 0;

                  return (
                    <div
                      key={phone.phone_id}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs relative flex flex-col justify-between"
                    >
                      {/* Remove button */}
                      <button
                        onClick={() => onRemovePhone(phone.phone_id)}
                        className="absolute top-3 right-3 p-1 text-slate-400 hover:text-red-500 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Remove from comparison"
                      >
                        <X className="w-4 h-4" />
                      </button>

                      <div>
                        {/* Thumbnail */}
                        <div className="h-32 rounded-lg bg-slate-50 dark:bg-slate-800/60 p-2 flex items-center justify-center mb-3">
                          {phone.main_photo ? (
                            <img
                              src={phone.main_photo}
                              alt={phone.name}
                              className="max-h-full max-w-full object-contain"
                            />
                          ) : (
                            <Smartphone className="w-12 h-12 text-slate-300 dark:text-slate-600" />
                          )}
                        </div>

                        {/* ID & Brand */}
                        <div className="text-[11px] font-mono text-slate-400">
                          SKLABA_Phone_{phone.phone_id} · {phone.brand_name}
                        </div>

                        {/* Model Name */}
                        <div className="font-bold text-sm text-slate-900 dark:text-white mt-0.5 line-clamp-1">
                          {phone.name}
                        </div>

                        {/* Price & Offer */}
                        <div className="mt-2 flex items-baseline gap-2">
                          {hasOffer ? (
                            <>
                              <span className="text-base font-black text-[#2563EB] dark:text-blue-400">
                                ${Number(phone.effective_price || 0).toFixed(2)}
                              </span>
                              <span className="text-xs line-through text-slate-400">
                                ${Number(phone.regular_price || 0).toFixed(2)}
                              </span>
                              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.5 rounded">
                                {phone.active_offer.discount_percentage}% OFF
                              </span>
                            </>
                          ) : (
                            <span className="text-base font-black text-slate-900 dark:text-white">
                              ${Number(phone.regular_price || 0).toFixed(2)}
                            </span>
                          )}
                        </div>

                        {/* Stock & Availability */}
                        <div className="mt-2.5 flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold ${
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

                          <span className="text-[11px] text-slate-400">
                            ({phone.current_stock} in stock)
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Empty slot card to add 3rd phone if only 2 selected */}
                {phoneIds.length < 3 && (
                  <div className="p-6 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col items-center justify-center text-center">
                    <Plus className="w-8 h-8 text-slate-400 mb-2" />
                    <div className="font-semibold text-xs text-slate-700 dark:text-slate-300">
                      Add 3rd Smartphone
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 mb-3">
                      Compare up to 3 phones side-by-side
                    </p>

                    <div className="relative w-full max-w-[200px]">
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            onAddPhone(Number(e.target.value));
                            e.target.value = '';
                          }
                        }}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer shadow-xs"
                      >
                        <option value="">Select phone...</option>
                        {availableToAdd.map((p) => (
                          <option key={p.phone_id} value={p.phone_id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Comparison Attributes Table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <tbody>
                    {/* Condition */}
                    <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                      <td className="px-4 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px] w-44">
                        Condition
                      </td>
                      {enrichedPhones.map((p) => (
                        <td key={p.phone_id} className="px-4 py-2.5 font-semibold text-slate-800 dark:text-slate-200">
                          {p.phone_condition === 'NEW' ? 'Brand New' : 'Pre-Owned (Used)'}
                        </td>
                      ))}
                      {phoneIds.length < 3 && <td className="px-4 py-2.5 text-slate-300">—</td>}
                    </tr>

                    {/* Storage Options */}
                    <tr className="border-b border-slate-100 dark:border-slate-800">
                      <td className="px-4 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                        Storage Options
                      </td>
                      {enrichedPhones.map((p) => (
                        <td key={p.phone_id} className="px-4 py-2.5">
                          {p.storage_names && p.storage_names.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {p.storage_names.map((s, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-[#2563EB] text-[11px] font-semibold"
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
                      {phoneIds.length < 3 && <td className="px-4 py-2.5 text-slate-300">—</td>}
                    </tr>

                    {/* Colour Options */}
                    <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                      <td className="px-4 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                        Available Colours
                      </td>
                      {enrichedPhones.map((p) => (
                        <td key={p.phone_id} className="px-4 py-2.5">
                          {p.colour_options && p.colour_options.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {p.colour_options.map((c, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px]"
                                >
                                  {typeof c === 'object' ? (c.color_name || c.name || `Color #${idx + 1}`) : c}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-400">Default colour</span>
                          )}
                        </td>
                      ))}
                      {phoneIds.length < 3 && <td className="px-4 py-2.5 text-slate-300">—</td>}
                    </tr>

                    {/* Warranty */}
                    <tr className="border-b border-slate-100 dark:border-slate-800">
                      <td className="px-4 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                        Warranty
                      </td>
                      {enrichedPhones.map((p) => (
                        <td key={p.phone_id} className="px-4 py-2.5 text-slate-700 dark:text-slate-300 font-medium">
                          {p.warranty || 'No warranty specified'}
                        </td>
                      ))}
                      {phoneIds.length < 3 && <td className="px-4 py-2.5 text-slate-300">—</td>}
                    </tr>

                    {/* Technical Specifications */}
                    <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                      <td className="px-4 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                        Specs Highlights
                      </td>
                      {enrichedPhones.map((p) => (
                        <td key={p.phone_id} className="px-4 py-2.5">
                          {p.specifications && p.specifications.length > 0 ? (
                            <ul className="space-y-0.5 text-[11px] text-slate-700 dark:text-slate-300">
                              {p.specifications.map((s, idx) => (
                                <li key={idx} className="flex items-center gap-1.5">
                                  <span className="w-1 h-1 rounded-full bg-blue-500 shrink-0" />
                                  <span>{s.name} ({s.type})</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <span className="text-slate-400">None specified</span>
                          )}
                        </td>
                      ))}
                      {phoneIds.length < 3 && <td className="px-4 py-2.5 text-slate-300">—</td>}
                    </tr>

                    {/* Included Accessories */}
                    <tr className="border-b border-slate-100 dark:border-slate-800">
                      <td className="px-4 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                        Included Accessories
                      </td>
                      {enrichedPhones.map((p) => (
                        <td key={p.phone_id} className="px-4 py-2.5">
                          {p.accessory_names && p.accessory_names.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {p.accessory_names.map((a, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[11px]"
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
                      {phoneIds.length < 3 && <td className="px-4 py-2.5 text-slate-300">—</td>}
                    </tr>

                    {/* Installment Plans */}
                    <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                      <td className="px-4 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                        Installment Plans
                      </td>
                      {enrichedPhones.map((p) => (
                        <td key={p.phone_id} className="px-4 py-2.5">
                          {p.installment?.installment_enabled ? (
                            <div>
                              <span className="text-emerald-600 font-semibold text-[11px]">
                                Enabled ({p.installment.plans_count} plans)
                              </span>
                              {p.installment.starting_monthly_payment && (
                                <span className="block text-[10px] text-slate-500">
                                  From ${Number(p.installment.starting_monthly_payment).toFixed(2)}/mo
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400">Disabled</span>
                          )}
                        </td>
                      ))}
                      {phoneIds.length < 3 && <td className="px-4 py-2.5 text-slate-300">—</td>}
                    </tr>

                    {/* Description */}
                    <tr>
                      <td className="px-4 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                        Description
                      </td>
                      {enrichedPhones.map((p) => (
                        <td key={p.phone_id} className="px-4 py-2.5 text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                          {p.description || '—'}
                        </td>
                      ))}
                      {phoneIds.length < 3 && <td className="px-4 py-2.5 text-slate-300">—</td>}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between p-4 px-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Comparing <strong className="text-slate-800 dark:text-slate-200">{phoneIds.length}</strong> of maximum 3 phones
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

