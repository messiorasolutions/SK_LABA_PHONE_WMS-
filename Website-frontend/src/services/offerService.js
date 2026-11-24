import axiosInstance from './axiosInstance.js';
import { API_ENDPOINTS } from '../constants/apiEndpoints.js';
import { createServiceCache, generateRequestKey } from './cacheHelper.js';

// In-memory cache for active offers (60-second TTL & in-flight deduplication)
const activeOffersCache = createServiceCache({
  ttlMs: 60 * 1000,
  keyGenerator: (params) => generateRequestKey('GET', API_ENDPOINTS.offers.active, params),
});

/**
 * Fetch all active promotional offers (C-12) (cached & deduplicated)
 */
export const getActiveOffers = async (options = {}) => {
  const forceRefresh = typeof options === 'boolean'
    ? options
    : Boolean(options?.forceRefresh);

  return activeOffersCache.execute(
    'active',
    () => axiosInstance.get(API_ENDPOINTS.offers.active),
    forceRefresh
  );
};

export const clearActiveOffersCache = () => {
  activeOffersCache.clear();
};

export { activeOffersCache };

export default {
  getActiveOffers,
  clearActiveOffersCache,
  activeOffersCache,
};
