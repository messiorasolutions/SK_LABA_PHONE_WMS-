import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'https://api.sklabaphone.com';

const REQUEST_TIMEOUT_MS = 15000;

// Create Storage Option
const createStorageOption = async (storageData) => {
  const config = {
    method: 'post',
    url: `${BASE_URL}/api/storage-options`,
    timeout: REQUEST_TIMEOUT_MS,
    headers: {
      'Content-Type': 'application/json',
    },
    data: storageData,
  };

  return axios.request(config).then((response) => {
    return response;
  });
};

// Fetch All Storage Options
const getStorageOptions = async () => {
  const config = {
    method: 'get',
    url: `${BASE_URL}/api/storage-options`,
    timeout: REQUEST_TIMEOUT_MS,
  };

  return axios.request(config).then((response) => {
    return response;
  });
};

// Find Storage Option by ID
const getStorageOptionById = async (storageId) => {
  const config = {
    method: 'get',
    url: `${BASE_URL}/api/storage-options/${storageId}`,
    timeout: REQUEST_TIMEOUT_MS,
  };

  return axios.request(config).then((response) => {
    return response;
  });
};

// Update Storage Option
const updateStorageOption = async (storageId, storageData) => {
  const config = {
    method: 'put',
    url: `${BASE_URL}/api/storage-options/${storageId}`,
    timeout: REQUEST_TIMEOUT_MS,
    headers: {
      'Content-Type': 'application/json',
    },
    data: storageData,
  };

  return axios.request(config).then((response) => {
    return response;
  });
};

// Delete Storage Option
const deleteStorageOption = async (storageId) => {
  const config = {
    method: 'delete',
    url: `${BASE_URL}/api/storage-options/${storageId}`,
    timeout: REQUEST_TIMEOUT_MS,
  };

  return axios.request(config).then((response) => {
    return response;
  });
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
