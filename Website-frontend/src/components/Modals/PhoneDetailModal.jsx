import React, { useState, useEffect } from 'react';
import {
  X,
  Heart,
  GitCompare,
  Share2,
  ChevronLeft,
  ChevronRight,
  Tag,
  ShoppingCart,
  HelpCircle,
  MessageCircle,
  PhoneCall,
} from 'lucide-react';
import { useFavoritesAndCompare } from '../../hooks/useFavoritesAndCompare';
import { STORE_INFO } from '../../constants/siteConfig';
import phoneService from '../../services/phoneService';
import storageService from '../../services/storageService';
import useCart from '../../hooks/useCart';
import FormattedDescription from '../Common/FormattedDescription';

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

  // Fallback general photos from phone record
  const generalPhotos = React.useMemo(() => {
    if (Array.isArray(phone?.photos) && phone.photos.length > 0) return phone.photos;
    if (phone?.main_photo) return [phone.main_photo];
    if (typeof phone?.photos === 'string' && phone.photos.trim().startsWith('[')) {
      try {
        const parsed = JSON.parse(phone.photos);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return [];
  }, [phone]);

  // Parse color options with per-color photos (Fallback gracefully for legacy string arrays)
  const parsedColors = React.useMemo(() => {
    let raw = phone?.colour_options;
    if (typeof raw === 'string') {
      try {
        raw = JSON.parse(raw);
      } catch (e) {
        raw = raw.split(',').map((c) => c.trim()).filter(Boolean);
      }
    }

    if (!Array.isArray(raw) || raw.length === 0) {
      return [
        {
          id: 'default',
          name: 'Standard',
          color_name: 'Standard',
          color_code: '#3B82F6',
          photos: generalPhotos,
          quantity: Number(phone?.current_stock ?? phone?.stock ?? 0),
        },
      ];
    }

    return raw.map((c, i) => {
      if (typeof c === 'string') {
        const fallbackPhoto = generalPhotos[i] || generalPhotos[0] || '';
        return {
          id: `color_${i}`,
          name: c,
          color_name: c,
          color_code: '#374151',
          photos: fallbackPhoto ? [fallbackPhoto] : [],
          quantity: i === 0 ? Number(phone?.current_stock ?? phone?.stock ?? 0) : 0,
        };
      }
      return {
        id: `color_${i}`,
        name: c.color_name || c.name || `Color #${i + 1}`,
        color_name: c.color_name || c.name || `Color #${i + 1}`,
        color_code: c.color_code || c.color || c.hex || '#374151',
        quantity:
          typeof c.quantity === 'number'
            ? c.quantity
            : i === 0
            ? Number(phone?.current_stock ?? phone?.stock ?? 0)
            : 0,
        storage_quantities: c.storage_quantities || {},
        photos:
          Array.isArray(c.photos) && c.photos.length > 0
            ? c.photos
            : (generalPhotos[i] ? [generalPhotos[i]] : generalPhotos),
      };
    });
  }, [phone, generalPhotos]);

  // Auto-select the first added color by default (index 0 or initialColorIdx)
  const [selectedColorIdx, setSelectedColorIdx] = useState(
    typeof phone.initialColorIdx === 'number' ? phone.initialColorIdx : 0
  );
  const activeColor = parsedColors[selectedColorIdx] || parsedColors[0];
  const photos = activeColor?.photos || [];

  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  // Reset to initial color and first photo when phone changes
  useEffect(() => {
    setSelectedColorIdx(
      typeof phone.initialColorIdx === 'number' ? phone.initialColorIdx : 0
    );
    setActivePhotoIdx(0);
  }, [phoneId, phone.initialColorIdx]);

  // Handle color change: updates color and loads that color's photos
  const handleSelectColor = (idx) => {
    setSelectedColorIdx(idx);
    setActivePhotoIdx(0);
  };

  const selectedColor = activeColor?.name || 'Default';

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

  // Load system storage options as a fallback dictionary
  const [systemStorages, setSystemStorages] = useState([]);

  useEffect(() => {
    storageService
      .getStorageOptions()
      .then((res) => {
        const data = res.data?.data || res.data || [];
        setSystemStorages(Array.isArray(data) ? data : []);
      })
      .catch(() => {});
  }, []);

  // Storage options
  const phoneStorageOptions = React.useMemo(() => {
    if (Array.isArray(phone?.storage_options) && phone.storage_options.length > 0) {
      return phone.storage_options;
    }
    if (Array.isArray(phone?.storage_names) && phone.storage_names.length > 0) {
      return phone.storage_names.map((name, i) => ({
        storage_id: i + 1,
        storage_name: name,
      }));
    }
    if (Array.isArray(phone?.storage_ids) && phone.storage_ids.length > 0) {
      return phone.storage_ids.map((id) => {
        const matched = systemStorages.find((s) => Number(s.storage_id) === Number(id));
        return {
          storage_id: id,
          storage_name: matched ? matched.storage_name : (typeof id === 'string' && id.includes('GB') ? id : 'Standard'),
        };
      });
    }
    return [{ storage_id: 'default', storage_name: 'Standard' }];
  }, [phone, systemStorages]);

  const [selectedStorage, setSelectedStorage] = useState(
    phoneStorageOptions[0]?.storage_name || 'Standard'
  );

  useEffect(() => {
    if (phoneStorageOptions.length > 0) {
      setSelectedStorage(phoneStorageOptions[0].storage_name);
    }
  }, [phoneStorageOptions]);

  // Installments state
  const [installmentsData, setInstallmentsData] = useState(null);
  const [loadingInstallments, setLoadingInstallments] = useState(false);

  // Share feedback state
  const [copiedLink, setCopiedLink] = useState(false);
  const { addToCart } = useCart();
  const [addedToCart, setAddedToCart] = useState(false);

  const handleAddToCart = () => {
    if (isVariantSoldOut) return;
    addToCart({
      phone_id: phoneId,
      name: phone.name,
      brand_name: phone.brand_name,
      color: selectedColor,
      storage: selectedStorage,
      price: effectivePrice,
      photo: photos[activePhotoIdx] || photos[0] || phone.main_photo || '',
      quantity: 1,
    });
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };


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
  const activeColorQty = typeof activeColor?.quantity === 'number' ? activeColor.quantity : currentStock;

  // Selected variant stock (Color + Storage)
  let variantStock = activeColorQty;
  if (activeColor?.storage_quantities && typeof activeColor.storage_quantities[selectedStorage] === 'number') {
    variantStock = activeColor.storage_quantities[selectedStorage];
  } else if (phoneStorageOptions.length === 1 && typeof activeColor?.quantity === 'number') {
    variantStock = activeColor.quantity;
  }
  const isVariantSoldOut = isSoldOut || (availability !== 'COMING_SOON' && variantStock === 0);
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
              className="p-1.5 rounded-lg border border-theme-border bg-transparent hover:bg-white/[0.04] text-theme-textSecondary transition-colors cursor-pointer"
              title="Save to Favourites"
            >
              <Heart className={`w-3.5 h-3.5 ${favorited ? 'text-rose-400 fill-rose-400/80' : ''}`} />
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
          {/* Main Grid: Gallery with Colors on left, Primary Purchase Info on right */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Photo Gallery Column with Selected Color's Uploaded Photos on the Left */}
            <div className="flex flex-col gap-2.5">
              <div className="flex flex-col sm:flex-row gap-3 items-stretch">
                {/* ── LEFT OF IMAGE: 1 to 3 UPLOADED PHOTOS FOR CURRENT COLOR ── */}
                {photos.length > 0 && (
                  <div className="flex sm:flex-col gap-2 shrink-0 overflow-x-auto sm:overflow-y-auto max-h-[380px] p-0.5 [scrollbar-width:none]">
                    {photos.map((photoUrl, idx) => {
                      const isPhotoSelected = activePhotoIdx === idx;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setActivePhotoIdx(idx)}
                          className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl border p-1 bg-[#080D1A] shrink-0 transition-all cursor-pointer flex items-center justify-center overflow-hidden ${
                            isPhotoSelected
                              ? 'border-white ring-2 ring-white/30 shadow-md scale-105'
                              : 'border-white/15 hover:border-white/40 opacity-70 hover:opacity-100 hover:scale-102'
                          }`}
                          title={`View photo ${idx + 1}`}
                        >
                          <img
                            src={photoUrl}
                            alt={`${activeColor?.name} photo ${idx + 1}`}
                            className="w-full h-full object-contain"
                          />
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* ── MAIN IMAGE BOX ── */}
                <div className="relative aspect-[4/3] sm:aspect-square flex-1 bg-[#080D1A] rounded-xl border border-theme-border p-4 flex items-center justify-center overflow-hidden group">
                  {/* Top Two Swap Buttons (< 1 / 2 >) - Black text/arrows directly on the image with no dark blur */}
                  {photos.length > 1 && (
                    <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1 bg-transparent px-1.5 py-0.5 select-none">
                      <button
                        type="button"
                        onClick={handlePrevPhoto}
                        className="p-0.5 text-black hover:opacity-60 transition-opacity cursor-pointer"
                        title="Previous image"
                        aria-label="Previous image"
                      >
                        <ChevronLeft className="w-4 h-4 text-black stroke-[2.5]" />
                      </button>

                      <span className="text-xs text-black font-semibold font-mono px-0.5 tracking-wider">
                        {photos.length > 0 ? `${activePhotoIdx + 1} / ${photos.length}` : '1 / 1'}
                      </span>

                      <button
                        type="button"
                        onClick={handleNextPhoto}
                        className="p-0.5 text-black hover:opacity-60 transition-opacity cursor-pointer"
                        title="Next image"
                        aria-label="Next image"
                      >
                        <ChevronRight className="w-4 h-4 text-black stroke-[2.5]" />
                      </button>
                    </div>
                  )}

                  {photos[activePhotoIdx] ? (
                    <img
                      src={photos[activePhotoIdx]}
                      alt={`${phone.name} - ${activeColor?.name}`}
                      className="max-h-full max-w-full object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.5)] transition-all duration-300"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-theme-textMuted">
                      <span className="text-xs">SK LABA PHONE</span>
                    </div>
                  )}

                  {/* Offer tag (Light Gold styling) */}
                  {hasOffer && (
                    <div className="absolute top-2.5 left-2.5 z-10 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-amber-300/40 bg-black/65 backdrop-blur-md text-amber-200 text-[10px] font-semibold tracking-wide shadow-sm">
                      <Tag className="w-3 h-3 shrink-0 text-amber-300" />
                      <span>Save ${savings.toFixed(0)} ({discountPercent}% off)</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Description & Overview Section (Placed directly under the phone main image) */}
              {phone.description && (
                <div className="bg-transparent rounded-lg p-3.5 border border-theme-border mt-1">
                  <h2 className="text-[11px] font-medium uppercase tracking-wider text-theme-textMuted mb-2">
                    Description & Overview
                  </h2>
                  <FormattedDescription content={phone.description} isDark={true} className="text-theme-textSecondary font-normal" />
                </div>
              )}
            </div>

            {/* Product Details & Actions */}
            <div className="flex flex-col justify-between h-full space-y-5">
              <div>
                <h1 className="text-xl sm:text-2xl font-normal text-white leading-tight mb-3">
                  {phone.name}
                </h1>

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

                {/* Options: Colours (First image of each color + normal text label under image) */}
                {parsedColors.length > 0 && (
                  <div className="mb-5">
                    <label className="block text-[11px] font-normal uppercase tracking-wider text-theme-textMuted mb-2.5">
                      Selected Color: <span className="text-white font-semibold">{activeColor?.name}</span>
                    </label>
                    <div className="flex flex-wrap items-start gap-4">
                      {parsedColors.map((c, idx) => {
                        const isSelected = selectedColorIdx === idx;
                        const firstPhoto = c.photos?.[0] || generalPhotos[idx] || generalPhotos[0] || '';
                        const colorQty = typeof c.quantity === 'number' ? c.quantity : Number(phone?.current_stock ?? 0);
                        const isColorInStock = colorQty > 0;

                        return (
                          <div
                            key={c.id || idx}
                            onClick={() => handleSelectColor(idx)}
                            className="flex flex-col items-center cursor-pointer group/colorOption"
                          >
                            {/* Color Image Card (Matches phone card with active indicator) */}
                            <div
                              className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl p-0.5 border overflow-hidden transition-all duration-200 flex items-center justify-center bg-black/40 ${
                                isSelected
                                  ? 'border-white ring-2 ring-white/40 shadow-lg shadow-black/60 scale-105'
                                  : 'border-white/15 hover:border-white/40 opacity-75 hover:opacity-100 hover:scale-105'
                              }`}
                            >
                              {firstPhoto ? (
                                <img
                                  src={firstPhoto}
                                  alt={c.name}
                                  className="w-full h-full object-cover object-center rounded-lg"
                                />
                              ) : (
                                <span
                                  className="w-full h-full rounded-lg"
                                  style={{ backgroundColor: c.color_code || '#4B5563' }}
                                />
                              )}
                            </div>

                            {/* Normal text label under the color image (no box!) */}
                            <span
                              className={`text-[11px] sm:text-xs mt-1.5 text-center font-normal max-w-[80px] truncate leading-tight transition-colors ${
                                isSelected
                                  ? 'text-white font-medium'
                                  : 'text-theme-textSecondary group-hover/colorOption:text-white'
                              }`}
                            >
                              {c.name}
                            </span>

                            {/* Available stock quantity according to color (White text for both) */}
                            <span className="text-[10px] font-medium mt-0.5 text-center leading-none text-white/80">
                              {isColorInStock ? `${colorQty} in stock` : 'Out of stock'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Options: Storage (Selectable storage cards with available stock under each in white text) */}
                {phoneStorageOptions.length > 0 && (
                  <div className="mb-5">
                    <label className="block text-[11px] font-normal uppercase tracking-wider text-theme-textMuted mb-2.5">
                      Selected Storage: <span className="text-white font-semibold">{selectedStorage}</span>
                    </label>
                    <div className="flex flex-wrap items-start gap-3">
                      {phoneStorageOptions.map((s) => {
                        const isSelected = selectedStorage === s.storage_name;
                        // Calculate stock for this storage option
                        let storageQty = 0;
                        if (
                          activeColor?.storage_quantities &&
                          typeof activeColor.storage_quantities[s.storage_name] === 'number'
                        ) {
                          storageQty = activeColor.storage_quantities[s.storage_name];
                        } else if (phoneStorageOptions.length === 1 && typeof activeColor?.quantity === 'number') {
                          storageQty = activeColor.quantity;
                        } else {
                          storageQty = typeof activeColor?.quantity === 'number'
                            ? activeColor.quantity
                            : Number(phone.current_stock ?? 0);
                        }
                        const isStorageInStock = storageQty > 0;

                        return (
                          <div
                            key={s.storage_id || s.storage_name}
                            onClick={() => setSelectedStorage(s.storage_name)}
                            className="flex flex-col items-center cursor-pointer group/storageOption"
                          >
                            {/* Storage Box Card */}
                            <div
                              className={`px-4 py-2 min-w-[70px] rounded-xl border text-center transition-all duration-200 flex items-center justify-center bg-black/40 ${
                                isSelected
                                  ? 'border-white ring-2 ring-white/40 shadow-lg shadow-black/60 scale-105 bg-white/10'
                                  : 'border-white/15 hover:border-white/40 opacity-75 hover:opacity-100 hover:scale-105'
                              }`}
                            >
                              <span
                                className={`text-xs sm:text-sm font-semibold tracking-wide ${
                                  isSelected
                                    ? 'text-white'
                                    : 'text-theme-textSecondary group-hover/storageOption:text-white'
                                }`}
                              >
                                {s.storage_name}
                              </span>
                            </div>

                            {/* Available stock quantity according to storage (White text for both) */}
                            <span className="text-[10px] font-medium mt-1 text-center leading-none text-white/80">
                              {isStorageInStock ? `${storageQty} in stock` : 'Out of stock'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Warranty (Clean official line, NO border box, NO package box) */}
                {phone.warranty && (
                  <div className="pt-2 text-xs flex items-center gap-2">
                    <span className="text-[11px] text-theme-textMuted uppercase tracking-wider font-medium">
                      Warranty:
                    </span>
                    <span className="text-xs text-white font-normal">
                      {phone.warranty}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons Row: Reserve & Add to Cart in 1 line */}
              <div className="space-y-3 pt-3 border-t border-theme-border">
                <div className="grid grid-cols-2 gap-2.5">
                  {/* Button 1: Reserve or Notify */}
                  {isVariantSoldOut ? (
                    <button
                      type="button"
                      onClick={() => onOpenNotifyBackInStock && onOpenNotifyBackInStock({ ...phone, color_name: selectedColor, storage_name: selectedStorage })}
                      className="w-full py-2.5 px-3 rounded-lg bg-transparent hover:bg-white/[0.04] border border-theme-border text-theme-textSecondary hover:text-white font-medium text-xs transition-all cursor-pointer text-center truncate"
                      title={`Notify Me When ${selectedColor} (${selectedStorage}) is Back in Stock`}
                    >
                      Notify When Available
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
                      className="w-full py-2.5 px-3 rounded-lg bg-white/10 hover:bg-white/15 border border-white/20 text-white font-medium text-xs shadow-sm transition-all cursor-pointer text-center truncate"
                      title={`Reserve This Phone (${selectedColor} · ${selectedStorage})`}
                    >
                      Reserve ({selectedColor} · {selectedStorage})
                    </button>
                  )}

                  {/* Button 2: Add to Cart */}
                  <button
                    type="button"
                    disabled={isVariantSoldOut}
                    onClick={handleAddToCart}
                    className={`w-full py-2.5 px-3 rounded-lg font-medium text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm truncate ${
                      isVariantSoldOut
                        ? 'bg-white/5 border border-white/10 text-theme-textMuted cursor-not-allowed opacity-50'
                        : 'bg-white/10 hover:bg-white/15 border border-white/20 text-white hover:shadow-sm'
                    }`}
                  >
                    <ShoppingCart className="w-3.5 h-3.5 shrink-0" />
                    <span>{addedToCart ? 'Added Successfully ✓' : 'Add to Cart'}</span>
                  </button>
                </div>

                {/* 3 Circular Action Buttons: Inquiry, WhatsApp, Call Shop */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-theme-textMuted uppercase tracking-wider">
                    Quick Contact:
                  </span>
                  <div className="flex items-center gap-2.5">
                    {/* Inquiry Circle Button */}
                    <button
                      type="button"
                      onClick={() => onOpenInquiry && onOpenInquiry(phone)}
                      className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/15 border border-white/20 text-white flex items-center justify-center transition-all cursor-pointer shadow-sm hover:scale-105"
                      title="Send Customer Inquiry"
                      aria-label="Send Customer Inquiry"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                    </button>

                    {/* WhatsApp Circle Button */}
                    <button
                      type="button"
                      onClick={handleWhatsApp}
                      className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/15 border border-white/20 text-white flex items-center justify-center transition-all cursor-pointer shadow-sm hover:scale-105"
                      title="WhatsApp Direct"
                      aria-label="WhatsApp Direct"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                    </button>

                    {/* Call Shop Circle Button */}
                    <button
                      type="button"
                      onClick={handleCall}
                      className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/15 border border-white/20 text-white flex items-center justify-center transition-all cursor-pointer shadow-sm hover:scale-105"
                      title="Call Shop Direct"
                      aria-label="Call Shop Direct"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {copiedLink && (
                  <p className="text-center text-xs text-theme-textSecondary font-normal animate-in fade-in">
                    Link copied to clipboard
                  </p>
                )}

                {/* Available Instalment Plans (Placed directly under the 3 circular contact buttons) */}
                {Boolean(phone.installment_enabled) && (
                  <div className="bg-transparent border border-theme-border rounded-lg p-3 mt-3">
                    <div className="mb-2">
                      <h2 className="text-[11px] font-medium uppercase tracking-wider text-theme-textMuted">
                        Available Instalment Plans
                      </h2>
                    </div>

                    {loadingInstallments ? (
                      <div className="text-xs text-theme-textMuted py-1 font-normal">
                        Loading flexible instalment plans...
                      </div>
                    ) : installmentsData?.plans && installmentsData.plans.length > 0 ? (
                      <div className="grid grid-cols-1 gap-2 mt-1">
                        {installmentsData.plans.map((plan, idx) => (
                          <div
                            key={plan.installment_plan_id || idx}
                            className="bg-transparent border border-theme-border rounded-lg p-2.5 flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex items-baseline justify-between gap-2 mb-1">
                                <span className="text-xs font-semibold text-white break-words">
                                  {plan.plan_name}
                                </span>
                                <span className="text-xs font-semibold text-white shrink-0">
                                  ${plan.monthly_payment}/mo
                                </span>
                              </div>
                              <p className="text-[11px] text-theme-textMuted font-normal">
                                {plan.number_of_months} Months • Total: ${plan.total_payable}
                              </p>
                            </div>
                            {plan.terms && (
                              <p className="text-[11px] text-theme-textSecondary mt-1.5 pt-1.5 border-t border-theme-border/50 font-normal leading-relaxed break-words whitespace-normal">
                                {plan.terms}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-theme-textSecondary font-normal">
                        Instalment payment options available upon store collection or checkout.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Similar Phones Section (No icons, clean official cards) */}
          {similarPhones.length > 0 && (
            <div className="pt-4 border-t border-theme-border">
              <div className="mb-3">
                <h2 className="text-xs font-medium uppercase tracking-wider text-theme-textMuted">
                  {isSoldOut ? 'Similar Available Phones' : 'Similar Phones'}
                </h2>
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
