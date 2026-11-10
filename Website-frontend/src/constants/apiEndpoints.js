
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
  sellRequests: {
    base: '/api/sell-requests',
  },
  reviews: {
    base: '/api/reviews',
  },
  backInStockRequests: {
    base: '/api/back-in-stock-requests',
  },
  offers: {
    base: '/api/offers',
    active: '/api/offers/active',
    byId: (id) => `/api/offers/${id}`,
  },
  marketplace: {
    base: '/api/marketplace',
    submit: '/api/marketplace/submit',
    phones: '/api/marketplace/phones',
    byId: (id) => `/api/marketplace/phones/${id}`,
    sellerTerms: '/api/marketplace/terms/seller',
    buyerTerms: '/api/marketplace/terms/buyer',
    orders: '/api/marketplace/orders',
    commission: '/api/marketplace/commission',
  },
};

export default API_ENDPOINTS;
