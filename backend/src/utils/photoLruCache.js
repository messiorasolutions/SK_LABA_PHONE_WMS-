/**
 * In-Memory LRU Cache for Decoded Photo Buffers
 * Limits:
 * - Max 24 entries
 * - Max 40 MB total decoded buffer memory
 * Key format: phoneId:c:i:v (v = updated_at epoch ms)
 */

const MAX_ENTRIES = 24;
const MAX_MEMORY_BYTES = 40 * 1024 * 1024; // 40 MB

class PhotoLruCache {
    constructor(maxEntries = MAX_ENTRIES, maxMemoryBytes = MAX_MEMORY_BYTES) {
        this.maxEntries = maxEntries;
        this.maxMemoryBytes = maxMemoryBytes;
        this.cache = new Map(); // key -> { buffer, contentType, etag, size }
        this.totalMemoryBytes = 0;
    }

    /**
     * Retrieve photo entry from cache and refresh recency
     * @param {string} key
     * @returns {{ buffer: Buffer, contentType: string, etag: string, size: number } | null}
     */
    getPhoto(key) {
        if (!this.cache.has(key)) {
            return null;
        }
        const entry = this.cache.get(key);
        // Refresh LRU order (delete & re-insert)
        this.cache.delete(key);
        this.cache.set(key, entry);
        return entry;
    }

    /**
     * Store photo entry and enforce capacity limits
     * @param {string} key
     * @param {{ buffer: Buffer, contentType: string, etag: string }} data
     */
    setPhoto(key, { buffer, contentType, etag }) {
        if (!buffer || !Buffer.isBuffer(buffer)) {
            return;
        }

        const size = buffer.length;

        // If existing key, deduct its prior memory
        if (this.cache.has(key)) {
            const old = this.cache.get(key);
            this.totalMemoryBytes -= old.size;
            this.cache.delete(key);
        }

        this.cache.set(key, { buffer, contentType, etag, size });
        this.totalMemoryBytes += size;

        // Evict least recently used entries if exceeding count or memory limits
        while (this.cache.size > this.maxEntries || this.totalMemoryBytes > this.maxMemoryBytes) {
            const oldestKey = this.cache.keys().next().value;
            if (!oldestKey) break;
            const oldestEntry = this.cache.get(oldestKey);
            this.totalMemoryBytes -= oldestEntry.size;
            this.cache.delete(oldestKey);
        }
    }

    clear() {
        this.cache.clear();
        this.totalMemoryBytes = 0;
    }

    getStats() {
        return {
            size: this.cache.size,
            totalMemoryBytes: this.totalMemoryBytes,
            maxEntries: this.maxEntries,
            maxMemoryBytes: this.maxMemoryBytes
        };
    }
}

const photoLruCache = new PhotoLruCache();

module.exports = photoLruCache;
