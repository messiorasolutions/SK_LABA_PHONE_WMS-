import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Heart,
  Share2,
  CheckCircle2,
  ShieldCheck,
  Battery,
  Box,
  Zap,
  MessageCircle,
  PhoneCall,
  ChevronLeft,
  ChevronRight,
  Info,
  Calendar,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  ExternalLink,
} from 'lucide-react';
import { resolveImageUrl, getConditionGradeMeta, formatCurrency, CARD_PLACEHOLDER_SVG } from '../../utils/imageHelper';
import { useFavoritesAndCompare } from '../../hooks/useFavoritesAndCompare';
import { useShopInfo } from '../../context/ShopInfoContext';
import { getMarketplacePhoneById } from '../../services/marketplaceService';

export default function MarketplacePhoneDetailModal({
  phone,
  onClose,
  onOpenReserve,
  onOpenInquiry,
}) {
  const { shopInfo, getWhatsAppUrl } = useShopInfo();
  const { isFavorite, toggleFavorite } = useFavoritesAndCompare();

  const phoneId = phone?.listing_id || phone?.id || phone?.phone_id;
  const favorited = isFavorite(phoneId);

  // Full detailed listing state (can be fetched if only summary passed)
  const [detailData, setDetailData] = useState(phone);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Fetch full detail if photos or full condition info is missing
  useEffect(() => {
    let isMounted = true;
    if (phoneId && (!phone?.photos || !phone?.condition_description)) {
      setLoadingDetail(true);
      getMarketplacePhoneById(phoneId)
        .then((res) => {
          if (isMounted && res?.data) {
            setDetailData((prev) => ({ ...prev, ...res.data }));
          }
        })
        .catch(() => {
          // Keep current summary data on error
        })
        .finally(() => {
          if (isMounted) setLoadingDetail(false);
        });
    } else {
      setDetailData(phone);
    }
    return () => {
      isMounted = false;
    };
  }, [phoneId, phone]);

  // Gallery photos array
  const galleryPhotos = useMemo(() => {
    const list = [];
    if (Array.isArray(detailData?.photos) && detailData.photos.length > 0) {
      list.push(...detailData.photos);
    } else {
      if (detailData?.main_photo) list.push(detailData.main_photo);
      if (detailData?.primaryImage) list.push(detailData.primaryImage);
      if (detailData?.image_url) list.push(detailData.image_url);
    }
    return list.length > 0 ? list : [CARD_PLACEHOLDER_SVG];
  }, [detailData]);

  // Active displayed photo
  const currentPhoto = galleryPhotos[selectedImageIdx] || galleryPhotos[0];
  const resolvedMainPhoto = resolveImageUrl(currentPhoto, 'detail');

  // Condition metadata
  const conditionMeta = useMemo(() => {
    return getConditionGradeMeta(detailData?.condition_grade || detailData?.phone_condition || detailData?.condition);
  }, [detailData]);

  const price = Number(detailData?.effective_price ?? detailData?.price ?? detailData?.regular_price ?? 0);
  const phoneRef = detailData?.listing_ref || `MKP-LST-${String(phoneId).padStart(6, '0')}`;

  // Keyboard accessibility: ESC to close, Arrow keys for gallery
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isLightboxOpen) {
        if (e.key === 'Escape') {
          setIsLightboxOpen(false);
          setZoomLevel(1);
        } else if (e.key === 'ArrowRight' && galleryPhotos.length > 1) {
          setSelectedImageIdx((prev) => (prev + 1) % galleryPhotos.length);
          setZoomLevel(1);
        } else if (e.key === 'ArrowLeft' && galleryPhotos.length > 1) {
          setSelectedImageIdx((prev) => (prev - 1 + galleryPhotos.length) % galleryPhotos.length);
          setZoomLevel(1);
        } else if (e.key === '+' || e.key === '=') {
          setZoomLevel((z) => Math.min(4, z + 0.5));
        } else if (e.key === '-') {
          setZoomLevel((z) => Math.max(1, z - 0.5));
        } else if (e.key === '0') {
          setZoomLevel(1);
        }
        return;
      }

      if (e.key === 'Escape' && onClose) {
        onClose();
      } else if (e.key === 'ArrowRight' && galleryPhotos.length > 1) {
        setSelectedImageIdx((prev) => (prev + 1) % galleryPhotos.length);
      } else if (e.key === 'ArrowLeft' && galleryPhotos.length > 1) {
        setSelectedImageIdx((prev) => (prev - 1 + galleryPhotos.length) % galleryPhotos.length);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, galleryPhotos.length, isLightboxOpen]);

  // WhatsApp CTA
  const handleWhatsAppChat = () => {
    const text = `Hi SK LABA PHONE! I want to inquire about Marketplace Phone ${phoneRef}: ${detailData?.brand} ${detailData?.model} (${formatCurrency(price)})`;
    window.open(getWhatsAppUrl(text), '_blank');
  };

  // Reserve CTA
  const handleReserveClick = () => {
    if (onOpenReserve) {
      onOpenReserve({
        phone_id: phoneId,
        id: phoneId,
        name: `${detailData?.brand} ${detailData?.model}`,
        brand: detailData?.brand,
        model: detailData?.model,
        storage: detailData?.storage,
        color: detailData?.color,
        price: price,
        effectivePrice: price,
        image_url: resolvedMainPhoto,
        listing_ref: phoneRef,
        source: 'MARKETPLACE',
      });
    } else {
      handleWhatsAppChat();
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${detailData?.brand} ${detailData?.model} - SK LABA PHONE Marketplace`,
        text: `Check out this verified pre-owned ${detailData?.brand} ${detailData?.model} on SK LABA PHONE for ${formatCurrency(price)}!`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="marketplace-detail-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-200"
    >
      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-5xl bg-[#090D1A] border border-white/15 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-white/10 shrink-0 bg-[#0A1020]/90 backdrop-blur-md z-20">
          <div className="flex items-center gap-2 truncate">
            <span className="text-[11px] font-mono text-sky-400 font-semibold bg-sky-950/60 px-2 py-0.5 rounded border border-sky-800/40">
              {phoneRef}
            </span>
            <span className="text-xs text-slate-400 hidden sm:inline truncate">
              Marketplace Verified Device
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={handleShare}
              title="Share phone"
              aria-label="Share this phone"
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => toggleFavorite(phoneId)}
              title={favorited ? 'Remove from Favourites' : 'Save to Favourites'}
              aria-label={favorited ? 'Remove from Favourites' : 'Save to Favourites'}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-rose-400 flex items-center justify-center transition-colors cursor-pointer"
            >
              <Heart className={`w-4 h-4 ${favorited ? 'text-rose-400 fill-rose-400' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              title="Close (Esc)"
              aria-label="Close phone details"
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-white/15 bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer ml-1"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Modal Content (with bottom padding for mobile sticky CTA) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 pb-28 md:pb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-10 items-start">
            {/* LEFT: GALLERY & IMAGES */}
            <div className="space-y-3">
              {/* Main Image Stage */}
              <div 
                className="relative aspect-square w-full rounded-2xl bg-[#060913] border border-white/10 flex items-center justify-center overflow-hidden p-4 sm:p-6 cursor-zoom-in group"
                onClick={() => setIsLightboxOpen(true)}
              >
                <img
                  key={resolvedMainPhoto}
                  src={resolvedMainPhoto}
                  alt={`${detailData?.brand} ${detailData?.model}`}
                  className="max-h-full max-w-full object-contain transition-transform duration-300 drop-shadow-[0_10px_25px_rgba(0,0,0,0.8)] group-hover:scale-105"
                />

                {/* Condition Badge on Main Photo */}
                <div className="absolute top-3 left-3 z-10">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border backdrop-blur-md shadow-md ${conditionMeta.badgeClass}`}
                  >
                    <span className={`w-2 h-2 rounded-full ${conditionMeta.dotClass}`} />
                    <span>{conditionMeta.label}</span>
                  </span>
                </div>

                {/* Arrow Navigation if multiple photos */}
                {galleryPhotos.length > 1 && (
                  <>
                    <button
                      type="button"
                      aria-label="Previous image"
                      onClick={() =>
                        setSelectedImageIdx((prev) => (prev - 1 + galleryPhotos.length) % galleryPhotos.length)
                      }
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 border border-white/20 text-white flex items-center justify-center hover:bg-black/90 transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      aria-label="Next image"
                      onClick={() =>
                        setSelectedImageIdx((prev) => (prev + 1) % galleryPhotos.length)
                      }
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 border border-white/20 text-white flex items-center justify-center hover:bg-black/90 transition-colors cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>

              {/* Gallery Thumbnails (Section 9: Primary first, small thumbnails, lazy loaded) */}
              {galleryPhotos.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
                  {galleryPhotos.map((photo, idx) => {
                    const isSelected = selectedImageIdx === idx;
                    const thumbUrl = resolveImageUrl(photo, 'thumbnail');
                    return (
                      <button
                        key={idx}
                        type="button"
                        aria-label={`View photo ${idx + 1}`}
                        onClick={() => setSelectedImageIdx(idx)}
                        className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl border p-1 bg-black/40 overflow-hidden shrink-0 transition-all cursor-pointer ${
                          isSelected
                            ? 'border-white ring-2 ring-white/50 scale-105'
                            : 'border-white/15 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={thumbUrl}
                          alt={`Thumbnail ${idx + 1}`}
                          loading="lazy"
                          className="w-full h-full object-contain rounded-lg"
                        />
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Verified Trust Banner under photos */}
              <div className="rounded-xl border border-sky-500/20 bg-sky-950/20 p-3 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-0.5">
                  <p className="font-semibold text-white">SK LABA PHONE Physical Verification</p>
                  <p className="text-slate-300">
                    This smartphone was independently tested and verified for hardware functionality, battery performance, and screen authenticity.
                  </p>
                </div>
              </div>
            </div>

            {/* RIGHT: PHONE SPECS, DETAILS & ACTIONS */}
            <div className="space-y-5">
              {/* Brand & Model */}
              <div>
                <span className="text-xs uppercase tracking-wider text-slate-400 font-bold">
                  {detailData?.brand || 'PRE-OWNED'}
                </span>
                <h1
                  id="marketplace-detail-title"
                  className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight leading-tight mt-0.5"
                >
                  {detailData?.model || detailData?.name}
                </h1>
                <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                  <span>Ref: {phoneRef}</span>
                  <span>•</span>
                  <span className="text-emerald-400 font-medium">Available for immediate purchase</span>
                </div>
              </div>

              {/* Price Banner */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-baseline justify-between gap-3">
                <div>
                  <span className="text-xs text-slate-400 block font-normal">Marketplace Price</span>
                  <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    {formatCurrency(price)}
                  </span>
                </div>

                <div className="text-right">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>In Stock</span>
                  </span>
                </div>
              </div>

              {/* Quick Spec Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-center">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Storage</span>
                  <span className="text-xs sm:text-sm font-bold text-white">
                    {detailData?.storage || 'Standard'}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-center">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Color</span>
                  <span className="text-xs sm:text-sm font-bold text-white truncate block">
                    {detailData?.color || 'Original'}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-center col-span-2 sm:col-span-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Battery</span>
                  <span className="text-xs sm:text-sm font-bold text-emerald-400 flex items-center justify-center gap-1">
                    <Battery className="w-3.5 h-3.5" />
                    {detailData?.battery_health ? `${detailData.battery_health}%` : 'Healthy'}
                  </span>
                </div>
              </div>

              {/* Desktop Desktop Actions */}
              <div className="hidden md:grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleReserveClick}
                  className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-200 text-[#090D1A] font-bold text-sm transition-all shadow-lg active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Reserve This Phone</span>
                </button>
                <button
                  type="button"
                  onClick={handleWhatsAppChat}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-all shadow-lg active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Chat on WhatsApp</span>
                </button>
              </div>

              {/* Comprehensive Inspection Checklist (Section 42 & HCI Progressive Disclosure) */}
              <div className="space-y-3 pt-2 border-t border-white/10">
                <h3 className="text-xs uppercase tracking-wider font-bold text-white flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-sky-400" />
                  <span>Condition & Inspection Report</span>
                </h3>

                <div className="rounded-xl bg-white/[0.02] border border-white/10 p-3.5 space-y-2.5 text-xs">
                  {detailData?.condition_description && (
                    <p className="text-slate-300 leading-relaxed italic">
                      "{detailData.condition_description}"
                    </p>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-white/5">
                    {detailData?.display_condition && (
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-slate-400">Display:</span>
                        <span className="font-medium text-white">{detailData.display_condition}</span>
                      </div>
                    )}
                    {detailData?.physical_condition && (
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-slate-400">Body / Frame:</span>
                        <span className="font-medium text-white">{detailData.physical_condition}</span>
                      </div>
                    )}
                    {detailData?.camera_condition && (
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-slate-400">Cameras:</span>
                        <span className="font-medium text-white">{detailData.camera_condition}</span>
                      </div>
                    )}
                    {detailData?.biometrics_status && (
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-slate-400">Biometrics / Face ID:</span>
                        <span className="font-medium text-white">{detailData.biometrics_status}</span>
                      </div>
                    )}
                  </div>

                  {/* Included Items */}
                  <div className="flex items-center gap-4 pt-2 border-t border-white/5 text-slate-300">
                    <span className="text-slate-400">Included:</span>
                    <span className="inline-flex items-center gap-1 text-white">
                      <Box className="w-3.5 h-3.5 text-sky-400" />
                      {detailData?.original_box ? 'Original Box' : 'Standard Packaging'}
                    </span>
                    <span className="inline-flex items-center gap-1 text-white">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      {detailData?.charger_included ? 'Original Charger' : 'No Charger'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* MOBILE STICKY BOTTOM PURCHASE CTA (Section 43) */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 p-3 sm:p-4 bg-[#090D1A]/95 border-t border-white/15 backdrop-blur-lg flex items-center justify-between gap-3 shadow-[0_-10px_30px_rgba(0,0,0,0.8)]">
          <div>
            <span className="text-[10px] text-slate-400 block font-normal">Price</span>
            <span className="text-base sm:text-lg font-black text-white tracking-tight">
              {formatCurrency(price)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleWhatsAppChat}
              title="Chat on WhatsApp"
              className="p-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center justify-center cursor-pointer shadow-md"
            >
              <MessageCircle className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleReserveClick}
              className="py-2.5 px-4 rounded-xl bg-white hover:bg-slate-200 text-[#090D1A] font-bold text-xs shadow-lg cursor-pointer"
            >
              Reserve Phone
            </button>
          </div>
        </div>
        {/* FULL FRAME QUALITY INSPECTOR LIGHTBOX */}
        {isLightboxOpen && (
          <div
            role="dialog"
            aria-label="Quality Inspection Lightbox"
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex flex-col justify-between select-none animate-in fade-in duration-200"
          >
            {/* Top Toolbar */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-white/10 bg-black/60 shrink-0 z-20">
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-white">
                  {detailData?.brand} {detailData?.model}
                </span>
                <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-white/10 text-slate-300 font-bold">
                  {selectedImageIdx + 1} / {galleryPhotos.length}
                </span>
                <span className="text-xs text-slate-400 hidden sm:inline">
                  {detailData?.storage} • {conditionMeta?.label}
                </span>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-white/10 rounded-xl p-0.5 border border-white/10">
                  <button
                    type="button"
                    onClick={() => setZoomLevel((z) => Math.max(1, z - 0.5))}
                    disabled={zoomLevel <= 1}
                    className="p-1.5 rounded-lg text-slate-300 hover:text-white disabled:opacity-30 cursor-pointer"
                    title="Zoom Out (-)"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-mono font-bold text-white px-2 min-w-[50px] text-center">
                    {Math.round(zoomLevel * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setZoomLevel((z) => Math.min(4, z + 0.5))}
                    disabled={zoomLevel >= 4}
                    className="p-1.5 rounded-lg text-slate-300 hover:text-white disabled:opacity-30 cursor-pointer"
                    title="Zoom In (+)"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  {zoomLevel > 1 && (
                    <button
                      type="button"
                      onClick={() => setZoomLevel(1)}
                      className="p-1.5 rounded-lg text-sky-400 hover:text-sky-300 cursor-pointer"
                      title="Reset Zoom (100%)"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <a
                  href={resolveImageUrl(galleryPhotos[selectedImageIdx], 'gallery')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="Open Original Photo in New Tab"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>

                <button
                  type="button"
                  onClick={() => {
                    setIsLightboxOpen(false);
                    setZoomLevel(1);
                  }}
                  className="p-2 rounded-xl bg-white/10 hover:bg-rose-600 text-white transition-colors cursor-pointer"
                  title="Close Inspector (Esc)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Central Large Stage */}
            <div
              className="relative flex-1 flex items-center justify-center overflow-auto p-4 cursor-zoom-in"
              onClick={() => {
                setZoomLevel((z) => (z === 1 ? 2 : 1));
              }}
            >
              <img
                src={resolveImageUrl(galleryPhotos[selectedImageIdx], 'gallery')}
                alt={`Quality check ${selectedImageIdx + 1}`}
                style={{
                  transform: `scale(${zoomLevel})`,
                  transition: 'transform 0.2s ease-out',
                  maxWidth: zoomLevel === 1 ? '90vw' : 'none',
                  maxHeight: zoomLevel === 1 ? '75vh' : 'none',
                }}
                className="object-contain drop-shadow-2xl rounded-lg"
              />

              {/* Prev / Next Buttons */}
              {galleryPhotos.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImageIdx((i) => (i - 1 + galleryPhotos.length) % galleryPhotos.length);
                      setZoomLevel(1);
                    }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/70 hover:bg-black border border-white/20 text-white flex items-center justify-center transition-all cursor-pointer shadow-xl hover:scale-105"
                    title="Previous Photo (Left Arrow)"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImageIdx((i) => (i + 1) % galleryPhotos.length);
                      setZoomLevel(1);
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/70 hover:bg-black border border-white/20 text-white flex items-center justify-center transition-all cursor-pointer shadow-xl hover:scale-105"
                    title="Next Photo (Right Arrow)"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>

            {/* Bottom Thumbnail Strip */}
            {galleryPhotos.length > 1 && (
              <div className="px-6 py-3 border-t border-white/10 bg-black/60 shrink-0 z-20 flex items-center justify-center gap-2 overflow-x-auto">
                {galleryPhotos.map((photo, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImageIdx(idx);
                      setZoomLevel(1);
                    }}
                    className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                      selectedImageIdx === idx
                        ? 'border-sky-500 scale-105 shadow-md ring-2 ring-sky-500/40'
                        : 'border-transparent opacity-50 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={resolveImageUrl(photo, 'thumbnail')}
                      alt={`Thumb ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
