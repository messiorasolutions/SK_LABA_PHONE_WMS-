import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import {
  Home,
  ChevronRight,
  SlidersHorizontal,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  Search,
} from 'lucide-react';
import PhoneCard from '../components/PhoneCard';
import { resolveImageUrl } from '../utils/imageHelper';
import PhoneDetailModal from '../components/Modals/PhoneDetailModal';
import ReservationModal from '../components/Modals/ReservationModal';
import InquiryModal from '../components/Modals/InquiryModal';
import { getMarketplacePhones } from '../services/marketplaceService';

function normalizeMarketplacePhone(p) {
  const listingId = p.listing_id || p.id || p.phone_id;
  const brandName = p.brand || p.brand_name || 'Marketplace';
  const modelName = p.model || p.name || '';
  const fullName = p.name || `${brandName} ${modelName}`.trim();

  let photoList = [];
  if (Array.isArray(p.photos) && p.photos.length > 0) {
    photoList = p.photos.map((u) => resolveImageUrl(u));
  } else if (typeof p.photos === 'string' && p.photos.trim().startsWith('[')) {
    try {
      photoList = JSON.parse(p.photos).map((u) => resolveImageUrl(u));
    } catch (e) {
      photoList = [resolveImageUrl(p.photos)];
    }
  } else if (p.main_photo) {
    photoList = [resolveImageUrl(p.main_photo)];
  } else if (p.photo) {
    photoList = [resolveImageUrl(p.photo)];
  }

  const primaryPhoto = photoList[0] || resolveImageUrl(p.main_photo || p.image_url);
  const colorName = p.color || 'Standard';

  const colour_options = [
    {
      id: 'color_0',
      name: colorName,
      color_name: colorName,
      color_code: '#475569',
      quantity: 1,
      photos: photoList,
      storage_quantities: {
        [p.storage || 'Standard']: 1,
      },
    },
  ];

  // Exact seller uploaded description
  const sellerDescription = (p.condition_description || p.description || '').trim();

  return {
    ...p,
    phone_id: listingId,
    id: listingId,
    listing_id: listingId,
    name: fullName,
    brand_name: brandName,
    brand: brandName,
    model: modelName,
    storage: p.storage || 'Standard',
    storage_ids: [p.storage || 'Standard'],
    price: Number(p.price || 0),
    regular_price: Number(p.price || 0),
    photos: photoList,
    photo_urls: photoList,
    main_photo: primaryPhoto,
    colour_options,
    current_stock: 1,
    stock: 1,
    availability: 'IN_STOCK',
    is_marketplace: true,
    source: 'MARKETPLACE',
    product_source: 'MARKETPLACE',
    phone_condition: p.condition_grade || p.phone_condition || 'USED',
    condition_grade: p.condition_grade,
    condition_description: sellerDescription,
    description: sellerDescription,
    physical_condition: p.physical_condition,
    display_condition: p.display_condition,
    camera_condition: p.camera_condition,
    biometrics_status: p.biometrics_status,
    battery_health: p.battery_health,
    original_box: Boolean(p.original_box),
    charger_included: Boolean(p.charger_included),
    warranty: null,
  };
}

