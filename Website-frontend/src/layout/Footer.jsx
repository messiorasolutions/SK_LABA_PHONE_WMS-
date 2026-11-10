import React from 'react';
import { Phone, MapPin, Clock, Mail, ShieldCheck, MessageSquare } from 'lucide-react';
import { useShopInfo } from '../context/ShopInfoContext';
import whatsappIcon from '../assets/icons/whatsappicon.png';

export default function Footer({ onOpenSell }) {
  const { shopInfo, getWhatsAppUrl } = useShopInfo();

  const handleWhatsApp = () => {
    window.open(getWhatsAppUrl('Hello SK LABA PHONE! I am interested in your smartphones.'), '_blank');
  };

  const handleOpenGeneralInquiry = () => {
    window.location.hash = '#contact';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenSell = () => {
    if (onOpenSell) {
      onOpenSell();
    } else {
      window.dispatchEvent(new CustomEvent('sk_laba_open_sell_modal', { detail: {} }));
    }
  };

  return (
    <footer className="w-full bg-black border-t border-white/10 text-theme-textSecondary pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 pb-10 border-b border-white/10">
          <div className="sm:col-span-2 md:col-span-2 space-y-3">
            <h3 className="text-xl font-normal text-white tracking-tight flex items-center gap-2">
              <span>{shopInfo.name}</span>
              <span className="relative inline-flex items-center justify-center p-[1px] rounded-full bg-gradient-to-r from-red-700/70 via-blue-800/70 to-blue-950/70 shadow-sm">
                <span className="text-[10px] font-normal px-2 py-[1px] rounded-full bg-black text-slate-300 leading-tight">
                  {shopInfo.tagline}
                </span>
              </span>
            </h3>
            <p className="text-xs text-theme-textMuted max-w-sm leading-relaxed font-normal">
              Leading provider of authentic flagship smartphones, verified pre-owned devices, and mobile accessories direct from South Korea to your doorstep.
            </p>
            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={handleWhatsApp}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-black hover:bg-neutral-900 border border-white/15 hover:border-white/30 text-white text-xs font-normal transition-all cursor-pointer shadow-sm"
              >
                <img src={whatsappIcon} alt="WhatsApp" className="w-4 h-4 object-contain" />
                <span>WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={handleOpenGeneralInquiry}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-black hover:bg-neutral-900 border border-white/15 hover:border-white/30 text-white text-xs font-normal transition-all cursor-pointer shadow-sm"
              >
                <MessageSquare className="w-3.5 h-3.5 text-slate-300" />
                <span>Send Inquiry</span>
              </button>

              <a
                href={`tel:${shopInfo.phone}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-black hover:bg-neutral-900 border border-white/15 hover:border-white/30 text-white text-xs font-normal transition-all shadow-sm"
              >
                <Phone className="w-3.5 h-3.5 text-slate-300" />
                <span>Call {shopInfo.phone}</span>
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-normal text-white uppercase tracking-wider mb-3">
              Shop Categories
            </h4>
            <ul className="space-y-2 text-xs font-normal">
              <li>
                <a href="#smartphones" className="hover:text-white transition-colors">
                  Flagship Smartphones
                </a>
              </li>
              <li>
                <a href="#marketplace" className="hover:text-white transition-colors">
                  Marketplace (Pre-Owned Phones)
                </a>
              </li>
              <li>
                <button
                  type="button"
                  onClick={handleOpenSell}
                  className="hover:text-emerald-400 transition-colors text-left cursor-pointer"
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
            <h4 className="text-xs font-normal text-white uppercase tracking-wider mb-3">
              Shop Information
            </h4>
            <div className="space-y-2 text-xs font-normal">
              <div className="flex items-start gap-2 text-theme-textMuted">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span>{shopInfo.address}</span>
              </div>
              <div className="flex items-center gap-2 text-theme-textMuted">
                <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{shopInfo.openingHours}</span>
              </div>
              <div className="flex items-center gap-2 text-theme-textMuted">
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{shopInfo.email}</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-400 font-normal pt-1">
                <ShieldCheck className="w-4 h-4" />
                <span>Verified South Korea Warehouse</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-theme-textMuted font-normal">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-center sm:text-left">
            <span>&copy; {new Date().getFullYear()} {shopInfo.name}. All rights reserved.</span>
            <span className="text-white/20 hidden sm:inline">•</span>
            <span className="text-slate-400">Develop by Messiora (PVT) LTD</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[11px] text-theme-textMuted">Direct South Korea Import</span>
            <span className="w-1 h-1 rounded-full bg-white/20" />
            <span className="text-[11px] text-emerald-400">100% Genuine Devices</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
