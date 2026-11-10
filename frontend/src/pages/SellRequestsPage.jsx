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

const MARKETPLACE_STATUS_CONFIG = {
  PENDING_REVIEW: { label: 'Pending Review', dot: 'bg-amber-500' },
  UNDER_REVIEW: { label: 'Under Review', dot: 'bg-sky-500' },
  APPROVED: { label: 'Approved', dot: 'bg-emerald-500' },
  PUBLISHED: { label: 'Published Live', dot: 'bg-emerald-500' },
  RESERVED: { label: 'Reserved', dot: 'bg-indigo-500' },
  SOLD: { label: 'Sold', dot: 'bg-purple-500' },
  REJECTED: { label: 'Rejected', dot: 'bg-rose-500' },
  CHANGES_REQUESTED: { label: 'Changes Requested', dot: 'bg-amber-500' },
  UNPUBLISHED: { label: 'Unpublished', dot: 'bg-slate-400' },
  CANCELLED: { label: 'Cancelled', dot: 'bg-slate-400' },
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
    <div className="space-y-5 pb-12">
      {/* ── Page Header & Tab Navigation ─────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div>
          <h1 className="text-xl font-normal text-slate-900 dark:text-white tracking-tight">
            Marketplace & Sell Requests
          </h1>
          <p className="text-xs font-normal text-slate-500 dark:text-slate-400 mt-0.5">
            Review customer phone submissions, manage active listings, remove sold phones, and track payouts
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setActiveTab('marketplace')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-normal transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'marketplace'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>Marketplace Listings</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-normal transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'orders'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>Marketplace Orders</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('legacy')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-normal transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'legacy'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>Legacy Trade-Ins</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-normal transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
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
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Pending Review */}
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              </div>
              <div>
                <div className="text-[11px] font-normal text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Pending Review
                </div>
                <div className="text-lg font-normal text-slate-900 dark:text-white mt-0.5">
                  {pendingCount} <span className="text-xs font-normal text-slate-400">awaiting</span>
                </div>
              </div>
            </div>

            {/* Published Live */}
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              </div>
              <div>
                <div className="text-[11px] font-normal text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Published Live
                </div>
                <div className="text-lg font-normal text-slate-900 dark:text-white mt-0.5">
                  {publishedCount} <span className="text-xs font-normal text-slate-400">active</span>
                </div>
              </div>
            </div>

            {/* Total Sold */}
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
                <ShoppingBag className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              </div>
              <div>
                <div className="text-[11px] font-normal text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Total Sold
                </div>
                <div className="text-lg font-normal text-slate-900 dark:text-white mt-0.5">
                  {soldCount} <span className="text-xs font-normal text-slate-400">completed</span>
                </div>
              </div>
            </div>

            {/* Platform Fee */}
            <div
              onClick={() => setActiveTab('settings')}
              className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center justify-between gap-3.5 hover:border-slate-300 dark:hover:border-slate-700 transition-colors cursor-pointer group"
              title="Click to configure commission percentage and seller terms"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
                  <Percent className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                </div>
                <div>
                  <div className="text-[11px] font-normal text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Platform Fee
                  </div>
                  <div className="text-lg font-normal text-slate-900 dark:text-white mt-0.5">
                    5% <span className="text-xs font-normal text-slate-400">rate</span>
                  </div>
                </div>
              </div>
              <span className="text-xs font-normal text-rose-600 dark:text-rose-400 group-hover:underline">
                Edit &rarr;
              </span>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-wrap items-center justify-between gap-2.5">
            <form onSubmit={handleMpSearchSubmit} className="relative flex-1 min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by brand, model, seller name, or phone..."
                value={mpSearch}
                onChange={(e) => setMpSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-normal text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-rose-500/30 focus:border-neutral-500"
              />
            </form>

            <div className="flex items-center gap-2.5">
              <div className="w-full sm:w-auto min-w-[140px]">
                <select
                  value={mpStatusFilter}
                  onChange={(e) => {
                    setMpStatusFilter(e.target.value);
                    setMpPagination((p) => ({ ...p, page: 1 }));
                  }}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-normal text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
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
                className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-xs font-normal text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-2xs cursor-pointer"
                title="Refresh listings"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${mpLoading ? 'animate-spin text-rose-600' : 'text-slate-500'}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {mpError && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-xs font-normal text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{mpError}</span>
            </div>
          )}

          {/* Listings Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/75 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase font-normal text-[11px] tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Device</th>
                    <th className="px-4 py-3">Specs & Condition</th>
                    <th className="px-4 py-3">Seller Contact</th>
                    <th className="px-4 py-3 text-right">Asking Price</th>
                    <th className="px-4 py-3 text-right">Net Payout</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {mpLoading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-slate-400 font-normal">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-rose-600" />
                        <span>Loading marketplace listings...</span>
                      </td>
                    </tr>
                  ) : marketplaceListings.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-slate-400 font-normal">
                        <Smartphone className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
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
                      const statusConfig = MARKETPLACE_STATUS_CONFIG[listing.status] || {
                        label: listing.status?.replace(/_/g, ' ') || 'Unknown',
                        dot: 'bg-slate-400',
                      };

                      return (
                        <tr
                          key={listing.listing_id}
                          onClick={() => setSelectedMpListing(listing)}
                          className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                        >
                          {/* Device with Thumbnail */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
                                {firstPhoto ? (
                                  <img
                                    src={resolvePhotoUrl(firstPhoto)}
                                    alt={listing.model}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <Smartphone className="w-4 h-4 text-slate-400" />
                                )}
                              </div>
                              <div>
                                <span className="font-normal text-slate-900 dark:text-white block">
                                  {listing.brand} {listing.model}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono font-normal">
                                  {listing.listing_ref || `#${listing.listing_id}`}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Specs & Condition */}
                          <td className="px-4 py-3">
                            <div className="space-y-0.5">
                              <span className="font-normal text-slate-800 dark:text-slate-200 block">
                                {listing.storage} • {listing.color}
                              </span>
                              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-normal">
                                <span>{listing.condition_grade?.replace(/_/g, ' ')}</span>
                                {listing.battery_health && <span>• {listing.battery_health}% Batt</span>}
                              </div>
                            </div>
                          </td>

                          {/* Seller */}
                          <td className="px-4 py-3">
                            <span className="font-normal text-slate-800 dark:text-slate-200 block">
                              {listing.seller_name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-normal">{listing.seller_phone}</span>
                          </td>

                          {/* Asking Price */}
                          <td className="px-4 py-3 text-right font-normal text-slate-900 dark:text-white">
                            {formatCurrency(asking)}
                          </td>

                          {/* Seller Payout */}
                          <td className="px-4 py-3 text-right font-normal text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(payout)}
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3 text-center">
                            <span className="inline-flex items-center gap-1.5 text-xs font-normal text-slate-900 dark:text-slate-100">
                              <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
                              <span>{statusConfig.label}</span>
                            </span>
                          </td>

                          {/* Actions */}
                          <td
                            className="px-4 py-3 text-right space-x-1.5 whitespace-nowrap"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {/* APPROVE BUTTON */}
                            {listing.status !== 'PUBLISHED' && listing.status !== 'SOLD' && (
                              <button
                                type="button"
                                onClick={() => handleApproveListing(listing.listing_id)}
                                disabled={isWorking}
                                className="px-3 py-1 text-xs font-normal rounded-full bg-gradient-to-r from-black via-neutral-900 to-rose-950 hover:to-rose-900 text-white border border-neutral-800 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                              >
                                Approve
                              </button>
                            )}

                            {/* MARK AS SOLD BUTTON */}
                            {listing.status !== 'SOLD' && (
                              <button
                                type="button"
                                onClick={(e) => handleQuickMarkSold(listing, e)}
                                disabled={isWorking}
                                className="px-3 py-1 text-xs font-normal rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer disabled:opacity-50"
                                title="Mark as sold and remove listing from public marketplace"
                              >
                                Mark Sold
                              </button>
                            )}

                            {/* UNPUBLISH BUTTON */}
                            {listing.status === 'PUBLISHED' && (
                              <button
                                type="button"
                                onClick={() => handleUnpublishListing(listing.listing_id)}
                                disabled={isWorking}
                                className="px-3 py-1 text-xs font-normal rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer disabled:opacity-50"
                              >
                                Unpublish
                              </button>
                            )}

                            {/* VIEW DETAILS */}
                            <button
                              type="button"
                              onClick={() => setSelectedMpListing(listing)}
                              className="px-3 py-1 text-xs font-normal rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer"
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
              <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-normal text-slate-500">
                <span>
                  Page {mpPagination.page} of {mpPagination.totalPages} ({mpPagination.totalRecords} listings)
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setMpPagination((p) => ({ ...p, page: Math.max(1, p.page - 1) }))}
                    disabled={mpPagination.page <= 1}
                    className="p-1.5 rounded-full border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setMpPagination((p) => ({ ...p, page: Math.min(p.totalPages, p.page + 1) }))
                    }
                    disabled={mpPagination.page >= mpPagination.totalPages}
                    className="p-1.5 rounded-full border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
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
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-xs font-normal text-amber-800 dark:text-amber-300">
            <strong>Historical Records:</strong> Below are legacy trade-in requests submitted before the Phone Marketplace launch.
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/75 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase font-normal text-[11px] tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Ref</th>
                    <th className="px-4 py-3">Phone Model</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Estimated Value</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {legacyLoading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-slate-400 font-normal">
                        Loading legacy records...
                      </td>
                    </tr>
                  ) : legacyRequests.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-slate-400 font-normal">
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
                          className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                        >
                          <td className="px-4 py-3 font-normal font-mono text-slate-500">
                            {r.request_ref || `#${r.request_id}`}
                          </td>
                          <td className="px-4 py-3 font-normal text-slate-900 dark:text-white">
                            {r.brand_name || r.brand} {r.model_name || r.model}
                          </td>
                          <td className="px-4 py-3">
                            <span className="block font-normal text-slate-900 dark:text-white">{r.customer_name}</span>
                            <span className="text-[10px] text-slate-400 font-normal">{r.customer_phone}</span>
                          </td>
                          <td className="px-4 py-3 font-normal text-slate-900 dark:text-white">
                            {r.estimated_value ? formatCurrency(r.estimated_value) : '-'}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`font-normal text-xs ${cfg.text}`}>{cfg.label}</span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => setSelectedLegacyRequest(r)}
                              className="px-3 py-1 text-xs font-normal rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer"
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
