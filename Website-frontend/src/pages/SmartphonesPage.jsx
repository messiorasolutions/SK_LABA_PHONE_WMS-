import React, { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Search,
  Filter,
  SlidersHorizontal,
  ArrowUpDown,
  X,
  RotateCcw,
  Sparkles,
  Tag,
  Check,
  ChevronDown,
  Layers,
  Heart,
  GitCompare,
  ChevronRight,
  Home,
} from 'lucide-react';

import PhoneCard from '../components/PhoneCard';
import CompareBar from '../components/CompareBar';
import PhoneDetailModal from '../components/Modals/PhoneDetailModal';
import CompareModal from '../components/Modals/CompareModal';
import FavoritesModal from '../components/Modals/FavoritesModal';
import InquiryModal from '../components/Modals/InquiryModal';
import ReservationModal from '../components/Modals/ReservationModal';
import BackInStockModal from '../components/Modals/BackInStockModal';

import phoneService from '../services/phoneService';
import brandService from '../services/brandService';
import { getActiveOffers } from '../services/offerService';
import { setSearchQuery, setActiveTab } from '../actions/heroActions';
import { useFavoritesAndCompare } from '../hooks/useFavoritesAndCompare';

export default function SmartphonesPage({ onNavigateToHome }) {
  const dispatch = useDispatch();
  const globalSearch = useSelector((state) => state.hero?.searchQuery || '');
  const { favoriteIds, compareIds } = useFavoritesAndCompare();

  // State
  const [phones, setPhones] = useState([]);
  const [brands, setBrands] = useState([]);
  const [activeOffers, setActiveOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters state
  const [selectedBrand, setSelectedBrand] = useState('ALL');
  const [selectedCondition, setSelectedCondition] = useState('ALL'); // ALL, NEW, USED
  const [installmentOnly, setInstallmentOnly] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [sortType, setSortType] = useState('newest'); // newest, oldest, price_asc, price_desc
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [activeQuickFilter, setActiveQuickFilter] = useState('all'); // all, deals

  // Modals state
  const [selectedPhoneForDetail, setSelectedPhoneForDetail] = useState(null);
  const [selectedPhoneForReserve, setSelectedPhoneForReserve] = useState(null);
  const [selectedPhoneForInquiry, setSelectedPhoneForInquiry] = useState(null);
  const [selectedPhoneForBackInStock, setSelectedPhoneForBackInStock] = useState(null);
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [favoritesModalOpen, setFavoritesModalOpen] = useState(false);

  // Fetch initial data
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    Promise.all([
      phoneService.getPhones(),
      brandService.getBrands().catch(() => ({ data: [] })),
      getActiveOffers().catch(() => ({ data: [] })),
    ])
      .then(([phoneRes, brandRes, offerRes]) => {
        if (!isMounted) return;

        // Process phones
        const rawPhones = phoneRes.data?.data || phoneRes.data || [];
        const phoneList = Array.isArray(rawPhones) ? rawPhones : [];

        // Process brands
        const rawBrands = brandRes.data?.data || brandRes.data || [];
        setBrands(Array.isArray(rawBrands) ? rawBrands : []);

        // Process active offers and attach to phones
        const offers = offerRes.data?.data || offerRes.data || [];
        setActiveOffers(Array.isArray(offers) ? offers : []);

        const enriched = phoneList.map((p) => {
          const matchingOffer = offers.find(
            (o) => Array.isArray(o.phone_ids) && o.phone_ids.includes(p.phone_id)
          );
          if (matchingOffer) {
            return {
              ...p,
              offer_price: matchingOffer.offer_price,
              active_offer: {
                has_active_offer: true,
                offer_id: matchingOffer.offer_id,
                offer_title: matchingOffer.title,
                offer_price: matchingOffer.offer_price,
                discount_percentage: matchingOffer.discount_percentage,
                savings: matchingOffer.discount_amount,
              },
            };
          }
          return p;
        });

        setPhones(enriched);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || 'Failed to fetch smartphone inventory.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Quick category presets filter
  const handleQuickFilterClick = (filterKey) => {
    setActiveQuickFilter(filterKey);
    if (filterKey === 'all') {
      setSelectedCondition('ALL');
      setPriceRange({ min: '', max: '' });
    } else if (filterKey === 'deals') {
      setSelectedCondition('ALL');
      setPriceRange({ min: '', max: '' });
    }
  };

  // Reset all filters
  const resetFilters = () => {
    setSelectedBrand('ALL');
    setSelectedCondition('ALL');
    setInstallmentOnly(false);
    setPriceRange({ min: '', max: '' });
    setSortType('newest');
    setActiveQuickFilter('all');
    dispatch(setSearchQuery(''));
  };

  // Go to Home
  const handleGoHome = (e) => {
    e.preventDefault();
    if (onNavigateToHome) {
      onNavigateToHome();
    } else {
      dispatch(setActiveTab('Home'));
      window.location.hash = '';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Filtered & Sorted phones
  const filteredPhones = useMemo(() => {
    return phones
      .filter((phone) => {
        // Exclude archived phones
        if (phone.is_archived || phone.status === 'ARCHIVED') return false;

        // Search filter (name or brand)
        if (globalSearch.trim()) {
          const q = globalSearch.toLowerCase().trim();
          const nameMatch = phone.name?.toLowerCase().includes(q);
          const brandMatch = phone.brand_name?.toLowerCase().includes(q);
          if (!nameMatch && !brandMatch) return false;
        }

        // Brand filter
        if (selectedBrand !== 'ALL') {
          if (String(phone.brand_id) !== String(selectedBrand)) return false;
        }

        // Condition filter
        if (selectedCondition !== 'ALL') {
          if ((phone.phone_condition || 'NEW').toUpperCase() !== selectedCondition) {
            return false;
          }
        }

        // Installment Plans Filter (tick button)
        if (installmentOnly) {
          if (!phone.installment_enabled) return false;
        }

        // Quick deals filter
        if (activeQuickFilter === 'deals') {
          if (!phone.active_offer?.has_active_offer && !phone.offer_price) return false;
        }

        // Price range
        const effPrice = Number(phone.offer_price || phone.price || 0);
        if (priceRange.min !== '' && !isNaN(Number(priceRange.min))) {
          if (effPrice < Number(priceRange.min)) return false;
        }
        if (priceRange.max !== '' && !isNaN(Number(priceRange.max))) {
          if (effPrice > Number(priceRange.max)) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const priceA = Number(a.offer_price || a.price || 0);
        const priceB = Number(b.offer_price || b.price || 0);

        if (sortType === 'price_asc') {
          return priceA - priceB;
        } else if (sortType === 'price_desc') {
          return priceB - priceA;
        } else if (sortType === 'oldest') {
          return (a.phone_id || 0) - (b.phone_id || 0);
        } else {
          return (b.phone_id || 0) - (a.phone_id || 0);
        }
      });
  }, [
    phones,
    globalSearch,
    selectedBrand,
    selectedCondition,
    installmentOnly,
    activeQuickFilter,
    priceRange,
    sortType,
  ]);

  const hasActiveFilters =
    selectedBrand !== 'ALL' ||
    selectedCondition !== 'ALL' ||
    installmentOnly ||
    sortType !== 'newest' ||
    priceRange.min !== '' ||
    priceRange.max !== '' ||
    globalSearch.trim() !== '' ||
    activeQuickFilter !== 'all';

  return (
    <div className="relative w-full bg-theme-bg min-h-screen py-8 sm:py-12 text-theme-textPrimary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb Navigation Bar (Dedicated Page) */}
        <div className="flex items-center gap-2 text-xs text-theme-textMuted mb-6">
          <button
            type="button"
            onClick={handleGoHome}
            className="hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer font-medium"
          >
            <Home className="w-3.5 h-3.5 text-theme-textSecondary" />
            <span>Home</span>
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-theme-borderLight" />
          <span className="text-theme-accentLight font-semibold">Smartphones Catalog</span>
        </div>

        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 pb-6 border-b border-theme-border/60">
          <div>
            <div className="flex items-center gap-2 mb-1.5 text-xs text-theme-textMuted font-normal">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>{phones.length} Models Available</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-normal tracking-normal text-white flex items-center gap-3">
              <span>Smartphones & Mobile Devices</span>
            </h1>
            <p className="text-xs sm:text-sm text-theme-textSecondary mt-1.5 max-w-2xl leading-relaxed font-normal">
              Explore our collection of mobile phones
            </p>
          </div>

          {/* Quick Action Pills: Favorites & Compare Triggers */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setFavoritesModalOpen(true)}
              className="px-3.5 py-2 rounded-lg bg-transparent hover:bg-white/[0.04] border border-theme-border text-theme-textSecondary hover:text-white text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Heart className={`w-3.5 h-3.5 ${favoriteIds.length > 0 ? 'text-red-500 fill-current' : ''}`} />
              <span>Favourites ({favoriteIds.length})</span>
            </button>

            {compareIds.length >= 2 && (
              <button
                type="button"
                onClick={() => setCompareModalOpen(true)}
                className="px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/15 border border-white/20 text-white text-xs font-medium flex items-center gap-2 transition-all cursor-pointer"
              >
                <GitCompare className="w-3.5 h-3.5" />
                <span>Compare ({compareIds.length}/3)</span>
              </button>
            )}
          </div>
        </div>

        {/* Category Tabs & Options Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2 mb-6">
          {/* Left Side: All Smartphones & Active Offers in Rectangles */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleQuickFilterClick('all')}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
                activeQuickFilter === 'all'
                  ? 'bg-white/10 text-white border-white/20 shadow-sm'
                  : 'bg-transparent text-theme-textSecondary hover:text-white hover:bg-white/[0.04] border-theme-border'
              }`}
            >
              All Smartphones
            </button>

            <button
              type="button"
              onClick={() => handleQuickFilterClick('deals')}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
                activeQuickFilter === 'deals'
                  ? 'bg-white/10 text-white border-white/20 shadow-sm'
                  : 'bg-transparent text-theme-textSecondary hover:text-white hover:bg-white/[0.04] border-theme-border'
              }`}
            >
              Active Offers
            </button>
          </div>

          {/* Right Side: View Installment Plans Featured Phones */}
          <div className="flex items-center ml-auto">
            <button
              type="button"
              onClick={() => setInstallmentOnly(!installmentOnly)}
              className={`px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 border ${
                installmentOnly
                  ? 'bg-white/10 text-white border-white/20 shadow-sm'
                  : 'bg-transparent text-theme-textSecondary hover:text-white hover:bg-white/[0.04] border-theme-border'
              }`}
            >
              <span
                className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${
                  installmentOnly
                    ? 'bg-white/20 border-white/60 text-white'
                    : 'border-theme-borderMedium bg-transparent'
                }`}
              >
                {installmentOnly && <Check className="w-2.5 h-2.5 stroke-[2.5]" />}
              </span>
              <span>View Installment Plans Featured Phones</span>
            </button>
          </div>
        </div>

        {/* Filters and Controls Bar */}
        <div className="bg-theme-surface/50 border border-theme-border rounded-xl p-3 mb-8 backdrop-blur-sm">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Search Input within Catalog */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-theme-textMuted pointer-events-none" />
              <input
                type="text"
                placeholder="Search smartphone model, brand, series..."
                value={globalSearch}
                onChange={(e) => dispatch(setSearchQuery(e.target.value))}
                className="w-full bg-transparent border border-theme-border hover:border-white/20 focus:border-white/30 focus:bg-white/[0.05] rounded-lg pl-9 pr-9 py-2 text-xs text-white placeholder-theme-textMuted focus:outline-none transition-all"
              />
              {globalSearch && (
                <button
                  type="button"
                  onClick={() => dispatch(setSearchQuery(''))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-theme-textMuted hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Desktop Filters Row */}
            <div className="hidden lg:flex items-center gap-2">
              {/* Brand Select */}
              <div className="relative">
                <select
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  className={`border rounded-lg px-3.5 py-2 text-xs font-medium focus:outline-none cursor-pointer pr-8 appearance-none transition-all ${
                    selectedBrand !== 'ALL'
                      ? 'bg-white/10 text-white border-white/20 shadow-sm'
                      : 'bg-transparent text-theme-textSecondary hover:text-white hover:bg-white/[0.04] border-theme-border'
                  }`}
                >
                  <option value="ALL" className="bg-[#0A0F1E] text-white">All Brands</option>
                  {brands.map((b) => (
                    <option key={b.brand_id} value={b.brand_id} className="bg-[#0A0F1E] text-white">
                      {b.brand_name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-theme-textMuted absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Condition Select (New / Used) */}
              <div className="relative">
                <select
                  value={selectedCondition}
                  onChange={(e) => setSelectedCondition(e.target.value)}
                  className={`border rounded-lg px-3.5 py-2 text-xs font-medium focus:outline-none cursor-pointer pr-8 appearance-none transition-all ${
                    selectedCondition !== 'ALL'
                      ? 'bg-white/10 text-white border-white/20 shadow-sm'
                      : 'bg-transparent text-theme-textSecondary hover:text-white hover:bg-white/[0.04] border-theme-border'
                  }`}
                >
                  <option value="ALL" className="bg-[#0A0F1E] text-white">All Conditions</option>
                  <option value="NEW" className="bg-[#0A0F1E] text-white">Brand New</option>
                  <option value="USED" className="bg-[#0A0F1E] text-white">Used / Refurbished</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-theme-textMuted absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Filter Button 1: Sort newest first, oldest first */}
              <div className="relative">
                <select
                  value={sortType === 'newest' || sortType === 'oldest' ? sortType : 'newest'}
                  onChange={(e) => setSortType(e.target.value)}
                  className={`border rounded-lg px-3.5 py-2 text-xs font-medium focus:outline-none cursor-pointer pr-8 appearance-none transition-all ${
                    sortType === 'newest' || sortType === 'oldest'
                      ? 'bg-white/10 text-white border-white/20 shadow-sm'
                      : 'bg-transparent text-theme-textSecondary hover:text-white hover:bg-white/[0.04] border-theme-border'
                  }`}
                >
                  <option value="newest" className="bg-[#0A0F1E] text-white">Sort: Newest First</option>
                  <option value="oldest" className="bg-[#0A0F1E] text-white">Sort: Oldest First</option>
                </select>
                <ArrowUpDown className="w-3.5 h-3.5 text-theme-textMuted absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Filter Button 2: Price: Low to High, High to Low */}
              <div className="relative">
                <select
                  value={sortType === 'price_asc' || sortType === 'price_desc' ? sortType : ''}
                  onChange={(e) => {
                    if (e.target.value) {
                      setSortType(e.target.value);
                    } else {
                      setSortType('newest');
                    }
                  }}
                  className={`border rounded-lg px-3.5 py-2 text-xs font-medium focus:outline-none cursor-pointer pr-8 appearance-none transition-all ${
                    sortType === 'price_asc' || sortType === 'price_desc'
                      ? 'bg-white/10 text-white border-white/20 shadow-sm'
                      : 'bg-transparent text-theme-textSecondary hover:text-white hover:bg-white/[0.04] border-theme-border'
                  }`}
                >
                  <option value="" className="bg-[#0A0F1E] text-white">Sort by Price</option>
                  <option value="price_asc" className="bg-[#0A0F1E] text-white">Price: Low to High</option>
                  <option value="price_desc" className="bg-[#0A0F1E] text-white">Price: High to Low</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-theme-textMuted absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Reset button */}
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="p-2 rounded-lg bg-transparent hover:bg-white/[0.04] border border-theme-border text-theme-textMuted hover:text-red-400 transition-colors cursor-pointer"
                  title="Reset all filters"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Mobile Filter Toggle Button */}
            <div className="flex lg:hidden items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setShowMobileFilters(!showMobileFilters)}
                className="flex-1 py-2 px-3 rounded-lg bg-transparent hover:bg-white/[0.04] border border-theme-border text-xs font-medium text-white flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-theme-textSecondary" />
                <span>Filters & Sorting</span>
                {hasActiveFilters && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                )}
              </button>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="py-2 px-3 rounded-lg bg-transparent hover:bg-white/[0.04] border border-theme-border text-xs font-medium text-red-400 flex items-center gap-1 cursor-pointer transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>

          {/* Mobile Filters Dropdown Panel */}
          {showMobileFilters && (
            <div className="lg:hidden mt-3 pt-3 border-t border-theme-border grid grid-cols-2 gap-2.5 animate-in fade-in">
              <div>
                <label className="block text-[10px] font-semibold text-theme-textMuted uppercase mb-1">
                  Brand
                </label>
                <select
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  className="w-full bg-transparent border border-theme-border text-white rounded-lg p-2 text-xs focus:outline-none"
                >
                  <option value="ALL" className="bg-[#0A0F1E] text-white">All Brands</option>
                  {brands.map((b) => (
                    <option key={b.brand_id} value={b.brand_id} className="bg-[#0A0F1E] text-white">
                      {b.brand_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-theme-textMuted uppercase mb-1">
                  Condition
                </label>
                <select
                  value={selectedCondition}
                  onChange={(e) => setSelectedCondition(e.target.value)}
                  className="w-full bg-transparent border border-theme-border text-white rounded-lg p-2 text-xs focus:outline-none"
                >
                  <option value="ALL" className="bg-[#0A0F1E] text-white">All Conditions</option>
                  <option value="NEW" className="bg-[#0A0F1E] text-white">Brand New</option>
                  <option value="USED" className="bg-[#0A0F1E] text-white">Used / Refurbished</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-theme-textMuted uppercase mb-1">
                  Date Sort
                </label>
                <select
                  value={sortType === 'newest' || sortType === 'oldest' ? sortType : 'newest'}
                  onChange={(e) => setSortType(e.target.value)}
                  className="w-full bg-transparent border border-theme-border text-white rounded-lg p-2 text-xs focus:outline-none"
                >
                  <option value="newest" className="bg-[#0A0F1E] text-white">Newest First</option>
                  <option value="oldest" className="bg-[#0A0F1E] text-white">Oldest First</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-theme-textMuted uppercase mb-1">
                  Price Sort
                </label>
                <select
                  value={sortType === 'price_asc' || sortType === 'price_desc' ? sortType : ''}
                  onChange={(e) => setSortType(e.target.value || 'newest')}
                  className="w-full bg-transparent border border-theme-border text-white rounded-lg p-2 text-xs focus:outline-none"
                >
                  <option value="" className="bg-[#0A0F1E] text-white">Sort by Price</option>
                  <option value="price_asc" className="bg-[#0A0F1E] text-white">Price: Low to High</option>
                  <option value="price_desc" className="bg-[#0A0F1E] text-white">Price: High to Low</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Results Header: Count & Active Filter Tags */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-xs text-theme-textSecondary">
            Showing <strong className="text-white">{filteredPhones.length}</strong> smartphone
            {filteredPhones.length === 1 ? '' : 's'}
            {selectedBrand !== 'ALL' && brands.find((b) => String(b.brand_id) === String(selectedBrand)) && (
              <span> in {brands.find((b) => String(b.brand_id) === String(selectedBrand)).brand_name}</span>
            )}
          </p>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="text-xs text-theme-accent hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Clear filters</span>
            </button>
          )}
        </div>

        {/* Phones Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div
                key={n}
                className="bg-theme-surface/70 border border-theme-border rounded-xl p-3.5 h-[420px] animate-pulse flex flex-col justify-between"
              >
                <div className="aspect-[3/3.4] bg-theme-input/60 rounded-lg mb-3" />
                <div className="space-y-2">
                  <div className="h-3 w-16 bg-theme-input/60 rounded" />
                  <div className="h-4 w-3/4 bg-theme-input/60 rounded" />
                  <div className="h-5 w-24 bg-theme-input/60 rounded" />
                </div>
                <div className="h-8 w-full bg-theme-input/60 rounded-lg mt-3" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="py-20 text-center bg-theme-surface border border-theme-border rounded-3xl p-8 max-w-lg mx-auto">
            <p className="text-base font-semibold text-red-400 mb-2">Error loading phones</p>
            <p className="text-xs text-theme-textMuted mb-6">{error}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 rounded-full bg-theme-accent text-white text-xs font-semibold cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : filteredPhones.length === 0 ? (
          <div className="py-20 text-center bg-theme-surface border border-theme-border rounded-3xl p-8 max-w-md mx-auto">
            <div className="w-16 h-16 rounded-full bg-theme-input flex items-center justify-center mx-auto mb-4 text-theme-textMuted">
              <Search className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">No Smartphones Found</h3>
            <p className="text-xs text-theme-textSecondary mb-6">
              No phones matched your selected criteria or search term. Try resetting your filters.
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="px-6 py-2.5 rounded-full bg-theme-accent hover:bg-theme-accentHover text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-4">
            {filteredPhones.map((phone) => (
              <PhoneCard
                key={phone.phone_id || phone.id}
                phone={phone}
                onViewDetails={(p) => setSelectedPhoneForDetail(p)}
                onReserve={(p) => setSelectedPhoneForReserve(p)}
                onNotifyBackInStock={(p) => setSelectedPhoneForBackInStock(p)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Floating Compare Bar (C-05) */}
      <CompareBar
        phones={phones}
        onOpenCompare={() => setCompareModalOpen(true)}
      />

      {/* Phone Detail Modal (C-03) */}
      {selectedPhoneForDetail && (
        <PhoneDetailModal
          phone={selectedPhoneForDetail}
          allPhones={phones}
          onClose={() => setSelectedPhoneForDetail(null)}
          onOpenReserve={(p) => {
            setSelectedPhoneForReserve(p);
            setSelectedPhoneForDetail(null);
          }}
          onOpenInquiry={(p) => {
            setSelectedPhoneForInquiry(p);
            setSelectedPhoneForDetail(null);
          }}
          onOpenNotifyBackInStock={(p) => {
            setSelectedPhoneForBackInStock(p);
            setSelectedPhoneForDetail(null);
          }}
          onSelectPhone={(simPhone) => setSelectedPhoneForDetail(simPhone)}
        />
      )}

      {/* Side-by-Side Compare Modal (C-05) */}
      {compareModalOpen && (
        <CompareModal
          compareIds={compareIds}
          onClose={() => setCompareModalOpen(false)}
          onReservePhone={(p) => {
            setSelectedPhoneForReserve(p);
            setCompareModalOpen(false);
          }}
          onInquirePhone={(p) => {
            setSelectedPhoneForInquiry(p);
            setCompareModalOpen(false);
          }}
        />
      )}

      {/* Favourites Modal (C-06) */}
      {favoritesModalOpen && (
        <FavoritesModal
          onClose={() => setFavoritesModalOpen(false)}
          onViewPhoneDetails={(p) => setSelectedPhoneForDetail(p)}
          onReservePhone={(p) => setSelectedPhoneForReserve(p)}
        />
      )}

      {/* Inquiry Modal (C-08) */}
      {selectedPhoneForInquiry && (
        <InquiryModal
          phone={selectedPhoneForInquiry}
          onClose={() => setSelectedPhoneForInquiry(null)}
        />
      )}

      {/* Reservation Modal (C-09) */}
      {selectedPhoneForReserve && (
        <ReservationModal
          phone={selectedPhoneForReserve}
          onClose={() => setSelectedPhoneForReserve(null)}
        />
      )}

      {/* Back in Stock Modal (C-10) */}
      {selectedPhoneForBackInStock && (
        <BackInStockModal
          phone={selectedPhoneForBackInStock}
          onClose={() => setSelectedPhoneForBackInStock(null)}
        />
      )}
    </div>
  );
}
