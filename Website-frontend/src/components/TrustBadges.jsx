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
    <section className="relative z-20 w-full bg-theme-bg py-6 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {TRUST_FEATURES.map((feature) => {
            const IconComponent = ICON_COMPONENTS[feature.icon] || ShieldCheck;

            return (
              <div
                key={feature.id}
                className="flex items-center gap-3.5 select-none transition-transform duration-200 hover:translate-x-1"
              >
                <div className="w-10 h-10 rounded-xl bg-theme-surface/80 border border-theme-borderMedium flex items-center justify-center text-theme-textSecondary shrink-0">
                  <IconComponent className="w-5 h-5 text-theme-textSecondary" />
                </div>

                <div className="min-w-0">
                  <h4 className="text-xs sm:text-sm font-semibold text-theme-textPrimary leading-tight truncate">
                    {feature.title}
                  </h4>
                  <p className="text-[11px] text-theme-textSecondary mt-0.5 font-normal truncate">
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
