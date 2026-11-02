import React from 'react';
import { Phone, MessageCircle, MapPin, Clock, Mail, ShieldCheck, MessageSquare } from 'lucide-react';
import { STORE_INFO } from '../constants/siteConfig';

export default function Footer({ onOpenSell }) {
  const handleWhatsApp = () => {
    const clean = (STORE_INFO.whatsapp || '').replace(/\D/g, '');
    window.open(`https://wa.me/${clean}?text=Hello%20SK%20LABA%20PHONE!`, '_blank');
  };

  const handleOpenGeneralInquiry = () => {
    window.dispatchEvent(new CustomEvent('sk_laba_open_inquiry_modal', { detail: { phone: null } }));
  };

  const handleOpenSell = () => {
    if (onOpenSell) {
      onOpenSell();
    } else {
      window.dispatchEvent(new CustomEvent('sk_laba_open_sell_modal', { detail: {} }));
    }
  };

  return (
    <footer className="w-full bg-[#03060E] border-t border-theme-border text-theme-textSecondary pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-theme-border/60">
          <div className="md:col-span-2 space-y-3">
            <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              <span>{STORE_INFO.name}</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-600/20 text-sky-400 border border-blue-500/30">
                {STORE_INFO.tagline}
              </span>
            </h3>
            <p className="text-xs text-theme-textMuted max-w-sm leading-relaxed">
              Leading provider of authentic flagship smartphones, verified pre-owned devices, and mobile accessories direct from South Korea to your doorstep.
            </p>
            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={handleWhatsApp}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-theme-border text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>WhatsApp Shop</span>
              </button>

              <button
                type="button"
                onClick={handleOpenGeneralInquiry}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-sky-400 text-xs font-semibold transition-colors cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Send Inquiry</span>
              </button>

              <a
                href={`tel:${STORE_INFO.phone}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-theme-input hover:bg-theme-hover border border-theme-border text-white text-xs font-semibold transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-sky-400" />
                <span>Call {STORE_INFO.phone}</span>
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              Shop Categories
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="#smartphones" className="hover:text-white transition-colors">
                  Flagship Smartphones
                </a>
              </li>
              <li>
                <a href="#smartphones" className="hover:text-white transition-colors">
                  Verified Pre-Owned Phones
                </a>
              </li>
              <li>
                <button
                  type="button"
                  onClick={handleOpenSell}
                  className="hover:text-emerald-400 transition-colors text-left"
                >
                  Sell Your Old Phone
                </button>
              </li>
              <li>
                <a href="#smartphones" className="hover:text-white transition-colors">
                  Special Promotional Deals
                </a>
              </li>
              <li>
                <a href="#smartphones" className="hover:text-white transition-colors">
                  Zero Interest Instalments
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              Shop Information
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-2 text-theme-textMuted">
                <MapPin className="w-3.5 h-3.5 text-theme-accent shrink-0 mt-0.5" />
                <span>{STORE_INFO.address}</span>
              </div>
              <div className="flex items-center gap-2 text-theme-textMuted">
                <Clock className="w-3.5 h-3.5 text-theme-accent shrink-0" />
                <span>{STORE_INFO.openingHours}</span>
              </div>
              <div className="flex items-center gap-2 text-theme-textMuted">
                <Mail className="w-3.5 h-3.5 text-theme-accent shrink-0" />
                <span>{STORE_INFO.email}</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-400 font-semibold pt-1">
                <ShieldCheck className="w-4 h-4" />
                <span>Verified South Korea Warehouse</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-theme-textMuted">
          <div>
            &copy; {new Date().getFullYear()} {STORE_INFO.name}. All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[11px] text-theme-textMuted">Direct South Korea Import</span>
            <span className="w-1 h-1 rounded-full bg-theme-border" />
            <span className="text-[11px] text-emerald-400">100% Genuine Devices</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
