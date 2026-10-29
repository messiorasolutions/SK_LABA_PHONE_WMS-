import axiosInstance from './axiosInstance';

// Create Storage Option
const createStorageOption = async (storageData) => {
  return axiosInstance.post('/api/storage-options', storageData);
};

// Fetch All Storage Options
const getStorageOptions = async () => {
  return axiosInstance.get('/api/storage-options');
};

// Find Storage Option by ID
const getStorageOptionById = async (storageId) => {
  return axiosInstance.get(`/api/storage-options/${storageId}`);
};

// Update Storage Option
const updateStorageOption = async (storageId, storageData) => {
  return axiosInstance.put(`/api/storage-options/${storageId}`, storageData);
};

// Delete Storage Option
const deleteStorageOption = async (storageId) => {
  return axiosInstance.delete(`/api/storage-options/${storageId}`);
};

export {
  createStorageOption,
  getStorageOptions,
  getStorageOptions as getAllStorageOptions,
  getStorageOptionById,
  updateStorageOption,
  deleteStorageOption,
};

export default {
  createStorageOption,
  getStorageOptions,
  getAllStorageOptions: getStorageOptions,
  getStorageOptionById,
  updateStorageOption,
  deleteStorageOption,
};
