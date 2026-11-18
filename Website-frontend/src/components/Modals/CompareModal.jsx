import React, { useState, useEffect, useMemo } from 'react';
import { X, Trash2, AlertCircle } from 'lucide-react';
import phoneService from '../../services/phoneService';
import { useFavoritesAndCompare } from '../../hooks/useFavoritesAndCompare';
import { useCurrencyConverter } from '../../hooks/useCurrencyConverter';
import { resolveImageUrl } from '../../utils/imageHelper';

function RotatingPhoneImage({ phone }) {
  const allPhotos = useMemo(() => {
    const list = [];
    const add = (url) => {
      if (url && typeof url === 'string') {
        const trimmed = url.trim();
        if (trimmed && !list.includes(trimmed)) {
          list.push(trimmed);
        }
      }
    };

    // 1. Photos array or JSON string
    if (Array.isArray(phone?.photos)) {
      phone.photos.forEach(add);
    } else if (typeof phone?.photos === 'string' && phone.photos.trim().startsWith('[')) {
      try {
        const parsed = JSON.parse(phone.photos);
        if (Array.isArray(parsed)) parsed.forEach(add);
      } catch (e) {}
    } else if (typeof phone?.photos === 'string' && phone.photos.includes(',')) {
      phone.photos.split(',').forEach(add);
    } else if (phone?.photos) {
      add(phone.photos);
    }

    // 2. Main photo
    if (phone?.main_photo) add(phone.main_photo);

    // 3. Color options photos
    if (Array.isArray(phone?.colour_options)) {
      phone.colour_options.forEach((c) => {
        if (Array.isArray(c?.photos)) {
          c.photos.forEach(add);
        } else if (typeof c?.photos === 'string' && c.photos.trim().startsWith('[')) {
          try {
            const parsed = JSON.parse(c.photos);
            if (Array.isArray(parsed)) parsed.forEach(add);
          } catch (e) {}
        }
      });
    }

    // 4. photo_urls
    if (Array.isArray(phone?.photo_urls)) {
      phone.photo_urls.forEach(add);
    }

    return list;
  }, [phone]);

  const [currentIdx, setCurrentIdx] = useState(0);

  // Auto change image in every 4 seconds to show all available images
  useEffect(() => {
    if (allPhotos.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % allPhotos.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [allPhotos.length]);

  const currentPhoto = allPhotos[currentIdx] ? resolveImageUrl(allPhotos[currentIdx]) : null;

  return (
    <div className="relative aspect-[3/3.4] w-full bg-[#080D1A] rounded p-2 mb-2 flex items-center justify-center overflow-hidden group">
      {currentPhoto ? (
        <img
          key={currentPhoto}
          src={currentPhoto}
          alt={phone.name}
          className="max-h-full max-w-full object-contain transition-all duration-500 animate-in fade-in"
        />
      ) : (
        <span className="text-xs text-theme-textMuted">SK LABA</span>
      )}

      {/* Indicator dots if multiple photos */}
      {allPhotos.length > 1 && (
        <div className="absolute bottom-1.5 left-0 right-0 flex justify-center gap-1 pointer-events-none">
          {allPhotos.map((_, i) => (
            <span
              key={i}
              className={`h-1 rounded-full transition-all duration-300 ${
                i === currentIdx ? 'w-3 bg-white' : 'w-1 bg-white/30'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CompareModal({
  compareIds = [],
  onClose,
  onReservePhone,
  onInquirePhone,
}) {
  const { removeCompare, clearCompare } = useFavoritesAndCompare();
  const { convertKrwToLkr, formatKrw, formatLkr } = useCurrencyConverter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [comparisonData, setComparisonData] = useState(null);

  useEffect(() => {
    if (compareIds.length < 2) {
      setComparisonData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    phoneService
      .comparePhones(compareIds)
      .then((res) => {
        if (res.data?.success && res.data?.data) {
          setComparisonData(res.data.data);
        } else {
          setError('Failed to load comparison data.');
        }
      })
      .catch((err) => {
        setError(err.message || 'Could not fetch phone comparison.');
      })
      .finally(() => setLoading(false));
  }, [compareIds]);

  const phones = comparisonData?.phones || [];

  const comparisonRows = useMemo(() => [
    {
      key: 'name',
      label: 'Phone Model',
      getValue: (p) => p.name || '—'
    },
    {
      key: 'brand_name',
      label: 'Brand',
      getValue: (p) => p.brand_name || '—'
    },
    {
      key: 'price',
      label: 'Price',
      getValue: (p) => {
        const reg = Number(p.regular_price || p.price || 0);
        const eff = Number(p.effective_price || p.price || 0);
        return (
          <div className="flex flex-col">
            <span className="font-medium text-white">{formatKrw(eff || reg)}</span>
            {(eff || reg) > 0 && (
              <span className="text-[10px] text-theme-textMuted">
                {formatLkr(convertKrwToLkr(eff || reg))}
              </span>
            )}
          </div>
        );
      }
    },
    {
      key: 'phone_condition',
      label: 'Condition',
      getValue: (p) => p.phone_condition || '—'
    },
    {
      key: 'battery_health',
      label: 'Battery Health',
      getValue: (p) => {
        const raw = p.battery_health ? String(p.battery_health).trim() : '';
        const formattedPct = raw ? (raw.endsWith('%') ? raw : `${raw}%`) : '';
        if (p.is_genuine_battery !== undefined && p.is_genuine_battery !== null) {
          const status = (p.is_genuine_battery !== false && p.is_genuine_battery !== 0) ? 'Genuine Battery' : 'Battery Replaced';
          return formattedPct ? `${status} | ${formattedPct}` : status;
        }
        return formattedPct || '—';
      }
    },
    {
      key: 'display_size',
      label: 'Screen Size',
      getValue: (p) => p.display_size || '—'
    },
    {
      key: 'warranty',
      label: 'Warranty',
      getValue: (p) => p.warranty || '—'
    },
    {
      key: 'availability',
      label: 'Availability',
      getValue: (p) => p.availability_label || p.availability || 'In Stock'
    }
  ], [convertKrwToLkr, formatKrw, formatLkr]);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/70 backdrop-blur-sm transition-opacity duration-300">
      {/* Click outside backdrop (left area) */}
      <div
        className="absolute inset-0 cursor-pointer"
        onClick={onClose}
        aria-label="Close drawer"
      />

      {/* Right-Side Slide-Over Drawer */}
      <div className="absolute top-0 right-0 bottom-0 h-full w-full sm:w-[90%] md:w-[75%] lg:w-[65%] bg-[#0A0F1E] border-l border-theme-border shadow-[-24px_0_60px_rgba(0,0,0,0.9)] flex flex-col z-10 animate-in slide-in-from-right duration-300 ease-out">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-theme-border bg-theme-surface/90 backdrop-blur-md sticky top-0 z-20 shrink-0">
          <div>
            <h2 className="text-sm font-medium text-white">Side-by-Side Phone Comparison</h2>
            <p className="text-xs text-theme-textMuted">
              Comparing {compareIds.length} of 3 maximum phones. Saved in your browser.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                clearCompare();
                onClose();
              }}
              className="p-1.5 px-3 rounded-lg border border-theme-border bg-transparent hover:bg-white/[0.04] text-theme-textSecondary hover:text-red-400 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg border border-theme-border bg-transparent hover:bg-white/[0.04] text-theme-textSecondary hover:text-white transition-colors cursor-pointer"
              title="Close drawer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto px-6 py-6 flex-1">
          {loading ? (
            <div className="py-20 text-center">
              <p className="text-xs text-theme-textSecondary">
                Generating comprehensive technical comparison...
              </p>
            </div>
          ) : error ? (
            <div className="py-16 text-center max-w-md mx-auto">
              <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
              <p className="text-xs text-red-300 mb-2">{error}</p>
              <p className="text-xs text-theme-textMuted mb-4">
                Please select at least 2 active phones to compare.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 px-4 rounded-lg bg-white/10 hover:bg-white/15 border border-white/20 text-white text-xs font-medium transition-all cursor-pointer"
              >
                Close Comparison
              </button>
            </div>
          ) : compareIds.length < 2 ? (
            <div className="py-16 text-center">
              <p className="text-xs text-theme-textSecondary mb-2 font-normal">
                You need at least 2 phones to view comparison.
              </p>
              <p className="text-xs text-theme-textMuted mb-4 font-normal">
                Click the Compare button on phone cards to add another phone.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 px-4 rounded-lg bg-white/10 hover:bg-white/15 border border-white/20 text-white text-xs font-medium transition-all cursor-pointer"
              >
                Browse Phones
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Phone Headers Columns */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {phones.map((p) => {
                  const id = p.phone_id || p.id;
                  const regPrice = Number(p.regular_price || p.price || 0);
                  const effPrice = Number(p.effective_price || p.price || 0);
                  const isSoldOut = p.availability === 'SOLD_OUT';

                  return (
                    <div
                      key={id}
                      className="relative bg-transparent border border-theme-border rounded-lg p-3 flex flex-col justify-between"
                    >
                      <button
                        type="button"
                        onClick={() => removeCompare(id)}
                        className="absolute top-2 right-2 p-1 rounded-md bg-black/50 text-theme-textMuted hover:text-red-400 hover:bg-black transition-colors cursor-pointer z-10"
                        title="Remove from comparison"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>

                      <div>
                        {/* Auto-rotating Phone Images (changes every 4s through all photos) */}
                        <RotatingPhoneImage phone={p} />

                        <span className="text-[10px] font-normal uppercase tracking-wider text-theme-textMuted">
                          {p.brand_name}
                        </span>
                        <h3 className="text-xs font-medium text-white truncate mb-1">
                          {p.name}
                        </h3>

                        <div className="flex flex-col mb-2">
                          <div className="flex items-baseline gap-2">
                            <span className="text-xs font-medium text-white">
                              {formatKrw(effPrice)}
                            </span>
                            {p.active_offer?.has_active_offer && (
                              <span className="text-[10px] text-theme-textMuted line-through">
                                {formatKrw(regPrice)}
                              </span>
                            )}
                          </div>
                          {effPrice > 0 && (
                            <span className="text-[10px] text-white font-normal">
                              {formatLkr(convertKrwToLkr(effPrice))}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-theme-border/50 flex flex-col gap-1.5">
                        <button
                          type="button"
                          onClick={() => onReservePhone && onReservePhone(p)}
                          disabled={isSoldOut}
                          className={`w-full py-1.5 px-3 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                            isSoldOut
                              ? 'bg-transparent text-theme-textMuted border border-theme-border cursor-not-allowed'
                              : 'bg-white/10 hover:bg-white/15 border border-white/20 text-white'
                          }`}
                        >
                          {isSoldOut ? 'Sold Out' : 'Reserve'}
                        </button>

                        <button
                          type="button"
                          onClick={() => onInquirePhone && onInquirePhone(p)}
                          className="w-full py-1.5 px-3 rounded-lg bg-transparent hover:bg-white/[0.04] border border-theme-border text-theme-textSecondary hover:text-white text-xs font-medium transition-colors cursor-pointer text-center"
                        >
                          Inquire
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Technical Comparison Table */}
              <div className="bg-transparent border border-theme-border rounded-lg overflow-x-auto mt-6">
                <div className="px-3.5 py-2.5 bg-white/[0.02] border-b border-theme-border text-[11px] font-medium uppercase tracking-wider text-theme-textMuted">
                  Comparison
                </div>
                <div className="divide-y divide-theme-border/60 min-w-[480px]">
                  {comparisonRows.map((row, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-2 md:grid-cols-4 p-3 text-xs hover:bg-white/[0.02] transition-colors items-center"
                    >
                      <div className="text-theme-textMuted col-span-2 md:col-span-1 mb-1 md:mb-0 font-normal">
                        {row.label}
                      </div>

                      {phones.map((p) => {
                        const id = p.phone_id || p.id;
                        const val = row.getValue(p);
                        return (
                          <div
                            key={id}
                            className="text-white pr-2 font-normal break-words"
                          >
                            {val}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
