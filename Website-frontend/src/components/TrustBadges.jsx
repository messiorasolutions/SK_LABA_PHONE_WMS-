import React from 'react';
import { ShieldCheck, Truck, CreditCard, Headphones } from 'lucide-react';
import { TRUST_FEATURES } from '../constants/siteConfig';

const ICON_COMPONENTS = {
  ShieldCheck,
  Truck,
  CreditCard,
  Headphones,
};

export default function TrustBadges() {
  return (
    <section className="relative z-20 w-full bg-theme-bg py-5 sm:py-7 border-y border-white/[0.04]">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-6">
          {TRUST_FEATURES.map((feature) => {
            const IconComponent = ICON_COMPONENTS[feature.icon] || ShieldCheck;

            return (
              <div
                key={feature.id}
                className="flex items-center gap-2.5 sm:gap-3.5 select-none transition-transform duration-200 hover:translate-x-1 py-1"
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-theme-surface/80 border border-theme-borderMedium flex items-center justify-center text-theme-textSecondary shrink-0">
                  <IconComponent className="w-4 h-4 sm:w-5 sm:h-5 text-theme-textSecondary" />
                </div>

                <div className="min-w-0 flex-1">
                  <h4 className="text-[11px] sm:text-xs md:text-sm font-semibold text-theme-textPrimary leading-tight truncate">
                    {feature.title}
                  </h4>
                  <p className="text-[10px] sm:text-[11px] text-theme-textSecondary mt-0.5 font-normal line-clamp-1 sm:line-clamp-2 leading-tight">
                    {feature.subtitle}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
