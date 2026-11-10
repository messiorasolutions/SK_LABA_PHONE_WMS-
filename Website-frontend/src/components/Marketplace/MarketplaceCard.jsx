import React, { useState, useMemo } from 'react';
import { Heart, MessageCircle, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { resolveImageUrl, getConditionGradeMeta, formatCurrency, CARD_PLACEHOLDER_SVG } from '../../utils/imageHelper';
import { useFavoritesAndCompare } from '../../hooks/useFavoritesAndCompare';
import { useShopInfo } from '../../context/ShopInfoContext';

/**
 * MarketplaceCard
 * Fast scanning + easy comparison + quick action.
 * Strict layout-shift prevention with aspect-square placeholder.
 */
function MarketplaceCardComponent({
  phone,
  onViewDetails,
  onReserve,
  priority = false, // True for above-the-fold critical cards (eager load)
}) {
  const { isFavorite, toggleFavorite } = useFavoritesAndCompare();
  const { getWhatsAppUrl } = useShopInfo();

  const phoneId = phone.listing_id || phone.id || phone.phone_id;
  const favorited = isFavorite(phoneId);

  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Condition metadata
  const conditionMeta = useMemo(() => {
    return getConditionGradeMeta(phone.condition_grade || phone.phone_condition || phone.condition);
  }, [phone.condition_grade, phone.phone_condition, phone.condition]);

  // Primary photo source
  const rawPhoto = useMemo(() => {
    if (phone.main_photo) return phone.main_photo;
    if (phone.primaryImage) return phone.primaryImage;
    if (phone.image_url) return phone.image_url;
    if (Array.isArray(phone.photos) && phone.photos.length > 0) return phone.photos[0];
    return null;
  }, [phone]);

  const resolvedPhotoUrl = useMemo(() => {
    return resolveImageUrl(rawPhoto, 'card');
  }, [rawPhoto]);

  // Price calculation
  const price = Number(phone.effective_price ?? phone.price ?? phone.regular_price ?? 0);

  // WhatsApp quick inquiry handler
  const handleWhatsAppClick = (e) => {
    e.stopPropagation();
    const phoneRef = phone.listing_ref || `#${phoneId}`;
    const text = `Hi SK LABA PHONE, I am interested in Marketplace phone ${phoneRef}: ${phone.brand} ${phone.model} (${formatCurrency(price)})`;
    window.open(getWhatsAppUrl(text), '_blank');
  };

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    toggleFavorite(phoneId);
  };

  const handleCardClick = () => {
    if (onViewDetails) {
      onViewDetails(phone);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      role="article"
      aria-label={`${phone.brand || ''} ${phone.model || phone.name || 'Marketplace Phone'}`}
      className="group relative flex flex-col bg-[#0A0F1E] border border-white/10 hover:border-white/30 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-black/70 hover:-translate-y-1 cursor-pointer focus-within:ring-2 focus-within:ring-sky-400"
    >
      {/* 1. MEDIA CONTAINER (Strict aspect-square prevents CLS) */}
      <div className="relative aspect-square w-full bg-[#070B16] flex items-center justify-center overflow-hidden border-b border-white/10 p-3 sm:p-4">
        {/* Subtle ambient light */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none z-10" />

        {/* Top Left: Marketplace Verified / Condition Badge */}
        <div className="absolute top-2.5 left-2.5 z-20 flex flex-col gap-1 items-start max-w-[70%]">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold border backdrop-blur-md shadow-sm truncate ${conditionMeta.badgeClass}`}
            title={conditionMeta.description}
          >
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${conditionMeta.dotClass}`} />
            <span className="truncate">{conditionMeta.label}</span>
          </span>

          {phone.battery_health && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9.5px] font-medium bg-black/60 border border-white/10 text-slate-300 backdrop-blur-md">
              Battery {phone.battery_health}%
            </span>
          )}
        </div>

        {/* Top Right: Favorite & Quick WhatsApp Actions */}
        <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1.5">
          {/* Quick WhatsApp Inquiry */}
          <button
            type="button"
            title="Inquire via WhatsApp"
            aria-label="Inquire about this phone on WhatsApp"
            onClick={handleWhatsAppClick}
            className="w-8 h-8 rounded-lg border border-emerald-500/30 bg-emerald-950/60 hover:bg-emerald-600/30 text-emerald-300 flex items-center justify-center transition-colors cursor-pointer backdrop-blur-md"
          >
            <MessageCircle className="w-3.5 h-3.5" />
          </button>

          {/* Favorite Button */}
          <button
            type="button"
            title={favorited ? 'Remove from Favourites' : 'Save to Favourites'}
            aria-label={favorited ? 'Remove from Favourites' : 'Save to Favourites'}
            onClick={handleFavoriteClick}
            className="w-8 h-8 rounded-lg border border-white/15 bg-black/60 hover:bg-black/90 text-slate-300 hover:text-rose-400 flex items-center justify-center transition-colors cursor-pointer backdrop-blur-md"
          >
            <Heart
              className={`w-3.5 h-3.5 transition-colors ${
                favorited ? 'text-rose-400 fill-rose-400' : ''
              }`}
            />
          </button>
        </div>

        {/* Skeleton Shimmer while image loads */}
        {!imageLoaded && !imageError && (
          <div
            className="absolute inset-0 bg-[#0E1526] animate-pulse flex items-center justify-center pointer-events-none"
            aria-hidden="true"
          >
            <div className="w-20 h-28 rounded-xl border border-white/5 bg-white/5 animate-pulse" />
          </div>
        )}

        {/* Real Product Image with Smooth Transition */}
        <img
          key={resolvedPhotoUrl}
          src={imageError ? CARD_PLACEHOLDER_SVG : resolvedPhotoUrl}
          alt={`${phone.brand || ''} ${phone.model || phone.name || 'Phone'}`}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={() => setImageLoaded(true)}
          onError={() => {
            setImageError(true);
            setImageLoaded(true);
          }}
          className={`w-full h-full object-contain object-center transition-all duration-300 group-hover:scale-105 motion-reduce:group-hover:scale-100 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Marketplace Pre-Owned Indicator Footer on Image */}
        <div className="absolute bottom-2 left-2.5 z-20 pointer-events-none">
          <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] text-slate-400 bg-black/75 px-1.5 py-0.5 rounded border border-white/10 backdrop-blur-sm">
            <ShieldCheck className="w-3 h-3 text-sky-400 shrink-0" />
            <span>Marketplace Verified</span>
          </span>
        </div>
      </div>

      {/* 2. CARD CONTENT HIERARCHY */}
      <div className="p-3.5 sm:p-4 flex flex-col flex-1 justify-between gap-3">
        <div>
          {/* Brand */}
          <span className="block uppercase tracking-wider text-slate-400 text-[10px] sm:text-[11px] font-bold mb-0.5 truncate">
            {phone.brand || phone.brand_name || 'PRE-OWNED'}
          </span>

          {/* Model Title */}
          <h3 className="text-sm sm:text-base font-semibold text-white group-hover:text-sky-300 transition-colors line-clamp-1 leading-snug">
            {phone.model || phone.name}
          </h3>

          {/* Storage & Color Specifications */}
          <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-300 font-medium">
            {phone.storage && <span>{phone.storage}</span>}
            {phone.storage && phone.color && <span>•</span>}
            {phone.color && <span className="truncate">{phone.color}</span>}
          </div>
        </div>

        {/* 3. PRICE & PRIMARY CTA */}
        <div className="pt-2 border-t border-white/10 space-y-2.5">
          <div className="flex items-baseline justify-between gap-2">
            <div>
              <span className="text-xs text-slate-400 block font-normal">Price</span>
              <span className="text-base sm:text-lg font-bold text-white tracking-tight">
                {formatCurrency(price)}
              </span>
            </div>

            {phone.listing_ref && (
              <span className="text-[10px] text-slate-500 font-mono tracking-wider">
                {phone.listing_ref}
              </span>
            )}
          </div>

          {/* Primary CTA Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleCardClick();
            }}
            className="w-full py-2.5 px-3 rounded-xl bg-white hover:bg-slate-100 text-[#0A0F1E] text-xs font-bold transition-all shadow-md active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-sky-400"
          >
            <span>View Details</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// Memoized export to prevent wasteful re-renders on filter change
export const MarketplaceCard = React.memo(MarketplaceCardComponent);
export default MarketplaceCard;
