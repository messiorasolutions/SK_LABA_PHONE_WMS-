import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import usePhones from '../hooks/usePhones';
import useBrands from '../hooks/useBrands';
import useStorage from '../hooks/useStorage';

import BrandModal from '../components/Modals/BrandModal';
import StorageModal from '../components/Modals/StorageModal';
import PhoneModal from '../components/Modals/PhoneModal';
import ConfirmDeleteModal from '../components/Modals/ConfirmDeleteModal';
import DetailModal from '../components/Modals/DetailModal';
import PhoneCustomerViewModal from '../components/Modals/PhoneCustomerViewModal';
import PhoneCompareModal from '../components/Modals/PhoneCompareModal';

import {
  Smartphone,
  Tag,
  HardDrive,
  Plus,
  Search,
  RefreshCw,
  Edit2,
  Trash2,
  Eye,
  Scale,
  Archive,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  X,
} from 'lucide-react';

function BrandDisplay({ brandName }) {
  const name = typeof brandName === 'string'
    ? brandName
    : (typeof brandName === 'object' && brandName ? (brandName.brand_name || brandName.name || '—') : '—');
  return (
    <span className="font-medium text-slate-700 dark:text-slate-300">
      {name}
    </span>
  );
}

function getPhoneSubtitle(phone) {
  const screen = typeof phone.screen_size === 'string' ? phone.screen_size : '6.7\"';
  let storage = '';
  if (Array.isArray(phone.storage_names) && phone.storage_names.length > 0) {
    storage = phone.storage_names.map(s => typeof s === 'string' ? s : s?.name || '').filter(Boolean).join(', ');
  } else if (Array.isArray(phone.storage_options) && phone.storage_options.length > 0) {
    storage = phone.storage_options.map(s => s?.storage_name || (s?.capacity_gb ? `${s.capacity_gb}GB` : '')).filter(Boolean).join(', ');
  } else if (typeof phone.storage_capacity === 'string') {
    storage = phone.storage_capacity;
  } else if (Array.isArray(phone.colour_options) && phone.colour_options.length > 0) {
    const c0 = phone.colour_options[0];
    if (typeof c0 === 'string') storage = c0;
    else if (typeof c0 === 'object' && c0) storage = c0.color_name || c0.name || '';
  }
  return `${screen} · ${storage || '256GB'}`;
}

