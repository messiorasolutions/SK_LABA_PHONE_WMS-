import axiosInstance from './axiosInstance';

// In-memory cache for storage options
let storageOptionsPromise = null;

// Create Storage Option
const createStorageOption = async (storageData) => {
  storageOptionsPromise = null; // Invalidate cache
  return axiosInstance.post('/api/storage-options', storageData);
};

// Fetch All Storage Options (cached & deduplicated)
const getStorageOptions = async (forceRefresh = false) => {
  if (forceRefresh || !storageOptionsPromise) {
    storageOptionsPromise = axiosInstance.get('/api/storage-options').catch((err) => {
      storageOptionsPromise = null;
      throw err;
    });
  }
  return storageOptionsPromise;
};

// Invalidate cache
const clearStorageOptionsCache = () => {
  storageOptionsPromise = null;
};

// Find Storage Option by ID
const getStorageOptionById = async (storageId) => {
  return axiosInstance.get(`/api/storage-options/${storageId}`);
};

// Update Storage Option
const updateStorageOption = async (storageId, storageData) => {
  storageOptionsPromise = null; // Invalidate cache
  return axiosInstance.put(`/api/storage-options/${storageId}`, storageData);
};

// Delete Storage Option
const deleteStorageOption = async (storageId) => {
  storageOptionsPromise = null; // Invalidate cache
  return axiosInstance.delete(`/api/storage-options/${storageId}`);
};

export {
  createStorageOption,
  getStorageOptions,
  getStorageOptions as getAllStorageOptions,
  getStorageOptionById,
  updateStorageOption,
  deleteStorageOption,
  clearStorageOptionsCache,
};

export default {
  createStorageOption,
  getStorageOptions,
  getAllStorageOptions: getStorageOptions,
  getStorageOptionById,
  updateStorageOption,
  deleteStorageOption,
  clearStorageOptionsCache,
};
