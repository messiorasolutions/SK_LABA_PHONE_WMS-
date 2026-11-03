import React, { useState, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { ArrowRight, Tag, Star, MessageSquareHeart } from 'lucide-react';
import HeroSection from '../components/HeroSection';
import TrustBadges from '../components/TrustBadges';
import { getActiveOffers } from '../services/offerService';
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

  useEffect(() => {
    let isMounted = true;

    getActiveOffers()
      .then((res) => {
        if (!isMounted) return;
        const offers = res.data?.data || res.data || [];
        setActiveOffers(Array.isArray(offers) ? offers : []);
      })
      .catch((err) => {
        console.error('Failed to fetch promotional offers', err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleOpenSell = () => {
    if (onOpenSell) onOpenSell();
    else window.dispatchEvent(new CustomEvent('sk_laba_open_sell_modal', { detail: {} }));
  };

  const handleGoToSmartphones = () => {
    if (onNavigateToSmartphones) {
      onNavigateToSmartphones();
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


      <section className="relative w-full bg-black overflow-hidden select-none py-10 sm:py-14 md:py-16">
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className="relative w-full mx-auto aspect-video rounded-3xl overflow-hidden border border-white/10 shadow-2xl shadow-black/80 flex items-center justify-center cursor-pointer group"
            onClick={handleOpenSell}
            title="Click to Trade-In or Sell Your Phone"
          >
            {/* Soft top fade only so bottom icons remain completely visible */}
            <div className="absolute top-0 inset-x-0 h-12 sm:h-16 bg-gradient-to-b from-black/60 to-transparent z-10 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/10 via-transparent to-black/40 z-10 pointer-events-none" />

            {/* Seamlessly cover bottom-right KlingAI watermark while keeping Trade-in icons visible */}
            <div className="absolute bottom-0 right-0 w-[18%] max-w-[240px] h-[11%] min-h-[48px] bg-black z-20 pointer-events-none" />

            <video
              ref={tradeInVideoRef}
              src={upgradeVideo}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
            />

            <div className="absolute inset-0 z-20 pointer-events-none flex flex-col justify-center">
              <div className="w-full px-5 sm:px-10 lg:px-14 flex justify-end">
                <div className="w-fit ml-auto md:w-auto text-left space-y-3 sm:space-y-4 pointer-events-auto translate-y-6 sm:translate-y-10 md:translate-y-14">
                  <h2 className="text-2xl xs:text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-tight drop-shadow-[0_4px_24px_rgba(0,0,0,0.95)] sm:whitespace-nowrap">
                    Trade in. Upgrade.
                  </h2>

                                    <div className="pt-1.5 sm:pt-2">
                    <button
                      type="button"
                      onClick={handleOpenSell}
                      className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3.5 rounded-full bg-black/60 hover:bg-black/80 border border-white/20 hover:border-white/40 text-white text-xs sm:text-sm font-normal backdrop-blur-md transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-black/60 group cursor-pointer"
                    >
                      <span>Get your estimate</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {activeOffers.length > 0 && (
        <section className="pt-16 pb-12 sm:pb-16 bg-black">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeOffers.map((offer) => (
                <div
                  key={offer.offer_id}
                  className="bg-black border border-white/15 hover:border-white/30 rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 shadow-xl shadow-black/80"
                >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="px-3 py-1 rounded-full text-xs font-normal bg-black text-slate-300 border border-white/15">
                          {offer.discount_percentage ? `${offer.discount_percentage}% OFF` : 'SPECIAL DEAL'}
                        </span>
                        <span className="text-xs text-theme-textMuted">
                          Active Promotion
                        </span>
                      </div>

                      <h3 className="text-lg sm:text-xl font-normal text-white mb-2">
                        {offer.title}
                      </h3>
                      <p className="text-xs text-theme-textSecondary leading-relaxed mb-4 font-normal">
                        {offer.description}
                      </p>

                      <div className="flex items-baseline gap-3 mb-4">
                        <span className="text-2xl font-normal text-white">
                          ${Number(offer.offer_price).toLocaleString()}
                        </span>
                        {offer.regular_price && (
                          <span className="text-sm text-theme-textMuted line-through font-normal">
                            ${Number(offer.regular_price).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>

                  <button
                    type="button"
                    onClick={handleGoToSmartphones}
                    className="w-full py-2.5 px-4 rounded-full bg-black hover:bg-neutral-900 border border-white/20 hover:border-white/40 text-white text-xs font-normal flex items-center justify-center gap-2 transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-black/60 group cursor-pointer"
                  >
                    <span>Discover Smartphones Catalog</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
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
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12 sm:mb-14">
            <div>
              <h2 className="text-2xl sm:text-3xl font-normal text-white tracking-tight flex items-center gap-2.5">
                <span>Verified Customer Reviews</span>
              </h2>
              <p className="text-xs sm:text-sm text-theme-textSecondary mt-2.5 leading-relaxed">
                Real feedback from clients who purchased certified smartphones and traded devices with us.
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenReviewModal}
              className="relative inline-flex items-center justify-center p-[1px] rounded-full bg-gradient-to-r from-red-600 via-blue-700 to-blue-900 hover:from-red-500 hover:via-blue-600 hover:to-blue-800 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-black/60 group cursor-pointer self-start sm:self-auto shrink-0"
            >
              <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-black group-hover:bg-neutral-950 text-white text-xs font-normal transition-colors duration-200">
                <MessageSquareHeart className="w-4 h-4" />
                <span>Write a Review</span>
              </span>
            </button>
          </div>

          {reviewsLoading ? (
            <div className="bg-black border border-white/10 rounded-2xl overflow-hidden shadow-xl shadow-black/80">
              <div className="divide-y divide-white/10">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="p-4 sm:p-5 flex items-center justify-between gap-4 animate-pulse">
                    <div className="flex items-center gap-3 w-1/4">
                      <div className="w-8 h-8 rounded-full bg-white/10 shrink-0" />
                      <div className="h-3.5 bg-white/10 rounded w-24" />
                    </div>
                    <div className="h-3.5 bg-white/10 rounded w-20" />
                    <div className="h-3.5 bg-white/5 rounded w-1/2" />
                    <div className="h-3.5 bg-white/10 rounded w-16" />
                  </div>
                ))}
              </div>
            </div>
          ) : reviews.length > 0 ? (
            <div className="bg-black border border-white/10 rounded-2xl overflow-hidden shadow-xl shadow-black/80">
              <div className="max-h-[240px] sm:max-h-[250px] overflow-y-auto overflow-x-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-black [&::-webkit-scrollbar-thumb]:bg-white/20 hover:[&::-webkit-scrollbar-thumb]:bg-white/30 [&::-webkit-scrollbar-thumb]:rounded-full">
                <table className="w-full text-left text-xs sm:text-sm text-slate-300">
                  <tbody className="divide-y divide-white/10 font-normal">
                    {reviews.map((r) => (
                      <tr key={r.review_id} className="hover:bg-neutral-950 transition-colors">
                        <td className="py-3.5 sm:py-4 px-4 sm:px-6 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full border border-white/20 bg-neutral-900 flex items-center justify-center text-white text-xs font-normal shrink-0">
                              {(r.customer_name || 'C').charAt(0)}
                            </div>
                            <span className="text-white font-normal">{r.customer_name}</span>
                          </div>
                        </td>
                        <td className="py-3.5 sm:py-4 px-4 sm:px-6 whitespace-nowrap">
                          <div className="flex items-center gap-0.5 transform -skew-x-12">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-3 h-3 ${
                                  star <= r.rating ? 'text-amber-600/90 fill-amber-600/90' : 'text-neutral-800 fill-neutral-900'
                                }`}
                              />
                            ))}
                          </div>
                        </td>
                        <td className="py-3.5 sm:py-4 px-4 sm:px-6 min-w-[260px] max-w-xl text-slate-300 font-normal italic leading-relaxed">
                          <ReviewComment comment={r.comment} />
                        </td>
                        <td className="py-3.5 sm:py-4 px-4 sm:px-6 whitespace-nowrap text-right text-[11px] text-theme-textMuted font-normal">
                          {r.created_at
                            ? new Date(r.created_at).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })
                            : ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