export default function PhoneManagementPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(urlTab || 'phones');

  const phonesHook = usePhones();
  const brandsHook = useBrands();
  const storageHook = useStorage();

  useEffect(() => {
    if (urlTab && ['phones', 'brands', 'storage'].includes(urlTab)) {
      setActiveTab(urlTab);
    }
    if (searchParams.get('action') === 'add') {
      phonesHook.setIsAddOpen(true);
    }
  }, [urlTab, searchParams]);

  const currentToast =
    phonesHook.toast || brandsHook.toast || storageHook.toast;

  // Phone comparison state (SRS C-05)
  const [selectedCompareIds, setSelectedCompareIds] = useState([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  const handleToggleCompare = (phoneId) => {
    setSelectedCompareIds((prev) => {
      if (prev.includes(phoneId)) {
        return prev.filter((id) => id !== phoneId);
      }
      if (prev.length >= 3) {
        phonesHook.showToast('You can compare a maximum of 3 smartphones at a time.', 'error');
        return prev;
      }
      return [...prev, phoneId];
    });
  };

  const handleRemoveCompare = (phoneId) => {
    setSelectedCompareIds((prev) => prev.filter((id) => id !== phoneId));
  };

  const handleAddCompare = (phoneId) => {
    setSelectedCompareIds((prev) => {
      if (prev.includes(phoneId)) return prev;
      if (prev.length >= 3) {
        phonesHook.showToast('You can compare a maximum of 3 smartphones at a time.', 'error');
        return prev;
      }
      return [...prev, phoneId];
    });
  };

  const handleClearCompare = () => {
    setSelectedCompareIds([]);
  };

  // Global detail modal state
  const [detailModal, setDetailModal] = useState({ isOpen: false, title: '', data: null });
  const [viewingPhone, setViewingPhone] = useState(null);
  const openDetail = (title, data) => setDetailModal({ isOpen: true, title, data });
  const closeDetail = () => setDetailModal({ isOpen: false, title: '', data: null });

  const formatPrice = (p) =>
    p ? `$${Number(p).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—';
  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-7xl mx-auto pb-10">
      {currentToast && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2.5 shadow-xl rounded-lg text-xs font-semibold animate-bounce ${
            currentToast.type === 'error'
              ? 'bg-red-50 text-red-600 border border-red-200'
              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          }`}
        >
          {currentToast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          )}
          <span>{currentToast.message}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
            Phone Management Portal
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-normal">
            Manage your smartphone inventory, brands, models, and storage options.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'phones' && (
            <button
              onClick={() => phonesHook.setIsAddOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 shrink-0 stroke-[2.2] text-slate-500 dark:text-slate-400" />
              <span>Add Phone</span>
            </button>
          )}
          {activeTab === 'brands' && (
            <button
              onClick={() => brandsHook.setIsAddOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 shrink-0 stroke-[2.2] text-slate-500 dark:text-slate-400" />
              <span>Add Brand</span>
            </button>
          )}
          {activeTab === 'storage' && (
            <button
              onClick={() => storageHook.setIsAddOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 shrink-0 stroke-[2.2] text-slate-500 dark:text-slate-400" />
              <span>Add Storage</span>
            </button>
          )}
        </div>
      </div>

      <div className="border-b border-slate-200/80 dark:border-slate-800 flex items-center gap-6 overflow-x-auto no-scrollbar">
        <button
          onClick={() => {
            setActiveTab('phones');
            setSearchParams({ tab: 'phones' });
          }}
          className={`flex items-center gap-2 pb-3 text-xs cursor-pointer transition-colors whitespace-nowrap -mb-px ${
            activeTab === 'phones'
              ? 'border-b-2 border-rose-600 dark:border-rose-500 text-slate-900 dark:text-white font-semibold'
              : 'border-b-2 border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 font-medium'
          }`}
        >
          <Smartphone className={`w-3.5 h-3.5 shrink-0 ${activeTab === "phones" ? "text-rose-600 dark:text-rose-400" : ""}`} />
          <span>Smartphones Inventory</span>
          <span
            className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
              activeTab === 'phones'
                ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/50 dark:border-rose-900/40'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
            }`}
          >
            {phonesHook.totalCount || 1}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab('brands');
            setSearchParams({ tab: 'brands' });
          }}
          className={`flex items-center gap-2 pb-3 text-xs cursor-pointer transition-colors whitespace-nowrap -mb-px ${
            activeTab === 'brands'
              ? 'border-b-2 border-rose-600 dark:border-rose-500 text-slate-900 dark:text-white font-semibold'
              : 'border-b-2 border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 font-medium'
          }`}
        >
          <Tag className={`w-3.5 h-3.5 shrink-0 ${activeTab === "brands" ? "text-rose-600 dark:text-rose-400" : ""}`} />
          <span>Phone Brands</span>
          <span
            className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
              activeTab === 'brands'
                ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/50 dark:border-rose-900/40'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
            }`}
          >
            {brandsHook.totalCount || 2}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab('storage');
            setSearchParams({ tab: 'storage' });
          }}
          className={`flex items-center gap-2 pb-3 text-xs cursor-pointer transition-colors whitespace-nowrap -mb-px ${
            activeTab === 'storage'
              ? 'border-b-2 border-rose-600 dark:border-rose-500 text-slate-900 dark:text-white font-semibold'
              : 'border-b-2 border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 font-medium'
          }`}
        >
          <HardDrive className="w-3.5 h-3.5 shrink-0" />
          <span>Storage Options</span>
          <span
            className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
              activeTab === 'storage'
                ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/50 dark:border-rose-900/40'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
            }`}
          >
            {storageHook.totalCount || 2}
          </span>
        </button>
      </div>

      {activeTab === 'phones' && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5 flex-1">
              <div className="relative w-full sm:w-72">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="text"
                  value={phonesHook.searchTerm}
                  onChange={(e) => phonesHook.setSearchTerm(e.target.value)}
                  placeholder="Search phones..."
                  className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB] transition-colors"
                />
              </div>

              <div className="relative min-w-[130px]">
                <select
                  value={phonesHook.brandFilter}
                  onChange={(e) => phonesHook.setBrandFilter(e.target.value)}
                  className="w-full pl-3 pr-8 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-200 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB] cursor-pointer transition-colors"
                >
                  <option value="">All Brands</option>
                  {phonesHook.brands.map((b) => (
                    <option key={b.brand_id} value={b.brand_id}>{b.brand_name}</option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
              </div>

              <div className="relative min-w-[130px]">
                <select
                  value={phonesHook.conditionFilter}
                  onChange={(e) => phonesHook.setConditionFilter(e.target.value)}
                  className="w-full pl-3 pr-8 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-200 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB] cursor-pointer transition-colors"
                >
                  <option value="">All Conditions</option>
                  <option value="NEW">New</option>
                  <option value="USED">Used</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
              </div>

              <div className="relative min-w-[130px]">
                <select
                  value={phonesHook.statusFilter}
                  onChange={(e) => phonesHook.setStatusFilter(e.target.value)}
                  className="w-full pl-3 pr-8 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-200 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB] cursor-pointer transition-colors"
                >
                  <option value="">All Statuses</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="DRAFT">Draft</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
              </div>
            </div>

            {/* Compare Smartphones Button (SRS C-05) */}
            <button
              type="button"
              onClick={() => setIsCompareModalOpen(true)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 border rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                selectedCompareIds.length > 0
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-[#2563EB] border-blue-200 dark:border-blue-800'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
              }`}
              title="Compare smartphones side-by-side (SRS C-05)"
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Compare {selectedCompareIds.length > 0 ? `(${selectedCompareIds.length}/3)` : ''}</span>
            </button>

            {/* Quick Refresh */}
            <button
              onClick={() => phonesHook.handleRefresh()}
              className="p-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 rounded-lg transition-colors cursor-pointer"
              title="Refresh smartphones"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${phonesHook.apiLoading ? 'animate-spin text-[#2563EB]' : ''}`} />
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
            {phonesHook.apiLoading && phonesHook.phones.length === 0 ? (
              <div className="py-16 flex flex-col items-center justify-center gap-2 text-slate-400">
                <RefreshCw className="w-5 h-5 animate-spin text-[#2563EB]" />
                <span className="text-xs font-semibold">Loading smartphones inventory...</span>
              </div>
            ) : phonesHook.phones.length === 0 ? (
              <div className="py-14 text-center text-slate-400">
                <Smartphone className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                <p className="font-semibold text-xs text-slate-700 dark:text-slate-300">No phones found</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Click "+ Add Phone" to add your first smartphone</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                      <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px] w-36">ID</th>
                      <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px]">Phone Model</th>
                      <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px]">Brand</th>
                      <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px]">Condition</th>
                      <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px]">Price</th>
                      <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px]">Low Stock Level</th>
                      <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px]">Status</th>
                      <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px] text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {phonesHook.phones.map((phone, idx) => (
                      <tr key={phone.phone_id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3 font-mono text-slate-400 dark:text-slate-500 text-xs">
                          SKLABA_Phone_{phone.phone_id || idx + 1}
                        </td>

                        <td className="px-4 py-3">
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-medium text-xs text-slate-900 dark:text-slate-100 leading-tight">
                                {phone.name}
                              </span>
                              {Boolean(phone.is_new_arrival) && (
                                <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 uppercase tracking-wider">
                                  New Arrival
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                              {getPhoneSubtitle(phone)}
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <BrandDisplay brandName={phone.brand_name} />
                        </td>

                        <td className="px-4 py-3 text-xs font-normal text-slate-700 dark:text-slate-300">
                          {phone.phone_condition === 'NEW' ? 'New' : (phone.phone_condition || 'Used')}
                        </td>

                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100 text-xs">
                          {formatPrice(phone.price)}
                        </td>

                        <td className="px-4 py-3 text-xs font-normal text-slate-600 dark:text-slate-300">
                          {phone.low_stock_level ?? phone.stock_quantity ?? 25}
                        </td>

                        <td className="px-4 py-3 text-xs font-normal text-slate-700 dark:text-slate-300">
                          {phone.is_archived === 1 || phone.status === 'ARCHIVED'
                            ? 'Archived'
                            : phone.status === 'PUBLISHED'
                            ? 'Published'
                            : (phone.status ? (phone.status.charAt(0) + phone.status.slice(1).toLowerCase()) : 'Draft')}
                        </td>

                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Compare (SRS C-05) */}
                            <button
                              type="button"
                              onClick={() => handleToggleCompare(phone.phone_id)}
                              className={`p-1.5 border rounded-lg transition-colors cursor-pointer ${
                                selectedCompareIds.includes(phone.phone_id)
                                  ? 'bg-[#2563EB] text-white border-[#2563EB]'
                                  : 'border-slate-100 dark:border-slate-800 text-slate-400 hover:text-red-600 hover:bg-blue-50 dark:hover:bg-slate-800'
                              }`}
                              title={
                                selectedCompareIds.includes(phone.phone_id)
                                  ? 'Remove from comparison'
                                  : 'Add to side-by-side comparison (SRS C-05)'
                              }
                            >
                              <Scale className="w-3.5 h-3.5" />
                            </button>

                            {/* View (Customer View Light Version) */}
                            <button
                              onClick={() => setViewingPhone(phone)}
                              className="p-1.5 border border-slate-100 dark:border-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                              title="View phone"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => phonesHook.setEditingPhone(phone)}
                              className="p-1.5 border border-slate-100 dark:border-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                              title="Edit phone"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Archive / Restore (SRS MG-01) */}
                            {phone.is_archived === 1 || phone.status === 'ARCHIVED' ? (
                              <button
                                onClick={() => phonesHook.setRestoringPhone(phone)}
                                className="p-1.5 border border-amber-200 dark:border-amber-900/60 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors cursor-pointer"
                                title="Restore to Draft (SRS MG-01)"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <button
                                onClick={() => phonesHook.setArchivingPhone(phone)}
                                className="p-1.5 border border-slate-100 dark:border-slate-800 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg transition-colors cursor-pointer"
                                title="Archive phone (SRS MG-01)"
                              >
                                <Archive className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Delete */}
                            <button
                              onClick={() => phonesHook.setDeletingPhone(phone)}
                              className="p-1.5 border border-slate-100 dark:border-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                              title="Delete phone"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'brands' && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                value={brandsHook.searchTerm}
                onChange={(e) => brandsHook.setSearchTerm(e.target.value)}
                placeholder="Search brands..."
                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB]"
              />
            </div>
            <button
              onClick={() => brandsHook.handleRefresh()}
              className="p-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 rounded-lg transition-colors cursor-pointer"
              title="Refresh brands"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${brandsHook.apiLoading ? 'animate-spin text-[#2563EB]' : ''}`} />
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
            {brandsHook.apiLoading && brandsHook.brands.length === 0 ? (
              <div className="py-16 flex flex-col items-center justify-center gap-2 text-slate-400">
                <RefreshCw className="w-5 h-5 animate-spin text-[#2563EB]" />
                <span className="text-xs font-semibold">Loading brands...</span>
              </div>
            ) : brandsHook.filteredBrands.length === 0 ? (
              <div className="py-14 text-center text-slate-400">
                <Tag className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                <p className="font-semibold text-xs text-slate-700 dark:text-slate-300">No brands found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                      <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px] w-36">ID</th>
                      <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px]">Brand Name</th>
                      <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px]">Description</th>
                      <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px]">Status</th>
                      <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px]">Created At</th>
                      <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px] text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {brandsHook.filteredBrands.map((brand) => (
                      <tr key={brand.brand_id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3 font-mono text-slate-400 dark:text-slate-500">SKLABA_Brand_{brand.brand_id}</td>
                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{brand.brand_name}</td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400 max-w-xs truncate">{brand.description || '—'}</td>
                        <td className="px-4 py-3 text-xs font-normal text-slate-700 dark:text-slate-300">
                          {brand.is_active === 1 || brand.is_active === true ? 'Active' : 'Inactive'}
                        </td>
                        <td className="px-4 py-3 text-slate-400 dark:text-slate-500">{formatDate(brand.created_at)}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openDetail(`SKLABA_Brand_${brand.brand_id}: ${brand.brand_name}`, brand)}
                              className="p-1.5 border border-slate-100 dark:border-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                              title="View details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => brandsHook.setEditingBrand(brand)}
                              className="p-1.5 border border-slate-100 dark:border-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                              title="Edit brand"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => brandsHook.setDeletingBrand(brand)}
                              className="p-1.5 border border-slate-100 dark:border-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                              title="Delete brand"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'storage' && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                value={storageHook.searchTerm}
                onChange={(e) => storageHook.setSearchTerm(e.target.value)}
                placeholder="Search storage options..."
                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB]"
              />
            </div>
            <button
              onClick={() => storageHook.handleRefresh()}
              className="p-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 rounded-lg transition-colors cursor-pointer"
              title="Refresh storage"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${storageHook.apiLoading ? 'animate-spin text-[#2563EB]' : ''}`} />
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
            {storageHook.apiLoading && storageHook.storageOptions.length === 0 ? (
              <div className="py-16 flex flex-col items-center justify-center gap-2 text-slate-400">
                <RefreshCw className="w-5 h-5 animate-spin text-[#2563EB]" />
                <span className="text-xs font-semibold">Loading storage options...</span>
              </div>
            ) : storageHook.filteredStorage.length === 0 ? (
              <div className="py-14 text-center text-slate-400">
                <HardDrive className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                <p className="font-semibold text-xs text-slate-700 dark:text-slate-300">No storage options found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                      <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px] w-36">ID</th>
                      <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px]">Option Name</th>
                      <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px]">Capacity</th>
                      <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px]">Created At</th>
                      <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px] text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {storageHook.filteredStorage.map((s) => (
                      <tr key={s.storage_id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3 font-mono text-slate-400 dark:text-slate-500">SKLABA_Storage_{s.storage_id}</td>
                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{s.storage_name}</td>
                        <td className="px-4 py-3 text-xs font-normal text-slate-700 dark:text-slate-300">
                          {s.capacity_gb} GB
                        </td>
                        <td className="px-4 py-3 text-slate-400 dark:text-slate-500">{formatDate(s.created_at)}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openDetail(`SKLABA_Storage_${s.storage_id}: ${s.storage_name}`, s)}
                              className="p-1.5 border border-slate-100 dark:border-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                              title="View details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => storageHook.setEditingStorage(s)}
                              className="p-1.5 border border-slate-100 dark:border-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                              title="Edit storage"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => storageHook.setDeletingStorage(s)}
                              className="p-1.5 border border-slate-100 dark:border-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                              title="Delete storage"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      <PhoneModal
        isOpen={phonesHook.isAddOpen || Boolean(phonesHook.editingPhone)}
        onClose={() => {
          phonesHook.setIsAddOpen(false);
          phonesHook.setEditingPhone(null);
        }}
        onSubmit={
          phonesHook.editingPhone
            ? (data) => phonesHook.handleUpdatePhone(phonesHook.editingPhone.phone_id, data)
            : phonesHook.handleAddPhone
        }
        initial={phonesHook.editingPhone}
        loading={phonesHook.submitting}
        brands={phonesHook.brands}
        storageOptions={phonesHook.storageOptions}
        specifications={[]}
      />

      <ConfirmDeleteModal
        isOpen={Boolean(phonesHook.deletingPhone)}
        onClose={() => phonesHook.setDeletingPhone(null)}
        onConfirm={() => phonesHook.handleDeletePhone(phonesHook.deletingPhone?.phone_id)}
        title="Delete Smartphone"
        message={`Delete "${phonesHook.deletingPhone?.name}" from warehouse catalogue?`}
        loading={phonesHook.submitting}
      />

      {/* Archive Smartphone Modal (SRS MG-01) */}
      <ConfirmDeleteModal
        isOpen={Boolean(phonesHook.archivingPhone)}
        onClose={() => phonesHook.setArchivingPhone(null)}
        onConfirm={() => phonesHook.handleArchivePhone(phonesHook.archivingPhone)}
        title="Archive Smartphone"
        subtitle="Hide from customer website"
        message={`Archive "${phonesHook.archivingPhone?.name}"? It will be hidden from the website catalogue (SRS MG-01). You can restore it to Draft at any time.`}
        confirmText="Archive Phone"
        variant="warning"
        loading={phonesHook.submitting}
      />

      {/* Restore Smartphone Modal (SRS MG-01) */}
      <ConfirmDeleteModal
        isOpen={Boolean(phonesHook.restoringPhone)}
        onClose={() => phonesHook.setRestoringPhone(null)}
        onConfirm={() => phonesHook.handleRestorePhone(phonesHook.restoringPhone, 'DRAFT')}
        title="Restore Smartphone"
        subtitle="Restore to catalogue"
        message={`Restore "${phonesHook.restoringPhone?.name}" to Draft status? It will become editable and can be published again (SRS MG-01).`}
        confirmText="Restore to Draft"
        variant="primary"
        loading={phonesHook.submitting}
      />

      {/* ── MODALS: BRANDS ───────────────────────────────────────── */}
      <BrandModal
        isOpen={brandsHook.isAddOpen || Boolean(brandsHook.editingBrand)}
        onClose={() => {
          brandsHook.setIsAddOpen(false);
          brandsHook.setEditingBrand(null);
        }}
        onSubmit={
          brandsHook.editingBrand
            ? (data) => brandsHook.handleUpdateBrand(brandsHook.editingBrand.brand_id, data)
            : brandsHook.handleAddBrand
        }
        initial={brandsHook.editingBrand}
        loading={brandsHook.submitting}
      />

      <ConfirmDeleteModal
        isOpen={Boolean(brandsHook.deletingBrand)}
        onClose={() => brandsHook.setDeletingBrand(null)}
        onConfirm={() => brandsHook.handleDeleteBrand(brandsHook.deletingBrand?.brand_id)}
        title="Delete Brand"
        message={`Delete brand "${brandsHook.deletingBrand?.brand_name}" and its catalogue metadata?`}
        loading={brandsHook.submitting}
      />

      <StorageModal
        isOpen={storageHook.isAddOpen || Boolean(storageHook.editingStorage)}
        onClose={() => {
          storageHook.setIsAddOpen(false);
          storageHook.setEditingStorage(null);
        }}
        onSubmit={
          storageHook.editingStorage
            ? (data) => storageHook.handleUpdateStorage(storageHook.editingStorage.storage_id, data)
            : storageHook.handleAddStorage
        }
        initial={storageHook.editingStorage}
        loading={storageHook.submitting}
      />

      <ConfirmDeleteModal
        isOpen={Boolean(storageHook.deletingStorage)}
        onClose={() => storageHook.setDeletingStorage(null)}
        onConfirm={() => storageHook.handleDeleteStorage(storageHook.deletingStorage?.storage_id)}
        title="Delete Storage Option"
        message={`Delete storage capacity option "${storageHook.deletingStorage?.storage_name}"?`}
        loading={storageHook.submitting}
      />

      <DetailModal
        isOpen={detailModal.isOpen}
        onClose={closeDetail}
        title={detailModal.title}
        data={detailModal.data}
      />

      {/* ── PHONE CUSTOMER VIEW MODAL (LIGHT VERSION) ─────────────── */}
      <PhoneCustomerViewModal
        isOpen={Boolean(viewingPhone)}
        phone={viewingPhone}
        allPhones={phonesHook.phones}
        onClose={() => setViewingPhone(null)}
        onEdit={(phoneToEdit) => {
          setViewingPhone(null);
          phonesHook.setEditingPhone(phoneToEdit);
        }}
        onSelectPhone={(nextPhone) => setViewingPhone(nextPhone)}
      />

      {/* ── PHONE COMPARISON MODAL (SRS C-05) ─────────────────────── */}
      <PhoneCompareModal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        phoneIds={selectedCompareIds}
        onRemovePhone={handleRemoveCompare}
        onAddPhone={handleAddCompare}
        onClearAll={handleClearCompare}
        allPhones={phonesHook.phones}
      />

      {/* ── FLOATING COMPARISON DOCK ───────────────────────────────── */}
      {selectedCompareIds.length > 0 && !isCompareModalOpen && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl px-5 py-3 flex items-center gap-4 animate-in slide-in-from-bottom-4">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <span className="text-xs font-bold text-slate-900 dark:text-white">
              Compare ({selectedCompareIds.length}/3)
            </span>
          </div>

          <div className="flex items-center gap-2">
            {selectedCompareIds.map((id) => {
              const p = phonesHook.phones.find((item) => item.phone_id === id);
              return (
                <div
                  key={id}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300"
                >
                  <span className="max-w-[110px] truncate font-medium">{p?.name || `Phone #${id}`}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveCompare(id)}
                    className="text-slate-400 hover:text-red-500 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-2 border-l border-slate-200 dark:border-slate-700 pl-4">
            <button
              type="button"
              onClick={() => setIsCompareModalOpen(true)}
              disabled={selectedCompareIds.length < 2}
              className="px-3.5 py-1.5 bg-gradient-to-r from-black via-neutral-900 to-rose-950 hover:to-rose-900 disabled:opacity-40 text-white text-xs font-semibold rounded-lg shadow-sm border border-neutral-800 transition-all cursor-pointer"
            >
              Compare Now
            </button>

            <button
              type="button"
              onClick={handleClearCompare}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer px-2 py-1"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
