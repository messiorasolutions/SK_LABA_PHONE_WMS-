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

  const getWhatsAppUrl = useCallback((customText = 'Hello SK LABA PHONE!') => {
    const rawNumber = shopInfo.whatsapp || STORE_INFO.whatsapp || '+82 10-5892-7482';
    const cleanNumber = String(rawNumber).replace(/[^0-9]/g, '');
    const encodedText = encodeURIComponent(customText);
    return `https://wa.me/${cleanNumber}${encodedText ? `?text=${encodedText}` : ''}`;
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
      getWhatsAppUrl: (text = 'Hello SK LABA PHONE!') => {
        const clean = String(STORE_INFO.whatsapp || '').replace(/[^0-9]/g, '');
        return `https://wa.me/${clean}?text=${encodeURIComponent(text)}`;
      },
    };
  }
  return context;
}

export default ShopInfoContext;

