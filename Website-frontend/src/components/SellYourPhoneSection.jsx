import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight } from 'lucide-react';
import sellPhoneVideo from '../assets/images/sell-your-phone.mp4';
import sellPhonePoster from '../assets/images/sell-your-phone-poster.webp';

/**
 * SellYourPhoneSection
 * 
 * Clean, modern layout in normal document flow:
 * 1. Sell Your Phone Content (Heading, description, CTA)
 * 2. Comfortable breathing space
 * 3. Video visual container (unobstructed, naturally placed below CTA with 4-way feathering)
 * 4. Intentional bottom separation before Current Special Offers
 */
export default function SellYourPhoneSection({ onNavigateToSellYourPhone }) {
  const containerRef = useRef(null);
  const videoRef = useRef(null);

  const [shouldLoadVideo, setShouldLoadVideo] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Check user preference for reduced motion
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e) => setPrefersReducedMotion(e.matches);
    try {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } catch {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);

  // Performance: Defer video loading until near viewport via IntersectionObserver
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setShouldLoadVideo(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoadVideo(true);
          observer.disconnect();
        }
      },
      { rootMargin: '300px' }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, []);

  // Respect autoplay restrictions: ensure muted play once loaded
  useEffect(() => {
    if (!shouldLoadVideo || prefersReducedMotion || videoError) return;
    const video = videoRef.current;
    if (!video) return;

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Autoplay may be restricted by browser; poster remains visible
      });
    }
  }, [shouldLoadVideo, prefersReducedMotion, videoError]);

  return (
    <section
      ref={containerRef}
      aria-labelledby="sell-phone-heading"
      className="relative w-full overflow-hidden select-none bg-gradient-to-b from-[#050914] via-[#050914] to-black pt-12 sm:pt-16 md:pt-20 pb-12 sm:pb-16 md:pb-20"
    >
      {/* Background ambient lighting/glows - matching SK LABA PHONE brand red & blue */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] sm:w-[600px] md:w-[900px] h-[300px] sm:h-[450px] bg-gradient-to-r from-red-600/10 via-blue-600/10 to-transparent rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      {/* 1. Sell Your Phone Content Block (Heading, Description, CTA) */}
      <div className="relative z-20 mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 text-center space-y-3 sm:space-y-4 mb-6 sm:mb-8 md:mb-10">
        <h2
          id="sell-phone-heading"
          className="text-2xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-tight drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]"
        >
          Sell Your Phone.
        </h2>

        <p className="max-w-xl mx-auto text-xs sm:text-sm text-slate-300 font-normal drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] px-2">
          Turn your old smartphone into cash. List your phone with SK LABA PHONE and connect with genuine buyers.
        </p>

        <div className="pt-1 sm:pt-2">
          <button
            type="button"
            onClick={onNavigateToSellYourPhone}
            aria-label="Sell Your Phone"
            className="relative inline-flex items-center justify-center p-[1px] rounded-full bg-gradient-to-r from-red-600 via-blue-700 to-blue-900 hover:from-red-500 hover:via-blue-600 hover:to-blue-800 transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] shadow-xl shadow-black/80 group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050914]"
          >
            <span className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-full bg-black group-hover:bg-neutral-950 text-white text-xs sm:text-sm font-medium transition-colors duration-200 min-h-[44px]">
              <span>Sell Your Phone</span>
              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </button>
        </div>
      </div>

      {/* 2. Video Visual Area in Normal Flow (Completely unobstructed, naturally placed below CTA with 4-way feathering) */}
      <div className="relative w-full max-w-[1920px] mx-auto px-2 sm:px-4 md:px-6">
        <div className="relative w-full aspect-video max-h-[760px] flex items-center justify-center overflow-hidden pointer-events-none select-none bg-black/40">
          {/* Seamless 4-Way Edge Feathering - softly dissolves the video into the surrounding dark theme */}
          <div
            className="absolute inset-x-0 top-0 h-16 sm:h-24 md:h-32 bg-gradient-to-b from-[#050914] via-[#050914]/80 to-transparent pointer-events-none z-10"
            aria-hidden="true"
          />
          <div
            className="absolute inset-x-0 bottom-0 h-20 sm:h-32 md:h-44 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none z-10"
            aria-hidden="true"
          />
          <div
            className="absolute inset-y-0 left-0 w-8 sm:w-20 md:w-32 bg-gradient-to-r from-[#050914] via-[#050914]/70 to-transparent pointer-events-none z-10"
            aria-hidden="true"
          />
          <div
            className="absolute inset-y-0 right-0 w-8 sm:w-20 md:w-32 bg-gradient-to-l from-[#050914] via-[#050914]/70 to-transparent pointer-events-none z-10"
            aria-hidden="true"
          />

          {/* Stable Poster / Fallback Image */}
          <img
            src={sellPhonePoster}
            alt=""
            aria-hidden="true"
            loading="lazy"
            decoding="async"
            className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-700 ease-out z-0 ${
              isVideoLoaded && !prefersReducedMotion ? 'opacity-0' : 'opacity-100'
            }`}
          />

          {/* Video Element */}
          {shouldLoadVideo && !prefersReducedMotion && !videoError && (
            <video
              ref={videoRef}
              src={sellPhoneVideo}
              poster={sellPhonePoster}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              onCanPlay={() => setIsVideoLoaded(true)}
              onPlaying={() => setIsVideoLoaded(true)}
              onError={() => setVideoError(true)}
              aria-hidden="true"
              tabIndex={-1}
              className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-700 ease-out z-0 ${
                isVideoLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            />
          )}
        </div>
      </div>
    </section>
  );
}
