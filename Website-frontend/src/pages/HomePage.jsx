import React, { useState, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { ArrowRight, Tag, Star, MessageSquareHeart, ChevronLeft, ChevronRight } from 'lucide-react';
import HeroSection from '../components/HeroSection';
import TrustBadges from '../components/TrustBadges';
import { getActiveOffers } from '../services/offerService';
import phoneService from '../services/phoneService';
import { reviewService } from '../services/reviewService';
import { setActiveTab } from '../actions/heroActions';
import upgradeVideo from '../assets/images/upgrade_vedio.mp4';
import aboutImg from '../assets/images/about.jpg';

function ReviewComment({ comment }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isLong = comment && comment.length > 80;

  if (!isLong) {
    return <span>&ldquo;{comment}&rdquo;</span>;
  }

  return (
    <span>
      &ldquo;{isExpanded ? comment : `${comment.slice(0, 80)}...`}&rdquo;
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsExpanded(!isExpanded);
        }}
        className="text-slate-400 hover:text-white ml-2 text-xs font-normal not-italic underline cursor-pointer transition-colors inline-block"
      >
        {isExpanded ? 'See less' : 'See more..'}
      </button>
    </span>
  );
}

function OfferCard({ offer, allPhones, onNavigate }) {
  const regularPrice = Number(offer.regular_price || 0);
  const offerPrice = Number(offer.offer_price || 0);
  const savings = regularPrice > offerPrice ? regularPrice - offerPrice : 0;

  // Format discount label (e.g. 14.2% OFF)
  const discountLabel = React.useMemo(() => {
    if (offer.discount_percentage) {
      const num = Number(offer.discount_percentage);
      return (Number.isInteger(num) ? num : num.toFixed(1)) + '% OFF';
    }
    if (regularPrice > 0 && offerPrice > 0 && regularPrice > offerPrice) {
      const pct = ((regularPrice - offerPrice) / regularPrice) * 100;
      return (Number.isInteger(pct) ? pct : pct.toFixed(1)) + '% OFF';
    }
    return 'SPECIAL OFFER';
  }, [offer, regularPrice, offerPrice]);

  // Find matching phone from allPhones
  const matchedPhone = React.useMemo(() => {
    if (!Array.isArray(allPhones) || allPhones.length === 0) return null;
    if (Array.isArray(offer.phone_ids) && offer.phone_ids.length > 0) {
      const found = allPhones.find((p) =>
        offer.phone_ids.some((id) => String(id) === String(p.phone_id || p.id))
      );
      if (found) return found;
    }
    if (Array.isArray(offer.phones) && offer.phones.length > 0) {
      const found = allPhones.find((p) =>
        offer.phones.some((ph) => String(ph.phone_id || ph.id) === String(p.phone_id || p.id))
      );
      if (found) return found;
    }
    const combined = ((offer.title || '') + ' ' + (offer.description || '')).toLowerCase();
    return allPhones.find((p) => p.name && combined.includes(p.name.toLowerCase())) || null;
  }, [offer, allPhones]);

  // Resolve best photo
  const resolvedPhoto = React.useMemo(() => {
    if (offer.banner_image && typeof offer.banner_image === 'string' && offer.banner_image.trim()) {
      return offer.banner_image;
    }
    if (matchedPhone) {
      if (matchedPhone.main_photo) return matchedPhone.main_photo;
      if (Array.isArray(matchedPhone.photos) && matchedPhone.photos.length > 0) return matchedPhone.photos[0];
      if (typeof matchedPhone.photos === 'string' && matchedPhone.photos.trim()) {
        try {
          const parsed = JSON.parse(matchedPhone.photos);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed[0];
        } catch (e) {}
      }
    }
    if (Array.isArray(offer.phones) && offer.phones.length > 0) {
      const p = offer.phones[0];
      if (p.main_photo) return p.main_photo;
      if (Array.isArray(p.photos) && p.photos.length > 0) return p.photos[0];
    }
    return null;
  }, [offer, matchedPhone]);

  const [imgSrc, setImgSrc] = useState(resolvedPhoto || matchedPhone?.main_photo || '');
  useEffect(() => {
    setImgSrc(resolvedPhoto || matchedPhone?.main_photo || '');
  }, [resolvedPhoto, matchedPhone]);

  const phoneTitle = matchedPhone?.name || offer.title || 'Special Device';
  const offerSubtitle = offer.title && offer.title !== phoneTitle
    ? offer.title
    : (offer.description || 'Avurudu Mega Savings (Limited Stock)');

  return (
    <div
      onClick={() => onNavigate(matchedPhone)}
      className="relative w-full bg-black hover:bg-neutral-950 rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between transition-all duration-300 shadow-xl shadow-black/90 group cursor-pointer overflow-hidden hover:scale-[1.01]"
    >
      {/* Top Media Container: Dark Mode, no container stroke */}
      <div className="relative w-full aspect-[4/5] rounded-xl bg-neutral-950 flex items-center justify-center p-3 overflow-hidden shrink-0 mb-3.5">
        {/* Top-Left: Red Color Stroke & Dark Red Background on 14.2% OFF Badge */}
        <div
          style={{
            backgroundColor: 'rgba(69, 10, 10, 0.85)',
            borderColor: '#ef4444',
            borderWidth: '1px',
            borderStyle: 'solid',
          }}
          className="absolute top-2.5 left-2.5 z-20 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-950/85 backdrop-blur-md border border-red-500 text-red-200 text-[10px] sm:text-[11px] font-normal tracking-wide shadow-md shadow-red-950/60"
        >
          <Tag className="w-3 h-3 text-red-400" style={{ color: '#f87171' }} />
          <span style={{ color: '#fecaca' }}>{discountLabel}</span>
        </div>

        {/* Phone Photo */}
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={phoneTitle}
            className="max-h-[82%] max-w-[82%] object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.95)] transition-transform duration-300 group-hover:scale-105 relative z-10"
            loading="lazy"
            onError={() => {
              if (matchedPhone?.main_photo && imgSrc !== matchedPhone.main_photo) {
                setImgSrc(matchedPhone.main_photo);
              } else if (Array.isArray(matchedPhone?.photos) && matchedPhone.photos[0] && imgSrc !== matchedPhone.photos[0]) {
                setImgSrc(matchedPhone.photos[0]);
              } else {
                setImgSrc('');
              }
            }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-500 relative z-10 text-center px-2">
            <span className="text-[11px] uppercase tracking-widest font-light text-slate-400">SK LABA PHONE</span>
            <span className="text-[10px] text-red-400 mt-0.5">Special Offer</span>
          </div>
        )}
      </div>

      {/* Bottom Details Section with Balanced Spacing */}
      <div className="flex flex-col flex-1 justify-between w-full relative z-10">
        <div>
          {/* Row 1: Active Promotion (No stroke, green color) + Save $X */}
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <span
              style={{ color: '#34d399' }}
              className="inline-flex items-center gap-1.5 text-xs font-normal text-emerald-400"
            >
              <span
                style={{ backgroundColor: '#34d399' }}
                className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"
              />
              <span>Active Promotion</span>
            </span>
            {savings > 0 && (
              <span
                style={{
                  backgroundColor: 'rgba(69, 10, 10, 0.75)',
                  borderColor: 'rgba(239, 68, 68, 0.45)',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  color: '#fca5a5',
                }}
                className="text-[10px] sm:text-[11px] font-normal text-red-300 bg-red-950/75 border border-red-500/40 px-2 py-0.5 rounded-full"
              >
                Save ${Math.round(savings).toLocaleString()}
              </span>
            )}
          </div>

          {/* Row 2: Phone Title */}
          <h3 className="text-sm sm:text-base font-normal text-white leading-snug truncate group-hover:text-slate-200 transition-colors">
            {phoneTitle}
          </h3>

          {/* Row 3: Subtitle / Campaign Name */}
          <p className="text-xs text-slate-400 font-normal mt-1 mb-3.5 line-clamp-1">
            {offerSubtitle}
          </p>

          {/* Row 4: Price Section */}
          <div className="flex items-baseline gap-2.5 mb-3.5">
            <span className="text-lg sm:text-xl font-normal text-white tracking-tight">
              ${Number(offer.offer_price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            {regularPrice > 0 && (
              <span className="text-xs sm:text-sm text-slate-500 line-through font-normal">
                ${regularPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            )}
          </div>
        </div>

        {/* Row 5: CTA Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onNavigate(matchedPhone);
          }}
          className="w-full mt-auto py-2.5 px-4 rounded-full bg-black hover:bg-neutral-900 border border-neutral-700 hover:border-neutral-500 text-white text-xs sm:text-sm font-normal flex items-center justify-center gap-2 transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] shadow-md group/btn cursor-pointer"
        >
          <span>Discover Offer</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover/btn:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
}

export default function HomePage({ onNavigateToSmartphones, onOpenSell, onOpenReview }) {
  const dispatch = useDispatch();
  const [activeOffers, setActiveOffers] = useState([]);
  const tradeInVideoRef = useRef(null);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const reviewsCarouselRef = useRef(null);

  const handleReviewsScroll = (direction) => {
    if (!reviewsCarouselRef.current || reviews.length <= 1) return;
    let nextIndex = activeIndex;
    if (direction === 'left') {
      nextIndex = Math.max(0, activeIndex - 1);
    } else {
      nextIndex = Math.min(reviews.length - 1, activeIndex + 1);
    }
    scrollToIndex(nextIndex);
  };

  const scrollToIndex = (index) => {
    if (!reviewsCarouselRef.current || reviews.length <= 1) return;
    const container = reviewsCarouselRef.current;
    const maxScroll = container.scrollWidth - container.clientWidth;
    if (maxScroll <= 0) return;

    const targetScroll = (index / (reviews.length - 1)) * maxScroll;
    container.scrollTo({
      left: targetScroll,
      behavior: 'smooth',
    });
    setActiveIndex(index);
  };

  const handleCarouselScroll = () => {
    if (!reviewsCarouselRef.current || reviews.length <= 1) return;
    const container = reviewsCarouselRef.current;
    const scrollLeft = container.scrollLeft;
    const maxScroll = container.scrollWidth - container.clientWidth;

    if (maxScroll <= 5) {
      setActiveIndex(0);
      return;
    }

    if (scrollLeft <= 5) {
      setActiveIndex(0);
      return;
    }

    if (scrollLeft >= maxScroll - 10) {
      setActiveIndex(reviews.length - 1);
      return;
    }

    const fraction = scrollLeft / maxScroll;
    const index = Math.round(fraction * (reviews.length - 1));
    setActiveIndex(Math.min(reviews.length - 1, Math.max(0, index)));
  };

  const fetchReviews = () => {
    setReviewsLoading(true);
    reviewService
      .getApprovedReviews({ limit: 20 })
      .then((res) => {
        const list = res.data || [];
        setReviews(Array.isArray(list) ? list : []);
      })
      .catch((err) => {
        console.error('Failed to load reviews:', err);
      })
      .finally(() => {
        setReviewsLoading(false);
      });
  };

  useEffect(() => {
    fetchReviews();

    const handleReload = () => fetchReviews();
    window.addEventListener('sk_laba_review_submitted', handleReload);
    return () => {
      window.removeEventListener('sk_laba_review_submitted', handleReload);
    };
  }, []);

  const handleOpenReviewModal = () => {
    if (onOpenReview) {
      onOpenReview();
    } else {
      window.dispatchEvent(new CustomEvent('sk_laba_open_review_modal'));
    }
  };


  useEffect(() => {
    const video = tradeInVideoRef.current;
    if (!video) return;

    const START_TIME = 2.75;

    const setStart = () => {
      video.currentTime = START_TIME;
    };

    const handleTimeUpdate = () => {
      if (video.currentTime >= (video.duration - 0.15) || video.ended) {
        video.currentTime = START_TIME;
        video.play().catch(() => {});
      }
    };

    if (video.readyState >= 1) {
      video.currentTime = START_TIME;
    }

    video.addEventListener('loadedmetadata', setStart);
    video.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      video.removeEventListener('loadedmetadata', setStart);
      video.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, []);

  const [allPhones, setAllPhones] = useState([]);

  useEffect(() => {
    let isMounted = true;

    Promise.all([
      getActiveOffers().catch(() => ({ data: [] })),
      phoneService.getPhones().catch(() => ({ data: [] })),
    ]).then(([offerRes, phoneRes]) => {
      if (!isMounted) return;
      const rawOffers = offerRes.data?.data || offerRes.data || [];
      const rawPhones = phoneRes.data?.data || phoneRes.data || [];
      setActiveOffers(Array.isArray(rawOffers) ? rawOffers : []);
      setAllPhones(Array.isArray(rawPhones) ? rawPhones : []);
    }).catch((err) => {
      console.error('Failed to fetch promotional offers or phones', err);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleOpenSell = () => {
    if (onOpenSell) onOpenSell();
    else window.dispatchEvent(new CustomEvent('sk_laba_open_sell_modal', { detail: {} }));
  };

  const handleGoToSmartphones = (phone) => {
    if (onNavigateToSmartphones) {
      onNavigateToSmartphones(phone);
    } else {
      dispatch(setActiveTab('Smartphones'));
      window.location.hash = '#smartphones';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };


  return (
    <div className="flex flex-col w-full">
      <HeroSection onNavigateToSmartphones={handleGoToSmartphones} />

      <TrustBadges />


      {/* Trade-in Upgrade Video Section */}
      <section className="relative w-full bg-gradient-to-b from-theme-bg via-black to-black overflow-hidden select-none py-10 sm:py-14">
        {/* Section Heading & CTA over / above the video */}
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 text-center space-y-3 sm:space-y-4 -mb-10 sm:-mb-16 md:-mb-24 pointer-events-none">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-tight drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)] pointer-events-auto">
            Trade in. Upgrade.
          </h2>

          <div className="pt-2 sm:pt-3 pointer-events-auto">
            <button
              type="button"
              onClick={handleOpenSell}
              className="relative inline-flex items-center justify-center p-[1px] rounded-full bg-gradient-to-r from-red-600 via-blue-700 to-blue-900 hover:from-red-500 hover:via-blue-600 hover:to-blue-800 transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] shadow-xl shadow-black/80 group cursor-pointer"
            >
              <span className="inline-flex items-center gap-2 px-6 py-2.5 sm:py-3 rounded-full bg-black group-hover:bg-neutral-950 text-white text-xs sm:text-sm font-normal transition-colors duration-200">
                <span>Get your estimate</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </button>
          </div>
        </div>

        {/* Video Banner */}
        <div className="w-full max-w-[1500px] mx-auto px-2 sm:px-4">
          <div
            className="relative w-full aspect-video flex items-center justify-center overflow-hidden cursor-pointer group"
            onClick={handleOpenSell}
            title="Click to Trade-In or Sell Your Phone"
          >
            {/* Subtle 4-Side Edge Feathering / Shade: Left, Right, Top, Bottom */}
            <div className="absolute inset-y-0 left-0 w-8 sm:w-12 md:w-16 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
            <div className="absolute inset-y-0 right-0 w-8 sm:w-12 md:w-16 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />
            <div className="absolute inset-x-0 top-0 h-6 sm:h-8 bg-gradient-to-b from-black to-transparent z-10 pointer-events-none" />
            <div className="absolute inset-x-0 bottom-0 h-6 sm:h-8 bg-gradient-to-t from-black to-transparent z-10 pointer-events-none" />

            {/* Seamlessly cover bottom-right KlingAI watermark without touching the arrows */}
            <div className="absolute bottom-0 right-0 w-[18%] max-w-[240px] h-[11%] min-h-[48px] bg-black z-20 pointer-events-none" />

            <video
              ref={tradeInVideoRef}
              src={upgradeVideo}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.01]"
            />
          </div>
        </div>
      </section>

      {activeOffers.length > 0 && (
        <section id="deals" className="pt-16 pb-12 sm:pb-16 bg-black scroll-mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <span className="text-xs font-normal uppercase tracking-wider text-theme-textSecondary mb-1 block">
                  Limited Time Deals
                </span>
                <h2 className="text-2xl sm:text-3xl font-normal text-white tracking-tight flex items-center gap-2">
                  <span>Current Special Offers</span>
                  <Tag className="w-5 h-5 text-theme-textSecondary" />
                </h2>
              </div>

              <button
                type="button"
                onClick={handleGoToSmartphones}
                className="hidden sm:inline-flex items-center justify-center p-[1px] rounded-full bg-gradient-to-r from-red-600 via-blue-700 to-blue-900 hover:from-red-500 hover:via-blue-600 hover:to-blue-800 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-black/60 group cursor-pointer"
              >
                <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-black group-hover:bg-neutral-950 text-white text-xs font-normal transition-colors duration-200">
                  <span>View in Smartphones Page</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
              {activeOffers.map((offer) => (
                <OfferCard
                  key={offer.offer_id}
                  offer={offer}
                  allPhones={allPhones}
                  onNavigate={handleGoToSmartphones}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* About Us Section */}
      <section id="about" className="pt-12 sm:pt-16 pb-20 sm:pb-24 bg-black scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Side: About Image */}
            <div className="lg:col-span-5 relative group">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-black/90 bg-neutral-950">
                <img
                  src={aboutImg}
                  alt="About SK LABA PHONE"
                  className="w-full h-full max-h-[440px] object-cover object-center transition-transform duration-500 group-hover:scale-[1.02]"
                />
              </div>
            </div>

            {/* Right Side: Heading & Small Description */}
            <div className="lg:col-span-7 space-y-6">
              <div>
                <span className="text-xs font-normal uppercase tracking-wider text-theme-textSecondary mb-2 block">
                  Our Story
                </span>
                <h2 className="text-2xl sm:text-3xl font-normal text-white tracking-tight">
                  About SK LABA PHONE
                </h2>
                <p className="text-xs sm:text-sm text-theme-textSecondary mt-3.5 leading-relaxed font-normal">
                  Founded on trust and authenticity, SK LABA PHONE connects smart shoppers directly with South Korea&rsquo;s premier smartphone tech. Based in Dongdaemun-gu, Seoul, we hand-inspect every device—eliminating middleman markups so you receive verified original flagships at true wholesale value.
                </p>
              </div>

              {/* Quick Metrics Strip */}
              <div className="grid grid-cols-3 gap-3 pt-6 border-t border-white/10">
                <div>
                  <div className="text-lg sm:text-xl font-normal text-white tracking-tight">100%</div>
                  <div className="text-[11px] text-theme-textMuted font-normal">Original Devices</div>
                </div>
                <div>
                  <div className="text-base sm:text-lg lg:text-xl font-normal text-white tracking-tight">ලාබ ෆෝන් Value</div>
                  <div className="text-[11px] text-theme-textMuted font-normal">Transparent trade-ins &amp; deals</div>
                </div>
                <div>
                  <div className="text-lg sm:text-xl font-normal text-white tracking-tight">Seoul &bull; LK</div>
                  <div className="text-[11px] text-theme-textMuted font-normal">Direct Logistics</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Customer Reviews Section */}
      <section id="reviews" className="pt-20 sm:pt-24 pb-24 sm:pb-32 bg-black border-b border-white/10 scroll-mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10 sm:mb-12">
            <div>
              <h2 className="text-2xl sm:text-3xl font-normal text-white tracking-tight flex items-center gap-2.5">
                <span>Verified Customer Reviews</span>
              </h2>
              <p className="text-xs sm:text-sm text-theme-textSecondary mt-2.5 leading-relaxed">
                Real feedback from clients who purchased certified smartphones and traded devices with us.
              </p>
            </div>

            <div className="flex items-center gap-3 self-start sm:self-auto shrink-0">
              {reviews.length > 4 && (
                <div className="hidden sm:flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (reviewsCarouselRef.current) {
                        reviewsCarouselRef.current.scrollBy({ left: -320, behavior: 'smooth' });
                      }
                    }}
                    className="w-9 h-9 rounded-full bg-black hover:bg-neutral-900 border border-white/20 hover:border-white/40 text-white flex items-center justify-center transition-colors cursor-pointer shadow-sm"
                    title="Previous reviews"
                    aria-label="Previous reviews"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (reviewsCarouselRef.current) {
                        reviewsCarouselRef.current.scrollBy({ left: 320, behavior: 'smooth' });
                      }
                    }}
                    className="w-9 h-9 rounded-full bg-black hover:bg-neutral-900 border border-white/20 hover:border-white/40 text-white flex items-center justify-center transition-colors cursor-pointer shadow-sm"
                    title="Next reviews"
                    aria-label="Next reviews"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={handleOpenReviewModal}
                className="relative inline-flex items-center justify-center p-[1px] rounded-full bg-gradient-to-r from-red-600 via-blue-700 to-blue-900 hover:from-red-500 hover:via-blue-600 hover:to-blue-800 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-black/60 group cursor-pointer shrink-0"
              >
                <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-black group-hover:bg-neutral-950 text-white text-xs font-normal transition-colors duration-200">
                  <MessageSquareHeart className="w-4 h-4" />
                  <span>Write a Review</span>
                </span>
              </button>
            </div>
          </div>

          {reviewsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="bg-black border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col justify-between h-48 animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/10 shrink-0" />
                    <div className="h-3.5 bg-white/10 rounded w-24" />
                  </div>
                  <div className="space-y-2 my-3">
                    <div className="h-3 bg-white/5 rounded w-full" />
                    <div className="h-3 bg-white/5 rounded w-3/4" />
                  </div>
                  <div className="h-3 bg-white/10 rounded w-16" />
                </div>
              ))}
            </div>
          ) : reviews.length > 0 ? (
            <div>
              <div
                ref={reviewsCarouselRef}
                onScroll={handleCarouselScroll}
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                className="no-scrollbar flex gap-4 overflow-x-auto pb-2 pt-1 snap-x snap-mandatory scroll-smooth"
              >
                {reviews.map((r) => (
                  <div
                    key={r.review_id}
                    style={{
                      flex: '0 0 calc(25% - 12px)',
                      minWidth: '260px',
                      backgroundColor: '#09090d',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                    }}
                    className="snap-start rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition-all duration-300 shadow-xl shadow-black/80"
                  >
                    <div>
                      {/* Top Row: Stars (dark yellow) on left, Date on right */}
                      <div className="flex items-center justify-between gap-2 mb-3.5">
                        <div className="flex items-center gap-0.5 transform -skew-x-12">
                          {[1, 2, 3, 4, 5].map((star) => {
                            const isFilled = star <= r.rating;
                            return (
                              <Star
                                key={star}
                                style={
                                  isFilled
                                    ? { color: '#d97706', fill: '#d97706' }
                                    : { color: '#262626', fill: '#171717' }
                                }
                                className={`w-3.5 h-3.5 ${
                                  isFilled ? 'text-amber-600/90 fill-amber-600/90' : 'text-neutral-800 fill-neutral-900'
                                }`}
                              />
                            );
                          })}
                        </div>

                        <span className="text-[11px] text-theme-textMuted font-normal">
                          {r.created_at
                            ? new Date(r.created_at).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })
                            : ''}
                        </span>
                      </div>

                      {/* Review quote - full text without 'See more' */}
                      <p className="text-xs sm:text-sm text-slate-300 font-normal italic leading-relaxed">
                        &ldquo;{r.comment}&rdquo;
                      </p>
                    </div>

                    {/* Customer name at bottom without bright stroke */}
                    {r.customer_name && (
                      <div className="pt-3 mt-3 flex items-center gap-2" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.04)' }}>
                        <div
                          style={{
                            backgroundColor: '#141418',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                          }}
                          className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-normal shrink-0"
                        >
                          {r.customer_name.charAt(0)}
                        </div>
                        <span className="text-xs font-normal text-slate-400 truncate">
                          {r.customer_name}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Pagination Dots below the containers (instead of scrollbar) */}
              {reviews.length > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  {reviews.map((_, idx) => {
                    const isActive = activeIndex === idx;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => scrollToIndex(idx)}
                        aria-label={`Go to review ${idx + 1}`}
                        style={{
                          width: isActive ? '22px' : '7px',
                          height: '7px',
                          borderRadius: '9999px',
                          backgroundColor: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.2)',
                          transition: 'all 0.3s ease',
                        }}
                        className="cursor-pointer hover:opacity-90"
                      />
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 px-4 rounded-3xl border border-dashed border-theme-border/80 bg-theme-surface/50 max-w-xl mx-auto space-y-4">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">Be the First to Leave a Review!</h3>
                <p className="text-xs text-theme-textSecondary max-w-sm mx-auto">
                  Have you purchased a smartphone or used our trade-in service? Share your feedback with our community.
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenReviewModal}
                className="relative inline-flex items-center justify-center p-[1px] rounded-full bg-gradient-to-r from-red-600 via-blue-700 to-blue-900 hover:from-red-500 hover:via-blue-600 hover:to-blue-800 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-black/60 group cursor-pointer"
              >
                <span className="inline-flex items-center px-5 py-2.5 rounded-full bg-black group-hover:bg-neutral-950 text-white text-xs font-normal transition-colors duration-200">
                  Share Your Experience
                </span>
              </button>
            </div>
          )}
        </div>
      </section>

    </div>
  );
}
