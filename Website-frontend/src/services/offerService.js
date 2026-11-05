import axiosInstance from './axiosInstance.js';
import { API_ENDPOINTS } from '../constants/apiEndpoints.js';
import { createServiceCache } from './cacheHelper.js';

// In-memory cache for active offers (3-minute TTL)
const activeOffersCache = createServiceCache({ ttlMs: 3 * 60 * 1000 });

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
