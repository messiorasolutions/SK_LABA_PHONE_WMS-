/**
 * In-Memory List Cache for Catalog Queries
 * Features:
 * - TTL: 60 seconds
 * - Full query-string keying
 * - In-flight Promise deduplication to protect DB from concurrent identical bursts
 * - Programmatic invalidation on phone & offer mutations
 */

const DEFAULT_TTL_MS = 60 * 1000; // 60 seconds

class ListCache {
    constructor(ttlMs = DEFAULT_TTL_MS) {
        this.ttlMs = ttlMs;
        this.cache = new Map(); // key -> { data, expiresAt }
        this.inFlight = new Map(); // key -> Promise
    }

    /**
     * Build normalized cache key from query object or string
     * @param {Object|string} queryParams
     * @returns {string}
     */
    generateKey(queryParams) {
        if (!queryParams) return 'all';
        if (typeof queryParams === 'string') return queryParams;
        const cleanEntries = Object.entries(queryParams)
            .filter(([, v]) => v !== undefined && v !== null && v !== '')
            .sort(([a], [b]) => a.localeCompare(b));
        return JSON.stringify(Object.fromEntries(cleanEntries));
    }

    /**
     * Retrieve cached payload if still within fresh TTL
     * @param {string} key
     * @returns {any|null}
     */
    get(key) {
        if (!this.cache.has(key)) return null;
        const entry = this.cache.get(key);
        if (Date.now() < entry.expiresAt) {
            return entry.data;
        }
        this.cache.delete(key);
        return null;
    }

    /**
     * Store payload with 60-second expiration
     * @param {string} key
     * @param {any} data
     */
    set(key, data) {
        this.cache.set(key, {
            data,
            expiresAt: Date.now() + this.ttlMs
        });
    }

    /**
     * Invalidate all cached list results (called on phone & offer writes)
     */
    clear() {
        this.cache.clear();
        this.inFlight.clear();
    }

    /**
     * Execute a database fetcher with cache lookup and in-flight deduplication
     * @param {string} key
     * @param {Function} fetcher - Async function returning response data
     * @returns {Promise<any>}
     */
    async execute(key, fetcher) {
        // 1. Fresh cache hit
        const cached = this.get(key);
        if (cached !== null) {
            return cached;
        }

        // 2. In-flight Promise deduplication (reuse ongoing database query)
        if (this.inFlight.has(key)) {
            return await this.inFlight.get(key);
        }

        // 3. Initiate fetcher and register in-flight
        const promise = (async () => {
            try {
                const result = await fetcher();
                this.set(key, result);
                return result;
            } finally {
                this.inFlight.delete(key);
            }
        })();

        this.inFlight.set(key, promise);
        return await promise;
    }

    size() {
        return this.cache.size;
    }
}

const listCache = new ListCache();

module.exports = listCache;
