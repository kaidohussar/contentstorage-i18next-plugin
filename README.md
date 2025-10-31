# ContentStorage i18next Plugin

Official i18next plugin for [ContentStorage](https://contentstorage.app) live editor translation tracking.

## Features

- **Live Editor Integration** - Automatically detects and enables tracking when running in ContentStorage live editor
- **Translation Tracking** - Maps translation values to their keys for click-to-edit functionality
- **Zero Production Overhead** - Tracking only activates in live editor mode
- **TypeScript Support** - Full type definitions included
- **Memory Management** - Automatic cleanup of old entries to prevent memory leaks
- **Flexible Loading** - Support for CDN, custom URLs, or custom fetch functions
- **Post-Processor Support** - Track translations at resolution time for dynamic content

## Installation

```bash
npm install @contentstorage/i18next-plugin
```

## Quick Start

### Basic Usage (Backend Plugin)

```typescript
import i18next from 'i18next';
import ContentStorageBackend from '@contentstorage/i18next-plugin';

i18next
  .use(ContentStorageBackend)
  .init({
    backend: {
      contentKey: 'your-content-key-here', // Get this from ContentStorage dashboard
      debug: false,
    },
    lng: 'en',
    fallbackLng: 'en',
    ns: ['common', 'homepage'],
    defaultNS: 'common',
  });

// Use translations as normal
i18next.t('common:welcome'); // "Welcome to our site"
```

### With Post-Processor (Recommended)

For better tracking of dynamic translations with interpolations:

```typescript
import i18next from 'i18next';
import ContentStorageBackend, { ContentStoragePostProcessor } from '@contentstorage/i18next-plugin';

i18next
  .use(ContentStorageBackend)
  .use(new ContentStoragePostProcessor({ debug: false }))
  .init({
    backend: {
      contentKey: 'your-content-key',
    },
    lng: 'en',
    fallbackLng: 'en',
  });

// Interpolated translations are tracked correctly
i18next.t('greeting', { name: 'John' }); // "Hello John"
```

## Configuration Options

### Backend Options

```typescript
interface ContentStoragePluginOptions {
  /**
   * Your ContentStorage content key (required for default CDN)
   */
  contentKey?: string;

  /**
   * Custom CDN base URL
   * @default 'https://cdn.contentstorage.app'
   */
  cdnBaseUrl?: string;

  /**
   * Enable debug logging
   * @default false
   */
  debug?: boolean;

  /**
   * Maximum number of entries in memoryMap
   * @default 10000
   */
  maxMemoryMapSize?: number;

  /**
   * Custom load path (string template or function)
   * @example '{{lng}}/{{ns}}.json'
   * @example (lng, ns) => `https://my-cdn.com/${lng}/${ns}.json`
   */
  loadPath?: string | ((language: string, namespace: string) => string);

  /**
   * Custom fetch implementation
   */
  request?: (url: string, options: RequestInit) => Promise<any>;

  /**
   * Query parameter name for live editor detection
   * @default 'contentstorage_live_editor'
   */
  liveEditorParam?: string;

  /**
   * Force live mode (useful for testing)
   * @default false
   */
  forceLiveMode?: boolean;

  /**
   * Only track specific namespaces
   */
  trackNamespaces?: string[];
}
```

## Advanced Usage

### Custom CDN URL

```typescript
i18next.use(ContentStorageBackend).init({
  backend: {
    contentKey: 'your-key',
    cdnBaseUrl: 'https://your-custom-cdn.com',
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

// Or with a function
i18next.use(ContentStorageBackend).init({
  backend: {
    loadPath: (lng, ns) => {
      return `https://api.example.com/translations/${lng}/${ns}`;
    },
  },
});
```

### Custom Fetch with Authentication

```typescript
i18next.use(ContentStorageBackend).init({
  backend: {
    contentKey: 'your-key',
    request: async (url, options) => {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': 'Bearer YOUR_TOKEN',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return response.json();
    },
  },
});
```

### Track Only Specific Namespaces

```typescript
i18next.use(ContentStorageBackend).init({
  backend: {
    contentKey: 'your-key',
    trackNamespaces: ['common', 'marketing'], // Only track these
  },
  ns: ['common', 'marketing', 'admin'],
});
```

### Enable Debug Mode

```typescript
i18next
  .use(ContentStorageBackend)
  .use(new ContentStoragePostProcessor({ debug: true }))
  .init({
    backend: {
      contentKey: 'your-key',
      debug: true,
    },
  });

// Console output:
// [ContentStorage] Live editor mode enabled
// [ContentStorage] Loading translations: en/common
// [ContentStorage] Tracked 42 translations for common
```

## How It Works

### Live Editor Detection

The plugin automatically detects when your app is running in the ContentStorage live editor by checking:

1. The app is running in an iframe (`window.self !== window.top`)
2. The URL contains the query parameter `?contentstorage_live_editor=true`

Both conditions must be true for tracking to activate.

### Translation Tracking

When in live editor mode, the plugin maintains a global `window.memoryMap` that maps translation values to their keys:

```typescript
window.memoryMap = new Map([
  ["Welcome to our site", {
    ids: Set(["homepage.title", "banner.heading"]),
    type: "text",
    metadata: {
      namespace: "common",
      language: "en",
      trackedAt: 1704067200000
    }
  }],
  // ... more entries
]);
```

This allows the ContentStorage live editor to:
1. Find which translation keys produced a given text
2. Enable click-to-edit functionality
3. Highlight translatable content on the page

### Memory Management

The plugin automatically limits the size of `window.memoryMap` to prevent memory leaks:

- Default limit: 10,000 entries
- Oldest entries are removed first (based on `trackedAt` timestamp)
- Configurable via `maxMemoryMapSize` option

## Usage with React

### React 18+

```typescript
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import ContentStorageBackend from '@contentstorage/i18next-plugin';

i18next
  .use(ContentStorageBackend)
  .use(initReactI18next)
  .init({
    backend: {
      contentKey: 'your-key',
    },
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

// In your component
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();

  return <h1>{t('welcome')}</h1>;
}
```

## Usage with Next.js

### App Router (Next.js 13+)

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

```typescript
// app/[lang]/layout.tsx
'use client';

import { useEffect } from 'react';
import i18next from '../i18n';

export default function RootLayout({
  children,
  params: { lang },
}: {
  children: React.ReactNode;
  params: { lang: string };
}) {
  useEffect(() => {
    i18next.changeLanguage(lang);
  }, [lang]);

  return (
    <html lang={lang}>
      <body>{children}</body>
    </html>
  );
}
```

## Testing

### Force Live Mode

For testing purposes, you can force live mode:

```typescript
i18next.use(ContentStorageBackend).init({
  backend: {
    contentKey: 'your-key',
    forceLiveMode: true, // Always enable tracking
  },
});
```

### Debug Memory Map

```typescript
import { debugMemoryMap } from '@contentstorage/i18next-plugin';

// In browser console or your code
debugMemoryMap();

// Output:
// [ContentStorage] Memory map contents:
// Total entries: 156
// ┌─────────┬──────────────────────────────┬─────────────────────┐
// │ (index) │ value                        │ keys                │
// │ namespace                                                     │
// ├─────────┼──────────────────────────────┼─────────────────────┤
// │    0    │ 'Welcome to our site'        │ 'homepage.title'    │
// │ 'common'                                                      │
// └─────────┴──────────────────────────────┴─────────────────────┘
```

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES2019+ features required
- `fetch` API required (polyfill if needed for older browsers)

## TypeScript

Full TypeScript support included with type definitions:

```typescript
import type {
  ContentStoragePluginOptions,
  MemoryMap,
  MemoryMapEntry,
  ContentStorageWindow,
} from '@contentstorage/i18next-plugin';
```

## Performance

- **Zero overhead in production** - Tracking only happens in live editor
- **Minimal overhead in editor** - Simple Map operations, ~1ms per translation
- **Automatic cleanup** - Old entries removed to prevent memory leaks
- **One-time tracking** - Translations tracked once on load, not on every render

## Troubleshooting

### memoryMap is empty

**Problem**: `window.memoryMap` exists but has no entries.

**Solutions**:
- Verify you're in an iframe: `window.self !== window.top`
- Check URL has `?contentstorage_live_editor=true`
- Enable debug mode to see what's being tracked
- Ensure translations are loading (check network tab)

### Live editor can't find translations

**Problem**: Clicking on translated text doesn't work in live editor.

**Solutions**:
- Verify translation values exactly match rendered text
- Use post-processor for dynamic translations
- Check that tracking happens before DOM renders
- Enable debug mode and check console logs

### TypeScript errors

**Problem**: TypeScript can't find type definitions.

**Solutions**:
- Ensure `@types/i18next` is installed
- Check `tsconfig.json` has `"esModuleInterop": true`
- Try importing types explicitly: `import type { ... }`

### CORS errors

**Problem**: Cannot load translations from CDN.

**Solutions**:
- Verify your contentKey is correct
- Check CDN URL in network tab
- Ensure ContentStorage CDN allows your domain
- Use custom `request` function to debug

## Contributing

Contributions are welcome! Please see our [Contributing Guide](CONTRIBUTING.md).

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

- Documentation: https://docs.contentstorage.app
- Issues: https://github.com/contentstorage/i18next-plugin/issues
- Email: support@contentstorage.app
