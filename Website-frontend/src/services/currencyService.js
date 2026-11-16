const CACHE_KEY = 'sk_krw_to_lkr_rate';
const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours cache
const DEFAULT_FALLBACK_RATE = 0.22; // 1 KRW ≈ 0.22 LKR (approximate CBSL benchmark)

/**
 * Fetches the current KRW -> LKR exchange rate using free, keyless APIs.
 * Automatically caches for 12 hours in localStorage to prevent unnecessary network requests.
 * @returns {Promise<number>} Exchange rate (e.g. 0.2215)
 */
export async function fetchKrwToLkrRate() {
  // 1. Return fresh cached rate if available
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed?.rate && (Date.now() - parsed.timestamp) < CACHE_TTL_MS) {
        return parsed.rate;
      }
    }
  } catch (e) {
    // Non-fatal, continue to fetch
  }

  // 2. Fetch from free ExchangeRate-API (open tier, no API key, CORS enabled)
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/KRW');
    if (res.ok) {
      const data = await res.json();
      const rate = data?.rates?.LKR;
      if (typeof rate === 'number' && rate > 0) {
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify({ rate, timestamp: Date.now() }));
        } catch (_) {}
        return rate;
      }
    }
  } catch (err) {
    console.warn('ExchangeRate-API failed, trying fallback:', err?.message || err);
  }

  // 3. Fallback to Frankfurter API (free, no API key, CORS enabled)
  try {
    const res = await fetch('https://api.frankfurter.dev/v1/latest?from=KRW&to=LKR');
    if (res.ok) {
      const data = await res.json();
      const rate = data?.rates?.LKR;
      if (typeof rate === 'number' && rate > 0) {
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify({ rate, timestamp: Date.now() }));
        } catch (_) {}
        return rate;
      }
    }
  } catch (err) {
    console.warn('Frankfurter API fallback failed:', err?.message || err);
  }

  // 4. Fallback to stale cached rate if available
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed?.rate) return parsed.rate;
    }
  } catch (_) {}

  return DEFAULT_FALLBACK_RATE;
}

/**
 * Format a number into South Korean Won string (e.g. ₩50,000)
 */
export function formatKrw(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) return '₩0';
  return `₩${Math.round(Number(amount)).toLocaleString('ko-KR')}`;
}

/**
 * Format a number into Sri Lankan Rupee string (e.g. Rs. 11,250)
 */
export function formatLkr(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) return 'Rs. 0';
  return `Rs. ${Math.round(Number(amount)).toLocaleString('en-US')}`;
}
