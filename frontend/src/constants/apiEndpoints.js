
export const API_ENDPOINTS = {
  auth: {
    login: '/api/auth/login',
    me: '/api/auth/me',
    logout: '/api/auth/logout',
    csrfToken: '/api/auth/csrf-token',
    forgotPassword: '/api/auth/forgot-password',
    resetPassword: '/api/auth/reset-password',
    verifyAccount: '/api/auth/verify-account',
    profile: '/api/auth/profile',
    avatar: '/api/auth/avatar',
    changePassword: '/api/auth/change-password',
  },

  users: {
    base: '/api/users',
    byId: (id) => `/api/users/${id}`,
    status: (id) => `/api/users/${id}/status`,
  },

  inquiries: {
    base: '/api/inquiries',
    byId: (id) => `/api/inquiries/${id}`,
    status: (id) => `/api/inquiries/${id}/status`,
  },

  reservations: {
    base: '/api/reservations',
    byId: (id) => `/api/reservations/${id}`,
    status: (id) => `/api/reservations/${id}/status`,
    assign: (id) => `/api/reservations/${id}/assign`,
  },

  sellRequests: {
    base: '/api/sell-requests',
    byId: (id) => `/api/sell-requests/${id}`,
    status: (id) => `/api/sell-requests/${id}/status`,
    assign: (id) => `/api/sell-requests/${id}/assign`,
    photo: (id, filename) => `/api/sell-requests/${id}/photos/${encodeURIComponent(filename)}`,
  },

  brands: {
    base: '/api/brands',
    byId: (id) => `/api/brands/${id}`,
  },
  storageOptions: {
    base: '/api/storage-options',
    byId: (id) => `/api/storage-options/${id}`,
  },
  specifications: {
    base: '/api/specifications',
    byId: (id) => `/api/specifications/${id}`,
  },
  phones: {
    base: '/api/phones',
    byId: (id) => `/api/phones/${id}`,
    status: (id) => `/api/phones/${id}/status`,
    archive: (id) => `/api/phones/${id}/archive`,
    restore: (id) => `/api/phones/${id}/restore`,
    stockList: '/api/phones/stock',
    stockHistory: (id) => `/api/phones/${id}/stock/history`,
    allStockHistory: '/api/phones/stock/history',
    addStock: (id) => `/api/phones/${id}/stock/add`,
    removeStock: (id) => `/api/phones/${id}/stock/remove`,
    markSoldOut: (id) => `/api/phones/${id}/stock/sold-out`,
    image: (id, colorId) => `/api/phones/${id}/colors/${colorId}/images`,
    deleteImage: (id, colorId, imageId) => `/api/phones/${id}/colors/${colorId}/images/${imageId}`,
  },
  installmentPlans: {
    base: '/api/installment-plans',
    byId: (id) => `/api/installment-plans/${id}`,
    status: (id) => `/api/installment-plans/${id}/status`,
  },
  offers: {
    base: '/api/offers',
    byId: (id) => `/api/offers/${id}`,
    status: (id) => `/api/offers/${id}/status`,
  },
  reviews: {
    base: '/api/admin/reviews',
    byId: (id) => `/api/admin/reviews/${id}`,
    status: (id) => `/api/admin/reviews/${id}/status`,
  },
  customerReviews: {
    base: '/api/customer-reviews',
    byId: (id) => `/api/customer-reviews/${id}`,
    status: (id) => `/api/customer-reviews/${id}/status`,
    featured: (id) => `/api/customer-reviews/${id}/featured`,
  },
  backInStock: {
    base: '/api/back-in-stock-requests',
    byId: (id) => `/api/back-in-stock-requests/${id}`,
    status: (id) => `/api/back-in-stock-requests/${id}/status`,
  },
  backInStockRequests: {
    base: '/api/back-in-stock-requests',
    grouped: '/api/back-in-stock-requests/grouped',
    byPhoneId: (phoneId) => `/api/back-in-stock-requests/phones/${phoneId}`,
    byId: (id) => `/api/back-in-stock-requests/${id}`,
    status: (id) => `/api/back-in-stock-requests/${id}/status`,
    assign: (id) => `/api/back-in-stock-requests/${id}/assign`,
  },
};

export default API_ENDPOINTS;
