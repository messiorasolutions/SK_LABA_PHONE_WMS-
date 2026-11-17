import { useState, useEffect, useCallback } from 'react';
import { fetchLiveExchangeRate, formatKrw, formatLkr } from '../services/currencyService';

export function useCurrencyConverter() {
  const [rateInfo, setRateInfo] = useState(() => {
    try {
      const cached = localStorage.getItem('sk_krw_to_lkr_rate_info');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?.rate) return parsed;
      }
    } catch (_) {}
    return {
      rate: 0.22,
      date: new Date().toISOString().slice(0, 10),
      lastUpdatedText: 'Loading...',
      isLive: false,
    };
  });
  const [loading, setLoading] = useState(false);

  const loadRate = useCallback(async (force = false) => {
    setLoading(true);
    try {
      const info = await fetchLiveExchangeRate(force);
      setRateInfo(info);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRate(false);
  }, [loadRate]);

  const convertKrwToLkr = (krw) => {
    if (!krw || isNaN(krw)) return 0;
    return Number(krw) * (rateInfo?.rate || 0.22);
  };

  return {
    rate: rateInfo?.rate || 0.22,
    rateInfo,
    loading,
    refreshRate: () => loadRate(true),
    convertKrwToLkr,
    formatKrw,
    formatLkr,
  };
}
