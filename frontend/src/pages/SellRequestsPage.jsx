import React, { useEffect, useState } from 'react';
import {
  ArrowLeftRight,
  Search,
  Phone,
  AlertCircle,
  RefreshCw,
  Smartphone,
  CheckCircle2,
  Calendar,
  HardDrive,
  User,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  Store,
  DollarSign,
  Clock,
  Check,
  X,
  Eye,
  Trash2,
  EyeOff,
  Filter,
} from 'lucide-react';
import { sellRequestService } from '../services/sellRequestService';
import { userService } from '../services/userService';
import marketplaceAdminService from '../services/marketplaceAdminService';
import SellRequestDetailView from '../components/SellRequests/SellRequestDetailView';
import MarketplaceListingDetailModal from '../components/Marketplace/MarketplaceListingDetailModal';
import MarketplaceOrdersView from '../components/Marketplace/MarketplaceOrdersView';
import MarketplaceSettingsView from '../components/Marketplace/MarketplaceSettingsView';
import ErrorBoundary from '../components/Common/ErrorBoundary';
import { Sliders, Percent } from 'lucide-react';

function formatCurrency(amount) {
  const num = Number(amount || 0);
  return 'Rs. ' + num.toLocaleString('en-US');
}

function resolvePhotoUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }
  const base = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/+$/, '');
  const clean = trimmed.replace(/^\/+/, '');
  if (clean.startsWith('uploads/')) {
    return `${base}/${clean}`;
  }
  return `${base}/uploads/${clean}`;
}

const MARKETPLACE_STATUS_BADGES = {
  PENDING_REVIEW: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400',
  UNDER_REVIEW: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-400',
  APPROVED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400',
  PUBLISHED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800',
  RESERVED: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-400',
  SOLD: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-400 font-bold',
  REJECTED: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-400',
  CHANGES_REQUESTED: 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-400',
  UNPUBLISHED: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400',
  CANCELLED: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
};

