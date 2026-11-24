import axiosInstance from './axiosInstance';
import { createServiceCache, generateRequestKey } from './cacheHelper';

// In-memory cache for shop info (60-second TTL & in-flight deduplication)
const shopInfoCache = createServiceCache({
  ttlMs: 60 * 1000,
  keyGenerator: (params) => generateRequestKey('GET', '/api/shop-info', params),
});

export const getShopInfo = async (options = {}) => {
  const forceRefresh = typeof options === 'boolean'
    ? options
    : Boolean(options?.forceRefresh);

  return shopInfoCache.execute(
    {},
    async () => {
      const response = await axiosInstance.get('/api/shop-info');
      return response.data?.data;
    },
    forceRefresh
  );
};

export const clearShopInfoCache = () => {
  shopInfoCache.clear();
};

export default {
  getShopInfo,
  clearShopInfoCache,
};

