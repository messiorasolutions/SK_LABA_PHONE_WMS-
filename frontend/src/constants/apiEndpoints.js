
export const API_ENDPOINTS = {
  auth: {
    login: '/api/auth/login',
    me: '/api/auth/me',
    logout: '/api/auth/logout',
    csrfToken: '/api/auth/csrf-token',
    forgotPassword: '/api/auth/forgot-password',
    resetPassword: '/api/auth/reset-password',
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
    installments: (id) => `/api/phones/${id}/installments`,
  },
  reviews: {
    base: '/api/admin/reviews',
    byId: (id) => `/api/admin/reviews/${id}`,
    status: (id) => `/api/admin/reviews/${id}/status`,
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
