import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'https://api.sklabaphone.com';

const REQUEST_TIMEOUT_MS = 15000;

// Create Brand
const createBrand = async (brandData) => {
  const config = {
    method: 'post',
    url: `${BASE_URL}/api/brands`,
    timeout: REQUEST_TIMEOUT_MS,
    headers: {
      'Content-Type': 'application/json',
    },
    data: brandData,
  };

  return axios.request(config).then((response) => {
    return response;
  });
};

// Fetch All Brands
const getBrands = async () => {
  const config = {
    method: 'get',
    url: `${BASE_URL}/api/brands`,
    timeout: REQUEST_TIMEOUT_MS,
  };

  return axios.request(config).then((response) => {
    return response;
  });
};

// Find Brand by ID
const getBrandById = async (brandId) => {
  const config = {
    method: 'get',
    url: `${BASE_URL}/api/brands/${brandId}`,
    timeout: REQUEST_TIMEOUT_MS,
  };

  return axios.request(config).then((response) => {
    return response;
  });
};

// Update Brand
const updateBrand = async (brandId, brandData) => {
  const config = {
    method: 'put',
    url: `${BASE_URL}/api/brands/${brandId}`,
    timeout: REQUEST_TIMEOUT_MS,
    headers: {
      'Content-Type': 'application/json',
    },
    data: brandData,
  };

  return axios.request(config).then((response) => {
    return response;
  });
};

// Delete Brand
const deleteBrand = async (brandId) => {
  const config = {
    method: 'delete',
    url: `${BASE_URL}/api/brands/${brandId}`,
    timeout: REQUEST_TIMEOUT_MS,
  };

  return axios.request(config).then((response) => {
    return response;
  });
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
