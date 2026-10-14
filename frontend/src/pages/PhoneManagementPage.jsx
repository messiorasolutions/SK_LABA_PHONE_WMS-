import React, { useState } from 'react';
import usePhones from '../hooks/usePhones';
import useBrands from '../hooks/useBrands';
import useStorage from '../hooks/useStorage';
import useSpecifications from '../hooks/useSpecifications';

import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { COLORS } from '../constants/colors';
import { TYPOGRAPHY } from '../constants/typography';

import BrandModal from '../components/Modals/BrandModal';
import StorageModal from '../components/Modals/StorageModal';
import SpecificationModal from '../components/Modals/SpecificationModal';
import PhoneModal from '../components/Modals/PhoneModal';
import ConfirmDeleteModal from '../components/Modals/ConfirmDeleteModal';
import DetailModal from '../components/Modals/DetailModal';

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
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Layers,
  ArrowUpDown,
  Filter,
} from 'lucide-react';

export default function PhoneManagementPage() {
  const [activeTab, setActiveTab] = useState('phones'); // 'phones' | 'brands' | 'storage' | 'specs'

  // Custom Hooks
  const phonesHook = usePhones();
  const brandsHook = useBrands();
  const storageHook = useStorage();
  const specsHook = useSpecifications();

  // Active toast (from any hook)
  const currentToast =
    phonesHook.toast || brandsHook.toast || storageHook.toast || specsHook.toast;

  // Global detail modal state
  const [detailModal, setDetailModal] = useState({ isOpen: false, title: '', data: null });
  const openDetail = (title, data) => setDetailModal({ isOpen: true, title, data });
  const closeDetail = () => setDetailModal({ isOpen: false, title: '', data: null });

  // Formatters
  const formatPrice = (p) =>
    p ? `$${Number(p).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—';
  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

  return (
    <div className="space-y-2.5 max-w-7xl mx-auto">
      {/* ── Toast Alert ────────────────────────────────────────── */}
      {currentToast && (
        <div
          style={{
            backgroundColor: currentToast.type === 'error' ? COLORS.secondaryDark : COLORS.foreground,
            color: currentToast.type === 'error' ? COLORS.secondaryBorder : '#34D399',
          }}
          className="fixed top-4 right-4 z-50 flex items-center gap-2 px-3.5 py-2 shadow-xl border border-slate-700 text-xs font-bold animate-bounce"
        >
          {currentToast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span>{currentToast.message}</span>
        </div>
      )}

      {/* ── Sub-Navigation Tabs & Actions Row ────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 transition-colors duration-150">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveTab('phones')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold transition-all cursor-pointer border shadow-xs ${
              activeTab === 'phones'
                ? 'bg-[#DC2626] text-white border-[#DC2626]'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-red-500'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Smartphones Inventory</span>
            <span
              className={`text-xs font-mono font-bold ${
                activeTab === 'phones'
                  ? 'text-white/85'
                  : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              {phonesHook.totalCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('brands')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold transition-all cursor-pointer border shadow-xs ${
              activeTab === 'brands'
                ? 'bg-[#991B1B] text-white border-[#991B1B]'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-red-500'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>Phone Brands</span>
            <span
              className={`text-xs font-mono font-bold ${
                activeTab === 'brands'
                  ? 'text-white/85'
                  : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              {brandsHook.totalCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('storage')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold transition-all cursor-pointer border shadow-xs ${
              activeTab === 'storage'
                ? 'bg-[#7C3AED] text-white border-[#7C3AED]'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-purple-500'
            }`}
          >
            <HardDrive className="w-4 h-4" />
            <span>Storage Options</span>
            <span
              className={`text-xs font-mono font-bold ${
                activeTab === 'storage'
                  ? 'text-white/85'
                  : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              {storageHook.totalCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('specs')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold transition-all cursor-pointer border shadow-xs ${
              activeTab === 'specs'
                ? 'bg-[#059669] text-white border-[#059669]'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-emerald-500'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>Specifications & Accessories</span>
            <span
              className={`text-xs font-mono font-bold ${
                activeTab === 'specs'
                  ? 'text-white/85'
                  : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              {specsHook.totalCount}
            </span>
          </button>
        </div>

        {/* Right Action buttons */}
        <div className="flex items-center gap-2 shrink-0 md:ml-auto">
          <button
            onClick={() => {
              if (activeTab === 'phones') phonesHook.handleRefresh();
              else if (activeTab === 'brands') brandsHook.handleRefresh();
              else if (activeTab === 'storage') storageHook.handleRefresh();
              else specsHook.handleRefresh();
            }}
            className="p-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors cursor-pointer bg-white dark:bg-slate-900 shadow-xs"
            title="Refresh active module"
          >
            <RefreshCw
              className={`w-4 h-4 ${
                phonesHook.apiLoading || brandsHook.apiLoading || storageHook.apiLoading || specsHook.apiLoading
                  ? 'animate-spin text-[#DC2626]'
                  : ''
              }`}
            />
          </button>

          {activeTab === 'phones' && (
            <button
              onClick={() => phonesHook.setIsAddOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-bold text-white bg-[#DC2626] hover:bg-[#B91C1C] border border-transparent transition-all cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>Add Smartphone</span>
            </button>
          )}
          {activeTab === 'brands' && (
            <button
              onClick={() => brandsHook.setIsAddOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-bold text-white bg-[#991B1B] hover:bg-[#7F1D1D] border border-transparent transition-all cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>Add Brand</span>
            </button>
          )}
          {activeTab === 'storage' && (
            <button
              onClick={() => storageHook.setIsAddOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-bold text-white bg-[#7C3AED] hover:bg-[#6D28D9] border border-transparent transition-all cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>Add Storage</span>
            </button>
          )}
          {activeTab === 'specs' && (
            <button
              onClick={() => specsHook.setIsAddOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-bold text-white bg-[#059669] hover:bg-[#047857] border border-transparent transition-all cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>Add Specification</span>
            </button>
          )}
        </div>
      </div>



      {/* ── TAB 1: PHONES ──────────────────────────────────────── */}
      {activeTab === 'phones' && (
        <div className="space-y-2 animate-in fade-in duration-150">
          {/* Filter Bar */}
          <div className="p-2 border shadow-xs flex flex-wrap gap-2 items-center justify-between bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <div className="flex flex-wrap gap-1.5 items-center flex-1">
              <div className="relative min-w-[180px] flex-1 sm:flex-initial sm:w-60">
                <Search style={{ color: COLORS.placeholder }} className="w-3.5 h-3.5 absolute left-2.5 top-2" />
                <input
                  type="text"
                  value={phonesHook.searchTerm}
                  onChange={(e) => phonesHook.setSearchTerm(e.target.value)}
                  placeholder="Search phones..."
                  className="w-full pl-8 pr-2.5 py-1 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-[#DC2626] bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-800"
                />
              </div>

              <select
                value={phonesHook.brandFilter}
                onChange={(e) => phonesHook.setBrandFilter(e.target.value)}
                className="px-2.5 py-1 border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#DC2626]"
              >
                <option value="">All Brands</option>
                {phonesHook.brands.map((b) => (
                  <option key={b.brand_id} value={b.brand_id}>{b.brand_name}</option>
                ))}
              </select>

              <select
                value={phonesHook.conditionFilter}
                onChange={(e) => phonesHook.setConditionFilter(e.target.value)}
                className="px-2.5 py-1 border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#DC2626]"
              >
                <option value="">All Conditions</option>
                <option value="NEW">New</option>
                <option value="USED">Used</option>
              </select>

              <select
                value={phonesHook.statusFilter}
                onChange={(e) => phonesHook.setStatusFilter(e.target.value)}
                className="px-2.5 py-1 border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#DC2626]"
              >
                <option value="">All Statuses</option>
                <option value="PUBLISHED">Published</option>
                <option value="DRAFT">Draft</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>

            {/* Quick Find by ID */}
            <form onSubmit={phonesHook.handleFindById} className="flex items-center gap-1.5">
              <input
                type="number"
                min="1"
                value={phonesHook.findIdInput}
                onChange={(e) => phonesHook.setFindIdInput(e.target.value)}
                placeholder="Find ID..."
                className="w-20 px-2 py-1 border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:ring-1 focus:ring-[#DC2626]"
              />
              <Button variant="outline" size="sm" type="submit" loading={phonesHook.isFinding}>
                Find
              </Button>
            </form>
          </div>

          {/* Table Card */}
          <div className="border shadow-xs overflow-hidden bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            {phonesHook.apiLoading && phonesHook.phones.length === 0 ? (
              <div className="py-16 flex flex-col items-center justify-center gap-2 text-slate-400">
                <RefreshCw className="w-5 h-5 animate-spin text-[#DC2626]" />
                <span className="text-xs font-semibold">Loading smartphones inventory...</span>
              </div>
            ) : phonesHook.phones.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <Smartphone className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                <p className={TYPOGRAPHY.heading}>No phones found</p>
                <p className={TYPOGRAPHY.caption}>Add phones to populate catalogue</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800">
                      <th className="px-3 py-2 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">#</th>
                      <th className="px-3 py-2 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">Phone Model</th>
                      <th className="px-3 py-2 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">Brand</th>
                      <th className="px-3 py-2 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">Condition</th>
                      <th className="px-3 py-2 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">Price</th>
                      <th className="px-3 py-2 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">Stock</th>
                      <th className="px-3 py-2 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">Status</th>
                      <th className="px-3 py-2 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">Availability</th>
                      <th className="px-3 py-2 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {phonesHook.phones.map((phone) => (
                      <tr key={phone.phone_id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-3 py-1.5 font-mono text-slate-400 dark:text-slate-500">#{phone.phone_id}</td>
                        <td className="px-3 py-1.5 font-bold text-slate-900 dark:text-slate-100">{phone.name}</td>
                        <td className="px-3 py-1.5 font-medium text-slate-600 dark:text-slate-400">{phone.brand_name || '—'}</td>
                        <td className="px-3 py-1.5">
                          <Badge variant={phone.phone_condition === 'NEW' ? 'red' : 'amber'}>
                            {phone.phone_condition}
                          </Badge>
                        </td>
                        <td className="px-3 py-1.5 font-bold text-slate-900 dark:text-slate-100">{formatPrice(phone.price)}</td>
                        <td className="px-3 py-1.5 font-semibold text-slate-700 dark:text-slate-300">{phone.stock_quantity ?? 0}</td>
                        <td className="px-3 py-1.5">
                          <Badge variant={phone.status === 'PUBLISHED' ? 'success' : 'amber'}>
                            {phone.status}
                          </Badge>
                        </td>
                        <td className="px-3 py-1.5">
                          <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                            {phone.availability?.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-3 py-1.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openDetail(`Phone #${phone.phone_id}: ${phone.name}`, phone)}
                              className="p-1 border border-transparent hover:border-slate-300 dark:hover:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                              title="View Raw Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => phonesHook.setEditingPhone(phone)}
                              className="p-1 border border-transparent hover:border-red-300 dark:hover:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
                              title="Edit Phone"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => phonesHook.setDeletingPhone(phone)}
                              className="p-1 border border-transparent hover:border-red-300 dark:hover:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
                              title="Delete Phone"
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

      {/* ── TAB 2: BRANDS ──────────────────────────────────────── */}
      {activeTab === 'brands' && (
        <div className="space-y-2 animate-in fade-in duration-150">
          <div className="p-2 border shadow-xs flex flex-wrap gap-2 items-center justify-between bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <div className="relative min-w-[180px] w-60">
              <Search style={{ color: COLORS.placeholder }} className="w-3.5 h-3.5 absolute left-2.5 top-2" />
              <input
                type="text"
                value={brandsHook.searchTerm}
                onChange={(e) => brandsHook.setSearchTerm(e.target.value)}
                placeholder="Search brands..."
                className="w-full pl-8 pr-2.5 py-1 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-[#DC2626] bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-800"
              />
            </div>

            <form onSubmit={brandsHook.handleFindById} className="flex items-center gap-1.5">
              <input
                type="number"
                min="1"
                value={brandsHook.findIdInput}
                onChange={(e) => brandsHook.setFindIdInput(e.target.value)}
                placeholder="Find ID..."
                className="w-20 px-2 py-1 border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:ring-1 focus:ring-[#DC2626]"
              />
              <Button variant="outline" size="sm" type="submit" loading={brandsHook.isFinding}>
                Find
              </Button>
            </form>
          </div>

          <div className="border shadow-xs overflow-hidden bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            {brandsHook.apiLoading && brandsHook.brands.length === 0 ? (
              <div className="py-16 flex flex-col items-center justify-center gap-2 text-slate-400">
                <RefreshCw className="w-5 h-5 animate-spin text-[#DC2626]" />
                <span className="text-xs font-semibold">Loading brands...</span>
              </div>
            ) : brandsHook.filteredBrands.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <Tag className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                <p className={TYPOGRAPHY.heading}>No brands found</p>
                <p className={TYPOGRAPHY.caption}>Add your first phone manufacturer</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800">
                      <th className="px-3 py-2 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">#</th>
                      <th className="px-3 py-2 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">Brand Name</th>
                      <th className="px-3 py-2 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">Description</th>
                      <th className="px-3 py-2 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">Status</th>
                      <th className="px-3 py-2 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">Created At</th>
                      <th className="px-3 py-2 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {brandsHook.filteredBrands.map((brand) => (
                      <tr key={brand.brand_id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-3 py-1.5 font-mono text-slate-400 dark:text-slate-500">#{brand.brand_id}</td>
                        <td className="px-3 py-1.5 font-bold text-slate-900 dark:text-slate-100">{brand.brand_name}</td>
                        <td className="px-3 py-1.5 text-slate-600 dark:text-slate-400 max-w-xs truncate">{brand.description || '—'}</td>
                        <td className="px-3 py-1.5">
                          <Badge variant={brand.is_active === 1 || brand.is_active === true ? 'success' : 'red'}>
                            {brand.is_active === 1 || brand.is_active === true ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="px-3 py-1.5 text-slate-500 dark:text-slate-400">{formatDate(brand.created_at)}</td>
                        <td className="px-3 py-1.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openDetail(`Brand #${brand.brand_id}: ${brand.brand_name}`, brand)}
                              className="p-1 border border-transparent hover:border-slate-300 dark:hover:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                              title="View Raw Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => brandsHook.setEditingBrand(brand)}
                              className="p-1 border border-transparent hover:border-red-300 dark:hover:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
                              title="Edit Brand"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => brandsHook.setDeletingBrand(brand)}
                              className="p-1 border border-transparent hover:border-red-300 dark:hover:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
                              title="Delete Brand"
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

      {/* ── TAB 3: STORAGE OPTIONS ──────────────────────────────── */}
      {activeTab === 'storage' && (
        <div className="space-y-2 animate-in fade-in duration-150">
          <div className="p-2 border shadow-xs flex flex-wrap gap-2 items-center justify-between bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <div className="relative min-w-[180px] w-60">
              <Search style={{ color: COLORS.placeholder }} className="w-3.5 h-3.5 absolute left-2.5 top-2" />
              <input
                type="text"
                value={storageHook.searchTerm}
                onChange={(e) => storageHook.setSearchTerm(e.target.value)}
                placeholder="Search storage options..."
                className="w-full pl-8 pr-2.5 py-1 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-[#7C3AED] bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-800"
              />
            </div>

            <form onSubmit={storageHook.handleFindById} className="flex items-center gap-1.5">
              <input
                type="number"
                min="1"
                value={storageHook.findIdInput}
                onChange={(e) => storageHook.setFindIdInput(e.target.value)}
                placeholder="Find ID..."
                className="w-20 px-2 py-1 border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:ring-1 focus:ring-[#7C3AED]"
              />
              <Button variant="outline" size="sm" type="submit" loading={storageHook.isFinding}>
                Find
              </Button>
            </form>
          </div>

          <div className="border shadow-xs overflow-hidden bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            {storageHook.apiLoading && storageHook.storageOptions.length === 0 ? (
              <div className="py-16 flex flex-col items-center justify-center gap-2 text-slate-400">
                <RefreshCw className="w-5 h-5 animate-spin text-[#7C3AED]" />
                <span className="text-xs font-semibold">Loading storage options...</span>
              </div>
            ) : storageHook.filteredStorage.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <HardDrive className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                <p className={TYPOGRAPHY.heading}>No storage options found</p>
                <p className={TYPOGRAPHY.caption}>Add capacities (e.g. 128GB, 256GB)</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800">
                      <th className="px-3 py-2 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">#</th>
                      <th className="px-3 py-2 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">Option Name</th>
                      <th className="px-3 py-2 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">Capacity</th>
                      <th className="px-3 py-2 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">Created At</th>
                      <th className="px-3 py-2 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {storageHook.filteredStorage.map((s) => (
                      <tr key={s.storage_id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-3 py-1.5 font-mono text-slate-400 dark:text-slate-500">#{s.storage_id}</td>
                        <td className="px-3 py-1.5 font-bold text-slate-900 dark:text-slate-100">{s.storage_name}</td>
                        <td className="px-3 py-1.5">
                          <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                            {s.capacity_gb} GB
                          </span>
                        </td>
                        <td className="px-3 py-1.5 text-slate-500 dark:text-slate-400">{formatDate(s.created_at)}</td>
                        <td className="px-3 py-1.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openDetail(`Storage #${s.storage_id}: ${s.storage_name}`, s)}
                              className="p-1 border border-transparent hover:border-slate-300 dark:hover:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                              title="View Raw Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => storageHook.setEditingStorage(s)}
                              className="p-1 border border-transparent hover:border-red-300 dark:hover:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
                              title="Edit Storage Option"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => storageHook.setDeletingStorage(s)}
                              className="p-1 border border-transparent hover:border-red-300 dark:hover:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
                              title="Delete Storage Option"
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

      {/* ── TAB 4: SPECIFICATIONS ──────────────────────────────── */}
      {activeTab === 'specs' && (
        <div className="space-y-2 animate-in fade-in duration-150">
          <div className="p-2 border shadow-xs flex flex-wrap gap-2 items-center justify-between bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <div className="flex flex-wrap gap-1.5 items-center flex-1">
              <div className="relative min-w-[180px] w-60">
                <Search style={{ color: COLORS.placeholder }} className="w-3.5 h-3.5 absolute left-2.5 top-2" />
                <input
                  type="text"
                  value={specsHook.searchTerm}
                  onChange={(e) => specsHook.setSearchTerm(e.target.value)}
                  placeholder="Search specifications..."
                  className="w-full pl-8 pr-2.5 py-1 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-[#059669] bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-800"
                />
              </div>

              <select
                value={specsHook.typeFilter}
                onChange={(e) => specsHook.setTypeFilter(e.target.value)}
                className="px-2.5 py-1 border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#059669]"
              >
                <option value="">All Types (Tech & Accessory)</option>
                <option value="TECHNICAL">TECHNICAL only</option>
                <option value="ACCESSORY">ACCESSORY only</option>
              </select>
            </div>

            <form onSubmit={specsHook.handleFindById} className="flex items-center gap-1.5">
              <input
                type="number"
                min="1"
                value={specsHook.findIdInput}
                onChange={(e) => specsHook.setFindIdInput(e.target.value)}
                placeholder="Find ID..."
                className="w-20 px-2 py-1 border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:ring-1 focus:ring-[#059669]"
              />
              <Button variant="outline" size="sm" type="submit" loading={specsHook.isFinding}>
                Find
              </Button>
            </form>
          </div>

          <div className="border shadow-xs overflow-hidden bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            {specsHook.apiLoading && specsHook.specifications.length === 0 ? (
              <div className="py-16 flex flex-col items-center justify-center gap-2 text-slate-400">
                <RefreshCw className="w-5 h-5 animate-spin text-[#059669]" />
                <span className="text-xs font-semibold">Loading specifications...</span>
              </div>
            ) : specsHook.filteredSpecs.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <Cpu className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                <p className={TYPOGRAPHY.heading}>No specifications found</p>
                <p className={TYPOGRAPHY.caption}>Add technical specs or accessories</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800">
                      <th className="px-3 py-2 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">#</th>
                      <th className="px-3 py-2 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">Spec Name</th>
                      <th className="px-3 py-2 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">Category Type</th>
                      <th className="px-3 py-2 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">Description</th>
                      <th className="px-3 py-2 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">Status</th>
                      <th className="px-3 py-2 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {specsHook.filteredSpecs.map((spec) => (
                      <tr key={spec.specification_id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-3 py-1.5 font-mono text-slate-400 dark:text-slate-500">#{spec.specification_id}</td>
                        <td className="px-3 py-1.5 font-bold text-slate-900 dark:text-slate-100">{spec.specification_name}</td>
                        <td className="px-3 py-1.5">
                          <Badge variant={spec.specification_type === 'TECHNICAL' ? 'red' : 'amber'}>
                            {spec.specification_type}
                          </Badge>
                        </td>
                        <td className="px-3 py-1.5 text-slate-600 dark:text-slate-400 max-w-xs truncate">{spec.description || '—'}</td>
                        <td className="px-3 py-1.5">
                          <Badge variant={spec.is_active === 1 || spec.is_active === true ? 'success' : 'red'}>
                            {spec.is_active === 1 || spec.is_active === true ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="px-3 py-1.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openDetail(`Spec #${spec.specification_id}: ${spec.specification_name}`, spec)}
                              className="p-1 border border-transparent hover:border-slate-300 dark:hover:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                              title="View Raw Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => specsHook.setEditingSpec(spec)}
                              className="p-1 border border-transparent hover:border-red-300 dark:hover:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
                              title="Edit Specification"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => specsHook.setDeletingSpec(spec)}
                              className="p-1 border border-transparent hover:border-red-300 dark:hover:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
                              title="Delete Specification"
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



      {/* ── MODALS: PHONES ───────────────────────────────────────── */}
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

      {/* ── MODALS: STORAGE ──────────────────────────────────────── */}
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

      {/* ── MODALS: SPECIFICATIONS ───────────────────────────────── */}
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

      {/* ── DETAILS MODAL ────────────────────────────────────────── */}
      <DetailModal
        isOpen={detailModal.isOpen}
        onClose={closeDetail}
        title={detailModal.title}
        data={detailModal.data}
      />
    </div>
  );
}
