import axiosInstance from './axiosInstance.js';
import { API_ENDPOINTS } from '../constants/apiEndpoints.js';
import { createServiceCache, generateRequestKey } from './cacheHelper.js';

// In-memory cache for phone installments: phoneId -> Promise
const installmentsCache = new Map();

// In-memory cache for phones catalog (60-second TTL for fast navigation & in-flight deduplication)
const phonesCache = createServiceCache({
  ttlMs: 60 * 1000,
  keyGenerator: (params) => generateRequestKey('GET', API_ENDPOINTS.phones.base, params),
});

// Create Phone
const createPhone = async (phoneData) => {
  phonesCache.clear();
  return axiosInstance.post(API_ENDPOINTS.phones.base, phoneData);
};

// Fetch All Phones (requests lightweight card projection for fast loading with 30s timeout)
const getPhones = async (filters = {}, options = {}) => {
  const forceRefresh = typeof options === 'boolean'
    ? options
    : Boolean(options?.forceRefresh || filters?.forceRefresh);

  const cleanParams = Object.fromEntries(
    Object.entries({ view: 'card', ...filters }).filter(([k, v]) => k !== 'forceRefresh' && v !== '' && v !== null && v !== undefined)
  );

  return phonesCache.execute(
    cleanParams,
    () => axiosInstance.get(API_ENDPOINTS.phones.base, { params: cleanParams, timeout: 30000 }),
    forceRefresh
  );
};

// Find Phone by ID
const getPhoneById = async (phoneId, options = {}) => {
  const isPlain = typeof options === 'object' && options !== null;
  const params = isPlain && options.params ? options.params : (isPlain ? options : {});
  return axiosInstance.get(API_ENDPOINTS.phones.byId(phoneId), { params });
};

// Update Phone
const updatePhone = async (phoneId, phoneData) => {
  phonesCache.clear();
  return axiosInstance.put(API_ENDPOINTS.phones.byId(phoneId), phoneData);
};

// Delete Phone
const deletePhone = async (phoneId) => {
  phonesCache.clear();
  return axiosInstance.delete(API_ENDPOINTS.phones.byId(phoneId));
};

// Compare Phones (C-05: 2 or 3 phone IDs)
const comparePhones = async (ids) => {
  const idsParam = Array.isArray(ids) ? ids.join(',') : ids;
  return axiosInstance.get(API_ENDPOINTS.phones.compare, {
    params: { ids: idsParam },
  });
};

// Live details for saved favorites (C-06)
const getFavorites = async (ids) => {
  const idsParam = Array.isArray(ids) ? ids.join(',') : ids;
  return axiosInstance.get(API_ENDPOINTS.phones.favorites, {
    params: { ids: idsParam },
  });
};

// Get Installment plans for a phone (C-03) (cached & deduplicated)
const getPhoneInstallments = async (phoneId, forceRefresh = false) => {
  const key = String(phoneId);
  if (!forceRefresh && installmentsCache.has(key)) {
    return installmentsCache.get(key);
  }

  const promise = axiosInstance
    .get(API_ENDPOINTS.phones.installments(phoneId))
    .catch((err) => {
      installmentsCache.delete(key); // Reset on error so caller can retry
      throw err;
    });

  installmentsCache.set(key, promise);
  return promise;
};

// Invalidate installments cache
const clearInstallmentsCache = (phoneId) => {
  if (phoneId !== undefined) {
    installmentsCache.delete(String(phoneId));
  } else {
    installmentsCache.clear();
  }
};

// Invalidate phones catalog cache
const clearPhonesCache = (filters) => {
  if (filters !== undefined) {
    const cleanParams = Object.fromEntries(
      Object.entries(filters).filter(([k, v]) => k !== 'forceRefresh' && v !== '' && v !== null && v !== undefined)
    );
    phonesCache.clear(cleanParams);
  } else {
    phonesCache.clear();
  }
};

// Check active offer for a phone (C-02 & C-03)
const getPhoneOffer = async (phoneId) => {
  return axiosInstance.get(API_ENDPOINTS.phones.offer(phoneId));
};

export {
  createPhone,
  getPhones,
  getPhones as getAllPhones,
  getPhoneById,
  updatePhone,
  deletePhone,
  comparePhones,
  getFavorites,
  getPhoneInstallments,
  clearInstallmentsCache,
  clearPhonesCache,
  getPhoneOffer,
  phonesCache,
};

export default {
  createPhone,
  getPhones,
  getAllPhones: getPhones,
  getPhoneById,
  updatePhone,
  deletePhone,
  comparePhones,
  getFavorites,
  getPhoneInstallments,
  clearInstallmentsCache,
  clearPhonesCache,
  getPhoneOffer,
  phonesCache,
};
