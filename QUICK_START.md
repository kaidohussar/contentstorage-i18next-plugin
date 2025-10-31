# Quick Start Guide

Get up and running with ContentStorage i18next plugin in 5 minutes.

## Installation

```bash
npm install @contentstorage/i18next-plugin i18next
```

## Basic Setup

### Step 1: Configure i18next

```typescript
// i18n.ts
import i18next from 'i18next';
import ContentStorageBackend from '@contentstorage/i18next-plugin';

i18next
  .use(ContentStorageBackend)
  .init({
    backend: {
      contentKey: 'YOUR_CONTENT_KEY', // Get from ContentStorage dashboard
    },
    lng: 'en',
    fallbackLng: 'en',
    ns: ['common'],
    defaultNS: 'common',
  });

export default i18next;
```

### Step 2: Use in Your App

```typescript
// app.ts
import i18next from './i18n';

// Wait for translations to load
i18next.on('loaded', () => {
  console.log(i18next.t('welcome')); // "Welcome!"
});

// Or use with callback
i18next.init({...}, (err, t) => {
  if (err) return console.error(err);
  console.log(t('welcome'));
});
```

### Step 3: Test in Live Editor

1. Open your app with: `http://localhost:3000?contentstorage_live_editor=true`
2. Embed in an iframe (or use ContentStorage live editor)
3. Check console: `[ContentStorage] Live editor mode enabled`
4. Click on translated text to edit

## React Setup

```typescript
// i18n.ts
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import ContentStorageBackend from '@contentstorage/i18next-plugin';

i18next
  .use(ContentStorageBackend)
  .use(initReactI18next)
  .init({
    backend: {
      contentKey: 'YOUR_CONTENT_KEY',
    },
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes
    },
  });
```

```tsx
// App.tsx
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

## Next.js Setup

```typescript
// app/i18n.ts
import i18next from 'i18next';
import ContentStorageBackend from '@contentstorage/i18next-plugin';

i18next.use(ContentStorageBackend).init({
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

## Advanced Features

### Debug Mode

```typescript
i18next.use(ContentStorageBackend).init({
  backend: {
    contentKey: 'YOUR_KEY',
    debug: true, // Enable detailed logging
  },
});
```

### Custom CDN

```typescript
i18next.use(ContentStorageBackend).init({
  backend: {
    contentKey: 'YOUR_KEY',
    cdnBaseUrl: 'https://your-cdn.com',
  },
});
```

### Custom Load Path

```typescript
i18next.use(ContentStorageBackend).init({
  backend: {
    loadPath: '/locales/{{lng}}/{{ns}}.json',
  },
});
```

### Track Dynamic Translations

```typescript
import ContentStorageBackend, {
  ContentStoragePostProcessor
} from '@contentstorage/i18next-plugin';

i18next
  .use(ContentStorageBackend)
  .use(new ContentStoragePostProcessor({ debug: true }))
  .init({...});

// Now interpolations are tracked correctly
i18next.t('greeting', { name: 'John' }); // "Hello John"
```

## Verification

### Check if Live Editor Mode is Active

```javascript
// In browser console
console.log(window.memoryMap);
// Should show Map with translations if in live editor mode
```

### Debug Memory Map

```javascript
import { debugMemoryMap } from '@contentstorage/i18next-plugin';

debugMemoryMap();
// Logs detailed info about tracked translations
```

### Test Locally

```typescript
// Force live mode for local testing
i18next.use(ContentStorageBackend).init({
  backend: {
    contentKey: 'YOUR_KEY',
    forceLiveMode: true, // Always enable tracking
  },
});
```

## Common Issues

### Memory Map is Empty

**Problem**: `window.memoryMap` exists but has no entries.

**Solution**:
- Enable debug mode
- Check translations are loading (Network tab)
- Verify you're in live editor mode
- Use post-processor for dynamic translations

### Not Detecting Live Editor

**Problem**: Live editor mode not detected.

**Solution**:
- Check URL has `?contentstorage_live_editor=true`
- Verify app is in an iframe
- Use `forceLiveMode: true` for testing

### TypeScript Errors

**Problem**: Can't find type definitions.

**Solution**:
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

## Environment Variables

```bash
# .env
REACT_APP_CONTENTSTORAGE_KEY=your-key-here
# or for Next.js
NEXT_PUBLIC_CONTENTSTORAGE_KEY=your-key-here
```

## File Structure

```
src/
├── i18n.ts              # i18next configuration
├── App.tsx              # Your app
└── index.tsx            # Entry point
```

## Full Example

```typescript
// Complete example with all features
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import ContentStorageBackend, {
  ContentStoragePostProcessor,
} from '@contentstorage/i18next-plugin';

i18next
  .use(ContentStorageBackend)
  .use(new ContentStoragePostProcessor({ debug: true }))
  .use(initReactI18next)
  .init({
    backend: {
      contentKey: process.env.REACT_APP_CONTENTSTORAGE_KEY,
      debug: process.env.NODE_ENV === 'development',
      maxMemoryMapSize: 10000,
      trackNamespaces: ['common', 'homepage'],
    },
    lng: 'en',
    fallbackLng: 'en',
    ns: ['common', 'homepage'],
    defaultNS: 'common',
    interpolation: {
      escapeValue: false,
    },
  });
```

## What's Next?

- Check full [README.md](README.md) for all options
- See [examples/](examples/) for complete demos
- Read [CONTRIBUTING.md](CONTRIBUTING.md) to contribute
- Open issues for questions or bugs

## Help

- Documentation: [README.md](README.md)
- Examples: [examples/](examples/)
- Issues: GitHub Issues
- Support: support@contentstorage.app
