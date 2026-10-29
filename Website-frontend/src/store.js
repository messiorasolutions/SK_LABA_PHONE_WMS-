import { configureStore } from '@reduxjs/toolkit';
import heroReducer from './reducers/heroReducer';
import phoneReducer from './reducers/phoneReducer';
import brandReducer from './reducers/brandReducer';
import specificationReducer from './reducers/specificationReducer';
import storageReducer from './reducers/storageReducer';

export const store = configureStore({
  reducer: {
    hero: heroReducer,
    phone: phoneReducer,
    brand: brandReducer,
    specification: specificationReducer,
    storage: storageReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export default store;
