import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Share2,
  Tag,
  Smartphone,
  Edit2,
  Check,
  Shield,
  CreditCard,
  HardDrive,
  Palette,
} from 'lucide-react';
import FormattedDescription from '../Common/FormattedDescription';
import InstallmentPlanService from '../../services/installmentPlanService';

function SimilarPhoneCard({ simPhone, onSelectPhone }) {
  const generalPhotos = useMemo(() => {
    if (Array.isArray(simPhone?.photos) && simPhone.photos.length > 0) return simPhone.photos;
    if (Array.isArray(simPhone?.photo_urls) && simPhone.photo_urls.length > 0) return simPhone.photo_urls;
    if (simPhone?.main_photo) return [simPhone.main_photo];
    if (typeof simPhone?.photos === 'string' && simPhone.photos.trim().startsWith('[')) {
      try {
        return JSON.parse(simPhone.photos);
      } catch {
        return [];
      }
    }
    return [];
  }, [simPhone]);

  const parsedColors = useMemo(() => {
    let raw = simPhone?.colour_options;
    if (!raw) return [];
    if (typeof raw === 'string') {
      if (raw.trim().startsWith('[')) {
        try {
          raw = JSON.parse(raw);
        } catch {
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
      className="bg-white dark:bg-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl p-4 flex flex-col justify-between cursor-pointer transition-all duration-200 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-md group"
    >
      <div className="relative aspect-[4/5] w-full bg-slate-50 dark:bg-slate-900 rounded-xl mb-3 flex items-center justify-center p-3 overflow-hidden">
        {displayedPhoto ? (
          <img
            src={displayedPhoto}
            alt={simPhone.name}
            className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105 drop-shadow-sm"
          />
        ) : (
          <Smartphone className="w-10 h-10 text-slate-300 stroke-[1.2]" />
        )}
      </div>

      <div className="flex flex-col flex-1 justify-between">
        <div>
          <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 dark:text-slate-500 block truncate">
            {simPhone.brand_name || 'Brand'}
          </span>
          <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors mt-0.5">
            {simPhone.name}
          </h3>
          <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 block mt-1">
            ${Number(simPhone.price || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        {parsedColors.length > 0 && (
          <div className="flex items-center gap-1.5 pt-2 mt-2 border-t border-slate-100 dark:border-slate-800">
            {parsedColors.slice(0, 4).map((color, cIdx) => (
              <span
                key={color.id || cIdx}
                className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0"
                style={{ backgroundColor: color.color_code || '#475569' }}
              />
            ))}
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

export default function PhoneCustomerViewModal({
  isOpen,
  phone,
  allPhones = [],
  onClose,
  onEdit,
  onSelectPhone,
}) {
  if (!isOpen || !phone) return null;

  const phoneId = phone?.phone_id || phone?.id;

  // Fallback general photos from phone record
  const generalPhotos = useMemo(() => {
    if (Array.isArray(phone?.photos) && phone.photos.length > 0) return phone.photos;
    if (phone?.main_photo) return [phone.main_photo];
    if (typeof phone?.photos === 'string' && phone.photos.trim().startsWith('[')) {
      try {
        const parsed = JSON.parse(phone.photos);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    return [];
  }, [phone]);

  // Parse color options with per-color photos
  const parsedColors = useMemo(() => {
    let raw = phone?.colour_options;
    if (typeof raw === 'string') {
      try {
        raw = JSON.parse(raw);
      } catch {
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
          quantity: Number(phone?.current_stock ?? phone?.stock_quantity ?? 0),
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
          quantity: i === 0 ? Number(phone?.current_stock ?? phone?.stock_quantity ?? 0) : 0,
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
            ? Number(phone?.current_stock ?? phone?.stock_quantity ?? 0)
            : 0,
        storage_quantities: c.storage_quantities || {},
        photos:
          Array.isArray(c.photos) && c.photos.length > 0
            ? c.photos
            : (generalPhotos[i] ? [generalPhotos[i]] : generalPhotos),
      };
    });
  }, [phone, generalPhotos]);

  const [selectedColorIdx, setSelectedColorIdx] = useState(0);
  const activeColor = parsedColors[selectedColorIdx] || parsedColors[0];
  const photos = activeColor?.photos || generalPhotos || [];

  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  useEffect(() => {
    setSelectedColorIdx(0);
    setActivePhotoIdx(0);
  }, [phoneId]);

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

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose && onClose();
      if (e.key === 'ArrowLeft') handlePrevPhoto();
      if (e.key === 'ArrowRight') handleNextPhoto();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [photos.length]);

  // Storage Options
  const phoneStorageOptions = useMemo(() => {
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
      return phone.storage_ids.map((id) => ({
        storage_id: id,
        storage_name: typeof id === 'string' && id.includes('GB') ? id : `${id}GB`,
      }));
    }
    return [{ storage_id: 'default', storage_name: 'Standard' }];
  }, [phone]);

  const [selectedStorage, setSelectedStorage] = useState(
    phoneStorageOptions[0]?.storage_name || 'Standard'
  );

  useEffect(() => {
    if (phoneStorageOptions.length > 0) {
      setSelectedStorage(phoneStorageOptions[0].storage_name);
    }
  }, [phoneStorageOptions]);

  // Installment plans calculation
  const [availablePlans, setAvailablePlans] = useState([]);
  const [loadingInstallments, setLoadingInstallments] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (phone?.installment_enabled) {
      setLoadingInstallments(true);
      InstallmentPlanService.getPlans({ is_active: true })
        .then((res) => {
          const data = res.data?.data || res.data || [];
          let plans = Array.isArray(data) ? data : [];
          // Filter if phone has specific allowed installment_plan_ids
          if (Array.isArray(phone.installment_plan_ids) && phone.installment_plan_ids.length > 0) {
            plans = plans.filter((p) => phone.installment_plan_ids.includes(p.installment_plan_id));
          }
          setAvailablePlans(plans);
        })
        .catch(() => {})
        .finally(() => setLoadingInstallments(false));
    } else {
      setAvailablePlans([]);
    }
  }, [phoneId, phone?.installment_enabled]);

  const regularPrice = Number(phone.price || phone.regular_price || 0);
  const offerPrice = phone.offer_price || phone.active_offer?.offer_price;
  const hasOffer = Boolean(offerPrice && Number(offerPrice) < regularPrice);
  const effectivePrice = hasOffer ? Number(offerPrice) : regularPrice;
  const savings = hasOffer ? regularPrice - effectivePrice : 0;
  const discountPercent = hasOffer ? Math.round((savings / regularPrice) * 100) : 0;

  const currentStock = Number(phone.current_stock ?? phone.stock_quantity ?? 0);
  const isSoldOut = phone.availability === 'SOLD_OUT' || currentStock === 0;

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  // Similar phones
  const candidateSimilar = (allPhones || []).filter((p) => {
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
    const extras = candidateSimilar
      .filter((p) => !existingIds.has(p.phone_id || p.id))
      .slice(0, 4 - similarPhones.length);
    similarPhones = [...similarPhones, ...extras];
  }

  return (
    <div className="fixed top-16 left-0 lg:left-64 right-0 bottom-0 z-30 bg-[#F8FAFC] dark:bg-slate-950 overflow-y-auto animate-in fade-in duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20">
        
        {/* Top Header / Breadcrumb Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium transition-all shadow-2xs hover:scale-[1.01] active:scale-[0.99] cursor-pointer group"
              title="Back to Smartphones Inventory"
            >
              <ArrowLeft className="w-4 h-4 text-slate-500 dark:text-slate-400 group-hover:-translate-x-0.5 transition-transform" />
              <span>Back to Inventory</span>
            </button>

            <span className="text-slate-300 dark:text-slate-600 hidden sm:inline">/</span>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                {phone.brand_name || 'Smartphone'}
              </span>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <span className="px-2.5 py-0.5 text-[10px] font-medium uppercase rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {phone.phone_condition || 'NEW'}
              </span>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
                SKLABA_Phone_{phone.phone_id}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(phone)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-neutral-800 bg-gradient-to-r from-black via-neutral-900 to-rose-950 hover:from-neutral-900 hover:to-rose-900 text-white text-xs font-medium transition-colors cursor-pointer shadow-2xs"
                title="Edit this phone"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Phone</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleShare}
              className="p-2 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 transition-colors cursor-pointer shadow-2xs"
              title="Copy page link"
            >
              <Share2 className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 transition-colors cursor-pointer shadow-2xs"
              title="Close view"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main Grid: Gallery on left, Purchase & Admin Info on right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start">
          
          {/* Photo Gallery Column (Left: lg:col-span-6) */}
          <div className="lg:col-span-6 space-y-4">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row gap-3.5 items-stretch">
                
                {/* Thumbnails */}
                {photos.length > 1 && (
                  <div className="flex sm:flex-col gap-2.5 shrink-0 overflow-x-auto sm:overflow-y-auto max-h-[440px] p-0.5 [scrollbar-width:none]">
                    {photos.map((photoUrl, idx) => {
                      const isPhotoSelected = activePhotoIdx === idx;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setActivePhotoIdx(idx)}
                          className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl p-1 shrink-0 transition-all cursor-pointer flex items-center justify-center overflow-hidden border ${
                            isPhotoSelected
                              ? 'border-rose-600 ring-2 ring-rose-500/20 bg-rose-50/40 dark:bg-rose-950/30 shadow-xs'
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
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

                {/* Main Image Box */}
                <div className="relative aspect-[4/3] max-h-[380px] sm:max-h-[420px] flex-1 bg-white dark:bg-slate-850 rounded-2xl p-6 sm:p-8 flex items-center justify-center overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-xs group">
                  {/* Photo Switcher < 1 / 3 > */}
                  {photos.length > 1 && (
                    <div className="absolute top-3.5 right-3.5 z-20 flex items-center gap-1.5 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700 select-none shadow-2xs">
                      <button
                        type="button"
                        onClick={handlePrevPhoto}
                        className="p-0.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                        title="Previous photo"
                      >
                        <ChevronLeft className="w-3.5 h-3.5 stroke-[2.5]" />
                      </button>

                      <span className="text-xs text-slate-700 dark:text-slate-200 font-mono px-1">
                        {photos.length > 0 ? `${activePhotoIdx + 1} / ${photos.length}` : '1 / 1'}
                      </span>

                      <button
                        type="button"
                        onClick={handleNextPhoto}
                        className="p-0.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                        title="Next photo"
                      >
                        <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
                      </button>
                    </div>
                  )}

                  {/* Main Displayed Photo */}
                  {photos[activePhotoIdx] ? (
                    <img
                      src={photos[activePhotoIdx]}
                      alt={`${phone.name} - ${activeColor?.name}`}
                      className="max-h-[82%] max-w-[82%] object-contain drop-shadow-md transition-all duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <Smartphone className="w-12 h-12 stroke-[1.2] mb-1" />
                      <span className="text-xs">No Photo Available</span>
                    </div>
                  )}

                  {/* Offer tag */}
                  {hasOffer && (
                    <div className="absolute top-3.5 left-3.5 z-10 inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-amber-200 dark:border-amber-900 bg-amber-50/90 dark:bg-amber-950/80 backdrop-blur-md text-amber-700 dark:text-amber-300 text-xs font-medium shadow-2xs">
                      <Tag className="w-3.5 h-3.5 shrink-0" />
                      <span>Save ${savings.toFixed(0)} ({discountPercent}% off)</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Description & Overview Section */}
              {phone.description && (
                <div className="bg-white dark:bg-slate-850 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs mt-3">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
                    Description &amp; Overview
                  </h2>
                  <FormattedDescription content={phone.description} className="text-slate-700 dark:text-slate-200 text-xs sm:text-sm leading-relaxed" />
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Title, Pricing, Color, Storage, Stock & Installments */}
          <div className="lg:col-span-6 flex flex-col justify-start space-y-5">
            <div>
              {/* Title & Price on the same line */}
              <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2 mb-4">
                <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-white leading-snug">
                  {phone.name}
                </h1>
                <div className="flex items-baseline gap-3">
                  <span className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight flex items-baseline"><span className="text-rose-600 dark:text-rose-400 font-extrabold mr-0.5">$</span><span>
                    {effectivePrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></span>
                  {hasOffer && (
                    <span className="text-sm sm:text-base text-slate-400 line-through font-normal">
                      ${regularPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  )}
                </div>
              </div>

              {hasOffer && (
                <p className="text-xs text-amber-600 dark:text-amber-400 -mt-2 mb-4 font-medium">
                  Promotional offer active. Save ${savings.toFixed(2)} with SK LABA.
                </p>
              )}

              {/* Color Options */}
              {parsedColors.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center gap-2.5 text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                    <span>Selected Color:</span>
                    <span className="text-slate-900 dark:text-white font-semibold tracking-normal capitalize">{activeColor?.name}</span>
                  </div>
                  <div className="flex flex-wrap items-start gap-4 sm:gap-6">
                    {parsedColors.map((c, idx) => {
                      const isSelected = selectedColorIdx === idx;
                      const firstPhoto = c.photos?.[0] || generalPhotos[idx] || generalPhotos[0] || '';
                      const colorQty = typeof c.quantity === 'number' ? c.quantity : Number(phone.current_stock ?? phone.stock_quantity ?? 0);
                      const isColorInStock = colorQty > 0;

                      return (
                        <div
                          key={c.id || idx}
                          onClick={() => handleSelectColor(idx)}
                          className="flex flex-col items-center cursor-pointer group/colorOption w-20 sm:w-24 text-center"
                        >
                          <div
                            className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl p-1 transition-all flex items-center justify-center border ${
                              isSelected
                                ? 'border-rose-600 ring-2 ring-rose-500/20 bg-rose-50/40 dark:bg-rose-950/30 shadow-xs scale-105'
                                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
                            }`}
                          >
                            {firstPhoto ? (
                              <img
                                src={firstPhoto}
                                alt={c.name}
                                className="w-full h-full object-contain rounded-xl"
                              />
                            ) : (
                              <span
                                className="w-full h-full rounded-xl"
                                style={{ backgroundColor: c.color_code || '#4B5563' }}
                              />
                            )}
                          </div>

                          <span
                            className={`text-xs mt-2 text-center font-medium w-full truncate leading-tight transition-colors ${
                              isSelected
                                ? 'text-rose-600 dark:text-rose-400 font-semibold'
                                : 'text-slate-700 dark:text-slate-300 group-hover/colorOption:text-slate-900 dark:group-hover/colorOption:text-white'
                            }`}
                            title={c.name}
                          >
                            {c.name}
                          </span>

                          <span className={`text-[11px] font-normal mt-0.5 text-center leading-none w-full truncate ${
                            isColorInStock ? 'text-slate-500 dark:text-slate-400' : 'text-amber-600 dark:text-amber-400'
                          }`}>
                            {isColorInStock ? `${colorQty} in stock` : 'Out of stock'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Storage Options */}
              {phoneStorageOptions.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center gap-2.5 text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                    <span>Selected Storage:</span>
                    <span className="text-slate-900 dark:text-white font-semibold tracking-normal">{selectedStorage}</span>
                  </div>
                  <div className="flex flex-wrap items-start gap-3 sm:gap-4">
                    {phoneStorageOptions.map((s) => {
                      const isSelected = selectedStorage === s.storage_name;
                      return (
                        <button
                          key={s.storage_id || s.storage_name}
                          type="button"
                          onClick={() => setSelectedStorage(s.storage_name)}
                          className={`py-2 px-4 rounded-xl text-xs font-medium transition-all cursor-pointer border ${
                            isSelected
                              ? 'bg-gradient-to-r from-black via-neutral-900 to-rose-950 text-white border-neutral-800 shadow-2xs'
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'
                          }`}
                        >
                          <span>{s.storage_name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Warranty */}
              {phone.warranty && (
                <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <Shield className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                  <span className="font-semibold uppercase tracking-wider text-slate-400">Warranty:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-100">{phone.warranty}</span>
                </div>
              )}

              {/* Inventory Status Overview Box */}
              <div className="bg-white dark:bg-slate-850 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs mb-5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
                  Inventory & Catalog Status
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Current Stock</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {phone.current_stock ?? phone.stock_quantity ?? 0} units
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Low Stock Alert</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {phone.low_stock_level || 5} units
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Availability</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {phone.availability ? phone.availability.replace(/_/g, ' ') : 'In Stock'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Status</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {phone.status || 'Published'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Available Instalment Plans */}
              {Boolean(phone.installment_enabled) && (
                <div className="bg-white dark:bg-slate-850 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs mb-5">
                  <div className="flex items-center gap-1.5 mb-2.5">
                    <CreditCard className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Available Instalment Plans
                    </h3>
                  </div>

                  {loadingInstallments ? (
                    <div className="text-xs text-slate-400 py-1 font-normal">
                      Loading installment plans...
                    </div>
                  ) : availablePlans.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-1">
                      {availablePlans.map((plan) => {
                        const months = Number(plan.number_of_months || 3);
                        const rate = Number(plan.interest_rate || 0);
                        const total = effectivePrice * (1 + rate / 100);
                        const monthly = total / months;

                        return (
                          <div
                            key={plan.installment_plan_id}
                            className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex flex-col justify-between"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                                {plan.plan_name || 'Instalment Plan'}
                              </span>
                              <span className="text-xs font-bold text-rose-600 dark:text-rose-400 shrink-0">
                                ${monthly.toFixed(2)}/mo
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                              {months} Months • {rate === 0 ? '0% Interest' : `${rate}% Int`} • Total: ${total.toFixed(2)}
                            </p>
                            {plan.description && (
                              <p className="text-[10px] text-slate-400 mt-1 pt-1 border-t border-slate-200/40 dark:border-slate-700/40 truncate">
                                {plan.description}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Installment financing enabled for this smartphone.
                    </p>
                  )}
                </div>
              )}

              {/* Action Buttons: Edit & Close */}
              <div className="flex items-center gap-3 pt-2">
                {onEdit && (
                  <button
                    type="button"
                    onClick={() => onEdit(phone)}
                    className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-black via-neutral-900 to-rose-950 hover:from-neutral-900 hover:to-rose-900 text-white font-medium text-xs border border-neutral-800 hover:border-rose-900/60 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit This Phone</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="py-3 px-5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium text-xs transition-colors cursor-pointer shadow-2xs"
                >
                  Close
                </button>
              </div>

              {copiedLink && (
                <p className="text-center text-xs text-emerald-600 dark:text-emerald-400 font-medium animate-in fade-in pt-1">
                  Link copied to clipboard
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Similar Phones in Inventory Section at the bottom */}
        {similarPhones.length > 0 && (
          <div className="pt-10 mt-10 pb-8 border-t border-slate-200 dark:border-slate-800">
            <div className="mb-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Similar Phones in Inventory
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
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

