import './styles/index.css';
import './i18n/i18n';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import store from './store';
import { ShopInfoProvider } from './context/ShopInfoContext';
import App from './App.jsx';
import { API_BASE_URL } from './services/axiosInstance';

// Dynamically preconnect to the actual backend API origin
if (typeof window !== 'undefined' && API_BASE_URL) {
  try {
    const apiOrigin = new URL(API_BASE_URL, window.location.origin).origin;
    if (apiOrigin && apiOrigin !== window.location.origin) {
      const preconnectLink = document.createElement('link');
      preconnectLink.rel = 'preconnect';
      preconnectLink.href = apiOrigin;
      preconnectLink.crossOrigin = 'anonymous';
      document.head.appendChild(preconnectLink);

      const dnsPrefetchLink = document.createElement('link');
      dnsPrefetchLink.rel = 'dns-prefetch';
      dnsPrefetchLink.href = apiOrigin;
      document.head.appendChild(dnsPrefetchLink);
    }
  } catch (_) {}
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <ShopInfoProvider>
        <App />
      </ShopInfoProvider>
    </Provider>
  </React.StrictMode>
);
