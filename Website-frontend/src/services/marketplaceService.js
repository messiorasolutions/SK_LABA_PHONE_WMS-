import axiosInstance from './axiosInstance.js';
import { API_ENDPOINTS } from '../constants/apiEndpoints.js';
import { createServiceCache } from './cacheHelper.js';

// In-memory cache for marketplace listings (3-minute TTL)
const marketplaceListingsCache = createServiceCache({ ttlMs: 3 * 60 * 1000 });

// In-memory cache for static terms (10-minute TTL)
const termsCache = createServiceCache({ ttlMs: 10 * 60 * 1000 });

/**
 * Fetch published Marketplace phones with search, filter, sort, and pagination.
 * Automatically cached and in-flight deduplicated.
 *
 * @param {Object} [filters={}] - { search, brand, condition_grade, min_price, max_price, page, limit, sort_by, sort_order }
 * @param {Object|boolean} [options={}] - { forceRefresh: boolean }
 * @returns {Promise<{ success: boolean, data: Array<Object>, pagination: Object }>}
 */
export const getMarketplacePhones = async (filters = {}, options = {}) => {
  const forceRefresh =
    typeof options === 'boolean'
      ? options
      : Boolean(options?.forceRefresh || filters?.forceRefresh);

  const cleanParams = Object.fromEntries(
    Object.entries(filters).filter(
      ([k, v]) =>
        k !== 'forceRefresh' &&
        v !== '' &&
        v !== null &&
        v !== undefined
    )
  );

  return marketplaceListingsCache.execute(
    cleanParams,
    async () => {
      const response = await axiosInstance.get(API_ENDPOINTS.marketplace.phones, {
        params: cleanParams,
      });
      return response.data;
    },
    forceRefresh
  );
};

/**
 * Fetch published phone details by listing ID.
 *
 * @param {number|string} listingId
 * @returns {Promise<Object>}
 */
export const getMarketplacePhoneById = async (listingId) => {
  const response = await axiosInstance.get(API_ENDPOINTS.marketplace.byId(listingId));
  return response.data;
};

/**
 * Fetch active Seller Terms & Conditions.
 *
 * @param {boolean} [forceRefresh=false]
 * @returns {Promise<Object>}
 */
export const getSellerTerms = async (forceRefresh = false) => {
  return termsCache.execute(
    { type: 'seller' },
    async () => {
      const response = await axiosInstance.get(API_ENDPOINTS.marketplace.sellerTerms);
      return response.data?.data || response.data;
    },
    forceRefresh
  );
};

/**
 * Fetch active Buyer Terms & Conditions.
 *
 * @param {boolean} [forceRefresh=false]
 * @returns {Promise<Object>}
 */
/**
 * Fetch platform commission percentage rate.
 * Uses cached terms or calls commission endpoint.
 *
 * @param {boolean} [forceRefresh=false]
 * @returns {Promise<number>}
 */
export const getCommissionRate = async (forceRefresh = false) => {
  return termsCache.execute(
    { type: 'commission_rate' },
    async () => {
      try {
        const response = await axiosInstance.get(API_ENDPOINTS.marketplace.commission);
        const rate = response.data?.data?.commission_percentage ?? response.data?.commission_percentage;
        if (typeof rate === 'number') return rate;
      } catch (e) {
        // Fallback to seller terms or default
      }
      try {
        const sellerTerms = await getSellerTerms(forceRefresh);
        if (sellerTerms && typeof sellerTerms.commission_percentage === 'number') {
          return sellerTerms.commission_percentage;
        }
      } catch (err) {}
      return 5.00;
    },
    forceRefresh
  );
};

export const getBuyerTerms = async (forceRefresh = false) => {
  return termsCache.execute(
    { type: 'buyer' },
    async () => {
      const response = await axiosInstance.get(API_ENDPOINTS.marketplace.buyerTerms);
      return response.data?.data || response.data;
    },
    forceRefresh
  );
};

/**
 * Submit a phone for listing on the Marketplace (Sell Your Phone).
 * Accepts FormData (for multipart photos) or plain JSON.
 * Clears listings cache on success.
 *
 * @param {FormData|Object} payload
 * @returns {Promise<Object>}
 */
export const submitMarketplaceListing = async (payload) => {
  const response = await axiosInstance.post(API_ENDPOINTS.marketplace.submit, payload);
  // Clear cached marketplace browse listings so new items or status updates reflect
  marketplaceListingsCache.clear();
  return response.data;
};

/**
 * Create a Marketplace purchase order / reservation.
 * Clears listings cache to immediately reflect RESERVED status.
 *
 * @param {Object} orderData
 * @returns {Promise<Object>}
 */
export const createMarketplaceOrder = async (orderData) => {
  const response = await axiosInstance.post(API_ENDPOINTS.marketplace.orders, orderData);
  marketplaceListingsCache.clear();
  return response.data;
};

/**
 * Manually invalidate marketplace listings cache.
 */
export const clearMarketplaceCache = () => {
  marketplaceListingsCache.clear();
};

export default {
  getMarketplacePhones,
  getMarketplacePhoneById,
  getSellerTerms,
  getBuyerTerms,
  getCommissionRate,
  submitMarketplaceListing,
  createMarketplaceOrder,
  clearMarketplaceCache,
};
