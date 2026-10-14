import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'https://api.sklabaphone.com';

const REQUEST_TIMEOUT_MS = 15000;

// Create Specification
const createSpecification = async (specificationData) => {
  const config = {
    method: 'post',
    url: `${BASE_URL}/api/specifications`,
    timeout: REQUEST_TIMEOUT_MS,
    headers: {
      'Content-Type': 'application/json',
    },
    data: specificationData,
  };

  return axios.request(config).then((response) => {
    return response;
  });
};

// Fetch All Specifications (optional type filter: TECHNICAL / ACCESSORY)
const getSpecifications = async (type = '') => {
  const config = {
    method: 'get',
    url: `${BASE_URL}/api/specifications`,
    timeout: REQUEST_TIMEOUT_MS,
    params: type ? { type } : {},
  };

  return axios.request(config).then((response) => {
    return response;
  });
};

// Find Specification by ID
const getSpecificationById = async (specificationId) => {
  const config = {
    method: 'get',
    url: `${BASE_URL}/api/specifications/${specificationId}`,
    timeout: REQUEST_TIMEOUT_MS,
  };

  return axios.request(config).then((response) => {
    return response;
  });
};

// Update Specification
const updateSpecification = async (specificationId, specificationData) => {
  const config = {
    method: 'put',
    url: `${BASE_URL}/api/specifications/${specificationId}`,
    timeout: REQUEST_TIMEOUT_MS,
    headers: {
      'Content-Type': 'application/json',
    },
    data: specificationData,
  };

  return axios.request(config).then((response) => {
    return response;
  });
};

// Delete Specification
const deleteSpecification = async (specificationId) => {
  const config = {
    method: 'delete',
    url: `${BASE_URL}/api/specifications/${specificationId}`,
    timeout: REQUEST_TIMEOUT_MS,
  };

  return axios.request(config).then((response) => {
    return response;
  });
};

export {
  createSpecification,
  getSpecifications,
  getSpecifications as getAllSpecifications,
  getSpecificationById,
  updateSpecification,
  deleteSpecification,
};

export default {
  createSpecification,
  getSpecifications,
  getAllSpecifications: getSpecifications,
  getSpecificationById,
  updateSpecification,
  deleteSpecification,
};
