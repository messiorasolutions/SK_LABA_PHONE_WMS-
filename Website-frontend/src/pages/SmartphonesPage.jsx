import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Search,
  Filter,
  SlidersHorizontal,
  ArrowUpDown,
  X,
  RotateCcw,
  Tag,
  Check,
  ChevronDown,
  ChevronUp,
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

// Helper to enrich phone objects with matching active promotional offers
function applyOffersToPhones(phoneList, offers) {
  if (!Array.isArray(phoneList)) return [];
  if (!Array.isArray(offers) || offers.length === 0) return phoneList;

  return phoneList.map((p) => {
    const pIdStr = String(p.phone_id || p.id || '');
    const pNameLower = (p.name || '').toLowerCase();

    const matchingOffer = offers.find((o) => {
      if (Array.isArray(o.phone_ids) && o.phone_ids.some((id) => String(id) === pIdStr)) {
        return true;
      }
      if (Array.isArray(o.phones) && o.phones.some((ph) => String(ph.phone_id || ph.id) === pIdStr)) {
        return true;
      }
      const combinedText = ((o.title || '') + ' ' + (o.description || '')).toLowerCase();
      if (pNameLower && combinedText.includes(pNameLower)) {
        return true;
      }
      return false;
    });

    if (matchingOffer) {
      const regPrice = Number(p.price || p.regular_price || 0);
      const offPrice = Number(matchingOffer.offer_price || 0);
      const savings = regPrice > offPrice ? regPrice - offPrice : Number(matchingOffer.discount_amount || 0);
      const discountPct =
        regPrice > 0 && savings > 0
          ? Math.round((savings / regPrice) * 100)
          : Number(matchingOffer.discount_percentage || 0);

      return {
        ...p,
        offer_price: offPrice,
        regular_price: regPrice,
        active_offer: {
          has_active_offer: true,
          offer_id: matchingOffer.offer_id,
          offer_title: matchingOffer.title,
          offer_price: offPrice,
          regular_price: regPrice,
          discount_percentage: discountPct,
          savings: savings,
        },
      };
    }
    return p;
  });
}

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

  // Filters and Sort State
  const [selectedBrand, setSelectedBrand] = useState('ALL');
  const [selectedCondition, setSelectedCondition] = useState('ALL'); // ALL, NEW, USED
  const [inStockOnly, setInStockOnly] = useState(false);
  const [newArrivalsOnly, setNewArrivalsOnly] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [sortType, setSortType] = useState('newest'); // newest, oldest, price_asc, price_desc
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [priceExpanded, setPriceExpanded] = useState(true);
  const [brandSearchQuery, setBrandSearchQuery] = useState('');
  const [showAllBrands, setShowAllBrands] = useState(false);
  const sortDropdownRef = useRef(null);

  // Modals state
  const [selectedPhoneForDetail, setSelectedPhoneForDetail] = useState(null);
  const [selectedPhoneForReserve, setSelectedPhoneForReserve] = useState(null);
  const [selectedPhoneForInquiry, setSelectedPhoneForInquiry] = useState(null);
  const [selectedPhoneForBackInStock, setSelectedPhoneForBackInStock] = useState(null);
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [favoritesModalOpen, setFavoritesModalOpen] = useState(false);
  const [showCompareBar, setShowCompareBar] = useState(false);

  const activeOffersRef = useRef([]);

  // Critical path loading: Phone inventory loads & renders cards immediately
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    // 1. Critical path: GET phones -> Render phone cards immediately
    phoneService
      .getPhones()
      .then((phoneRes) => {
        if (!isMounted) return;
        const rawPhones = phoneRes.data?.data || phoneRes.data || [];
        const phoneList = Array.isArray(rawPhones) ? rawPhones : [];
        setPhones(applyOffersToPhones(phoneList, activeOffersRef.current));
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || 'Failed to fetch smartphone inventory.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    // 2. Secondary path: Fetch brands in parallel (non-blocking)
    brandService
      .getBrands()
      .then((brandRes) => {
        if (!isMounted) return;
        const rawBrands = brandRes.data?.data || brandRes.data || [];
        setBrands(Array.isArray(rawBrands) ? rawBrands : []);
      })
      .catch(() => {
        if (isMounted) setBrands([]);
      });

    // 3. Secondary path: Fetch active offers in parallel (non-blocking)
    getActiveOffers()
      .then((offerRes) => {
        if (!isMounted) return;
        const offers = offerRes.data?.data || offerRes.data || [];
        const offersList = Array.isArray(offers) ? offers : [];
        activeOffersRef.current = offersList;
        setActiveOffers(offersList);
        setPhones((currentPhones) => applyOffersToPhones(currentPhones, offersList));
      })
      .catch(() => {
        if (isMounted) setActiveOffers([]);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const maxCatalogPrice = useMemo(() => {
    if (!phones || phones.length === 0) return 1650000;
    const max = Math.max(...phones.map((p) => Number(p.offer_price || p.price || 0)));
    return max > 0 ? Math.ceil(max / 10000) * 10000 : 1650000;
  }, [phones]);

  const [sliderMin, setSliderMin] = useState(0);
  const [sliderMax, setSliderMax] = useState(1650000);

  useEffect(() => {
    if (maxCatalogPrice > 0 && priceRange.max === '') {
      setSliderMax(maxCatalogPrice);
    }
  }, [maxCatalogPrice, priceRange.max]);

  // Click outside to close sort dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target)) {
        setIsSortOpen(false);
      }
    }
    if (isSortOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSortOpen]);

  // Price slider handlers
  const handleMinSliderChange = (val) => {
    const num = Math.max(0, Math.min(Number(val) || 0, sliderMax - 1000));
    setSliderMin(num);
    setPriceRange((prev) => ({ ...prev, min: num <= 0 ? '' : num }));
  };

  const handleMaxSliderChange = (val) => {
    const num = Math.min(maxCatalogPrice, Math.max(Number(val) || 0, sliderMin + 1000));
    setSliderMax(num);
    setPriceRange((prev) => ({ ...prev, max: num >= maxCatalogPrice ? '' : num }));
  };

  const sortLabels = {
    newest: 'Newest First',
    oldest: 'Oldest First',
    price_asc: 'Price: Low to High',
    price_desc: 'Price: High to Low',
  };

  // Filtered brands matching search bar inside the Filter Drawer
  const filteredBrandsList = useMemo(() => {
    if (!brandSearchQuery.trim()) return brands;
    const q = brandSearchQuery.toLowerCase();
    return brands.filter((b) => (b.brand_name || '').toLowerCase().includes(q));
  }, [brands, brandSearchQuery]);

  // Reset all filters
  const resetFilters = () => {
    setSelectedBrand('ALL');
    setSelectedCondition('ALL');
    setInStockOnly(false);
    setNewArrivalsOnly(false);
    setPriceRange({ min: '', max: '' });
    setSliderMin(0);
    setSliderMax(maxCatalogPrice);
    setSortType('newest');
    setBrandSearchQuery('');
    setShowAllBrands(false);
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

        // In Stock Only Filter
        if (inStockOnly) {
          const availability = (phone.availability || 'IN_STOCK').toUpperCase();
          const currentStock = Number(phone.current_stock ?? phone.stock ?? 0);
          const isSoldOut = availability === 'SOLD_OUT' || (availability !== 'COMING_SOON' && currentStock === 0);
          if (isSoldOut) return false;
        }

        // New Arrivals Only Filter
        if (newArrivalsOnly) {
          if (!phone.is_new_arrival) return false;
        }

        // Global search query
        if (globalSearch && globalSearch.trim()) {
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
    inStockOnly,
    newArrivalsOnly,
    globalSearch,
    selectedBrand,
    selectedCondition,
    priceRange,
    sortType,
  ]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedBrand !== 'ALL') count++;
    if (selectedCondition !== 'ALL') count++;
    if (inStockOnly) count++;
    if (newArrivalsOnly) count++;
    if (priceRange.min !== '' || priceRange.max !== '') count++;
    return count;
  }, [selectedBrand, selectedCondition, inStockOnly, newArrivalsOnly, priceRange]);

  const hasActiveFilters = activeFilterCount > 0 || sortType !== 'newest';

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
          onOpenNotifyBackInStock={(p) => setSelectedPhoneForBackInStock(p)}
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
        {selectedPhoneForBackInStock && (
          <BackInStockModal
            phone={selectedPhoneForBackInStock}
            onClose={() => setSelectedPhoneForBackInStock(null)}
          />
        )}
      </div>
    );
  }

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
            <h1 className="text-2xl sm:text-3xl font-normal tracking-normal text-white flex items-center gap-3">
              <span>Smartphones & Mobile Devices</span>
            </h1>
          </div>

          {/* Quick Action Pills: Favorites & Compare Triggers */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Compare Button (Left of Favourites, always visible, toggles bottom compare dock) */}
            <button
              type="button"
              onClick={() => setShowCompareBar((prev) => !prev)}
              className={`px-3.5 py-2 rounded-lg text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${
                showCompareBar || compareIds.length > 0
                  ? 'bg-white/10 hover:bg-white/15 border border-white/20 text-white shadow-sm'
                  : 'bg-transparent hover:bg-white/[0.04] border border-theme-border text-theme-textSecondary hover:text-white'
              }`}
              title="Compare smartphones (SRS C-05)"
            >
              <GitCompare className="w-3.5 h-3.5" />
              <span>Compare {compareIds.length > 0 ? `(${compareIds.length}/3)` : ''}</span>
            </button>

            {/* Favourites Button */}
            <button
              type="button"
              onClick={() => setFavoritesModalOpen(true)}
              className="px-3.5 py-2 rounded-lg bg-transparent hover:bg-white/[0.04] border border-theme-border text-theme-textSecondary hover:text-white text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Heart className={`w-3.5 h-3.5 ${favoriteIds.length > 0 ? 'text-red-500 fill-current' : ''}`} />
              <span>Favourites ({favoriteIds.length})</span>
            </button>
          </div>
        </div>

        {/* Page Toolbar: Results count on Left & Filters and Sort by on Right */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <p className="text-xs text-theme-textSecondary font-medium">
              Showing <strong className="text-white font-semibold">{filteredPhones.length}</strong> smartphone
              {filteredPhones.length === 1 ? '' : 's'}
              {selectedBrand !== 'ALL' && brands.find((b) => String(b.brand_id) === String(selectedBrand)) && (
                <span> in {brands.find((b) => String(b.brand_id) === String(selectedBrand)).brand_name}</span>
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

        {/* ── Filters Full Side Drawer (Under Navbar, Increased Width, No Blur) ── */}
        {isFilterDrawerOpen && (
          <div className="fixed top-20 sm:top-24 bottom-0 left-0 right-0 z-40 overflow-hidden flex justify-start">
            {/* Backdrop: dimming without blur under navbar */}
            <div
              className="absolute inset-0 bg-black/60 transition-opacity duration-300 cursor-pointer"
              onClick={() => setIsFilterDrawerOpen(false)}
              aria-label="Close filters drawer"
            />

            {/* Complete Full Side Drawer Under Navbar (Increased Width) */}
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
                {/* In stock only Toggle Switch */}
                <div className="flex items-center justify-between py-1 border-b border-white/10 pb-5">
                  <span className="text-sm font-medium text-white">In stock only</span>
                  <button
                    type="button"
                    onClick={() => setInStockOnly(!inStockOnly)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                      inStockOnly ? 'bg-white' : 'bg-white/20'
                    }`}
                    aria-label="Toggle In stock only"
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full transition-transform duration-200 ${
                        inStockOnly ? 'translate-x-6 bg-[#0A0F1E]' : 'translate-x-1 bg-white'
                      }`}
                    />
                  </button>
                </div>

                {/* New arrivals only Toggle Switch */}
                <div className="flex items-center justify-between py-1 border-b border-white/10 pb-5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">New arrivals only</span>
                    <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-red-600/20 text-red-400 border border-red-500/30 uppercase tracking-wider">
                      New
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNewArrivalsOnly(!newArrivalsOnly)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                      newArrivalsOnly ? 'bg-white' : 'bg-white/20'
                    }`}
                    aria-label="Toggle New arrivals only"
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full transition-transform duration-200 ${
                        newArrivalsOnly ? 'translate-x-6 bg-[#0A0F1E]' : 'translate-x-1 bg-white'
                      }`}
                    />
                  </button>
                </div>

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
                        {/* Background Track */}
                        <div className="absolute w-full h-1 bg-white/20 rounded-full" />
                        {/* Highlighted Active Track */}
                        <div
                          className="absolute h-1 bg-white rounded-full"
                          style={{
                            left: `${Math.min(100, Math.max(0, Math.round((sliderMin / maxCatalogPrice) * 100)))}%`,
                            width: `${Math.max(
                              0,
                              Math.min(
                                100,
                                Math.round(((sliderMax - sliderMin) / maxCatalogPrice) * 100)
                              )
                            )}%`,
                          }}
                        />
                        {/* Min Slider Thumb */}
                        <input
                          type="range"
                          min={0}
                          max={maxCatalogPrice}
                          step={1000}
                          value={sliderMin}
                          onChange={(e) => handleMinSliderChange(e.target.value)}
                          className={`absolute w-full appearance-none bg-transparent pointer-events-none focus:outline-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-black [&::-moz-range-thumb]:cursor-pointer ${
                            sliderMin > maxCatalogPrice - 10000 ? 'z-30' : 'z-20'
                          }`}
                        />
                        {/* Max Slider Thumb */}
                        <input
                          type="range"
                          min={0}
                          max={maxCatalogPrice}
                          step={1000}
                          value={sliderMax}
                          onChange={(e) => handleMaxSliderChange(e.target.value)}
                          className="absolute w-full appearance-none bg-transparent pointer-events-none z-20 focus:outline-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-black [&::-moz-range-thumb]:cursor-pointer"
                        />
                      </div>

                      {/* Min & Max Inputs ($ ... to $ ...) */}
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
                    <label className="block text-sm font-medium text-white">
                      Brand
                    </label>
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

                  {/* Brand Search Bar (without overlapping icon) */}
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

                  {/* Searchable Brands List (Shows 2 brands by default, expandable with View more) */}
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
                      const isSelected = String(selectedBrand) === String(b.brand_id);
                      return (
                        <button
                          key={b.brand_id}
                          type="button"
                          onClick={() => setSelectedBrand(String(b.brand_id))}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left cursor-pointer ${
                            isSelected
                              ? 'bg-white/15 text-white font-semibold'
                              : 'text-theme-textSecondary hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          <span>{b.brand_name}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                        </button>
                      );
                    })}

                    {/* View more / View less button if more than 2 brands exist */}
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

                    {filteredBrandsList.length === 0 && (
                      <div className="py-3 text-center text-xs text-theme-textMuted">
                        No brands match "{brandSearchQuery}"
                      </div>
                    )}
                  </div>
                </div>

                {/* All Conditions Filter */}
                <div className="pb-2">
                  <label className="block text-sm font-medium text-white mb-2.5">
                    Condition
                  </label>
                  <div className="space-y-1">
                    {[
                      { id: 'ALL', label: 'All Conditions' },
                      { id: 'NEW', label: 'Brand New' },
                      { id: 'USED', label: 'Used / Refurbished' },
                    ].map((cond) => {
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
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-2.5 sm:gap-3.5 md:gap-4">
            {filteredPhones.map((phone) => (
              <PhoneCard
                key={phone.phone_id || phone.id}
                phone={phone}
                onViewDetails={(p) => { setSelectedPhoneForDetail(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
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
        isOpen={showCompareBar}
        onClose={() => setShowCompareBar(false)}
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
