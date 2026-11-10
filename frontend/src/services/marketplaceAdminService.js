import axiosInstance from './axiosInstance';
import { API_ENDPOINTS } from '../constants/apiEndpoints';

export const marketplaceAdminService = {
  /**
   * Fetch all Marketplace listings with filtering & pagination
   * @param {Object} [params={}] - { status, search, brand, page, limit }
   */
  getListings: async (params = {}) => {
    const response = await axiosInstance.get(API_ENDPOINTS.marketplace.listings, { params });
    return response.data;
  },

  /**
   * Fetch a single listing by ID with full details & photo array
   */
  getListingById: async (id) => {
    const response = await axiosInstance.get(API_ENDPOINTS.marketplace.listingById(id));
    return response.data;
  },

  /**
   * Transition listing to UNDER_REVIEW
   */
  setUnderReview: async (id) => {
    const response = await axiosInstance.patch(API_ENDPOINTS.marketplace.underReview(id));
    return response.data;
  },

  /**
   * Approve listing and publish to Marketplace
   */
  approveListing: async (id) => {
    const response = await axiosInstance.patch(API_ENDPOINTS.marketplace.approve(id));
    return response.data;
  },

  /**
   * Reject listing with reason
   */
  rejectListing: async (id, { rejection_reason, admin_notes = null }) => {
    const response = await axiosInstance.patch(API_ENDPOINTS.marketplace.reject(id), {
      rejection_reason,
      admin_notes,
    });
    return response.data;
  },

  /**
   * Request changes from seller
   */
  requestChanges: async (id, { changes_requested_reason, admin_notes = null }) => {
    const response = await axiosInstance.patch(API_ENDPOINTS.marketplace.requestChanges(id), {
      changes_requested_reason,
      admin_notes,
    });
    return response.data;
  },

  /**
   * Unpublish listing from marketplace
   */
  unpublishListing: async (id, { admin_notes = null } = {}) => {
    const response = await axiosInstance.patch(API_ENDPOINTS.marketplace.unpublish(id), {
      admin_notes,
    });
    return response.data;
  },

  /**
   * Mark listing as SOLD and remove from active marketplace
   */
  markListingSold: async (id, { sold_price = null, admin_notes = null } = {}) => {
    const response = await axiosInstance.patch(API_ENDPOINTS.marketplace.markSold(id), {
      sold_price,
      admin_notes,
    });
    return response.data;
  },

  /**
   * Permanently delete / remove listing from marketplace
   */
  deleteListing: async (id, { reason = null } = {}) => {
    const response = await axiosInstance.delete(API_ENDPOINTS.marketplace.deleteListing(id), {
      data: { reason },
    });
    return response.data;
  },

  /**
   * Fetch all Marketplace orders
   */
  getOrders: async (params = {}) => {
    const response = await axiosInstance.get(API_ENDPOINTS.marketplace.orders, { params });
    return response.data;
  },

  /**
   * Fetch single Marketplace order by ID
   */
  getOrderById: async (id) => {
    const response = await axiosInstance.get(API_ENDPOINTS.marketplace.orderById(id));
    return response.data;
  },

  /**
   * Transition Marketplace order status
   */
  updateOrderStatus: async (orderId, { status, admin_notes = null }) => {
    const response = await axiosInstance.patch(API_ENDPOINTS.marketplace.orderStatus(orderId), {
      status,
      admin_notes,
    });
    return response.data;
  },

  /**
   * Fetch platform commission rate
   */
  getCommission: async () => {
    const response = await axiosInstance.get(API_ENDPOINTS.marketplace.commission);
    return response.data;
  },

  /**
   * Update platform commission settings
   */
  updateCommission: async (commission_percentage) => {
    const response = await axiosInstance.put(API_ENDPOINTS.marketplace.commission, {
      commission_percentage: Number(commission_percentage),
    });
    return response.data;
  },

  /**
   * Fetch active terms (SELLER or BUYER)
   */
  getActiveTerms: async (type = 'SELLER') => {
    const endpoint =
      String(type).toUpperCase() === 'BUYER'
        ? API_ENDPOINTS.marketplace.activeBuyerTerms
        : API_ENDPOINTS.marketplace.activeSellerTerms;
    const response = await axiosInstance.get(endpoint);
    return response.data;
  },

  /**
   * Fetch terms version history for admin review
   */
  getTermsHistory: async (type = 'SELLER') => {
    const response = await axiosInstance.get(API_ENDPOINTS.marketplace.terms, {
      params: { term_type: type },
    });
    return response.data;
  },

  /**
   * Publish new version of terms & conditions
   */
  saveTermsVersion: async ({ term_type = 'SELLER', version, title, content }) => {
    const response = await axiosInstance.post(API_ENDPOINTS.marketplace.terms, {
      term_type,
      version,
      title,
      content,
    });
    return response.data;
  },
};

export default marketplaceAdminService;
