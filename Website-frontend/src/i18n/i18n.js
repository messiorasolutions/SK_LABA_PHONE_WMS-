import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import si from './locales/si.json';

const savedLanguage = (() => {
  try {
    return localStorage.getItem('sk_app_language') || 'en';
  } catch (_) {
    return 'en';
  }
})();

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      si: { translation: si },
    },
    lng: savedLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

i18n.on('languageChanged', (lng) => {
  try {
    localStorage.setItem('sk_app_language', lng);
  } catch (_) {}
});

export default i18n;
