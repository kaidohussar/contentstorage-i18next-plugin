# Contentstorage i18next Plugin - Complete Integration Guide

This guide provides comprehensive instructions for integrating the Contentstorage i18next plugin into your application to enable live editing of translations.

## Table of Contents

- [What is This Plugin?](#what-is-this-plugin)
- [How It Works](#how-it-works)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Integration Scenarios](#integration-scenarios)
  - [Using Inline Resources](#using-inline-resources)
  - [Using HTTP Backend](#using-http-backend)
  - [Using Contentstorage CDN](#using-contentstorage-cdn)
- [Framework-Specific Guides](#framework-specific-guides)
  - [React with react-i18next](#react-with-react-i18next)
  - [Next.js](#nextjs)
  - [Vue with vue-i18next](#vue-with-vue-i18next)
  - [Vanilla JavaScript](#vanilla-javascript)
- [Configuration Options](#configuration-options)
- [Testing in Live Editor](#testing-in-live-editor)
- [Troubleshooting](#troubleshooting)
- [Migration Guide](#migration-guide)

---

## What is This Plugin?

The Contentstorage i18next plugin enables **click-to-edit functionality** in the Contentstorage Live Editor. It tracks which translations are displayed on your page and maps them to their content IDs, allowing editors to click on any text and edit it directly.

### Key Features

- ✅ Automatic translation tracking for Live Editor
- ✅ Works with any translation loading method (inline, files, CDN)
- ✅ Supports all i18next features (interpolation, plurals, contexts)
- ✅ Compatible with React, Vue, Next.js, and vanilla JavaScript
- ✅ Zero configuration for basic usage
- ✅ TypeScript support included

---

## How It Works

The plugin consists of two main components:

### 1. Backend Plugin (Recommended)
Loads translations from Contentstorage CDN and **automatically enables live editor tracking**:
```
Fetches: https://cdn.contentstorage.app/{contentKey}/content/EN.json
Auto-registers: Live editor post-processor for click-to-edit
```

**When you use the backend plugin, live editor support is automatic - no extra config needed!**

### 2. Live Editor Post-Processor (Standalone)
Can be used independently with inline resources or other backends:
```
User sees: "Welcome to our site"
Plugin tracks: text="Welcome to our site" → contentId="welcome"
```

**Note:** When using standalone post-processor (without the backend), you must add `postProcess: ['contentstorage']` to your i18next config.

---

## Installation

```bash
npm install @contentstorage/i18next-plugin
```

Or with yarn:
```bash
yarn add @contentstorage/i18next-plugin
```

Or with pnpm:
```bash
pnpm add @contentstorage/i18next-plugin
```

---

## Quick Start

### Option 1: Using Contentstorage Backend (Easiest)

The backend plugin automatically enables live editor tracking:

```typescript
import i18next from 'i18next';
import ContentstorageBackend from '@contentstorage/i18next-plugin';

i18next
  .use(ContentstorageBackend)
  .init({
    backend: {
      contentKey: 'your-content-key',
    },
    lng: 'en',
    fallbackLng: 'en',
  });
```

**That's it!** Live editor tracking is automatically enabled. No `postProcess` config needed.

---

### Option 2: Using Inline Resources

If you're using inline resources, add the post-processor:

```typescript
import i18next from 'i18next';
import { ContentstorageLiveEditorPostProcessor } from '@contentstorage/i18next-plugin';

i18next
  .use(new ContentstorageLiveEditorPostProcessor())
  .init({
    resources: {
      en: { translation: { welcome: "Welcome" } }
    },
    postProcess: ['contentstorage'], // Required for standalone post-processor
  });
```

---

## Integration Scenarios

### Using Inline Resources

**When to use:** You bundle translations directly in your JavaScript code.

```typescript
import i18next from 'i18next';
import { ContentstorageLiveEditorPostProcessor } from '@contentstorage/i18next-plugin';
import enTranslations from './locales/en.json';
import esTranslations from './locales/es.json';

i18next
  .use(new ContentstorageLiveEditorPostProcessor({ debug: true }))
  .init({
    resources: {
      en: { translation: enTranslations },
      es: { translation: esTranslations },
    },
    lng: 'en',
    fallbackLng: 'en',

    // Enable tracking for Live Editor
    postProcess: ['contentstorage'],
  });
```

**Why `postProcess` is needed:** When using inline resources, i18next doesn't load files, so the plugin must track translations at the point of use.

---

### Using HTTP Backend

**When to use:** You load translations from your own server or CDN.

```typescript
import i18next from 'i18next';
import HttpBackend from 'i18next-http-backend';
import { ContentstorageLiveEditorPostProcessor } from '@contentstorage/i18next-plugin';

i18next
  .use(HttpBackend)
  .use(new ContentstorageLiveEditorPostProcessor({ debug: true }))
  .init({
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    lng: 'en',
    fallbackLng: 'en',

    // Enable tracking for Live Editor
    postProcess: ['contentstorage'],
  });
```

**Benefits:**
- Use your existing translation infrastructure
- Full Live Editor support
- No changes to your deployment process

---

### Using Contentstorage CDN

**When to use:** You want to load translations directly from Contentstorage and enable Live Editor.

```typescript
import i18next from 'i18next';
import ContentstorageBackend from '@contentstorage/i18next-plugin';

i18next
  .use(ContentstorageBackend)
  .init({
    backend: {
      contentKey: 'your-content-key', // Get this from Contentstorage dashboard
      debug: true,
    },
    lng: 'en',
    fallbackLng: 'en',
  });
```

**Benefits:**
- Single source of truth for translations
- Automatic CDN delivery
- **Automatic live editor tracking** (no postProcess config needed!)
- Zero configuration for live editor support

---

## Framework-Specific Guides

### React with react-i18next

**Step 1: Install dependencies**
```bash
npm install i18next react-i18next @contentstorage/i18next-plugin
```

**Step 2: Create i18n configuration file (`src/i18n.ts`)**
```typescript
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import { ContentstorageLiveEditorPostProcessor } from '@contentstorage/i18next-plugin';
import enTranslations from './locales/en.json';

i18next
  .use(new ContentstorageLiveEditorPostProcessor({ debug: true }))
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslations },
    },
    lng: 'en',
    fallbackLng: 'en',

    // Required for Live Editor
    postProcess: ['contentstorage'],

    interpolation: {
      escapeValue: false, // React already escapes
    },
  });

export default i18next;
```

**Step 3: Import in your app**
```typescript
// src/index.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import './i18n'; // Import i18n config
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

**Step 4: Use translations in components**
```typescript
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('welcome')}</h1>
      <p>{t('description', { name: 'User' })}</p>
    </div>
  );
}
```

**With Trans component:**
```typescript
import { Trans } from 'react-i18next';

function MyComponent() {
  return (
    <Trans i18nKey="welcome_html">
      Welcome to <strong>our site</strong>
    </Trans>
  );
}
```

---

### Next.js

**For App Router (Next.js 13+):**

**Step 1: Create i18n config (`app/i18n.ts`)**
```typescript
import i18next from 'i18next';
import { ContentstorageLiveEditorPostProcessor } from '@contentstorage/i18next-plugin';
import enTranslations from './locales/en.json';

i18next
  .use(new ContentstorageLiveEditorPostProcessor({ debug: true }))
  .init({
    resources: {
      en: { translation: enTranslations },
    },
    lng: 'en',
    fallbackLng: 'en',

    // Required for Live Editor
    postProcess: ['contentstorage'],

    interpolation: {
      escapeValue: false,
    },
  });

export default i18next;
```

**Step 2: Create a client wrapper (`app/components/I18nProvider.tsx`)**
```typescript
'use client';

import { useEffect } from 'react';
import i18next from '../i18n';

export function I18nProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize i18next on client side
    i18next.init();
  }, []);

  return <>{children}</>;
}
```

**Step 3: Use in layout**
```typescript
import { I18nProvider } from './components/I18nProvider';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
```

---

### Vue with vue-i18next

```typescript
import { createApp } from 'vue';
import i18next from 'i18next';
import I18NextVue from 'i18next-vue';
import { ContentstorageLiveEditorPostProcessor } from '@contentstorage/i18next-plugin';
import App from './App.vue';

i18next
  .use(new ContentstorageLiveEditorPostProcessor({ debug: true }))
  .init({
    resources: {
      en: { translation: { welcome: 'Welcome' } },
    },
    lng: 'en',
    fallbackLng: 'en',

    // Required for Live Editor
    postProcess: ['contentstorage'],
  });

createApp(App)
  .use(I18NextVue, { i18next })
  .mount('#app');
```

**In Vue components:**
```vue
<template>
  <div>
    <h1>{{ $t('welcome') }}</h1>
  </div>
</template>
```

---

### Vanilla JavaScript

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/i18next/i18next.min.js"></script>
  <script src="https://unpkg.com/@contentstorage/i18next-plugin/dist/index.js"></script>
</head>
<body>
  <div id="content"></div>

  <script>
    const { ContentstoragePostProcessor } = window.ContentstorageI18nextPlugin;

    i18next
      .use(new ContentstorageLiveEditorPostProcessor({ debug: true }))
      .init({
        resources: {
          en: {
            translation: {
              welcome: 'Welcome to our site'
            }
          }
        },
        lng: 'en',
        fallbackLng: 'en',
        postProcess: ['contentstorage'],
      }, function(err, t) {
        document.getElementById('content').innerHTML = t('welcome');
      });
  </script>
</body>
</html>
```

---

## Configuration Options

### ContentstorageLiveEditorPostProcessor Options

```typescript
new ContentstorageLiveEditorPostProcessor({
  // Enable debug logging in console
  debug: true,

  // Query parameter to detect live editor mode
  // Default: 'contentstorage_live_editor'
  liveEditorParam: 'contentstorage_live_editor',

  // Force live mode even outside iframe (for testing)
  forceLiveMode: false,
})
```

### ContentstorageBackend Options (Optional)

Only needed if loading translations from Contentstorage CDN:

```typescript
i18next
  .use(ContentstorageBackend)
  .init({
    backend: {
      // Your Contentstorage content key (required)
      contentKey: 'your-content-key',

      // Enable debug logging
      debug: true,

      // Maximum memory map size
      maxMemoryMapSize: 10000,

      // Custom load path (optional)
      loadPath: '/custom/path/{{lng}}/{{ns}}.json',

      // Custom fetch function (optional)
      request: async (url, options) => {
        const response = await fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            'Authorization': 'Bearer token',
          },
        });
        return response.json();
      },

      // Only track specific namespaces
      trackNamespaces: ['common', 'homepage'],
    },
  });
```

### i18next Configuration

```typescript
i18next.init({
  // Enable the post-processor (REQUIRED for Live Editor)
  postProcess: ['contentstorage'],

  // Your language settings
  lng: 'en',
  fallbackLng: 'en',

  // Namespaces
  ns: ['translation'],
  defaultNS: 'translation',

  // Other i18next options...
});
```

---

## Testing in Live Editor

### Step 1: Verify Plugin is Loaded

Open browser console and check for:
```
[Contentstorage] Live editor mode enabled
[Contentstorage] Live editor ready
```

If you see `Running in normal mode`, the Live Editor is not detected.

### Step 2: Check Memory Map

In browser console:
```javascript
window.memoryMap
```

Should show a `Map` with entries:
```
Map(3) {
  "Welcome" => { ids: Set(1) { "welcome" }, type: "text", ... },
  "Click here" => { ids: Set(1) { "cta.button" }, type: "text", ... },
  ...
}
```

If it's empty or undefined, the post-processor is not tracking.

### Step 3: Enable Force Live Mode (for local testing)

```typescript
i18next
  .use(new ContentstorageLiveEditorPostProcessor({
    debug: true,
    forceLiveMode: true  // Always enable tracking
  }))
  .init({
    postProcess: ['contentstorage'],
  });
```

Then check `window.memoryMap` again.

---

## Troubleshooting

### Problem: memoryMap is empty

**Solution 1:** Make sure `postProcess: ['contentstorage']` is in your i18next config

**Solution 2:** Check that you're using the post-processor:
```typescript
.use(new ContentstorageLiveEditorPostProcessor())
```

**Solution 3:** Verify translations are being called. The post-processor only tracks when `t()` is actually called.

### Problem: "Running in normal mode" in console

**Cause:** Plugin doesn't detect it's in Live Editor iframe.

**Solution:** Use `forceLiveMode: true` for local testing:
```typescript
new ContentstorageLiveEditorPostProcessor({ forceLiveMode: true })
```

### Problem: Text is not clickable in Live Editor

**Cause:** The content ID in memoryMap doesn't match Contentstorage content ID.

**Solution 1:** Check `window.memoryMap` to see tracked IDs:
```javascript
window.memoryMap.get("Your translation text")
// Should show: { ids: Set(1) { "your.content.id" } }
```

**Solution 2:** Ensure your translation keys match Contentstorage content IDs exactly.

### Problem: TypeScript errors with imports

**Solution:** The plugin includes TypeScript definitions. Make sure you're importing correctly:
```typescript
import { ContentstorageLiveEditorPostProcessor } from '@contentstorage/i18next-plugin';
```

### Problem: Post-processor not running

**Verify these two requirements:**
1. Post-processor is registered: `.use(new ContentstorageLiveEditorPostProcessor())`
2. Post-processor is enabled: `postProcess: ['contentstorage']` in init config

Both are required!

---

## Migration Guide

### From v1.x to v2.x

**Breaking Changes:**
1. All exports renamed from `ContentStorage*` to `Contentstorage*`
2. Post-processor name changed from `contentStorageTracker` to `contentstorage`

**Before (v1.x):**
```typescript
import { ContentStoragePostProcessor } from '@contentstorage/i18next-plugin';

i18next
  .use(new ContentStoragePostProcessor())
  .init({
    postProcess: ['contentStorageTracker'], // Old name
  });
```

**After (v2.x):**
```typescript
import { ContentstorageLiveEditorPostProcessor } from '@contentstorage/i18next-plugin';

i18next
  .use(new ContentstorageLiveEditorPostProcessor())
  .init({
    postProcess: ['contentstorage'], // New name
  });
```

**Migration Steps:**
1. Update imports: `ContentStorage*` → `Contentstorage*`
2. Update postProcess config: `contentStorageTracker` → `contentstorage`
3. Run tests to verify everything works

---

## Best Practices

### 1. Use Debug Mode During Development

```typescript
new ContentstorageLiveEditorPostProcessor({
  debug: process.env.NODE_ENV === 'development'
})
```

### 2. Only Track What You Need

If using the backend plugin with multiple namespaces:
```typescript
backend: {
  trackNamespaces: ['common', 'homepage'], // Don't track admin, errors, etc.
}
```

### 3. Keep Translation Keys Clean

Use simple, descriptive keys that match your Contentstorage content IDs:
```typescript
// Good
t('welcome')
t('header.title')
t('cta.button')

// Avoid
t('translation:welcome')  // Namespace prefix not needed
t('page1.section2.item3.text')  // Too deeply nested
```

### 4. Test in Live Editor Early

Don't wait until production. Test Live Editor integration during development:
```typescript
new ContentstorageLiveEditorPostProcessor({ forceLiveMode: true })
```

### 5. Monitor Memory Map Size

For large applications, limit memory map size:
```typescript
backend: {
  maxMemoryMapSize: 5000,  // Adjust based on your needs
}
```

---

## Support

- **Documentation:** [https://docs.contentstorage.app](https://docs.contentstorage.app)
- **GitHub Issues:** [https://github.com/contentstorage/i18next-plugin/issues](https://github.com/contentstorage/i18next-plugin/issues)
- **npm Package:** [https://www.npmjs.com/package/@contentstorage/i18next-plugin](https://www.npmjs.com/package/@contentstorage/i18next-plugin)

---

## License

MIT License - see LICENSE file for details
