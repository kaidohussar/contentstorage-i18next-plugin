import i18next from 'i18next';
import ContentStorageBackend, { ContentStoragePostProcessor } from '@contentstorage/i18next-plugin';

// Initialize i18next with ContentStorage backend
i18next
  .use(ContentStorageBackend)
  .use(new ContentStoragePostProcessor({ debug: true }))
  .init({
    backend: {
      contentKey: process.env.NEXT_PUBLIC_CONTENTSTORAGE_KEY || 'demo-key',
      debug: process.env.NODE_ENV === 'development',

      // Next.js specific: Use custom load path for server-side rendering
      loadPath: (lng: string, ns: string) => {
        // In production, this would point to your CDN
        return `${process.env.NEXT_PUBLIC_CDN_URL}/${lng}/${ns}.json`;
      },
    },

    lng: 'en',
    fallbackLng: 'en',
    ns: ['common', 'homepage'],
    defaultNS: 'common',

    interpolation: {
      escapeValue: false,
    },
  });

export default i18next;
