# App Documentation Guide - postProcess Config Changes

## What Changed in v2.0.3

The `postProcess: ['contentstorage']` configuration is **no longer required** when using the `ContentstorageBackend` plugin. The backend now automatically registers and enables the live editor post-processor.

## Documentation Updates Needed

### 1. Main Integration Guide

**Before (v2.0.2 and earlier):**
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
    // ❌ This was required before
    postProcess: ['contentstorage'],
  });
```

**After (v2.0.3+):**
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
    // ✅ No postProcess config needed!
  });
```

### 2. When postProcess IS Still Required

The `postProcess: ['contentstorage']` config is **only required** when using the standalone post-processor WITHOUT the backend:

```typescript
import i18next from 'i18next';
import { ContentstorageLiveEditorPostProcessor } from '@contentstorage/i18next-plugin';

i18next
  .use(new ContentstorageLiveEditorPostProcessor())
  .init({
    resources: {
      en: {
        translation: { welcome: 'Welcome' }
      }
    },
    lng: 'en',
    fallbackLng: 'en',
    // ⚠️ Still required for standalone post-processor
    postProcess: ['contentstorage'],
  });
```

---

## Quick Reference Table

| Setup | postProcess Config Required? |
|-------|------------------------------|
| Using `ContentstorageBackend` | ❌ No - Auto-enabled |
| Using standalone `ContentstorageLiveEditorPostProcessor` | ✅ Yes - Must add `postProcess: ['contentstorage']` |
| Using `i18next-http-backend` + `ContentstorageLiveEditorPostProcessor` | ✅ Yes - Must add `postProcess: ['contentstorage']` |

---

## Migration Guide for Existing Users

### If You're Using ContentstorageBackend

**Good news!** You can remove the `postProcess` config from your code:

```diff
  i18next
    .use(ContentstorageBackend)
    .init({
      backend: {
        contentKey: 'your-key',
      },
      lng: 'en',
      fallbackLng: 'en',
-     postProcess: ['contentstorage'],
    });
```

The live editor tracking will continue to work automatically.

### If You're Using Standalone Post-Processor

**No changes needed.** Keep your existing config:

```typescript
i18next
  .use(new ContentstorageLiveEditorPostProcessor())
  .init({
    resources: { ... },
    postProcess: ['contentstorage'], // Keep this
  });
```

---

## Framework-Specific Examples

### React

**Before:**
```typescript
// src/i18n.ts
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
    postProcess: ['contentstorage'], // ❌ Can be removed
  });
```

**After:**
```typescript
// src/i18n.ts
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
    // ✅ No postProcess needed!
  });
```

### Next.js App Router

**Before:**
```typescript
// app/i18n.ts
import i18next from 'i18next';
import ContentstorageBackend from '@contentstorage/i18next-plugin';

i18next.use(ContentstorageBackend).init({
  backend: {
    contentKey: process.env.NEXT_PUBLIC_CONTENTSTORAGE_KEY,
  },
  lng: 'en',
  fallbackLng: 'en',
  postProcess: ['contentstorage'], // ❌ Can be removed
});
```

**After:**
```typescript
// app/i18n.ts
import i18next from 'i18next';
import ContentstorageBackend from '@contentstorage/i18next-plugin';

i18next.use(ContentstorageBackend).init({
  backend: {
    contentKey: process.env.NEXT_PUBLIC_CONTENTSTORAGE_KEY,
  },
  lng: 'en',
  fallbackLng: 'en',
  // ✅ No postProcess needed!
});
```

### Vue.js

**Before:**
```typescript
import i18next from 'i18next';
import I18NextVue from 'i18next-vue';
import ContentstorageBackend from '@contentstorage/i18next-plugin';

i18next.use(ContentstorageBackend).init({
  backend: {
    contentKey: import.meta.env.VITE_CONTENTSTORAGE_KEY,
  },
  lng: 'en',
  fallbackLng: 'en',
  postProcess: ['contentstorage'], // ❌ Can be removed
});
```

**After:**
```typescript
import i18next from 'i18next';
import I18NextVue from 'i18next-vue';
import ContentstorageBackend from '@contentstorage/i18next-plugin';

i18next.use(ContentstorageBackend).init({
  backend: {
    contentKey: import.meta.env.VITE_CONTENTSTORAGE_KEY,
  },
  lng: 'en',
  fallbackLng: 'en',
  // ✅ No postProcess needed!
});
```

---

## Benefits of This Change

### 1. **Simpler Configuration**
Less boilerplate code → easier integration

### 2. **Fewer Errors**
Users can't forget to add `postProcess` config when using the backend

### 3. **Better Developer Experience**
Works out of the box with minimal configuration

### 4. **Clearer Mental Model**
"Use the backend = get live editor support automatically"

---

## Technical Details (For Advanced Users)

### How Auto-Registration Works

When `ContentstorageBackend` is initialized and detects live editor mode:

1. Creates an instance of `ContentstorageLiveEditorPostProcessor`
2. Registers it with i18next's `languageUtils.addPostProcessor()`
3. Automatically adds `'contentstorage'` to the `postProcess` array in init options
4. All translation calls now automatically track to the memory map

### Debug Mode

To see auto-registration in action:

```typescript
i18next.use(ContentstorageBackend).init({
  backend: {
    contentKey: 'your-key',
    debug: true, // Enable debug logging
  },
});
```

Console output:
```
[ContentStorage] Live editor mode enabled
[ContentStorage] Post-processor auto-registered
[ContentStorage] Plugin initialized with options: { ... }
```

---

## Troubleshooting

### Problem: Live editor not working after upgrade

**Solution:** Make sure you're using the latest version (v2.0.3+):

```bash
npm install @contentstorage/i18next-plugin@latest
```

### Problem: Duplicate tracking (seeing translations tracked twice)

**Cause:** You have both auto-registration (from backend) AND manual post-processor registration.

**Solution:** Remove the manual post-processor:

```diff
  import i18next from 'i18next';
  import ContentstorageBackend from '@contentstorage/i18next-plugin';
- import { ContentstorageLiveEditorPostProcessor } from '@contentstorage/i18next-plugin';

  i18next
    .use(ContentstorageBackend)
-   .use(new ContentstorageLiveEditorPostProcessor())
    .init({
      backend: { contentKey: 'your-key' },
-     postProcess: ['contentstorage'],
    });
```

### Problem: Using custom HTTP backend, live editor not working

**Cause:** Auto-registration only works with `ContentstorageBackend`.

**Solution:** Manually add the post-processor:

```typescript
import i18next from 'i18next';
import HttpBackend from 'i18next-http-backend';
import { ContentstorageLiveEditorPostProcessor } from '@contentstorage/i18next-plugin';

i18next
  .use(HttpBackend)
  .use(new ContentstorageLiveEditorPostProcessor())
  .init({
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    postProcess: ['contentstorage'], // Required for non-Contentstorage backends
  });
```

---

## Summary

- ✅ **Using ContentstorageBackend?** → Remove `postProcess: ['contentstorage']`
- ✅ **Using standalone post-processor?** → Keep `postProcess: ['contentstorage']`
- ✅ **Using other backends + post-processor?** → Keep `postProcess: ['contentstorage']`

The goal: Make the 90% case (using ContentstorageBackend) as simple as possible, while still supporting advanced use cases.
