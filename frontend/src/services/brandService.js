import axiosInstance from './axiosInstance';

// Create Brand
const createBrand = async (brandData) => {
  return axiosInstance.post('/api/brands', brandData);
};

// Fetch All Brands
const getBrands = async () => {
  return axiosInstance.get('/api/brands');
};

// Find Brand by ID
const getBrandById = async (brandId) => {
  return axiosInstance.get(`/api/brands/${brandId}`);
};

// Update Brand
const updateBrand = async (brandId, brandData) => {
  return axiosInstance.put(`/api/brands/${brandId}`, brandData);
};

// Delete Brand
const deleteBrand = async (brandId) => {
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
