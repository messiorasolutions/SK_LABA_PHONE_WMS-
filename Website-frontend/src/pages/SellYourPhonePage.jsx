import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Home,
} from 'lucide-react';
import { getSellerTerms } from '../services/marketplaceService';

export default function SellYourPhonePage({ onNavigateToHome, onStartListing }) {
  const [terms, setTerms] = useState(null);
  const [loadingTerms, setLoadingTerms] = useState(true);
  const [termsExpanded, setTermsExpanded] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoadingTerms(true);

    getSellerTerms()
      .then((termsData) => {
        if (isMounted && termsData) {
          setTerms(termsData);
        }
      })
      .catch(() => null)
      .finally(() => {
        if (isMounted) setLoadingTerms(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleStartListingClick = () => {
    if (onStartListing) {
      onStartListing();
    } else {
      window.dispatchEvent(new CustomEvent('sk_laba_open_sell_modal', { detail: {} }));
    }
  };

  return (
    <div className="min-h-screen bg-[#070B16] text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-400">
          <button
            type="button"
            onClick={onNavigateToHome}
            className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Home</span>
          </button>
          <ChevronRight className="w-3 h-3 text-slate-600" />
          <span className="text-white font-medium">Sell Your Phone</span>
        </nav>

        {/* Page Heading */}
        <div className="pb-6 border-b border-white/10">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white">
            Sell Your Phone
          </h1>
        </div>

        {/* Seller Terms & Conditions Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white">
                Seller Terms &amp; Conditions
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Official Version: <strong className="text-sky-400">{terms?.version || '1.0'}</strong>
              </p>
            </div>

            <button
              type="button"
              onClick={() => setTermsExpanded((prev) => !prev)}
              className="text-xs font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1 cursor-pointer"
            >
              <span>{termsExpanded ? 'Collapse Terms' : 'View Full Terms'}</span>
              {termsExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          {/* Terms Content Box */}
          <div className="p-5 sm:p-7 rounded-2xl bg-[#0A0F1E] border border-white/15">
            <div
              className={`space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed ${
                termsExpanded ? '' : 'max-h-72 overflow-y-auto pr-2'
              }`}
            >
              {loadingTerms ? (
                <div className="py-8 text-center text-slate-400">Loading current seller terms...</div>
              ) : terms?.content ? (
                <div className="whitespace-pre-line space-y-2">{terms.content}</div>
              ) : (
                <>
                  <p>
                    <strong>1. Genuine Ownership:</strong> The seller certifies that the phone offered for sale is their lawful property, is free of any financing or carrier locks, and has not been reported lost or stolen.
                  </p>
                  <p>
                    <strong>2. Accurate Condition Grading:</strong> The seller must truthfully describe the physical, display, battery, and camera condition. Misrepresenting device condition may result in rejected delivery and cancellation of payout.
                  </p>
                  <p>
                    <strong>3. Platform Commission:</strong> A platform commission is deducted from the final sale price upon successful delivery and verification.
                  </p>
                  <p>
                    <strong>4. Direct Handover:</strong> Upon order confirmation, the seller agrees to deliver the smartphone directly to the buyer. SK LABA PHONE does not accept warehouse drop-offs for marketplace listings.
                  </p>
                  <p>
                    <strong>5. Payout Release:</strong> Payouts are transferred once the buyer confirms delivery and required verification criteria are completed.
                  </p>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Single Primary CTA: Sell Your Phone */}
        <div className="pt-6 pb-12 border-t border-white/10 flex flex-col items-center justify-center text-center space-y-3">
          <button
            type="button"
            onClick={handleStartListingClick}
            className="w-full sm:w-auto px-10 py-4 rounded-xl bg-white hover:bg-slate-200 text-[#070B16] font-extrabold text-sm sm:text-base transition-all shadow-2xl active:scale-[0.98] cursor-pointer inline-flex items-center justify-center gap-2.5"
          >
            <span>Sell Your Phone</span>
            <ArrowRight className="w-4 h-4 text-sky-600" />
          </button>
        </div>
      </div>
    </div>
  );
}
