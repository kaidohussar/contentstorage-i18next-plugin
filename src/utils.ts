import type { ContentStorageWindow, MemoryMap, MemoryMapEntry } from './types';

/**
 * Checks if the code is running in a browser environment
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

/**
 * Gets the ContentStorage window object with type safety
 */
export function getContentStorageWindow(): ContentStorageWindow | null {
  if (!isBrowser()) return null;
  return window as ContentStorageWindow;
}

/**
 * Detects if the application is running in ContentStorage live editor mode
 *
 * @param liveEditorParam - Query parameter name to check
 * @param forceLiveMode - Force live mode regardless of environment
 * @returns true if in live editor mode
 */
export function detectLiveEditorMode(
  liveEditorParam: string = 'contentstorage_live_editor',
  forceLiveMode: boolean = false
): boolean {
  if (forceLiveMode) return true;
  if (!isBrowser()) return false;

  try {
    const win = getContentStorageWindow();
    if (!win) return false;

    // Check 1: Running in an iframe
    const inIframe = win.self !== win.top;

    // Check 2: URL has the live editor marker
    const urlParams = new URLSearchParams(win.location.search);
    const hasMarker = urlParams.has(liveEditorParam);

    return !!(inIframe && hasMarker);
  } catch (e) {
    // Cross-origin restrictions might block window.top access
    // This is expected when not in live editor mode
    return false;
  }
}

/**
 * Initializes the global memory map if it doesn't exist
 */
export function initializeMemoryMap(): MemoryMap | null {
  const win = getContentStorageWindow();
  if (!win) return null;

  if (!win.memoryMap) {
    win.memoryMap = new Map<string, MemoryMapEntry>();
  }

  return win.memoryMap;
}

/**
 * Load the ContentStorage live editor script
 * This script enables the click-to-edit functionality in the live editor
 */
let liveEditorReadyPromise: Promise<boolean> | null = null;

export function loadLiveEditorScript(
  retries: number = 2,
  delay: number = 3000,
  debug: boolean = false
): Promise<boolean> {
  // Return existing promise if already loading
  if (liveEditorReadyPromise) {
    return liveEditorReadyPromise;
  }

  liveEditorReadyPromise = new Promise<boolean>((resolve) => {
    const win = getContentStorageWindow();
    if (!win) {
      resolve(false);
      return;
    }

    const cdnScriptUrl = 'https://cdn.contentstorage.app/live-editor.js?contentstorage-live-editor=true';

    const loadScript = (attempt: number = 1) => {
      if (debug) {
        console.log(`[ContentStorage] Attempting to load live editor script (attempt ${attempt}/${retries})`);
      }

      const scriptElement = win.document.createElement('script');
      scriptElement.type = 'text/javascript';
      scriptElement.src = cdnScriptUrl;

      scriptElement.onload = () => {
        if (debug) {
          console.log(`[ContentStorage] Live editor script loaded successfully`);
        }
        resolve(true);
      };

      scriptElement.onerror = (error) => {
        // Clean up the failed script element
        scriptElement.remove();

        if (debug) {
          console.error(`[ContentStorage] Failed to load live editor script (attempt ${attempt}/${retries})`, error);
        }

        if (attempt < retries) {
          setTimeout(() => loadScript(attempt + 1), delay);
        } else {
          console.error(`[ContentStorage] All ${retries} attempts to load live editor script failed`);
          resolve(false);
        }
      };

      win.document.head.appendChild(scriptElement);
    };

    loadScript();
  });

  return liveEditorReadyPromise;
}

/**
 * Gets the global memory map
 */
export function getMemoryMap(): MemoryMap | null {
  const win = getContentStorageWindow();
  return win?.memoryMap || null;
}

/**
 * Normalizes i18next key format to consistent dot notation
 * Converts namespace:key format to namespace.key
 * Only adds namespace prefix if explicitly present in the key (colon notation)
 *
 * @param key - The translation key
 * @param namespace - Optional namespace (only used if not already in key)
 * @returns Normalized key in dot notation
 */
export function normalizeKey(key: string, namespace?: string): string {
  // namespace parameter kept for backward compatibility but not used
  void namespace;

  let normalizedKey = key;

  // Convert colon notation to dot notation (e.g., "common:welcome" -> "common.welcome")
  if (normalizedKey.includes(':')) {
    normalizedKey = normalizedKey.replace(':', '.');
  }

  // Don't automatically prepend namespace - only if key already had it via colon notation
  // This ensures keys match ContentStorage content IDs by default

  return normalizedKey;
}

/**
 * Extracts the base translation key without interpolation context
 * Handles plural forms, contexts, and other i18next features
 *
 * Examples:
 * - 'welcome' -> 'welcome'
 * - 'items_plural' -> 'items'
 * - 'friend_male' -> 'friend'
 *
 * @param key - The translation key
 * @returns Base key without suffixes
 */
