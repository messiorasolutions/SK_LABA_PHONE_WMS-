// ============================================================
// API ENDPOINTS — SK LABA PHONE WMS DASHBOARD
// Base URL is read from .env (VITE_API_BASE_URL)
// ============================================================

export const API_ENDPOINTS = {
  // Authentication (PDF 2)
  auth: {
    login: '/api/auth/login',
    me: '/api/auth/me',
    logout: '/api/auth/logout',
    csrfToken: '/api/auth/csrf-token',
    forgotPassword: '/api/auth/forgot-password',
    resetPassword: '/api/auth/reset-password',
  },

  // User & Role Management (PDF 2)
  users: {
    base: '/api/users',
    byId: (id) => `/api/users/${id}`,
    status: (id) => `/api/users/${id}/status`,
  },

  // Inquiries & Leads (PDF 1)
  inquiries: {
    base: '/api/inquiries',
    byId: (id) => `/api/inquiries/${id}`,
    status: (id) => `/api/inquiries/${id}/status`,
  },

  // WMS Inventory & Catalog
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
};

export default API_ENDPOINTS;
