import axiosInstance from './axiosInstance';

export const getPlans = async (filters = {}) => {
  const cleanParams = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== '' && v !== null && v !== undefined)
  );
  return axiosInstance.get('/api/installment-plans', { params: cleanParams });
};

export const getPlanById = async (planId) => {
  return axiosInstance.get(`/api/installment-plans/${planId}`);
};

export const createPlan = async (planData) => {
  return axiosInstance.post('/api/installment-plans', planData);
};

export const updatePlan = async (planId, planData) => {
  return axiosInstance.put(`/api/installment-plans/${planId}`, planData);
};

export const togglePlanStatus = async (planId) => {
  return axiosInstance.patch(`/api/installment-plans/${planId}/toggle-status`);
};

export const deletePlan = async (planId) => {
  return axiosInstance.delete(`/api/installment-plans/${planId}`);
};

export default {
  getPlans,
  getAllPlans: getPlans,
  getPlanById,
  createPlan,
  updatePlan,
  togglePlanStatus,
  deletePlan,
};

