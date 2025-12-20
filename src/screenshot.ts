import { isBrowser, getContentstorageWindow } from './utils';

/**
 * Decodes and validates the contentstorage key
 * Just decodes URL encoding and checks non-empty (backend validates format)
 *
 * @param key - The raw key from URL params
 * @returns Decoded key if valid, null if empty/invalid
 */
export function decodeContentstorageKey(key: string | null): string | null {
  if (!key) return null;

  try {
    const decoded = decodeURIComponent(key);
    return decoded.trim() || null;
  } catch {
    return null;
  }
}

/**
 * Detects if screenshot mode should be activated
 * Requires: contentstorage_live_editor=true AND screenshot_mode=true AND valid contentstorage_key
 *
 * NOTE: Unlike live editor mode, screenshot mode does NOT require iframe
 *
 * @returns Object with contentstorageKey if active, null otherwise
 */
export function detectScreenshotMode(): { contentstorageKey: string } | null {
  if (!isBrowser()) return null;

  const win = getContentstorageWindow();
  if (!win) return null;

  try {
    const urlParams = new URLSearchParams(win.location.search);

    // Check required params
    const liveEditorParam = urlParams.get('contentstorage_live_editor');
    const screenshotModeParam = urlParams.get('screenshot_mode');
    const contentstorageKey = urlParams.get('contentstorage_key');

    // All three must be present and valid
    if (liveEditorParam !== 'true') return null;
    if (screenshotModeParam !== 'true') return null;

    const decodedKey = decodeContentstorageKey(contentstorageKey);
    if (!decodedKey) return null;

    return {
      contentstorageKey: decodedKey,
    };
  } catch {
    return null;
  }
}

/**
 * Removes screenshot-related params from URL without page reload
 * Uses History API to update URL bar
 */
export function cleanScreenshotUrlParams(): void {
  if (!isBrowser()) return;

  const win = getContentstorageWindow();
  if (!win) return;

  try {
    const url = new URL(win.location.href);
    const paramsToRemove = [
      'contentstorage_live_editor',
      'screenshot_mode',
      'contentstorage_key',
    ];

    paramsToRemove.forEach((param) => {
      url.searchParams.delete(param);
    });

    // Use replaceState to update URL without reload
    win.history.replaceState({}, '', url.toString());
  } catch (e) {
    console.warn('[ContentStorage] Failed to clean URL params:', e);
  }
}

/**
 * Exposes the API key on window for live-editor.js to use
 * Uses a non-enumerable property for security
 *
 * @param key - The validated contentstorage API key
 */
export function exposeApiKey(key: string): void {
  const win = getContentstorageWindow();
  if (!win) return;

  // Store as non-enumerable property for security
  Object.defineProperty(win, '__contentstorageApiKey', {
    value: key,
    writable: false,
    enumerable: false,
    configurable: true, // Allow cleanup later
  });
}

/**
 * Gets the exposed API key (if any)
 */
export function getApiKey(): string | null {
  const win = getContentstorageWindow();
  return win?.__contentstorageApiKey || null;
}
