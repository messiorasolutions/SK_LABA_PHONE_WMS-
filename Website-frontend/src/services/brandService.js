import axiosInstance from './axiosInstance';
import { createServiceCache, generateRequestKey } from './cacheHelper';

// In-memory cache for brands (60-second TTL & in-flight deduplication)
const brandsCache = createServiceCache({
  ttlMs: 60 * 1000,
  keyGenerator: (params) => generateRequestKey('GET', '/api/brands', params),
});

// Create Brand
const createBrand = async (brandData) => {
  brandsCache.clear();
  return axiosInstance.post('/api/brands', brandData);
};

// Fetch All Brands (cached 60s & deduplicated in flight)
const getBrands = async (options = {}) => {
  const forceRefresh = typeof options === 'boolean'
    ? options
    : Boolean(options?.forceRefresh);

  return brandsCache.execute(
    {},
    () => axiosInstance.get('/api/brands'),
    forceRefresh
  );
};

// Find Brand by ID
const getBrandById = async (brandId) => {
  return axiosInstance.get(`/api/brands/${brandId}`);
};

// Update Brand
const updateBrand = async (brandId, brandData) => {
  brandsCache.clear();
  return axiosInstance.put(`/api/brands/${brandId}`, brandData);
};

// Delete Brand
const deleteBrand = async (brandId) => {
  brandsCache.clear();
  return axiosInstance.delete(`/api/brands/${brandId}`);
};

// Export individual functions and default object
export {
  createBrand,
  getBrands,
  getBrands as getAllBrands,
  getBrandById,
  updateBrand,
  deleteBrand,
};

export default {
  createBrand,
  getBrands,
  getAllBrands: getBrands,
  getBrandById,
  updateBrand,
  deleteBrand,
};
