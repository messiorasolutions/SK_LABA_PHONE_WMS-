// ============================================================
// RESERVATION SERVICE — SK LABA PHONE WMS (SRS C-09, C-03, ST-07)
// Dashboard Reservations Management & Status Updates
// ============================================================

import axiosInstance from './axiosInstance';
import { API_ENDPOINTS } from '../constants/apiEndpoints';

export const reservationService = {
  /**
   * List Reservations with Filters & Pagination (ST-07)
   * params: { page, limit, search, status, phone_id, assigned_to_user_id, from_date, to_date }
   */
  getReservations: async (params = {}) => {
    const response = await axiosInstance.get(API_ENDPOINTS.reservations.base, { params });
    return response.data;
  },

  /**
   * Get Single Reservation Detail (ST-07)
   */
  getReservationById: async (id) => {
    const response = await axiosInstance.get(API_ENDPOINTS.reservations.byId(id));
    return response.data;
  },

  /**
   * Update Reservation Status & Optional Staff Assignment (ST-07)
   * payload: { status: string, assigned_to_user_id?: number | null }
   */
  updateReservationStatus: async (id, payload) => {
    const response = await axiosInstance.patch(API_ENDPOINTS.reservations.status(id), payload);
    return response.data;
  },

  /**
   * Assign or Reassign Reservation to Staff (ST-07)
   * payload: { assigned_to_user_id: number | null }
   */
  assignReservation: async (id, payload) => {
    const response = await axiosInstance.patch(API_ENDPOINTS.reservations.assign(id), payload);
    return response.data;
  },
};

export default reservationService;
