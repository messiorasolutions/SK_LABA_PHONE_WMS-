const CACHE_KEY = 'sk_krw_to_lkr_rate_info';
const DEFAULT_FALLBACK_RATE = 0.22; // 1 KRW ≈ 0.22 LKR (indicative rate)

/**
 * Always fetches the live daily exchange rate for KRW -> LKR from the free Currency API.
 * Uses open.er-api.com (updated daily at 00:00 UTC) with Frankfurter API as backup.
 * 
 * @param {boolean} forceRefresh - If true, skips any temporary cache and calls the live API immediately.
 * @returns {Promise<{rate: number, date: string, lastUpdatedText: string, isLive: boolean}>}
 */
export async function fetchLiveExchangeRate(forceRefresh = false) {
  const todayDateStr = new Date().toISOString().slice(0, 10);

  // 1. If not forced and already fetched today, return today's rate
  if (!forceRefresh) {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?.date === todayDateStr && typeof parsed?.rate === 'number' && parsed.rate > 0) {
          return { ...parsed, isLive: true };
        }
      }
    } catch (_) {}
  }

  // 2. Fetch directly from live ExchangeRate-API (Free, no key, daily updates)
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/KRW');
    if (res.ok) {
      const data = await res.json();
      const rate = data?.rates?.LKR;
      if (typeof rate === 'number' && rate > 0) {
        const info = {
          rate,
          date: todayDateStr,
          lastUpdatedText: data.time_last_update_utc ? new Date(data.time_last_update_utc).toLocaleDateString() : todayDateStr,
          isLive: true,
          provider: 'ExchangeRate-API'
        };
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(info));
        } catch (_) {}
        return info;
      }
    }
  } catch (err) {
    console.warn('ExchangeRate-API request failed, trying Frankfurter API:', err?.message || err);
  }

  // 3. Backup live API: Frankfurter API (Free, no key, uses CBSL/Central Bank rates)
  try {
    const res = await fetch('https://api.frankfurter.dev/v1/latest?from=KRW&to=LKR');
    if (res.ok) {
      const data = await res.json();
      const rate = data?.rates?.LKR;
      if (typeof rate === 'number' && rate > 0) {
        const info = {
          rate,
          date: todayDateStr,
          lastUpdatedText: data.date || todayDateStr,
          isLive: true,
          provider: 'Frankfurter API'
        };
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(info));
        } catch (_) {}
        return info;
      }
    }
  } catch (err) {
    console.warn('Frankfurter API fallback failed:', err?.message || err);
  }

  // 4. If user is offline, use previously saved rate from cache
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed?.rate) {
        return { ...parsed, isLive: false };
      }
    }
  } catch (_) {}

  // 5. Fallback rate if completely offline and no cache
  return {
    rate: DEFAULT_FALLBACK_RATE,
    date: todayDateStr,
    lastUpdatedText: 'Indicative Benchmark',
    isLive: false,
    provider: 'Offline Benchmark'
  };
}

/**
 * Format a number into South Korean Man-won string (e.g. 5,000 만원)
 */
export function formatKrw(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) return '0 만원';
  return `${Math.round(Number(amount)).toLocaleString('ko-KR')} 만원`;
}

/**
 * Format a number into separate parts for Korean Man-won: number and unit (만원)
 * Useful for styling the unit smaller than the price digits.
 */
export function formatKrwParts(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return { number: '0', unit: '만원' };
  }
  return {
    number: Math.round(Number(amount)).toLocaleString('ko-KR'),
    unit: '만원',
  };
}

/**
 * Format a number into Sri Lankan Rupee string (e.g. Rs. 11,250)
 */
export function formatLkr(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) return 'Rs. 0';
  return `Rs. ${Math.round(Number(amount)).toLocaleString('en-US')}`;
}
