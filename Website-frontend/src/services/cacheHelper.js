/**
 * In-memory service cache utility with in-flight Promise deduplication,
 * TTL expiration, safe response cloning, and error retry support.
 */

const safeClone = (data) => {
  if (data === null || typeof data !== 'object') {
    return data;
  }
  if (typeof structuredClone === 'function') {
    try {
      return structuredClone(data);
    } catch {
      // Fallback if non-clonable types exist
    }
  }
  try {
    return JSON.parse(JSON.stringify(data));
  } catch {
    return data;
  }
};

const cloneResponse = (res) => {
  if (!res || typeof res !== 'object') return res;
  // If it's an Axios response-like object with data and status/headers
  if ('data' in res && ('status' in res || 'headers' in res || 'statusText' in res)) {
    return {
      ...res,
      data: safeClone(res.data),
    };
  }
  return safeClone(res);
};

export const defaultKeyGenerator = (params) => {
  if (!params || typeof params !== 'object') {
    return String(params ?? '');
  }
  const cleanEntries = Object.entries(params)
    .filter(([k, v]) => k !== 'forceRefresh' && v !== '' && v !== null && v !== undefined)
    .sort(([a], [b]) => a.localeCompare(b));
  return JSON.stringify(Object.fromEntries(cleanEntries));
};

export function createServiceCache({
  ttlMs = 3 * 60 * 1000, // 3 minutes default
  keyGenerator = defaultKeyGenerator,
} = {}) {
  const cache = new Map(); // key -> { data, expiresAt }
  const inFlight = new Map(); // key -> Promise

  return {
    /**
     * Executes the fetcher, deduplicating in-flight requests and returning cached data within TTL.
     * @param {any} params - Arguments or filter object identifying the request
     * @param {Function} fetcher - Async function returning response or data
     * @param {boolean} [forceRefresh=false] - When true, bypasses and overwrites cache
     */
    async execute(params, fetcher, forceRefresh = false) {
      const key = keyGenerator(params);
      const now = Date.now();

      // 1. Valid cache hit
      if (!forceRefresh && cache.has(key)) {
        const entry = cache.get(key);
        if (now < entry.expiresAt) {
          return cloneResponse(entry.data);
        }
        cache.delete(key);
      }

      // 2. In-flight Promise deduplication (reuse same Promise if request is already ongoing)
      if (!forceRefresh && inFlight.has(key)) {
        const sharedPromise = inFlight.get(key);
        const result = await sharedPromise;
        return cloneResponse(result);
      }

      // 3. Initiate new network fetch
      const promise = (async () => {
        try {
          const result = await fetcher();
          // Store clone to prevent external mutations from affecting cache
          cache.set(key, {
            data: cloneResponse(result),
            expiresAt: Date.now() + ttlMs,
          });
          return result;
        } finally {
          // Always clear in-flight status so subsequent calls don't hang
          inFlight.delete(key);
        }
      })();

      inFlight.set(key, promise);
      const result = await promise;
      return cloneResponse(result);
    },

    clear(params) {
      if (params !== undefined) {
        const key = keyGenerator(params);
        cache.delete(key);
        inFlight.delete(key);
      } else {
        cache.clear();
        inFlight.clear();
      }
    },

    hasCached(params) {
      const key = keyGenerator(params);
      if (!cache.has(key)) return false;
      return Date.now() < cache.get(key).expiresAt;
    },

    hasInFlight(params) {
      const key = keyGenerator(params);
      return inFlight.has(key);
    },

    size() {
      return cache.size;
    },
  };
}

export default createServiceCache;
