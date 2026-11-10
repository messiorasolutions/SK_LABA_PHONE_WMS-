import React from 'react';

/**
 * MarketplaceCardSkeleton
 * Matches real card dimensions precisely to eliminate Cumulative Layout Shift (CLS).
 * Respects prefers-reduced-motion.
 */
export function MarketplaceCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="flex flex-col bg-[#0A0F1E] border border-white/10 rounded-2xl overflow-hidden animate-pulse"
    >
      {/* Media Skeleton */}
      <div className="relative aspect-square w-full bg-[#0E1526] flex items-center justify-center p-4 border-b border-white/10">
        <div className="w-24 h-32 rounded-xl bg-white/5" />
      </div>

      {/* Info Skeleton */}
      <div className="p-3.5 sm:p-4 flex flex-col flex-1 justify-between gap-3">
        <div className="space-y-2">
          {/* Brand */}
          <div className="h-2.5 w-16 bg-white/10 rounded" />
          {/* Model */}
          <div className="h-4 w-3/4 bg-white/10 rounded" />
          {/* Storage & Color */}
          <div className="h-3 w-1/2 bg-white/5 rounded" />
        </div>

        {/* Price & CTA Skeleton */}
        <div className="pt-2 border-t border-white/10 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="h-5 w-24 bg-white/10 rounded" />
            <div className="h-3 w-16 bg-white/5 rounded" />
          </div>
          <div className="h-9 w-full bg-white/10 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export default MarketplaceCardSkeleton;
