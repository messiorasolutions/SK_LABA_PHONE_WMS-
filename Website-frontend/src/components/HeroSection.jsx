import React from 'react';
import { ShoppingCart, ArrowRight } from 'lucide-react';
import { useDispatch } from 'react-redux';
import mainBannerImg from '../assets/images/main.png';
import { HERO_CONTENT } from '../constants/siteConfig';
import { addToCart } from '../actions/heroActions';

export default function HeroSection() {
  const dispatch = useDispatch();

  return (
    <section className="relative overflow-hidden bg-theme-bg min-h-[580px] lg:min-h-[680px] flex items-center pt-24 sm:pt-28 pb-12 sm:pb-16">
      {/* Background Hero Image with Phones, Glowing Ring & Atmosphere */}
      <div className="absolute inset-0 z-0">
        <img
          src={mainBannerImg}
          alt={HERO_CONTENT.headlineAccent}
          className="w-full h-full object-cover object-right lg:object-center opacity-90 lg:opacity-100"
        />
        {/* Soft dark gradient overlays on the left to ensure crisp text contrast */}
        <div className="absolute inset-0 bg-gradient-to-r from-theme-bg via-theme-bg/85 lg:via-theme-bg/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-theme-bg via-transparent to-transparent opacity-60" />
      </div>

      {/* Hero Content Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="max-w-xl">
          
          {/* Eyebrow / Tagline */}
          <div className="inline-block mb-3.5">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.22em] text-theme-textSecondary">
              {HERO_CONTENT.eyebrow}
            </span>
          </div>

          {/* Main Title: "Find Your Next" (White) + "Smartphone" (Electric Sky/Cyan Glow) */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-theme-textPrimary tracking-tight leading-[1.08] mb-5">
            {HERO_CONTENT.headlineWhite} <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-sky-300 to-blue-400 drop-shadow-[0_0_24px_rgba(56,189,248,0.35)]">
              {HERO_CONTENT.headlineAccent}
            </span>
          </h1>

          {/* Subtitle Description */}
          <p className="text-sm sm:text-base md:text-lg text-theme-textSecondary font-normal leading-relaxed max-w-lg mb-8">
            {HERO_CONTENT.description}
          </p>

          {/* Action CTA Buttons */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Primary Action Button */}
            <button
              type="button"
              onClick={() => dispatch(addToCart())}
              className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full bg-theme-accent hover:bg-theme-accentHover text-white font-semibold text-sm md:text-base shadow-lg shadow-blue-600/35 transition-all duration-200 hover:scale-[1.03] active:scale-[0.98] cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>{HERO_CONTENT.primaryBtnText}</span>
              <ArrowRight className="w-4 h-4 ml-0.5" />
            </button>

            {/* Secondary Action Button */}
            <button
              type="button"
              className="inline-flex items-center justify-center px-6 py-3.5 rounded-full bg-theme-input/70 hover:bg-theme-hover border border-theme-borderMedium hover:border-theme-borderLight text-white font-semibold text-sm md:text-base backdrop-blur-sm transition-all duration-200 hover:scale-[1.03] active:scale-[0.98] cursor-pointer"
            >
              {HERO_CONTENT.secondaryBtnText}
            </button>
          </div>

        </div>
      </div>
    </section>
  );
}
