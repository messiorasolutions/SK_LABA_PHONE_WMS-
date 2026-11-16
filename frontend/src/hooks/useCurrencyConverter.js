import { useState, useEffect } from 'react';
import { fetchKrwToLkrRate, formatKrw, formatLkr } from '../services/currencyService';

export function useCurrencyConverter() {
  const [rate, setRate] = useState(() => {
    try {
      const cached = localStorage.getItem('sk_krw_to_lkr_rate');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?.rate) return parsed.rate;
      }
    } catch (_) {}
    return 0.22;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    fetchKrwToLkrRate()
      .then((r) => {
        if (isMounted && r) setRate(r);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const convertKrwToLkr = (krw) => {
    if (!krw || isNaN(krw)) return 0;
    return Number(krw) * rate;
  };

  return {
    rate,
    loading,
    convertKrwToLkr,
    formatKrw,
    formatLkr,
  };
}
