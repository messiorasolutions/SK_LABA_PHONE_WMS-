import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import usePhones from '../hooks/usePhones';
import useBrands from '../hooks/useBrands';
import useStorage from '../hooks/useStorage';
import useSpecifications from '../hooks/useSpecifications';

import BrandModal from '../components/Modals/BrandModal';
import StorageModal from '../components/Modals/StorageModal';
import SpecificationModal from '../components/Modals/SpecificationModal';
import PhoneModal from '../components/Modals/PhoneModal';
import ConfirmDeleteModal from '../components/Modals/ConfirmDeleteModal';
import DetailModal from '../components/Modals/DetailModal';
import PhoneCompareModal from '../components/Modals/PhoneCompareModal';

import {
  Smartphone,
  Tag,
  HardDrive,
  Cpu,
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

function PhoneThumbnail({ src, alt }) {
  const [error, setError] = useState(false);
  if (src && !error) {
    return (
      <img
        src={src}
        alt={alt}
        onError={() => setError(true)}
        className="w-10 h-10 rounded-lg object-contain bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-0.5 shrink-0"
      />
    );
  }
  return (
    <div className="w-10 h-10 rounded-lg bg-gradient-to-b from-blue-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center shrink-0 p-1">
      <svg className="w-6 h-8" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="1.5" y="1" width="21" height="30" rx="3.5" fill="#0F172A" stroke="#334155" strokeWidth="1" />
        <rect x="3" y="2.5" width="18" height="27" rx="2" fill="url(#screenGrad)" />
        <circle cx="12" cy="4" r="0.8" fill="#0F172A" />
        <defs>
          <linearGradient id="screenGrad" x1="3" y1="2.5" x2="21" y2="29.5" gradientUnits="userSpaceOnUse">
            <stop stopColor="#3B82F6" />
            <stop offset="0.5" stopColor="#1D4ED8" />
            <stop offset="1" stopColor="#0F172A" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

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
  const specsHook = useSpecifications();

  useEffect(() => {
    if (urlTab && ['phones', 'brands', 'storage', 'specs'].includes(urlTab)) {
      setActiveTab(urlTab);
    }
    if (searchParams.get('action') === 'add') {
      phonesHook.setIsAddOpen(true);
    }
  }, [urlTab, searchParams]);

  const currentToast =
    phonesHook.toast || brandsHook.toast || storageHook.toast || specsHook.toast;

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
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
            Phone Management Portal
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Manage your smartphone inventory, brands, models, and specifications.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'phones' && (
            <button
              onClick={() => phonesHook.setIsAddOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#2563EB] hover:bg-blue-700 rounded-full shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>Add Phone</span>
            </button>
          )}
          {activeTab === 'brands' && (
            <button
              onClick={() => brandsHook.setIsAddOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#2563EB] hover:bg-blue-700 rounded-full shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>Add Brand</span>
            </button>
          )}
          {activeTab === 'storage' && (
            <button
              onClick={() => storageHook.setIsAddOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#2563EB] hover:bg-blue-700 rounded-full shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>Add Storage</span>
            </button>
          )}
          {activeTab === 'specs' && (
            <button
              onClick={() => specsHook.setIsAddOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#2563EB] hover:bg-blue-700 rounded-full shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>Add Specification</span>
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
              ? 'border-b-2 border-[#2563EB] text-[#2563EB] font-semibold'
              : 'border-b-2 border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 font-medium'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5 shrink-0" />
          <span>Smartphones Inventory</span>
          <span
            className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
              activeTab === 'phones'
                ? 'bg-blue-50 dark:bg-blue-950 text-[#2563EB] dark:text-blue-400'
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
              ? 'border-b-2 border-[#2563EB] text-[#2563EB] font-semibold'
              : 'border-b-2 border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 font-medium'
          }`}
        >
          <Tag className="w-3.5 h-3.5 shrink-0" />
          <span>Phone Brands</span>
          <span
            className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
              activeTab === 'brands'
                ? 'bg-blue-50 dark:bg-blue-950 text-[#2563EB] dark:text-blue-400'
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
              ? 'border-b-2 border-[#2563EB] text-[#2563EB] font-semibold'
              : 'border-b-2 border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 font-medium'
          }`}
        >
          <HardDrive className="w-3.5 h-3.5 shrink-0" />
          <span>Storage Options</span>
          <span
            className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
              activeTab === 'storage'
                ? 'bg-blue-50 dark:bg-blue-950 text-[#2563EB] dark:text-blue-400'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
            }`}
          >
            {storageHook.totalCount || 2}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab('specs');
            setSearchParams({ tab: 'specs' });
          }}
          className={`flex items-center gap-2 pb-3 text-xs cursor-pointer transition-colors whitespace-nowrap -mb-px ${
            activeTab === 'specs'
              ? 'border-b-2 border-[#2563EB] text-[#2563EB] font-semibold'
              : 'border-b-2 border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 font-medium'
          }`}
        >
          <Cpu className="w-3.5 h-3.5 shrink-0" />
          <span>Specifications & Accessories</span>
          <span
            className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
              activeTab === 'specs'
                ? 'bg-blue-50 dark:bg-blue-950 text-[#2563EB] dark:text-blue-400'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
            }`}
          >
            {specsHook.totalCount || 2}
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
                      <th className="px-4 py-3 font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px] w-36">ID</th>
                      <th className="px-4 py-3 font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">Phone Model</th>
                      <th className="px-4 py-3 font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">Brand</th>
                      <th className="px-4 py-3 font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">Condition</th>
                      <th className="px-4 py-3 font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">Price</th>
                      <th className="px-4 py-3 font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">Low Stock Level</th>
                      <th className="px-4 py-3 font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">Status</th>
                      <th className="px-4 py-3 font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px] text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {phonesHook.phones.map((phone, idx) => (
                      <tr key={phone.phone_id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3 font-mono text-slate-400 dark:text-slate-500 text-xs">
                          SKLABA_Phone_{phone.phone_id || idx + 1}
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <PhoneThumbnail src={phone.image_url} alt={phone.name} />
                            <div>
                              <div className="font-semibold text-xs text-slate-800 dark:text-slate-100 leading-tight">
                                {phone.name}
                              </div>
                              <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                                {getPhoneSubtitle(phone)}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <BrandDisplay brandName={phone.brand_name} />
                        </td>

                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300">
                            <span
                              className={`inline-block rounded-full shrink-0 ${
                                phone.phone_condition === 'NEW' ? 'bg-blue-500' : 'bg-amber-500'
                              }`}
                              style={{
                                borderRadius: '50%',
                                width: '6px',
                                height: '6px',
                              }}
                            />
                            <span>{phone.phone_condition === 'NEW' ? 'New' : (phone.phone_condition || 'Used')}</span>
                          </span>
                        </td>

                        <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-100 text-xs">
                          {formatPrice(phone.price)}
                        </td>

                        <td className="px-4 py-3 text-xs font-medium text-slate-600 dark:text-slate-300">
                          {phone.low_stock_level ?? phone.stock_quantity ?? 25}
                        </td>

                        <td className="px-4 py-3">
                          {phone.is_archived === 1 || phone.status === 'ARCHIVED' ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                              <span
                                className="inline-block rounded-full shrink-0 bg-amber-500"
                                style={{
                                  borderRadius: '50%',
                                  width: '6px',
                                  height: '6px',
                                }}
                              />
                              <span>Archived</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300">
                              <span
                                className={`inline-block rounded-full shrink-0 ${
                                  phone.status === 'PUBLISHED' ? 'bg-emerald-500' : 'bg-slate-400'
                                }`}
                                style={{
                                  borderRadius: '50%',
                                  width: '6px',
                                  height: '6px',
                                }}
                              />
                              <span>{phone.status ? (phone.status.charAt(0) + phone.status.slice(1).toLowerCase()) : 'Draft'}</span>
                            </span>
                          )}
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
                                  : 'border-slate-100 dark:border-slate-800 text-slate-400 hover:text-[#2563EB] hover:bg-blue-50 dark:hover:bg-slate-800'
                              }`}
                              title={
                                selectedCompareIds.includes(phone.phone_id)
                                  ? 'Remove from comparison'
                                  : 'Add to side-by-side comparison (SRS C-05)'
                              }
                            >
                              <Scale className="w-3.5 h-3.5" />
                            </button>

                            {/* View */}
                            <button
                              onClick={() => openDetail(`SKLABA_Phone_${phone.phone_id}: ${phone.name}`, phone)}
                              className="p-1.5 border border-slate-100 dark:border-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                              title="View details"
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
                              className="p-1.5 border border-red-100 dark:border-red-950/60 text-red-500 bg-red-50 dark:bg-red-950/40 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors cursor-pointer"
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
                      <th className="px-4 py-3 font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px] w-36">ID</th>
                      <th className="px-4 py-3 font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">Brand Name</th>
                      <th className="px-4 py-3 font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">Description</th>
                      <th className="px-4 py-3 font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">Status</th>
                      <th className="px-4 py-3 font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">Created At</th>
                      <th className="px-4 py-3 font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px] text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {brandsHook.filteredBrands.map((brand) => (
                      <tr key={brand.brand_id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3 font-mono text-slate-400 dark:text-slate-500">SKLABA_Brand_{brand.brand_id}</td>
                        <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-100">{brand.brand_name}</td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400 max-w-xs truncate">{brand.description || '—'}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${
                              brand.is_active === 1 || brand.is_active === true
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60'
                                : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                            }`}
                            style={{ borderRadius: '9999px' }}
                          >
                            <span
                              className={`inline-block rounded-full shrink-0 ${
                                brand.is_active === 1 || brand.is_active === true ? 'bg-emerald-500' : 'bg-slate-400'
                              }`}
                              style={{
                                borderRadius: '50%',
                                width: '6px',
                                height: '6px',
                                minWidth: '6px',
                                minHeight: '6px',
                              }}
                            />
                            <span>{brand.is_active === 1 || brand.is_active === true ? 'Active' : 'Inactive'}</span>
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-400 dark:text-slate-500">{formatDate(brand.created_at)}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openDetail(`SKLABA_Brand_${brand.brand_id}: ${brand.brand_name}`, brand)}
                              className="p-1.5 border border-slate-100 dark:border-slate-800 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
                              title="View details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => brandsHook.setEditingBrand(brand)}
                              className="p-1.5 border border-slate-100 dark:border-slate-800 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
                              title="Edit brand"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => brandsHook.setDeletingBrand(brand)}
                              className="p-1.5 border border-red-100 text-red-500 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
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
                      <th className="px-4 py-3 font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px] w-36">ID</th>
                      <th className="px-4 py-3 font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">Option Name</th>
                      <th className="px-4 py-3 font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">Capacity</th>
                      <th className="px-4 py-3 font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">Created At</th>
                      <th className="px-4 py-3 font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px] text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {storageHook.filteredStorage.map((s) => (
                      <tr key={s.storage_id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3 font-mono text-slate-400 dark:text-slate-500">SKLABA_Storage_{s.storage_id}</td>
                        <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-100">{s.storage_name}</td>
                        <td className="px-4 py-3">
                          <span className="font-semibold text-xs text-[#2563EB] bg-blue-50 px-2 py-0.5 rounded-md">
                            {s.capacity_gb} GB
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-400 dark:text-slate-500">{formatDate(s.created_at)}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openDetail(`SKLABA_Storage_${s.storage_id}: ${s.storage_name}`, s)}
                              className="p-1.5 border border-slate-100 dark:border-slate-800 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
                              title="View details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => storageHook.setEditingStorage(s)}
                              className="p-1.5 border border-slate-100 dark:border-slate-800 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
                              title="Edit storage"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => storageHook.setDeletingStorage(s)}
                              className="p-1.5 border border-red-100 text-red-500 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
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

      {activeTab === 'specs' && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5 flex-1">
              <div className="relative w-full sm:w-72">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="text"
                  value={specsHook.searchTerm}
                  onChange={(e) => specsHook.setSearchTerm(e.target.value)}
                  placeholder="Search specifications..."
                  className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB]"
                />
              </div>

              <div className="relative min-w-[150px]">
                <select
                  value={specsHook.typeFilter}
                  onChange={(e) => specsHook.setTypeFilter(e.target.value)}
                  className="w-full pl-3 pr-8 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-200 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB] cursor-pointer"
                >
                  <option value="">All Types (Tech & Accessory)</option>
                  <option value="TECHNICAL">TECHNICAL only</option>
                  <option value="ACCESSORY">ACCESSORY only</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
              </div>
            </div>

            <button
              onClick={() => specsHook.handleRefresh()}
              className="p-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 rounded-lg transition-colors cursor-pointer"
              title="Refresh specifications"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${specsHook.apiLoading ? 'animate-spin text-[#2563EB]' : ''}`} />
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
            {specsHook.apiLoading && specsHook.specifications.length === 0 ? (
              <div className="py-16 flex flex-col items-center justify-center gap-2 text-slate-400">
                <RefreshCw className="w-5 h-5 animate-spin text-[#2563EB]" />
                <span className="text-xs font-semibold">Loading specifications...</span>
              </div>
            ) : specsHook.filteredSpecs.length === 0 ? (
              <div className="py-14 text-center text-slate-400">
                <Cpu className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                <p className="font-semibold text-xs text-slate-700 dark:text-slate-300">No specifications found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                      <th className="px-4 py-3 font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px] w-36">ID</th>
                      <th className="px-4 py-3 font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">Spec Name</th>
                      <th className="px-4 py-3 font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">Category Type</th>
                      <th className="px-4 py-3 font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">Description</th>
                      <th className="px-4 py-3 font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">Status</th>
                      <th className="px-4 py-3 font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px] text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {specsHook.filteredSpecs.map((spec) => (
                      <tr key={spec.specification_id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3 font-mono text-slate-400 dark:text-slate-500">SKLABA_Spec_{spec.specification_id}</td>
                        <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-100">{spec.specification_name}</td>
                        <td className="px-4 py-3">
                          <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {spec.specification_type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400 max-w-xs truncate">{spec.description || '—'}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${
                              spec.is_active === 1 || spec.is_active === true
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60'
                                : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                            }`}
                            style={{ borderRadius: '9999px' }}
                          >
                            <span
                              className={`inline-block rounded-full shrink-0 ${
                                spec.is_active === 1 || spec.is_active === true ? 'bg-emerald-500' : 'bg-slate-400'
                              }`}
                              style={{
                                borderRadius: '50%',
                                width: '6px',
                                height: '6px',
                                minWidth: '6px',
                                minHeight: '6px',
                              }}
                            />
                            <span>{spec.is_active === 1 || spec.is_active === true ? 'Active' : 'Inactive'}</span>
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openDetail(`SKLABA_Spec_${spec.specification_id}: ${spec.specification_name}`, spec)}
                              className="p-1.5 border border-slate-100 dark:border-slate-800 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
                              title="View details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => specsHook.setEditingSpec(spec)}
                              className="p-1.5 border border-slate-100 dark:border-slate-800 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
                              title="Edit spec"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => specsHook.setDeletingSpec(spec)}
                              className="p-1.5 border border-red-100 text-red-500 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                              title="Delete spec"
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
        specifications={phonesHook.specifications}
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

      <SpecificationModal
        isOpen={specsHook.isAddOpen || Boolean(specsHook.editingSpec)}
        onClose={() => {
          specsHook.setIsAddOpen(false);
          specsHook.setEditingSpec(null);
        }}
        onSubmit={
          specsHook.editingSpec
            ? (data) => specsHook.handleUpdateSpec(specsHook.editingSpec.specification_id, data)
            : specsHook.handleAddSpec
        }
        initial={specsHook.editingSpec}
        loading={specsHook.submitting}
      />

      <ConfirmDeleteModal
        isOpen={Boolean(specsHook.deletingSpec)}
        onClose={() => specsHook.setDeletingSpec(null)}
        onConfirm={() => specsHook.handleDeleteSpec(specsHook.deletingSpec?.specification_id)}
        title="Delete Specification"
        message={`Delete "${specsHook.deletingSpec?.specification_name}" from specifications catalogue?`}
        loading={specsHook.submitting}
      />

      <DetailModal
        isOpen={detailModal.isOpen}
        onClose={closeDetail}
        title={detailModal.title}
        data={detailModal.data}
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
            <Scale className="w-4 h-4 text-[#2563EB]" />
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
              className="px-3.5 py-1.5 bg-[#2563EB] hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
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
