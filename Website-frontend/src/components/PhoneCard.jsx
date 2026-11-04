import React, { useState, useMemo, useEffect } from 'react';
import { Heart, GitCompare, Tag, Sparkles } from 'lucide-react';
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

  // Extract general fallback photos
  const generalPhotos = useMemo(() => {
    if (Array.isArray(phone.photos) && phone.photos.length > 0) return phone.photos;
    if (phone.main_photo) return [phone.main_photo];
    if (typeof phone.photos === 'string' && phone.photos.trim().startsWith('[')) {
      try {
        const parsed = JSON.parse(phone.photos);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return [];
  }, [phone]);

  // Parse color options (objects with name, color_code, photos or legacy strings)
  const parsedColors = useMemo(() => {
    let raw = phone.colour_options;
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
          color_name: c,
          color_code: '#475569',
          photos: fallbackPhoto ? [fallbackPhoto] : [],
        };
      }
      return {
        id: `color_${i}`,
        name: c.color_name || c.name || `Color #${i + 1}`,
        color_name: c.color_name || c.name || `Color #${i + 1}`,
        color_code: c.color_code || c.color || c.hex || '#475569',
        photos:
          Array.isArray(c.photos) && c.photos.length > 0
            ? c.photos
            : (generalPhotos[i] ? [generalPhotos[i]] : generalPhotos),
      };
    });
  }, [phone, generalPhotos]);

  // Default / auto-select the first color
  const [selectedColorIdx, setSelectedColorIdx] = useState(0);

  // Reset to first color when phone changes
  useEffect(() => {
    setSelectedColorIdx(0);
  }, [phoneId]);

  const activeColor = parsedColors[selectedColorIdx] || parsedColors[0];

  // Active displayed photo: prioritizes active color's first photo, then general photo at index, then first general photo, then main_photo
  const displayedPhoto =
    activeColor?.photos?.[0] ||
    generalPhotos[selectedColorIdx] ||
    generalPhotos[0] ||
    phone.main_photo ||
    '';

  // Format pricing
  const regularPrice = Number(phone.price || phone.regular_price || 0);
  const offerPrice = phone.offer_price || phone.active_offer?.offer_price;
  const hasOffer = Boolean(offerPrice && Number(offerPrice) < regularPrice);
  const effectivePrice = hasOffer ? Number(offerPrice) : regularPrice;
  const savings = hasOffer ? regularPrice - effectivePrice : 0;
  const discountPercent = hasOffer ? Math.round((savings / regularPrice) * 100) : 0;

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

  const handleCardClick = () => {
    if (onViewDetails) {
      onViewDetails({ ...phone, initialColorIdx: selectedColorIdx });
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className="group relative flex flex-col bg-theme-surface/70 border border-theme-border hover:border-white/20 rounded-xl sm:rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-black/40 hover:-translate-y-1 cursor-pointer"
    >
      {/* Top Media Header */}
      <div className="relative aspect-square w-full bg-[#080D1A] flex items-center justify-center overflow-hidden border-b border-theme-border/40 p-2 sm:p-3">
        {/* Subtle ambient light on hover */}
        <div className="absolute inset-0 bg-white/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10" />

        {/* Top Left: Offer Badge if have offer */}
        {hasOffer && (
          <div className="absolute top-2 left-2 sm:top-2.5 sm:left-2.5 z-20 inline-flex items-center gap-1 px-1.5 sm:px-2.5 py-0.5 rounded-full border border-amber-300/40 bg-black/75 backdrop-blur-md text-amber-200 text-[9px] sm:text-[11px] font-semibold tracking-wide shadow-sm max-w-[55%] sm:max-w-none truncate">
            <Tag className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0 text-amber-300" />
            <span className="truncate">{discountPercent > 0 ? `${discountPercent}% OFF` : 'Offer'}</span>
          </div>
        )}

        {/* Action icons on Top Right: Favorite & Compare */}
        <div className="absolute top-2 right-2 sm:top-2.5 sm:right-2.5 z-20 flex items-center gap-1 sm:gap-1.5">
          {/* Compare Button */}
          <button
            type="button"
            title={inComparison ? 'Remove from Compare' : 'Add to Compare'}
            onClick={handleCompareClick}
            className={`p-1 sm:p-1.5 rounded-md sm:rounded-lg border backdrop-blur-md transition-colors cursor-pointer ${
              inComparison
                ? 'bg-white/20 text-white border-white/40'
                : 'bg-black/60 border-white/15 text-theme-textSecondary hover:text-white hover:bg-black/80'
            }`}
          >
            <GitCompare className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </button>

          {/* Favorite Button */}
          <button
            type="button"
            title={favorited ? 'Remove from Favourites' : 'Save to Favourites'}
            onClick={handleFavoriteClick}
            className="p-1 sm:p-1.5 rounded-md sm:rounded-lg border backdrop-blur-md transition-colors cursor-pointer bg-black/60 border-white/15 text-theme-textSecondary hover:bg-black/80"
          >
            <Heart className={`w-3 h-3 sm:w-3.5 sm:h-3.5 transition-colors ${favorited ? 'text-rose-400 fill-rose-400/80' : 'text-theme-textSecondary hover:text-rose-400'}`} />
          </button>
        </div>

        {/* Phone Photo */}
        {displayedPhoto ? (
          <img
            key={displayedPhoto}
            src={displayedPhoto}
            alt={phone.name}
            loading="lazy"
            className="w-full h-full object-contain object-center transition-transform duration-300 group-hover:scale-105"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-theme-textMuted py-4 sm:py-8">
            <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 stroke-[1.2] mb-1.5 opacity-30" />
            <span className="text-[10px] sm:text-[11px] tracking-wider uppercase text-theme-textMuted font-medium">
              SK LABA PHONE
            </span>
          </div>
        )}
      </div>

      {/* Card Info Content */}
      <div className="p-2.5 sm:p-3.5 md:p-4 flex flex-col flex-1 justify-between gap-2 sm:gap-3">
        <div>
          {/* Brand */}
          <span className="block uppercase tracking-wider text-theme-textSecondary text-[10px] sm:text-[11px] font-semibold mb-0.5 sm:mb-1 truncate">
            {phone.brand_name || 'Smartphone'}
          </span>

          {/* Phone Title */}
          <h3 className="text-xs sm:text-sm font-semibold text-white group-hover:text-sky-300 transition-colors line-clamp-1 leading-snug">
            {phone.name}
          </h3>
        </div>

        {/* Pricing */}
        <div className="pt-1.5 sm:pt-2 border-t border-theme-border/40 flex items-baseline gap-1.5 sm:gap-2 flex-wrap">
          <span className="text-sm sm:text-base md:text-lg font-normal text-white tracking-tight">
            ${effectivePrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          {hasOffer && (
            <span className="text-[10px] sm:text-xs text-theme-textMuted line-through font-normal">
              ${regularPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          )}
        </div>

        {/* Color thumbnails under the phone card */}
        {parsedColors.length > 0 && (
          <div
            className="flex items-center justify-center gap-1 sm:gap-1.5 md:gap-2 pt-1 flex-wrap"
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
                  title={color.name || `Color #${idx + 1}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedColorIdx(idx);
                  }}
                  onMouseEnter={() => setSelectedColorIdx(idx)}
                  className={`group/thumb relative w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-lg p-0.5 border overflow-hidden transition-all duration-200 cursor-pointer flex items-center justify-center bg-black/40 ${
                    isSelected
                      ? 'border-white ring-1 sm:ring-2 ring-white/40 shadow-md scale-105'
                      : 'border-white/15 hover:border-white/50 opacity-70 hover:opacity-100 hover:scale-105'
                  }`}
                >
                  {colorPhoto ? (
                    <img
                      src={colorPhoto}
                      alt={color.name || `Color #${idx + 1}`}
                      className="w-full h-full object-cover object-center rounded-[6px]"
                      loading="lazy"
                    />
                  ) : (
                    <span
                      className="w-full h-full rounded-[6px]"
                      style={{
                        backgroundColor: color.color_code || '#475569',
                      }}
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
