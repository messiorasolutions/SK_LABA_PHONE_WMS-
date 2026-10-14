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
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* ── Toast Alert ────────────────────────────────────────── */}
      {currentToast && (
        <div
          style={{
            backgroundColor: currentToast.type === 'error' ? COLORS.secondaryDark : COLORS.foreground,
            color: currentToast.type === 'error' ? COLORS.secondaryBorder : '#34D399',
          }}
          className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-xl border border-slate-700 text-xs font-bold animate-bounce"
        >
          {currentToast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span>{currentToast.message}</span>
        </div>
      )}

      {/* ── Header Card ────────────────────────────────────────── */}
      <div
        style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border }}
        className="p-4 sm:p-5 rounded-2xl border shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3.5">
          <div
            style={{ backgroundColor: COLORS.primary, color: COLORS.white }}
            className="w-12 h-12 rounded-xl flex items-center justify-center shadow-xs shrink-0"
          >
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h1 className={TYPOGRAPHY.h2}>Phone Management Portal</h1>
            <p className={TYPOGRAPHY.subheading}>
              Central warehouse inventory: phones, brands, specifications, and storage options
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (activeTab === 'phones') phonesHook.handleRefresh();
              else if (activeTab === 'brands') brandsHook.handleRefresh();
              else if (activeTab === 'storage') storageHook.handleRefresh();
              else specsHook.handleRefresh();
            }}
            style={{ borderColor: COLORS.border, color: COLORS.muted }}
            className="p-2 rounded-xl border hover:bg-slate-100 transition-colors cursor-pointer"
            title="Refresh active module"
          >
            <RefreshCw
              className={`w-4 h-4 ${
                phonesHook.apiLoading || brandsHook.apiLoading || storageHook.apiLoading || specsHook.apiLoading
                  ? 'animate-spin text-[#1D4ED8]'
                  : ''
              }`}
            />
          </button>

          {activeTab === 'phones' && (
            <Button variant="gradient" icon={Plus} onClick={() => phonesHook.setIsAddOpen(true)}>
              Add Smartphone
            </Button>
          )}
          {activeTab === 'brands' && (
            <Button variant="gradient" icon={Plus} onClick={() => brandsHook.setIsAddOpen(true)}>
              Add Brand
            </Button>
          )}
          {activeTab === 'storage' && (
            <Button variant="gradient" icon={Plus} onClick={() => storageHook.setIsAddOpen(true)}>
              Add Storage
            </Button>
          )}
          {activeTab === 'specs' && (
            <Button variant="gradient" icon={Plus} onClick={() => specsHook.setIsAddOpen(true)}>
              Add Specification
            </Button>
          )}
        </div>
      </div>

      {/* ── Sub-Navigation Tabs ─────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('phones')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'phones'
              ? 'bg-[#1D4ED8] text-white shadow-sm shadow-blue-500/20'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Smartphones Inventory</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeTab === 'phones' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
            {phonesHook.totalCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('brands')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'brands'
              ? 'bg-[#DC2626] text-white shadow-sm shadow-red-500/20'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Tag className="w-3.5 h-3.5" />
          <span>Phone Brands</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeTab === 'brands' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
            {brandsHook.totalCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('storage')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'storage'
              ? 'bg-[#7C3AED] text-white shadow-sm shadow-purple-500/20'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <HardDrive className="w-3.5 h-3.5" />
          <span>Storage Options</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeTab === 'storage' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
            {storageHook.totalCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('specs')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'specs'
              ? 'bg-[#059669] text-white shadow-sm shadow-emerald-500/20'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>Specifications & Accessories</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeTab === 'specs' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
            {specsHook.totalCount}
          </span>
        </button>
      </div>

      {/* ── TAB 1: PHONES ──────────────────────────────────────── */}
      {activeTab === 'phones' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Filter Bar */}
          <div
            style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border }}
            className="p-3.5 rounded-2xl border shadow-xs flex flex-wrap gap-2.5 items-center justify-between"
          >
            <div className="flex flex-wrap gap-2 items-center flex-1">
              <div className="relative min-w-[200px] flex-1 sm:flex-initial sm:w-64">
                <Search style={{ color: COLORS.placeholder }} className="w-3.5 h-3.5 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={phonesHook.searchTerm}
                  onChange={(e) => phonesHook.setSearchTerm(e.target.value)}
                  placeholder="Search phones..."
                  className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] bg-slate-50 focus:bg-white"
                />
              </div>

              <select
                value={phonesHook.brandFilter}
                onChange={(e) => phonesHook.setBrandFilter(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
              >
                <option value="">All Brands</option>
                {phonesHook.brands.map((b) => (
                  <option key={b.brand_id} value={b.brand_id}>{b.brand_name}</option>
                ))}
              </select>

              <select
                value={phonesHook.conditionFilter}
                onChange={(e) => phonesHook.setConditionFilter(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
              >
                <option value="">All Conditions</option>
                <option value="NEW">New</option>
                <option value="USED">Used</option>
              </select>

              <select
                value={phonesHook.statusFilter}
                onChange={(e) => phonesHook.setStatusFilter(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
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
                className="w-20 px-2.5 py-1.5 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white"
              />
              <Button variant="outline" size="sm" type="submit" loading={phonesHook.isFinding}>
                Find
              </Button>
            </form>
          </div>

          {/* Table Card */}
          <div
            style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border }}
            className="rounded-2xl border shadow-xs overflow-hidden"
          >
            {phonesHook.apiLoading && phonesHook.phones.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center gap-2 text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin text-[#1D4ED8]" />
                <span className="text-xs font-semibold">Loading smartphones inventory...</span>
              </div>
            ) : phonesHook.phones.length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                <Smartphone className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className={TYPOGRAPHY.heading}>No phones found</p>
                <p className={TYPOGRAPHY.caption}>Add phones to populate catalogue</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr style={{ backgroundColor: COLORS.background, borderColor: COLORS.border }} className="border-b">
                      <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[11px]">#</th>
                      <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[11px]">Phone Model</th>
                      <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[11px]">Brand</th>
                      <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[11px]">Condition</th>
                      <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[11px]">Price</th>
                      <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[11px]">Stock</th>
                      <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[11px]">Status</th>
                      <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[11px]">Availability</th>
                      <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[11px] text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {phonesHook.phones.map((phone) => (
                      <tr key={phone.phone_id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3 font-mono text-slate-400">#{phone.phone_id}</td>
                        <td className="px-4 py-3 font-bold text-slate-900">{phone.name}</td>
                        <td className="px-4 py-3 font-medium text-slate-600">{phone.brand_name || '—'}</td>
                        <td className="px-4 py-3">
                          <Badge variant={phone.phone_condition === 'NEW' ? 'blue' : 'amber'}>
                            {phone.phone_condition}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-900">{formatPrice(phone.price)}</td>
                        <td className="px-4 py-3 font-semibold text-slate-700">{phone.stock_quantity ?? 0}</td>
                        <td className="px-4 py-3">
                          <Badge variant={phone.status === 'PUBLISHED' ? 'success' : 'amber'}>
                            {phone.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[11px] font-semibold text-slate-600">
                            {phone.availability?.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openDetail(`Phone #${phone.phone_id}: ${phone.name}`, phone)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer"
                              title="View Raw Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => phonesHook.setEditingPhone(phone)}
                              className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 cursor-pointer"
                              title="Edit Phone"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => phonesHook.setDeletingPhone(phone)}
                              className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 cursor-pointer"
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
        <div className="space-y-4 animate-in fade-in duration-150">
          <div
            style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border }}
            className="p-3.5 rounded-2xl border shadow-xs flex flex-wrap gap-2.5 items-center justify-between"
          >
            <div className="relative min-w-[200px] w-64">
              <Search style={{ color: COLORS.placeholder }} className="w-3.5 h-3.5 absolute left-3 top-2.5" />
              <input
                type="text"
                value={brandsHook.searchTerm}
                onChange={(e) => brandsHook.setSearchTerm(e.target.value)}
                placeholder="Search brands..."
                className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#DC2626] bg-slate-50 focus:bg-white"
              />
            </div>

            <form onSubmit={brandsHook.handleFindById} className="flex items-center gap-1.5">
              <input
                type="number"
                min="1"
                value={brandsHook.findIdInput}
                onChange={(e) => brandsHook.setFindIdInput(e.target.value)}
                placeholder="Find ID..."
                className="w-20 px-2.5 py-1.5 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white"
              />
              <Button variant="outline" size="sm" type="submit" loading={brandsHook.isFinding}>
                Find
              </Button>
            </form>
          </div>

          <div
            style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border }}
            className="rounded-2xl border shadow-xs overflow-hidden"
          >
            {brandsHook.apiLoading && brandsHook.brands.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center gap-2 text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin text-[#DC2626]" />
                <span className="text-xs font-semibold">Loading brands...</span>
              </div>
            ) : brandsHook.filteredBrands.length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                <Tag className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className={TYPOGRAPHY.heading}>No brands found</p>
                <p className={TYPOGRAPHY.caption}>Add your first phone manufacturer</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr style={{ backgroundColor: COLORS.background, borderColor: COLORS.border }} className="border-b">
                      <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[11px]">#</th>
                      <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[11px]">Brand Name</th>
                      <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[11px]">Description</th>
                      <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[11px]">Status</th>
                      <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[11px]">Created At</th>
                      <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[11px] text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {brandsHook.filteredBrands.map((brand) => (
                      <tr key={brand.brand_id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3 font-mono text-slate-400">#{brand.brand_id}</td>
                        <td className="px-4 py-3 font-bold text-slate-900">{brand.brand_name}</td>
                        <td className="px-4 py-3 text-slate-600 max-w-xs truncate">{brand.description || '—'}</td>
                        <td className="px-4 py-3">
                          <Badge variant={brand.is_active === 1 || brand.is_active === true ? 'success' : 'red'}>
                            {brand.is_active === 1 || brand.is_active === true ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-slate-500">{formatDate(brand.created_at)}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openDetail(`Brand #${brand.brand_id}: ${brand.brand_name}`, brand)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer"
                              title="View Raw Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => brandsHook.setEditingBrand(brand)}
                              className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 cursor-pointer"
                              title="Edit Brand"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => brandsHook.setDeletingBrand(brand)}
                              className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 cursor-pointer"
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
        <div className="space-y-4 animate-in fade-in duration-150">
          <div
            style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border }}
            className="p-3.5 rounded-2xl border shadow-xs flex flex-wrap gap-2.5 items-center justify-between"
          >
            <div className="relative min-w-[200px] w-64">
              <Search style={{ color: COLORS.placeholder }} className="w-3.5 h-3.5 absolute left-3 top-2.5" />
              <input
                type="text"
                value={storageHook.searchTerm}
                onChange={(e) => storageHook.setSearchTerm(e.target.value)}
                placeholder="Search storage options..."
                className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#7C3AED] bg-slate-50 focus:bg-white"
              />
            </div>

            <form onSubmit={storageHook.handleFindById} className="flex items-center gap-1.5">
              <input
                type="number"
                min="1"
                value={storageHook.findIdInput}
                onChange={(e) => storageHook.setFindIdInput(e.target.value)}
                placeholder="Find ID..."
                className="w-20 px-2.5 py-1.5 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white"
              />
              <Button variant="outline" size="sm" type="submit" loading={storageHook.isFinding}>
                Find
              </Button>
            </form>
          </div>

          <div
            style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border }}
            className="rounded-2xl border shadow-xs overflow-hidden"
          >
            {storageHook.apiLoading && storageHook.storageOptions.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center gap-2 text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin text-[#7C3AED]" />
                <span className="text-xs font-semibold">Loading storage options...</span>
              </div>
            ) : storageHook.filteredStorage.length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                <HardDrive className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className={TYPOGRAPHY.heading}>No storage options found</p>
                <p className={TYPOGRAPHY.caption}>Add capacities (e.g. 128GB, 256GB)</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr style={{ backgroundColor: COLORS.background, borderColor: COLORS.border }} className="border-b">
                      <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[11px]">#</th>
                      <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[11px]">Option Name</th>
                      <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[11px]">Capacity</th>
                      <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[11px]">Created At</th>
                      <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[11px] text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {storageHook.filteredStorage.map((s) => (
                      <tr key={s.storage_id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3 font-mono text-slate-400">#{s.storage_id}</td>
                        <td className="px-4 py-3 font-bold text-slate-900">{s.storage_name}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-700">
                            {s.capacity_gb} GB
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500">{formatDate(s.created_at)}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openDetail(`Storage #${s.storage_id}: ${s.storage_name}`, s)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer"
                              title="View Raw Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => storageHook.setEditingStorage(s)}
                              className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 cursor-pointer"
                              title="Edit Storage Option"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => storageHook.setDeletingStorage(s)}
                              className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 cursor-pointer"
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
        <div className="space-y-4 animate-in fade-in duration-150">
          <div
            style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border }}
            className="p-3.5 rounded-2xl border shadow-xs flex flex-wrap gap-2.5 items-center justify-between"
          >
            <div className="flex flex-wrap gap-2 items-center flex-1">
              <div className="relative min-w-[200px] w-64">
                <Search style={{ color: COLORS.placeholder }} className="w-3.5 h-3.5 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={specsHook.searchTerm}
                  onChange={(e) => specsHook.setSearchTerm(e.target.value)}
                  placeholder="Search specifications..."
                  className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#059669] bg-slate-50 focus:bg-white"
                />
              </div>

              <select
                value={specsHook.typeFilter}
                onChange={(e) => specsHook.setTypeFilter(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#059669]"
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
                className="w-20 px-2.5 py-1.5 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white"
              />
              <Button variant="outline" size="sm" type="submit" loading={specsHook.isFinding}>
                Find
              </Button>
            </form>
          </div>

          <div
            style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border }}
            className="rounded-2xl border shadow-xs overflow-hidden"
          >
            {specsHook.apiLoading && specsHook.specifications.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center gap-2 text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin text-[#059669]" />
                <span className="text-xs font-semibold">Loading specifications...</span>
              </div>
            ) : specsHook.filteredSpecs.length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                <Cpu className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className={TYPOGRAPHY.heading}>No specifications found</p>
                <p className={TYPOGRAPHY.caption}>Add technical specs or accessories</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr style={{ backgroundColor: COLORS.background, borderColor: COLORS.border }} className="border-b">
                      <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[11px]">#</th>
                      <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[11px]">Spec Name</th>
                      <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[11px]">Category Type</th>
                      <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[11px]">Description</th>
                      <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[11px]">Status</th>
                      <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[11px] text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {specsHook.filteredSpecs.map((spec) => (
                      <tr key={spec.specification_id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3 font-mono text-slate-400">#{spec.specification_id}</td>
                        <td className="px-4 py-3 font-bold text-slate-900">{spec.specification_name}</td>
                        <td className="px-4 py-3">
                          <Badge variant={spec.specification_type === 'TECHNICAL' ? 'blue' : 'amber'}>
                            {spec.specification_type}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-slate-600 max-w-xs truncate">{spec.description || '—'}</td>
                        <td className="px-4 py-3">
                          <Badge variant={spec.is_active === 1 || spec.is_active === true ? 'success' : 'red'}>
                            {spec.is_active === 1 || spec.is_active === true ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openDetail(`Spec #${spec.specification_id}: ${spec.specification_name}`, spec)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer"
                              title="View Raw Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => specsHook.setEditingSpec(spec)}
                              className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 cursor-pointer"
                              title="Edit Specification"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => specsHook.setDeletingSpec(spec)}
                              className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 cursor-pointer"
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
