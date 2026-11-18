import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import sellPhoneVideo from '../assets/images/v1.mp4';
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
const VIDEO_START_TIME = 1; // Start playback at 0:00:01

export default function SellYourPhoneSection({ onNavigateToSellYourPhone }) {
  const { t } = useTranslation();
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
  // Ensures critical storefront API requests complete unhindered before video stream is requested
  useEffect(() => {
    let isMounted = true;
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      const timer = setTimeout(() => {
        if (isMounted) setShouldLoadVideo(true);
      }, 1500);
      return () => {
        isMounted = false;
        clearTimeout(timer);
      };
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
            window.requestIdleCallback(() => {
              if (isMounted) setShouldLoadVideo(true);
            }, { timeout: 2000 });
          } else {
            setTimeout(() => {
              if (isMounted) setShouldLoadVideo(true);
            }, 300);
          }
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(el);

    return () => {
      isMounted = false;
      observer.disconnect();
    };
  }, []);

  // Respect autoplay restrictions: ensure muted play once loaded
  useEffect(() => {
    if (!shouldLoadVideo || prefersReducedMotion || videoError) return;
    const video = videoRef.current;
    if (!video) return;

    if (video.currentTime < VIDEO_START_TIME) {
      video.currentTime = VIDEO_START_TIME;
    }

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
      className="relative w-full overflow-hidden select-none bg-gradient-to-b from-[#050914] via-[#050914] to-black pt-12 sm:pt-16 md:pt-20 pb-0"
    >
      {/* Background ambient lighting/glows - matching SK LABA PHONE brand red & blue */}
      <div
        className="absolute top-20 sm:top-28 left-1/2 -translate-x-1/2 w-[320px] sm:w-[600px] md:w-[900px] h-[250px] sm:h-[350px] bg-gradient-to-r from-red-600/10 via-blue-600/10 to-transparent rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      {/* 1. Sell Your Phone Content Block (Heading, Description, CTA) */}
      <div className="relative z-20 mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 text-center space-y-3 sm:space-y-4 mb-6 sm:mb-8 md:mb-10">
        <h2
          id="sell-phone-heading"
          className="text-2xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-tight drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]"
        >
          {t('sellYourPhone.title')}
        </h2>

        <p className="max-w-3xl sm:max-w-4xl md:max-w-none mx-auto text-xs sm:text-sm text-slate-300 font-normal drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] px-2 md:whitespace-nowrap">
          {t('sellYourPhone.desc') || 'Turn your old smartphone into cash. List your phone with SK LABA PHONE and connect with genuine buyers.'}
        </p>

        <div className="pt-1 sm:pt-2">
          <button
            type="button"
            onClick={onNavigateToSellYourPhone}
            aria-label="Sell Your Phone"
            className="relative inline-flex items-center justify-center p-[1px] rounded-full bg-gradient-to-r from-red-600 via-blue-700 to-blue-900 hover:from-red-500 hover:via-blue-600 hover:to-blue-800 transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] shadow-xl shadow-black/80 group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050914]"
          >
            <span className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-full bg-black group-hover:bg-neutral-950 text-white text-xs sm:text-sm font-medium transition-colors duration-200 min-h-[44px]">
              <span>{t('sellYourPhone.btn')}</span>
              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </button>
        </div>
      </div>

      {/* 2. Video Visual Area in Normal Flow (Expansive width and height while strictly maintaining 16:9 ratio to prevent zoom) */}
      <div className="relative w-full max-w-[1550px] mx-auto px-2 sm:px-4 md:px-6">
        <div
          className="relative w-full aspect-video max-h-[850px] flex items-center justify-center overflow-hidden pointer-events-none select-none"
          style={{
            maskImage: 'linear-gradient(to bottom, transparent 0%, black 20px, black calc(100% - 20px), transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 20px, black calc(100% - 20px), transparent 100%)',
          }}
        >
          {/* Subtle Edge Feathering - softly dissolves the video into the surrounding dark theme */}
          <div
            className="absolute inset-x-0 top-0 h-12 sm:h-16 bg-gradient-to-b from-[#050914] to-transparent pointer-events-none z-10"
            aria-hidden="true"
          />
          <div
            className="absolute inset-x-0 bottom-0 h-10 sm:h-14 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none z-10"
            aria-hidden="true"
          />
          <div
            className="absolute inset-y-0 left-0 w-8 sm:w-16 bg-gradient-to-r from-[#050914] to-transparent pointer-events-none z-10"
            aria-hidden="true"
          />
          <div
            className="absolute inset-y-0 right-0 w-8 sm:w-16 bg-gradient-to-l from-[#050914] to-transparent pointer-events-none z-10"
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
              src={`${sellPhoneVideo}#t=${VIDEO_START_TIME}`}
              poster={sellPhonePoster}
              autoPlay
              muted
              playsInline
              preload="metadata"
              onLoadedMetadata={() => {
                if (videoRef.current && videoRef.current.currentTime < VIDEO_START_TIME) {
                  videoRef.current.currentTime = VIDEO_START_TIME;
                }
              }}
              onCanPlay={() => {
                if (videoRef.current && videoRef.current.currentTime < VIDEO_START_TIME) {
                  videoRef.current.currentTime = VIDEO_START_TIME;
                }
                setIsVideoLoaded(true);
              }}
              onPlaying={() => {
                if (videoRef.current && videoRef.current.currentTime < VIDEO_START_TIME - 0.2) {
                  videoRef.current.currentTime = VIDEO_START_TIME;
                }
                setIsVideoLoaded(true);
              }}
              onTimeUpdate={() => {
                if (videoRef.current && videoRef.current.currentTime < VIDEO_START_TIME - 0.2) {
                  videoRef.current.currentTime = VIDEO_START_TIME;
                }
              }}
              onEnded={() => {
                if (videoRef.current) {
                  videoRef.current.currentTime = VIDEO_START_TIME;
                  videoRef.current.play().catch(() => {});
                }
              }}
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
