import React, { useState, useEffect } from 'react';
import {
  X,
  Heart,
  GitCompare,
  Share2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useFavoritesAndCompare } from '../../hooks/useFavoritesAndCompare';
import { STORE_INFO } from '../../constants/siteConfig';
import phoneService from '../../services/phoneService';

export default function PhoneDetailModal({
  phone,
  allPhones = [],
  onClose,
  onOpenReserve,
  onOpenInquiry,
  onOpenNotifyBackInStock,
  onSelectPhone,
}) {
  const { isFavorite, isInCompare, toggleFavorite, toggleCompare } = useFavoritesAndCompare();

  const phoneId = phone?.phone_id || phone?.id;
  const favorited = isFavorite(phoneId);
  const inComparison = isInCompare(phoneId);

  // Photos
  let photos = [];
  if (Array.isArray(phone?.photos) && phone.photos.length > 0) {
    photos = phone.photos;
  } else if (phone?.main_photo) {
    photos = [phone.main_photo];
  } else if (typeof phone?.photos === 'string' && phone.photos.startsWith('[')) {
    try {
      photos = JSON.parse(phone.photos);
    } catch (e) {
      photos = [];
    }
  }

  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  // Reset photo index when phone changes
  useEffect(() => {
    setActivePhotoIdx(0);
  }, [phoneId]);

  // Photo swap controls (top swap buttons)
  const handlePrevPhoto = (e) => {
    e?.stopPropagation();
    if (photos.length <= 1) return;
    setActivePhotoIdx((prev) => (prev - 1 + photos.length) % photos.length);
  };

  const handleNextPhoto = (e) => {
    e?.stopPropagation();
    if (photos.length <= 1) return;
    setActivePhotoIdx((prev) => (prev + 1) % photos.length);
  };

  // Keyboard navigation for image swap & escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose && onClose();
      if (e.key === 'ArrowLeft') handlePrevPhoto();
      if (e.key === 'ArrowRight') handleNextPhoto();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [photos.length]);

  // Color options
  let colorOptions = [];
  if (Array.isArray(phone?.colour_options)) {
    colorOptions = phone.colour_options;
  } else if (typeof phone?.colour_options === 'string') {
    try {
      colorOptions = JSON.parse(phone.colour_options);
    } catch (e) {
      colorOptions = phone.colour_options.split(',').map((c) => c.trim()).filter(Boolean);
    }
  }
  const [selectedColor, setSelectedColor] = useState(colorOptions[0] || 'Default');

  // Storage options
  const storageIds = Array.isArray(phone?.storage_ids) ? phone.storage_ids : [];
  const [selectedStorage, setSelectedStorage] = useState(storageIds[0] || 'Standard');

  // Installments state
  const [installmentsData, setInstallmentsData] = useState(null);
  const [loadingInstallments, setLoadingInstallments] = useState(false);

  // Share feedback state
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (phone?.installment_enabled && phoneId) {
      setLoadingInstallments(true);
      phoneService
        .getPhoneInstallments(phoneId)
        .then((res) => {
          if (res.data?.success && res.data?.data) {
            setInstallmentsData(res.data.data);
          }
        })
        .catch(() => {})
        .finally(() => setLoadingInstallments(false));
    } else {
      setInstallmentsData(null);
    }
  }, [phoneId, phone?.installment_enabled]);

  if (!phone) return null;

  // Stock status
  const availability = (phone.availability || 'IN_STOCK').toUpperCase();
  const currentStock = Number(phone.current_stock ?? phone.stock ?? 0);
  const isSoldOut = availability === 'SOLD_OUT' || (availability !== 'COMING_SOON' && currentStock === 0);
  const isLowStock = availability === 'LOW_STOCK' || (currentStock > 0 && currentStock <= (phone.low_stock_level || 5));
  const isComingSoon = availability === 'COMING_SOON';

  // Pricing
  const regularPrice = Number(phone.price || phone.regular_price || 0);
  const offerPrice = phone.offer_price || phone.active_offer?.offer_price;
  const hasOffer = Boolean(offerPrice && Number(offerPrice) < regularPrice);
  const effectivePrice = hasOffer ? Number(offerPrice) : regularPrice;
  const savings = hasOffer ? regularPrice - effectivePrice : 0;
  const discountPercent = hasOffer ? Math.round((savings / regularPrice) * 100) : 0;

  // WhatsApp click handler
  const handleWhatsApp = () => {
    const pageUrl = window.location.href;
    const cleanNumber = (STORE_INFO.whatsapp || '').replace(/\D/g, '');
    const message = encodeURIComponent(
      `Hello SK LABA PHONE, I am interested in: ${phone.name} ($${effectivePrice.toLocaleString()}).\nView Link: ${pageUrl}`
    );
    window.open(`https://wa.me/${cleanNumber}?text=${message}`, '_blank');
  };

  // Direct phone call handler
  const handleCall = () => {
    window.location.href = `tel:${STORE_INFO.phone}`;
  };

  // Share link handler
  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  // Similar phones calculation
  const similarPhones = allPhones
    .filter((p) => {
      const pId = p.phone_id || p.id;
      return pId !== phoneId;
    })
    .filter((p) => {
      const sameBrand = (p.brand_name || '').toLowerCase() === (phone.brand_name || '').toLowerCase();
      const diffPrice = Math.abs(Number(p.price || 0) - regularPrice);
      return sameBrand || diffPrice <= 200;
    })
    .slice(0, 3);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/70 backdrop-blur-sm transition-opacity duration-300">
      {/* Click outside backdrop (left 40%) */}
      <div
        className="absolute inset-0 cursor-pointer"
        onClick={onClose}
        aria-label="Close drawer"
      />

      {/* Right-Side 60% Slide-Over Drawer */}
      <div className="absolute top-0 right-0 bottom-0 h-full w-full sm:w-[85%] md:w-[60%] lg:w-[60%] bg-[#0A0F1E] border-l border-theme-border shadow-[-24px_0_60px_rgba(0,0,0,0.9)] flex flex-col z-10 animate-in slide-in-from-right duration-300 ease-out">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-theme-border bg-theme-surface/90 backdrop-blur-md sticky top-0 z-20 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-wider text-theme-textSecondary">
              {phone.brand_name || 'Smartphone'}
            </span>
            <span className="text-theme-borderLight">•</span>
            <span className="px-2 py-0.5 text-[10px] font-medium uppercase rounded border border-white/15 bg-transparent text-white/90">
              {phone.phone_condition || 'NEW'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Share */}
            <button
              type="button"
              onClick={handleShare}
              className="p-1.5 rounded-lg border border-theme-border bg-transparent hover:bg-white/[0.04] text-theme-textSecondary hover:text-white transition-colors cursor-pointer"
              title="Share Link & Preview"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>

            {/* Compare */}
            <button
              type="button"
              onClick={() => {
                const res = toggleCompare(phoneId);
                if (res && !res.success && res.error) alert(res.error);
              }}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                inComparison
                  ? 'bg-white/15 text-white border-white/30'
                  : 'border-theme-border bg-transparent hover:bg-white/[0.04] text-theme-textSecondary hover:text-white'
              }`}
              title="Compare Phone"
            >
              <GitCompare className="w-3.5 h-3.5" />
            </button>

            {/* Favorite */}
            <button
              type="button"
              onClick={() => toggleFavorite(phoneId)}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                favorited
                  ? 'bg-red-950/50 text-red-400 border-red-500/30'
                  : 'border-theme-border bg-transparent hover:bg-white/[0.04] text-theme-textSecondary hover:text-red-400'
              }`}
              title="Save to Favourites"
            >
              <Heart className={`w-3.5 h-3.5 ${favorited ? 'fill-current' : ''}`} />
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg border border-theme-border bg-transparent hover:bg-white/[0.04] text-theme-textSecondary hover:text-white transition-colors ml-1.5 cursor-pointer"
              title="Close drawer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Drawer Scrollable Body */}
        <div className="overflow-y-auto px-6 sm:px-8 py-6 space-y-6 flex-1">
          {/* Main Grid: Gallery on left, Primary Purchase Info on right */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Photo Gallery with Top Swap Buttons */}
            <div className="flex flex-col gap-2.5">
              <div className="relative aspect-[4/3] sm:aspect-square w-full bg-[#080D1A] rounded-xl border border-theme-border p-4 flex items-center justify-center overflow-hidden group">
                
                {/* Top Two Swap Buttons (< and >) */}
                <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1.5 bg-black/60 backdrop-blur-md border border-white/10 rounded-lg px-2 py-1 shadow">
                  <button
                    type="button"
                    onClick={handlePrevPhoto}
                    className="p-0.5 rounded text-theme-textSecondary hover:text-white transition-colors cursor-pointer"
                    title="Previous image"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>

                  <span className="text-[10px] text-theme-textMuted px-1 font-mono select-none">
                    {photos.length > 0 ? `${activePhotoIdx + 1} / ${photos.length}` : '1 / 1'}
                  </span>

                  <button
                    type="button"
                    onClick={handleNextPhoto}
                    className="p-0.5 rounded text-theme-textSecondary hover:text-white transition-colors cursor-pointer"
                    title="Next image"
                    aria-label="Next image"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {photos[activePhotoIdx] ? (
                  <img
                    src={photos[activePhotoIdx]}
                    alt={phone.name}
                    className="max-h-full max-w-full object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.5)] transition-all duration-200"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-theme-textMuted">
                    <span className="text-xs">SK LABA PHONE</span>
                  </div>
                )}

                {/* Offer tag (clean official tag, no neon bg) */}
                {hasOffer && (
                  <div className="absolute top-2.5 left-2.5 z-10 inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-white/15 bg-black/60 backdrop-blur-md text-white/90 text-[10px] font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                    <span>Save ${savings.toFixed(0)} ({discountPercent}% off)</span>
                  </div>
                )}
              </div>

              {/* Thumbnails row */}
              {photos.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto py-1">
                  {photos.map((photoUrl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActivePhotoIdx(idx)}
                      className={`relative w-14 h-14 rounded-lg border p-1 bg-transparent shrink-0 transition-all cursor-pointer ${
                        activePhotoIdx === idx
                          ? 'border-white/30 bg-white/10'
                          : 'border-theme-border opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={photoUrl}
                        alt={`Thumbnail ${idx + 1}`}
                        className="w-full h-full object-contain"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Details & Actions */}
            <div className="flex flex-col justify-between h-full space-y-5">
              <div>
                <h1 className="text-xl sm:text-2xl font-normal text-white leading-tight mb-2">
                  {phone.name}
                </h1>

                {/* Stock & Availability status (Official subtle status indicator, no highlighted neon bg) */}
                <div className="flex items-center gap-2 mb-4">
                  {isSoldOut ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-white/10 bg-transparent text-xs font-normal text-white/90">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                      <span>Sold Out</span>
                    </span>
                  ) : isLowStock ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-white/10 bg-transparent text-xs font-normal text-white/90">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      <span>Only {currentStock} Left in Stock</span>
                    </span>
                  ) : isComingSoon ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-white/10 bg-transparent text-xs font-normal text-white/90">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                      <span>Coming Soon</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-white/10 bg-transparent text-xs font-normal text-white/90">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>In Stock & Ready for Collection</span>
                    </span>
                  )}
                </div>

                {/* Pricing Box (Clean transparent card, official typography) */}
                <div className="bg-transparent border border-theme-border rounded-lg p-3.5 mb-4">
                  <div className="flex items-baseline gap-3">
                    <span className="text-2xl font-semibold text-white tracking-tight">
                      ${effectivePrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    {hasOffer && (
                      <span className="text-sm text-theme-textMuted line-through">
                        ${regularPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    )}
                  </div>
                  {hasOffer && (
                    <p className="text-xs text-theme-textSecondary mt-1">
                      Promotional offer active. Save ${savings.toFixed(2)} with SK LABA.
                    </p>
                  )}
                </div>

                {/* Options: Colours */}
                {colorOptions.length > 0 && (
                  <div className="mb-4">
                    <label className="block text-[11px] font-normal uppercase tracking-wider text-theme-textMuted mb-2">
                      Colour Options ({colorOptions.length})
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {colorOptions.map((c, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedColor(c)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                            selectedColor === c
                              ? 'border-white/20 bg-white/10 text-white shadow-sm'
                              : 'border-theme-border bg-transparent text-theme-textSecondary hover:text-white hover:bg-white/[0.04]'
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Warranty & Accessories (Clean official text boxes, no icons) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs">
                  {phone.warranty && (
                    <div className="bg-transparent p-2.5 rounded-lg border border-theme-border">
                      <span className="text-[11px] text-theme-textMuted uppercase tracking-wider block mb-0.5">
                        Warranty
                      </span>
                      <span className="text-xs text-white font-normal">
                        {phone.warranty}
                      </span>
                    </div>
                  )}

                  <div className="bg-transparent p-2.5 rounded-lg border border-theme-border">
                    <span className="text-[11px] text-theme-textMuted uppercase tracking-wider block mb-0.5">
                      Package
                    </span>
                    <span className="text-xs text-white font-normal">
                      Original Box & Verified Accessories
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons Row (Clean official rectangular buttons, NO icons) */}
              <div className="space-y-2.5 pt-3 border-t border-theme-border">
                {isSoldOut ? (
                  <button
                    type="button"
                    onClick={() => onOpenNotifyBackInStock && onOpenNotifyBackInStock(phone)}
                    className="w-full py-2.5 px-4 rounded-lg bg-transparent hover:bg-white/[0.04] border border-theme-border text-theme-textSecondary hover:text-white font-medium text-xs sm:text-sm transition-all cursor-pointer text-center"
                  >
                    Notify Me When Back in Stock
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      onOpenReserve &&
                      onOpenReserve({
                        ...phone,
                        selectedColor,
                        selectedStorage,
                        effectivePrice,
                      })
                    }
                    className="w-full py-2.5 px-4 rounded-lg bg-white/10 hover:bg-white/15 border border-white/20 text-white font-medium text-xs sm:text-sm shadow-sm transition-all cursor-pointer text-center"
                  >
                    Reserve This Phone
                  </button>
                )}

                {/* Instant Inquiry & Contact Buttons (No icons, clean rectangular styling) */}
                <div className="grid grid-cols-3 gap-2">
                  {/* Send Inquiry */}
                  <button
                    type="button"
                    onClick={() => onOpenInquiry && onOpenInquiry(phone)}
                    className="py-2 px-3 rounded-lg bg-transparent hover:bg-white/[0.04] border border-theme-border text-theme-textSecondary hover:text-white text-xs font-medium transition-colors text-center cursor-pointer"
                  >
                    Inquiry
                  </button>

                  {/* WhatsApp Direct */}
                  <button
                    type="button"
                    onClick={handleWhatsApp}
                    className="py-2 px-3 rounded-lg bg-transparent hover:bg-white/[0.04] border border-theme-border text-theme-textSecondary hover:text-white text-xs font-medium transition-colors text-center cursor-pointer"
                  >
                    WhatsApp
                  </button>

                  {/* Phone Call Direct */}
                  <button
                    type="button"
                    onClick={handleCall}
                    className="py-2 px-3 rounded-lg bg-transparent hover:bg-white/[0.04] border border-theme-border text-theme-textSecondary hover:text-white text-xs font-medium transition-colors text-center cursor-pointer"
                  >
                    Call Shop
                  </button>
                </div>

                {copiedLink && (
                  <p className="text-center text-xs text-theme-textSecondary font-normal animate-in fade-in">
                    Link copied to clipboard
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Description Section (No icons, clean official box) */}
          {phone.description && (
            <div className="bg-transparent rounded-lg p-4 border border-theme-border">
              <h2 className="text-[11px] font-medium uppercase tracking-wider text-theme-textMuted mb-2">
                Description & Overview
              </h2>
              <p className="text-xs sm:text-sm text-theme-textSecondary leading-relaxed whitespace-pre-line font-normal">
                {phone.description}
              </p>
            </div>
          )}

          {/* Installment Plans List (Clean official styling, no icons) */}
          {Boolean(phone.installment_enabled) && (
            <div className="bg-transparent border border-theme-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[11px] font-medium uppercase tracking-wider text-theme-textMuted">
                  Available Instalment Plans
                </h2>
                <span className="text-xs text-theme-textMuted font-normal">
                  Zero or Low Interest
                </span>
              </div>

              {loadingInstallments ? (
                <div className="text-xs text-theme-textMuted py-2 font-normal">
                  Loading flexible instalment plans...
                </div>
              ) : installmentsData?.plans && installmentsData.plans.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-2">
                  {installmentsData.plans.map((plan, idx) => (
                    <div
                      key={plan.installment_plan_id || idx}
                      className="bg-transparent border border-theme-border rounded-lg p-3 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-white">
                            {plan.plan_name}
                          </span>
                          <span className="text-xs font-semibold text-emerald-400">
                            ${plan.monthly_payment}/mo
                          </span>
                        </div>
                        <p className="text-[11px] text-theme-textMuted font-normal">
                          {plan.number_of_months} Months • Total: ${plan.total_payable}
                        </p>
                      </div>
                      {plan.terms && (
                        <p className="text-[10px] text-theme-textSecondary mt-2 pt-2 border-t border-theme-border/50 font-normal">
                          {plan.terms}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-theme-textSecondary font-normal">
                  Instalment payment options available upon store collection or checkout. Contact shop for eligibility.
                </p>
              )}
            </div>
          )}

          {/* Similar Phones Section (No icons, clean official cards) */}
          {similarPhones.length > 0 && (
            <div className="pt-4 border-t border-theme-border">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-medium uppercase tracking-wider text-theme-textMuted">
                  {isSoldOut ? 'Similar Available Phones' : 'Similar Phones'}
                </h2>
                <span className="text-xs text-theme-textMuted font-normal">Same brand or price range</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {similarPhones.map((simPhone) => {
                  const sId = simPhone.phone_id || simPhone.id;
                  let sPhoto = '';
                  if (Array.isArray(simPhone.photos) && simPhone.photos.length > 0) sPhoto = simPhone.photos[0];
                  else if (simPhone.main_photo) sPhoto = simPhone.main_photo;

                  return (
                    <div
                      key={sId}
                      onClick={() => onSelectPhone && onSelectPhone(simPhone)}
                      className="bg-transparent hover:bg-white/[0.03] border border-theme-border hover:border-white/20 rounded-lg p-3 flex flex-col justify-between cursor-pointer transition-colors"
                    >
                      <div className="aspect-[4/3] w-full bg-[#080D1A] rounded p-2 mb-2 flex items-center justify-center">
                        {sPhoto ? (
                          <img
                            src={sPhoto}
                            alt={simPhone.name}
                            className="max-h-full max-w-full object-contain"
                          />
                        ) : (
                          <span className="text-xs text-theme-textMuted">SK LABA</span>
                        )}
                      </div>
                      <div>
                        <h3 className="text-xs font-normal text-white truncate">
                          {simPhone.name}
                        </h3>
                        <p className="text-xs font-medium text-white mt-1">
                          ${Number(simPhone.price || 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
