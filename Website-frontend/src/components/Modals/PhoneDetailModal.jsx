import React, { useState, useEffect } from 'react';
import {
  X,
  Heart,
  Share2,
  ChevronLeft,
  ChevronRight,
  Tag,
  MessageCircle,
  PhoneCall,
  ArrowLeft,
} from 'lucide-react';
import whatsappIcon from '../../assets/icons/whatsappicon.png';
import { useFavoritesAndCompare } from '../../hooks/useFavoritesAndCompare';
import { useShopInfo } from '../../context/ShopInfoContext';
import phoneService from '../../services/phoneService';
import storageService from '../../services/storageService';
import FormattedDescription from '../Common/FormattedDescription';

function SimilarPhoneCard({ simPhone, onSelectPhone }) {
  const generalPhotos = React.useMemo(() => {
    if (Array.isArray(simPhone?.photos) && simPhone.photos.length > 0) return simPhone.photos;
    if (Array.isArray(simPhone?.photo_urls) && simPhone.photo_urls.length > 0) return simPhone.photo_urls;
    if (simPhone?.main_photo) return [simPhone.main_photo];
    if (typeof simPhone?.photos === 'string' && simPhone.photos.trim().startsWith('[')) {
      try {
        return JSON.parse(simPhone.photos);
      } catch (e) {
        return [];
      }
    }
    return [];
  }, [simPhone]);

  const parsedColors = React.useMemo(() => {
    let raw = simPhone?.colour_options;
    if (!raw) return [];
    if (typeof raw === 'string') {
      if (raw.trim().startsWith('[')) {
        try {
          raw = JSON.parse(raw);
        } catch (e) {
          raw = raw.split(',').map((s) => s.trim()).filter(Boolean);
        }
      } else {
        raw = raw.split(',').map((s) => s.trim()).filter(Boolean);
      }
    }
    if (!Array.isArray(raw)) return [];

    return raw.map((c, i) => {
      if (typeof c === 'string') {
        const fallbackPhoto = generalPhotos[i] || generalPhotos[0] || '';
        return {
          id: `color_${i}`,
          name: c,
          color_code: '#475569',
          photos: fallbackPhoto ? [fallbackPhoto] : [],
        };
      }
      return {
        id: `color_${i}`,
        name: c.color_name || c.name || `Color #${i + 1}`,
        color_code: c.color_code || c.color || c.hex || '#475569',
        photos:
          Array.isArray(c.photos) && c.photos.length > 0
            ? c.photos
            : (generalPhotos[i] ? [generalPhotos[i]] : generalPhotos),
      };
    });
  }, [simPhone, generalPhotos]);

  const [selectedColorIdx, setSelectedColorIdx] = useState(0);

  const activeColor = parsedColors[selectedColorIdx] || parsedColors[0];
  const displayedPhoto =
    activeColor?.photos?.[0] ||
    generalPhotos[selectedColorIdx] ||
    generalPhotos[0] ||
    simPhone.main_photo ||
    '';

  return (
    <div
      onClick={() => {
        if (onSelectPhone) onSelectPhone(simPhone);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }}
      className="bg-black hover:bg-neutral-950 rounded-2xl p-3 sm:p-4 flex flex-col justify-between cursor-pointer transition-all duration-300 group shadow-sm hover:scale-[1.01]"
    >
      <div className="relative aspect-[4/5] w-full bg-transparent rounded-xl mb-3 flex items-center justify-center p-2.5 sm:p-3 overflow-hidden">
        {displayedPhoto ? (
          <img
            src={displayedPhoto}
            alt={simPhone.name}
            className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105 drop-shadow-[0_4px_12px_rgba(0,0,0,0.7)]"
          />
        ) : (
          <span className="text-xs text-slate-400">SK LABA</span>
        )}
      </div>

      <div className="text-center space-y-1">
        <h3 className="text-xs sm:text-sm font-normal text-white truncate group-hover:text-slate-200 transition-colors">
          {simPhone.name}
        </h3>
        <p className="text-xs font-normal text-slate-300">
          ${Number(simPhone.price || 0).toLocaleString()}
        </p>

        {/* Small phone color thumbnail boxes just like in reference image */}
        {parsedColors.length > 0 && (
          <div
            className="flex items-center justify-center gap-1.5 pt-2 flex-wrap"
            onClick={(e) => e.stopPropagation()}
          >
            {parsedColors.slice(0, 4).map((color, idx) => {
              const isSelected = selectedColorIdx === idx;
              const colorPhoto =
                color.photos?.[0] ||
                generalPhotos[idx] ||
                generalPhotos[0] ||
                '';

              return (
                <button
                  key={color.id || idx}
                  type="button"
                  title={color.name}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedColorIdx(idx);
                  }}
                  onMouseEnter={() => setSelectedColorIdx(idx)}
                  className={`relative w-6 h-6 sm:w-7 sm:h-7 rounded-lg p-0.5 border overflow-hidden transition-all duration-200 cursor-pointer flex items-center justify-center bg-black/60 ${
                    isSelected
                      ? 'border-white ring-1 ring-white/50 shadow-md scale-105'
                      : 'border-white/15 hover:border-white/40 opacity-70 hover:opacity-100 hover:scale-105'
                  }`}
                >
                  {colorPhoto ? (
                    <img
                      src={colorPhoto}
                      alt={color.name}
                      className="w-full h-full object-cover object-center rounded-[6px]"
                      loading="lazy"
                    />
                  ) : (
                    <span
                      className="w-full h-full rounded-[6px]"
                      style={{ backgroundColor: color.color_code || '#475569' }}
                    />
                  )}
                </button>
              );
            })}
            {parsedColors.length > 4 && (
              <span className="text-[10px] text-slate-400 font-normal pl-0.5 select-none">
                +{parsedColors.length - 4}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PhoneDetailModal({
  phone,
  allPhones = [],
  onClose,
  onOpenReserve,
  onOpenInquiry,
  onOpenSell,
  onOpenNotifyBackInStock,
  onSelectPhone,
}) {
  const { shopInfo, getWhatsAppUrl } = useShopInfo();
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
      } catch (e) { }
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
      .catch(() => { });
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

  const [installmentsData, setInstallmentsData] = useState(null);
  const [loadingInstallments, setLoadingInstallments] = useState(false);

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
        .catch(() => { })
        .finally(() => setLoadingInstallments(false));
    } else {
      setInstallmentsData(null);
    }
  }, [phoneId, phone?.installment_enabled]);

  if (!phone) return null;

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

  const regularPrice = Number(phone.price || phone.regular_price || 0);
  const offerPrice = phone.offer_price || phone.active_offer?.offer_price;
  const hasOffer = Boolean(offerPrice && Number(offerPrice) < regularPrice);
  const effectivePrice = hasOffer ? Number(offerPrice) : regularPrice;
  const savings = hasOffer ? regularPrice - effectivePrice : 0;
  const discountPercent = hasOffer ? Math.round((savings / regularPrice) * 100) : 0;

  const handleWhatsApp = () => {
    const pageUrl = window.location.href;
    const message = `Hello SK LABA PHONE, I am interested in: ${phone.name} ($${effectivePrice.toLocaleString()}).\nView Link: ${pageUrl}`;
    window.open(getWhatsAppUrl(message), '_blank');
  };

  const handleCall = () => {
    window.location.href = `tel:${shopInfo.phone}`;
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const candidateSimilar = allPhones.filter((p) => {
    const pId = p.phone_id || p.id;
    return pId !== phoneId;
  });

  let similarPhones = candidateSimilar
    .filter((p) => {
      const sameBrand = (p.brand_name || '').toLowerCase() === (phone.brand_name || '').toLowerCase();
      const diffPrice = Math.abs(Number(p.price || 0) - regularPrice);
      return sameBrand || diffPrice <= 400;
    })
    .slice(0, 4);

  if (similarPhones.length < 4 && candidateSimilar.length > similarPhones.length) {
    const existingIds = new Set(similarPhones.map((p) => p.phone_id || p.id));
    const extras = candidateSimilar.filter((p) => !existingIds.has(p.phone_id || p.id)).slice(0, 4 - similarPhones.length);
    similarPhones = [...similarPhones, ...extras];
  }

  return (
    <div className="w-full min-h-screen bg-black text-white pt-5 sm:pt-8 pb-16 sm:pb-24 animate-in fade-in duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Header / Breadcrumb Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 bg-black hover:bg-neutral-900 text-white text-xs font-normal transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-sm group"
              title="Back to Smartphones"
            >
              <ArrowLeft className="w-4 h-4 text-white group-hover:-translate-x-0.5 transition-transform" />
              <span>Back to Smartphones</span>
            </button>

            <span className="text-white/30 hidden sm:inline">/</span>

            <div className="flex items-center gap-2">
              <span className="text-xs font-normal uppercase tracking-wider text-slate-300">
                {phone.brand_name || 'Smartphone'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShare}
              className="p-2 rounded-full border border-white/20 bg-black hover:bg-neutral-900 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Share Link & Preview"
            >
              <Share2 className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => toggleFavorite(phoneId)}
              className="p-2 rounded-full border border-white/20 bg-black hover:bg-neutral-900 text-slate-300 transition-colors cursor-pointer"
              title="Save to Favourites"
            >
              <Heart className={`w-4 h-4 ${favorited ? 'text-rose-400 fill-rose-400/80' : 'text-slate-300'}`} />
            </button>
          </div>
        </div>

        {/* Main Grid: Gallery on left, Purchase Info on right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start">
          {/* Photo Gallery Column (Left: lg:col-span-6) */}
          <div className="lg:col-span-6 lg:col-start-1 lg:row-start-1 space-y-4">
            <div className="flex flex-col sm:flex-row gap-3.5 items-stretch">
                {/* Thumbnails */}
                {photos.length > 1 && (
                  <div className="flex sm:flex-col gap-2.5 shrink-0 overflow-x-auto sm:overflow-y-auto max-h-[480px] p-0.5 [scrollbar-width:none]">
                    {photos.map((photoUrl, idx) => {
                      const isPhotoSelected = activePhotoIdx === idx;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setActivePhotoIdx(idx)}
                          className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl p-[1px] shrink-0 transition-all duration-300 cursor-pointer flex items-center justify-center overflow-hidden ${isPhotoSelected
                              ? 'bg-gradient-to-r from-red-600/75 via-blue-600/70 to-blue-700/80 shadow-md scale-105 ring-1 ring-white/10'
                              : 'bg-white/15 hover:bg-gradient-to-r hover:from-red-600/50 hover:via-blue-600/50 hover:to-blue-700/60 opacity-70 hover:opacity-100 hover:scale-102'
                            }`}
                          title={`View photo ${idx + 1}`}
                        >
                          <div className="w-full h-full bg-neutral-950 rounded-[11px] p-1 flex items-center justify-center overflow-hidden">
                            <img
                              src={photoUrl}
                              alt={`${activeColor?.name} photo ${idx + 1}`}
                              className="w-full h-full object-contain"
                            />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Main Image Box */}
                <div className="relative aspect-[4/3] max-h-[360px] sm:max-h-[400px] flex-1 bg-neutral-950 rounded-2xl p-6 sm:p-8 flex items-center justify-center overflow-hidden group">
                  {/* Swap Buttons (< 1 / 2 >) */}
                  {photos.length > 1 && (
                    <div className="absolute top-3.5 right-3.5 z-20 flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20 select-none">
                      <button
                        type="button"
                        onClick={handlePrevPhoto}
                        className="p-0.5 text-white hover:text-slate-300 transition-colors cursor-pointer"
                        title="Previous image"
                        aria-label="Previous image"
                      >
                        <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
                      </button>

                      <span className="text-xs text-white font-mono px-1">
                        {photos.length > 0 ? `${activePhotoIdx + 1} / ${photos.length}` : '1 / 1'}
                      </span>

                      <button
                        type="button"
                        onClick={handleNextPhoto}
                        className="p-0.5 text-white hover:text-slate-300 transition-colors cursor-pointer"
                        title="Next image"
                        aria-label="Next image"
                      >
                        <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                      </button>
                    </div>
                  )}

                  {photos[activePhotoIdx] ? (
                    <img
                      src={photos[activePhotoIdx]}
                      alt={`${phone.name} - ${activeColor?.name}`}
                      className="max-h-[78%] max-w-[78%] object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.7)] transition-all duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <span className="text-xs">SK LABA PHONE</span>
                    </div>
                  )}

                  {/* Offer tag */}
                  {hasOffer && (
                    <div className="absolute top-3.5 left-3.5 z-10 inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-amber-500/40 bg-black/80 backdrop-blur-md text-amber-300 text-xs font-normal tracking-wide shadow-sm">
                      <Tag className="w-3.5 h-3.5 shrink-0" />
                      <span>Save ${savings.toFixed(0)} ({discountPercent}% off)</span>
                    </div>
                  )}
                </div>
              </div>
          </div>

          {/* Right Column: Title, Pricing, Color, Storage, Purchase, Installments */}
          <div className="lg:col-span-6 lg:col-start-7 lg:row-start-1 lg:row-span-2 flex flex-col justify-start space-y-5">
            <div>
              {/* Title & Price on the same line with same font size and wider spacing */}
              <div className="flex flex-wrap items-baseline gap-x-8 sm:gap-x-10 gap-y-2 mb-4">
                <h1 className="text-2xl sm:text-3xl font-normal text-white leading-snug flex flex-wrap items-baseline gap-x-2.5">
                  <span>{phone.name}</span>
                  {selectedStorage && !phone.name?.toLowerCase().includes(selectedStorage.toLowerCase()) && (
                    <span className="text-xl sm:text-2xl text-slate-300 font-normal">{selectedStorage}</span>
                  )}
                </h1>
                <div className="flex items-baseline gap-3">
                  <span className="text-2xl sm:text-3xl font-normal text-white tracking-tight">
                    ${effectivePrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  {hasOffer && (
                    <span className="text-sm sm:text-base text-slate-400 line-through font-normal">
                      ${regularPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  )}
                </div>
              </div>
              {hasOffer && (
                <p className="text-xs text-slate-300 -mt-2 mb-4 font-normal">
                  Promotional offer active. Save ${savings.toFixed(2)} with SK LABA.
                </p>
              )}

              {/* Options: Colours */}
              {parsedColors.length > 0 && (
                <div className="mb-8 sm:mb-9">
                  <div className="flex items-center gap-2.5 text-xs sm:text-sm font-normal uppercase tracking-wider text-slate-400 mb-4">
                    <span>Selected Color:</span>
                    <span className="text-white font-medium capitalize tracking-normal">{activeColor?.name}</span>
                  </div>
                  <div className="flex flex-wrap items-start gap-3 sm:gap-6 md:gap-8 pl-1 sm:pl-2">
                    {parsedColors.map((c, idx) => {
                      const isSelected = selectedColorIdx === idx;
                      const firstPhoto = c.photos?.[0] || generalPhotos[idx] || generalPhotos[0] || '';
                      const colorQty = typeof c.quantity === 'number' ? c.quantity : Number(phone?.current_stock ?? 0);
                      const isColorInStock = colorQty > 0;

                      return (
                        <div
                          key={c.id || idx}
                          onClick={() => handleSelectColor(idx)}
                          className="flex flex-col items-center cursor-pointer group/colorOption w-20 sm:w-24 md:w-28 text-center"
                        >
                          <div
                            className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl p-[1px] transition-all duration-300 flex items-center justify-center ${isSelected
                                ? 'bg-gradient-to-r from-red-600/75 via-blue-600/70 to-blue-700/80 shadow-md shadow-black/80 scale-105 ring-1 ring-white/10'
                                : 'bg-white/15 hover:bg-gradient-to-r hover:from-red-600/50 hover:via-blue-600/50 hover:to-blue-700/60 opacity-80 hover:opacity-100 hover:scale-105'
                              }`}
                          >
                            <div className="w-full h-full rounded-[15px] bg-black p-1 overflow-hidden flex items-center justify-center">
                              {firstPhoto ? (
                                <img
                                  src={firstPhoto}
                                  alt={c.name}
                                  className="w-full h-full object-cover object-center rounded-xl"
                                />
                              ) : (
                                <span
                                  className="w-full h-full rounded-xl"
                                  style={{ backgroundColor: c.color_code || '#4B5563' }}
                                />
                              )}
                            </div>
                          </div>

                          <span
                            className={`text-xs sm:text-[13px] mt-2.5 text-center font-normal w-full truncate leading-tight transition-colors ${isSelected
                                ? 'text-white font-medium'
                                : 'text-slate-300 group-hover/colorOption:text-white'
                              }`}
                            title={c.name}
                          >
                            {c.name}
                          </span>

                          <span className={`text-[11px] font-normal mt-1 text-center leading-none w-full truncate ${isColorInStock ? 'text-slate-400' : 'text-neutral-500'}`}>
                            {isColorInStock ? `${colorQty} in stock` : 'Out of stock'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Options: Storage */}
              {phoneStorageOptions.length > 0 && (
                <div className="mb-8 sm:mb-9">
                  <div className="flex items-center gap-2.5 text-xs sm:text-sm font-normal uppercase tracking-wider text-slate-400 mb-4">
                    <span>Selected Storage:</span>
                    <span className="text-white font-medium tracking-normal">{selectedStorage}</span>
                  </div>
                  <div className="flex flex-wrap items-start gap-3 sm:gap-6 md:gap-8 pl-1 sm:pl-2">
                    {phoneStorageOptions.map((s) => {
                      const isSelected = selectedStorage === s.storage_name;
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
                          className="flex flex-col items-center cursor-pointer group/storageOption w-20 sm:w-24 md:w-28 text-center"
                        >
                          <div
                            className={`w-full max-w-[88px] sm:max-w-[96px] rounded-xl p-[1px] transition-all duration-300 flex items-center justify-center ${isSelected
                                ? 'bg-gradient-to-r from-red-600/75 via-blue-600/70 to-blue-700/80 shadow-md shadow-black/80 scale-105 ring-1 ring-white/10'
                                : 'bg-white/15 hover:bg-gradient-to-r hover:from-red-600/50 hover:via-blue-600/50 hover:to-blue-700/60 opacity-80 hover:opacity-100 hover:scale-105'
                              }`}
                          >
                            <div className={`w-full h-full py-2.5 px-3.5 rounded-[11px] text-center flex items-center justify-center ${isSelected ? 'bg-black/90' : 'bg-black'
                              }`}>
                              <span
                                className={`text-xs sm:text-sm font-normal tracking-wide transition-colors ${isSelected
                                    ? 'text-white font-medium'
                                    : 'text-slate-300 group-hover/storageOption:text-white'
                                  }`}
                              >
                                {s.storage_name}
                              </span>
                            </div>
                          </div>

                          <span className={`text-[11px] font-normal mt-1.5 text-center leading-none w-full truncate ${isStorageInStock ? 'text-slate-400' : 'text-neutral-500'}`}>
                            {isStorageInStock ? `${storageQty} in stock` : 'Out of stock'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Warranty */}
              {phone.warranty && (
                <div className="flex items-center gap-2.5 text-xs sm:text-sm font-normal tracking-wide mb-3 sm:mb-4 pt-1 pl-1">
                  <span className="text-slate-400 uppercase tracking-wider">
                    Warranty:
                  </span>
                  <span className="text-white font-normal pl-1">
                    {phone.warranty}
                  </span>
                </div>
              )}
            </div>

            {/* Action Buttons: Reserve or Notify + Trade In on the same line */}
            <div className="space-y-4 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-stretch">
                {isVariantSoldOut ? (
                  <button
                    type="button"
                    onClick={() =>
                      onOpenNotifyBackInStock &&
                      onOpenNotifyBackInStock({
                        ...phone,
                        color_name: selectedColor,
                        storage_name: selectedStorage,
                      })
                    }
                    className="relative inline-flex items-center justify-center p-[1px] rounded-full bg-gradient-to-r from-red-950/80 via-zinc-600/70 to-blue-950/80 hover:from-red-900/80 hover:via-zinc-500 hover:to-blue-900/80 transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] shadow-md shadow-black/50 group cursor-pointer"
                  >
                    <span className="w-full h-full py-3 px-4 rounded-full bg-black group-hover:bg-neutral-950 text-slate-300 group-hover:text-white font-normal text-xs sm:text-sm transition-colors text-center truncate flex items-center justify-center">
                      Notify When Available
                    </span>
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
                    className="relative inline-flex items-center justify-center p-[1px] rounded-full bg-gradient-to-r from-red-950/80 via-zinc-600/70 to-blue-950/80 hover:from-red-900/80 hover:via-zinc-500 hover:to-blue-900/80 transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] shadow-md shadow-black/50 group cursor-pointer"
                    title={`Reserve (${selectedColor} · ${selectedStorage})`}
                  >
                    <span className="w-full h-full py-3 px-4 rounded-full bg-black group-hover:bg-neutral-950 text-white font-normal text-xs sm:text-sm transition-colors text-center truncate flex items-center justify-center">
                      <span className="truncate">Reserve ({selectedColor} · {selectedStorage})</span>
                    </span>
                  </button>
                )}

                {/* Trade In Button on the same line with rounded-full, black background, and dark gray stroke */}
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenSell) {
                      onOpenSell(phone);
                    } else {
                      window.dispatchEvent(new CustomEvent('sk_laba_open_sell_modal', { detail: { desiredPhone: phone } }));
                    }
                  }}
                  className="w-full py-3 px-4 rounded-full bg-black hover:bg-neutral-950 border border-neutral-700 hover:border-neutral-500 text-white text-xs sm:text-sm font-normal transition-all text-center cursor-pointer flex items-center justify-center truncate hover:scale-[1.01] active:scale-[0.99] shadow-md shadow-black/50"
                  title="Trade-In Your Current Phone for This Device"
                >
                  <span className="truncate">Trade-In Your Current Phone</span>
                </button>
              </div>

              {/* Quick Contact: WhatsApp, Call Shop */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-slate-300 uppercase tracking-wider font-normal">
                  Quick Contact:
                </span>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleWhatsApp}
                    className="w-9 h-9 rounded-full bg-black hover:bg-neutral-900 border border-white/20 text-white flex items-center justify-center transition-all cursor-pointer shadow-sm hover:scale-105 overflow-hidden p-1.5"
                    title="WhatsApp"
                    aria-label="WhatsApp"
                  >
                    <img src={whatsappIcon} alt="WhatsApp" className="w-full h-full object-contain" />
                  </button>

                  <button
                    type="button"
                    onClick={handleCall}
                    className="w-9 h-9 rounded-full bg-black hover:bg-neutral-900 border border-white/20 text-white flex items-center justify-center transition-all cursor-pointer shadow-sm hover:scale-105"
                    title="Call Shop Direct"
                    aria-label="Call Shop Direct"
                  >
                    <PhoneCall className="w-4 h-4 text-slate-200" />
                  </button>
                </div>
              </div>

              {copiedLink && (
                <p className="text-center text-xs text-white font-normal animate-in fade-in">
                  Link copied to clipboard
                </p>
              )}

              {/* Available Instalment Plans */}
              {Boolean(phone.installment_enabled) && (
                <div className="bg-black rounded-2xl p-4 mt-4">
                  <div className="mb-2.5">
                    <h2 className="text-xs font-normal uppercase tracking-wider text-slate-300">
                      Available Instalment Plans
                    </h2>
                  </div>

                  {loadingInstallments ? (
                    <div className="text-xs text-slate-300 py-1 font-normal">
                      Loading flexible instalment plans...
                    </div>
                  ) : installmentsData?.plans && installmentsData.plans.length > 0 ? (
                    <div className="grid grid-cols-1 gap-2.5 mt-1">
                      {installmentsData.plans.map((plan, pIdx) => (
                        <div
                          key={pIdx}
                          className="p-3 rounded-xl bg-neutral-950 flex flex-col justify-between"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-normal text-white truncate">
                              {plan.provider_name || 'Instalment Plan'}
                            </span>
                            <span className="text-xs font-normal text-white shrink-0">
                              ${plan.monthly_payment}/mo
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-300 font-normal mt-0.5">
                            {plan.number_of_months} Months • Total: ${plan.total_payable}
                          </p>
                          {plan.terms && (
                            <p className="text-[11px] text-slate-400 mt-1.5 pt-1.5 border-t border-white/5 font-normal leading-relaxed break-words whitespace-normal">
                              {plan.terms}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-300 font-normal">
                      Instalment payment options available upon store collection or checkout.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Description & Overview Section */}
          {phone.description && (
            <div className="lg:col-span-6 lg:col-start-1 lg:row-start-2 bg-black rounded-2xl p-4 sm:p-5">
              <h2 className="text-xs font-normal uppercase tracking-wider text-slate-300 mb-2.5">
                Description &amp; Overview
              </h2>
              <FormattedDescription content={phone.description} isDark={true} className="text-slate-200 font-normal leading-relaxed text-xs sm:text-sm" />
            </div>
          )}
        </div>

        {/* Similar Phones Section at the bottom */}
        {similarPhones.length > 0 && (
          <div className="pt-10 mt-10 pb-12 sm:pb-16 border-t border-white/10">
            <div className="mb-5 sm:mb-6">
              <h2 className="text-sm sm:text-base font-normal uppercase tracking-wider text-white">
                {isSoldOut ? 'Similar Available Phones' : 'Similar Phones'}
              </h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3.5 md:gap-4">
              {similarPhones.map((simPhone) => (
                <SimilarPhoneCard
                  key={simPhone.phone_id || simPhone.id}
                  simPhone={simPhone}
                  onSelectPhone={onSelectPhone}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
