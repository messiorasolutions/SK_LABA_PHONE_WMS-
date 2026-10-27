import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'https://api.sklabaphone.com';

const REQUEST_TIMEOUT_MS = 15000;

// Create Phone
const createPhone = async (phoneData) => {
  const config = {
    method: 'post',
    url: `${BASE_URL}/api/phones`,
    timeout: REQUEST_TIMEOUT_MS,
    headers: {
      'Content-Type': 'application/json',
    },
    data: phoneData,
  };

  return axios.request(config).then((response) => {
    return response;
  });
};

// Fetch All Phones (filters: { brand_id, status, phone_condition, availability, search })
const getPhones = async (filters = {}) => {
  const cleanParams = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== '' && v !== null && v !== undefined)
  );

  const config = {
    method: 'get',
    url: `${BASE_URL}/api/phones`,
    timeout: REQUEST_TIMEOUT_MS,
    params: cleanParams,
  };

  return axios.request(config).then((response) => {
    return response;
  });
};

// Find Phone by ID
const getPhoneById = async (phoneId) => {
  const config = {
    method: 'get',
    url: `${BASE_URL}/api/phones/${phoneId}`,
    timeout: REQUEST_TIMEOUT_MS,
  };

  return axios.request(config).then((response) => {
    return response;
  });
};

// Update Phone
const updatePhone = async (phoneId, phoneData) => {
  const config = {
    method: 'put',
    url: `${BASE_URL}/api/phones/${phoneId}`,
    timeout: REQUEST_TIMEOUT_MS,
    headers: {
      'Content-Type': 'application/json',
    },
    data: phoneData,
  };

  return axios.request(config).then((response) => {
    return response;
  });
};

// Delete Phone
const deletePhone = async (phoneId) => {
  const config = {
    method: 'delete',
    url: `${BASE_URL}/api/phones/${phoneId}`,
    timeout: REQUEST_TIMEOUT_MS,
  };

  return axios.request(config).then((response) => {
    return response;
  });
};

export {
  createPhone,
  getPhones,
  getPhones as getAllPhones,
  getPhoneById,
  updatePhone,
  deletePhone,
};

export default {
  createPhone,
  getPhones,
  getAllPhones: getPhones,
  getPhoneById,
  updatePhone,
  deletePhone,
};
