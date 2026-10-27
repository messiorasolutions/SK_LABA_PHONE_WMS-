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
  },
}