const LEGACY_STATUS_CONFIG = {
  New: { label: 'New', text: 'text-rose-600 dark:text-rose-400', dot: 'bg-rose-500' },
  'Quote Given': { label: 'Quote Given', text: 'text-sky-600 dark:text-sky-400', dot: 'bg-sky-500' },
  Accepted: { label: 'Accepted', text: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500' },
  Declined: { label: 'Declined', text: 'text-amber-600 dark:text-amber-400', dot: 'bg-amber-500' },
  Closed: { label: 'Closed', text: 'text-slate-500 dark:text-slate-400', dot: 'bg-slate-400' },
};

export default function SellRequestsPage() {
  // Active Management Tab: 'marketplace' | 'orders' | 'legacy'
  const [activeTab, setActiveTab] = useState('marketplace');

  // -------------------------------------------------------------
  // 1. MARKETPLACE LISTINGS STATE
  // -------------------------------------------------------------
  const [marketplaceListings, setMarketplaceListings] = useState([]);
  const [mpLoading, setMpLoading] = useState(true);
  const [mpError, setMpError] = useState('');
  const [mpSearch, setMpSearch] = useState('');
  const [mpStatusFilter, setMpStatusFilter] = useState('');
  const [mpPagination, setMpPagination] = useState({ page: 1, limit: 12, totalPages: 1, totalRecords: 0 });
  const [selectedMpListing, setSelectedMpListing] = useState(null);

  // Quick Action Loading for Table Buttons
  const [actionInProgressId, setActionInProgressId] = useState(null);

  const fetchMarketplaceListings = async () => {
    setMpLoading(true);
    setMpError('');
    try {
      const params = {
        page: mpPagination.page,
        limit: mpPagination.limit,
      };
      if (mpSearch.trim()) params.search = mpSearch.trim();
      if (mpStatusFilter) params.status = mpStatusFilter;

      const res = await marketplaceAdminService.getListings(params);
      if (res?.success) {
        setMarketplaceListings(res.data || []);
        if (res.pagination) {
          setMpPagination({
            page: Number(res.pagination.page) || 1,
            limit: Number(res.pagination.limit) || 12,
            totalPages: Number(res.pagination.totalPages) || 1,
            totalRecords: Number(res.pagination.totalRecords) || 0,
          });
        }
      }
    } catch (err) {
      setMpError(err.response?.data?.message || err.message || 'Failed to fetch marketplace listings');
    } finally {
      setMpLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'marketplace') {
      fetchMarketplaceListings();
    }
  }, [activeTab, mpPagination.page, mpStatusFilter]);

  const handleMpSearchSubmit = (e) => {
    e.preventDefault();
    setMpPagination((prev) => ({ ...prev, page: 1 }));
    fetchMarketplaceListings();
  };

  // Direct Table Actions for Marketplace Listings
  const handleApproveListing = async (id) => {
    setActionInProgressId(id);
    try {
      await marketplaceAdminService.approveListing(id);
      fetchMarketplaceListings();
    } finally {
      setActionInProgressId(null);
    }
  };

  const handleRejectListing = async (id, reason) => {
    setActionInProgressId(id);
    try {
      await marketplaceAdminService.rejectListing(id, { rejection_reason: reason });
      fetchMarketplaceListings();
    } finally {
      setActionInProgressId(null);
    }
  };

  const handleRequestChanges = async (id, reason) => {
    setActionInProgressId(id);
    try {
      await marketplaceAdminService.requestChanges(id, { changes_requested_reason: reason });
      fetchMarketplaceListings();
    } finally {
      setActionInProgressId(null);
    }
  };

  const handleUnpublishListing = async (id) => {
    setActionInProgressId(id);
    try {
      await marketplaceAdminService.unpublishListing(id);
      fetchMarketplaceListings();
    } finally {
      setActionInProgressId(null);
    }
  };

  const handleMarkSoldListing = async (id, payload) => {
    setActionInProgressId(id);
    try {
      await marketplaceAdminService.markListingSold(id, payload);
      fetchMarketplaceListings();
    } finally {
      setActionInProgressId(null);
    }
  };

  const handleDeleteListing = async (id, reason) => {
    setActionInProgressId(id);
    try {
      await marketplaceAdminService.deleteListing(id, { reason });
      fetchMarketplaceListings();
    } finally {
      setActionInProgressId(null);
    }
  };

  // Quick Table Row Button: Mark as Sold & Remove
  const handleQuickMarkSold = async (listing, e) => {
    e.stopPropagation();
    const promptMsg = `Mark "${listing.brand} ${listing.model}" as SOLD?\n\nThis will immediately remove and archive this phone from the public Marketplace catalogue so customers can no longer purchase it.`;
    if (!window.confirm(promptMsg)) return;

    setActionInProgressId(listing.listing_id);
    try {
      await marketplaceAdminService.markListingSold(listing.listing_id, {
        sold_price: listing.price,
        admin_notes: 'Marked as SOLD via quick table action',
      });
      fetchMarketplaceListings();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to mark listing as sold');
    } finally {
      setActionInProgressId(null);
    }
  };

  // -------------------------------------------------------------
  // 2. LEGACY TRADE-IN REQUESTS STATE
  // -------------------------------------------------------------
  const [legacyRequests, setLegacyRequests] = useState([]);
  const [legacyLoading, setLegacyLoading] = useState(false);
  const [legacyError, setLegacyError] = useState('');
  const [legacySearch, setLegacySearch] = useState('');
  const [legacyStatusFilter, setLegacyStatusFilter] = useState('');
  const [legacyStaffFilter, setLegacyStaffFilter] = useState('');
  const [legacyPagination, setLegacyPagination] = useState({ page: 1, limit: 10, totalPages: 1, totalRecords: 0 });
  const [selectedLegacyRequest, setSelectedLegacyRequest] = useState(null);
  const [staffList, setStaffList] = useState([]);

  useEffect(() => {
    async function loadStaff() {
      try {
        const res = await userService.getAllUsers({ limit: 100 });
        if (res?.success && Array.isArray(res.data)) {
          setStaffList(res.data);
        } else if (Array.isArray(res)) {
          setStaffList(res);
        }
      } catch (err) {
        console.warn('Could not load staff list:', err.message);
      }
    }
    loadStaff();
  }, []);

  const fetchLegacyRequests = async () => {
    setLegacyLoading(true);
    setLegacyError('');
    try {
      const params = {
        page: legacyPagination.page,
        limit: legacyPagination.limit,
      };
      if (legacySearch.trim()) params.search = legacySearch.trim();
      if (legacyStatusFilter) params.status = legacyStatusFilter;
      if (legacyStaffFilter) params.assigned_to_user_id = legacyStaffFilter;

      const res = await sellRequestService.getSellRequests(params);
      if (res?.success) {
        setLegacyRequests(res.data || []);
        if (res.pagination) {
          setLegacyPagination({
            page: Number(res.pagination.page) || 1,
            limit: Number(res.pagination.limit) || 10,
            totalPages: Number(res.pagination.totalPages) || 1,
            totalRecords: Number(res.pagination.totalRecords) || 0,
          });
        }
      }
    } catch (err) {
      setLegacyError(err.response?.data?.message || err.message || 'Failed to fetch legacy requests');
    } finally {
      setLegacyLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'legacy') {
      fetchLegacyRequests();
    }
  }, [activeTab, legacyPagination.page, legacyStatusFilter, legacyStaffFilter]);

  // Derived Marketplace Metrics
  const pendingCount = marketplaceListings.filter(
    (l) => l.status === 'PENDING_REVIEW' || l.status === 'UNDER_REVIEW'
  ).length;
  const publishedCount = marketplaceListings.filter((l) => l.status === 'PUBLISHED').length;
  const soldCount = marketplaceListings.filter((l) => l.status === 'SOLD').length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
      {/* Page Title & Tab Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Store className="w-6 h-6 text-rose-600" />
            <span>Marketplace & Sell Requests</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Review customer phone submissions, manage active listings, remove sold phones, and track payouts.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="inline-flex p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setActiveTab('marketplace')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'marketplace'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-rose-600" />
            <span>Marketplace Listings</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'orders'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5 text-purple-600" />
            <span>Marketplace Orders</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('legacy')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'legacy'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-slate-500" />
            <span>Legacy Trade-Ins</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-rose-600" />
            <span>Commission & Terms</span>
          </button>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 1: MARKETPLACE LISTINGS */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'marketplace' && (
        <div className="space-y-5">
          {/* Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 block">
                Pending Review
              </span>
              <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {pendingCount}
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Awaiting admin review</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 block">
                Published Live
              </span>
              <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {publishedCount}
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Active on marketplace</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600 block">
                Total Sold
              </span>
              <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {soldCount}
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Removed from catalogue</span>
            </div>

            <div
              onClick={() => setActiveTab('settings')}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-rose-400 dark:hover:border-rose-600 transition-all cursor-pointer group"
              title="Click to configure commission percentage and seller terms"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 block">
                  Platform Fee
                </span>
                <span className="text-[10px] font-bold text-rose-500 opacity-80 group-hover:opacity-100 transition-opacity">
                  Edit &rarr;
                </span>
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">5%</div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Click to edit terms & fee</span>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
            <form onSubmit={handleMpSearchSubmit} className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search brand, model, seller name, or phone..."
                value={mpSearch}
                onChange={(e) => setMpSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
              />
            </form>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span>Status:</span>
                <select
                  value={mpStatusFilter}
                  onChange={(e) => {
                    setMpStatusFilter(e.target.value);
                    setMpPagination((p) => ({ ...p, page: 1 }));
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200"
                >
                  <option value="">All Statuses</option>
                  <option value="PENDING_REVIEW">Pending Review</option>
                  <option value="PUBLISHED">Published Live</option>
                  <option value="SOLD">Sold</option>
                  <option value="CHANGES_REQUESTED">Changes Requested</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="UNPUBLISHED">Unpublished</option>
                </select>
              </div>

              <button
                type="button"
                onClick={fetchMarketplaceListings}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${mpLoading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {mpError && (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{mpError}</span>
            </div>
          )}

          {/* Listings Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase font-semibold text-[10px] tracking-wider">
                  <tr>
                    <th className="px-4 py-3.5">Device</th>
                    <th className="px-4 py-3.5">Specs & Condition</th>
                    <th className="px-4 py-3.5">Seller Contact</th>
                    <th className="px-4 py-3.5 text-right">Asking Price</th>
                    <th className="px-4 py-3.5 text-right">Net Payout</th>
                    <th className="px-4 py-3.5 text-center">Status</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {mpLoading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-slate-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-rose-500" />
                        <span>Loading marketplace listings...</span>
                      </td>
                    </tr>
                  ) : marketplaceListings.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-slate-400">
                        <Smartphone className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <span>No marketplace listings found.</span>
                      </td>
                    </tr>
                  ) : (
                    marketplaceListings.map((listing) => {
                      let firstPhoto = '';
                      try {
                        const raw = listing.photos || listing.main_photo || listing.image_url;
                        if (Array.isArray(raw)) {
                          firstPhoto = raw[0] || '';
                        } else if (typeof raw === 'string') {
                          const trimmed = raw.trim();
                          if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
                            const parsed = JSON.parse(trimmed);
                            firstPhoto = parsed[0] || '';
                          } else {
                            firstPhoto = trimmed;
                          }
                        }
                      } catch (e) {
                        if (typeof listing.photos === 'string') firstPhoto = listing.photos;
                      }
                      if (!firstPhoto && listing.main_photo) firstPhoto = listing.main_photo;
                      if (!firstPhoto && listing.image_url) firstPhoto = listing.image_url;

                      const asking = Number(listing.price || 0);
                      const comm = Math.round((asking * 5) / 100);
                      const payout = Math.max(0, asking - comm);
                      const isWorking = actionInProgressId === listing.listing_id;

                      return (
                        <tr
                          key={listing.listing_id}
                          onClick={() => setSelectedMpListing(listing)}
                          className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                        >
                          {/* Device with Thumbnail */}
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
                                {firstPhoto ? (
                                  <img
                                    src={resolvePhotoUrl(firstPhoto)}
                                    alt={listing.model}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <Smartphone className="w-5 h-5 text-slate-400" />
                                )}
                              </div>
                              <div>
                                <span className="font-bold text-slate-900 dark:text-white block">
                                  {listing.brand} {listing.model}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {listing.listing_ref || `#${listing.listing_id}`}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Specs & Condition */}
                          <td className="px-4 py-3.5">
                            <div className="space-y-0.5">
                              <span className="font-medium text-slate-800 dark:text-slate-200 block">
                                {listing.storage} • {listing.color}
                              </span>
                              <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                                <span className="text-rose-600 dark:text-rose-400 font-semibold">
                                  {listing.condition_grade?.replace(/_/g, ' ')}
                                </span>
                                {listing.battery_health && <span>• {listing.battery_health}% Batt</span>}
                              </div>
                            </div>
                          </td>

                          {/* Seller */}
                          <td className="px-4 py-3.5">
                            <span className="font-medium text-slate-800 dark:text-slate-200 block">
                              {listing.seller_name}
                            </span>
                            <span className="text-[10px] text-slate-400">{listing.seller_phone}</span>
                          </td>

                          {/* Asking Price */}
                          <td className="px-4 py-3.5 text-right font-semibold text-slate-900 dark:text-white">
                            {formatCurrency(asking)}
                          </td>

                          {/* Seller Payout */}
                          <td className="px-4 py-3.5 text-right font-bold text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(payout)}
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3.5 text-center">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                                MARKETPLACE_STATUS_BADGES[listing.status] || 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {listing.status?.replace(/_/g, ' ')}
                            </span>
                          </td>

                          {/* Actions */}
                          <td
                            className="px-4 py-3.5 text-right space-x-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {/* MARK AS SOLD & REMOVE BUTTON */}
                            {listing.status !== 'SOLD' && (
                              <button
                                type="button"
                                onClick={(e) => handleQuickMarkSold(listing, e)}
                                disabled={isWorking}
                                className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-[10px] shadow-xs cursor-pointer transition-colors"
                                title="Mark as sold and remove listing from public marketplace"
                              >
                                Mark Sold
                              </button>
                            )}

                            {/* APPROVE BUTTON */}
                            {listing.status !== 'PUBLISHED' && listing.status !== 'SOLD' && (
                              <button
                                type="button"
                                onClick={() => handleApproveListing(listing.listing_id)}
                                disabled={isWorking}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] shadow-xs cursor-pointer transition-colors"
                              >
                                Approve
                              </button>
                            )}

                            {/* UNPUBLISH BUTTON */}
                            {listing.status === 'PUBLISHED' && (
                              <button
                                type="button"
                                onClick={() => handleUnpublishListing(listing.listing_id)}
                                disabled={isWorking}
                                className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-[10px] cursor-pointer"
                              >
                                Unpublish
                              </button>
                            )}

                            {/* VIEW DETAILS */}
                            <button
                              type="button"
                              onClick={() => setSelectedMpListing(listing)}
                              className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-[10px] cursor-pointer"
                            >
                              Details
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {mpPagination.totalPages > 1 && (
              <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                <span>
                  Page {mpPagination.page} of {mpPagination.totalPages} ({mpPagination.totalRecords} listings)
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setMpPagination((p) => ({ ...p, page: Math.max(1, p.page - 1) }))}
                    disabled={mpPagination.page <= 1}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setMpPagination((p) => ({ ...p, page: Math.min(p.totalPages, p.page + 1) }))
                    }
                    disabled={mpPagination.page >= mpPagination.totalPages}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 2: MARKETPLACE ORDERS */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'orders' && <MarketplaceOrdersView />}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 3: LEGACY TRADE-IN REQUESTS */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'legacy' && (
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300">
            <strong>Historical Records:</strong> Below are legacy trade-in requests submitted before the Phone Marketplace launch.
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase font-semibold text-[10px] tracking-wider">
                  <tr>
                    <th className="px-4 py-3.5">Ref</th>
                    <th className="px-4 py-3.5">Phone Model</th>
                    <th className="px-4 py-3.5">Customer</th>
                    <th className="px-4 py-3.5">Estimated Value</th>
                    <th className="px-4 py-3.5 text-center">Status</th>
                    <th className="px-4 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {legacyLoading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-slate-400">
                        Loading legacy records...
                      </td>
                    </tr>
                  ) : legacyRequests.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-slate-400">
                        No legacy records found.
                      </td>
                    </tr>
                  ) : (
                    legacyRequests.map((r) => {
                      const cfg = LEGACY_STATUS_CONFIG[r.status] || {
                        label: r.status,
                        text: 'text-slate-600',
                      };
                      return (
                        <tr
                          key={r.request_id}
                          onClick={() => setSelectedLegacyRequest(r)}
                          className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 cursor-pointer"
                        >
                          <td className="px-4 py-3.5 font-bold font-mono">
                            {r.request_ref || `#${r.request_id}`}
                          </td>
                          <td className="px-4 py-3.5 font-semibold text-slate-900 dark:text-white">
                            {r.brand_name || r.brand} {r.model_name || r.model}
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="block font-medium">{r.customer_name}</span>
                            <span className="text-[10px] text-slate-400">{r.customer_phone}</span>
                          </td>
                          <td className="px-4 py-3.5">
                            {r.estimated_value ? formatCurrency(r.estimated_value) : '-'}
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <span className={`font-semibold text-xs ${cfg.text}`}>{cfg.label}</span>
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <button
                              type="button"
                              onClick={() => setSelectedLegacyRequest(r)}
                              className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                            >
                              Inspect
                            </button>
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
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 4: COMMISSION & TERMS SETTINGS */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'settings' && <MarketplaceSettingsView />}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MARKETPLACE LISTING DETAIL MODAL */}
      {/* ───────────────────────────────────────────────────────────── */}
      {selectedMpListing && (
        <ErrorBoundary>
          <MarketplaceListingDetailModal
            listing={selectedMpListing}
            onClose={() => setSelectedMpListing(null)}
            onApprove={handleApproveListing}
            onReject={handleRejectListing}
            onRequestChanges={handleRequestChanges}
            onUnpublish={handleUnpublishListing}
            onMarkSold={handleMarkSoldListing}
            onDelete={handleDeleteListing}
          />
        </ErrorBoundary>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* LEGACY TRADE-IN DETAIL VIEW MODAL */}
      {/* ───────────────────────────────────────────────────────────── */}
      {selectedLegacyRequest && (
        <SellRequestDetailView
          request={selectedLegacyRequest}
          onClose={() => setSelectedLegacyRequest(null)}
          onStatusUpdated={() => {
            fetchLegacyRequests();
            setSelectedLegacyRequest(null);
          }}
          staffList={staffList}
        />
      )}
    </div>
  );
}
