import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getShopInfo as fetchShopInfoApi } from '../services/shopInfoService';
import { STORE_INFO } from '../constants/siteConfig';

const ShopInfoContext = createContext({
  shopInfo: STORE_INFO,
  loading: false,
  error: null,
  refreshShopInfo: () => {},
  getWhatsAppUrl: () => '',
});

export function cleanWhatsAppNumber(rawNumber) {
  if (!rawNumber) return '94778602219';
  let digits = String(rawNumber).replace(/[^0-9]/g, '');

  if (digits.startsWith('00')) {
    digits = digits.slice(2);
  }

  // If user entered local Sri Lankan number with leading 0 (e.g. 0778602219 -> 94778602219)
  if (digits.length === 10 && digits.startsWith('07')) {
    digits = '94' + digits.slice(1);
  } else if (digits.length === 9 && digits.startsWith('7')) {
    digits = '94' + digits;
  }

  return digits;
}

export function ShopInfoProvider({ children }) {
  const [shopInfo, setShopInfo] = useState({
    name: STORE_INFO.name || 'SK LABA PHONE',
    tagline: STORE_INFO.tagline || 'ලාබ ෆෝන්',
    phone: STORE_INFO.phone || '+82 10-5892-7482',
    whatsapp: STORE_INFO.whatsapp || '+82 10-5892-7482',
    address: STORE_INFO.address || 'Dongdaemun-gu, Seoul, South Korea',
    openingHours: STORE_INFO.openingHours || 'Mon - Sun: 10:00 AM - 9:00 PM (KST)',
    email: STORE_INFO.email || 'contact@sklabaphone.com',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadInfo = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchShopInfoApi();
      if (data) {
        const merged = {
          name: data.shop_name || STORE_INFO.name || 'SK LABA PHONE',
          tagline: data.tagline || STORE_INFO.tagline || 'ලාබ ෆෝන්',
          phone: data.phone_number || STORE_INFO.phone || '+82 10-5892-7482',
          whatsapp: data.whatsapp_number || STORE_INFO.whatsapp || '+82 10-5892-7482',
          address: data.address || STORE_INFO.address || 'Dongdaemun-gu, Seoul, South Korea',
          openingHours: data.opening_hours || STORE_INFO.openingHours || 'Mon - Sun: 10:00 AM - 9:00 PM (KST)',
          email: data.email || STORE_INFO.email || 'contact@sklabaphone.com',
        };

        setShopInfo(merged);

        // Synchronize in-memory STORE_INFO so non-hook imports also reflect latest data
        STORE_INFO.name = merged.name;
        STORE_INFO.tagline = merged.tagline;
        STORE_INFO.phone = merged.phone;
        STORE_INFO.whatsapp = merged.whatsapp;
        STORE_INFO.address = merged.address;
        STORE_INFO.openingHours = merged.openingHours;
        STORE_INFO.email = merged.email;
      }
    } catch (err) {
      console.warn('Could not load live shop info, using default store configuration:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInfo();
  }, [loadInfo]);

  const getWhatsAppUrl = useCallback((customText = 'Hello! I found your business through your website and would like to know more about your services. Could you please provide me with some information?') => {
    const rawNumber = shopInfo.whatsapp || STORE_INFO.whatsapp || '+94 77 860 2219';
    const cleanNumber = cleanWhatsAppNumber(rawNumber);
    const encodedText = encodeURIComponent(customText);

    const isMobile = typeof navigator !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (isMobile) {
      return `https://wa.me/${cleanNumber}${encodedText ? `?text=${encodedText}` : ''}`;
    }

    // On Desktop, web.whatsapp.com reliably opens the chat and pre-fills the message box,
    // avoiding the known Windows WhatsApp Desktop app bug where URL query text gets dropped.
    return `https://web.whatsapp.com/send?phone=${cleanNumber}${encodedText ? `&text=${encodedText}` : ''}`;
  }, [shopInfo.whatsapp]);

  return (
    <ShopInfoContext.Provider
      value={{
        shopInfo,
        loading,
        error,
        refreshShopInfo: loadInfo,
        getWhatsAppUrl,
      }}
    >
      {children}
    </ShopInfoContext.Provider>
  );
}

export function useShopInfo() {
  const context = useContext(ShopInfoContext);
  if (!context) {
    return {
      shopInfo: STORE_INFO,
      loading: false,
      error: null,
      refreshShopInfo: () => {},
      getWhatsAppUrl: (text = 'Hello! I found your business through your website and would like to know more about your services. Could you please provide me with some information?') => {
        const clean = cleanWhatsAppNumber(STORE_INFO.whatsapp);
        const encoded = encodeURIComponent(text);
        const isMobile = typeof navigator !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        return isMobile
          ? `https://wa.me/${clean}?text=${encoded}`
          : `https://web.whatsapp.com/send?phone=${clean}&text=${encoded}`;
      },
    };
  }
  return context;
}

export default ShopInfoContext;

