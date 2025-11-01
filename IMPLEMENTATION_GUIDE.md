# Quick Implementation Guide

## 5-Minute Setup

### Step 1: Install the Plugin

```bash
npm install @contentstorage/i18next-plugin i18next
```

### Step 2: Configure i18next

Create an `i18n.js` or `i18n.ts` file:

```javascript
import i18next from 'i18next';
import ContentstorageBackend from '@contentstorage/i18next-plugin';

i18next
  .use(ContentstorageBackend)
  .init({
    backend: {
      contentKey: 'YOUR_CONTENTSTORAGE_KEY', // Get this from Contentstorage dashboard
    },
    lng: 'en',              // Default language
    fallbackLng: 'en',      // Fallback language
    ns: ['common'],         // Namespaces
    defaultNS: 'common',    // Default namespace
  });

export default i18next;
```

### Step 3: Use Translations

```javascript
import i18next from './i18n';

// Wait for translations to load
i18next.on('loaded', () => {
  console.log(i18next.t('welcome')); // "Welcome!"
});
```

## React Setup (2 minutes)

```javascript
// i18n.js
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import ContentstorageBackend from '@contentstorage/i18next-plugin';

i18next
  .use(ContentstorageBackend)
  .use(initReactI18next)
  .init({
    backend: {
      contentKey: process.env.REACT_APP_CONTENTSTORAGE_KEY,
    },
    lng: 'en',
    fallbackLng: 'en',
  });
```

```jsx
// App.jsx
import { useTranslation } from 'react-i18next';
import './i18n';

function App() {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('welcome')}</h1>
      <p>{t('description')}</p>
    </div>
  );
}
```

## How It Works

1. **In Production**: Plugin loads translations from Contentstorage CDN - zero tracking overhead
2. **In Live Editor**: When your app opens in Contentstorage editor with `?contentstorage_live_editor=true`:
   - Plugin detects iframe + URL parameter
   - Creates `window.memoryMap` to track translations
   - Maps translated text → translation keys
   - Enables click-to-edit functionality

## Configuration Options

### Basic Options

```javascript
{
  backend: {
    contentKey: 'your-key',        // Required for default CDN
    debug: false,                  // Enable console logs
    maxMemoryMapSize: 10000,      // Max tracked translations
  }
}
```

### Advanced Options

```javascript
{
  backend: {
    // Custom CDN
    cdnBaseUrl: 'https://your-cdn.com',

    // Custom load path
    loadPath: '/locales/{{lng}}/{{ns}}.json',

    // Or function
    loadPath: (lng, ns) => `https://api.com/${lng}/${ns}`,

    // Custom fetch with auth
    request: async (url, options) => {
      const res = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': 'Bearer TOKEN'
        }
      });
      return res.json();
    },

    // Track only specific namespaces
    trackNamespaces: ['common', 'homepage'],
  }
}
```

## Enhanced Tracking (Optional)

For better tracking of dynamic translations with variables:

```javascript
import ContentstorageBackend, {
  ContentstoragePostProcessor
} from '@contentstorage/i18next-plugin';

i18next
  .use(ContentstorageBackend)
  .use(new ContentstoragePostProcessor({ debug: true }))
  .init({...});

// Now these are tracked correctly:
i18next.t('greeting', { name: 'John' }); // "Hello John"
i18next.t('items', { count: 5 });        // "5 items"
```

## Next.js Setup

```javascript
// app/i18n.ts
import i18next from 'i18next';
import ContentstorageBackend from '@contentstorage/i18next-plugin';

i18next.use(ContentstorageBackend).init({
  backend: {
    contentKey: process.env.NEXT_PUBLIC_CONTENTSTORAGE_KEY,
  },
  lng: 'en',
  fallbackLng: 'en',
});

export default i18next;
```

```tsx
// app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import i18next from './i18n';

export default function Page() {
  const [text, setText] = useState('');

  useEffect(() => {
    setText(i18next.t('welcome'));
  }, []);

  return <h1>{text}</h1>;
}
```

## Debugging

### Enable Debug Mode

```javascript
i18next.use(ContentstorageBackend).init({
  backend: { debug: true },
  debug: true, // Also enable i18next debug
});
```

### Check Memory Map

```javascript
// In browser console
console.log(window.memoryMap);

// Or use helper
import { debugMemoryMap } from '@contentstorage/i18next-plugin';
debugMemoryMap();
```

### Force Live Mode (Testing)

```javascript
i18next.use(ContentstorageBackend).init({
  backend: {
    forceLiveMode: true, // Always enable tracking
  },
});
```

## Common Issues

### Translations Not Loading

✅ Check your contentKey is correct
✅ Check network tab for 404 errors
✅ Verify CDN URL is accessible

### Live Editor Not Working

✅ Ensure URL has `?contentstorage_live_editor=true`
✅ Check you're in an iframe
✅ Enable debug mode to see logs

### TypeScript Errors

```bash
npm install --save-dev @types/i18next
```

```json
// tsconfig.json
{
  "compilerOptions": {
    "esModuleInterop": true
  }
}
```

## File Structure

```
your-project/
├── src/
│   ├── i18n.js          # i18next configuration
│   └── App.js           # Your app
├── .env                 # Environment variables
└── package.json
```

## Environment Variables

```bash
# .env
REACT_APP_CONTENTSTORAGE_KEY=your-key-here
# or for Next.js
NEXT_PUBLIC_CONTENTSTORAGE_KEY=your-key-here
```

## That's It!

Your app now:
- ✅ Loads translations from Contentstorage
- ✅ Works normally in production
- ✅ Enables click-to-edit in live editor

For more details, see [README.md](README.md)
