// ============================================================
// API ENDPOINTS — All routes in one place, never hardcode URLs
// Base URL is read from .env (VITE_API_BASE_URL)
// ============================================================

export const API_ENDPOINTS = {
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
    compare: '/api/phones/compare',
    favorites: '/api/phones/favorites',
    installments: (id) => `/api/phones/${id}/installments`,
    offer: (id) => `/api/phones/${id}/offer`,
  },
  inquiries: {
    base: '/api/inquiries',
  },
  reservations: {
    base: '/api/reservations',
  },
  offers: {
    base: '/api/offers',
    active: '/api/offers/active',
    byId: (id) => `/api/offers/${id}`,
  },
};

export default API_ENDPOINTS;
