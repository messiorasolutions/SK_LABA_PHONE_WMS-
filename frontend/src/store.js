import { configureStore } from '@reduxjs/toolkit';
import brandReducer from './reducers/brandReducer';
import storageReducer from './reducers/storageReducer';
import specificationReducer from './reducers/specificationReducer';
import phoneReducer from './reducers/phoneReducer';

export const store = configureStore({
  reducer: {
    brands: brandReducer,
    storage: storageReducer,
    specifications: specificationReducer,
    phones: phoneReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export default store;
