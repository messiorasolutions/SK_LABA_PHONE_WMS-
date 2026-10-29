import { configureStore } from '@reduxjs/toolkit';
import heroReducer from './reducers/heroReducer';

export const store = configureStore({
  reducer: {
    hero: heroReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export default store;
