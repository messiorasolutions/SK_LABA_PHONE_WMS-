import React, { useState, useEffect } from 'react';
import { X, Trash2, AlertCircle } from 'lucide-react';
import { useFavoritesAndCompare } from '../../hooks/useFavoritesAndCompare';
import phoneService from '../../services/phoneService';

export default function FavoritesModal({
  onClose,
  onViewPhoneDetails,
  onReservePhone,
}) {
  const { favoriteIds, removeFavorite } = useFavoritesAndCompare();
  const [favoritesList, setFavoritesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unavailableCount, setUnavailableCount] = useState(0);

  useEffect(() => {
    if (favoriteIds.length === 0) {
      setFavoritesList([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    phoneService
      .getFavorites(favoriteIds)
      .then((res) => {
        if (res.data?.success && res.data?.data) {
          setFavoritesList(res.data.data.items || []);
          if (res.data.unavailable_ids?.length) {
            setUnavailableCount(res.data.unavailable_ids.length);
          }
        }
      })
      .catch((err) => {
        console.error('Failed to load favorites', err);
      })
      .finally(() => setLoading(false));
  }, [favoriteIds]);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/70 backdrop-blur-sm transition-opacity duration-300">
      {/* Click outside backdrop (left area) */}
      <div
        className="absolute inset-0 cursor-pointer"
        onClick={onClose}
        aria-label="Close drawer"
      />

      {/* Right-Side Slide-Over Drawer */}
      <div className="absolute top-0 right-0 bottom-0 h-full w-full sm:w-[540px] md:w-[580px] bg-[#0A0F1E] border-l border-theme-border shadow-[-24px_0_60px_rgba(0,0,0,0.9)] flex flex-col z-10 animate-in slide-in-from-right duration-300 ease-out">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-theme-border bg-theme-surface/90 backdrop-blur-md sticky top-0 z-20 shrink-0">
          <div>
            <h2 className="text-sm font-medium text-white">Your Saved Favourites</h2>
            <p className="text-xs text-theme-textMuted">
              {favoriteIds.length} item{favoriteIds.length === 1 ? '' : 's'} saved in your browser
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg border border-theme-border bg-transparent hover:bg-white/[0.04] text-theme-textSecondary hover:text-white transition-colors cursor-pointer"
            title="Close drawer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto p-6 flex-1">
          {loading ? (
            <div className="py-16 text-center">
              <p className="text-xs text-theme-textSecondary">Loading live pricing & stock status...</p>
            </div>
          ) : favoriteIds.length === 0 ? (
            <div className="py-16 text-center max-w-sm mx-auto">
              <h3 className="text-sm font-medium text-white mb-1">Your wishlist is empty</h3>
              <p className="text-xs text-theme-textSecondary mb-5 font-normal">
                Click the heart icon on any phone card to save your favourite models here for quick access.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 px-4 rounded-lg bg-white/10 hover:bg-white/15 border border-white/20 text-white text-xs font-medium transition-all cursor-pointer"
              >
                Discover Smartphones
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {unavailableCount > 0 && (
                <div className="border border-amber-500/30 rounded-lg p-3 text-xs text-amber-300 flex items-center gap-2 mb-3">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>
                    {unavailableCount} previously saved phone(s) are currently archived or no longer listed.
                  </span>
                </div>
              )}

              {favoritesList.map((item) => {
                const id = item.phone_id;
                const regPrice = Number(item.regular_price || 0);
                const effPrice = Number(item.effective_price || item.regular_price || 0);
                const hasOffer = Boolean(item.active_offer?.has_active_offer);
                const isSoldOut = item.availability === 'SOLD_OUT';

                return (
                  <div
                    key={id}
                    className="flex items-center justify-between gap-3 bg-transparent border border-theme-border rounded-lg p-3 hover:border-white/20 transition-colors"
                  >
                    {/* Thumbnail & Info */}
                    <div
                      className="flex items-center gap-3 flex-1 cursor-pointer min-w-0"
                      onClick={() => {
                        onViewPhoneDetails && onViewPhoneDetails(item);
                        onClose();
                      }}
                    >
                      <div className="w-14 h-14 bg-[#080D1A] rounded p-1 flex items-center justify-center shrink-0 border border-theme-border">
                        {item.main_photo ? (
                          <img
                            src={item.main_photo}
                            alt={item.name}
                            className="max-h-full max-w-full object-contain"
                          />
                        ) : (
                          <span className="text-xs text-theme-textMuted">SK LABA</span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-normal uppercase tracking-wider text-theme-textMuted">
                          {item.brand_name}
                        </span>
                        <h4 className="text-xs font-medium text-white truncate hover:text-sky-300">
                          {item.name}
                        </h4>

                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-medium text-white">
                            ${effPrice.toLocaleString()}
                          </span>
                          {hasOffer && (
                            <span className="text-[10px] text-theme-textMuted line-through">
                              ${regPrice.toLocaleString()}
                            </span>
                          )}
                          <span className="text-[10px] font-normal px-1.5 py-0.5 rounded border border-white/10 text-theme-textSecondary">
                            {item.availability_label || item.availability}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {!isSoldOut && (
                        <button
                          type="button"
                          onClick={() => {
                            onReservePhone && onReservePhone(item);
                            onClose();
                          }}
                          className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 border border-white/20 text-white text-xs font-medium transition-all cursor-pointer"
                        >
                          Reserve
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => removeFavorite(id)}
                        className="p-1.5 rounded-lg border border-theme-border bg-transparent hover:bg-white/[0.04] text-theme-textSecondary hover:text-red-400 transition-colors cursor-pointer"
                        title="Remove from favourites"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
