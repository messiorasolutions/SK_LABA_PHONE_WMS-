import { useState, useEffect, useCallback } from 'react';
import { fetchLiveExchangeRate, formatKrw, formatKrwParts, formatLkr } from '../services/currencyService';

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

  const convertKrwToLkr = (manwon) => {
    if (!manwon || isNaN(manwon)) return 0;
    // 1 Man-won (만원) = 10,000 KRW
    return Number(manwon) * 10000 * (rateInfo?.rate || 0.22);
  };

  return {
    rate: rateInfo?.rate || 0.22,
    rateInfo,
    loading,
    refreshRate: () => loadRate(true),
    convertKrwToLkr,
    convertManwonToLkr: convertKrwToLkr,
    formatKrw,
    formatKrwParts,
    formatLkr,
  };
}