export function extractBaseKey(key: string): string {
  // Remove plural suffixes (_zero, _one, _two, _few, _many, _other, _plural)
  let baseKey = key.replace(/_(zero|one|two|few|many|other|plural)$/, '');

  // Remove context suffixes (anything after last underscore that's not a nested key)
  // Be careful not to remove underscores that are part of the actual key
  // This is a heuristic - contexts usually come at the end
  const lastUnderscore = baseKey.lastIndexOf('_');
  if (lastUnderscore > 0) {
    // Only remove if it looks like a context (short suffix, typically lowercase)
    const suffix = baseKey.substring(lastUnderscore + 1);
    if (suffix.length < 10 && suffix.toLowerCase() === suffix) {
      // This might be a context, but we'll keep it for now to avoid false positives
      // Real context handling should be done at a higher level
    }
  }

  return baseKey;
}

/**
 * Removes interpolation variables from a translated string
 *
 * Examples:
 * - 'Hello {{name}}!' -> 'Hello !'
 * - 'You have {{count}} items' -> 'You have  items'
 *
 * @param value - The translated string
 * @returns String with interpolations removed
 */
export function removeInterpolation(value: string): string {
  // Remove i18next interpolation syntax: {{variable}}
  return value.replace(/\{\{[^}]+\}\}/g, '').trim();
}

/**
 * Tracks a translation in the memory map
 *
 * @param translationValue - The actual translated text
 * @param translationKey - The content ID (i18next key)
 * @param namespace - Optional namespace
 * @param language - Optional language code
 * @param debug - Enable debug logging
 */
export function trackTranslation(
  translationValue: string,
  translationKey: string,
  namespace?: string,
  language?: string,
  debug: boolean = false
): void {
  const memoryMap = getMemoryMap();
  if (!memoryMap) return;

  // Normalize the key
  const normalizedKey = normalizeKey(translationKey, namespace);

  // Get or create entry
  const existingEntry = memoryMap.get(translationValue);
  const idSet = existingEntry ? existingEntry.ids : new Set<string>();
  idSet.add(normalizedKey);

  const entry: MemoryMapEntry = {
    ids: idSet,
    type: 'text',
    metadata: {
      namespace,
      language,
      trackedAt: Date.now(),
    },
  };

  memoryMap.set(translationValue, entry);

  if (debug) {
    console.log('[ContentStorage] Tracked translation:', {
      value: translationValue,
      key: normalizedKey,
      namespace,
      language,
    });
  }
}

/**
 * Cleans up old entries from memory map when size exceeds limit
 * Removes oldest entries first (based on trackedAt timestamp)
 *
 * @param maxSize - Maximum number of entries to keep
 */
export function cleanupMemoryMap(maxSize: number): void {
  const memoryMap = getMemoryMap();
  if (!memoryMap || memoryMap.size <= maxSize) return;

  // Convert to array with timestamps
  const entries = Array.from(memoryMap.entries()).map(([key, value]) => ({
    key,
    value,
    timestamp: value.metadata?.trackedAt || 0,
  }));

  // Sort by timestamp (oldest first)
  entries.sort((a, b) => a.timestamp - b.timestamp);

  // Calculate how many to remove
  const toRemove = memoryMap.size - maxSize;

  // Remove oldest entries
  for (let i = 0; i < toRemove; i++) {
    memoryMap.delete(entries[i].key);
  }
}

/**
 * Deeply traverses a translation object and extracts all string values with their keys
 *
 * @param obj - Translation object to traverse
 * @param prefix - Current key prefix (for nested objects)
 * @returns Array of [key, value] pairs
 */
export function flattenTranslations(
  obj: any,
  prefix: string = ''
): Array<[string, string]> {
  const results: Array<[string, string]> = [];

  for (const key in obj) {
    if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;

    const value = obj[key];
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (typeof value === 'string') {
      results.push([fullKey, value]);
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // Recurse into nested objects
      results.push(...flattenTranslations(value, fullKey));
    }
  }

  return results;
}

/**
 * Debug helper to log memory map contents
 */
export function debugMemoryMap(): void {
  const memoryMap = getMemoryMap();
  if (!memoryMap) {
    console.log('[ContentStorage] Memory map not initialized');
    return;
  }

  console.log('[ContentStorage] Memory map contents:');
  console.log(`Total entries: ${memoryMap.size}`);

  const entries = Array.from(memoryMap.entries()).slice(0, 10);
  console.table(
    entries.map(([value, entry]) => ({
      value: value.substring(0, 50),
      keys: Array.from(entry.ids).join(', '),
      namespace: entry.metadata?.namespace || 'N/A',
    }))
  );

  if (memoryMap.size > 10) {
    console.log(`... and ${memoryMap.size - 10} more entries`);
  }
}
