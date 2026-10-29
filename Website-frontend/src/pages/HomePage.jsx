import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { ArrowRight, Tag, Phone, MessageCircle } from 'lucide-react';
import HeroSection from '../components/HeroSection';
import TrustBadges from '../components/TrustBadges';
import { getActiveOffers } from '../services/offerService';
import { setActiveTab } from '../actions/heroActions';
import { STORE_INFO } from '../constants/siteConfig';

export default function HomePage({ onNavigateToSmartphones }) {
  const dispatch = useDispatch();
  const [activeOffers, setActiveOffers] = useState([]);

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

  const handleGoToSmartphones = () => {
    if (onNavigateToSmartphones) {
      onNavigateToSmartphones();
    } else {
      dispatch(setActiveTab('Smartphones'));
      window.location.hash = '#smartphones';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleWhatsApp = () => {
    const cleanNumber = (STORE_INFO.whatsapp || '').replace(/\D/g, '');
    window.open(`https://wa.me/${cleanNumber}?text=Hello%20SK%20LABA%20PHONE!`, '_blank');
  };

  return (
    <div className="flex flex-col w-full">
      {/* 1. Hero Section Banner Area (C-01) */}
      <HeroSection onNavigateToSmartphones={handleGoToSmartphones} />

      {/* 2. Trust Badges Bar */}
      <TrustBadges />

      {/* 3. Active Offers Section (C-01 & C-12) */}
      {activeOffers.length > 0 && (
        <section className="py-16 bg-[#040812] border-b border-theme-border/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-red-400 mb-1 block">
                  Limited Time Deals
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
                  <span>Current Special Offers</span>
                  <Tag className="w-5 h-5 text-red-500" />
                </h2>
              </div>

              <button
                type="button"
                onClick={handleGoToSmartphones}
                className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-theme-input hover:bg-theme-hover border border-theme-border text-white text-xs font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <span>View in Smartphones Page</span>
                <ArrowRight className="w-4 h-4 text-theme-accent" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeOffers.map((offer) => (
                <div
                  key={offer.offer_id}
                  className="bg-theme-surface border border-theme-border hover:border-red-500/40 rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-colors shadow-xl"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-600/20 text-red-400 border border-red-500/30">
                        {offer.discount_percentage ? `${offer.discount_percentage}% OFF` : 'SPECIAL DEAL'}
                      </span>
                      <span className="text-xs text-theme-textMuted">
                        Active Promotion
                      </span>
                    </div>

                    <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
                      {offer.title}
                    </h3>
                    <p className="text-xs text-theme-textSecondary leading-relaxed mb-4">
                      {offer.description}
                    </p>

                    <div className="flex items-baseline gap-3 mb-4">
                      <span className="text-2xl font-black text-white">
                        ${Number(offer.offer_price).toLocaleString()}
                      </span>
                      {offer.regular_price && (
                        <span className="text-sm text-theme-textMuted line-through">
                          ${Number(offer.regular_price).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleGoToSmartphones}
                    className="w-full py-2.5 px-4 rounded-xl bg-theme-input hover:bg-theme-hover border border-theme-border text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <span>Discover Smartphones Catalog</span>
                    <ArrowRight className="w-3.5 h-3.5 text-sky-400" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 4. Shop Contacts Bar (C-01 & C-08) */}
      <section className="py-16 bg-theme-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-theme-surface border border-theme-border rounded-3xl p-6 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center sm:text-left">
              <h3 className="text-xl font-bold text-white">Need Personal Advice on Choosing a Phone?</h3>
              <p className="text-xs sm:text-sm text-theme-textSecondary">
                Our support team in Seoul is available to answer questions on phone specs, condition, and warranty.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={handleWhatsApp}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp Shop</span>
              </button>

              <a
                href={`tel:${STORE_INFO.phone}`}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-theme-input hover:bg-theme-hover border border-theme-border text-white text-xs font-semibold transition-colors"
              >
                <Phone className="w-4 h-4 text-sky-400" />
                <span>Call Directly</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
