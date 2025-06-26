import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Simple English translations as default
const resources = {
  en: {
    translation: {
      "welcome": "Welcome",
      "dashboard": "Dashboard",
      "transactions": "Transactions",
      "inventory": "Inventory",
      "suppliers": "Suppliers",
      "bills": "Bills",
      "reports": "Reports",
      "settings": "Settings",
      // Add more keys as needed
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n; 