export default function MarketplacePage({ onNavigateToHome }) {
  // Global search from Navbar
  const globalSearch = useSelector((state) => state.hero?.searchQuery || '');

  // Data state
  const [phones, setPhones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Selected phone modals
  const [selectedPhoneForDetail, setSelectedPhoneForDetail] = useState(null);
  const [selectedPhoneForReserve, setSelectedPhoneForReserve] = useState(null);
  const [selectedPhoneForInquiry, setSelectedPhoneForInquiry] = useState(null);

  // Filter & Sort UI state (Identical to SmartphonesPage)
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [sortType, setSortType] = useState('newest'); // 'newest' | 'oldest' | 'price_asc' | 'price_desc'
  const sortDropdownRef = useRef(null);

  // Filter criteria state
  const [selectedBrand, setSelectedBrand] = useState('ALL');
  const [selectedCondition, setSelectedCondition] = useState('ALL');
  const [priceExpanded, setPriceExpanded] = useState(true);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [sliderMin, setSliderMin] = useState(0);
  const [sliderMax, setSliderMax] = useState(5000);
  const [brandSearchQuery, setBrandSearchQuery] = useState('');
  const [showAllBrands, setShowAllBrands] = useState(false);

  // Sort dropdown outside click handler
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(e.target)) {
        setIsSortOpen(false);
      }
    };
    if (isSortOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSortOpen]);

  // Fetch all published marketplace listings
  const fetchListings = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await getMarketplacePhones({
        page: 1,
        limit: 100,
        sort_by: 'created_at',
        sort_order: 'DESC',
      });

      const list = (res.data || []).map(normalizeMarketplacePhone);
      setPhones(list);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Unable to load Marketplace phones. Please check your internet connection and try again.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  // Dynamic max catalog price
  const maxCatalogPrice = useMemo(() => {
    if (phones.length === 0) return 5000;
    const max = Math.max(...phones.map((p) => Number(p.price || 0)));
    return Math.max(500, Math.ceil(max / 100) * 100 || 5000);
  }, [phones]);

  useEffect(() => {
    if (sliderMax === 5000 && maxCatalogPrice > 0) {
      setSliderMax(maxCatalogPrice);
    }
  }, [maxCatalogPrice]);

  // Price slider handlers
  const handleMinSliderChange = (val) => {
    const num = Math.max(0, Math.min(Number(val) || 0, sliderMax - 100));
    setSliderMin(num);
    setPriceRange((prev) => ({ ...prev, min: num <= 0 ? '' : num }));
  };

  const handleMaxSliderChange = (val) => {
    const num = Math.min(maxCatalogPrice, Math.max(Number(val) || 0, sliderMin + 100));
    setSliderMax(num);
    setPriceRange((prev) => ({ ...prev, max: num >= maxCatalogPrice ? '' : num }));
  };

  const sortLabels = {
    newest: 'Newest First',
    oldest: 'Oldest First',
    price_asc: 'Price: Low to High',
    price_desc: 'Price: High to Low',
  };

  // Derive unique brands from loaded marketplace phones
  const availableBrands = useMemo(() => {
    const map = new Map();
    phones.forEach((p) => {
      const b = (p.brand || p.brand_name || '').trim();
      if (b && b.toLowerCase() !== 'marketplace') {
        const key = b.toLowerCase();
        if (!map.has(key)) {
          map.set(key, b);
        }
      }
    });
    const list = Array.from(map.values()).sort((a, b) => a.localeCompare(b));
    return list.length > 0 ? list : ['Apple', 'Google', 'OnePlus', 'Samsung', 'Xiaomi'];
  }, [phones]);

  // Filtered brands inside filter drawer
  const filteredBrandsList = useMemo(() => {
    if (!brandSearchQuery.trim()) return availableBrands;
    const q = brandSearchQuery.toLowerCase();
    return availableBrands.filter((b) => b.toLowerCase().includes(q));
  }, [availableBrands, brandSearchQuery]);

  const conditionOptions = [
    { id: 'ALL', label: 'All Conditions' },
    { id: 'BRAND_NEW', label: 'Brand New' },
    { id: 'LIKE_NEW', label: 'Like New' },
    { id: 'EXCELLENT', label: 'Excellent' },
    { id: 'VERY_GOOD', label: 'Very Good' },
    { id: 'GOOD', label: 'Good' },
    { id: 'FAIR', label: 'Fair' },
  ];

  // Filtered & Sorted phones
  const filteredPhones = useMemo(() => {
    return phones
      .filter((phone) => {
        // Exclude archived/rejected if any
        if (phone.status === 'ARCHIVED' || phone.status === 'REJECTED') return false;

        // Global search query from Navbar
        if (globalSearch && globalSearch.trim()) {
          const q = globalSearch.toLowerCase().trim();
          const nameMatch = phone.name?.toLowerCase().includes(q);
          const brandMatch = (phone.brand || phone.brand_name)?.toLowerCase().includes(q);
          if (!nameMatch && !brandMatch) return false;
        }

        // Brand filter
        if (selectedBrand !== 'ALL') {
          const pBrand = (phone.brand || phone.brand_name || '').toLowerCase();
          if (pBrand !== selectedBrand.toLowerCase()) return false;
        }

        // Condition filter
        if (selectedCondition !== 'ALL') {
          const cond = (phone.condition_grade || phone.phone_condition || '').toUpperCase();
          if (cond !== selectedCondition && !cond.includes(selectedCondition)) {
            return false;
          }
        }

        // Price range filter
        const effPrice = Number(phone.price || 0);
        if (priceRange.min !== '' && !isNaN(Number(priceRange.min))) {
          if (effPrice < Number(priceRange.min)) return false;
        }
        if (priceRange.max !== '' && !isNaN(Number(priceRange.max))) {
          if (effPrice > Number(priceRange.max)) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const priceA = Number(a.price || 0);
        const priceB = Number(b.price || 0);

        if (sortType === 'price_asc') {
          return priceA - priceB;
        } else if (sortType === 'price_desc') {
          return priceB - priceA;
        } else if (sortType === 'oldest') {
          return (
            (new Date(a.created_at || 0).getTime() || Number(a.id || a.phone_id || 0)) -
            (new Date(b.created_at || 0).getTime() || Number(b.id || b.phone_id || 0))
          );
        } else {
          // newest
          return (
            (new Date(b.created_at || 0).getTime() || Number(b.id || b.phone_id || 0)) -
            (new Date(a.created_at || 0).getTime() || Number(a.id || a.phone_id || 0))
          );
        }
      });
  }, [phones, globalSearch, selectedBrand, selectedCondition, priceRange, sortType]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedBrand !== 'ALL') count++;
    if (selectedCondition !== 'ALL') count++;
    if (priceRange.min !== '' || priceRange.max !== '') count++;
    return count;
  }, [selectedBrand, selectedCondition, priceRange]);

  const hasActiveFilters = activeFilterCount > 0 || sortType !== 'newest';

  // Reset all filters
  const resetFilters = () => {
    setSelectedBrand('ALL');
    setSelectedCondition('ALL');
    setPriceRange({ min: '', max: '' });
    setSliderMin(0);
    setSliderMax(maxCatalogPrice);
    setSortType('newest');
    setBrandSearchQuery('');
    setShowAllBrands(false);
  };

  if (selectedPhoneForDetail) {
    return (
      <div className="w-full min-h-screen bg-black">
        <PhoneDetailModal
          phone={selectedPhoneForDetail}
          allPhones={phones}
          onClose={() => {
            setSelectedPhoneForDetail(null);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onOpenReserve={(p) => setSelectedPhoneForReserve(p)}
          onOpenInquiry={(p) => setSelectedPhoneForInquiry(p)}
          onSelectPhone={(simPhone) => {
            setSelectedPhoneForDetail(simPhone);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />

        {selectedPhoneForReserve && (
          <ReservationModal
            phone={selectedPhoneForReserve}
            onClose={() => setSelectedPhoneForReserve(null)}
          />
        )}
        {selectedPhoneForInquiry && (
          <InquiryModal
            phone={selectedPhoneForInquiry}
            onClose={() => setSelectedPhoneForInquiry(null)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="relative w-full bg-theme-bg min-h-screen py-8 sm:py-12 text-theme-textPrimary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb Navigation Bar */}
        <div className="flex items-center gap-2 text-xs text-theme-textMuted mb-6">
          <button
            type="button"
            onClick={onNavigateToHome}
            className="hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer font-medium"
          >
            <Home className="w-3.5 h-3.5 text-theme-textSecondary" />
            <span>Home</span>
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-theme-borderLight" />
          <span className="text-theme-accentLight font-semibold">Marketplace</span>
        </div>

        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 pb-6 border-b border-theme-border/60">
          <div>
            <h1 className="text-2xl sm:text-3xl font-normal tracking-normal text-white flex items-center gap-3">
              <span>SK LABA PHONE Marketplace</span>
            </h1>
          </div>
        </div>

        {/* Page Toolbar: Results count on Left & Filters and Sort by on Right */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <p className="text-xs text-theme-textSecondary font-medium">
              Showing <strong className="text-white font-semibold">{filteredPhones.length}</strong> smartphone
              {filteredPhones.length === 1 ? '' : 's'}
              {selectedBrand !== 'ALL' && (
                <span> in {selectedBrand}</span>
              )}
            </p>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="text-xs text-theme-accent hover:underline ml-2 cursor-pointer"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Right Side: Filters Button & Sort By Button */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 self-start sm:self-auto flex-wrap relative">
            {/* Filters Button */}
            <button
              type="button"
              onClick={() => setIsFilterDrawerOpen(true)}
              className="px-4 py-2 rounded-full border border-theme-border hover:border-white/30 bg-theme-surface/70 hover:bg-white/[0.06] text-white text-xs font-medium flex items-center gap-2 transition-all cursor-pointer shadow-sm"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-theme-textSecondary" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-white text-[#0A0F1E] text-[10px] font-extrabold flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Sort By Dropdown Button */}
            <div className="relative" ref={sortDropdownRef}>
              <button
                type="button"
                onClick={() => setIsSortOpen(!isSortOpen)}
                className="px-4 py-2 rounded-full border border-theme-border hover:border-white/30 bg-theme-surface/70 hover:bg-white/[0.06] text-white text-xs font-medium flex items-center gap-2 transition-all cursor-pointer shadow-sm"
              >
                <ArrowUpDown className="w-3.5 h-3.5 text-theme-textSecondary" />
                <span>
                  Sort by:{' '}
                  <span className="text-white font-semibold">
                    {sortLabels[sortType] || 'Newest First'}
                  </span>
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-theme-textMuted transition-transform duration-200 ${
                    isSortOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Custom Sort Dropdown Menu */}
              {isSortOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-[#0A0F1E] border border-theme-border rounded-xl shadow-2xl p-1.5 z-40 animate-in fade-in zoom-in-95">
                  {Object.entries(sortLabels).map(([key, label]) => {
                    const isSelected = sortType === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          setSortType(key);
                          setIsSortOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-white/10 text-white font-semibold'
                            : 'text-theme-textSecondary hover:text-white hover:bg-white/[0.04]'
                        }`}
                      >
                        <span>{label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Filters Full Side Drawer (Under Navbar, matching Smartphones page) ── */}
        {isFilterDrawerOpen && (
          <div className="fixed top-20 sm:top-24 bottom-0 left-0 right-0 z-40 overflow-hidden flex justify-start">
            {/* Backdrop: dimming without blur under navbar */}
            <div
              className="absolute inset-0 bg-black/60 transition-opacity duration-300 cursor-pointer"
              onClick={() => setIsFilterDrawerOpen(false)}
              aria-label="Close filters drawer"
            />

            {/* Complete Full Side Drawer Under Navbar */}
            <div className="relative w-full max-w-[460px] sm:max-w-[480px] h-full bg-[#0A0F1E] border-r border-white/10 shadow-[10px_0_50px_rgba(0,0,0,0.8)] flex flex-col z-10 animate-in slide-in-from-left duration-300 ease-out overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 shrink-0 bg-[#0A0F1E]">
                <h2 className="text-xl font-bold text-white tracking-tight">Filters</h2>
                <button
                  type="button"
                  onClick={() => setIsFilterDrawerOpen(false)}
                  className="w-8 h-8 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 text-theme-textSecondary hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                  title="Close filters"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable Filters Content */}
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
                {/* Price Filter Accordion */}
                <div className="border-b border-white/10 pb-6">
                  <button
                    type="button"
                    onClick={() => setPriceExpanded(!priceExpanded)}
                    className="w-full flex items-center justify-between text-left cursor-pointer group"
                  >
                    <span className="text-sm font-medium text-white">Price</span>
                    {priceExpanded ? (
                      <ChevronUp className="w-4 h-4 text-theme-textSecondary group-hover:text-white transition-colors" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-theme-textSecondary group-hover:text-white transition-colors" />
                    )}
                  </button>

                  {priceExpanded && (
                    <div className="mt-5 space-y-4 animate-in fade-in duration-200">
                      {/* Dual Range Slider */}
                      <div className="relative w-full h-6 flex items-center select-none">
                        <div className="absolute w-full h-1 bg-white/20 rounded-full" />
                        <div
                          className="absolute h-1 bg-white rounded-full"
                          style={{
                            left: `${Math.min(100, Math.max(0, Math.round((sliderMin / (maxCatalogPrice || 1)) * 100)))}%`,
                            width: `${Math.max(
                              0,
                              Math.min(
                                100,
                                Math.round(((sliderMax - sliderMin) / (maxCatalogPrice || 1)) * 100)
                              )
                            )}%`,
                          }}
                        />
                        <input
                          type="range"
                          min={0}
                          max={maxCatalogPrice}
                          step={100}
                          value={sliderMin}
                          onChange={(e) => handleMinSliderChange(e.target.value)}
                          className={`absolute w-full appearance-none bg-transparent pointer-events-none focus:outline-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-black [&::-moz-range-thumb]:cursor-pointer ${
                            sliderMin > maxCatalogPrice - 1000 ? 'z-30' : 'z-20'
                          }`}
                        />
                        <input
                          type="range"
                          min={0}
                          max={maxCatalogPrice}
                          step={100}
                          value={sliderMax}
                          onChange={(e) => handleMaxSliderChange(e.target.value)}
                          className="absolute w-full appearance-none bg-transparent pointer-events-none z-20 focus:outline-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-black [&::-moz-range-thumb]:cursor-pointer"
                        />
                      </div>

                      <div className="flex items-center justify-between gap-3 pt-1">
                        <div className="flex items-center gap-2 flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs">
                          <span className="text-theme-textMuted font-medium select-none">$</span>
                          <input
                            type="number"
                            value={sliderMin}
                            onChange={(e) => handleMinSliderChange(e.target.value)}
                            className="w-full bg-transparent text-white font-medium focus:outline-none text-base sm:text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            placeholder="0"
                          />
                        </div>
                        <span className="text-xs text-theme-textMuted font-medium select-none">to</span>
                        <div className="flex items-center gap-2 flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs">
                          <span className="text-theme-textMuted font-medium select-none">$</span>
                          <input
                            type="number"
                            value={sliderMax}
                            onChange={(e) => handleMaxSliderChange(e.target.value)}
                            className="w-full bg-transparent text-white font-medium focus:outline-none text-base sm:text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            placeholder={String(maxCatalogPrice)}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Brands Filter with Search Bar */}
                <div className="border-b border-white/10 pb-6">
                  <div className="flex items-center justify-between mb-2.5">
                    <label className="block text-sm font-medium text-white">Brand</label>
                    {selectedBrand !== 'ALL' && (
                      <button
                        type="button"
                        onClick={() => setSelectedBrand('ALL')}
                        className="text-[11px] text-theme-accent hover:underline cursor-pointer"
                      >
                        Reset
                      </button>
                    )}
                  </div>

                  <div className="relative mb-3">
                    <input
                      type="text"
                      value={brandSearchQuery}
                      onChange={(e) => setBrandSearchQuery(e.target.value)}
                      placeholder="Search brands..."
                      className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-3.5 pr-8 py-2 text-base sm:text-xs font-medium placeholder:text-theme-textMuted focus:outline-none focus:border-white/30 transition-all"
                    />
                    {brandSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setBrandSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-theme-textMuted hover:text-white cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  <div className="space-y-1 pr-1">
                    {(!brandSearchQuery || 'all brands'.includes(brandSearchQuery.toLowerCase())) && (
                      <button
                        type="button"
                        onClick={() => setSelectedBrand('ALL')}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left cursor-pointer ${
                          selectedBrand === 'ALL'
                            ? 'bg-white/15 text-white font-semibold'
                            : 'text-theme-textSecondary hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <span>All Brands</span>
                        {selectedBrand === 'ALL' && <Check className="w-3.5 h-3.5 text-white" />}
                      </button>
                    )}

                    {(brandSearchQuery ? filteredBrandsList : filteredBrandsList.slice(0, showAllBrands ? undefined : 2)).map((b) => {
                      const isSelected = selectedBrand.toLowerCase() === b.toLowerCase();
                      return (
                        <button
                          key={b}
                          type="button"
                          onClick={() => setSelectedBrand(b)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left cursor-pointer ${
                            isSelected
                              ? 'bg-white/15 text-white font-semibold'
                              : 'text-theme-textSecondary hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          <span>{b}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                        </button>
                      );
                    })}

                    {!brandSearchQuery && filteredBrandsList.length > 2 && (
                      <button
                        type="button"
                        onClick={() => setShowAllBrands(!showAllBrands)}
                        className="w-full mt-2 py-1.5 px-3 rounded-lg border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <span>{showAllBrands ? 'View less' : `View more (${filteredBrandsList.length - 2} more)`}</span>
                        {showAllBrands ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>
                </div>

                {/* Condition Filter */}
                <div className="pb-2">
                  <label className="block text-sm font-medium text-white mb-2.5">
                    Condition
                  </label>
                  <div className="space-y-1">
                    {conditionOptions.map((cond) => {
                      const isSelected = selectedCondition === cond.id;
                      return (
                        <button
                          key={cond.id}
                          type="button"
                          onClick={() => setSelectedCondition(cond.id)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left cursor-pointer ${
                            isSelected
                              ? 'bg-white/15 text-white font-semibold'
                              : 'text-theme-textSecondary hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          <span>{cond.label}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Sticky Bottom Actions */}
              <div className="p-5 border-t border-white/10 bg-[#0A0F1E] shrink-0">
                <button
                  type="button"
                  onClick={() => setIsFilterDrawerOpen(false)}
                  className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-200 text-[#0A0F1E] text-xs font-bold transition-all shadow-lg cursor-pointer"
                >
                  View results ({filteredPhones.length})
                </button>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="w-full mt-2 py-1 text-center text-xs text-theme-textMuted hover:text-red-400 transition-colors cursor-pointer"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Phones Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-2.5 sm:gap-3.5 md:gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
              <div
                key={n}
                className="bg-theme-surface/70 border border-theme-border rounded-2xl overflow-hidden animate-pulse flex flex-col"
              >
                <div className="aspect-square w-full bg-theme-input/40" />
                <div className="p-2.5 sm:p-4 space-y-2 sm:space-y-3">
                  <div className="h-3 w-16 bg-theme-input/60 rounded" />
                  <div className="h-4 w-3/4 bg-theme-input/60 rounded" />
                  <div className="pt-2 border-t border-theme-border/40">
                    <div className="h-5 w-24 bg-theme-input/60 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="py-20 text-center bg-theme-surface border border-theme-border rounded-3xl p-8 max-w-lg mx-auto">
            <p className="text-base font-semibold text-red-400 mb-2">Error loading phones</p>
            <p className="text-xs text-theme-textMuted mb-6">{error}</p>
            <button
              type="button"
              onClick={fetchListings}
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-2.5 sm:gap-3.5 md:gap-4">
            {filteredPhones.map((phone) => (
              <PhoneCard
                key={phone.id || phone.listing_id || phone.phone_id}
                phone={phone}
                onViewDetails={(p) => {
                  setSelectedPhoneForDetail(p);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onReserve={(p) => setSelectedPhoneForReserve(p)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals & Overlays */}
      {selectedPhoneForReserve && (
        <ReservationModal
          phone={selectedPhoneForReserve}
          onClose={() => setSelectedPhoneForReserve(null)}
        />
      )}

      {selectedPhoneForInquiry && (
        <InquiryModal
          phone={selectedPhoneForInquiry}
          onClose={() => setSelectedPhoneForInquiry(null)}
        />
      )}
    </div>
  );
}
