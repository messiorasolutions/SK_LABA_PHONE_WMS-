import './styles/index.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import store from './store';
import { ShopInfoProvider } from './context/ShopInfoContext';
import App from './App.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <ShopInfoProvider>
        <App />
      </ShopInfoProvider>
    </Provider>
  </React.StrictMode>
);
