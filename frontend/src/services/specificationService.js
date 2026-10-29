import axiosInstance from './axiosInstance';

// Create Specification
const createSpecification = async (specificationData) => {
  return axiosInstance.post('/api/specifications', specificationData);
};

// Fetch All Specifications (optional type filter: TECHNICAL / ACCESSORY)
const getSpecifications = async (type = '') => {
  const params = type ? { type } : {};
  return axiosInstance.get('/api/specifications', { params });
};

// Find Specification by ID
const getSpecificationById = async (specificationId) => {
  return axiosInstance.get(`/api/specifications/${specificationId}`);
};

// Update Specification
const updateSpecification = async (specificationId, specificationData) => {
  return axiosInstance.put(`/api/specifications/${specificationId}`, specificationData);
};

// Delete Specification
const deleteSpecification = async (specificationId) => {
  return axiosInstance.delete(`/api/specifications/${specificationId}`);
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
