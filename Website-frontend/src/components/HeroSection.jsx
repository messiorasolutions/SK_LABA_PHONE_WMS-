import React from 'react';
import { ShoppingCart, ArrowRight } from 'lucide-react';
import { useDispatch } from 'react-redux';
import mainBannerWebp from '../assets/images/main.webp';
import mainBannerImg from '../assets/images/main.png';
import { HERO_CONTENT } from '../constants/siteConfig';
import { setActiveTab } from '../actions/heroActions';

export default function HeroSection() {
  const dispatch = useDispatch();

  const handleShopSmartphones = () => {
    dispatch(setActiveTab('Smartphones'));
    const el = document.getElementById('smartphones');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.location.hash = '#smartphones';
    }
  };

  const handleExploreDeals = () => {
    dispatch(setActiveTab('Smartphones'));
    const el = document.getElementById('smartphones');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative overflow-hidden bg-theme-bg min-h-[580px] sm:min-h-[580px] lg:min-h-[700px] flex items-center pt-24 sm:pt-28 md:pt-32 pb-14 sm:pb-12 md:pb-16">
      {/* Background Hero Image with Phones, Glowing Ring & Atmosphere */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <picture>
          <source srcSet={mainBannerWebp} type="image/webp" />
          <img
            src={mainBannerImg}
            alt={HERO_CONTENT.headlineAccent}
            fetchpriority="high"
            decoding="sync"
            width={1983}
            height={793}
            className="w-full h-full object-cover object-[80%_35%] sm:object-right lg:object-center opacity-85 sm:opacity-90 lg:opacity-100"
          />
        </picture>
        {/* Soft dark gradient overlays on the left to ensure crisp text contrast */}
        <div className="absolute inset-0 bg-gradient-to-r from-theme-bg via-theme-bg/90 sm:via-theme-bg/85 lg:via-theme-bg/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-theme-bg via-transparent to-transparent opacity-75 sm:opacity-60" />
      </div>

      {/* Hero Content Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="max-w-xl">
          {/* Eyebrow / Tagline */}
          <div className="mb-2.5 sm:mb-3.5">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.18em] sm:tracking-[0.22em] text-theme-textSecondary">
              {HERO_CONTENT.eyebrow}
            </span>
          </div>

          {/* Main Title: "Find Your Next Smartphone" - Clean white, non-bold, official */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-normal text-white tracking-tight leading-[1.15] sm:leading-[1.12] mb-4 sm:mb-8">
            Find Your Next <br />
            Smartphone
          </h1>

          {/* Action CTA Buttons (Moved down on mobile to let the phone banner show clearly) */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mt-20 sm:mt-6">
            {/* Primary Action Button */}
            <button
              type="button"
              onClick={handleShopSmartphones}
              className="relative inline-flex items-center justify-center p-[1px] rounded-full bg-gradient-to-r from-red-600 via-blue-700 to-blue-900 hover:from-red-500 hover:via-blue-600 hover:to-blue-800 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-black/60 group cursor-pointer"
            >
              <span className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-5 sm:px-6 py-3 sm:py-3.5 rounded-full bg-black group-hover:bg-neutral-950 text-white font-normal text-xs sm:text-sm md:text-base transition-colors duration-200">
                <ShoppingCart className="w-4 h-4 shrink-0" />
                <span>{HERO_CONTENT.primaryBtnText}</span>
                <ArrowRight className="w-4 h-4 shrink-0 ml-0.5 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </button>

            {/* Secondary Action Button */}
            <button
              type="button"
              onClick={handleExploreDeals}
              className="inline-flex items-center justify-center px-5 sm:px-6 py-3 sm:py-3.5 rounded-full bg-black/60 hover:bg-black border border-white/15 hover:border-white/30 text-white font-normal text-xs sm:text-sm md:text-base backdrop-blur-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              {HERO_CONTENT.secondaryBtnText}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
