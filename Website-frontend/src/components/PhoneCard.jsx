import React from 'react';
import { Heart, GitCompare, Eye, ShoppingBag, Bell, Tag, Sparkles } from 'lucide-react';
import { useFavoritesAndCompare } from '../hooks/useFavoritesAndCompare';

export default function PhoneCard({
  phone,
  onViewDetails,
  onReserve,
  onNotifyBackInStock,
}) {
  const { isFavorite, isInCompare, toggleFavorite, toggleCompare } = useFavoritesAndCompare();

  const phoneId = phone.phone_id || phone.id;
  const favorited = isFavorite(phoneId);
  const inComparison = isInCompare(phoneId);

  // Determine main image
  let mainPhoto = '';
  if (Array.isArray(phone.photos) && phone.photos.length > 0) {
    mainPhoto = phone.photos[0];
  } else if (phone.main_photo) {
    mainPhoto = phone.main_photo;
  } else if (typeof phone.photos === 'string' && phone.photos.startsWith('[')) {
    try {
      const parsed = JSON.parse(phone.photos);
      mainPhoto = parsed[0] || '';
    } catch (e) {
      mainPhoto = '';
    }
  }

  // Stock status
  const availability = (phone.availability || 'IN_STOCK').toUpperCase();
  const currentStock = Number(phone.current_stock ?? phone.stock ?? 0);
  const isSoldOut = availability === 'SOLD_OUT' || (availability !== 'COMING_SOON' && currentStock === 0);
  const isLowStock = availability === 'LOW_STOCK' || (currentStock > 0 && currentStock <= (phone.low_stock_level || 5));
  const isComingSoon = availability === 'COMING_SOON';

  // Format pricing
  const regularPrice = Number(phone.price || phone.regular_price || 0);
  const offerPrice = phone.offer_price || phone.active_offer?.offer_price;
  const hasOffer = Boolean(offerPrice && Number(offerPrice) < regularPrice);
  const effectivePrice = hasOffer ? Number(offerPrice) : regularPrice;
  const savings = hasOffer ? regularPrice - effectivePrice : 0;
  const discountPercent = hasOffer ? Math.round((savings / regularPrice) * 100) : 0;

  // Format colors & storage tags
  let colors = [];
  if (Array.isArray(phone.colour_options)) {
    colors = phone.colour_options;
  } else if (typeof phone.colour_options === 'string') {
    try {
      colors = JSON.parse(phone.colour_options);
    } catch (e) {
      colors = phone.colour_options.split(',').map((c) => c.trim()).filter(Boolean);
    }
  }

  // Condition
  const condition = (phone.phone_condition || 'NEW').toUpperCase();

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    toggleFavorite(phoneId);
  };

  const handleCompareClick = (e) => {
    e.stopPropagation();
    const result = toggleCompare(phoneId);
    if (result && !result.success && result.error) {
      alert(result.error);
    }
  };

  return (
    <div
      onClick={() => onViewDetails && onViewDetails(phone)}
      className="group relative flex flex-col bg-theme-surface/70 border border-theme-border hover:border-white/20 rounded-xl overflow-hidden transition-all duration-200 hover:bg-theme-surface cursor-pointer"
    >
      {/* Top Media Header */}
      <div className="relative aspect-[3/3.4] w-full bg-[#080D1A] p-4 flex items-center justify-center overflow-hidden border-b border-theme-border/40">
        {/* Subtle ambient gradient on card hover */}
        <div className="absolute inset-0 bg-white/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

        {/* Badges on Top Left: Condition & Availability (No highlighted neon bg, clean official tags) */}
        <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1 items-start">
          {/* Condition Badge */}
          <span className="px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider rounded border border-white/15 bg-black/50 backdrop-blur-md text-white/90">
            {condition}
          </span>

          {/* Availability Badge */}
          {isSoldOut ? (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-medium tracking-wide rounded border border-white/10 bg-black/50 backdrop-blur-md text-white/80">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
              <span>Sold Out</span>
            </span>
          ) : isLowStock ? (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-medium tracking-wide rounded border border-white/10 bg-black/50 backdrop-blur-md text-white/90">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>Only {currentStock} left</span>
            </span>
          ) : isComingSoon ? (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-medium tracking-wide rounded border border-white/10 bg-black/50 backdrop-blur-md text-white/80">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
              <span>Coming Soon</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-medium tracking-wide rounded border border-white/10 bg-black/50 backdrop-blur-md text-white/90">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>In Stock</span>
            </span>
          )}
        </div>

        {/* Action icons on Top Right: Favorite & Compare */}
        <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1">
          {/* Compare Button */}
          <button
            type="button"
            title={inComparison ? 'Remove from Compare' : 'Add to Compare (C-05)'}
            onClick={handleCompareClick}
            className={`p-1.5 rounded-md border backdrop-blur-md transition-colors cursor-pointer ${
              inComparison
                ? 'bg-white/15 text-white border-white/30'
                : 'bg-black/50 border-white/10 text-theme-textSecondary hover:text-white hover:bg-black/80'
            }`}
          >
            <GitCompare className="w-3.5 h-3.5" />
          </button>

          {/* Favorite Button */}
          <button
            type="button"
            title={favorited ? 'Remove from Favourites' : 'Save to Favourites (C-06)'}
            onClick={handleFavoriteClick}
            className={`p-1.5 rounded-md border backdrop-blur-md transition-colors cursor-pointer ${
              favorited
                ? 'bg-red-950/50 text-red-400 border-red-500/30'
                : 'bg-black/50 border-white/10 text-theme-textSecondary hover:text-red-400 hover:bg-black/80'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${favorited ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Phone Photo */}
        {mainPhoto ? (
          <img
            src={mainPhoto}
            alt={phone.name}
            loading="lazy"
            className="relative z-0 max-h-full max-w-full object-contain transition-transform duration-200 group-hover:scale-105 drop-shadow-[0_6px_12px_rgba(0,0,0,0.4)]"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-theme-textMuted">
            <Sparkles className="w-10 h-10 stroke-[1.2] mb-1 opacity-30" />
            <span className="text-[11px]">SK LABA PHONE</span>
          </div>
        )}

        {/* Offer Discount Tag (No neon background, clean official tag) */}
        {hasOffer && (
          <div className="absolute bottom-2 left-2 z-10 inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-white/15 bg-black/60 backdrop-blur-md text-white/90 text-[10px] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
            <span>Save ${savings.toFixed(0)} ({discountPercent}% off)</span>
          </div>
        )}
      </div>

      {/* Card Info Content */}
      <div className="p-3.5 flex flex-col flex-1 justify-between gap-3">
        <div>
          {/* Brand & Category */}
          <div className="flex items-center justify-between text-xs text-theme-textMuted font-medium mb-1">
            <span className="uppercase tracking-wider text-theme-textSecondary text-[11px]">
              {phone.brand_name || 'Smartphone'}
            </span>
            {phone.warranty && (
              <span className="text-[11px] text-theme-textMuted truncate max-w-[120px]" title={phone.warranty}>
                {phone.warranty}
              </span>
            )}
          </div>

          {/* Phone Title */}
          <h3 className="text-sm font-medium text-white group-hover:text-sky-300 transition-colors line-clamp-1 mb-1">
            {phone.name}
          </h3>
        </div>

        {/* Pricing & Call to Actions */}
        <div className="pt-2.5 border-t border-theme-border/60 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-semibold text-white tracking-tight">
                ${effectivePrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              {hasOffer && (
                <span className="text-xs text-theme-textMuted line-through">
                  ${regularPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              )}
            </div>

            {/* Installment Badge if enabled (Clean official style, no highlighted neon bg) */}
            {Boolean(phone.installment_enabled) && (
              <span className="text-[10px] font-normal text-theme-textSecondary border border-white/10 px-2 py-0.5 rounded bg-transparent inline-flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-emerald-400" />
                <span>Installment available</span>
              </span>
            )}
          </div>

          {/* Action Buttons Row: Rectangular, subtle, official button styling */}
          <div className="flex items-center gap-2 pt-1">
            {isSoldOut ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onNotifyBackInStock && onNotifyBackInStock(phone);
                }}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-transparent hover:bg-white/[0.04] text-theme-textSecondary hover:text-white border border-theme-border text-xs font-medium transition-all cursor-pointer"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Notify When Available</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onReserve && onReserve(phone);
                }}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-white/10 hover:bg-white/15 border border-white/20 text-white text-xs font-medium shadow-sm transition-all cursor-pointer"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Reserve Now</span>
              </button>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails && onViewDetails(phone);
              }}
              title="View Complete Specifications"
              className="p-2 rounded-lg bg-transparent hover:bg-white/[0.04] border border-theme-border text-theme-textSecondary hover:text-white transition-colors cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

