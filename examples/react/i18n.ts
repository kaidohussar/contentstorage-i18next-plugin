import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import ContentStorageBackend, { ContentStoragePostProcessor } from '@contentstorage/i18next-plugin';

i18next
  // Use the ContentStorage backend
  .use(ContentStorageBackend)
  // Use the post-processor for tracking dynamic translations
  .use(new ContentStoragePostProcessor({ debug: true }))
  // React integration
  .use(initReactI18next)
  .init({
    backend: {
      // Get your content key from ContentStorage dashboard
      contentKey: process.env.REACT_APP_CONTENTSTORAGE_KEY || 'demo-key',

      // Enable debug mode in development
      debug: process.env.NODE_ENV === 'development',

      // Custom CDN URL (optional)
      // cdnBaseUrl: 'https://your-cdn.com',

      // Or use a custom load path
      // loadPath: '/locales/{{lng}}/{{ns}}.json',

      // Only track specific namespaces (optional)
      // trackNamespaces: ['common', 'homepage'],
    },

    lng: 'en',
    fallbackLng: 'en',

    ns: ['translation'],
    defaultNS: 'translation',

    interpolation: {
      escapeValue: false, // React already escapes
    },

    react: {
      useSuspense: false,
    },
  });

export default i18next;
